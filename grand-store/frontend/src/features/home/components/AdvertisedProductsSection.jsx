import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight, ChevronLeft, ChevronRight, Wine } from 'lucide-react';
import api from '../../../api';
import Price from '../../../components/ui/Price';
import ProteaEmblem from './ProteaEmblem';
import ArrivalsMandala from './ArrivalsMandala';
import TribalCardBorder from './TribalCardBorder';
import CardChakra from './CardChakra';

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
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5015";
    const cleanPath = normalizedSrc.substring(
      normalizedSrc.indexOf("uploads/"),
    );
    return `${apiUrl.replace(/\/$/, "")}/${cleanPath}`;
  }

  return normalizedSrc;
};

const AdvertisedProductCard = ({ product }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images.length > 0 ? resolveImageUrl(images[currentIndex]) : "";

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const badgeText = product.category || product.brand || "Exclusive Partner";

  return (
    <article className="arrival-luxury-card product-card group relative flex flex-col justify-between bg-gradient-to-b from-[#212529] via-[#16181b] to-[#0c0e10] border border-white/[0.09] hover:border-[#caa458]/70 rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.9),0_0_28px_rgba(202,164,88,0.25)] h-full">
      
      {/* Top Header Badge Row */}
      <div className="pt-3.5 px-4 z-10 flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-[10.5px] font-semibold tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-sm border border-[#caa458]/35 bg-black/60 text-[#caa458] inline-flex items-center gap-1.5">
          <ProteaEmblem className="w-2.5 h-2.5 text-[#caa458]" />
          <span>{badgeText}</span>
        </span>

        {product.price && (
          <span className="text-[11px] font-bold text-[#caa458] bg-[#caa458]/10 border border-[#caa458]/25 px-2.5 py-0.5 rounded-sm tracking-wide">
            {typeof product.price === 'number' || !isNaN(Number(product.price)) ? (
              <Price amount={product.price} />
            ) : (
              product.price
            )}
          </span>
        )}
      </div>

      {/* Center Image Stage with Golden Radial Halo, CardChakra, and Floor Glow */}
      <div className="relative w-full h-[250px] sm:h-[270px] flex items-center justify-center px-4 py-2 z-10 my-1 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
        {/* Golden Radial Halo Spotlight behind bottle */}
        <div
          className="absolute inset-0 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(246, 241, 231, 0.35) 0%, rgba(225, 189, 112, 0.22) 38%, rgba(201, 163, 91, 0.1) 60%, transparent 78%)',
          }}
        />

        {/* Sacred African Sunburst Chakra Aura */}
        <CardChakra />

        {/* Golden Floor Glow */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3/5 h-6 rounded-full pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'rgba(219, 166, 73, 0.22)',
            filter: 'blur(16px)',
          }}
        />

        {currentImage ? (
          <img 
            src={currentImage} 
            alt={product.title}
            className="max-h-[200px] md:max-h-[220px] w-auto max-w-[85%] object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:-translate-y-2 relative z-10"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#caa458]/70 text-xs gap-1 relative z-10">
            <Wine size={28} strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-wider text-white/50">Partner Selection</span>
          </div>
        )}

        {/* Carousel Controls if multiple images */}
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              aria-label="Previous Image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 bg-black/60 border border-white/10 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#caa458] hover:text-black transition-all duration-300 z-20 cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <button 
              onClick={nextImage}
              aria-label="Next Image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-black/60 border border-white/10 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#caa458] hover:text-black transition-all duration-300 z-20 cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-[3px] rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-[#caa458] w-5' : 'bg-white/30 w-1.5'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Editorial Content Area */}
      <div className="product-info relative z-10 flex flex-col flex-1 justify-between p-4 sm:p-5 border-t border-white/[0.07] bg-[#121417]/50 text-left">
        <div>
          {/* Tagline / Category */}
          <p className="m-0 mb-1 text-[10px] font-semibold tracking-[0.16em] uppercase text-[#caa458] truncate">
            {product.tagline || product.category || "Grand Store Partner Edition"}
          </p>

          {/* Title in Playfair Display font-serif */}
          <h3 
            className="m-0 font-serif text-[19px] sm:text-[21px] font-medium leading-[1.25] text-[#f4f4f4] hover:text-[#caa458] transition-colors line-clamp-2 min-h-[48px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            <Link to={`/discover/${product._id}`}>
              {product.title}
            </Link>
          </h3>

          {/* Brand or Origin */}
          <p className="text-[11.5px] text-[#8f959e] m-0 mt-1 mb-2 truncate">
            {product.brand || "Artisanal Producer"}
          </p>

          {/* Description */}
          <p className="text-[13px] leading-relaxed text-[#a0a4a8] font-light line-clamp-2 mb-3">
            {product.description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-1">
          <Link 
            to={`/discover/${product._id}`}
            className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] font-semibold text-white hover:text-[#caa458] transition-colors group/link"
          >
            <span>VIEW DETAILS</span>
            <ArrowRight size={13} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>

          {product.linkUrl && (
            <a 
              href={product.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#caa458]/70 hover:text-[#caa458] transition-colors"
              title="Visit External Partner"
            >
              <span>VISIT SITE</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Authentic South African Tribal Geometric Gold Border Strip */}
      <TribalCardBorder />
    </article>
  );
};

export default function AdvertisedProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/advertisements/products');
        setProducts(res.data || []);
      } catch (err) {
        console.error('Error fetching advertised products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <section className="arrivals-section showcase-section home-advertised-products relative w-full bg-[#0a0c0e] text-white pt-8 pb-10 md:pt-12 md:pb-16 overflow-hidden select-none" id="advertised">
      {/* Sacred African Sun / Chakra Background Engraving */}
      <ArrivalsMandala gradientId="mandala-advertised" position="top-right" />

      {/* Ambient Golden Atmosphere Glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#caa458]/5 pointer-events-none rounded-full blur-[140px] opacity-60 z-0" />

      <div className="shell relative z-10 max-w-[1520px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Section Heading matching Arrivals */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 md:mb-8 gap-4 relative">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#caa458]">
                GRANDSTORE LOCAL CURATIONS & PARTNERSHIPS
              </span>
              <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
            </div>

            <h2 
              className="text-4xl sm:text-5xl lg:text-[54px] font-normal tracking-[-0.02em] leading-tight m-0 text-white font-serif"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Featured Partnerships
            </h2>

            <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#a0a4a8] mt-3.5 mb-5 max-w-xl font-sans">
              Discover extraordinary releases and exclusive offerings curated in partnership with South Africa's and the world's most esteemed luxury estates.
            </p>

            <Link 
              to="/advertise" 
              className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#caa458] hover:text-[#f7e1a0] transition-colors group"
            >
              <span>ADVERTISE WITH US</span>
              <span className="text-[14px] group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="arrival-luxury-card relative flex flex-col items-center text-center p-10 sm:p-14 rounded-2xl bg-gradient-to-b from-[#212529] via-[#16181b] to-[#0c0e10] border border-white/[0.09] overflow-hidden shadow-2xl mt-6">
            <CardChakra className="opacity-30" />
            <div className="relative z-10 flex flex-col items-center max-w-lg">
              <div className="w-12 h-12 rounded-full border border-[#caa458]/40 bg-black/60 flex items-center justify-center mb-4">
                <ProteaEmblem className="w-6 h-6 text-[#caa458]" />
              </div>
              <h3 
                className="text-2xl sm:text-3xl font-serif text-white mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Feature Your Legacy
              </h3>
              <p className="text-[#a0a4a8] text-sm sm:text-base leading-relaxed mb-6 font-sans">
                Showcase your luxury brand to our exclusive clientele of South African and international connoisseurs and collectors.
              </p>
              <Link 
                to="/advertise"
                className="inline-flex items-center gap-2 px-7 py-3 rounded bg-[#caa458] hover:bg-[#d8b566] text-black font-bold text-xs tracking-[0.18em] uppercase transition-all duration-300 shadow-[0_2px_15px_rgba(202,164,88,0.35)] hover:shadow-[0_4px_20px_rgba(202,164,88,0.5)]"
              >
                <span>Start Campaign</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <TribalCardBorder className="absolute bottom-0 left-0 right-0" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
            {products.map((product) => (
              <AdvertisedProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
