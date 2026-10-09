import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Landmark, ShieldCheck, CheckCircle2, AlertCircle, Loader2, 
  Copy, Edit2, Save, X, Info, Crown, Sparkles, ArrowRight, Lock,
  ExternalLink, Upload, FileText, Check, Eye, EyeOff, Wallet,
  Building2, CreditCard, ChevronRight
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const SA_BANKS = [
  { name: 'Standard Bank', branchCode: '051001', swift: 'SBZAJJ' },
  { name: 'First National Bank (FNB)', branchCode: '250655', swift: 'FIRNZAJJ' },
  { name: 'ABSA Bank', branchCode: '632005', swift: 'ABSAZAJJ' },
  { name: 'Nedbank', branchCode: '198765', swift: 'NEDSZAJJ' },
  { name: 'Capitec Bank', branchCode: '470010', swift: 'CAPIZAJJ' },
  { name: 'Investec Bank', branchCode: '580105', swift: 'IVESZAJJ' },
  { name: 'Discovery Bank', branchCode: '679000', swift: 'DISCZAJJ' },
  { name: 'TymeBank', branchCode: '678910', swift: 'TYMEZAJJ' },
  { name: 'African Bank', branchCode: '430000', swift: 'AFRIZAJJ' },
  { name: 'Bidvest Bank', branchCode: '462005', swift: 'BIDVZAJJ' },
  { name: 'Other / International Bank', branchCode: '', swift: '' }
];

