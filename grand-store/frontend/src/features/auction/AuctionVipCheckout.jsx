import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Crown, ShieldCheck, CreditCard, Landmark, CheckCircle2, ArrowRight, 
  ChevronRight, Lock, Copy, UploadCloud, AlertCircle, FileText, Sparkles, 
  ExternalLink, Clock, ShieldAlert, ArrowLeft, RefreshCw, Eye, X
} from 'lucide-react';
import api from '../../api';
import Price from '../../components/ui/Price';
import PaymentForm from '../checkout/PaymentForm';
import ReceiptPreviewModal from './components/ReceiptPreviewModal';
import StoreBankDetailsCard from '../../components/StoreBankDetailsCard';

export default function AuctionVipCheckout({ onNotify }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentQuery = searchParams.get('payment');
  const refQuery = searchParams.get('ref');

  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Payment Selection: 'payfast' | 'eft'
  const [paymentMethod, setPaymentMethod] = useState('payfast');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [proofFileSize, setProofFileSize] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedDeposit, setSubmittedDeposit] = useState(null);

  // PayFast Form state
  const [payfastData, setPayfastData] = useState(null);
  const [payfastUrl, setPayfastUrl] = useState('');

  // Bank details for deposit refund
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    branchCode: ''
  });

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo')) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, bidderRes, bankingRes] = await Promise.all([
          api.get('/settings/public'),
          api.get('/auction/bidder/status').catch(() => ({ data: null })),
          api.get('/auth/banking').catch(() => ({ data: null }))
        ]);

        if (settingsRes.data) {
          setSettings(settingsRes.data);
        }

        if (bidderRes?.data) {
          setProfile(bidderRes.data);
          if (bidderRes.data.bankAccountDetails) {
            const b = bidderRes.data.bankAccountDetails;
            setBankDetails({
              bankName: b.bankName || '',
              accountHolder: b.accountHolder || '',
              accountNumber: b.accountNumber || '',
              branchCode: b.branchCode || ''
            });
          }
        }

        if (bankingRes?.data?.bankAccountDetails?.accountNumber) {
          const b = bankingRes.data.bankAccountDetails;
          setBankDetails(prev => ({
            bankName: prev.bankName || b.bankName || '',
            accountHolder: prev.accountHolder || b.accountHolder || storedUser.name || '',
            accountNumber: prev.accountNumber || b.accountNumber || '',
            branchCode: prev.branchCode || b.branchCode || ''
          }));
        } else if (storedUser.name) {
          setBankDetails(prev => ({
            ...prev,
            accountHolder: prev.accountHolder || storedUser.name
          }));
        }
      } catch (err) {
        console.error('Error loading VIP checkout data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const depositAmount = settings?.auctionPremiumDepositAmount !== undefined 
    ? settings.auctionPremiumDepositAmount 
    : 5000;
  const standardLimit = settings?.auctionStandardBiddingLimit || 25000;
  const premiumLimit = settings?.auctionPremiumBiddingLimit || 250000;



  const dynamicRef = profile?.bidderNumber 
    ? `DEP-VIP-${profile.bidderNumber}` 
    : `DEP-VIP-${(storedUser?._id || 'PATRON').slice(-6).toUpperCase()}`;

  const depositReference = refQuery || submittedDeposit?.paymentReference || dynamicRef;

  const handleBankChange = (field, value) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Selected file exceeds the 10 MB limit. Please upload a smaller file.');
      if (onNotify) onNotify('Selected file exceeds 10MB limit');
      if (e.target) e.target.value = '';
      return;
    }

    setProofFileName(file.name);
    const sizeInKb = Math.round(file.size / 1024);
    setProofFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`);

    setUploadingProof(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('document', file);
      const res = await api.post('/vendor/upload-public', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProofUrl(res.data.url);
      if (onNotify) onNotify('Proof of payment uploaded successfully.');
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to upload proof document.';
      setError(msg);
      if (onNotify) onNotify(msg);
    } finally {
      setUploadingProof(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!bankDetails.bankName || !bankDetails.accountHolder || !bankDetails.accountNumber) {
      setError('Please provide your bank name, account holder, and account number for the 100% deposit refund.');
      return;
    }

    if (paymentMethod === 'eft' && !proofUrl) {
      setError('Please upload your bank transfer EFT deposit receipt or screenshot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auction/bidder/deposit', {
        amount: depositAmount,
        tier: 'premium',
        paymentMethod,
        proofOfPayment: proofUrl,
        bankAccountDetails: bankDetails
      });

      const depositData = res.data?.deposit || {
        amount: depositAmount,
        paymentReference: res.data?.depositReference || depositReference
      };

      setSubmittedDeposit(depositData);

      if (paymentMethod === 'payfast') {
        // Request PayFast signature and payload
        try {
          const pfRes = await api.post('/payfast/generate-deposit', {
            depositId: depositData._id
          });
          if (pfRes.data?.data && pfRes.data?.url) {
            setPayfastData(pfRes.data.data);
            setPayfastUrl(pfRes.data.url);
            return;
          }
        } catch (pfErr) {
          console.warn('PayFast gateway generation note:', pfErr.message);
          // Fallback to manual verification state
        }
      }

      setIsSubmitted(true);
      if (onNotify) {
        onNotify(`Deposit authorization submitted! Your R${premiumLimit.toLocaleString()} VIP limit will be confirmed.`);
      }
    } catch (err) {
      console.error('VIP Deposit submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit VIP deposit. Please verify your details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center text-[var(--color-ivory-muted)] font-serif">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[var(--color-gold)]" size={32} />
          <p className="text-sm">Loading VIP Bidding Security Checkout...</p>
        </div>
      </main>
    );
  }

  // If returning from PayFast with success
  if (paymentQuery === 'success') {
    return (
      <main className="min-h-screen bg-[#050505] text-[var(--color-ivory)] py-16 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6 bg-gradient-to-b from-[#15120a] to-[#0a0a0a] p-10 rounded-3xl border border-[var(--color-gold)]/50 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(212,175,55,0.35)]">
            <Crown size={32} />
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Payment Confirmed • Escrow Protected
          </span>
          <h1 className="text-3xl font-serif text-white">VIP Bidding Privileges Confirmed</h1>
          <p className="text-sm text-[var(--color-ivory-muted)] font-light leading-relaxed max-w-lg mx-auto">
            Your refundable security guarantee deposit of <strong className="text-[var(--color-gold)] font-mono">R{depositAmount.toLocaleString()}</strong> has been securely logged with the Grand Store Escrow Trust. 
            Your bidding ceiling is now active up to <strong className="text-white font-mono">R{premiumLimit.toLocaleString()}+</strong>.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/auction" 
              className="w-full sm:w-auto px-8 py-3.5 bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              Browse Live Catalogue
            </Link>
            <Link 
              to="/customer/auctions" 
              className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium uppercase tracking-widest text-xs rounded-xl border border-white/10 transition-all"
            >
              My Auctions Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // If already paid and active VIP
  const isAlreadyVip = profile?.bidderLevel === 'level_4_vip' && profile?.bidderDepositStatus === 'paid';

  if (isAlreadyVip) {
    return (
      <main className="min-h-screen bg-[#050505] text-[var(--color-ivory)] py-16 px-6">
        <div className="max-w-2xl mx-auto space-y-6 bg-gradient-to-b from-[#14120c] to-[#080808] p-10 rounded-3xl border border-[var(--color-gold)]/40 shadow-[0_0_40px_rgba(212,175,55,0.15)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/40 flex items-center justify-center mx-auto">
            <Crown size={32} />
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30">
            Active Level 4 VIP Bidder
          </span>
          <h1 className="text-3xl font-serif text-white">VIP Access Already Unlocked</h1>
          <p className="text-sm text-[var(--color-ivory-muted)] font-light leading-relaxed max-w-lg mx-auto">
            Your refundable guarantee deposit of <strong className="text-[var(--color-gold)] font-mono">R{(profile.bidderDepositAmount || depositAmount).toLocaleString()}</strong> is securely held in escrow. 
            You enjoy full reserve bidding privileges up to <strong className="text-white font-mono">R{(profile.biddingLimit || premiumLimit).toLocaleString()}+</strong>.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/auction" 
              className="px-8 py-3.5 bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              Enter Live Auction
            </Link>
            <Link 
              to="/customer/auctions" 
              className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium uppercase tracking-widest text-xs rounded-xl border border-white/10 transition-all"
            >
              Return to My Auctions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Submitted EFT Confirmation screen
  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-[#050505] text-[var(--color-ivory)] py-16 px-6">
        <div className="max-w-2xl mx-auto space-y-6 bg-gradient-to-b from-[#12110d] to-[#080808] p-10 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Clock size={32} />
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Deposit Authorization Logged • Verification In Progress
          </span>
          <h1 className="text-3xl font-serif text-white">Deposit Submitted for Verification</h1>
          <p className="text-sm text-[var(--color-ivory-muted)] font-light leading-relaxed max-w-lg mx-auto">
            Your VIP bidding deposit of <strong className="text-[var(--color-gold)] font-mono">R{depositAmount.toLocaleString()}</strong> has been recorded with reference <strong className="text-white font-mono">{depositReference}</strong>. 
            Our compliance desk will verify the funds and upgrade your limit to <strong className="text-white font-mono">R{premiumLimit.toLocaleString()}</strong> shortly.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/customer/auctions" 
              className="px-8 py-3.5 bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              View My Auctions Status
            </Link>
            <Link 
              to="/auction" 
              className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium uppercase tracking-widest text-xs rounded-xl border border-white/10 transition-all"
            >
              Browse Auction Lots
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[var(--color-ivory)] pt-6 pb-24 font-sans">
      
      {/* Hidden PayFast Form for instant redirect */}
      {payfastData && payfastUrl && (
        <PaymentForm paymentData={payfastData} payfastUrl={payfastUrl} />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mb-3">
            <Link to="/auction" className="hover:text-[var(--color-gold)] transition-colors">Auction Vault</Link>
            <ChevronRight size={12} />
            <Link to="/customer/auctions" className="hover:text-[var(--color-gold)] transition-colors">My Auctions</Link>
            <ChevronRight size={12} />
            <span className="text-[var(--color-gold)] font-medium">VIP Guarantee Checkout</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif text-white flex items-center gap-3">
                <Crown className="text-[var(--color-gold)]" size={32} /> VIP Bidding Deposit Checkout
              </h1>
              <p className="text-xs text-[var(--color-ivory-muted)] mt-1 font-light">
                Official CPA & Liquor Authority Compliant Escrow Trust Guarantee
              </p>
            </div>
            <Link 
              to="/customer/auctions" 
              className="inline-flex items-center gap-2 text-xs text-[var(--color-ivory-muted)] hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Return to Dashboard
            </Link>
          </div>
        </div>

        {/* 100% Refundable Guarantee Banner */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-[#c9a35b]/15 via-[#c9a35b]/5 to-transparent border border-[var(--color-gold)]/40 flex items-start sm:items-center gap-4 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>100% Refundable Escrow Guarantee</span>
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                Zero Surcharges
              </span>
            </h4>
            <p className="text-xs text-[var(--color-ivory-muted)] leading-relaxed">
              This deposit of <strong className="text-[var(--color-gold)] font-mono">R{depositAmount.toLocaleString()}</strong> is <strong className="text-white">NOT a fee</strong>. It remains your property held safely in an Escrow Trust Account. If you do not win any lots, or upon written request, the full sum is returned immediately to your nominated bank account.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Step 1: Refund Bank Account Details */}
              <section className="bg-[#0b0b0a] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-mono text-xs font-bold flex items-center justify-center border border-[var(--color-gold)]/30">
                      1
                    </span>
                    <div>
                      <h3 className="text-base font-serif text-white">Nominated Bank Account for Refund</h3>
                      <p className="text-[11px] text-[var(--color-ivory-muted)]">Where funds return upon auction close</p>
                    </div>
                  </div>
                  <Landmark size={18} className="text-[var(--color-gold)] opacity-70" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                      Bank Name <span className="text-[var(--color-gold)]">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Standard Bank, FNB, ABSA, Capitec" 
                      value={bankDetails.bankName} 
                      onChange={(e) => handleBankChange('bankName', e.target.value)} 
                      className="w-full bg-[#111] border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                      Account Holder Name <span className="text-[var(--color-gold)]">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Full name as registered with bank" 
                      value={bankDetails.accountHolder} 
                      onChange={(e) => handleBankChange('accountHolder', e.target.value)} 
                      className="w-full bg-[#111] border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                      Account Number <span className="text-[var(--color-gold)]">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 1012345678" 
                      value={bankDetails.accountNumber} 
                      onChange={(e) => handleBankChange('accountNumber', e.target.value)} 
                      className="w-full bg-[#111] border border-white/15 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                      Branch Code
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 051001" 
                      value={bankDetails.branchCode} 
                      onChange={(e) => handleBankChange('branchCode', e.target.value)} 
                      className="w-full bg-[#111] border border-white/15 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20"
                    />
                  </div>
                </div>
              </section>

              {/* Step 2: Payment Method */}
              <section className="bg-[#0b0b0a] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-mono text-xs font-bold flex items-center justify-center border border-[var(--color-gold)]/30">
                      2
                    </span>
                    <div>
                      <h3 className="text-base font-serif text-white">Deposit Payment Gateway</h3>
                      <p className="text-[11px] text-[var(--color-ivory-muted)]">Select how you wish to transfer the guarantee</p>
                    </div>
                  </div>
                  <CreditCard size={18} className="text-[var(--color-gold)] opacity-70" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label 
                    className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-3.5 ${
                      paymentMethod === 'payfast' 
                        ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                        : 'bg-[#111] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="vipPaymentMethod" 
                      value="payfast" 
                      checked={paymentMethod === 'payfast'} 
                      onChange={() => setPaymentMethod('payfast')} 
                      className="hidden" 
                    />
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[var(--color-gold)] shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">PayFast (Instant)</p>
                      <p className="text-[11px] text-white/50">Card & Instant EFT</p>
                    </div>
                  </label>

                  <label 
                    className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-3.5 ${
                      paymentMethod === 'eft' 
                        ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                        : 'bg-[#111] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="vipPaymentMethod" 
                      value="eft" 
                      checked={paymentMethod === 'eft'} 
                      onChange={() => setPaymentMethod('eft')} 
                      className="hidden" 
                    />
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[var(--color-gold)] shrink-0">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Direct Bank EFT</p>
                      <p className="text-[11px] text-white/50">Manual wire with receipt</p>
                    </div>
                  </label>
                </div>

                {/* EFT Bank Instructions */}
                {paymentMethod === 'eft' && (
                  <div className="space-y-4 pt-3 border-t border-white/10">
                    <StoreBankDetailsCard
                      reference={depositReference}
                      referenceLabel="Payment Reference"
                      title="Grand Store VIP Escrow Account"
                      subtitle="Official institutional South African EFT settlement account"
                      bankDetailsList={settings?.bankDetailsList}
                      bankDetails={settings?.bankDetails}
                      compact={true}
                      onNotify={onNotify}
                    />

                    {/* Proof Upload Dropzone */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-bold">
                        Proof of Payment Screenshot or PDF <span className="text-[var(--color-gold)]">*</span>
                      </label>

                      {proofUrl ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            {/\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(proofUrl) ? (
                              <button
                                type="button"
                                onClick={() => setShowReceiptPreview(true)}
                                className="relative group cursor-pointer flex-shrink-0"
                                title="Click to preview receipt"
                              >
                                <img src={proofUrl} alt="Deposit Proof" className="w-10 h-10 object-cover rounded-lg border border-emerald-500/30 group-hover:border-[var(--color-gold)] transition-colors" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity text-white">
                                  <Eye size={12} />
                                </div>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowReceiptPreview(true)}
                                className="w-10 h-10 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer flex-shrink-0"
                                title="Click to preview PDF receipt"
                              >
                                <FileText size={20} />
                              </button>
                            )}
                            <div className="overflow-hidden min-w-0">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                                <p className="text-xs font-bold text-emerald-300 truncate">Proof Attached</p>
                                {proofFileSize && <span className="text-[10px] text-white/40 font-normal">({proofFileSize})</span>}
                              </div>
                              <p className="text-[11px] text-white/70 truncate max-w-[200px] sm:max-w-[260px] mt-0.5 font-mono">
                                {proofFileName || (proofUrl.includes('.pdf') || proofUrl.includes('/raw/upload/') ? 'VIP_Deposit_Receipt.pdf' : 'Receipt_Screenshot.jpg')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                            <button 
                              type="button" 
                              onClick={() => setShowReceiptPreview(true)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
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
                              className="text-xs text-white/40 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                              title="Replace proof"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-white/20 hover:border-[var(--color-gold)]/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/[0.02] text-center">
                          <UploadCloud size={28} className="text-[var(--color-gold)] mb-2" />
                          <span className="text-xs font-medium text-white">Click or drag EFT proof of payment here</span>
                          <span className="text-[10px] text-white/40 mt-1">PDF, JPG, PNG accepted (max 10MB)</span>
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp,image/jpg,image/gif,application/pdf,.pdf,.jpg,.jpeg,.png,.webp" 
                            onChange={handleFileUpload} 
                            disabled={uploadingProof} 
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting || uploadingProof}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f5d77f] to-[#d4af37] text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Crown size={16} />
                <span>
                  {submitting 
                    ? 'Processing Deposit Authorization...' 
                    : paymentMethod === 'payfast'
                    ? `Proceed to PayFast • R${depositAmount.toLocaleString()}`
                    : `Submit EFT Deposit Proof • R${depositAmount.toLocaleString()}`}
                </span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-6 text-[11px] text-white/40">
                <span className="flex items-center gap-1.5"><Lock size={12} className="text-[var(--color-gold)]" /> 256-bit Encrypted</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400" /> 100% Refund Guarantee</span>
                <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-[var(--color-gold)]" /> Instant Limit Upgrade</span>
              </div>
            </form>
          </div>

          {/* Right Column: Ledger Summary */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky top-24">
            <div className="rounded-2xl border border-[var(--color-gold)]/40 bg-gradient-to-b from-[#14120b] via-[#0d0c09] to-[#080808] p-6 sm:p-7 shadow-[0_0_35px_rgba(212,175,55,0.15)] space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-gold)] block mb-0.5">
                    Tier Upgrade Summary
                  </span>
                  <h3 className="text-lg font-serif text-white">Level 4 VIP Reserve Tier</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30 flex items-center justify-center">
                  <Crown size={20} />
                </div>
              </div>

              {/* Features Comparison */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-white/70">
                  <span>Standard Non-Deposit Limit</span>
                  <span className="font-mono text-white/50 line-through">R{standardLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white font-medium">
                  <span className="flex items-center gap-1.5 text-[var(--color-gold)]">
                    <Sparkles size={13} /> Unlocked VIP Bidding Limit
                  </span>
                  <span className="font-mono font-bold text-[var(--color-gold)] text-sm">
                    R{premiumLimit.toLocaleString()}+
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>Access to Reserve & Rare Lots</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Unrestricted
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>White-Glove Courier Logistics</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Priority Dispatch
                  </span>
                </div>
              </div>

              {/* Financial Ledger Breakdown */}
              <div className="rounded-xl bg-black/60 border border-white/10 p-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center text-white/70">
                  <span>Refundable Guarantee Deposit</span>
                  <span className="text-white font-bold">R{depositAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span>Escrow Custody Surcharge</span>
                  <span>R0.00</span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span>VAT (Exempt on Deposits)</span>
                  <span>R0.00</span>
                </div>
                <div className="pt-3 border-t border-[var(--color-gold)]/20 flex justify-between items-baseline text-white">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-[var(--color-gold)]">
                      Total Payable Today
                    </span>
                    <span className="text-[9px] font-sans text-emerald-400">100% Refundable to Bank</span>
                  </div>
                  <span className="text-xl font-serif font-bold text-[var(--color-gold)]">
                    <Price amount={depositAmount} />
                  </span>
                </div>
              </div>

              {/* Regulatory Disclosure */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50 leading-relaxed space-y-1">
                <p className="font-semibold text-white/70 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[var(--color-gold)]" /> South African CPA Section 45 Compliance
                </p>
                <p>
                  Security deposits are held in a designated Trust Account and do not form part of company operating revenue. Funds remain earmarked for your account and are returnable on demand.
                </p>
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
        reference={depositReference}
        title="VIP Deposit Receipt Preview"
      />
    </main>
  );
}
