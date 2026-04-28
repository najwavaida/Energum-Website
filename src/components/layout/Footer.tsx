import { Link } from "react-router-dom";
import { Instagram, Globe, Mail, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logo}
                alt="EnerGum Logo"
                className="h-8 w-auto brightness-150"
              />
              <span className="font-display text-xl font-bold text-footer-foreground">
                EnerGum
              </span>
            </div>
            <p className="text-footer-muted max-w-md leading-relaxed text-sm">
              EnerGum hadir sebagai produk inovasi berupa snack bar energi alami
              berbahan sorgum yang dirancang khusus untuk mendukung gaya hidup
              aktif.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 text-footer-foreground">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-footer-muted hover:text-footer-foreground transition-colors duration-300"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-footer-muted hover:text-footer-foreground transition-colors duration-300"
                >
                  Produk
                </Link>
              </li>
              <li>
                <Link
                  to="/recommendation"
                  className="text-footer-muted hover:text-footer-foreground transition-colors duration-300"
                >
                  Rekomendasi
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-footer-muted hover:text-footer-foreground transition-colors duration-300"
                >
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 text-footer-foreground">
              Hubungi Kami
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-footer-accent/20 flex items-center justify-center">
                  <Instagram size={12} className="text-footer-accent" />
                </div>
                <a
                  href="https://instagram.com/energum.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-footer-muted hover:text-footer-foreground transition-colors duration-300"
                >
                  @energum.id
                </a>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-footer-accent/20 flex items-center justify-center">
                  <Globe size={12} className="text-footer-accent" />
                </div>
                <a
                  href="https://www.energum.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-footer-muted hover:text-footer-foreground transition-colors duration-300"
                >
                  www.energum.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-footer-accent/20 flex items-center justify-center">
                  <Mail size={12} className="text-footer-accent" />
                </div>
                <a
                  href="mailto:info@energum.com"
                  className="text-footer-muted hover:text-footer-foreground transition-colors duration-300"
                >
                  info@energum.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-footer-border mt-8 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-footer-muted text-xs">
              © {new Date().getFullYear()} EnerGum. Semua hak dilindungi.
            </p>
            <p className="text-footer-muted text-xs flex items-center gap-1">
              Dibuat dengan{" "}
              <Heart size={11} className="text-red-400 fill-current" /> oleh Tim
              PMW EnerGum
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
