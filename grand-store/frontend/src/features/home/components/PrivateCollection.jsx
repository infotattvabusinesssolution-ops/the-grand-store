import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
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

// Fallback curated private collection bottles from South Africa's premier estates
const FALLBACK_PRIVATE_CARDS = [
  {
    number: "01",
    badge: "PRIVATE CELLAR",
    overline: "Cape Fine Wine",
    title: "Vin de Constance Natural Sweet",
    origin: "Klein Constantia • Constantia, South Africa",
    price: 1850,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1789647388/grand-store/arrivals/arrival_bottle_1.png",
    link: "/shop?category=Wine",
    description: "The historic nectar favored by emperors, hand-harvested raisined Muscat de Frontignan aged in French oak and acacia.",
  },
  {
    number: "02",
    badge: "FOUNDER'S RESERVE",
    overline: "Rare Single Grain",
    title: "Bain's 15 Year Old Symphony Cask",
    origin: "James Sedgwick Distillery • Wellington, South Africa",
    price: 2400,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1789647391/grand-store/arrivals/arrival_bottle_4.png",
    link: "/shop?category=Whisky",
    description: "Double matured South African grain whisky finished in seasoned sherry casks, offering rich toffee and warm spice.",
  },
  {
    number: "03",
    badge: "HERITAGE CRU",
    overline: "Iconic Stellenbosch Red",
    title: "Kanonkop Black Label Pinotage",
    origin: "Kanonkop Estate • Simonsberg, South Africa",
    price: 3250,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1789647390/grand-store/arrivals/arrival_bottle_3.png",
    link: "/shop?category=Wine",
    description: "Crafted exclusively from 68-year-old bush vines, delivering extraordinary depth, velvety tannins, and decades of cellar potential.",
  },
];

