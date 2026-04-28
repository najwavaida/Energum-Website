import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import {
  getHistoryByUser,
  updateHistoryNotes,
  deleteHistory,
  type HistoryItem,
} from "@/lib/historyService";

import {
  getSupportMessages,
  type SupportMessage,
} from "@/lib/supportChatHistoryService.ts";

import {
  History as HistoryIcon,
  LogIn,
  Sparkles,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  User,
  Activity,
  Target,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

import cashewImg from "@/assets/cashew.png";
import peanutImg from "@/assets/peanut.png";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);

  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<"activity" | "support">(
    "activity"
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    fetchAllHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchAllHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [historyData, supportData] = await Promise.all([
        getHistoryByUser(user.uid),
        getSupportMessages(user.uid),
      ]);
      setHistory(historyData);
      setSupportMessages(supportData);
    } catch (err) {
      console.error("FETCH HISTORY ERROR:", err);
      toast({ title: "Gagal memuat history", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (historyId: string) => {
    setSavingNote(true);
    const success = await updateHistoryNotes(historyId, noteText);
    if (success) {
      setHistory((prev) =>
        prev.map((h) => (h.id === historyId ? { ...h, notes: noteText } : h))
      );
      toast({ title: "Catatan disimpan" });
    } else {
      toast({ title: "Gagal menyimpan catatan", variant: "destructive" });
    }
    setEditingNoteId(null);
    setSavingNote(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteHistory(deleteId);
    if (success) {
      setHistory((prev) => prev.filter((h) => h.id !== deleteId));
      toast({ title: "History dihapus" });
    } else {
      toast({ title: "Gagal menghapus history", variant: "destructive" });
    }
    setDeleteId(null);
    setDeleting(false);
  };

  const getProductImage = (product: string) => {
    if (product === "cashew") return cashewImg;
    if (product === "peanut") return peanutImg;
    return null;
  };

  const getActivityLabel = (activity: string) => {
    const labels: Record<string, string> = {
      low: "Rendah",
      moderate: "Sedang",
      high: "Tinggi",
    };
    return labels[activity] || activity;
  };

  const getGoalLabel = (goal: string) => {
    const labels: Record<string, string> = {
      energy: "Tambah Energi",
      healthy: "Hidup Sehat",
      snack: "Camilan Sehat",
    };
    return labels[goal] || goal;
  };

  // Not logged in state
  if (!authLoading && !user) {
    return (
      <Layout>
        <PageTransition>
          <section className="py-16 gradient-hero min-h-[80vh] flex items-center">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-lg mx-auto text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <HistoryIcon size={40} className="text-primary" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Riwayat Aktivitas
                </h1>
                <p className="text-muted-foreground text-lg mb-8">
                  Untuk melihat riwayat rekomendasi dan pembelian, silakan login
                  terlebih dahulu.
                </p>
                <div className="bg-card rounded-2xl p-8 shadow-soft">
                  <AlertCircle size={48} className="text-accent mx-auto mb-4" />
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                    Belum Login
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Masuk ke akun Anda untuk mengakses riwayat aktivitas
                    lengkap.
                  </p>
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/auth">
                      <LogIn size={20} />
                      Masuk Sekarang
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>
        </PageTransition>
      </Layout>
    );
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <Layout>
        <PageTransition>
          <section className="py-16 gradient-hero min-h-[80vh] flex items-center justify-center">
            <div className="text-center">
              <Loader2
                size={48}
                className="animate-spin text-primary mx-auto mb-4"
              />
              <p className="text-muted-foreground">Memuat riwayat...</p>
            </div>
          </section>
        </PageTransition>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageTransition>
        {/* Hero */}
        <section className="py-16 gradient-hero">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-energum-gold/20 rounded-full text-accent text-sm font-medium mb-6">
                <HistoryIcon size={16} />
                Riwayat Aktivitas
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Riwayat <span className="text-primary">Anda</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Lihat semua aktivitas Anda termasuk hasil rekomendasi,
                pembelian, dan support chat.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as any)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger
                    value="activity"
                    className="flex items-center gap-2"
                  >
                    <HistoryIcon size={16} />
                    Aktivitas
                  </TabsTrigger>
                  <TabsTrigger
                    value="support"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Support Chat ({supportMessages.length})
                  </TabsTrigger>
                </TabsList>

                {/* Activity Tab */}
                <TabsContent value="activity">
                  {history.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-16 bg-card rounded-3xl shadow-soft"
                    >
                      <HistoryIcon
                        size={64}
                        className="mx-auto text-muted-foreground/50 mb-6"
                      />
                      <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                        Belum Ada Riwayat
                      </h2>
                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Riwayat Anda masih kosong. Mulai dengan mencoba fitur
                        rekomendasi kami!
                      </p>
                      <Button variant="hero" size="lg" asChild>
                        <Link to="/recommendation">
                          <Sparkles size={20} />
                          Coba Rekomendasi
                        </Link>
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {/* Stats */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
                      >
                        <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
                          <p className="text-3xl font-bold text-primary mb-1">
                            {
                              history.filter((h) => h.type === "recommendation")
                                .length
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Rekomendasi
                          </p>
                        </div>
                        <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
                          <p className="text-3xl font-bold text-accent mb-1">
                            {
                              history.filter((h) => h.type === "purchase")
                                .length
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pembelian
                          </p>
                        </div>
                        <div className="bg-card rounded-2xl p-6 shadow-soft text-center col-span-2 md:col-span-1">
                          <p className="text-3xl font-bold text-foreground mb-1">
                            {history.length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total Riwayat
                          </p>
                        </div>
                      </motion.div>

                      {/* History List */}
                      <AnimatePresence>
                        {history.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-card rounded-2xl shadow-soft overflow-hidden"
                          >
                            {/* Header */}
                            <div
                              className="p-6 cursor-pointer hover:bg-secondary/50 transition-colors"
                              onClick={() =>
                                setExpandedId(
                                  expandedId === item.id ? null : item.id!
                                )
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                      item.type === "recommendation"
                                        ? "bg-primary/10"
                                        : "bg-accent/10"
                                    }`}
                                  >
                                    {item.type === "recommendation" ? (
                                      <Sparkles
                                        size={24}
                                        className="text-primary"
                                      />
                                    ) : (
                                      <ShoppingBag
                                        size={24}
                                        className="text-accent"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-foreground">
                                      {item.type === "recommendation"
                                        ? "Rekomendasi"
                                        : `Pembelian: ${item.purchase?.productName}`}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar size={14} />
                                      {format(
                                        item.createdAt,
                                        "EEEE, d MMMM yyyy - HH:mm",
                                        {
                                          locale: localeId,
                                        }
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {item.recommendation?.product && (
                                    <div className="hidden md:flex items-center gap-2">
                                      {item.recommendation.product !==
                                        "both" && (
                                        <img
                                          src={
                                            getProductImage(
                                              item.recommendation.product
                                            )!
                                          }
                                          alt={item.recommendation.product}
                                          className="w-10 h-10 object-contain"
                                        />
                                      )}
                                      {item.recommendation.product ===
                                        "both" && (
                                        <>
                                          <img
                                            src={cashewImg}
                                            alt="cashew"
                                            className="w-8 h-8 object-contain"
                                          />
                                          <img
                                            src={peanutImg}
                                            alt="peanut"
                                            className="w-8 h-8 object-contain"
                                          />
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {expandedId === item.id ? (
                                    <ChevronUp
                                      size={20}
                                      className="text-muted-foreground"
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={20}
                                      className="text-muted-foreground"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                              {expandedId === item.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 pb-6 border-t border-border">
                                    {/* Recommendation Details */}
                                    {item.type === "recommendation" &&
                                      item.profile &&
                                      item.recommendation && (
                                        <div className="pt-6 space-y-6">
                                          {/* Profile Summary */}
                                          <div>
                                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                              <User
                                                size={18}
                                                className="text-primary"
                                              />
                                              Profil Saat Kuisioner
                                            </h4>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                              <div className="bg-secondary rounded-xl p-4">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                  Usia
                                                </p>
                                                <p className="font-medium text-foreground">
                                                  {item.profile.age} tahun
                                                </p>
                                              </div>
                                              <div className="bg-secondary rounded-xl p-4">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                  Jenis Kelamin
                                                </p>
                                                <p className="font-medium text-foreground capitalize">
                                                  {item.profile.gender}
                                                </p>
                                              </div>
                                              <div className="bg-secondary rounded-xl p-4">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                  Aktivitas
                                                </p>
                                                <p className="font-medium text-foreground">
                                                  {getActivityLabel(
                                                    item.profile.activity
                                                  )}
                                                </p>
                                              </div>
                                              <div className="bg-secondary rounded-xl p-4">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                  Tujuan
                                                </p>
                                                <p className="font-medium text-foreground">
                                                  {getGoalLabel(
                                                    item.profile.goal
                                                  )}
                                                </p>
                                              </div>
                                            </div>

                                            {item.profile.allergies.length >
                                              0 && (
                                              <div className="mt-4 bg-destructive/10 rounded-xl p-4">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                  Alergi
                                                </p>
                                                <p className="font-medium text-destructive capitalize">
                                                  {item.profile.allergies.join(
                                                    ", "
                                                  )}
                                                </p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Recommendation Result */}
                                          <div>
                                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                              <Sparkles
                                                size={18}
                                                className="text-primary"
                                              />
                                              Hasil Rekomendasi
                                            </h4>

                                            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                                              <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0">
                                                  {item.recommendation
                                                    .product === "both" ? (
                                                    <div className="flex gap-2">
                                                      <img
                                                        src={cashewImg}
                                                        alt="cashew"
                                                        className="w-16 h-16 object-contain"
                                                      />
                                                      <img
                                                        src={peanutImg}
                                                        alt="peanut"
                                                        className="w-16 h-16 object-contain"
                                                      />
                                                    </div>
                                                  ) : (
                                                    <img
                                                      src={
                                                        getProductImage(
                                                          item.recommendation
                                                            .product
                                                        )!
                                                      }
                                                      alt={
                                                        item.recommendation
                                                          .product
                                                      }
                                                      className="w-20 h-20 object-contain"
                                                    />
                                                  )}
                                                </div>

                                                <div className="flex-1">
                                                  <h5 className="font-display text-lg font-bold text-primary mb-2">
                                                    {item.recommendation.title}
                                                  </h5>
                                                  <p className="text-muted-foreground text-sm mb-4">
                                                    {item.recommendation.reason}
                                                  </p>

                                                  <div className="flex items-center gap-2 text-sm">
                                                    <Activity
                                                      size={16}
                                                      className="text-primary"
                                                    />
                                                    <span className="text-foreground font-medium">
                                                      Konsumsi:{" "}
                                                      {
                                                        item.recommendation
                                                          .consumption
                                                      }
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Tips */}
                                              <div className="mt-4 pt-4 border-t border-primary/20">
                                                <p className="text-sm font-medium text-foreground mb-2">
                                                  Tips:
                                                </p>
                                                <ul className="space-y-1">
                                                  {item.recommendation.tips.map(
                                                    (tip, i) => (
                                                      <li
                                                        key={i}
                                                        className="text-sm text-muted-foreground flex items-start gap-2"
                                                      >
                                                        <Target
                                                          size={14}
                                                          className="text-primary mt-0.5 flex-shrink-0"
                                                        />
                                                        {tip}
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {/* Purchase Details */}
                                    {item.type === "purchase" &&
                                      item.purchase && (
                                        <div className="pt-6">
                                          <div className="bg-accent/5 rounded-2xl p-6 border border-accent/20">
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                              <div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                  Produk
                                                </p>
                                                <p className="font-medium text-foreground">
                                                  {item.purchase.productName}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                  Jumlah
                                                </p>
                                                <p className="font-medium text-foreground">
                                                  {item.purchase.quantity}x
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                  Total
                                                </p>
                                                <p className="font-medium text-accent">
                                                  Rp{" "}
                                                  {item.purchase.totalPrice.toLocaleString(
                                                    "id-ID"
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {/* Notes Section */}
                                    <div className="mt-6 pt-6 border-t border-border">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                                          <Edit3
                                            size={16}
                                            className="text-primary"
                                          />
                                          Catatan
                                        </h4>

                                        {editingNoteId !== item.id && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setEditingNoteId(item.id!);
                                              setNoteText(item.notes || "");
                                            }}
                                          >
                                            <Edit3 size={14} />
                                            Edit
                                          </Button>
                                        )}
                                      </div>

                                      {editingNoteId === item.id ? (
                                        <div className="space-y-3">
                                          <textarea
                                            value={noteText}
                                            onChange={(e) =>
                                              setNoteText(e.target.value)
                                            }
                                            placeholder="Tambahkan catatan Anda di sini..."
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                            rows={3}
                                          />
                                          <div className="flex gap-2">
                                            <Button
                                              variant="hero"
                                              size="sm"
                                              onClick={() =>
                                                handleSaveNote(item.id!)
                                              }
                                              disabled={savingNote}
                                            >
                                              {savingNote ? (
                                                <Loader2
                                                  size={14}
                                                  className="animate-spin"
                                                />
                                              ) : (
                                                <Save size={14} />
                                              )}
                                              Simpan
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                setEditingNoteId(null)
                                              }
                                            >
                                              <X size={14} />
                                              Batal
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p
                                          className={`text-sm ${
                                            item.notes
                                              ? "text-foreground"
                                              : "text-muted-foreground italic"
                                          }`}
                                        >
                                          {item.notes || "Belum ada catatan"}
                                        </p>
                                      )}
                                    </div>

                                    {/* Delete Button */}
                                    <div className="mt-6 pt-6 border-t border-border">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => setDeleteId(item.id!)}
                                      >
                                        <Trash2 size={14} />
                                        Hapus Riwayat
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </TabsContent>

                {/* Support Chat Tab */}
                <TabsContent value="support">
                  {supportMessages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-16 bg-card rounded-3xl shadow-soft"
                    >
                      <MessageCircle
                        size={64}
                        className="mx-auto text-muted-foreground/50 mb-6"
                      />
                      <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                        Belum Ada Percakapan Support
                      </h2>
                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Jika Anda butuh bantuan, gunakan tombol Support Chat di
                        kanan bawah.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
                      <div className="p-6 border-b border-border">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <MessageCircle size={18} className="text-primary" />
                          Riwayat Support Chat
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Percakapan Anda dengan admin tersimpan sebagai log.
                        </p>
                      </div>

                      <div className="p-6 space-y-3 max-h-[520px] overflow-y-auto">
                        {supportMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                                msg.sender === "user"
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-secondary text-secondary-foreground rounded-bl-md"
                              }`}
                            >
                              <div style={{ whiteSpace: "pre-wrap" }}>
                                {msg.text}
                              </div>
                              {msg.createdAt && (
                                <div className="text-[10px] opacity-70 mt-1">
                                  {format(msg.createdAt, "d MMM yyyy • HH:mm", {
                                    locale: localeId,
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Riwayat?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Riwayat akan dihapus secara
                permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </Layout>
  );
};

export default History;
