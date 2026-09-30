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
  Gift,
  QrCode,
  Box,
  Lock,
  Printer,
  Check,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Price from '../../components/ui/Price';
import { PHONE_COUNTRIES } from '../../utils/phoneNumbers';

export const downloadQrCode = (svgId, fileName = 'qr-code.png', title = 'GRAND STORE VERIFICATION QR', subtitle = '') => {
  const svg = document.getElementById(svgId);
  if (!svg) {
    console.error(`SVG element #${svgId} not found`);
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    const scale = 2;
    const baseW = 320;
    const baseH = 390;
    canvas.width = baseW * scale;
    canvas.height = baseH * scale;
    ctx.scale(scale, scale);

    // Luxury crisp white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseW, baseH);

    // Gold decorative border
    ctx.strokeStyle = '#c99742';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, baseW - 16, baseH - 16);

    // Header branding
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(8, 8, baseW - 16, 42);
    ctx.fillStyle = '#c99742';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE GRAND STORE', baseW / 2, 26);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 9px -apple-system, sans-serif';
    ctx.fillText(title.toUpperCase(), baseW / 2, 40);

    // Draw QR Code
    const qrSize = 210;
    const qrX = (baseW - qrSize) / 2;
    const qrY = 62;
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

    // Footer information
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(subtitle || '', baseW / 2, 298);

    ctx.fillStyle = '#777777';
    ctx.font = '9px -apple-system, sans-serif';
    ctx.fillText('OFFICIAL DISPATCH & VERIFICATION DOCKET', baseW / 2, 316);
    ctx.fillText('Scan to verify consignment integrity & live custody', baseW / 2, 330);

    // Gold bottom line
    ctx.strokeStyle = '#c99742';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 345);
    ctx.lineTo(baseW - 30, 345);
    ctx.stroke();

    ctx.fillStyle = '#999999';
    ctx.font = '8px -apple-system, sans-serif';
    ctx.fillText('South African Logistics Gateway • Grand Store Ops', baseW / 2, 362);

    const a = document.createElement('a');
    a.download = fileName;
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
};

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

  // Logistics & Packaging State
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [packagingLoading, setPackagingLoading] = useState(false);
  const [driverLoading, setDriverLoading] = useState(false);
  const [handoverLoading, setHandoverLoading] = useState(false);

  // Packaging inspection form
  const [packForm, setPackForm] = useState({
    boxType: 'Certified Wine Shipper (1 Bottle)',
    weightKg: 1.55,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 33,
    isFragile: true,
    isSealed: true,
    packedBy: 'Grand Store Dispatch Vault'
  });

  // Driver assignment form
  const [driverForm, setDriverForm] = useState({
    courierCompany: 'Aramex South Africa',
    serviceType: 'ONP',
    driverName: 'Aramex Express Dispatch Courier',
    driverPhone: '+27 11 883 4000',
    vehicleReg: 'Aramex Fleet (Gauteng Hub)',
    pickupWindow: '13:30 - 17:00'
  });

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/orders/admin/${id}`);
      setOrder(res.data);
      if (res.data?.packaging) {
        setPackForm(prev => ({
          ...prev,
          boxType: res.data.packaging.boxType || prev.boxType,
          weightKg: res.data.packaging.weightKg || prev.weightKg,
          lengthCm: res.data.packaging.dimensions?.lengthCm || prev.lengthCm,
          widthCm: res.data.packaging.dimensions?.widthCm || prev.widthCm,
          heightCm: res.data.packaging.dimensions?.heightCm || prev.heightCm,
          isFragile: res.data.packaging.isFragile !== false,
          isSealed: res.data.packaging.isSealed !== false,
          packedBy: res.data.packaging.packedBy || prev.packedBy
        }));
      }
      if (res.data?.driver) {
        setDriverForm(prev => ({
          ...prev,
          courierCompany: res.data.driver.courierCompany || prev.courierCompany,
          serviceType: res.data.driver.serviceType || prev.serviceType,
          driverName: res.data.driver.driverName || prev.driverName,
          driverPhone: res.data.driver.driverPhone || prev.driverPhone,
          vehicleReg: res.data.driver.vehicleReg || prev.vehicleReg,
          pickupWindow: res.data.driver.pickupWindow || prev.pickupWindow
        }));
      }
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

  const handleVerifyPackaging = async (e) => {
    e?.preventDefault();
    try {
      setPackagingLoading(true);
      const res = await api.post(`/orders/${id}/packaging`, packForm);
      if (onNotify) onNotify(res.data?.message || 'Packaging inspected and sealed successfully!', 'success');
      setPackModalOpen(false);
      fetchOrder();
    } catch (err) {
      console.error('Packaging update error:', err);
      const msg = err.response?.data?.message || 'Failed to verify packaging.';
      if (onNotify) onNotify(msg, 'error');
      else alert(msg);
    } finally {
      setPackagingLoading(false);
    }
  };

  const handleAssignDriver = async (e) => {
    e?.preventDefault();
    try {
      setDriverLoading(true);
      const res = await api.post(`/orders/${id}/assign-driver`, driverForm);
      if (onNotify) onNotify(res.data?.message || 'Driver assigned and collection booked successfully!', 'success');
      setDriverModalOpen(false);
      fetchOrder();
    } catch (err) {
      console.error('Driver assignment error:', err);
      const msg = err.response?.data?.message || 'Failed to assign driver.';
      if (onNotify) onNotify(msg, 'error');
      else alert(msg);
    } finally {
      setDriverLoading(false);
    }
  };

  const handleConfirmHandover = async () => {
    if (!window.confirm('Confirm that the courier driver has physically collected this parcel?')) return;
    try {
      setHandoverLoading(true);
      const res = await api.post(`/orders/${id}/confirm-handover`, {});
      if (onNotify) onNotify(res.data?.message || 'Driver handover confirmed! Order is now In Transit.', 'success');
      fetchOrder();
    } catch (err) {
      console.error('Confirm handover error:', err);
      const msg = err.response?.data?.message || 'Failed to confirm handover.';
      if (onNotify) onNotify(msg, 'error');
      else alert(msg);
    } finally {
      setHandoverLoading(false);
    }
  };

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
                : order.paymentStatus === 'Cancelled' || order.paymentStatus === 'Failed'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : order.paymentStatus === 'Awaiting_Approval'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {order.isPaid || order.paymentStatus === 'Paid'
                ? '✓ Paid & Verified'
                : order.paymentStatus === 'Cancelled' || order.paymentStatus === 'Failed'
                ? '🚫 Cancelled / Aborted'
                : order.paymentStatus === 'Awaiting_Approval'
                ? '⏳ Awaiting Approval (EFT)'
                : '⚠️ Unpaid / Payment Pending'}
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

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const apiUrl = import.meta.env.VITE_API_URL?.includes('localhost') && window.location.hostname !== 'localhost'
                ? 'https://api.grandstoreglobal.com'
                : (import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5015' : 'https://api.grandstoreglobal.com'));
              window.open(`${apiUrl}/api/orders/${order._id}/receipt-pdf`, '_blank');
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 rounded-xl border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="Download & Print Official Grand Store Tax Invoice PDF"
          >
            <FileText size={14} className="text-amber-400" /> Tax Invoice (PDF)
          </button>

          <button
            type="button"
            onClick={() => {
              const apiUrl = import.meta.env.VITE_API_URL?.includes('localhost') && window.location.hostname !== 'localhost'
                ? 'https://api.grandstoreglobal.com'
                : (import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5015' : 'https://api.grandstoreglobal.com'));
              const wb = order.driver?.waybillNumber || order.aramexWaybillNumber || (order.shipments && order.shipments[0]?.aramexWaybillNumber) || '31984210642';
              window.open(`${apiUrl}/api/aramex/waybill-pdf/${wb}`, '_blank');
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 text-emerald-300 rounded-xl border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="Download Aramex 4x6 Thermal Shipping Waybill Label PDF with Driver Handover QR Code"
          >
            <Printer size={14} className="text-emerald-400" /> Waybill Label (PDF)
          </button>

          {/* Direct Download Package QR button */}
          <button
            type="button"
            onClick={() => downloadQrCode('admin-package-security-qr-svg', `Package-Security-QR-${order.packaging?.packageBarcode || orderRef}.png`, 'PACKAGE SECURITY QR DOCKET', order.packaging?.packageBarcode || `GS-PKG-${orderRef}`)}
            className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-[#f5c242] rounded-xl border border-[#f5c242]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="Download Printable Package Security QR (PNG)"
          >
            <Download size={14} className="text-[#f5c242]" /> Package QR (PNG)
          </button>

          {/* Direct Download Driver Handover QR button */}
          <button
            type="button"
            onClick={() => downloadQrCode('admin-driver-handover-qr-svg', `Driver-Handover-QR-${order.driver?.waybillNumber || orderRef}.png`, 'ARAMEX DRIVER HANDOVER QR', `WB: ${order.driver?.waybillNumber || '31984210642'} • ${order.driver?.collectionRef || ''}`)}
            className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-xl border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="Download Printable Driver Handover QR (PNG)"
          >
            <Download size={14} className="text-emerald-300" /> Driver QR (PNG)
          </button>
        </div>
      </div>

      {/* Cancelled / Unpaid Warning Banner */}
      {(order.paymentStatus === 'Cancelled' || order.paymentStatus === 'Failed') ? (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-start gap-3.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
              🚫 ORDER CANCELLED — PAYMENT ABORTED
            </h4>
            <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
              This payment transaction was cancelled by the customer or aborted on the gateway. The order is completely inactive. Do NOT pack, dispatch, or process fulfillment.
            </p>
          </div>
        </div>
      ) : !(order.isPaid || order.paymentStatus === 'Paid') && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
              ⚠️ Fulfillment On Hold — Order Unpaid
            </h4>
            <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
              This order has not been cleared for fulfillment. Do NOT pack, ship, or hand over items until payment has been confirmed via PayFast or manual EFT approval.
            </p>
          </div>
        </div>
      )}

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

          {/* VAULT LOGISTICS, PACKAGING INSPECTION & DRIVER ASSIGNMENT (WITH LIVE QR) */}
          <div className="bg-[#100e0b] border border-[#c99742]/30 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#c99742]/20 text-[#f5c242] border border-[#c99742]/40">
                  <Box size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-white flex items-center gap-2">
                    Vault Dispatch & Driver Logistics
                  </h3>
                  <p className="text-xs text-white/60">
                    Physical packaging verification, live QR tracking, and courier driver dispatch
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  order.driver?.status === 'in_transit' || order.status === 'In Transit'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : order.driver?.status === 'assigned' || order.status === 'Awaiting Dispatch'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : order.packaging?.isPacked
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {order.driver?.status === 'in_transit' || order.status === 'In Transit'
                    ? '🚚 In Transit with Driver'
                    : order.driver?.status === 'assigned' || order.status === 'Awaiting Dispatch'
                    ? '📋 Driver Assigned & Awaiting Pickup'
                    : order.packaging?.isPacked
                    ? '✓ Packaging Verified'
                    : '📦 Packaging Inspection Required'}
                </span>
              </div>
            </div>

            {/* Packaging Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-black/40 border border-white/10 rounded-xl p-5">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-[#f5c242] font-bold flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Physical Package Specifications
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    order.packaging?.isPacked
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {order.packaging?.isPacked ? '✓ Sealed & Inspected' : 'Pending Physical Pack'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase">Box Type</span>
                    <strong className="text-white truncate block" title={order.packaging?.boxType || 'Certified Wine Shipper'}>
                      {order.packaging?.boxType || 'Wine Shipper'}
                    </strong>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase">Dimensions</span>
                    <strong className="text-white">
                      {order.packaging?.dimensions?.lengthCm || 10} × {order.packaging?.dimensions?.widthCm || 10} × {order.packaging?.dimensions?.heightCm || 33} cm
                    </strong>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase">Gross Weight</span>
                    <strong className="text-amber-400">
                      {order.packaging?.weightKg || 1.55} kg
                    </strong>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase">Fragile Seal</span>
                    <strong className="text-rose-400">
                      {order.packaging?.isFragile !== false ? 'YES (Glass / Liquid)' : 'No'}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-white/50">
                    Barcode: <span className="font-mono text-white/90 font-bold">{order.packaging?.packageBarcode || `GS-PKG-${orderRef}`}</span>
                    {order.packaging?.packedBy && (
                      <span className="ml-2 text-white/40">| Sealed by: {order.packaging.packedBy}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPackModalOpen(true)}
                    className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
                  >
                    <Box size={13} /> {order.packaging?.isPacked ? 'Edit / Re-inspect' : 'Inspect & Seal Packaging'}
                  </button>
                </div>
              </div>

              {/* Package Barcode / Security QR */}
              <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="bg-white p-2 rounded-lg shadow-md mb-2">
                  <QRCodeSVG
                    id="admin-package-security-qr-svg"
                    value={JSON.stringify({
                      pkg: order.packaging?.packageBarcode || `GS-PKG-${orderRef}`,
                      order: orderRef,
                      cust: order.customerName,
                      items: retailItems.length,
                      fragile: true
                    })}
                    size={95}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#f5c242] font-bold">
                  Package Security QR
                </span>
                <span className="text-[9px] text-white/40 font-mono mt-0.5">
                  Scan to verify parcel seal
                </span>
                <button
                  type="button"
                  onClick={() => downloadQrCode('admin-package-security-qr-svg', `Package-Security-QR-${order.packaging?.packageBarcode || orderRef}.png`, 'PACKAGE SECURITY QR DOCKET', order.packaging?.packageBarcode || `GS-PKG-${orderRef}`)}
                  className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#f5c242]/15 hover:bg-[#f5c242]/25 text-[#f5c242] text-[11px] font-bold flex items-center gap-1.5 transition-all border border-[#f5c242]/30 cursor-pointer shadow-sm"
                  title="Download High-Resolution Printable Package Security QR"
                >
                  <Download size={12} /> Download QR
                </button>
              </div>
            </div>

            {/* Driver Assignment Section (Gated by Packaging) */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-[#f5c242]" />
                  <h4 className="text-xs uppercase tracking-widest text-[#f5c242] font-bold">
                    Courier Driver Dispatch & Handover
                  </h4>
                </div>
                {order.driver?.status && order.driver.status !== 'unassigned' && (
                  <span className="text-xs text-white/60">
                    Waybill: <strong className="font-mono text-white">{order.driver.waybillNumber}</strong>
                  </span>
                )}
              </div>

              {/* Gating Alert if not packed */}
              {!order.packaging?.isPacked ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="text-amber-300 block mb-0.5 font-bold">
                      Driver Assignment Locked
                    </strong>
                    <p className="text-white/70 leading-relaxed">
                      Physical package inspection, cushioning, and security seal must be verified before a courier driver can be assigned for pickup.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPackModalOpen(true)}
                      className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 border border-amber-500/40"
                    >
                      <Box size={13} /> Complete Packaging Inspection First
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* If driver already assigned */}
                  {order.driver?.status && order.driver.status !== 'unassigned' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                      <div className="md:col-span-2 space-y-3 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                            <span className="text-white/40 block text-[10px] uppercase">Courier Partner</span>
                            <strong className="text-white block text-sm">{order.driver.courierCompany}</strong>
                            <span className="text-[10px] text-[#f5c242] font-semibold">{order.driver.serviceType === 'ONP' ? 'Overnight Express' : 'Economy Road'}</span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                            <span className="text-white/40 block text-[10px] uppercase">Assigned Driver</span>
                            <strong className="text-white block text-sm">{order.driver.driverName}</strong>
                            <span className="text-[10px] text-white/60">{order.driver.driverPhone}</span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                            <span className="text-white/40 block text-[10px] uppercase">Pickup Window</span>
                            <strong className="text-white block text-sm">{order.driver.pickupWindow}</strong>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">{order.driver.collectionRef}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setDriverModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10"
                          >
                            Re-assign Driver / Change Courier
                          </button>

                          {order.driver?.status !== 'in_transit' && order.status !== 'In Transit' && order.status !== 'Delivered' && (
                            <button
                              type="button"
                              onClick={handleConfirmHandover}
                              disabled={handoverLoading}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                            >
                              <Check size={14} /> {handoverLoading ? 'Confirming...' : 'Confirm Driver Handover'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const apiUrl = import.meta.env.VITE_API_URL?.includes('localhost') && window.location.hostname !== 'localhost'
                                ? 'https://api.grandstoreglobal.com'
                                : (import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5015' : 'https://api.grandstoreglobal.com'));
                              window.open(`${apiUrl}/api/aramex/waybill-pdf/${order.driver.waybillNumber}`, '_blank');
                            }}
                            className="px-4 py-2 rounded-xl bg-[#c99742]/20 hover:bg-[#c99742]/30 text-[#f5c242] font-bold text-xs flex items-center gap-1.5 border border-[#c99742]/40 cursor-pointer"
                          >
                            <Printer size={14} /> Download Aramex Waybill PDF
                          </button>
                        </div>
                      </div>

                      {/* Driver Handover QR Card */}
                      <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                        <div className="bg-white p-2 rounded-lg shadow-md mb-2">
                          <QRCodeSVG
                            id="admin-driver-handover-qr-svg"
                            value={`https://grandstoreglobal.com/api/orders/${orderRef}/confirm-handover?driver=${encodeURIComponent(order.driver.driverName)}&ref=${order.driver.collectionRef}`}
                            size={105}
                          />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                          <QrCode size={12} /> Driver Handover QR
                        </span>
                        <span className="text-[9px] text-white/50 mt-0.5">
                          Driver scans at dispatch bay to confirm pickup
                        </span>
                        <button
                          type="button"
                          onClick={() => downloadQrCode('admin-driver-handover-qr-svg', `Driver-Handover-QR-${order.driver.waybillNumber || orderRef}.png`, 'ARAMEX DRIVER HANDOVER QR', `WB: ${order.driver.waybillNumber || '31984210642'} • ${order.driver.collectionRef || ''}`)}
                          className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 transition-all border border-emerald-500/30 cursor-pointer shadow-sm"
                          title="Download High-Resolution Printable Driver Handover QR"
                        >
                          <Download size={12} /> Download QR
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Driver not yet assigned, but packaging is ready */
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <h5 className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-400" /> Package Sealed & Ready for Courier
                        </h5>
                        <p className="text-xs text-white/60 mt-0.5">
                          Assign Aramex Express courier collection or dedicated Grand Store vault driver.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDriverModalOpen(true)}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c242] to-[#c99742] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
                      >
                        <Truck size={15} /> Assign Driver & Book Dispatch
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                {order.customerPhoneCountry && (
                  <span className="text-xs text-white/50 block mt-1">
                    {PHONE_COUNTRIES.find((country) => country.country === order.customerPhoneCountry)?.name || order.customerPhoneCountry} ({order.customerPhoneCountryCode})
                  </span>
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
                  <span className="text-sm font-bold text-[#c99742] block">
                    {order.isPaid || order.paymentStatus === 'Paid' ? 'Grand Total Paid:' : 'Grand Total Due (Unpaid):'}
                  </span>
                  <span className="text-[10px] text-white/40">Inclusive of 15% VAT & duties</span>
                </div>
                <span className="text-xl font-serif font-bold text-[#c99742] font-mono">
                  <Price amount={order.totalPrice} />
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 text-[11px] text-white/50 space-y-1">
              <div>Payment Method: <strong className="text-white">{order.paymentMethod || 'Instant EFT / PayFast'}</strong></div>
              <div>Payment Status: <strong className={order.isPaid || order.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-rose-400'}>{order.isPaid || order.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid (Pending)'}</strong></div>
              <div>Transaction ID: <strong className="font-mono text-white">{order.transactionId || orderRef}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* PACKAGING INSPECTION MODAL */}
      {packModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#120f0c] border border-[#c99742]/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#c99742]/20 text-[#f5c242]">
                  <Box size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Physical Packaging Inspection</h3>
                  <p className="text-xs text-white/50">Verify bottle cushioning, dimensions, and tamper seal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPackModalOpen(false)}
                className="text-white/40 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyPackaging} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Shipper Box Type
                </label>
                <input
                  type="text"
                  value={packForm.boxType}
                  onChange={(e) => setPackForm({ ...packForm, boxType: e.target.value })}
                  placeholder="e.g. Certified Wine Shipper (1 Bottle)"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:border-[#f5c242] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Gross Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={packForm.weightKg}
                    onChange={(e) => setPackForm({ ...packForm, weightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-white/40 mt-0.5 block">Wine + Bottle + Outer Pack</span>
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Inspected & Packed By
                  </label>
                  <input
                    type="text"
                    value={packForm.packedBy}
                    onChange={(e) => setPackForm({ ...packForm, packedBy: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Dimensions: Length × Width × Height (cm)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={packForm.lengthCm}
                    onChange={(e) => setPackForm({ ...packForm, lengthCm: parseFloat(e.target.value) || 0 })}
                    placeholder="L (cm)"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs text-center focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={packForm.widthCm}
                    onChange={(e) => setPackForm({ ...packForm, widthCm: parseFloat(e.target.value) || 0 })}
                    placeholder="W (cm)"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs text-center focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={packForm.heightCm}
                    onChange={(e) => setPackForm({ ...packForm, heightCm: parseFloat(e.target.value) || 0 })}
                    placeholder="H (cm)"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs text-center focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-white/5">
                <label className="flex items-center gap-2 text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packForm.isFragile}
                    onChange={(e) => setPackForm({ ...packForm, isFragile: e.target.checked })}
                    className="rounded border-white/20 text-[#f5c242] focus:ring-[#f5c242] bg-black/40"
                  />
                  <span>Fragile Goods: Liquid bottle with internal air-cushion column</span>
                </label>
                <label className="flex items-center gap-2 text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packForm.isSealed}
                    onChange={(e) => setPackForm({ ...packForm, isSealed: e.target.checked })}
                    className="rounded border-white/20 text-[#f5c242] focus:ring-[#f5c242] bg-black/40"
                  />
                  <span>Tamper-evident holographic security tape applied to carton</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPackModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={packagingLoading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#f5c242] to-[#c99742] text-black font-bold uppercase tracking-wider shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {packagingLoading ? 'Saving Inspection...' : 'Confirm & Seal Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER ASSIGNMENT MODAL */}
      {driverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#120f0c] border border-[#c99742]/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assign Driver & Book Dispatch</h3>
                  <p className="text-xs text-white/50">Schedule courier pickup or dispatch dedicated vault driver</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDriverModalOpen(false)}
                className="text-white/40 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Courier / Logistics Partner
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDriverForm({
                      ...driverForm,
                      courierCompany: 'Aramex South Africa',
                      serviceType: 'ONP',
                      driverName: 'Aramex Express Dispatch Courier',
                      driverPhone: '+27 11 883 4000',
                      vehicleReg: 'Aramex Fleet (Gauteng Hub)'
                    })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      driverForm.courierCompany.includes('Aramex')
                        ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
                        : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <span className="block text-sm text-white font-bold">Aramex South Africa</span>
                    <span className="text-[10px] text-amber-300">Overnight Express / Road</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDriverForm({
                      ...driverForm,
                      courierCompany: 'Grand Store Vault Courier',
                      serviceType: 'SPECIAL',
                      driverName: 'Sipho Khumalo',
                      driverPhone: '+27 82 555 0192',
                      vehicleReg: 'Toyota Hilux (GP 92 KL)'
                    })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      driverForm.courierCompany.includes('Vault')
                        ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
                        : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <span className="block text-sm text-white font-bold">Dedicated Vault Driver</span>
                    <span className="text-[10px] text-emerald-400">Internal Handover Vehicle</span>
                  </button>
                </div>
              </div>

              {driverForm.courierCompany.includes('Aramex') && (
                <div>
                  <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Aramex Service Tier
                  </label>
                  <select
                    value={driverForm.serviceType}
                    onChange={(e) => setDriverForm({ ...driverForm, serviceType: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:border-[#f5c242] focus:outline-none"
                  >
                    <option value="ONP">Aramex Overnight Express (Priority by 11:00 AM)</option>
                    <option value="PEC">Aramex Economy Road (2-3 Business Days)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Assigned Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverForm.driverName}
                    onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Driver Contact Phone
                  </label>
                  <input
                    type="text"
                    value={driverForm.driverPhone}
                    onChange={(e) => setDriverForm({ ...driverForm, driverPhone: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Vehicle Registration / Van
                  </label>
                  <input
                    type="text"
                    value={driverForm.vehicleReg}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicleReg: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Collection Pickup Window
                  </label>
                  <input
                    type="text"
                    value={driverForm.pickupWindow}
                    onChange={(e) => setDriverForm({ ...driverForm, pickupWindow: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:border-[#f5c242] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 space-y-1">
                <div>Collection Address: <strong className="text-white">88 Grayston Drive, Sandton Central, Gauteng</strong></div>
                <div>Parcel Barcode: <strong className="font-mono text-amber-300">{order.packaging?.packageBarcode || `GS-PKG-${orderRef}`}</strong></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDriverModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={driverLoading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold uppercase tracking-wider shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {driverLoading ? 'Booking Pickup...' : 'Assign Driver & Book Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
