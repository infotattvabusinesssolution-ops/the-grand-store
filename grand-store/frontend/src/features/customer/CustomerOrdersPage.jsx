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
  AlertTriangle,
  MessageSquare,
  Bell,
  Gift,
  XCircle,
  Loader2,
} from "lucide-react";
import Price from "../../components/ui/Price";
import ProductIssueModal from "./ProductIssueModal";

export default function CustomerOrdersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [customerTickets, setCustomerTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("active");
  const [cancellingId, setCancellingId] = useState(null);
  const [issueModal, setIssueModal] = useState({
    isOpen: false,
    order: null,
    productItem: null,
    initialTicket: null
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      const res = await api.get('/tickets/my-tickets');
      if (res.data?.success) {
        setCustomerTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.warn('Could not fetch support tickets:', err);
    }
  };

  const fetchOrders = async (isManual = false) => {
    if (user) {
      if (isManual) setRefreshing(true);
      try {
        const [{ data: ordersData }] = await Promise.all([
          api.get(`/orders/myorders`),
          fetchTickets()
        ]);
        setOrders(ordersData);
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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this unpaid order? Any redeemed SuperCoins will be immediately refunded to your wallet.")) return;
    setCancellingId(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel-payment`, { reason: 'Cancelled by customer' });
      await fetchOrders(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const activeOrdersCount = orders.filter(o => o.isPaid || o.paymentStatus === 'Paid').length;
  const pendingOrdersCount = orders.filter(o => !o.isPaid && !['cancelled', 'failed'].includes((o.paymentStatus || '').toLowerCase())).length;
  const cancelledOrdersCount = orders.filter(o => ['cancelled', 'failed'].includes((o.paymentStatus || '').toLowerCase())).length;

  const filteredOrders = orders
    .filter((order) => {
      const isPaid = Boolean(order.isPaid || order.paymentStatus === 'Paid');
      const isCancelled = ['cancelled', 'failed'].includes((order.paymentStatus || '').toLowerCase());
      const isPending = !isPaid && !isCancelled;

      if (statusTab === 'active') return isPaid;
      if (statusTab === 'pending') return isPending;
      if (statusTab === 'cancelled') return isCancelled;
      return true;
    })
    .filter(
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

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        <button
          onClick={() => setStatusTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusTab === 'active'
              ? 'bg-[var(--color-gold)] text-black shadow-md'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          <CheckCircle2 size={13} /> Active Purchases ({activeOrdersCount})
        </button>

        {pendingOrdersCount > 0 && (
          <button
            onClick={() => setStatusTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusTab === 'pending'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <Clock size={13} /> Awaiting Payment ({pendingOrdersCount})
          </button>
        )}

        {cancelledOrdersCount > 0 && (
          <button
            onClick={() => setStatusTab('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusTab === 'cancelled'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <AlertCircle size={13} /> Cancelled ({cancelledOrdersCount})
          </button>
        )}

        <button
          onClick={() => setStatusTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
            statusTab === 'all'
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          All ({orders.length})
        </button>

        <button
          onClick={() => setStatusTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusTab === 'tickets'
              ? 'bg-amber-500 text-black shadow-md'
              : customerTickets.length > 0
                ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/40'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          <MessageSquare size={13} className={customerTickets.length > 0 ? "text-amber-400" : ""} />
          Support Cases ({customerTickets.length})
        </button>
      </div>

      {loading ? (
        <div className="text-gold-gradient py-20 text-center flex flex-col items-center gap-4">
          <Package className="animate-pulse opacity-50" size={40} />
          <p>Retrieving your collection...</p>
        </div>
      ) : statusTab === 'tickets' ? (
        customerTickets.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
              <ShieldCheck size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-serif text-white mb-2">No Active Incidents or Cases</h2>
            <p className="text-[var(--color-ivory-muted)] text-xs max-w-sm mb-6 font-light">
              All your paid shipments are safeguarded by Grand Store Logistics. If you ever experience a broken bottle, delivery delay, or transit issue, you can report it directly from any order item.
            </p>
            <button
              onClick={() => setStatusTab('active')}
              className="px-6 py-2.5 rounded-full bg-[var(--color-gold)] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition-all cursor-pointer"
            >
              View Active Orders
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {customerTickets.map((ticket) => {
              const matchedOrder = orders.find(o => String(o._id) === String(ticket.order?._id || ticket.order));
              const lastMsg = ticket.conversation?.[ticket.conversation.length - 1];
              const getTicketStatusBadge = (status) => {
                switch (status) {
                  case 'courier_traced':
                    return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold">Courier Trace In Progress</span>;
                  case 'reshipped':
                    return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">Replacement Reshipped</span>;
                  case 'refunded':
                    return <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-mono font-bold">Refund Issued</span>;
                  case 'resolved':
                  case 'closed':
                    return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">Case Resolved</span>;
                  default:
                    return <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-mono font-bold animate-pulse">Under Priority Investigation</span>;
                }
              };

              return (
                <div
                  key={ticket._id}
                  className="bg-white/[0.02] backdrop-blur-md border border-white/10 hover:border-amber-500/30 transition-all rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-16 h-20 rounded-xl bg-black border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {ticket.orderItem?.image ? (
                        <img src={ticket.orderItem.image} alt={ticket.orderItem.name} className="h-full object-contain" />
                      ) : (
                        <Package size={24} className="text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono font-bold text-white text-xs">#{ticket.ticketNumber}</span>
                        {getTicketStatusBadge(ticket.status)}
                        <span className="text-[10px] text-white/40 font-mono">
                          Order #{ticket.orderId || ticket.order?._id || 'N/A'}
                        </span>
                      </div>
                      <h3 className="text-sm font-serif font-bold text-[var(--color-ivory)] truncate">
                        {ticket.orderItem?.name || ticket.subject}
                      </h3>
                      <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1">
                        <strong>Issue:</strong> {ticket.subject}
                      </p>
                      {lastMsg && (
                        <div className="mt-2 text-[11px] text-white/70 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 line-clamp-1 flex items-center gap-2">
                          <span className="font-bold text-amber-300 shrink-0">{lastMsg.senderName}:</span>
                          <span className="truncate">{lastMsg.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => setIssueModal({
                        isOpen: true,
                        order: matchedOrder || ticket.order || { _id: ticket.orderId, orderId: ticket.orderId },
                        productItem: ticket.orderItem,
                        initialTicket: ticket
                      })}
                      className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[var(--color-gold)] hover:brightness-110 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <MessageSquare size={14} /> Open Concierge Thread
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
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
                        ) : order.paymentStatus === "Cancelled" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/25">
                            <AlertCircle size={13} className="text-rose-400" />
                            Cancelled
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
                  {order.isPaid || order.paymentStatus === "Paid" ? (
                    <button
                      onClick={() => navigate(`/customer/order/${order._id}`)}
                      className="w-full sm:w-auto min-h-11 px-5 sm:px-6 py-3 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-[var(--color-gold)]/10 text-gold-gradient border border-[var(--color-gold)]/30 hover:bg-gold-gradient hover:text-black shadow-[0_0_15px_rgba(212,175,55,0.1)] cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      View Receipt
                    </button>
                  ) : order.paymentStatus === "Cancelled" ? (
                    <button
                      onClick={() => navigate(`/customer/order/${order._id}`)}
                      className="w-full sm:w-auto min-h-11 px-5 sm:px-6 py-3 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <AlertCircle size={14} />
                      Order Details
                    </button>
                  ) : order.paymentStatus === "Awaiting_Approval" ? (
                    <button
                      onClick={() => navigate(`/customer/order/${order._id}`)}
                      className="w-full sm:w-auto min-h-11 px-5 sm:px-6 py-3 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer"
                    >
                      <Clock size={14} />
                      View Status
                    </button>
                  ) : order.paymentStatus === "Failed" || order.paymentStatus === "Rejected" ? (
                    <button
                      onClick={() => navigate(`/customer/order/${order._id}`)}
                      className="w-full sm:w-auto min-h-11 px-5 sm:px-6 py-3 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 cursor-pointer"
                    >
                      <AlertCircle size={14} />
                      Resubmit Proof
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => navigate(`/customer/order/${order._id}`)}
                        className="w-full sm:w-auto min-h-11 px-5 sm:px-6 py-3 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-gold-gradient text-black hover:opacity-90 shadow-[0_0_20px_rgba(212,175,55,0.25)] cursor-pointer"
                      >
                        Complete Payment
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className="w-full sm:w-auto min-h-11 px-4 py-3 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-stone-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 bg-white/[0.02] cursor-pointer disabled:opacity-50"
                        title="Cancel this unpaid order and refund any redeemed coins"
                      >
                        {cancellingId === order._id ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Status Banner & Concierge Advisory */}
              {(() => {
                const isPickup = order.deliveryPreference === 'pickup' || Boolean(order.selectedPostnetStore);
                const isOrderPaid = Boolean(order.isPaid || order.paymentStatus === 'Paid');
                const isOrderCancelled = Boolean(order.paymentStatus === 'Cancelled' || order.paymentStatus === 'Failed');
                // Mongoose supplies a default notice object even when no message was sent.
                const latestMsg = [
                  order.latestAdminMessage,
                  ...(Array.isArray(order.adminMessages) ? [...order.adminMessages].reverse() : []),
                ].find((notice) => typeof notice?.message === 'string' && notice.message.trim());

                if (isOrderCancelled) {
                  return (
                    <div className="px-4 sm:px-6 md:px-8 py-5 bg-white/[0.015] border-b border-white/[0.05]">
                      <div className="p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border bg-rose-950/20 border-rose-500/30">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="p-2.5 rounded-xl border shrink-0 mt-0.5 sm:mt-0 bg-rose-500/15 text-rose-400 border-rose-500/30">
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-rose-400">
                              Order Cancelled • Payment Aborted
                            </div>
                            <h4 className="text-sm sm:text-base font-serif font-bold text-white mt-0.5">
                              Payment was not completed — Order Inactive
                            </h4>
                            <p className="text-xs text-white/70 mt-1">
                              This payment transaction was cancelled. No money was charged and no shipment or fulfillment is scheduled.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            🚫 Cancelled
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="px-4 sm:px-6 md:px-8 py-5 bg-white/[0.015] border-b border-white/[0.05] space-y-4">
                    {/* Primary Order Delivery Status Banner */}
                    <div className={`p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all ${
                      isOrderPaid
                        ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30"
                        : "bg-gradient-to-r from-amber-950/40 via-amber-900/15 to-transparent border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                    }`}>
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 sm:mt-0 ${
                          isOrderPaid
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                        }`}>
                          {isOrderPaid ? (isPickup ? <MapPin size={20} /> : <Truck size={20} />) : <Clock size={20} />}
                        </div>
                        <div>
                          <div className={`text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                            isOrderPaid ? "text-amber-400/90" : "text-amber-400"
                          }`}>
                            {isOrderPaid ? "Fulfillment Status" : "Awaiting Payment"}
                          </div>
                          <h4 className="text-sm sm:text-base font-serif font-bold text-white mt-0.5">
                            {isOrderPaid
                              ? (isPickup
                                  ? "Your order has been received — Arriving at your PostNet collection branch"
                                  : "Your order has been received — Delivery Soon")
                              : "Complete payment to confirm order and initiate dispatch"}
                          </h4>
                          <p className="text-xs text-white/70 mt-1">
                            {isPickup ? (
                              order.selectedPostnetStore ? (
                                <>
                                  Collection Point: <span className="text-[var(--color-gold)] font-medium">{order.selectedPostnetStore.name}</span> ({order.selectedPostnetStore.address})
                                  {!isOrderPaid && " — Dispatch preparation starts upon payment confirmation."}
                                </>
                              ) : (
                                isOrderPaid
                                  ? "Your parcel will arrive at your designated PostNet counter. Real-time collection PIN will be dispatched via SMS & Email."
                                  : "Parcel will be dispatched to your designated PostNet counter upon payment confirmation."
                              )
                            ) : (
                              <>
                                Deliver to: <span className="text-white/90 font-medium">{order.shippingAddress?.address ? `${order.shippingAddress.address}, ${order.shippingAddress.city || ''}` : 'Your delivery address on record'}</span>
                                {!isOrderPaid && " — Dispatch preparation starts upon payment confirmation."}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
                        {isOrderPaid ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Order Received
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                              <Clock size={13} className="text-amber-400" />
                              Awaiting Payment
                            </span>
                            <button
                              onClick={() => navigate(`/customer/order/${order._id}`)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--color-gold)] text-black hover:opacity-90 transition-all flex items-center gap-1 shadow-md cursor-pointer"
                            >
                              Pay Now <ChevronRight size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Admin / Concierge Custom Advisory Notice (Out of Stock / Emergency Alerts) */}
                    {latestMsg && (
                      <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
                        latestMsg.type === 'emergency' || latestMsg.type === 'stock_issue'
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                          : latestMsg.type === 'warning'
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                          : 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono">
                            <AlertTriangle size={15} className="shrink-0" />
                            <span>
                              {latestMsg.type === 'stock_issue'
                                ? '⚠️ Out of Stock / Fulfillment Notice'
                                : latestMsg.type === 'emergency'
                                ? '🚨 Urgent Order Advisory'
                                : latestMsg.type === 'warning'
                                ? '⚠️ Important Delivery Notice'
                                : '💬 Concierge Message'}
                            </span>
                          </div>
                          {latestMsg.sentAt && (
                            <span className="text-[10px] font-mono opacity-60">
                              {new Date(latestMsg.sentAt).toLocaleDateString()} {new Date(latestMsg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans pl-6 border-l-2 border-current/30">
                          {latestMsg.message}
                        </p>
                        <div className="text-[11px] opacity-70 pl-6 flex items-center justify-between">
                          <span>Sent by: {latestMsg.sentByName || 'The Grand Store Concierge'}</span>
                          <span className="font-mono">Inquiry: concierge@grandstore.co.za</span>
                        </div>
                      </div>
                    )}

                    {/* PostNet Store Details Card */}
                    {isPickup && order.selectedPostnetStore && (
                      <div className="p-3.5 rounded-xl border bg-white/[0.02] border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-[var(--color-gold)] flex items-center gap-1.5">
                            <MapPin size={13} />
                            Designated Collection Point: {order.selectedPostnetStore.name}
                          </div>
                          <div className="text-xs text-white/70">
                            {order.selectedPostnetStore.address}
                            {order.selectedPostnetStore.hours && ` • ${order.selectedPostnetStore.hours}`}
                          </div>
                        </div>
                        {isOrderPaid && (
                          <span className="text-[11px] font-mono shrink-0 self-start sm:self-auto text-white/50">
                            Est. 2–3 Business Days
                          </span>
                        )}
                      </div>
                    )}

                    {/* Super Coins Badges */}
                    {(order.superCoinsEarned > 0 || order.superCoinsUsed > 0) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {order.superCoinsEarned > 0 && !isOrderCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20">
                            <Coins size={12} /> +{order.superCoinsEarned} Super Coins {order.isDelivered ? '(Credited to Wallet)' : ''}
                          </span>
                        )}
                        {order.superCoinsUsed > 0 && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border ${
                            isOrderCancelled
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-white/[0.04] text-white/70 border border-white/10"
                          }`}>
                            🪙 {order.superCoinsUsed} Coins {isOrderCancelled ? 'Refunded to Wallet' : `Redeemed (-R${Number(order.superCoinsDiscount || 0).toFixed(2)})`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Gift Order Badge */}
                    {order.isGift && (
                      <div className="p-3 rounded-xl border bg-[var(--color-gold)]/5 border-[var(--color-gold)]/20 space-y-1">
                        <div className="text-xs font-bold text-[var(--color-gold)] flex items-center gap-1.5">
                          <Gift size={13} />
                          Gift Order {order.giftRecipientName ? `for ${order.giftRecipientName}` : ''}
                        </div>
                        {order.giftMessage && (
                          <div className="text-xs text-white/70 italic bg-black/40 p-2 rounded-lg border border-white/5">
                            "{order.giftMessage}"
                          </div>
                        )}
                      </div>
                    )}

                    {/*
                    ========================================================================
                    [COMMENTED OUT FOR NOW AS REQUESTED - 7-STAGE PROGRESSION TIMELINE]
                    ========================================================================
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
                          Milestone 7-Stage Tracking
                        </span>
                      </div>
                    </div>
                    ========================================================================
                    */}
                  </div>
                );
              })()}

              <div className="p-4 sm:p-6 md:px-8 bg-black/20">
                <div className="grid grid-cols-1 md:flex gap-3 md:gap-4 md:overflow-x-auto custom-scrollbar md:pb-2">
                  {order.orderItems?.map((item, idx) => {
                    const isPaidOrder = Boolean(order.isPaid || order.paymentStatus === 'Paid');
                    const matchingTicket = customerTickets.find(t => 
                      String(t.order?._id || t.order) === String(order._id) &&
                      (String(t.orderItem?.product) === String(item.product) || String(t.orderItem?.name) === String(item.name))
                    );

                    return (
                      <div
                        key={idx}
                        className="w-full md:w-72 md:flex-shrink-0 bg-white/[0.025] border border-white/[0.07] rounded-xl p-3 sm:p-4 flex flex-col justify-between"
                      >
                        <div className="flex gap-3 sm:gap-4 items-center">
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

                        {/* Customer Support & Incident Reporting (Flipkart / Amazon Style) */}
                        {isPaidOrder && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 w-full">
                            {matchingTicket ? (
                              <button
                                onClick={() => setIssueModal({
                                  isOpen: true,
                                  order,
                                  productItem: item,
                                  initialTicket: matchingTicket
                                })}
                                className="w-full py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <MessageSquare size={12} className="animate-pulse text-amber-400" />
                                <span className="truncate">#{matchingTicket.ticketNumber} • {matchingTicket.status.replace('_', ' ')}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setIssueModal({
                                  isOpen: true,
                                  order,
                                  productItem: item,
                                  initialTicket: null
                                })}
                                className="w-full py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <AlertTriangle size={12} className="text-amber-400" />
                                <span>Need Help with Item?</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Customer Support & Incident Modal */}
      <ProductIssueModal
        isOpen={issueModal.isOpen}
        onClose={() => setIssueModal(prev => ({ ...prev, isOpen: false }))}
        order={issueModal.order}
        productItem={issueModal.productItem}
        initialTicket={issueModal.initialTicket}
        onTicketCreated={(newTicket) => {
          fetchTickets();
          setIssueModal(prev => ({ ...prev, initialTicket: newTicket }));
        }}
      />
    </div>
  );
}
