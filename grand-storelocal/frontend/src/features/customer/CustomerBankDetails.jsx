import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Landmark, ShieldCheck, CheckCircle2, AlertCircle, Loader2, 
  Copy, Edit2, Save, X, Info, Crown, Sparkles, ArrowRight, Lock,
  Settings, ExternalLink, Plus, Trash2, RotateCcw
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import BidderVerificationModal from '../../components/modals/BidderVerificationModal';

export default function CustomerBankDetails() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = Boolean(user && ['admin', 'super_admin'].includes(user.role));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [settings, setSettings] = useState(null);
  
  // Bank Account State (Customer Payout)
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    branchCode: ''
  });

  // Store Official EFT Bank Details State (Admin Configurable Keys)
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [storeBankKeysList, setStoreBankKeysList] = useState([
    { id: 'bank_name', key: 'Bank Name', value: 'Standard Bank' },
    { id: 'account_name', key: 'Account Holder', value: 'The Grand Store PTY LTD' },
    { id: 'account_number', key: 'Account Number', value: '0123456789' },
    { id: 'branch_code', key: 'Branch Code', value: '051001' },
    { id: 'account_type', key: 'Account Type', value: 'Business Cheque' },
    { id: 'swift_code', key: 'SWIFT / BIC Code', value: 'SBZAJJ' },
    { id: 'reference_note', key: 'Reference Instructions', value: 'Use Order ID or Bidder Number as deposit reference' }
  ]);

  // Bidder / Deposit info
  const [bidderProfile, setBidderProfile] = useState(null);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [showFullStoreAccount, setShowFullStoreAccount] = useState(false);

  const fetchBankingData = async () => {
    try {
      const [bankRes, bidderRes, settingsRes] = await Promise.allSettled([
        api.get('/auth/banking'),
        api.get('/auction/bidder/status'),
        api.get('/settings/public')
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        setSettings(settingsRes.value.data);
        const list = (Array.isArray(settingsRes.value.data.bankDetailsList) && settingsRes.value.data.bankDetailsList.length > 0)
          ? settingsRes.value.data.bankDetailsList
          : [
            { id: 'bank_name', key: 'Bank Name', value: settingsRes.value.data.bankDetails?.bankName || 'Standard Bank' },
            { id: 'account_name', key: 'Account Holder', value: settingsRes.value.data.bankDetails?.accountName || 'The Grand Store PTY LTD' },
            { id: 'account_number', key: 'Account Number', value: settingsRes.value.data.bankDetails?.accountNumber || '0123456789' },
            { id: 'branch_code', key: 'Branch Code', value: settingsRes.value.data.bankDetails?.branchCode || '051001' },
            { id: 'account_type', key: 'Account Type', value: settingsRes.value.data.bankDetails?.accountType || 'Business Cheque' },
            { id: 'swift_code', key: 'SWIFT / BIC Code', value: settingsRes.value.data.bankDetails?.swiftCode || 'SBZAJJ' },
            { id: 'reference_note', key: 'Reference Instructions', value: settingsRes.value.data.bankDetails?.referenceNote || 'Use Order ID or Bidder Number as deposit reference' }
          ];
        setStoreBankKeysList(list);
      }

      if (bankRes.status === 'fulfilled' && bankRes.value.data?.bankAccountDetails) {
        const b = bankRes.value.data.bankAccountDetails;
        setBankDetails({
          bankName: b.bankName || '',
          accountHolder: b.accountHolder || '',
          accountNumber: b.accountNumber || '',
          branchCode: b.branchCode || ''
        });
        if (!b.accountNumber) {
          setIsEditing(true); // Open edit form if no bank account is saved yet
        }
      } else {
        setIsEditing(true);
      }

      if (bidderRes.status === 'fulfilled') {
        setBidderProfile(bidderRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching bank details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!bankDetails.bankName || !bankDetails.accountHolder || !bankDetails.accountNumber) {
      setMessage({ type: 'error', text: 'Please fill in Bank Name, Account Holder Name, and Account Number.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/auth/banking', bankDetails);
      setMessage({ type: 'success', text: res.data.message || 'Bank details saved successfully!' });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Save bank details error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save bank details.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAdminKeyChange = (id, field, val) => {
    setStoreBankKeysList(prev => {
      const list = [...prev];
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], [field]: val };
      }
      return list;
    });
  };

  const handleAdminAddKey = () => {
    setStoreBankKeysList(prev => [
      ...prev,
      { id: `custom_key_${Date.now()}`, key: '', value: '' }
    ]);
  };

  const handleAdminDeleteKey = (id) => {
    setStoreBankKeysList(prev => prev.filter(item => item.id !== id));
  };

  const handleAdminResetKeys = () => {
    const defaultList = [
      { id: 'bank_name', key: 'Bank Name', value: 'Standard Bank' },
      { id: 'account_name', key: 'Account Holder', value: 'The Grand Store PTY LTD' },
      { id: 'account_number', key: 'Account Number', value: '0123456789' },
      { id: 'branch_code', key: 'Branch Code', value: '051001' },
      { id: 'account_type', key: 'Account Type', value: 'Business Cheque' },
      { id: 'swift_code', key: 'SWIFT / BIC Code', value: 'SBZAJJ' },
      { id: 'reference_note', key: 'Reference Instructions', value: 'Use Order ID or Bidder Number as deposit reference' }
    ];
    setStoreBankKeysList(defaultList);
  };

  const handleSaveStoreBankDetails = async (e) => {
    e.preventDefault();
    setAdminSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/settings', { bankDetailsList: storeBankKeysList });
      setSettings(prev => ({
        ...prev,
        bankDetailsList: storeBankKeysList,
        bankDetails: res.data?.settings?.bankDetails || prev.bankDetails
      }));
      setAdminModalOpen(false);
      setMessage({ type: 'success', text: 'Grand Store official EFT bank details & keys updated successfully!' });
      setTimeout(() => setMessage(null), 4500);
    } catch (err) {
      console.error('Save store bank error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save store bank details.' });
    } finally {
      setAdminSaving(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: `${label} copied to clipboard!` });
    setTimeout(() => setMessage(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-[var(--color-gold)]">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  const hasSavedAccount = Boolean(bankDetails.accountNumber);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-10 pb-16 animate-fadeIn">
      
      {/* Page Header */}
      <section className="border-b border-white/10 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[var(--color-ivory)] font-serif text-3xl sm:text-4xl mb-2 flex items-center gap-3 tracking-wide">
              <Landmark className="text-[var(--color-gold)]" size={32} />
              Bank Details & Payouts
            </h1>
            <p className="text-[var(--color-ivory-muted)] text-sm font-light leading-relaxed">
              Your registered South African bank account for auction security deposit returns, order refunds, and escrow payouts.
            </p>
          </div>
          {hasSavedAccount && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Edit2 size={14} /> Update Bank Details
            </button>
          )}
        </div>
      </section>

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
          message.type === 'error' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }`}>
          {message.type === 'error' ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 1: ACTIVE BANK CARD DISPLAY */}
      {hasSavedAccount && !isEditing ? (
        <section className="space-y-6">
          {/* Luxury Card Mockup */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1a16] via-[#12110f] to-[#080808] border border-[var(--color-gold)]/40 p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)]">
                  <Landmark size={24} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif text-white font-medium">{bankDetails.bankName}</h3>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={12} /> Active Payout Account
                  </span>
                </div>
              </div>
              <span className="text-xs uppercase font-mono tracking-widest text-[var(--color-gold)] font-bold bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 px-3 py-1 rounded-full">
                ZAR Account
              </span>
            </div>

            <div className="space-y-6 relative z-10">
              {/* Account Number Display */}
              <div>
                <span className="text-xs uppercase tracking-widest text-white/40 block mb-1.5 font-medium">Account Number</span>
                <div className="flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl font-mono text-white tracking-widest font-bold">
                    {showFullAccount 
                      ? bankDetails.accountNumber 
                      : `•••• •••• ${bankDetails.accountNumber.slice(-4) || '••••'}`
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullAccount(!showFullAccount)}
                    className="text-xs text-white/50 hover:text-[var(--color-gold)] transition-colors underline cursor-pointer"
                  >
                    {showFullAccount ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account number')}
                    className="p-1.5 text-white/40 hover:text-[var(--color-gold)] transition-colors cursor-pointer"
                    title="Copy Account Number"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Account Holder & Branch Code Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <span className="text-xs uppercase tracking-widest text-white/40 block mb-1 font-medium">Account Holder Name</span>
                  <span className="text-base sm:text-lg text-white font-medium">{bankDetails.accountHolder}</span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-white/40 block mb-1 font-medium">Branch Code</span>
                  <span className="text-base sm:text-lg font-mono text-white font-medium">{bankDetails.branchCode || 'Default / Universal'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Refundable Escrow Trust Guarantee */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4 text-xs text-white/70 leading-relaxed">
            <Lock size={20} className="text-[var(--color-gold)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-medium block mb-0.5">Secure Escrow & Direct Deposit Return:</strong>
              When you participate in Grand Store auctions, any refundable bidder security deposit or overpayment is automatically returned directly to this bank account upon auction conclusion or your request.
            </div>
          </div>
        </section>
      ) : null}

      {/* SECTION 2: EDIT / ADD BANK ACCOUNT FORM */}
      {isEditing && (
        <section className="bg-[#11100e] border border-[var(--color-gold)]/30 rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-serif text-[var(--color-gold)] font-medium">
                {hasSavedAccount ? 'Update Bank Account Details' : 'Add South African Bank Account'}
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Ensure account holder name matches your legal 18+ identity for KYC compliance.
              </p>
            </div>
            {hasSavedAccount && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-semibold">
                  Bank Name <span className="text-[var(--color-gold)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Bank, FNB, ABSA, Capitec, Nedbank..."
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-semibold">
                  Account Holder Name <span className="text-[var(--color-gold)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name as registered with your bank"
                  value={bankDetails.accountHolder}
                  onChange={(e) => setBankDetails({...bankDetails, accountHolder: e.target.value})}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-semibold">
                  Account Number <span className="text-[var(--color-gold)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1012345678"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--color-gold)] font-mono transition-colors placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2 font-semibold">
                  Branch Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 051001"
                  value={bankDetails.branchCode}
                  onChange={(e) => setBankDetails({...bankDetails, branchCode: e.target.value})}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--color-gold)] font-mono transition-colors placeholder:text-white/25"
                />
              </div>

            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 bg-gold-gradient text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Bank Details
              </button>
              {hasSavedAccount && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 px-5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {/* SECTION 2.5: THE GRAND STORE OFFICIAL SETTLEMENT & ESCROW BANK ACCOUNT (EFT) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif text-[var(--color-ivory)] flex items-center gap-2.5">
              <Landmark className="text-[var(--color-gold)]" size={24} />
              The Grand Store Official Settlement & Escrow Bank Account
            </h2>
            <p className="text-xs text-[var(--color-ivory-muted)] mt-1 font-light">
              Official institutional EFT recipient account for manual bank transfers, VIP auction guarantee deposits, and settlement escrow.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="py-2.5 px-4 bg-[var(--color-gold)]/10 hover:bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/30 text-[var(--color-gold)] rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm"
            >
              <Settings size={14} /> Configure Store EFT Details & Keys
            </button>
          )}
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181613] via-[#0f0e0c] to-[#070706] border border-white/10 p-7 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--color-gold)]/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

          <div className="flex items-start justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-gold)]">
                <Landmark size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif text-white font-medium">
                  {(() => {
                    const bankKey = (storeBankKeysList || []).find(k => k.key && /bank\s*name/i.test(k.key));
                    return bankKey?.value || settings?.bankDetails?.bankName || 'Standard Bank';
                  })()}
                </h3>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={12} /> Verified Institutional Escrow
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-mono tracking-widest text-[var(--color-gold)] font-bold bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 px-3 py-1 rounded-full">
                South African EFT
              </span>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Grid of All Configured Bank Detail Keys */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-4 border-t border-white/10">
              {(storeBankKeysList || []).filter(item => item.key && item.key.trim()).map((item, idx) => {
                const isAccountNumber = /account\s*num/i.test(item.key) || /account\s*no/i.test(item.key);
                const isReference = /reference/i.test(item.key) || /instructions/i.test(item.key);
                const isFullSpan = isReference || (item.value && item.value.length > 30);

                return (
                  <div key={item.id || idx} className={`${isFullSpan ? 'sm:col-span-2 md:col-span-3' : ''} bg-white/[0.02] p-3.5 rounded-xl border border-white/5`}>
                    <span className="text-xs uppercase tracking-widest text-white/40 block mb-1 font-medium">
                      {item.key}
                    </span>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-sm sm:text-base font-medium break-all ${
                        isAccountNumber 
                          ? 'font-mono text-white text-base sm:text-lg tracking-wider font-bold' 
                          : isReference 
                          ? 'text-[var(--color-gold)] font-sans' 
                          : 'text-white'
                      }`}>
                        {item.value || '—'}
                      </span>
                      {item.value && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.value, item.key)}
                          className="p-1.5 text-white/30 hover:text-[var(--color-gold)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title={`Copy ${item.key}`}
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
            <span className="flex items-center gap-1.5"><Lock size={13} className="text-[var(--color-gold)]" /> South African Reserve Bank Regulated Escrow</span>
            {isAdmin && (
              <Link to="/admin/settings" className="text-[var(--color-gold)] hover:underline flex items-center gap-1">
                Open Admin Settings <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: AUCTION DEPOSIT ESCROW LINKAGE */}
      <section className="bg-gradient-to-br from-[#12110e] to-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-[var(--color-gold)]" />
            <h4 className="text-base font-serif text-white font-medium">
              Auction Deposit Escrow Status
            </h4>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            bidderProfile?.bidderDepositStatus === 'paid'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : bidderProfile?.bidderDepositStatus === 'pending'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              : 'bg-white/5 text-white/50 border border-white/10'
          }`}>
            {bidderProfile?.bidderDepositStatus === 'paid' 
              ? 'Active VIP Deposit Held in Escrow' 
              : bidderProfile?.bidderDepositStatus === 'pending' 
              ? 'Deposit Payment Pending Review' 
              : 'No Active Deposit'
            }
          </span>
        </div>

        {(() => {
          const depositAmount = settings?.auctionPremiumDepositAmount !== undefined 
            ? settings.auctionPremiumDepositAmount 
            : 5000;
          const standardLimit = settings?.auctionStandardBiddingLimit || 25000;
          const premiumLimit = settings?.auctionPremiumBiddingLimit || 250000;

          return (
            <>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                {bidderProfile?.bidderDepositStatus === 'paid' ? (
                  <>
                    Your refundable security deposit of <strong>R{(bidderProfile.bidderDepositAmount || depositAmount).toLocaleString()}</strong> is currently held in Grand Store's protected escrow account. This unlocks VIP reserve bidding up to <strong>R{(bidderProfile.biddingLimit || premiumLimit).toLocaleString()}+</strong>. Whenever you request a refund or auctions conclude, funds will be returned to your bank account above.
                  </>
                ) : (
                  <>
                    Standard bidders have a default bidding limit of R{standardLimit.toLocaleString()}. By placing an R{depositAmount.toLocaleString()} security deposit (100% refundable back to your bank account above), you unlock VIP bidding privileges up to R{premiumLimit.toLocaleString()}+.
                  </>
                )}
              </p>

              {bidderProfile?.bidderLevel !== 'level_3_enhanced' && bidderProfile?.bidderLevel !== 'level_4_vip' && (
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/auction/vip-checkout')}
                    className="py-2.5 px-5 bg-gold-gradient text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:brightness-110 transition-all inline-flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  >
                    <Crown size={14} /> Upgrade to VIP Bidding (R{depositAmount.toLocaleString()} Deposit) <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* VIP Upgrade Modal */}
      <BidderVerificationModal
        isOpen={vipModalOpen}
        onClose={() => setVipModalOpen(false)}
        bidderProfile={bidderProfile}
        onSuccess={() => {
          fetchBankingData();
          setMessage({ type: 'success', text: 'VIP upgrade application submitted successfully!' });
        }}
      />

      {/* ADMIN: CONFIGURE STORE EFT BANK DETAILS & KEYS MODAL */}
      {isAdmin && adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#12110e] border border-[var(--color-gold)]/40 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-xl font-serif text-[var(--color-gold)] flex items-center gap-2 font-medium">
                  <Landmark size={22} /> Configure Grand Store Official EFT Details & Keys
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Add, rename, update, or delete any banking key. These keys appear live across Customer Banking, Checkout, and VIP Escrow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdminModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStoreBankDetails} className="space-y-5">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-white/60 font-medium">
                  {storeBankKeysList.length} Banking Keys Configured
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAdminResetKeys}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Reset to standard 7 EFT bank keys"
                  >
                    <RotateCcw size={13} /> Reset Template
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminAddKey}
                    className="px-3 py-1.5 bg-[var(--color-gold)]/15 hover:bg-[var(--color-gold)]/25 border border-[var(--color-gold)]/40 text-[var(--color-gold)] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus size={14} /> Add Key
                  </button>
                </div>
              </div>

              {/* Dynamic Keys List */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {storeBankKeysList.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="group flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-black/50 border border-white/10 hover:border-[var(--color-gold)]/30 rounded-xl p-3 transition-all"
                  >
                    <span className="text-[11px] font-mono text-white/30 w-6 text-center shrink-0 hidden sm:block">
                      #{index + 1}
                    </span>

                    {/* Editable Key Name */}
                    <div className="w-full sm:w-2/5">
                      <label className="block text-[10px] uppercase font-mono tracking-widest text-[var(--color-gold)]/80 mb-1 sm:hidden">
                        Key Label
                      </label>
                      <input
                        type="text"
                        placeholder="Key Name (e.g. Bank Name)"
                        value={item.key || ''}
                        onChange={(e) => handleAdminKeyChange(item.id, 'key', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-gold)] placeholder:text-white/20 outline-none focus:border-[var(--color-gold)] transition-colors"
                      />
                    </div>

                    <span className="hidden sm:inline text-white/30 font-mono text-sm">:</span>

                    {/* Editable Key Value */}
                    <div className="w-full sm:flex-1">
                      <label className="block text-[10px] uppercase font-mono tracking-widest text-white/40 mb-1 sm:hidden">
                        Value
                      </label>
                      <input
                        type="text"
                        placeholder="Value (e.g. Standard Bank)"
                        value={item.value || ''}
                        onChange={(e) => handleAdminKeyChange(item.id, 'value', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 outline-none focus:border-[var(--color-gold)] transition-colors"
                      />
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleAdminDeleteKey(item.id)}
                      className="p-2 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 cursor-pointer self-end sm:self-center"
                      title={`Delete "${item.key || 'key'}"`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {storeBankKeysList.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-white/15 rounded-xl text-white/40 text-xs">
                    No bank detail keys configured. Click <strong className="text-[var(--color-gold)] cursor-pointer" onClick={handleAdminAddKey}>+ Add Key</strong> or <strong className="text-[var(--color-gold)] cursor-pointer" onClick={handleAdminResetKeys}>Reset Template</strong> to add keys.
                  </div>
                )}
              </div>

              {/* Add Key Button */}
              <button
                type="button"
                onClick={handleAdminAddKey}
                className="w-full py-2.5 border border-dashed border-[var(--color-gold)]/40 hover:border-[var(--color-gold)] bg-[var(--color-gold)]/5 hover:bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={15} /> Add Another Bank Detail Key
              </button>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <Link
                  to="/admin/settings"
                  className="text-xs text-[var(--color-gold)] hover:underline flex items-center gap-1 font-medium"
                >
                  Full Platform Settings <ExternalLink size={12} />
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(false)}
                    className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminSaving}
                    className="py-2.5 px-6 bg-gold-gradient text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
                  >
                    {adminSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Save EFT Keys
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
