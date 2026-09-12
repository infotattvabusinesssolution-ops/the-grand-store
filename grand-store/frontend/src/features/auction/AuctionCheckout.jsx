import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api';
import { 
  ChevronRight, ArrowRight, ShieldCheck, CreditCard, Loader2, 
  Landmark, UploadCloud, CheckCircle2, Copy, FileText, X, ExternalLink, Clock, Sparkles, Phone, Eye, AlertTriangle
} from 'lucide-react';
import LocationInput from '../../components/LocationInput';
import PaymentForm from '../checkout/PaymentForm';
import Price from '../../components/ui/Price';
import ReceiptPreviewModal from './components/ReceiptPreviewModal';
import StoreBankDetailsCard from '../../components/StoreBankDetailsCard';

export default function AuctionCheckout({ onNotify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentQuery = searchParams.get('payment');
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Flow State: 1 = Address, 2 = Payment
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [dynamicShipping, setDynamicShipping] = useState(0);

  // Payment selection: 'payfast' | 'bank_transfer'
  const [paymentMethod, setPaymentMethod] = useState('payfast');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [proofFileSize, setProofFileSize] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [bankTransferSubmitted, setBankTransferSubmitted] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo')) || {};
    } catch {
      return {};
    }
  })();

  const [formData, setFormData] = useState({
    firstName: storedUser.name ? storedUser.name.split(' ')[0] : '',
    lastName: storedUser.name && storedUser.name.split(' ').length > 1 ? storedUser.name.split(' ').slice(1).join(' ') : '',
    phone: storedUser.phone || storedUser.phoneNumber || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'South Africa'
  });

  const [paymentData, setPaymentData] = useState(null);
  const [payfastUrl, setPayfastUrl] = useState(null);

  const fetchLot = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const headers = userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {};
      const res = await api.get(`/auction/${id}`, { headers });
      const fetchedLot = res.data?.lot;

      if (fetchedLot) {
        setLot(fetchedLot);

        // 1. Pre-fill address if previously saved
        if (fetchedLot.shippingAddress) {
          setFormData(prev => ({
            ...prev,
            address: fetchedLot.shippingAddress.address || prev.address,
            city: fetchedLot.shippingAddress.city || prev.city,
            postalCode: fetchedLot.shippingAddress.postalCode || prev.postalCode,
            country: fetchedLot.shippingAddress.country || prev.country,
            phone: fetchedLot.shippingAddress.phone || fetchedLot.shippingAddress.phoneNumber || prev.phone
          }));
        }

        // 2. Shipping cost
        if (fetchedLot.shippingCost) {
          setDynamicShipping(fetchedLot.shippingCost);
        }

        // 3. Order reference
        if (fetchedLot.order) {
          setCreatedOrder(fetchedLot.order);
        }

        // 4. Proof of payment URL
        if (fetchedLot.proofUrl) {
          setProofUrl(fetchedLot.proofUrl);
        }

        // 5. If EFT proof was already submitted or is awaiting approval
        if (fetchedLot.paymentStatus === 'Awaiting_Approval' || Boolean(fetchedLot.proofUrl)) {
          setBankTransferSubmitted(true);
          setPaymentMethod('bank_transfer');
          setCheckoutStep(2);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Auction Checkout – The Grand Store';
    window.scrollTo({ top: 0, behavior: 'auto' });
    fetchLot();

    if (paymentQuery === 'success' && id) {
      api.post('/payfast/confirm-order', { auctionId: id })
        .then(() => fetchLot())
        .catch(err => console.log('Confirm auction payment error:', err));
    } else if (paymentQuery === 'cancel' && id) {
      api.post('/payfast/cancel-payment', { auctionId: id, reason: 'Customer cancelled PayFast session' })
        .then(() => fetchLot())
        .catch(err => console.log('Cancel auction payment error:', err));
    }
  }, [id, paymentQuery]);

  const handleRetryPayFast = async () => {
    setProcessing(true);
    try {
      const pfRes = await api.post('/payfast/generate-auction', {
        auctionId: id,
        shippingCost: dynamicShipping
      });
      setPayfastUrl(pfRes.data.url);
      setPaymentData(pfRes.data.data);
    } catch (err) {
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to initialize PayFast retry');
      setProcessing(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    if (formData.country.toLowerCase() === 'south africa') {
      setDynamicShipping(250);
    } else {
      setDynamicShipping(1500); // International
    }
    setCheckoutStep(2);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB limit check
    if (file.size > 10 * 1024 * 1024) {
      if (onNotify) onNotify('Selected file exceeds the 10 MB limit. Please choose a smaller file.');
      if (e.target) e.target.value = '';
      return;
    }

    setProofFileName(file.name);
    const sizeInKb = Math.round(file.size / 1024);
    setProofFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`);

    setUploadingProof(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('document', file);
      const res = await api.post('/vendor/upload-public', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProofUrl(res.data.url);
      if (onNotify) onNotify('Proof of payment receipt uploaded successfully');
    } catch (err) {
      console.error('File upload error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to upload receipt file';
      if (onNotify) onNotify(msg);
    } finally {
      setUploadingProof(false);
      if (e.target) e.target.value = '';
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);

    if (paymentMethod === 'bank_transfer' && !proofUrl) {
      if (onNotify) onNotify('Please upload your proof of payment screenshot or enter a receipt link before proceeding.');
      setProcessing(false);
      return;
    }

    try {
      // 1. Save shipping & order payment method
      const res = await api.post(`/auction/${id}/pay`, {
        shippingAddress: { 
          address: formData.address, 
          city: formData.city, 
          postalCode: formData.postalCode, 
          country: formData.country,
          phone: formData.phone || storedUser.phone || storedUser.phoneNumber || '',
          phoneNumber: formData.phone || storedUser.phone || storedUser.phoneNumber || ''
        },
        calculatedShipping: dynamicShipping,
        paymentMethod: paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'PayFast',
        proofUrl: proofUrl || ''
      });

      setCreatedOrder(res.data.order);

      // If Bank Transfer, complete the user flow and switch to confirmation state
      if (paymentMethod === 'bank_transfer') {
        setBankTransferSubmitted(true);
        setProcessing(false);
        if (onNotify) onNotify('Proof of payment submitted! Admin will verify your transfer.');
        return;
      }
      
      // 2. If PayFast, request PayFast signature and auto-submit form
      const pfRes = await api.post('/payfast/generate-auction', { auctionId: id });

      setPayfastUrl(pfRes.data.url);
      setPaymentData(pfRes.data.data);
      
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify(err.response?.data?.message || 'Payment processing failed');
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white bg-[#050505]">Loading Secure Checkout...</div>;
  if (!lot) return <div className="min-h-screen flex items-center justify-center text-white bg-[#050505]">Lot not found</div>;

  const isPaid = Boolean(lot.isPaid || lot.paymentStatus === 'Paid');
  const isAwaitingApproval = !isPaid && Boolean(bankTransferSubmitted || lot.paymentStatus === 'Awaiting_Approval' || lot.proofUrl);
  const total = (lot.winningBid || 0) + (lot.buyerPremiumAmount || 0) + (lot.barChargeAmount || 0) + (lot.vatAmount || 0) + dynamicShipping;
  const paymentReference = lot.order?.transactionId || lot.gsReference || `AUC-${lot.lotNumber || lot._id.slice(-6).toUpperCase()}`;

  if (paymentQuery === 'cancel' && !isPaid) {
    return (
      <main className="min-h-screen bg-[#050505] text-[var(--color-ivory)] pt-20 pb-24 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6 w-full text-center animate-fadeIn">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-rose-500/15 border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <AlertTriangle size={40} className="text-rose-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4 text-white">
            Payment Cancelled
          </h1>

          <div className="space-y-4 max-w-md mx-auto mb-6">
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl text-rose-200 text-sm leading-relaxed">
              You cancelled your auction settlement payment on PayFast. No funds were debited, and this settlement draft has been cancelled.
            </div>
            <div className="flex flex-col items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetryPayFast}
                disabled={processing}
                className="w-full py-3.5 px-8 rounded-full bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs hover:opacity-95 shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Connecting to PayFast...
                  </>
                ) : (
                  `Retry Payment with PayFast (R${total.toLocaleString()})`
                )}
              </button>
              <div className="flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/auction/checkout/${id}`);
                    setCheckoutStep(2);
                    setPaymentMethod('bank_transfer');
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-widest text-[11px] transition-all text-center border border-white/10 cursor-pointer"
                >
                  Pay via Bank EFT
                </button>
                <Link
                  to="/auction"
                  className="flex-1 py-3 px-4 rounded-full bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold uppercase tracking-widest text-[11px] transition-all text-center"
                >
                  Return to Auctions
                </Link>
              </div>
            </div>
          </div>
        </div>
        <PaymentForm paymentData={paymentData} payfastUrl={payfastUrl} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[var(--color-ivory)] pt-0 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mb-4">
            <Link to={`/auction/${id}`} className="hover:text-gold-gradient transition-colors">Lot {lot.lotNumber || lot._id.slice(-6).toUpperCase()}</Link>
            <ChevronRight size={12} />
            <span className={checkoutStep === 1 && !isPaid && !isAwaitingApproval ? "text-gold-gradient font-medium" : ""}>Delivery</span>
            <ChevronRight size={12} />
            <span className={checkoutStep === 2 && !isPaid && !isAwaitingApproval ? "text-gold-gradient font-medium" : ""}>Payment</span>
            {isAwaitingApproval && (
              <>
                <ChevronRight size={12} />
                <span className="text-gold-gradient font-medium">Verification</span>
              </>
            )}
            {isPaid && (
              <>
                <ChevronRight size={12} />
                <span className="text-emerald-400 font-medium">Settled</span>
              </>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif">
            {isPaid ? 'Acquisition Settled & Paid' : isAwaitingApproval ? 'Order Awaiting Verification' : 'Auction Checkout'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column - Forms */}
          <div className="lg:col-span-7 flex flex-col gap-10">
            
            {/* Case A: Settled & Paid */}
            {isPaid ? (
              <div className="bg-gradient-to-br from-[#0e1610] via-[#0a0f0b] to-[#050505] border border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_35px_rgba(16,185,129,0.15)]">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-3">
                  <ShieldCheck size={12} /> Acquisition Settled & Verified
                </div>

                <h3 className="text-2xl font-serif text-white mb-2">Acquisition Successfully Settled</h3>
                <p className="text-sm text-[var(--color-ivory-muted)] font-light leading-relaxed mb-6">
                  Payment for <strong className="text-white">{lot.title}</strong> has been completely verified and recorded in the Grand Store escrow ledger.
                </p>

                <div className="bg-black/50 border border-white/5 rounded-2xl p-5 mb-6 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Reference / Transaction ID</span>
                    <span className="font-mono text-[var(--color-gold)] font-bold">{paymentReference}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Total Settled</span>
                    <span className="font-serif text-white font-bold text-sm"><Price amount={lot.totalPaidByBuyer || total} /></span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Payment Status</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 size={11} /> Settled in Full
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Vault & Dispatch Status</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                      <Sparkles size={11} className="text-[#e1bd70]" /> Bonded Release In Progress
                    </span>
                  </div>
                  {(lot.shippingAddress || formData.address) && (
                    <div className="pt-2 text-[11px] text-white/70">
                      <span className="text-white/40 uppercase tracking-wider text-[10px] block mb-1">Destination Address</span>
                      <p>
                        {lot.shippingAddress?.address || formData.address}, {lot.shippingAddress?.city || formData.city}, {lot.shippingAddress?.country || formData.country}
                      </p>
                    </div>
                  )}
                  {proofUrl && (
                    <div className="pt-2">
                      <span className="text-white/40 uppercase tracking-wider text-[10px] block mb-1.5">Submitted Proof Receipt</span>
                      <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-xl border border-white/10">
                        {/\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(proofUrl) ? (
                          <img src={proofUrl} alt="Receipt Preview" className="w-12 h-12 object-cover rounded border border-white/10" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center text-[var(--color-gold)]">
                            <FileText size={20} />
                          </div>
                        )}
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 underline truncate"
                        >
                          <ExternalLink size={12} /> View Verification Document
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-8 text-xs text-white/60 leading-relaxed space-y-2">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#e1bd70]" /> Next Steps:
                  </p>
                  <p>1. The vault master is preparing your numbered bottle in tamper-evident security packaging.</p>
                  <p>2. Courier tracking details will be transmitted to your registered phone and email.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/customer/auctions"
                    className="flex-1 py-3.5 px-6 rounded-xl bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs text-center hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
                  >
                    View My Won Lots
                  </Link>
                  <Link
                    to={`/auction/${id}`}
                    className="py-3.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs text-center border border-white/10 transition-colors"
                  >
                    View Lot Dossier
                  </Link>
                  <Link
                    to="/auction"
                    className="py-3.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs text-center border border-white/10 transition-colors"
                  >
                    Explore Live Auctions
                  </Link>
                </div>
              </div>
            ) : isAwaitingApproval ? (
              /* Case B: Bank Transfer Success / Awaiting Approval Screen */
              <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[var(--color-gold)]/30 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>

                <h3 className="text-2xl font-serif text-white mb-2">Bank Transfer Proof Submitted</h3>
                <p className="text-sm text-[var(--color-ivory-muted)] font-light leading-relaxed mb-6">
                  Your proof of payment for <strong className="text-white">{lot.title}</strong> has been received and routed directly to the Grand Store administrative and finance desk for verification.
                </p>

                <div className="bg-black/50 border border-white/5 rounded-2xl p-5 mb-6 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Reference Number</span>
                    <span className="font-mono text-[var(--color-gold)] font-bold">{paymentReference}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Total Transferred</span>
                    <span className="font-serif text-white font-bold text-sm"><Price amount={total} /></span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Review Status</span>
                    <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Clock size={11} /> Awaiting Admin Approval
                    </span>
                  </div>
                  {proofUrl && (
                    <div className="pt-2">
                      <span className="text-white/40 uppercase tracking-wider text-[10px] block mb-1.5">Submitted Proof Receipt</span>
                      <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-xl border border-white/10">
                        {/\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(proofUrl) ? (
                          <img src={proofUrl} alt="Receipt Preview" className="w-12 h-12 object-cover rounded border border-white/10" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center text-[var(--color-gold)]">
                            <FileText size={20} />
                          </div>
                        )}
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 underline truncate"
                        >
                          <ExternalLink size={12} /> View Uploaded Document
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBankTransferSubmitted(false);
                        setCheckoutStep(2);
                        setPaymentMethod('bank_transfer');
                      }}
                      className="text-[11px] text-[var(--color-gold)] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud size={13} /> Need to replace or update your uploaded receipt? Click here
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-8 text-xs text-white/60 leading-relaxed space-y-2">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#e1bd70]" /> What Happens Next:
                  </p>
                  <p>1. Our compliance team verifies your bank deposit against the auction escrow account.</p>
                  <p>2. Once verified, the lot status immediately transitions to <strong>Paid</strong> and bonded vault dispatch begins.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/customer/auctions"
                    className="flex-1 py-3.5 px-6 rounded-xl bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs text-center hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
                  >
                    View My Auctions
                  </Link>
                  <Link
                    to="/auction"
                    className="py-3.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs text-center border border-white/10 transition-colors"
                  >
                    Explore Live Auctions
                  </Link>
                </div>
              </div>
            ) : checkoutStep === 1 ? (
              <form onSubmit={handleContinueToPayment}>
                <section className="border-t border-white/10 pt-0 mb-8">
                  <h2 className="text-xl font-serif mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-sans">1</span>
                    Delivery Address
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">First Name</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] flex items-center gap-1.5">
                          <Phone size={13} className="text-[var(--color-gold)]" /> Contact Phone Number (For Courier Tracking)
                        </label>
                        {(storedUser.phone || storedUser.phoneNumber) && formData.phone === (storedUser.phone || storedUser.phoneNumber) && (
                          <span className="text-[10px] text-[var(--color-gold)] font-medium flex items-center gap-1 bg-[var(--color-gold)]/10 px-2 py-0.5 rounded-full border border-[var(--color-gold)]/20">
                            <CheckCircle2 size={11} /> Auto-filled from profile
                          </span>
                        )}
                      </div>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. +27 82 123 4567" 
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors text-white" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Street Address</label>
                      <LocationInput 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        onPlaceDetails={({ city, postalCode, country }) => {
                          setFormData(prev => ({
                            ...prev,
                            city: city,
                            postalCode: postalCode,
                            country: country
                          }));
                        }}
                        required 
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors text-white" 
                        placeholder="Start typing your address..." 
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">City</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Postal Code</label>
                      <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Country</label>
                      <input type="text" name="country" value={formData.country} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors text-white" />
                    </div>
                  </div>
                </section>
                <button 
                  type="submit" 
                  className="w-full bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Continue to Payment <ArrowRight size={16} />
                </button>
              </form>
            ) : bankTransferSubmitted ? (
              /* Step 3: Bank Transfer Success / Awaiting Approval Screen */
              <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[var(--color-gold)]/30 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>

                <h3 className="text-2xl font-serif text-white mb-2">Bank Transfer Proof Submitted</h3>
                <p className="text-sm text-[var(--color-ivory-muted)] font-light leading-relaxed mb-6">
                  Your proof of payment for <strong className="text-white">{lot.title}</strong> has been received and routed directly to the Grand Store administrative and finance desk for verification.
                </p>

                <div className="bg-black/50 border border-white/5 rounded-2xl p-5 mb-6 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Reference Number</span>
                    <span className="font-mono text-[var(--color-gold)] font-bold">{paymentReference}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Total Transferred</span>
                    <span className="font-serif text-white font-bold text-sm"><Price amount={total} /></span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Review Status</span>
                    <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Clock size={11} /> Awaiting Admin Approval
                    </span>
                  </div>
                  {proofUrl && (
                    <div className="pt-2">
                      <span className="text-white/40 uppercase tracking-wider text-[10px] block mb-1.5">Submitted Proof Receipt</span>
                      <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-xl border border-white/10">
                        {/\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(proofUrl) ? (
                          <img src={proofUrl} alt="Receipt Preview" className="w-12 h-12 object-cover rounded border border-white/10" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center text-[var(--color-gold)]">
                            <FileText size={20} />
                          </div>
                        )}
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 underline truncate"
                        >
                          <ExternalLink size={12} /> View Uploaded Document
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-8 text-xs text-white/60 leading-relaxed space-y-2">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#e1bd70]" /> What Happens Next:
                  </p>
                  <p>1. Our compliance team verifies your bank deposit against the auction escrow account.</p>
                  <p>2. Once verified, the lot status immediately transitions to <strong>Paid</strong> and bonded vault dispatch begins.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/customer/auctions"
                    className="flex-1 py-3.5 px-6 rounded-xl bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs text-center hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
                  >
                    View My Auctions
                  </Link>
                  <Link
                    to="/auction"
                    className="py-3.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs text-center border border-white/10 transition-colors"
                  >
                    Explore Live Auctions
                  </Link>
                </div>
              </div>
            ) : (
              /* Step 2: Payment Method Choice (PayFast vs Bank Transfer) */
              <form onSubmit={handlePay}>
                <div className="mb-6 pb-6 border-b border-white/10 flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-medium">Delivery to: {formData.city}, {formData.country}</h3>
                    <p className="text-xs text-[var(--color-ivory-muted)] mt-1">{formData.address}, {formData.postalCode}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setCheckoutStep(1)} 
                    className="text-xs text-gold-gradient uppercase tracking-widest hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <section className="border-t border-white/10 pt-8">
                  <h2 className="text-xl font-serif flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-sans">2</span>
                    Payment Method
                  </h2>

                  {/* Dual Method Selection Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Option 1: PayFast */}
                    <label 
                      className={`cursor-pointer bg-[#0a0a0a] border rounded-2xl p-5 relative overflow-hidden transition-all flex flex-col justify-between ${
                        paymentMethod === 'payfast' 
                          ? 'border-[var(--color-gold)] shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-[var(--color-gold)]/50' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="payfast" 
                        checked={paymentMethod === 'payfast'} 
                        onChange={(e) => setPaymentMethod(e.target.value)} 
                        className="hidden" 
                      />
                      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                        <CreditCard size={70} />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white text-base">PayFast (Instant)</h4>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'payfast' ? 'border-[var(--color-gold)]' : 'border-white/30'}`}>
                            {paymentMethod === 'payfast' && <div className="w-2 h-2 rounded-full bg-[var(--color-gold)]"></div>}
                          </div>
                        </div>
                        <p className="text-xs text-[var(--color-ivory-muted)] mb-4 leading-relaxed">
                          Instant checkout via Credit/Debit Card, Instant EFT, or Masterpass.
                        </p>
                      </div>

                      {/* Official PayFast Logo Container */}
                      <div className="relative z-10 pt-2">
                        <div className="inline-flex items-center justify-center rounded-lg bg-white px-3.5 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.35)] min-w-[120px]">
                          <img
                            src="https://res.cloudinary.com/oioqrgj0/image/upload/v1787729897/grand-store/assets/pkv0g8anwi079fvihl2e.png"
                            alt="PayFast"
                            className="h-9 w-auto object-contain"
                          />
                        </div>
                      </div>
                    </label>

                    {/* Option 2: Manual Bank Transfer */}
                    <label 
                      className={`cursor-pointer bg-[#0a0a0a] border rounded-2xl p-5 relative overflow-hidden transition-all flex flex-col justify-between ${
                        paymentMethod === 'bank_transfer' 
                          ? 'border-[var(--color-gold)] shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-[var(--color-gold)]/50' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="bank_transfer" 
                        checked={paymentMethod === 'bank_transfer'} 
                        onChange={(e) => setPaymentMethod(e.target.value)} 
                        className="hidden" 
                      />
                      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                        <Landmark size={70} />
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white text-base">Manual Bank Transfer</h4>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'border-[var(--color-gold)]' : 'border-white/30'}`}>
                            {paymentMethod === 'bank_transfer' && <div className="w-2 h-2 rounded-full bg-[var(--color-gold)]"></div>}
                          </div>
                        </div>
                        <p className="text-xs text-[var(--color-ivory-muted)] mb-4 leading-relaxed">
                          Electronic Funds Transfer (EFT) directly to our escrow account with proof verification.
                        </p>
                      </div>

                      <div className="relative z-10 pt-2 flex items-center gap-2 text-xs text-[var(--color-gold)] font-medium">
                        <ShieldCheck size={16} /> Admin Verified Escrow
                      </div>
                    </label>
                  </div>

                  {/* Bank Transfer Details & Proof Upload Section */}
                  {paymentMethod === 'bank_transfer' ? (
                    <div className="space-y-5 animate-fadeIn">
                      <StoreBankDetailsCard
                        reference={paymentReference}
                        referenceLabel="Required Reference"
                        title="Grand Store Escrow Banking Details"
                        subtitle="EFT settlement account for auction winning lot"
                        onNotify={onNotify}
                      />

                      {/* Screenshot / Proof Upload Card */}
                      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 md:p-6">
                        <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                          <UploadCloud size={16} className="text-[#e1bd70]" /> Proof of Payment (Screenshot / Receipt)
                        </h4>
                        <p className="text-xs text-[var(--color-ivory-muted)] mb-4">
                          Upload your EFT screenshot or PDF receipt. Our administrative desk verifies the transfer and marks the lot as Paid.
                        </p>

                        {proofUrl ? (
                          <div className="p-4 rounded-xl bg-black/60 border border-[#e1bd70]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                              {/\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(proofUrl) ? (
                                <button
                                  type="button"
                                  onClick={() => setShowReceiptPreview(true)}
                                  className="relative group cursor-pointer flex-shrink-0"
                                  title="Click to preview receipt"
                                >
                                  <img src={proofUrl} alt="Proof" className="w-12 h-12 object-cover rounded-lg border border-white/15 group-hover:border-[#e1bd70] transition-colors" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity text-white">
                                    <Eye size={14} />
                                  </div>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowReceiptPreview(true)}
                                  className="w-12 h-12 rounded-lg bg-white/10 hover:bg-[#e1bd70]/20 flex items-center justify-center text-[#e1bd70] border border-white/10 hover:border-[#e1bd70]/40 transition-colors cursor-pointer flex-shrink-0"
                                  title="Click to preview PDF receipt"
                                >
                                  <FileText size={22} />
                                </button>
                              )}
                              <div className="overflow-hidden min-w-0">
                                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 truncate">
                                  <CheckCircle2 size={13} className="flex-shrink-0" />
                                  <span>Receipt Attached</span>
                                  {proofFileSize && (
                                    <span className="text-[10px] text-white/40 font-normal">({proofFileSize})</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-white/80 font-medium truncate max-w-[200px] sm:max-w-[260px] mt-0.5">
                                  {proofFileName || (proofUrl.includes('.pdf') || proofUrl.includes('/raw/upload/') ? 'EFT_Payment_Proof.pdf' : 'Receipt_Screenshot.jpg')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowReceiptPreview(true)}
                                className="px-3 py-1.5 rounded-lg bg-[#e1bd70]/10 hover:bg-[#e1bd70]/20 text-[#e1bd70] border border-[#e1bd70]/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Eye size={13} /> Quick View
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setProofUrl('');
                                  setProofFileName('');
                                  setProofFileSize('');
                                }}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
                                title="Remove file and select another"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 rounded-xl hover:border-[#e1bd70]/50 bg-black/30 cursor-pointer transition-colors">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/jpg,image/gif,application/pdf,.pdf,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploadingProof}
                              />
                              {uploadingProof ? (
                                <div className="flex flex-col items-center gap-2 text-white">
                                  <Loader2 size={24} className="animate-spin text-[#e1bd70]" />
                                  <span className="text-xs">Uploading screenshot to secure storage...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1.5 text-center">
                                  <UploadCloud size={24} className="text-[#e1bd70]" />
                                  <span className="text-xs font-semibold text-white">Click to upload screenshot / receipt</span>
                                  <span className="text-[10px] text-white/40">PNG, JPG, WEBP, or PDF up to 10MB</span>
                                </div>
                              )}
                            </label>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-[1px] bg-white/10"></div>
                              <span className="text-[10px] uppercase text-white/30 tracking-wider">or enter document URL</span>
                              <div className="flex-1 h-[1px] bg-white/10"></div>
                            </div>

                            <input
                              type="url"
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                              placeholder="https://... (direct link to payment screenshot or PDF)"
                              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[var(--color-gold)]/50 focus:outline-none transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* PayFast Notice */
                    <div className="bg-[#0a0a0a] border border-[var(--color-gold)]/30 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={100} /></div>
                      <div className="relative z-10">
                        <p className="text-sm text-[var(--color-ivory-muted)] mb-3 leading-relaxed">
                          You will be securely redirected to PayFast's encrypted portal to complete your transaction with zero latency.
                        </p>
                        <div className="flex items-center gap-3 text-xs text-emerald-400">
                          <ShieldCheck size={16} /> 256-Bit SSL PCI-DSS Level 1 Encrypted
                        </div>
                      </div>
                    </div>
                  )}
                </section>
                
                <button 
                  type="submit" 
                  disabled={processing}
                  className="w-full mt-8 bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing Order...</>
                  ) : paymentMethod === 'bank_transfer' ? (
                    <>Submit Bank Transfer Proof • <Price amount={total} /> <ArrowRight size={16} /></>
                  ) : (
                    <>Pay via PayFast • <Price amount={total} /> <ArrowRight size={16} /></>
                  )}
                </button>
                
                <PaymentForm paymentData={paymentData} payfastUrl={payfastUrl} />
              </form>
            )}
            
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-serif mb-6">Auction Summary</h3>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center p-2">
                  <img 
                    src={lot.images && lot.images[0] ? lot.images[0] : '/assets/auction/macallan-25.png'} 
                    alt={lot.title} 
                    className="max-w-full max-h-full object-contain" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{lot.title}</h4>
                  <p className="text-xs text-[var(--color-ivory-muted)]">Lot {lot.lotNumber || lot._id.slice(-6).toUpperCase()}</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6 flex flex-col gap-3 text-sm font-mono">
                <div className="flex justify-between text-[var(--color-ivory-muted)]">
                  <span>Winning Bid</span>
                  <span><Price amount={lot.winningBid} /></span>
                </div>
                <div className="flex justify-between text-[var(--color-ivory-muted)]">
                  <span>Buyer Premium</span>
                  <span><Price amount={lot.buyerPremiumAmount} /></span>
                </div>
                <div className="flex justify-between text-[var(--color-ivory-muted)]">
                  <span>BAR Charge</span>
                  <span><Price amount={lot.barChargeAmount} /></span>
                </div>
                <div className="flex justify-between text-[var(--color-ivory-muted)]">
                  <span>VAT ({lot.vatPct}%)</span>
                  <span><Price amount={lot.vatAmount} /></span>
                </div>
                {(checkoutStep === 2 || isPaid || isAwaitingApproval) ? (
                  <div className="flex justify-between pb-4 border-b border-white/10 text-white">
                    <span>Shipping</span>
                    <span><Price amount={dynamicShipping || lot.shippingCost || 0} /></span>
                  </div>
                ) : (
                   <div className="pb-4 border-b border-white/10"></div>
                )}
                
                <div className="flex justify-between text-lg font-serif mt-2">
                  <span>{isPaid ? 'Total Settled' : isAwaitingApproval ? 'Total Transferred' : 'Total To Pay'}</span>
                  <span className={isPaid ? "text-emerald-400 font-bold" : "text-gold-gradient font-bold"}>
                    {isPaid 
                      ? <Price amount={lot.totalPaidByBuyer || total} /> 
                      : (checkoutStep === 2 || isAwaitingApproval) 
                        ? <Price amount={total} /> 
                        : <Price amount={total - dynamicShipping} />}
                  </span>
                </div>
                {checkoutStep === 1 && !isPaid && !isAwaitingApproval && (
                  <p className="text-[10px] text-white/30 italic mt-4">
                    Shipping costs will be calculated in the next step based on your delivery address.
                  </p>
                )}
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--color-ivory-muted)]">
                <ShieldCheck size={14} className="text-[#e1bd70]" /> Grand Store Bonded Escrow Guarantee
              </div>
            </div>
          </div>

        </div>
      </div>

      <ReceiptPreviewModal
        isOpen={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        proofUrl={proofUrl}
        fileName={proofFileName}
        fileSize={proofFileSize}
        reference={paymentReference}
        title="Payment Receipt Preview"
      />
    </main>
  );
}
