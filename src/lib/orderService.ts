import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

// ✅ sesuaikan path kalau file kamu beda
import { updatePurchaseHistory } from "./userStatsService";

/** =========
 * Types
 * ========= */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "received"
  | "cancelled";

// status yang dianggap "purchase valid" untuk ML features
const PURCHASE_VALID_STATUSES: OrderStatus[] = [
  "processing",
  "shipped",
  "delivered",
  "received",
];

export interface OrderItem {
  productId: string; // "cashew" | "peanut" (bisa juga lainnya, tapi yg kita hitung 2 ini)
  productName: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
}

export interface Order {
  id?: string; // Firestore docId
  orderId: string; // EG-YYYYMMDD-XXXX
  userId: string;
  userEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: "cod";
  createdAt: Date;
  updatedAt: Date;
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    message?: string;
  }[];
  cancelledAt?: Date;
  cancelReason?: string;
}

export type PurchaseFeatures = {
  purchase_cashew_90d: number;
  purchase_peanut_90d: number;
  days_since_last_purchase: number; // 0..999
  last_purchase_at: Date | null;
};

/** =========
 * Helpers
 * ========= */
export function generateOrderId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EG-${dateStr}-${random}`;
}

/**
 * Panggil backend untuk email admin.
 * Backend endpoint: POST http://localhost:3001/api/orders/notify-admin
 * Body: { orderId, event: "created" | "cancelled" | "status" }
 */
async function notifyAdminByOrderId(
  event: "created" | "cancelled" | "status",
  orderId: string
) {
  try {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

    const res = await fetch(`${backendUrl}/api/orders/notify-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, event }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn("notifyAdminByOrderId failed:", res.status, data);
    }
  } catch (e) {
    console.warn("notifyAdminByOrderId error:", e);
  }
}

function toOrderFromDoc(docSnap: any): Order {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    orderId: data.orderId,
    userId: data.userId,
    userEmail: data.userEmail,
    items: data.items || [],
    shippingAddress: data.shippingAddress,
    totalAmount: data.totalAmount,
    status: data.status,
    paymentMethod: data.paymentMethod,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    statusHistory: (data.statusHistory || []).map((h: any) => ({
      status: h.status,
      timestamp: h.timestamp?.toDate?.() ?? new Date(),
      message: h.message,
    })),
    cancelledAt: data.cancelledAt?.toDate?.(),
    cancelReason: data.cancelReason,
  };
}

/**
 * Cari doc order berdasarkan orderId + userId
 * (lebih aman untuk rules)
 */
