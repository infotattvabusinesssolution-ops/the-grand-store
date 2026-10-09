import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, AlertCircle, CheckCircle2, X, Crown, Sparkles, 
  Landmark, CreditCard, UploadCloud, Loader2, ArrowRight, Info, 
  ExternalLink, FileText, Calendar, User, FileCheck, Link2
} from 'lucide-react';
import api from '../../api';
import StoreBankDetailsCard from '../StoreBankDetailsCard';
import { useAuth } from '../../context/AuthContext';

export default function BidderVerificationModal({ isOpen, onClose, onSuccess, onNotify, bidderProfile }) {
  const { user } = useAuth();
  const isAlreadyVerified = Boolean(bidderProfile?.isVerified);

  // Dynamic Settings from Admin
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Dynamic KYC Form Values (keys configured by Admin)
  const [formValues, setFormValues] = useState({});
  const [acceptRules, setAcceptRules] = useState(false);

  // File Upload States
  const [uploadingField, setUploadingField] = useState({}); // { [key]: boolean }
  const [showUrlInput, setShowUrlInput] = useState({}); // { [key]: boolean }

  // Tier selection: 'normal' vs 'premium'
  const [tier, setTier] = useState(isAlreadyVerified ? 'premium' : 'normal');

  // Refund Bank Details (for Premium Tier)
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    branchCode: ''
  });

  // Deposit Payment Method & Proof
  const [depositPaymentMethod, setDepositPaymentMethod] = useState('payfast');
  const [depositProofUrl, setDepositProofUrl] = useState('');
  const [uploadingDepositProof, setUploadingDepositProof] = useState(false);
  const [showDepositUrlInput, setShowDepositUrlInput] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (isAlreadyVerified) {
      setTier('premium');
      setAcceptRules(true);
    }

    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load settings in verification modal:', err);
      } finally {
        setLoadingSettings(false);
      }
    };

    const fetchSavedBankDetails = async () => {
      try {
        const res = await api.get('/auth/banking');
        if (res.data?.bankAccountDetails?.accountNumber) {
          const b = res.data.bankAccountDetails;
          setBankDetails(prev => ({
            bankName: prev.bankName || b.bankName || '',
            accountHolder: prev.accountHolder || b.accountHolder || user?.name || '',
            accountNumber: prev.accountNumber || b.accountNumber || '',
            branchCode: prev.branchCode || b.branchCode || ''
          }));
        } else if (user?.name) {
          setBankDetails(prev => ({
            ...prev,
            accountHolder: prev.accountHolder || user.name
          }));
        }
      } catch (err) {
        // Silently ignore if unauthenticated
      }
    };

    fetchSettings();
    fetchSavedBankDetails();
  }, [isOpen, isAlreadyVerified, user]);

  // Sync initial form values from bidderProfile, user, and settings
  useEffect(() => {
    if (!isOpen) return;

    let dobVal = '';
    if (bidderProfile?.dateOfBirth) {
      try {
        dobVal = new Date(bidderProfile.dateOfBirth).toISOString().split('T')[0];
      } catch (e) {}
    }

    const initialValues = {
      fullName: bidderProfile?.legalFullName || user?.name || '',
      legalFullName: bidderProfile?.legalFullName || user?.name || '',
      dateOfBirth: dobVal,
      idType: bidderProfile?.idType || settings?.bidderKycIdTypes?.[0] || 'National ID',
      idNumber: bidderProfile?.idNumber || '',
      idDocumentUrl: bidderProfile?.idDocumentUrl || '',
      proofOfResidenceUrl: bidderProfile?.proofOfResidenceUrl || '',
      ...(bidderProfile?.customKycValues || {})
    };

    setFormValues(prev => ({
      ...initialValues,
      ...prev
    }));

    if (bidderProfile?.bankAccountDetails) {
      setBankDetails(prev => ({
        bankName: bidderProfile.bankAccountDetails.bankName || prev.bankName || '',
        accountHolder: bidderProfile.bankAccountDetails.accountHolder || prev.accountHolder || '',
        accountNumber: bidderProfile.bankAccountDetails.accountNumber || prev.accountNumber || '',
        branchCode: bidderProfile.bankAccountDetails.branchCode || prev.branchCode || ''
      }));
    }
  }, [isOpen, bidderProfile, user, settings]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minAge = settings?.bidderKycMinAge !== undefined ? settings.bidderKycMinAge : 18;
  const dynamicDepositAmount = settings?.auctionPremiumDepositAmount !== undefined 
    ? settings.auctionPremiumDepositAmount 
    : 5000;
  const standardLimit = settings?.auctionStandardBiddingLimit || 25000;
  const premiumLimit = settings?.auctionPremiumBiddingLimit || 250000;

  // Active KYC fields configured by admin
  const activeFields = (settings?.bidderKycFields && settings.bidderKycFields.length > 0)
    ? settings.bidderKycFields.filter(f => f.enabled !== false)
    : [
        { id: 'fullName', key: 'fullName', label: 'Full Legal Name', type: 'text', placeholder: 'As printed on your official identification document', required: true, helpText: 'Official legal identity', enabled: true },
        { id: 'dateOfBirth', key: 'dateOfBirth', label: 'Date of Birth', type: 'date', placeholder: '', required: true, helpText: `Must be at least ${minAge}+ for legal liquor & auction qualification`, enabled: true },
        { id: 'idType', key: 'idType', label: 'Identification Document Type', type: 'select', options: settings?.bidderKycIdTypes || ['National ID', 'Passport', 'Driver License'], placeholder: '', required: true, helpText: 'Select your ID type', enabled: true },
        { id: 'idNumber', key: 'idNumber', label: 'ID / Passport / Document Number', type: 'text', placeholder: 'e.g. 9204155029087 or A12345678', required: true, helpText: 'Official unique document number', enabled: true },
        { id: 'idDocumentUrl', key: 'idDocumentUrl', label: 'Passport or ID Document Upload', type: 'file', placeholder: '', required: settings?.bidderKycRequireDocumentUpload !== false, helpText: 'Upload a clear photo or PDF scan of your passport or ID document (Max 10MB)', enabled: true },
        { id: 'proofOfResidenceUrl', key: 'proofOfResidenceUrl', label: 'Proof of Residence Document (Optional)', type: 'file', placeholder: '', required: false, helpText: 'Utility bill or bank statement less than 3 months old', enabled: true }
      ];

  // Dynamic age calculation from dateOfBirth
  const currentDob = formValues.dateOfBirth || formValues.dob || '';
  let calculatedAge = null;
  if (currentDob) {
    const bDate = new Date(currentDob);
    if (!Number.isNaN(bDate.getTime())) {
      const today = new Date();
      calculatedAge = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        calculatedAge--;
      }
    }
  }

  const handleFieldValueChange = (key, val) => {
    setFormValues(prev => ({
      ...prev,
      [key]: val,
      ...(key === 'fullName' ? { legalFullName: val } : {}),
      ...(key === 'legalFullName' ? { fullName: val } : {})
    }));
  };

  // Generic file upload to Cloudinary (/vendor/upload-public)
  const handleFileUpload = async (fieldKey, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      const msg = 'File exceeds 10MB size limit. Please choose a smaller photo or PDF.';
      setError(msg);
      if (onNotify) onNotify(msg);
      return;
    }

    setUploadingField(prev => ({ ...prev, [fieldKey]: true }));
    setError('');

    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/vendor/upload-public', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        handleFieldValueChange(fieldKey, res.data.url);
        if (onNotify) onNotify('Document uploaded successfully to secure storage!');
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err) {
      console.error('File upload error:', err);
      const msg = err.response?.data?.message || 'Failed to upload document. Please try again or paste URL.';
      setError(msg);
      if (onNotify) onNotify(msg);
    } finally {
      setUploadingField(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  // EFT Deposit Proof Upload
  const handleDepositProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Proof file exceeds 10MB limit.');
      return;
    }

    setUploadingDepositProof(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/vendor/upload-public', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDepositProofUrl(res.data.url);
      if (onNotify) onNotify('EFT deposit receipt uploaded successfully');
    } catch (err) {
      console.error('Deposit proof upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload deposit receipt');
    } finally {
      setUploadingDepositProof(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. If already verified, handle deposit upgrade flow
    if (isAlreadyVerified) {
      if (!bankDetails.bankName || !bankDetails.accountHolder || !bankDetails.accountNumber) {
        setError('Please provide your bank name, account holder, and account number for refundable deposit processing.');
        return;
      }
      if (depositPaymentMethod === 'eft' && !depositProofUrl) {
        setError('Please upload your EFT deposit payment receipt or screenshot.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await api.post('/auction/bidder/deposit', {
          amount: dynamicDepositAmount,
          tier: 'premium',
          paymentMethod: depositPaymentMethod,
          proofOfPayment: depositProofUrl,
          bankAccountDetails: bankDetails
        });

        if (onNotify) onNotify(`Deposit submitted! Admin will verify and activate your R${premiumLimit.toLocaleString()} VIP limit.`);
        if (onSuccess) onSuccess({ bidderDepositStatus: 'pending', bidderDepositAmount: dynamicDepositAmount });
        onClose();
      } catch (err) {
        console.error('Deposit submission error:', err);
        setError(err.response?.data?.message || 'Deposit submission failed.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 2. Validate all required dynamic fields configured by Admin
    for (const field of activeFields) {
      if (field.required) {
        const val = formValues[field.key];
        if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
          setError(`Please provide "${field.label}" to complete qualification.`);
          return;
        }
      }
    }

    // 3. Validate Minimum Age
    if (calculatedAge !== null && calculatedAge < minAge) {
      setError(`Under South African liquor and auction law, you must be at least ${minAge} years of age to bid.`);
      return;
    }

    // 4. Validate mandatory document upload if flag enabled
    if (settings?.bidderKycRequireDocumentUpload && !formValues.idDocumentUrl) {
      setError('A copy of your Passport or Identity Document is required by compliance.');
      return;
    }

    // 5. Rules acceptance
    if (!acceptRules) {
      setError('You must read and accept the Rules of Auction to qualify.');
      return;
    }

    // 6. If VIP Tier selected, validate refund bank details & EFT proof
    if (tier === 'premium') {
      if (!bankDetails.bankName || !bankDetails.accountHolder || !bankDetails.accountNumber) {
        setError('Please provide your bank name, account holder, and account number for refundable deposit processing.');
        return;
      }
      if (depositPaymentMethod === 'eft' && !depositProofUrl) {
        setError('Please upload your EFT deposit payment receipt or screenshot.');
        return;
      }
    }

    // 7. Compile Core vs Custom fields for backend
    const coreKeys = ['fullName', 'legalFullName', 'dateOfBirth', 'dob', 'idType', 'idNumber', 'idDocumentUrl', 'proofOfResidenceUrl'];
    const customKycValues = {};
    Object.keys(formValues).forEach(k => {
      if (!coreKeys.includes(k)) {
        customKycValues[k] = formValues[k];
      }
    });

    const payload = {
      legalFullName: formValues.legalFullName || formValues.fullName || user?.name || '',
      dateOfBirth: currentDob,
      idType: formValues.idType || 'National ID',
      idNumber: formValues.idNumber || '',
      idDocumentUrl: formValues.idDocumentUrl || '',
      proofOfResidenceUrl: formValues.proofOfResidenceUrl || '',
      customKycValues,
      acceptRulesVersion: 'v1.0',
      tier,
      bankAccountDetails: tier === 'premium' ? bankDetails : undefined,
      depositPaymentMethod: tier === 'premium' ? depositPaymentMethod : undefined,
      depositProofUrl: tier === 'premium' ? depositProofUrl : undefined
    };

    setSubmitting(true);
    try {
      const res = await api.post('/auction/bidder/verify', payload);

      if (onNotify) onNotify(res.data.message || 'Verification submitted for administrator approval.');
      if (onSuccess) onSuccess(res.data.bidder || res.data);
      onClose();
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Verification failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  // Renders each dynamic field based on admin configuration
  const renderFieldInput = (field) => {
    const value = formValues[field.key] || '';
    const isUploading = uploadingField[field.key] || false;
    const isUrlMode = showUrlInput[field.key] || false;

    // Field Type 1: File / Document Upload (System for Passports, IDs, Utility Bills, Proofs)
    if (field.type === 'file') {
      return (
        <div key={field.id || field.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs uppercase tracking-widest text-white/80 font-bold">
              {field.label} {field.required && <span className="text-[var(--color-gold)]">*</span>}
            </label>
            <button
              type="button"
              onClick={() => setShowUrlInput(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
              className="text-[11px] text-[var(--color-gold)]/80 hover:text-[var(--color-gold)] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Link2 size={12} /> {isUrlMode ? 'Switch to File Upload' : 'Or paste URL'}
            </button>
          </div>

          {/* If document already attached */}
          {value ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileCheck size={20} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-emerald-300 truncate">Document Attached</p>
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400/80 hover:underline inline-flex items-center gap-1 truncate mt-0.5"
                  >
                    View Document <ExternalLink size={11} />
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFieldValueChange(field.key, '')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Remove
              </button>
            </div>
          ) : isUrlMode ? (
            <div className="space-y-1">
              <input
                type="url"
                placeholder="https://..."
                value={value}
                onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[var(--color-gold)] transition-colors font-mono"
              />
              <p className="text-[11px] text-white/40">Direct link to document scan or photo</p>
            </div>
          ) : (
            <label className="flex flex-col sm:flex-row items-center justify-center gap-3 p-5 border-2 border-dashed border-white/20 hover:border-[var(--color-gold)] bg-black/40 rounded-2xl cursor-pointer transition-all group">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => handleFileUpload(field.key, e.target.files?.[0])}
              />
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-gold)] group-hover:scale-105 transition-transform shrink-0">
                {isUploading ? (
                  <Loader2 size={20} className="animate-spin text-[var(--color-gold)]" />
                ) : (
                  <UploadCloud size={20} />
                )}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-white group-hover:text-[var(--color-gold)] transition-colors">
                  {isUploading ? 'Uploading to Secure Vault...' : 'Click or Drag to Upload Document (Photo / PDF)'}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  Accepted formats: JPG, PNG, WebP, PDF (Max 10MB)
                </p>
              </div>
            </label>
          )}

          {field.helpText && (
            <p className="text-[11px] text-white/40 mt-1">{field.helpText}</p>
          )}
        </div>
      );
    }

    // Field Type 2: Select dropdown (e.g. Document Type)
    if (field.type === 'select') {
      const options = (field.options && field.options.length > 0)
        ? field.options
        : (settings?.bidderKycIdTypes || ['National ID', 'Passport', 'Driver License']);

      return (
        <div key={field.id || field.key} className="space-y-1.5">
          <label className="block text-xs uppercase tracking-widest text-white/80 font-bold">
            {field.label} {field.required && <span className="text-[var(--color-gold)]">*</span>}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleFieldValueChange(field.key, opt)}
                className={`py-2.5 px-3 text-center text-xs rounded-xl border transition-all cursor-pointer font-semibold truncate ${
                  value === opt
                    ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)] text-[var(--color-gold)] shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {field.helpText && (
            <p className="text-[11px] text-white/40 mt-1">{field.helpText}</p>
          )}
        </div>
      );
    }

    // Field Type 3: Date of Birth with Live Age Qualification Banner
    if (field.type === 'date') {
      return (
        <div key={field.id || field.key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs uppercase tracking-widest text-white/80 font-bold flex items-center gap-1.5">
              <Calendar size={13} className="text-[var(--color-gold)]" />
              <span>{field.label}</span> {field.required && <span className="text-[var(--color-gold)]">*</span>}
            </label>
            {calculatedAge !== null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                calculatedAge >= minAge 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {calculatedAge >= minAge ? `✓ ${calculatedAge} Yrs (Legal ${minAge}+)` : `⚠ ${calculatedAge} Yrs (Under ${minAge})`}
              </span>
            )}
          </div>
          <input
            type="date"
            value={value}
            required={field.required}
            onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[var(--color-gold)] transition-colors"
          />
          {calculatedAge !== null && calculatedAge < minAge && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>Underage restriction: You must be at least {minAge} years old to participate.</span>
            </div>
          )}
          {field.helpText && (
            <p className="text-[11px] text-white/40 mt-1">{field.helpText}</p>
          )}
        </div>
      );
    }

    // Field Type 4: Textarea
    if (field.type === 'textarea') {
      return (
        <div key={field.id || field.key} className="space-y-1.5">
          <label className="block text-xs uppercase tracking-widest text-white/80 font-bold">
            {field.label} {field.required && <span className="text-[var(--color-gold)]">*</span>}
          </label>
          <textarea
            rows={2}
            value={value}
            required={field.required}
            placeholder={field.placeholder || ''}
            onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20"
          />
          {field.helpText && (
            <p className="text-[11px] text-white/40 mt-1">{field.helpText}</p>
          )}
        </div>
      );
    }

    // Default: Text input
    return (
      <div key={field.id || field.key} className="space-y-1.5">
        <label className="block text-xs uppercase tracking-widest text-white/80 font-bold">
          {field.label} {field.required && <span className="text-[var(--color-gold)]">*</span>}
        </label>
        <input
          type="text"
          value={value}
          required={field.required}
          placeholder={field.placeholder || ''}
          onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20"
        />
        {field.helpText && (
          <p className="text-[11px] text-white/40 mt-1">{field.helpText}</p>
        )}
      </div>
    );
  };

  const dynamicDepositRef = bidderProfile?.bidderNumber 
    ? `DEP-${bidderProfile.bidderNumber}` 
    : user?._id 
    ? `DEP-${user._id.slice(-6).toUpperCase()}` 
    : 'DEP-VIP';

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-start justify-center p-4 pt-16 sm:pt-24 pb-16 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl my-auto bg-[#0c0c0c] border border-[var(--color-gold)]/30 rounded-3xl p-6 sm:p-10 text-[var(--color-ivory)] shadow-[0_25px_70px_rgba(0,0,0,0.95)]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X size={24} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)] shrink-0">
            {isAlreadyVerified ? <Crown size={26} /> : <ShieldCheck size={26} />}
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[var(--color-gold)]">
              {isAlreadyVerified ? 'Upgrade to Premium VIP Bidding' : `${minAge}+ Legal Age & Identity Verification (KYC)`}
            </h3>
            <p className="text-xs sm:text-sm text-white/50 tracking-wider font-sans uppercase mt-0.5">
              {isAlreadyVerified 
                ? `Unlock High-Value & Reserve Bidding (Up to R${premiumLimit.toLocaleString()})`
                : `Dual Compliance for Store Wine & Spirit Purchases and Live Auction Bidding`
              }
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          
          {/* Section 1: 18+ Age & Identity Verification */}
          {isAlreadyVerified ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-sm text-emerald-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>18+ KYC Verified • Bidder Number: <strong className="text-white font-mono text-base">{bidderProfile.bidderNumber}</strong></span>
              </div>
              <span className="text-xs uppercase font-bold text-white/70 bg-emerald-500/20 px-3 py-1 rounded-lg">
                Current Limit: R{(bidderProfile.biddingLimit || 0).toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="text-xs uppercase tracking-widest text-white/60 font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[var(--color-gold)]" />
                  <span>1. Mandatory {minAge}+ Legal Age & Identity Verification</span>
                </h4>
                <span className="text-[11px] text-[var(--color-gold)] font-medium">Clears Store Purchases & Auction Bidding</span>
              </div>

              <div className="space-y-4">
                {activeFields.map((field) => renderFieldInput(field))}
              </div>
            </div>
          )}

          {/* Section 2: Tier Selection (Shown if not already verified) */}
          {!isAlreadyVerified && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase tracking-widest text-white/50 font-bold flex items-center justify-between border-b border-white/5 pb-2">
                <span>2. Select Your Bidding Tier</span>
                <span className="text-xs text-white/40 font-normal">Choose your bidding limit</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option A: Normal / Standard Bidding */}
                <label 
                  className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between relative ${
                    tier === 'normal'
                      ? 'bg-white/[0.05] border-white/40 ring-1 ring-white/20'
                      : 'bg-black/30 border-white/10 hover:border-white/20'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="biddingTier" 
                    value="normal" 
                    checked={tier === 'normal'} 
                    onChange={() => setTier('normal')} 
                    className="hidden" 
                  />
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-white/70">
                        Standard
                      </span>
                      <span className="text-sm font-bold text-white">Free (R0)</span>
                    </div>
                    <h5 className="text-base font-semibold text-white mb-1.5">Standard Bidding</h5>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Standard {minAge}+ KYC verification. Access standard lots with bidding limit up to <strong>R{standardLimit.toLocaleString()}</strong>. No deposit required.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <span>Standard Lots</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${tier === 'normal' ? 'border-white bg-white' : 'border-white/30'}`}>
                      {tier === 'normal' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                    </div>
                  </div>
                </label>

                {/* Option B: Premium VIP Bidding (Refundable Deposit) */}
                <label 
                  className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between relative overflow-hidden ${
                    tier === 'premium'
                      ? 'bg-gradient-to-br from-[#c9a35b]/15 to-transparent border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]/50 shadow-[0_0_25px_rgba(212,175,55,0.15)]'
                      : 'bg-black/30 border-white/10 hover:border-[var(--color-gold)]/40'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                    <Crown size={70} />
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-2.5 relative z-10">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30 flex items-center gap-1">
                        <Sparkles size={11} /> VIP Tier
                      </span>
                      <span className="text-sm font-bold text-[var(--color-gold)] font-mono">
                        R{dynamicDepositAmount.toLocaleString()} Deposit
                      </span>
                    </div>
                    <h5 className="text-base font-semibold text-white mb-1.5 flex items-center gap-1.5">
                      Premium VIP Bidding
                    </h5>
                    <p className="text-xs text-white/65 leading-relaxed">
                      Unlocks reserve, rare & luxury lots with enhanced limit up to <strong>R{premiumLimit.toLocaleString()}+</strong>.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-[var(--color-gold)] font-medium">
                    <span className="text-xs text-emerald-400 font-semibold">100% Refundable to Bank</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${tier === 'premium' ? 'border-[var(--color-gold)] bg-[var(--color-gold)]' : 'border-white/30'}`}>
                      {tier === 'premium' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                    </div>
                  </div>
                </label>

              </div>
            </div>
          )}

          {/* Section 3: Premium Deposit Details & Refund Bank Account */}
          {(tier === 'premium' || isAlreadyVerified) && (
            <div className="space-y-6 p-6 sm:p-7 rounded-3xl bg-[#090909] border border-[var(--color-gold)]/30 animate-fadeIn">
              
              {/* Refundability Guarantee Banner */}
              <div className="flex items-start gap-3.5 text-sm text-amber-300/90 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                <Info size={20} className="shrink-0 mt-0.5 text-amber-400" />
                <p className="leading-relaxed">
                  <strong className="text-amber-200 font-semibold">100% Refundable Security Guarantee:</strong> The security deposit of <strong className="text-[var(--color-gold)] font-mono">R{dynamicDepositAmount.toLocaleString()}</strong> is held in a protected escrow trust account. It is 100% refundable back to your South African bank account if you do not win any lots or whenever you request it.
                </p>
              </div>

              {/* Refund Bank Details Inputs */}
              <div>
                <div className="mb-4">
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <Landmark size={17} className="text-[var(--color-gold)]" /> Your Bank Account for Deposit Refund
                  </h5>
                  <p className="text-xs text-white/50 mt-1">
                    Please provide the South African bank account where your deposit will be returned upon auction conclusion.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                      Bank Name <span className="text-[var(--color-gold)]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Standard Bank, FNB, ABSA, Capitec..."
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/25"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                      Account Holder Name <span className="text-[var(--color-gold)]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full name as on bank account"
                      value={bankDetails.accountHolder}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolder: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/25"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                      Account Number <span className="text-[var(--color-gold)]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1012345678"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--color-gold)] font-mono transition-colors placeholder:text-white/25"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5 font-semibold">
                      Branch Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 051001"
                      value={bankDetails.branchCode}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, branchCode: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--color-gold)] font-mono transition-colors placeholder:text-white/25"
                    />
                  </div>
                </div>
              </div>

              {/* Deposit Payment Method */}
              <div className="pt-3 border-t border-white/10">
                <div className="mb-4">
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard size={17} className="text-[var(--color-gold)]" /> Pay Refundable Deposit (R{dynamicDepositAmount.toLocaleString()})
                  </h5>
                  <p className="text-xs text-white/50 mt-0.5">
                    Select your preferred payment method to fund the refundable guarantee deposit.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                  <label className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center gap-3.5 text-sm ${depositPaymentMethod === 'payfast' ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)] text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20'}`}>
                    <input 
                      type="radio" 
                      name="depositMethod" 
                      value="payfast" 
                      checked={depositPaymentMethod === 'payfast'} 
                      onChange={() => setDepositPaymentMethod('payfast')} 
                      className="hidden" 
                    />
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--color-gold)] shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white">PayFast (Instant)</p>
                      <p className="text-xs text-white/50">Credit/Debit Card & Instant EFT</p>
                    </div>
                  </label>

                  <label className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center gap-3.5 text-sm ${depositPaymentMethod === 'eft' ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)] text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20'}`}>
                    <input 
                      type="radio" 
                      name="depositMethod" 
                      value="eft" 
                      checked={depositPaymentMethod === 'eft'} 
                      onChange={() => setDepositPaymentMethod('eft')} 
                      className="hidden" 
                    />
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--color-gold)] shrink-0">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white">Manual Bank Transfer</p>
                      <p className="text-xs text-white/50">Direct EFT Escrow with payment proof</p>
                    </div>
                  </label>
                </div>

                {/* EFT Bank Details & Receipt Upload Container */}
                {depositPaymentMethod === 'eft' && (
                  <div className="space-y-5 p-5 sm:p-6 bg-gradient-to-br from-[#131313] to-[#080808] rounded-2xl border border-[var(--color-gold)]/25 shadow-xl animate-fadeIn">
                    
                    <StoreBankDetailsCard
                      reference={dynamicDepositRef}
                      referenceLabel="Deposit Reference"
                      title="Grand Store Escrow Bank Account"
                      subtitle="Official institutional South African EFT settlement account"
                      bankDetailsList={settings?.bankDetailsList}
                      bankDetails={settings?.escrowBank || settings?.bankDetails}
                      compact={true}
                      onNotify={onNotify}
                    />

                    {/* Upload Receipt Dropzone */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs uppercase tracking-wider text-white/80 font-bold">
                          Proof of Payment Screenshot or PDF <span className="text-[var(--color-gold)]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowDepositUrlInput(prev => !prev)}
                          className="text-[11px] text-[var(--color-gold)]/80 hover:text-[var(--color-gold)] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Link2 size={12} /> {showDepositUrlInput ? 'Switch to file upload' : 'Or paste URL'}
                        </button>
                      </div>

                      {depositProofUrl ? (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-fadeIn">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-300">Payment Screenshot Attached</p>
                              <a
                                href={depositProofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-emerald-400/80 hover:underline inline-flex items-center gap-1.5 mt-0.5"
                              >
                                View uploaded document <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDepositProofUrl('')}
                            className="px-3.5 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : showDepositUrlInput ? (
                        <div className="space-y-1">
                          <input
                            type="url"
                            placeholder="https://..."
                            value={depositProofUrl}
                            onChange={(e) => setDepositProofUrl(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[var(--color-gold)] transition-colors font-mono"
                          />
                          <p className="text-[11px] text-white/40">Direct link to EFT payment confirmation</p>
                        </div>
                      ) : (
                        <label className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6 sm:p-8 border-2 border-dashed border-white/20 hover:border-[var(--color-gold)] bg-black/40 rounded-2xl cursor-pointer transition-all group">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handleDepositProofUpload}
                            disabled={uploadingDepositProof}
                          />
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-gold)] group-hover:scale-110 transition-transform shrink-0 shadow-lg">
                            {uploadingDepositProof ? (
                              <Loader2 size={26} className="animate-spin text-[var(--color-gold)]" />
                            ) : (
                              <UploadCloud size={26} />
                            )}
                          </div>
                          <div className="text-center sm:text-left">
                            <p className="text-sm sm:text-base font-bold text-white group-hover:text-[var(--color-gold)] transition-colors">
                              {uploadingDepositProof ? 'Uploading Receipt to Cloudinary...' : 'Click to Upload Deposit Screenshot or PDF'}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              PNG, JPG, WebP or PDF receipt generated from your banking app
                            </p>
                          </div>
                        </label>
                      )}
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

          {/* Section 4: Rules Acceptance (Only for new registrations) */}
          {!isAlreadyVerified && (
            <div className="pt-2">
              <label className="flex items-start gap-3.5 cursor-pointer group">
                <input 
                  type="checkbox"
                  required
                  checked={acceptRules}
                  onChange={(e) => setAcceptRules(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-[var(--color-gold)] cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
                  I warrant that I am at least {minAge} years of age and agree to the <strong className="text-[var(--color-gold)]">Grand Store Terms & Rules of Auction v1.0</strong>. Verification provides legal clearance for wine/spirit store purchases and authorizes live auction bidding under South African CPA regulations.
                </span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting || uploadingDepositProof || Object.values(uploadingField).some(Boolean)}
              className="w-full bg-gold-gradient text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-xs sm:text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.35)]"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Processing Application...</>
              ) : isAlreadyVerified ? (
                <>Submit VIP Upgrade (R{dynamicDepositAmount.toLocaleString()} Refundable Deposit) <Crown size={18} /></>
              ) : tier === 'premium' ? (
                <>Submit Premium VIP Application (R{dynamicDepositAmount.toLocaleString()} Deposit) <ArrowRight size={18} /></>
              ) : (
                <>Submit {minAge}+ Verification (Store Orders & Auctions) <CheckCircle2 size={18} /></>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}