export default function VendorBankDetails() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [message, setMessage] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [recentPayouts, setRecentPayouts] = useState([]);
  const [walletData, setWalletData] = useState(null);

  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'Cheque / Current',
    swiftCode: '',
    bankConfirmationUrl: '',
    payoutPreference: 'Monthly',
    isVerified: false,
    updatedAt: null
  });

  const fetchBankingData = async () => {
    try {
      setLoading(true);
      const [bankingRes, walletRes] = await Promise.allSettled([
        api.get('/vendor/banking'),
        api.get('/vendor/wallet')
      ]);

      if (bankingRes.status === 'fulfilled' && bankingRes.value.data?.bankingInfo) {
        const info = bankingRes.value.data.bankingInfo;
        setBankDetails({
          bankName: info.bankName || '',
          accountName: info.accountName || '',
          accountNumber: info.accountNumber || '',
          branchCode: info.branchCode || '',
          accountType: info.accountType || 'Cheque / Current',
          swiftCode: info.swiftCode || '',
          bankConfirmationUrl: info.bankConfirmationUrl || '',
          payoutPreference: info.payoutPreference || 'Monthly',
          isVerified: Boolean(info.isVerified),
          updatedAt: info.updatedAt || null
        });
        setBusinessName(bankingRes.value.data.businessName || '');
        if (!info.accountNumber) {
          setIsEditing(true);
        }
      } else {
        setIsEditing(true);
      }

      if (walletRes.status === 'fulfilled' && walletRes.value.data) {
        setWalletData(walletRes.value.data.wallet);
        setRecentPayouts((walletRes.value.data.payouts || []).slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching vendor bank details:', err);
      setMessage({ type: 'error', text: 'Failed to load banking information' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingData();
  }, []);

  const handleBankSelect = (e) => {
    const selectedName = e.target.value;
    const match = SA_BANKS.find(b => b.name === selectedName);
    setBankDetails(prev => ({
      ...prev,
      bankName: selectedName,
      branchCode: match && match.branchCode ? match.branchCode : prev.branchCode,
      swiftCode: match && match.swift ? match.swift : prev.swiftCode
    }));
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be under 10MB.' });
      return;
    }

    setUploadingDoc(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/vendor/banking/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.url) {
        setBankDetails(prev => ({
          ...prev,
          bankConfirmationUrl: res.data.url
        }));
        setMessage({ type: 'success', text: 'Bank confirmation document uploaded successfully!' });
      }
    } catch (err) {
      console.error('Upload document error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload bank document.' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!bankDetails.bankName || !bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.branchCode) {
      setMessage({ type: 'error', text: 'Please fill in Bank Name, Account Holder Name, Account Number, and Branch Code.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/vendor/banking', bankDetails);
      setMessage({ type: 'success', text: res.data.message || 'Bank details saved successfully!' });
      setIsEditing(false);
      if (res.data.bankingInfo) {
        setBankDetails(prev => ({
          ...prev,
          ...res.data.bankingInfo
        }));
      }
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Save bank details error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save bank details.' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: `${label} copied to clipboard!` });
    setTimeout(() => setMessage(null), 2500);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-[#e1bd70]">
        <Loader2 size={36} className="animate-spin" />
      </div>
    );
  }

  const hasSavedAccount = Boolean(bankDetails.accountNumber);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-16 animate-fadeIn">
      
      {/* PAGE HEADER */}
      <section className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-[#e1bd70] mb-1">
            <ShieldCheck size={14} /> Settlement Security
          </div>
          <h1 className="text-[var(--color-ivory)] font-serif text-3xl sm:text-4xl flex items-center gap-3 tracking-wide">
            <Landmark className="text-[#e1bd70]" size={34} />
            Vendor Bank Details
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-sm font-light leading-relaxed mt-1 max-w-2xl">
            Manage your official corporate or personal bank account for retail marketplace sales payouts, auction proceeds, and escrow settlements.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <Link
            to="/vendor/wallet"
            className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2"
          >
            <Wallet size={15} className="text-[#e1bd70]" /> View Wallet
          </Link>
          {hasSavedAccount && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="py-2.5 px-4 bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(201,163,91,0.25)]"
            >
              <Edit2 size={14} /> Update Bank Details
            </button>
          )}
        </div>
      </section>

      {/* ALERT / MESSAGE BANNER */}
      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 transition-all ${
          message.type === 'error' 
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300' 
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
        }`}>
          {message.type === 'error' ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* SECTION 1: LIVE BANK CARD DISPLAY */}
      {hasSavedAccount && !isEditing ? (
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1814] via-[#11100e] to-[#080808] border border-[#c9a35b]/40 p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#c9a35b]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            {/* Header of Card */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#c9a35b]/15 border border-[#c9a35b]/30 flex items-center justify-center text-[#e1bd70] shadow-inner">
                  <Landmark size={28} />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-serif text-white font-medium tracking-wide">{bankDetails.bankName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Active Settlement Account
                    </span>
                    {bankDetails.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        <ShieldCheck size={11} /> KYC Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-[#e1bd70] font-bold bg-[#c9a35b]/10 border border-[#c9a35b]/20 px-3 py-1.5 rounded-full">
                  ZAR Payout
                </span>
                <span className="text-xs uppercase font-mono tracking-widest text-white/70 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  {bankDetails.accountType || 'Cheque / Current'}
                </span>
              </div>
            </div>

            {/* Body of Card */}
            <div className="space-y-6 relative z-10">
              {/* Account Number */}
              <div>
                <span className="text-xs uppercase tracking-widest text-white/40 block mb-1.5 font-medium">Account Number</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl text-white tracking-widest font-semibold">
                    {showFullAccount 
                      ? bankDetails.accountNumber 
                      : `•••• •••• •••• ${bankDetails.accountNumber.slice(-4)}`}
                  </span>
                  <button
                    onClick={() => setShowFullAccount(!showFullAccount)}
                    className="p-1.5 text-white/40 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                    title={showFullAccount ? "Hide account number" : "Show account number"}
                  >
                    {showFullAccount ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(bankDetails.accountNumber, "Account Number")}
                    className="p-1.5 text-white/40 hover:text-[#e1bd70] transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                    title="Copy Account Number"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/[0.08]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-white/40 block mb-1 font-medium">Account Holder</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base text-white font-medium">{bankDetails.accountName}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.accountName, "Account Holder")}
                      className="text-white/40 hover:text-[#e1bd70] cursor-pointer transition-colors"
                      title="Copy Account Holder"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-white/40 block mb-1 font-medium">Branch Code</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-mono text-white font-medium">{bankDetails.branchCode}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.branchCode, "Branch Code")}
                      className="text-white/40 hover:text-[#e1bd70] cursor-pointer transition-colors"
                      title="Copy Branch Code"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-white/40 block mb-1 font-medium">Payout Preference</span>
                  <span className="text-sm sm:text-base text-[#e1bd70] font-medium">{bankDetails.payoutPreference || 'Monthly'} Schedule</span>
                </div>
              </div>

              {/* SWIFT Code if available */}
              {bankDetails.swiftCode && (
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/60">
                  <span>SWIFT / BIC Code: <strong className="font-mono text-white">{bankDetails.swiftCode}</strong></span>
                  <button onClick={() => copyToClipboard(bankDetails.swiftCode, "SWIFT Code")} className="text-white/40 hover:text-[#e1bd70] cursor-pointer">
                    <Copy size={12} />
                  </button>
                </div>
              )}

              {/* Bank Confirmation Letter */}
              {bankDetails.bankConfirmationUrl && (
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <FileText size={16} />
                    <span>Official Bank Confirmation Letter uploaded</span>
                  </div>
                  <a
                    href={bankDetails.bankConfirmationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#e1bd70] hover:underline font-semibold"
                  >
                    View Document <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>

            {/* Footer timestamp */}
            {bankDetails.updatedAt && (
              <div className="mt-6 pt-4 border-t border-white/[0.05] text-[11px] text-white/30 text-right">
                Last updated: {new Date(bankDetails.updatedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </section>
      ) : (
        /* SECTION 2: EDIT / ADD BANK FORM */
        <section className="bg-[#101010] border border-white/10 rounded-2xl p-6 sm:p-9">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-serif text-white font-medium flex items-center gap-3">
                <Edit2 size={22} className="text-[#e1bd70]" />
                {hasSavedAccount ? "Edit Settlement Bank Account" : "Register Settlement Bank Account"}
              </h2>
              <p className="text-xs text-white/50 mt-1">
                All fields are securely encrypted and used strictly for marketplace earnings payouts.
              </p>
            </div>
            {hasSavedAccount && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Select SA Bank */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                  Financial Institution / Bank <span className="text-[#e1bd70]">*</span>
                </label>
                <select
                  value={SA_BANKS.some(b => b.name === bankDetails.bankName) ? bankDetails.bankName : (bankDetails.bankName ? 'Other / International Bank' : '')}
                  onChange={handleBankSelect}
                  className="w-full bg-[#161616] border border-white/15 focus:border-[#e1bd70] text-white px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  required
                >
                  <option value="" disabled>Select your bank</option>
                  {SA_BANKS.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* If "Other", text input */}
              {(!SA_BANKS.slice(0, -1).some(b => b.name === bankDetails.bankName) || bankDetails.bankName === 'Other / International Bank') && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                    Custom Bank Name <span className="text-[#e1bd70]">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bankName === 'Other / International Bank' ? '' : bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    placeholder="e.g. Standard Chartered, HSBC"
                    className="w-full bg-[#161616] border border-white/15 focus:border-[#e1bd70] text-white px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                    required
                  />
                </div>
              )}

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                  Account Holder / Company Name <span className="text-[#e1bd70]">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  placeholder={businessName || "Legal business or entity name"}
                  className="w-full bg-[#161616] border border-white/15 focus:border-[#e1bd70] text-white px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  required
                />
                <span className="text-[11px] text-white/40 mt-1 block">Must match the registered business or director name on file.</span>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                  Account Number <span className="text-[#e1bd70]">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="Enter bank account number"
                  className="w-full bg-[#161616] border border-white/15 focus:border-[#e1bd70] text-white font-mono px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  required
                />
              </div>

              {/* Branch Code */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                  Branch Code (Universal) <span className="text-[#e1bd70]">*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.branchCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, branchCode: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 051001"
                  className="w-full bg-[#161616] border border-white/15 focus:border-[#e1bd70] text-white font-mono px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  required
                />
                <span className="text-[11px] text-white/40 mt-1 block">Universal branch code for electronic funds transfer (EFT).</span>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                  Account Type
                </label>
                <select
                  value={bankDetails.accountType}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountType: e.target.value })}
                  className="w-full bg-[#161616] border border-white/15 focus:border-[#e1bd70] text-white px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                >
                  <option value="Cheque / Current">Cheque / Current Account</option>
                  <option value="Business Cheque">Business Cheque Account</option>
                  <option value="Savings">Savings Account</option>
                  <option value="Transmission">Transmission Account</option>
                </select>
              </div>

              {/* SWIFT Code */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                  SWIFT / BIC Code (Optional)
                </label>
                <input
                  type="text"
                  value={bankDetails.swiftCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, swiftCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBZAJJ"
                  className="w-full bg-[#161616] border border-white/15 focus:border-[#e1bd70] text-white font-mono px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                />
              </div>

              {/* Payout Preference */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                  Settlement Schedule Preference
                </label>
                <select
                  value={bankDetails.payoutPreference}
                  onChange={(e) => setBankDetails({ ...bankDetails, payoutPreference: e.target.value })}
                  className="w-full bg-[#161616] border border-white/15 focus:border-[#e1bd70] text-white px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                >
                  <option value="Monthly">Monthly Automatic Settlement</option>
                  <option value="Fortnightly">Fortnightly (Every 2 Weeks)</option>
                  <option value="Weekly">Weekly Scheduled Settlement</option>
                </select>
              </div>

              {/* Bank Confirmation Letter Upload */}
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-semibold">
                  Bank Confirmation Letter / Proof Document (PDF, PNG, JPG)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-white/10 bg-[#161616]">
                  <input
                    type="file"
                    id="bank-doc-upload"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={uploadingDoc}
                  />
                  <label
                    htmlFor="bank-doc-upload"
                    className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-2 shrink-0"
                  >
                    {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} className="text-[#e1bd70]" />}
                    {uploadingDoc ? "Uploading..." : "Upload Document"}
                  </label>

                  {bankDetails.bankConfirmationUrl ? (
                    <div className="flex items-center gap-3 text-xs text-white/80 min-w-0">
                      <FileText size={16} className="text-emerald-400 shrink-0" />
                      <span className="truncate">Document linked</span>
                      <a
                        href={bankDetails.bankConfirmationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#e1bd70] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Preview <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-white/40">Official bank letter confirming account ownership (issued within last 3 months).</span>
                  )}
                </div>
              </div>

            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
              {hasSavedAccount && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl border border-white/15 text-white text-xs uppercase tracking-wider font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving || uploadingDoc}
                className="px-8 py-3 rounded-xl bg-[#c9a35b] hover:bg-[#e1bd70] text-black text-xs uppercase tracking-wider font-bold transition-all shadow-[0_0_20px_rgba(201,163,91,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving Details..." : "Save Bank Details"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SECTION 3: SETTLEMENT POLICIES & QUICK ACTIONS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-[#101010] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#e1bd70]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-base font-serif text-white font-medium">Settlement & Security Standards</h4>
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">Compliance & Protection</span>
            </div>
          </div>
          <ul className="space-y-3 text-xs text-[var(--color-ivory-muted)] leading-relaxed">
            <li className="flex items-start gap-2.5">
              <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>EFT Direct Clearing:</strong> Payouts are transferred directly via South African National Payment System (NPS) with 1-2 business day settlement.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Net Reconciliation:</strong> The platform automatically calculates Gross sales, deducts VAT and Grand Store commission, and reimburses approved courier charges.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Bank-Grade Encryption:</strong> All banking credentials are protected with AES-256 and access-controlled by system financial officers.</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#101010] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#c9a35b]/10 flex items-center justify-center text-[#e1bd70]">
                <Wallet size={20} />
              </div>
              <div>
                <h4 className="text-base font-serif text-white font-medium">Ready for Payout?</h4>
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">Wallet Balance Available</span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-ivory-muted)] leading-relaxed mb-4">
              Your available balance is cleared funds ready for instant withdrawal request. You can request a payout anytime or allow the automated schedule to disburse funds.
            </p>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between mb-4">
              <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Available for Payout</span>
              <span className="text-xl font-serif text-[#e6c97a] font-semibold">{formatMoney(walletData?.availableBalance)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/vendor/wallet?requestPayout=true')}
            className="w-full py-3 bg-[#b58b38] hover:bg-[#c9a35b] text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Wallet size={15} /> Request Payout Now
          </button>
        </div>

      </section>

      {/* SECTION 4: RECENT PAYOUT REDEMPTIONS AUDIT */}
      {recentPayouts.length > 0 && (
        <section className="bg-[#101010] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-serif text-white font-medium">Recent Redemptions to this Account</h4>
              <p className="text-xs text-white/40">Latest payouts queued or disbursed to your banking details.</p>
            </div>
            <Link to="/vendor/wallet" className="text-xs text-[#e1bd70] hover:underline flex items-center gap-1 font-semibold">
              Full History <ChevronRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date Requested</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Destination Bank</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentPayouts.map(payout => (
                  <tr key={payout._id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3">{new Date(payout.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3 px-3 font-mono text-[#e1bd70]">{payout.gsReference}</td>
                    <td className="py-3 px-3">{payout.payoutDetails?.bankName || bankDetails.bankName}</td>
                    <td className="py-3 px-3 font-semibold text-white">{formatMoney(payout.amount)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        payout.status === 'cleared' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                        payout.status === 'failed' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' :
                        'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                      }`}>
                        {payout.status === 'cleared' ? 'Disbursed' : payout.status === 'failed' ? 'Declined' : 'Pending Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
