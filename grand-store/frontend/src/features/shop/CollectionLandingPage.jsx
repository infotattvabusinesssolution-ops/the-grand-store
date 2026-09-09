import React, { useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { collections } from '../../data/collectionData';
import ProductCard from '../../components/ProductCard';
import SEO from '../../components/SEO';
import { ChevronRight, SlidersHorizontal, Sparkles, BookOpen } from 'lucide-react';

export default function CollectionLandingPage({ onAdd, onWish, onCompare, compareItems = [] }) {
  const { slug } = useParams();
  const { products, loading } = useProducts();
  const [sortBy, setSortBy] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(12);

  const collection = collections[slug];

  // If the collection slug doesn't exist, redirect to /shop safely
  if (!collection) {
    return <Navigate to="/shop" replace />;
  }

  // Filter matching products for this collection
  const matchingProducts = useMemo(() => {
    if (!products || !products.length) return [];
    const filtered = products.filter(collection.filter);

    // Apply sorting
    if (sortBy === 'price-low') {
      return [...filtered].sort((a, b) => {
        const pA = parseFloat(String(a.price || '').replace(/[^0-9.]/g, '')) || 0;
        const pB = parseFloat(String(b.price || '').replace(/[^0-9.]/g, '')) || 0;
        return pA - pB;
      });
    }
    if (sortBy === 'price-high') {
      return [...filtered].sort((a, b) => {
        const pA = parseFloat(String(a.price || '').replace(/[^0-9.]/g, '')) || 0;
        const pB = parseFloat(String(b.price || '').replace(/[^0-9.]/g, '')) || 0;
        return pB - pA;
      });
    }
    if (sortBy === 'name') {
      return [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return filtered;
  }, [products, collection, sortBy]);

  const displayedProducts = matchingProducts.slice(0, visibleCount);

  // Schema.org ItemList structured data
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: collection.title,
    description: collection.metaDescription,
    numberOfItems: matchingProducts.length,
    itemListElement: matchingProducts.slice(0, 10).map((prod, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: prod.name,
      url: `https://grandstore.co.za/product/${prod.slug || prod.id}`
    }))
  };

  return (
    <div className="bg-[#0b0b0b] min-h-screen text-white pt-24 pb-20">
      <SEO
        title={collection.seoTitle}
        description={collection.metaDescription}
        url={`/collections/${collection.slug}`}
        schema={jsonLdSchema}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-white/50 mb-8 overflow-x-auto whitespace-nowrap">
          {collection.breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight size={12} className="text-white/30" />}
              {idx === collection.breadcrumbs.length - 1 ? (
                <span className="text-[#b58b38] font-medium">{crumb.name}</span>
              ) : (
                <Link to={crumb.path} className="hover:text-white transition-colors">
                  {crumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Hero Header */}
        <div className="border-b border-white/10 pb-10 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b58b38]/10 border border-[#b58b38]/20 text-[#b58b38] text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles size={14} />
            {collection.heroBadge}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-white mb-4">
            {collection.heroTitle}
          </h1>
          <p className="text-lg text-white/70 max-w-3xl font-light leading-relaxed mb-6">
            {collection.heroSubtitle}
          </p>

          {/* Editorial Guidance Box (Satisfies Section 5 requirement) */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-2.5 text-[#b58b38] text-sm font-semibold tracking-wide uppercase mb-3">
              <BookOpen size={16} />
              Editorial Buyer's Guide
            </div>
            <div className="space-y-3 text-sm text-white/70 leading-relaxed max-w-4xl">
              {collection.editorialIntro.map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
          <div className="text-sm text-white/60">
            Showing <strong className="text-white font-medium">{matchingProducts.length}</strong> curated bottles
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-white/50">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#151515] border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#b58b38]"
            >
              <option value="featured">Featured Curations</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white/5 animate-pulse h-96 rounded-xl" />
            ))}
          </div>
        ) : matchingProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5">
            <p className="text-white/60 text-lg mb-4">No bottles currently found in this category.</p>
            <Link
              to="/shop"
              className="inline-block px-6 py-3 bg-[#b58b38] hover:bg-[#c69a3f] text-black font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Browse Full Catalog
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  onAdd={onAdd}
                  onWish={onWish}
                  onCompare={onCompare}
                  isCompared={compareItems.some((item) => item.id === product.id)}
                />
              ))}
            </div>

            {visibleCount < matchingProducts.length && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-8 py-3 bg-transparent border border-white/20 hover:border-[#b58b38] text-white hover:text-[#b58b38] text-xs font-bold tracking-widest uppercase transition-all rounded-lg"
                >
                  Load More Bottles ({matchingProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
