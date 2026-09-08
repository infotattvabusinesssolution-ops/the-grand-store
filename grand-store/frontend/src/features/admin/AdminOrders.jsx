import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import {
  ShoppingBag,
  Package,
  MapPin,
  Search,
  Truck,
  User,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
} from "lucide-react";
import Price from '../../components/ui/Price';

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'retail' | 'vendor'

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/admin/all?tab=${activeTab}`);
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to fetch admin orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, activeTab]);

  const filteredOrders = orders.filter((ord) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const ref = String(ord.invoiceNumber || ord.orderId || ord._id).toLowerCase();
    const name = String(ord.customerName || ord.guestInfo?.name || "").toLowerCase();
    const email = String(ord.customerEmail || ord.guestInfo?.email || "").toLowerCase();
    const phone = String(ord.customerPhone || ord.guestInfo?.phone || "").toLowerCase();
    const city = String(ord.shippingAddress?.city || ord.selectedPostnetStore?.city || "").toLowerCase();
    const itemsMatch = (ord.orderItems || []).some((item) =>
      String(item.name || "").toLowerCase().includes(term)
    );
    return ref.includes(term) || name.includes(term) || email.includes(term) || phone.includes(term) || city.includes(term) || itemsMatch;
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-3xl md:text-4xl mb-2 flex items-center gap-4">
            <div className="p-3 bg-[var(--color-gold)]/10 text-[#e1bd70] rounded-xl border border-[var(--color-gold)]/20 shadow-sm">
              <ShoppingBag size={28} />
            </div>
            Customer{" "}
            <span className="text-[#c9a35b] ml-2">Order Management</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-sm max-w-2xl font-light">
            Monitor incoming customer orders, review checkout KYC documents, manage PostNet & courier fulfillment, and send emergency advisories.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by Order ID, Customer, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-full py-3 px-5 pl-10 text-sm text-[var(--color-ivory)] placeholder:text-[var(--color-ivory-muted)]/50 focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
          />
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ivory-muted)]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-4">
        {[
          { id: 'all', label: 'All Customer Orders' },
          { id: 'paid', label: '✓ Paid Orders' },
          { id: 'pending', label: '⏳ Pending Payment' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#f5c242] to-[#c99742] text-black shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#e1bd70] p-16 text-center font-serif text-lg flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#c99742]"></div>
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
          <Truck
            size={48}
            className="mx-auto mb-4 text-[var(--color-ivory-muted)] opacity-20"
          />
          <p className="text-[var(--color-ivory-muted)] text-lg">
            No orders found for the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((ord) => {
            const orderRef = ord.invoiceNumber || ord.orderId || ord._id;
            const isPostNet = ord.deliveryPreference === "postnet" || Boolean(ord.selectedPostnetStore?.name);
            const totalItems = (ord.orderItems || []).length;
            const retailCount = ord.retailItemsCount || (ord.orderItems || []).filter(i => !i.vendorId).length;

            return (
              <div
                key={ord._id}
                className="bg-white/[0.02] border border-white/10 hover:border-[#c99742]/40 rounded-2xl overflow-hidden transition-all shadow-lg"
              >
                {/* Order Top Bar */}
                <div className="bg-black/50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 gap-4">
                  <div className="flex flex-wrap items-center gap-4 md:gap-8">
                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-0.5">
                        Order Reference
                      </div>
                      <div className="text-sm font-bold text-[#e1bd70] font-mono">
                        #{orderRef}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-0.5">
                        Date
                      </div>
                      <div className="text-xs text-white">
                        {new Date(ord.createdAt).toLocaleDateString("en-ZA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-0.5">
                        Payment Status
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.isPaid || ord.paymentStatus === "Paid"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : ord.paymentStatus === "Awaiting_Approval"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      }`}>
                        {ord.isPaid || ord.paymentStatus === "Paid" ? "✓ Paid" : ord.paymentStatus || "Pending"}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-0.5">
                        Delivery Method
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPostNet
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                      }`}>
                        {isPostNet ? "📍 PostNet Collection" : "🚚 Door Delivery"}
                      </span>
                    </div>

                    {ord.isGift && (
                      <div>
                        <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                          Gift Packaging
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40">
                          <Gift size={11} /> Gift Order
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-0.5">
                      Total Paid (Incl. VAT)
                    </div>
                    <div className="text-lg font-serif text-[#e1bd70] font-bold">
                      <Price amount={ord.totalPrice} />
                    </div>
                  </div>
                </div>

                {/* Card Content Grid */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Customer Information Column */}
                  <div className="border-r border-white/5 pr-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs uppercase tracking-widest text-[#c99742] font-bold flex items-center gap-1.5">
                        <User size={13} /> Customer Details
                      </h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        ord.isGuest ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {ord.isGuest ? "Guest Checkout" : "VIP Member"}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white">{ord.customerName}</p>
                      {ord.customerEmail && (
                        <p className="text-xs text-white/70 mt-0.5">{ord.customerEmail}</p>
                      )}
                      {ord.customerPhone && (
                        <p className="text-xs text-white/50 mt-0.5">📞 {ord.customerPhone}</p>
                      )}
                    </div>

                    {/* Destination Preview */}
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">
                        {isPostNet ? "Collection Branch" : "Shipping Address"}
                      </p>
                      {isPostNet ? (
                        <p className="text-xs text-white font-medium">
                          {ord.selectedPostnetStore?.name || "PostNet Branch"} • {ord.selectedPostnetStore?.city || ord.shippingAddress?.city}
                        </p>
                      ) : (
                        <p className="text-xs text-white font-medium leading-tight">
                          {ord.shippingAddress?.address}, {ord.shippingAddress?.city}
                        </p>
                      )}
                    </div>

                    {ord.isGift && (
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Gift size={12} /> Gift For: <span className="text-white">{ord.giftRecipientName || 'Recipient'}</span>
                        </div>
                        {ord.giftMessage && (
                          <p className="text-xs text-white/80 italic bg-black/40 p-2 rounded-lg border border-white/5">
                            "{ord.giftMessage}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Items Composition Column */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-widest text-[#c99742] font-bold flex items-center gap-1.5">
                      <Package size={13} /> Order Items ({retailCount || totalItems} items)
                    </h4>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-3 py-1 rounded-lg bg-[#c99742]/10 border border-[#c99742]/30 text-xs font-semibold text-[#c99742] flex items-center gap-1.5">
                        <ShoppingBag size={12} /> {retailCount || totalItems} Store {retailCount === 1 ? "Product" : "Products"}
                      </span>
                    </div>

                    <div className="text-xs text-white/70 space-y-1 pt-2">
                      {(ord.orderItems || []).slice(0, 2).map((item, idx) => (
                        <div key={idx} className="truncate">
                          • {item.quantity}x {item.name}
                        </div>
                      ))}
                      {totalItems > 2 && (
                        <p className="text-[11px] text-white/40 italic">+{totalItems - 2} more items</p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions & Latest Advisory Notice */}
                  <div className="flex flex-col justify-between gap-4 border-l border-white/5 pl-4">
                    {ord.latestAdminMessage ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          <Send size={11} /> Sent Advisory Notice
                        </div>
                        <p className="text-xs text-white/90 line-clamp-2 leading-tight">
                          "{ord.latestAdminMessage.message}"
                        </p>
                        <span className="text-[10px] text-white/40 block">
                          {new Date(ord.latestAdminMessage.sentAt).toLocaleDateString('en-ZA')}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/40 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        <span>Ready for processing & fulfillment.</span>
                      </div>
                    )}

                    <Link
                      to={`/admin/orders/${ord._id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#f5c242] to-[#c99742] hover:opacity-95 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md mt-auto"
                    >
                      <span>View Order Details</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
