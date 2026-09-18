import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Award, Compass, ShieldCheck, MapPin, Calendar, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import SEO from '../../components/SEO';
import { useProducts } from '../../context/ProductContext';
import ProductCard from '../../components/ProductCard';
import { brandData } from '../../data/brandData';

export default function BrandLandingPage({ onAdd, onWish, onCompare, compareItems = [] }) {
  const { slug } = useParams();
  const { products, loading } = useProducts();

  const brand = useMemo(() => {
    if (!slug) return null;
    const normalized = slug.toLowerCase().trim();
    if (brandData[normalized]) return brandData[normalized];

    // Fallback: try to construct a dynamic brand entry if products exist for this name
    const matchingProduct = products.find(
      (p) => (p.brand || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalized
    );

    if (matchingProduct && matchingProduct.brand) {
      return {
        slug: normalized,
        brandName: matchingProduct.brand,
        category: matchingProduct.category || matchingProduct.type || 'Luxury Spirits & Wines',
        country: matchingProduct.origin || matchingProduct.country || 'International',
        region: matchingProduct.region || 'Premier Terroir',
        heroImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop',
        tagline: `Exceptional Craftsmanship & Heritage by ${matchingProduct.brand}`,
        heritageStory: [
          `Discover the celebrated portfolio of ${matchingProduct.brand}, crafted with unyielding dedication to excellence and heritage.`,
          `Explore exceptional expressions available for purchase with cellar-direct provenance on The Grand Store.`
        ],
        seoTitle: `Buy ${matchingProduct.brand} Online — The Grand Store`,
        metaDescription: `Shop authentic bottles from ${matchingProduct.brand}. Guaranteed provenance, rare vintages, and worldwide delivery.`
      };
    }

    return null;
  }, [slug, products]);

  // Filter products by brand name
  const brandProducts = useMemo(() => {
    if (!brand) return [];
    const brandNameLower = brand.brandName.toLowerCase();
    return products.filter((p) => {
      const pBrand = (p.brand || '').toLowerCase();
      const pName = (p.fullName || p.name || '').toLowerCase();
      return pBrand.includes(brandNameLower) || brandNameLower.includes(pBrand) || pName.includes(brandNameLower);
    });
  }, [brand, products]);

  if (!loading && !brand) {
    return <Navigate to="/shop" replace />;
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-[#0a0907] flex items-center justify-center">
        <div className="w-12 h-12 border border-[#c9a35b]/20 border-t-[#c9a35b] rounded-full animate-spin" />
      </div>
    );
  }

  const brandCanonicalUrl = `https://grandstoreglobal.com/brand/${brand.slug}`;

  // Structured Data (Schema.org Brand + CollectionPage + ItemList + BreadcrumbList)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Brand',
        '@id': `${brandCanonicalUrl}#brand`,
        name: brand.brandName,
        description: brand.tagline,
        url: brandCanonicalUrl,
        ...(brand.country ? { countryOfOrigin: { '@type': 'Country', name: brand.country } } : {})
      },
      {
        '@type': 'CollectionPage',
        '@id': `${brandCanonicalUrl}#webpage`,
        name: brand.seoTitle || `${brand.brandName} Collection`,
        description: brand.metaDescription,
        url: brandCanonicalUrl,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://grandstoreglobal.com'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Brands',
              item: 'https://grandstoreglobal.com/shop'
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: brand.brandName,
              item: brandCanonicalUrl
            }
          ]
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: brandProducts.length,
          itemListElement: brandProducts.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': 'Product',
              name: p.fullName || p.name,
              url: `https://grandstoreglobal.com/product/${p.slug || p._id}`,
              image: p.image,
              offers: {
                '@type': 'Offer',
                price: p.price,
                priceCurrency: 'ZAR',
                availability: p.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'
              }
            }
          }))
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0a0907] text-[#eee8dd] font-sans pb-24 selection:bg-[#c9a35b] selection:text-black">
      <SEO
        title={brand.seoTitle}
        description={brand.metaDescription}
        image={brand.heroImage}
        url={`/brand/${brand.slug}`}
        type="website"
        schema={schema}
      />

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <ol className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#918a7f]">
          <li>
            <Link to="/" className="hover:text-gold-gradient transition-colors">Home</Link>
          </li>
          <li>/</li>
          <li>
            <Link to="/shop" className="hover:text-gold-gradient transition-colors">Brands</Link>
          </li>
          <li>/</li>
          <li className="text-[#f1ece1] font-semibold">{brand.brandName}</li>
        </ol>
      </nav>

      {/* Hero Banner */}
      <section className="relative w-full h-[55vh] min-h-[420px] max-h-[560px] overflow-hidden flex items-center justify-center">
        <img
          src={brand.heroImage}
          alt={brand.brandName}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.4] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0907] via-[#0a0907]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0907]/80 via-transparent to-[#0a0907]/80" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a35b]/30 bg-[#c9a35b]/10 backdrop-blur-md mb-6">
            <Sparkles size={14} className="text-[#e6c97a]" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#e6c97a] font-bold">
              {brand.category} · {brand.region}, {brand.country}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-wide mb-4 text-white drop-shadow-lg">
            {brand.brandName}
          </h1>

          <p className="text-[#d8b76d] font-serif italic text-lg sm:text-2xl max-w-2xl mx-auto leading-relaxed mb-6">
            "{brand.tagline}"
          </p>

          {brand.foundedYear && (
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-[#918a7f]">
              <Calendar size={14} className="text-[#c9a35b]" />
              <span>Distilling & Crafting Excellence Since {brand.foundedYear}</span>
            </div>
          )}
        </div>
      </section>

      {/* Brand Editorial & Tasting Guidance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Heritage Story */}
          <div className="lg:col-span-2 border border-white/10 bg-[#12110e]/95 p-8 sm:p-10 backdrop-blur-md shadow-2xl">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#c9a35b] font-bold mb-3 flex items-center gap-2">
              <Compass size={16} /> Heritage & Craftsmanship
            </h2>
            <h3 className="text-2xl sm:text-3xl font-serif text-white mb-6">
              The Legend of {brand.brandName}
            </h3>
            <div className="space-y-4 text-sm sm:text-base text-[#b6ada1] leading-relaxed">
              {brand.heritageStory.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {brand.signatureStyles && brand.signatureStyles.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#918a7f] mr-2">Signature Releases:</span>
                {brand.signatureStyles.map((style, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[#eee8dd]"
                  >
                    {style}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tasting Profile Card */}
          {brand.tastingProfile ? (
            <div className="border border-[#c9a35b]/30 bg-gradient-to-b from-[#181611] to-[#12110e] p-8 sm:p-10 shadow-2xl flex flex-col justify-between">
              <div>
                <h2 className="text-xs uppercase tracking-[0.25em] text-[#c9a35b] font-bold mb-3 flex items-center gap-2">
                  <Award size={16} /> Signature House Style
                </h2>
                <h3 className="text-2xl font-serif text-white mb-6">
                  Tasting Notes
                </h3>

                <div className="space-y-6 text-sm">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-[#e6c97a] font-bold mb-1">Nose</h4>
                    <p className="text-[#aaa296] leading-relaxed">{brand.tastingProfile.nose}</p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-[#e6c97a] font-bold mb-1">Palate</h4>
                    <p className="text-[#aaa296] leading-relaxed">{brand.tastingProfile.palate}</p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-[#e6c97a] font-bold mb-1">Finish</h4>
                    <p className="text-[#aaa296] leading-relaxed">{brand.tastingProfile.finish}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-xs text-[#918a7f]">
                <ShieldCheck size={18} className="text-[#c9a35b] shrink-0" />
                <span>100% Certified Bottle Provenance & Temperature-Controlled Shipping</span>
              </div>
            </div>
          ) : (
            <div className="border border-white/10 bg-[#12110e] p-8 flex items-center justify-center text-center">
              <div className="space-y-4">
                <ShieldCheck size={36} className="text-[#c9a35b] mx-auto" />
                <h4 className="font-serif text-xl text-white">Direct Provenance</h4>
                <p className="text-xs text-[#aaa296] leading-relaxed">
                  All bottles sourced directly from authorized brand distributors and historical cellar collections.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Product Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#c9a35b] font-bold mb-2">Available Expressions</h2>
            <h3 className="text-3xl sm:text-4xl font-serif text-white">
              The {brand.brandName} Collection ({brandProducts.length})
            </h3>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest text-[#918a7f] hover:text-[#c9a35b] transition-colors flex items-center gap-1"
          >
            <span>Explore Entire Cellar</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {brandProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brandProducts.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                onAdd={onAdd}
                onWish={onWish}
                onCompare={onCompare}
                isCompared={compareItems.some(
                  (i) => i.id === product.id || i._id === product._id
                )}
              />
            ))}
          </div>
        ) : (
          <div className="border border-white/10 bg-[#12110e] p-16 text-center">
            <h4 className="font-serif text-2xl text-white mb-2">Cellar Allocations Arriving Soon</h4>
            <p className="text-[#918a7f] max-w-md mx-auto text-sm mb-6">
              New rare expressions and seasonal allocations from {brand.brandName} are being received into our climate-controlled cellars.
            </p>
            <Link
              to="/shop"
              className="inline-block px-6 py-3 border border-[#c9a35b] bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-xs hover:bg-[#e6c97a] transition-colors"
            >
              Browse Available Bottles
            </Link>
          </div>
        )}
      </section>

      {/* Back to Top / Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-white/10 flex justify-between items-center text-xs uppercase tracking-widest text-[#918a7f]">
        <Link to="/shop" className="hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Shop
        </Link>
        <span>The Grand Store — Curated Luxury</span>
      </div>
    </div>
  );
}
