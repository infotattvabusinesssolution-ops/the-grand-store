import Price from "./ui/Price";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  GitCompareArrows,
  Heart,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  PackageCheck,
  Box,
  X,
  CircleUserRound,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import IconButton from "./IconButton";
import { getCountryDisplayName } from '../utils/countryHelpers';
import { storeCategories, accessoryCategories, menuCategories } from "../data";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useGeoLocation } from "../context/LocationContext";
import { useCurrency, getCountryForCurrency } from "../context/CurrencyContext";
import LocaleSelector, { LocaleIcon } from "./LocaleSelector";
import NotificationBell from "./NotificationBell";
import api from "../api";
import ProteaEmblem from "../features/home/components/ProteaEmblem";

function SpringbokSilhouette({ className = "w-20 h-9 text-[#caa458]" }) {
  return (
    <svg
      viewBox="0 0 96 48"
      fill="none"
      stroke="currentColor"
      className={`shrink-0 pointer-events-none select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* South African Leaping Springbok (Pronking Gazelle) */}
      {/* Sweeping Lyrate Horns with ridged texture */}
      <path
        d="M 80 10 C 76 5, 71 2, 67 1 C 66 1.5, 67 3, 70 5 C 73 8, 77 10, 78 12"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M 82 11 C 78 6, 74 3, 70 2 C 69 2.5, 70 4, 73 6 C 76 9, 80 11, 81 13"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Alert backward-angled ear */}
      <path
        d="M 77 12 C 73 10, 71 11, 72 13 C 74 14, 76 13, 78 13"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Head, Muzzle, Throat & Body Contour in dynamic upward leap */}
      <path
        d="M 79 12 
           C 82 13, 87 15, 91 17 
           C 93 18, 92 19, 90 20 
           C 85 21, 81 20, 78 18 
           C 74 22, 72 26, 70 28 
           C 65 28, 58 28, 50 27 
           C 42 26, 35 25, 29 27 
           C 23 30, 17 35, 11 39 
           C 7 42, 3 44, 1 45 
           M 79 12 
           C 74 14, 67 16, 60 17 
           C 52 18, 44 19, 37 21 
           C 30 23, 24 26, 19 30 
           C 14 34, 9 39, 4 43"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Eye */}
      <circle cx="84" cy="16" r="0.75" fill="currentColor" />
      {/* Tucked front legs in mid-flight leap */}
      <path
        d="M 74 24 C 77 28, 79 32, 77 34 C 76 35, 74 34, 73 31 C 71 29, 69 28, 68 27"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 72 27 C 74 30, 76 33, 75 35"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Extended hind legs in full leap */}
      <path
        d="M 28 27 C 22 30, 16 34, 9 38 C 5 41, 2 44, 0.5 45.5"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 24 30 C 19 33, 13 38, 8 42 C 5 44, 3 46, 1.5 47"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      {/* Characteristic Springbok lateral flank stripe */}
      <path
        d="M 33 24 C 42 22, 53 22, 63 24"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2 1.5"
        opacity="0.8"
      />
      {/* Tail */}
      <path
        d="M 21 29 C 19 31, 18 33, 18 34"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BotanicalProteaWatermark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      className={`pointer-events-none select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Royal King Protea Botanical Line Drawing */}
      {/* Central Chalice / Heart */}
      <path d="M100 25 C95 48, 85 72, 70 88 C85 93, 95 98, 100 114 C105 98, 115 93, 130 88 C115 72, 105 48, 100 25 Z" strokeWidth="1.2" />
      {/* Intermediate Bracts */}
      <path d="M62 68 C46 94, 46 124, 56 148 C66 133, 81 123, 96 118 C86 103, 76 83, 62 68 Z" strokeWidth="1" opacity="0.85" />
      <path d="M138 68 C154 94, 154 124, 144 148 C134 133, 119 123, 104 118 C114 103, 124 83, 138 68 Z" strokeWidth="1" opacity="0.85" />
      {/* Outer Flaring Bracts */}
      <path d="M32 102 C26 128, 32 154, 46 174 C56 159, 66 149, 82 144 C70 128, 52 118, 32 102 Z" strokeWidth="0.9" opacity="0.7" />
      <path d="M168 102 C174 128, 168 154, 154 174 C144 159, 134 149, 118 144 C130 128, 148 118, 168 102 Z" strokeWidth="0.9" opacity="0.7" />
      {/* Stem & Calyx Base */}
      <path d="M82 134 C92 144, 100 148, 118 134 C124 154, 114 174, 100 184 C86 174, 76 154, 82 134 Z" strokeWidth="1.2" />
      <path d="M100 184 L100 200" strokeWidth="1.5" />
      {/* Fine Botanical Vein Details */}
      <line x1="100" y1="12" x2="100" y2="25" strokeWidth="1.2" />
      <line x1="82" y1="28" x2="90" y2="40" strokeWidth="0.8" />
      <line x1="118" y1="28" x2="110" y2="40" strokeWidth="0.8" />
      <line x1="52" y1="52" x2="66" y2="68" strokeWidth="0.8" />
      <line x1="148" y1="52" x2="134" y2="68" strokeWidth="0.8" />
      <line x1="28" y1="88" x2="48" y2="100" strokeWidth="0.7" />
      <line x1="172" y1="88" x2="152" y2="100" strokeWidth="0.7" />
    </svg>
  );
}

const currencyFlagCountries = {
  AED: 'AE', AUD: 'AU', BWP: 'BW', BRL: 'BR', CAD: 'CA', CHF: 'CH', CNY: 'CN',
  CLP: 'CL', EUR: 'EU', GBP: 'GB', GHS: 'GH', HKD: 'HK', INR: 'IN', JPY: 'JP',
  KES: 'KE', KRW: 'KR', MUR: 'MU', MXN: 'MX', NAD: 'NA', NGN: 'NG', NZD: 'NZ',
  RUB: 'RU', SAR: 'SA', SGD: 'SG', TRY: 'TR', USD: 'US', ZAR: 'ZA'
};

const currencyNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'currency' })
  : null;

