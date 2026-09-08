import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  MapPin,
  Truck,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  CreditCard,
  FileText,
  AlertCircle,
  Gift
} from 'lucide-react';
import Price from '../../components/ui/Price';

export default function AdminOrderDetail({ onNotify }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Messaging state
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('stock_issue');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/orders/admin/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError(err.response?.data?.message || 'Failed to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setSendingMessage(true);
      const res = await api.post(`/orders/${id}/admin-message`, {
        message: messageText.trim(),
        type: messageType
      });

      if (onNotify) {
        onNotify('Notice sent to customer email & orders dashboard successfully!', 'success');
      } else {
        alert('Notice sent to customer successfully!');
      }

      setMessageText('');
      // Update local state with latest order
      if (res.data?.order) {
        setOrder(prev => ({
          ...prev,
          adminMessages: res.data.order.adminMessages,
          latestAdminMessage: res.data.order.latestAdminMessage
        }));
      } else {
        fetchOrder();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const msg = err.response?.data?.message || 'Failed to send message to customer.';
      if (onNotify) onNotify(msg, 'error');
      else alert(msg);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#c99742]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c99742] mb-4"></div>
        <p className="font-serif text-lg">Retrieving Grand Store Order Dossier...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <AlertCircle size={48} className="mx-auto text-rose-400 mb-4" />
        <h2 className="text-2xl font-serif text-white mb-2">Order Not Found</h2>
        <p className="text-white/60 mb-6">{error || 'The requested order could not be located.'}</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  const orderRef = order.invoiceNumber || order.orderId || order._id;
  const isPostNet = order.deliveryPreference === 'postnet' || Boolean(order.selectedPostnetStore?.name);
  const retailItems = order.retailItems || (order.orderItems || []).filter(i => !i.vendorId);
  const vendorItems = order.vendorItems || (order.orderItems || []).filter(i => Boolean(i.vendorId));

  const subTotal = Number(order.subTotal || 0);
  const vatAmount = Number(order.vatAmount || (subTotal > 0 ? (subTotal * (15 / 115)).toFixed(2) : 0));
  const subTotalExclVat = Math.max(0, Number((subTotal - vatAmount).toFixed(2)));

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8">
      {/* Top Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#c99742] hover:text-white transition-colors mb-2 font-bold"
          >
            <ArrowLeft size={14} /> Back to Orders
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif text-white flex items-center gap-3">
              Order <span className="text-[#c99742]">#{orderRef}</span>
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              order.isPaid || order.paymentStatus === 'Paid'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : order.paymentStatus === 'Awaiting_Approval'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}>
              {order.isPaid || order.paymentStatus === 'Paid' ? '✓ Paid & Verified' : order.paymentStatus || 'Pending'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPostNet
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
            }`}>
              {isPostNet ? '📍 PostNet Collection' : '🚚 Door Delivery'}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <FileText size={14} /> Print Invoice
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Items & Messaging */}
        <div className="lg:col-span-2 space-y-8">
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

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-2 font-semibold">
                  Notice Classification
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'stock_issue', label: '📦 Out of Stock', border: 'hover:border-amber-400' },
                    { id: 'emergency', label: '🚨 Emergency', border: 'hover:border-rose-400' },
                    { id: 'warning', label: '⚠️ Logistics Delay', border: 'hover:border-amber-400' },
                    { id: 'info', label: '✨ General Update', border: 'hover:border-[#c99742]' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMessageType(t.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        messageType === t.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
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
                  Recipient: <strong className="text-white">{order.customerEmail || 'Customer'}</strong>
                </span>
                <button
                  type="submit"
                  disabled={sendingMessage || !messageText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c242] to-[#c99742] hover:opacity-95 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-all shadow-md"
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
            {order.adminMessages && order.adminMessages.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                  Sent Advisory History ({order.adminMessages.length})
                </h4>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {order.adminMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300 uppercase tracking-wide">
                          [{msg.type || 'info'}] Sent by {msg.sentByName || 'Concierge'}
                        </span>
                        <span className="text-white/40 font-mono">
                          {new Date(msg.sentAt).toLocaleString('en-ZA')}
                        </span>
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed mt-0.5">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RETAIL PRODUCTS SECTION */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#c99742]/15 text-[#c99742]">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-white">Ordered Products</h3>
                  <p className="text-xs text-white/60">Inventory fulfilled directly from The Grand Store vault & warehouse</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#c99742] bg-[#c99742]/10 px-3 py-1 rounded-full border border-[#c99742]/30">
                {retailItems.length} {retailItems.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {retailItems.length === 0 ? (
              <p className="text-xs text-white/40 italic py-4 text-center">No retail products in this order.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {retailItems.map((item, idx) => (
                  <div key={idx} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-contain rounded-xl bg-black/60 border border-white/10 p-1"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c99742] font-bold text-xs">
                          GS
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        {item.option && <p className="text-xs text-[#c99742] mt-0.5">Option: {item.option}</p>}
                        <p className="text-xs text-white/40 mt-0.5">Category: {item.category || 'Fine Spirits'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">{item.quantity} × <Price amount={item.price} /></p>
                      <p className="text-sm font-bold text-[#c99742] mt-0.5"><Price amount={item.price * item.quantity} /></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>

        {/* Right 1 Column: Customer Details, Delivery Destination & Financials */}
        <div className="space-y-6">
          {/* Customer Profile & KYC Card */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#c99742] font-bold flex items-center gap-2">
              <User size={16} /> Customer Checkout Details
            </h3>

            <div className="space-y-2.5 text-sm">
              <div>
                <span className="text-xs text-white/40 block">Recipient Full Name</span>
                <span className="font-bold text-white text-base">{order.customerName}</span>
                <span className={`inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  order.isGuest ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {order.isGuest ? 'Guest Checkout' : 'VIP Member'}
                </span>
              </div>

              <div>
                <span className="text-xs text-white/40 block">Email Address</span>
                {order.customerEmail ? (
                  <a href={`mailto:${order.customerEmail}`} className="text-[#c99742] hover:underline flex items-center gap-1.5 font-medium">
                    <Mail size={13} /> {order.customerEmail}
                  </a>
                ) : (
                  <span className="text-white/40 italic">Not provided</span>
                )}
              </div>

              <div>
                <span className="text-xs text-white/40 block">Phone Number</span>
                {order.customerPhone ? (
                  <a href={`tel:${order.customerPhone}`} className="text-white hover:text-[#c99742] flex items-center gap-1.5 font-medium">
                    <Phone size={13} /> {order.customerPhone}
                  </a>
                ) : (
                  <span className="text-white/40 italic">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery & Logistics Destination Card */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#c99742] font-bold flex items-center gap-2">
              <Truck size={16} /> Delivery & Collection Details
            </h3>

            {isPostNet ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <MapPin size={14} /> PostNet Store Collection Point
                </div>
                <div className="text-sm font-bold text-white">
                  {order.selectedPostnetStore?.name || 'Selected PostNet Branch'}
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  {order.selectedPostnetStore?.address || order.shippingAddress?.address}
                </p>
                <div className="text-xs text-white/60 space-y-0.5 pt-1">
                  <div>City: <strong className="text-white">{order.selectedPostnetStore?.city || order.shippingAddress?.city}</strong></div>
                  <div>Postal Code: <strong className="text-white">{order.selectedPostnetStore?.postalCode || order.shippingAddress?.postalCode}</strong></div>
                  {order.selectedPostnetStore?.telephone && (
                    <div>Telephone: <strong className="text-white">{order.selectedPostnetStore.telephone}</strong></div>
                  )}
                  {order.selectedPostnetStore?.distance !== null && order.selectedPostnetStore?.distance !== undefined && (
                    <div>Distance: <strong className="text-amber-400">{order.selectedPostnetStore.distance} km away</strong></div>
                  )}
                </div>
                <div className="text-[10px] text-amber-300/80 pt-2 border-t border-amber-500/20">
                  Collection requires customer identity document & SMS PIN dispatch verification.
                </div>
              </div>
            ) : (
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <Truck size={14} /> Doorstep Courier Delivery
                </div>
                <p className="text-sm text-white font-medium leading-relaxed">
                  {order.shippingAddress?.address}
                </p>
                <p className="text-xs text-white/70">
                  {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                  <br />
                  {order.shippingAddress?.country || 'South Africa'}
                </p>
              </div>
            )}

            {order.isGift && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Gift size={14} /> Gift Packaging & Card Required
                </div>
                {order.giftRecipientName && (
                  <p className="text-xs text-white">
                    Recipient: <strong className="text-white">{order.giftRecipientName}</strong>
                  </p>
                )}
                {order.giftMessage && (
                  <p className="text-xs italic text-white/80 bg-black/40 p-2.5 rounded-lg border border-white/10">
                    "{order.giftMessage}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Financial Summary & 15% VAT Breakdown */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#c99742] font-bold flex items-center gap-2">
              <CreditCard size={16} /> Financial & Tax Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Products Subtotal (Excl. VAT):</span>
                <span className="font-mono text-white"><Price amount={subTotalExclVat} /></span>
              </div>
              <div className="flex justify-between text-[#c99742]">
                <span>South African VAT (15% Included):</span>
                <span className="font-mono font-bold"><Price amount={vatAmount} /></span>
              </div>
              <div className="flex justify-between text-white/90 font-medium">
                <span>Products Subtotal (Incl. VAT):</span>
                <span className="font-mono"><Price amount={subTotal} /></span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Shipping & Logistics:</span>
                <span className="font-mono text-white">
                  {order.shippingCost > 0 ? <Price amount={order.shippingCost} /> : <span className="text-emerald-400 font-bold">FREE</span>}
                </span>
              </div>
              {order.superCoinsDiscount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Super Coins Redeemed:</span>
                  <span className="font-mono">- <Price amount={order.superCoinsDiscount} /></span>
                </div>
              )}
              {order.appliedWelcomeDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Welcome Promotion Discount:</span>
                  <span className="font-mono">- <Price amount={order.appliedWelcomeDiscount} /></span>
                </div>
              )}
              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-[#c99742] block">Grand Total Paid:</span>
                  <span className="text-[10px] text-white/40">Inclusive of 15% VAT & duties</span>
                </div>
                <span className="text-xl font-serif font-bold text-[#c99742] font-mono">
                  <Price amount={order.totalPrice} />
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 text-[11px] text-white/50 space-y-1">
              <div>Payment Method: <strong className="text-white">{order.paymentMethod || 'Instant EFT / PayFast'}</strong></div>
              <div>Transaction ID: <strong className="font-mono text-white">{order.transactionId || orderRef}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
