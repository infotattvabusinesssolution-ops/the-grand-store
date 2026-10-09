import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useGeoLocation } from '../../context/LocationContext';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, UploadCloud, Building2, User, FileText, BadgeCheck, FileSpreadsheet, Landmark, Package, Truck, FileSignature, Globe, Image as ImageIcon, Trash2, ExternalLink, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../../firebase';
import LocationInput from '../../components/LocationInput';

const InputField = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="mb-6">
    <label className="block text-[#bdb5a6] text-[10px] font-bold uppercase tracking-widest mb-2">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="block w-full py-4 border-b border-white/10 bg-transparent text-[#eee8dd] placeholder-white/20 focus:outline-none focus:border-[#c9a35b] sm:text-sm transition-colors rounded-none" />
  </div>
);

const DOCUMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.heic,.heif,.doc,.docx';
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const getFileKind = (url, mimeType = '', fileName = '') => {
  const fileIdentifier = `${String(url || '').split(/[?#]/)[0]} ${fileName}`.toLowerCase();
  if (mimeType.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif)(?:\s|$)/.test(fileIdentifier)) return 'image';
  if (mimeType === 'application/pdf' || /\.pdf(?:\s|$)/.test(fileIdentifier)) return 'pdf';
  return 'document';
};

const getFileName = (url) => {
  if (!url) return '';
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop()) || 'Uploaded document';
  } catch {
    return String(url).split('/').pop() || 'Uploaded document';
  }
};