export default function PrivateCollection() {
  const { products } = useProducts();

  const cards = useMemo(() => {
    if (!products || products.length === 0) {
      return FALLBACK_PRIVATE_CARDS;
    }

    const selected = products.slice(0, 3);
    return selected.map((product, index) => {
      const fallback = FALLBACK_PRIVATE_CARDS[index] || FALLBACK_PRIVATE_CARDS[0];
      const productId = product.id || product._id;
      const uploadedImage = String(product.image || "");
      const hasPreparedBottle = uploadedImage.includes("/uploads/images-1787292711461.png");
      const resolvedImg = hasPreparedBottle 
        ? "/assets/products/vendor/whisky-tona-full.png" 
        : (resolveImageUrl(product.image) || fallback.image);

      return {
        number: `0${index + 1}`,
        badge: index === 0 ? "PRIVATE CELLAR" : index === 1 ? "FOUNDER'S RESERVE" : "HERITAGE CRU",
        overline: product.category || product.type || fallback.overline,
        title: product.name || product.fullName || fallback.title,
        origin: product.brand || product.origin || (product.country ? `${product.country} Estate` : fallback.origin),
        price: product.price || fallback.price,
        image: resolvedImg,
        link: `/product/${product.slug || productId}`,
        description: product.description || fallback.description,
      };
    });
  }, [products]);

  return (
    <section 
      className="arrivals-section showcase-section relative w-full bg-[#0a0c0e] text-white pt-8 pb-12 md:pt-12 md:pb-20 overflow-hidden select-none" 
      id="private-collection"
    >
      {/* Sacred African Sun / Chakra Background Engraving (Top-Left for visual balance) */}
      <ArrivalsMandala gradientId="mandala-private-collection" position="top-left" />

      {/* Golden Ambient Atmospheric Glow */}
      <div className="absolute top-[30%] left-[20%] w-[700px] h-[700px] bg-[#caa458]/5 pointer-events-none rounded-full blur-[130px] opacity-50 z-0" />

      <div className="shell relative z-10 max-w-[1520px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Section Heading Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 md:mb-8 gap-4 relative">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#caa458]">
                THE PRIVATE COLLECTION • CAPE & GLOBAL CELLAR RESERVES
              </span>
              <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
            </div>

            <h2 
              className="text-4xl sm:text-5xl lg:text-[54px] font-normal tracking-[-0.02em] leading-tight m-0 text-white font-serif"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Chosen with intention
            </h2>

            <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#a0a4a8] mt-3.5 mb-5 max-w-xl font-sans">
              Hand-selected rare single-casks, limited estate vintages, and collector allocations reserved exclusively for private cellars.
            </p>

            <Link 
              to="/shop" 
              className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#caa458] hover:text-[#f7e1a0] transition-colors group"
            >
              <span>EXPLORE COMPLETE VAULT</span>
              <span className="text-[14px] group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* 3 Showcase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
          {cards.map((card) => (
            <div
              key={card.number}
              className="arrival-luxury-card group relative flex flex-col justify-between bg-gradient-to-b from-[#212529] via-[#16181b] to-[#0c0e10] border border-white/[0.09] hover:border-[#caa458]/70 rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(202,164,88,0.25)] min-h-[500px]"
              style={{ willChange: "transform", transform: "translateZ(0)" }}
            >
              {/* Top Watermark & Badge Row */}
              <div className="pt-4 px-5 z-10 flex items-center justify-between">
                <span 
                  className="font-serif text-3xl sm:text-4xl text-[#caa458]/40 group-hover:text-[#caa458] transition-colors font-medium select-none"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {card.number}
                </span>

                <span className="text-[10px] sm:text-[10.5px] font-semibold tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-sm border border-[#caa458]/35 bg-black/60 text-[#caa458] inline-flex items-center gap-1.5">
                  <ProteaEmblem className="w-2.5 h-2.5 text-[#caa458]" />
                  <span>{card.badge}</span>
                </span>
              </div>

              {/* Center Bottle Stage */}
              <Link
                to={card.link}
                className="relative w-full h-[250px] sm:h-[280px] flex items-center justify-center px-4 py-2 z-10 my-2 group-hover:scale-105 transition-transform duration-500 shrink-0"
              >
                {/* Golden Radial Halo Spotlight behind bottle */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity duration-500"
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

                <img
                  src={card.image}
                  alt={card.title}
                  className="max-h-[210px] md:max-h-[235px] w-auto max-w-[85%] object-contain drop-shadow-[0_16px_35px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:-translate-y-2 relative z-10"
                  loading="lazy"
                />
              </Link>

              {/* Bottom Editorial Content Area */}
              <div className="product-info relative z-10 flex flex-col flex-1 justify-between p-5 border-t border-white/[0.07] bg-[#121417]/50 text-left">
                <div>
                  <p className="product-category m-0 mb-1.5 text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[#caa458] truncate">
                    {card.overline}
                  </p>

                  <h3 
                    className="m-0 font-serif text-[21px] sm:text-[23px] font-medium leading-[1.25] text-[#f4f4f4] hover:text-[#caa458] transition-colors line-clamp-2 min-h-[54px]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    <Link to={card.link}>
                      {card.title}
                    </Link>
                  </h3>

                  <p className="product-origin text-[12px] text-[#8f959e] m-0 mt-1 mb-2 truncate">
                    {card.origin}
                  </p>

                  <p className="text-[13px] text-[#a0a4a8] leading-relaxed font-light line-clamp-2 mb-4">
                    {card.description}
                  </p>
                </div>

                {/* Price & Action Row */}
                <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.06] mt-auto">
                  <div className="font-sans">
                    {card.price && (
                      <strong className="text-[18px] font-bold text-white tracking-wide block">
                        <Price amount={card.price} />
                      </strong>
                    )}
                  </div>

                  <Link
                    to={card.link}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#caa458] hover:text-[#f7e1a0] transition-colors group/cta"
                  >
                    <span>EXPLORE BOTTLE</span>
                    <ArrowRight size={13} className="group-hover/cta:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Authentic South African Tribal Geometric Gold Border Strip */}
              <TribalCardBorder />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
