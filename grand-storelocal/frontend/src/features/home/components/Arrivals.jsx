import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, Search, SlidersHorizontal, Heart, ShoppingBag, 
  CreditCard, GitCompareArrows, Store 
} from "lucide-react";
import { useProducts } from "../../../context/ProductContext";
import { useWishlist } from "../../../wishlistContext";
import Price from "../../../components/ui/Price";
import ConfirmCheckoutModal from "../../../components/modals/ConfirmCheckoutModal";
import IconButton from "../../../components/IconButton";
import ProductQuickView from "../../../components/ProductQuickView";
import ArrivalsMandala from "./ArrivalsMandala";
import TribalCardBorder from "./TribalCardBorder";
import ProteaEmblem from "./ProteaEmblem";
import CardChakra from "./CardChakra";
import { isSouthAfricanProduct } from "../../../utils/productTaxonomy";

const ROTATION_INTERVAL_MS = 8000;

const preparedVendorImages = {
  "/uploads/images-1787292711461.png": "/assets/products/vendor/whisky-tona-full.png",
};

const resolveImageUrl = (src) => {
  if (!src) return "";
  const normalizedSrc = String(src).replace(/\\/g, "/");

  const prepared = Object.entries(preparedVendorImages).find(([uploadPath]) =>
    normalizedSrc.includes(uploadPath),
  )?.[1];
  if (prepared) return prepared;

  if (
    normalizedSrc.startsWith("http://") ||
    normalizedSrc.startsWith("https://")
  ) {
    if (
      normalizedSrc.includes("res.cloudinary.com") &&
      normalizedSrc.includes("/grandstore-uploads/") &&
      normalizedSrc.includes("/image/upload/") &&
      !normalizedSrc.includes("/e_trim")
    ) {
      return normalizedSrc.replace(
        "/image/upload/",
        "/image/upload/e_trim:10/",
      );
    }
    return normalizedSrc;
  }

  if (normalizedSrc.includes("uploads/")) {
    const apiUrl = import.meta.env.VITE_API_URL || "https://api.grandstoreglobal.com";
    const cleanPath = normalizedSrc.substring(
      normalizedSrc.indexOf("uploads/"),
    );
    return `${apiUrl.replace(/\/$/, "")}/${cleanPath}`;
  }

  return normalizedSrc;
};

// 5 Authentic South African Showcase Bottles from our real store catalog
const REAL_SA_SHOWCASE = [
  {
    id: "wine_04_king_moremoholo_mopeli_750ml",
    slug: "wine_04_king_moremoholo_mopeli_750ml",
    name: "King Moremoholo Mopeli 750ml",
    category: "Wine",
    price: 1560,
    badge: "ESTATE RELEASE",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1788160629/grand-store/products/wine-grandstore/king-moremoholo-mopeli.png",
    brand: "Luc Mo Wines",
    origin: "Stellenbosch, South Africa",
    description: "Heritage royal South African red wine celebrating royal Basotho lineage, crafted from premium selected estate vineyards."
  },
  {
    id: "wine_09_queen_mother_mathokoana_mopeli_chardonnay_750ml",
    slug: "wine_09_queen_mother_mathokoana_mopeli_chardonnay_750ml",
    name: "Queen Mother Mathokoana Mopeli Chardonnay 750ml",
    category: "Wine",
    price: 1530,
    badge: "CAPE RESERVE",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1788160634/grand-store/products/wine-grandstore/queen-mother-mathokoana-mopeli.png",
    brand: "Luc Mo Wines",
    origin: "Stellenbosch, South Africa",
    description: "Refined South African Chardonnay with notes of toasted brioche, citrus blossom, and elegant mineral acidity."
  },
  {
    id: "wine_25_graham_beck_brut_cap_classique_750ml",
    slug: "wine_25_graham_beck_brut_cap_classique_750ml",
    name: "Graham Beck Brut Cap Classique 750ml",
    category: "Cap Classique",
    price: 329,
    badge: "CAP CLASSIQUE",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1788160626/grand-store/products/wine-grandstore/de-pizan-non-alcoholic-sparkling-white-750-ml.png",
    brand: "Graham Beck",
    origin: "Robertson, South Africa",
    description: "Iconic South African Méthode Cap Classique crafted with Chardonnay and Pinot Noir, delivering fine persistent mousse and brioche notes."
  },
  {
    id: "prod_1787654844395_592",
    slug: "prod_1787654844395_592",
    name: "Metanoia Klein Karoo Single Malt Whisky 750ml",
    category: "Whisky",
    price: 1608.85,
    badge: "KAROO SINGLE MALT",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1787994912/grand-store/catalog-originals/prod-1787654844395-592.png",
    brand: "Metanoia",
    origin: "Klein Karoo, South Africa",
    description: "Handcrafted South African single malt whisky from the Klein Karoo, matured in exceptional casks under the African sun."
  },
  {
    id: "66280aa8-0ecd-4a9c-8ca0-3086a068caef",
    slug: "66280aa8-0ecd-4a9c-8ca0-3086a068caef",
    name: "Inverroche Strata 750ml",
    category: "Gin",
    price: 2873.85,
    badge: "FYNBOS BOTANICAL",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1787994800/grand-store/catalog-originals/66280aa8-0ecd-4a9c-8ca0-3086a068caef.png",
    brand: "Inverroche",
    origin: "Still Bay, South Africa",
    description: "Pioneering South African artisanal fynbos gin infused with indigenous coastal botanicals from the Southern Cape.",
    hasSparkle: true
  }
];

