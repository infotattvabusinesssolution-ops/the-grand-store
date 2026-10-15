import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  Sparkles,
  Clock,
  ShieldCheck,
  Truck,
  ArrowRight,
  Tag,
  Check,
  Eye,
  X,
  Flame,
  Award,
  Wine,
  Percent,
  Search,
  ChevronRight
} from "lucide-react";
import Price from "../components/ui/Price";
import { useWishlist } from "../wishlistContext";
import { resolveImageUrl } from "../utils/imageUtils";
import SEO from "../components/SEO";
import api from "../api";

// Exactly 6 premier products seeded directly from whiskyshop (whiskyshop.co.za)
const SEEDED_OFFER_PRODUCTS = [
  {
    id: "ws-ballantines-21",
    _id: "6acf704deea6503535645cd0",
    slug: "ballantines-21-year-old-blended-scotch-whisky-750ml",
    name: "Ballantine's 21 Year Old Blended Scotch Whisky 750ml",
    brand: "Ballantine's",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    country: "Scotland",
    region: "Dumbarton & Speyside",
    size: "750ml",
    abv: "40%",
    price: 3990,
    originalPrice: 4499,
    savings: 509,
    discountPercent: 11,
    stock: 12,
    badge: "VAULT SELECTION • 11% OFF",
    offerTag: "PRESTIGE SCOTCH",
    barcode: "5000299223017",
    barcodeImage: "https://barcodeapi.org/api/128/5000299223017",
    image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1000&auto=format&fit=crop",
    shortDescription: "Aged for a minimum of 21 years in hand-selected European and American oak casks. Velvety smooth, opulent texture, and timeless complexity crafted by Master Blender Sandy Hyslop.",
    tastingNotes: ["Wild Heather Honey", "Ripe Orchard Apples", "Liquorice", "Subtle Oak Smoke", "Vanilla Cream"],
    flavorProfile: ["Honeyed", "Orchard Fruits", "Liquorice", "Subtle Oak Spice"],
    foodPairing: ["Dark Chocolate Truffles", "Seared Venison", "Aged Gouda"],
    allocationRemaining: 7,
    filterCategory: "scotch"
  },
  {
    id: "ws-jack-daniels-single-barrel-rye",
    _id: "6acf704eeea6503535645cdb",
    slug: "jack-daniels-single-barrel-rye-green-label-750ml",
    name: "Jack Daniel's Single Barrel Rye Green Label 750ml",
    brand: "Jack Daniel's",
    category: "Whiskey",
    subcategory: "Tennessee Straight Rye Whiskey",
    country: "United States",
    region: "Lynchburg, Tennessee",
    size: "750ml",
    abv: "47%",
    price: 2890,
    originalPrice: 3250,
    savings: 360,
    discountPercent: 11,
    stock: 10,
    badge: "SINGLE BARREL RESERVE • 11% OFF",
    offerTag: "LIMITED RYE",
    barcode: "082184002610",
    barcodeImage: "https://barcodeapi.org/api/128/082184002610",
    image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80",
    shortDescription: "Drawn from individual hand-selected barrels rested in the highest lofts of the Lynchburg barrelhouses. Crafted from a 70% rye grain bill with charcoal-mellowed warmth.",
    tastingNotes: ["Bold Rye Pepper", "Ripe Dried Peach", "Toasted Oak Spice", "Caramel Maple", "Warm Vanilla"],
    flavorProfile: ["Rye Spice", "Caramelized Sugar", "Oak Depth"],
    foodPairing: ["Smoked Barbecue Brisket", "Caramelized Pecans", "Aged Cheddar"],
    allocationRemaining: 4,
    filterCategory: "american"
  },
  {
    id: "ws-dimple-15-blended-scotch",
    _id: "6acf704eeea6503535645ce1",
    slug: "dimple-15-year-old-blended-scotch-whisky-750ml",
    name: "Dimple 15 Year Old De Luxe Scotch Whisky 750ml",
    brand: "Dimple",
    category: "Whisky",
    subcategory: "De Luxe Blended Scotch Whisky",
    country: "Scotland",
    region: "Markinch, Fife",
    size: "750ml",
    abv: "40%",
    price: 950,
    originalPrice: 1150,
    savings: 200,
    discountPercent: 17,
    stock: 20,
    badge: "HERITAGE DECANTER • 17% OFF",
    offerTag: "15 YEAR AGED",
    barcode: "5000267014203",
    barcodeImage: "https://barcodeapi.org/api/128/5000267014203",
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=1000&auto=format&fit=crop",
    shortDescription: "From the historic House of Haig, bottled in the world-famous wire-pinched decanter. A 15-year maturation marrying Glenkinchie malt with rich low-land grains.",
    tastingNotes: ["Warm Butter Toffee", "Heather Honey Malt", "Gentle Peat Smoke", "Dried Apricot", "Mellow Oak"],
    flavorProfile: ["Mellow & Complex", "Honey & Peat", "Toffee"],
    foodPairing: ["Stilton Blue Cheese", "Roast Scottish Lamb", "Traditional Shortbread"],
    allocationRemaining: 9,
    filterCategory: "scotch"
  },
  {
    id: "ws-dassai-45-sake",
    _id: "6acf704eeea6503535645cda",
    slug: "dassai-45-junmai-daiginjo-sake-720ml",
    name: "Dassai 45 Junmai Daiginjo Sake 720ml",
    brand: "Dassai",
    category: "Sake",
    subcategory: "Craft Junmai Daiginjo",
    country: "Japan",
    region: "Yamaguchi Prefecture",
    size: "720ml",
    abv: "16%",
    price: 820,
    originalPrice: 980,
    savings: 160,
    discountPercent: 16,
    stock: 15,
    badge: "JAPANESE CRAFT • 16% OFF",
    offerTag: "DAIGINJO MASTERPIECE",
    barcode: "4935819120230",
    barcodeImage: "https://barcodeapi.org/api/128/4935819120230",
    image: "https://images.unsplash.com/photo-1582819509237-d5b75f20ff7a?q=80&w=1000&auto=format&fit=crop",
    shortDescription: "Yamada Nishiki rice polished down to 45%. Delivers an ethereal melon and white peach bouquet with a velvety delicacy and refreshing silky mineral finish.",
    tastingNotes: ["White Peach", "Lush Honeydew", "Delicate Jasmine", "Steamed Polished Rice", "Clean Spring Mineral"],
    flavorProfile: ["Floral & Fruity", "Silky Smooth", "Refreshing Finish"],
    foodPairing: ["Fresh Sashimi", "Pacific Oysters", "Steamed Turbot", "Light Tempura"],
    allocationRemaining: 6,
    filterCategory: "sake"
  },
  {
    id: "ws-ballantines-hardfired",
    _id: "6acf704deea6503535645ccf",
    slug: "ballantines-hard-fired-blended-scotch-whisky-1l",
    name: "Ballantine's Hard Fired Blended Scotch Whisky 1L",
    brand: "Ballantine's",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    country: "Scotland",
    region: "Scotland",
    size: "1.0L",
    abv: "40%",
    price: 490,
    originalPrice: 590,
    savings: 100,
    discountPercent: 17,
    stock: 28,
    badge: "DOUBLE CHARRED 1L • 17% OFF",
    offerTag: "1-LITRE VALUE",
    barcode: "5000299607145",
    barcodeImage: "https://barcodeapi.org/api/128/5000299607145",
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=1000&auto=format&fit=crop",
    shortDescription: "Finished in bespoke double-charred hard-fired American oak casks. Unlocks rich toasted wood sugars, creamy custard vanilla, and a veil of aromatic sweet smoke.",
    tastingNotes: ["Charred American Oak", "Vanilla Toffee", "Sweet Campfire Smoke", "Caramelized Pear", "Toasted Coconut"],
    flavorProfile: ["Charred Oak", "Vanilla Toffee", "Sweet Smoke"],
    foodPairing: ["Smoked Barbecue Brisket", "Caramelized Pecans", "Aged Cheddar"],
    allocationRemaining: 14,
    filterCategory: "scotch"
  },
  {
    id: "ws-jack-daniels-gentleman-jack",
    _id: "6acf704eeea6503535645cdd",
    slug: "gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml",
    name: "Gentleman Jack Rare Double-Mellowed Tennessee Whiskey 750ml",
    brand: "Jack Daniel's",
    category: "Whiskey",
    subcategory: "Double Charcoal Mellowed",
    country: "United States",
    region: "Lynchburg, Tennessee",
    size: "750ml",
    abv: "40%",
    price: 580,
    originalPrice: 690,
    savings: 110,
    discountPercent: 16,
    stock: 30,
    badge: "DOUBLE MELLOWED • 16% OFF",
    offerTag: "PREMIUM MELLOW",
    barcode: "082184038749",
    barcodeImage: "https://barcodeapi.org/api/128/082184038749",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop",
    shortDescription: "The only whiskey in the world charcoal-mellowed twice: once before entering the barrel and again after maturation, delivering an exceptionally smooth, refined finish.",
    tastingNotes: ["Caramelized Sugar", "Maple Syrup", "Warm Silk Vanilla", "Crisp Red Apple", "Soft Oak Spice"],
    flavorProfile: ["Exceptionally Smooth", "Honeyed Vanilla", "Maple Finish"],
    foodPairing: ["Glazed Pork Chops", "Charcuterie Board", "Dark Chocolate Truffles"],
    allocationRemaining: 11,
    filterCategory: "american"
  }
];

