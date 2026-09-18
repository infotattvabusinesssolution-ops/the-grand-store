import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const mobileSlides = [
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_768,h_1376,b_gen_fill/v1789646474/grand-store/hero/grand_store_celebration_gathering.jpg",
    alt: "Friends celebrating at an evening gathering",
    badge: "Shared Moments & Fine Spirits",
    eyebrow: "Every",
    title: "Gathering.",
    sub: "Celebrated Together in Good Company",
    cta: "Explore Collection",
    link: "#arrivals"
  },
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_768,h_1376,b_gen_fill/v1789646759/grand-store/hero/south_african_wine_clean.jpg",
    alt: "South African Wine - Sourced From Farm",
    badge: "Estate Direct Cellar",
    eyebrow: "South Africa's",
    title: "Best Wine",
    sub: "Sourced Direct From Farm Estates",
    cta: "Explore Wine Collection",
    link: "/shop?category=Wine"
  },
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_768,h_1376,b_gen_fill/v1789646476/grand-store/hero/grand_store_events_toast.png",
    alt: "Exclusive Tastings & Events Toast",
    badge: "Private Tastings & Masterclasses",
    eyebrow: "Exclusive",
    title: "Events",
    sub: "Private Masterclasses & Tastings",
    cta: "Discover Events",
    link: "/events"
  },
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1788172728/grand-store/mobile-hero/n9uovcqrpnvvvnr0cxnj.jpg",
    alt: "Rare Vintages Live Auctions",
    badge: "Live Premier Bidding",
    eyebrow: "Rare Vintages",
    title: "Live Auctions",
    sub: "Exclusive Bidding on Vaulted Bottles",
    cta: "Explore Live Auctions",
    link: "/auction"
  },
  {
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1788172726/grand-store/mobile-hero/y9huqamz2qmi19eztxvv.jpg",
    alt: "Handcrafted Cigars & Spirits",
    badge: "Handcrafted Heritage",
    eyebrow: "Handcrafted Luxury",
    title: "Cigars & Lounge",
    sub: "Fine Dominican & Cuban Selection",
    cta: "Explore Cigars",
    link: "https://cigar.yogapranafitness.com"
  }
];

export default function HeroMobile() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mobileSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const slide = mobileSlides[currentSlide];

  return (
    <section className="relative w-full min-h-[85vh] py-16 flex flex-col justify-center items-center bg-[#050505] overflow-hidden select-none">
      
      {/* Background Images covering the whole container */}
      <div className="absolute inset-0 w-full h-full bg-black">
        {mobileSlides.map((s, index) => (
          <img 
            key={s.image}
            src={s.image} 
            alt={s.alt} 
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}
        {/* Deep dark gradient overlay so text on top is perfectly readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/65 to-black/25" />
      </div>
      
      {/* Sparkle accents */}
      <div className="absolute top-[25%] left-[10%] text-[#ffeaa7] text-lg opacity-60 animate-luxury-glitter">✧</div>
      <div className="absolute top-[15%] right-[15%] text-[#ffd700] text-sm opacity-50 animate-luxury-glitter-delay-1">✦</div>

      {/* Content overlaid on image at the bottom */}
      <div className="relative z-10 w-full flex flex-col items-center text-center px-6 mx-auto mt-16">

        {/* Master Brand / Slide Headline */}
        <h1 
          className="font-serif not-italic text-center select-none m-0 p-0 mb-4 flex flex-col items-center transition-all duration-500"
          style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
          key={slide.title}
        >
          <span className="block text-sm tracking-[0.4em] text-[#e5a93c] mb-1 font-medium uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            {slide.eyebrow}
          </span>
          <span className="block text-4xl sm:text-6xl font-extrabold uppercase tracking-widest leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fff2c8] via-[#e5a93c] to-[#a86c0c] drop-shadow-[0_0_15px_rgba(229,169,60,0.4)]">
            {slide.title}
          </span>
        </h1>

        {/* Sub-label Luxury Curated Accent */}
        <p 
          className="text-[12px] font-semibold tracking-[0.3em] uppercase text-white/90 mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,1)]"
          style={{ 
            fontFamily: "'Montserrat', 'Inter', sans-serif",
          }}
        >
          <span className="text-[#e5a93c]">{slide.sub.split(' ')[0]}</span> {slide.sub.split(' ').slice(1).join(' ')}
        </p>

        {/* Minimal & Creative CTA Button */}
        <Link 
          to={slide.link}
          className="group relative flex items-center gap-4 bg-white/5 backdrop-blur-md border border-[#c9a35b]/30 hover:border-[#c9a35b] text-white py-2.5 pl-7 pr-2.5 rounded-full overflow-hidden transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_0_25px_rgba(229,169,60,0.4)]"
        >
          <span className="font-semibold uppercase tracking-[0.2em] text-[11px] z-10 mt-[1px]">{slide.cta}</span>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e5a93c] to-[#a86c0c] flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(229,169,60,0.5)]">
            <ChevronRight size={16} className="text-black ml-[1px]" />
          </div>
          
          {/* Sweep animation effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-[#c9a35b]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        </Link>
        
        {/* Slide Indicator Dots */}
        <div className="flex items-center gap-2 mt-8">
          {mobileSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-[#e5a93c]' : 'w-1.5 bg-white/30'}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      
    </section>
  );
}
