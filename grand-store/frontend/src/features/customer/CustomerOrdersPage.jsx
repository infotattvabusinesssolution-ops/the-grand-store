import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../api';
import { useAuth } from "../../context/AuthContext";
import { formatCartPrice } from "../../data";
import {
  LogOut,
  User,
  Package,
  Heart,
  Building2,
  Gavel,
  CheckCircle2,
  ChevronRight,
  Search,
  Clock,
  AlertCircle,
  RefreshCw,
  Truck,
  MapPin,
  Coins,
  ShieldCheck,
} from "lucide-react";
import Price from "../../components/ui/Price";

export default function CustomerOrdersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const fetchOrders = async (isManual = false) => {
    if (user) {
      if (isManual) setRefreshing(true);
      try {
        const { data } = await api.get(`/orders/myorders`);
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredOrders = orders.filter(
    (order) =>
      String(order.invoiceNumber || order._id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.orderItems?.some((item) =>
        item?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  return (
    <div className="customer-orders-page w-full max-w-5xl mx-auto flex flex-col gap-6 md:gap-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 border-b border-white/10 pb-5 md:pb-6 mb-2 md:mb-10">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-3xl md:text-4xl mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="p-2.5 md:p-3 bg-[var(--color-gold)]/10 text-gold-gradient rounded-xl border border-[var(--color-gold)]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Package size={24} className="md:w-7 md:h-7" />
            </div>
            Order{" "}
            <span className="text-gold-gradient text-3xl sm:text-4xl md:text-5xl font-normal drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              History
            </span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-sm max-w-2xl font-light mt-2 md:mt-4 leading-relaxed">
            Review all your past purchases and trace your private collection
            history.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-3 bg-white/[0.04] border border-white/10 hover:border-[var(--color-gold)]/30 rounded-full text-[var(--color-ivory-muted)] hover:text-white transition-all shrink-0 flex items-center justify-center disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-[var(--color-gold)]" : ""} />
          </button>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-full py-3 px-5 pl-10 text-sm text-[var(--color-ivory)] placeholder:text-[var(--color-ivory-muted)]/50 focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors backdrop-blur-md"
            />
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ivory-muted)]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-gold-gradient py-20 text-center flex flex-col items-center gap-4">
          <Package className="animate-pulse opacity-50" size={40} />
          <p>Retrieving your collection...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
          <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6 shadow-inner">
            <Package
              size={32}
              className="text-[var(--color-ivory-muted)] opacity-30"
            />
          </div>
          <h2 className="text-xl font-serif text-[var(--color-ivory)] mb-2">
            No Orders Found
          </h2>
          <p className="text-[var(--color-ivory-muted)] text-sm max-w-sm mb-6 font-light">
            You haven't placed any orders yet. Discover our exclusive
            marketplace collections.
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="px-8 py-3 rounded-full bg-gold-gradient text-black font-semibold text-xs tracking-widest uppercase hover:opacity-95 transition-opacity"
          >
            Explore Market
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white/[0.02] backdrop-blur-md border border-white/[0.07] hover:border-white/10 hover:bg-white/[0.04] transition-all rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 border-b border-white/[0.05]">
                <div className="min-w-0 w-full md:w-auto">
                  <div className="text-gold-gradient text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase mb-2 font-bold truncate">
                    {order.invoiceNumber || order._id}
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--color-ivory-muted)] flex flex-wrap items-center gap-2 sm:gap-3">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span>
                      {order.orderItems?.length}{" "}
                      {order.orderItems?.length === 1 ? "Item" : "Items"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full md:w-auto sm:justify-between md:justify-end">
                  <div className="flex sm:block items-end justify-between text-left sm:text-right border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                    <div className="text-xs sm:text-sm text-[var(--color-ivory-muted)] mb-0 sm:mb-1">
                      Order Total
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="text-2xl font-serif text-[var(--color-ivory)]">
                        <Price amount={order.totalPrice} />
                      </div>
                      <div>
                        {order.isPaid || order.paymentStatus === "Paid" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            Paid & Verified
                          </span>
                        ) : order.paymentStatus === "Awaiting_Approval" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            <Clock size={13} className="text-amber-400" />
                            Awaiting Verification
                          </span>
                        ) : order.paymentStatus === "Failed" || order.paymentStatus === "Rejected" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/25">
                            <AlertCircle size={13} className="text-rose-400" />
                            Payment Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/25">
                            <Clock size={13} className="text-blue-400" />
                            Payment Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/customer/order/${order._id}`)}
                    className={`w-full sm:w-auto min-h-11 px-5 sm:px-6 py-3 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                      order.isPaid || order.paymentStatus === "Paid"
                        ? "bg-[var(--color-gold)]/10 text-gold-gradient border border-[var(--color-gold)]/30 hover:bg-gold-gradient hover:text-black shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                        : order.paymentStatus === "Awaiting_Approval"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                          : order.paymentStatus === "Failed" || order.paymentStatus === "Rejected"
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                            : "bg-gold-gradient text-black hover:opacity-90 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                    }`}
                  >
                    {order.isPaid || order.paymentStatus === "Paid" ? (
                      <>
                        <CheckCircle2 size={14} />
                        View Receipt
                      </>
                    ) : order.paymentStatus === "Awaiting_Approval" ? (
                      <>
                        <Clock size={14} />
                        View Status
                      </>
                    ) : order.paymentStatus === "Failed" || order.paymentStatus === "Rejected" ? (
                      <>
                        <AlertCircle size={14} />
                        Resubmit Proof
                      </>
                    ) : (
                      <>
                        Complete Payment
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PostNet 7-Stage Milestone Progression & Service Summary */}
              {(() => {
                const isPickup = order.deliveryPreference === 'pickup' || Boolean(order.selectedPostnetStore);
                const currentStage = (() => {
                  if (order.isDelivered || order.deliveryStatus === 'Delivered') return 7;
                  if (order.deliveryStatus === 'At Collection Point' || order.deliveryStatus === 'Out for Delivery') return 6;
                  if (order.deliveryStatus === 'In Transit') return 5;
                  if (order.deliveryStatus === 'Collected' || order.deliveryStatus === 'Dispatched') return 4;
                  if (order.deliveryStatus === 'Processing' || order.orderStatus === 'Processing') return 3;
                  if (order.isPaid || order.paymentStatus === 'Paid') return 2;
                  return 1;
                })();

                const stages = [
                  { step: 1, name: "Payment Confirmed" },
                  { step: 2, name: "Order Confirmed" },
                  { step: 3, name: "Vendor Preparing" },
                  { step: 4, name: "Collected" },
                  { step: 5, name: "In Transit" },
                  { step: 6, name: isPickup ? "At Collection Point" : "Out for Delivery" },
                  { step: 7, name: isPickup ? "Collected" : "Delivered" },
                ];

                return (
                  <div className="px-4 sm:px-6 md:px-8 py-5 bg-white/[0.015] border-b border-white/[0.05] space-y-4">
                    {/* Milestone Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20">
                            <Truck size={14} />
                          </span>
                          <span className="text-xs font-serif text-white">
                            {isPickup ? 'PostNet Store Collection' : 'PostNet Door Delivery'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[var(--color-gold)] border border-white/10">
                          Milestone {currentStage} of 7: {stages[currentStage - 1]?.name}
                        </span>
                      </div>

                      {/* Progression Steps */}
                      <div className="relative pt-2 pb-1">
                        <div className="hidden md:flex items-center justify-between relative">
                          <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/10 -z-0"></div>
                          <div
                            className="absolute top-3 left-3 h-0.5 bg-gradient-to-r from-[var(--color-gold)] to-emerald-400 -z-0 transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, ((currentStage - 1) / 6) * 100))}%` }}
                          ></div>

                          {stages.map((st) => {
                            const isDone = st.step <= currentStage;
                            const isCurrent = st.step === currentStage;
                            return (
                              <div key={st.step} className="flex flex-col items-center relative z-10 text-center w-24">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                                    isCurrent
                                      ? "bg-[var(--color-gold)] text-black ring-4 ring-[var(--color-gold)]/20 shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                                      : isDone
                                      ? "bg-emerald-500 text-black"
                                      : "bg-[#161616] text-white/40 border border-white/10"
                                  }`}
                                >
                                  {isDone && !isCurrent ? "✓" : st.step}
                                </div>
                                <span
                                  className={`text-[10px] mt-1.5 leading-tight font-medium ${
                                    isCurrent
                                      ? "text-[var(--color-gold)] font-bold"
                                      : isDone
                                      ? "text-white/80"
                                      : "text-white/30"
                                  }`}
                                >
                                  {st.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Mobile Simplified Milestone Bar */}
                        <div className="md:hidden flex flex-col gap-2">
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold-gradient transition-all"
                              style={{ width: `${(currentStage / 7) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[11px] text-white/60">
                            <span>Stage {currentStage}/7</span>
                            <span className="text-[var(--color-gold)] font-semibold">{stages[currentStage - 1]?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PostNet Pickup Store Card & Ready Alert */}
                    {isPickup && order.selectedPostnetStore && (
                      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        currentStage >= 6
                          ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                          : 'bg-white/[0.02] border-white/10'
                      }`}>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-[var(--color-gold)] flex items-center gap-1.5">
                            <MapPin size={13} />
                            {currentStage >= 6 ? 'Ready For Collection: ' : 'Designated Collection Point: '}
                            {order.selectedPostnetStore.name}
                          </div>
                          <div className="text-xs text-white/70">
                            {order.selectedPostnetStore.address}
                            {order.selectedPostnetStore.hours && ` • ${order.selectedPostnetStore.hours}`}
                          </div>
                        </div>

                        {currentStage >= 6 ? (
                          <span className="text-xs font-bold font-mono px-3 py-1 rounded-lg bg-[var(--color-gold)] text-black shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                            <ShieldCheck size={14} /> PIN Sent (Bring ID)
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-white/50 shrink-0 self-start sm:self-auto">
                            Est. 2–3 Business Days
                          </span>
                        )}
                      </div>
                    )}

                    {/* Super Coins Badges */}
                    {(order.superCoinsEarned > 0 || order.superCoinsUsed > 0) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {order.superCoinsEarned > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20">
                            <Coins size={12} /> +{order.superCoinsEarned} Super Coins ({order.isDelivered ? 'Credited to Wallet' : 'Pending Clearance on Delivery'})
                          </span>
                        )}
                        {order.superCoinsUsed > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white/[0.04] text-white/70 border border-white/10">
                            🪙 {order.superCoinsUsed} Coins Redeemed (-R{Number(order.superCoinsDiscount || 0).toFixed(2)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="p-4 sm:p-6 md:px-8 bg-black/20">
                <div className="grid grid-cols-1 md:flex gap-3 md:gap-4 md:overflow-x-auto custom-scrollbar md:pb-2">
                  {order.orderItems?.map((item, idx) => (
                    <div
                      key={idx}
                      className="w-full md:w-64 md:flex-shrink-0 bg-white/[0.025] border border-white/[0.07] rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-center"
                    >
                      <div className="w-14 h-16 sm:w-16 sm:h-16 rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0 p-1">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full object-contain"
                          />
                        ) : (
                          <Package size={20} className="text-gold-gradient" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-[var(--color-ivory)] font-medium truncate">
                          {item.name}
                        </div>
                        {item.option && (
                          <div className="text-xs text-[var(--color-ivory-muted)] mt-1 truncate">
                            {item.option}
                          </div>
                        )}
                        <div className="text-xs text-gold-gradient mt-2 font-bold">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
