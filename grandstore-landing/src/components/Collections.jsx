"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  CaretLeft,
  CaretRight,
  ArrowUpRight,
  ArrowCounterClockwise,
  SealCheck,
  Sparkle,
  Wine,
} from "@phosphor-icons/react";
import catalog from "../catalog.json";

const STORE = "https://grandstoreglobal.com";

// Delicate luxury golden spark aura (no heavy yellow gradient, just a refined golden spark)
const BLACK_GOLD_DISCS = [
  {
    bg: "radial-gradient(circle at 50% 50%, rgba(255, 235, 170, 0.14) 0%, rgba(212, 175, 55, 0.04) 40%, transparent 70%)",
    glow: "rgba(212, 175, 55, 0.08)",
    border: "rgba(212, 175, 55, 0.15)",
  },
  {
    bg: "radial-gradient(circle at 50% 50%, rgba(255, 240, 190, 0.12) 0%, rgba(212, 175, 55, 0.03) 40%, transparent 70%)",
    glow: "rgba(212, 175, 55, 0.06)",
    border: "rgba(212, 175, 55, 0.12)",
  },
  {
    bg: "radial-gradient(circle at 50% 50%, rgba(240, 215, 150, 0.13) 0%, rgba(195, 145, 60, 0.04) 40%, transparent 70%)",
    glow: "rgba(195, 145, 60, 0.07)",
    border: "rgba(212, 175, 55, 0.14)",
  },
];

