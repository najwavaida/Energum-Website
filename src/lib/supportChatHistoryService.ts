import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SupportMessage = {
  id: string;
  sender: "user" | "admin";
  text: string;
  createdAt: Date | null;
};

export async function getSupportMessages(
  roomId: string
): Promise<SupportMessage[]> {
  const ref = collection(db, "supportRooms", roomId, "messages");
  const q = query(ref, orderBy("createdAt", "asc"));

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    const ts = data.createdAt as Timestamp | undefined;

    return {
      id: d.id,
      sender: data.sender,
      text: data.text,
      createdAt: ts?.toDate?.() ?? null,
    };
  });
}
