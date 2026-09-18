import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const mobileSlides = [
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_768,h_1376,b_gen_fill/v1789646474/grand-store/hero/grand_store_celebration_gathering.jpg",
    alt: "Friends celebrating at an evening gathering",
    badge: "Shared Moments & Fine Spirits",
    eyebrow: "Every Gathering.",
    title: "Celebrated.",
    sub: "Curated fine spirits, rare vintages & private cellar selections.",
    cta: "Explore Collection",
    link: "#arrivals"
  },
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_768,h_1376,b_gen_fill/v1789646759/grand-store/hero/south_african_wine_clean.jpg",
    alt: "South African Wine - Sourced From Farm",
    badge: "Estate Direct Cellar",
    eyebrow: "South Africa's Best.",
    title: "Sourced From Farm.",
    sub: "Direct allocations from premier Stellenbosch & Franschhoek estates.",
    cta: "Explore Wine Collection",
    link: "/shop?category=Wine"
  },
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_768,h_1376,b_gen_fill/v1789646476/grand-store/hero/grand_store_events_toast.png",
    alt: "Exclusive Tastings & Events Toast",
    badge: "Private Tastings & Masterclasses",
    eyebrow: "Exclusive Tastings.",
    title: "Private Events.",
    sub: "Sommelier-led masterclasses & bespoke cellar tastings.",
    cta: "Discover Events",
    link: "/events"
  },
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1788172728/grand-store/mobile-hero/n9uovcqrpnvvvnr0cxnj.jpg",
    alt: "Rare Vintages Live Auctions",
    badge: "Live Premier Bidding",
    eyebrow: "Rare Vintages.",
    title: "Live Auctions.",
    sub: "Verified provenance & global collector live bidding.",
    cta: "Explore Live Auctions",
    link: "/auction"
  },
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1788172726/grand-store/mobile-hero/y9huqamz2qmi19eztxvv.jpg",
    alt: "Handcrafted Cigars & Spirits",
    badge: "Handcrafted Heritage",
    eyebrow: "Handcrafted Luxury.",
    title: "Cigars & Lounge.",
    sub: "Hand-rolled heritage cigars paired with aged reserve spirits.",
    cta: "Explore Cigars",
    link: "https://cigar.yogapranafitness.com"
  }
];

export default function HeroMobile() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const durationMs = 6000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setCurrentSlide((prev) => (prev + 1) % mobileSlides.length);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentSlide]);

  const slide = mobileSlides[currentSlide];

  return (
    <section className="relative w-full min-h-[90vh] py-12 flex flex-col justify-center items-center bg-[#050505] overflow-hidden select-none">
      
      {/* Background Images */}
      <div className="absolute inset-0 w-full h-full bg-black">
        {mobileSlides.map((s, index) => (
          <img 
            key={s.image}
            src={s.image} 
            alt={s.alt} 
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}
        {/* Balanced Vignette Overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-black/30 via-black/45 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-black/50" />
      </div>
      
      {/* Sparkle accents */}
      <div className="absolute top-[18%] left-[8%] text-[#ffeaa7] text-base opacity-40 animate-pulse">✧</div>
      <div className="absolute top-[22%] right-[10%] text-[#ffd700] text-xs opacity-40 animate-pulse">✦</div>

      {/* Centralized Frosted Content Plaque */}
      <div className="relative z-10 w-full max-w-[340px] sm:max-w-md mx-auto px-4 flex flex-col items-center text-center mt-6">
        
        <div className="w-full px-5 py-6 rounded-3xl bg-black/45 backdrop-blur-md border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col items-center text-center">
          {/* Eyebrow Badge */}
          {slide.badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mb-3 rounded-full border border-[#e5a93c]/35 bg-black/60 backdrop-blur-md text-[9.5px] font-semibold tracking-[0.2em] uppercase text-[#f3cf7a] shadow-md">
              <span className="text-[#e5a93c]">✧</span>
              <span>{slide.badge}</span>
              <span className="text-[#e5a93c]">✧</span>
            </div>
          )}

          {/* Centralized & Scaled Down Headline */}
          <h1 
            className="font-serif not-italic text-center select-none m-0 p-0 mb-2.5 flex flex-col items-center"
            key={slide.title}
          >
            <span 
              className="block text-lg sm:text-xl font-bold uppercase tracking-[0.14em] text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
            >
              {slide.eyebrow}
            </span>
            <span 
              className="block text-xl sm:text-2xl font-serif italic tracking-wide leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fff2c8] via-[#e5a93c] to-[#c9a35b] mt-0.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {slide.title}
            </span>
          </h1>

          {/* Sub-label */}
          <p className="text-[11.5px] sm:text-xs font-sans font-light text-white/85 mb-4 leading-relaxed max-w-xs drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {slide.sub}
          </p>

          {/* Minimal & Creative CTA Button */}
          {slide.link.startsWith('http') || slide.link.startsWith('#') ? (
            <a 
              href={slide.link}
              target={slide.link.startsWith('http') ? '_blank' : '_self'}
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10.5px] font-semibold tracking-[0.18em] uppercase bg-gradient-to-r from-[#e5a93c] via-[#f7d383] to-[#c9a35b] text-[#120f09] shadow-[0_4px_18px_rgba(229,169,60,0.35)] active:scale-95 transition-transform"
            >
              <span>{slide.cta}</span>
              <ChevronRight size={14} />
            </a>
          ) : (
            <Link 
              to={slide.link}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10.5px] font-semibold tracking-[0.18em] uppercase bg-gradient-to-r from-[#e5a93c] via-[#f7d383] to-[#c9a35b] text-[#120f09] shadow-[0_4px_18px_rgba(229,169,60,0.35)] active:scale-95 transition-transform"
            >
              <span>{slide.cta}</span>
              <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* Auto-Slide Progress Counter & Dots */}
        <div className="flex flex-col items-center gap-2 mt-5">
          <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-md">
            <span className="font-mono text-[10px] font-semibold text-[#e5a93c]">
              0{currentSlide + 1}
            </span>
            <div className="w-16 h-[2px] bg-white/20 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-[#e5a93c] to-[#fff3cc] rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-semibold text-white/50">
              0{mobileSlides.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {mobileSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-5 bg-[#e5a93c]' : 'w-1.5 bg-white/30'
                }`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
      
    </section>
  );
}
