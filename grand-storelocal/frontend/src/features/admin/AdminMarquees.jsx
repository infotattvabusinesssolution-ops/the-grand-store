import React, { useState, useEffect } from 'react';
import { Tag, AlertTriangle, X, Upload } from 'lucide-react';
import api from '../../api';

export default function AdminMarquees() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingState, setUploadingState] = useState({}); // { categoryId: boolean }
  const [message, setMessage] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories/admin');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleLogoUpload = async (e, category) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingState(prev => ({ ...prev, [category._id]: true }));
    setMessage('');

    try {
      // 1. Upload logo
      const data = new FormData();
      data.append('image', file);
      const res = await api.post('/categories/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newLogo = { url: res.data.url, public_id: res.data.public_id };
      
      // 2. Update category with new logo
      const updatedLogos = [...(category.brandLogos || []), newLogo];
      
      await api.put(`/categories/${category._id}`, {
        ...category,
        brandLogos: updatedLogos
      });

      // 3. Update local state
      setCategories(prev => prev.map(c => 
        c._id === category._id ? { ...c, brandLogos: updatedLogos } : c
      ));

    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage(error.response?.data?.message || 'Error uploading logo');
    } finally {
      setUploadingState(prev => ({ ...prev, [category._id]: false }));
      e.target.value = null;
    }
  };

  const handleRemoveLogo = async (category, indexToRemove) => {
    if (!window.confirm("Are you sure you want to remove this logo?")) return;
    
    setMessage('');
    try {
      const updatedLogos = [...(category.brandLogos || [])];
      updatedLogos.splice(indexToRemove, 1);
      
      await api.put(`/categories/${category._id}`, {
        ...category,
        brandLogos: updatedLogos
      });

      // Update local state
      setCategories(prev => prev.map(c => 
        c._id === category._id ? { ...c, brandLogos: updatedLogos } : c
      ));

    } catch (error) {
      console.error('Error removing logo:', error);
      setMessage(error.response?.data?.message || 'Error removing logo');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-[var(--color-ivory)] flex items-center gap-2">
          <Tag className="text-[var(--color-gold)]" /> Brand Marquees
        </h1>
        <p className="text-sm text-[var(--color-ivory-muted)] mt-1">
          Configure scrolling brand marquees shown on the home page per category.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center text-[var(--color-ivory-muted)] p-12 animate-pulse border border-white/5 bg-[#0a0a0a] rounded-2xl">
          Loading categories...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map(category => (
            <div key={category._id} className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden flex flex-col">
              
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h2 className="font-serif text-[var(--color-ivory)] text-lg">{category.name}</h2>
                <span className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest bg-black/50 px-2 py-1 rounded">
                  {(category.brandLogos || []).length} Logos
                </span>
              </div>

              {/* Logos Grid */}
              <div className="p-4 flex-1">
                {(category.brandLogos || []).length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                    {category.brandLogos.map((logo, index) => (
                      <div key={index} className="relative aspect-video bg-white rounded flex items-center justify-center p-2 border border-white/20 group">
                        <img src={logo.url} alt={`${category.name} Brand`} className="max-w-full max-h-full object-contain" />
                        <button 
                          type="button"
                          onClick={() => handleRemoveLogo(category, index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Logo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--color-ivory-muted)] text-center py-8 bg-black/30 rounded border border-white/5 mb-4">
                    No custom logos. <br/> Will fallback to default data.
                  </div>
                )}
              </div>

              {/* Footer / Upload */}
              <div className="p-4 border-t border-white/10 bg-black/40">
                <label className={`w-full flex items-center justify-center gap-2 border border-dashed border-white/20 rounded py-3 text-center cursor-pointer hover:border-[var(--color-gold)] transition-colors ${uploadingState[category._id] ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, category)} className="hidden" />
                  <Upload size={16} className="text-[var(--color-ivory-muted)]" />
                  <span className="text-sm text-[var(--color-ivory-muted)]">
                    {uploadingState[category._id] ? 'Uploading...' : 'Upload Logo'}
                  </span>
                </label>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
