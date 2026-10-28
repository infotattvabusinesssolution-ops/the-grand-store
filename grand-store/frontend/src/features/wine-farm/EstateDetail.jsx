import React, { useState, useEffect } from 'react';
import Price from '../../components/ui/Price';
import { useParams, Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import api from '../../api';
import axios from 'axios';
import {
  MapPin, Phone, Mail, Globe, Heart,
  Wine, Utensils, Bed, Star, Users, Clock,
  ArrowLeft, ArrowRight, ShoppingCart, ChevronRight, CheckCircle,
  ExternalLink, ArrowDown, Play, Download, Sparkles
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUtils';

const API = import.meta.env.VITE_API_URL;
const APP = import.meta.env.VITE_APP_URL || '';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

const getWineCategory = (product) => {
  const name = (product.name || '').toLowerCase();
  const range = (product.range || '').toLowerCase();
  const tags = (product.tags || []).map(t => String(t).toLowerCase());

  if (
    name.includes('0.0') ||
    name.includes('dealcoholized') ||
    name.includes('non-fermented') ||
    range.includes('alcohol free') ||
    tags.some(t => t.includes('alcohol free'))
  ) {
    return 'dealcoholized';
  }
  if (
    name.includes('sparkling') ||
    name.includes('methode') ||
    name.includes('pink petanque') ||
    name.includes('grande cuvee') ||
    range.includes('luxury') ||
    range.includes('limit') ||
    tags.some(t => t.includes('luxury'))
  ) {
    return 'prestige';
  }
  if (
    name.includes('pure') ||
    name.includes('pezenas') ||
    name.includes('tautavel') ||
    name.includes('caramany') ||
    name.includes('latour') ||
    name.includes('orange') ||
    range.includes('iconic')
  ) {
    return 'iconic';
  }
  if (
    name.includes('authentic') ||
    name.includes('aop') ||
    range.includes('authentic') ||
    tags.some(t => t.includes('authentic'))
  ) {
    return 'authentic';
  }
  return 'varietal';
};

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
        setFollowerCount(res.data.estate?.followers?.length || 0);
        const me = JSON.parse(localStorage.getItem('userInfo'));
        if (me && res.data.estate?.followers?.includes(me._id)) setFollowing(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleFollow = async () => {
    const token = getToken();
    if (!token) { setFollowStatus('login'); return; }
    setFollowLoading(true);
    try {
      const res = await api.post(`/estates/${data.estate._id}/follow`, {});
      setFollowing(res.data.following);
      setFollowerCount(res.data.followerCount);
      setFollowStatus(res.data.following ? 'success' : null);
    } catch {
      try {
        const res = await axios.post(`${API}/api/estates/${data.estate._id}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFollowing(res.data.following);
        setFollowerCount(res.data.followerCount);
        setFollowStatus(res.data.following ? 'success' : null);
      } catch {}
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fcf9f2] flex items-center justify-center">
      <div className="w-12 h-12 border border-ink/20 border-t-[#c9a35b] rounded-full animate-spin" />
    </div>
  );

  if (!data || !data.estate) return (
    <div className="min-h-screen bg-[#fcf9f2] flex flex-col items-center justify-center gap-6">
      <h2 className="font-serif text-3xl text-ink">Estate Not Found</h2>
      <Link to="/winefarm" className="text-ink/60 hover:text-ink uppercase tracking-widest text-xs transition-colors border-b border-ink/20 hover:border-ink">
        ← Back to Wine Estates
      </Link>
    </div>
  );

  const { estate, products = [] } = data;
  const { story = {}, vineyard = {}, hospitality = {}, contact = {} } = estate;

  // Determine whether this is Bruno Andreu, Dogliotti 1870, Cantina del Conte, Tesselaarsdal, or another estate (like Giuliani Vini)
  const isBrunoAndreu = estate.slug === 'bruno-andreu' || slug === 'bruno-andreu' || estate.estateName?.toLowerCase().includes('bruno');
  const isDogliotti = estate.slug === 'dogliotti-1870' || slug === 'dogliotti-1870' || estate.estateName?.toLowerCase().includes('dogliotti');
  const isCantinaDelConte = estate.slug === 'cantina-del-conte' || slug === 'cantina-del-conte' || estate.estateName?.toLowerCase().includes('conte') || estate.estateName?.toLowerCase().includes('cantina');
  const isTesselaarsdal = estate.slug === 'tesselaarsdal-wines' || slug === 'tesselaarsdal-wines' || estate.estateName?.toLowerCase().includes('tesselaarsdal');

  // Authentic tasting images for Tesselaarsdal fallback
  const tesselaarsdalPdfTastings = [
    '/assets/estate/tesselaarsdal/tesselaarsdal_cellar_tasting_table.jpg',
    '/assets/estate/tesselaarsdal/tesselaarsdal_wine_pour_tasting.jpg',
    '/assets/estate/tesselaarsdal/tesselaarsdal_bottles_candlelight.jpg'
  ];

  // Authentic PDF Page 1 tasting images for Bruno Andreu fallback
  const authenticPdfTastings = [
    '/assets/estate/bruno-andreu/ba_cheers_glasses.png',
    '/assets/estate/bruno-andreu/ba_blending_masterclass.png',
    '/assets/estate/bruno-andreu/ba_wine_thief_pour.png'
  ];

  // Authentic tasting images for Dogliotti 1870 fallback
  const dogliottiPdfTastings = [
    '/assets/estate/dogliotti-1870/dogliotti_historic_tasting_cellar.jpg',
    '/assets/estate/dogliotti-1870/dogliotti_brick_vault_cellar.jpg',
    '/assets/estate/dogliotti-1870/dogliotti_cask_barrel_hall.jpg',
    '/assets/estate/dogliotti-1870/dogliotti_winery_courtyard.jpg'
  ];

  // Authentic tasting images for Cantina del Conte fallback
  const cantinaPdfTastings = [
    '/assets/estate/cantina-del-conte/cantina_vineyards_hills.jpg',
    '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg',
    '/assets/estate/cantina-del-conte/cantina_historic_family_1921.jpg',
    '/assets/estate/cantina-del-conte/cantina_grappe_artisan.jpg'
  ];

  const hCards = [];
  if (hospitality.hasTastings && hospitality.tastings) {
    hospitality.tastings.forEach((t, idx) => {
      if (t.name) {
        const fallbackImg = isTesselaarsdal
          ? tesselaarsdalPdfTastings[idx % tesselaarsdalPdfTastings.length]
          : isCantinaDelConte
            ? cantinaPdfTastings[idx % cantinaPdfTastings.length]
            : isDogliotti
              ? dogliottiPdfTastings[idx % dogliottiPdfTastings.length]
              : isBrunoAndreu 
                ? authenticPdfTastings[idx % authenticPdfTastings.length] 
                : resolveImageUrl(hospitality.tastingsImageUrl) || 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

        hCards.push({
          type: 'Wine Tasting',
          title: t.name,
          subtitle: t.subtitle,
          priceStr: t.price ? `R${t.price} / person` : null,
          image: resolveImageUrl(t.imageUrl) || fallbackImg,
          fallbackImage: fallbackImg,
          desc: t.description,
          duration: t.duration,
          capacity: t.capacity,
          phone: t.phone,
          email: t.email
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
        description: estate.tagline || story.headline || `Discover luxury wines and tastings at ${estate.estateName}, ${estate.region || estate.country || 'our estate'}.`,
        image: estate.heroImageUrl || (isTesselaarsdal ? '/assets/estate/tesselaarsdal/vineyard_hero.jpg' : isCantinaDelConte ? '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg' : isDogliotti ? '/assets/estate/dogliotti-1870/dogliotti_langhe_monferrato_hero.jpg' : isBrunoAndreu ? '/assets/estate/bruno-andreu/domaine_villa_hero.png' : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'),
        url: estateCanonicalUrl,
        ...(contact.phone ? { telephone: contact.phone } : {}),
        ...(contact.email ? { email: contact.email } : {}),
        ...(contact.website ? { sameAs: [contact.website] } : {}),
        address: {
          '@type': 'PostalAddress',
          streetAddress: contact.address || estate.region || 'Estate Location',
          addressRegion: estate.region || 'Wine Region',
          addressCountry: estate.country || (isTesselaarsdal ? 'ZA' : (isDogliotti || isCantinaDelConte ? 'IT' : isBrunoAndreu ? 'FR' : 'ZA'))
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
    <div className="min-h-screen font-sans bg-white selection:bg-[#c9a35b]/30">
      <SEO
        title={
          isTesselaarsdal
            ? `${estate.estateName} — Hemel-en-Aarde Ridge, Overberg, South Africa | The Grand Store`
            : isCantinaDelConte
              ? `${estate.estateName} — Grinzane Cavour, Langhe, Piedmont, Italy | The Grand Store`
              : isDogliotti
                ? `${estate.estateName} — Castagnole delle Lanze, Piedmont, Italy | The Grand Store`
                : isBrunoAndreu 
                  ? `${estate.estateName} — ${estate.region || 'Languedoc-Roussillon'}, France | The Grand Store`
                  : `${estate.estateName} — ${estate.region || 'Wine Estate'}, ${estate.country || 'South Africa'} | The Grand Store`
        }
        description={estate.tagline || story.headline || `Explore ${estate.estateName} in ${estate.region || estate.country || 'our wine estate'}. Browse award-winning wines, book cellar tastings, and order directly.`}
        image={estate.heroImageUrl || (isTesselaarsdal ? '/assets/estate/tesselaarsdal/vineyard_hero.jpg' : isCantinaDelConte ? '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg' : isDogliotti ? '/assets/estate/dogliotti-1870/dogliotti_langhe_monferrato_hero.jpg' : isBrunoAndreu ? '/assets/estate/bruno-andreu/domaine_villa_hero.png' : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')}
        url={`/estate/${estate.slug || slug}`}
        type="business.business"
        schema={winerySchema}
      />
      
      {/* ════════════════════════════════════════════
          HERO SECTION
          (Bruno Andreu / Dogliotti 1870 / Cantina del Conte / Tesselaarsdal Wines custom design vs. Original Estate Design)
      ════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[92vh] sm:min-h-screen overflow-hidden flex flex-col justify-between">
        
        {/* Full Hero Background Image */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <img 
            src={resolveImageUrl(estate.heroImageUrl) || (isTesselaarsdal ? '/assets/estate/tesselaarsdal/vineyard_hero.jpg' : isCantinaDelConte ? '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg' : isDogliotti ? '/assets/estate/dogliotti-1870/dogliotti_langhe_monferrato_hero.jpg' : isBrunoAndreu ? '/assets/estate/bruno-andreu/domaine_villa_hero.png' : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')} 
            alt={estate.estateName}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = isTesselaarsdal
                ? '/assets/estate/tesselaarsdal/vineyard_hero.jpg'
                : isCantinaDelConte
                  ? '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg'
                  : isDogliotti 
                    ? '/assets/estate/dogliotti-1870/dogliotti_langhe_monferrato_hero.jpg'
                    : isBrunoAndreu 
                      ? '/assets/estate/bruno-andreu/domaine_villa_hero.png' 
                      : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
            }}
            className="w-full h-full object-cover object-center scale-100"
          />
          {isBrunoAndreu || isDogliotti || isCantinaDelConte || isTesselaarsdal ? (
            <>
              {/* Subtle warm luxury vignette to preserve scenery & cellar architecture */}
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/65 pointer-events-none" />
            </>
          ) : (
            <>
              {/* Original Multi-layered luxury vignette & bottom fade for Giuliani Vini & other estates */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/90" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/60 pointer-events-none" />
            </>
          )}
        </div>

        {/* Top Floating Navigation Bar */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
          <Link 
            to="/winefarm" 
            className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/90 hover:text-[#e1bd70] transition-all duration-300 py-2 px-3.5 sm:px-4 rounded-full bg-black/50 backdrop-blur-md border border-white/15 hover:border-[#e1bd70]/50 shadow-lg group"
          >
            <ArrowLeft size={13} className="transform group-hover:-translate-x-1 transition-transform" />
            <span>Join Wine Farm</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/winefarm#farms"
              className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/90 hover:text-[#e1bd70] transition-all duration-300 py-2 px-3.5 sm:px-4 rounded-full bg-black/50 backdrop-blur-md border border-white/15 hover:border-[#e1bd70]/50 shadow-lg"
            >
              <Wine size={13} className="text-[#e1bd70]" />
              <span>All Wine Estates</span>
            </Link>
            <Link
              to="/shop"
              className="hidden sm:inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/90 hover:text-[#e1bd70] transition-all duration-300 py-2 px-3.5 sm:px-4 rounded-full bg-black/50 backdrop-blur-md border border-white/15 hover:border-[#e1bd70]/50 shadow-lg"
            >
              <span>Grand Store Catalog</span>
            </Link>
          </div>
        </div>

        {/* Hero Central Brand Presentation */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl mx-auto my-auto py-12">
          {isCantinaDelConte ? (
            /* Cantina del Conte Specific Italian Piedmont & Grinzane Cavour Hero */
            <>
              <div className="flex items-center gap-2 mb-3 select-none">
                <div className="h-[1px] w-6 sm:w-12 bg-[#e1bd70]" />
                <span className="font-sans font-bold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[#e1bd70] text-[10px] sm:text-xs drop-shadow-md">
                  SINCE 1921 • AZIENDA PELISSERO
                </span>
                <div className="h-[1px] w-6 sm:w-12 bg-[#e1bd70]" />
              </div>

              <div className="flex flex-col items-center justify-center my-2 max-w-xl w-full px-4 select-none">
                <img
                  src={resolveImageUrl(estate.logoUrl) || '/assets/estate/cantina-del-conte/cantina_logo_transparent.png'}
                  alt="Cantina del Conte Crest"
                  className="max-h-24 sm:max-h-36 md:max-h-44 w-auto object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/estate/cantina-del-conte/cantina_logo_transparent.png';
                  }}
                />
              </div>

              <span className="text-white/95 uppercase tracking-[0.45em] sm:tracking-[0.6em] text-xs sm:text-sm font-light mt-2 drop-shadow-md select-none">
                GRINZANE CAVOUR • ROYAL BAROLO & BARBARESCO
              </span>

              <p className="font-serif italic text-white text-base sm:text-2xl md:text-3xl mt-5 sm:mt-8 tracking-wide drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] select-none">
                "Passionate Winemakers on Count Cavour's Historic Lands"
              </p>
            </>
          ) : isDogliotti ? (
            /* Dogliotti 1870 Specific Italian Piedmont Hero */
            <>
              <div className="flex items-center gap-2 mb-3 select-none">
                <div className="h-[1px] w-6 sm:w-12 bg-[#e1bd70]" />
                <span className="font-sans font-bold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[#e1bd70] text-[10px] sm:text-xs drop-shadow-md">
                  SINCE 1870 • PIEDMONT'S FINE WINES
                </span>
                <div className="h-[1px] w-6 sm:w-12 bg-[#e1bd70]" />
              </div>

              <div className="flex flex-col items-center justify-center my-2 max-w-xl w-full px-4 select-none">
                <img
                  src={resolveImageUrl(estate.logoUrl) || '/assets/estate/dogliotti-1870/dogliotti_logo_transparent.png'}
                  alt="Dogliotti 1870 Crest"
                  className="max-h-24 sm:max-h-36 md:max-h-44 w-auto object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/estate/dogliotti-1870/dogliotti_logo_transparent.png';
                  }}
                />
              </div>

              <span className="text-white/95 uppercase tracking-[0.45em] sm:tracking-[0.6em] text-xs sm:text-sm font-light mt-2 drop-shadow-md select-none">
                TRA LANGHE E MONFERRATO • UNESCO HERITAGE
              </span>

              <p className="font-serif italic text-white text-base sm:text-2xl md:text-3xl mt-5 sm:mt-8 tracking-wide drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] select-none">
                "Tradition, Atmosphere and Hospitality"
              </p>
            </>
          ) : isBrunoAndreu ? (
            /* Bruno Andreu Specific Hero: Creator of Iconic Wines + BA Emblem + Emotion in Every Glass */
            <>
              <h2 className="font-sans font-bold uppercase tracking-[0.22em] sm:tracking-[0.32em] text-white text-xs sm:text-base md:text-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] mb-4 sm:mb-6 select-none">
                CREATOR OF ICONIC WINES
              </h2>
              
              <div className="relative flex items-center justify-center w-full max-w-2xl px-2 my-2 sm:my-3 select-none">
                <div className="h-[1px] flex-1 max-w-[45px] sm:max-w-[100px] md:max-w-[140px] bg-white/70 shadow-sm" />

                <div className="flex items-center gap-2 sm:gap-4 md:gap-5 mx-2.5 sm:mx-5">
                  <span className="font-serif font-light text-3xl sm:text-5xl md:text-6xl text-white tracking-[0.16em] sm:tracking-[0.22em] drop-shadow-2xl">
                    BRUNO
                  </span>

                  <div className="relative flex items-center justify-center w-9 sm:w-13 md:w-16 h-14 sm:h-20 md:h-24 select-none shrink-0">
                    <span className="absolute font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-white leading-none top-0 -translate-x-0.5 sm:-translate-x-1 drop-shadow-2xl">
                      B
                    </span>
                    <span className="absolute font-serif text-3xl sm:text-5xl md:text-6xl font-light text-white leading-none bottom-0 translate-x-0.5 sm:translate-x-1 drop-shadow-2xl">
                      A
                    </span>
                  </div>

                  <span className="font-serif font-light text-3xl sm:text-5xl md:text-6xl text-white tracking-[0.16em] sm:tracking-[0.22em] drop-shadow-2xl">
                    ANDREU
                  </span>
                </div>

                <div className="h-[1px] flex-1 max-w-[45px] sm:max-w-[100px] md:max-w-[140px] bg-white/70 shadow-sm" />
              </div>

              <span className="text-white/95 uppercase tracking-[0.55em] sm:tracking-[0.75em] text-xs sm:text-sm font-light mt-1 sm:mt-2 drop-shadow-md select-none">
                FRANCE
              </span>

              <p className="font-sans font-bold text-white text-base sm:text-2xl md:text-3xl mt-6 sm:mt-10 tracking-wide drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] select-none">
                Emotion in Every Glass
              </p>
            </>
          ) : isTesselaarsdal ? (
            /* Tesselaarsdal Wines Specific South African Cool-Climate Hero */
            <>
              <div className="flex items-center gap-2 mb-3 select-none">
                <div className="h-[1px] w-6 sm:w-12 bg-[#e1bd70]" />
                <span className="font-sans font-bold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[#e1bd70] text-[10px] sm:text-xs drop-shadow-md">
                  10TH VINTAGE ANNIVERSARY • HEMEL-EN-AARDE RIDGE
                </span>
                <div className="h-[1px] w-6 sm:w-12 bg-[#e1bd70]" />
              </div>

              <div className="flex flex-col items-center justify-center my-2 max-w-xl w-full px-4 select-none">
                <img
                  src={resolveImageUrl(estate.logoUrl) || '/assets/estate/tesselaarsdal/logo_white.svg'}
                  alt="Tesselaarsdal Wines Logo"
                  className="max-h-16 sm:max-h-24 md:max-h-28 w-auto object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/estate/tesselaarsdal/logo_white.svg';
                  }}
                />
              </div>

              <span className="text-white/95 uppercase tracking-[0.45em] sm:tracking-[0.6em] text-xs sm:text-sm font-light mt-2 drop-shadow-md select-none">
                HERMANUS, OVERBERG • SOUTH AFRICA
              </span>

              <p className="font-serif italic text-white text-base sm:text-2xl md:text-3xl mt-5 sm:mt-8 tracking-wide drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] select-none">
                "Small-Batch Pinot Noir & Chardonnay Handcrafted by Berene Sauls"
              </p>
            </>
          ) : (
            /* Original Hero Design for Giuliani Vini and other estates */
            <>
              <p className="text-white/90 uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[10px] md:text-xs mb-6 sm:mb-8 font-light drop-shadow-md">
                {estate.tagline || (story.foundedYear ? `Handcrafting wines since ${story.foundedYear}` : 'Heritage Wine Estate')}
              </p>

              {estate.logoUrl ? (
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
            </>
          )}
        </div>
        
        {/* Scroll Indicator */}
        <div className="relative z-20 pb-5 sm:pb-7 flex flex-col items-center justify-center">
          <button 
            onClick={() => {
              const target = document.getElementById('our-story') || document.getElementById('estate-wines');
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1.5 text-white/80 hover:text-[#e1bd70] transition-colors cursor-pointer bg-transparent border-0 group"
          >
            <span className="uppercase tracking-[0.25em] text-[9px] font-medium drop-shadow-md">
              {isBrunoAndreu ? 'Explore Below' : 'Scroll to Explore'}
            </span>
            <ArrowDown size={14} className="animate-bounce text-[#e1bd70] drop-shadow-md" />
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          OUR STORY
      ════════════════════════════════════════════ */}
      {(story.history || story.philosophy || story.winemaker || story.images?.length > 0) && (
        <section id="our-story" className="py-16 md:py-24 bg-white relative overflow-hidden border-b border-gray-100">
          {isTesselaarsdal ? (
            /* Tesselaarsdal Wines Specific 4-Photo Heritage Story Layout (Balanced Authentic Photography) */
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              <div className="flex-1 w-full max-w-xl">
                <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-[#fcfaf6] border border-[#e8e2d5] rounded-sm shadow-sm">
                  {/* Photo 1: Berene Sauls in the vineyard */}
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100 rounded-xs shadow-xs">
                    <img 
                      src={resolveImageUrl(story.images?.[0]) || '/assets/estate/tesselaarsdal/tesselaarsdal_berene_vineyard.jpg'} 
                      alt="Berene Sauls Winemaker in Vineyard" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/tesselaarsdal/tesselaarsdal_berene_vineyard.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 pointer-events-none" />
                    <span className="absolute bottom-2.5 left-2.5 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2.5 py-1 backdrop-blur-md rounded-xs border border-white/10">
                      Berene Sauls • Founder & Winemaker
                    </span>
                  </div>

                  {/* Photo 2: Ridge high-density vineyards & terroir */}
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100 rounded-xs shadow-xs">
                    <img 
                      src={resolveImageUrl(story.images?.[1]) || '/assets/estate/tesselaarsdal/tesselaarsdal_vineyard_ridge.jpg'} 
                      alt="Hemel-en-Aarde Ridge Terroir" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/tesselaarsdal/tesselaarsdal_vineyard_ridge.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 pointer-events-none" />
                    <span className="absolute bottom-2.5 left-2.5 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2.5 py-1 backdrop-blur-md rounded-xs border border-white/10">
                      Hemel-en-Aarde Ridge Terroir
                    </span>
                  </div>

                  {/* Photo 3: Authentic wine thief drawing barrel sample */}
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100 rounded-xs shadow-xs">
                    <img 
                      src={resolveImageUrl(story.images?.[2]) || '/assets/estate/tesselaarsdal/tesselaarsdal_wine_thief_barrel.jpg'} 
                      alt="Cellar Craft Pinot Noir Barrel Tasting" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/tesselaarsdal/tesselaarsdal_wine_thief_barrel.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 pointer-events-none" />
                    <span className="absolute bottom-2.5 left-2.5 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2.5 py-1 backdrop-blur-md rounded-xs border border-white/10">
                      Cellar Craft • Barrel Maturation
                    </span>
                  </div>

                  {/* Photo 4: Official Tesselaarsdal French oak barrels */}
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100 rounded-xs shadow-xs">
                    <img 
                      src={resolveImageUrl(story.images?.[3]) || '/assets/estate/tesselaarsdal/tesselaarsdal_oak_barrels.png'} 
                      alt="Tesselaarsdal French Oak Barrels" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/tesselaarsdal/tesselaarsdal_oak_barrels.png'; }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 pointer-events-none" />
                    <span className="absolute bottom-2.5 left-2.5 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2.5 py-1 backdrop-blur-md rounded-xs border border-white/10">
                      French Oak & Clay Amphorae
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col items-start text-left p-2 sm:p-4">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#c9a35b] font-semibold mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Overberg Heritage Since 1810
                </span>
                <h2 className="font-serif text-[30px] sm:text-[38px] lg:text-[44px] text-ink font-normal leading-[1.15] mb-5 tracking-wide">
                  Cool-Climate Artistry in the Hemel-en-Aarde Ridge
                </h2>
                <div className="w-16 h-[2px] bg-[#c9a35b] mb-5" />
                <div className="text-gray-600 text-sm sm:text-base leading-[1.8] font-light space-y-3.5 max-w-xl">
                  {story.history && <p>{story.history}</p>}
                  {story.philosophy && (
                    <blockquote className="border-l-2 border-[#c9a35b] pl-3.5 italic text-ink/80 text-sm sm:text-base my-2">
                      "{story.philosophy}"
                    </blockquote>
                  )}
                  {story.winemaker && (
                    <div className="pt-2">
                      <span className="font-serif text-lg text-ink font-medium block">{story.winemaker}</span>
                      <span className="text-xs uppercase tracking-wider text-[#c9a35b] block mb-1">Founder & Winemaker</span>
                      {story.winemakerBio && <p className="text-xs text-gray-500 leading-relaxed font-light">{story.winemakerBio}</p>}
                    </div>
                  )}
                </div>
                {estate.awards?.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-6 pt-5 border-t border-gray-100 w-full max-w-xl">
                    {estate.awards.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-[#c9a35b] font-bold text-sm leading-none">•</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : isCantinaDelConte ? (
            /* Cantina del Conte Specific 4-Photo Heritage Story Layout */
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              <div className="flex-1 w-full max-w-xl">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#fcf9f2] border border-gray-200/80 rounded-sm shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[0]) || '/assets/estate/cantina-del-conte/cantina_historic_family_1921.jpg'} 
                      alt="Francesco Pelissero 1921" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/cantina-del-conte/cantina_historic_family_1921.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Francesco Pelissero • 1921
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[1]) || '/assets/estate/cantina-del-conte/cantina_vineyards_hills.jpg'} 
                      alt="Grinzane Cavour Vineyards" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/cantina-del-conte/cantina_vineyards_hills.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Grinzane Cavour Hills
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[2]) || '/assets/estate/cantina-del-conte/cantina_terroir_vineyard_map.jpg'} 
                      alt="Langhe & Roero Terroir" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/cantina-del-conte/cantina_terroir_vineyard_map.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Langhe & Roero Terroir
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[3]) || '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg'} 
                      alt="Castello di Grinzane Cavour" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Historic Winery & Castle
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col items-start text-left p-2 sm:p-4">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#c9a35b] font-semibold mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Piedmont Heritage Since 1921
                </span>
                <h2 className="font-serif text-[30px] sm:text-[38px] lg:text-[44px] text-ink font-normal leading-[1.15] mb-5 tracking-wide">
                  A Century of Winemaking Nobility in Grinzane Cavour
                </h2>
                <div className="w-16 h-[2px] bg-[#c9a35b] mb-5" />
                <div className="text-gray-600 text-sm sm:text-base leading-[1.8] font-light space-y-3.5 max-w-xl">
                  {story.history && <p>{story.history}</p>}
                  {story.philosophy && (
                    <blockquote className="border-l-2 border-[#c9a35b] pl-3.5 italic text-ink/80 text-sm sm:text-base my-2">
                      "{story.philosophy}"
                    </blockquote>
                  )}
                  {story.winemaker && (
                    <div className="pt-2">
                      <span className="font-serif text-lg text-ink font-medium block">{story.winemaker}</span>
                      <span className="text-xs uppercase tracking-wider text-[#c9a35b] block mb-1">Winemakers & Estate Custodians</span>
                      {story.winemakerBio && <p className="text-xs text-gray-500 leading-relaxed font-light">{story.winemakerBio}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isDogliotti ? (
            /* Dogliotti 1870 Specific 4-Photo Heritage Story Layout */
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              <div className="flex-1 w-full max-w-xl">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#fcf9f2] border border-gray-200/80 rounded-sm shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[0]) || '/assets/estate/dogliotti-1870/erik_dogliotti.jpg'} 
                      alt="Erik Dogliotti Winemaker" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/dogliotti-1870/erik_dogliotti.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Erik Dogliotti • Winemaker
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[1]) || '/assets/estate/dogliotti-1870/ivan_dogliotti.jpg'} 
                      alt="Ivan Dogliotti" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/dogliotti-1870/ivan_dogliotti.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Ivan Dogliotti • 5th Generation
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[2]) || '/assets/estate/dogliotti-1870/matteo_dogliotti.jpg'} 
                      alt="Matteo Dogliotti" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/dogliotti-1870/matteo_dogliotti.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Matteo Dogliotti • 5th Generation
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[3]) || '/assets/estate/dogliotti-1870/dogliotti_cask_barrel_hall.jpg'} 
                      alt="Dogliotti Cask Barrel Hall" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/dogliotti-1870/dogliotti_cask_barrel_hall.jpg'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Oak Cask Aging Cellars
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col items-start text-left p-2 sm:p-4">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#c9a35b] font-semibold mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Piedmont Heritage Since 1870
                </span>
                <h2 className="font-serif text-[30px] sm:text-[38px] lg:text-[44px] text-ink font-normal leading-[1.15] mb-5 tracking-wide">
                  Fifth Generation Viticulture in Langhe & Monferrato
                </h2>
                <div className="w-16 h-[2px] bg-[#c9a35b] mb-5" />
                <div className="text-gray-600 text-sm sm:text-base leading-[1.8] font-light space-y-3.5 max-w-xl">
                  {story.history && <p>{story.history}</p>}
                  {story.philosophy && (
                    <blockquote className="border-l-2 border-[#c9a35b] pl-3.5 italic text-ink/80 text-sm sm:text-base my-2">
                      "{story.philosophy}"
                    </blockquote>
                  )}
                  {story.winemaker && (
                    <div className="pt-2">
                      <span className="font-serif text-lg text-ink font-medium block">{story.winemaker}</span>
                      <span className="text-xs uppercase tracking-wider text-[#c9a35b] block mb-1">Cellar Master & Enologist</span>
                      {story.winemakerBio && <p className="text-xs text-gray-500 leading-relaxed font-light">{story.winemakerBio}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isBrunoAndreu ? (
            /* Bruno Andreu Specific 4-Photo Story Layout */
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              <div className="flex-1 w-full max-w-xl">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#fcf9f2] border border-gray-200/80 rounded-sm shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[0]) || '/assets/estate/bruno-andreu/ba_bruno_elixir_magnum.png'} 
                      alt="Bruno Andreu with Elixir Magnum" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/bruno-andreu/ba_bruno_elixir_magnum.png'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Bruno Andreu • Signature
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[1]) || '/assets/estate/bruno-andreu/ba_cellar_barrels.png'} 
                      alt="Domaine BA Oak Barrel Cellar" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/bruno-andreu/ba_cellar_barrels.png'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Oak Aging Cellar
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[2]) || '/assets/estate/bruno-andreu/ba_blending_masterclass.png'} 
                      alt="Bruno Andreu Wine Blending" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/bruno-andreu/ba_blending_masterclass.png'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      Craft & Blending
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden group bg-gray-100">
                    <img 
                      src={resolveImageUrl(story.images?.[3]) || '/assets/estate/bruno-andreu/ba_chardonnay_table.png'} 
                      alt="Chardonnay Dining Presentation" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/estate/bruno-andreu/ba_chardonnay_table.png'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-wider text-white font-medium bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      French Gastronomy
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col items-start text-left p-2 sm:p-4">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#c9a35b] font-semibold mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Heritage & Winemaker
                </span>
                <h2 className="font-serif text-[30px] sm:text-[38px] lg:text-[44px] text-ink font-normal leading-[1.15] mb-5 tracking-wide">
                  From Water Engineer to Creator of Iconic Wines
                </h2>
                <div className="w-16 h-[2px] bg-[#c9a35b] mb-5" />
                <div className="text-gray-600 text-sm sm:text-base leading-[1.8] font-light space-y-3.5 max-w-xl">
                  {story.history && <p>{story.history}</p>}
                  {story.philosophy && (
                    <blockquote className="border-l-2 border-[#c9a35b] pl-3.5 italic text-ink/80 text-sm sm:text-base my-2">
                      "{story.philosophy}"
                    </blockquote>
                  )}
                  {story.winemaker && (
                    <div className="pt-2">
                      <span className="font-serif text-lg text-ink font-medium block">{story.winemaker}</span>
                      <span className="text-xs uppercase tracking-wider text-[#c9a35b] block mb-1">Founder & Cellar Master</span>
                      {story.winemakerBio && <p className="text-xs text-gray-500 leading-relaxed font-light">{story.winemakerBio}</p>}
                    </div>
                  )}
                </div>
                {estate.awards?.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-6 pt-5 border-t border-gray-100 w-full max-w-xl">
                    {estate.awards.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-[#c9a35b] font-bold text-sm leading-none">•</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Original Dynamic Story Layout for Giuliani Vini and other estates */
            <div className="max-w-[1400px] mx-auto px-4 flex flex-col lg:flex-row items-stretch gap-8 lg:gap-0">
              <div className="flex-1 w-full flex items-center justify-center">
                {(() => {
                  const images = story.images?.filter(Boolean).slice(0, 4) || [];
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
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════
          SHOP OUR WINES
      ════════════════════════════════════════════ */}
      {products.length > 0 && (
        <section id="estate-wines" className="py-16 md:py-24 bg-[#fcf9f2] relative border-t border-ink/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-3 block">
                {isTesselaarsdal
                  ? 'Hemel-en-Aarde Ridge Portfolio'
                  : isCantinaDelConte 
                    ? 'Grinzane Cavour Barolo, Barbaresco & Grappe Portfolio' 
                    : isDogliotti 
                      ? 'Piedmont Fine Wine & Vermouth Portfolio' 
                      : isBrunoAndreu 
                        ? 'The Estate Cellar' 
                        : 'From the Cellar'}
              </span>
              <h2 className="font-serif text-[34px] sm:text-[44px] text-ink font-normal leading-[1.15] mb-3">
                {isTesselaarsdal
                  ? 'The Tesselaarsdal Cellar'
                  : isCantinaDelConte 
                    ? 'The Cantina del Conte Cellar' 
                    : isDogliotti 
                      ? 'The Dogliotti 1870 Cellar' 
                      : isBrunoAndreu 
                        ? 'Shop The Wine Collections' 
                        : 'Shop Our Wines'}
              </h2>
              <p className="text-ink/60 text-base sm:text-lg">
                {isTesselaarsdal
                  ? 'Discover the 10th Anniversary Vintage Pinot Noir and clay amphorae Chardonnay handcrafted in limited allocations by Berene Sauls on the extreme cool-climate Hemel-en-Aarde Ridge.'
                  : isCantinaDelConte
                    ? 'Discover 12 exceptional artisan wines and grappe from Azienda Pelissero in Grinzane Cavour, rooted in Count Cavour’s historic vineyards. Monumental Barolo Riserva, Barolo Gabutti, Barbaresco, Roero Arneis, and aged single-variety grappe.'
                    : isDogliotti
                      ? 'Explore 28 signature vintages, Moscato d’Asti, Barolo DOCG, Barbera d’Asti, and botanical Vermouth di Torino crafted across five generations in Langhe & Monferrato.'
                      : isBrunoAndreu 
                        ? 'Discover 35 authentic cuvées from Bruno Andreu. Each bottle reflects Mediterranean terroir and craft.' 
                        : 'Discover our exceptional selection of handcrafted wines.'
                }
              </p>
            </div>

            {/* Product Grid */}
            {isBrunoAndreu || isDogliotti || isCantinaDelConte || isTesselaarsdal ? (
              /* Studio Showcase for Dogliotti 1870, Bruno Andreu, Cantina del Conte and Tesselaarsdal Wines */
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${products.length === 2 ? 'max-w-4xl mx-auto' : 'lg:grid-cols-3'} gap-6 sm:gap-8`}>
                {products.map(p => {
                  const prodSlug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const isAlcoholFree = getWineCategory(p) === 'dealcoholized';

                  return (
                    <div 
                      key={p._id || p.id} 
                      className="flex flex-col bg-white border border-[#eae6de] hover:border-[#c9a35b]/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 group h-full"
                    >
                      {/* Clean Neutral Studio Showcase Background */}
                      <Link 
                        to={`/product/${prodSlug}`} 
                        className="block w-full h-80 sm:h-88 relative overflow-hidden select-none bg-gradient-to-b from-[#ffffff] via-[#faf9f7] to-[#f4f2ee]"
                      >
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at 50% 55%, rgba(255, 255, 255, 0.95) 0%, rgba(248, 246, 242, 0.5) 60%, transparent 100%)'
                          }}
                        />

                        <div 
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-36 h-3 rounded-full pointer-events-none transition-transform duration-300 group-hover:scale-105"
                          style={{
                            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.05) 50%, transparent 70%)',
                            filter: 'blur(3px)'
                          }}
                        />

                        {/* Top Left Badge */}
                        <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
                          <span className={`text-[9px] uppercase tracking-[0.16em] font-semibold px-2.5 py-1 rounded-xs shadow-xs ${
                            isAlcoholFree 
                              ? 'bg-[#1b4332] text-white border border-[#2d6a4f]'
                              : isTesselaarsdal
                                ? 'bg-[#14120e] text-[#c9a35b] border border-[#c9a35b]/50'
                                : (isDogliotti || isCantinaDelConte)
                                  ? 'bg-[#1a1815] text-[#e1bd70] border border-[#e1bd70]/40'
                                  : 'bg-white/95 text-stone-800 border border-stone-200'
                          }`}>
                            {isTesselaarsdal
                              ? (p.subcategory ? `${p.subcategory} • Hemel-en-Aarde Ridge` : 'Hemel-en-Aarde Ridge')
                              : isCantinaDelConte
                                ? (p.subcategory || p.range || 'Grinzane Cavour DOCG')
                                : isDogliotti 
                                  ? (p.subcategory || p.range || 'Piedmont DOCG') 
                                  : (isAlcoholFree ? '0.0% Alcohol Free' : (p.subcategory || p.range || 'Languedoc'))}
                          </span>
                        </div>

                        {/* Crisp Bottle Image with Smooth Hover Elevation */}
                        <div className="w-full h-full flex items-center justify-center p-5 relative z-10">
                          <img 
                            src={resolveImageUrl(p.image)} 
                            alt={p.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = isTesselaarsdal
                                ? `/assets/products/tesselaarsdal/${prodSlug}.png`
                                : isCantinaDelConte
                                  ? `/assets/products/cantina-del-conte/${prodSlug}.png`
                                  : isDogliotti 
                                    ? `/assets/products/dogliotti-1870/${prodSlug}.png` 
                                    : `/assets/products/bruno-andreu/${prodSlug}.png`;
                            }}
                            className="h-[88%] w-auto max-w-[82%] object-contain transition-all duration-300 ease-out transform group-hover:-translate-y-2 group-hover:scale-105"
                            style={{
                              filter: 'drop-shadow(0 14px 12px rgba(0, 0, 0, 0.22))'
                            }}
                          />
                        </div>
                      </Link>
                      
                      {/* Content Area */}
                      <div className="p-6 flex flex-col flex-1 border-t border-stone-100">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {p.vintage && (
                            <span className="text-[11px] font-semibold tracking-wider text-[#9c8249] uppercase">
                              Vintage {p.vintage}
                            </span>
                          )}
                          {p.identity?.production && (
                            <span className="text-[10px] text-stone-400 font-medium truncate max-w-[60%]">
                              {p.identity.production}
                            </span>
                          )}
                        </div>

                        <Link to={`/product/${prodSlug}`} className="block mb-2 min-h-[50px] sm:min-h-[56px] flex items-start">
                          <h3 className="font-serif text-[19px] sm:text-[21px] text-[#0f0f0f] font-medium leading-[1.3] hover:text-[#8a2232] transition-colors line-clamp-2">
                            {p.name}
                          </h3>
                        </Link>
                        
                        <p className="text-[13px] text-[#444444] font-normal leading-[1.65] mb-5 line-clamp-3 flex-1">
                          {p.description || "Refined expression of estate terroir handcrafted with passion and tradition."}
                        </p>
                        
                        {/* Elegant Action Link & Price */}
                        <div className="mt-auto pt-4 border-t border-stone-200/80 flex items-center justify-between">
                          <Link
                            to={`/product/${prodSlug}`}
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-bold text-black hover:text-[#8a2232] transition-colors group-hover:translate-x-1 duration-200"
                          >
                            <span>{isDogliotti ? 'Explore Vintage' : isTesselaarsdal ? 'Explore Wine' : 'Explore Cuvée'}</span>
                            <span>→</span>
                          </Link>

                          {p.price && (
                            <div className="text-right">
                              <span className="font-serif text-[17px] font-bold text-ink">
                                R {Number(p.price).toFixed(2)}
                              </span>
                              {p.size && (
                                <span className="text-[10px] text-stone-400 block -mt-0.5">
                                  {p.size}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Original Product Grid for Giuliani Vini and other estates */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(p => (
                  <div key={p._id || p.id} className="flex flex-col bg-white border border-ink/10 group h-full">
                    {/* Top Image Area */}
                    <Link to={`/product/${p.slug || p.id || p._id}`} className="block w-full h-72 relative overflow-hidden bg-ink/5 p-4">
                      {p.image || p.gallery?.[0] ? (
                        <img 
                          src={resolveImageUrl(p.image || p.gallery[0])} 
                          alt={p.name}
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 drop-shadow-md"
                        />
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
            )}
            
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          TERROIR AND CRAFT
      ════════════════════════════════════════════ */}
      {(vineyard.altitude || vineyard.soil || vineyard.climate || vineyard.grapeVarieties?.length > 0 || vineyard.imageUrl) && (
        <section className="py-16 md:py-24 bg-white relative overflow-hidden border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-10 lg:gap-16">
            
            {/* Left Content */}
            <div className="flex-1 max-w-xl">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#c9a35b] font-semibold mb-1.5 block">
                The Soil & Microclimates
              </span>
              <h2 className="font-serif text-[32px] sm:text-[40px] text-ink font-normal leading-[1.1] mb-5">
                Terroir and Craft
              </h2>
              
              {vineyard.viticulture && (
                <p className="text-gray-600 text-sm leading-[1.8] mb-6 font-light">
                  {vineyard.viticulture}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-5 sm:gap-6 mb-6">
                {[
                  { label: 'Altitude', value: vineyard.altitude },
                  { label: 'Soil Profile', value: vineyard.soil },
                  { label: 'Climate', value: vineyard.climate },
                ].filter(d => d.value).map((d) => (
                  <div key={d.label}>
                    <p className="text-[10px] text-[#8c7853] uppercase tracking-widest mb-1 font-medium">{d.label}</p>
                    <p className="text-ink text-sm font-medium leading-snug">{d.value}</p>
                  </div>
                ))}
              </div>

              {vineyard.grapeVarieties?.length > 0 && (
                <div className="mb-6 pt-5 border-t border-gray-100">
                  <p className="text-[10px] text-[#8c7853] uppercase tracking-widest mb-2.5 font-medium">Cultivated Grape Varieties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vineyard.grapeVarieties.map((g, i) => (
                      <span key={i} className="text-gray-700 text-xs border border-gray-200 px-2.5 py-0.5 bg-[#fcf9f2]">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {vineyard.sustainability && (
                <div className="pt-5 border-t border-gray-100">
                  <p className="text-[10px] text-emerald-700 uppercase tracking-widest mb-1 font-semibold">Eco-Responsible Viticulture</p>
                  <p className="text-gray-600 text-sm leading-relaxed font-light">{vineyard.sustainability}</p>
                </div>
              )}
            </div>
            
            {/* Right Vineyard Photo */}
            {(vineyard.imageUrl || isBrunoAndreu || isDogliotti || isCantinaDelConte || isTesselaarsdal) && (
              <div className="flex-1 w-full max-w-lg">
                <div className="w-full aspect-[4/3] overflow-hidden shadow-lg border border-gray-200 relative group bg-gray-100">
                  <img 
                    src={resolveImageUrl(vineyard.imageUrl) || (isTesselaarsdal ? '/assets/estate/tesselaarsdal/tesselaarsdal_vineyard_ridge.jpg' : isCantinaDelConte ? '/assets/estate/cantina-del-conte/cantina_terroir_vineyard_map.jpg' : isDogliotti ? '/assets/estate/dogliotti-1870/dogliotti_vineyard_panorama.jpg' : isBrunoAndreu ? '/assets/estate/bruno-andreu/ba_pure_barrels.png' : '')} 
                    alt="Terroir and Vineyard" 
                    onError={(e) => {
                      if (isTesselaarsdal) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/estate/tesselaarsdal/tesselaarsdal_vineyard_ridge.jpg';
                      } else if (isCantinaDelConte) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/estate/cantina-del-conte/cantina_terroir_vineyard_map.jpg';
                      } else if (isDogliotti) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/estate/dogliotti-1870/dogliotti_vineyard_panorama.jpg';
                      } else if (isBrunoAndreu) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/estate/bruno-andreu/ba_pure_barrels.png';
                      }
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-3 left-3 text-xs uppercase tracking-widest text-white/90 bg-black/60 px-3 py-1 backdrop-blur-sm">
                    {estate.estateName} • {estate.region}
                  </span>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          WINE TASTINGS & HOSPITALITY
      ════════════════════════════════════════════ */}
      {(hCards.length > 0 || hospitality.title || hospitality.subtitle) && (
        <section className="py-16 md:py-24 bg-[#fcf9f2] relative border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#c9a35b] font-semibold mb-1.5 block">
                Cellar Door Experience
              </span>
              <h2 className="font-serif text-[32px] sm:text-[40px] text-ink font-normal mb-2.5">
                {hospitality.title || 'Cellar Door & Tasting Experiences'}
              </h2>
              <p className="text-gray-500 text-sm sm:text-base">
                {hospitality.subtitle || 'Welcome to the Cellar — Discover our winemaking craft.'}
              </p>
            </div>

            {/* Grid of Tasting Packages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {hCards.map((card, i) => (
                <div key={i} className="flex flex-col bg-white border border-gray-200 hover:border-[#c9a35b] shadow-sm hover:shadow-md transition-all duration-300 h-full group">
                  
                  {/* Top Image Area */}
                  {card.image && (
                    <div className="w-full h-60 overflow-hidden relative bg-gray-100">
                      <img 
                        src={card.image} 
                        alt={card.title} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = card.fallbackImage;
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute top-3 left-3 bg-ink text-white text-[9px] uppercase tracking-widest px-2.5 py-0.5 font-medium">
                        {card.type}
                      </div>
                    </div>
                  )}

                  {/* Content Area */}
                  <div className="p-6 flex flex-col flex-1">
                    <h4 className="font-serif text-xl mb-2 text-ink">{card.title}</h4>
                    {card.desc && <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1 font-light">{card.desc}</p>}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-2 mt-auto pt-4 border-t border-gray-100">
                      {card.duration && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5 font-medium">Duration</p>
                          <p className="text-xs text-ink font-medium">{card.duration}</p>
                        </div>
                      )}
                      {card.capacity && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5 font-medium">Max Guests</p>
                          <p className="text-xs text-ink font-medium">{card.capacity} guests</p>
                        </div>
                      )}
                      {!isBrunoAndreu && !isDogliotti && !isCantinaDelConte && card.priceStr && (
                        <div className="col-span-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">Price</p>
                          <p className="text-sm font-semibold text-[#8a2232]">{card.priceStr}</p>
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
          RESTAURANT (DINING) - Restored for Giuliani Vini & Estates with Restaurants
      ════════════════════════════════════════════ */}
      {hospitality.hasRestaurant && (hospitality.restaurant?.name || hospitality.restaurant?.imageUrl) && (
        <section className="bg-white border-t border-ink/5">
          <div className="flex flex-col md:flex-row min-h-[500px]">
            {/* Image Side */}
            <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full bg-ink/5">
              {hospitality.restaurant?.imageUrl && (
                <img 
                  src={resolveImageUrl(hospitality.restaurant.imageUrl)} 
                  alt={hospitality.restaurant.name || 'Restaurant'} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
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
          ACCOMMODATION (STAY) - Restored for Giuliani Vini & Estates with Stays
      ════════════════════════════════════════════ */}
      {hospitality.hasAccommodation && (hospitality.accommodation?.description || hospitality.accommodation?.imageUrl) && (
        <section className="bg-ink text-white">
          <div className="flex flex-col md:flex-row-reverse min-h-[500px]">
            {/* Image Side */}
            <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full bg-white/5">
              {hospitality.accommodation?.imageUrl && (
                <img 
                  src={resolveImageUrl(hospitality.accommodation.imageUrl)} 
                  alt="Accommodation" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
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
          OTHER EXPERIENCES (BEYOND WINE) - Restored for Giuliani Vini
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
                    <img 
                      src={resolveImageUrl(exp.imageUrl) || 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                      alt={exp.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
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
          JOIN WINE FARM CALL TO ACTION
      ════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 bg-gradient-to-r from-[#171615] via-[#211f1c] to-[#171615] text-white border-t border-[#c9a35b]/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c9a35b]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#e1bd70] font-semibold mb-3 block">
            The Grand Store Wine Farm Collective
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl text-white font-normal mb-4">
            Discover Handcrafted Artisan Estates Worldwide
          </h2>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8 font-light">
            Experience certified vineyards, family traditions, and rare allocations from Italy’s Piedmont to France’s Languedoc. Join our global wine farm collective or explore all featured estates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/winefarm"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#e1bd70] text-[#141312] hover:bg-white transition-all duration-300 text-xs uppercase tracking-[0.2em] font-bold shadow-xl rounded-full group cursor-pointer"
            >
              <span>Join Wine Farm</span>
              <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/winefarm#farms"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white transition-all duration-300 text-xs uppercase tracking-[0.2em] font-medium border border-white/20 rounded-full cursor-pointer"
            >
              <span>Browse All Estates</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CONTACT & FOOTER
      ════════════════════════════════════════════ */}
      <footer className="bg-[#141312] text-white">
        
        {/* Top Banner for Contact/Visit */}
        <div className="relative h-[240px] sm:h-[280px] flex items-center justify-center overflow-hidden">
          <img 
            src={resolveImageUrl(estate.heroImageUrl) || (isTesselaarsdal ? '/assets/estate/tesselaarsdal/tesselaarsdal_bottles_candlelight.jpg' : isCantinaDelConte ? '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg' : isDogliotti ? '/assets/estate/dogliotti-1870/dogliotti_langhe_monferrato_hero.jpg' : isBrunoAndreu ? '/assets/estate/bruno-andreu/ba_cellar_barrels.png' : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')}
            alt={estate.estateName}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = isTesselaarsdal
                ? '/assets/estate/tesselaarsdal/tesselaarsdal_bottles_candlelight.jpg'
                : isCantinaDelConte
                  ? '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg'
                  : isDogliotti 
                    ? '/assets/estate/dogliotti-1870/dogliotti_langhe_monferrato_hero.jpg' 
                    : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
            }}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#e1bd70]">
              {isTesselaarsdal ? 'Hemel-en-Aarde Ridge Private Allocations' : isCantinaDelConte || isDogliotti ? 'Direct Cellar & Export Allocations' : isBrunoAndreu ? 'Private Cellar Allocations' : 'Estate Allocations'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">Experience The Wines</h2>
            {contact.phone && (
              <a 
                href={`tel:${contact.phone}`} 
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] border-b border-[#e1bd70] pb-0.5 text-[#e1bd70] hover:text-white transition-colors mt-1"
              >
                Contact Estate <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16 flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 flex flex-col md:flex-row gap-6">
            {/* Contact Details */}
            <div className="flex-1 bg-[#1f1d1b] p-6 sm:p-8 border border-white/5">
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#e1bd70] mb-4 font-semibold">Contact & Cellar</h4>
              {contact.address && (
                <p className="text-xs text-white/80 leading-relaxed mb-4 font-light">
                  {contact.address}
                </p>
              )}
              {contact.phone && <p className="text-xs text-white/80 mb-1.5 font-mono">T. {contact.phone}</p>}
              {contact.email && <p className="text-xs text-white/80 mb-4 font-mono break-all">E. {contact.email}</p>}
              
              {/* Socials & Web */}
              <div className="flex gap-2.5 pt-3 border-t border-white/10">
                {contact.website && (
                  <a href={contact.website} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-white/20 hover:border-[#e1bd70] hover:text-[#e1bd70] transition-colors text-xs font-medium">
                    Official Website ↗
                  </a>
                )}
                {contact.instagram && (
                  <a href={`https://instagram.com/${contact.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center hover:border-[#e1bd70] hover:text-[#e1bd70] transition-colors text-xs">
                    IG
                  </a>
                )}
              </div>
            </div>
            
            {/* Visit Us */}
            <div className="flex-1 bg-[#24211f] p-6 sm:p-8 border border-white/5">
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#e1bd70] mb-4 font-semibold">Visit Us</h4>
              <p className="text-xs text-white/80 leading-relaxed mb-4 font-light whitespace-pre-line">
                {hospitality.restaurant?.openingHours || (isCantinaDelConte ? 'Monday – Saturday: 9:00 – 19:00\nCellar tours & tastings by appointment' : isDogliotti ? 'Monday – Saturday: 9:00 – 18:30\nCellar tours & tastings by appointment' : isBrunoAndreu ? 'Monday – Friday: 9:00 – 18:00\nSaturday: By sommelier appointment' : 'Contact us for opening hours')}
              </p>
              {contact.address && (
                <p className="text-xs text-white/50 mb-5 leading-relaxed font-light">
                  {contact.address}
                </p>
              )}
              {(contact.mapLink || isBrunoAndreu || isDogliotti || isCantinaDelConte) && (
                <a 
                  href={contact.mapLink || (isCantinaDelConte ? 'https://maps.google.com/?q=Via+Castello+13,+12060+Grinzane+Cavour+CN,+Italy' : isDogliotti ? 'https://maps.google.com/?q=Castagnole+delle+Lanze,Asti,Piedmont,Italy' : isBrunoAndreu ? 'https://maps.google.com/?q=Montblanc,Languedoc,France' : '')} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-block px-5 py-2 border border-[#e1bd70]/60 text-[10px] uppercase tracking-[0.2em] text-[#e1bd70] hover:bg-[#e1bd70] hover:text-black transition-colors"
                >
                  Directions ↗
                </a>
              )}
            </div>
          </div>

          {/* Right Side Follow Estate */}
          <div className="flex-1 relative overflow-hidden p-8 flex items-center justify-center text-center border border-white/10 min-h-[260px]">
            <img 
              src={isTesselaarsdal ? '/assets/estate/tesselaarsdal/tesselaarsdal_berene_cellar.jpg' : isCantinaDelConte ? '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg' : isDogliotti ? '/assets/estate/dogliotti-1870/dogliotti_cask_barrel_hall.jpg' : isBrunoAndreu ? '/assets/estate/bruno-andreu/ba_bruno_elixir_magnum.png' : (resolveImageUrl(estate.heroImageUrl) || 'https://images.unsplash.com/photo-1565922336365-1d44eb37a06a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')}
              alt={estate.estateName}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = isTesselaarsdal
                  ? '/assets/estate/tesselaarsdal/tesselaarsdal_berene_cellar.jpg'
                  : isCantinaDelConte
                    ? '/assets/estate/cantina-del-conte/cantina_hero_castello.jpg'
                    : isDogliotti 
                      ? '/assets/estate/dogliotti-1870/dogliotti_cask_barrel_hall.jpg'
                      : 'https://images.unsplash.com/photo-1565922336365-1d44eb37a06a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/75" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-[#e1bd70] mb-2 font-semibold">
                {estate.region || estate.country}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-white mb-5 leading-tight">
                {estate.estateName}
              </h2>
              <button 
                onClick={handleFollow} 
                disabled={followLoading}
                className="inline-block bg-[#e1bd70] text-[#141312] hover:bg-white uppercase text-[10px] font-bold tracking-[0.2em] px-7 py-3 transition-all duration-200 shadow-lg cursor-pointer"
              >
                {followLoading ? 'Updating...' : following ? '✓ Following Estate' : 'Follow Estate'}
              </button>
              {followerCount > 0 && (
                <p className="text-[11px] text-white/60 mt-2.5 font-light">
                  {followerCount} wine enthusiasts following
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Copyright & Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-white/40 gap-3">
          <p>© {new Date().getFullYear()} {estate.estateName}. All Rights Reserved. Curated for The Grand Store.</p>
          <div className="flex gap-5">
            <Link to="/winefarm" className="hover:text-[#e1bd70] transition-colors">Wine Estates</Link>
            <Link to="/shop" className="hover:text-[#e1bd70] transition-colors">Grand Store Catalog</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
