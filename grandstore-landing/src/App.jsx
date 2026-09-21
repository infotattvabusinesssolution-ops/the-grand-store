import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion, AnimatePresence, motion } from "motion/react";
import { Agentation } from "agentation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarBlank,
  Gavel,
  GlobeHemisphereWest,
  List,
  X,
  Wine,
  Martini,
  BeerStein,
  Storefront,
  Plus,
  Minus,
  Sparkle,
  ShieldCheck,
  SealCheck,
  Compass,
  ArrowsClockwise,
  Clock,
  Lightning,
  Fire,
  Crown,
  TrendUp,
  Ticket,
} from "@phosphor-icons/react";
import { Reveal, MagneticLink } from "./components/MotionUI";
import CuratedShowcase from "./components/Collections";
import AboutPage from "./pages/AboutPage";
import AuctionsPage from "./pages/AuctionsPage";
import AppPromoSection from "./components/AppPromoSection";
import Testimonials from "./components/Testimonials";
import PerspectiveHero from "./components/PerspectiveHero";
import BottleScene, { BOTTLE_PRESETS } from "./components/BottleScene";
import Footer from "./components/Footer";
import StickySocialBar from "./components/StickySocialBar";
import LegalModal from "./components/LegalModal";
import AppDownloadModal from "./components/AppDownloadModal";
const STORE = "https://grandstoreglobal.com";
const navigation = [
  ["About us", "/about"],
  ["Collection", "#collection"],
  ["Experiences", "#experiences"],
  ["Auctions", "#auctions"],
  ["App", "#download-app"],
  ["Reviews", "#reviews"],
];

