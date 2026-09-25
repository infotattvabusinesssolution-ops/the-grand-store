import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import api from '../../../api';
import './LuxuryPosterSection.css';

const DEFAULT_DATA = {
  isEnabled: true,
  badge: 'CUVÉE PRIVÉE • VINTAGE 2020',
  heading: 'M Collection',
  edition: 'The Brut Reserve',
  subline: 'Aged thirty-six months on the lees in silent French oak cellars. Poured with intention for the private collector.',
  specs: ['36 MOS ON LEES', '60% CH / 40% PN', 'BRUT NATURE', '750 ML'],
  tasting: 'Crisp Green Apple • Toasted Brioche • Citrus Blossom • Chalk Minerality',
  price: 850,
  offerPrice: 795,
  bottleImage: '/assets/mcollection/mcollection-brut.png',
  bgImage: '/assets/mcollection/poster-cellar-bg.jpg',
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
            bgImage: '/assets/mcollection/poster-cellar-bg.jpg',
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
    <section className="pinterest-poster-section" id="mcollection-poster" aria-label="M Collection Haute Cuvée">
      <div className="pinterest-poster-shell">
        
        {/* Main Double-Bezel Editorial Poster Card */}
        <div className="pinterest-poster-card">
          
          {/* Authentic Cellar Background Layer with Vignette & Ambient Light */}
          <div 
            className="poster-bg-photo" 
            style={{ backgroundImage: `url(${data.bgImage})` }} 
            aria-hidden="true"
          />
          <div className="poster-bg-overlay" aria-hidden="true" />
          <div className="poster-bg-spotlight" aria-hidden="true" />
          <div className="poster-bg-vignette" aria-hidden="true" />

          {/* Editorial Passepartout Inner Framing Hairline */}
          <div className="poster-inner-frame" aria-hidden="true">
            <span className="frame-corner top-left">⌜</span>
            <span className="frame-corner top-right">⌝</span>
            <span className="frame-corner bottom-left">⌞</span>
            <span className="frame-corner bottom-right">⌟</span>
          </div>

          {/* Ghost Watermark */}
          <div className="poster-watermark-text" aria-hidden="true">
            M COLLECTION
          </div>

          {/* Top Bar: Editorial Kicker & Allocation Metadata */}
          <div className="poster-top-bar">
            <div className="poster-kicker-badge">
              <Sparkles size={12} className="kicker-sparkle" />
              <span>HAUTE CUVÉE &nbsp;•&nbsp; MÉTHODE CAP CLASSIQUE</span>
            </div>
            <div className="poster-allocation-code">
              <span>N° 01 &nbsp;•&nbsp; PRIVATE CELLAR ALLOCATION</span>
            </div>
          </div>

          {/* Poster Body: High-Fashion Typography & Authentic Bottle */}
          <div className="poster-body-grid">
            
            {/* Left Column: Pinterest Editorial Typography */}
            <div className="poster-text-col">
              
              {/* Brand Stamp */}
              <div className="poster-brand-row">
                <span className="poster-brand-accent">✦</span>
                <span className="poster-brand-caps">{data.heading.toUpperCase()}</span>
                <span className="poster-brand-line" aria-hidden="true" />
              </div>

              {/* Regal Main Headline with Metallic Gold Foil Gradient */}
              <h2 className="poster-headline">
                The Brut <span className="poster-italic">Reserve.</span>
              </h2>

              {/* Editorial Narrative */}
              <p className="poster-subline">
                {data.subline}
              </p>

              {/* Glassmorphic Minimalist Spec Badges */}
              <div className="poster-minimal-specs">
                <span className="spec-pill">36 MOS ON LEES</span>
                <span className="spec-pill">60% CH / 40% PN</span>
                <span className="spec-pill">BRUT NATURE</span>
                <span className="spec-pill">750 ML</span>
              </div>

              {/* Sommelier Tasting Notes */}
              <div className="poster-tasting-row">
                <span className="tasting-icon">✦</span>
                <span className="tasting-text">
                  Crisp Green Apple &nbsp;•&nbsp; Toasted Brioche &nbsp;•&nbsp; Citrus Blossom &nbsp;•&nbsp; Chalk Minerality
                </span>
              </div>

              {/* Stand A Chance To Win M Collection Invitation */}
              <div className="poster-giveaway-card">
                <div className="giveaway-card-content">
                  <div className="giveaway-badge-row">
                    <Sparkles size={12} className="giveaway-star" />
                    <span className="giveaway-badge-text">EXCLUSIVE CELLAR DRAW</span>
                  </div>
                  <h3 className="giveaway-card-heading">
                    Stand a chance to win M Collection bottles.
                  </h3>
                  <p className="giveaway-card-desc">
                    Subscribe to the private cellar list on our M Collection estate website to enter our limited cuvée bottle allocation draw.
                  </p>
                </div>
                <a
                  href="https://millionair.yogapranafitness.com/#giveaway"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="poster-giveaway-btn"
                  title="Enter M Collection Bottle Draw"
                >
                  <span className="giveaway-btn-text">ENTER TO WIN</span>
                  <span className="giveaway-icon-bubble">
                    <ArrowUpRight size={13} />
                  </span>
                </a>
              </div>

              {/* Price & Button-in-Button Action */}
              <div className="poster-action-group">
                <div className="poster-price-block">
                  <span className="poster-price-label">CELLAR ALLOCATION</span>
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
                    className={`poster-cta-btn ${added ? 'btn-added' : ''}`}
                    aria-label="Reserve The Brut Reserve Allocation"
                  >
                    <span className="btn-label-text">
                      {added ? 'ALLOCATION RESERVED' : 'RESERVE BOTTLE'}
                    </span>
                    <span className="btn-icon-bubble">
                      {added ? <Check size={13} /> : <ArrowUpRight size={13} />}
                    </span>
                  </button>

                  <a
                    href="https://millionair.yogapranafitness.com/#giveaway"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="poster-win-link-btn"
                    title="Stand a chance to win M Collection bottles"
                  >
                    <Sparkles size={12} className="text-[#d4af37]" />
                    <span>CLICK TO WIN ↗</span>
                  </a>

                  <Link to={productUrl} className="poster-view-link">
                    <span>Provenance</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Clean Standing Bottle in Ambient Aura */}
            <div className="poster-bottle-col">
              <div className="poster-bottle-glow" aria-hidden="true" />
              <Link to={productUrl} className="poster-bottle-wrap" title="Explore M Collection The Brut Reserve">
                <img
                  src={data.bottleImage}
                  alt="M Collection The Brut Reserve 750ml"
                  className="poster-bottle-img"
                  loading="lazy"
                />
              </Link>
              <div className="poster-bottle-shadow" aria-hidden="true" />
            </div>

          </div>

          {/* Bottom Bar: Editorial Provenance Guarantee */}
          <div className="poster-bottom-bar">
            <span>TERROIR: STELLENBOSCH · SOUTH AFRICA</span>
            <span>HAND-HARVESTED · LIMITED TO 1,200 BOTTLES</span>
            <span>ESTATE GUARANTEED</span>
          </div>

        </div>

      </div>
    </section>
  );
}