const SLOT_DEFINITIONS = [
  {
    badge: "ESTATE RELEASE",
    fallback: REAL_SA_SHOWCASE[0],
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      const n = String(p.name || "").toLowerCase();
      return c.includes("wine") && (n.includes("red") || n.includes("merlot") || n.includes("pinot") || n.includes("king") || n.includes("tshireletso"));
    },
  },
  {
    badge: "CAPE RESERVE",
    fallback: REAL_SA_SHOWCASE[1],
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      const n = String(p.name || "").toLowerCase();
      return c.includes("wine") && (n.includes("white") || n.includes("chardonnay") || n.includes("chenin") || n.includes("queen") || n.includes("sekhothali") || n.includes("ros"));
    },
  },
  {
    badge: "CAP CLASSIQUE",
    fallback: REAL_SA_SHOWCASE[2],
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      const n = String(p.name || "").toLowerCase();
      const sub = String(p.subcategory || "").toLowerCase();
      return (
        c.includes("champagne") ||
        c.includes("sparkling") ||
        sub.includes("sparkling") ||
        sub.includes("cap classique") ||
        n.includes("cap classique") ||
        n.includes("graham beck") ||
        n.includes("sparkling") ||
        n.includes("brut")
      );
    },
  },
  {
    badge: "KAROO SINGLE MALT",
    fallback: REAL_SA_SHOWCASE[3],
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      const n = String(p.name || "").toLowerCase();
      return (
        c.includes("whisky") ||
        c.includes("whiskey") ||
        c.includes("scotch") ||
        n.includes("whisky") ||
        n.includes("metanoia") ||
        n.includes("bain") ||
        n.includes("three ships")
      );
    },
  },
  {
    badge: "FYNBOS BOTANICAL",
    fallback: REAL_SA_SHOWCASE[4],
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      const n = String(p.name || "").toLowerCase();
      return (
        c.includes("cognac") ||
        c.includes("tequila") ||
        c.includes("brandy") ||
        c.includes("spirit") ||
        c.includes("rum") ||
        c.includes("vodka") ||
        c.includes("gin") ||
        c.includes("liqueur") ||
        n.includes("gin") ||
        n.includes("inverroche") ||
        n.includes("inzalo") ||
        n.includes("agave") ||
        n.includes("six dogs") ||
        n.includes("richelieu") ||
        n.includes("triple three") ||
        n.includes("lady eclipse")
      );
    },
  },
];

