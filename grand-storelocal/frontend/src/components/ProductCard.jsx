import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmCheckoutModal from "./modals/ConfirmCheckoutModal";
import {
  GitCompareArrows,
  Heart,
  Search,
  ShoppingBag,
  Store,
  CreditCard,
  Wine,
} from "lucide-react";
import IconButton from "./IconButton";
import { useWishlist } from "../wishlistContext";
import Price from "./ui/Price";
import TribalCardBorder from "../features/home/components/TribalCardBorder";
import CardChakra from "../features/home/components/CardChakra";

const fallbackBadges = [
  "Just in",
  "Limited",
  "Cellar pick",
  "New vintage",
  "Sommelier pick",
];

const trimmedUploadCache = new Map();
const vendorImageFitVersion = "full-bottle-v6";

const preparedVendorImages = {
  "/uploads/images-1787292711461.png":
    "/assets/products/vendor/whisky-tona-full.png",
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

function VendorProductImage({ src, alt }) {
  const resolvedSrc = resolveImageUrl(src);
  const isPreparedSource = Object.values(preparedVendorImages).includes(resolvedSrc);
  const cacheKey = `${vendorImageFitVersion}:${resolvedSrc}`;
  const [displaySource, setDisplaySource] = useState(
    () => trimmedUploadCache.get(cacheKey) || resolvedSrc
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (isPreparedSource) {
      setDisplaySource(resolvedSrc);
      return undefined;
    }

    if (
      !resolvedSrc ||
      (!resolvedSrc.includes(import.meta.env.VITE_API_URL || "https://api.grandstoreglobal.com") &&
        !resolvedSrc.includes("res.cloudinary.com")) ||
      trimmedUploadCache.has(cacheKey)
    ) {
      setDisplaySource(trimmedUploadCache.get(cacheKey) || resolvedSrc);
      return undefined;
    }

    setDisplaySource(resolvedSrc);

    let cancelled = false;
    const sourceImage = new Image();
    sourceImage.decoding = "async";
    sourceImage.crossOrigin = "anonymous";

    sourceImage.onload = () => {
      try {
        const naturalWidth = sourceImage.naturalWidth;
        const naturalHeight = sourceImage.naturalHeight;
        const analysisScale = Math.min(1, 800 / Math.max(naturalWidth, naturalHeight));
        const analysisWidth = Math.max(1, Math.round(naturalWidth * analysisScale));
        const analysisHeight = Math.max(1, Math.round(naturalHeight * analysisScale));
        const analysisCanvas = document.createElement("canvas");
        const analysisContext = analysisCanvas.getContext("2d", { willReadFrequently: true });
        if (!analysisContext) return;

        analysisCanvas.width = analysisWidth;
        analysisCanvas.height = analysisHeight;
        analysisContext.drawImage(sourceImage, 0, 0, analysisWidth, analysisHeight);

        const pixels = analysisContext.getImageData(0, 0, analysisWidth, analysisHeight).data;
        let minX = analysisWidth;
        let minY = analysisHeight;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < analysisHeight; y += 1) {
          for (let x = 0; x < analysisWidth; x += 1) {
            const alpha = pixels[(y * analysisWidth + x) * 4 + 3];
            if (alpha <= 12) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }

        if (maxX < minX || maxY < minY) return;

        const visibleWidth = maxX - minX + 1;
        const visibleHeight = maxY - minY + 1;
        const needsTrim = visibleWidth < analysisWidth * 0.88 || visibleHeight < analysisHeight * 0.88;

        if (!needsTrim) {
          trimmedUploadCache.set(cacheKey, resolvedSrc);
          return;
        }

        const sourceX = minX / analysisScale;
        const sourceY = minY / analysisScale;
        const sourceWidth = visibleWidth / analysisScale;
        const sourceHeight = visibleHeight / analysisScale;
        const horizontalPadding = sourceWidth * 0.14;
        const topPadding = sourceHeight * 0.1;
        const bottomPadding = sourceHeight * 0.12;
        const paddedWidth = sourceWidth + horizontalPadding * 2;
        const paddedHeight = sourceHeight + topPadding + bottomPadding;
        const outputScale = Math.min(1, 1200 / Math.max(paddedWidth, paddedHeight));
        const outputCanvas = document.createElement("canvas");
        const outputContext = outputCanvas.getContext("2d");
        if (!outputContext) return;

        outputCanvas.width = Math.max(1, Math.round(paddedWidth * outputScale));
        outputCanvas.height = Math.max(1, Math.round(paddedHeight * outputScale));
        outputContext.drawImage(
          sourceImage,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          horizontalPadding * outputScale,
          topPadding * outputScale,
          sourceWidth * outputScale,
          sourceHeight * outputScale
        );

        const trimmedSource = outputCanvas.toDataURL("image/png");
        trimmedUploadCache.set(cacheKey, trimmedSource);
        if (!cancelled) setDisplaySource(trimmedSource);
      } catch {
        trimmedUploadCache.set(cacheKey, src);
      }
    };

    sourceImage.onerror = () => trimmedUploadCache.set(cacheKey, resolvedSrc);
    sourceImage.src = resolvedSrc;

    return () => {
      cancelled = true;
    };
  }, [cacheKey, isPreparedSource, resolvedSrc]);

  if (!resolvedSrc || hasError) {
    return (
      <div className="flex flex-col items-center justify-center text-[#caa458]/70 text-xs gap-1 relative z-10">
        <Wine size={28} strokeWidth={1.5} />
        <span className="text-[10px] uppercase tracking-wider text-white/50">Bottle</span>
      </div>
    );
  }

  return (
    <img
      src={displaySource}
      alt={alt}
      className="max-h-[195px] md:max-h-[210px] w-auto max-w-[88%] object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:-translate-y-2 relative z-10"
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
}

export default function ProductCard({
  product,
  index = 0,
  onAdd,
  onWish,
  onCompare,
  isCompared = false,
  onQuickView,
}) {
  const navigate = useNavigate();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const productId = product.id || product._id;
  const productPath = `/product/${product.slug || productId}`;
  const { isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product);
  const productName = product.name || product.fullName || "Cellar selection";
  const category = product.category || product.type || "Wine & spirits";
  const badge = product.badge || fallbackBadges[index % fallbackBadges.length];

  return (
    <>
      <article
        className="arrival-luxury-card product-card group relative flex flex-col justify-between bg-gradient-to-b from-[#212529] via-[#16181b] to-[#0c0e10] border border-white/[0.09] hover:border-[#caa458]/60 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.9),0_0_28px_rgba(202,164,88,0.2)]"
        style={{ willChange: "transform", transform: "translateZ(0)" }}
      >
        {/* Top Badge Row */}
        <div className="pt-3.5 px-3.5 z-10 flex items-center justify-between w-full">
          <span className="text-[10px] sm:text-[10.5px] font-semibold tracking-[0.2em] uppercase px-2 py-0.5 rounded-sm border border-[#caa458]/35 bg-black/60 text-[#caa458]">
            {badge}
          </span>
        </div>

        {/* Quick Actions (Compare, Wishlist, Quick View) */}
        <div className="quick-actions">
          {onCompare && (
            <IconButton
              className={isCompared ? "compare-action-active" : ""}
              label={
                isCompared
                  ? `View ${productName} in comparison`
                  : `Compare ${productName}`
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
                  ? `Remove ${productName} from wishlist`
                  : `Add ${productName} to wishlist`
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

          {onQuickView ? (
            <IconButton
              label={`Quick view ${productName}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
            >
              <Search size={17} />
            </IconButton>
          ) : (
            <Link
              className="icon-button"
              to={productPath}
              aria-label={`View ${productName}`}
            >
              <Search size={17} />
            </Link>
          )}
        </div>

        {/* Center Bottle Stage with Authentic Golden Radial Spotlight & Floor Glow */}
        <Link
          to={productPath}
          className="relative w-full h-[225px] sm:h-[235px] md:h-[245px] flex items-center justify-center px-3 py-2 z-10 my-0.5 group-hover:scale-105 transition-transform duration-500 shrink-0"
          aria-label={`View ${productName}`}
        >
          {/* 1. Golden Radial Halo Spotlight behind bottle */}
          <div
            className="absolute inset-0 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(246, 241, 231, 0.35) 0%, rgba(225, 189, 112, 0.22) 38%, rgba(201, 163, 91, 0.1) 60%, transparent 78%)",
            }}
          />

          {/* 2. Golden Sacred Chakra Sunburst Aura behind bottle */}
          <CardChakra />

          {/* 3. Golden Floor Glow beneath bottle */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/5 h-6 rounded-full pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "rgba(219, 166, 73, 0.22)",
              filter: "blur(16px)",
            }}
          />

          <VendorProductImage src={product.image} alt={productName} />
        </Link>

        {/* Product Info Description Area matching Arrivals hierarchy with our luxury design */}
        <div className="product-info relative z-10 flex flex-col flex-1 justify-between p-4 sm:p-4.5 border-t border-white/[0.07] bg-[#121417]/40 text-left">
          <div>
            {/* Category */}
            <p className="product-category m-0 mb-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-[#caa458] truncate">
              {category}
            </p>

            {/* Title */}
            <h3 className="m-0 font-serif text-[17px] sm:text-[18px] font-medium leading-[1.25] text-[#f4f4f4] hover:text-[#caa458] transition-colors line-clamp-2 min-h-[44px]">
              <Link to={productPath} title={productName}>
                {productName}
              </Link>
            </h3>

            {/* Brand / Origin */}
            <p className="product-origin text-[11.5px] text-[#8f959e] m-0 mt-1 mb-2 truncate">
              {product.brand || product.origin || "Estate Bottled"}
            </p>

            {/* Store Name / Tag */}
            {product.storeName && product.storeId && (
              <Link
                to={`/store/${product.storeId}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-[10.5px] text-[#caa458] font-semibold tracking-wider uppercase mb-2 hover:underline"
              >
                <Store size={11} />
                <span className="truncate max-w-[140px]">
                  {product.storeName}
                </span>
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
              {onAdd && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAdd(product);
                  }}
                  className="flex-1 py-2 px-2.5 rounded bg-white/5 hover:bg-white/15 border border-white/15 hover:border-[#caa458]/50 text-white text-[10.5px] font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  title={`Add ${productName} to bag`}
                >
                  <ShoppingBag size={13} />
                  <span>Add</span>
                </button>
              )}

              {/* Golden Checkout Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCheckoutModalOpen(true);
                }}
                className="flex-1 py-2 px-2.5 rounded bg-[#caa458] hover:bg-[#d8b566] border border-[#caa458] text-black font-bold text-[10.5px] tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_2px_12px_rgba(202,164,88,0.35)] hover:shadow-[0_3px_15px_rgba(202,164,88,0.5)] cursor-pointer"
                title={`Instant checkout for ${productName}`}
              >
                <CreditCard size={13} />
                <span>Checkout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Authentic South African Tribal Geometric Gold Border Strip */}
        <TribalCardBorder />
      </article>

      <ConfirmCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        product={product}
        initialQuantity={1}
        selectedOption={product.options?.[0] || "Pack of 1"}
        onAddToCart={(prod, qty, opt, openCart) => {
          if (onAdd) onAdd(prod, qty, opt, openCart);
        }}
        onProceed={(prod, qty, opt) => {
          if (onAdd) onAdd(prod, qty, opt, false);
          navigate("/customer/checkout");
        }}
      />
    </>
  );
}
