import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Building2, Package, CheckCircle2, AlertCircle, PlusCircle, User, Gavel, Image as ImageIcon, Video, Upload, Trash2, Star, Play, Link as LinkIcon, Film, X, Minus, MinusCircle, Plus, Eye, ZoomIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../context/CategoryContext';

const toDatetimeLocal = (date) => {
  const value = new Date(date);
  const pad = (number) => number.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

export default function AuctionSubmission({ onNotify }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const storeCategories = categories.map(c => c.name);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    startingBid: '',
    reservePrice: '',
    condition: '',
    provenance: '',
    distillery: '',
    expression: '',
    vintage: '',
    bottlingYear: '',
    ageStatement: '',
    bottleNumber: '',
    caskNumber: '',
    bottleSizeMl: '750',
    abv: '43',
    countryOfOrigin: 'Scotland',
    fillLevel: 'Into Neck',
    boxCondition: 'Original Box / Case Pristine',
    sealCondition: 'Intact & Pristine',
    estimatedValueMin: '',
    estimatedValueMax: '',
    reserveType: 'confidential',
    startDate: '',
    endDate: ''
  });
  
  // Unified images array: { id, file, preview, name, size }
  const [lotImages, setLotImages] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoMode, setVideoMode] = useState('upload');
  const [previewModalItem, setPreviewModalItem] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user || (user.role !== 'vendor_active' && user.role !== 'admin' && user.role !== 'auction_host')) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="p-8 border border-red-500/20 bg-red-950/10 text-[var(--color-ivory)] max-w-md w-full flex items-center gap-4">
          <AlertCircle size={32} className="text-red-400 shrink-0" />
          <p className="font-light leading-relaxed">Only approved vendors can submit lots for auction.</p>
        </div>
      </div>
    );
  }

  const handleImageChange = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    
    // Reset file input so selecting same filename again works
    e.target.value = '';

    const remainingSlots = 8 - lotImages.length;
    if (remainingSlots <= 0) {
      return setError('Maximum 8 photos allowed per auction lot.');
    }

    const filesToRead = rawFiles.slice(0, remainingSlots);

    const newItems = await Promise.all(
      filesToRead.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                file,
                preview: reader.result,
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2)
              });
            };
            reader.readAsDataURL(file);
          })
      )
    );

    // Append to existing images - NEVER replaces them!
    setLotImages((prev) => [...prev, ...newItems]);
    setError('');
  };

  const handleRemoveImage = (idToRemove) => {
    setLotImages((prev) => prev.filter((item) => item.id !== idToRemove));
    if (previewModalItem && previewModalItem.id === idToRemove) {
      setPreviewModalItem(null);
    }
  };

  const handleSetPrimaryImage = (idToPrimary) => {
    setLotImages((prev) => {
      const idx = prev.findIndex((item) => item.id === idToPrimary);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 60 * 1024 * 1024) {
        return setError('Video file must be under 60MB.');
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError('');
      e.target.value = '';
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview('');
    setVideoUrlInput('');
    if (previewModalItem && previewModalItem.type === 'video') {
      setPreviewModalItem(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || user?.token;

      if (!lotImages || lotImages.length === 0) {
        throw new Error('At least one primary lot image is required.');
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error('Enter a valid auction start and end time.');
      }
      if (endDate <= startDate) {
        throw new Error('Auction end time must be later than the start time.');
      }
      if (endDate <= new Date()) {
        throw new Error('Auction end time must be in the future.');
      }

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('startingBid', Number(formData.startingBid));
      payload.append('reservePrice', Number(formData.reservePrice));
      payload.append('startDate', startDate.toISOString());
      payload.append('endDate', endDate.toISOString());
      payload.append('category', formData.category || 'Whisky');
      payload.append('condition', formData.condition);
      payload.append('provenance', formData.provenance);

      // Phase 2 Specifications
      payload.append('distillery', formData.distillery);
      payload.append('expression', formData.expression);
      payload.append('vintage', formData.vintage);
      payload.append('bottlingYear', formData.bottlingYear);
      payload.append('ageStatement', formData.ageStatement);
      payload.append('bottleNumber', formData.bottleNumber);
      payload.append('caskNumber', formData.caskNumber);
      payload.append('bottleSizeMl', Number(formData.bottleSizeMl) || 750);
      payload.append('abv', Number(formData.abv) || 43);
      payload.append('countryOfOrigin', formData.countryOfOrigin || 'Scotland');
      payload.append('fillLevel', formData.fillLevel);
      payload.append('boxCondition', formData.boxCondition);
      payload.append('sealCondition', formData.sealCondition);
      payload.append('reserveType', formData.reserveType);
      if (formData.estimatedValueMin) payload.append('estimatedValueMin', Number(formData.estimatedValueMin));
      if (formData.estimatedValueMax) payload.append('estimatedValueMax', Number(formData.estimatedValueMax));

      lotImages.forEach(item => {
        payload.append('images', item.file);
      });

      if (videoFile) {
        payload.append('video', videoFile);
      } else if (videoUrlInput.trim()) {
        payload.append('videoUrl', videoUrlInput.trim());
      }

      await api.post('/auction', payload, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      if (onNotify) onNotify('Auction lot submitted successfully for review!');
      
      setTimeout(() => {
        navigate(user.role === 'auction_host' ? '/auction-manager/dashboard' : '/vendor/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to submit auction lot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="max-w-4xl w-full">
        {/* Welcome Section */}
        <section className="mb-4">
          <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4">
            Submit <span className="text-6xl text-[#e1bd70] font-normal ml-2 tracking-wide ">Auction Lot</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light">
            Submit your rare and collectible items for review by our expert curators.
          </p>
        </section>

        {error && (
          <div className="bg-red-950/20 backdrop-blur-md border border-red-500/20 text-red-400 p-4 rounded-xl shadow-lg mb-8">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-950/10 border border-green-500/20 text-green-400 p-8 mt-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={48} className="mb-4" />
            <h3 className="text-2xl font-serif mb-2 text-[var(--color-ivory)]">Submission Successful</h3>
            <p className="font-light">Your lot has been submitted for curation. Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full mt-12 space-y-16">
            
            {/* General Information */}
            <div className="space-y-10">
              <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                <Gavel size={24} className="text-[#e1bd70]" />
                Lot Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="relative z-0 w-full group">
                  <input 
                    type="text" 
                    name="title" 
                    id="title"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                    required 
                  />
                  <label 
                    htmlFor="title" 
                    className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    Lot Title *
                  </label>
                </div>
                
                <div className="w-full group">
                  <label 
                    htmlFor="category" 
                    className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3"
                  >
                    Category *
                  </label>
                  <select 
                    name="category" 
                    id="category"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    required
                    className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg appearance-none focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors"
                  >
                    <option value="" disabled hidden>Select Category</option>
                    {storeCategories.map(cat => (
                      <option key={cat} className="bg-[#1a1a1a]" value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Media Gallery & Video Showcase */}
              <div className="space-y-8 pt-6 border-b border-white/[0.05] pb-12">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className="text-sm uppercase tracking-widest text-[var(--color-ivory)] font-semibold flex items-center gap-2">
                      <ImageIcon size={18} className="text-[#e1bd70]" />
                      Lot Photography Gallery *
                    </label>
                    <span className="text-[11px] uppercase tracking-wider text-[var(--color-ivory-muted)] font-mono">
                      {lotImages.length} / 8 Photos Added
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-ivory-muted)] font-light mb-6">
                    Upload up to 8 high-resolution photos. The first photo is the catalog cover. Use the <strong className="text-white">Preview (Eye)</strong> to inspect full-size and <strong className="text-white">Minus (-)</strong> to remove any photo.
                  </p>

                  {/* Initial Dropzone if 0 images */}
                  {lotImages.length === 0 && (
                    <label className="border-2 border-dashed border-[var(--color-gold)]/30 hover:border-[var(--color-gold)]/70 bg-[#0c0c0c] hover:bg-[#141414] transition-all rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group mb-6">
                      <div className="w-14 h-14 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload size={26} className="text-[#e1bd70]" />
                      </div>
                      <p className="text-base font-medium text-[var(--color-ivory)] mb-1">
                        Select or Drag & Drop Lot Photos
                      </p>
                      <p className="text-xs text-[var(--color-ivory-muted)]">
                        PNG, JPG, WEBP up to 15MB each (Add multiple photos at once or one by one)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        multiple
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Structured Image Previews Grid with Minus & Preview & + Add More */}
                  {lotImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {lotImages.map((imgItem, idx) => (
                        <div
                          key={imgItem.id}
                          className={`relative rounded-xl overflow-hidden border ${
                            idx === 0
                              ? 'border-[#e1bd70] ring-2 ring-[#e1bd70]/40'
                              : 'border-white/10 hover:border-white/30'
                          } bg-black/60 group aspect-[3/4] flex flex-col justify-between p-2.5 transition-all`}
                        >
                          <img
                            src={imgItem.preview}
                            alt={imgItem.name}
                            className="absolute inset-0 w-full h-full object-cover -z-10 group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/70 -z-10 pointer-events-none" />

                          {/* Top Controls: Cover badge / Number + Preview + Minus Button */}
                          <div className="flex items-center justify-between w-full z-10">
                            {idx === 0 ? (
                              <span className="inline-flex items-center gap-1 bg-[#e1bd70] text-black text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded shadow">
                                <Star size={10} fill="black" /> Cover
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-white/80 bg-black/70 px-1.5 py-0.5 rounded backdrop-blur">
                                #{idx + 1}
                              </span>
                            )}

                            <div className="flex items-center gap-1.5">
                              {/* Preview Option */}
                              <button
                                type="button"
                                onClick={() => setPreviewModalItem({ type: 'image', url: imgItem.preview, title: imgItem.name, size: imgItem.size, id: imgItem.id })}
                                className="p-1.5 rounded-full bg-black/70 hover:bg-[#e1bd70] hover:text-black text-white/90 transition-colors cursor-pointer backdrop-blur"
                                title="Preview full size"
                              >
                                <Eye size={13} />
                              </button>

                              {/* Minus Option */}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(imgItem.id)}
                                className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer backdrop-blur shadow"
                                title="Minus / Remove this photo"
                              >
                                <Minus size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Bottom Controls: File info & Make Cover button */}
                          <div className="z-10 mt-auto">
                            <div className="text-[9px] text-white/60 font-mono truncate mb-1">
                              {imgItem.name} ({imgItem.size} MB)
                            </div>
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(imgItem.id)}
                                className="w-full text-center text-[9px] font-bold uppercase tracking-wider py-1 bg-white/20 hover:bg-[#e1bd70] hover:text-black rounded transition-colors text-white backdrop-blur cursor-pointer"
                              >
                                Set as Cover
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Explicit '+' Add More Photos Tile in Grid */}
                      {lotImages.length < 8 && (
                        <label className="border-2 border-dashed border-white/20 hover:border-[#e1bd70] hover:bg-white/[0.03] transition-all rounded-xl aspect-[3/4] flex flex-col items-center justify-center text-center cursor-pointer p-4 group">
                          <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#e1bd70]/20 flex items-center justify-center mb-2 transition-colors">
                            <Plus size={20} className="text-white/60 group-hover:text-[#e1bd70]" />
                          </div>
                          <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                            + Add Photo
                          </span>
                          <span className="text-[10px] text-white/40 mt-0.5">
                            {8 - lotImages.length} remaining
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            multiple
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Video Showcase Section */}
                <div className="pt-6 border-t border-white/[0.05]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className="text-sm uppercase tracking-widest text-[var(--color-ivory)] font-semibold flex items-center gap-2">
                      <Film size={18} className="text-[#e1bd70]" />
                      360° Inspection Video or Bottle Showcase (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVideoMode('upload')}
                        className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                          videoMode === 'upload'
                            ? 'bg-[#e1bd70] text-black'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        Upload Video File
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode('url')}
                        className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                          videoMode === 'url'
                            ? 'bg-[#e1bd70] text-black'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        Video URL
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-ivory-muted)] font-light mb-5">
                    Adding a 360-degree rotation video or inspection clip dramatically increases buyer confidence. (Does not affect or replace uploaded photos).
                  </p>

                  {videoMode === 'upload' ? (
                    <div>
                      {!videoPreview ? (
                        <label className="border border-dashed border-white/20 hover:border-[#e1bd70]/60 bg-[#0c0c0c] hover:bg-[#141414] transition-all rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group">
                          <Video size={28} className="text-[#e1bd70] mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-semibold text-[var(--color-ivory)] mb-1">
                            Click to upload bottle rotation / inspection video
                          </p>
                          <p className="text-[10px] text-[var(--color-ivory-muted)]">
                            MP4, MOV, WEBM up to 60MB
                          </p>
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm"
                            onChange={handleVideoChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="relative max-w-md rounded-xl overflow-hidden border border-[#e1bd70]/40 bg-black/60 p-3.5">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full rounded-lg max-h-64 object-cover bg-black"
                          />
                          <div className="flex items-center justify-between mt-3.5 px-1">
                            <button
                              type="button"
                              onClick={() => setPreviewModalItem({ type: 'video', url: videoPreview, title: videoFile?.name || 'Inspection Video' })}
                              className="text-xs text-[#e1bd70] hover:text-[#f3d38c] font-semibold inline-flex items-center gap-1.5 cursor-pointer bg-[#e1bd70]/10 px-2.5 py-1 rounded-md border border-[#e1bd70]/20"
                            >
                              <Eye size={13} /> Preview Video
                            </button>
                            
                            {/* Minus / Remove Option */}
                            <button
                              type="button"
                              onClick={handleRemoveVideo}
                              className="text-xs text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1 cursor-pointer bg-red-950/20 px-2.5 py-1 rounded-md border border-red-500/20"
                            >
                              <Minus size={13} /> Remove Video (-)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-xl">
                      <div className="relative">
                        <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          type="url"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="e.g. https://www.youtube.com/watch?v=... or direct MP4 link"
                          className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#e1bd70]"
                        />
                      </div>
                      {videoUrlInput && (
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>External video link attached.</span>
                          <button
                            type="button"
                            onClick={() => setVideoUrlInput('')}
                            className="text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Minus size={13} /> Remove Link (-)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full group mt-8">
                <label 
                  htmlFor="description" 
                  className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3"
                >
                  Detailed Description & Notes *
                </label>
                <textarea 
                  name="description" 
                  id="description"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  rows="4"
                  className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors resize-none" 
                  placeholder="Enter detailed description..." 
                  required 
                />
              </div>
            </div>

            {/* Bottle Specifications (Phase 2) */}
            <div className="space-y-10 pt-6">
              <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                <Package size={24} className="text-[#e1bd70]" />
                Bottle Specifications
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="relative z-0 w-full group">
                  <input 
                    type="text" 
                    value={formData.distillery} 
                    onChange={e => setFormData({...formData, distillery: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                  />
                  <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-[#e1bd70]">
                    Distillery / Brand (e.g. The Macallan)
                  </label>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="text" 
                    value={formData.expression} 
                    onChange={e => setFormData({...formData, expression: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                  />
                  <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-[#e1bd70]">
                    Expression / Release (e.g. 25-Year-Old Sherry Oak)
                  </label>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="text" 
                    value={formData.vintage} 
                    onChange={e => setFormData({...formData, vintage: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                  />
                  <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-[#e1bd70]">
                    Vintage Year (e.g. 1968)
                  </label>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="text" 
                    value={formData.bottleNumber} 
                    onChange={e => setFormData({...formData, bottleNumber: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                  />
                  <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-[#e1bd70]">
                    Bottle Number / Edition (e.g. 142 of 250)
                  </label>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="number" 
                    value={formData.bottleSizeMl} 
                    onChange={e => setFormData({...formData, bottleSizeMl: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                  />
                  <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-[#e1bd70]">
                    Bottle Size (ml)
                  </label>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.abv} 
                    onChange={e => setFormData({...formData, abv: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                  />
                  <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-[#e1bd70]">
                    Alcohol by Volume (% ABV)
                  </label>
                </div>
              </div>
            </div>

            {/* Condition & Provenance Assessment */}
            <div className="space-y-10 pt-6">
              <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                <CheckCircle2 size={24} className="text-[#e1bd70]" />
                Condition & Inspection Assessment
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-bold">
                    Liquid Fill Level *
                  </label>
                  <select 
                    value={formData.fillLevel} 
                    onChange={e => setFormData({...formData, fillLevel: e.target.value})} 
                    className="w-full px-4 py-3 bg-[#141414] border border-[var(--color-gold)]/40 rounded-xl text-white text-sm outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="High Fill">High Fill (Original level)</option>
                    <option value="Into Neck">Into Neck</option>
                    <option value="Top Shoulder">Top Shoulder</option>
                    <option value="Upper Mid Shoulder">Upper Mid Shoulder</option>
                    <option value="Mid Shoulder">Mid Shoulder</option>
                    <option value="Low Shoulder">Low Shoulder</option>
                    <option value="Below Shoulder">Below Shoulder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-bold">
                    Box / Cask Packaging *
                  </label>
                  <select 
                    value={formData.boxCondition} 
                    onChange={e => setFormData({...formData, boxCondition: e.target.value})} 
                    className="w-full px-4 py-3 bg-[#141414] border border-[var(--color-gold)]/40 rounded-xl text-white text-sm outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="Original Box / Case Pristine">Original Box / Case Pristine</option>
                    <option value="Original Box / Minor Wear">Original Box / Minor Wear</option>
                    <option value="Damaged Packaging">Damaged Packaging</option>
                    <option value="Tube Packaging">Tube Packaging</option>
                    <option value="No Original Box">No Original Box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-bold">
                    Capsule & Seal Condition *
                  </label>
                  <select 
                    value={formData.sealCondition} 
                    onChange={e => setFormData({...formData, sealCondition: e.target.value})} 
                    className="w-full px-4 py-3 bg-[#141414] border border-[var(--color-gold)]/40 rounded-xl text-white text-sm outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="Intact & Pristine">Intact & Pristine</option>
                    <option value="Wax Seal Intact">Wax Seal Intact</option>
                    <option value="Minor Cracking / Aged">Minor Cracking / Aged</option>
                    <option value="Seal Damaged">Seal Damaged</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="relative z-0 w-full group">
                  <input 
                    type="text" 
                    name="condition" 
                    id="condition"
                    value={formData.condition} 
                    onChange={e => setFormData({...formData, condition: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                    required 
                  />
                  <label 
                    htmlFor="condition" 
                    className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    Condition Summary *
                  </label>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="text" 
                    name="provenance" 
                    id="provenance"
                    value={formData.provenance} 
                    onChange={e => setFormData({...formData, provenance: e.target.value})} 
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                    required 
                  />
                  <label 
                    htmlFor="provenance" 
                    className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    Provenance & Cellar History *
                  </label>
                </div>
              </div>
            </div>

            {/* Financials & Valuation */}
            <div className="space-y-10 pt-6">
              <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                <Package size={24} className="text-[#e1bd70]" />
                Financials & Reserve
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="relative z-0 w-full group">
                  <input 
                    type="number" 
                    name="startingBid" 
                    id="startingBid"
                    value={formData.startingBid} 
                    onChange={e => setFormData({...formData, startingBid: e.target.value})} 
                    min="0"
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                    required 
                  />
                  <label 
                    htmlFor="startingBid" 
                    className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    Starting Bid (ZAR) *
                  </label>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="number" 
                    name="reservePrice" 
                    id="reservePrice"
                    value={formData.reservePrice} 
                    onChange={e => setFormData({...formData, reservePrice: e.target.value})} 
                    min="0"
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                    required 
                  />
                  <label 
                    htmlFor="reservePrice" 
                    className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    Reserve Price (ZAR) *
                  </label>
                  <p className="text-[10px] tracking-widest uppercase text-[#e1bd70] mt-3 font-light absolute -bottom-6">Lot will not be sold below this price.</p>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="number" 
                    value={formData.estimatedValueMin} 
                    onChange={e => setFormData({...formData, estimatedValueMin: e.target.value})} 
                    min="0"
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                  />
                  <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-[#e1bd70]">
                    Estimated Low Valuation (ZAR)
                  </label>
                </div>

                <div className="relative z-0 w-full group">
                  <input 
                    type="number" 
                    value={formData.estimatedValueMax} 
                    onChange={e => setFormData({...formData, estimatedValueMax: e.target.value})} 
                    min="0"
                    className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                    placeholder=" " 
                  />
                  <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-[#e1bd70]">
                    Estimated High Valuation (ZAR)
                  </label>
                </div>
              </div>
            </div>

            {/* Auction Schedule */}
            <div className="space-y-10 pt-6">
              <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                <CheckCircle2 size={24} className="text-[#e1bd70]" />
                Schedule
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="w-full group">
                  <label 
                    htmlFor="startDate" 
                    className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3"
                  >
                    Start Date/Time *
                  </label>
                  <input 
                    type="datetime-local" 
                    name="startDate" 
                    id="startDate"
                    value={formData.startDate} 
                    min={toDatetimeLocal(new Date())}
                    onChange={e => setFormData({
                      ...formData,
                      startDate: e.target.value,
                      endDate: formData.endDate && new Date(formData.endDate) <= new Date(e.target.value) ? '' : formData.endDate,
                    })}
                    className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors [color-scheme:dark]" 
                    required 
                  />
                </div>

                <div className="w-full group">
                  <label 
                    htmlFor="endDate" 
                    className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3"
                  >
                    End Date/Time *
                  </label>
                  <input 
                    type="datetime-local" 
                    name="endDate" 
                    id="endDate"
                    value={formData.endDate} 
                    min={formData.startDate || toDatetimeLocal(new Date())}
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors [color-scheme:dark]" 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit" 
                disabled={submitting} 
                className="bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-sm px-10 py-4 rounded-full transition-all disabled:opacity-50 inline-flex items-center justify-center gap-3 cursor-pointer hover:brightness-110"
              >
                {submitting ? 'Submitting...' : <><CheckCircle2 size={20} /> Submit to Admin for Review</>}
              </button>
            </div>
          </form>
        )}

        {/* Lightbox / Fullscreen Media Preview Modal */}
        {previewModalItem && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setPreviewModalItem(null)}
          >
            <div 
              className="relative max-w-4xl w-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Eye size={16} className="text-[#e1bd70] shrink-0" />
                  <span className="text-sm font-semibold text-white truncate">
                    {previewModalItem.title}
                  </span>
                  {previewModalItem.size && (
                    <span className="text-xs text-white/40 font-mono shrink-0">
                      ({previewModalItem.size} MB)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalItem(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Media Body */}
              <div className="p-4 flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-hidden bg-black/40">
                {previewModalItem.type === 'video' ? (
                  <video
                    src={previewModalItem.url}
                    controls
                    autoPlay
                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-xl"
                  />
                ) : (
                  <img
                    src={previewModalItem.url}
                    alt={previewModalItem.title}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-xl"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
