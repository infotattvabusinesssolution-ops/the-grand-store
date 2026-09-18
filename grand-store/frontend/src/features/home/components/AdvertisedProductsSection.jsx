import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../api';

const ProductCard = ({ product }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = product.images && product.images.length > 0 ? product.images : [];

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

  return (
    <div className="group relative flex flex-col h-full bg-[#11100d] border border-white/5 hover:border-[#e1bd70]/30 transition-all duration-700 overflow-hidden">
      
      {/* Image Carousel */}
      <div className="relative h-[280px] overflow-hidden bg-[#0a0907] group/carousel flex items-center justify-center">
        {images.length > 0 ? (
          <img 
            src={images[currentIndex]} 
            alt={product.title}
            className="w-full h-full object-contain p-8 transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs bg-[#0a0907]">
            No Image Available
          </div>
        )}
        
        {/* Elegant Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none opacity-80"></div>
        
        {/* Carousel Controls */}
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full opacity-0 group-hover/carousel:opacity-100 hover:bg-[#e1bd70] hover:text-black transition-all duration-300 z-20"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full opacity-0 group-hover/carousel:opacity-100 hover:bg-[#e1bd70] hover:text-black transition-all duration-300 z-20"
            >
              <ChevronRight size={16} />
            </button>
            
            {/* Elegant Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-[2px] transition-all duration-300 ${i === currentIndex ? 'bg-[#e1bd70] w-6' : 'bg-white/40 w-2'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
          {product.category && (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-[9px] text-[#e1bd70] uppercase tracking-[0.2em] font-bold">
              {product.category}
            </div>
          )}
          {product.brand && !product.category && (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-[9px] text-white uppercase tracking-[0.2em] font-bold">
              {product.brand}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col relative bg-[#11100d]">
        {/* Price Tag positioned beautifully overlapping the image line */}
        {product.price && (
          <div className="absolute -top-5 right-6 bg-[#e1bd70] text-black px-3 py-2 text-xs font-bold tracking-wider rounded-sm shadow-2xl">
            {product.price}
          </div>
        )}

        {product.tagline && (
          <p className="text-[11px] text-[#e1bd70] uppercase tracking-widest font-bold mb-3">
            {product.tagline}
          </p>
        )}
        
        <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-3 leading-tight group-hover:text-[#e1bd70] transition-colors duration-500">
          <Link to={`/discover/${product._id}`} className="hover:underline decoration-1 underline-offset-4">
            {product.title}
          </Link>
        </h3>
        
        <p className="text-[var(--color-ivory-muted)] text-sm mb-6 line-clamp-2 leading-relaxed font-light">
          {product.description}
        </p>
        
        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/5">
          <Link 
            to={`/discover/${product._id}`}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-white hover:text-[#e1bd70] transition-colors group/link"
          >
            View Details 
            <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>
          {product.linkUrl && (
            <a 
              href={product.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 hover:text-white transition-colors"
              title="Visit External Site"
            >
              Visit Site <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdvertisedProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/advertisements/products');
        setProducts(res.data);
      } catch (err) {
        console.error('Error fetching advertised products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return null; // Just skip rendering while loading
  }

  return (
    <section className="section home-advertised-products home-product-editorial relative" id="advertised">
      {/* Background Glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#e1bd70]/5 pointer-events-none rounded-full blur-[120px] opacity-60 z-0"></div>

      <div className="shell relative z-10">
        <div className="section-heading flex flex-col items-start text-left md:flex-row md:text-left md:justify-between md:items-end gap-3 md:gap-0">
          <div className="flex flex-col items-start md:items-start w-full">
            <p className="eyebrow hidden md:block">Exclusive Showcases</p>
            <h2>Featured Partnerships</h2>
            <p className="section-intro hidden md:block">
              Discover extraordinary releases and exclusive offerings curated in partnership with the world's most esteemed luxury brands.
            </p>
          </div>
          <Link className="text-link arrow-link flex items-center gap-1" to="/advertise">
            <span>Advertise With Us</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-[#11100d] border border-white/5 p-16 text-center mt-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,189,112,0.05),transparent_70%)] pointer-events-none"></div>
            <h3 className="text-3xl font-serif text-[var(--color-ivory)] mb-4 relative z-10">Feature Your Legacy</h3>
            <p className="text-[var(--color-ivory-muted)] mb-8 max-w-md mx-auto relative z-10">
              Be the first to showcase your luxury brand to our exclusive audience of connoisseurs and collectors.
            </p>
            <Link className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-black bg-[#e1bd70] hover:bg-white px-8 py-4 transition-colors relative z-10" to="/advertise">
              Start Campaign <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex overflow-x-auto md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mt-8 md:mt-12 snap-x snap-mandatory pb-6 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
              {products.map((product) => (
                <div key={product._id} className="min-w-[85vw] sm:min-w-[400px] md:min-w-0 snap-center shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
