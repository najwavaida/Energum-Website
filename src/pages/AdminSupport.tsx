import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

type Room = {
  id: string;
  userEmail?: string;
  lastMessageText?: string;
  lastSender?: "user" | "admin";
  unreadAdmin?: number;
};

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function AdminSupport() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const isAdmin = !!user?.email && !!ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  async function loginAdmin() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  useEffect(() => {
    if (!isAdmin) return;

    const roomsRef = collection(db, "supportRooms");
    const q = query(roomsRef, orderBy("updatedAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => unsub();
  }, [isAdmin]);

  // Belum login -> tombol login langsung
  if (!user) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Admin Support</h1>
        <p className="text-muted-foreground mb-4">
          Login dulu untuk akses inbox support.
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

  // Sudah login tapi bukan admin -> tampilkan info + logout cepat
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

        <div className="flex gap-2">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-black text-white"
          >
            Logout & ganti akun
          </button>
          <button
            onClick={loginAdmin}
            className="px-4 py-2 rounded-lg border"
            title="Kalau popup Google masih ingat akun lama, logout dulu"
          >
            Login lagi
          </button>
        </div>
      </div>
    );
  }

  // Admin benar -> tampilkan inbox
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin Support Inbox</h1>
        <button onClick={logout} className="text-sm underline">
          Logout
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-muted-foreground">Belum ada chat masuk.</div>
      ) : (
        <div className="space-y-3">
          {rooms.map((r) => (
            <Link
              key={r.id}
              to={`/admin/support/${r.id}`}
              className="block rounded-xl border p-4 hover:bg-muted/30 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {r.userEmail || "(no email)"}{" "}
                    <span className="text-xs text-muted-foreground">
                      • room {r.id}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {r.lastSender ? `${r.lastSender}: ` : ""}
                    {r.lastMessageText || "(no message)"}
                  </div>
                </div>

                {!!r.unreadAdmin && r.unreadAdmin > 0 && (
                  <div className="text-xs font-semibold bg-red-500 text-white px-2 py-1 rounded-full">
                    {r.unreadAdmin} new
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
