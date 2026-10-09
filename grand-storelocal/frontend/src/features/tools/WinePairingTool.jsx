import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import ProductCard from '../../components/ProductCard';
import SEO from '../../components/SEO';
import { RotateCcw, Wine, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import DynamicIcon from '../../components/DynamicIcon';
import api from '../../api';

// Default keywords for standard pairings to keep the search smart
const DEFAULT_KEYWORDS = {
  beef: ['Red Wine', 'Cabernet Sauvignon', 'Shiraz', 'Pinotage', 'Merlot', 'Bordeaux'],
  seafood: ['White Wine', 'Sauvignon Blanc', 'Chardonnay', 'Chenin Blanc'],
  poultry: ['Chardonnay', 'Pinot Noir', 'White Wine', 'Rose'],
  vegetarian: ['Pinot Noir', 'Sauvignon Blanc', 'White Wine', 'Rose'],
  cheese: ['Dessert Wine', 'Port', 'Shiraz', 'Red Wine']
};

const MEAL_SEO_DATA = {
  beef: {
    title: 'Best Wine Pairings for Steak & Beef | The Grand Store',
    description: 'Discover expert wine recommendations for steak, beef, and braai. Shop premium Cabernet Sauvignon, Shiraz, and Pinotage online in South Africa.',
    advice: 'Rich, high-tannin reds like Cabernet Sauvignon, Shiraz, and Cape Pinotage cut through the dense fat and marbling of beef, elevating savory flavors.'
  },
  seafood: {
    title: 'Best Wine Pairings for Seafood & Fish | The Grand Store',
    description: 'Explore crisp, mineral-driven white wines tailored for fresh oysters, grilled prawns, line fish, and sushi with fast delivery.',
    advice: 'Zesty, mineral-forward whites like Sauvignon Blanc, unoaked Chardonnay, and Chenin Blanc complement delicate seafood textures and citrus dressings.'
  },
  poultry: {
    title: 'Best Wine Pairings for Chicken & Poultry | The Grand Store',
    description: 'Find the ultimate wine matches for roast chicken, duck, and creamy poultry recipes from top Cape vineyards.',
    advice: 'Lightly oaked Chardonnay, elegant Pinot Noir, and dry Rosé offer the gentle fruit intensity and acidity needed to balance poultry dishes.'
  },
  vegetarian: {
    title: 'Best Wine Pairings for Vegetarian & Vegan Dishes | The Grand Store',
    description: 'Fresh, aromatic wines to pair with roasted vegetables, wild mushrooms, risottos, and plant-based feasts.',
    advice: 'Herbaceous Sauvignon Blanc, earthy Pinot Noir, and vibrant Chenin Blanc beautifully harmonize with roasted root vegetables and green herbs.'
  },
  cheese: {
    title: 'Best Wine Pairings for Cheese & Charcuterie | The Grand Store',
    description: 'Curated dessert wines, vintage ports, and robust reds to complement artisanal South African cheeses and charcuterie boards.',
    advice: 'Pair aged, sharp hard cheeses with bold reds, and creamy bloomy-rind cheeses with Cap Classique or aromatic sweet dessert wines.'
  }
};

export default function WinePairingTool({ onAdd, onWish, onCompare, compareItems = [] }) {
  const navigate = useNavigate();
  const { mealType } = useParams();
  const { products } = useProducts();
  const [selectedMeal, setSelectedMeal] = useState(mealType || null);
  const [mealTypes, setMealTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL parameter for seamless deep-linking
  useEffect(() => {
    if (mealType) {
      setSelectedMeal(mealType);
    } else {
      setSelectedMeal(null);
    }
  }, [mealType]);

  useEffect(() => {
    const fetchPairings = async () => {
      try {
        const res = await api.get(`/attributes`);
        const data = res.data;
        if (Array.isArray(data)) {
          const pairings = data.filter(a => a.type === 'pairing').map(p => ({
            id: p.value,
            label: p.name,
            iconName: p.icon,
            keywords: DEFAULT_KEYWORDS[p.value] || [p.name, 'Wine'] // Fallback keywords if not standard
          }));
          setMealTypes(pairings);
        }
      } catch (error) {
        console.error('Failed to fetch pairings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPairings();
  }, []);

  const currentMealInfo = useMemo(() => {
    if (!selectedMeal) return null;
    return mealTypes.find(m => m.id === selectedMeal) || { id: selectedMeal, label: selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1), keywords: DEFAULT_KEYWORDS[selectedMeal] || ['Wine'] };
  }, [selectedMeal, mealTypes]);

  const recommendedWines = useMemo(() => {
    if (!selectedMeal || !products) return [];
    const mealKeywords = currentMealInfo?.keywords || DEFAULT_KEYWORDS[selectedMeal] || ['Wine'];

    return products.filter(product => {
      // Check explicit pairing first. If set, this overrides the type check.
      if (product.foodPairing && product.foodPairing.length > 0) {
        return product.foodPairing.includes(selectedMeal);
      }

      // Fallback: Must be a wine for dynamic keyword matching
      const isWine = product.category?.toLowerCase().includes('wine') || 
                     product.type?.toLowerCase().includes('wine') ||
                     product.subcategory?.toLowerCase().includes('wine');
                     
      if (!isWine) return false;

      // Dynamic string matching
      const searchableText = `${product.name} ${product.category} ${product.subcategory} ${product.type} ${product.description} ${product.grape || ''} ${product.varietal || ''}`.toLowerCase();
      
      // Return true if any of the keywords match
      return mealKeywords.some(keyword => searchableText.includes(keyword.toLowerCase()));
    }).slice(0, 8); // Limit to top 8 recommendations
  }, [selectedMeal, products, currentMealInfo]);

  // SEO tags depending on whether a meal is selected
  const seoConfig = useMemo(() => {
    if (selectedMeal && MEAL_SEO_DATA[selectedMeal]) {
      return {
        title: MEAL_SEO_DATA[selectedMeal].title,
        description: MEAL_SEO_DATA[selectedMeal].description,
        url: `/tools/wine-pairing/${selectedMeal}`
      };
    }
    return {
      title: 'Wine Pairing Assistant | Match Food to Fine Wines | The Grand Store',
      description: 'Find the perfect wine for your next dinner, braai, or celebration with our expert wine pairing assistant. Fast delivery across South Africa.',
      url: '/tools/wine-pairing'
    };
  }, [selectedMeal]);

  const jsonLdSchema = useMemo(() => {
    if (!selectedMeal || !recommendedWines.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: seoConfig.title,
      description: seoConfig.description,
      numberOfItems: recommendedWines.length,
      itemListElement: recommendedWines.map((prod, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: prod.name,
        url: `https://grandstore.co.za/product/${prod.slug || prod.id}`
      }))
    };
  }, [selectedMeal, recommendedWines, seoConfig]);

  const handleSelectMeal = (mealId) => {
    navigate(`/tools/wine-pairing/${mealId}`);
  };

  const handleReset = () => {
    navigate('/tools/wine-pairing');
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
            <Sparkles size={14} /> Sommelier Assistant
          </div>
          <h1 className="text-3xl md:text-5xl font-serif text-[#d8b76d] mb-4">Wine Pairing Assistant</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
            Find the perfect wine for your next meal. Our dynamic assistant matches culinary flavor profiles to our curated cellar collection.
          </p>
        </div>

        {/* Step 1: Select Meal (When no meal is chosen in URL) */}
        {!selectedMeal ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both">
            <h2 className="text-2xl font-serif text-center mb-8">What are you eating?</h2>
            
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-[#d8b76d] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                {mealTypes.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => handleSelectMeal(meal.id)}
                    className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1a1714] to-[#0f0e0c] border border-white/5 rounded-2xl overflow-hidden hover:border-[#d8b76d]/50 transition-all duration-500 group shadow-lg hover:shadow-[#d8b76d]/20 hover:-translate-y-2 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#d8b76d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#1a1714] to-[#2a261f] border border-white/5 group-hover:border-[#d8b76d]/30 flex items-center justify-center mb-4 transition-all duration-500 shadow-inner group-hover:scale-110">
                      <DynamicIcon name={meal.iconName} className="w-8 h-8 text-white group-hover:text-[#d8b76d] filter drop-shadow-lg group-hover:drop-shadow-[0_0_15px_rgba(216,183,109,0.5)] transition-all duration-500" />
                    </div>
                    
                    <span className="relative font-serif text-lg text-[#eee8dd] text-center group-hover:text-[#d8b76d] transition-colors duration-300">
                      {meal.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Recommendations with Deep-Linked SEO Content */
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-6 border-b border-[#2a261f] gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">
                  Perfect Pairings for {currentMealInfo?.label || selectedMeal}
                </h2>
                <p className="text-gray-400 text-sm">
                  Dynamically selected from our active cellar collection.
                </p>
              </div>
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#d8b76d] border border-[#d8b76d] rounded-lg hover:bg-[#d8b76d] hover:text-black transition-all cursor-pointer font-medium"
              >
                <RotateCcw size={16} /> Choose Different Meal
              </button>
            </div>

            {/* Editorial Pairing Guidance Box */}
            {MEAL_SEO_DATA[selectedMeal]?.advice && (
              <div className="bg-[#181512] border border-[#d8b76d]/20 rounded-xl p-5 md:p-6 mb-8 flex items-start gap-3">
                <BookOpen size={20} className="text-[#d8b76d] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#d8b76d] font-bold mb-1">
                    Sommelier Pairing Advice
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {MEAL_SEO_DATA[selectedMeal].advice}
                  </p>
                </div>
              </div>
            )}

            {recommendedWines.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recommendedWines.map((product) => (
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
                <Wine size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-serif text-gray-300 mb-2">No exact matches found</h3>
                <p className="text-gray-500 mb-6">We couldn't find a direct match in our current inventory.</p>
                <button 
                  onClick={() => navigate('/shop')}
                  className="inline-flex items-center gap-2 text-[#d8b76d] hover:text-white transition-colors cursor-pointer text-sm font-semibold"
                >
                  Browse all wines <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
