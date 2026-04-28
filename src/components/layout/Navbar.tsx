import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut, Loader2, History, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const baseNavLinks = [
  { name: "Beranda", path: "/" },
  { name: "Produk", path: "/products" },
  { name: "Rekomendasi", path: "/recommendation" },
  { name: "Tentang", path: "/about" },
];

const authNavLinks = [
  { name: "History", path: "/history" },
  { name: "orders", path: "/orders" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();

  // Build navigation links based on auth state
  const navLinks = user ? [...baseNavLinks, ...authNavLinks] : baseNavLinks;

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="EnerGum Logo"
              className="h-10 md:h-12 w-auto"
            />
            <span className="font-display text-xl md:text-2xl font-bold text-primary">
              EnerGum
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-colors duration-300 ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarImage
                        src={profile?.photoURL || ""}
                        alt={profile?.displayName || "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                        {getInitials(profile?.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {profile?.displayName || "Pengguna"}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Profile di atas log out */}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  {/*Orders */}
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>

                  {/*History */}
                  <DropdownMenuItem asChild>
                    <Link to="/history" className="flex items-center">
                      <History className="mr-2 h-4 w-4" />
                      History
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Masuk</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/recommendation">Rekomendasi</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`py-2 font-medium transition-colors ${
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {user ? (
                <>
                  <div className="flex items-center gap-3 py-2 border-t border-border pt-4">
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarImage
                        src={profile?.photoURL || ""}
                        alt={profile?.displayName || "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                        {getInitials(profile?.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {profile?.displayName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Keluar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="mt-2">
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Masuk
                    </Link>
                  </Button>
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/recommendation" onClick={() => setIsOpen(false)}>
                      Coba Rekomendasi
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
