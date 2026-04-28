import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  User,
  Activity,
  Target,
  ArrowRight,
  RefreshCw,
  Check,
  TrendingUp,
  Clock,
  History,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { saveHistory, getLatestProfileFromHistory } from "@/lib/historyService";
import {
  getUserStats,
  incrementRecommendationCount,
  type UserStats,
} from "@/lib/userStatsService";
import { predictRecommendation } from "@/lib/recommendationApi";
import { getPurchaseFeaturesByUser } from "@/lib/orderService";
import cashewImg from "@/assets/cashew.png";
import peanutImg from "@/assets/peanut.png";

interface UserProfile {
  age: string;
  gender: string; // male/female
  activity: string; // low|moderate|high
  goal: string; // energy|healthy|snack
  allergies: string[]; // ["peanut","cashew"]
}

interface UiRecommendation {
  product: "cashew" | "peanut" | "both" | "none";
  title: string;
  reason: string;
  tips: string[];
  consumption: string;
  ml?: {
    confidence?: number;
    probs?: Record<string, number>;
    debug?: any;
    source: "questionnaire" | "history" | "general";
    usedFeatures?: {
      login_30d?: number;
      view_cashew_30d?: number;
      view_peanut_30d?: number;
      click_rec_cashew_30d?: number;
      click_rec_peanut_30d?: number;
      purchase_cashew_90d?: number;
      purchase_peanut_90d?: number;
      days_since_last_purchase?: number;
      days_since_last_active?: number;
    };
  };
}

interface HistoryUiRecommendation extends UiRecommendation {
  basedOn: string[];
}

const activityLevels = [
  {
    value: "low",
    label: "Rendah",
    desc: "Aktivitas ringan, lebih banyak duduk",
  },
  { value: "moderate", label: "Sedang", desc: "Olahraga 2-3x seminggu" },
  { value: "high", label: "Tinggi", desc: "Olahraga rutin, aktivitas berat" },
];

const goals = [
  { value: "energy", label: "Tambah Energi", icon: TrendingUp },
  { value: "healthy", label: "Hidup Sehat", icon: Activity },
  { value: "snack", label: "Camilan Sehat", icon: Clock },
];

interface DefaultRecommendation {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  fullRecommendation: UiRecommendation;
}

const defaultRecommendations: DefaultRecommendation[] = [
  {
    id: "energy-boost",
    title: "Butuh Energi Instan?",
    description: "Cocok untuk Anda yang aktif dan butuh stamina",
    icon: TrendingUp,
    fullRecommendation: {
      product: "peanut",
      title: "EnerGum Peanut - Energi Instan!",
      reason:
        "Untuk Anda yang butuh dorongan energi cepat, EnerGum Peanut cocok karena profil nutrisinya mendukung stamina dan aktivitas padat.",
      tips: [
        "Konsumsi 30 menit sebelum aktivitas untuk hasil terbaik",
        "Cocok untuk olahraga, kerja, atau aktivitas outdoor",
        "Minum air putih yang cukup agar tetap terhidrasi",
      ],
      consumption: "1-2 bar per hari",
      ml: { source: "general" },
    },
  },
  {
    id: "brain-focus",
    title: "Tingkatkan Fokus & Konsentrasi",
    description: "Cocok untuk belajar/bekerja agar fokus lebih stabil",
    icon: Sparkles,
    fullRecommendation: {
      product: "cashew",
      title: "EnerGum Cashew - Fokus Maksimal!",
      reason:
        "EnerGum Cashew cocok untuk membantu fokus dan energi yang lebih stabil sepanjang aktivitas belajar/bekerja.",
      tips: [
        "Konsumsi pagi hari untuk memulai hari dengan fokus",
        "Cocok untuk menemani kerja / belajar",
        "Simpan di tempat sejuk agar tekstur tetap enak",
      ],
      consumption: "1 bar per hari",
      ml: { source: "general" },
    },
  },
  {
    id: "healthy-snack",
    title: "Camilan Sehat Sehari-hari",
    description: "Pengganti camilan tidak sehat dengan nutrisi seimbang",
    icon: Activity,
    fullRecommendation: {
      product: "both",
      title: "Kombinasi Sempurna untuk Kesehatan!",
      reason:
        "Variasikan kedua varian untuk pengalaman konsumsi yang lebih beragam dan tidak cepat bosan.",
      tips: [
        "Ganti camilan tidak sehat dengan EnerGum",
        "Variasikan varian setiap hari",
        "Tetap imbangi dengan pola makan seimbang",
      ],
      consumption: "1 bar per hari (variasikan varian)",
      ml: { source: "general" },
    },
  },
];

