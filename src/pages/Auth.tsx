import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { Layout } from "@/components/layout/Layout";
import logo from "@/assets/logo.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast({
          title: "Selamat datang kembali!",
          description: "Anda berhasil masuk.",
        });
      } else {
        if (!displayName.trim()) {
          toast({
            title: "Error",
            description: "Nama lengkap harus diisi.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        toast({
          title: "Akun berhasil dibuat!",
          description: "Selamat datang di EnerGum.",
        });
      }
      navigate("/");
    } catch (error: any) {
      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email sudah terdaftar.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password terlalu lemah. Minimal 6 karakter.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format email tidak valid.";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Email atau password salah.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Email atau password salah.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Berhasil!",
        description: "Anda berhasil masuk dengan Google.",
      });
      navigate("/");
    } catch (error: any) {
      let errorMessage = "Gagal masuk dengan Google.";
      
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Popup ditutup sebelum selesai.";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Login dibatalkan.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <PageTransition>
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center gradient-hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-4"
          >
            <div className="bg-card rounded-2xl shadow-medium p-8 border border-border">
              {/* Logo & Title */}
              <div className="text-center mb-8">
                <img src={logo} alt="EnerGum" className="h-16 w-auto mx-auto mb-4" />
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {isLogin ? "Masuk ke Akun" : "Daftar Akun Baru"}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {isLogin
                    ? "Masuk untuk mengakses fitur lengkap"
                    : "Buat akun untuk memulai perjalanan Anda"}
                </p>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full mb-6 h-12 font-medium"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Lanjutkan dengan Google
              </Button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">atau</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Nama lengkap Anda"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 h-12"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-12 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : isLogin ? (
                    "Masuk"
                  ) : (
                    "Daftar"
                  )}
                </Button>
              </form>

              {/* Toggle Login/Register */}
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary font-medium hover:underline"
                    disabled={isLoading}
                  >
                    {isLogin ? "Daftar sekarang" : "Masuk"}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    </Layout>
  );
}
