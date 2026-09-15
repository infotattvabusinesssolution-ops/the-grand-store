import { useEffect, useRef, useState } from "react";
import { QrCode } from "@phosphor-icons/react";
import AppDownloadModal from "./AppDownloadModal";

const STORE = "https://grandstoreglobal.com";

// 10 Curated Grand Store Black & Gold luxury reserve cards
const GRAND_SHOTS = [
  {
    tag: "VINTAGE CHAMPAGNE",
    name: "Dom Pérignon Luminous",
    sub: "Brut Vintage · 2013",
    note: "Cellar allocation · Reims",
    url: "/assets/products/dom-perignon-luminous-750ml.webp",
    alt: "Dom Pérignon Luminous Vintage Champagne",
  },
  {
    tag: "HIGHLAND SINGLE MALT",
    name: "The Macallan 18yr",
    sub: "Sherry Oak Cask",
    note: "Speyside Distillation",
    url: "/assets/products/macallan-12-year-old-double-cask-750ml.webp",
    alt: "The Macallan 18-Year Highland Single Malt",
  },
  {
    tag: "PRIVATE TASTING PACK",
    name: "Curated Sommelier Flight",
    sub: "3 Reserve Bottles & Notes",
    note: "Hand-Crafted Gift Box",
    url: "/assets/wine-event-pack.png",
    alt: "The Grand Store Sommelier Tasting Pack",
  },
  {
    tag: "EXTRA OLD COGNAC",
    name: "Hennessy XO",
    sub: "Luxury Decanter",
    note: "Limousin Oak Cask",
    url: "/assets/products/hennessy-xo-cognac-750ml.webp",
    alt: "Hennessy XO Extra Old Cognac",
  },
  {
    tag: "ESTATE CHARDONNAY",
    name: "Queen Mother Reserve",
    sub: "Mathokoana Mopeli",
    note: "Franschhoek Terroir",
    url: "/assets/products/queen-mother-mathokoana-mopeli-chardonnay-750ml.webp",
    alt: "Queen Mother Reserve Chardonnay",
  },
  {
    tag: "HISTORIC TERROIR",
    name: "Cape Winelands",
    sub: "Heritage Cellars",
    note: "Centuries of Viticulture",
    url: "/assets/cape-wineland.webp",
    alt: "Historic Cape Winelands estate",
  },
  {
    tag: "JAPANESE WHISKY",
    name: "Hibiki Harmony",
    sub: "Master's Select",
    note: "Yamazaki & Hakushu Blend",
    url: "/assets/products/hibiki-japanese-harmony-whisky-750ml-1.webp",
    alt: "Hibiki Japanese Harmony Whisky",
  },
  {
    tag: "KAROO SINGLE MALT",
    name: "Metanoia Klein Karoo",
    sub: "Hand-Crafted Batch",
    note: "Acacia Wood Cask Finish",
    url: "/assets/products/metanoia-klein-karoo-single-malt-whisky-750ml.webp",
    alt: "Metanoia Klein Karoo Single Malt",
  },
  {
    tag: "LIVE AUCTION LOT #084",
    name: "Grand Private Vault",
    sub: "Historic Reserve Bidding",
    note: "100% Authenticated Provenance",
    url: "/assets/auction-bw-bottle.webp",
    alt: "Live Auction Lot reserve bottle",
  },
  {
    tag: "CAPE BOTANICALS",
    name: "Artisanal Fynbos Gin",
    sub: "Small-Batch Copper Distilled",
    note: "Wild Coastal Flora",
    url: "/assets/bottles/gin.png",
    alt: "Artisanal botanical gin",
  },
];

function renderCardContent(d) {
  return `
    <div class="card-bg-gradient"></div>
    <div class="card-aura"></div>
    <div class="card-top-tag">
      <span class="card-tag-dot"></span>
      <span>${d.tag}</span>
    </div>
    <div class="card-bottle-wrap">
      <img alt="${d.alt || d.name}" src="${d.url}" loading="lazy" />
    </div>
    <div class="card-info-wrap">
      <div class="card-name">${d.name}</div>
      <div class="card-sub">${d.sub}</div>
      <div class="card-note">${d.note}</div>
    </div>
    <div class="edge"></div>
  `;
}