function toPrettyActivity(v: string) {
  if (v === "high") return "tinggi";
  if (v === "moderate") return "sedang";
  return "rendah";
}

function toPrettyGoal(v: string) {
  if (v === "energy") return "tambah energi";
  if (v === "healthy") return "hidup sehat";
  return "camilan sehat";
}

function toDateSafe(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  if (typeof input === "string") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (input?.toDate && typeof input.toDate === "function") {
    const d = input.toDate();
    return d instanceof Date ? d : null;
  }
  return null;
}

function calcDaysSince(d: Date | null, max = 999) {
  if (!d) return max;
  const diffMs = Date.now() - d.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return Math.min(days, max);
}

function buildBasedOn(args: {
  stats: UserStats;
  purchase90: { cashew: number; peanut: number; daysSinceLastPurchase: number };
  daysSinceLastActive: number;
}): string[] {
  const { stats, purchase90, daysSinceLastActive } = args;
  const basedOn: string[] = [];

  const login = stats.loginCount || 0;
  const viewCashew = stats.productInterests?.cashew || 0;
  const viewPeanut = stats.productInterests?.peanut || 0;

  if (login >= 1) basedOn.push(`${login}x login (indikasi aktif)`);
  if (viewCashew > 0) basedOn.push(`${viewCashew}x melihat Cashew`);
  if (viewPeanut > 0) basedOn.push(`${viewPeanut}x melihat Peanut`);

  if (purchase90.cashew > 0)
    basedOn.push(`${purchase90.cashew} item Cashew dibeli (90 hari)`);
  if (purchase90.peanut > 0)
    basedOn.push(`${purchase90.peanut} item Peanut dibeli (90 hari)`);

  basedOn.push(`Terakhir aktif: ${daysSinceLastActive} hari lalu`);
  if (purchase90.daysSinceLastPurchase < 999) {
    basedOn.push(
      `Terakhir beli: ${purchase90.daysSinceLastPurchase} hari lalu`
    );
  }

  if (basedOn.length === 0)
    basedOn.push("Belum ada riwayat cukup (fallback minimal)");
  return basedOn;
}

