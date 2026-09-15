import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Gavel,
  ShieldCheck,
  Lightning,
  Crown,
  Clock,
  Fire,
  TrendUp,
  Package,
  Vault,
} from "@phosphor-icons/react";

const STORE = "https://grandstoreglobal.com";

const AUCTION_PROTOCOLS = [
  {
    num: "01",
    title: "Verified Estate Provenance",
    icon: ShieldCheck,
    desc: "Every bottle is sourced directly from private family estates and bonded archives, inspected bottle-by-bottle by certified sommeliers.",
  },
  {
    num: "02",
    title: "Bonded Escrow Settlement",
    icon: Vault,
    desc: "Your winning bid funds are held in secure escrow trust until you have received and verified the physical lot condition.",
  },
  {
    num: "03",
    title: "Fair Anti-Sniping Clock (+3M)",
    icon: Lightning,
    desc: "Bids placed in the final two minutes automatically extend the countdown clock by three minutes, ensuring fair, competitive collector acquisition.",
  },
  {
    num: "04",
    title: "Climate-Controlled Dispatch",
    icon: Package,
    desc: "Winning lots are packed in insulated shock-resistant crates and dispatched via temperature-calibrated white-glove couriers worldwide.",
  },
];

export default function AuctionsPage({ onNavigateHome }) {
  const [timeLeft, setTimeLeft] = useState({
    days: "01",
    hours: "14",
    minutes: "38",
    seconds: "45",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    const target = new Date(Date.now() + (1 * 86400 + 14 * 3600 + 38 * 60 + 45) * 1000);

    const updateTimer = () => {
      const diff = Math.max(0, target - new Date());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="auctions-page-view">
      {/* Top sticky navigation bar */}
      <div className="auctions-page-nav">
        <div className="container auctions-page-nav-inner">
          <button
            type="button"
            className="auctions-back-btn"
            onClick={onNavigateHome}
            aria-label="Back to main store"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>RETURN TO STORE</span>
          </button>



          <div className="auctions-nav-right">
            <div className="auctions-live-status-pill">
              <span className="live-pulse-dot" />
              <span>LIVE HAMMER ARENA</span>
              <span className="live-divider">·</span>
              <span className="lots-count-badge">PRIME LOT #084</span>
            </div>

            <a
              href={`${STORE}/auction`}
              target="_blank"
              rel="noopener noreferrer"
              className="auctions-nav-store-link"
            >
              <span>MAIN AUCTION PORTAL</span>
              <ArrowUpRight size={14} weight="bold" />
            </a>
          </div>
        </div>
      </div>

      {/* Hero Intro Banner */}
      <div className="auctions-hero-banner">
        <div className="container auctions-hero-content">
          <div className="auctions-arena-kicker">
            <Crown size={14} weight="fill" />
            <span>CONNOISSEUR AUCTION ARENA · VERIFIED PRIVATE CELLAR ALLOCATIONS</span>
            <span className="kicker-badge-jp">特選</span>
          </div>

          <h1 className="auctions-page-title">
            The Live Auction <em>Room.</em>
          </h1>

          <p className="auctions-page-subtitle">
            Bid competitively on rare private cellar library vintages, museum allocations, and legendary single-cask spirits with unbroken estate provenance and bonded escrow protection.
          </p>
        </div>
      </div>

      {/* Featured Headline Auction Lot: The Macallan 18-Year */}
      <div className="container auctions-featured-wrap">
        <div className="auction-layout auctions-page-layout">
          {/* Left Column: Dramatic Studio B&W Bottle Art with Anime HUD */}
          <div className="auction-art-card">
            <div className="auction-art-inner">
              <img
                src="/assets/auction-bw-bottle.webp"
                alt="The Macallan 18-Year Double Cask Single Malt Whisky on live auction plinth"
                className="auction-art-img"
              />
              
              {/* Anime HUD Top-Left: Live Status with Pulse & Katakana */}
              <div className="auction-live-pill anime-hud-pill">
                <span className="live-pulse-dot" />
                <Lightning size={14} weight="fill" className="live-pill-icon" />
                <span className="live-text">PRIME LIVE LOT</span>
                <span className="live-divider">/</span>
                <span className="lot-num">LOT #084</span>
                <span className="anime-subtag">競売中</span>
              </div>

              {/* Anime HUD Top-Right: Kanji Luxury Badge */}
              <div className="auction-hud-badge-tr">
                <Crown size={12} weight="fill" />
                <span>極上 · SPECIAL RESERVE</span>
              </div>

              {/* Authenticated Vault Tag Bottom-Right */}
              <div className="auction-vault-tag">
                <ShieldCheck size={14} weight="fill" />
                <span>Cellar Vault Certified</span>
              </div>

              {/* Anime HUD Coordinates Bottom-Left */}
              <div className="auction-hud-coord">
                <span>SYS.LOC // 57.48°N 3.21°W [SPEYSIDE]</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Anime Luxury Cockpit */}
          <div className="auction-cockpit">
            {/* Rich Kicker Bar with Crown & Japanese Seal */}
            <div className="auction-kicker">
              <div className="kicker-icon-badge">
                <Crown size={14} weight="fill" />
              </div>
              <span className="kicker-text">FEATURED PRIVATE ALLOCATION</span>
              <span className="kicker-badge-jp">特選</span>
            </div>

            {/* Huge Bolder Headline */}
            <h2 id="auction-heading" className="auction-title">
              The Macallan 18-Year
              <span className="auction-subhead">
                <span className="subhead-bar" />
                DOUBLE CASK HIGHLAND RESERVE
                <span className="subhead-badge">SINGLE MALT</span>
              </span>
            </h2>

            <p className="auction-desc">
              Legendary single malt distilled in Speyside, Spain-cured in handcrafted sherry-seasoned oak. Strictly allocated to verified collectors via live competitive hammer.
            </p>

            {/* Live Countdown Timer with Glowing HUD */}
            <div className="auction-timer-panel">
              <div className="timer-header">
                <div className="timer-label-box">
                  <div className="icon-pulse-wrap">
                    <Clock size={15} weight="bold" />
                  </div>
                  <span className="timer-label">HAMMER CLOSING COUNTDOWN</span>
                </div>
                <div className="timer-status-badge">
                  <Lightning size={13} weight="fill" />
                  <span>ANTI-SNIPING ACTIVE (+3M)</span>
                </div>
              </div>
              <div className="timer-digits-row">
                <div className="timer-unit">
                  <span className="timer-num">{timeLeft.days}</span>
                  <span className="timer-unit-label">DAYS</span>
                </div>
                <span className="timer-colon">:</span>
                <div className="timer-unit">
                  <span className="timer-num">{timeLeft.hours}</span>
                  <span className="timer-unit-label">HOURS</span>
                </div>
                <span className="timer-colon">:</span>
                <div className="timer-unit">
                  <span className="timer-num">{timeLeft.minutes}</span>
                  <span className="timer-unit-label">MINS</span>
                </div>
                <span className="timer-colon">:</span>
                <div className="timer-unit highlight-sec">
                  <span className="timer-num">{timeLeft.seconds}</span>
                  <span className="timer-unit-label">SECS</span>
                </div>
              </div>
            </div>

            {/* High-Impact Bid Status Board with Fire & TrendUp */}
            <div className="auction-bid-board">
              <div className="bid-board-col">
                <div className="bid-header-tag">
                  <Fire size={13} weight="fill" className="fire-icon" />
                  <span className="bid-label">CURRENT HIGHEST BID</span>
                </div>
                <div className="bid-val-row">
                  <span className="bid-currency">ZAR</span>
                  <span className="bid-amount">28,500</span>
                </div>
                <div className="bid-meta-row">
                  <span className="bid-caption reserve-met">✓ RESERVE MET</span>
                  <span className="bid-meta-dot">•</span>
                  <span className="bid-caption count">24 ACTIVE BIDS</span>
                </div>
              </div>

              <div className="bid-divider" />

              <div className="bid-board-col">
                <div className="bid-header-tag">
                  <TrendUp size={13} weight="bold" className="trend-icon" />
                  <span className="bid-label">NEXT MINIMUM BID</span>
                </div>
                <div className="bid-val-row next-bid">
                  <span className="bid-currency">ZAR</span>
                  <span className="bid-amount">29,500</span>
                </div>
                <div className="bid-meta-row">
                  <span className="bid-caption increment-note">+ZAR 1,000 INCREMENT</span>
                </div>
              </div>
            </div>

            {/* Actions & Live Activity Ticker */}
            <div className="auction-actions-wrap">
              <div className="auction-actions">
                <a
                  href={`${STORE}/auction`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auction-btn-primary"
                >
                  <Gavel size={20} weight="fill" />
                  <span>PLACE OFFICIAL BID</span>
                  <ArrowUpRight size={18} weight="bold" />
                </a>

                <a
                  href={`${STORE}/auction`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auction-btn-secondary"
                >
                  <span>ENTER LIVE ROOM</span>
                </a>
              </div>

              {/* Live Anime-Style Activity Feed */}
              <div className="auction-live-ticker">
                <div className="ticker-live-beacon" />
                <span className="ticker-lead">⚡ RECENT ACTIVITY:</span>
                <span className="ticker-text">Collector #8409 submitted ZAR 28,500 · Verified Leading Bid</span>
              </div>
            </div>

            {/* Compact Bottom Guarantee Bar */}
            <div className="auction-guarantee-bar">
              <div className="guarantee-item">
                <ShieldCheck size={15} weight="fill" />
                <span>100% Bonded Escrow</span>
              </div>
              <span className="guarantee-pipe">|</span>
              <div className="guarantee-item">
                <Lightning size={14} weight="fill" />
                <span>Instant Hammer Dispatch</span>
              </div>
              <span className="guarantee-pipe">|</span>
              <div className="guarantee-item">
                <Crown size={14} weight="fill" />
                <span>Original Cask Certificate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collector Protocols & Trust Pillars */}
      <div className="auctions-protocols-section">
        <div className="container">
          <div className="protocols-header">
            <span className="protocols-kicker">AUTHENTICATION & SECURITY</span>
            <h3 className="protocols-heading">
              The Grand Store <em>Auction Standard.</em>
            </h3>
            <p className="protocols-desc">
              Every auction transaction is protected by legal escrow, certified by master sommeliers, and governed by strict anti-counterfeiting protocols.
            </p>
          </div>

          <div className="protocols-grid">
            {AUCTION_PROTOCOLS.map((proto, i) => {
              const Icon = proto.icon;
              return (
                <div className="protocol-card" key={i}>
                  <div className="proto-top-row">
                    <span className="proto-num">{proto.num}</span>
                    <div className="proto-icon-box">
                      <Icon size={20} weight="fill" />
                    </div>
                  </div>
                  <h4 className="proto-title">{proto.title}</h4>
                  <p className="proto-desc">{proto.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Consignment CTA Banner */}
      <div className="auctions-consign-banner">
        <div className="container">
          <div className="consign-box">
            <div className="consign-icon-circle">
              <Vault size={32} weight="fill" />
            </div>
            <h3 className="consign-title">
              Have a Private Cellar or Rare Cask to <em>Consign?</em>
            </h3>
            <p className="consign-desc">
              We connect private collectors, estate cellars, and heritage distilleries directly with vetted international patrons. Receive a professional valuation from our certified sommeliers.
            </p>
            <div className="consign-actions">
              <a
                href={`${STORE}/vendor-portal`}
                target="_blank"
                rel="noopener noreferrer"
                className="consign-primary-btn"
              >
                <span>SUBMIT CELLAR FOR VALUATION</span>
                <ArrowUpRight size={16} weight="bold" />
              </a>
              <button
                type="button"
                className="consign-secondary-btn"
                onClick={onNavigateHome}
              >
                <span>RETURN TO HOME STORE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
