import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getOrdersByUser,
  confirmPackageReceived,
  cancelOrder,
  getStatusMessage,
  getStatusColor,
  type Order,
  type OrderStatus,
} from "@/lib/orderService";
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock size={16} />,
  confirmed: <CheckCircle2 size={16} />,
  processing: <Package size={16} />,
  shipped: <Truck size={16} />,
  delivered: <MapPin size={16} />,
  received: <CheckCircle2 size={16} />,
  cancelled: <AlertCircle size={16} />,
};

function canCancel(status: OrderStatus) {
  return status === "pending" || status === "confirmed";
}

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(
    null
  );
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );

  const refreshOrders = async () => {
    if (!user) return;
    const userOrders = await getOrdersByUser(user.uid);
    setOrders(userOrders);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        await refreshOrders();
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleConfirmReceived = async (orderId?: string) => {
    if (!orderId || !user) return;

    setConfirmingOrderId(orderId);

    try {
      const success = await confirmPackageReceived(orderId, user.uid);
      if (!success) throw new Error("Failed to confirm");

      await refreshOrders();

      toast({
        title: "Paket dikonfirmasi",
        description: "Terima kasih! Pesanan telah selesai.",
      });
    } catch (error) {
      toast({
        title: "Gagal mengkonfirmasi",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId?: string) => {
    if (!orderId || !user) return;

    const ok = window.confirm("Yakin mau membatalkan pesanan ini?");
    if (!ok) return;

    const reason =
      window.prompt(
        "Alasan pembatalan (opsional):",
        "Saya ingin membatalkan pesanan"
      ) || "Dibatalkan oleh pengguna";

    setCancellingOrderId(orderId);

    try {
      const success = await cancelOrder(orderId, user.uid, reason);

      if (!success) {
        toast({
          title: "Tidak bisa dibatalkan",
          description:
            "Pesanan tidak dapat dibatalkan (mungkin sudah diproses/dikirim/selesai).",
          variant: "destructive",
        });
        return;
      }

      await refreshOrders();

      toast({
        title: "Pesanan dibatalkan",
        description: "Admin akan menerima notifikasi pembatalan.",
      });
    } catch (e) {
      toast({
        title: "Gagal membatalkan",
        description: "Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const toggleExpand = (key: string) => {
    setExpandedOrderId((prev) => (prev === key ? null : key));
  };

  if (!user) {
    return (
      <Layout>
        <PageTransition>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <ShoppingBag
                size={48}
                className="mx-auto text-muted-foreground"
              />
              <h2 className="font-display text-2xl font-bold">
                Login Diperlukan
              </h2>
              <p className="text-muted-foreground">
                Silakan login untuk melihat pesanan Anda
              </p>
              <Button variant="hero" asChild>
                <Link to="/auth">Login Sekarang</Link>
              </Button>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageTransition>
        <section className="py-20 gradient-hero">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Package size={16} />
                Pesanan Saya
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Riwayat <span className="text-primary">Pesanan</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Lacak dan kelola semua pesanan Anda di sini
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <ShoppingBag
                  size={64}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <h3 className="font-display text-xl font-semibold mb-2">
                  Belum Ada Pesanan
                </h3>
                <p className="text-muted-foreground mb-6">
                  Anda belum memiliki pesanan. Yuk mulai berbelanja!
                </p>
                <Button variant="hero" asChild>
                  <Link to="/products">Lihat Produk</Link>
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => {
                  const key = order.orderId || order.id || "";
                  const items = order.items ?? [];
                  const statusHistory = order.statusHistory ?? [];

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="bg-card rounded-xl overflow-hidden shadow-soft"
                    >
                      {/* Order Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpand(key)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              ID Pesanan
                            </p>
                            <p className="font-mono font-bold text-primary">
                              {order.orderId ?? order.id}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {statusIcons[order.status]}
                              {getStatusMessage(order.status)}
                            </span>

                            {expandedOrderId === key ? (
                              <ChevronUp
                                size={20}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <ChevronDown
                                size={20}
                                className="text-muted-foreground"
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              {format(order.createdAt, "dd MMM yyyy, HH:mm", {
                                locale: id,
                              })}
                            </span>
                            <span className="text-muted-foreground">
                              {items.reduce(
                                (acc, item) => acc + (item.quantity || 0),
                                0
                              )}{" "}
                              item
                            </span>
                          </div>

                          <span className="font-bold text-foreground">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedOrderId === key && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border"
                        >
                          {/* Cancelled notice */}
                          {order.status === "cancelled" && (
                            <div className="p-4 border-b border-border">
                              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                                <AlertCircle
                                  className="text-red-600"
                                  size={18}
                                />
                                <div className="text-sm">
                                  <p className="font-semibold text-red-700">
                                    Pesanan dibatalkan
                                  </p>
                                  {order.cancelReason && (
                                    <p className="text-red-600 mt-1">
                                      Alasan: {order.cancelReason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Items */}
                          <div className="p-4 space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Package size={16} className="text-primary" />
                              Produk
                            </h4>

                            {items.map((item, i) => (
                              <div
                                key={i}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {item.productName} × {item.quantity}
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.totalPrice)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Address */}
                          <div className="p-4 border-t border-border space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <MapPin size={16} className="text-primary" />
                              Alamat Pengiriman
                            </h4>

                            <div className="text-sm text-muted-foreground">
                              <p className="font-medium text-foreground">
                                {order.shippingAddress.fullName}
                              </p>
                              <p>{order.shippingAddress.phone}</p>
                              <p>{order.shippingAddress.address}</p>
                              <p>
                                {order.shippingAddress.city},{" "}
                                {order.shippingAddress.postalCode}
                              </p>
                            </div>
                          </div>

                          {/* Status Timeline */}
                          <div className="p-4 border-t border-border space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Clock size={16} className="text-primary" />
                              Status Pesanan
                            </h4>

                            <div className="space-y-3">
                              {statusHistory.map((history, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                  <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    {i < statusHistory.length - 1 && (
                                      <div className="w-0.5 h-6 bg-border" />
                                    )}
                                  </div>

                                  <div className="flex-1 pb-2">
                                    <p className="font-medium">
                                      {getStatusMessage(history.status)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(
                                        history.timestamp,
                                        "dd MMM yyyy, HH:mm",
                                        { locale: id }
                                      )}
                                    </p>
                                    {history.message && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {history.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="p-4 border-t border-border space-y-3">
                            {/* Cancel Button */}
                            {canCancel(order.status) && (
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => handleCancelOrder(order.orderId)}
                                disabled={cancellingOrderId === order.orderId}
                              >
                                {cancellingOrderId === order.orderId
                                  ? "Memproses..."
                                  : "Batalkan Pesanan"}
                              </Button>
                            )}

                            {/* Confirm Button */}
                            {order.status === "delivered" && (
                              <Button
                                variant="hero"
                                className="w-full"
                                onClick={() =>
                                  handleConfirmReceived(order.orderId)
                                }
                                disabled={confirmingOrderId === order.orderId}
                              >
                                {confirmingOrderId === order.orderId ? (
                                  "Memproses..."
                                ) : (
                                  <>
                                    <CheckCircle2 size={18} />
                                    Konfirmasi Paket Diterima
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default Orders;