export default function Arrivals({ onAdd, onWish, onCompare, compareItems }) {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { isWishlisted } = useWishlist();
  
  const sectionRef = useRef(null);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activeCheckoutProduct, setActiveCheckoutProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Filter approved non-accessories and strictly authentic South African bottles
  const validProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products]
      .filter((p) => !p.vendorId || p.approvalStatus === "approved")
      .filter((p) => String(p.category || p.type || "").toLowerCase() !== "accessories")
      .filter((p) => {
        const n = String(p.name || "").toLowerCase();
        return !n.includes("demo product") && !String(p.id || "").startsWith("arrival-");
      })
      .filter(isSouthAfricanProduct)
      .sort((a, b) => {
        const first = new Date(a.createdAt || a.updatedAt || 0).getTime() || 0;
        const second = new Date(b.createdAt || b.updatedAt || 0).getTime() || 0;
        return second - first;
      });
  }, [products]);

  // Map products into 5 category buckets guaranteed to use only real products
  const categoryBuckets = useMemo(() => {
    return SLOT_DEFINITIONS.map((def, idx) => {
      const matches = validProducts.filter((p) => def.match(p));
      if (matches.length > 0) return matches;
      if (validProducts[idx]) return [validProducts[idx]];
      if (validProducts.length > 0) return [validProducts[idx % validProducts.length]];
      return [def.fallback];
    });
  }, [validProducts]);

  // IntersectionObserver to only rotate when in viewport (fixes lag)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: "100px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Passive scroll listener: pause rotation timer during scroll to prevent stutter
  useEffect(() => {
    let scrollTimeout = null;
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  // Smooth rotation timer: only ticks when in view, not scrolling, and not hovered
  useEffect(() => {
    const hasMultipleInAnyBucket = categoryBuckets.some((b) => b.length > 1);
    if (!hasMultipleInAnyBucket || !isInView || isScrolling || isHovered || activeCheckoutProduct || quickViewProduct) {
      return;
    }

    const timer = setInterval(() => {
      setRotationIndex((prev) => prev + 1);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [categoryBuckets, isInView, isScrolling, isHovered, activeCheckoutProduct]);

  // Compute the current 5 products — 100% authentic, existing items
  const currentSlots = useMemo(() => {
    return SLOT_DEFINITIONS.map((def, idx) => {
      const bucket = categoryBuckets[idx];
      const product = (bucket && bucket.length > 0)
        ? bucket[rotationIndex % bucket.length] 
        : (validProducts[idx] || def.fallback);
      return {
        product: product || def.fallback,
        badge: def.badge,
        hasSparkle: idx === 4
      };
    });
  }, [categoryBuckets, rotationIndex, validProducts]);

  const handleOpenCheckout = useCallback((product) => {
    setActiveCheckoutProduct(product);
  }, []);

  return (
    <section
      className="arrivals-section showcase-section relative w-full bg-[#0a0c0e] text-white pt-4 pb-6 md:pt-6 md:pb-8 overflow-hidden select-none"
      id="arrivals"
      ref={sectionRef}
      style={{ contain: "layout paint" }}
    >
      {/* 1. African Sun / Mandala Background Vector Engraving Art (Top-Right) */}
      <ArrivalsMandala />

      <div className="shell relative z-10 max-w-[1520px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* 2. Section Header Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-5 md:mb-7 gap-4 relative">
          
          {/* Left: Eyebrow with King Protea + Main Headline + Subtitle */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#caa458]">
                CAPE WINELANDS & ESTATE CELLAR
              </span>
              <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
            </div>

            <h2 
              className="text-4xl sm:text-5xl lg:text-[54px] font-normal tracking-[-0.02em] leading-tight m-0 text-white font-serif"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Cape Winelands <span className="text-[#caa458]">Releases</span>
            </h2>

            <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#a0a4a8] mt-3.5 mb-5 max-w-md font-sans">
              Handcrafted across Stellenbosch, Franschhoek, Robertson, and the Klein Karoo. Meet the exceptional South African estate vintages and artisanal spirits our curators cannot stop talking about.
            </p>

            <Link 
              to="/shop" 
              className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#caa458] hover:text-[#f7e1a0] transition-colors group"
            >
              <span>EXPLORE CAPE CELLAR</span>
              <span className="text-[14px] group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

        </div>

        {/* 3. The 5 Luxury Cards Rail with Full E-Commerce Functionality & Golden Tint Touch */}
        <div
          className="tequila-product-rail"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {currentSlots.map(({ product, badge, hasSparkle }, index) => {
            const productId = product.id || product._id;
            const productHref = `/product/${product.slug || productId}`;
            const productImage = resolveImageUrl(product.image);

            const wishlisted = isWishlisted ? isWishlisted(product) : false;
            const isCompared = compareItems?.some(
              (item) => (item.id || item._id) === productId
            );

            return (
              <div
                key={`${productId}-${index}`}
                className="arrival-luxury-card product-card group relative flex flex-col justify-between bg-gradient-to-b from-[#212529] via-[#16181b] to-[#0c0e10] border border-white/[0.09] hover:border-[#caa458]/60 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.9),0_0_28px_rgba(202,164,88,0.2)]"
                style={{ willChange: "transform", transform: "translateZ(0)" }}
              >
                {/* Top Badge */}
                <div className="pt-3.5 px-3.5 z-10 flex items-start">
                  <span className="text-[10px] sm:text-[10.5px] font-semibold tracking-[0.2em] uppercase px-2 py-0.5 rounded-sm border border-[#caa458]/35 bg-black/60 text-[#caa458]">
                    {badge}
                  </span>
                </div>

                {/* Quick Actions (Compare, Wishlist, Quick View) matching ProductCard */}
                <div className="quick-actions">
                  {onCompare && (
                    <IconButton
                      className={isCompared ? "compare-action-active" : ""}
                      label={
                        isCompared
                          ? `View ${product.name} in comparison`
                          : `Compare ${product.name}`
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCompare(product);
                      }}
                    >
                      <GitCompareArrows size={17} />
                    </IconButton>
                  )}

                  {onWish && (
                    <IconButton
                      className={wishlisted ? "wishlist-action-active" : ""}
                      label={
                        wishlisted
                          ? `Remove ${product.name} from wishlist`
                          : `Add ${product.name} to wishlist`
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onWish(product);
                      }}
                    >
                      <Heart size={17} fill={wishlisted ? "currentColor" : "none"} />
                    </IconButton>
                  )}

                  <IconButton
                    label={`Quick view ${product.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuickViewProduct(product);
                    }}
                  >
                    <Search size={17} />
                  </IconButton>
                </div>

                {/* Center Bottle Stage with Authentic Golden Radial Spotlight & Floor Glow */}
                <Link
                  to={productHref}
                  className="relative w-full h-[225px] sm:h-[235px] md:h-[245px] flex items-center justify-center px-3 py-2 z-10 my-0.5 group-hover:scale-105 transition-transform duration-500"
                >
                  {/* 1. Golden Radial Halo Spotlight behind bottle */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(246, 241, 231, 0.35) 0%, rgba(225, 189, 112, 0.22) 38%, rgba(201, 163, 91, 0.1) 60%, transparent 78%)'
                    }}
                  />

                  {/* 2. Golden Sacred Chakra Sunburst Aura behind bottle */}
                  <CardChakra />

                  {/* 3. Golden Floor Glow beneath bottle */}
                  <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/5 h-6 rounded-full pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'rgba(219, 166, 73, 0.22)',
                      filter: 'blur(16px)'
                    }}
                  />
                  
                  <img
                    src={productImage}
                    alt={product.name}
                    className="max-h-[195px] md:max-h-[210px] w-auto max-w-[88%] object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:-translate-y-2 relative z-10"
                    loading={index === 0 ? "eager" : "lazy"}
                  />

                  {/* Subtle 4-point sparkle accent on Slot 5 matching mockup */}
                  {hasSparkle && (
                    <div className="absolute right-4 bottom-5 pointer-events-none text-[#d6dadf] opacity-80 animate-pulse z-20">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                      </svg>
                    </div>
                  )}
                </Link>

                {/* Product Info Description Area matching ProductCard hierarchy with our luxury design */}
                <div className="product-info relative z-10 flex flex-col flex-1 justify-between p-4 sm:p-4.5 border-t border-white/[0.07] bg-[#121417]/40 text-left">
                  <div>
                    {/* Category */}
                    <p className="product-category m-0 mb-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-[#caa458] truncate">
                      {product.category || product.type || "Cellar Selection"}
                    </p>
                    
                    {/* Title */}
                    <h3 className="m-0 font-serif text-[17px] sm:text-[18px] font-medium leading-[1.25] text-[#f4f4f4] hover:text-[#caa458] transition-colors line-clamp-2 min-h-[44px]">
                      <Link to={productHref} title={product.name}>
                        {product.name}
                      </Link>
                    </h3>

                    {/* Brand / Origin */}
                    <p className="product-origin text-[11.5px] text-[#8f959e] m-0 mt-1 mb-2 truncate">
                      {product.brand || product.origin || "Estate Bottled • Western Cape"}
                    </p>

                    {/* Store Name / Tag */}
                    {product.storeName && product.storeId && (
                      <Link
                        to={`/store/${product.storeId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[10.5px] text-[#caa458] font-semibold tracking-wider uppercase mb-2 hover:underline"
                      >
                        <Store size={11} />
                        <span className="truncate max-w-[140px]">{product.storeName}</span>
                      </Link>
                    )}
                  </div>

                  {/* Buy Section: Price + Dual Add/Checkout Action Buttons */}
                  <div className="product-buy-section flex flex-col gap-2.5 mt-2.5 pt-2.5 border-t border-white/[0.06]">
                    <strong className="text-[17px] sm:text-[18px] font-bold text-white tracking-wide block font-sans">
                      <Price amount={product.price} />
                    </strong>

                    <div className="flex items-center gap-2 w-full">
                      {/* Add to Bag Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onAdd) onAdd(product);
                        }}
                        className="flex-1 py-2 px-2.5 rounded bg-white/5 hover:bg-white/15 border border-white/15 hover:border-[#caa458]/50 text-white text-[10.5px] font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        title={`Add ${product.name} to bag`}
                      >
                        <ShoppingBag size={13} />
                        <span>Add</span>
                      </button>

                      {/* Golden Checkout Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenCheckout(product);
                        }}
                        className="flex-1 py-2 px-2.5 rounded bg-[#caa458] hover:bg-[#d8b566] border border-[#caa458] text-black font-bold text-[10.5px] tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_2px_12px_rgba(202,164,88,0.35)] hover:shadow-[0_3px_15px_rgba(202,164,88,0.5)] cursor-pointer"
                        title={`Instant checkout for ${product.name}`}
                      >
                        <CreditCard size={13} />
                        <span>Checkout</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Authentic South African Tribal Geometric Gold Border Strip */}
                <TribalCardBorder />
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe / Explore Indicator */}
        <p className="flex md:hidden items-center justify-center gap-2 text-[11px] text-white/50 tracking-wider uppercase mt-6">
          <ArrowRight size={13} /> Swipe to explore collection
        </p>

      </div>

      {/* Shared Checkout Modal for 1-Click Buy Flow (Zero Lag Portal) */}
      {activeCheckoutProduct && (
        <ConfirmCheckoutModal 
          isOpen={Boolean(activeCheckoutProduct)} 
          onClose={() => setActiveCheckoutProduct(null)} 
          product={activeCheckoutProduct}
          initialQuantity={1}
          selectedOption={activeCheckoutProduct.options?.[0] || "Pack of 1"}
          onAddToCart={(prod, qty, opt, openCart) => {
            if (onAdd) onAdd(prod, qty, opt, openCart);
            setActiveCheckoutProduct(null);
          }}
          onProceed={(prod, qty, opt) => {
            if (onAdd) onAdd(prod, qty, opt, false);
            setActiveCheckoutProduct(null);
            navigate('/customer/checkout');
          }}
        />
      )}

      {/* Product Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAdd={onAdd}
        />
      )}
    </section>
  );
}
