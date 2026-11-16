import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../../api';

// Curated partner wineries & distilleries with high-res verified imagery & active catalog
const DEFAULT_PARTNERS = [
  {
    slug: 'dogliotti-1870',
    estateName: 'Dogliotti 1870',
    type: 'Historic Winery',
    region: 'Castagnole delle Lanze, Piedmont',
    country: 'Italy',
    heroImageUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792238830/grandstore-uploads/estate/dogliotti-1870/dogliotti_langhe_monferrato_hero.jpg',
    tagline: 'Piedmont’s Fine Wines Since 1870 — Tra Langhe e Monferrato',
  },
  {
    slug: 'maison-dobbe',
    estateName: 'Maison Dobbé Cognac',
    type: 'Heritage Distillery',
    region: 'Salignac-sur-Charente, Cognac',
    country: 'France',
    heroImageUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791356046/grandstore-uploads/upload-c1cf29fd-a099-411f-8586-c324f89bac4f.jpg',
    tagline: 'Ten Generations of Artisan Cognac Distillation • France',
  },
  {
    slug: 'tesselaarsdal-wines',
    estateName: 'Tesselaarsdal Wines',
    type: 'Boutique Winery',
    region: 'Hemel-en-Aarde Ridge, Overberg',
    country: 'South Africa',
    heroImageUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165576/grandstore-uploads/estate/tesselaarsdal/vineyard_hero.jpg',
    tagline: 'Historic Cool-Climate Pinot Noir & Chardonnay by Berene Sauls',
  },
  {
    slug: 'bruno-andreu',
    estateName: 'Bruno Andreu',
    type: 'Iconic Estate',
    region: 'Languedoc-Roussillon (Montblanc)',
    country: 'France',
    heroImageUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792146587/grandstore-uploads/estate/bruno-andreu/ba_domaine_villa_hero.png',
    tagline: 'Creator of Iconic Wines — Emotion in Every Glass',
  },
  {
    slug: 'mont-rochelle-reserve-estates',
    estateName: 'Mont Rochelle Reserve Estates',
    type: 'Premier Wine Estate',
    region: 'Franschhoek, Western Cape',
    country: 'South Africa',
    heroImageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1920&q=80',
    tagline: 'Bespoke handcrafted terroir and rare library vintages in Franschhoek',
  },
  {
    slug: 'cantina-del-conte',
    estateName: 'Cantina del Conte',
    type: 'Heritage Winery',
    region: 'Grinzane Cavour, Piedmont',
    country: 'Italy',
    heroImageUrl: '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg',
    tagline: 'Heirs to Count Cavour’s Historic Vineyards Since 1921',
  },
  {
    slug: 'long-dog-wines',
    estateName: 'Long Dog Wines',
    type: 'Boutique Vineyard',
    region: 'Simonsberg, Stellenbosch',
    country: 'South Africa',
    heroImageUrl: '/assets/estate/long-dog-wines/hero_vineyard.jpg',
    tagline: 'Handcrafted Cabernet Franc & Tannat from boutique Simonsberg vineyard',
  },
];

export default function PartnerWineriesSection() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [partners, setPartners] = useState(DEFAULT_PARTNERS);

  useEffect(() => {
    let isMounted = true;
    api.get('/estates')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.value;
        if (Array.isArray(list) && list.length > 0) {
          // Merge dynamic API results with fallback metadata to ensure complete imagery & text
          const merged = list
            .filter((e) => e && e.slug && e.estateName && !e.estateName.toLowerCase().includes('crazy') && !e.heroImageUrl?.includes('giulianivini.com'))
            .map((e) => {
              const fallback = DEFAULT_PARTNERS.find((d) => d.slug === e.slug);
              return {
                slug: e.slug,
                estateName: e.estateName,
                type: fallback?.type || (e.country === 'France' && e.estateName.includes('Cognac') ? 'Heritage Distillery' : 'Partner Winery'),
                region: e.region || fallback?.region || '',
                country: e.country || fallback?.country || '',
                heroImageUrl: e.heroImageUrl || fallback?.heroImageUrl || '',
                tagline: e.tagline || fallback?.tagline || '',
              };
            });
          if (merged.length > 0) {
            setPartners(merged);
          }
        }
      })
      .catch(() => {
        // Keep DEFAULT_PARTNERS if API is temporarily unavailable
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const card = scrollRef.current.children[0];
      const gap = parseInt(window.getComputedStyle(scrollRef.current).gap, 10) || 20;
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
    const interval = setInterval(() => scroll('right'), 3500);
    return () => clearInterval(interval);
  }, [isPaused, scroll]);

  return (
    <section
      className="categories-showcase section-pad"
      id="partner-wineries"
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="categories-copy text-left md:text-center" style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-serif)',
            color: '#eee8dd',
            margin: '0 0 1rem 0',
            textDecoration: 'underline',
            textDecorationColor: 'var(--gold)',
            textUnderlineOffset: '8px',
          }}
        >
          Partner <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Wineries & Distilleries</em>
        </h2>
        <p style={{ color: '#888', margin: 0, fontSize: '1.1rem' }}>
          Direct access to world-renowned estates, heritage cellars, and certified master distillers.
        </p>
      </div>

      <button
        type="button"
        onClick={() => scroll('left')}
        className="category-arrow-btn left"
        aria-label="Previous"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className="category-showcase-grid" ref={scrollRef} style={{ scrollSnapType: 'none' }}>
        {partners.map((partner) => (
          <Link
            to={`/estate/${partner.slug}`}
            className="category-showcase-card group/partner relative block"
            key={partner.slug}
          >
            <div className="category-showcase-image-wrapper">
              <img
                src={partner.heroImageUrl}
                alt={partner.estateName}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {/* Top Vignette with Country & Type Tag */}
              <div className="absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e1bd70] bg-black/60 px-2.5 py-1 rounded border border-[#c9a35b]/30 backdrop-blur-sm">
                  {partner.country || 'Certified'}
                </span>
                <span className="text-[10px] font-medium tracking-wider text-[#d5cebf]/80 uppercase">
                  {partner.type}
                </span>
              </div>

              {/* Bottom Vignette with Estate Name & Region */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-10 text-left">
                <h3 className="category-showcase-title text-xl sm:text-2xl font-serif text-[#e1bd70] tracking-wide mb-1 group-hover/partner:text-[#f3d999] transition-colors">
                  {partner.estateName.toUpperCase()}
                </h3>
                <p className="text-xs text-[#d5cebf] font-mono tracking-wide line-clamp-1 mb-2">
                  {partner.region}
                </p>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#e1bd70] group-hover/partner:translate-x-1 transition-transform">
                  <span>Explore Estate</span>
                  <span>→</span>
                </div>
              </div>

              {/* Subtle hover gold border overlay */}
              <div className="absolute inset-0 border border-transparent group-hover/partner:border-[#c9a35b]/60 transition-colors pointer-events-none rounded" />
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        className="category-arrow-btn right"
        aria-label="Next"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </section>
  );
}

