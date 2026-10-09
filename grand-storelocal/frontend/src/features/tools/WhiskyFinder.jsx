import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import ProductCard from '../../components/ProductCard';
import SEO from '../../components/SEO';
import { RotateCcw, GlassWater, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import DynamicIcon from '../../components/DynamicIcon';
import api from '../../api';

const DEFAULT_KEYWORDS = {
  smoky: ['Peat', 'Smoky', 'Islay', 'Lagavulin', 'Laphroaig', 'Smoke', 'Talisker', 'Ardbeg', 'Bowmore'],
  rich: ['Sherry', 'Rich', 'Dark Chocolate', 'Macallan', 'Fruitcake', 'Spice', 'GlenDronach', 'Balvenie'],
  light: ['Light', 'Floral', 'Lowland', 'Delicate', 'Vanilla', 'Citrus', 'Glenkinchie', 'Auchentoshan'],
  fruity: ['Fruity', 'Spicy', 'Speyside', 'Highland', 'Apple', 'Honey', 'Glenfiddich', 'Glenlivet']
};

const FLAVOR_SEO_DATA = {
  smoky: {
    title: 'Best Smoky & Peated Whiskies in South Africa | The Grand Store',
    description: 'Explore intense peat-smoke, maritime brine, and campfire character from iconic Islay and Scottish island distilleries.',
    advice: 'Peated whiskies are dried over burning peat fires, infusing phenolic, medicinal, and maritime campfire smoke. Best enjoyed neat or with a few drops of spring water.'
  },
  rich: {
    title: 'Best Rich & Sherried Single Malt Whiskies | The Grand Store',
    description: 'Discover full-bodied whiskies matured in Spanish Oloroso and Pedro Ximénez sherry casks, offering dried fruits, spices, and chocolate.',
    advice: 'European oak sherry-cask aging delivers decadent layers of raisins, sultanas, cinnamon spice, and dark cacao with a velvety, mouth-coating finish.'
  },
  light: {
    title: 'Best Light, Floral & Delicate Whiskies | The Grand Store',
    description: 'Find approachable, floral, and citrus-forward single malts and grain whiskies ideal for aperitifs or daytime sipping.',
    advice: 'Light, unpeated Lowland and delicate Highland expressions highlight crisp green apples, honeysuckle, and gentle vanilla bean notes.'
  },
  fruity: {
    title: 'Best Fruity & Orchard Single Malts | The Grand Store',
    description: 'Browse sweet, honeyed whiskies brimming with fresh orchard fruits, ripe pear, tropical pineapple, and creamy vanilla.',
    advice: 'Ex-bourbon barrel maturation in American oak lends sweet lactones, golden honey, and ripe stone fruit aromatics that make for an enticing dram.'
  }
};

export default function WhiskyFinder({ onAdd, onWish, onCompare, compareItems = [] }) {
  const navigate = useNavigate();
  const { flavorProfile } = useParams();
  const { products } = useProducts();
  const [selectedProfile, setSelectedProfile] = useState(flavorProfile || null);
  const [flavorProfiles, setFlavorProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL parameter for deep-linking
  useEffect(() => {
    if (flavorProfile) {
      setSelectedProfile(flavorProfile);
    } else {
      setSelectedProfile(null);
    }
  }, [flavorProfile]);

  useEffect(() => {
    const fetchFlavors = async () => {
      try {
        const res = await api.get(`/attributes`);
        const data = res.data;
        if (Array.isArray(data)) {
          const flavors = data.filter(a => a.type === 'flavor').map(p => ({
            id: p.value,
            label: p.name,
            iconName: p.icon,
            keywords: DEFAULT_KEYWORDS[p.value] || [p.name, 'Whisky']
          }));
          setFlavorProfiles(flavors);
        }
      } catch (error) {
        console.error('Failed to fetch flavors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFlavors();
  }, []);

  const currentProfileInfo = useMemo(() => {
    if (!selectedProfile) return null;
    return flavorProfiles.find(p => p.id === selectedProfile) || {
      id: selectedProfile,
      label: selectedProfile.charAt(0).toUpperCase() + selectedProfile.slice(1),
      keywords: DEFAULT_KEYWORDS[selectedProfile] || ['Whisky']
    };
  }, [selectedProfile, flavorProfiles]);
  
  const recommendedWhiskies = useMemo(() => {
    if (!selectedProfile || !products) return [];
    const profileKeywords = currentProfileInfo?.keywords || DEFAULT_KEYWORDS[selectedProfile] || ['Whisky'];

    return products.filter(product => {
      // Check explicit flavor profile first
      if (product.flavorProfile && product.flavorProfile.length > 0) {
        return product.flavorProfile.includes(selectedProfile);
      }

      // Fallback: Must be a whisky/whiskey for dynamic keyword matching
      const isWhisky = (product.category || '').toLowerCase().includes('whisky') || 
                       (product.category || '').toLowerCase().includes('whiskey') ||
                       (product.subcategory || '').toLowerCase().includes('whisky') ||
                       (product.type || '').toLowerCase().includes('whisky');
                       
      if (!isWhisky) return false;

      // Dynamic string matching
      const searchableText = `${product.name} ${product.description || ''} ${product.subcategory || ''} ${product.type || ''} ${product.brand || ''}`.toLowerCase();
      
      return profileKeywords.some(keyword => searchableText.includes(keyword.toLowerCase()));
    }).slice(0, 8);
  }, [selectedProfile, products, currentProfileInfo]);

  // Dynamic SEO metadata
  const seoConfig = useMemo(() => {
    if (selectedProfile && FLAVOR_SEO_DATA[selectedProfile]) {
      return {
        title: FLAVOR_SEO_DATA[selectedProfile].title,
        description: FLAVOR_SEO_DATA[selectedProfile].description,
        url: `/tools/whisky-finder/${selectedProfile}`
      };
    }
    return {
      title: 'Whisky Finder | Discover Your Signature Single Malt & Blend | The Grand Store',
      description: 'Discover your perfect dram. Select your preferred flavor profile and our dynamic engine will match you with the finest whiskies in our collection.',
      url: '/tools/whisky-finder'
    };
  }, [selectedProfile]);

  const jsonLdSchema = useMemo(() => {
    if (!selectedProfile || !recommendedWhiskies.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: seoConfig.title,
      description: seoConfig.description,
      numberOfItems: recommendedWhiskies.length,
      itemListElement: recommendedWhiskies.map((prod, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: prod.name,
        url: `https://grandstore.co.za/product/${prod.slug || prod.id}`
      }))
    };
  }, [selectedProfile, recommendedWhiskies, seoConfig]);

  const handleSelectProfile = (profileId) => {
    navigate(`/tools/whisky-finder/${profileId}`);
  };

  const handleReset = () => {
    navigate('/tools/whisky-finder');
  };

  return (
    <div className="min-h-screen bg-[#0a0907] text-white pt-24 pb-20">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        url={seoConfig.url}
        schema={jsonLdSchema}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8b76d]/10 border border-[#d8b76d]/20 text-[#d8b76d] text-xs font-semibold tracking-wider uppercase mb-3">
            <Sparkles size={14} /> Master of Malt Assistant
          </div>
          <h1 className="text-3xl md:text-5xl font-serif text-[#d8b76d] mb-4">Whisky Finder</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
            Discover your perfect dram. Select your preferred flavor profile and our dynamic engine will match you with the finest whiskies in our collection.
          </p>
        </div>

        {/* Step 1: Select Flavor Profile */}
        {!selectedProfile ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both">
            <h2 className="text-2xl font-serif text-center mb-8">What flavor profile do you prefer?</h2>
            
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-[#d8b76d] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {flavorProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                    className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#1a1714] to-[#0f0e0c] border border-white/5 rounded-2xl overflow-hidden hover:border-[#d8b76d]/50 transition-all duration-500 group shadow-lg hover:shadow-[#d8b76d]/20 hover:-translate-y-2 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#d8b76d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#1a1714] to-[#2a261f] border border-white/5 group-hover:border-[#d8b76d]/30 flex items-center justify-center mb-6 transition-all duration-500 shadow-inner group-hover:scale-110">
                      <DynamicIcon name={profile.iconName} className="w-10 h-10 text-white group-hover:text-[#d8b76d] filter drop-shadow-lg group-hover:drop-shadow-[0_0_15px_rgba(216,183,109,0.5)] transition-all duration-500" />
                    </div>
                    
                    <span className="relative font-serif text-xl text-[#eee8dd] text-center mb-3 group-hover:text-[#d8b76d] transition-colors duration-300">
                      {profile.label}
                    </span>
                    
                    <span className="relative text-[10px] uppercase tracking-widest text-gray-500 text-center group-hover:text-gray-300 transition-colors duration-300">
                      {profile.keywords.slice(0, 3).join(' • ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Recommendations with Deep-Linked SEO Content */
          <div className="animate-in fade-in slide-in-from-left-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-6 border-b border-[#2a261f] gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">
                  Our {currentProfileInfo?.label || selectedProfile} Selections
                </h2>
                <p className="text-gray-400 text-sm">
                  Dynamically matched to your sensory preferences.
                </p>
              </div>
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#d8b76d] border border-[#d8b76d] rounded-lg hover:bg-[#d8b76d] hover:text-black transition-all cursor-pointer font-medium"
              >
                <RotateCcw size={16} /> Choose Different Profile
              </button>
            </div>

            {/* Editorial Flavor Profile Guidance Box */}
            {FLAVOR_SEO_DATA[selectedProfile]?.advice && (
              <div className="bg-[#181512] border border-[#d8b76d]/20 rounded-xl p-5 md:p-6 mb-8 flex items-start gap-3">
                <BookOpen size={20} className="text-[#d8b76d] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#d8b76d] font-bold mb-1">
                    Tasting & Character Notes
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {FLAVOR_SEO_DATA[selectedProfile].advice}
                  </p>
                </div>
              </div>
            )}

            {recommendedWhiskies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recommendedWhiskies.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                    onAdd={onAdd}
                    onWish={onWish}
                    onCompare={onCompare}
                    isCompared={compareItems?.some(item => (item.id || item._id) === (product.id || product._id))}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#151310] rounded-xl border border-[#2a261f]">
                <GlassWater size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-serif text-gray-300 mb-2">No exact matches found</h3>
                <p className="text-gray-500 mb-6">We couldn't find a direct match in our current inventory.</p>
                <button 
                  onClick={() => navigate('/shop')}
                  className="inline-flex items-center gap-2 text-[#d8b76d] hover:text-white transition-colors cursor-pointer text-sm font-semibold"
                >
                  Browse all whiskies <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
