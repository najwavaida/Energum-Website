import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import cashewImg from "@/assets/cashew.png";
import peanutImg from "@/assets/peanut.png";

const products = [
  {
    id: "cashew",
    name: "EnerGum Cashew",
    image: cashewImg,
    tagline: "Kaya Omega-3 & Protein",
  },
  {
    id: "peanut",
    name: "EnerGum Peanut",
    image: peanutImg,
    tagline: "Energi Instan & Vitamin E",
  },
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const goToPrevious = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const goToNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  return (
    <section className="relative min-h-[90vh] gradient-hero flex items-center overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-energum-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-energum-gold/20 text-accent rounded-full text-sm font-medium mb-6"
            >
              <Sparkles size={16} />
              Bar Energi Sorgum Alami
            </motion.span>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
              Energi Alami untuk{" "}
              <span className="text-primary">Gaya Hidup Aktif</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              EnerGum adalah snack bar energi berbahan dasar sorgum yang
              dirancang khusus untuk memenuhi kebutuhan nutrisi Anda. Tersedia
              dalam varian
              <strong className="text-accent"> Cashew</strong> dan
              <strong className="text-accent"> Peanut</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 relative z-10">
              <Link to="/products" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full">
                  Lihat Produk
                </Button>
              </Link>

              <Link to="/recommendation" className="w-full sm:w-auto">
                <Button
                  variant="heroOutline"
                  size="xl"
                  className="w-full gap-2"
                >
                  <Sparkles size={20} />
                  Dapatkan Rekomendasi
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-2 bg-secondary rounded-full">
                  <Zap size={18} className="text-accent" />
                </div>
                <span className="text-sm font-medium">Energi Tahan Lama</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-2 bg-secondary rounded-full">
                  <Leaf size={18} className="text-accent" />
                </div>
                <span className="text-sm font-medium">100% Alami</span>
              </div>
            </div>
          </motion.div>

          {/* Product Slider */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative h-[400px] md:h-[500px] flex items-center justify-center">
              {/* Navigation Buttons */}
              <button
                onClick={goToPrevious}
                className="absolute left-0 z-20 p-3 rounded-full bg-background/80 backdrop-blur-sm shadow-soft hover:bg-background transition-all"
                aria-label="Previous product"
              >
                <ChevronLeft size={24} className="text-foreground" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 z-20 p-3 rounded-full bg-background/80 backdrop-blur-sm shadow-soft hover:bg-background transition-all"
                aria-label="Next product"
              >
                <ChevronRight size={24} className="text-foreground" />
              </button>

              {/* Product Display */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <motion.img
                    animate={{ y: [0, -15, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    src={products[currentIndex].image}
                    alt={products[currentIndex].name}
                    className="w-full max-w-md mx-auto drop-shadow-2xl"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                  >
                    <h3 className="font-display text-2xl text-foreground mb-2">
                      {products[currentIndex].name}
                    </h3>
                    <p className="text-accent font-medium">
                      {products[currentIndex].tagline}
                    </p>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-energum-gold/20 rounded-full blur-3xl -z-10" />
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-3 mt-6">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setAutoPlay(false);
                    setCurrentIndex(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-primary w-8"
                      : "bg-muted hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
