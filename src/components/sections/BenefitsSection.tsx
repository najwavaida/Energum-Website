import { motion } from "framer-motion";
import { Wheat, Heart, Zap, Sparkles, Shield, Leaf } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Energi Tahan Lama",
    description: "Sorgum melepaskan energi secara bertahap, menjaga stamina Anda sepanjang hari.",
  },
  {
    icon: Wheat,
    title: "Kaya Serat",
    description: "Tinggi serat untuk menjaga kesehatan pencernaan dan rasa kenyang lebih lama.",
  },
  {
    icon: Heart,
    title: "Baik untuk Jantung",
    description: "Kandungan antioksidan dan lemak sehat membantu menjaga kesehatan jantung.",
  },
  {
    icon: Shield,
    title: "Bebas Gluten",
    description: "Aman untuk dikonsumsi oleh mereka yang sensitif terhadap gluten.",
  },
  {
    icon: Leaf,
    title: "100% Alami",
    description: "Tanpa pengawet buatan, pewarna, atau pemanis sintetis.",
  },
  {
    icon: Sparkles,
    title: "Nutrisi Lengkap",
    description: "Kombinasi sempurna protein, karbohidrat kompleks, dan lemak sehat.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Mengapa Memilih <span className="text-primary">EnerGum</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Dibuat dari bahan-bahan alami terbaik dengan manfaat luar biasa untuk tubuh Anda
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 bg-card rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
