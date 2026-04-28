import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wheat, Check, Sparkles, ShoppingCart } from "lucide-react";
import cashewImg from "@/assets/cashew.png";
import peanutImg from "@/assets/peanut.png";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const products = [
  {
    id: "cashew",
    name: "EnerGum Cashew",
    tagline: "Gurih Legit Premium",
    description:
      "Kombinasi sempurna sorgum dengan kacang mete premium. Tekstur renyah dan rasa gurih legit yang membuat ketagihan.",
    image: cashewImg,
    price: 10000,
    nutrition: {
      calories: "180 kkal",
      protein: "6g",
      carbs: "22g",
      fat: "8g",
      fiber: "4g",
    },
    features: [
      "Kaya Omega-3 dan Omega-6",
      "Protein tinggi dari kacang mete",
      "Serat alami untuk pencernaan sehat",
      "Tanpa pengawet buatan",
      "Halal certified",
    ],
    bgColor: "bg-energum-cashew/10",
    accentColor: "bg-energum-cashew",
  },
  {
    id: "peanut",
    name: "EnerGum Peanut",
    tagline: "Klasik Favorit",
    description:
      "Perpaduan sorgum dengan kacang tanah pilihan. Rasa khas yang disukai semua kalangan, cocok untuk aktivitas sehari-hari.",
    image: peanutImg,
    price: 10000,
    nutrition: {
      calories: "175 kkal",
      protein: "7g",
      carbs: "20g",
      fat: "9g",
      fiber: "3g",
    },
    features: [
      "Tinggi Vitamin E",
      "Antioksidan alami",
      "Sumber energi instan",
      "Bebas gluten",
      "Halal certified",
    ],
    bgColor: "bg-energum-peanut/10",
    accentColor: "bg-energum-peanut",
  },
] as const;

type Product = (typeof products)[number];

type CartItem = Pick<Product, "id" | "name" | "image" | "price"> & {
  quantity: number;
};

const Products = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // ✅ Cart state (multi-varian)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const requireLogin = () => {
    if (!user) {
      toast({
        title: "Login diperlukan",
        description: "Silakan login terlebih dahulu untuk melakukan pembelian",
        variant: "destructive",
      });
      return true;
    }
    return false;
  };

  const addToCart = (product: Product, qty: number = 1) => {
    setCart((prev) => {
      const exist = prev.find((x) => x.id === product.id);
      if (exist) {
        return prev.map((x) =>
          x.id === product.id
            ? { ...x, quantity: Math.min(99, x.quantity + qty) }
            : x
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: Math.min(99, qty),
        },
      ];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((x) =>
          x.id === productId
            ? { ...x, quantity: Math.max(0, Math.min(99, x.quantity + delta)) }
            : x
        )
        .filter((x) => x.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((x) => x.id !== productId));
  };

  const clearCart = () => setCart([]);

  // ✅ "Beli Sekarang" sekarang artinya: tambah ke cart + buka checkout
  const handleBuyClick = (product: Product) => {
    if (requireLogin()) return;
    addToCart(product, 1);
    setIsCheckoutOpen(true);
  };

  // ✅ Biar dialog gak kebuka kalau cart kosong
  const handleCheckoutOpenChange = (open: boolean) => {
    if (open && cart.length === 0) return;
    setIsCheckoutOpen(open);
  };

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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Wheat size={16} />
                Bar Energi Sorgum
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Produk <span className="text-primary">EnerGum</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Dua varian lezat yang dirancang untuk memenuhi kebutuhan energi
                Anda dengan bahan-bahan alami berkualitas tinggi.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Products */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 space-y-20">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`rounded-3xl overflow-hidden ${product.bgColor}`}
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12 ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Product Image */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center justify-center ${
                      index % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full max-w-md drop-shadow-2xl"
                    />
                  </motion.div>

                  {/* Product Info */}
                  <div
                    className={`flex flex-col justify-center ${
                      index % 2 === 1 ? "lg:order-1" : ""
                    }`}
                  >
                    <span className="text-accent font-medium text-sm uppercase tracking-wider mb-2">
                      {product.tagline}
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {product.name}
                    </h2>
                    <p className="text-muted-foreground text-lg mb-6">
                      {product.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {product.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full ${product.accentColor} flex items-center justify-center`}
                          >
                            <Check
                              size={12}
                              className="text-primary-foreground"
                            />
                          </div>
                          <span className="text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Nutrition Facts */}
                    <div className="bg-card rounded-xl p-6 mb-8">
                      <h4 className="font-display text-lg font-semibold text-foreground mb-4">
                        Informasi Nilai Gizi (per sajian)
                      </h4>
                      <div className="grid grid-cols-5 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {product.nutrition.calories}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Kalori
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {product.nutrition.protein}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Protein
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {product.nutrition.carbs}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Karbohidrat
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {product.nutrition.fat}
                          </p>
                          <p className="text-xs text-muted-foreground">Lemak</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {product.nutrition.fiber}
                          </p>
                          <p className="text-xs text-muted-foreground">Serat</p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(product.price)}
                        <span className="text-sm text-muted-foreground font-normal">
                          {" "}
                          /pcs
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={() => handleBuyClick(product)}
                      >
                        <ShoppingCart size={18} />
                        Beli Sekarang
                      </Button>

                      <Button variant="heroOutline" size="lg" asChild>
                        <Link to="/recommendation">
                          <Sparkles size={18} />
                          Rekomendasi
                        </Link>
                      </Button>
                    </div>

                    {/* Optional: kecilin friction buat nambah tanpa buka dialog */}
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (requireLogin()) return;
                          addToCart(product, 1);
                          toast({
                            title: "Ditambahkan ke keranjang",
                            description: `${product.name} +1`,
                          });
                        }}
                      >
                        Tambah ke Keranjang
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Floating Cart Bar */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
            <div className="mx-auto max-w-3xl bg-background/95 backdrop-blur border rounded-2xl shadow-lg p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <p className="font-semibold leading-tight">
                    Keranjang: {cartCount} item
                  </p>
                  <p className="text-sm text-muted-foreground leading-tight">
                    Total: {formatPrice(cartTotal)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => clearCart()}
                  className="hidden sm:inline-flex"
                >
                  Kosongkan
                </Button>
                <Button
                  variant="hero"
                  onClick={() => {
                    if (requireLogin()) return;
                    setIsCheckoutOpen(true);
                  }}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Purchase Dialog versi cart (multi item) */}
        {cart.length > 0 && (
          <PurchaseDialog
            open={isCheckoutOpen}
            onOpenChange={handleCheckoutOpenChange}
            items={cart}
            onChangeQty={changeQty}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
          />
        )}
      </PageTransition>
    </Layout>
  );
};

export default Products;
