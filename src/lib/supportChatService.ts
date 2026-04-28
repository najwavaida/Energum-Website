import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SupportSender = "user" | "admin";

export async function getOrCreateSupportRoom(uid: string, email?: string) {
  const roomRef = doc(db, "supportRooms", uid);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    await setDoc(roomRef, {
      userId: uid,
      userEmail: email ?? "",
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageText: "",
      lastSender: "",
      unreadAdmin: 0,
      unreadUser: 0,
    });
  }

  return roomRef;
}

export function listenSupportMessages(
  roomId: string,
  cb: (msgs: any[]) => void
) {
  const msgsRef = collection(db, "supportRooms", roomId, "messages");
  const q = query(msgsRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendSupportMessage(
  roomId: string,
  sender: SupportSender,
  text: string
) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const msgsRef = collection(db, "supportRooms", roomId, "messages");
  await addDoc(msgsRef, {
    sender,
    text: trimmed,
    createdAt: serverTimestamp(),
    source: "web",
  });

  const roomRef = doc(db, "supportRooms", roomId);
  await updateDoc(roomRef, {
    updatedAt: serverTimestamp(),
    lastMessageText: trimmed,
    lastSender: sender,
    unreadAdmin: sender === "user" ? increment(1) : increment(0),
    unreadUser: sender === "admin" ? increment(1) : increment(0),
  });
}

export async function markSupportRead(roomId: string, who: SupportSender) {
  const roomRef = doc(db, "supportRooms", roomId);
  await updateDoc(roomRef, {
    ...(who === "admin" ? { unreadAdmin: 0 } : { unreadUser: 0 }),
  });
}
