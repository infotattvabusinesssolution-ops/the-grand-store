import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import api from '../../../api';
import './LuxuryPosterSection.css';

const DEFAULT_DATA = {
  isEnabled: true,
  badge: 'MÉTHODE CAP CLASSIQUE • SOUTH AFRICA',
  heading: 'M Collection',
  edition: 'The Brut Reserve',
  subline: 'Crafted beneath the majestic Stellenbosch mountain peaks. Hand-harvested Chardonnay and Pinot Noir nurtured by ancient Cape granite soils, aged 36 months on the lees for the discerning South African palate.',
  specs: ['36 MOS SUR LIE', 'CAPE CHARDONNAY / PINOT NOIR', 'BRUT NATURE', '750 ML'],
  tasting: 'Cape Golden Apple • Wild Fynbos Blossom • Toasted Brioche • Marine Minerality',
  price: 850,
  offerPrice: 795,
  bottleImage: '/assets/mcollection/mcollection-brut.png',
  bgImage: '/assets/mcollection/cape-wineland.webp',
  slug: 'm-collection-the-brut-reserve-cap-classique',
  productRefId: 'mcollection-brut-reserve',
};

export default function LuxuryPosterSection({ onAdd }) {
  const [data, setData] = useState(DEFAULT_DATA);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchShowcase = async () => {
      try {
        const res = await api.get('/luxury-showcase/public');
        if (isMounted && res.data && res.data.isEnabled !== false) {
          setData((prev) => ({
            ...prev,
            ...res.data,
            price: res.data.price || prev.price,
            offerPrice: res.data.offerPrice || prev.offerPrice,
            bottleImage: '/assets/mcollection/mcollection-brut.png',
            bgImage: '/assets/mcollection/cape-wineland.webp',
          }));
        }
      } catch (err) {
        // Fallback silently to DEFAULT_DATA
      }
    };

    fetchShowcase();
    return () => { isMounted = false; };
  }, []);

  if (data.isEnabled === false) {
    return null;
  }

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (typeof onAdd === 'function') {
      const productPayload = {
        id: data.liveProduct?.id || data.productRefId || 'mcollection-brut-reserve',
        _id: data.liveProduct?._id || 'mcollection-brut-reserve',
        name: data.liveProduct?.name || `${data.heading} ${data.edition} 750ml`,
        price: data.offerPrice || data.price,
        final_price: data.offerPrice || data.price,
        original_price: data.price,
        image: data.bottleImage,
        category: 'Champagne',
        type: 'Champagne',
        brand: data.heading,
        stock: data.liveProduct?.stock || 50,
      };
      onAdd(productPayload);
      setAdded(true);
      setTimeout(() => setAdded(false), 2400);
    }
  };

  const productUrl = `/product/${data.liveProduct?.slug || data.slug || 'm-collection-the-brut-reserve-cap-classique'}`;

  return (
    <section className="pinterest-poster-section african-taste-section" id="mcollection-poster" aria-label="M Collection South African Haute Cuvée">
      <div className="pinterest-poster-shell">
        
        {/* Main Double-Bezel Editorial Poster Card with African Luxury Terroir */}
        <div className="pinterest-poster-card african-poster-card">
          
          {/* Authentic Cape Winelands Sunset Landscape Layer */}
          <div 
            className="poster-bg-photo african-bg-photo" 
            style={{ backgroundImage: `url(${data.bgImage})` }} 
            aria-hidden="true"
          />
          <div className="poster-bg-overlay african-bg-overlay" aria-hidden="true" />
          <div className="poster-bg-spotlight african-bg-spotlight" aria-hidden="true" />
          <div className="poster-bg-vignette african-bg-vignette" aria-hidden="true" />

          {/* Editorial Passepartout Inner Framing Hairline with African Diamond Accents */}
          <div className="poster-inner-frame" aria-hidden="true">
            <span className="frame-corner top-left">◈</span>
            <span className="frame-corner top-right">◈</span>
            <span className="frame-corner bottom-left">◈</span>
            <span className="frame-corner bottom-right">◈</span>
          </div>

          {/* Ghost Watermark */}
          <div className="poster-watermark-text african-watermark-text" aria-hidden="true">
            STELLENBOSCH
          </div>

          {/* Top Bar: South African Cap Classique Kicker & Cradle Allocation */}
          <div className="poster-top-bar">
            <div className="poster-kicker-badge african-kicker-badge">
              <Sparkles size={12} className="kicker-sparkle" />
              <span>MÉTHODE CAP CLASSIQUE &nbsp;•&nbsp; SOUTH AFRICA</span>
            </div>
            <div className="poster-allocation-code">
              <span>STELLENBOSCH CRADLE &nbsp;•&nbsp; CUVÉE PRIVÉE N° 01</span>
            </div>
          </div>

          {/* Poster Body: African Luxury Typography & Authentic Bottle */}
          <div className="poster-body-grid">
            
            {/* Left Column: Pinterest African Editorial Typography */}
            <div className="poster-text-col">
              
              {/* Brand Row */}
              <div className="poster-brand-row">
                <span className="poster-brand-accent">◈</span>
                <span className="poster-brand-caps">{data.heading.toUpperCase()} &nbsp;•&nbsp; SOUTH AFRICA</span>
                <span className="poster-brand-line" aria-hidden="true" />
              </div>

              {/* Regal Main Headline with African Sunset Gold Foil Gradient */}
              <h2 className="poster-headline african-headline">
                The Brut <span className="poster-italic african-italic">Reserve.</span>
              </h2>

              {/* Editorial Narrative */}
              <p className="poster-subline">
                {data.subline}
              </p>

              {/* Glassmorphic Minimalist Spec Badges */}
              <div className="poster-minimal-specs">
                <span className="spec-pill african-pill">36 MOS SUR LIE</span>
                <span className="spec-pill african-pill">CAPE CHARDONNAY / PINOT NOIR</span>
                <span className="spec-pill african-pill">BRUT NATURE</span>
                <span className="spec-pill african-pill">750 ML</span>
              </div>

              {/* Cape Floral Kingdom Tasting Notes */}
              <div className="poster-tasting-row african-tasting-row">
                <span className="tasting-icon">❖</span>
                <span className="tasting-text">
                  Crisp Cape Apple &nbsp;•&nbsp; Wild Fynbos Blossom &nbsp;•&nbsp; Toasted Brioche &nbsp;•&nbsp; Ocean Mist
                </span>
              </div>

              {/* Stand A Chance To Win M Collection Invitation */}
              <div className="poster-giveaway-card african-giveaway-card">
                <div className="giveaway-card-content">
                  <div className="giveaway-badge-row">
                    <Sparkles size={12} className="giveaway-star" />
                    <span className="giveaway-badge-text">SOUTH AFRICAN CELLAR DRAW</span>
                  </div>
                  <h3 className="giveaway-card-heading">
                    Stand a chance to win M Collection bottles.
                  </h3>
                  <p className="giveaway-card-desc">
                    Subscribe to the private cellar list on our M Collection estate website to enter our quarterly Cap Classique bottle allocation draw.
                  </p>
                </div>
                <a
                  href="https://millionair.yogapranafitness.com/#giveaway"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="poster-giveaway-btn african-giveaway-btn"
                  title="Enter M Collection Bottle Draw"
                >
                  <span className="giveaway-btn-text">ENTER TO WIN</span>
                  <span className="giveaway-icon-bubble african-icon-bubble">
                    <ArrowUpRight size={13} />
                  </span>
                </a>
              </div>

              {/* Price & Button-in-Button Action */}
              <div className="poster-action-group">
                <div className="poster-price-block">
                  <span className="poster-price-label">SOUTH AFRICAN CELLAR ALLOCATION</span>
                  <div className="poster-price-row">
                    <span className="poster-zar">R</span>
                    <span className="poster-price-num">{data.offerPrice || data.price}</span>
                    {data.offerPrice && data.offerPrice < data.price && (
                      <span className="poster-price-strikethrough">R {data.price}</span>
                    )}
                  </div>
                </div>

                <div className="poster-buttons">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`poster-cta-btn african-cta-btn ${added ? 'btn-added' : ''}`}
                    aria-label="Reserve The Brut Reserve Allocation"
                  >
                    <span className="btn-label-text">
                      {added ? 'ALLOCATION RESERVED' : 'RESERVE BOTTLE'}
                    </span>
                    <span className="btn-icon-bubble african-icon-bubble">
                      {added ? <Check size={13} /> : <ArrowUpRight size={13} />}
                    </span>
                  </button>

                  <a
                    href="https://millionair.yogapranafitness.com/#giveaway"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="poster-win-link-btn african-win-btn"
                    title="Stand a chance to win M Collection bottles"
                  >
                    <Sparkles size={12} className="text-[#f0b848]" />
                    <span>CLICK TO WIN ↗</span>
                  </a>

                  <Link to={productUrl} className="poster-view-link african-view-link">
                    <span>Provenance</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Clean Standing Bottle in African Sunset Aura */}
            <div className="poster-bottle-col">
              <div className="poster-bottle-glow african-bottle-glow" aria-hidden="true" />
              <Link to={productUrl} className="poster-bottle-wrap" title="Explore M Collection The Brut Reserve">
                <img
                  src={data.bottleImage}
                  alt="M Collection The Brut Reserve 750ml"
                  className="poster-bottle-img"
                  loading="lazy"
                />
              </Link>
              <div className="poster-bottle-shadow african-bottle-shadow" aria-hidden="true" />
            </div>

          </div>

          {/* Bottom Bar: Editorial Provenance Guarantee */}
          <div className="poster-bottom-bar african-bottom-bar">
            <span>TERROIR: STELLENBOSCH & CAPE WINELANDS</span>
            <span>PROUDLY SOUTH AFRICAN · LIMITED RELEASE</span>
            <span>ESTATE GUARANTEED</span>
          </div>

        </div>

      </div>
    </section>
  );
}
