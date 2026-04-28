import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getHistoryByUser, type HistoryItem } from "@/lib/historyService";
import {
  User,
  Mail,
  Calendar,
  Sparkles,
  ShoppingBag,
  History,
  Loader2,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, profile, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user) {
      fetchHistory();
    }
  }, [user, authLoading, navigate]);

  const fetchHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getHistoryByUser(user.uid);
      setHistory(data);
    } catch (err) {
      console.error("FETCH HISTORY ERROR:", err);
      toast({
        title: "Gagal memuat ringkasan history",
        variant: "destructive",
      });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: "Berhasil keluar",
        description: "Sampai jumpa lagi!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal keluar. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const recommendationCount = history.filter(
    (h) => h.type === "recommendation"
  ).length;
  const purchaseCount = history.filter((h) => h.type === "purchase").length;
  const totalPurchaseAmount = history
    .filter((h) => h.type === "purchase" && h.purchase)
    .reduce((sum, h) => sum + (h.purchase?.totalPrice || 0), 0);

  if (authLoading || loading) {
    return (
      <Layout>
        <PageTransition>
          <section className="py-16 gradient-hero min-h-[80vh] flex items-center justify-center">
            <div className="text-center">
              <Loader2
                size={48}
                className="animate-spin text-primary mx-auto mb-4"
              />
              <p className="text-muted-foreground">Memuat profil...</p>
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
              <Avatar className="w-24 h-24 mx-auto border-4 border-primary mb-6">
                <AvatarImage
                  src={profile?.photoURL || ""}
                  alt={profile?.displayName || "User"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(profile?.displayName)}
                </AvatarFallback>
              </Avatar>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                {profile?.displayName || "Pengguna"}
              </h1>
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <Mail size={16} />
                {profile?.email}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="bg-card rounded-2xl p-6 shadow-soft">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {recommendationCount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rekomendasi
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 shadow-soft">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <ShoppingBag size={24} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {purchaseCount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Pembelian
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 shadow-soft">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-energum-gold/10 flex items-center justify-center">
                      <Calendar size={24} className="text-energum-gold" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {user?.metadata.creationTime
                          ? format(
                              new Date(user.metadata.creationTime),
                              "MMM yyyy",
                              { locale: localeId }
                            )
                          : "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">Bergabung</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Account Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl p-6 shadow-soft"
              >
                <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <User size={20} className="text-primary" />
                  Informasi Akun
                </h2>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Nama Lengkap</span>
                    <span className="font-medium text-foreground">
                      {profile?.displayName || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground">
                      {profile?.email || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Total Belanja</span>
                    <span className="font-medium text-accent">
                      Rp {totalPurchaseAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between py-3">
                    <span className="text-muted-foreground">
                      Tanggal Bergabung
                    </span>
                    <span className="font-medium text-foreground">
                      {user?.metadata.creationTime
                        ? format(
                            new Date(user.metadata.creationTime),
                            "d MMMM yyyy",
                            { locale: localeId }
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-auto py-4"
                >
                  <Link to="/history" className="flex items-center gap-3">
                    <History size={20} className="text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Lihat Riwayat</p>
                      <p className="text-sm text-muted-foreground">
                        Riwayat rekomendasi & pembelian
                      </p>
                    </div>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-auto py-4"
                >
                  <Link
                    to="/recommendation"
                    className="flex items-center gap-3"
                  >
                    <Sparkles size={20} className="text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Rekomendasi</p>
                      <p className="text-sm text-muted-foreground">
                        Dapatkan rekomendasi personal
                      </p>
                    </div>
                  </Link>
                </Button>
              </motion.div>

              {/* Logout Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 size={20} className="animate-spin mr-2" />
                  ) : (
                    <LogOut size={20} className="mr-2" />
                  )}
                  Keluar dari Akun
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default Profile;
