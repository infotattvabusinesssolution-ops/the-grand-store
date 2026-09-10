import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const images = [
  "https://res.cloudinary.com/oioqrgj0/image/upload/v1788172726/grand-store/mobile-hero/y9huqamz2qmi19eztxvv.jpg",
  "https://res.cloudinary.com/oioqrgj0/image/upload/v1788172727/grand-store/mobile-hero/yxgydyne6gxvictqucig.jpg",
  "https://res.cloudinary.com/oioqrgj0/image/upload/v1788172728/grand-store/mobile-hero/n9uovcqrpnvvvnr0cxnj.jpg"
];

export default function HeroMobile() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full min-h-[85vh] py-12 flex flex-col justify-center items-center bg-[#050505] overflow-hidden select-none">
      
      {/* Background Images covering the whole container */}
      <div className="absolute inset-0 w-full h-full bg-black">
        {images.map((img, index) => (
          <img 
            key={img}
            src={img} 
            alt={`Luxury Bar Atmosphere ${index + 1}`} 
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${index === currentImage ? 'opacity-100' : 'opacity-0'}`}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}
        {/* Deep dark gradient overlay so text on top is perfectly readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-black/20" />
      </div>
      
      {/* Sparkle accents */}
      <div className="absolute top-[22%] left-[10%] text-[#ffeaa7] text-lg opacity-60 animate-luxury-glitter">✧</div>
      <div className="absolute top-[16%] right-[14%] text-[#ffd700] text-sm opacity-50 animate-luxury-glitter-delay-1">✦</div>

      {/* Content overlaid on image - centered */}
      <div className="relative z-10 w-full flex flex-col items-center text-center px-4 mx-auto">
        
        {/* Master Brand Headline */}
        <h1 
          className="font-serif not-italic text-center select-none m-0 p-0 mb-3 flex flex-col items-center"
          style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
        >
          <span className="block text-xs sm:text-sm tracking-[0.45em] text-[#e5a93c] mb-1 font-medium uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            The
          </span>
          <span className="block text-[clamp(2.15rem,9.2vw,3.4rem)] font-extrabold uppercase tracking-wider min-[400px]:tracking-widest leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#fff2c8] via-[#e5a93c] to-[#a86c0c] drop-shadow-[0_0_20px_rgba(229,169,60,0.45)] whitespace-nowrap">
            Grand Store
          </span>
        </h1>

        {/* Sub-label Luxury Curated Accent */}
        <p 
          className="text-[11px] sm:text-[12px] font-semibold tracking-[0.25em] uppercase text-white/90 mb-6 drop-shadow-[0_4px_8px_rgba(0,0,0,1)]"
          style={{ 
            fontFamily: "'Montserrat', 'Inter', sans-serif",
          }}
        >
          <span className="text-[#e5a93c]">Curated</span> Rare Spirits & Wine
        </p>

        {/* Minimal & Creative CTA Button */}
        <Link 
          to="/shop"
          className="group relative flex items-center gap-2.5 bg-white/5 backdrop-blur-md border border-[#c9a35b]/30 hover:border-[#c9a35b] text-white py-1.5 pl-4 pr-1.5 rounded-full overflow-hidden transition-all duration-500 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(229,169,60,0.4)]"
        >
          <span className="font-semibold uppercase tracking-[0.18em] text-[10px] z-10">Enter the Cellar</span>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#e5a93c] to-[#a86c0c] flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_10px_rgba(229,169,60,0.5)]">
            <ChevronRight size={12} className="text-black ml-[0.5px]" />
          </div>
          
          {/* Sweep animation effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-[#c9a35b]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        </Link>
        
      </div>
      
    </section>
  );
}
