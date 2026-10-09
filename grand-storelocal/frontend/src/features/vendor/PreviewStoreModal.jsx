import React, { useState } from "react";
import { Wine, X, Star, Store, MapPin } from "lucide-react";
import Price from '../../components/ui/Price';

export default function PreviewStoreModal({ isOpen, onClose }) {
  const [storeName, setStoreName] = useState("ABC Wine Estate");
  const [productName, setProductName] = useState("Cabernet Sauvignon");
  const [productPrice, setProductPrice] = useState("295");
  const [country, setCountry] = useState("South Africa");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side: Form */}
        <div className="w-full md:w-1/3 bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl text-white font-light">Build Your Mockup</h3>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gold mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-gold outline-none"
                placeholder="e.g. Tenuta ABC"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gold mb-2">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-gold outline-none"
                placeholder="e.g. Italy"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gold mb-2">
                Signature Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-gold outline-none"
                placeholder="e.g. Chianti Classico"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gold mb-2">
                Product Price
              </label>
              <input
                type="text"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-gold outline-none"
                placeholder="e.g. 450"
              />
            </div>
          </div>

          <p className="text-xs text-white/40 italic mt-6">
            "This is what your customers will see. Grand Store creates a
            dedicated digital embassy for your brand."
          </p>
        </div>

        {/* Right Side: Preview */}
        <div className="w-full md:w-2/3 bg-[#050505] p-8 overflow-y-auto relative">
          <div className="absolute top-4 right-4 text-xs tracking-widest text-gold uppercase border border-gold/30 px-3 py-1 rounded-full">
            Live Preview
          </div>

          {/* Mock Store Header */}
          <div className="h-48 w-full bg-gradient-to-br from-gold/20 to-black rounded-xl border border-white/10 flex items-end p-6 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-24 h-24 bg-[#111] border border-gold/50 rounded-full flex items-center justify-center shadow-lg">
                <Store size={32} className="text-gold" />
              </div>
              <div>
                <h2 className="text-3xl text-white font-light tracking-wide mb-2">
                  {storeName || "Your Store Name"}
                </h2>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1 text-gold">
                    <Star size={14} fill="currentColor" /> Grand Store Verified
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {country || "Location"} Vendor
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Product Grid */}
          <h4 className="text-sm uppercase tracking-widest text-white/50 mb-4 border-b border-white/10 pb-2">
            Signature Products
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock Product 1 (Dynamic) */}
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden group hover:border-gold/50 transition-colors">
              <div className="aspect-[3/4] bg-[#1a1a1a] flex items-center justify-center p-8 relative">
                <Wine
                  size={64}
                  className="text-white/20 group-hover:text-gold/50 transition-colors"
                />
                <div className="absolute top-3 right-3 bg-gold text-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold">
                  New
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-widest text-gold mb-1">
                  {storeName || "Brand"}
                </div>
                <h5 className="text-white text-sm mb-2 line-clamp-1">
                  {productName || "Product Name"}
                </h5>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-white/80 font-mono">
                    <Price amount={productPrice || "0.00"} />
                  </span>
                  <button className="text-xs bg-white text-black px-3 py-1.5 rounded hover:bg-gold transition-colors">
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Mock Product 2 (Static Ghost) */}
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden opacity-50 grayscale">
              <div className="aspect-[3/4] bg-[#1a1a1a] flex items-center justify-center p-8">
                <Wine size={64} className="text-white/10" />
              </div>
              <div className="p-4">
                <div className="w-1/2 h-2 bg-white/10 rounded mb-2"></div>
                <div className="w-3/4 h-3 bg-white/20 rounded mb-4"></div>
                <div className="flex justify-between items-center mt-4">
                  <div className="w-1/3 h-4 bg-white/10 rounded"></div>
                  <div className="w-1/4 h-6 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>

            {/* Mock Product 3 (Static Ghost) */}
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden opacity-30 grayscale hidden lg:block">
              <div className="aspect-[3/4] bg-[#1a1a1a] flex items-center justify-center p-8">
                <Wine size={64} className="text-white/10" />
              </div>
              <div className="p-4">
                <div className="w-1/2 h-2 bg-white/10 rounded mb-2"></div>
                <div className="w-3/4 h-3 bg-white/20 rounded mb-4"></div>
                <div className="flex justify-between items-center mt-4">
                  <div className="w-1/3 h-4 bg-white/10 rounded"></div>
                  <div className="w-1/4 h-6 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
