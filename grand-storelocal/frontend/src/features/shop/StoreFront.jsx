import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { Store, MapPin, CheckCircle, Search } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

export default function StoreFront() {
  const { storeId } = useParams();
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/shop/stores/${storeId}`);
        setStoreData(res.data.storeData);
        setProducts(res.data.products);
      } catch (err) {
        console.error('Failed to fetch store details:', err);
        setStoreData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border border-[var(--color-gold)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-red-500 font-serif text-2xl tracking-widest">STORE NOT FOUND</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--color-ivory)] font-sans">
      
      {/* --- BANNER --- */}
      <div className="w-full h-40 md:h-56 lg:h-[250px] relative bg-[#111]">
        <img 
          src={storeData.bannerUrl} 
          alt="Store Banner" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* --- STORE DETAILS PROFILE --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-start gap-6 -mt-20 md:-mt-28 relative z-10 mb-10">
          
          {/* Overlapping Logo */}
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-[8px] border-[#050505] bg-black overflow-hidden shrink-0 shadow-lg">
            <img 
              src={storeData.logoUrl} 
              alt="Store Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          
          {/* Details */}
          <div className="pt-2 md:pt-28 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white">{storeData.businessName}</h1>
              {storeData.isVerified && (
                <CheckCircle size={22} className="text-[#c9a35b]" />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-[var(--color-ivory-muted)] mb-6">
              <span className="flex items-center gap-1.5"><MapPin size={16} /> {storeData.country}</span>
              <span className="flex items-center gap-1.5"><Store size={16} /> {storeData.type === 'local' ? 'Local Vendor' : 'International Vendor'}</span>
            </div>
            
            {storeData.story && (
              <div className="max-w-4xl">
                <p className="text-white/70 leading-relaxed font-light text-sm md:text-base">
                  {storeData.story}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/10 mb-8" />

        {/* --- PRODUCTS SECTION --- */}
        <div className="pb-24">
          
          {/* Tab / Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-8 text-lg font-serif">
              <button className="text-white border-b-2 border-[#c9a35b] pb-1">Collection</button>
              {/* Future tabs could go here, like "About" or "Reviews" */}
            </div>
            
            <div className="flex items-center gap-2 bg-[#111] border border-white/10 rounded-full px-4 py-2 w-full sm:w-64 focus-within:border-[#c9a35b]/50 transition-colors">
              <Search size={16} className="text-white/40" />
              <input 
                type="text" 
                placeholder="Search store..." 
                className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 w-full focus:ring-0" 
              />
            </div>
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          
          {/* Empty State */}
          {products.length === 0 && (
             <div className="py-24 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
               <Store size={40} className="mx-auto text-white/20 mb-4" />
               <h3 className="text-white/60 mb-2 font-serif text-xl">No products available</h3>
               <p className="text-white/40 text-sm">This store hasn't added any products to their collection yet.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
