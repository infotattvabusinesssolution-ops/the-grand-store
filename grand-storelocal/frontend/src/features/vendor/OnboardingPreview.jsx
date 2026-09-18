import Price from '../../components/ui/Price';
import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, ChevronRight, PlayCircle, Store, Globe } from 'lucide-react';

export default function OnboardingPreview({ onNext, onBack }) {
  const [previewData, setPreviewData] = useState({
    businessName: '',
    logoUrl: null,
    productName: '',
    productPrice: ''
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewData(prev => ({ ...prev, logoUrl: url }));
    }
  };

  const hasData = previewData.businessName || previewData.productName || previewData.logoUrl;

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col lg:flex-row fade-in h-screen w-screen overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#c9a35b]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#c9a35b]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Left Side: Input Form Sidebar */}
      <div className="w-full lg:w-[420px] flex flex-col bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/5 p-8 overflow-y-auto shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.8)] z-10 relative">
        <div className="mb-12">
          <p className="text-gold-gradient text-xs uppercase tracking-[0.2em] font-bold mb-3">Partnership Journey</p>
          <h1 className="text-4xl font-serif text-white mb-4 leading-tight">Design Your<br/>Grand Store</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">Enter your estate details below to instantly generate a live mock-up of your premium storefront.</p>
        </div>

        <div className="flex flex-col gap-8 flex-1">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-3">Estate Name</label>
            <input 
              type="text" 
              placeholder="e.g. ABC Wine Estate"
              className="w-full bg-black/50 border border-white/10 rounded-none px-4 py-4 text-white focus:outline-none focus:border-[#c9a35b] transition-colors font-serif"
              value={previewData.businessName}
              onChange={(e) => setPreviewData(prev => ({ ...prev, businessName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-3">Brand Identity</label>
            <div className="border border-dashed border-white/20 bg-white/5 rounded-none p-8 text-center hover:border-[#c9a35b]/50 hover:bg-[#c9a35b]/5 transition-all cursor-pointer relative group">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" onChange={handleLogoUpload} />
              {previewData.logoUrl ? (
                <div className="flex flex-col items-center">
                  <img src={previewData.logoUrl} alt="Logo preview" className="h-16 object-contain mb-3" />
                  <span className="text-xs text-gold-gradient uppercase tracking-widest font-bold">Replace Logo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="text-neutral-500 mb-3 group-hover:text-gold-gradient transition-colors" size={28} />
                  <span className="text-xs text-neutral-400 uppercase tracking-widest group-hover:text-gold-gradient transition-colors">Upload Emblem</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <h3 className="text-gold-gradient text-xs uppercase tracking-widest font-bold mb-6">Showcase a Product</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Cuvee / Product Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Reserve Cabernet Sauvignon 2020"
                  className="w-full bg-black/50 border border-white/10 rounded-none px-4 py-3 text-white focus:outline-none focus:border-[#c9a35b] font-serif"
                  value={previewData.productName}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, productName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Price (ZAR)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 295"
                  className="w-full bg-black/50 border border-white/10 rounded-none px-4 py-3 text-white focus:outline-none focus:border-[#c9a35b] font-serif"
                  value={previewData.productPrice}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, productPrice: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 flex flex-col gap-4 border-t border-white/5 sticky bottom-0 bg-[#0a0a0a]/90 backdrop-blur-md pb-4 z-20">
            <button 
              onClick={onNext}
              className="w-full bg-[#c9a35b] text-black px-6 py-4 rounded-none font-bold uppercase tracking-widest text-xs transition-all hover:brightness-110 shadow-[0_0_20px_rgba(201,163,91,0.2)] flex items-center justify-center space-x-2"
            >
              <span>Begin Registration</span>
              <ChevronRight size={16} />
            </button>
            <button onClick={onBack} className="text-neutral-500 hover:text-white px-4 py-2 text-xs uppercase tracking-widest transition-colors text-center w-full">
              Return
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Ultra Premium Live Preview */}
      <div className="flex-1 bg-transparent flex flex-col relative h-full overflow-hidden">
          {/* Browser header mock */}
          <div className="bg-[#050505] border-b border-white/5 px-6 py-4 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
            </div>
            <div className="bg-white/5 rounded text-[10px] text-neutral-500 px-32 py-1.5 font-mono tracking-widest flex items-center gap-2 border border-white/5">
              <Globe size={10} className="text-gold-gradient"/>
              grandstore.co.za/boutique/{previewData.businessName ? previewData.businessName.toLowerCase().replace(/\s+/g, '-') : 'estate'}
            </div>
            <div className="w-8"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-transparent relative custom-scrollbar">
            {!hasData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-700">
                <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center mb-6">
                  <Store size={32} className="opacity-30" />
                </div>
                <p className="text-sm font-light tracking-widest uppercase">Awaiting your vision</p>
              </div>
            ) : (
              <div className="fade-in animate-in pb-24">
                
                {/* Hero Banner Mock */}
                <div className="h-[40vh] relative bg-black overflow-hidden border-b border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent z-10"></div>
                  {/* Subtle luxury pattern / noise */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#c9a35b]/30 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
                </div>

                {/* Profile Section */}
                <div className="px-12 lg:px-24 -mt-28 relative z-20 max-w-6xl mx-auto">
                  
                  <div className="flex flex-col items-center mb-16 text-center">
                    <div className="w-40 h-40 bg-[#0a0a0a] border border-[#c9a35b]/30 flex items-center justify-center overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] mb-8 p-1 relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#c9a35b]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {previewData.logoUrl ? (
                        <img src={previewData.logoUrl} alt="Logo" className="w-full h-full object-contain bg-white" />
                      ) : (
                        <span className="text-6xl text-gold-gradient font-serif font-light">{previewData.businessName ? previewData.businessName.charAt(0).toUpperCase() : 'A'}</span>
                      )}
                    </div>
                    
                    <h2 className="text-5xl font-serif text-white mb-4 tracking-wide">{previewData.businessName || 'Your Brand Name'}</h2>
                    
                    <div className="flex items-center gap-3 justify-center">
                      <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c9a35b]/50"></span>
                      <span className="text-gold-gradient text-[10px] uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                        <CheckCircle2 size={12} /> Grand Store Exclusive Partner
                      </span>
                      <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c9a35b]/50"></span>
                    </div>
                  </div>

                  {/* Navigation Mock */}
                  <div className="flex justify-center gap-12 border-b border-white/5 mb-16">
                    <div className="text-gold-gradient border-b border-[#c9a35b] pb-4 text-xs uppercase tracking-[0.2em] font-bold">The Collection</div>
                    <div className="text-neutral-500 hover:text-white pb-4 text-xs uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer">Heritage</div>
                    <div className="text-neutral-500 hover:text-white pb-4 text-xs uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer">Terroir</div>
                  </div>

                  {/* Product Grid Mock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    
                    {/* The mock product they entered */}
                    <div className="bg-white/[0.02] border border-white/5 hover:border-[#c9a35b]/30 transition-all duration-500 group cursor-pointer flex flex-col h-[500px]">
                      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                        {/* Glow behind bottle */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#c9a35b]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                         {/* High-end dummy bottle shape */}
                        <div className="w-16 h-56 relative z-10 drop-shadow-2xl group-hover:-translate-y-2 transition-transform duration-500">
                          {/* Bottle Neck */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-16 bg-gradient-to-r from-[#111] via-[#333] to-[#111] rounded-t-sm">
                            <div className="absolute top-1 w-full h-6 bg-red-900/40"></div>
                          </div>
                          {/* Bottle Shoulders & Body */}
                          <div className="absolute top-16 left-0 w-full h-40 bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] rounded-t-xl rounded-b-md shadow-[inset_-2px_0_10px_rgba(255,255,255,0.1)]">
                            {/* Label */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-20 bg-[#f5f5f0] shadow-md flex flex-col items-center p-1 border-b border-t border-[#d4d4d0]">
                              {previewData.logoUrl && <img src={previewData.logoUrl} className="w-8 h-8 object-contain mb-1" alt=""/>}
                              <div className="w-8 h-[1px] bg-black/20 mb-1"></div>
                              <div className="w-6 h-[1px] bg-black/10"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 text-center bg-black/40 backdrop-blur-md border-t border-white/5">
                        <p className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] mb-3">{previewData.businessName || 'Estate'}</p>
                        <h3 className="text-white text-lg font-serif mb-4 group-hover:text-gold-gradient transition-colors">{previewData.productName || 'Signature Collection'}</h3>
                        <p className="text-gold-gradient font-mono text-lg tracking-wider"><Price amount={previewData.productPrice || '1,250'} /></p>
                      </div>
                    </div>

                    {/* Dummy product 2 */}
                    <div className="bg-white/[0.01] border border-white/[0.02] flex flex-col h-[500px] opacity-30 grayscale pointer-events-none">
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="w-16 h-56 relative">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-16 bg-neutral-800 rounded-t-sm"></div>
                          <div className="absolute top-16 left-0 w-full h-40 bg-neutral-900 rounded-t-xl rounded-b-md">
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-20 bg-neutral-800"></div>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col items-center bg-black/20 border-t border-white/5">
                        <div className="h-1.5 w-16 bg-neutral-800 mb-4"></div>
                        <div className="h-3 w-40 bg-neutral-700 mb-6"></div>
                        <div className="h-4 w-24 bg-neutral-800"></div>
                      </div>
                    </div>

                     {/* Dummy product 3 */}
                     <div className="bg-white/[0.01] border border-white/[0.02] flex flex-col h-[500px] opacity-30 grayscale pointer-events-none">
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="w-16 h-56 relative">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-16 bg-neutral-800 rounded-t-sm"></div>
                          <div className="absolute top-16 left-0 w-full h-40 bg-neutral-900 rounded-t-xl rounded-b-md">
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-20 bg-neutral-800"></div>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col items-center bg-black/20 border-t border-white/5">
                        <div className="h-1.5 w-16 bg-neutral-800 mb-4"></div>
                        <div className="h-3 w-40 bg-neutral-700 mb-6"></div>
                        <div className="h-4 w-24 bg-neutral-800"></div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
    </div>
  );
}
