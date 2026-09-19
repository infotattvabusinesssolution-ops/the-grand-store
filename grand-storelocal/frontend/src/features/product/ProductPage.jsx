import { useProducts } from "../../context/ProductContext";
import React, { useState, useEffect } from "react";
import SEO from "../../components/SEO";
import { Link, Navigate, useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Heart,
  Link2,
  ArrowRight,
  X,
  Truck,
  ShieldCheck,
  Package,
  Clock,
  Globe,
  Sparkles,
} from "lucide-react";
import { useWishlist } from "../../wishlistContext";
import { useGeoLocation } from "../../context/LocationContext";
import ProductCard from "../../components/ProductCard";
import TrustBadges from "../../components/social/TrustBadges";
import ReviewSection from "../../components/social/ReviewSection";
import ProductQnA from "../../components/social/ProductQnA";
import ExpertReviewCard from "../../components/social/ExpertReviewCard";
import Price from "../../components/ui/Price";
import { getProductIdentity, isSouthAfricanProduct } from "../../utils/productTaxonomy";
import api from "../../api";
import ConfirmCheckoutModal from "../../components/modals/ConfirmCheckoutModal";
import SpringbokCrest from "./components/SpringbokCrest";
import TribalSideWatermark from "./components/TribalSideWatermark";
import TribalDivider from "./components/TribalDivider";
import ProteaEmblem from "../home/components/ProteaEmblem";

const preparedVendorImages = {
  '/uploads/images-1787292711461.png': '/assets/products/vendor/whisky-tona-full.png',
};

const resolveImageUrl = (src) => {
  if (!src) return '';
  const normalizedSrc = String(src).replace(/\\/g, '/');
  
  const prepared = Object.entries(preparedVendorImages)
    .find(([uploadPath]) => normalizedSrc.includes(uploadPath))?.[1];
  if (prepared) return prepared;
  
  if (normalizedSrc.startsWith('http://') || normalizedSrc.startsWith('https://')) {
    return normalizedSrc;
  }
  
  if (normalizedSrc.includes('uploads/')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.grandstoreglobal.com';
    const cleanPath = normalizedSrc.substring(normalizedSrc.indexOf('uploads/'));
    return `${apiUrl.replace(/\/$/, '')}/${cleanPath}`;
  }
  
  return normalizedSrc;
};

