import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProteaEmblem from './ProteaEmblem';
import ArrivalsMandala from './ArrivalsMandala';
import CardChakra from './CardChakra';

const categories = [
  { name: 'Red Wine', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1788172071/grand-store/assets/kw6gbh0wvlqetm5wjiei.jpg', href: '/shop?category=Wine&style=Red' },
  { name: 'White Wine', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1788172073/grand-store/assets/jexjcokjcfay8nf0x8ln.jpg', href: '/shop?category=Wine&style=White' },
  { name: 'Rosé', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1788172074/grand-store/assets/oslwjrhdlyszwqmizcpy.jpg', href: '/shop?category=Wine&style=Rose' },
  { name: 'Sparkling Wine', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1788172075/grand-store/assets/tmeyeilofkqdlkgfi73q.jpg', href: '/shop?category=Wine&style=Sparkling' },
  { name: 'Fortified Wine', image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1788172076/grand-store/assets/xdzemq49etwlkg0gark8.jpg', href: '/shop?category=Wine&style=Fortified' },
];

export default function WineCategoryShowcase() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const card = scrollRef.current.children[0];
      const gap = parseInt(window.getComputedStyle(scrollRef.current).gap) || 0;
      const scrollAmount = card ? card.offsetWidth + gap : 370;

      if (direction === 'right') {
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      } else {
        if (scrollLeft <= 10) {
          scrollRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => scroll('right'), 4000);
    return () => clearInterval(interval);
  }, [isPaused, scroll]);

  return (
    <section 
      className="arrivals-section showcase-section categories-showcase relative w-full bg-[#0a0c0e] text-white py-14 sm:py-20 md:py-24 overflow-hidden select-none" 
      id="wine-categories"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sacred African Sun / Mandala Background Vector Engraving Art (Top-Right) */}
      <ArrivalsMandala 
        gradientId="mandala-wine-categories" 
        position="top-right" 
        className="opacity-20 md:opacity-25 max-w-[700px] pointer-events-none" 
      />

      {/* Ambient subtle golden glow */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#caa458]/5 pointer-events-none rounded-full blur-[140px] opacity-50 z-0" />

      <div className="shell relative z-10 max-w-[1520px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Section Heading with Protea & Mandala Styling */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 md:mb-14 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
            <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
            <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#caa458]">
              Sacred Varietal Terroirs
            </span>
            <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
          </div>

          <h2 
            className="text-3xl sm:text-4xl lg:text-[46px] font-normal tracking-[-0.02em] leading-tight text-white font-serif mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Explore Top <span className="italic text-[#caa458]">Wine Categories</span>
          </h2>

          <p className="text-[#a0a4a8] text-sm sm:text-base font-light leading-relaxed font-sans max-w-xl">
            Discover celebrated vintages, terroir expressions, and rare allocations from the world's most prestigious vineyards.
          </p>
        </div>

        {/* Carousel Rail with Cards */}
        <div className="relative">
          <button 
            onClick={() => scroll('left')} 
            className="category-arrow-btn left" 
            aria-label="Previous category"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="category-showcase-grid" ref={scrollRef} style={{ scrollSnapType: 'none' }}>
            {categories.map((category) => (
              <Link 
                to={category.href} 
                className="category-showcase-card group relative" 
                key={category.name}
              >
                <div className="category-showcase-image-wrapper">
                  {/* Category Image */}
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    loading="lazy" 
                  />

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090a] via-[#08090a]/50 to-[#08090a]/40 pointer-events-none" />

                  {/* Sacred Mandala Sunburst Chakra */}
                  <CardChakra className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] opacity-40 group-hover:opacity-85 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none" />

                  {/* Overlay Content */}
                  <div className="category-showcase-overlay">
                    {/* Concentric Mandala Crest with King Protea */}
                    <div className="w-12 h-12 rounded-full border border-[#caa458]/40 bg-black/60 backdrop-blur-md flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(202,164,88,0.25)] group-hover:border-[#caa458] group-hover:scale-110 transition-all duration-500">
                      <ProteaEmblem className="w-6 h-6 text-[#caa458] group-hover:rotate-6 transition-transform duration-500" />
                    </div>

                    {/* Category Title */}
                    <h3 
                      className="category-showcase-title"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {category.name.toUpperCase()}
                    </h3>

                    {/* Mandala Accent Line */}
                    <div className="w-12 h-[1.5px] bg-gradient-to-r from-transparent via-[#caa458] to-transparent my-2.5 group-hover:w-24 transition-all duration-500" />

                    {/* Action Link */}
                    <span className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#caa458] group-hover:text-white transition-colors flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <span>Explore Varietals</span>
                      <span className="text-xs transition-transform transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')} 
            className="category-arrow-btn right" 
            aria-label="Next category"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
}

