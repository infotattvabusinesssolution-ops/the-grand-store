import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';

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
      // Calculate exact scroll amount based on the first card's width + actual CSS gap
      const card = scrollRef.current.children[0];
      const gap = parseInt(window.getComputedStyle(scrollRef.current).gap) || 0;
      const scrollAmount = card ? card.offsetWidth + gap : 370;

      if (direction === 'right') {
        // If we are at or near the very end, scroll back to start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      } else {
        // If we are at or near the very beginning, scroll to end
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
    const interval = setInterval(() => scroll('right'), 3500); // 3.5 seconds
    return () => clearInterval(interval);
  }, [isPaused, scroll]);

  return (
    <section 
      className="categories-showcase section-pad" 
      id="wine-categories"
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="categories-copy text-left md:text-center" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#eee8dd', margin: '0 0 1rem 0', textDecoration: 'underline', textDecorationColor: 'var(--gold)', textUnderlineOffset: '8px' }}>
          Explore Top <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Wine Categories</em>
        </h2>
        <p style={{ color: '#888', margin: 0, fontSize: '1.1rem' }}>
          Discover our finest wines, selected from celebrated regions and expressive vineyards.
        </p>
      </div>

      <button onClick={() => scroll('left')} className="category-arrow-btn left" aria-label="Previous">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <div className="category-showcase-grid" ref={scrollRef} style={{ scrollSnapType: 'none' }}>
        {categories.map((category) => (
          <Link to={category.href} className="category-showcase-card" key={category.name}>
            <div className="category-showcase-image-wrapper">
              <img src={category.image} alt={category.name} loading="lazy" />
              <div className="category-showcase-overlay">
                <h3 className="category-showcase-title">{category.name.toUpperCase()}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <button onClick={() => scroll('right')} className="category-arrow-btn right" aria-label="Next">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </section>
  );
}