export default function Header({
  cartCount,
  compareCount,
  wishlistCount,
  onBagClick,
  onCompareClick,
  onWishlistClick,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { products } = useProducts();
  const { country_code, countries, changeCountry, isLoading: geoLoading } = useGeoLocation();
  const { currency, availableCurrencies, changeCurrency, loading: currencyLoading } = useCurrency();

  const countryOptions = useMemo(() => countries.map((country) => ({
    value: country.code,
    label: country.name,
    flagCode: country.code
  })), [countries]);

  const currencyOptions = useMemo(() => availableCurrencies.map((currencyCode) => ({
    value: currencyCode,
    label: currencyNames?.of(currencyCode) || currencyCode,
    flagCode: currencyFlagCountries[currencyCode] || getCountryForCurrency(currencyCode),
    icon: '¤'
  })), [availableCurrencies]);

  const selectedCountryOption = countryOptions.find(
    (option) => option.value === (country_code || "ZA"),
  ) || countryOptions[0];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileNavStack, setMobileNavStack] = useState([{ view: "root" }]);
  const [megaTrigger, setMegaTrigger] = useState("shop");
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [activeCountry, setActiveCountry] = useState(null);
  const [megaActiveCategory, setMegaActiveCategory] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  const currentNav = mobileNavStack[mobileNavStack.length - 1];
  const pushNav = (view, data = null) => setMobileNavStack(prev => [...prev, { view, data }]);
  const popNav = () => setMobileNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  const previewProduct = useMemo(() => {
    if (!hoveredItem || !products.length) return null;
    return products.find(p => p.brand === hoveredItem || p.subcategory === hoveredItem);
  }, [hoveredItem, products]);
  const headerRef = useRef(null);

  const closeTimerRef = useRef(null);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const mobileSearchRef = useRef(null);

  const normalizeForSearch = (str) =>
    String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const searchResults = searchQuery.trim()
    ? products
        .filter((p) => {
          const q = normalizeForSearch(searchQuery);
          return (
            normalizeForSearch(p.name).includes(q) ||
            normalizeForSearch(p.brand).includes(q) ||
            normalizeForSearch(p.storeName).includes(q) ||
            normalizeForSearch(p.vendorName).includes(q) ||
            normalizeForSearch(p.category).includes(q) ||
            normalizeForSearch(p.subcategory).includes(q) ||
            (Array.isArray(p.tags) && p.tags.some(t => normalizeForSearch(t).includes(q)))
          );
        })
        .slice(0, 8)
    : [];

  const mobileSearchResults = mobileSearchQuery.trim()
    ? products
        .filter((p) => {
          const q = normalizeForSearch(mobileSearchQuery);
          return (
            normalizeForSearch(p.name).includes(q) ||
            normalizeForSearch(p.brand).includes(q) ||
            normalizeForSearch(p.storeName).includes(q) ||
            normalizeForSearch(p.vendorName).includes(q) ||
            normalizeForSearch(p.category).includes(q) ||
            normalizeForSearch(p.subcategory).includes(q) ||
            (Array.isArray(p.tags) && p.tags.some(t => normalizeForSearch(t).includes(q)))
          );
        })
        .slice(0, 8)
    : [];

  const [hasLiveAuction, setHasLiveAuction] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkLiveAuction = async () => {
      try {
        const res = await api.get('/auction/live-status');
        if (isMounted && res.data) {
          setHasLiveAuction(Boolean(res.data.hasLiveAuction));
        }
      } catch (err) {
        // Silently catch polling failure
      }
    };

    checkLiveAuction();
    const timer = setInterval(checkLiveAuction, 30000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setIsVisible(false);
        setMegaOpen(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMegaOpen(false);
      }
    };
    if (megaOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [megaOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  const closeMenus = () => {
    setMobileOpen(false);
    setMegaOpen(false);
    setTimeout(() => setMobileNavStack([{ view: "root" }]), 300);
  };

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setMegaOpen(false), 300);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  // Build category→brands, subcategories, and countries map from live products
  const getProductCategory = (p) => p.category || p.type || "";
  const categoryBrandsMap = {};
  const categorySubcategoriesMap = {};
  const categoryCountriesMap = {};
  
  for (const p of products) {
    const cat = getProductCategory(p);
    if (!cat) continue;
    
    if (!categoryBrandsMap[cat]) categoryBrandsMap[cat] = new Set();
    if (p.brand) categoryBrandsMap[cat].add(p.brand);
    
    if (!categorySubcategoriesMap[cat]) categorySubcategoriesMap[cat] = new Set();
    if (p.subcategory) categorySubcategoriesMap[cat].add(p.subcategory);
    
    if (!categoryCountriesMap[cat]) categoryCountriesMap[cat] = new Set();
    if (p.country) categoryCountriesMap[cat].add(p.country);
  }
  
  const liveCategories = Object.keys(categoryBrandsMap).sort();

  const dynamicMenuCategories = liveCategories.map(cat => {
    const subcats = Array.from(categorySubcategoriesMap[cat] || []).sort();
    const brands = Array.from(categoryBrandsMap[cat] || []).sort();
    const countries = Array.from(categoryCountriesMap[cat] || []).sort();
    
    return {
      name: cat,
      description: `Explore our collection of ${cat}`,
      groups: [
        ...(countries.length > 0 ? [{ title: 'Countries', items: countries }] : []),
        ...(subcats.length > 0 ? [{ title: 'Subcategories', items: subcats }] : []),
        ...(brands.length > 0 ? [{ title: 'Brands', items: brands }] : [])
      ]
    };
  });

  const dynamicAccessoryCategories = useMemo(() => {
    const accProducts = products.filter(p => p.type === 'accessory' || Object.keys(accessoryCategories).includes(p.category || p.type));
    
    const catBrands = {};
    const catSubcats = {};
    
    Object.keys(accessoryCategories).forEach(cat => {
      catBrands[cat] = new Set();
      catSubcats[cat] = new Set(accessoryCategories[cat]);
    });

    for (const p of accProducts) {
      const cat = p.category || p.type;
      if (!cat) continue;
      if (!catBrands[cat]) catBrands[cat] = new Set();
      if (p.brand) catBrands[cat].add(p.brand);
      
      if (!catSubcats[cat]) catSubcats[cat] = new Set();
      if (p.subcategory) catSubcats[cat].add(p.subcategory);
    }
    
    const categories = Object.keys(catBrands).sort();
    return categories.map(cat => {
      const subcats = Array.from(catSubcats[cat] || []).sort();
      const brands = Array.from(catBrands[cat] || []).sort();
      
      return {
        name: cat,
        description: `Explore our premium collection of ${cat}`,
        isAccessory: true,
        groups: [
          ...(subcats.length > 0 ? [{ title: 'Subcategories', items: subcats }] : []),
          ...(brands.length > 0 ? [{ title: 'Brands', items: brands }] : [])
        ]
      };
    }).filter(c => c.groups.length > 0);
  }, [products]);

  // Keep a ref so openMega can read latest map without being in its dep array
  const categoryBrandsMapRef = useRef(categoryBrandsMap);
  categoryBrandsMapRef.current = categoryBrandsMap;

  const openMega = useCallback(
    (trigger) => {
      cancelClose();
      setMegaTrigger(trigger);
      setMegaOpen(true);
      setActiveCountry(null);
      setActiveSubcategory(null);
      setActiveBrand(null);
      setHoveredItem(null);
      // Auto-select the relevant live category so panels are never hardcoded.
      if (trigger === "shop") {
        setMegaActiveCategory(dynamicMenuCategories[0]);
      } else if (trigger === "wine") {
        setMegaActiveCategory(dynamicMenuCategories.find((category) => category.name.toLowerCase() === 'wine') || null);
      } else if (trigger === "accessories") {
        setMegaActiveCategory(dynamicAccessoryCategories[0]);
      } else {
        setActiveCategory(null);
        setMegaActiveCategory(null);
        setHoveredItem(null);
      }
    },
    [cancelClose, dynamicMenuCategories, dynamicAccessoryCategories],
  );

  return (
    <div
      className={`sticky top-0 left-0 right-0 bg-[#0c0b09] ${mobileOpen ? "z-[10000] transform-none" : `z-[100] transition-transform duration-300 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-full"}`}`}
    >
      {/* Top Announcement Bar */}
      <div className="announcement-bar py-2 bg-[#0c0b09] border-b border-white/10 text-[#caa458]">
        <div className="shell announcement-inner flex items-center justify-between">
          <p className="font-bold tracking-[0.16em] uppercase text-[10px] sm:text-[11px] text-[#caa458] flex items-center">
            <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458] mr-2 shrink-0" />
            <span>COMPLIMENTARY DELIVERY OVER <Price amount={1800} /></span>
          </p>
          <p className="announcement-message font-bold tracking-[0.18em] uppercase text-[10px] sm:text-[11px] text-[#caa458] text-center hidden md:block">
            PRIVATE CELLAR SOURCING AVAILABLE WORLDWIDE
          </p>
          <div className="announcement-actions announcement-actions--desktop font-semibold tracking-[0.12em] uppercase text-[10px] sm:text-[11px] text-[#caa458] flex items-center">
            <LocaleSelector
              ariaLabel="Shopping country"
              value={geoLoading ? "FETCHING" : (country_code || "ZA")}
              options={geoLoading ? [{ value: "FETCHING", label: "Fetching...", flagCode: "ZA" }] : countryOptions}
              onChange={changeCountry}
              searchPlaceholder="Search countries..."
              disabled={geoLoading}
            />
            <span className="top-rule bg-[#caa458]/30 mx-2" />
            <LocaleSelector
              ariaLabel="Display currency"
              value={currencyLoading || geoLoading ? "FETCHING" : (currency || "ZAR")}
              options={currencyLoading || geoLoading ? [{ value: "FETCHING", label: "Fetching...", icon: '¤' }] : currencyOptions}
              onChange={changeCurrency}
              searchPlaceholder="Search currencies..."
              disabled={currencyLoading || geoLoading}
              compact
            />
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <header className="site-header relative bg-[#0a0c0e] border-b border-white/10" ref={headerRef}>
        
        {/* Botanical Protea Watermark Background (Left & Right) matching design */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 hidden lg:block" aria-hidden="true">
          <div className="absolute -left-6 -bottom-6 w-56 h-56 text-[#caa458] opacity-20">
            <BotanicalProteaWatermark className="w-full h-full" />
          </div>
          <div className="absolute -right-6 -bottom-6 w-56 h-56 text-[#caa458] opacity-20">
            <BotanicalProteaWatermark className="w-full h-full" />
          </div>
        </div>

        <div className="shell header-main relative z-10 !flex items-center justify-between min-h-[64px] sm:min-h-[74px] md:min-h-[85px] px-2 sm:px-6 md:px-10 gap-3 sm:gap-4 w-full">
          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              className="mobile-menu-button shrink-0 text-[#eee8dd] hover:text-[#caa458] transition-colors md:hidden cursor-pointer p-1"
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>

            <Link
              className="brand-mark shrink-0 inline-flex items-center"
              to="/"
              aria-label="The Grand Store home"
            >
              <img
                src="/logo.png"
                alt="The Grand Store"
                className="h-10 w-auto max-w-[150px] object-contain object-left sm:h-12 sm:max-w-[200px] md:h-[60px] md:max-w-[260px]"
              />
            </Link>
          </div>

          {/* Left Leaping Springbok Silhouette between Logo & Search Bar */}
          <div className="hidden xl:flex items-center text-[#caa458] opacity-45 hover:opacity-75 transition-opacity shrink-0 pointer-events-none select-none">
            <SpringbokSilhouette className="h-10 w-24" />
          </div>

          {/* Center: Search Bar with Rich Springbok Green Button */}
          <div
            className="hidden md:block flex-1 max-w-[560px] mx-2 lg:mx-4 relative"
            ref={searchRef}
          >
            <form
              className="flex items-center h-[44px] w-full bg-[#16171a] border border-white/15 focus-within:border-[#caa458] rounded-md overflow-hidden transition-all shadow-inner"
              onSubmit={(event) => {
                event.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                  setIsSearchOpen(false);
                }
              }}
            >
              <Search size={18} className="text-[#858b94] ml-4 mr-2.5 shrink-0" aria-hidden="true" />
              <input
                aria-label="Search the collection"
                placeholder="Search rare bottles, estates, vintages…"
                className="w-full h-full bg-transparent border-0 outline-none text-sm text-[#eee8dd] placeholder-[#858b94] font-sans pr-3"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
              <button
                type="submit"
                className="h-full px-6 bg-[#0e5c36] hover:bg-[#146c41] text-[#f5eed4] hover:text-white font-bold text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer shrink-0 flex items-center justify-center font-sans border-l border-white/10"
              >
                SEARCH
              </button>
            </form>

            <AnimatePresence>
              {isSearchOpen &&
                searchQuery.trim() &&
                searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 w-full bg-[#1e1e1e] border border-white/20 shadow-2xl z-50 overflow-hidden"
                  >
                    {searchResults.map((product) => (
                      <Link
                        key={product.id || product._id}
                        to={`/product/${product.slug || product.id || product._id}`}
                        className="flex items-center justify-between p-3 border-b border-white/10 hover:bg-white/5 transition-colors last:border-b-0"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-8 h-10 flex items-center justify-center rounded border border-white/10 overflow-hidden shrink-0 bg-white/5">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#222]"></div>
                            )}
                          </div>
                          <span
                            className="text-[15px] text-[#eee] truncate"
                            title={product.name}
                          >
                            {product.name}
                          </span>
                        </div>
                        <span className="text-[15px] text-[#eee] ml-4 shrink-0">
                          <Price amount={product.price} />
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Right Leaping Springbok Silhouette between Search & Actions */}
          <div className="hidden xl:flex items-center text-[#caa458] opacity-45 hover:opacity-75 transition-opacity shrink-0 pointer-events-none select-none">
            <SpringbokSilhouette className="h-10 w-24" />
          </div>

          {/* Right: Header Actions (LOGIN + Solid Gold Wishlist + Solid Gold Bag + Sparkle) */}
          <div className="header-actions flex items-center justify-end gap-2.5 sm:gap-3.5 shrink-0">
            {user && <NotificationBell />}

            {user ? (
              <button
                type="button"
                className="relative w-10 h-10 rounded-full bg-[#caa458] hover:bg-[#d8b566] text-black font-bold flex items-center justify-center transition-all hover:scale-105 shadow-[0_2px_10px_rgba(202,164,88,0.35)] cursor-pointer shrink-0"
                onClick={() => {
                  if (["admin", "super_admin", "accountant", "product_manager"].includes(user.role)) {
                    navigate("/admin/auctions");
                  } else if (["vendor_active", "vendor", "vendor_pending"].includes(user.role)) {
                    navigate("/vendor/dashboard");
                  } else if (user.role === "vendor_approved_unpaid") {
                    navigate("/vendor/payment");
                  } else if (user.role === "auction_host") {
                    navigate("/auction-manager/dashboard");
                  } else if (user.role === "event_host") {
                    navigate("/event-manager/dashboard");
                  } else {
                    navigate("/customer/profile");
                  }
                }}
                aria-label="User Profile"
              >
                <CircleUserRound size={20} strokeWidth={2.2} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="sm:hidden text-xs font-bold uppercase tracking-[0.14em] text-[#caa458] hover:text-[#f7e1a0] transition-colors p-1 cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  <CircleUserRound size={22} />
                </button>
                <button
                  type="button"
                  className="hidden sm:inline-block text-xs font-bold uppercase tracking-[0.16em] text-[#caa458] hover:text-[#f7e1a0] transition-colors mr-1 cursor-pointer font-sans"
                  onClick={() => navigate("/login")}
                >
                  LOGIN
                </button>
              </>
            )}

            <div className="hidden">
              <IconButton
                label="Compare products"
                count={compareCount}
                onClick={onCompareClick}
              >
                <GitCompareArrows size={21} />
              </IconButton>
            </div>

            {/* Solid Gold Circular Wishlist Button matching design */}
            <button
              type="button"
              onClick={onWishlistClick}
              aria-label={`Wishlist, ${wishlistCount} saved ${wishlistCount === 1 ? "bottle" : "bottles"}`}
              className="relative w-10 h-10 rounded-full bg-[#caa458] hover:bg-[#d8b566] text-black font-bold flex items-center justify-center transition-all hover:scale-105 shadow-[0_2px_10px_rgba(202,164,88,0.35)] cursor-pointer shrink-0"
            >
              <Heart size={18} strokeWidth={2.2} fill={wishlistCount ? "currentColor" : "none"} className="text-black" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-[#caa458] border border-[#caa458] text-[10px] font-bold flex items-center justify-center font-sans leading-none">
                {wishlistCount || 0}
              </span>
            </button>

            {/* Solid Gold Circular Shopping Bag Button matching design */}
            <button
              type="button"
              onClick={onBagClick}
              aria-label={`Shopping bag, ${cartCount} items`}
              className="relative w-10 h-10 rounded-full bg-[#caa458] hover:bg-[#d8b566] text-black font-bold flex items-center justify-center transition-all hover:scale-105 shadow-[0_2px_10px_rgba(202,164,88,0.35)] cursor-pointer shrink-0"
            >
              <ShoppingBag size={18} strokeWidth={2.2} className="text-black" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-[#caa458] border border-[#caa458] text-[10px] font-bold flex items-center justify-center font-sans leading-none">
                {cartCount || 0}
              </span>
            </button>

            {/* Sparkle Star on Far Right */}
            <div className="text-[#caa458] opacity-75 hidden sm:block ml-0.5 pointer-events-none">
              <Sparkles size={16} />
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav
          className="desktop-nav border-t border-b border-white/10 bg-[#0c0b09]"
          aria-label="Main navigation"
          onMouseLeave={scheduleClose}
          onMouseEnter={cancelClose}
        >
          <div className="shell nav-inner flex items-center justify-center gap-6 lg:gap-8 xl:gap-9 h-[50px]">
            <Link
              className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative ${
                location.pathname === "/"
                  ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                  : "text-[#d6d0c5] hover:text-[#caa458]"
              }`}
              to="/"
              onMouseEnter={() => {
                cancelClose();
                setMegaOpen(false);
              }}
            >
              HOME
            </Link>

            {/* Shop trigger */}
            <div
              className="nav-shop-control flex items-center h-full"
              onMouseEnter={() => openMega("shop")}
            >
              <Link
                className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative ${
                  location.pathname.startsWith("/shop") && !location.search.includes("category=Wine")
                    ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                    : "text-[#d6d0c5] hover:text-[#caa458]"
                }`}
                to="/shop"
                onClick={() => setMegaOpen(false)}
              >
                SHOP
              </Link>
            </div>

            {/* Wine */}
            <div
              className="nav-shop-control flex items-center h-full"
              onMouseEnter={() => openMega("wine")}
            >
              <Link
                className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative ${
                  new URLSearchParams(location.search).get('category') === 'Wine'
                    ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                    : "text-[#d6d0c5] hover:text-[#caa458]"
                }`}
                to="/shop?category=Wine"
                onClick={() => setMegaOpen(false)}
              >
                WINE
              </Link>
            </div>

            <Link
              className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative ${
                location.pathname.startsWith("/offers")
                  ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                  : "text-[#d6d0c5] hover:text-[#caa458]"
              }`}
              to="/offers"
              onMouseEnter={() => {
                cancelClose();
                setMegaOpen(false);
              }}
            >
              OFFERS
            </Link>

            <Link
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative ${
                location.pathname.startsWith("/auction")
                  ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                  : "text-[#d6d0c5] hover:text-[#caa458]"
              }`}
              to="/auction"
              onMouseEnter={() => {
                cancelClose();
                setMegaOpen(false);
              }}
            >
              <span>AUCTION</span>
              {hasLiveAuction && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-red-400 leading-none">
                    LIVE
                  </span>
                </span>
              )}
            </Link>

            {/* Accessories trigger */}
            <div
              className="nav-accessories-control flex items-center h-full"
              onMouseEnter={() => openMega("accessories")}
            >
              <Link
                to="/accessories"
                className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative ${
                  location.pathname.startsWith("/accessories")
                    ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                    : "text-[#d6d0c5] hover:text-[#caa458]"
                }`}
                onClick={() => setMegaOpen(false)}
              >
                ACCESSORIES
              </Link>
            </div>

            <Link
              to="/events"
              className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative ${
                location.pathname.startsWith("/events")
                  ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                  : "text-[#d6d0c5] hover:text-[#caa458]"
              }`}
              onMouseEnter={() => {
                cancelClose();
                setMegaOpen(false);
              }}
            >
              EVENTS
            </Link>

            <Link
              className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative ${
                location.pathname.startsWith("/vendor-portal")
                  ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                  : "text-[#d6d0c5] hover:text-[#caa458]"
              }`}
              to="/vendor-portal"
              onMouseEnter={() => {
                cancelClose();
                setMegaOpen(false);
              }}
            >
              SELL ON THE GRAND STORE
            </Link>

            {/* GLOBAL WINES with King Protea Emblem from image */}
            <Link
              to="/global-wines"
              className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-3.5 relative inline-flex items-center gap-1.5 ${
                location.pathname.startsWith("/global-wines")
                  ? "text-[#caa458] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#caa458]"
                  : "text-[#caa458] hover:text-[#f7e1a0]"
              }`}
              onMouseEnter={() => {
                cancelClose();
                setMegaOpen(false);
              }}
            >
              <ProteaEmblem className="w-4 h-4 text-[#caa458]" />
              <span>GLOBAL WINES</span>
            </Link>
          </div>
        </nav>

        {/* ── SHOP MEGA MENU ── */}
        <AnimatePresence>
          {megaOpen && ["shop", "wine"].includes(megaTrigger) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[100%] left-0 w-full z-50"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <div className="w-full bg-[#111] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-t border-white/10">
                <div className="w-full max-w-[1400px] mx-auto flex min-h-[420px]">
                  {/* Shop shows all categories; Wine opens directly into its own hierarchy. */}
                  {megaTrigger === "shop" && (
                  <div className="w-[380px] shrink-0 border-r border-white/10 py-8 pl-10 pr-6 flex flex-col bg-[#0a0a0a]">
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#888] uppercase mb-4 pl-4">Shop By Category</h3>
                    <div className="columns-2 gap-2">
                      {dynamicMenuCategories.map((cat) => (
                        <button
                          key={cat.name}
                          onMouseEnter={() => {
                            setMegaActiveCategory(cat);
                            setActiveSubcategory(null);
                            setActiveBrand(null);
                            setActiveCountry(null);
                          }}
                          onClick={() => {
                            closeMenus();
                            navigate(`/shop?category=${encodeURIComponent(cat.name)}`);
                          }}
                          className={`w-full break-inside-avoid mb-1.5 text-left text-[14px] px-4 py-2.5 rounded-sm transition-all duration-300 font-serif ${megaActiveCategory?.name === cat.name ? 'bg-[#c9a35b]/10 text-[#c9a35b]' : 'text-[#ccc] hover:text-white hover:bg-white/5'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Right Content */}
                  <div className="flex-1 flex bg-[#111] relative overflow-hidden">
                    {megaActiveCategory && (
                      <>
                        {(() => {
                          const categoryProducts = products.filter(p => getProductCategory(p) === megaActiveCategory.name);
                          const countries = Array.from(new Set(categoryProducts.map(p => p.country).filter(Boolean))).sort();

                          const countryProducts = activeCountry ? categoryProducts.filter(p => p.country === activeCountry) : [];
                          const subcategories = Array.from(new Set(countryProducts.map(p => p.subcategory).filter(Boolean))).sort();
                          
                          const subcatProducts = activeSubcategory ? countryProducts.filter(p => p.subcategory === activeSubcategory) : [];
                          const brands = Array.from(new Set(subcatProducts.map(p => p.brand).filter(Boolean))).sort();
                          
                          const brandProducts = activeBrand ? subcatProducts.filter(p => p.brand === activeBrand) : [];
                          const finalProducts = activeBrand ? brandProducts.slice(0, 8) : [];
                          
                          return (
                            <div className="flex-1 py-10 px-12 h-full flex flex-col">
                              <div className="mb-10">
                                <h2 className="text-3xl font-serif text-white mb-2">{megaActiveCategory.name}</h2>
                                <p className="text-[#888] text-[15px] max-w-lg">{megaActiveCategory.description}</p>
                              </div>
                              
                              <div className="flex gap-12">
                                {/* Countries Column */}
                                {countries.length > 0 && (
                                  <div className="flex-1 min-w-[180px] max-w-[240px]">
                                    <h4 className="text-white text-[13px] font-bold tracking-[0.05em] mb-5 pb-4 border-b border-white/10 uppercase">
                                      Countries
                                    </h4>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                      <ul className="flex flex-col gap-3.5">
                                        {countries.map(item => (
                                          <li key={item}>
                                            <Link 
                                              to={`/shop?category=${encodeURIComponent(megaActiveCategory.name)}&country=${encodeURIComponent(item)}`}
                                              onClick={closeMenus}
                                              onMouseEnter={() => {
                                                setActiveCountry(item);
                                                setActiveSubcategory(null);
                                                setActiveBrand(null);
                                              }}
                                              className={`text-[13px] transition-colors block ${activeCountry === item ? 'text-[#c9a35b]' : 'text-[#999] hover:text-[#c9a35b]'}`}
                                            >
                                              {getCountryDisplayName(item, megaActiveCategory.name)}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Subcategories Column */}
                                {activeCountry && subcategories.length > 0 && (
                                  <div className="flex-1 min-w-[180px] max-w-[240px] animate-in fade-in slide-in-from-left-4 duration-200">
                                    <h4 className="text-white text-[13px] font-bold tracking-[0.05em] mb-5 pb-4 border-b border-white/10 uppercase">
                                      Subcategories
                                    </h4>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                      <ul className="flex flex-col gap-3.5">
                                        {subcategories.map(item => (
                                          <li key={item}>
                                            <Link 
                                              to={`/shop?category=${encodeURIComponent(megaActiveCategory.name)}&country=${encodeURIComponent(activeCountry)}&subcategory=${encodeURIComponent(item)}`}
                                              onClick={closeMenus}
                                              onMouseEnter={() => {
                                                setActiveSubcategory(item);
                                                setActiveBrand(null);
                                              }}
                                              className={`text-[13px] transition-colors block ${activeSubcategory === item ? 'text-[#c9a35b]' : 'text-[#999] hover:text-[#c9a35b]'}`}
                                            >
                                              {item}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}

                                {/* Brands Column */}
                                {activeSubcategory && brands.length > 0 && (
                                  <div className="flex-1 min-w-[180px] max-w-[240px] animate-in fade-in slide-in-from-left-4 duration-200">
                                    <h4 className="text-white text-[13px] font-bold tracking-[0.05em] mb-5 pb-4 border-b border-white/10 uppercase">
                                      Brands
                                    </h4>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                      <ul className="flex flex-col gap-3.5">
                                        {brands.map(item => (
                                          <li key={item}>
                                            <Link 
                                              to={`/shop?category=${encodeURIComponent(megaActiveCategory.name)}&country=${encodeURIComponent(activeCountry)}&subcategory=${encodeURIComponent(activeSubcategory)}&brand=${encodeURIComponent(item)}`}
                                              onClick={closeMenus}
                                              onMouseEnter={() => setActiveBrand(item)}
                                              className={`text-[13px] transition-colors block ${activeBrand === item ? 'text-[#c9a35b]' : 'text-[#999] hover:text-[#c9a35b]'}`}
                                            >
                                              {item}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}

                                {/* Final Products Column */}
                                {activeBrand && finalProducts.length > 0 && (
                                  <div className="flex-1 min-w-[200px] max-w-[280px] animate-in fade-in slide-in-from-left-4 duration-200">
                                    <h4 className="text-[#c9a35b] text-[13px] font-bold tracking-[0.05em] mb-5 pb-4 border-b border-white/10 uppercase">
                                      Products
                                    </h4>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                      <ul className="flex flex-col gap-4">
                                        {finalProducts.map(p => (
                                          <li key={p.id || p._id} className="break-inside-avoid">
                                            <Link 
                                              to={`/product/${p.slug || p.id || p._id}`}
                                              onClick={closeMenus}
                                              className="flex flex-col gap-1 group"
                                            >
                                              <span className="text-[13px] text-[#eee] group-hover:text-[#c9a35b] transition-colors block line-clamp-2 leading-tight">
                                                {p.name}
                                              </span>
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    {brandProducts.length > 8 && (
                                      <div className="mt-4 pt-4 border-t border-white/5">
                                        <Link
                                          to={`/shop?category=${encodeURIComponent(megaActiveCategory.name)}&country=${encodeURIComponent(activeCountry)}&subcategory=${encodeURIComponent(activeSubcategory)}&brand=${encodeURIComponent(activeBrand)}`}
                                          onClick={closeMenus}
                                          className="inline-flex items-center gap-1.5 text-[#c9a35b] text-[11px] font-bold tracking-[0.1em] uppercase hover:text-white transition-colors"
                                        >
                                          View more <ArrowRight size={12} />
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* View All Button */}
                              <div className="mt-auto pt-8">
                                <Link 
                                  to={`/shop?category=${encodeURIComponent(megaActiveCategory.name)}`}
                                  onClick={closeMenus}
                                  className="inline-flex items-center gap-2 text-[#c9a35b] text-[12px] font-bold tracking-[0.15em] uppercase hover:text-white transition-colors"
                                >
                                  Shop All {megaActiveCategory.name} <ArrowRight size={14} />
                                </Link>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACCESSORIES MEGA MENU ── */}
        <AnimatePresence>
          {megaOpen && megaTrigger === "accessories" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[100%] left-0 w-full z-50 border-t border-white/10"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <div className="w-full bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-b border-white/10">
                <div className="w-full max-w-[1400px] mx-auto flex min-h-[420px]">
                  {/* Left Sidebar */}
                  <div className="w-[380px] shrink-0 border-r border-white/10 py-8 pl-10 pr-6 flex flex-col bg-[#0a0a0a]">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-[#c9a35b] text-[11px] font-bold tracking-[0.2em] uppercase">Accessories</h3>
                    </div>
                    
                    <ul className="space-y-1">
                      {dynamicAccessoryCategories.map((cat) => (
                        <li key={cat.name}>
                          <button
                            type="button"
                            onMouseEnter={() => {
                              setMegaActiveCategory(cat);
                              setHoveredItem(null);
                            }}
                            className={`w-full text-left px-4 py-3 rounded text-[15px] transition-all duration-200 flex items-center justify-between group
                              ${megaActiveCategory?.name === cat.name 
                                ? 'bg-white/10 text-white font-medium pl-6' 
                                : 'text-[#888] hover:text-white hover:bg-white/5'}`}
                          >
                            <span>{cat.name}</span>
                            <ChevronRight size={16} className={`transition-transform duration-200 ${megaActiveCategory?.name === cat.name ? 'text-[#c9a35b] translate-x-1' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'}`} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Content */}
                  <div className="flex-1 flex bg-[#111] relative overflow-hidden">
                    {megaActiveCategory && (
                      <>
                        <div className="flex-1 py-10 px-12 h-full flex flex-col">
                          <div className="mb-10">
                            <h2 className="text-3xl font-serif text-white mb-2">{megaActiveCategory.name}</h2>
                            <p className="text-[#888] text-[15px] max-w-lg">{megaActiveCategory.description}</p>
                          </div>
                        
                        <div className="flex gap-12 flex-wrap">
                          {megaActiveCategory?.groups?.map((group) => (
                            <div key={group.title} className="flex-1 min-w-[240px] max-w-[340px]">
                              <h4 className="text-white text-[13px] font-bold tracking-[0.05em] mb-5 pb-4 border-b border-white/10">
                                {group.title}
                              </h4>
                              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <ul className="columns-2 gap-6">
                                  {group.items.map((item) => (
                                    <li key={item} className="break-inside-avoid mb-3.5">
                                      <Link
                                        to={`/accessories?category=${encodeURIComponent(megaActiveCategory.name)}&subcategory=${encodeURIComponent(item)}`}
                                        onClick={closeMenus}
                                        onMouseEnter={() => setHoveredItem(item)}
                                        className="text-[13px] text-[#999] hover:text-[#c9a35b] transition-colors block"
                                      >
                                        {item}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                          
                          {/* Products List (Identical UI to groups) */}
                          {(() => {
                            if (!hoveredItem) return null;
                            const matchedProducts = products.filter(p => p.brand === hoveredItem || p.subcategory === hoveredItem);
                            if (matchedProducts.length === 0) return null;
                            
                            const visibleProducts = matchedProducts.slice(0, 8);
                            const hasMore = matchedProducts.length > 8;
                            
                            return (
                              <div className="flex-1 min-w-[240px] max-w-[340px] animate-in fade-in slide-in-from-left-4 duration-200 flex flex-col">
                                <h4 className="text-[#c9a35b] text-[13px] font-bold tracking-[0.05em] mb-5 pb-4 border-b border-white/10 uppercase">
                                  Products
                                </h4>
                                <div>
                                  <ul className="columns-2 gap-6">
                                    {visibleProducts.map(p => (
                                      <li key={p.id || p._id} className="break-inside-avoid mb-5">
                                        <Link
                                          to={`/product/${p.slug || p.id || p._id}`}
                                          onClick={closeMenus}
                                          className="text-[13px] text-[#999] hover:text-[#c9a35b] transition-colors block line-clamp-1"
                                          title={p.name}
                                        >
                                          {p.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {hasMore && (
                                  <div className="mt-2 pt-4 border-t border-white/5">
                                    <Link
                                      to={`/accessories?category=${encodeURIComponent(megaActiveCategory.name)}&subcategory=${encodeURIComponent(hoveredItem)}`}
                                      onClick={closeMenus}
                                      className="inline-flex items-center gap-1.5 text-[#c9a35b] text-[11px] font-bold tracking-[0.1em] uppercase hover:text-white transition-colors"
                                    >
                                      View more <ArrowRight size={12} />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* View All Button */}
                        <div className="mt-auto pt-8">
                          <Link 
                            to={`/accessories?category=${encodeURIComponent(megaActiveCategory.name)}`}
                            onClick={closeMenus}
                            className="inline-flex items-center gap-2 text-[#c9a35b] text-[12px] font-bold tracking-[0.15em] uppercase hover:text-white transition-colors"
                          >
                            Shop All {megaActiveCategory.name} <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`mobile-drawer ${mobileOpen ? "open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <button
          className="drawer-scrim"
          type="button"
          aria-label="Close menu"
          onClick={closeMenus}
        />
        <div className="drawer-panel flex flex-col h-full bg-[#111]">
          <div className="drawer-head flex items-center justify-between shrink-0 bg-[#0a0a0a] z-10 relative shadow-md">
            {currentNav.view !== 'root' ? (
              <button onClick={popNav} className="flex items-center text-white py-2 pr-4 font-medium hover:text-[#c9a35b] transition-colors -ml-1">
                <ChevronLeft size={22} className="mr-1" />
                Back
              </button>
            ) : (
              <Link
                to="/"
                onClick={closeMenus}
                className="inline-flex items-center"
              >
                <img
                  src="/logo.png"
                  alt="The Grand Store"
                  className="h-8 w-auto object-contain sm:h-10 md:h-[46px]"
                />
              </Link>
            )}
            <IconButton label="Close menu" onClick={closeMenus}>
              <X size={23} />
            </IconButton>
          </div>
          
          <div className="flex-1 relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentNav.view + (currentNav.data?.name || '') + (currentNav.data?.item || '')}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute inset-0 overflow-y-auto flex flex-col custom-scrollbar pb-10"
              >
                {currentNav.view === 'root' && (
                  <>
                    <div
                      className="mobile-search-container relative mt-4"
                      ref={mobileSearchRef}
                    >
                      <form
                        className="mobile-search mx-5"
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (mobileSearchQuery.trim()) {
                            navigate(
                              `/shop?search=${encodeURIComponent(mobileSearchQuery)}`,
                            );
                            closeMenus();
                          }
                        }}
                      >
                        <Search size={18} />
                        <input
                          aria-label="Search"
                          placeholder="Search the cellar"
                          value={mobileSearchQuery}
                          onChange={(e) => setMobileSearchQuery(e.target.value)}
                        />
                      </form>
                      <AnimatePresence>
                        {mobileSearchQuery.trim() && mobileSearchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-5 right-5 mt-2 bg-[#1a1a1a] border border-[#333] shadow-xl z-[100] rounded-sm overflow-hidden"
                          >
                            {mobileSearchResults.map((product) => (
                              <Link
                                key={product.id || product._id}
                                to={`/product/${product.slug || product.id || product._id}`}
                                className="flex items-center justify-between p-3 border-b border-[#333] hover:bg-[#2a2a2a] transition-colors last:border-b-0"
                                onClick={() => {
                                  setMobileSearchQuery("");
                                  closeMenus();
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-10 bg-black flex items-center justify-center rounded border border-[#333] overflow-hidden shrink-0">
                                    {product.image ? (
                                      <img
                                        src={product.image}
                                        alt={product.name}
                                        className="max-w-full max-h-full object-contain"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-[#222]"></div>
                                    )}
                                  </div>
                                  <span
                                    className="text-sm text-[#eee] truncate"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-white ml-4 shrink-0">
                                  <Price amount={product.price} />
                                </span>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="drawer-links mt-2">
                      <button
                        type="button"
                        className="drawer-locale-link"
                        onClick={() => pushNav('locale')}
                      >
                        <span className="drawer-locale-link-icon" aria-hidden="true">
                          {selectedCountryOption && <LocaleIcon option={selectedCountryOption} />}
                        </span>
                        <span className="drawer-locale-link-copy">
                          <strong>Change country &amp; currency</strong>
                          <small>{selectedCountryOption?.label || "South Africa"} &middot; {currency || "ZAR"}</small>
                        </span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                      <Link to="/" onClick={closeMenus}>
                        Home
                      </Link>
                      <a role="button" className="flex items-center justify-between w-full text-left cursor-pointer" onClick={() => pushNav('shop')}>
                        <span>Shop</span><ChevronRight size={16} className="text-[#666]"/>
                      </a>
                      <a
                        role="button"
                        className="flex items-center justify-between w-full text-left cursor-pointer"
                        onClick={() => {
                          const wine = dynamicMenuCategories.find((category) => category.name.toLowerCase() === 'wine');
                          if (wine) pushNav('category', wine);
                          else {
                            closeMenus();
                            navigate('/shop?category=Wine');
                          }
                        }}
                      >
                        <span>Wine</span><ChevronRight size={16} className="text-[#666]"/>
                      </a>
                      <Link to="/offers" onClick={closeMenus}>
                        Offers
                      </Link>
                      <Link to="/auction" onClick={closeMenus} className="flex items-center justify-between">
                        <span>Auction</span>
                        {hasLiveAuction && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                              LIVE
                            </span>
                          </span>
                        )}
                      </Link>
                      <a role="button" className="flex items-center justify-between w-full text-left text-[#f0cf76] cursor-pointer" onClick={() => pushNav('accessories')}>
                        <span>Accessories</span><ChevronRight size={16} className="text-[#666]"/>
                      </a>
                      <Link
                        to="/events"
                        onClick={closeMenus}
                        className="font-bold text-[#f0cf76]"
                      >
                        Events
                      </Link>
                      <Link to="/vendor-portal" onClick={closeMenus}>
                        Sell on The Grand Store
                      </Link>

                      <Link
                        to="/global-wines"
                        onClick={closeMenus}
                        className="text-[#f0cf76] font-bold inline-flex items-center gap-2"
                      >
                        <ProteaEmblem className="w-4 h-4 text-[#caa458]" />
                        <span>Global Wines</span>
                      </Link>
                      <Link to="/customer/wishlist" onClick={closeMenus}>
                        Wishlist
                      </Link>
                    </div>
                  </>
                )}

                {currentNav.view === 'locale' && (
                  <section className="drawer-locale-page" aria-labelledby="drawer-locale-title">
                    <div className="drawer-locale-page-heading">
                      <span>Shopping preferences</span>
                      <h2 id="drawer-locale-title">Country &amp; currency</h2>
                      <p>Choose where you are shopping and how you would like prices displayed.</p>
                    </div>
                    <div className="drawer-locale-page-fields">
                      <div className="drawer-locale-field">
                        <span className="drawer-locale-label">Country</span>
                        <LocaleSelector
                          ariaLabel="Shopping country"
                          value={geoLoading ? "FETCHING" : (country_code || "ZA")}
                          options={geoLoading ? [{ value: "FETCHING", label: "Fetching...", flagCode: "ZA" }] : countryOptions}
                          onChange={changeCountry}
                          searchPlaceholder="Search countries..."
                          disabled={geoLoading}
                          embedded
                        />
                      </div>
                      <div className="drawer-locale-field">
                        <span className="drawer-locale-label">Currency</span>
                        <LocaleSelector
                          ariaLabel="Display currency"
                          value={currencyLoading || geoLoading ? "FETCHING" : (currency || "ZAR")}
                          options={currencyLoading || geoLoading ? [{ value: "FETCHING", label: "Fetching...", icon: '¤' }] : currencyOptions}
                          onChange={changeCurrency}
                          searchPlaceholder="Search currencies..."
                          disabled={currencyLoading || geoLoading}
                          embedded
                        />
                      </div>
                    </div>
                  </section>
                )}

                {currentNav.view === 'shop' && (
                  <div className="drawer-links pt-2">
                    <div className="px-5 mb-4 border-b border-white/10 pb-4">
                      <h2 className="text-2xl font-serif text-white">Shop the cellar</h2>
                    </div>
                    <Link to="/shop" onClick={closeMenus} className="text-[#c9a35b] font-bold text-sm tracking-widest uppercase pb-2 block">
                      View All Shop Items <ArrowRight size={14} className="inline ml-1" />
                    </Link>
                    {dynamicMenuCategories.map(cat => (
                      <a role="button" key={cat.name} className="flex items-center justify-between w-full text-left cursor-pointer" onClick={() => pushNav('category', cat)}>
                        <span>{cat.name}</span><ChevronRight size={16} className="text-[#666]"/>
                      </a>
                    ))}
                  </div>
                )}

                {currentNav.view === 'accessories' && (
                  <div className="drawer-links pt-2">
                    <div className="px-5 mb-4 border-b border-white/10 pb-4">
                      <h2 className="text-2xl font-serif text-[#f0cf76]">Accessories</h2>
                    </div>
                    <Link to="/accessories" onClick={closeMenus} className="text-[#c9a35b] font-bold text-sm tracking-widest uppercase pb-2 block">
                      View All Accessories <ArrowRight size={14} className="inline ml-1" />
                    </Link>
                    {dynamicAccessoryCategories.map(cat => (
                      <a role="button" key={cat.name} className="flex items-center justify-between w-full text-left cursor-pointer" onClick={() => pushNav('category', cat)}>
                        <span>{cat.name}</span><ChevronRight size={16} className="text-[#666]"/>
                      </a>
                    ))}
                  </div>
                )}

                {currentNav.view === 'category' && (() => {
                  const catName = currentNav.data.name;
                  const isAccessory = currentNav.data.isAccessory;
                  if (isAccessory) {
                    return (
                      <div className="drawer-links pt-2">
                        <div className="px-5 mb-4 border-b border-white/10 pb-4">
                          <h2 className="text-2xl font-serif text-white">{catName}</h2>
                        </div>
                        <Link to={`/accessories?category=${encodeURIComponent(catName)}`} onClick={closeMenus} className="text-[#c9a35b] font-bold text-sm tracking-widest uppercase pb-2 block">
                          Shop All {catName} <ArrowRight size={14} className="inline ml-1" />
                        </Link>
                        {currentNav.data.groups.map(group => (
                          <div key={group.title} className="mb-4">
                            <h3 className="px-5 text-[#888] text-xs font-bold tracking-widest uppercase mb-1 mt-4">{group.title}</h3>
                            {group.items.map(item => (
                              <a role="button" key={item} className="flex items-center justify-between w-full text-left !py-3.5 !text-[15px] border-b border-white/5 cursor-pointer" onClick={() => pushNav('products_old', { category: currentNav.data, item })}>
                                <span className="text-[#ddd]">{item}</span><ChevronRight size={14} className="text-[#555]"/>
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  const categoryProducts = products.filter(p => getProductCategory(p) === catName);
                  const countries = Array.from(new Set(categoryProducts.map(p => p.country).filter(Boolean))).sort();
                  return (
                    <div className="drawer-links pt-2">
                      <div className="px-5 mb-4 border-b border-white/10 pb-4">
                        <h2 className="text-2xl font-serif text-white">{catName}</h2>
                      </div>
                      <Link to={`/shop?category=${encodeURIComponent(catName)}`} onClick={closeMenus} className="text-[#c9a35b] font-bold text-sm tracking-widest uppercase pb-2 block">
                        Shop All {catName} <ArrowRight size={14} className="inline ml-1" />
                      </Link>

                      <div className="mb-4">
                        <h3 className="px-5 text-[#888] text-xs font-bold tracking-widest uppercase mb-1 mt-4">Countries</h3>
                        {countries.map(country => (
                          <a role="button" key={country} className="flex items-center justify-between w-full text-left !py-3.5 !text-[15px] border-b border-white/5 cursor-pointer" onClick={() => pushNav('country', { category: catName, country })}>
                            <span className="text-[#ddd]">{getCountryDisplayName(country, catName)}</span><ChevronRight size={14} className="text-[#555]"/>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {currentNav.view === 'country' && (() => {
                  const { category, country } = currentNav.data;
                  const countryProducts = products.filter(p => getProductCategory(p) === category && p.country === country);
                  const subcategories = Array.from(new Set(countryProducts.map(p => p.subcategory).filter(Boolean))).sort();

                  return (
                    <div className="drawer-links pt-2">
                      <div className="px-5 mb-4 border-b border-white/10 pb-4">
                        <p className="text-[#888] text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">{category}</p>
                        <h2 className="text-2xl font-serif text-white">{getCountryDisplayName(country, category)}</h2>
                      </div>
                      <Link to={`/shop?category=${encodeURIComponent(category)}&country=${encodeURIComponent(country)}`} onClick={closeMenus} className="text-[#c9a35b] font-bold text-sm tracking-widest uppercase pb-2 block">
                        Shop All {getCountryDisplayName(country, category)} <ArrowRight size={14} className="inline ml-1" />
                      </Link>

                      <div className="mb-4">
                        <h3 className="px-5 text-[#888] text-xs font-bold tracking-widest uppercase mb-1 mt-4">Subcategories</h3>
                        {subcategories.map(subcat => (
                          <a role="button" key={subcat} className="flex items-center justify-between w-full text-left !py-3.5 !text-[15px] border-b border-white/5 cursor-pointer" onClick={() => pushNav('subcategory', { category, country, subcategory: subcat })}>
                            <span className="text-[#ddd]">{subcat}</span><ChevronRight size={14} className="text-[#555]"/>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {currentNav.view === 'subcategory' && (() => {
                  const { category, country, subcategory } = currentNav.data;
                  const subcatProducts = products.filter(p => getProductCategory(p) === category && p.country === country && p.subcategory === subcategory);
                  const brands = Array.from(new Set(subcatProducts.map(p => p.brand).filter(Boolean))).sort();

                  return (
                    <div className="drawer-links pt-2">
                      <div className="px-5 mb-4 border-b border-white/10 pb-4">
                        <p className="text-[#888] text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">{getCountryDisplayName(country, category)}</p>
                        <h2 className="text-2xl font-serif text-white">{subcategory}</h2>
                      </div>
                      <Link to={`/shop?category=${encodeURIComponent(category)}&country=${encodeURIComponent(country)}&subcategory=${encodeURIComponent(subcategory)}`} onClick={closeMenus} className="text-[#c9a35b] font-bold text-sm tracking-widest uppercase pb-2 block">
                        Shop All {subcategory} <ArrowRight size={14} className="inline ml-1" />
                      </Link>

                      <div className="mb-4">
                        <h3 className="px-5 text-[#888] text-xs font-bold tracking-widest uppercase mb-1 mt-4">Brands</h3>
                        {brands.map(brand => (
                          <a role="button" key={brand} className="flex items-center justify-between w-full text-left !py-3.5 !text-[15px] border-b border-white/5 cursor-pointer" onClick={() => pushNav('brand', { category, country, subcategory, brand })}>
                            <span className="text-[#ddd]">{brand}</span><ChevronRight size={14} className="text-[#555]"/>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {currentNav.view === 'brand' && (() => {
                  const { category, country, subcategory, brand } = currentNav.data;
                  const brandProducts = products.filter(p => getProductCategory(p) === category && p.country === country && p.subcategory === subcategory && p.brand === brand);

                  return (
                    <div className="drawer-links pt-2 pb-6">
                      <div className="px-5 mb-4 border-b border-white/10 pb-4">
                        <p className="text-[#888] text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">{subcategory}</p>
                        <h2 className="text-xl font-serif text-white">{brand}</h2>
                      </div>
                      <Link to={`/shop?category=${encodeURIComponent(category)}&country=${encodeURIComponent(country)}&subcategory=${encodeURIComponent(subcategory)}&brand=${encodeURIComponent(brand)}`} onClick={closeMenus} className="text-[#c9a35b] font-bold text-sm tracking-widest uppercase pb-2 block mb-4">
                        Shop all {brand} <ArrowRight size={14} className="inline ml-1" />
                      </Link>

                      <div className="px-5 flex flex-col gap-5 mt-2">
                        {brandProducts.slice(0, 8).map(p => (
                          <Link key={p.id || p._id} to={`/product/${p.slug || p.id || p._id}`} onClick={closeMenus} className="flex items-center gap-4 !p-0 !border-0 group !bg-transparent hover:!bg-transparent">
                             <div className="w-[60px] h-[75px] bg-[#1a1a1a] rounded overflow-hidden shrink-0 border border-white/10 group-hover:border-white/30 transition-colors flex items-center justify-center">
                               {p.image ? <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain p-1" /> : <div className="w-full h-full bg-[#222]"></div>}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1 truncate">{p.brand}</p>
                               <h4 className="text-[#eee] text-[13px] line-clamp-2 leading-snug group-hover:text-[#c9a35b] transition-colors font-medium">{p.name}</h4>
                               <p className="text-white font-bold text-[13px] mt-1.5"><Price amount={p.price}/></p>
                             </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {currentNav.view === 'products_old' && (() => {
                  const { category, item } = currentNav.data;
                  const matchedProducts = products.filter(p => p.brand === item || p.subcategory === item).slice(0, 8);
                  const isAccessory = category.isAccessory;
                  return (
                    <div className="drawer-links pt-2 pb-6">
                      <div className="px-5 mb-4 border-b border-white/10 pb-4">
                        <p className="text-[#888] text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">{category.name}</p>
                        <h2 className="text-xl font-serif text-white">{item}</h2>
                      </div>
                      <Link to={`/${isAccessory ? 'accessories' : 'shop'}?category=${encodeURIComponent(category.name)}&${isAccessory ? 'subcategory' : 'search'}=${encodeURIComponent(item)}`} onClick={closeMenus} className="text-[#c9a35b] font-bold text-sm tracking-widest uppercase pb-2 block mb-4">
                        Shop all {item} <ArrowRight size={14} className="inline ml-1" />
                      </Link>
                      
                      <div className="px-5 flex flex-col gap-5 mt-2">
                        {matchedProducts.map(p => (
                          <Link key={p.id || p._id} to={`/product/${p.slug || p.id || p._id}`} onClick={closeMenus} className="flex items-center gap-4 !p-0 !border-0 group !bg-transparent hover:!bg-transparent">
                             <div className="w-[60px] h-[75px] bg-[#1a1a1a] rounded overflow-hidden shrink-0 border border-white/10 group-hover:border-white/30 transition-colors flex items-center justify-center">
                               {p.image ? <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain p-1" /> : <div className="w-full h-full bg-[#222]"></div>}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-[#888] text-[10px] uppercase tracking-wider mb-1 truncate">{p.brand}</p>
                               <h4 className="text-[#eee] text-[13px] line-clamp-2 leading-snug group-hover:text-[#c9a35b] transition-colors font-medium">{p.name}</h4>
                               <p className="text-white font-bold text-[13px] mt-1.5"><Price amount={p.price}/></p>
                             </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="drawer-foot bg-[#0a0a0a] border-t border-white/10 shrink-0 z-10"
            onClick={() => {
              closeMenus();
              if (!user) {
                navigate("/login");
              } else if (["admin", "super_admin", "accountant", "product_manager"].includes(user.role)) {
                navigate("/admin/auctions");
              } else if (["vendor_active", "vendor", "vendor_pending"].includes(user.role)) {
                navigate("/vendor/dashboard");
              } else if (user.role === "vendor_approved_unpaid") {
                navigate("/vendor/payment");
              } else if (user.role === "auction_host") {
                navigate("/auction-manager/dashboard");
              } else if (user.role === "event_host") {
                navigate("/event-manager/dashboard");
              } else {
                navigate("/customer/profile");
              }
            }}
          >
            <CircleUserRound
              size={18}
              className={user ? "text-gold-gradient" : ""}
            />
            {user
              ? `Welcome back, ${user.name}`
              : "Sign in to your private account"}
          </div>
        </div>
      </div>
    </div>
  );
}
