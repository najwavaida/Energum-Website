import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Wheat, Users, Target, Heart, Award, Leaf } from "lucide-react";
import logo from "@/assets/logo.png";

const values = [
  {
    icon: Wheat,
    title: "Berbahan Alami",
    description:
      "Menggunakan sorgum dan bahan-bahan alami berkualitas tinggi tanpa pengawet buatan.",
  },
  {
    icon: Heart,
    title: "Kesehatan Pertama",
    description:
      "Mengutamakan nilai gizi dan manfaat kesehatan dalam setiap produk.",
  },
  {
    icon: Leaf,
    title: "Ramah Lingkungan",
    description:
      "Berkomitmen pada praktik produksi yang berkelanjutan dan ramah lingkungan.",
  },
  {
    icon: Award,
    title: "Kualitas Terjamin",
    description:
      "Setiap produk melalui proses quality control ketat untuk menjamin standar tertinggi.",
  },
];

const teamRoles = [
  {
    title: "Riset & Formulasi",
    description: "Uji rasa, komposisi, dan nutrisi produk",
  },
  {
    title: "Branding",
    description: "Logo, kemasan, dan identitas visual",
  },
  {
    title: "Produksi",
    description: "Proses pembuatan & quality control",
  },
  {
    title: "Pemasaran",
    description: "Strategi penjualan & kampanye digital",
  },
];

const About = () => {
  return (
    <Layout>
      <PageTransition>
        {/* Hero */}
        <section className="py-20 gradient-hero">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <img
                src={logo}
                alt="EnerGum Logo"
                className="w-24 h-24 mx-auto mb-6"
              />
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Tentang <span className="text-primary">EnerGum</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                EnerGum adalah inovasi snack bar energi berbahan sorgum yang
                dikembangkan oleh Tim PMW UNESA 2025 untuk mendukung gaya hidup
                aktif dan produktif.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Cerita <span className="text-primary">Kami</span>
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    EnerGum lahir dari proses pengembangan dan semangat inovasi
                    Tim{" "}
                    <strong className="text-foreground">PMW UNESA 2025</strong>.
                    Kami ingin menghadirkan camilan energi yang praktis, enak,
                    dan tetap punya nilai gizi untuk mendukung aktivitas harian.
                  </p>
                  <p>
                    Berawal dari riset sederhana tentang kebutuhan snack sehat
                    yang mudah dibawa, kami menemukan potensi{" "}
                    <strong className="text-foreground">sorgum</strong> sebagai
                    bahan dasar yang kaya nutrisi, namun masih belum banyak
                    dimanfaatkan secara maksimal.
                  </p>
                  <p>
                    Dari situ, EnerGum dikembangkan menjadi snack bar energi
                    dengan dua varian rasa,{" "}
                    <strong className="text-foreground">Cashew</strong> dan{" "}
                    <strong className="text-foreground">Peanut</strong>, yang
                    dirancang untuk memberikan energi berkelanjutan—cocok untuk
                    kuliah, kerja, olahraga, maupun aktivitas di lapangan.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-secondary rounded-2xl p-6 text-center">
                  <Users size={32} className="mx-auto text-primary mb-3" />
                  <p className="text-3xl font-bold text-foreground mb-1">PMW</p>
                  <p className="text-sm text-muted-foreground">UNESA 2025</p>
                </div>
                <div className="bg-secondary rounded-2xl p-6 text-center">
                  <Target size={32} className="mx-auto text-primary mb-3" />
                  <p className="text-3xl font-bold text-foreground mb-1">2</p>
                  <p className="text-sm text-muted-foreground">Varian Produk</p>
                </div>
                <div className="bg-secondary rounded-2xl p-6 text-center col-span-2">
                  <Wheat size={32} className="mx-auto text-primary mb-3" />
                  <p className="text-3xl font-bold text-foreground mb-1">
                    Sorgum
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bahan dasar lokal bernutrisi
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-soft"
              >
                <h3 className="font-display text-2xl font-bold mb-4">Visi</h3>
                <p className="text-primary-foreground/90 leading-relaxed">
                  Menjadi brand snack bar energi alami terdepan di Indonesia
                  yang mendukung gaya hidup sehat dan aktif masyarakat dengan
                  memanfaatkan potensi sorgum sebagai superfood lokal.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-card rounded-3xl p-8 shadow-soft"
              >
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                  Misi
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    Menghadirkan produk berkualitas tinggi dengan bahan alami
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    Mengedukasi masyarakat tentang manfaat sorgum
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    Mendukung petani lokal dalam budidaya sorgum
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    Berinovasi terus-menerus untuk kebutuhan konsumen
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
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
                Nilai-Nilai <span className="text-primary">Kami</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Prinsip yang mendasari setiap langkah kami dalam menghadirkan
                produk terbaik
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 text-center shadow-soft hover:shadow-md transition-shadow duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
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
                Tim <span className="text-primary">Pengembang</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                EnerGum dikembangkan oleh Tim PMW UNESA 2025 yang berfokus pada
                inovasi produk dan strategi pemasaran
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-card rounded-3xl shadow-soft p-8 mb-8"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users size={40} className="text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                    Program Mahasiswa Wirausaha
                  </h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Tim kami berfokus pada inovasi produk, pengembangan rasa,
                    desain branding, dan strategi pemasaran agar EnerGum siap
                    menjadi snack energi favorit anak muda Indonesia.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamRoles.map((role, index) => (
                    <motion.div
                      key={role.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-secondary rounded-2xl p-6"
                    >
                      <p className="font-semibold text-foreground mb-2">
                        {role.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default About;
