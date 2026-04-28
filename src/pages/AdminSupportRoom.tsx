import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { sendSupportMessage } from "@/lib/supportChatService";

type Msg = { id: string; sender: "user" | "admin"; text: string };
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function AdminSupportRoom() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const isAdmin = !!user?.email && !!ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  async function loginAdmin() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
  async function logout() {
    await signOut(auth);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isAdmin || !roomId) return;
    const msgsRef = collection(db, "supportRooms", roomId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [isAdmin, roomId]);

  if (!roomId) return <div className="p-6">Room tidak valid.</div>;

  if (!user) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Admin Support</h1>
        <p className="text-muted-foreground mb-4">
          Login dulu untuk buka room.
        </p>
        <button
          onClick={loginAdmin}
          className="px-4 py-2 rounded-lg bg-black text-white"
        >
          Login Admin (Google)
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
        <p className="text-muted-foreground mb-4">
          Kamu login sebagai: <b>{user.email}</b>
          <br />
          Admin yang diizinkan:{" "}
          <b>{ADMIN_EMAIL || "(VITE_ADMIN_EMAIL belum di-set)"}</b>
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-black text-white"
        >
          Logout & ganti akun
        </button>
      </div>
    );
  }

  async function onSend() {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    await sendSupportMessage(roomId, "admin", msg);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/admin/support" className="text-sm underline">
          ← Kembali ke Inbox
        </Link>
        <button onClick={logout} className="text-sm underline">
          Logout
        </button>
      </div>

      <div className="rounded-xl border p-4 h-[60vh] overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
              m.sender === "admin"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted"
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Balas sebagai admin..."
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={onSend}
          className="px-4 py-2 rounded-lg bg-black text-white"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}
