import React, { useState, useEffect, useRef } from 'react';
import Price from '../../components/ui/Price';
import { useParams, Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import api from '../../api';
import {
  MapPin, Phone, Mail, Globe, Heart,
  Wine, Utensils, Bed, Star, Users, Clock,
  ArrowLeft, ShoppingCart, ChevronRight, CheckCircle,
  ExternalLink, ArrowDown, Play, Download
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUtils';

const API = import.meta.env.VITE_API_URL;
const APP = import.meta.env.VITE_APP_URL || '';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export default function EstateDetail() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followStatus, setFollowStatus] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    api.get(`/estates/${slug}`)
      .then(res => {
        setData(res.data);
        setFollowerCount(res.data.estate.followers?.length || 0);
        const me = JSON.parse(localStorage.getItem('userInfo'));
        if (me && res.data.estate.followers?.includes(me._id)) setFollowing(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleFollow = async () => {
    const token = getToken();
    if (!token) { setFollowStatus('login'); return; }
    setFollowLoading(true);
    try {
      const res = await axios.post(`${API}/api/estates/${data.estate._id}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowing(res.data.following);
      setFollowerCount(res.data.followerCount);
      setFollowStatus(res.data.following ? 'success' : null);
    } catch { }
    finally { setFollowLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fcf9f2] flex items-center justify-center">
      <div className="w-12 h-12 border border-ink/20 border-t-ink rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#fcf9f2] flex flex-col items-center justify-center gap-6">
      <h2 className="font-serif text-3xl text-ink">Estate Not Found</h2>
      <Link to="/winefarm" className="text-ink/60 hover:text-ink uppercase tracking-widest text-xs transition-colors border-b border-ink/20 hover:border-ink">
        ← Back to Wine Estates
      </Link>
    </div>
  );

  const { estate, products = [] } = data;
  const { story = {}, vineyard = {}, hospitality = {}, contact = {} } = estate;

  // Construct valid cards based on filled data (Only Wine Tastings)
  const hCards = [];
  if (hospitality.hasTastings && hospitality.tastings) {
    hospitality.tastings.forEach(t => {
      if (t.name) {
        hCards.push({
          type: 'Wine Tasting',
          title: t.name,
          priceStr: t.price ? `R${t.price} / person` : null,
          image: resolveImageUrl(t.imageUrl) || resolveImageUrl(hospitality.tastingsImageUrl) || 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          desc: t.description,
          duration: t.duration,
          capacity: t.capacity
        });
      }
    });
  }

  const estateCanonicalUrl = `https://grandstoreglobal.com/estate/${estate.slug || slug}`;
  const winerySchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Winery', 'LocalBusiness'],
        '@id': `${estateCanonicalUrl}#winery`,
        name: estate.estateName,
        description: estate.tagline || story.headline || `Discover luxury wines and tastings at ${estate.estateName}, ${estate.region || 'South Africa'}.`,
        image: estate.heroImageUrl || 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        url: estateCanonicalUrl,
        ...(contact.phone ? { telephone: contact.phone } : {}),
        ...(contact.email ? { email: contact.email } : {}),
        ...(contact.website ? { sameAs: [contact.website] } : {}),
        address: {
          '@type': 'PostalAddress',
          streetAddress: contact.address || estate.region || 'Stellenbosch',
          addressRegion: estate.region || 'Western Cape',
          addressCountry: estate.country || 'ZA'
        },
        makesOffer: products.map(p => ({
          '@type': 'Offer',
          name: p.fullName || p.name,
          url: `https://grandstoreglobal.com/product/${p.slug || p.id || p._id}`,
          price: p.price,
          priceCurrency: 'ZAR',
          availability: p.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'
        })),
        amenityFeature: [
          ...(hospitality.hasTastings ? [{ '@type': 'LocationFeatureSpecification', name: 'Wine Tasting Room', value: true }] : []),
          ...(hospitality.hasRestaurant ? [{ '@type': 'LocationFeatureSpecification', name: 'Restaurant & Dining', value: true }] : []),
          ...(hospitality.hasAccommodation ? [{ '@type': 'LocationFeatureSpecification', name: 'Luxury Accommodation', value: true }] : [])
        ]
      },
      {
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
            name: 'Wine Estates',
            item: 'https://grandstoreglobal.com/winefarm'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: estate.estateName,
            item: estateCanonicalUrl
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen font-sans bg-white">
      <SEO
        title={`${estate.estateName} — ${estate.region || 'Wine Estate'}, ${estate.country || 'South Africa'}`}
        description={estate.tagline || story.headline || `Explore ${estate.estateName} in ${estate.region || 'South Africa'}. Browse award-winning wines, book cellar tastings, and order directly.`}
        image={estate.heroImageUrl}
        url={`/estate/${estate.slug || slug}`}
        type="business.business"
        schema={winerySchema}
      />
      
      <section className="relative w-full min-h-screen overflow-hidden flex flex-col justify-between">
        
        {/* Full background image */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
           <img 
             src={resolveImageUrl(estate.heroImageUrl) || 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791959974/grandstore-uploads/bruno-andreu-estate-hero-cover.jpg'} 
             alt={estate.estateName}
             className="w-full h-full object-cover object-center"
           />
           {/* Multi-layered luxury vignette & bottom fade */}
           <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/90" />
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/60 pointer-events-none" />
        </div>

        {/* Top Floating Navigation Bar */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
          <Link 
            to="/winefarm" 
            className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/90 hover:text-[#e1bd70] transition-all duration-300 py-2 px-3.5 sm:px-4 rounded-full bg-black/40 backdrop-blur-md border border-white/15 hover:border-[#e1bd70]/50 shadow-lg group"
          >
            <ArrowLeft size={13} className="transform group-hover:-translate-x-1 transition-transform" />
            <span>Wine Estates</span>
          </Link>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/90 hover:text-[#e1bd70] transition-all duration-300 py-2 px-3.5 sm:px-4 rounded-full bg-black/40 backdrop-blur-md border border-white/15 hover:border-[#e1bd70]/50 shadow-lg"
          >
            <Wine size={13} className="text-[#e1bd70]" />
            <span>Grand Store</span>
          </Link>
        </div>

        {/* Hero Central Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl mx-auto my-auto py-12">
          
          {/* Eyebrow Tagline */}
          <p className="text-white/90 uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[10px] md:text-xs mb-6 sm:mb-8 font-light drop-shadow-md">
            {estate.tagline || (story.foundedYear ? `Handcrafting wines since ${story.foundedYear}` : 'Creator of Iconic French Wines')}
          </p>
          
          {/* Hero Main Brand Presentation */}
          {(estate.slug === 'bruno-andreu' || slug === 'bruno-andreu' || estate.estateName?.toLowerCase().includes('bruno')) ? (
            <div className="flex flex-col items-center justify-center text-center my-2 max-w-5xl w-full px-4 select-none animate-fadeIn">
              {/* Emblem Row: BRUNO + Intertwined BA Monogram + ANDREU (No side lines, tight closure) */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-2.5">
                <span className="font-serif font-light text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-[0.15em] sm:tracking-[0.18em] drop-shadow-xl">
                  BRUNO
                </span>

                {/* Intertwined BA Monogram Emblem - tightly framed without excess void */}
                <div className="relative flex items-center justify-center w-7 sm:w-9 md:w-11 h-12 sm:h-16 md:h-20 select-none shrink-0 mx-0.5 sm:mx-1">
                  <span className="absolute font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-white leading-none top-0 -translate-x-0.5 sm:-translate-x-1 drop-shadow-2xl">
                    B
                  </span>
                  <span className="absolute font-serif text-2xl sm:text-4xl md:text-5xl font-light text-white/95 leading-none bottom-0 translate-x-0.5 sm:translate-x-1 drop-shadow-2xl">
                    A
                  </span>
                </div>

                <span className="font-serif font-light text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-[0.15em] sm:tracking-[0.18em] drop-shadow-xl">
                  ANDREU
                </span>
              </div>

              {/* Sub-label: FRANCE */}
              <span className="text-white/95 uppercase tracking-[0.45em] sm:tracking-[0.6em] md:tracking-[0.7em] text-xs sm:text-sm md:text-base font-light mt-3 sm:mt-4 drop-shadow-md">
                FRANCE
              </span>
            </div>
          ) : estate.logoUrl ? (
            <div className="flex flex-col items-center justify-center my-2 max-w-lg w-full px-4">
              <img
                src={resolveImageUrl(estate.logoUrl)}
                alt={estate.estateName}
                className="max-h-24 sm:max-h-32 md:max-h-36 w-auto object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
              />
            </div>
          ) : (
            <h1 className="font-serif font-light text-[clamp(32px,5vw,60px)] leading-[1.2] text-white uppercase tracking-normal drop-shadow-xl flex flex-col items-center gap-2">
              <span className="text-[0.45em] tracking-[0.3em] text-[#e1bd70] mb-1">Discover</span>
              {estate.estateName}
            </h1>
          )}
        </div>
        
        {/* Scroll Indicator */}
        <div className="relative z-20 pb-6 sm:pb-8 flex flex-col items-center justify-center">
          <button 
            onClick={() => {
              const target = document.getElementById('our-story') || document.getElementById('estate-wines');
              if (target) target.scrollIntoView({ behavior: 'smooth' });
              else window.scrollTo({ top: window.innerHeight - 60, behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-2 text-white/80 hover:text-[#e1bd70] transition-colors cursor-pointer group bg-transparent border-0"
          >
            <span className="uppercase tracking-[0.3em] text-[9px] font-semibold drop-shadow-sm group-hover:translate-y-0.5 transition-transform">
              Scroll to Explore
            </span>
            <ArrowDown size={14} className="animate-bounce drop-shadow-md text-[#e1bd70]" />
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          OUR STORY (Grid + Centered Text)
      ════════════════════════════════════════════ */}
      {(story.history || story.philosophy || story.winemaker) && (
        <section id="our-story" className="py-12 md:py-16 bg-white relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 flex flex-col lg:flex-row items-stretch gap-8 lg:gap-0">
            
            {/* Left Image Grid */}
            <div className="flex-1 w-full flex items-center justify-center">
               {(() => {
                  // Use only uploaded story images
                  const images = story.images?.filter(Boolean).slice(0,4) || [];
                  
                  if (images.length === 0) return null;
                  
                  const count = images.length;
                  const gridClass = 
                    count === 1 ? "grid-cols-1" :
                    count === 2 ? "grid-cols-2" :
                    count === 3 ? "grid-cols-2 grid-rows-2" : 
                    "grid-cols-2 grid-rows-2";
                    
                  return (
                    <div className={`grid ${gridClass} gap-3 p-3 w-full max-w-2xl aspect-square bg-white`}>
                      {images.map((img, i) => (
                        <div 
                          key={i} 
                          className={`w-full h-full overflow-hidden ${count === 3 && i === 0 ? "col-span-2 row-span-1" : ""}`}
                        >
                          <img src={resolveImageUrl(img)} alt="Our Story" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                        </div>
                      ))}
                    </div>
                  );
               })()}
            </div>
            
            {/* Right Content */}
            <div className="flex-1 w-full flex flex-col items-center justify-center text-center p-8 md:p-16 bg-white">
              <h2 className="font-serif text-[32px] md:text-[44px] text-black font-normal leading-[1.1] mb-8 uppercase tracking-widest">
                OUR STORY
              </h2>
              
              <div className="w-32 border-t border-dotted border-gray-300 mb-8" />
              
              <div className="text-gray-500 text-[13px] md:text-sm leading-[2] mb-8 font-light max-w-lg space-y-4">
                {story.history && <p>{story.history}</p>}
                {story.philosophy && <p>{story.philosophy}</p>}
                {story.winemaker && (
                  <p className="pt-2">
                    <span className="font-medium text-gray-700 block">{story.winemaker}</span>
                    {story.winemakerBio && <span className="text-xs">{story.winemakerBio}</span>}
                  </p>
                )}
              </div>
              
              <div className="w-32 border-t border-dotted border-gray-300" />
              
              {estate.awards?.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                   {estate.awards.map((a, i) => (
                      <span key={i} className="text-[10px] text-gray-400 uppercase tracking-widest px-3 py-1 border border-gray-100">{a}</span>
                   ))}
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          SHOP WINES (Card Layout)
      ════════════════════════════════════════════ */}
      {products.length > 0 && (
        <section id="estate-wines" className="py-24 bg-[#fcf9f2] relative border-t border-ink/5">
          <div className="max-w-7xl mx-auto px-4">
            
            {/* Header */}
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h4 className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-4">From the Cellar</h4>
              <h2 className="font-serif text-[40px] md:text-[48px] text-ink font-normal leading-[1.1] mb-4">
                Shop Our Wines
              </h2>
              <p className="text-ink/60 text-lg">
                Discover our exceptional selection of handcrafted wines.
              </p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(p => (
                <div key={p._id} className="flex flex-col bg-white border border-ink/10 group h-full">
                  
                  {/* Top Image Area */}
                  <Link to={`/product/${p.slug || p.id || p._id}`} className="block w-full h-72 relative overflow-hidden bg-ink/5 p-4">
                    {p.image || p.gallery?.[0] ? (
                      (() => {
                        const imgSrc = p.image || p.gallery[0];
                        const finalSrc = resolveImageUrl(imgSrc);
                        return (
                          <img 
                            src={finalSrc} 
                            alt={p.name}
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 drop-shadow-md"
                          />
                        );
                      })()
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wine size={48} className="text-ink/20" />
                      </div>
                    )}
                  </Link>
                  
                  {/* Content Area */}
                  <div className="p-6 md:p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <Link to={`/product/${p.slug || p.id || p._id}`}>
                        <h3 className="font-serif text-2xl text-ink font-medium hover:text-[#7b263c] transition-colors">
                          {p.name}
                        </h3>
                      </Link>
                    </div>
                    
                    <p className="text-sm text-ink/70 leading-relaxed mb-8 flex-1">
                      {p.description || "Experience the finest selection of our handcrafted wines. Each bottle reflects our dedication to quality and terroir."}
                    </p>
                    
                    {/* Footer Details */}
                    {p.factSheetPdf && (
                      <div className="pt-6 border-t border-ink/10 mt-auto">
                        <a 
                          href={`${API}${p.factSheetPdf}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-ink text-white hover:bg-black transition-colors text-xs uppercase tracking-widest font-medium"
                        >
                          <Download size={14} />
                          Factsheet
                        </a>
                      </div>
                    )}
                  </div>
                  
                </div>
              ))}
            </div>
            
          </div>
        </section>
      )}

      {/* ── Vineyard (Terroir and Craft) ── */}
      {(vineyard.altitude || vineyard.soil || vineyard.climate || vineyard.grapeVarieties?.length > 0 || vineyard.imageUrl) && (
        <section className="py-12 md:py-16 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            
            {/* Left Content */}
            <div className="flex-1 max-w-lg mb-12 md:mb-0">
              <h2 className="font-serif text-[40px] md:text-[48px] text-ink font-normal leading-[1.1] mb-8">
                Terroir and<br/>Craft
              </h2>
              
              {vineyard.viticulture && (
                <p className="text-ink/60 text-sm leading-[1.8] mb-10">
                  {vineyard.viticulture}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                {[
                  { label: 'Altitude', value: vineyard.altitude },
                  { label: 'Soil', value: vineyard.soil },
                  { label: 'Climate', value: vineyard.climate },
                ].filter(d => d.value).map((d, i) => (
                  <div key={d.label}>
                    <p className="text-[10px] text-ink/40 uppercase tracking-widest mb-2">{d.label}</p>
                    <p className="text-ink text-sm font-medium">{d.value}</p>
                  </div>
                ))}
              </div>

              {vineyard.grapeVarieties?.length > 0 && (
                <div className="mb-8 pt-6 border-t border-ink/10">
                  <p className="text-[10px] text-ink/40 uppercase tracking-widest mb-3">Grape Varieties</p>
                  <div className="flex flex-wrap gap-2">
                    {vineyard.grapeVarieties.map((g, i) => (
                      <span key={i} className="text-ink/80 text-xs border border-ink/20 px-3 py-1 bg-white">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {vineyard.sustainability && (
                <div className="mt-8 pt-6 border-t border-ink/10">
                   <p className="text-[10px] text-green-600/70 uppercase tracking-widest mb-2">Sustainability</p>
                   <p className="text-ink/60 text-sm leading-relaxed">{vineyard.sustainability}</p>
                </div>
              )}
            </div>
            
            {/* Right Image */}
            {vineyard.imageUrl && (
              <div className="flex-1 w-full">
                <div className="w-full aspect-[16/9] md:aspect-[4/3] lg:aspect-[16/9] overflow-hidden">
                  <img 
                    src={vineyard.imageUrl} 
                    alt="Vineyard" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          WINE TASTINGS
      ════════════════════════════════════════════ */}
      {(hCards.length > 0 || hospitality.title || hospitality.subtitle) && (
        <section className="py-24 md:py-32 bg-[#fcf9f2] relative">
          <div className="max-w-7xl mx-auto px-4">
            
            {/* Simplified Top Text Section */}
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="font-serif text-[40px] md:text-[48px] text-ink font-normal mb-4">
                {hospitality.title || 'Wine Tastings'}
              </h2>
              <p className="text-ink/60 text-lg">
                {hospitality.subtitle || 'Discover our wines through guided tasting experiences.'}
              </p>
            </div>

            {/* Grid of Experiences / Packages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hCards.map((card, i) => (
                <div key={i} className="flex flex-col bg-white border border-ink/10 h-full group">
                  {/* Top Image Area */}
                  {card.image ? (
                    <div className="w-full h-64 overflow-hidden relative">
                      <img src={resolveImageUrl(card.image)} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-4 left-4 bg-ink text-white text-[10px] uppercase tracking-widest px-3 py-1">
                        {card.type}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-16 relative bg-ink/5 border-b border-ink/10">
                      <div className="absolute top-4 left-4 bg-ink text-white text-[10px] uppercase tracking-widest px-3 py-1">
                        {card.type}
                      </div>
                    </div>
                  )}

                  {/* Content Area */}
                  <div className="p-8 flex flex-col flex-1">
                    <h4 className="font-serif text-2xl mb-4 text-ink">{card.title}</h4>
                    
                    {card.subtitle && <p className="text-sm font-medium text-ink/80 mb-4">{card.subtitle}</p>}
                    {card.desc && <p className="text-sm text-ink/70 leading-relaxed mb-6 flex-1">{card.desc}</p>}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-auto pt-6 border-t border-ink/10">
                      {card.duration && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Duration</p>
                          <p className="text-sm text-ink">{card.duration}</p>
                        </div>
                      )}
                      {card.capacity && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Max Guests</p>
                          <p className="text-sm text-ink">{card.capacity}</p>
                        </div>
                      )}
                      {card.priceStr && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Price</p>
                          <p className="text-sm text-ink">{card.priceStr}</p>
                        </div>
                      )}
                      {card.phone && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Phone</p>
                          <p className="text-sm text-ink">{card.phone}</p>
                        </div>
                      )}
                      {card.email && (
                        <div className="col-span-2 mt-2">
                          <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Email</p>
                          <p className="text-sm text-ink break-all">{card.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* ════════════════════════════════════════════
          RESTAURANT
      ════════════════════════════════════════════ */}
      {hospitality.hasRestaurant && (hospitality.restaurant?.name || hospitality.restaurant?.imageUrl) && (
        <section className="bg-white border-t border-ink/5">
          <div className="flex flex-col md:flex-row min-h-[500px]">
            {/* Image Side */}
            <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full bg-ink/5">
              {hospitality.restaurant?.imageUrl && (
                <img src={resolveImageUrl(hospitality.restaurant.imageUrl)} alt={hospitality.restaurant.name || 'Restaurant'} className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
            {/* Content Side */}
            <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-4">Dining</span>
              <h2 className="font-serif text-3xl md:text-5xl text-ink mb-6">
                {hospitality.restaurant?.name || 'Restaurant'}
              </h2>
              {hospitality.restaurant?.description && (
                <p className="text-ink/70 leading-relaxed mb-8 max-w-lg text-lg">
                  {hospitality.restaurant.description}
                </p>
              )}
              
              <div className="flex flex-col gap-4 border-t border-ink/10 pt-8 mt-auto">
                {hospitality.restaurant?.openingHours && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Opening Hours</p>
                    <p className="text-ink font-medium">{hospitality.restaurant.openingHours}</p>
                  </div>
                )}
                {hospitality.restaurant?.phoneNumber && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Reservations</p>
                    <p className="text-ink font-medium">{hospitality.restaurant.phoneNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          ACCOMMODATION
      ════════════════════════════════════════════ */}
      {hospitality.hasAccommodation && (hospitality.accommodation?.description || hospitality.accommodation?.imageUrl) && (
        <section className="bg-ink text-white">
          <div className="flex flex-col md:flex-row-reverse min-h-[500px]">
            {/* Image Side */}
            <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full bg-white/5">
              {hospitality.accommodation?.imageUrl && (
                <img src={resolveImageUrl(hospitality.accommodation.imageUrl)} alt="Accommodation" className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
            {/* Content Side */}
            <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4">Stay</span>
              <h2 className="font-serif text-3xl md:text-5xl mb-6">
                {hospitality.accommodation?.roomTypes?.[0] || 'Sleep Among The Vines'}
              </h2>
              {hospitality.accommodation?.description && (
                <p className="text-white/70 leading-relaxed mb-8 max-w-lg text-lg">
                  {hospitality.accommodation.description}
                </p>
              )}
              
              <div className="flex flex-col gap-4 border-t border-white/10 pt-8 mt-auto">
                {hospitality.accommodation?.priceFrom && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Starting From</p>
                    <p className="font-medium"><Price amount={hospitality.accommodation.priceFrom} /> / night</p>
                  </div>
                )}
                {hospitality.accommodation?.bookingEmail && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Booking Enquiries</p>
                    <p className="font-medium">{hospitality.accommodation.bookingEmail}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          OTHER EXPERIENCES
      ════════════════════════════════════════════ */}
      {hospitality.experiences?.length > 0 && (
        <section className="py-24 md:py-32 bg-white relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="font-serif text-[40px] md:text-[48px] text-ink font-normal mb-4">
                Beyond Wine
              </h2>
              <p className="text-ink/60 text-lg">
                Explore more unique experiences on our estate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hospitality.experiences.map((exp, i) => (
                <div key={i} className="bg-[#cc8e6b] text-white flex flex-col items-center text-center overflow-hidden group">
                  <div className="w-full h-56 relative overflow-hidden bg-white/10">
                    <img src={exp.imageUrl || 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} alt={exp.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-8 md:p-12 flex flex-col flex-1 w-full items-center">
                    <h4 className="font-serif text-2xl md:text-3xl mb-4">{exp.name}</h4>
                    {exp.description && <p className="text-white/90 leading-relaxed mb-8 flex-1">{exp.description}</p>}
                    
                    <div className="w-full grid grid-cols-2 gap-4 border-t border-white/20 pt-6 mt-auto text-left">
                    {exp.duration && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Duration</p>
                        <p className="text-sm">{exp.duration}</p>
                      </div>
                    )}
                    {exp.capacity && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Max Guests</p>
                        <p className="text-sm">{exp.capacity}</p>
                      </div>
                    )}
                    {exp.price && (
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Price</p>
                        <p className="text-sm"><Price amount={exp.price} /> / person</p>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* ════════════════════════════════════════════
          CONTACT & FOOTER (Matches Dark Footer)
      ════════════════════════════════════════════ */}
      <footer className="bg-[#1a1a1a] text-white">
        
        {/* Top Banner for Contact/Visit */}
        <div className="relative h-[250px] flex items-center justify-center overflow-hidden">
          {/* Ask user to replace placeholder */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="font-serif text-3xl md:text-5xl">Experience the wines</h2>
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs uppercase tracking-widest border-b border-white pb-1 hover:text-[#c9a35b] transition-colors">
                Contact Us <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row gap-12">
          
          <div className="flex-1 flex flex-col md:flex-row gap-12">
            {/* Contact Details */}
            <div className="flex-1 bg-[#262422] p-10">
              <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-6 font-bold">Contact</h4>
              {contact.address && (
                <p className="text-sm text-white/80 leading-loose mb-8">
                  {contact.address}
                </p>
              )}
              {contact.phone && <p className="text-sm text-white/80 mb-2">T. {contact.phone}</p>}
              {contact.email && <p className="text-sm text-white/80 mb-8">E. {contact.email}</p>}
              
              {/* Socials */}
              <div className="flex gap-4">
                {contact.website && (
                   <a href={contact.website} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors text-xs">W</a>
                )}
                {contact.instagram && (
                   <a href={`https://instagram.com/${contact.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors text-xs">IG</a>
                )}
              </div>
            </div>
            
            {/* Visit Us */}
            <div className="flex-1 bg-[#3a3532] p-10">
              <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-6 font-bold">Visit us</h4>
              <p className="text-sm text-white/80 leading-loose mb-8">
                {hospitality.restaurant?.openingHours || 'Contact us for opening hours'}
              </p>
              {contact.mapLink && (
                <a href={contact.mapLink} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 border border-white/20 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                  Get Directions
                </a>
              )}
            </div>
          </div>

          {/* Right Side Info Block with Background Image */}
          <div className="flex-1 relative overflow-hidden p-10 flex items-center justify-center text-center border border-white/10">
             <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${estate.heroImageUrl || 'https://images.unsplash.com/photo-1565922336365-1d44eb37a06a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'})` }} />
             <div className="absolute inset-0 bg-black/70" />
             <div className="relative z-10 flex flex-col items-center">
               <span className="block text-[10px] uppercase tracking-widest text-white/70 mb-4 font-bold">{estate.region}</span>
               <h2 className="font-serif text-3xl md:text-4xl text-white mb-8 leading-tight">{estate.estateName}</h2>
               <button onClick={handleFollow} className="inline-block bg-transparent border-2 border-[#c9a35b] text-[#c9a35b] hover:bg-[#c9a35b] hover:text-black uppercase text-[10px] font-bold tracking-widest px-8 py-4 transition-all duration-300 shadow-lg hover:shadow-xl rounded-none">
                 {following ? 'Following Estate' : 'Follow Estate'}
               </button>
             </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto px-4 py-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/40">
          <p>© {new Date().getFullYear()} {estate.estateName}. All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/winefarm" className="hover:text-white transition-colors">Back to Estates</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
