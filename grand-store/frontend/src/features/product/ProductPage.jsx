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
} from "lucide-react";
import { useWishlist } from "../../wishlistContext";
import { useGeoLocation } from "../../context/LocationContext";
import ProductCard from "../../components/ProductCard";
import TrustBadges from "../../components/social/TrustBadges";
import ReviewSection from "../../components/social/ReviewSection";
import ProductQnA from "../../components/social/ProductQnA";
import ExpertReviewCard from "../../components/social/ExpertReviewCard";
import Price from "../../components/ui/Price";
import { getProductIdentity } from "../../utils/productTaxonomy";
import api from "../../api";
import ConfirmCheckoutModal from "../../components/modals/ConfirmCheckoutModal";

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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5015';
    const cleanPath = normalizedSrc.substring(normalizedSrc.indexOf('uploads/'));
    return `${apiUrl.replace(/\/$/, '')}/${cleanPath}`;
  }
  
  return normalizedSrc;
};

export default function ProductPage({ onAdd, onWish, compareItems, onNotify }) {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { slug } = useParams();
  const { currency, country_name } = useGeoLocation();

  const product = products.find(
    (item) =>
      item.slug === slug ||
      item.id === slug ||
      item.id === Number(slug) ||
      item._id === slug
  );
  const { isWishlisted } = useWishlist();
  const wishlisted = product ? isWishlisted(product) : false;
  const [selectedImage, setSelectedImage] = useState(resolveImageUrl(product?.image ?? ""));
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(
    product?.options?.[0] ?? "Pack of 1",
  );

  // For zooming/gallery
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [showCertificate, setShowCertificate] = useState(false);

  // Shipping Estimation
  const [deliveryCountry, setDeliveryCountry] = useState("South Africa");
  const [shippingEstimate, setShippingEstimate] = useState(null);

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

  // Mock shipping estimate effect
  useEffect(() => {
    if (!product) return;
    const isDomestic = deliveryCountry === "South Africa";
    setShippingEstimate({
      cost: isDomestic ? <Price amount={150} /> : <Price amount={450} />,
      time: isDomestic ? "2-4 days" : "5-8 days",
    });
  }, [deliveryCountry, product, currency]);

  if (!product) return <Navigate to="/" replace />;

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
    <main className="min-h-screen overflow-x-hidden bg-[#0a0907] px-4 pb-10 pt-5 text-[#eee8dd] sm:px-6 sm:pb-12 sm:pt-8 md:px-8 lg:px-12 font-sans">
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
      {/* Top Breadcrumbs */}
      <section className="mx-auto mb-4 flex max-w-7xl items-center gap-3 overflow-x-auto whitespace-nowrap pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#918a7f] sm:mb-3 sm:text-sm">
        <Link to="/" className="hover:text-gold-gradient transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link
          to={`/shop?category=${encodeURIComponent(product.category || product.type || "")}`}
          className="max-w-[34vw] truncate hover:text-gold-gradient transition-colors sm:max-w-none"
        >
          {product.category || product.type || "Shop"}
        </Link>
        {product.brand && (
          <span className="hidden sm:contents">
            <span>/</span>
            <span className="hover:text-gold-gradient cursor-pointer transition-colors">
              {product.brand}
            </span>
          </span>
        )}
        <span>/</span>
        <span className="inline-block max-w-[42vw] truncate align-middle font-bold text-[#eee8dd] sm:max-w-[30vw]">
          {product.name}
        </span>
      </section>

      {/* Main Detail Section (Split Layout) */}
      <section className="mx-auto mb-12 grid max-w-7xl grid-cols-1 gap-6 sm:gap-8 lg:mb-16 lg:grid-cols-2 lg:gap-12">
        {/* Left: Floating Image */}
        <div className="flex min-w-0 flex-col items-center">
          <div className="group relative flex h-[clamp(320px,112vw,480px)] w-full max-w-lg items-center justify-center overflow-hidden sm:h-auto sm:aspect-[4/5]">
            {/* Image Drop Shadow for floating effect */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/80 blur-2xl rounded-[100%] pointer-events-none"></div>

            <img
              src={selectedImage}
              alt={product.fullName || product.name}
              className="relative z-10 max-w-full max-h-full object-contain"
            />

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => selectAdjacentImage(-1)}
                  className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white transition-colors hover:border-[#c9a35b] hover:text-[#c9a35b] sm:left-4"
                  aria-label="Previous product image"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => selectAdjacentImage(1)}
                  className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white transition-colors hover:border-[#c9a35b] hover:text-[#c9a35b] sm:right-4"
                  aria-label="Next product image"
                >
                  <ChevronRight size={22} />
                </button>
                <span className="absolute bottom-3 right-3 z-20 rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold tracking-widest text-white/70">
                  {selectedImageIndex + 1}/{gallery.length}
                </span>
              </>
            )}
          </div>

          {/* Thumbnails underneath */}
          {gallery.length > 1 && (
            <div className="mt-4 flex w-full max-w-lg snap-x gap-3 overflow-x-auto pb-2 sm:mt-8 sm:justify-center sm:gap-4">
              {gallery.map((img) => (
                <button
                  key={img}
                  className={`flex h-16 w-16 shrink-0 snap-start items-center justify-center rounded-lg border p-1 transition-all md:h-20 md:w-20 ${selectedImage === img ? "border-[#c9a35b] bg-white/5" : "border-transparent hover:border-white/10"}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img}
                    alt="Thumbnail"
                    className="max-w-full max-h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Desktop Description to fill space */}
          <div className="hidden lg:block w-full max-w-lg mt-12 self-center text-left">
            <div className="border-t border-[#c9a35b]/20 pt-8">
              <h3 className="text-xl font-serif text-[#eee8dd] mb-6">About this {categoryLabel.toLowerCase()}</h3>
              <div className="space-y-6 break-words text-base leading-relaxed text-[#aaa195]">
                <p>{product.description}</p>
                {product.tastingNotes && product.tastingNotes.length > 0 && (
                  <div className="mt-6 border-t border-white/5 pt-6">
                    <strong className="block text-[#d8b76d] mb-3 font-serif text-lg tracking-wide">
                      Tasting Notes
                    </strong>
                    <ul className="list-disc pl-5 space-y-2 marker:text-[#c9a35b]">
                      {product.tastingNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="flex min-w-0 flex-col justify-center">
          <TrustBadges
            badges={product.badges || ["GRAND_STORE_CHOICE"]}
            className="mb-4"
          />

          <div className="mb-4 flex flex-wrap gap-2" aria-label="Product classification">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs uppercase tracking-[0.1em] text-[#918a7f]">
              Category
              <strong className="font-semibold text-[#eee8dd]">{categoryLabel}</strong>
            </span>
            {taxonomySecondary.value && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c9a35b]/25 bg-[#c9a35b]/[0.06] px-3 py-2 text-xs uppercase tracking-[0.1em] text-[#918a7f]">
                {taxonomySecondary.label}
                <strong className="font-semibold text-[#e1bd70]">{taxonomySecondary.value}</strong>
              </span>
            )}
          </div>

          <h1 className="mb-4 break-words font-serif text-[clamp(2rem,10vw,3rem)] leading-[1.08] text-[#eee8dd] md:text-5xl lg:text-[54px]">
            {product.fullName || product.name}
          </h1>

          <div className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#918a7f] sm:text-sm">
            SKU: {String(product.id).substring(0, 10).toUpperCase()}
          </div>

          <div className="mb-7 overflow-hidden border-y border-[#c9a35b]/25 bg-gradient-to-r from-[#14120e] to-[#0d0c0a] sm:mb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_230px]">
            <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#aaa195]">
                  <span className="h-4 w-0.5 bg-[#c9a35b]" aria-hidden="true" />
                  Price
                </p>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] ${
                    product.stock > 0 || product.stock === undefined
                      ? "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-400"
                      : "border-red-400/25 bg-red-400/[0.07] text-red-400"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  {product.stock > 0 || product.stock === undefined ? "In stock" : "Out of stock"}
                </span>
              </div>

              <div className="mt-4 min-w-0 flex flex-wrap items-baseline gap-3">
                <div className="text-[clamp(2rem,10vw,3rem)] font-semibold leading-none text-[#e1bd70]">
                  <Price amount={product.price * quantity} presentation="product" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-2.5 py-1 text-xs font-mono text-[var(--color-gold)] font-medium">
                  Incl. 15% VAT
                </span>
              </div>

              <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs leading-relaxed text-[#837b70]">
                15% South African VAT Included <span className="mx-2 text-[#c9a35b]/60">•</span> Delivery calculated at checkout
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCertificate(true)}
              className="group flex w-full min-w-0 items-center justify-start gap-3 border-t border-[#c9a35b]/20 bg-[#c9a35b]/[0.045] px-5 py-3.5 text-left transition-colors hover:bg-[#c9a35b]/[0.09] sm:px-6 lg:flex-col lg:justify-center lg:border-l lg:border-t-0 lg:px-5 lg:py-5 lg:text-center"
              title="Click to view our 100% Satisfaction Guarantee"
              aria-label="View the Grandstore 100% satisfaction guarantee"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center sm:h-14 sm:w-14 lg:h-16 lg:w-16" aria-hidden="true">
                <img
                  src="/grandstore-badge.png"
                  alt=""
                  className="!h-full !w-full max-w-none object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <span className="min-w-0 flex-1 lg:flex-none">
                <strong className="block break-words text-xs uppercase tracking-[0.08em] text-[#e1bd70]">
                  Grandstore guarantee
                </strong>
                <span className="mt-1.5 block break-words text-[11px] leading-relaxed text-[#918a7f]">
                  Shop with our 100% satisfaction promise
                </span>
              </span>
              <span className="shrink-0 text-lg text-[#c9a35b] transition-transform group-hover:translate-x-1 lg:hidden" aria-hidden="true">
                →
              </span>
            </button>
          </div>

          {/* Bottle identity — the key facts customers need at a glance. */}
          <div className="mb-8 border border-[#c9a35b]/25 bg-[#11100d] p-5 sm:p-6">
            <div className="mb-5 flex flex-col items-start gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#918a7f]">
                  At a glance
                </p>
                <h2 className="mt-2 font-serif text-xl text-[#eee8dd]">Bottle identity</h2>
              </div>
              <span className="rounded-full border border-[#c9a35b]/35 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#e1bd70]">
                {product.brand || "The Grand Store"}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3">
              {identityItems.map((item) => (
                <div className="min-w-0" key={item.label}>
                  <dt className="mb-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#918a7f]">
                    {item.label}
                  </dt>
                  <dd className={`break-words text-base font-medium leading-snug ${item.value ? "text-[#eee8dd]" : "text-[#686158]"}`}>
                    {item.value || "Not stated"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Select Options */}
          {product.options && product.options.length > 1 && (
            <div className="mb-6">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.1em] text-[#918a7f]">
                Options
              </label>
              <select
                className="w-full bg-transparent border border-white/20 text-[#eee8dd] p-3 focus:border-[#c9a35b] outline-none transition-colors"
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

          {/* Action Row */}
          <div className="mb-6 grid grid-cols-[minmax(0,1fr)_52px] items-stretch gap-3 sm:flex sm:flex-wrap sm:gap-4">
            {/* Quantity Selector */}
            <div className={`order-1 flex h-[52px] w-full items-center border border-white/20 sm:w-auto ${product.stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                type="button"
                className="w-12 h-full flex items-center justify-center text-[#918a7f] hover:text-gold-gradient transition-colors"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={product.stock === 0}
              >
                <Minus size={14} />
              </button>
              <span className="min-w-8 flex-1 text-center text-sm font-semibold sm:w-8 sm:flex-none">
                {quantity}
              </span>
              <button
                type="button"
                className="w-12 h-full flex items-center justify-center text-[#918a7f] hover:text-gold-gradient transition-colors"
                onClick={() => setQuantity((value) => value + 1)}
                disabled={product.stock === 0 || quantity >= product.stock}
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              className={`order-3 col-span-2 h-[52px] w-full min-w-0 border border-[#eee8dd] bg-transparent text-xs font-bold uppercase tracking-[0.12em] text-[#eee8dd] sm:order-2 sm:flex-1 sm:min-w-[140px] ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5 transition-colors'}`}
              type="button"
              onClick={() => product.stock !== 0 && onAdd && onAdd(product, quantity, selectedOption)}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add To Cart'}
            </button>

            <button
              className={`order-4 col-span-2 h-[52px] w-full min-w-0 border border-[#222] bg-[#222] text-xs font-bold uppercase tracking-[0.12em] text-[#eee8dd] sm:order-3 sm:flex-1 sm:min-w-[140px] ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#333] transition-colors'}`}
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

            <button
              className={`order-2 flex h-[52px] w-[52px] items-center justify-center border transition-colors sm:order-4 ${wishlisted ? "border-[#c9a35b] text-gold-gradient" : "border-white/20 text-[#918a7f] hover:border-white/50 hover:text-white"}`}
              type="button"
              onClick={() => onWish && onWish(product)}
            >
              <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* South Africa Legal Drinking Warning Banner */}
          <div className="w-full bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 flex flex-col xl:flex-row items-center justify-center gap-4 xl:gap-6 mb-8 rounded">
            <a href="https://www.aware.org.za/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 sm:gap-4 shrink-0 hover:opacity-80 transition-opacity">
              {/* #NO 18 Logo */}
              <div className="flex items-center text-[#e84c22] font-black tracking-tighter">
                <span className="text-3xl leading-none">#N</span>
                <div className="relative w-9 h-9 ml-0.5 flex items-center justify-center border-[4px] border-[#e84c22] rounded-full overflow-hidden">
                  <span className="text-sm font-black tracking-tighter">
                    18
                  </span>
                  <div className="absolute w-full h-[4px] bg-[#e84c22] rotate-[-45deg]"></div>
                </div>
              </div>

              {/* aware.org Logo */}
              <div className="flex flex-col text-white font-bold leading-none">
                <span className="text-[16px] tracking-tight flex items-center">
                  aware
                  <span className="text-[#e84c22] text-xl -mt-1 mx-[1px]">
                    !
                  </span>
                  org
                </span>
                <span className="mt-1 text-xs font-normal tracking-[0.12em] opacity-90">
                  www.aware.org.za
                </span>
              </div>
            </a>

            <div className="hidden xl:block w-px h-8 bg-white/20 shrink-0"></div>

            {/* Warning Text */}
            <div className="text-center text-xs font-bold uppercase leading-relaxed tracking-[0.1em] text-white sm:text-sm xl:text-left">
              Drink responsibly. Not for persons under the age of 18.
            </div>
          </div>

          {/* Fulfilled By Widget */}
          <div className="mb-8 border border-white/10 bg-white/5 p-4 sm:p-5">
            <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-gold-gradient">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              Delivery & Fulfillment
            </h4>
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div className="min-w-0">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#918a7f]">
                  Fulfilled By
                </span>
                <span className="break-words font-medium">
                  {product.vendorName || "ABC Winery"}
                </span>
              </div>
              <div className="min-w-0">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-[#918a7f]">
                  Ships From
                </span>
                <span className="break-words font-medium">
                  {product.origin || "South Africa"}
                </span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-2">
              <label className="mb-3 block text-xs uppercase tracking-[0.08em] text-[#918a7f]">
                Estimate Delivery To
              </label>
              <div className="flex min-w-0 gap-2">
                <select
                  className="min-w-0 flex-1 border border-white/20 bg-[#0a0907] p-3 text-sm text-[#eee8dd] outline-none focus:border-[#c9a35b]"
                  value={deliveryCountry}
                  onChange={(e) => setDeliveryCountry(e.target.value)}
                >
                  <option value="South Africa">South Africa</option>
                  <option value="United Arab Emirates">Dubai, UAE</option>
                  <option value="France">France</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                </select>
              </div>
              {shippingEstimate && (
                <div className="mt-3 flex flex-col gap-2 border border-white/10 bg-[#0a0907] p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[#918a7f] mr-2">Est. Time:</span>
                    <span className="font-medium">{shippingEstimate.time}</span>
                  </div>
                  <div>
                    <span className="text-[#918a7f] mr-2">Cost:</span>
                    <span className="font-medium text-gold-gradient">
                      {shippingEstimate.cost}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Share Links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#918a7f] sm:gap-6">
            <span>Share</span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#eee8dd] transition-colors p-1"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
              </svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#eee8dd] transition-colors p-1"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#eee8dd] transition-colors p-1"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.891-4.444 9.891-9.891 0-2.64-1.028-5.12-2.894-6.988-1.866-1.867-4.348-2.895-6.988-2.895-5.448 0-9.891 4.444-9.891 9.891 0 2.115.6 3.715 1.595 5.391l-1.082 3.953 4.077-1.059zm3.626-6.495c.27-.135 1.597-.789 1.845-.879.248-.09.429-.135.609.135.18.27.697.879.855 1.059.157.18.315.225.585.09.27-.135 1.14-.42 2.171-1.341.801-.715 1.343-1.598 1.5-1.868.157-.27.016-.416-.119-.551-.121-.121-.27-.315-.405-.473-.135-.157-.18-.27-.27-.45-.09-.18-.045-.337.023-.472.067-.135.609-1.467.855-2.008.239-.525.48-.452.609-.461.121-.009.27-.009.405-.009.135 0 .36.051.549.231.189.18.729.713.729 1.737 0 1.024.747 2.015.855 2.159.108.144 1.47 2.245 3.565 3.151.498.215.887.344 1.19.44.5.158.956.135 1.315.082.404-.06 1.242-.508 1.417-1.002.175-.494.175-.918.123-1.002-.051-.084-.196-.135-.466-.27l-2.05-1.005z" />
              </svg>
            </a>
            <button
              onClick={shareProduct}
              className="hover:text-[#eee8dd] transition-colors p-1"
              title="Copy Link"
            >
              <Link2 size={24} />
            </button>
          </div>
        </div>
      </section>

      <hr className="border-white/10 max-w-7xl mx-auto mb-10" />

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

        {/* Description Section (Mobile/Tablet only) */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 py-8 border-t border-b border-white/10">
          <div className="md:col-span-3">
            <h3 className="text-xl font-serif text-[#eee8dd]">Description</h3>
          </div>
          <div className="md:col-span-9">
            <div className="max-w-3xl space-y-6 break-words text-base leading-relaxed text-[#aaa195]">
              <p>{product.description}</p>
              {product.tastingNotes && product.tastingNotes.length > 0 && (
                <div className="mt-6">
                  <strong className="block text-[#eee8dd] mb-2 font-serif text-lg">
                    Tasting Notes
                  </strong>
                  <ul className="list-disc pl-5 space-y-1">
                    {product.tastingNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

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