export default function OffersPage({ onAdd, onWish, onCompare, onNotify }) {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [addedItemIds, setAddedItemIds] = useState(new Set());
  const [offerProducts, setOfferProducts] = useState(SEEDED_OFFER_PRODUCTS);

  // Time remaining countdown simulation (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({
    hours: 28,
    minutes: 42,
    seconds: 19
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync with live DB products if available to enrich IDs / real-time stock
  useEffect(() => {
    let isMounted = true;
    const enrichFromLiveCatalog = async () => {
      try {
        const res = await api.get("/products");
        const liveCatalog = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        if (liveCatalog.length > 0 && isMounted) {
          setOfferProducts((prevOffers) =>
            prevOffers.map((offer) => {
              const liveMatch = liveCatalog.find(
                (p) =>
                  p.slug === offer.slug ||
                  p.id === offer.id ||
                  (p.barcode && p.barcode === offer.barcode) ||
                  (p.name && p.name.toLowerCase().includes(offer.brand.toLowerCase()) && p.name.toLowerCase().includes(offer.size.toLowerCase()))
              );
              if (liveMatch) {
                return {
                  ...offer,
                  _id: liveMatch._id || offer._id,
                  id: liveMatch.id || offer.id,
                  slug: liveMatch.slug || offer.slug,
                  stock: liveMatch.stock ?? offer.stock,
                  image: liveMatch.image || offer.image,
                };
              }
              return offer;
            })
          );
        }
      } catch (e) {
        // Fallback to static high-fidelity definition
      }
    };
    enrichFromLiveCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (product, redirectToCart = false) => {
    if (onAdd) {
      onAdd(
        {
          ...product,
          id: product.id || product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          brand: product.brand,
          category: product.category,
          storeId: "admin",
          storeName: "The Grand Store",
          option: `${product.size} Bottle`
        },
        1,
        `${product.size} Bottle`,
        redirectToCart
      );
    } else if (onNotify) {
      onNotify(`${product.name} added to your bag`);
    }

    setAddedItemIds((prev) => new Set([...prev, product.id]));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2200);

    if (redirectToCart) {
      navigate("/customer/cart");
    }
  };

  const handleWishlistToggle = (product) => {
    if (onWish) {
      onWish(product);
    } else {
      const added = toggleWishlist(product);
      if (onNotify) {
        onNotify(`${product.name} ${added ? "added to" : "removed from"} wishlist`);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    let result = [...offerProducts];

    if (activeCategory !== "all") {
      result = result.filter((p) => p.filterCategory === activeCategory);
    }

    if (sortBy === "savings") {
      result.sort((a, b) => b.savings - a.savings);
    } else if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "discount") {
      result.sort((a, b) => b.discountPercent - a.discountPercent);
    }

    return result;
  }, [offerProducts, activeCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#070707] text-[#eee8dd] font-sans selection:bg-[#c9a35b] selection:text-black">
      <SEO
        title="Exclusive Cellar Offers | Whiskyshop Selection"
        description="Limited-allocation promotional pricing on authentic Scottish blends, single-barrel American whiskeys, and Japanese craft sake sourced from Whiskyshop. Guaranteed genuine provenance."
        url="/offers"
      />

      {/* Atmospheric Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#c9a35b]/10 rounded-full blur-[160px]" />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-[#8a682b]/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-[10%] -right-[10%] w-[700px] h-[700px] bg-[#c9a35b]/8 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#c9a35b]/80 mb-6 font-mono">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} className="text-stone-600" />
          <Link to="/shop" className="hover:text-white transition-colors">Cellar</Link>
          <ChevronRight size={12} className="text-stone-600" />
          <span className="text-[#eee8dd]">Whiskyshop Exclusive Offers</span>
        </nav>

        {/* Hero Section */}
        <header className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#c9a35b]/10 border border-[#c9a35b]/30 text-[#c9a35b] text-xs font-semibold tracking-[0.25em] uppercase mb-5 backdrop-blur-sm shadow-[0_0_20px_rgba(201,163,91,0.15)]">
            <Sparkles size={14} className="animate-pulse" />
            <span>Whiskyshop Allocated Selections</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#eee8dd] tracking-tight mb-5 leading-[1.1]">
            Prestige Spirits <span className="italic font-light text-[#c9a35b]">Promotional Offers</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-300/80 leading-relaxed max-w-2xl mx-auto font-light mb-8">
            Six exceptional bottles hand-selected from our verified Whiskyshop import allocations. Featuring rare 21-year aged Scotch, single-barrel Tennessee rye, and artisanal Japanese Junmai Daiginjo at limited promotional valuations.
          </p>

          {/* Allocation Window Bar */}
          <div className="bg-gradient-to-r from-stone-900/90 via-stone-900/60 to-stone-900/90 border border-[#c9a35b]/25 rounded-xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-[#c9a35b]/15 border border-[#c9a35b]/30 flex items-center justify-center text-[#c9a35b]">
                <Clock size={20} className="animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[#c9a35b] font-mono font-semibold">Allocation Window</p>
                <p className="text-sm text-stone-300 font-light">Direct Whiskyshop bond releases at active offer prices</p>
              </div>
            </div>

            {/* Live Countdown Clock */}
            <div className="flex items-center gap-2 sm:gap-3 font-mono">
              <div className="bg-black/60 border border-stone-800 rounded px-2.5 py-1.5 text-center min-w-[54px]">
                <span className="text-lg font-bold text-[#c9a35b]">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="block text-[9px] uppercase tracking-wider text-stone-400">Hours</span>
              </div>
              <span className="text-[#c9a35b] font-bold text-lg">:</span>
              <div className="bg-black/60 border border-stone-800 rounded px-2.5 py-1.5 text-center min-w-[54px]">
                <span className="text-lg font-bold text-[#c9a35b]">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="block text-[9px] uppercase tracking-wider text-stone-400">Mins</span>
              </div>
              <span className="text-[#c9a35b] font-bold text-lg">:</span>
              <div className="bg-black/60 border border-stone-800 rounded px-2.5 py-1.5 text-center min-w-[54px]">
                <span className="text-lg font-bold text-[#c9a35b]">{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="block text-[9px] uppercase tracking-wider text-stone-400">Secs</span>
              </div>
            </div>
          </div>
        </header>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-stone-800/80">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {[
              { id: "all", label: "All Offers", count: 6 },
              { id: "scotch", label: "Blended Scotch", count: 3 },
              { id: "american", label: "American Whiskey", count: 2 },
              { id: "sake", label: "Craft Sake", count: 1 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  activeCategory === tab.id
                    ? "bg-[#c9a35b] text-black shadow-[0_0_15px_rgba(201,163,91,0.3)] font-bold"
                    : "bg-stone-900/60 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/80"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeCategory === tab.id ? "bg-black/20 text-black font-mono" : "bg-stone-800 text-stone-400 font-mono"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs uppercase tracking-[0.15em] text-stone-400 font-mono hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-stone-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#c9a35b] cursor-pointer"
            >
              <option value="featured">Featured Allocation</option>
              <option value="discount">Highest % Discount</option>
              <option value="savings">Greatest Rand Savings</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* 5-Column Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-3.5 lg:gap-4 mb-16">
          {filteredProducts.map((product, index) => {
            const isAdded = addedItemIds.has(product.id);
            const wishlisted = isWishlisted(product);
            const detailUrl = `/product/${product.slug || product.id}`;

            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative bg-gradient-to-b from-[#151413] via-[#0d0d0c] to-[#080808] rounded-xl border border-stone-800/80 hover:border-[#c9a35b]/60 transition-all duration-300 overflow-hidden flex flex-col shadow-md hover:shadow-[0_12px_28px_rgba(201,163,91,0.15)] hover:-translate-y-1"
              >
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a35b]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#c9a35b]/20 transition-all duration-500" />

                {/* Card Top Badges */}
                <div className="p-3 pb-0 flex items-start justify-between z-10">
                  <div className="flex flex-col gap-0.5 items-start">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#c9a35b] text-black font-extrabold text-[9px] tracking-wider uppercase shadow-sm">
                      <Percent size={9} strokeWidth={3} />
                      {product.discountPercent}% OFF
                    </span>
                    <span className="text-[9px] font-mono text-[#c9a35b]/90 font-medium tracking-wide">
                      SAVE R {product.savings}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(product)}
                      className="w-7 h-7 rounded-full bg-black/50 hover:bg-[#c9a35b] text-stone-300 hover:text-black border border-stone-800/80 flex items-center justify-center transition-colors"
                      title="Quick View Details"
                      aria-label={`Quick view ${product.name}`}
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWishlistToggle(product)}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                        wishlisted
                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                          : "bg-black/50 hover:bg-stone-800 text-stone-300 border-stone-800/80"
                      }`}
                      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      aria-label="Wishlist toggle"
                    >
                      <Heart size={12} fill={wishlisted ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>

                {/* Product Image Stage */}
                <Link
                  to={detailUrl}
                  className="relative block w-full pt-2 pb-3 px-4 text-center overflow-hidden z-10"
                >
                  <div className="h-44 sm:h-48 w-full flex items-center justify-center relative">
                    <img
                      src={resolveImageUrl(product.image)}
                      alt={product.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 ease-out"
                    />
                  </div>
                  {/* Subtle ground reflection glow */}
                  <div className="w-1/2 h-1.5 mx-auto bg-[#c9a35b]/15 rounded-full blur-sm mt-1" />
                </Link>

                {/* Product Metadata & Info (Compact Minimalist Luxury Layout) */}
                <div className="p-3 pt-0 flex-1 flex flex-col z-10">
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-1">
                    <span className="text-[#c9a35b] uppercase tracking-wider font-semibold truncate max-w-[65%]">
                      {product.brand}
                    </span>
                    <span className="text-stone-400 shrink-0">
                      {product.size}
                    </span>
                  </div>

                  <h3 className="font-serif text-[13px] sm:text-sm text-[#eee8dd] font-medium leading-snug mb-2 group-hover:text-[#c9a35b] transition-colors line-clamp-2 min-h-[34px]">
                    <Link to={detailUrl} title={product.name}>{product.name}</Link>
                  </h3>

                  {/* Origin & ABV pill */}
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-400 mb-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-black/40 border border-stone-800/80 truncate">
                      {product.country}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-black/40 border border-stone-800/80 shrink-0">
                      ABV {product.abv}
                    </span>
                  </div>

                  {/* Pricing Box */}
                  <div className="mt-auto pt-2 border-t border-stone-800/80 flex items-baseline justify-between mb-2.5">
                    <div>
                      <span className="text-[10px] text-stone-400 line-through font-mono mr-1.5">
                        <Price amount={product.originalPrice} />
                      </span>
                      <span className="text-base sm:text-lg font-serif font-bold text-[#c9a35b]">
                        <Price amount={product.price} />
                      </span>
                    </div>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product, false)}
                      className={`py-1.5 px-1.5 rounded text-[10px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1 transition-all duration-300 ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-700/60"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={11} />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={11} />
                          <span>Add</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product, true)}
                      className="py-1.5 px-1.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#c9a35b] hover:bg-[#dfb76c] text-black transition-all duration-300 shadow-sm flex items-center justify-center gap-0.5"
                    >
                      <span>Buy</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Confidence & Provenance Banner */}
        <section className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-stone-800 rounded-2xl p-8 mb-16 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9a35b]/10 border border-[#c9a35b]/30 flex items-center justify-center text-[#c9a35b] flex-shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-serif text-lg text-[#eee8dd] mb-1">100% Whiskyshop Provenance</h4>
                <p className="text-xs text-stone-400 leading-relaxed font-light">
                  Seeded and imported directly from verified bonded logistics. Every bottle carries an authentic international manufacturer barcode and verifiable carton batch numbers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9a35b]/10 border border-[#c9a35b]/30 flex items-center justify-center text-[#c9a35b] flex-shrink-0">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="font-serif text-lg text-[#eee8dd] mb-1">Aramex Insured Transit</h4>
                <p className="text-xs text-stone-400 leading-relaxed font-light">
                  Packed in reinforced temperature-insulated heavy-bottle packaging. Fully insured against transit damage and signature-verified upon delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9a35b]/10 border border-[#c9a35b]/30 flex items-center justify-center text-[#c9a35b] flex-shrink-0">
                <Award size={24} />
              </div>
              <div>
                <h4 className="font-serif text-lg text-[#eee8dd] mb-1">Sommelier Guarantee</h4>
                <p className="text-xs text-stone-400 leading-relaxed font-light">
                  Stored in climate-controlled cellars at optimal humidity. Need cellar pairing advice? Our resident spirit advisors are on standby for private consultation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA & Explore Catalog */}
        <div className="text-center">
          <p className="text-sm text-stone-400 font-light mb-4">
            Looking for older vintages, rare Cognacs, or boutique estate wines?
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-transparent hover:bg-[#c9a35b] text-[#c9a35b] hover:text-black border border-[#c9a35b]/60 rounded-lg text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300"
          >
            <span>Explore Entire Cellar Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-[#111111] border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest text-[#c9a35b] font-mono font-semibold">
                    Whiskyshop Offer Specification
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#c9a35b] text-black font-bold uppercase">
                    {quickViewProduct.discountPercent}% OFF
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickViewProduct(null)}
                  className="w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Visual & Barcode */}
                <div className="flex flex-col items-center justify-center bg-black/40 rounded-xl p-6 border border-stone-800/80">
                  <div className="h-64 flex items-center justify-center mb-4">
                    <img
                      src={resolveImageUrl(quickViewProduct.image)}
                      alt={quickViewProduct.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
                    />
                  </div>
                  {/* Digital Barcode Preview */}
                  <div className="w-full bg-white/95 rounded p-3 text-center text-black">
                    <p className="text-[9px] uppercase font-mono tracking-widest text-stone-600 mb-1">
                      EAN-13 Authenticated Barcode
                    </p>
                    <img
                      src={quickViewProduct.barcodeImage}
                      alt={`Barcode ${quickViewProduct.barcode}`}
                      className="h-10 mx-auto object-contain"
                    />
                    <p className="text-xs font-mono font-bold tracking-widest text-stone-900 mt-1">
                      {quickViewProduct.barcode}
                    </p>
                  </div>
                </div>

                {/* Right Column: Spirit Details */}
                <div className="flex flex-col">
                  <span className="text-xs text-[#c9a35b] uppercase tracking-widest font-mono font-semibold mb-1">
                    {quickViewProduct.brand} • {quickViewProduct.category}
                  </span>
                  <h3 className="font-serif text-2xl text-stone-100 font-medium mb-3">
                    {quickViewProduct.name}
                  </h3>

                  {/* Pricing Box */}
                  <div className="flex items-baseline gap-3 p-3 bg-stone-900/60 rounded-lg border border-stone-800 mb-4">
                    <span className="text-2xl font-serif font-bold text-[#c9a35b]">
                      <Price amount={quickViewProduct.price} />
                    </span>
                    <span className="text-sm text-stone-400 line-through font-mono">
                      <Price amount={quickViewProduct.originalPrice} />
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-semibold ml-auto">
                      Save R{quickViewProduct.savings}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed font-light mb-4">
                    {quickViewProduct.shortDescription}
                  </p>

                  {/* Tasting Profile */}
                  <div className="mb-4">
                    <h5 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-2">
                      Tasting Notes & Palate
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {quickViewProduct.tastingNotes.map((note, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-200 font-mono"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Food Pairing */}
                  <div className="mb-6">
                    <h5 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                      Sommelier Food Pairing
                    </h5>
                    <p className="text-xs text-stone-300">
                      {quickViewProduct.foodPairing.join(" • ")}
                    </p>
                  </div>

                  {/* Modal CTA */}
                  <div className="mt-auto pt-4 border-t border-stone-800 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddToCart(quickViewProduct, true);
                        setQuickViewProduct(null);
                      }}
                      className="flex-1 py-3 bg-[#c9a35b] hover:bg-[#dfb76c] text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ShoppingBag size={16} />
                      <span>Instant Secure Checkout</span>
                    </button>
                    <Link
                      to={`/product/${quickViewProduct.slug || quickViewProduct.id}`}
                      className="py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
                      onClick={() => setQuickViewProduct(null)}
                    >
                      Full Details
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
