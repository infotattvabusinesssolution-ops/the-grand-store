import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, ChevronLeft, ChevronRight, Tag, ArrowLeft } from 'lucide-react';
import api from '../../api';

export default function AdvertisedProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/advertisements/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#0a0907] flex items-center justify-center">
        <div className="text-[var(--color-ivory)]">Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#0a0907] flex items-center justify-center flex-col">
        <div className="text-red-500 mb-4">{error || 'Product not found'}</div>
        <Link to="/" className="text-[#e1bd70] hover:text-white uppercase tracking-widest text-xs">Return Home</Link>
      </div>
    );
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-[#0a0907]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link to="/" className="inline-flex items-center gap-2 text-[#e1bd70] hover:text-white mb-8 transition-colors text-xs uppercase tracking-widest">
          <ArrowLeft size={16} /> Back to Discover
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-[#11100d] border border-white/5 rounded-2xl overflow-hidden relative group">
              {product.images && product.images.length > 0 ? (
                <>
                  <img 
                    src={product.images[currentImageIndex]} 
                    alt={product.title} 
                    className="w-full h-full object-contain p-8"
                  />
                  {product.images.length > 1 && (
                    <>
                      <button 
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-ivory-muted)]">
                  No Image Available
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      currentImageIndex === index ? 'border-[#e1bd70]' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <img src={img} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="flex flex-col h-full">
            <div className="mb-8">
              {product.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e1bd70]/10 text-[#e1bd70] border border-[#e1bd70]/20 rounded-full text-[10px] uppercase tracking-widest font-bold mb-4">
                  <Tag size={12} /> {product.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-serif text-[var(--color-ivory)] mb-2 leading-tight">
                {product.title}
              </h1>
              <p className="text-sm uppercase tracking-widest text-[#e1bd70] font-bold">
                By {product.brand}
              </p>
            </div>

            {product.tagline && (
              <div className="text-xl text-[var(--color-ivory-muted)] italic font-serif mb-8 border-l-2 border-[#e1bd70] pl-4">
                "{product.tagline}"
              </div>
            )}

            {product.price && (
              <div className="text-3xl text-white font-light mb-8">
                {product.price}
              </div>
            )}

            <div className="prose prose-invert max-w-none mb-8">
              <h3 className="text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] mb-4 border-b border-white/10 pb-2">
                About this offering
              </h3>
              <p className="text-[var(--color-ivory)] leading-relaxed whitespace-pre-wrap text-lg">
                {product.description}
              </p>
            </div>

            {product.features && product.features.length > 0 && (
              <div className="mb-12">
                <h3 className="text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] mb-4 border-b border-white/10 pb-2">
                  Key Specifications
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[var(--color-ivory)] text-sm">
                      <span className="text-[#e1bd70] mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto pt-8 border-t border-white/10">
              {product.linkUrl ? (
                <a 
                  href={product.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#e1bd70] text-black hover:bg-white font-bold uppercase tracking-widest text-sm rounded-xl transition-colors"
                >
                  Visit Official Website <ExternalLink size={18} />
                </a>
              ) : (
                <div className="text-[var(--color-ivory-muted)] text-sm italic">
                  No external link provided for this product.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
