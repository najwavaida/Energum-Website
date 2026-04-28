import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  limit,
  type DocumentData,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export type EnerGumProduct = "cashew" | "peanut" | "both" | "none";

export interface HistoryItem {
  id?: string;
  userId: string;
  type: "recommendation" | "purchase";
  createdAt: Date;

  // For recommendation type
  profile?: {
    age: string;
    gender: string;
    activity: string;
    goal: string;
    allergies: string[];
  };
  recommendation?: {
    product: EnerGumProduct;
    title: string;
    reason: string;
    tips: string[];
    consumption: string;
  };

  // For purchase type
  purchase?: {
    productName: string;
    quantity: number;
    totalPrice: number;
  };

  notes?: string;
}

/** =========================
 * Utils
 * ========================= */
function ensureDate(v: any): Date {
  // Firestore Timestamp
  if (v && typeof v.toDate === "function") return v.toDate();
  // JS Date
  if (v instanceof Date) return v;
  // ISO string / number
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function mapDocToHistoryItem(id: string, data: DocumentData): HistoryItem {
  return {
    id,
    userId: data.userId,
    type: data.type,
    createdAt: ensureDate(data.createdAt),
    profile: data.profile,
    recommendation: data.recommendation,
    purchase: data.purchase,
    notes: data.notes,
  };
}

function guardFirebaseReady(): boolean {
  if (!isFirebaseConfigured || !db) {
    console.warn("Firebase not configured, cannot access history service");
    return false;
  }
  return true;
}

function isNonEmptyString(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeProfile(p: any): HistoryItem["profile"] | null {
  if (!p || typeof p !== "object") return null;

  const age = isNonEmptyString(p.age) ? p.age : "";
  const gender = isNonEmptyString(p.gender) ? p.gender : "";
  const activity = isNonEmptyString(p.activity) ? p.activity : "";
  const goal = isNonEmptyString(p.goal) ? p.goal : "";

  const allergies = Array.isArray(p.allergies)
    ? p.allergies.map((x: any) => String(x)).filter(Boolean)
    : [];

  // kalau semuanya kosong, anggap profile tidak valid
  if (!age && !gender && !activity && !goal && allergies.length === 0) {
    return null;
  }

  return { age, gender, activity, goal, allergies };
}

/** =========================
 * CRUD
 * ========================= */
export async function saveHistory(
  historyData: Omit<HistoryItem, "id">
): Promise<string | null> {
  if (!guardFirebaseReady()) return null;

  try {
    const createdAt = ensureDate(historyData.createdAt);

    const docRef = await addDoc(collection(db, "history"), {
      ...historyData,
      createdAt: Timestamp.fromDate(createdAt),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error saving history:", error);
    return null;
  }
}

/**
 * Nama baru (recommended) — biar konsisten.
 */
export async function getUserHistory(
  userId: string,
  maxItems: number = 30
): Promise<HistoryItem[]> {
  if (!guardFirebaseReady()) return [];

  try {
    const q = query(
      collection(db, "history"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxItems)
    );

    const querySnapshot = await getDocs(q);
    const history: HistoryItem[] = [];

    querySnapshot.forEach((snap) => {
      history.push(mapDocToHistoryItem(snap.id, snap.data()));
    });

    return history;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

/**
 * Alias lama — supaya file yang masih import getHistoryByUser gak error.
 */
export const getHistoryByUser = getUserHistory;

export async function updateHistoryNotes(
  historyId: string,
  notes: string
): Promise<boolean> {
  if (!guardFirebaseReady()) return false;

  try {
    await updateDoc(doc(db, "history", historyId), { notes });
    return true;
  } catch (error) {
    console.error("Error updating history notes:", error);
    return false;
  }
}

export async function deleteHistory(historyId: string): Promise<boolean> {
  if (!guardFirebaseReady()) return false;

  try {
    await deleteDoc(doc(db, "history", historyId));
    return true;
  } catch (error) {
    console.error("Error deleting history:", error);
    return false;
  }
}

/** =========================
 * EXTRA: ambil profil kuisioner terakhir (buat behavior/history recommendation)
 * =========================
 * Dipakai untuk mengganti hardcode age=25 dll pada handleHistoryRecommendation.
 *
 * Strategy:
 * - ambil beberapa history terbaru (default 25)
 * - pilih history item yang punya profile valid
 * - kalau ada, return profilnya
 */
export async function getLatestProfileFromHistory(
  userId: string,
  scanMax: number = 25
): Promise<HistoryItem["profile"] | null> {
  if (!guardFirebaseReady()) return null;

  try {
    const q = query(
      collection(db, "history"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(scanMax)
    );

    const snap = await getDocs(q);
    if (snap.empty) return null;

    for (const d of snap.docs) {
      const data = d.data() as any;

      // prioritas: rekomendasi yang berasal dari kuisioner (biasanya punya profile)
      const p = normalizeProfile(data.profile);
      if (p) return p;
    }

    return null;
  } catch (error) {
    console.warn("getLatestProfileFromHistory failed:", error);
    return null;
  }
}
