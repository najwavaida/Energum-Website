import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Wifi, WifiOff, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Smartphone,
      title: "Akses Cepat",
      description: "Buka aplikasi langsung dari home screen tanpa browser",
    },
    {
      icon: isOnline ? Wifi : WifiOff,
      title: "Mode Offline",
      description: "Akses konten meskipun tidak terhubung internet",
    },
    {
      icon: Download,
      title: "Ringan & Cepat",
      description: "Ukuran kecil dan loading super cepat",
    },
  ];

  return (
    <Layout>
      <PageTransition>
        <section className="min-h-screen bg-gradient-to-br from-background via-energum-cream to-energum-beige py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              {/* Status Online/Offline */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 ${
                isOnline 
                  ? "bg-green-100 text-green-700" 
                  : "bg-amber-100 text-amber-700"
              }`}>
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>Offline Mode</span>
                  </>
                )}
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                Instal EnerGum App
              </h1>
              <p className="text-lg text-muted-foreground mb-12">
                Dapatkan pengalaman terbaik dengan menginstal aplikasi EnerGum di perangkat Anda
              </p>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-elegant"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* Install Button */}
              {isInstalled ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    Aplikasi Sudah Terinstal!
                  </h3>
                  <p className="text-green-600">
                    EnerGum sudah siap digunakan di perangkat Anda
                  </p>
                </div>
              ) : deferredPrompt ? (
                <Button
                  size="lg"
                  onClick={handleInstall}
                  className="text-lg px-8 py-6 rounded-full shadow-glow"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Instal Sekarang
                </Button>
              ) : (
                <div className="bg-muted/50 rounded-2xl p-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Cara Menginstal
                  </h3>
                  <div className="text-left space-y-4 text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        1
                      </span>
                      <p>
                        <strong className="text-foreground">iPhone/Safari:</strong> Ketuk tombol Share, lalu pilih "Add to Home Screen"
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        2
                      </span>
                      <p>
                        <strong className="text-foreground">Android/Chrome:</strong> Ketuk menu (⋮), lalu pilih "Install app" atau "Add to Home screen"
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        3
                      </span>
                      <p>
                        <strong className="text-foreground">Desktop Chrome/Edge:</strong> Klik ikon install di address bar atau menu browser
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}