function buildUiRecommendationFromProduct(args: {
  product: "cashew" | "peanut" | "both" | "none";
  profile: UserProfile;
  source: "questionnaire" | "history";
  confidence?: number;
  probs?: Record<string, number>;
  debug?: any;
  usedFeatures?: UiRecommendation["ml"]["usedFeatures"];
}): UiRecommendation {
  const age = Number.parseInt(args.profile.age || "25", 10) || 25;
  const activity = toPrettyActivity(args.profile.activity);
  const goal = toPrettyGoal(args.profile.goal);

  if (args.product === "none") {
    return {
      product: "none",
      title: "Maaf, belum ada varian yang sesuai",
      reason:
        "Berdasarkan alergi yang Anda pilih, saat ini kami belum punya varian yang aman. Kami sedang mengembangkan varian baru.",
      tips: ["Pantau update produk kami", "Jika ragu, konsultasikan ke dokter"],
      consumption: "Tidak direkomendasikan saat ini",
      ml: {
        source: args.source,
        confidence: args.confidence,
        probs: args.probs,
        debug: args.debug,
        usedFeatures: args.usedFeatures,
      },
    };
  }

  if (args.product === "cashew") {
    return {
      product: "cashew",
      title: "EnerGum Cashew - Rekomendasi untuk Anda!",
      reason: `Model merekomendasikan EnerGum Cashew berdasarkan profil & sinyal aktivitas (usia ${age} tahun, aktivitas ${activity}, tujuan ${goal}). Cashew cocok untuk fokus dan energi yang lebih stabil.`,
      tips: [
        "Nikmati sebagai camilan sehat di sela aktivitas",
        args.profile.activity === "high"
          ? "Bisa dikonsumsi 30–60 menit sebelum olahraga"
          : "Cocok untuk menemani kerja / belajar",
        "Simpan di tempat sejuk agar tekstur tetap enak",
      ],
      consumption:
        args.profile.activity === "high"
          ? "1-2 bar per hari"
          : "1 bar per hari",
      ml: {
        source: args.source,
        confidence: args.confidence,
        probs: args.probs,
        debug: args.debug,
        usedFeatures: args.usedFeatures,
      },
    };
  }

  if (args.product === "peanut") {
    return {
      product: "peanut",
      title: "EnerGum Peanut - Rekomendasi untuk Anda!",
      reason: `Model merekomendasikan EnerGum Peanut berdasarkan profil & sinyal aktivitas (usia ${age} tahun, aktivitas ${activity}, tujuan ${goal}). Peanut cocok untuk dorongan energi cepat dan mendukung stamina.`,
      tips: [
        "Konsumsi 30 menit sebelum aktivitas fisik untuk hasil terbaik",
        "Cocok untuk aktivitas outdoor atau hari yang padat",
        "Kombinasikan dengan air putih agar tubuh tetap terhidrasi",
      ],
      consumption:
        args.profile.activity === "high" ? "2 bar per hari" : "1 bar per hari",
      ml: {
        source: args.source,
        confidence: args.confidence,
        probs: args.probs,
        debug: args.debug,
        usedFeatures: args.usedFeatures,
      },
    };
  }

  return {
    product: "both",
    title: "Coba Kedua Varian EnerGum!",
    reason: `Model menilai kedua varian cocok berdasarkan profil & sinyal aktivitas (usia ${age} tahun, aktivitas ${activity}, tujuan ${goal}). Variasi varian membantu nutrisi lebih beragam dan tidak cepat bosan.`,
    tips: [
      "Cashew untuk fokus dan energi stabil",
      "Peanut untuk aktivitas fisik intens",
      "Variasikan hari konsumsi untuk manfaat lebih lengkap",
    ],
    consumption: "1-2 bar per hari (variasikan varian)",
    ml: {
      source: args.source,
      confidence: args.confidence,
      probs: args.probs,
      debug: args.debug,
      usedFeatures: args.usedFeatures,
    },
  };
}

