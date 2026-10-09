import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { Store, MapPin, CheckCircle, Search, ShieldCheck, X } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

export default function StoreFront() {
  const { storeId } = useParams();
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/shop/stores/${storeId}`);
        setStoreData(res.data.storeData);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Failed to fetch store details:', err);
        setStoreData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  // Derive unique categories present in the products collection
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Filter products by category and search term
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCat = selectedCategory === 'All' || product.category === selectedCategory;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term || (
        (product.name && product.name.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term)) ||
        (product.category && product.category.toLowerCase().includes(term)) ||
        (product.subcategory && product.subcategory.toLowerCase().includes(term))
      );
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

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

  const isFlagship = storeData.type === 'flagship' || storeData.type === 'Flagship House' || storeData._id === 'admin';
  const storeTypeLabel = isFlagship
    ? 'Flagship House'
    : storeData.type === 'local'
      ? 'Local Vendor'
      : 'International Vendor';

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--color-ivory)] font-sans">
      
      {/* --- BANNER --- */}
      <div className="w-full h-44 sm:h-56 md:h-64 lg:h-[300px] relative bg-[#111] overflow-hidden">
        <img 
          src={storeData.bannerUrl || '/assets/grand-store-whisky-banner.jpg'} 
          alt="Store Banner" 
          onError={(e) => {
            e.currentTarget.src = '/assets/grand-store-whisky-banner.jpg';
          }}
          className="w-full h-full object-cover brightness-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90" />
      </div>

      {/* --- STORE DETAILS PROFILE --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-start gap-6 -mt-20 md:-mt-24 relative z-10 mb-10">
          
          {/* Overlapping Logo */}
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-2xl md:rounded-full border-[4px] md:border-[6px] border-[#050505] bg-[#0c0c0c] overflow-hidden shrink-0 shadow-2xl flex items-center justify-center p-2">
            <img 
              src={storeData.logoUrl || '/grand-store-logo.png'} 
              alt="Store Logo" 
              onError={(e) => {
                e.currentTarget.src = '/grand-store-logo.png';
              }}
              className="w-full h-full object-contain" 
            />
          </div>
          
          {/* Details */}
          <div className="pt-2 md:pt-24 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-white tracking-wide">
                {storeData.businessName}
              </h1>
              {storeData.isVerified && (
                <span className="inline-flex items-center gap-1 bg-[#c9a35b]/10 border border-[#c9a35b]/40 text-[#c9a35b] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <CheckCircle size={14} /> Verified Store
                </span>
              )}
              {isFlagship && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-600/20 to-yellow-500/20 border border-yellow-500/30 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck size={14} /> Official Flagship
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/60 mb-5">
              <span className="flex items-center gap-1.5"><MapPin size={15} className="text-[#c9a35b]" /> {storeData.country}</span>
              <span className="flex items-center gap-1.5"><Store size={15} className="text-[#c9a35b]" /> {storeTypeLabel}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/70">{products.length} Products in Vault</span>
            </div>
            
            {storeData.story && (
              <div className="max-w-4xl">
                <p className="text-white/75 leading-relaxed font-light text-sm md:text-base border-l-2 border-[#c9a35b]/40 pl-4 py-1">
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
          
          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-white tracking-wide">Curated Collection</h2>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                Showing {filteredProducts.length} of {products.length} allocated bottles & spirits
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-[#111] border border-white/10 rounded-full px-4 py-2 w-full md:w-80 focus-within:border-[#c9a35b]/60 transition-colors">
              <Search size={16} className="text-white/40 shrink-0" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, brand, category..." 
                className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 w-full focus:ring-0" 
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-white/40 hover:text-white p-0.5">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-white/10">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-[#c9a35b] text-black font-semibold shadow-md shadow-[#c9a35b]/20'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          
          {/* Empty State */}
          {filteredProducts.length === 0 && (
             <div className="py-24 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
               <Store size={40} className="mx-auto text-white/20 mb-4" />
               <h3 className="text-white/60 mb-2 font-serif text-xl">No matching products found</h3>
               <p className="text-white/40 text-sm mb-4">
                 {searchTerm ? `No results matching "${searchTerm}"` : 'No products available in this category.'}
               </p>
               {(searchTerm || selectedCategory !== 'All') && (
                 <button 
                   onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                   className="text-xs uppercase tracking-widest text-[#c9a35b] hover:underline"
                 >
                   Clear filters
                 </button>
               )}
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
