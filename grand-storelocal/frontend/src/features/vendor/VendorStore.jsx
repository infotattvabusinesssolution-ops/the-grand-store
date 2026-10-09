import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Store, Upload, Save, ExternalLink, Image as ImageIcon, Loader2, CheckCircle2, Building2 } from 'lucide-react';

export default function VendorStore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    businessName: '',
    logoUrl: '',
    bannerUrl: '',
    story: '',
    vendorId: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    const fetchStoreProfile = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token || user?.token;
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/vendor/store-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData(data);
      } catch (error) {
        console.error('Failed to fetch store profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStoreProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveSuccess(false);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    if (type === 'banner') setUploadingBanner(true);
    setSaveSuccess(false);

    const formDataObj = new FormData();
    formDataObj.append('document', file);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || user?.token;
      
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/vendor/onboarding/upload`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      const fileUrl = `${import.meta.env.VITE_API_URL || ''}${data.url}`;
      
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logoUrl: fileUrl }));
      } else {
        setFormData(prev => ({ ...prev, bannerUrl: fileUrl }));
      }
      
    } catch (error) {
      console.error('File upload failed', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'banner') setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || user?.token;
      
      await axios.put(`${import.meta.env.VITE_API_URL || ''}/api/vendor/store-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save store profile:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c9a35b]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-ivory)] mb-2 flex items-center gap-3">
            <Store className="text-[#e1bd70]" />
            Store Management
          </h1>
          <p className="text-[var(--color-ivory-muted)]">
            Customize how your brand appears to customers on your public StoreFront.
          </p>
        </div>
        
        <div className="flex gap-4">
          {formData.vendorId && (
            <button 
              onClick={() => navigate(`/store/${formData.vendorId}`)}
              className="flex items-center gap-2 px-6 py-3 rounded text-sm font-medium uppercase tracking-widest bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              <ExternalLink size={16} /> Preview Store
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded text-sm font-medium uppercase tracking-widest bg-[#c9a35b] text-black hover:bg-[#e1bd70] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {saveSuccess && (
        <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-3 text-green-400">
          <CheckCircle2 size={20} />
          <span>Your store profile has been successfully updated!</span>
        </div>
      )}

      <div className="space-y-8">
        
        {/* Banner Section */}
        <section className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/[0.05]">
            <h2 className="text-xl font-serif text-[var(--color-ivory)] mb-1">Store Banner</h2>
            <p className="text-sm text-[var(--color-ivory-muted)]">This will appear at the very top of your StoreFront.</p>
          </div>
          
          <div className="p-6">
            <div className="relative w-full h-48 md:h-64 bg-[#111] rounded-lg overflow-hidden flex items-center justify-center border border-dashed border-white/20 group">
              {formData.bannerUrl ? (
                <img src={formData.bannerUrl} alt="Store Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
              ) : (
                <div className="text-center text-white/30 flex flex-col items-center">
                  <ImageIcon size={48} className="mb-2 opacity-50" />
                  <span>No banner uploaded</span>
                </div>
              )}
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <button 
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white border border-[#c9a35b] rounded text-sm uppercase tracking-widest font-medium hover:bg-[#c9a35b] hover:text-black transition-colors"
                >
                  {uploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploadingBanner ? 'Uploading...' : (formData.bannerUrl ? 'Change Banner' : 'Upload Banner')}
                </button>
              </div>
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
            </div>
            <p className="text-xs text-[#888] mt-3">Recommended size: 1920x600 pixels. Max file size: 5MB.</p>
          </div>
        </section>

        {/* Profile Info Section */}
        <section className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Logo Upload */}
          <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col items-center text-center">
            <h2 className="text-xl font-serif text-[var(--color-ivory)] mb-1 w-full text-left">Store Logo</h2>
            <p className="text-sm text-[var(--color-ivory-muted)] w-full text-left mb-6">Your brand's identity.</p>
            
            <div className="relative w-40 h-40 rounded-full bg-[#111] border-2 border-[#c9a35b]/30 overflow-hidden group flex items-center justify-center">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Store Logo" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
              ) : (
                <Building2 size={48} className="text-white/20" />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full">
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  className="p-3 bg-[#c9a35b] text-black rounded-full hover:bg-white transition-colors"
                  title="Upload Logo"
                >
                  {uploadingLogo ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                </button>
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
            </div>
            <p className="text-xs text-[#888] mt-4">Recommended size: 400x400 pixels (1:1 ratio).</p>
          </div>
          
          {/* Text Fields */}
          <div className="p-6 md:w-2/3 flex flex-col gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#888] mb-2">Store / Business Name</label>
              <input 
                type="text" 
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full bg-[#111] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a35b] transition-colors"
                placeholder="e.g. Grand Estate Winery"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest text-[#888] mb-2">Store Story / Description</label>
              <textarea 
                name="story"
                value={formData.story}
                onChange={handleChange}
                rows={6}
                className="w-full h-full min-h-[160px] bg-[#111] border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a35b] transition-colors resize-none"
                placeholder="Share the history and craft behind your brand with your customers..."
              />
            </div>
          </div>
          
        </section>
        
      </div>
    </div>
  );
}
