import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ShoppingBag,
  Package,
  MapPin,
  Search,
  Truck,
  Navigation,
  ExternalLink,
  Send,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { formatCartPrice } from "../../data";
import Price from '../../components/ui/Price';
import api from '../../api';

export default function VendorOrders() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [vendorProfile, setVendorProfile] = useState(null);
  const [postnetStores, setPostnetStores] = useState(null);
  const [postnetLoading, setPostnetLoading] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await api.get(`/orders/vendor/sales`);
        const data = res.data;
        setShipments(data);

        // Also fetch vendor profile to get address for PostNet Locator
        const profRes = await api.get(`/vendor/shipping-profile`);
        const profData = profRes.data;
        setVendorProfile(profData);
      } catch (error) {
        console.error("Failed to fetch sales or profile", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchSales();
    }
  }, [user]);

  // Fetch PostNet stores when vendor profile is loaded and has an address
  useEffect(() => {
    const fetchPostnetStores = async () => {
      if (!vendorProfile?.pickupAddress) return;
      const addr = vendorProfile.pickupAddress;
      const addressString = `${addr.city || ""}, ${addr.country || "South Africa"}`;

      try {
        setPostnetLoading(true);
        let queryParams = `address=${encodeURIComponent(addressString)}`;
        if (addr.lat && addr.lng) {
            queryParams += `&lat=${addr.lat}&lng=${addr.lng}`;
        }
        const res = await api.get(`/postnet/locator?${queryParams}`);
        const data = res.data;
        if (data.stores) {
          setPostnetStores(data.stores);
        }
      } catch (error) {
        console.error("Failed to fetch PostNet stores:", error);
      } finally {
        setPostnetLoading(false);
      }
    };

    fetchPostnetStores();
  }, [vendorProfile, user.token]);

  const goldTextClass =
    "text-[#c9a35b] ";
  const filteredShipments = shipments.filter(
    (shp) =>
      (shp.shipmentId || shp._id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (shp.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-4xl mb-2 flex items-center gap-4">
            <div className="p-3 bg-[var(--color-gold)]/10 text-[#e1bd70] rounded-xl border border-[var(--color-gold)]/20 ">
              <ShoppingBag size={28} />
            </div>
            Fulfillment{" "}
            <span className={`${goldTextClass} ml-2`}>Shipments</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-sm max-w-2xl font-light">
            Manage your outgoing shipments. Orders containing items from
            multiple vendors are split into individual shipments automatically.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search by Shipment ID or Customer..."
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

      {loading ? (
        <div className="text-[#e1bd70] p-10 text-center">
          Loading your shipments...
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
          <Truck
            size={48}
            className="mx-auto mb-4 text-[var(--color-ivory-muted)] opacity-20"
          />
          <p className="text-[var(--color-ivory-muted)] text-lg">
            No shipments found.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* PostNet Drop-off Stores Widget */}
          {postnetLoading ? (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center text-sm text-[var(--color-ivory-muted)]">
              Locating nearest PostNet stores for drop-off...
            </div>
          ) : postnetStores && postnetStores.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-[var(--color-gold)]/20 rounded-2xl p-6 shadow-lg shadow-[var(--color-gold)]/5 flex items-center justify-center min-h-[100px]">
              <p className="text-[var(--color-ivory-muted)] text-sm">No nearby PostNet stores found within 50km.</p>
            </div>
          ) : (
            postnetStores &&
            postnetStores.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[var(--color-gold)]/20 rounded-2xl p-6 shadow-lg shadow-[var(--color-gold)]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-lg">
                    <Navigation size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-[var(--color-ivory)]">
                      Nearest PostNet Drop-off Locations
                    </h3>
                    <p className="text-xs text-[var(--color-ivory-muted)]">
                      Based on your pickup address:{" "}
                      {vendorProfile?.pickupAddress?.city}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  {postnetStores.map((store, idx) => (
                    <div
                      key={idx}
                      className="bg-white/[0.02] border border-white/10 hover:border-[var(--color-gold)]/30 rounded-xl p-4 transition-colors group"
                    >
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.store + ' ' + store.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-between items-start gap-2"
                      >
                        <h4 className="text-sm font-bold text-[var(--color-ivory)] mb-1 group-hover:text-[#e1bd70] transition-colors">
                          {store.store}
                        </h4>
                        <ExternalLink size={14} className="text-[var(--color-ivory-muted)] opacity-50 group-hover:text-[var(--color-gold)] transition-colors mt-0.5 flex-shrink-0" />
                      </a>
                      <p className="text-xs text-[var(--color-ivory-muted)] mb-3 leading-relaxed">
                        {store.address}
                      </p>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-xs font-mono text-[var(--color-gold)]">
                          {store.telephone}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest bg-[var(--color-gold)]/10 text-[var(--color-gold)] px-2 py-1 rounded">
                          {store.distance ? store.distance.toFixed(1) : "?"} KM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          <div className="space-y-6">
            {filteredShipments.map((shp) => (
              <div
                key={shp._id}
                className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all"
              >
                {/* Shipment Header */}
                <div className="bg-black/40 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 gap-4">
                  <div className="flex flex-col md:flex-row gap-2 md:gap-8">
                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                        Shipment ID
                      </div>
                      <div className="text-sm text-[#e1bd70] font-bold">
                        {shp.shipmentId || shp._id}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                        Date
                      </div>
                      <div className="text-sm text-[var(--color-ivory)] font-serif">
                        {new Date(shp.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                        Status
                      </div>
                      <div className="text-sm text-[var(--color-ivory)] font-medium px-2 py-1 bg-gold/10 text-gold rounded border border-gold/20 inline-block">
                        {shp.status}
                      </div>
                    </div>
                    {shp.latestAdminMessage && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-0.5 max-w-xs">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                          <Send size={10} /> Sent Advisory Notice
                        </div>
                        <p className="text-xs text-white/90 truncate leading-tight">
                          "{shp.latestAdminMessage.message}"
                        </p>
                        <span className="text-[9px] text-white/40 block font-mono">
                          {new Date(shp.latestAdminMessage.sentAt).toLocaleDateString('en-ZA')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                      Products Total
                    </div>
                    <div className="text-xl font-serif text-[#e1bd70]">
                      <Price amount={shp.vendorTotal} />
                    </div>
                  </div>
                </div>

                {/* Order Details Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Customer Info */}
                  <div className="col-span-1 border-r border-white/5 pr-4">
                    <h4 className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-4 flex items-center gap-2">
                      <MapPin size={14} className="text-[#e1bd70]" />{" "}
                      Shipping Details
                    </h4>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[var(--color-ivory)]">
                        {shp.customerName}
                      </p>
                      <p className="text-xs text-[var(--color-ivory-muted)]">
                        Courier: {shp.courierName}
                      </p>
                      {shp.customerPhone && (
                        <p className="text-xs text-[var(--color-ivory-muted)]">
                          Phone: {shp.customerPhone}
                        </p>
                      )}
                      {shp.customerEmail && (
                        <p className="text-xs text-[var(--color-ivory-muted)]">
                          Email: {shp.customerEmail}
                        </p>
                      )}
                    </div>

                    {shp.deliveryPreference === 'postnet' && shp.selectedPostnetStore ? (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-1">
                        <div className="text-amber-400 font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                          <MapPin size={12} /> PostNet Collection Point
                        </div>
                        <div className="text-white font-medium">{shp.selectedPostnetStore.name}</div>
                        <div className="text-white/70">{shp.selectedPostnetStore.address}</div>
                        {shp.selectedPostnetStore.telephone && (
                          <div className="text-white/50">Tel: {shp.selectedPostnetStore.telephone}</div>
                        )}
                      </div>
                    ) : null}

                    {shp.deliveryAddress ? (
                      <div className="mt-4 text-sm text-[var(--color-ivory-muted)] leading-relaxed">
                        {shp.deliveryAddress.address}
                        <br />
                        {shp.deliveryAddress.city},{" "}
                        {shp.deliveryAddress.postalCode}
                        <br />
                        {shp.deliveryAddress.country}
                      </div>
                    ) : (
                      <div className="mt-4 text-xs italic text-[var(--color-ivory-muted)] opacity-50">
                        No shipping address provided
                      </div>
                    )}

                    {shp.trackingNumber && (
                      <div className="mt-4 p-3 bg-white/5 rounded border border-white/10">
                        <p className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                          Tracking Number
                        </p>
                        <p className="text-sm text-gold font-mono">
                          {shp.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-4 flex items-center gap-2">
                      <Package size={14} className="text-[#e1bd70]" />{" "}
                      Products to Pack
                    </h4>
                    <div className="space-y-4">
                      {shp.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 last:pb-0"
                        >
                          <div className="flex gap-4 items-center">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-contain bg-black rounded border border-white/10 p-1"
                              />
                            )}
                            <div>
                              <p className="text-sm font-serif text-[var(--color-ivory)]">
                                {item.name}
                              </p>
                              {item.option && (
                                <p className="text-xs text-[var(--color-ivory-muted)] mt-1">
                                  {item.option}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[var(--color-ivory)]">
                              {item.quantity} × <Price amount={item.price} />
                            </div>
                            <div className="text-xs font-bold text-[#e1bd70] mt-1">
                              <Price amount={item.price * item.quantity} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exact Admin Customer Notice & Advisory Section */}
                <ShipmentAdvisorySection
                  shipment={shp}
                  onNoticeSent={(shipmentId, updatedData) => {
                    setShipments((prev) =>
                      prev.map((s) => {
                        if (s._id === shipmentId) {
                          return {
                            ...s,
                            adminMessages: updatedData.adminMessages || s.adminMessages,
                            latestAdminMessage: updatedData.latestAdminMessage || s.latestAdminMessage,
                          };
                        }
                        return s;
                      })
                    );
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ShipmentAdvisorySection({ shipment, onNoticeSent }) {
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState("stock_issue");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setSendingMessage(true);
      setFeedback(null);
      const res = await api.post(`/orders/vendor/sales/${shipment._id}/message`, {
        message: messageText.trim(),
        type: messageType,
      });

      setFeedback({ type: "success", text: "Notice sent to customer email & orders dashboard successfully!" });
      setMessageText("");
      if (onNoticeSent) {
        onNoticeSent(shipment._id, {
          adminMessages: res.data.orderAdminMessages,
          latestAdminMessage: res.data.adminMessage,
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const msg = err.response?.data?.message || "Failed to send message to customer.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSendingMessage(false);
    }
  };

  const messages = Array.isArray(shipment.adminMessages) ? shipment.adminMessages : [];

  return (
    <div className="p-6 border-t border-white/5 bg-black/40">
      {/* Custom Messaging & Emergency Alert to Customer */}
      <div className="bg-[#120f0c] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Send size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Send Customer Notice & Emergency Advisory</h3>
            <p className="text-xs text-white/60">
              Sends an instant notification to the customer's orders dashboard & dispatches a branded email advisory.
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
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
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
                { id: "stock_issue", label: "📦 Out of Stock", border: "hover:border-amber-400" },
                { id: "emergency", label: "🚨 Emergency", border: "hover:border-rose-400" },
                { id: "warning", label: "⚠️ Logistics Delay", border: "hover:border-amber-400" },
                { id: "info", label: "✨ General Update", border: "hover:border-[#c99742]" },
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
              Recipient: <strong className="text-white">{shipment.customerEmail || shipment.customerName || "Customer"}</strong>
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

        {/* Previous Messages History */}
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
                      [{msg.type || "info"}] Sent by {msg.sentByName || "Vendor"}
                    </span>
                    <span className="text-white/40 font-mono">
                      {new Date(msg.sentAt).toLocaleString("en-ZA")}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed mt-0.5">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