const Recommendation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    age: "",
    gender: "",
    activity: "",
    goal: "",
    allergies: [],
  });

  const [recommendation, setRecommendation] = useState<UiRecommendation | null>(
    null
  );
  const [historyRecommendation, setHistoryRecommendation] =
    useState<HistoryUiRecommendation | null>(null);

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState<
    "questionnaire" | "history" | "general" | null
  >(null);

  useEffect(() => {
    if (user) loadUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;
    const stats = await getUserStats(user.uid);
    setUserStats(stats);
  };

  const resetForm = () => {
    setStep(0);
    setProfile({ age: "", gender: "", activity: "", goal: "", allergies: [] });
    setRecommendation(null);
    setHistoryRecommendation(null);
    setRecommendationType(null);
  };

  // profil default konservatif
  const getEffectiveProfile = (): UserProfile => ({
    age: profile.age || "25",
    gender: profile.gender || "female",
    activity: profile.activity || "moderate",
    goal: profile.goal || "energy",
    allergies: profile.allergies || [],
  });

  const buildHistoryFeatures = async () => {
    if (!user) {
      return {
        history: undefined as any,
        purchase90: { cashew: 0, peanut: 0, daysSinceLastPurchase: 999 },
        daysSinceLastActive: 999,
      };
    }

    const stats = userStats;
    const statsAny: any = stats || {};

    const lastActive =
      toDateSafe(statsAny.lastActiveAt) ||
      toDateSafe(statsAny.lastLogin) ||
      null;
    const daysSinceLastActive = calcDaysSince(lastActive, 999);

    // ✅ purchase real dari orders (90 hari)
    const pf = await getPurchaseFeaturesByUser(user.uid, 90).catch(() => null);

    const purchase90 = {
      cashew: pf?.purchase_cashew_90d ?? 0,
      peanut: pf?.purchase_peanut_90d ?? 0,
      daysSinceLastPurchase: pf?.days_since_last_purchase ?? 999,
    };

    const history = stats
      ? {
          login_30d: stats.loginCount || 0,
          view_cashew_30d: stats.productInterests?.cashew || 0,
          view_peanut_30d: stats.productInterests?.peanut || 0,
          click_rec_cashew_30d: 0,
          click_rec_peanut_30d: 0,
          purchase_cashew_90d: purchase90.cashew,
          purchase_peanut_90d: purchase90.peanut,
          days_since_last_purchase: purchase90.daysSinceLastPurchase,
          days_since_last_active: daysSinceLastActive,
        }
      : undefined;

    return { history, purchase90, daysSinceLastActive };
  };

  /** ================
   * Questionnaire rec
   * - explicit dari form
   * - kalau login, boleh “gabung” implicit juga biar sesuai claim hybrid (optional)
   * ================ */
  const handleSubmit = async () => {
    setIsLoading(true);
    setRecommendationType("questionnaire");

    try {
      const effectiveProfile = getEffectiveProfile();

      const { history } = user
        ? await buildHistoryFeatures()
        : { history: undefined };

      const ml = await predictRecommendation({
        profile: {
          age: Number.parseInt(effectiveProfile.age || "25", 10) || 25,
          gender: effectiveProfile.gender || "female",
          activity: effectiveProfile.activity || "moderate",
          goal: effectiveProfile.goal || "energy",
          allergies: effectiveProfile.allergies || [],
        },
        history, // ✅ gabung jika ada
        source: "questionnaire",
      });

      const uiRec = buildUiRecommendationFromProduct({
        product: ml.product,
        profile: effectiveProfile,
        source: "questionnaire",
        confidence: ml.confidence,
        probs: ml.probs,
        debug: ml.debug,
        usedFeatures: history,
      });

      setRecommendation(uiRec);
      setStep(4);

      if (user) {
        await incrementRecommendationCount(user.uid);

        await saveHistory({
          userId: user.uid,
          type: "recommendation",
          createdAt: new Date(),
          profile: {
            age: effectiveProfile.age,
            gender: effectiveProfile.gender,
            activity: effectiveProfile.activity,
            goal: effectiveProfile.goal,
            allergies: effectiveProfile.allergies,
          },
          recommendation: {
            product: uiRec.product,
            title: uiRec.title,
            reason: uiRec.reason,
            tips: uiRec.tips,
            consumption: uiRec.consumption,
          },
          notes: `ML source=questionnaire; confidence=${
            uiRec.ml?.confidence ?? "-"
          }; probs=${JSON.stringify(
            uiRec.ml?.probs ?? {}
          )}; features=${JSON.stringify(uiRec.ml?.usedFeatures ?? {})}`,
        });

        toast({
          title: "Tersimpan di History",
          description: "Hasil rekomendasi telah disimpan ke riwayat Anda.",
        });
      }
    } catch (e: any) {
      toast({
        title: "ML belum bisa diakses",
        description: e?.message || "Pastikan backend & ML service sudah jalan.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** ================
   * History/behavior rec
   * - implicit dari userStats + purchase real
   * - profil: prioritas ambil dari kuisioner terakhir (history), fallback ke form/default
   * ================ */
  const handleHistoryRecommendation = async () => {
    if (!user) return;

    setIsLoading(true);
    setRecommendationType("history");

    try {
      // ✅ profil dari kuisioner terakhir user (kalau ada)
      const lastProfile = await getLatestProfileFromHistory(user.uid).catch(
        () => null
      );

      const effectiveProfile: UserProfile = {
        age: lastProfile?.age || profile.age || "25",
        gender: lastProfile?.gender || profile.gender || "female",
        activity: lastProfile?.activity || profile.activity || "moderate",
        goal: lastProfile?.goal || profile.goal || "healthy",
        allergies: lastProfile?.allergies || profile.allergies || [],
      };

      const { history, purchase90, daysSinceLastActive } =
        await buildHistoryFeatures();

      const ml = await predictRecommendation({
        profile: {
          age: Number.parseInt(effectiveProfile.age || "25", 10) || 25,
          gender: effectiveProfile.gender || "female",
          activity: effectiveProfile.activity || "moderate",
          goal: effectiveProfile.goal || "healthy",
          allergies: effectiveProfile.allergies || [],
        },
        history,
        source: "history",
      });

      const uiRec = buildUiRecommendationFromProduct({
        product: ml.product,
        profile: effectiveProfile,
        source: "history",
        confidence: ml.confidence,
        probs: ml.probs,
        debug: ml.debug,
        usedFeatures: history,
      });

      const basedOn = userStats
        ? buildBasedOn({
            stats: userStats,
            purchase90: {
              cashew: purchase90.cashew,
              peanut: purchase90.peanut,
              daysSinceLastPurchase: purchase90.daysSinceLastPurchase,
            },
            daysSinceLastActive,
          })
        : ["Belum ada riwayat yang cukup (fallback minimal)"];

      const historyUi: HistoryUiRecommendation = { ...uiRec, basedOn };

      setHistoryRecommendation(historyUi);
      setStep(5);

      await incrementRecommendationCount(user.uid);

      await saveHistory({
        userId: user.uid,
        type: "recommendation",
        createdAt: new Date(),
        profile: {
          age: effectiveProfile.age,
          gender: effectiveProfile.gender,
          activity: effectiveProfile.activity,
          goal: effectiveProfile.goal,
          allergies: effectiveProfile.allergies,
        },
        recommendation: {
          product: historyUi.product,
          title: historyUi.title,
          reason: historyUi.reason,
          tips: historyUi.tips,
          consumption: historyUi.consumption,
        },
        notes: `ML source=history; confidence=${
          historyUi.ml?.confidence ?? "-"
        }; probs=${JSON.stringify(
          historyUi.ml?.probs ?? {}
        )}; features=${JSON.stringify(
          historyUi.ml?.usedFeatures ?? {}
        )}; basedOn=${basedOn.join(", ")}`,
      });

      toast({
        title: "Tersimpan di History",
        description: "Hasil rekomendasi telah disimpan ke riwayat Anda.",
      });
    } catch (e: any) {
      toast({
        title: "ML belum bisa diakses",
        description: e?.message || "Pastikan backend & ML service sudah jalan.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** General fallback (tanpa ML) */
  const handleGeneralRecommendation = async (rec: DefaultRecommendation) => {
    setIsLoading(true);
    setRecommendationType("general");

    try {
      // ✅ no artificial delay (biar gak kerasa "lama")
      setRecommendation(rec.fullRecommendation);
      setStep(4);

      if (user) {
        await incrementRecommendationCount(user.uid);
        await saveHistory({
          userId: user.uid,
          type: "recommendation",
          createdAt: new Date(),
          recommendation: {
            product: rec.fullRecommendation.product,
            title: rec.fullRecommendation.title,
            reason: rec.fullRecommendation.reason,
            tips: rec.fullRecommendation.tips,
            consumption: rec.fullRecommendation.consumption,
          },
          notes: `Rekomendasi umum (fallback): ${rec.title}`,
        });

        toast({
          title: "Tersimpan di History",
          description: "Hasil rekomendasi telah disimpan ke riwayat Anda.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentView = useMemo(() => {
    if (isLoading) return "loading";
    return `step-${step}`;
  }, [isLoading, step]);

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
                <Sparkles size={16} />
                Powered Recommendation
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
                Temukan <span className="text-primary">EnerGum</span> yang Cocok
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Sistem rekomendasi menganalisis profil (kuisioner) dan sinyal
                aktivitas (riwayat) untuk rekomendasi yang lebih personal.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                {/* LOADING */}
                {currentView === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-20"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block mb-4"
                    >
                      <Sparkles size={48} className="text-energum-gold" />
                    </motion.div>
                    <h3 className="font-display text-xl text-foreground mb-2">
                      {recommendationType === "history"
                        ? "Menganalisis Profil & Riwayat Anda..."
                        : recommendationType === "general"
                        ? "Menyiapkan Rekomendasi..."
                        : "Menganalisis Profil Anda..."}
                    </h3>
                    <p className="text-muted-foreground">
                      Memproses data untuk rekomendasi terbaik
                    </p>
                  </motion.div>
                )}

                {/* STEP 0 */}
                {currentView === "step-0" && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Questionnaire */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card rounded-3xl p-8 shadow-soft cursor-pointer hover:shadow-medium transition-all group"
                        onClick={() => setStep(1)}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                          <Sparkles size={28} className="text-primary" />
                        </div>
                        <h3 className="font-display text-xl text-foreground mb-2">
                          Jawab Kuisioner
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Jawab usia, aktivitas, tujuan, dan alergi untuk
                          rekomendasi personal.
                        </p>
                        <div className="flex items-center text-primary font-medium text-sm group-hover:gap-3 gap-2 transition-all">
                          Mulai Kuisioner <ChevronRight size={16} />
                        </div>
                      </motion.div>

                      {/* History */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`bg-card rounded-3xl p-8 shadow-soft transition-all ${
                          user
                            ? "cursor-pointer hover:shadow-medium group"
                            : "opacity-75"
                        }`}
                        onClick={() => user && handleHistoryRecommendation()}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                          <History size={28} className="text-accent" />
                        </div>
                        <h3 className="font-display text-xl text-foreground mb-2">
                          Berdasarkan Riwayat
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Rekomendasi dari sinyal perilaku: login, minat produk,
                          dan pembelian (purchase real).
                        </p>

                        {!user ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/auth");
                            }}
                          >
                            <LogIn size={16} />
                            Login untuk fitur ini
                          </Button>
                        ) : userStats ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{userStats.loginCount || 0}x login</span>
                              <span>
                                {(userStats.purchaseHistory?.cashew || 0) +
                                  (userStats.purchaseHistory?.peanut || 0)}{" "}
                                pembelian (stats)
                              </span>
                            </div>
                            <div className="flex items-center text-accent font-medium text-sm group-hover:gap-3 gap-2 transition-all">
                              Lihat Rekomendasi <ChevronRight size={16} />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Memuat data riwayat…
                          </p>
                        )}
                      </motion.div>
                    </div>

                    {/* General */}
                    <div>
                      <h3 className="font-display text-xl text-foreground mb-6 text-center">
                        Atau pilih rekomendasi umum (fallback)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {defaultRecommendations.map((rec, index) => {
                          const RecIcon = rec.icon;
                          return (
                            <motion.div
                              key={rec.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="p-6 bg-secondary rounded-2xl cursor-pointer hover:bg-secondary/80 transition-all group"
                              onClick={() => handleGeneralRecommendation(rec)}
                            >
                              <RecIcon
                                size={24}
                                className="text-primary mb-3"
                              />
                              <h4 className="font-semibold text-foreground mb-2">
                                {rec.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                {rec.description}
                              </p>
                              <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 gap-1 transition-all">
                                Lihat Detail <ChevronRight size={14} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1 */}
                {currentView === "step-1" && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-card rounded-3xl p-8 shadow-soft max-w-2xl mx-auto"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <User size={20} className="text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Langkah 1 dari 3
                        </p>
                        <h3 className="font-display text-xl text-foreground">
                          Informasi Dasar
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Usia Anda
                        </label>
                        <input
                          type="number"
                          value={profile.age}
                          onChange={(e) =>
                            setProfile({ ...profile, age: e.target.value })
                          }
                          placeholder="Contoh: 25"
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Jenis Kelamin
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: "Pria", value: "male" },
                            { label: "Wanita", value: "female" },
                          ].map((g) => (
                            <button
                              key={g.value}
                              onClick={() =>
                                setProfile({ ...profile, gender: g.value })
                              }
                              className={`py-3 px-4 rounded-xl border-2 transition-all ${
                                profile.gender === g.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={() => setStep(0)}>
                        Kembali
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={() => setStep(2)}
                        disabled={!profile.age || !profile.gender}
                      >
                        Lanjut <ArrowRight size={18} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {currentView === "step-2" && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-card rounded-3xl p-8 shadow-soft max-w-2xl mx-auto"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Activity
                          size={20}
                          className="text-primary-foreground"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Langkah 2 dari 3
                        </p>
                        <h3 className="font-display text-xl text-foreground">
                          Tingkat Aktivitas
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {activityLevels.map((level) => (
                        <button
                          key={level.value}
                          onClick={() =>
                            setProfile({ ...profile, activity: level.value })
                          }
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            profile.activity === level.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-semibold text-foreground">
                            {level.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {level.desc}
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Kembali
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={() => setStep(3)}
                        disabled={!profile.activity}
                      >
                        Lanjut <ArrowRight size={18} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 */}
                {currentView === "step-3" && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-card rounded-3xl p-8 shadow-soft max-w-2xl mx-auto"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Target size={20} className="text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Langkah 3 dari 3
                        </p>
                        <h3 className="font-display text-xl text-foreground">
                          Tujuan & Alergi
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Tujuan Utama Anda
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {goals.map((g) => {
                            const GoalIcon = g.icon;
                            return (
                              <button
                                key={g.value}
                                onClick={() =>
                                  setProfile({ ...profile, goal: g.value })
                                }
                                className={`p-4 rounded-xl border-2 text-center transition-all ${
                                  profile.goal === g.value
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <GoalIcon
                                  size={24}
                                  className="mx-auto mb-2 text-primary"
                                />
                                <p className="text-sm font-medium text-foreground">
                                  {g.label}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Alergi (jika ada)
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {["peanut", "cashew", "none"].map((allergy) => (
                            <button
                              key={allergy}
                              onClick={() => {
                                if (allergy === "none") {
                                  setProfile({ ...profile, allergies: [] });
                                } else {
                                  const updated = profile.allergies.includes(
                                    allergy
                                  )
                                    ? profile.allergies.filter(
                                        (a) => a !== allergy
                                      )
                                    : [...profile.allergies, allergy];
                                  setProfile({
                                    ...profile,
                                    allergies: updated,
                                  });
                                }
                              }}
                              className={`px-4 py-2 rounded-full border-2 transition-all ${
                                allergy === "none"
                                  ? profile.allergies.length === 0
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/50"
                                  : profile.allergies.includes(allergy)
                                  ? "border-destructive bg-destructive/10 text-destructive"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {allergy === "none"
                                ? "Tidak ada"
                                : allergy === "peanut"
                                ? "Kacang Tanah"
                                : "Kacang Mete"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Kembali
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!profile.goal}
                      >
                        <Sparkles size={18} />
                        Dapatkan Rekomendasi
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4 RESULT */}
                {currentView === "step-4" && recommendation && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6 max-w-2xl mx-auto"
                  >
                    <div className="bg-card rounded-3xl p-8 shadow-soft">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-energum-gold/20 flex items-center justify-center mx-auto mb-4">
                          <Sparkles size={32} className="text-energum-gold" />
                        </div>
                        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-2">
                          {recommendation.title}
                        </h2>
                        {recommendation.ml?.confidence != null && (
                          <p className="text-xs text-muted-foreground">
                            Confidence:{" "}
                            {Math.round(
                              (recommendation.ml.confidence || 0) * 100
                            )}
                            %
                          </p>
                        )}
                      </div>

                      <div className="flex justify-center gap-8 mb-8">
                        {(recommendation.product === "cashew" ||
                          recommendation.product === "both") && (
                          <motion.img
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            src={cashewImg}
                            alt="EnerGum Cashew"
                            className="w-48 drop-shadow-xl"
                          />
                        )}
                        {(recommendation.product === "peanut" ||
                          recommendation.product === "both") && (
                          <motion.img
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            src={peanutImg}
                            alt="EnerGum Peanut"
                            className="w-48 drop-shadow-xl"
                          />
                        )}
                      </div>

                      <div className="bg-secondary rounded-xl p-6 mb-6">
                        <p className="text-foreground leading-relaxed">
                          {recommendation.reason}
                        </p>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-display text-lg text-foreground mb-4">
                          Tips Konsumsi:
                        </h4>
                        <div className="space-y-3">
                          {recommendation.tips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-energum-gold flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check
                                  size={12}
                                  className="text-primary-foreground"
                                />
                              </div>
                              <p className="text-muted-foreground">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-primary/10 rounded-xl p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          Rekomendasi Konsumsi
                        </p>
                        <p className="text-lg font-semibold text-primary">
                          {recommendation.consumption}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button variant="outline" size="lg" onClick={resetForm}>
                        <RefreshCw size={18} />
                        Mulai Ulang
                      </Button>
                      {user && (
                        <Button
                          variant="hero"
                          size="lg"
                          onClick={() => navigate("/history")}
                        >
                          <History size={18} />
                          Lihat History
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 5 RESULT (HISTORY) */}
                {currentView === "step-5" && historyRecommendation && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6 max-w-2xl mx-auto"
                  >
                    <div className="bg-card rounded-3xl p-8 shadow-soft">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                          <History size={32} className="text-accent" />
                        </div>
                        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-2">
                          {historyRecommendation.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Berdasarkan Riwayat Aktivitas Anda
                        </p>
                        {historyRecommendation.ml?.confidence != null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence:{" "}
                            {Math.round(
                              (historyRecommendation.ml.confidence || 0) * 100
                            )}
                            %
                          </p>
                        )}
                      </div>

                      {historyRecommendation.basedOn.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center mb-6">
                          {historyRecommendation.basedOn.map((item, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-center gap-8 mb-8">
                        {(historyRecommendation.product === "cashew" ||
                          historyRecommendation.product === "both") && (
                          <motion.img
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            src={cashewImg}
                            alt="EnerGum Cashew"
                            className="w-48 drop-shadow-xl"
                          />
                        )}
                        {(historyRecommendation.product === "peanut" ||
                          historyRecommendation.product === "both") && (
                          <motion.img
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            src={peanutImg}
                            alt="EnerGum Peanut"
                            className="w-48 drop-shadow-xl"
                          />
                        )}
                      </div>

                      <div className="bg-secondary rounded-xl p-6 mb-6">
                        <p className="text-foreground leading-relaxed">
                          {historyRecommendation.reason}
                        </p>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-display text-lg text-foreground mb-4">
                          Tips Konsumsi:
                        </h4>
                        <div className="space-y-3">
                          {historyRecommendation.tips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check
                                  size={12}
                                  className="text-accent-foreground"
                                />
                              </div>
                              <p className="text-muted-foreground">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-accent/10 rounded-xl p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          Rekomendasi Konsumsi
                        </p>
                        <p className="text-lg font-semibold text-accent">
                          {historyRecommendation.consumption}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button variant="outline" size="lg" onClick={resetForm}>
                        <RefreshCw size={18} />
                        Mulai Ulang
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={() => navigate("/history")}
                      >
                        <History size={18} />
                        Lihat History
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default Recommendation;
