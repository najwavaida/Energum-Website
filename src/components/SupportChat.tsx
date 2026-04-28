import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import {
  getOrCreateSupportRoom,
  listenSupportMessages,
  sendSupportMessage,
} from "@/lib/supportChatService";

type SupportMessage = {
  id: string;
  sender: "user" | "admin";
  text: string;
};

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // auto scroll ke bawah
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // focus input saat chat dibuka
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // create room + listen messages realtime
  useEffect(() => {
    if (!isOpen) return;
    if (!user) return;

    let unsub: (() => void) | null = null;

    (async () => {
      await getOrCreateSupportRoom(user.uid, user.email ?? "");
      unsub = listenSupportMessages(user.uid, (msgs) => {
        // mapping supaya konsisten type
        setMessages(
          msgs.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
          }))
        );
      });
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [isOpen, user]);

  const notifyAdminEmail = useCallback(
    async (text: string) => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        await fetch("/api/support/notify-admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            roomId: user.uid,
            text,
            userEmail: user.email ?? "",
          }),
        });
      } catch (e) {
        // notif email gagal tidak perlu bikin chat gagal
        console.warn("notify admin failed:", e);
      }
    },
    [user]
  );

  const send = useCallback(async () => {
    if (!user) {
      toast({
        title: "Login dulu ya",
        description: "Silakan login untuk chat dengan admin.",
        variant: "destructive",
      });
      return;
    }

    const text = input.trim();
    if (!text || isSending) return;
    if (sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);
    setInput("");

    try {
      // simpan ke firestore (ini otomatis jadi history)
      await sendSupportMessage(user.uid, "user", text);

      // kirim notif email admin
      await notifyAdminEmail(text);
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal mengirim pesan",
        description: "Coba lagi ya.",
        variant: "destructive",
      });
      // balikin input biar gak hilang
      setInput(text);
    } finally {
      setIsSending(false);
      sendingRef.current = false;
    }
  }, [user, input, isSending, toast, notifyAdminEmail]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-2xl flex items-center justify-center group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            boxShadow:
              "0 0 30px rgba(251, 146, 60, 0.5), 0 10px 40px rgba(0,0,0,0.3)",
          }}
        >
          <MessageCircle className="w-7 h-7 text-white" />
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </motion.div>

          <motion.div
            className="absolute inset-0 rounded-full bg-amber-400"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.button>
      )}

      {/* Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[9999] w-[380px] h-[550px] bg-background rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white">
                    Admin Support
                  </h3>
                  <p className="text-white/80 text-xs">
                    {user ? "Kami siap bantu kamu" : "Login dulu untuk chat"}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {!user && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-heading font-semibold text-foreground mb-2">
                    Kamu belum login
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Silakan login dulu untuk chat dengan admin.
                  </p>
                </div>
              )}

              {user && messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-heading font-semibold text-foreground mb-2">
                    Halo! 👋
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Tulis kendala kamu ya. Admin akan bantu secepatnya.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {[
                      "Saya mau tanya produk",
                      "Saya punya kendala order",
                      "Saya mau tanya rekomendasi",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${
                      m.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.sender === "admin" && (
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        m.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}
                    >
                      {m.text}
                    </div>

                    {m.sender === "user" && (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isSending && user && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 justify-end"
                  >
                    <div className="bg-primary/10 px-4 py-3 rounded-2xl rounded-br-md">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-primary/50 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-primary/50 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-primary/50 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={endRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    user ? "Ketik pesan..." : "Login dulu untuk chat..."
                  }
                  className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={!user || isSending}
                />
                <Button
                  onClick={send}
                  disabled={!user || !input.trim() || isSending}
                  size="icon"
                  className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