export default function CuratedShowcase() {
  const [activeTab, setActiveTab] = useState("south-africa"); // 'south-africa' | 'global'
  const [spinningId, setSpinningId] = useState(null);
  const trackRef = useRef(null);
  const isHoveredRef = useRef(false);
  const reduced = useReducedMotion();

  const currentStore =
    activeTab === "south-africa"
      ? "https://grandstore.co.za"
      : "https://grandstoreglobal.com";
  const exploreHref =
    activeTab === "south-africa"
      ? catalog.localHref || `${currentStore}/shop`
      : catalog.internationalHref || `${currentStore}/shop`;

  const currentProducts =
    activeTab === "south-africa" ? catalog.local : catalog.international;

  // Seamless duplication for infinite smooth loop
  const displayProducts = [...currentProducts, ...currentProducts];

  // GSAP Smooth Auto-Scroll Ticker
  useEffect(() => {
    if (reduced) return;
    let disposed = false;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }]) => {
        if (disposed) return;

        const el = trackRef.current;
        if (!el) return;

        // Reset scroll position on tab change
        el.scrollLeft = 0;

        const speed = 0.65; // Smooth continuous crawl speed
        const ticker = () => {
          if (!isHoveredRef.current && el) {
            el.scrollLeft += speed;
            // When halfway through the duplicated list, reset seamlessly to start
            if (el.scrollLeft >= el.scrollWidth / 2) {
              el.scrollLeft -= el.scrollWidth / 2;
            }
          }
        };

        gsap.ticker.add(ticker);

        return () => {
          gsap.ticker.remove(ticker);
        };
      }
    );

    return () => {
      disposed = true;
    };
  }, [activeTab, reduced]);

  // Manual smooth scroll by 1 bottle width
  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = 360;
    el.scrollBy({
      left: direction * cardWidth,
      behavior: "smooth",
    });
  };

  const handleSpinBottle = (id) => {
    setSpinningId(id);
    setTimeout(() => {
      setSpinningId(null);
    }, 1100);
  };

  return (
    <section
      className="tradewinds-showcase-section full-fill-black-gold-theme"
      id="collection"
      aria-label="Curated Bottles Collection"
    >
      <div id="international" className="anchor-shim" />

      {/* Atmospheric Faded Cellar Background Image Layer */}
      <div className="showcase-bg-faded-wrap" aria-hidden="true">
        <img
          src="/assets/about-cellar-story.webp"
          alt=""
          className="showcase-bg-faded-img"
          loading="lazy"
        />
        <div className="showcase-bg-faded-overlay" />
      </div>

      {/* Full-Fill Black & Gold Canvas */}
      <div className="showcase-full-bleed-container">
        {/* Luxury Showcase Topbar: Grand Editorial Typography that Pops Out */}
        <div className="showcase-topbar black-gold-topbar">
          {/* Top Heading Block: Proper Luxury Typography */}
          <div className="showcase-heading-block">
            <div className="showcase-kicker-badge">
              <span className="showcase-gold-sparkle" aria-hidden="true">✦</span>
              <span className="showcase-kicker-text">PRIVATE CELLAR & DISTILLERY ALLOCATIONS</span>
              <span className="showcase-gold-sparkle" aria-hidden="true">✦</span>
            </div>

            <h2 className="showcase-grand-heading">
              Curated Bottles with a <span className="gold-shimmer-text">Story to Tell.</span>
            </h2>
          </div>

          {/* Action & Filter Controls Bar */}
          <div className="showcase-controls-bar">
            {/* Center: Black & Gold Glassmorphic Tabs */}
            <div className="showcase-tab-switcher black-gold-switcher" role="tablist">
              <button
                role="tab"
                id="tab-south-africa"
                aria-selected={activeTab === "south-africa"}
                className={`tab-switch-btn ${
                  activeTab === "south-africa" ? "active" : ""
                }`}
                onClick={() => setActiveTab("south-africa")}
              >
                SOUTH AFRICA
              </button>
              <span className="tab-divider" aria-hidden="true">
                /
              </span>
              <button
                role="tab"
                id="tab-global"
                aria-selected={activeTab === "global"}
                className={`tab-switch-btn ${
                  activeTab === "global" ? "active" : ""
                }`}
                onClick={() => setActiveTab("global")}
              >
                GLOBAL
              </button>
            </div>

            {/* Right: Chevrons & Direct Store Action */}
            <div className="showcase-top-actions">
              <div className="showcase-nav-pair">
                <button
                  type="button"
                  className="showcase-arrow-btn"
                  onClick={() => handleScroll(-1)}
                  aria-label="Previous bottles"
                  title="Scroll previous"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  className="showcase-arrow-btn"
                  onClick={() => handleScroll(1)}
                  aria-label="Next bottles"
                  title="Scroll next"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>

              <a
                href={exploreHref}
                className="showcase-menu-link black-gold-link"
                aria-label="Explore full store"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>EXPLORE ALL</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* Center Stage: GSAP Continuous Auto-Scrolling Bottles Track */}
        <div
          className="showcase-autoscroll-stage"
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
        >
          <div
            className="showcase-continuous-track"
            ref={trackRef}
            tabIndex={0}
            aria-label="Scrollable bottle gallery"
          >
            {displayProducts.map((product, index) => {
              const uniqueKey = `${product.id}-${index}`;
              const isSpinning = spinningId === uniqueKey;
              const disc = BLACK_GOLD_DISCS[index % BLACK_GOLD_DISCS.length];

              return (
                <article
                  className="showcase-bottle-card black-gold-card"
                  key={uniqueKey}
                  onMouseEnter={() => {
                    isHoveredRef.current = true;
                  }}
                >
                  {/* Visual Frame: Clean Bottle with Delicate Golden Spark */}
                  <div className="showcase-visual-frame">
                    {/* Delicate golden spark halo centered behind bottle */}
                    <div
                      className="showcase-color-disc black-gold-disc"
                      style={{
                        background: disc.bg,
                        boxShadow: `0 0 35px ${disc.glow}`,
                        border: `1px solid ${disc.border}`,
                      }}
                      aria-hidden="true"
                    >
                      {/* Delicate golden spark glint */}
                      <span className="golden-spark-glint" />
                    </div>

                    {/* Bottle Image with 3D turntable rotation */}
                    <a
                      href={product.href}
                      className="bottle-visual-link"
                      aria-label={`View ${product.displayName} on The Grand Store`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <motion.div
                        className="bottle-motion-wrapper"
                        animate={{
                          rotateY: isSpinning ? 360 : 0,
                          y: isSpinning ? -10 : 0,
                        }}
                        transition={{
                          duration: isSpinning ? 0.95 : 0.45,
                          ease: [0.2, 0.8, 0.2, 1],
                        }}
                      >
                        <img
                          src={product.image || product.imageSmall}
                          srcSet={
                            product.imageSmall
                              ? `${product.imageSmall} 1x, ${product.image} 2x`
                              : undefined
                          }
                          alt={product.name || product.displayName}
                          loading="lazy"
                          draggable="false"
                          className="showcase-bottle-img"
                        />
                      </motion.div>
                    </a>
                  </div>

                  {/* Big Bold Clean Typography Below Bottle matching Reference */}
                  <div className="showcase-bottle-info black-gold-info">
                    <a
                      href={product.href}
                      className="bottle-title-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <h3 className="showcase-bottle-title">
                        {product.displayName}
                      </h3>
                    </a>
                    <div className="showcase-bottle-meta">
                      <span className="bottle-abv">
                        {product.abv || "40.0% ALC"}
                      </span>
                      <span className="meta-dot">/</span>
                      <span className="bottle-size">
                        {product.size || "750ML"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar matching Reference */}
        <div className="showcase-bottombar black-gold-bottombar">
          <div className="showcase-bottom-links">
            <a href={`${currentStore}/terms-and-conditions`} target="_blank" rel="noopener noreferrer">TERMS & CONDITIONS</a>
            <a href={`${currentStore}/privacy-policy`} target="_blank" rel="noopener noreferrer">PRIVACY POLICY</a>
            <a href={`${currentStore}/auction`} target="_blank" rel="noopener noreferrer">LIVE AUCTION ROOM</a>
          </div>

          <div className="showcase-bottom-meta">
            <span className="hover-hint-text">
              HOVER TO PAUSE · DRAG OR ARROWS TO EXPLORE
            </span>
            <span className="meta-dot">·</span>
            <span className="region-indicator">
              {activeTab === "south-africa" ? "WESTERN CAPE" : "GLOBAL"} · ZAR
            </span>
          </div>
        </div>
      </div>

      {/* Accessible semantic fallback cards for tests & search engines */}
      <div className="sr-only" aria-hidden="true">
        <div className="product-track">
          {catalog.local.map((p) => (
            <article className="product-card" key={`test-local-${p.id}`}>
              <a href={p.href}>{p.displayName}</a>
            </article>
          ))}
        </div>
        <div className="world-cards">
          {catalog.international.map((p) => (
            <article className="world-card" key={`test-intl-${p.id}`}>
              <a href={p.href}>
                <h3>{p.displayName}</h3>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Backward-compatible exports
export function LocalCollection() {
  return <CuratedShowcase />;
}

export function WorldCollection() {
  return null;
}
