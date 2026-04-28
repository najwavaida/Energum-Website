import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import cashewImg from "@/assets/cashew.png";
import peanutImg from "@/assets/peanut.png";

const products = [
  {
    id: "cashew",
    name: "EnerGum Cashew",
    description: "Kombinasi sempurna sorgum dengan kacang mete premium. Rasa gurih legit dengan tekstur renyah.",
    image: cashewImg,
    features: ["Kaya Omega-3", "Protein Tinggi", "Serat Alami"],
    bgColor: "bg-energum-cashew/20",
  },
  {
    id: "peanut",
    name: "EnerGum Peanut",
    description: "Perpaduan sorgum dengan kacang tanah pilihan. Rasa khas yang disukai semua kalangan.",
    image: peanutImg,
    features: ["Vitamin E", "Antioksidan", "Energi Instan"],
    bgColor: "bg-energum-peanut/20",
  },
];

export function ProductPreviewSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Varian <span className="text-primary">Produk Kami</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Dua pilihan varian yang sama-sama lezat dan bergizi untuk menemani aktivitas Anda
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className={`group relative rounded-3xl overflow-hidden ${product.bgColor} p-8`}
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Product Image */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-64 h-auto drop-shadow-xl"
                  />
                </motion.div>

                {/* Product Info */}
                <div className="text-center md:text-left">
                  <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground mb-4">{product.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
                    {product.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 bg-background/80 rounded-full text-sm font-medium text-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <Button variant="default" asChild>
                    <Link to="/products">Lihat Detail</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