const FileUploadField = ({ label, url, onChange, uploadFile, required = false }) => {
  const inputRef = useRef(null);
  const previewObjectUrlRef = useRef('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [localMimeType, setLocalMimeType] = useState('');
  const [localFileName, setLocalFileName] = useState('');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = localPreview || url;
  const displayedFileName = localFileName || getFileName(url);
  const fileKind = getFileKind(previewUrl, localMimeType, displayedFileName);

  const releaseLocalPreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = '';
    }
    setLocalPreview('');
    setLocalMimeType('');
    setLocalFileName('');
  };

  useEffect(() => () => {
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
  }, []);

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewUrl]);

  const handleSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_DOCUMENT_SIZE) {
      setError('This file is larger than 10 MB. Choose a smaller file.');
      return;
    }

    releaseLocalPreview();
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    setLocalMimeType(file.type);
    setLocalFileName(file.name);
    setPreviewOpen(true);
    setError('');
    setUploading(true);

    try {
      const uploadedFile = await uploadFile(file);
      const uploadedUrl = typeof uploadedFile === 'string' ? uploadedFile : uploadedFile?.url;
      if (!uploadedUrl) throw new Error('The server did not return an uploaded file URL.');
      setLocalMimeType(uploadedFile?.mimeType || file.type);
      setLocalFileName(uploadedFile?.originalName || file.name);
      onChange(uploadedUrl);
    } catch (err) {
      releaseLocalPreview();
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    if (required && !window.confirm(`Remove the required ${label.toLowerCase()}? You will need to upload another file before submitting.`)) return;
    releaseLocalPreview();
    onChange('');
    setError('');
    setPreviewOpen(false);
    setPreviewFailed(false);
  };

  return (
    <div className="mb-6 rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="block text-[#bdb5a6] text-[10px] font-bold uppercase tracking-widest">
          {label}{required && <span className="ml-1 text-[#c9a35b]">*</span>}
        </label>
        <span className="text-[10px] uppercase tracking-wider text-white/30">Images, PDF or Word · max 10 MB</span>
      </div>
      <input ref={inputRef} type="file" className="hidden" onChange={handleSelection} accept={DOCUMENT_ACCEPT} />

      {!previewUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/15 px-4 py-6 text-sm text-[#eee8dd] transition-colors hover:border-[#c9a35b] hover:bg-[#c9a35b]/5"
        >
          <UploadCloud size={19} className="text-[#c9a35b]" /> Choose a file
        </button>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#c9a35b]/25 bg-[#c9a35b]/5">
          <div className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              {fileKind === 'image' ? (
                <img src={previewUrl} alt="Selected file" className="h-11 w-11 shrink-0 rounded object-cover border border-white/10" />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white/5 border border-white/10">
                  <FileText size={20} className="text-[#c9a35b]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm text-[#eee8dd]">{displayedFileName || 'Selected document'}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">{fileKind === 'image' ? 'Image' : fileKind === 'pdf' ? 'PDF document' : 'Document'} {uploading ? '· uploading' : '· ready'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(fileKind === 'image' || fileKind === 'pdf') && (
                <button type="button" onClick={() => setPreviewOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded border border-white/10 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:bg-white/5">
                  {previewOpen ? <EyeOff size={13} /> : <Eye size={13} />} {previewOpen ? 'Hide' : 'Preview'}
                </button>
              )}
              {!uploading && <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded border border-white/10 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:bg-white/5"><ExternalLink size={13} /> Open</a>}
              <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded border border-[#c9a35b]/35 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#dabb76] hover:bg-[#c9a35b]/10 disabled:opacity-50"><RefreshCw size={13} /> Replace</button>
              <button type="button" disabled={uploading} onClick={removeFile} aria-label={`Remove ${label}`} className="rounded border border-red-500/20 p-2 text-red-300/70 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"><Trash2 size={14} /></button>
            </div>
          </div>

          {uploading && <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2 text-xs text-[#dabb76]"><Loader2 size={14} className="animate-spin" /> Uploading securely…</div>}

          {previewOpen && !previewFailed && fileKind === 'image' && (
            <div className="h-64 border-t border-white/10 bg-black/50 p-2"><img src={previewUrl} onError={() => setPreviewFailed(true)} alt={`${label} preview`} className="h-full w-full object-contain" /></div>
          )}
          {previewOpen && !previewFailed && fileKind === 'pdf' && (
            <iframe src={`${previewUrl}#toolbar=1&navpanes=0&view=FitH`} onError={() => setPreviewFailed(true)} className="h-72 w-full border-0 border-t border-white/10 bg-white" title={`${label} preview`} />
          )}
          {previewOpen && previewFailed && <div className="border-t border-white/10 p-3 text-xs text-amber-200/80">This browser could not display the inline preview. Use “Open” to view the uploaded file.</div>}
          {fileKind === 'document' && <div className="border-t border-white/10 p-3 text-xs text-white/40">Word documents cannot be reliably previewed in the browser. Use “Open” to view or download this file.</div>}
        </div>
      )}

      {error && <div className="mt-3 flex items-start gap-2 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</div>}
    </div>
  );
};
export default function OnboardingWizard() {
  const { user, googleLogin } = useAuth();
  const { country_code } = useGeoLocation();
  const navigate = useNavigate();
  
  const isLocal = country_code === 'ZA';

  const steps = useMemo(() => {
    if (isLocal) {
      return [
        { id: 1, title: 'Account', icon: User },
        { id: 2, title: 'Business', icon: Building2 },
        { id: 3, title: 'KYC', icon: FileText },
        { id: 4, title: 'Tax', icon: FileSpreadsheet },
        { id: 5, title: 'Licence', icon: BadgeCheck },
        { id: 6, title: 'Customs', icon: Truck },
        { id: 7, title: 'Banking', icon: Landmark },
        { id: 8, title: 'Products', icon: Package },
        { id: 9, title: 'Delivery', icon: Truck },
        { id: 10, title: 'Agreement', icon: FileSignature }
      ];
    } else {
      return [
        { id: 1, title: 'Account', icon: User },
        { id: 2, title: 'Business', icon: Building2 },
        { id: 3, title: 'Credentials', icon: BadgeCheck },
        { id: 4, title: 'Market', icon: Globe },
        { id: 5, title: 'Logistics', icon: Truck },
        { id: 6, title: 'Story', icon: ImageIcon },
        { id: 7, title: 'Banking', icon: Landmark },
        { id: 8, title: 'Products', icon: Package },
        { id: 9, title: 'Agreement', icon: FileSignature }
      ];
    }
  }, [isLocal]);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for each step
  const [accountInfo, setAccountInfo] = useState({ name: '', email: '', password: '' });
  const [businessInfo, setBusinessInfo] = useState({ legalName: '', tradingName: '', registrationNumber: '', businessType: '', address: '' });
  const [kycInfo, setKycInfo] = useState({ directorName: '', idNumber: '', contactNumber: '', idDocumentUrl: '' });
  const [taxInfo, setTaxInfo] = useState({ taxNumber: '', vatNumber: '', taxClearanceUrl: '' });
  const [licenceInfo, setLicenceInfo] = useState({ licenceNumber: '', licenceType: '', expiryDate: '', licenceDocumentUrl: '', wlaDocumentUrl: '' });
  const [customsInfo, setCustomsInfo] = useState({ exportCode: '', exportDocumentUrl: '' });
  const [bankingInfo, setBankingInfo] = useState({ bankName: '', accountName: '', accountNumber: '', branchCode: '', swiftCode: '', bankConfirmationUrl: '', payoutPreference: 'Monthly' });
  const [productCategories, setProductCategories] = useState([]);
  const [deliveryInfo, setDeliveryInfo] = useState({ fulfillmentMethod: '', dispatchLocation: '', dispatchDays: '', cutoffTime: '', processingTime: '' });
  const [agreements, setAgreements] = useState({ termsAccepted: false, informationAccurate: false });
  
  // International specific state
  const [credentialsInfo, setCredentialsInfo] = useState({ exportLicenceNumber: '', homeCountryLicence: '', certificates: '' });
  const [marketInfo, setMarketInfo] = useState({ targetRegions: [] });
  const [logisticsInfo, setLogisticsInfo] = useState({ currentImporter: '', freightForwarder: '' });
  const [storyInfo, setStoryInfo] = useState({ wineryPhotosUrl: '', winemakerBio: '', brandStory: '' });

  useEffect(() => {
    // If logged in, populate account info
    if (user && !accountInfo.email) {
      setAccountInfo({ name: user.name || '', email: user.email || '', password: '' });
    }

    const fetchVendorData = async () => {
      let hasBackendData = false;
      try {
        const vendorRoles = ['vendor_active', 'vendor_pending', 'vendor_rejected', 'vendor_approved_unpaid'];
        if (user && vendorRoles.includes(user.role)) {
          try {
            const { data } = await api.get('/vendor/onboarding');
            if (data && data.businessInfo) {
              hasBackendData = true;
              if (data.businessInfo) setBusinessInfo(data.businessInfo);
              if (data.kycInfo) setKycInfo(data.kycInfo);
              if (data.taxInfo) setTaxInfo(data.taxInfo);
              if (data.licenceInfo) setLicenceInfo(data.licenceInfo);
              if (data.customsInfo) setCustomsInfo(data.customsInfo);
              if (data.bankingInfo) setBankingInfo(data.bankingInfo);
              if (data.productCategories) setProductCategories(data.productCategories);
              if (data.deliveryInfo) setDeliveryInfo(data.deliveryInfo);
              if (data.agreements) setAgreements(data.agreements);
              if (data.credentialsInfo) setCredentialsInfo(data.credentialsInfo);
              if (data.marketInfo) setMarketInfo(data.marketInfo);
              if (data.logisticsInfo) setLogisticsInfo(data.logisticsInfo);
              if (data.storyInfo) setStoryInfo(data.storyInfo);
            }
          } catch (backendError) {
            console.error('Unable to load saved vendor application', backendError);
          }
        }

        // A matching local draft contains the applicant's newest unsaved edits and
        // should be applied over older backend data.
        const savedData = localStorage.getItem('vendor-onboarding-draft');
        if (savedData) {
          const data = JSON.parse(savedData);
          const belongsToCurrentUser = !user || !data.userId || data.userId === user._id || data.accountInfo?.email === user.email;
          if (!hasBackendData || belongsToCurrentUser) {
            if (data.currentStep) setCurrentStep(data.currentStep);
            if (data.accountInfo && !user) setAccountInfo(data.accountInfo);
            if (data.businessInfo) setBusinessInfo(data.businessInfo);
            if (data.kycInfo) setKycInfo(data.kycInfo);
            if (data.taxInfo) setTaxInfo(data.taxInfo);
            if (data.licenceInfo) setLicenceInfo(data.licenceInfo);
            if (data.customsInfo) setCustomsInfo(data.customsInfo);
            if (data.bankingInfo) setBankingInfo(data.bankingInfo);
            if (data.productCategories) setProductCategories(data.productCategories);
            if (data.deliveryInfo) setDeliveryInfo(data.deliveryInfo);
            if (data.agreements) setAgreements(data.agreements);
            if (data.credentialsInfo) setCredentialsInfo(data.credentialsInfo);
            if (data.marketInfo) setMarketInfo(data.marketInfo);
            if (data.logisticsInfo) setLogisticsInfo(data.logisticsInfo);
            if (data.storyInfo) setStoryInfo(data.storyInfo);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [user]);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem('vendor-onboarding-draft', JSON.stringify({
      userId: user?._id,
      currentStep,
      accountInfo,
      businessInfo,
      kycInfo,
      taxInfo,
      licenceInfo,
      customsInfo,
      bankingInfo,
      productCategories,
      deliveryInfo,
      agreements,
      credentialsInfo,
      marketInfo,
      logisticsInfo,
      storyInfo,
    }));
  }, [loading, user?._id, currentStep, accountInfo, businessInfo, kycInfo, taxInfo, licenceInfo, customsInfo, bankingInfo, productCategories, deliveryInfo, agreements, credentialsInfo, marketInfo, logisticsInfo, storyInfo]);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    const { data } = await api.post('/vendor/upload-public', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!data?.url) throw new Error('The server did not return an uploaded file URL.');
    return data;
  };

  const isStepComplete = (stepId) => {
    if (isLocal) {
      switch (stepId) {
        case 1:
          if (!accountInfo.name || !accountInfo.email) return false;
          if (!user && !accountInfo.password) return false;
          return true;
        case 2:
          return !!(businessInfo.legalName && businessInfo.tradingName && businessInfo.registrationNumber && businessInfo.address);
        case 3:
          return !!(kycInfo.directorName && kycInfo.idNumber && kycInfo.contactNumber);
        case 4:
          return !!(taxInfo.taxNumber && taxInfo.vatNumber);
        case 5:
          return !!(licenceInfo.licenceNumber && licenceInfo.licenceType);
        case 6:
          return true; // Optional
        case 7:
          return !!(bankingInfo.bankName && bankingInfo.accountName && bankingInfo.accountNumber && bankingInfo.branchCode);
        case 8:
          if (productCategories.length === 0) return false;
          if (productCategories.includes('Wine') && !licenceInfo.wlaDocumentUrl) return false;
          return true;
        case 9:
          return !!(deliveryInfo.fulfillmentMethod && deliveryInfo.dispatchLocation && deliveryInfo.processingTime);
        case 10:
          return agreements.termsAccepted && agreements.informationAccurate;
        default:
          return false;
      }
    } else {
      switch (stepId) {
        case 1:
          if (!accountInfo.name || !accountInfo.email) return false;
          if (!user && !accountInfo.password) return false;
          return true;
        case 2:
          return !!(businessInfo.legalName && businessInfo.address);
        case 3:
          return !!credentialsInfo.homeCountryLicence;
        case 4:
          return marketInfo.targetRegions.length > 0;
        case 5:
          return true; // Optional
        case 6:
          return !!(storyInfo.brandStory);
        case 7:
          return !!(bankingInfo.bankName && bankingInfo.accountNumber);
        case 8:
          return productCategories.length > 0;
        case 9:
          return agreements.termsAccepted && agreements.informationAccurate;
        default:
          return false;
      }
    }
  };

  const canAccessStep = (stepId) => {
    if (stepId === 1) return true;
    for (let i = 1; i < stepId; i++) {
      if (!isStepComplete(i)) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!isStepComplete(currentStep)) {
      alert("Please fill in all required fields before continuing.");
      return;
    }
    // Save to localStorage
    const dataToSave = {
      currentStep: currentStep + 1,
      userId: user?._id,
      accountInfo, businessInfo, kycInfo, taxInfo, licenceInfo, customsInfo, bankingInfo, productCategories, deliveryInfo, agreements,
      credentialsInfo, marketInfo, logisticsInfo, storyInfo
    };
    localStorage.setItem('vendor-onboarding-draft', JSON.stringify(dataToSave));
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        vendorType: isLocal ? 'local' : 'international',
        accountInfo, businessInfo, bankingInfo, productCategories, agreements,
        ...(isLocal ? { kycInfo, taxInfo, licenceInfo, customsInfo, deliveryInfo } : { credentialsInfo, marketInfo, logisticsInfo, storyInfo })
      };
      
      const res = await api.post(`/vendor/register-full`, payload);
      const data = res.data;

      localStorage.removeItem('vendor-onboarding-draft');
      localStorage.setItem('userInfo', JSON.stringify(data));
      window.location.href = '/customer/profile';
    } catch (err) {
      console.error(err);
      alert('Error submitting application: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const userData = await googleLogin(userCredential, 'vendor_pending');
      setAccountInfo({ name: userData.name, email: userData.email, password: '' });
    } catch (err) {
      console.error('Firebase Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        alert('Google Login Failed: ' + (err.message || 'Error authenticating with Google'));
      }
    } finally {
      setLoading(false);
    }
  };


  if (loading) return <div className="vendor-theme min-h-screen bg-[#0a0907] flex items-center justify-center text-[#e1bd70]">Loading...</div>;

  return (
    <div className="vendor-theme min-h-screen bg-[#0a0907] pt-8 pb-20 px-4 relative overflow-hidden">
      <Link 
        to="/" 
        className="fixed top-6 left-6 z-50 flex items-center justify-center w-10 h-10 bg-[#e1bd70]/10 hover:bg-[#e1bd70]/20 text-[#e1bd70] rounded-full border border-[#c9a35b]/20 backdrop-blur-sm transition-all duration-300"
        title="Back to Home"
      >
        <ChevronLeft size={20} />
      </Link>
      {/* Massive subtle golden glow background */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c9a35b]/5 pointer-events-none rounded-full blur-3xl opacity-60"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-6 text-center">
          <h1 className="text-[#eee8dd] font-serif text-4xl font-medium mb-4">Become a Grand Store Vendor</h1>
          <p className="text-[#918a7f] max-w-xl mx-auto">Sell your wines and spirits to customers across South Africa. Application takes approximately 10–15 minutes.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 overflow-x-auto pb-4 hide-scrollbar">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            let isComplete = false;
            if (isLocal && step.id === 6) {
              isComplete = currentStep > 6 || !!customsInfo.exportCode;
            } else if (!isLocal && step.id === 5) {
              isComplete = currentStep > 5 || !!logisticsInfo.currentImporter || !!logisticsInfo.freightForwarder;
            } else {
              isComplete = isStepComplete(step.id);
            }
            
            return (
              <div key={step.id} className="flex items-center min-w-max">
                <div 
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-2 transition-all cursor-pointer hover:scale-105 ${isActive ? 'text-[#e1bd70]' : isComplete ? 'text-green-500' : 'text-[#4a4740]'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-[#c9a35b] bg-[#c9a35b]/10' : isComplete ? 'border-green-500 bg-green-500/10' : 'border-[#4a4740] bg-transparent'}`}>
                    {isComplete ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase">{step.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-8 h-[2px] mx-2 ${isComplete ? 'bg-green-500' : 'bg-[#4a4740]'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-transparent mt-4 relative">
          {!canAccessStep(currentStep) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#c9a35b]/10 text-[#e1bd70] border border-[#c9a35b]/20 px-4 py-2 rounded-full text-sm font-medium z-10">
              🔒 Please complete all previous steps to unlock this section
            </div>
          )}
          
          {(() => {
            const activeStep = steps.find(s => s.id === currentStep)?.title;
            return (
          <div className={`${!canAccessStep(currentStep) ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Step: Account */}
            {activeStep === 'Account' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Account Details</h2>
                <p className="text-[#918a7f] mb-6">Create your vendor account to manage your products and orders.</p>
                <InputField label="Contact Name" value={accountInfo.name} onChange={e => setAccountInfo({...accountInfo, name: e.target.value})} placeholder="Your full name" />
                <InputField label="Email Address" type="email" value={accountInfo.email} onChange={e => setAccountInfo({...accountInfo, email: e.target.value})} placeholder="you@company.com" />
                {user ? (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6">
                    <p className="text-[10px] text-green-500 uppercase tracking-widest font-bold mb-1">Authenticated via Google / Login</p>
                    <p className="text-[#eee8dd] text-sm">You are logged in as {user.email}. Password is not required.</p>
                  </div>
                ) : (
                  <>
                    <InputField label="Password" type="password" value={accountInfo.password} onChange={e => setAccountInfo({...accountInfo, password: e.target.value})} placeholder="Create a strong password" />
                    
                    <div className="relative mt-8 mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                        <span className="bg-[#0a0a0a] px-2 text-white/40">Or continue with</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full flex justify-center items-center py-4 px-4 text-[10px] uppercase tracking-widest font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none transition-colors rounded-xl gap-2 mb-6"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step: Business */}
            {activeStep === 'Business' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Business Information</h2>
                <InputField label="Legal Company Name" value={businessInfo.legalName} onChange={e => setBusinessInfo({...businessInfo, legalName: e.target.value})} />
                <InputField label="Trading Name" value={businessInfo.tradingName} onChange={e => setBusinessInfo({...businessInfo, tradingName: e.target.value})} />
                <InputField label="Registration Number" value={businessInfo.registrationNumber} onChange={e => setBusinessInfo({...businessInfo, registrationNumber: e.target.value})} />
                <div className="mb-6">
                  <label className="block text-[#bdb5a6] text-[10px] font-bold uppercase tracking-widest mb-2">Business Address</label>
                  <LocationInput name="address" value={businessInfo.address} onChange={e => setBusinessInfo({...businessInfo, address: e.target.value})} placeholder="Start typing address..." className="block w-full py-4 border-b border-white/10 bg-transparent text-[#eee8dd] placeholder-white/20 focus:outline-none focus:border-[#c9a35b] sm:text-sm transition-colors rounded-none" />
                </div>
              </div>
            )}

            {/* Step: KYC (Local) */}
            {activeStep === 'KYC' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Director KYC</h2>
                <InputField label="Director Full Name" value={kycInfo.directorName} onChange={e => setKycInfo({...kycInfo, directorName: e.target.value})} />
                <InputField label="ID Number" value={kycInfo.idNumber} onChange={e => setKycInfo({...kycInfo, idNumber: e.target.value})} />
                <InputField label="Contact Number" value={kycInfo.contactNumber} onChange={e => setKycInfo({...kycInfo, contactNumber: e.target.value})} />
                <FileUploadField label="Director ID Document" url={kycInfo.idDocumentUrl} uploadFile={uploadFile} onChange={(url) => setKycInfo((current) => ({...current, idDocumentUrl: url}))} />
              </div>
            )}

            {/* Step: Tax (Local) */}
            {activeStep === 'Tax' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Tax Details</h2>
                <InputField label="Tax Number" value={taxInfo.taxNumber} onChange={e => setTaxInfo({...taxInfo, taxNumber: e.target.value})} />
                <InputField label="VAT Number" value={taxInfo.vatNumber} onChange={e => setTaxInfo({...taxInfo, vatNumber: e.target.value})} />
                <FileUploadField label="SARS Tax Clearance" url={taxInfo.taxClearanceUrl} uploadFile={uploadFile} onChange={(url) => setTaxInfo((current) => ({...current, taxClearanceUrl: url}))} />
              </div>
            )}

            {/* Step: Licence (Local) */}
            {activeStep === 'Licence' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Liquor Licence</h2>
                <InputField label="Licence Number" value={licenceInfo.licenceNumber} onChange={e => setLicenceInfo({...licenceInfo, licenceNumber: e.target.value})} />
                <InputField label="Licence Type" value={licenceInfo.licenceType} onChange={e => setLicenceInfo({...licenceInfo, licenceType: e.target.value})} />
                <FileUploadField label="Licence Document" url={licenceInfo.licenceDocumentUrl} uploadFile={uploadFile} onChange={(url) => setLicenceInfo((current) => ({...current, licenceDocumentUrl: url}))} />
              </div>
            )}

            {/* Step: Customs (Local) */}
            {activeStep === 'Customs' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Customs (Optional)</h2>
                <InputField label="Export Code" value={customsInfo.exportCode} onChange={e => setCustomsInfo({...customsInfo, exportCode: e.target.value})} />
                <FileUploadField label="Customs Document" url={customsInfo.exportDocumentUrl} uploadFile={uploadFile} onChange={(url) => setCustomsInfo((current) => ({...current, exportDocumentUrl: url}))} />
              </div>
            )}

            {/* Step: Banking */}
            {activeStep === 'Banking' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Banking Details</h2>
                <InputField label="Bank Name" value={bankingInfo.bankName} onChange={e => setBankingInfo({...bankingInfo, bankName: e.target.value})} />
                <InputField label="Account Name" value={bankingInfo.accountName} onChange={e => setBankingInfo({...bankingInfo, accountName: e.target.value})} />
                <InputField label="Account Number" value={bankingInfo.accountNumber} onChange={e => setBankingInfo({...bankingInfo, accountNumber: e.target.value})} />
                <InputField label="Branch Code" value={bankingInfo.branchCode} onChange={e => setBankingInfo({...bankingInfo, branchCode: e.target.value})} />
                <FileUploadField label="Bank Confirmation Letter" url={bankingInfo.bankConfirmationUrl} uploadFile={uploadFile} onChange={(url) => setBankingInfo((current) => ({...current, bankConfirmationUrl: url}))} />
              </div>
            )}

            {/* Step: Products */}
            {activeStep === 'Products' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Products & Inventory</h2>
                <p className="text-[#918a7f] mb-4">Select the categories you intend to sell:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {['Whisky', 'Wine', 'Spirits'].map(cat => (
                    <label key={cat} className="flex items-center gap-2 text-[#eee8dd] p-3 border border-white/5 rounded-md hover:border-white/20 cursor-pointer">
                      <input type="checkbox" checked={productCategories.includes(cat)} 
                             onChange={(e) => {
                               if(e.target.checked) setProductCategories([...productCategories, cat]);
                               else setProductCategories(productCategories.filter(c => c !== cat));
                             }} />
                      {cat}
                    </label>
                  ))}
                </div>
                
                {productCategories.includes('Wine') && (
                  <div className="animate-in fade-in bg-white/5 p-6 rounded-lg border border-[#c9a35b]/30">
                    <h3 className="text-lg text-[#e1bd70] mb-4">Wine Selling Requirements</h3>
                    <p className="text-[#918a7f] mb-4 text-sm">Because you selected Wine, you are required to upload a Wholesale Liquor Authority (WLA) document.</p>
                    <FileUploadField 
                      label="WLA Document"
                      url={licenceInfo.wlaDocumentUrl} 
                      required
                      uploadFile={uploadFile}
                      onChange={(url) => setLicenceInfo((current) => ({...current, wlaDocumentUrl: url}))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step: Delivery (Local) */}
            {activeStep === 'Delivery' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Delivery & Fulfillment</h2>
                <InputField label="Fulfillment Method" placeholder="e.g. Vendor ships directly" value={deliveryInfo.fulfillmentMethod} onChange={e => setDeliveryInfo({...deliveryInfo, fulfillmentMethod: e.target.value})} />
                <div className="mb-6">
                  <label className="block text-[#bdb5a6] text-[10px] font-bold uppercase tracking-widest mb-2">Dispatch Location</label>
                  <LocationInput name="dispatchLocation" value={deliveryInfo.dispatchLocation} onChange={e => setDeliveryInfo({...deliveryInfo, dispatchLocation: e.target.value})} placeholder="Start typing address..." className="block w-full py-4 border-b border-white/10 bg-transparent text-[#eee8dd] placeholder-white/20 focus:outline-none focus:border-[#c9a35b] sm:text-sm transition-colors rounded-none" />
                </div>
                <InputField label="Processing Time" placeholder="e.g. 1-2 Business Days" value={deliveryInfo.processingTime} onChange={e => setDeliveryInfo({...deliveryInfo, processingTime: e.target.value})} />
              </div>
            )}

            {/* Step: Credentials (International) */}
            {activeStep === 'Credentials' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Export Credentials</h2>
                <InputField label="Export Licence Number" value={credentialsInfo.exportLicenceNumber} onChange={e => setCredentialsInfo({...credentialsInfo, exportLicenceNumber: e.target.value})} />
                <FileUploadField label="Home Country Licence" url={credentialsInfo.homeCountryLicence} required uploadFile={uploadFile} onChange={(url) => setCredentialsInfo((current) => ({...current, homeCountryLicence: url}))} />
                <FileUploadField label="Quality/Origin Certificates (Optional)" url={credentialsInfo.certificates} uploadFile={uploadFile} onChange={(url) => setCredentialsInfo((current) => ({...current, certificates: url}))} />
              </div>
            )}

            {/* Step: Market (International) */}
            {activeStep === 'Market' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Target Markets</h2>
                <p className="text-[#918a7f] mb-4">Which regions are you targeting in South Africa?</p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {['Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Nationwide'].map(region => (
                    <label key={region} className="flex items-center gap-2 text-[#eee8dd] p-3 border border-white/5 rounded-md hover:border-white/20 cursor-pointer">
                      <input type="checkbox" checked={marketInfo.targetRegions.includes(region)} 
                             onChange={(e) => {
                               if(e.target.checked) setMarketInfo({...marketInfo, targetRegions: [...marketInfo.targetRegions, region]});
                               else setMarketInfo({...marketInfo, targetRegions: marketInfo.targetRegions.filter(r => r !== region)});
                             }} />
                      {region}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Logistics (International) */}
            {activeStep === 'Logistics' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Current Importer Details</h2>
                <InputField label="Current Importer in SA (Optional)" value={logisticsInfo.currentImporter} onChange={e => setLogisticsInfo({...logisticsInfo, currentImporter: e.target.value})} placeholder="If applicable" />
                <InputField label="Preferred Freight Forwarder (Optional)" value={logisticsInfo.freightForwarder} onChange={e => setLogisticsInfo({...logisticsInfo, freightForwarder: e.target.value})} />
              </div>
            )}

            {/* Step: Story (International) */}
            {activeStep === 'Story' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Brand Story</h2>
                <InputField label="Winemaker/Master Distiller Bio" type="text" value={storyInfo.winemakerBio} onChange={e => setStoryInfo({...storyInfo, winemakerBio: e.target.value})} />
                <InputField label="Brand Story / Heritage" type="text" value={storyInfo.brandStory} onChange={e => setStoryInfo({...storyInfo, brandStory: e.target.value})} placeholder="Tell your customers about your legacy..." />
                <FileUploadField label="Winery/Estate Photos" url={storyInfo.wineryPhotosUrl} uploadFile={uploadFile} onChange={(url) => setStoryInfo((current) => ({...current, wineryPhotosUrl: url}))} />
              </div>
            )}

            {/* Step: Agreement */}
            {activeStep === 'Agreement' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl text-[#eee8dd] mb-6">Final Agreement</h2>
                <div className="space-y-4 mb-8">
                  <label className="flex items-start gap-3 text-[#eee8dd] p-4 bg-[#0a0907] border border-white/5 rounded-md cursor-pointer">
                    <input type="checkbox" className="mt-1" checked={agreements.informationAccurate} onChange={e => setAgreements({...agreements, informationAccurate: e.target.checked})} />
                    <span className="text-sm">I confirm that all information provided is accurate and I am authorised to represent the business. I hold the required licences applicable to my products.</span>
                  </label>
                  <label className="flex items-start gap-3 text-[#eee8dd] p-4 bg-[#0a0907] border border-white/5 rounded-md cursor-pointer">
                    <input type="checkbox" className="mt-1" checked={agreements.termsAccepted} onChange={e => setAgreements({...agreements, termsAccepted: e.target.checked})} />
                    <span className="text-sm">I agree to Grand Store's Vendor Terms & Conditions, Commission Structure, and Prohibited Products Policy.</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          );
          })()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-6 border-t border-white/10">
            <button 
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || saving}
              className="px-4 py-4 text-[#bdb5a6] hover:text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              Return
            </button>
            
            {currentStep < steps.length ? (
              <button 
                onClick={handleNext}
                disabled={saving || !canAccessStep(currentStep)}
                className={`px-8 py-4 text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2  transition-all ${saving || !canAccessStep(currentStep) ? 'bg-[#e1bd70]/50 cursor-not-allowed' : 'bg-[#c9a35b] hover:brightness-110'}`}
              >
                {saving ? 'Saving...' : 'Save & Continue'} <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={saving || !canAccessStep(currentStep) || !agreements.termsAccepted || !agreements.informationAccurate}
                className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2  transition-all bg-[#c9a35b] hover:brightness-110 disabled:opacity-50"
              >
                {saving ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