async function findOrderDocByOrderId(orderId: string, userId: string) {
  const q = query(
    collection(db, "orders"),
    where("orderId", "==", orderId),
    where("userId", "==", userId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0];
}

/** =========
 * Create new order
 * =========
 * return { orderId, docId } biar enak
 */
export async function createOrder(
  orderData: Omit<
    Order,
    | "id"
    | "orderId"
    | "createdAt"
    | "updatedAt"
    | "statusHistory"
    | "status"
    | "cancelledAt"
    | "cancelReason"
  >
): Promise<{ orderId: string; docId: string } | null> {
  if (!isFirebaseConfigured || !db) {
    console.warn("Firebase not configured, cannot create order");
    return null;
  }

  try {
    const orderId = generateOrderId();
    const now = new Date();

    const payload = {
      ...orderData,
      orderId,
      status: "pending" as OrderStatus,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      statusHistory: [
        {
          status: "pending",
          timestamp: Timestamp.fromDate(now),
          message: "Pesanan dibuat, menunggu konfirmasi",
        },
      ],
    };

    const docRef = await addDoc(collection(db, "orders"), payload);

    await notifyAdminByOrderId("created", orderId);

    return { orderId, docId: docRef.id };
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}

/** =========
 * Get orders by user
 * ========= */
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  if (!isFirebaseConfigured || !db) {
    console.warn("Firebase not configured, cannot fetch orders");
    return [];
  }

  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => toOrderFromDoc(d));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/** =========
 * Get purchase features by user (for ML payload)
 * ========= */
export async function getPurchaseFeaturesByUser(
  userId: string,
  windowDays: number = 90
): Promise<PurchaseFeatures> {
  if (!isFirebaseConfigured || !db) {
    return {
      purchase_cashew_90d: 0,
      purchase_peanut_90d: 0,
      days_since_last_purchase: 999,
      last_purchase_at: null,
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  // NOTE: untuk skala kecil PoC ini cukup. Kalau data gede, kita optimasi query createdAt.
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  let cashewQty = 0;
  let peanutQty = 0;
  let lastPurchaseAt: Date | null = null;

  snap.docs.forEach((d) => {
    const o = toOrderFromDoc(d);

    // status valid purchase
    if (!PURCHASE_VALID_STATUSES.includes(o.status)) return;

    // hanya window N hari
    if (!o.createdAt || o.createdAt < since) return;

    // orderBy desc → pertama ketemu = last purchase
    if (!lastPurchaseAt) lastPurchaseAt = o.createdAt;

    for (const it of o.items || []) {
      const pid = (it.productId || "").toLowerCase();
      const qty = Number(it.quantity || 0);
      if (pid === "cashew") cashewQty += qty;
      if (pid === "peanut") peanutQty += qty;
    }
  });

  let daysSince = 999;
  if (lastPurchaseAt) {
    const diffMs = Date.now() - lastPurchaseAt.getTime();
    daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  return {
    purchase_cashew_90d: cashewQty,
    purchase_peanut_90d: peanutQty,
    days_since_last_purchase: Math.min(daysSince, 999),
    last_purchase_at: lastPurchaseAt,
  };
}

/** =========
 * Get order by orderId (scoped to user)
 * ========= */
export async function getOrderByOrderId(
  orderId: string,
  userId: string
): Promise<Order | null> {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const docSnap = await findOrderDocByOrderId(orderId, userId);
    if (!docSnap) return null;
    return toOrderFromDoc(docSnap);
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

/** =========
 * Update order status (scoped to userId)
 * NOTE: kalau ini dipakai admin, admin flow sebaiknya beda.
 * ========= */
export async function updateOrderStatus(
  orderId: string,
  userId: string,
  newStatus: OrderStatus,
  message?: string
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;

  try {
    const docSnap = await findOrderDocByOrderId(orderId, userId);
    if (!docSnap) return false;

    const docRef = doc(db, "orders", docSnap.id);
    const currentData = docSnap.data();
    const now = new Date();

    const nextHistory = [
      ...(currentData.statusHistory || []),
      {
        status: newStatus,
        timestamp: Timestamp.fromDate(now),
        message: message || getStatusMessage(newStatus),
      },
    ];

    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: Timestamp.fromDate(now),
      statusHistory: nextHistory,
    });

    await notifyAdminByOrderId("status", orderId);

    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    return false;
  }
}

/** =========
 * Cancel order (user)
 * Rule: user boleh cancel hanya pending/confirmed
 * ========= */
export async function cancelOrder(
  orderId: string,
  userId: string,
  reason: string = "Dibatalkan oleh pengguna"
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;

  try {
    const docSnap = await findOrderDocByOrderId(orderId, userId);
    if (!docSnap) return false;

    const current = docSnap.data();
    const currentStatus: OrderStatus = current.status;

    if (!["pending", "confirmed"].includes(currentStatus)) {
      console.warn("Cannot cancel order in status:", currentStatus);
      return false;
    }

    const now = new Date();
    const docRef = doc(db, "orders", docSnap.id);

    const nextHistory = [
      ...(current.statusHistory || []),
      {
        status: "cancelled",
        timestamp: Timestamp.fromDate(now),
        message: reason,
      },
    ];

    await updateDoc(docRef, {
      status: "cancelled",
      cancelReason: reason,
      cancelledAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      statusHistory: nextHistory,
    });

    await notifyAdminByOrderId("cancelled", orderId);

    return true;
  } catch (error) {
    console.error("Error cancelling order:", error);
    return false;
  }
}

/** =========
 * Buyer confirm received
 * - update order status to "received"
 * - ✅ update user stats purchase based on items
 * ========= */
export async function confirmPackageReceived(
  orderId: string,
  userId: string
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;

  try {
    const docSnap = await findOrderDocByOrderId(orderId, userId);
    if (!docSnap) return false;

    const order = toOrderFromDoc(docSnap);

    // update status first
    const ok = await updateOrderStatus(
      orderId,
      userId,
      "received",
      "Paket telah diterima pembeli"
    );
    if (!ok) return false;

    // ✅ update stats purchase (cashew/peanut)
    for (const it of order.items || []) {
      const pid = (it.productId || "").toLowerCase();
      const qty = Number(it.quantity || 0);

      if (pid === "cashew" || pid === "peanut") {
        await updatePurchaseHistory(userId, pid as "cashew" | "peanut", qty);
      }
    }

    return true;
  } catch (error) {
    console.error("confirmPackageReceived error:", error);
    return false;
  }
}

/** =========
 * Status message / color
 * ========= */
export function getStatusMessage(status: OrderStatus): string {
  const messages: Record<OrderStatus, string> = {
    pending: "Menunggu konfirmasi",
    confirmed: "Pesanan dikonfirmasi",
    processing: "Pesanan sedang diproses",
    shipped: "Paket sedang dikirim",
    delivered: "Paket telah sampai",
    received: "Paket diterima pembeli",
    cancelled: "Pesanan dibatalkan",
  };
  return messages[status];
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    received: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status];
}

/** =========
 * Subscribe to order updates (scoped to userId)
 * ========= */
export function subscribeToOrder(
  orderId: string,
  userId: string,
  callback: (order: Order | null) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    callback(null);
    return () => {};
  }

  const q = query(
    collection(db, "orders"),
    where("orderId", "==", orderId),
    where("userId", "==", userId),
    limit(1)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }
    callback(toOrderFromDoc(snapshot.docs[0]));
  });

  return unsubscribe;
}
