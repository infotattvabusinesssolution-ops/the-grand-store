import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Filter, Search, X, Wine } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import ProductCard from '../../components/ProductCard';
import SEO from '../../components/SEO';

const countryDetails = {
  france: {
    name: 'France',
    desc: 'The benchmark for fine wine. From the structured elegance of Bordeaux and the Rhône Valley to the honeyed complexity of Sauternes.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop'
  },
  italy: {
    name: 'Italy',
    desc: 'A tapestry of ancient terroirs and indigenous grapes, producing some of the world’s most food-friendly, prestigious, and diverse wines.',
    image: 'https://i.pinimg.com/1200x/40/1d/84/401d84d477523012fa2eec4b0ca1b7b2.jpg'
  },
  spain: {
    name: 'Spain',
    desc: 'Tradition meets innovation. Discover the bold reds of Ribera del Duero and the classic oak-aged expressions of Rioja.',
    image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=2070&auto=format&fit=crop'
  },
  australia: {
    name: 'Australia',
    desc: 'Bold, expressive, and unconstrained by tradition. Home to some of the world’s most powerful Shiraz and refined Cabernet.',
    image: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?q=80&w=2071&auto=format&fit=crop'
  },
  'south africa': {
    name: 'South Africa',
    desc: 'A beautiful collision of Old World elegance and New World fruit. Celebrated for distinctive Chenin Blanc, bold Pinotage, and Bordeaux-style blends.',
    image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661480/grand-store/global-wines/zzksu1ceacegz0hflvrq.png'
  },
  'united states': {
    name: 'United States',
    desc: 'Home to the iconic Napa Valley and Sonoma Coast. World-renowned for powerful Cabernet Sauvignon, elegant Pinot Noir, and boutique cult producers.',
    image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661481/grand-store/global-wines/txfvlktfshwo2ytuhsit.png'
  },
  usa: {
    name: 'United States',
    desc: 'Home to the iconic Napa Valley and Sonoma Coast. World-renowned for powerful Cabernet Sauvignon, elegant Pinot Noir, and boutique cult producers.',
    image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661481/grand-store/global-wines/txfvlktfshwo2ytuhsit.png'
  },
  argentina: {
    name: 'Argentina',
    desc: 'High-altitude vineyards producing the world\'s definitive Malbecs, characterized by deep violet color, rich dark fruit, and velvety tannins.',
    image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661484/grand-store/global-wines/chxw3iubgaud4xlzflvi.png'
  },
  chile: {
    name: 'Chile',
    desc: 'A viticultural paradise isolated by the Andes and the Pacific, known for exceptional Carmenère, Cabernet, and crisp coastal whites.',
    image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661485/grand-store/global-wines/shsu9rdog5tqmp1apldm.png'
  },
  'new zealand': {
    name: 'New Zealand',
    desc: 'Cool-climate precision at its finest. Famous globally for vibrant Sauvignon Blanc and exceptionally elegant Central Otago Pinot Noir.',
    image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1787661482/grand-store/global-wines/lid2udfdfob8mm5462r2.png'
  },
  germany: {
    name: 'Germany',
    desc: 'Steep riverbank vineyards along the Mosel and Rhine, crafting the world’s most pristine, mineral-driven Rieslings.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  portugal: {
    name: 'Portugal',
    desc: 'Centuries of winemaking mastery from the terraced slopes of the Douro Valley to legendary aged Ports.',
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2070&auto=format&fit=crop'
  },
  canada: {
    name: 'Canada',
    desc: 'Famous for world-class Icewine from Niagara and Okanagan, with exquisite balance of sweetness and vibrant natural acidity.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  }
};

// Normalize country names and aliases
const normalizeCountryKey = (val = '') => {
  const str = decodeURIComponent(val).toLowerCase().replace(/-/g, ' ').trim();
  if (['usa', 'united states', 'us', 'america', 'u.s.a.', 'u.s.'].includes(str)) return 'usa';
  if (['south africa', 'za', 'rsa'].includes(str)) return 'south africa';
  if (['new zealand', 'nz'].includes(str)) return 'new zealand';
  return str;
};

// Check if a product is strictly a Wine product
const isStrictlyWine = (product) => {
  if (!product) return false;
  const category = (product.category || '').toLowerCase().trim();
  const type = (product.type || '').toLowerCase().trim();
  
  // Must be categorized as Wine (exclude Champagne, Cognac, Liqueurs, Spirits, Beer, Gin, Vodka, etc.)
  return category === 'wine' || type === 'wine';
};

// Check if product belongs to the requested country
const matchesCountry = (productCountry = '', targetCountryKey = '') => {
  if (!productCountry) return false;
  const pNorm = normalizeCountryKey(productCountry);
  const targetNorm = normalizeCountryKey(targetCountryKey);
  return pNorm === targetNorm;
};

export default function CountryPavilionPage({ onAdd, onWish, onCompare, compareItems = [] }) {
  const { country } = useParams();
  const { products } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [showSearch, setShowSearch] = useState(false);

  const cleanCountryKey = normalizeCountryKey(country || '');
  const details = countryDetails[cleanCountryKey] || countryDetails[country?.toLowerCase()] || {
    name: country ? country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ') : 'International',
    desc: 'Discover exceptional international wines from this prestigious wine region.',
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2070&auto=format&fit=crop'
  };

  // Strictly filter: ONLY WINE AND ONLY THE SPECIFIED COUNTRY
  const countryWines = useMemo(() => {
    return products.filter((p) => isStrictlyWine(p) && matchesCountry(p.country, country));
  }, [products, country]);

  // Extract unique subcategories/varietals for the filter tabs
  const subcategories = useMemo(() => {
    const subs = new Set();
    countryWines.forEach((p) => {
      if (p.subcategory && p.subcategory.trim()) {
        subs.add(p.subcategory.trim());
      }
    });
    return Array.from(subs);
  }, [countryWines]);

  // Apply optional search query and subcategory filter
  const displayedWines = useMemo(() => {
    return countryWines.filter((p) => {
      // Subcategory filter
      if (selectedSubcategory !== 'all' && p.subcategory !== selectedSubcategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(query);
        const matchBrand = (p.brand || '').toLowerCase().includes(query);
        const matchSub = (p.subcategory || '').toLowerCase().includes(query);
        const matchDesc = (p.description || '').toLowerCase().includes(query);
        return matchName || matchBrand || matchSub || matchDesc;
      }
      return true;
    });
  }, [countryWines, selectedSubcategory, searchQuery]);

  useEffect(() => {
    // Auto-scroll directly to products after rendering
    const timer = setTimeout(() => {
      const el = document.getElementById('products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [country]);

  const countrySchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `https://grandstoreglobal.com/global-wines/${cleanCountryKey}#webpage`,
        url: `https://grandstoreglobal.com/global-wines/${cleanCountryKey}`,
        name: `Wines of ${details.name} | Fine Wine Pavilion | The Grand Store`,
        description: details.desc,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: displayedWines.slice(0, 12).map((wine, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `https://grandstoreglobal.com/product/${wine.slug || wine._id || wine.id}`,
            name: wine.name
          }))
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://grandstoreglobal.com'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Global Wine Pavilions',
            item: 'https://grandstoreglobal.com/global-wines'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: details.name,
            item: `https://grandstoreglobal.com/global-wines/${cleanCountryKey}`
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0a0907] pb-20 relative overflow-hidden">
      <SEO
        title={`Wines of ${details.name} | Luxury Wine Pavilion | The Grand Store`}
        description={details.desc}
        canonical={`https://grandstoreglobal.com/global-wines/${cleanCountryKey}`}
        ogType="website"
        image={details.image}
        schema={countrySchema}
      />
      {/* Subtle golden glow background behind products */}
      <div className="absolute top-[60vh] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c9a35b]/5 via-[#0a0907]/0 to-[#0a0907]/0 pointer-events-none rounded-full blur-3xl opacity-80" />

      {/* Hero */}
      <div className="relative h-[65vh] flex items-center justify-center pt-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${details.image})` }}
        />
        {/* Seamless gradient fade to black */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#0a0907]" />

        {/* Glowing overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c9a35b]/10 via-transparent to-transparent opacity-80 mix-blend-screen" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 mt-12">
          <Link
            to="/global-wines"
            className="inline-flex items-center gap-2 text-gold-gradient hover:text-[#e1bd70] transition-colors mb-8 text-sm font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(201,163,91,0.5)]"
          >
            <ArrowLeft size={16} /> Back to Global Wines
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-gold-gradient text-sm md:text-base font-bold tracking-[0.4em] uppercase mb-4 block drop-shadow-[0_0_10px_rgba(201,163,91,0.5)]">
              Exclusive Pavilion
            </span>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif text-[#eee8dd] mb-6 md:mb-8 tracking-wide drop-shadow-2xl">
              Wines of {details.name}
            </h1>
            <p className="text-white/80 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto font-light tracking-wide px-2">
              {details.desc}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div id="products" className="max-w-7xl mx-auto px-4 mt-8 relative z-10">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-[#c9a35b]/20 pb-4 shadow-[0_4px_20px_-10px_rgba(201,163,91,0.2)] gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wine size={20} className="text-[#c9a35b]" />
              <h2 className="text-3xl font-serif text-[#eee8dd] tracking-wider">
                {details.name} Fine Wine Collection
              </h2>
            </div>
            <p className="text-gold-gradient text-xs md:text-sm mt-2 tracking-widest uppercase font-bold">
              {countryWines.length} {countryWines.length === 1 ? 'Authentic Wine' : 'Authentic Wines'} Found
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowSearch((prev) => !prev)}
              className={`flex items-center gap-2 text-xs md:text-sm px-4 py-2 rounded-full border transition-all font-bold uppercase tracking-wider ${
                showSearch || searchQuery
                  ? 'border-[#c9a35b] text-[#c9a35b] bg-[#c9a35b]/10'
                  : 'border-white/10 text-[#eee8dd] hover:border-[#c9a35b]/40'
              }`}
            >
              <Search size={14} /> Search
            </button>
          </div>
        </div>

        {/* Collapsible Search Input */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="relative max-w-xl mx-auto">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${details.name} wines by name, grape, or vintage...`}
                  className="w-full bg-[#141414] border border-white/10 rounded-full py-3 pl-11 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a35b]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subcategory / Varietal Filter Pills */}
        {subcategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedSubcategory === 'all'
                  ? 'bg-[#c9a35b] text-black shadow-[0_0_15px_rgba(201,163,91,0.4)]'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              All Styles ({countryWines.length})
            </button>
            {subcategories.map((sub) => {
              const count = countryWines.filter((w) => w.subcategory === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                    selectedSubcategory === sub
                      ? 'bg-[#c9a35b] text-black shadow-[0_0_15px_rgba(201,163,91,0.4)]'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Wine Grid */}
        {displayedWines.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayedWines.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => onAdd(product)}
                onWish={() => onWish(product)}
                onCompare={() => onCompare(product)}
                isCompared={compareItems.some((item) => item.id === product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-28 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c9a35b]/10 via-transparent to-transparent blur-2xl" />
            <Wine size={48} className="mx-auto text-[#c9a35b]/40 mb-4" />
            <h3 className="text-2xl md:text-3xl text-[#eee8dd] mb-3 font-serif relative z-10">
              {searchQuery || selectedSubcategory !== 'all'
                ? 'No matching wines found'
                : `Curating the ${details.name} Collection`}
            </h3>
            <p className="text-[#918a7f] text-base md:text-lg font-light relative z-10 max-w-md mx-auto">
              {searchQuery || selectedSubcategory !== 'all'
                ? 'Try clearing your search or filter to see all wines from this country.'
                : `We are currently sourcing exceptional vintage wines directly from estates in ${details.name}. Please check back soon.`}
            </p>
            {(searchQuery || selectedSubcategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubcategory('all');
                }}
                className="mt-6 px-6 py-2.5 rounded-full border border-[#c9a35b] text-[#c9a35b] hover:bg-[#c9a35b] hover:text-black transition-all text-xs font-bold uppercase tracking-wider"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