const HERO_SLIDES = [
  {
    badge: "PRIVATE RESERVE ARCHIVE • EST. 2024",
    titleMain: "A World of ",
    titleHighlight: "Good Taste",
    subtitle:
      "South Africa’s premier reserve cellar & fine spirits archive. Curated rare allocations, vintage champagnes & single casks.",
  },
  {
    badge: "CURATED CELLAR • ESTATE PROVENANCE",
    titleMain: "Rare Vintages, ",
    titleHighlight: "Timeless Heritage",
    subtitle:
      "Direct allocations from Franschhoek & Stellenbosch grand reserves, aged in climate-controlled vaults to absolute perfection.",
  },
  {
    badge: "SINGLE CASK VAULT • REIMS TO HIGHLANDS",
    titleMain: "Exceptional Spirits, ",
    titleHighlight: "Unrivaled Craft",
    subtitle:
      "Hand-selected Highland single malts, prestige Japanese whiskies, and limited-edition extra old Cognac decanters.",
  },
  {
    badge: "LIVE AUCTIONS & SOMMELIER DESK",
    titleMain: "Bespoke Tastings, ",
    titleHighlight: "Allocated Parcels",
    subtitle:
      "Access allocated private cellar parcels, member wine auctions, and personalized 48-hour cold-chain courier delivery across South Africa.",
  },
];

