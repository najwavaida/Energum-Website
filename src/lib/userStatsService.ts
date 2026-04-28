import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export interface UserStats {
  userId: string;

  // Engagement
  loginCount: number;
  lastLogin: Date;

  /**
   * Opsional tapi recommended:
   * lastActiveAt dipakai untuk "terakhir aktif" yang lebih akurat
   * (bisa diupdate saat user buka halaman penting / click / view produk)
   */
  lastActiveAt?: Date;

  productInterests: {
    cashew: number;
    peanut: number;
  };

  /**
   * ⚠️ DEPRECATED untuk rekomendasi behavior "purchase real".
   * Jangan dipakai sebagai sumber pembelian valid.
   * Sumber purchase real harus dari collection orders (via getPurchaseFeaturesByUser).
   */
  purchaseHistory: {
    cashew: number;
    peanut: number;
  };

  totalRecommendations: number;

  createdAt: Date;
  updatedAt: Date;
}

function guardFirebaseReady(): boolean {
  if (!isFirebaseConfigured || !db) {
    console.warn("Firebase not configured, cannot access userStats");
    return false;
  }
  return true;
}

function ensureDate(v: any): Date {
  if (v && typeof v.toDate === "function") return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  if (!guardFirebaseReady()) return null;

  try {
    const docRef = doc(db, "userStats", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data: any = docSnap.data();
    return {
      userId: data.userId || userId,
      loginCount: data.loginCount || 0,
      lastLogin: ensureDate(data.lastLogin),
      lastActiveAt: data.lastActiveAt
        ? ensureDate(data.lastActiveAt)
        : undefined,
      productInterests: data.productInterests || { cashew: 0, peanut: 0 },
      purchaseHistory: data.purchaseHistory || { cashew: 0, peanut: 0 },
      totalRecommendations: data.totalRecommendations || 0,
      createdAt: data.createdAt ? ensureDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? ensureDate(data.updatedAt) : new Date(),
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return null;
  }
}

/**
 * Dipanggil saat login / session start.
 * - createdAt tidak pernah ketimpa
 * - updateDoc dulu, kalau doc belum ada baru setDoc
 */
export async function initializeUserStats(userId: string): Promise<void> {
  if (!guardFirebaseReady()) return;

  const docRef = doc(db, "userStats", userId);

  try {
    await updateDoc(docRef, {
      loginCount: increment(1),
      lastLogin: Timestamp.now(),
      lastActiveAt: Timestamp.now(), // opsional, tapi bagus
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    // doc belum ada → create pertama kali
    try {
      await setDoc(docRef, {
        userId,
        loginCount: 1,
        lastLogin: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        productInterests: { cashew: 0, peanut: 0 },
        purchaseHistory: { cashew: 0, peanut: 0 }, // deprecated untuk purchase real
        totalRecommendations: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (e) {
      console.error("Error initializing user stats:", e);
    }
  }
}

/**
 * Opsional: update lastActiveAt saat user aktif (buka halaman, scroll, click, dll).
 */
export async function touchUserActive(userId: string): Promise<void> {
  if (!guardFirebaseReady()) return;

  const docRef = doc(db, "userStats", userId);
  try {
    await updateDoc(docRef, {
      lastActiveAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch {
    // kalau doc belum ada, biarin aja — initializeUserStats biasanya sudah bikin
  }
}

export async function updateProductInterest(
  userId: string,
  product: "cashew" | "peanut"
): Promise<void> {
  if (!guardFirebaseReady()) return;

  const docRef = doc(db, "userStats", userId);

  try {
    await updateDoc(docRef, {
      [`productInterests.${product}`]: increment(1),
      lastActiveAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    // doc belum ada → create
    try {
      await setDoc(
        docRef,
        {
          userId,
          loginCount: 0,
          lastLogin: Timestamp.now(),
          lastActiveAt: Timestamp.now(),
          productInterests: { cashew: 0, peanut: 0 },
          purchaseHistory: { cashew: 0, peanut: 0 },
          totalRecommendations: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          [`productInterests.${product}`]: increment(1),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Error updating product interest:", e);
    }
  }
}

/**
 * ⚠️ DEPRECATED untuk klaim “purchase real”.
 * Jangan panggil ini dari flow order kecuali kamu sudah pastikan status final (received/delivered).
 * Purchase real untuk rekomendasi harus dari orders via getPurchaseFeaturesByUser().
 */
export async function updatePurchaseHistory(
  userId: string,
  product: "cashew" | "peanut",
  quantity: number = 1
): Promise<void> {
  if (!guardFirebaseReady()) return;

  const docRef = doc(db, "userStats", userId);

  try {
    await updateDoc(docRef, {
      [`purchaseHistory.${product}`]: increment(quantity),
      lastActiveAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    try {
      await setDoc(
        docRef,
        {
          userId,
          loginCount: 0,
          lastLogin: Timestamp.now(),
          lastActiveAt: Timestamp.now(),
          productInterests: { cashew: 0, peanut: 0 },
          purchaseHistory: { cashew: 0, peanut: 0 },
          totalRecommendations: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          [`purchaseHistory.${product}`]: increment(quantity),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Error updating purchase history:", e);
    }
  }
}

export async function incrementRecommendationCount(
  userId: string
): Promise<void> {
  if (!guardFirebaseReady()) return;

  const docRef = doc(db, "userStats", userId);

  try {
    await updateDoc(docRef, {
      totalRecommendations: increment(1),
      lastActiveAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    try {
      await setDoc(
        docRef,
        {
          userId,
          loginCount: 0,
          lastLogin: Timestamp.now(),
          lastActiveAt: Timestamp.now(),
          productInterests: { cashew: 0, peanut: 0 },
          purchaseHistory: { cashew: 0, peanut: 0 },
          totalRecommendations: increment(1),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Error incrementing recommendation count:", e);
    }
  }
}
