import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <PageTransition>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="font-display text-6xl md:text-8xl font-bold text-primary mb-4">404</h1>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Maaf, halaman yang Anda cari tidak ada. Mungkin sudah dipindahkan atau dihapus.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/">
                <Home size={18} />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
};

export default NotFound;
