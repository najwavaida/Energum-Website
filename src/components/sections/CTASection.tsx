import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Zap, Brain, TrendingUp } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-br from-[#8B6F47] via-[#A0826D] to-[#8B6F47] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-200/15 via-transparent to-transparent" />

        {/* Animated orbs - warna coklat muda natural */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-80 h-80 bg-gradient-to-br from-[#D4AF77]/40 to-[#C19A6B]/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.25, 0.4, 0.25],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-tl from-[#C19A6B]/35 to-[#A67C52]/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.35, 0.25],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#D4AF77]/35 to-[#B8956A]/35 rounded-full blur-3xl"
        />

        {/* Additional accent orbs */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, delay: 0.5 }}
          className="absolute top-1/4 right-1/3 w-60 h-60 bg-gradient-to-br from-[#E5D5B7]/25 to-[#D4AF77]/25 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 9, repeat: Infinity, delay: 3 }}
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-tr from-[#C19A6B]/30 to-[#D4AF77]/25 rounded-full blur-3xl"
        />
      </div>

      {/* Floating particles with varied colors - natural brown tones */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => {
          const colors = [
            "bg-[#D4AF77]/50",
            "bg-[#C19A6B]/50",
            "bg-[#B8956A]/50",
            "bg-amber-300/50",
          ];
          const randomColor = colors[i % colors.length];
          return (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 ${randomColor} rounded-full shadow-sm shadow-current`}
              initial={{
                x:
                  typeof window !== "undefined"
                    ? Math.random() * window.innerWidth
                    : Math.random() * 1200,
                y:
                  typeof window !== "undefined" ? window.innerHeight + 50 : 800,
              }}
              animate={{
                y: -50,
                x:
                  typeof window !== "undefined"
                    ? Math.random() * window.innerWidth
                    : Math.random() * 1200,
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          );
        })}
      </div>

      {/* Grid overlay for depth - more subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge with animation */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-medium mb-6 shadow-lg shadow-[#8B6F47]/10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={14} className="text-[#D4AF77]" />
            </motion.div>
            Powered by Technology
          </motion.div>

          {/* Main heading with gradient */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight drop-shadow-xl"
          >
            Dapatkan Rekomendasi{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[#E5D5B7] via-[#D4AF77] to-[#E5D5B7] bg-clip-text text-transparent">
                Personal
              </span>
              <motion.span
                className="absolute inset-0 bg-[#D4AF77]/25 blur-xl"
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-white/85 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed"
          >
            Sistem kami akan menganalisis profil dan preferensi Anda untuk
            memberikan rekomendasi konsumsi EnerGum yang paling cocok untuk gaya
            hidup Anda.
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { icon: Brain, text: "Analisis Cerdas" },
              { icon: Zap, text: "Hasil Instan" },
              { icon: TrendingUp, text: "Tepat Sasaran" },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-md hover:shadow-[#D4AF77]/20 transition-all"
              >
                <item.icon size={14} className="text-[#D4AF77]" />
                <span className="text-white text-xs font-medium">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button with enhanced animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          >
            <Button
              variant="gold"
              size="lg"
              className="group relative overflow-hidden shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
              onClick={() => (window.location.href = "/recommendation")}
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
              />
              <span className="relative flex items-center gap-2">
                Coba Sekarang Gratis
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-2 transition-transform duration-300"
                />
              </span>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="mt-5 text-white/50 text-xs"
          >
            ✨ Sudah dipercaya oleh ribuan pengguna
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