export default function ProductPage({ onAdd, onWish, compareItems, onNotify }) {
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const { slug } = useParams();
  const { currency, country_name } = useGeoLocation();

  const [directProduct, setDirectProduct] = useState(null);
  const [directLoading, setDirectLoading] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const matchedProduct = products.find(
    (item) =>
      item.slug === slug ||
      item.id === slug ||
      item.id === Number(slug) ||
      item._id === slug
  );

  const product = matchedProduct || directProduct;
  const { isWishlisted } = useWishlist();
  const wishlisted = product ? isWishlisted(product) : false;
  const [selectedImage, setSelectedImage] = useState(resolveImageUrl(product?.image ?? ""));
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(
    product?.options?.[0] ?? "Pack of 1",
  );

  useEffect(() => {
    if (matchedProduct) return;
    if (!slug) return;

    let cancelled = false;
    const fetchDirect = async () => {
      setDirectLoading(true);
      try {
        const res = await api.get(`/products/slugs/${encodeURIComponent(slug)}`);
        const item = res.data?.data || res.data;
        if (!cancelled && item && (item.name || item._id)) {
          setDirectProduct(item);
        }
      } catch (err) {
        try {
          const resId = await api.get(`/products/${encodeURIComponent(slug)}`);
          const item = resId.data?.data || resId.data;
          if (!cancelled && item && (item.name || item._id)) {
            setDirectProduct(item);
          }
        } catch (e) {}
      } finally {
        if (!cancelled) {
          setDirectLoading(false);
          setFetchAttempted(true);
        }
      }
    };

    fetchDirect();
    return () => {
      cancelled = true;
    };
  }, [slug, matchedProduct]);

  // For zooming/gallery
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [showCertificate, setShowCertificate] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, reviewCount: 0 });
  const [expertReview, setExpertReview] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  useEffect(() => {
    if (!product) return;

    setSelectedImage(resolveImageUrl(product.image));
    setQuantity(1);
    setSelectedOption(product.options?.[0] ?? "Pack of 1");
    setIsZoomed(false);
    setZoomOrigin("50% 50%");

    document.title = `${product.fullName || product.name} — The Grand Store`;
    window.scrollTo({ top: 0, behavior: "auto" });
    return () => {
      document.title = "The Grand Store — Luxury Wines & Spirits";
    };
  }, [product]);

  useEffect(() => {
    if (!product) return undefined;

    let cancelled = false;
    const publicProductId = product.id || product._id;
    const databaseProductId = product._id || product.id;

    setReviews([]);
    setReviewSummary({ averageRating: 0, reviewCount: 0 });
    setExpertReview(null);

    const loadSocialProof = async () => {
      const [reviewResult, expertResult] = await Promise.allSettled([
        api.get(`/social-proof/reviews/product/${encodeURIComponent(publicProductId)}`),
        api.get(`/social-proof/expert-reviews/${encodeURIComponent(databaseProductId)}`),
      ]);

      if (cancelled) return;

      if (reviewResult.status === 'fulfilled' && reviewResult.value.data?.success) {
        const payload = reviewResult.value.data;
        setReviews(Array.isArray(payload.data) ? payload.data : []);
        setReviewSummary({
          averageRating: Number(payload.averageRating) || 0,
          reviewCount: Number(payload.count) || 0,
        });
      } else if (reviewResult.status === 'rejected') {
        console.error('Failed to load product reviews:', reviewResult.reason);
      }

      if (expertResult.status === 'fulfilled' && expertResult.value.data?.success) {
        const expertReviews = expertResult.value.data.data;
        setExpertReview(Array.isArray(expertReviews) ? expertReviews[0] || null : null);
      } else if (expertResult.status === 'rejected') {
        console.error('Failed to load expert review:', expertResult.reason);
      }
    };

    loadSocialProof();
    return () => {
      cancelled = true;
    };
  }, [product?.id, product?._id]);

  if (productsLoading || directLoading || (!product && !fetchAttempted)) {
    return (
      <div className="min-h-screen bg-[#0d0907] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm tracking-widest uppercase text-amber-200/60 font-serif">Loading Vintage...</p>
        </div>
      </div>
    );
  }

  if (!product) return <Navigate to="/shop" replace />;

  const gallery = [...new Set(
    [product.image, ...(product.gallery || [])].filter(Boolean).map(resolveImageUrl)
  )].slice(0, 5);
  const selectedImageIndex = Math.max(0, gallery.indexOf(selectedImage));
  const selectAdjacentImage = (direction) => {
    if (gallery.length < 2) return;
    const nextIndex = (selectedImageIndex + direction + gallery.length) % gallery.length;
    setSelectedImage(gallery[nextIndex]);
  };
  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .slice(0, 4);
  const detailEntries = product.details ? Object.entries(product.details) : [];
  const identity = getProductIdentity(product);
  const identityItems = [
    { label: "Type", value: identity.type },
    { label: "Style", value: identity.style },
    { label: "Production", value: identity.production },
    { label: "Origin", value: identity.origin },
    { label: "Age", value: identity.age },
    { label: "Bottle Size", value: identity.bottleSize },
    { label: "ABV", value: identity.abv },
  ];
  const categoryLabel = product.category || product.type || "Collection";
  const hasDistinctStyle = identity.style &&
    identity.style.trim().toLowerCase() !== categoryLabel.trim().toLowerCase();
  const taxonomySecondary = hasDistinctStyle
    ? { label: "Style", value: identity.style }
    : { label: "Origin", value: identity.origin || product.country };

  // Dynamic Product Delivery & Provenance metadata
  const fulfillmentSource = product.vendorName
    ? product.vendorName
    : product.brand
      ? `The Grand Store Vault (${product.brand} Allocation)`
      : "The Grand Store Private Cellar";

  const provenanceOrigin = identity.origin
    || product.identity?.origin
    || product.country
    || product.origin
    || "Direct Bonded Cellars";

  const isWineOrChampagne = /champagne|wine|sparkling|prosecco|cava/i.test(
    `${product.category || ''} ${product.type || ''} ${product.name || ''}`
  );
  const isSpirits = /whisky|whiskey|cognac|brandy|vodka|gin|rum|tequila/i.test(
    `${product.category || ''} ${product.type || ''} ${product.name || ''}`
  );
  const isCigar = /cigar/i.test(
    `${product.category || ''} ${product.type || ''} ${product.name || ''}`
  );

  const packagingNote = isWineOrChampagne
    ? "Climate-stable thermal packaging with shock-proof bottle protection."
    : isCigar
      ? "Humidity-sealed protective pack maintaining optimal 69% RH freshness."
      : isSpirits
        ? "Reinforced collector-grade protective buffer for glass & luxury gift boxes."
        : "Specialized shock-absorbing luxury bottle packaging.";

  const productUrl = typeof window === "undefined" ? "" : window.location.href;
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedTitle = encodeURIComponent(product.fullName || product.name);

  const handleZoomMove = (event) => {
    // Keep function to avoid undefined reference if used in JSX, but we will remove it from JSX
  };

  const shareProduct = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (onNotify) onNotify("Product link copied");
    } catch {
      if (onNotify) onNotify("Share link ready in your address bar");
    }
  };

  // Format price
  const formattedPrice = Number(product.price).toFixed(2);

  // Define Product & Breadcrumb Schema for SEO (@graph format)
  const productCanonicalUrl = `https://grandstoreglobal.com/product/${product.slug || product._id}`;
  const categoryCanonicalUrl = `https://grandstoreglobal.com/shop?category=${encodeURIComponent(categoryLabel)}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${productCanonicalUrl}#product`,
        name: product.fullName || product.name,
        image: resolveImageUrl(product.image),
        description:
          product.description || `Buy ${product.name} at The Grand Store.`,
        sku: product.sku || product._id,
        brand: {
          "@type": "Brand",
          name: product.brand || "The Grand Store",
        },
        offers: {
          "@type": "Offer",
          url: productCanonicalUrl,
          priceCurrency: currency || "ZAR",
          price: product.price,
          priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          availability:
            product.stock === 0
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "The Grand Store",
          },
        },
        ...(reviewSummary?.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(reviewSummary.averageRating).toFixed(1),
                reviewCount: reviewSummary.reviewCount,
                bestRating: "5",
                worstRating: "1",
              },
            }
          : {}),
        additionalProperty: identityItems
          .filter((item) => item.value)
          .map((item) => ({
            "@type": "PropertyValue",
            name: item.label,
            value: item.value,
          })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://grandstoreglobal.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryLabel,
            item: categoryCanonicalUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.fullName || product.name,
            item: productCanonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0c0b09] px-4 pb-12 pt-5 text-[#eee8dd] sm:px-6 sm:pb-16 sm:pt-7 md:px-10 lg:px-14 xl:px-20 font-sans">
      <SEO
        title={product.fullName || product.name}
        description={
          product.description?.substring(0, 160) ||
          `Buy ${product.name} at The Grand Store.`
        }
        image={resolveImageUrl(product.image)}
        url={`/product/${product.slug || product._id}`}
        type="product"
        schema={productSchema}
      />

      {/* African Tribal Watermark Margins (Left & Right borders matching reference theme) */}
      <TribalSideWatermark side="left" />
      <TribalSideWatermark side="right" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Top Breadcrumbs */}
        <section className="mb-5 flex items-center gap-2.5 overflow-x-auto whitespace-nowrap pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8e877c] sm:mb-6 sm:text-[13px]">
          <Link to="/" className="hover:text-[#c9a35b] transition-colors">
            Home
          </Link>
          <span className="text-white/20">/</span>
          <Link
            to={`/shop?category=${encodeURIComponent(product.category || product.type || "")}`}
            className="max-w-[34vw] truncate hover:text-[#c9a35b] transition-colors sm:max-w-none"
          >
            {product.category || product.type || "Shop"}
          </Link>
          {product.brand && (
            <span className="contents">
              <span className="text-white/20">/</span>
              <span className="hover:text-[#c9a35b] cursor-pointer transition-colors">
                {product.brand}
              </span>
            </span>
          )}
          <span className="text-white/20">/</span>
          <span className="inline-block max-w-[42vw] truncate align-middle font-bold text-[#eee8dd] sm:max-w-none">
            {product.name}
          </span>
        </section>

        {/* Main Product Layout (2 Column Split Grid) */}
        <section className="mb-12 grid grid-cols-1 gap-8 lg:mb-16 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Product Bottle Image & Description */}
          <div className="flex min-w-0 flex-col items-center lg:col-span-5">
            {/* Bottle Pedestal Stage (Clean Dark Background with ambient contact shadow - NO heavy golden gradient) */}
            <div className="group relative flex h-[clamp(340px,110vw,500px)] w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-[#12110e]/70 p-6 sm:h-auto sm:aspect-[3/4]">
              {/* Soft contact floor shadow under the bottle */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/90 blur-xl rounded-[100%] pointer-events-none" />

              <img
                src={selectedImage}
                alt={product.fullName || product.name}
                className="relative z-10 max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => selectAdjacentImage(-1)}
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white transition-colors hover:border-[#c9a35b] hover:text-[#c9a35b]"
                    aria-label="Previous product image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAdjacentImage(1)}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white transition-colors hover:border-[#c9a35b] hover:text-[#c9a35b]"
                    aria-label="Next product image"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <span className="absolute bottom-3 right-3 z-20 rounded-full bg-black/80 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-white/70">
                    {selectedImageIndex + 1}/{gallery.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnails Underneath */}
            {gallery.length > 1 && (
              <div className="mt-4 flex w-full max-w-md snap-x gap-3 overflow-x-auto pb-2 sm:justify-center">
                {gallery.map((img) => (
                  <button
                    key={img}
                    className={`flex h-16 w-16 shrink-0 snap-start items-center justify-center rounded-lg border p-1 transition-all ${
                      selectedImage === img
                        ? "border-[#c9a35b] bg-[#c9a35b]/10 shadow-[0_0_12px_rgba(201,163,91,0.2)]"
                        : "border-white/10 bg-black/40 hover:border-white/20"
                    }`}
                    onClick={() => setSelectedImage(img)}
                    aria-label="Select gallery image"
                  >
                    <img
                      src={img}
                      alt="Thumbnail"
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Desktop Description: "About this [category]" placed underneath the bottle */}
            <div className="hidden lg:block w-full max-w-md mt-10 pt-6 border-t border-white/10 text-left">
              <h3 className="text-2xl font-serif text-[#eee8dd] mb-4 font-normal tracking-tight">
                About this {categoryLabel.toLowerCase()}
              </h3>
              <div className="space-y-4 break-words text-sm leading-relaxed text-[#a8a195] font-light">
                <p>{product.description}</p>
                {product.tastingNotes && product.tastingNotes.length > 0 && (
                  <div className="mt-5 border-t border-white/5 pt-4">
                    <strong className="block text-[#e1bd70] mb-2.5 font-serif text-base font-medium">
                      Tasting Notes
                    </strong>
                    <ul className="list-disc pl-5 space-y-1.5 marker:text-[#c9a35b]">
                      {product.tastingNotes.map((note) => (
                        <li key={note} className="text-xs sm:text-sm text-[#cac3b7]">{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Title, Identity, Pricing, Guarantee & Actions */}
          <div className="flex min-w-0 flex-col justify-start lg:col-span-7">
            {/* Top South African Springbok Gold Silhouette Crest */}
            <div className="mb-2.5 flex items-center justify-start">
              <SpringbokCrest className="w-12 h-8 text-[#c9a35b]" />
            </div>

            {/* Category & Style Badges */}
            <div className="mb-3.5 flex flex-wrap items-center gap-2.5" aria-label="Product classification">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#161512] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#8a8376]">
                Category
                <strong className="font-semibold text-[#eee8dd]">{categoryLabel}</strong>
              </span>
              {taxonomySecondary.value && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#c9a35b]/30 bg-[#c9a35b]/[0.08] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#8a8376]">
                  {taxonomySecondary.label}
                  <strong className="font-semibold text-[#e1bd70]">{taxonomySecondary.value}</strong>
                </span>
              )}
            </div>

            {/* Grand Serif Product Title */}
            <h1 className="mb-2.5 break-words font-serif text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-normal leading-[1.12] text-[#eee8dd] tracking-tight">
              {product.fullName || product.name}
            </h1>

            {/* SKU */}
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#837c70]">
              SKU: {String(product.id || product._id || product.sku).substring(0, 10).toUpperCase()}
            </div>

            {/* Pricing & Guarantee Box Row */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-4">
              {/* Left Box: Price Card */}
              <div className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#12110e] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="m-0 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#918a7f]">
                      <span className="h-3.5 w-[2px] bg-[#c9a35b]" aria-hidden="true" />
                      Price
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                        product.stock > 0 || product.stock === undefined
                          ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                          : "border-red-500/30 bg-red-950/40 text-red-400"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
                      {product.stock > 0 || product.stock === undefined ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-3">
                    <div className="text-3xl sm:text-4xl font-bold leading-none text-[#eee8dd] font-sans">
                      <Price amount={product.price * quantity} presentation="product" />
                    </div>
                    <span className="inline-flex items-center rounded-full border border-[#c9a35b]/35 bg-[#c9a35b]/10 px-2.5 py-0.5 text-[10px] font-mono text-[#c9a35b] font-medium">
                      incl. 15% VAT
                    </span>
                  </div>
                </div>

                <p className="mt-4 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-[#7a7469]">
                  15% South African VAT included <span className="mx-1.5 text-[#c9a35b]/60">•</span> Delivery calculated at checkout
                </p>
              </div>

              {/* Right Box: Grandstore Guarantee Card */}
              <button
                type="button"
                onClick={() => setShowCertificate(true)}
                className="group flex flex-col items-center justify-center rounded-lg border border-white/10 bg-[#12110e] p-5 sm:p-6 text-center transition-all hover:border-[#c9a35b]/50 hover:bg-[#c9a35b]/[0.04] cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                title="Click to view our 100% Satisfaction Guarantee Certificate"
                aria-label="View the Grandstore 100% satisfaction guarantee"
              >
                {/* Two Gold Emblems Side-by-Side: Medallion + King Protea */}
                <div className="flex items-center justify-center gap-3.5 mb-2.5">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a35b]/40 bg-gradient-to-b from-[#e1bd70]/20 to-transparent p-1 shadow-inner group-hover:scale-105 transition-transform">
                    <img
                      src="/grandstore-medallion.png"
                      alt="Guarantee Medallion"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center group-hover:scale-105 transition-transform">
                    <ProteaEmblem className="w-9 h-9 text-[#d4af37]" />
                  </div>
                </div>

                <strong className="block text-xs sm:text-[13px] font-bold uppercase tracking-[0.14em] text-[#e1bd70]">
                  Grandstore Guarantee
                </strong>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#918a7f]">
                  Shop with our 100% satisfaction promise
                </span>
              </button>
            </div>

            {/* Central African Tribal Divider */}
            <TribalDivider className="my-6" />

            {/* Bottle Identity Specification Grid */}
            <div className="mb-6">
              <h2 className="mb-4 font-serif text-2xl font-normal text-[#eee8dd] tracking-tight">
                Bottle Identity
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {identityItems.map((item) => (
                  <div className="min-w-0" key={item.label}>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#787166]">
                      {item.label}
                    </div>
                    <div className={`break-words text-sm sm:text-base font-medium leading-snug ${item.value ? "text-[#eee8dd]" : "text-[#5e584f]"}`}>
                      {item.value || "Not stated"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Select Options (if product has multiple variants) */}
            {product.options && product.options.length > 1 && (
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#918a7f]">
                  Options
                </label>
                <select
                  className="w-full bg-[#12110e] border border-white/20 text-[#eee8dd] p-3 rounded-md focus:border-[#c9a35b] outline-none transition-colors text-sm"
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                >
                  {product.options.map((option) => (
                    <option className="bg-[#0a0907]" value={option} key={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Row: Quantity + Add to Cart + Buy Now + Wishlist */}
            <div className="mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Quantity Selector */}
              <div className={`flex h-[48px] items-center border border-white/15 bg-[#141310] rounded-md px-1.5 ${product.stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                  type="button"
                  className="w-8 h-full flex items-center justify-center text-[#918a7f] hover:text-[#c9a35b] transition-colors"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={product.stock === 0}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-[#eee8dd]">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="w-8 h-full flex items-center justify-center text-[#918a7f] hover:text-[#c9a35b] transition-colors"
                  onClick={() => setQuantity((value) => value + 1)}
                  disabled={product.stock === 0 || quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                className={`h-[48px] px-7 flex-1 min-w-[130px] rounded-md bg-[#c49a50] hover:bg-[#b88e44] text-[#0f0e0c] font-bold text-xs uppercase tracking-[0.14em] transition-all shadow-md active:scale-[0.98] ${
                  product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                type="button"
                onClick={() => product.stock !== 0 && onAdd && onAdd(product, quantity, selectedOption)}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add To Cart'}
              </button>

              {/* Buy Now Button */}
              <button
                className={`h-[48px] px-8 flex-1 min-w-[130px] rounded-md bg-gradient-to-r from-[#bf9546] to-[#a27832] hover:from-[#c99f4f] hover:to-[#b0853a] text-[#0f0e0c] font-bold text-xs uppercase tracking-[0.14em] transition-all shadow-md active:scale-[0.98] ${
                  product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                type="button"
                onClick={() => {
                  if (product.stock !== 0 && onAdd) {
                    onAdd(product, quantity, selectedOption, false);
                    navigate("/customer/checkout");
                  }
                }}
                disabled={product.stock === 0}
              >
                Buy Now
              </button>

              {/* Wishlist Button */}
              <button
                className={`h-[48px] w-[48px] shrink-0 rounded-md border bg-[#141310] flex items-center justify-center transition-colors ${
                  wishlisted
                    ? "border-[#c9a35b] text-[#c9a35b]"
                    : "border-white/20 text-[#918a7f] hover:border-white/50 hover:text-white"
                }`}
                type="button"
                onClick={() => onWish && onWish(product)}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            {/* South Africa Legal Drinking Warning Banner (aware.org) */}
            <div className="mb-7 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-md border border-white/10 bg-[#0c0b09] px-4 py-3 sm:px-5">
              <a
                href="https://www.aware.org.za/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 shrink-0 hover:opacity-85 transition-opacity"
              >
                {/* #NO 18 Logo */}
                <div className="flex items-center text-[#e84c22] font-black tracking-tighter">
                  <span className="text-2xl leading-none">#N</span>
                  <div className="relative ml-0.5 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#e84c22]">
                    <span className="text-xs font-black tracking-tighter">18</span>
                    <div className="absolute h-[3px] w-full rotate-[-45deg] bg-[#e84c22]" />
                  </div>
                </div>

                {/* aware.org Logo text */}
                <div className="flex flex-col font-bold leading-tight text-white">
                  <span className="flex items-center text-[15px] tracking-tight">
                    aware
                    <span className="-mt-1 mx-[1px] text-lg text-[#e84c22]">!</span>
                    org
                  </span>
                  <span className="text-[10px] font-normal tracking-[0.12em] text-[#918a7f]">
                    www.aware.org.za
                  </span>
                </div>
              </a>

              <div className="hidden sm:block h-7 w-px bg-white/15 shrink-0" />

              {/* Warning Text */}
              <div className="text-center sm:text-left text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] text-[#eee8dd] leading-snug">
                Drink Responsibly, Not For Persons Under The Age Of 18.
              </div>
            </div>

            {/* Description Section (Mobile/Tablet display) */}
            <div className="lg:hidden mb-7 rounded-lg border border-white/10 bg-[#12110e] p-5 text-left">
              <h3 className="text-xl font-serif text-[#eee8dd] mb-3 font-normal">
                About this {categoryLabel.toLowerCase()}
              </h3>
              <div className="space-y-4 break-words text-sm leading-relaxed text-[#a8a195] font-light">
                <p>{product.description}</p>
                {product.tastingNotes && product.tastingNotes.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-3">
                    <strong className="block text-[#e1bd70] mb-2 font-serif text-sm font-medium">
                      Tasting Notes
                    </strong>
                    <ul className="list-disc pl-5 space-y-1 marker:text-[#c9a35b]">
                      {product.tastingNotes.map((note) => (
                        <li key={note} className="text-xs text-[#cac3b7]">{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery & Provenance Assurance Card */}
            <div className="mb-6 rounded-lg border border-white/10 bg-[#100f0c] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#e1bd70] m-0">
                  <Truck size={15} className="text-[#c9a35b]" />
                  Delivery & Provenance Assurance
                </h4>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {product.stock > 0 ? "Ready for Dispatch" : "Allocation Order"}
                </span>
              </div>

              {/* Provenance & Fulfillment Grid */}
              <div className="mb-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-black/40 p-3 rounded border border-white/5">
                <div className="min-w-0">
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.1em] text-[#8a8376]">
                    Fulfilled By
                  </span>
                  <span className="font-medium text-[#eee8dd] truncate block" title={fulfillmentSource}>
                    {fulfillmentSource}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.1em] text-[#8a8376]">
                    Provenance
                  </span>
                  <span className="font-medium text-[#eee8dd] truncate block" title={provenanceOrigin}>
                    {provenanceOrigin}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.1em] text-[#8a8376]">
                    Dispatch Window
                  </span>
                  <span className="font-medium text-[#e1bd70] flex items-center gap-1">
                    <Clock size={12} /> 24–48 Business Hours
                  </span>
                </div>
              </div>

              {/* Courier Delivery Timelines */}
              <div className="space-y-2 border-b border-white/10 pb-3.5">
                <span className="block text-[10px] uppercase tracking-[0.12em] text-[#8a8376]">
                  Estimated Courier Timelines
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-black/30 border border-white/5 rounded text-left">
                    <div className="flex items-center gap-1.5 text-white font-medium text-xs mb-0.5">
                      <Truck size={13} className="text-[#c9a35b]" /> SA Door Courier
                    </div>
                    <div className="text-[11px] text-[#eee8dd]/80 font-mono">2–4 Business Days</div>
                    <div className="text-[9px] text-[#8a8376] mt-0.5">The Courier Guy / Door-to-Door</div>
                  </div>

                  <div className="p-2.5 bg-black/30 border border-white/5 rounded text-left">
                    <div className="flex items-center gap-1.5 text-white font-medium text-xs mb-0.5">
                      <Package size={13} className="text-emerald-400" /> PostNet / PUDO
                    </div>
                    <div className="text-[11px] text-[#eee8dd]/80 font-mono">2–3 Business Days</div>
                    <div className="text-[9px] text-[#8a8376] mt-0.5">Counter or 24/7 Smart Locker</div>
                  </div>
                </div>
              </div>

              {/* Shipping Cost Notice & Protection */}
              <div className="pt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#8a8376] uppercase tracking-wider text-[10px] font-semibold">
                    Shipping Cost
                  </span>
                  <span className="font-semibold text-[#e1bd70] text-xs">
                    Calculated at Checkout via Live Courier API
                  </span>
                </div>
                <p className="text-[11px] text-[#8a8376] leading-relaxed m-0">
                  Live rates from The Courier Guy and PostNet are computed at checkout based on destination address, parcel volumetric weight, and insurance value.
                </p>

                {/* Protective Packaging Assurance */}
                <div className="mt-1 flex items-start gap-2 bg-[#17140f] p-2.5 rounded border border-[#c9a35b]/20 text-[11px] text-[#eee8dd]/90">
                  <ShieldCheck size={16} className="text-[#c9a35b] shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-semibold text-[#e1bd70]">100% Transit Protection Included: </span>
                    {packagingNote} Fully covered against loss, breakage, or temperature damage with adult signature verification (18+).
                  </div>
                </div>
              </div>
            </div>

            {/* Share Links */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a8376]">
              <span>Share</span>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#eee8dd] transition-colors p-1"
                aria-label="Share on Facebook"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#eee8dd] transition-colors p-1"
                aria-label="Share on Twitter"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#eee8dd] transition-colors p-1"
                aria-label="Share on WhatsApp"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.891-4.444 9.891-9.891 0-2.64-1.028-5.12-2.894-6.988-1.866-1.867-4.348-2.895-6.988-2.895-5.448 0-9.891 4.444-9.891 9.891 0 2.115.6 3.715 1.595 5.391l-1.082 3.953 4.077-1.059zm3.626-6.495c.27-.135 1.597-.789 1.845-.879.248-.09.429-.135.609.135.18.27.697.879.855 1.059.157.18.315.225.585.09.27-.135 1.14-.42 2.171-1.341.801-.715 1.343-1.598 1.5-1.868.157-.27.016-.416-.119-.551-.121-.121-.27-.315-.405-.473-.135-.157-.18-.27-.27-.45-.09-.18-.045-.337.023-.472.067-.135.609-1.467.855-2.008.239-.525.48-.452.609-.461.121-.009.27-.009.405-.009.135 0 .36.051.549.231.189.18.729.713.729 1.737 0 1.024.747 2.015.855 2.159.108.144 1.47 2.245 3.565 3.151.498.215.887.344 1.19.44.5.158.956.135 1.315.082.404-.06 1.242-.508 1.417-1.002.175-.494.175-.918.123-1.002-.051-.084-.196-.135-.466-.27l-2.05-1.005z" />
                </svg>
              </a>
              <button
                onClick={shareProduct}
                className="hover:text-[#eee8dd] transition-colors p-1"
                title="Copy Link"
                aria-label="Copy link to clipboard"
              >
                <Link2 size={20} />
              </button>
            </div>
          </div>
        </section>

        <hr className="border-white/10 mx-auto mb-10" />

      {/* Stacked Info Sections */}
      <section className="max-w-7xl mx-auto">
        {/* Fact Sheet PDF (Moved up) */}
        {product.factSheetPdf && (
          <div className="flex justify-center mb-10">
            <a
              href={product.factSheetPdf}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#c9a35b] px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-gold-gradient transition-colors hover:bg-gold-gradient hover:text-black sm:w-auto sm:px-8 sm:text-sm"
            >
              Download Official Fact Sheet PDF <ArrowRight size={16} />
            </a>
          </div>
        )}

        {/* Additional Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 py-8 border-b border-white/10">
          <div className="md:col-span-3">
            <h3 className="text-xl font-serif text-[#eee8dd]">
              Additional Info
            </h3>
          </div>
          <div className="md:col-span-9">
            <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-4">
              <div className="min-w-0 space-y-1">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#918a7f]">
                  Category
                </div>
                <div className="break-words text-base font-medium">
                  {product.category || product.type || "N/A"}
                </div>
              </div>
              <div className="min-w-0 space-y-1">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#918a7f]">
                  Brand
                </div>
                <div className="break-words text-base font-medium">
                  {product.brand || product.name}
                </div>
              </div>
              <div className="min-w-0 space-y-1">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#918a7f]">
                  Origin
                </div>
                <div className="break-words text-base font-medium">
                  {identity.origin || product.country || "N/A"}
                </div>
              </div>
              {detailEntries.map(([label, value]) => (
                <div className="min-w-0 space-y-1" key={label}>
                  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#918a7f]">
                    {label}
                  </div>
                  <div className="break-words text-base font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Engine Components */}
      <section className="mx-auto my-12 max-w-7xl sm:my-16">
        {expertReview && (
          <div className="border-t border-white/10 pt-10 sm:pt-16">
            <ExpertReviewCard expertReview={expertReview} />
          </div>
        )}

        <div className="mt-12 sm:mt-16">
          <ProductQnA productId={product.id || product._id} />
        </div>

        <div className="mt-12 sm:mt-16">
          <ReviewSection
            productId={product.id || product._id}
            reviews={reviews}
            averageRating={reviewSummary.averageRating}
            reviewCount={reviewSummary.reviewCount}
          />
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto mt-12 max-w-7xl sm:mt-16">
          <div className="mb-7 flex flex-col items-start gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-serif text-[#eee8dd]">
              Related Products
            </h2>
            <Link
              className="text-xs font-bold uppercase tracking-[0.12em] text-gold-gradient transition-colors hover:text-[#e1bd70]"
              to="/shop"
            >
              View More
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <ProductCard
                product={item}
                onAdd={onAdd}
                onWish={onWish}
                isCompared={
                  compareItems &&
                  compareItems.some((productItem) => productItem.id === item.id)
                }
                key={item.id}
              />
            ))}
          </div>
        </section>
      )}

      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-md sm:p-5 md:p-8"
          onClick={() => setShowCertificate(false)}
        >
          <div
            className="relative mx-auto my-auto flex w-full max-w-2xl animate-in flex-col items-center overflow-hidden fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCertificate(false)}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-white transition-colors hover:bg-black"
              title="Close Certificate"
              aria-label="Close guarantee certificate"
            >
              <X size={22} />
            </button>

            {/* Exact Image Certificate Layout */}
            <div className="w-full bg-[#1a1a1a] p-2 shadow-2xl md:p-3">
              <div className="relative flex w-full justify-center bg-white p-3 pt-14 sm:pt-5 md:p-5 lg:p-6">
                {/* Inner Gold Border */}
                <div className="relative flex min-h-[300px] w-full flex-col items-center justify-center border-[3px] border-[#d4af37] p-3 sm:p-6 md:p-8 lg:p-10">
                  {/* Corners */}
                  <CornerFlourish className="absolute top-0 left-0 w-16 md:w-20 h-16 md:h-20 text-[#e0e0e0] transform" />
                  <CornerFlourish className="absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 text-[#e0e0e0] transform scale-x-[-1]" />
                  <CornerFlourish className="absolute bottom-0 left-0 w-16 md:w-20 h-16 md:h-20 text-[#e0e0e0] transform scale-y-[-1]" />
                  <CornerFlourish className="absolute bottom-0 right-0 w-16 md:w-20 h-16 md:h-20 text-[#e0e0e0] transform scale-x-[-1] scale-y-[-1]" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center px-2 text-center sm:px-4">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-serif text-[#333] mb-6 md:mb-8 tracking-wide">
                      Your Satisfaction is 100% Guaranteed!!
                    </h2>

                    <div className="text-[13px] md:text-[15px] lg:text-[17px] font-serif leading-[1.6] text-[#444] mb-6 md:mb-8 max-w-xl">
                      <p className="mb-4 md:mb-5">
                        Our reputation and success of our company rests on
                        <br className="hidden md:block" /> making you a Happy
                        Customer today and forever!
                        <br className="hidden md:block" /> All we want is for
                        you have a great shopping
                        <br className="hidden md:block" /> experience every time
                        you Shop with us.
                      </p>
                      <p>
                        You simply can't go wrong shopping at Grandstore!
                        <br className="hidden md:block" /> We will always put
                        you right. And we mean ALWAYS!
                      </p>
                    </div>

                    <h3 className="text-sm md:text-base lg:text-lg font-semibold font-serif text-[#333] mb-2 uppercase tracking-widest">
                      BUY WITH CONFIDENCE!
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const CornerFlourish = ({ className }) => (
  <svg
    className={className}
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 0 C 40 0 75 15 95 40 C 115 65 115 100 115 120 C 115 85 95 55 65 35 C 35 15 10 5 0 5 Z"
      fill="#e5e7eb"
    />
    <path
      d="M0 20 C 25 20 50 35 65 55 C 80 75 80 100 80 120 C 80 95 65 75 50 60 C 35 45 15 35 0 35 Z"
      fill="#e5e7eb"
    />
    <circle cx="105" cy="105" r="6" fill="#e5e7eb" />
    <circle cx="90" cy="112" r="3.5" fill="#e5e7eb" />
    <circle cx="112" cy="90" r="3.5" fill="#e5e7eb" />
  </svg>
);






