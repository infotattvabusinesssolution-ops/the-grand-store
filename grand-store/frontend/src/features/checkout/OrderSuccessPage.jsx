import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Download, Loader2, Truck, MapPin, Coins, ShieldCheck, ArrowRight, Clock, AlertTriangle, Package, FileCheck, Gift } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import Price from "../../components/ui/Price";
import StoreBankDetailsCard from "../../components/StoreBankDetailsCard";
import api from "../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function OrderSuccessPage({ onClearCart }) {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const { formatPrice } = useCurrency();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // 1-Click Post-Order Account Creation State (Section 6 & Quick Buyer)
  const [accountPassword, setAccountPassword] = useState("");
  const [convertingAccount, setConvertingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountError, setAccountError] = useState("");

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!accountPassword || accountPassword.length < 6) {
      setAccountError("Password must be at least 6 characters long.");
      return;
    }
    setConvertingAccount(true);
    setAccountError("");
    try {
      const res = await api.post("/auth/convert-guest", {
        orderId: order._id,
        password: accountPassword
      });
      if (updateUser) {
        updateUser(res.data);
      }
      setAccountCreated(true);
      setOrder((prev) => prev ? { ...prev, isGuest: false, user: { _id: res.data._id, name: res.data.name, email: res.data.email } } : prev);
    } catch (err) {
      setAccountError(err.response?.data?.message || err.message || "Failed to create account. Please try again.");
    } finally {
      setConvertingAccount(false);
    }
  };

  useEffect(() => {
    document.title = "Order Confirmation - The Grand Store";
    window.scrollTo({ top: 0, behavior: "auto" });

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        const data = res.data;
        setOrder(data);
        if (paymentStatus === "success" && onClearCart) {
          onClearCart();
        }
      } catch (error) {
        console.error("Error fetching order", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [id, paymentStatus]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center text-gold-gradient">
        Loading receipt...
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <h2>Order not found</h2>
        <Link to="/" className="text-gold-gradient mt-4">
          Return Home
        </Link>
      </main>
    );
  }

  const generatePDF = () => {
    setIsGenerating(true);
    const doc = new jsPDF();
    const invoiceNo = order.invoiceNumber || order._id;

    const buildPdfContent = (img) => {
      // --- THEME COLORS ---
      const themeColor = [15, 15, 15]; // Charcoal/Black
      const accentColor = [216, 183, 109]; // Grand Store Gold

      // --- WATERMARK ---
      if (img) {
        doc.setGState(new doc.GState({ opacity: 0.04 }));
        doc.addImage(img, "PNG", 35, 133, 140, 30);
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      }

      // --- LOGO (Top Left) ---
      if (img) {
        // Fix squeezing by calculating aspect ratio
        const ratio = img.height / img.width;
        const targetWidth = 45;
        const targetHeight = targetWidth * ratio;
        doc.addImage(img, "PNG", 14, 15, targetWidth, targetHeight);
      } else {
        doc.setFont("times", "bold");
        doc.setFontSize(22);
        doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
        doc.text("THE GRAND STORE", 14, 25);
      }

      // --- HEADER (Top Right) ---
      doc.setFont("times", "bold");
      doc.setFontSize(26);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]); // Gold
      doc.text("INVOICE", 196, 24, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(new Date(order.createdAt).toLocaleDateString(), 196, 30, { align: "right" });
      doc.text(`Ref: #${invoiceNo.toUpperCase()}`, 196, 35, { align: "right" });

      // --- ADDRESSES ---
      // Left: Store Address
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text("Office Address", 14, 50);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      doc.text("The Grand Store", 14, 55);
      doc.text("Premium Goods & Accessories", 14, 60);
      doc.text("VAT No: 123456789", 14, 65);

      // Right: Customer Address
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("To :", 120, 50);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(order.user?.name || order.guestInfo?.name || order.shippingAddress?.name || "Customer", 120, 55);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      doc.text(order.user?.email || order.guestInfo?.email || order.shippingAddress?.email || "", 120, 60);
      
      // Wrap Address so it doesn't overflow page
      const addressLines = doc.splitTextToSize(order.shippingAddress?.address || "", 76);
      doc.text(addressLines, 120, 65);
      const addressOffset = 65 + (addressLines.length * 4.5); // line height spacing

      doc.text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.postalCode || ""}`, 120, addressOffset);
      doc.text(order.shippingAddress?.country || "", 120, addressOffset + 5);

      // --- CURRENCY HELPER ---
      const pdfPrice = (amount) => {
        return formatPrice(amount).replace(/\u00A0/g, ' ').replace(/[^\x20-\x7E]/g, '');
      };

      // --- TABLE ---
      const tableData = order.orderItems.map((item) => [
        item.name,
        pdfPrice(item.price),
        item.qty || item.quantity || 1,
        pdfPrice(item.price * (item.qty || item.quantity || 1)),
      ]);

      const tableStartY = Math.max(85, addressOffset + 15);

      autoTable(doc, {
        startY: tableStartY,
        head: [["Items Description", "Unit Price", "Qnt", "Total"]],
        body: tableData,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 9,
          textColor: [0, 0, 0],
          cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
        },
        headStyles: { 
          fillColor: themeColor,
          textColor: accentColor,
          font: "times",
          fontStyle: "bold",
        },
        bodyStyles: {
          lineWidth: { bottom: 0.5 },
          lineColor: [200, 200, 200],
        },
        columnStyles: {
          0: { cellWidth: 'auto', fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
        }
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // --- NOTES (Left) ---
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("Note:", 14, finalY + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("Payment Method:", 14, finalY + 10);
      doc.text(order.paymentMethod || "N/A", 14, finalY + 15);

      // --- TOTALS (Right) ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text("SUBTOTAL :", 150, finalY + 5, { align: "right" });
      doc.text(pdfPrice(order.totalPrice - order.shippingCost), 196, finalY + 5, { align: "right" });

      doc.text("SHIPPING :", 150, finalY + 12, { align: "right" });
      doc.text(order.shippingCost === 0 ? "Complimentary" : pdfPrice(order.shippingCost), 196, finalY + 12, { align: "right" });

      // TOTAL BLOCK
      doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.rect(120, finalY + 18, 80, 12, "F");

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text("TOTAL DUE :", 130, finalY + 26);
      doc.setTextColor(255, 255, 255);
      doc.text(pdfPrice(order.totalPrice), 196, finalY + 26, { align: "right" });

      // --- THANK YOU ---
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text("Thank you for your Business", 14, finalY + 45);

      // --- FOOTER DIVIDER ---
      const pageHeight = doc.internal.pageSize.height;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 35, 196, pageHeight - 35);

      // --- FOOTER 3 COLUMNS ---
      doc.setFontSize(8);
      
      // Col 1
      doc.setFont("helvetica", "bold");
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.text("Questions?", 14, pageHeight - 25);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("Email    : info@grandstore.com", 14, pageHeight - 20);
      doc.text("Call us  : +1 234 567 890", 14, pageHeight - 15);

      // Col 2
      doc.setFont("helvetica", "bold");
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.text("Payment Info :", 85, pageHeight - 25);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(`Method   : ${order.paymentMethod}`, 85, pageHeight - 20);
      doc.text(`Status   : ${order.paymentStatus}`, 85, pageHeight - 15);

      // Col 3
      doc.setFont("helvetica", "bold");
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.text("Terms & Conditions/Note:", 145, pageHeight - 25);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("All sales are final.", 145, pageHeight - 20);
      doc.text("Keep this receipt for your records.", 145, pageHeight - 15);

      doc.save(`${invoiceNo}_Receipt.pdf`);
      setIsGenerating(false);
    };

    // Load Logo image
    const img = new Image();
    img.src = "/logo.png";
    img.onload = () => {
      buildPdfContent(img);
    };
    img.onerror = () => {
      buildPdfContent(null);
    };
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[var(--color-ivory)] pt-0 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Success Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-[var(--color-gold)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-gold-gradient" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4">
            Order Placed Successfully
          </h1>

          {paymentStatus === "success" ? (
            <div className="inline-block px-4 py-2 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 font-medium mb-4">
              Payment completed successfully via PayFast.
            </div>
          ) : paymentStatus === "cancel" ? (
            <div className="inline-block px-4 py-2 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 font-medium mb-4">
              Payment was cancelled. You can retry payment from your account
              dashboard.
            </div>
          ) : order.paymentMethod === "Bank Transfer" &&
            order.paymentStatus === "Pending" ? (
            <div className="inline-block px-4 py-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-yellow-400 font-medium mb-4">
              Awaiting Bank Transfer. Please upload proof of payment below.
            </div>
          ) : order.paymentMethod === "Bank Transfer" &&
            order.paymentStatus === "Awaiting_Approval" ? (
            <div className="inline-block px-4 py-2 bg-blue-900/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium mb-4">
              Proof of Payment Uploaded. Awaiting verification by our team.
            </div>
          ) : order.paymentMethod === "Bank Transfer" &&
            (order.paymentStatus === "Failed" ||
              order.paymentStatus === "Rejected") ? (
            <div className="inline-block px-4 py-2 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 font-medium mb-4">
              Your previous proof of payment was rejected. Please review and
              resubmit below.
            </div>
          ) : (
            <p className="text-[var(--color-ivory-muted)]">
              Thank you for your purchase. Your order is being processed.
            </p>
          )}
        </div>

        {/* Guest Tracking & 18+ Verification Document Compliance Notification */}
        <div className="bg-gradient-to-br from-[#17140e] via-[#100f0a] to-[#090805] border-2 border-[var(--color-gold)]/50 rounded-3xl p-6 md:p-8 mb-10 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-gold)]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-gold)]/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--color-gold)] text-black rounded-2xl shadow-lg">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-serif text-white font-bold">
                      Order Confirmed & 18+ Compliance Clearance
                    </h2>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-ivory-muted)] mt-0.5">
                    Order Ref: #{order.orderId || order.invoiceNumber || order._id}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Notification Destination Alert */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[var(--color-gold)] text-sm font-semibold">
                  <span>📱</span>
                  <span>Live Tracking & Status Updates</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Real-time courier waybill tracking links, dispatch notices, and delivery PINs will be sent directly to your channels:
                </p>
                <div className="space-y-1 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="text-white/40">Email:</span>
                    <strong className="font-mono text-[var(--color-gold)]">
                      {order.guestInfo?.email || order.shippingAddress?.email || (order.user?.email) || "On record"}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="text-white/40">SMS / Phone:</span>
                    <strong className="font-mono text-[var(--color-gold)]">
                      {order.guestInfo?.phone || order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || (order.user?.phone) || "On record"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dispatch & Compliance Status */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <FileCheck size={16} />
                  <span>{order.guestKyc?.documentUrl ? "18+ Document Under Review" : "Order Dispatch Clearance"}</span>
                </div>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  {order.guestKyc?.documentUrl ? (
                    <>Your official identification document (<strong>{(order.guestKyc.idType || "ID/Passport").toUpperCase()}</strong>) has been securely transmitted to Grand Store Administration.</>
                  ) : (
                    <>Your order and payment are confirmed. Standard fulfillment and courier dispatch preparation are underway without any document verification delays.</>
                  )}
                </p>
                <div className="text-[11px] text-emerald-400/70 pt-1 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Fulfillment in progress • No further customer action required</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Concierge Custom Advisory / Emergency Notice */}
        {(order.latestAdminMessage || (order.adminMessages && order.adminMessages.length > 0)) && (() => {
          const latestMsg = order.latestAdminMessage || order.adminMessages[order.adminMessages.length - 1];
          return (
            <div className={`p-6 rounded-2xl border mb-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.4)] ${
              latestMsg.type === 'emergency' || latestMsg.type === 'stock_issue'
                ? 'bg-rose-950/25 border-rose-500/50 text-rose-200'
                : latestMsg.type === 'warning'
                ? 'bg-amber-950/25 border-amber-500/50 text-amber-200'
                : 'bg-blue-950/25 border-blue-500/50 text-blue-200'
            }`}>
              <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider font-mono">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>
                    {latestMsg.type === 'stock_issue'
                      ? '⚠️ Out of Stock / Fulfillment Notice'
                      : latestMsg.type === 'emergency'
                      ? '🚨 Urgent Order Advisory'
                      : latestMsg.type === 'warning'
                      ? '⚠️ Important Delivery Notice'
                      : '💬 Store Concierge Message'}
                  </span>
                </div>
                {latestMsg.sentAt && (
                  <span className="text-xs font-mono opacity-60">
                    {new Date(latestMsg.sentAt).toLocaleDateString()} {new Date(latestMsg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/95 leading-relaxed font-sans pl-4 border-l-2 border-current/40 mb-3">
                {latestMsg.message}
              </p>
              <div className="text-xs opacity-75 pl-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>Sent by: {latestMsg.sentByName || 'The Grand Store Concierge'}</span>
                <span className="font-mono">Direct Support: concierge@grandstore.co.za</span>
              </div>
            </div>
          );
        })()}

        {/* Section 8: PostNet Delivery & Super Coins Loyalty Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* PostNet Delivery / Collection Card */}
          <div className="bg-white/[0.025] backdrop-blur-md border border-[var(--color-gold)]/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--color-gold)]/15 text-[var(--color-gold)] rounded-xl border border-[var(--color-gold)]/30">
                  <Truck size={22} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-gold)] block">
                    Fulfillment Status
                  </span>
                  <h3 className="text-white font-serif text-lg leading-snug">
                    {order.deliveryPreference === 'pickup' || order.selectedPostnetStore
                      ? "Your order has been received — Arriving at your PostNet collection branch"
                      : "Your order has been received — Delivery Soon"}
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {order.deliveryPreference === 'pickup' || order.selectedPostnetStore ? '2–3 Business Days' : '2–5 Business Days'}
              </span>
            </div>

            {order.deliveryPreference === 'pickup' || order.selectedPostnetStore ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
                  <div className="text-xs text-[var(--color-gold)] font-bold flex items-center gap-1.5">
                    <MapPin size={14} /> {order.selectedPostnetStore?.name || 'Selected PostNet Branch'}
                  </div>
                  <div className="text-xs text-white/80 leading-relaxed">
                    {order.selectedPostnetStore?.address || 'Branch pickup location'}
                  </div>
                  {order.selectedPostnetStore?.hours && (
                    <div className="text-[11px] text-white/50 pt-1 border-t border-white/5 flex items-center gap-1.5">
                      <Clock size={12} /> {order.selectedPostnetStore.hours}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-white/60 bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 rounded-xl p-3 space-y-1">
                  <div className="text-[var(--color-gold)] font-semibold flex items-center gap-1.5">
                    <ShieldCheck size={13} /> PIN Code & ID Collection Notice
                  </div>
                  <p>
                    An SMS and email containing your secure collection PIN will be sent as soon as your parcel arrives. Present your South African ID, passport, or driver's license at the counter.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-1">
                  <div className="text-xs text-[var(--color-gold)] font-bold flex items-center gap-1.5">
                    <MapPin size={14} /> Delivery Address
                  </div>
                  <div className="text-xs text-white/80">
                    {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                  </div>
                </div>
                <div className="text-[11px] text-white/60 bg-white/[0.02] border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" /> 18+ Verification & Gate Access
                  </div>
                  <p>
                    PostNet courier will contact you via phone before arrival. Valid 18+ adult signature is required upon delivery.
                  </p>
                </div>
              </div>
            )}

            {/* Gift Delivery Details Card */}
            {order.isGift && (
              <div className="mt-3 p-3.5 bg-[var(--color-gold)]/10 rounded-xl border border-[var(--color-gold)]/30 space-y-1.5">
                <div className="text-xs text-[var(--color-gold)] font-bold flex items-center gap-1.5">
                  <Gift size={14} /> Special Gift Delivery
                </div>
                {order.giftRecipientName && (
                  <div className="text-xs text-white">
                    <span className="text-white/60">For:</span> <strong className="text-white">{order.giftRecipientName}</strong>
                  </div>
                )}
                {order.giftMessage && (
                  <div className="text-xs italic text-[var(--color-ivory-muted)] bg-black/40 p-2 rounded-lg border border-white/5">
                    "{order.giftMessage}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Super Coins Loyalty & Tracking Card */}
          <div className="bg-gradient-to-br from-[#13120e] via-[#0e0e0e] to-black border border-[var(--color-gold)]/30 rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[var(--color-gold)]/20 text-[var(--color-gold)] rounded-xl border border-[var(--color-gold)]/40">
                    <Coins size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-gold)] block">
                      Grand Store Loyalty
                    </span>
                    <h3 className="text-white font-serif text-lg">Super Coins Status</h3>
                  </div>
                </div>
                <Link
                  to="/customer/super-coins"
                  className="text-xs text-[var(--color-gold)] hover:underline flex items-center gap-1"
                >
                  Wallet <ArrowRight size={12} />
                </Link>
              </div>

              <div className="space-y-3">
                {order.superCoinsEarned > 0 ? (
                  <div className="p-3.5 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[var(--color-gold)] flex items-center gap-1.5">
                        🪙 +{order.superCoinsEarned} Super Coins Earned!
                      </div>
                      <div className="text-[11px] text-white/60 mt-0.5">
                        Will be credited to your wallet once order is delivered.
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[var(--color-gold)] font-bold bg-[var(--color-gold)]/15 px-2 py-1 rounded">
                      +R{(order.superCoinsEarned * 0.10).toFixed(2)} Value
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/60">
                    Coins earned on eligible product spend will activate upon completion.
                  </div>
                )}

                {order.superCoinsUsed > 0 && (
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-white/70">Coins Redeemed on this Order:</span>
                    <span className="font-mono text-[var(--color-gold)] font-semibold">
                      {order.superCoinsUsed} Coins (-R{Number(order.superCoinsDiscount || 0).toFixed(2)})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
              <Link
                to={user ? "/customer/orders" : "/shop"}
                className="w-full bg-gradient-to-r from-[#c9a35b] to-[#b58b38] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] text-black font-bold uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Package size={15} /> {user ? "Track My Order" : "Continue Shopping"}
              </Link>
            </div>
          </div>
        </div>

        {/* Post-Order 1-Click Account Creation (Section 6 & Quick Buyer) */}
        {(!user || order.isGuest) && !accountCreated && (
          <div className="bg-gradient-to-br from-[#1a160d] via-[#12100a] to-[#0a0a0a] border-2 border-[var(--color-gold)]/40 rounded-2xl p-6 md:p-8 mb-10 shadow-[0_0_35px_rgba(212,175,55,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--color-gold)]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[var(--color-gold)]/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--color-gold)] text-black">
                    <Coins size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-white font-bold">
                      Claim Your 100 Welcome Super Coins
                    </h3>
                    <p className="text-xs text-[var(--color-ivory-muted)]">
                      Create an account to track this order, get 100 Super Coins (R10.00 value), and save your details for next time.
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-center px-3 py-1 bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/40 text-[var(--color-gold)] text-xs font-bold uppercase tracking-wider rounded-full shrink-0">
                  +100 Coins Bonus
                </span>
              </div>

              {accountError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{accountError}</span>
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={order.guestInfo?.email || order.shippingAddress?.email || ""}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                    Create Password (Min. 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter a secure password..."
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={convertingAccount || !accountPassword}
                  className="w-full bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {convertingAccount ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
                  ) : (
                    <>Activate & Claim 100 Coins <ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {accountCreated && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Account Created Successfully!</p>
                <p className="text-xs text-emerald-300/80">
                  100 Welcome Super Coins have been credited to your wallet and this order is linked to your profile.
                </p>
              </div>
            </div>
            <Link
              to="/customer/orders"
              className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shrink-0"
            >
              View Order in Dashboard
            </Link>
          </div>
        )}

        {/* Bank Transfer Upload Form */}
        {order.paymentMethod === "Bank Transfer" &&
          (order.paymentStatus === "Pending" ||
            order.paymentStatus === "Failed" ||
            order.paymentStatus === "Rejected") && (
            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[var(--color-gold)]/20 shadow-[0_0_30px_rgba(212,175,55,0.05)] rounded-2xl p-8 md:p-12 mb-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-serif text-[var(--color-gold)] mb-2">
                  Upload Proof of Payment
                </h3>
                <p className="text-sm text-[var(--color-ivory-muted)] mb-6">
                  Please transfer exactly{" "}
                  <strong className="text-white">
                    <Price amount={order.totalPrice} />
                  </strong>{" "}
                  to our bank account.
                </p>

                <StoreBankDetailsCard
                  reference={(order.invoiceNumber || order._id).slice(-6).toUpperCase()}
                  referenceLabel="Order Reference"
                  className="max-w-xl mx-auto mb-6"
                />

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const url = e.target.proofUrl.value;
                    if (!url) return;
                    try {
                      await api.post(`/orders/${order._id}/bank-transfer/upload`, { proofUrl: url });
                      window.location.reload();
                    } catch (error) {
                      alert(error.response?.data?.message || "Failed to upload proof");
                    }
                  }}
                  className="max-w-sm mx-auto text-left"
                >
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">
                    Proof of Payment URL (Image/PDF)
                  </label>
                  <input
                    name="proofUrl"
                    type="url"
                    required
                    placeholder="https://..."
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors mb-4"
                  />

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#c9a35b] to-[#b58b38] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    Submit Proof
                  </button>
                </form>
              </div>
            </div>
          )}

        {/* Invoice Display for Screen */}
        {!(
          order.paymentMethod === "Bank Transfer" &&
          ["Pending", "Awaiting_Approval"].includes(order.paymentStatus)
        ) && (
          <>
            <div className="bg-gradient-to-br from-[#161616] to-[#0a0a0a] text-white border border-[#c9a35b]/20 shadow-[0_8px_30px_rgba(212,175,55,0.05)] rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a35b]/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start border-b border-white/10 pb-8 mb-8">
                <div>
                  <img
                    src="/logo.png"
                    alt="The Grand Store"
                    className="h-10 w-auto object-contain mb-4"
                  />
                  <div className="text-sm text-[var(--color-ivory-muted)]">
                    Premium Goods & Accessories
                  </div>
                  <div className="text-xs text-[var(--color-ivory-muted)]/50 mt-1">
                    VAT No: 123456789
                  </div>
                </div>
                <div className="mt-6 md:mt-0 text-left md:text-right">
                  <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Invoice Number
                  </div>
                  <div className="font-mono text-white font-medium">
                    {order.invoiceNumber || order._id}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mt-4 mb-1">
                    Date
                  </div>
                  <div className="text-white font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-white/10 pb-8">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">
                    Billed To
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {order.user?.name || order.guestInfo?.name || order.shippingAddress?.name || "Valued Customer"}
                  </div>
                  <div className="text-sm text-[var(--color-ivory-muted)]">
                    {order.user?.email || order.guestInfo?.email || order.shippingAddress?.email || ""}
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">
                    Shipped To
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {order.shippingAddress?.address}
                  </div>
                  <div className="text-sm text-[var(--color-ivory-muted)]">
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.postalCode}
                  </div>
                  <div className="text-sm text-[var(--color-ivory-muted)]">
                    {order.shippingAddress?.country}
                  </div>
                </div>
              </div>

              {/* Gift Note in Tax Invoice */}
              {order.isGift && (
                <div className="relative z-10 mb-8 p-4 bg-[var(--color-gold)]/5 rounded-xl border border-[var(--color-gold)]/20">
                  <div className="text-xs font-bold text-[var(--color-gold)] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Gift size={14} /> Complimentary Gift Packaging & Personal Note
                  </div>
                  {order.giftRecipientName && (
                    <div className="text-xs text-white mb-1">
                      <strong>Recipient:</strong> {order.giftRecipientName}
                    </div>
                  )}
                  {order.giftMessage && (
                    <div className="text-xs text-white/80 italic">
                      "{order.giftMessage}"
                    </div>
                  )}
                </div>
              )}

              <div className="relative z-10 mb-8">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[var(--color-ivory-muted)]">
                      <th className="pb-3 font-semibold uppercase tracking-widest text-xs">
                        Item
                      </th>
                      <th className="pb-3 font-semibold uppercase tracking-widest text-xs text-right hidden md:table-cell">
                        Qty
                      </th>
                      <th className="pb-3 font-semibold uppercase tracking-widest text-xs text-right">
                        Price
                      </th>
                      <th className="pb-3 font-semibold uppercase tracking-widest text-xs text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {order.orderItems?.map((item, index) => (
                      <tr key={index}>
                        <td className="py-4">
                          <div className="flex items-center gap-4">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-contain bg-white/[0.02] rounded border border-white/5"
                              />
                            )}
                            <div>
                              <div className="text-white font-semibold">
                                {item.name}
                              </div>
                              {item.vendorName && (
                                <div className="text-xs text-[var(--color-ivory-muted)]">
                                  Sold by {item.vendorName}
                                </div>
                              )}
                              <div className="md:hidden text-[var(--color-ivory-muted)] mt-1">
                                Qty: {item.qty}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right text-white font-medium hidden md:table-cell">
                          {item.qty || item.quantity}
                        </td>
                        <td className="py-4 text-right text-white font-medium">
                          <Price amount={item.price} />
                        </td>
                        <td className="py-4 text-right text-white font-medium">
                          <Price
                            amount={
                              item.price * (item.qty || item.quantity || 1)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="relative z-10 flex justify-end pt-6 mb-8">
                <div className="w-full md:w-80 space-y-2">
                  <div className="flex justify-between items-center py-2 text-sm text-[var(--color-ivory-muted)]">
                    <span>Subtotal</span>
                    <span className="font-mono text-base font-medium text-white">
                      <Price amount={(order.totalPrice - order.shippingCost) + (order.superCoinsDiscount || 0)} />
                    </span>
                  </div>
                  {order.superCoinsDiscount > 0 && (
                    <div className="flex justify-between items-center py-1.5 text-sm text-[var(--color-gold)] font-medium">
                      <span className="flex items-center gap-1.5">
                        <Coins size={14} /> Super Coins ({order.superCoinsUsed} coins)
                      </span>
                      <span className="font-mono text-base">
                        - <Price amount={order.superCoinsDiscount} />
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 text-sm text-[var(--color-ivory-muted)] border-b border-white/10">
                    <span>Shipping</span>
                    <span className="font-mono text-base font-medium text-white">
                      {order.shippingCost === 0 ? (
                        "Complimentary"
                      ) : (
                        <Price amount={order.shippingCost} />
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 text-xl text-[#c9a35b] font-bold">
                    <span className="font-serif">Total</span>
                    <span className="font-mono text-2xl">
                      <Price amount={order.totalPrice} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-xs text-[var(--color-ivory-muted)]">
                    <span>Payment Method</span>
                    <span className="font-medium text-white whitespace-nowrap">{order.paymentMethod} (Paid)</span>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="relative z-10 mt-8 pt-8 border-t border-dashed border-white/20 text-center text-xs text-[var(--color-ivory-muted)] space-y-2">
                <p className="font-medium text-white">Thank you for shopping with The Grand Store.</p>
                <p>All sales are subject to our standard terms and conditions.</p>
                <div className="flex items-center justify-center gap-4 mt-4 pt-2">
                  <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                  <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                  <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
              <Link
                to="/shop"
                className="text-sm uppercase tracking-widest hover:text-gold-gradient transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Continue Shopping
              </Link>
              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {isGenerating ? "Generating PDF..." : "Download Receipt (PDF)"}
              </button>
            </div>
          </>
        )}

        {order.paymentMethod !== "Bank Transfer" && (
          <div className="mt-8 text-center">
            <Link
              to={user ? "/customer/orders" : "/shop"}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 max-w-sm mx-auto"
            >
              {user ? "View My Orders" : "Continue Shopping"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