function Header({ onNavigate, onOpenAppModal, currentRoute = "/" }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef(null);
  const menuRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector("a");
    first?.focus();
    const handler = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setOpen(false);
    if (href === "#app" && onOpenAppModal) {
      onOpenAppModal();
      return;
    }
    if (onNavigate) {
      if (href === "#auctions" || href === "/auctions") {
        onNavigate("/auctions");
      } else {
        onNavigate(href);
      }
    }
  };

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-inner">
        <a
          className="brand"
          href="#home"
          aria-label="The Grand Store home"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate("/");
          }}
        >
          <img
            src="/assets/brand-logo.webp"
            width="210"
            height="67"
            alt="The Grand Store. Crafting moments, raising spirits."
          />
        </a>
        <nav aria-label="Main navigation" className="desktop-nav">
          {navigation.map(([label, href]) => {
            const isAuction = href === "#auctions" || href === "/auctions";
            const isAbout = href === "/about";
            const isActive = isAuction
              ? currentRoute === "/auctions"
              : isAbout
              ? currentRoute === "/about"
              : false;
            return (
              <a
                key={label}
                href={isAuction ? "/auctions" : href}
                target={isAbout ? "_blank" : undefined}
                rel={isAbout ? "noopener noreferrer" : undefined}
                className={isActive ? "active-nav-tab" : ""}
                onClick={(e) => {
                  if (isAbout) {
                    return;
                  }
                  handleNavClick(e, href);
                }}
              >
                {label}
                {isAuction && <span className="nav-live-dot" />}
              </a>
            );
          })}
        </nav>
        <div className="nav-actions">
          <a className="store-link" href={STORE}>
            Visit the store <ArrowUpRight size={17} />
          </a>
          <button
            className="menu-toggle"
            ref={menuButton}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={25} /> : <List size={25} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-navigation"
            ref={menuRef}
            className="mobile-nav"
            aria-label="Mobile navigation"
            initial={reduced ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {navigation.map(([label, href]) => {
              const isAuction = href === "#auctions" || href === "/auctions";
              const isAbout = href === "/about";
              const isActive = isAuction
                ? currentRoute === "/auctions"
                : isAbout
                ? currentRoute === "/about"
                : false;
              return (
                <a
                  key={label}
                  href={isAuction ? "/auctions" : href}
                  target={isAbout ? "_blank" : undefined}
                  rel={isAbout ? "noopener noreferrer" : undefined}
                  className={isActive ? "active-nav-tab" : ""}
                  onClick={(e) => {
                    setOpen(false);
                    if (isAbout) {
                      return;
                    }
                    handleNavClick(e, href);
                  }}
                >
                  <span>
                    {label}
                    {isAuction && <span className="nav-live-dot" />}
                  </span>
                  <ArrowUpRight size={21} />
                </a>
              );
            })}
            <a href={STORE} onClick={() => setOpen(false)}>
              Visit the store <ArrowUpRight size={21} />
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero({ reduceMotion }) {
  const [activeBottleIndex, setActiveBottleIndex] = useState(0);
  const [isBottleHovered, setIsBottleHovered] = useState(false);
  const [telemetry, setTelemetry] = useState({
    angle: 0,
    rpm: 18,
    isSpinning: false,
    spinSpeedText: "AURA DRIFT",
  });

  const activePreset = BOTTLE_PRESETS[activeBottleIndex] || BOTTLE_PRESETS[0];

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      {/* Background Cellar Ambiance */}
      <div className="hero-cellar-backdrop" aria-hidden="true">
        <div className="cellar-vignette" />
        <div className="cellar-light-beam" />
        <div className="cellar-golden-aura" />
      </div>

      <div className="container hero-grid">
        {/* Left: Refined Kinetic Typography & Interactive Sommelier Deck */}
        <div className="hero-copy">
          <Reveal delay={0.05}>
            <div className="hero-eyebrow-badge">
              <span className="live-status-pulse" />
              <span className="eyebrow-text">EST. 2024 • THE GRAND STORE PRIVATE ARCHIVE</span>
              <span className="provenance-tag">SOUTH AFRICA & THE WORLD</span>
            </div>
          </Reveal>

          {/* Kinetic Headline that reacts to active bottle */}
          <Reveal delay={0.12}>
            <div className="hero-headline-wrap">
              <h1 id="hero-title" key={activePreset.id} className="kinetic-hero-headline">
                {activeBottleIndex === 0 && (
                  <>
                    A World of
                    <br />
                    <em>Good Taste.</em>
                  </>
                )}
                {activeBottleIndex === 1 && (
                  <>
                    Born from Earth,
                    <br />
                    <em>Aged to Perfection.</em>
                  </>
                )}
                {activeBottleIndex === 2 && (
                  <>
                    Liquid Gold from
                    <br />
                    <em>Highland Stills.</em>
                  </>
                )}
                {activeBottleIndex === 3 && (
                  <>
                    Centuries of
                    <br />
                    <em>Noble Alchemy.</em>
                  </>
                )}
              </h1>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="hero-lead-narrative">
              South Africa’s premier reserve cellar. Hand-selected vintage champagnes, rare single
              casks, and small-batch icons, curated for those who savor the extraordinary.
            </p>
          </Reveal>

          {/* Interactive Bottle Selector Chips ("Associate Text Plays") */}
          <Reveal delay={0.22}>
            <div className="hero-vintage-tabs">
              <div className="vintage-tabs-header">
                <span className="vintage-tabs-title">Curated Cellar Reserve:</span>
                <div className="vintage-nav-arrows">
                  <button
                    type="button"
                    className="editorial-arrow-btn"
                    onClick={() =>
                      setActiveBottleIndex(
                        (activeBottleIndex - 1 + BOTTLE_PRESETS.length) % BOTTLE_PRESETS.length
                      )
                    }
                    aria-label="Previous vintage"
                  >
                    ←
                  </button>
                  <div className="editorial-dots">
                    {BOTTLE_PRESETS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`editorial-dot ${i === activeBottleIndex ? "active" : ""}`}
                        onClick={() => setActiveBottleIndex(i)}
                        aria-label={`Go to vintage ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="editorial-arrow-btn"
                    onClick={() =>
                      setActiveBottleIndex((activeBottleIndex + 1) % BOTTLE_PRESETS.length)
                    }
                    aria-label="Next vintage"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="vintage-tabs-list" role="tablist">
                {BOTTLE_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === activeBottleIndex}
                    className={`vintage-tab-btn ${idx === activeBottleIndex ? "is-active" : ""}`}
                    onClick={() => setActiveBottleIndex(idx)}
                    onMouseEnter={() => setActiveBottleIndex(idx)}
                  >
                    <span className="tab-num">0{idx + 1}</span>
                    <span className="tab-name">{preset.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Kinetic Sommelier Tasting Notes Deck */}
          <Reveal delay={0.26}>
            <div
              className={`hero-tasting-deck ${isBottleHovered ? "is-spinning-active" : ""}`}
              key={`deck-${activePreset.id}`}
            >
              <div className="tasting-deck-header">
                <div className="deck-title-group">
                  <span className="deck-vintage-badge">{activePreset.vintage}</span>
                  <span className="deck-points-badge">{activePreset.points}</span>
                  <h3 className="deck-bottle-name">{activePreset.name}</h3>
                </div>
                <div className="deck-terroir">{activePreset.terroir}</div>
              </div>

              <div className="tasting-notes-body">
                {/* Editorial Sommelier Review Card matching reference video */}
                <div className="editorial-sommelier-quote">
                  <span className="quote-mark">“</span>
                  <p className="quote-text">{activePreset.quote.replace(/[“”]/g, "")}</p>
                  <span className="quote-author">— {activePreset.sommelier}</span>
                </div>

                <div className="tasting-note-item">
                  <span className="note-label">TASTING NOTES</span>
                  <p className="note-value">{activePreset.tagline}</p>
                </div>
                <div className="tasting-note-item">
                  <span className="note-label">CASK & ALLOCATION</span>
                  <p className="note-value">
                    {activePreset.barrel} • {activePreset.abv}
                  </p>
                </div>
              </div>

              <div className="tasting-deck-footer">
                <div className="telemetry-pill">
                  <span className={`telemetry-dot ${isBottleHovered ? "pulse-fast" : ""}`} />
                  <span className="telemetry-text">
                    {isBottleHovered
                      ? "✦ HIGH-VELOCITY 3D ROTATION SCAN"
                      : "✦ HOVER BOTTLE TO SPIN 3D"}
                  </span>
                </div>
                <span className="telemetry-rpm">{telemetry.rpm || 18} RPM</span>
              </div>
            </div>
          </Reveal>

          {/* Action Links */}
          <Reveal delay={0.32} className="hero-actions">
            <MagneticLink href={`${STORE}/shop`} className="button primary-luxury-btn">
              Explore The Collection <ArrowRight size={18} />
            </MagneticLink>
            <a href={`${STORE}/events`} className="text-link luxury-secondary-link">
              Book Private Tasting <ArrowUpRight size={17} />
            </a>
          </Reveal>

          {/* Cellar Trust Indicators */}
          <Reveal delay={0.36}>
            <div className="hero-trust-bar">
              <div className="trust-item">
                <strong>1,400+</strong>
                <span>Allocated Vintages</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <strong>100%</strong>
                <span>Authenticated Provenance</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <strong>48h</strong>
                <span>Cold-Chain Express</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right: Interactive 3D Real Bottle Canvas & Floating Spatial Cards */}
        <div className="hero-visual">
          <span className="hero-watermark" aria-hidden="true">
            GRAND
          </span>

          {/* Floating Spatial Spec Badges around Bottle */}
          <div className="spatial-badge top-right-badge">
            <span className="spatial-kicker">ALLOCATION TIER</span>
            <span className="spatial-title">Private Reserve No. 89</span>
            <span className="spatial-sub">{activePreset.terroir}</span>
          </div>

          <div className="spatial-badge bottom-left-badge">
            <span className="spatial-kicker">CELLAR CONDITION</span>
            <span className="spatial-title">55°F • 70% Humidity</span>
            <span className="spatial-sub">Inspected by Grand Store Cellarmaster</span>
          </div>

          <BottleScene
            reduceMotion={reduceMotion}
            activeBottleIndex={activeBottleIndex}
            onBottleChange={setActiveBottleIndex}
            onHoverState={setIsBottleHovered}
            onTelemetry={setTelemetry}
          />
        </div>
      </div>
    </section>
  );
}

const categories = [
  ["Fine wines", Wine, "Wine"],
  ["Whisky", Martini, "Whisky"],
  ["Champagne", Wine, "Champagne"],
  ["Craft spirits", Martini, "Spirits"],
  ["Beer & cider", BeerStein, "Beer"],
];
function CategoryBar() {
  return (
    <nav className="category-bar" aria-label="Shop by category">
      <div className="container category-inner">
        <span className="category-intro">
          Find your
          <br />
          <strong>kind of exceptional.</strong>
        </span>
        {categories.map(([label, Icon, category]) => (
          <a key={label} href={`${STORE}/shop?category=${category}`}>
            <Icon size={24} weight="thin" />
            <span>{label}</span>
            <ArrowUpRight size={14} />
          </a>
        ))}
      </div>
    </nav>
  );
}

function Experiences() {
  return (
    <section
      className="about-torn-section black-gold-theme events-torn-section"
      id="experiences"
      aria-labelledby="events-heading"
    >
      {/* Faded Background Heritage Layer */}
      <div className="about-faded-bg" aria-hidden="true">
        <img
          src="/assets/experiences-faded-bg.webp"
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
          {/* Left Column: Tasting Masterclass Card + Provenance Protocol + Standards */}
          <div className="about-col-left">
            <div className="torn-photo-card storefront-card">
              <div className="torn-pin-callout">
                <div className="pin-target-dot">
                  <span className="pin-ring" />
                </div>
                <div className="pin-leader-line" />
                <span className="pin-text">
                  THE VAULT SALON · ROSEBANK CELLAR 2196
                </span>
              </div>

              <div className="photo-frame">
                <img
                  src="/assets/experiences-ron-abuelo.webp"
                  alt="Private tasting masterclass with rare spirits and oak pairings"
                  loading="lazy"
                  className="photo-img"
                />
                <div className="photo-overlay-vignette" />
                <div className="photo-corner-tag">
                  <span className="corner-tag-dot" />
                  <span>PRIVATE SALON</span>
                </div>
                <div className="photo-gold-border-corner" />
              </div>
            </div>

            {/* Sommelier Tasting Protocol Credential Box */}
            <div className="about-provenance-box">
              <div className="provenance-seal">
                <SealCheck size={18} weight="fill" className="seal-icon" />
                <span>SOMMELIER-GUIDED FLIGHTS</span>
              </div>
              <p className="provenance-quote">
                “Every gathering is curated by master sommeliers with rare single casks, bespoke vintage pairings, and direct cellar allocations.”
              </p>
            </div>

            {/* Event Standards & Reservation Card */}
            <div className="about-cellar-manifesto">
              <div className="manifesto-header">
                <div className="manifesto-kicker">
                  <Wine size={14} weight="fill" className="manifesto-icon" />
                  <span>BESPOKE CELLAR EXPERIENCES</span>
                </div>
                <h3 className="manifesto-heading">
                  Intimate Gatherings, <em>By Reservation.</em>
                </h3>
              </div>

              <p className="manifesto-body">
                Step behind the velvet curtain for guided sommelier flights, executive cellar masterclasses, and sunset tastings across our subterranean Rosebank vaults and Franschhoek Winelands terraces. Every private gathering is capped at 12 guests to guarantee unparalleled personal curation, accompanied by rare direct cellar allocations, artisanal pairings, and bespoke sommelier consultations tailored to your palate.
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Narrative, Booking CTAs & Evening Winelands Terrace */}
          <div className="about-col-right">
            <div className="about-editorial-block">
              <div className="about-kicker-row">
                <Sparkle size={14} weight="fill" className="gold-sparkle" />
                <span className="about-kicker">SALON & CELLAR TASTINGS · PRIVATE BOOKINGS</span>
              </div>

              <h2 id="events-heading" className="about-torn-title">
                PRIVATE <em>EXPERIENCES</em>
              </h2>

              <div className="about-subtitle-quote">
                <span>“An affair of good taste. Intimate cellar flights & masterclasses.”</span>
              </div>

              <div className="about-torn-paragraphs">
                <p className="lead-p">
                  Beyond the storefront lies an intimate sanctuary for those who revere the craft of the barrel — from rare single malts and Panamanian aged rums to Franschhoek estate vintages.
                </p>
                <p>
                  Whether hosting an exclusive corporate gathering, an anniversary flight, or an in-depth terroir discovery, our master sommeliers tailor every pour and tasting note to your palate with rare cellar allocations.
                </p>
              </div>

              <div className="events-torn-actions">
                <a
                  href={`${STORE}/events`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="torn-read-more-btn"
                >
                  <span>BOOK AN EVENT</span>
                  <ArrowRight size={14} weight="bold" />
                </a>

                <a
                  href={`${STORE}/contact-us`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="events-inquire-link"
                >
                  <span>Inquire for private dates</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            {/* Evening Terrace Card with Leader Pin */}
            <div className="torn-photo-card terrace-card">
              <div className="torn-pin-callout pin-callout-terrace">
                <div className="pin-target-dot">
                  <span className="pin-ring" />
                </div>
                <div className="pin-leader-line" />
                <span className="pin-text">
                  FRANSCHHOEK VALLEY · WINELANDS SUNSET TERRACE
                </span>
              </div>

              <div className="photo-frame">
                <img
                  src="/assets/experiences-mystic-oak.webp"
                  alt="Fine spirits and oak masterclass experience"
                  loading="lazy"
                  className="photo-img"
                />
                <div className="photo-overlay-vignette" />
                <div className="photo-corner-tag">
                  <span className="corner-tag-dot" />
                  <span>TASTING TERRACE</span>
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

const faqs = [
  [
    "What is The Grand Store?",
    "The Grand Store is South Africa’s premier online fine wine and luxury spirits marketplace. We connect connoisseurs directly with certified Cape Winelands estates, private cellars, and world-renowned craft distilleries, providing authenticated provenance and white-glove delivery.",
  ],
  [
    "Who can purchase and how is legal age verified?",
    "Any individual of legal drinking age (18+ in South Africa, or the legal drinking age in your respective territory) can purchase from our platform. Checkout enforces digital age confirmation, and courier delivery requires adult signature and valid ID verification upon receipt.",
  ],
  [
    "How does climate-calibrated cellar shipping work?",
    "Every bottle is stored in precision temperature-controlled vaults (12°C–14°C) and dispatched in specialized insulated, shock-absorbent packaging. We partner with specialized temperature-calibrated couriers offering unbroken tracking and full insurance from our cellar to your door.",
  ],
  [
    "What is authenticated provenance and sommelier inspection?",
    "We exclusively source allocations directly from certified winemakers, registered private estates, and licensed bonded warehouses. Every vintage allocation undergoes physical inspection by certified sommeliers before release, backed by an unbroken chain-of-custody guarantee.",
  ],
  [
    "How do Private Auctions and Vault lots operate?",
    "Rare museum vintages, single casks, and private collector allocations are presented in our digital Auction Room. Registered members can place real-time bids, set automated proxy ceilings, and complete secure escrow checkout with insured delivery.",
  ],
  [
    "How can wine estates, distilleries, and merchants become vendors?",
    "Licensed wine farms, boutique distilleries, and verified merchants can apply through the Grand Store Vendor Portal. Following compliance checks, liquor license verification, and onboarding, vendors gain access to inventory management, logistics integration, and a nationwide audience of discerning buyers.",
  ],
  [
    "Where can I download the mobile app and what perks does it offer?",
    "The Grand Store app is available for iOS on the Apple App Store and for Android on Google Play. Mobile app users enjoy early access to rare bottle drops, push notifications for live auction lots, digital event tickets with instant QR scanning, and personalized sommelier recommendations.",
  ],
];
function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <section className="faq section-space" id="faq" aria-labelledby="faq-heading">
      <div className="container faq-layout">
        <Reveal>
          <h2 id="faq-heading">
            A little
            <br />
            <em>more to know.</em>
          </h2>
          <a className="text-link" href={`${STORE}/contact-us`} target="_blank" rel="noopener noreferrer">
            Get in touch <ArrowUpRight size={17} />
          </a>
        </Reveal>
        <div className="faq-list">
          {faqs.map(([question, answer], i) => (
            <div className="faq-item" key={question}>
              <h3>
                <button
                  aria-expanded={open === i}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  {question}
                  {open === i ? <Minus size={19} /> : <Plus size={19} />}
                </button>
              </h3>
              <div id={`faq-${i}`} hidden={open !== i}>
                <p>
                  {answer}
                  {i === 5 && (
                    <>
                      {" "}
                      <a href={`${STORE}/vendor-portal`} target="_blank" rel="noopener noreferrer">
                        Visit the Grand Store Vendor Portal.
                      </a>
                    </>
                  )}
                  {i === 6 && (
                    <>
                      {" "}
                      <a href={`${STORE}/app/download`} target="_blank" rel="noopener noreferrer">
                        Download The Grand Store Mobile App.
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const reduced = useReducedMotion();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState("privacy");
  const [appModalOpen, setAppModalOpen] = useState(false);

  const handleOpenLegal = (tab = "privacy") => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  const [route, setRoute] = useState(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      const h = window.location.hash;
      if (p === "/about" || h === "#about" || h === "#/about") {
        return "/about";
      }
      if (p === "/auctions" || h === "#auctions" || h === "#/auctions") {
        return "/auctions";
      }
    }
    return "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      const h = window.location.hash;
      if (p === "/about" || h === "#about" || h === "#/about") {
        setRoute("/about");
      } else if (p === "/auctions" || h === "#auctions" || h === "#/auctions") {
        setRoute("/auctions");
      } else if (p === "/privacy-policy" || h === "#privacy-policy") {
        setLegalTab("privacy");
        setLegalModalOpen(true);
      } else if (p === "/terms-and-conditions" || h === "#terms-and-conditions" || p === "/terms-of-service") {
        setLegalTab("terms");
        setLegalModalOpen(true);
      } else {
        setRoute("/");
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  const navigate = (to) => {
    if (to === "/about" || to === "#about") {
      window.history.pushState({}, "", "/about");
      setRoute("/about");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (to === "/auctions" || to === "#auctions") {
      window.history.pushState({}, "", "/auctions");
      setRoute("/auctions");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (to === "/privacy-policy" || to === "#privacy-policy") {
      handleOpenLegal("privacy");
    } else if (to === "/terms-and-conditions" || to === "#terms-and-conditions") {
      handleOpenLegal("terms");
    } else if (to && to.startsWith("#")) {
      if (route !== "/") {
        window.history.pushState({}, "", "/");
        setRoute("/");
        setTimeout(() => {
          const el = document.querySelector(to);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 80);
      } else {
        const el = document.querySelector(to);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      window.history.pushState({}, "", "/");
      setRoute("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (route === "/about") {
    return (
      <>
        <Header onNavigate={navigate} onOpenAppModal={() => setAppModalOpen(true)} currentRoute="/about" />
        <AboutPage onNavigateHome={() => navigate("/")} />
        <Footer
          onNavigateHome={() => navigate("/")}
          onNavigateAbout={() => navigate("/about")}
          onNavigateAuctions={() => navigate("/auctions")}
          onOpenLegal={handleOpenLegal}
          onOpenAppModal={() => setAppModalOpen(true)}
        />
        <StickySocialBar />
        <LegalModal
          isOpen={legalModalOpen}
          initialTab={legalTab}
          onClose={() => setLegalModalOpen(false)}
        />
        <AppDownloadModal
          isOpen={appModalOpen}
          onClose={() => setAppModalOpen(false)}
        />
        <Agentation />
      </>
    );
  }

  if (route === "/auctions") {
    return (
      <>
        <Header onNavigate={navigate} onOpenAppModal={() => setAppModalOpen(true)} currentRoute="/auctions" />
        <AuctionsPage onNavigateHome={() => navigate("/")} />
        <Footer
          onNavigateHome={() => navigate("/")}
          onNavigateAbout={() => navigate("/about")}
          onNavigateAuctions={() => navigate("/auctions")}
          onOpenLegal={handleOpenLegal}
          onOpenAppModal={() => setAppModalOpen(true)}
        />
        <StickySocialBar />
        <LegalModal
          isOpen={legalModalOpen}
          initialTab={legalTab}
          onClose={() => setLegalModalOpen(false)}
        />
        <AppDownloadModal
          isOpen={appModalOpen}
          onClose={() => setAppModalOpen(false)}
        />
        <Agentation />
      </>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header onNavigate={navigate} onOpenAppModal={() => setAppModalOpen(true)} currentRoute="/" />
      <main id="main">
        <PerspectiveHero reduceMotion={reduced} onNavigate={navigate} />
        <CategoryBar />
        <CuratedShowcase />
        <Experiences />
        <AppPromoSection />
        <Testimonials />
        <Faq />
      </main>
      <Footer
        onNavigateHome={() => navigate("/")}
        onNavigateAbout={() => navigate("/about")}
        onNavigateAuctions={() => navigate("/auctions")}
        onOpenLegal={handleOpenLegal}
        onOpenAppModal={() => setAppModalOpen(true)}
      />
      <StickySocialBar />
      <LegalModal
        isOpen={legalModalOpen}
        initialTab={legalTab}
        onClose={() => setLegalModalOpen(false)}
      />
      <AppDownloadModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
      />
      <Agentation />
    </>
  );
}
