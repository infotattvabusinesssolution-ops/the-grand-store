import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  Building2, Package, PlusCircle, User, 
  CheckCircle2, Clock, AlertCircle, FileText, Download, Edit3, Settings
} from 'lucide-react';

export default function VendorProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchVendorData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token || user?.token;
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/vendor/onboarding`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVendorData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorData();
  }, [user, navigate]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'active':
      case 'approved':
        return { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', icon: <CheckCircle2 size={16} />, text: 'Approved' };
      case 'pending_approval':
        return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: <Clock size={16} />, text: 'Pending Admin Approval' };
      case 'rejected':
        return { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', icon: <AlertCircle size={16} />, text: 'Requires Revision' };
      default:
        return { color: 'text-[#e1bd70]', bg: 'bg-[var(--color-gold)]/10', border: 'border-[var(--color-gold)]/20', icon: <FileText size={16} />, text: 'Draft Application' };
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] text-[var(--color-ivory)] flex items-center justify-center">Loading...</div>;
  }

  const statusDisplay = getStatusDisplay(vendorData?.status || 'draft');

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      
      {/* Welcome Section */}
      <section className="mb-4">
        <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4">
          Vendor <span className="text-6xl text-[#e1bd70] font-normal ml-2 tracking-wide ">Profile</span>
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light">
          View and manage your onboarding details, business documents, and verification status.
        </p>
      </section>

      {/* Application Status Card */}
      <div className="p-8 lg:p-12 border-t border-[var(--color-gold)]/20 relative overflow-hidden group transition-all duration-500">
        <div className="absolute top-0 right-0 p-8">
          <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-xs uppercase tracking-widest font-semibold shadow-lg ${statusDisplay.color} ${statusDisplay.bg} ${statusDisplay.border}`}>
            {statusDisplay.icon}
            {statusDisplay.text}
          </div>
        </div>

        <div className="max-w-2xl">
          <h2 className="text-2xl font-serif text-[var(--color-ivory)] mb-6 flex items-center gap-3">
            <Settings className="text-[#e1bd70]" size={24} />
            Application Overview
          </h2>
          
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Legal Name</div>
              <div className="text-lg text-[var(--color-ivory)]">{vendorData?.businessInfo?.legalName || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Registration No.</div>
              <div className="text-lg text-[var(--color-ivory)]">{vendorData?.businessInfo?.registrationNumber || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">VAT Number</div>
              <div className="text-lg text-[var(--color-ivory)]">{vendorData?.taxInfo?.vatNumber || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Primary Category</div>
              <div className="text-lg text-[var(--color-ivory)]">{vendorData?.productCategories?.[0] || 'N/A'}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/vendor/onboarding')}
              className="bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-sm px-8 py-3 rounded-full  transition-all flex items-center gap-2"
            >
              <Edit3 size={18} />
              Re-upload / Edit Application
            </button>
          </div>
        </div>
      </div>
      
      {/* Detailed Sections */}
      {vendorData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* KYC & Identity */}
          <div className="p-8 border-t border-white/10">
            <h3 className="text-xl font-serif text-[var(--color-ivory)] mb-6 pb-4 border-b border-white/[0.05] flex items-center gap-3">
              <User className="text-[#e1bd70]" size={20} />
              KYC & Identity
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Director Name</div>
                <div className="text-base text-[var(--color-ivory)]">{vendorData.kycInfo?.directorName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">ID Number</div>
                <div className="text-base text-[var(--color-ivory)]">{vendorData.kycInfo?.idNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">ID Document</div>
                {vendorData.kycInfo?.idDocumentUrl ? (
                  <a href={vendorData.kycInfo.idDocumentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#e1bd70] hover:underline mt-1">
                    <Download size={14} /> View Document
                  </a>
                ) : (
                  <div className="text-sm text-red-400">Missing</div>
                )}
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="p-8 border-t border-white/10">
            <h3 className="text-xl font-serif text-[var(--color-ivory)] mb-6 pb-4 border-b border-white/[0.05] flex items-center gap-3">
              <Building2 className="text-[#e1bd70]" size={20} />
              Banking Details
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Bank Name</div>
                <div className="text-base text-[var(--color-ivory)]">{vendorData.bankingInfo?.bankName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Account Number</div>
                <div className="text-base text-[var(--color-ivory)]">
                  {vendorData.bankingInfo?.accountNumber ? `****${vendorData.bankingInfo.accountNumber.slice(-4)}` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Bank Confirmation Letter</div>
                {vendorData.bankingInfo?.bankConfirmationUrl ? (
                  <a href={vendorData.bankingInfo.bankConfirmationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#e1bd70] hover:underline mt-1">
                    <Download size={14} /> View Document
                  </a>
                ) : (
                  <div className="text-sm text-red-400">Missing</div>
                )}
              </div>
            </div>
          </div>
          {/* Licensing / Specifics */}
          {(vendorData.productCategories?.includes('Wine')) && (
            <div className="p-8 border-t border-white/10 col-span-1 md:col-span-2">
              <h3 className="text-xl font-serif text-[var(--color-ivory)] mb-6 pb-4 border-b border-white/[0.05] flex items-center gap-3">
                <FileText className="text-[#e1bd70]" size={20} />
                Category Specific Documents
              </h3>
              <div className="space-y-4">
                {vendorData.productCategories?.includes('Wine') && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Wholesale Liquor Authority (WLA) Document</div>
                    {vendorData.licenceInfo?.wlaDocumentUrl ? (
                      <a href={vendorData.licenceInfo.wlaDocumentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#e1bd70] hover:underline mt-1">
                        <Download size={14} /> View Document
                      </a>
                    ) : (
                      <div className="text-sm text-red-400">Missing - Required for Wine sellers</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
