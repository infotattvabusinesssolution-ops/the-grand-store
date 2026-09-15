"use client";

import { useRef } from "react";
import { ArrowRight, SealCheck, Sparkle, Wine } from "@phosphor-icons/react";

export default function AboutUsStory({ onNavigateAbout }) {
  const sectionRef = useRef(null);

  const handleReadMore = (e) => {
    e.preventDefault();
    if (onNavigateAbout) {
      onNavigateAbout();
    } else {
      window.history.pushState({}, "", "/about");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <section
      className="about-torn-section black-gold-theme"
      id="our-story"
      ref={sectionRef}
      aria-labelledby="about-torn-heading"
    >
      {/* Faded Background Heritage Layer */}
      <div className="about-faded-bg" aria-hidden="true">
        <img
          src="/assets/about-cellar-story.webp"
          alt=""
          className="about-faded-img"
          loading="lazy"
        />
        <div className="about-faded-overlay" />
        <div className="about-gold-glow" />
      </div>

      {/* Top Gilded Torn Paper Divider */}
      <div className="torn-edge torn-edge-top" aria-hidden="true">
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          preserveAspectRatio="none"
          className="torn-svg"
        >
          <path
            d="M0,0 
               L1440,0 
               L1440,24 
               C1360,8 1290,44 1210,22 
               C1130,2 1060,38 980,18 
               C900,-2 830,34 750,14 
               C670,-4 600,32 520,12 
               C440,-6 370,28 290,10 
               C210,-6 140,26 0,16 
               Z"
            fill="#08090c"
          />
          <path
            d="M1440,24 
               C1360,8 1290,44 1210,22 
               C1130,2 1060,38 980,18 
               C900,-2 830,34 750,14 
               C670,-4 600,32 520,12 
               C440,-6 370,28 290,10 
               C210,-6 140,26 0,16"
            stroke="rgba(212, 175, 55, 0.45)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      <div className="container about-torn-container">
        <div className="about-torn-layout">
          {/* Left Column: Boutique Storefront & Certified Provenance Card */}
          <div className="about-col-left">
            <div className="torn-photo-card storefront-card">
              <div className="torn-pin-callout">
                <div className="pin-target-dot">
                  <span className="pin-ring" />
                </div>
                <div className="pin-leader-line" />
                <span className="pin-text">
                  CNR CRADOCK & TYRWHITT · ROSEBANK 2196
                </span>
              </div>

              <div className="photo-frame">
                <img
                  src="/assets/about-storefront.jpg"
                  alt="The Grand Store luxury boutique storefront exterior"
                  loading="lazy"
                  className="photo-img"
                />
                <div className="photo-overlay-vignette" />
                <div className="photo-corner-tag">
                  <span className="corner-tag-dot" />
                  <span>BOUTIQUE CELLAR</span>
                </div>
                <div className="photo-gold-border-corner" />
              </div>
            </div>

            {/* Compact Lower-Left Provenance Credential Box */}
            <div className="about-provenance-box">
              <div className="provenance-seal">
                <SealCheck size={18} weight="fill" className="seal-icon" />
                <span>AUTHENTICATED PROVENANCE</span>
              </div>
              <p className="provenance-quote">
                “Every vintage is sourced directly from private estates, inspected by certified sommeliers, and kept in climate-calibrated storage.”
              </p>
            </div>

            {/* Cellar Standards & Curation Manifesto Text Card */}
            <div className="about-cellar-manifesto">
              <div className="manifesto-header">
                <div className="manifesto-kicker">
                  <Wine size={14} weight="fill" className="manifesto-icon" />
                  <span>CURATOR'S VAULT STANDARDS</span>
                </div>
                <h3 className="manifesto-heading">
                  Obsessive Curation, <em>Bottle by Bottle.</em>
                </h3>
              </div>

              <p className="manifesto-body">
                We believe exceptional bottles are living pieces of history. Each vintage allocation in our Rosebank boutique and private vault is directly secured with unbroken estate provenance, stored in precision temperature cellars, and inspected by certified sommeliers before release.
              </p>
            </div>
          </div>

          {/* Right Column: Narrative, Read More CTA & Evening Winelands Terrace */}
          <div className="about-col-right">
            <div className="about-editorial-block">
              <div className="about-kicker-row">
                <Sparkle size={14} weight="fill" className="gold-sparkle" />
                <span className="about-kicker">HERITAGE & PASSION · EST. 2021</span>
              </div>

              <h2 id="about-torn-heading" className="about-torn-title">
                ABOUT <em>US</em>
              </h2>

              <div className="about-subtitle-quote">
                <span>“Rooted in South African soul. Curated for the world.”</span>
              </div>

              <div className="about-torn-paragraphs">
                <p className="lead-p">
                  The Grand Store is inspired by a devotion to the world’s finest terroirs — from the warm, complex depth of Cape Pinotage and rare single casks to the crisp, mineral purity of boutique whites.
                </p>
                <p>
                  We curate exclusively from passionate local South African makers and celebrated global estates, delivering exceptional bottles directly to your home. We partner only with those who treat winemaking and craft distillation as true fine art.
                </p>
              </div>

              <a
                href="/about"
                onClick={handleReadMore}
                className="torn-read-more-btn"
                id="about-read-more-btn"
              >
                <span>READ MORE</span>
                <ArrowRight size={14} weight="bold" />
              </a>
            </div>

            {/* Evening Terrace Card with Leader Pin */}
            <div className="torn-photo-card terrace-card">
              <div className="torn-pin-callout pin-callout-terrace">
                <div className="pin-target-dot">
                  <span className="pin-ring" />
                </div>
                <div className="pin-leader-line" />
                <span className="pin-text">
                  FRANSCHHOEK VALLEY · WINELANDS TASTING ROOM
                </span>
              </div>

              <div className="photo-frame">
                <img
                  src="/assets/about-terrace-night.jpg"
                  alt="Evening wine tasting terrace in Franschhoek Cape Winelands"
                  loading="lazy"
                  className="photo-img"
                />
                <div className="photo-overlay-vignette" />
                <div className="photo-corner-tag">
                  <span className="corner-tag-dot" />
                  <span>TASTING ROOM</span>
                </div>
                <div className="photo-gold-border-corner" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gilded Torn Paper Divider */}
      <div className="torn-edge torn-edge-bottom" aria-hidden="true">
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          preserveAspectRatio="none"
          className="torn-svg"
        >
          <path
            d="M0,48 
               L1440,48 
               L1440,24 
               C1350,42 1270,6 1190,26 
               C1110,46 1040,10 960,30 
               C880,48 810,12 730,32 
               C650,50 580,16 500,36 
               C420,54 350,18 270,36 
               C190,52 110,16 0,32 
               Z"
            fill="#08090c"
          />
          <path
            d="M1440,24 
               C1350,42 1270,6 1190,26 
               C1110,46 1040,10 960,30 
               C880,48 810,12 730,32 
               C650,50 580,16 500,36 
               C420,54 350,18 270,36 
               C190,52 110,16 0,32"
            stroke="rgba(212, 175, 55, 0.45)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>
    </section>
  );
}
