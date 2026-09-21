import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api";
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import Price from "../../components/ui/Price";

export default function VendorOrderDetail({ onNotify }) {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Messaging state
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState("stock_issue");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Status & Tracking update state
  const [status, setStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/orders/vendor/sales/${id}`);
      setShipment(res.data);
      setStatus(res.data.status || "Order Confirmed");
      setTrackingNumber(res.data.trackingNumber || "");
    } catch (err) {
      console.error("Failed to load shipment details:", err);
      // Fallback: try to fetch from all sales if single fetch fails
      try {
        const fallbackRes = await api.get("/orders/vendor/sales");
        const found = (fallbackRes.data || []).find(
          (s) => (s.shipmentId || s._id) === id || s._id === id
        );
        if (found) {
          setShipment(found);
          setStatus(found.status || "Order Confirmed");
          setTrackingNumber(found.trackingNumber || "");
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr);
      }
      setError(
        err.response?.data?.message || "Failed to retrieve shipment details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setSendingMessage(true);
      setFeedback(null);
      const res = await api.post(
        `/orders/vendor/sales/${shipment._id || id}/message`,
        {
          message: messageText.trim(),
          type: messageType,
        }
      );

      setFeedback({
        type: "success",
        text: "Notice sent to customer email & orders dashboard successfully!",
      });
      if (onNotify) {
        onNotify("Notice sent to customer successfully!", "success");
      }
      setMessageText("");

      if (res.data?.orderAdminMessages) {
        setShipment((prev) => ({
          ...prev,
          adminMessages: res.data.orderAdminMessages,
          latestAdminMessage: res.data.adminMessage,
        }));
      } else {
        fetchShipment();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const msg =
        err.response?.data?.message || "Failed to send message to customer.";
      setFeedback({ type: "error", text: msg });
      if (onNotify) onNotify(msg, "error");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      setStatusFeedback(null);
      const res = await api.patch(
        `/orders/vendor/sales/${shipment._id || id}/status`,
        {
          status,
          trackingNumber: trackingNumber.trim(),
        }
      );

      setStatusFeedback({
        type: "success",
        text: "Shipment status and tracking updated successfully!",
      });
      if (onNotify) {
        onNotify("Shipment status updated!", "success");
      }
      setShipment((prev) => ({
        ...prev,
        status: res.data.status || status,
        trackingNumber: res.data.trackingNumber || trackingNumber.trim(),
      }));
    } catch (err) {
      console.error("Failed to update status:", err);
      const msg =
        err.response?.data?.message || "Failed to update shipment status.";
      setStatusFeedback({ type: "error", text: msg });
      if (onNotify) onNotify(msg, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#c99742]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c99742] mb-4"></div>
        <p className="font-serif text-lg">Retrieving Vendor Shipment Details...</p>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <AlertCircle size={48} className="mx-auto text-rose-400 mb-4" />
        <h2 className="text-2xl font-serif text-white mb-2">Shipment Not Found</h2>
        <p className="text-white/60 mb-6">
          {error || "The requested vendor shipment could not be located."}
        </p>
        <Link
          to="/vendor/orders"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xs uppercase tracking-wider font-bold"
        >
          <ArrowLeft size={16} /> Back to Vendor Orders
        </Link>
      </div>
    );
  }

  const messages = Array.isArray(shipment.adminMessages)
    ? shipment.adminMessages
    : [];

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8">
      {/* Top Header & Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            to="/vendor/orders"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#c99742] hover:text-white transition-colors mb-2 font-bold"
          >
            <ArrowLeft size={14} /> Back to Vendor Orders
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif text-white flex items-center gap-3">
              Shipment{" "}
              <span className="text-[#c99742]">
                #{shipment.shipmentId || shipment._id}
              </span>
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold/10 text-[#e1bd70] border border-gold/20">
              {shipment.status}
            </span>
            {shipment.orderRef && (
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 text-white/70 border border-white/10">
                Order #{shipment.orderRef}
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-1">
            Order Date:{" "}
            {new Date(shipment.createdAt).toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="text-left md:text-right">
          <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
            Products Total
          </div>
          <div className="text-2xl font-serif text-[#e1bd70] font-bold">
            <Price amount={shipment.vendorTotal} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Exact Admin Customer Advisory & Order Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Custom Messaging & Emergency Alert to Customer (Exact Admin Component) */}
          <div className="bg-[#120f0c] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Send size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Send Customer Notice & Emergency Advisory
                </h3>
                <p className="text-xs text-white/60">
                  Sends an instant notification to the customer's orders dashboard &
                  dispatches a branded email advisory.
                </p>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-2 font-semibold">
                  Notice Classification
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      id: "stock_issue",
                      label: "📦 Out of Stock",
                      border: "hover:border-amber-400",
                    },
                    {
                      id: "emergency",
                      label: "🚨 Emergency",
                      border: "hover:border-rose-400",
                    },
                    {
                      id: "warning",
                      label: "⚠️ Logistics Delay",
                      border: "hover:border-amber-400",
                    },
                    {
                      id: "info",
                      label: "✨ General Update",
                      border: "hover:border-[#c99742]",
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMessageType(t.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        messageType === t.id
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm"
                          : `bg-black/40 border-white/10 text-white/70 ${t.border}`
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                  Custom Message for Customer *
                </label>
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="e.g. Regrettably, bottle vintage 2018 is currently out of stock from our private cellar reserve. We can dispatch the 2019 vintage immediately or provide a full refund..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-white/40">
                  Recipient:{" "}
                  <strong className="text-white">
                    {shipment.customerEmail ||
                      shipment.customerName ||
                      "Customer"}
                  </strong>
                </span>
                <button
                  type="submit"
                  disabled={sendingMessage || !messageText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c242] to-[#c99742] hover:opacity-95 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-all shadow-md cursor-pointer"
                >
                  {sendingMessage ? (
                    <>Sending Notice...</>
                  ) : (
                    <>
                      <Send size={14} /> Send Notice
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sent Advisory History */}
            {messages.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                  Sent Advisory History ({messages.length})
                </h4>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300 uppercase tracking-wide">
                          [{msg.type || "info"}] Sent by{" "}
                          {msg.sentByName || "Vendor"}
                        </span>
                        <span className="text-white/40 font-mono">
                          {new Date(msg.sentAt).toLocaleString("en-ZA")}
                        </span>
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed mt-0.5">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Products to Pack */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm uppercase tracking-widest text-[#c99742] font-bold flex items-center gap-2">
              <Package size={16} /> Products to Pack ({shipment.items?.length || 0})
            </h3>
            <div className="divide-y divide-white/5">
              {(shipment.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="py-4 first:pt-0 last:pb-0 flex justify-between items-center gap-4"
                >
                  <div className="flex gap-4 items-center">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-contain bg-black rounded-xl border border-white/10 p-1"
                      />
                    )}
                    <div>
                      <p className="text-sm font-serif text-[var(--color-ivory)] font-medium">
                        {item.name}
                      </p>
                      {item.option && (
                        <p className="text-xs text-[var(--color-ivory-muted)] mt-1">
                          {item.option}
                        </p>
                      )}
                      <p className="text-xs text-white/40 mt-1 font-mono">
                        Qty: {item.quantity} × <Price amount={item.price} />
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#e1bd70]">
                      <Price amount={item.price * item.quantity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details & Fulfillment Management */}
        <div className="space-y-6">
          {/* Customer & Delivery Details */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#c99742] font-bold flex items-center gap-2">
              <MapPin size={14} /> Shipping & Customer Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-white">
                <User size={13} className="text-[#c99742]" />
                <span className="font-bold">{shipment.customerName}</span>
              </div>
              {shipment.customerEmail && (
                <div className="flex items-center gap-2 text-white/70">
                  <Mail size={13} className="text-[#c99742]" />
                  <span>{shipment.customerEmail}</span>
                </div>
              )}
              {shipment.customerPhone && (
                <div className="flex items-center gap-2 text-white/70">
                  <Phone size={13} className="text-[#c99742]" />
                  <span>{shipment.customerPhone}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/5 text-white/60">
                Courier:{" "}
                <strong className="text-white">
                  {shipment.courierName || "Vendor Managed"}
                </strong>
              </div>
            </div>

            {shipment.deliveryPreference === "postnet" &&
            shipment.selectedPostnetStore ? (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-1">
                <div className="text-amber-400 font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                  <MapPin size={12} /> PostNet Collection Point
                </div>
                <div className="text-white font-medium">
                  {shipment.selectedPostnetStore.name}
                </div>
                <div className="text-white/70">
                  {shipment.selectedPostnetStore.address}
                </div>
                {shipment.selectedPostnetStore.telephone && (
                  <div className="text-white/50">
                    Tel: {shipment.selectedPostnetStore.telephone}
                  </div>
                )}
              </div>
            ) : null}

            {shipment.deliveryAddress ? (
              <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-white/80 leading-relaxed">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1 font-semibold">
                  Delivery Address
                </div>
                {shipment.deliveryAddress.address}
                <br />
                {shipment.deliveryAddress.city},{" "}
                {shipment.deliveryAddress.postalCode}
                <br />
                {shipment.deliveryAddress.country}
              </div>
            ) : null}
          </div>

          {/* Fulfillment Status & Tracking */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#c99742] font-bold flex items-center gap-2">
              <Truck size={14} /> Fulfillment Status & Tracking
            </h3>

            {statusFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusFeedback.type === "success"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                }`}
              >
                {statusFeedback.type === "success" ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>{statusFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                  Shipment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Order Confirmed">Order Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Collected">Collected</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                  Waybill / Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. PN-123456789 or WAYBILL-998"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
              >
                {updatingStatus ? (
                  <>Updating...</>
                ) : (
                  <>
                    <ShieldCheck size={14} /> Update Shipment Status
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