export default function PerspectiveHero({ reduceMotion, onNavigate }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ringRef = useRef(null);
  const starARef = useRef(null);
  const starBRef = useRef(null);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate hero texts periodically with smooth transition
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        setIsTransitioning(false);
      }, 420);
      return () => clearTimeout(timer);
    }, 5200);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    const stage = containerRef.current;
    const canvas = canvasRef.current;
    const ring = ringRef.current;
    const stA = starARef.current;
    const stB = starBRef.current;
    if (!stage || !canvas || !ring) return;

    // --- 1. Golden Starfield generation ---
    if (stA && stB) {
      const genStars = (count, blur, aMin, aMax, goldHue = true) => {
        const arr = [];
        for (let i = 0; i < count; i++) {
          const x = (Math.random() * 100).toFixed(2);
          const y = (Math.random() * 100).toFixed(2);
          const a = (aMin + Math.random() * (aMax - aMin)).toFixed(2);
          const col = goldHue && Math.random() > 0.4 ? `rgba(223,186,115,${a})` : `rgba(255,255,255,${a})`;
          arr.push(`${x}vw ${y}vh ${blur}px 0 ${col}`);
        }
        return arr.join(",");
      };
      stA.style.boxShadow = genStars(120, 0, 0.04, 0.25, true);
      stB.style.boxShadow = genStars(20, 1.2, 0.3, 0.65, true);
    }

    // --- 2. 37 Cards initialization on 3D Cylinder Ring ---
    const TOTAL_CARDS = 37;
    const cards = [];
    ring.innerHTML = "";
    for (let i = 0; i < TOTAL_CARDS; i++) {
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      const shot = GRAND_SHOTS[i % GRAND_SHOTS.length];
      cardEl.innerHTML = renderCardContent(shot);
      const img = cardEl.querySelector("img");
      if (img) {
        img.addEventListener("error", () => cardEl.classList.add("broken"));
      }
      ring.appendChild(cardEl);
      cards.push(cardEl);
    }

    // --- 3. 3D Ring Animation Loop ---
    const R = 890;
    const step = 360 / TOTAL_CARDS; // 9.7297 deg
    const cullAngle = 44;
    let phase = -2;
    let lastTime = performance.now();
    let animId = null;
    const prefersReduced =
      reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const placeCards = () => {
      const rad = Math.PI / 180;
      for (let i = 0; i < TOTAL_CARDS; i++) {
        const el = cards[i];
        if (!el) continue;
        const a = ((((i * step + phase) % 360) + 540) % 360) - 180;
        if (Math.abs(a) > cullAngle) {
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        const r = a * rad;
        const c = Math.cos(r);
        const s = Math.sin(r);
        el.style.transform = `translate3d(${R * s}px, 0, ${R * (1 - c)}px) rotateY(${-a}deg)`;
        el.style.filter = `brightness(${0.85 + 0.45 * (1 / c - 1)})`;
      }
    };

    const tick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      if (!prefersReduced) {
        phase -= 1.8 * dt;
      }
      placeCards();
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    const onVisibilityChange = () => {
      lastTime = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // --- 4. Responsive Scale & Layout Law ---
    const CW = 1172;
    const CH = 710;

    const layout = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw <= 700;

      if (isMobile) {
        stage.style.removeProperty("--k");
        canvas.style.removeProperty("--k");
        canvas.style.removeProperty("--fill");
        placeCards();
        return;
      }

      // Responsive scale: fits smoothly within both width and height constraints
      const k = Math.min(vw / CW, (vh - 10) / CH, 1.05);
      stage.style.setProperty("--k", k.toFixed(5));
      canvas.style.setProperty("--k", k.toFixed(5));

      placeCards();
    };

    window.addEventListener("resize", layout);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", layout);
    }
    layout();

    if (document.fonts) {
      document.fonts.ready.then(layout);
    }
    const t1 = setTimeout(layout, 300);
    const t2 = setTimeout(layout, 1200);

    // --- 5. Master Entrance Timeline ---
    if (!prefersReduced && typeof stage.animate === "function") {
      document.documentElement.classList.add("intro");
      const isPhone = window.innerWidth <= 700;
      const D = isPhone ? 0.6 : 1;
      const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
      const SOFT = "cubic-bezier(0.22, 0.61, 0.36, 1)";
      const Y = (px) => `0px ${(px * D).toFixed(1)}px`;

      const anims = [];
      const play = (selector, from, dur, delay, ease) => {
        const el = typeof selector === "string" ? stage.querySelector(selector) : selector;
        if (!el) return;
        const to = { opacity: 1 };
        if (from.translate !== undefined) to.translate = "0px 0px";
        if (from.scale !== undefined) to.scale = "1";
        try {
          const a = el.animate([from, to], {
            duration: dur,
            delay: delay,
            easing: ease,
            fill: "both",
          });
          anims.push(a);
        } catch (e) {}
      };

      play(".hero-title", { opacity: 0, translate: Y(16) }, 750, 200, EXPO);
      play(".hero-sub", { opacity: 0, translate: Y(12) }, 600, 380, EXPO);
      play(".hero-actions", { opacity: 0, translate: Y(12), scale: "0.98" }, 600, 480, EXPO);
      play(".ring", { opacity: 0, translate: Y(20), scale: "0.99" }, 850, 580, EXPO);
      play(".showroom-screen", { opacity: 0, translate: Y(20) }, 850, 680, EXPO);

      const finishIntro = () => {
        document.documentElement.classList.remove("intro");
        anims.forEach((a) => {
          try {
            a.cancel();
          } catch (e) {}
        });
      };

      const lastAnim = anims[anims.length - 1];
      if (lastAnim && lastAnim.finished) {
        lastAnim.finished.then(finishIntro).catch(finishIntro);
      }
      setTimeout(finishIntro, 3500);
    }

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", layout);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", layout);
      }
      document.documentElement.classList.remove("intro");
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduceMotion]);

  return (
    <section className="hero-perspective-stage" ref={containerRef} id="home" aria-label="Grand Store Hero Showcase">
      {/* Warm Ambient Cellar Background with Faint Logo & Celestial Effects */}
      <div className="bg" aria-hidden="true" />
      <div className="ambient-cellar-beam" aria-hidden="true" />
      <div className="bg-celestial-rings" aria-hidden="true" />
      <div className="bg-celestial-rings-outer" aria-hidden="true" />
      <div className="hero-bg-watermark" aria-hidden="true">
        <img src="/assets/brand-logo.webp" alt="" />
      </div>
      <div className="stars" id="stA" ref={starARef} aria-hidden="true" />
      {/* Main Proportional Canvas (1172 x 710) */}
      <div className="canvas" ref={canvasRef}>
        {/* Hero Center Stack */}
        <div
          className="hero-center-stack"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Rotating Text Content */}
          <div className={`hero-text-rotator ${isTransitioning ? "transitioning-out" : "transitioning-in"}`}>
            {/* Editorial Luxury Typography */}
            <h1 className="hero-title">
              {HERO_SLIDES[currentSlide].titleMain}
              <em>{HERO_SLIDES[currentSlide].titleHighlight}</em>
            </h1>

            <p className="hero-sub">
              {HERO_SLIDES[currentSlide].subtitle}
            </p>
          </div>

          {/* Hero Action Buttons */}
          <div className="hero-actions">
            <a
              href={`${STORE}/shop`}
              className="hero-primary-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Explore the reserve collection"
            >
              <span>Explore Collection</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            <a
              href="#our-story"
              className="hero-secondary-btn"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate("#our-story");
                }
              }}
            >
              <span>Our Cellar Story</span>
            </a>

            <button
              type="button"
              className="hero-app-btn"
              onClick={() => setAppModalOpen(true)}
              aria-label="Download The Grand Store Mobile App"
            >
              <QrCode size={14} weight="bold" />
              <span>Get The App</span>
            </button>
          </div>
        </div>

        {/* 3D Perspective Ring Carousel Showcase */}
        <div className="showcase">
          <div className="ring" ref={ringRef} aria-hidden="true" />
        </div>

        {/* Boutique Showroom Screen (Fully Visible Luxury Cellar Console) */}
        <div className="showroom-screen" aria-label="The Grand Store Online Boutique Showcase">
          {/* Chrome Header Bar */}
          <div className="screen-bar">
            <div className="screen-dots" aria-hidden="true">
              <i style={{ background: "#e05252" }} />
              <i style={{ background: "#dfba73" }} />
              <i style={{ background: "#22c55e" }} />
            </div>

            <div className="screen-omni">
              <svg viewBox="0 0 24 24" fill="none" stroke="#dfba73" strokeWidth="2.2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.8-3.8" />
              </svg>
              <span>The Grand Store — Allocated Reserves & Private Cellar Archive</span>
            </div>

            <div className="screen-tools" aria-hidden="true">
              <span className="screen-tools-badge">COLD-CHAIN 48H</span>
            </div>
          </div>

          {/* Screen Surface */}
          <div className="screen-surface">
            {/* Ambient Guarantee Ribbon */}
            <div className="screen-ann">
              <span className="ann-arrow" aria-hidden="true">&#8249;</span>
              <span>Complimentary temperature-controlled transit across SA on allocations above R1,500</span>
              <span className="ann-arrow" aria-hidden="true">&#8250;</span>
            </div>

            {/* Screen Inner Body */}
            <div className="screen-body">
              {/* Screen Section Header */}
              <div className="screen-sec">
                <div className="screen-sec-left">
                  <span className="screen-live-dot" />
                  <b>ALLOCATED RESERVES</b>
                </div>
                <a
                  href="#collection"
                  onClick={(e) => {
                    if (onNavigate) {
                      e.preventDefault();
                      onNavigate("#collection");
                    }
                  }}
                >
                  FULL CATALOGUE &rarr;
                </a>
              </div>

              {/* 4 Feature Bottles Grid */}
              <div className="screen-grid">
                <div className="screen-card">
                  <div className="sc-ph">
                    <img
                      src="/assets/products/dom-perignon-luminous-750ml.webp"
                      alt="Dom Pérignon Luminous"
                      loading="lazy"
                    />
                    <span className="sc-tag gold">VINTAGE</span>
                  </div>
                  <div className="sc-info">
                    <b>Dom Pérignon</b>
                    <i>Brut 2013</i>
                    <s>R 4,290</s>
                  </div>
                </div>

                <div className="screen-card">
                  <div className="sc-ph">
                    <img
                      src="/assets/products/macallan-12-year-old-double-cask-750ml.webp"
                      alt="The Macallan 18yr"
                      loading="lazy"
                    />
                    <span className="sc-tag">CASK</span>
                  </div>
                  <div className="sc-info">
                    <b>Macallan 18yr</b>
                    <i>Sherry Oak</i>
                    <s>R 6,850</s>
                  </div>
                </div>

                <div className="screen-card">
                  <div className="sc-ph">
                    <img
                      src="/assets/wine-event-pack.png"
                      alt="Sommelier Flight Pack"
                      loading="lazy"
                    />
                    <span className="sc-tag">SET</span>
                  </div>
                  <div className="sc-info">
                    <b>Sommelier Pack</b>
                    <i>3 Bottles</i>
                    <s>R 3,450</s>
                  </div>
                </div>

                <div className="screen-card">
                  <div className="sc-ph">
                    <img
                      src="/assets/products/hibiki-japanese-harmony-whisky-750ml-1.webp"
                      alt="Hibiki Harmony"
                      loading="lazy"
                    />
                    <span className="sc-tag gold">RARE</span>
                  </div>
                  <div className="sc-info">
                    <b>Hibiki Harmony</b>
                    <i>Japanese Blend</i>
                    <s>R 2,890</s>
                  </div>
                </div>
              </div>

              {/* Screen Body Real-Time Cellar Assurance Strip */}
              <div className="screen-body-footer">
                <span>TAMPER-EVIDENT SEALS</span>
                <span className="sbf-dot">•</span>
                <span>100% IN-BOND CELLAR TRANSIT</span>
                <span className="sbf-dot">•</span>
                <span>REAL-TIME ALLOCATION INVENTORY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sommelier WhatsApp Action */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        className="wa-gold"
        aria-label="Consult our private sommelier on WhatsApp"
      >
        <svg viewBox="0 0 32 32" fill="#0c0d0b" aria-hidden="true">
          <path d="M16 2.5C8.5 2.5 2.5 8.5 2.5 16c0 2.6.7 5.1 2.1 7.3L3 30l6.9-1.8c2.1 1.2 4.4 1.8 6.1 1.8 7.5 0 13.5-6 13.5-13.5S23.5 2.5 16 2.5zm0 24.7c-1.8 0-3.6-.5-5.2-1.5l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.7 0-5.8 4.7-10.5 10.5-10.5s10.5 4.7 10.5 10.5-4.7 10.7-10.4 10.7zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9s1.3 3.4 1.4 3.6c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .8.8.3 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.5z" />
        </svg>
      </a>

      {/* App Download Modal with QR Code and App Store Links */}
      <AppDownloadModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
      />
    </section>
  );
}
