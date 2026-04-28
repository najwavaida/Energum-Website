import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createOrder,
  type OrderItem,
  type ShippingAddress,
} from "@/lib/orderService";
import {
  Plus,
  Minus,
  MapPin,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Package,
  Truck,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // ✅ multi item
  items: CartItem[];

  // ✅ kontrol cart dari parent (Products.tsx)
  onChangeQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

type CreatedOrder = { orderId: string; docId?: string };

export function PurchaseDialog({
  open,
  onOpenChange,
  items,
  onChangeQty,
  onRemoveItem,
  onClearCart,
}: PurchaseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<
    "quantity" | "address" | "review" | "success"
  >("quantity");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalPrice = useMemo(() => {
    return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [items]);

  const totalQty = useMemo(() => {
    return items.reduce((sum, it) => sum + it.quantity, 0);
  }, [items]);

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const missingFields = {
    fullName: !address.fullName.trim(),
    phone: !address.phone.trim(),
    address: !address.address.trim(),
    city: !address.city.trim(),
    postalCode: !address.postalCode.trim(),
  };

  const canContinueAddress = !Object.values(missingFields).some(Boolean);
  const canContinueQty = items.length > 0 && totalQty > 0;

  const handleSubmitOrder = async () => {
    if (!user) {
      toast({
        title: "Login diperlukan",
        description: "Silakan login terlebih dahulu untuk melakukan pembelian",
        variant: "destructive",
      });
      return;
    }

    if (!items.length) {
      toast({
        title: "Keranjang kosong",
        description: "Tambahkan produk dulu sebelum checkout",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = items.map((it) => ({
        productId: it.id,
        productName: it.name,
        quantity: it.quantity,
        pricePerItem: it.price,
        totalPrice: it.price * it.quantity,
      }));

      const result = await createOrder({
        userId: user.uid,
        userEmail: user.email || "",
        items: orderItems,
        shippingAddress: address,
        totalAmount: totalPrice,
        paymentMethod: "cod",
      });

      if (!result) throw new Error("Failed to create order");

      setCreatedOrder({ orderId: result.orderId, docId: result.docId });
      setStep("success");

      // ✅ kosongkan cart setelah order sukses
      onClearCart();

      toast({
        title: "Pesanan berhasil dibuat!",
        description: `ID Pesanan: ${result.orderId}`,
      });
    } catch (error) {
      toast({
        title: "Gagal membuat pesanan",
        description: "Terjadi kesalahan, silakan coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setStep("quantity");
    setAddress({
      fullName: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      notes: "",
    });
    setCreatedOrder(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleViewOrder = () => {
    handleClose();
    navigate("/orders");
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {["quantity", "address", "review"].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step === s || (step === "success" && i < 3)
                ? "bg-primary text-primary-foreground"
                : step === "success" ||
                  ["quantity", "address", "review"].indexOf(step) > i
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          {i < 2 && (
            <div
              className={`w-8 h-0.5 ${
                ["quantity", "address", "review"].indexOf(step) > i ||
                step === "success"
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
        else onOpenChange(true);
      }}
    >
      {/* ✅ aria-describedby={undefined} supaya warning shadcn hilang */}
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center">
            {step === "quantity" && "Keranjang Belanja"}
            {step === "address" && "Alamat Pengiriman"}
            {step === "review" && "Konfirmasi Pesanan"}
            {step === "success" && "Pesanan Berhasil!"}
          </DialogTitle>
        </DialogHeader>

        {step !== "success" && stepIndicator}

        <AnimatePresence mode="wait">
          {/* Step 1: Cart / Quantity */}
          {step === "quantity" && (
            <motion.div
              key="quantity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                  >
                    <img
                      src={it.image}
                      alt={it.name}
                      className="w-14 h-14 object-contain"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{it.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(it.price)} /pcs
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(it.price * it.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onChangeQty(it.id, -1)}
                        disabled={it.quantity <= 1}
                      >
                        <Minus size={18} />
                      </Button>

                      <span className="w-8 text-center font-bold">
                        {it.quantity}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onChangeQty(it.id, +1)}
                        disabled={it.quantity >= 99}
                      >
                        <Plus size={18} />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onRemoveItem(it.id)}
                        title="Hapus item"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Item</span>
                  <span className="font-semibold">{totalQty} pcs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Harga</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Tutup
                </Button>
                <Button
                  variant="hero"
                  className="flex-1"
                  size="lg"
                  onClick={() => setStep("address")}
                  disabled={!canContinueQty}
                >
                  Lanjutkan
                  <MapPin size={18} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Address */}
          {step === "address" && (
            <motion.div
              key="address"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fullName">Nama Lengkap *</Label>
                  <Input
                    id="fullName"
                    value={address.fullName}
                    onChange={(e) =>
                      handleAddressChange("fullName", e.target.value)
                    }
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Nomor Telepon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={address.phone}
                    onChange={(e) =>
                      handleAddressChange("phone", e.target.value)
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Alamat Lengkap *</Label>
                  <Textarea
                    id="address"
                    value={address.address}
                    onChange={(e) =>
                      handleAddressChange("address", e.target.value)
                    }
                    placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">Kota *</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      placeholder="Nama kota"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Kode Pos *</Label>
                    <Input
                      id="postalCode"
                      value={address.postalCode}
                      onChange={(e) =>
                        handleAddressChange("postalCode", e.target.value)
                      }
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Catatan (opsional)</Label>
                  <Input
                    id="notes"
                    value={address.notes || ""}
                    onChange={(e) =>
                      handleAddressChange("notes", e.target.value)
                    }
                    placeholder="Patokan, warna rumah, dll"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("quantity")}
                >
                  Kembali
                </Button>
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={() => setStep("review")}
                  disabled={!canContinueAddress}
                >
                  Lanjutkan
                  <ShoppingBag size={18} />
                </Button>
              </div>

              {!canContinueAddress && (
                <p className="text-xs text-destructive mt-2">
                  Lengkapi dulu:{" "}
                  {Object.entries(missingFields)
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .join(", ")}
                </p>
              )}
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Items Summary */}
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-primary" />
                  <span className="font-semibold">Rincian Produk</span>
                </div>

                <div className="space-y-3">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3">
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-12 h-12 object-contain"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{it.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {it.quantity} pcs × {formatPrice(it.price)}
                        </p>
                      </div>
                      <p className="font-bold text-primary">
                        {formatPrice(it.price * it.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address Summary */}
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-primary" />
                  <span className="font-semibold">Alamat Pengiriman</span>
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{address.fullName}</p>
                  <p className="text-muted-foreground">{address.phone}</p>
                  <p className="text-muted-foreground">{address.address}</p>
                  <p className="text-muted-foreground">
                    {address.city}, {address.postalCode}
                  </p>
                  {address.notes && (
                    <p className="text-muted-foreground italic">
                      Catatan: {address.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-primary" />
                  <span className="font-semibold">Metode Pembayaran</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border-2 border-primary">
                  <Truck size={20} className="text-primary" />
                  <div>
                    <p className="font-medium">COD (Bayar di Tempat)</p>
                    <p className="text-xs text-muted-foreground">
                      Bayar saat paket diterima
                    </p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-primary/10 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Pembayaran</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("address")}
                >
                  Kembali
                </Button>
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || items.length === 0}
                >
                  {isSubmitting ? "Memproses..." : "Pesan Sekarang"}
                  <CheckCircle2 size={18} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 size={40} className="text-green-600" />
              </motion.div>

              <div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  Pesanan Anda Berhasil Dibuat!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Terima kasih telah berbelanja di EnerGum
                </p>
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground">ID Pesanan</p>
                  <p className="text-xl font-mono font-bold text-primary">
                    {createdOrder?.orderId ?? "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleViewOrder}
                >
                  Lihat Pesanan Saya
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClose}
                >
                  Lanjut Belanja
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
