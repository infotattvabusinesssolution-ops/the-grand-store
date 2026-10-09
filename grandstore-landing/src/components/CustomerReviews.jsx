import React, { useState } from "react";
import { Star, SealCheck, Quotes, Sparkle, ArrowUpRight, CaretLeft, CaretRight } from "@phosphor-icons/react";

const STORE = "https://thegrandstore.co.za";

const REVIEWS_DATA = [
  {
    id: 1,
    author: "Eleanor R.",
    role: "Verified Buyer · Fine Wine Collector",
    location: "Franschhoek & Sandton",
    rating: 5,
    tag: "ESTATE BOTTLES",
    quote:
      "The packaging was immaculate and delivery was swift. Receiving temperature-calibrated estate bottles with unbroken provenance documentation gives complete peace of mind.",
    highlight: "Immaculate packaging & unbroken provenance",
  },
  {
    id: 2,
    author: "Michael T.",
    role: "Verified Guest · Private Tasting Salon",
    location: "Johannesburg",
    rating: 5,
    tag: "SALON MASTERCLASS",
    quote:
      "Attended the Rare Spirits Masterclass in the subterranean Rosebank salon. Exceptional knowledge from the master sommelier, rare single cask flights, and an intimate atmosphere unmatched in South Africa.",
    highlight: "Rare single cask flights & master sommelier",
  },
  {
    id: 3,
    author: "Sophia L.",
    role: "Verified Collector · Vintage Allocations",
    location: "Cape Town",
    rating: 5,
    tag: "RARE ALLOCATION",
    quote:
      "Found an allocated museum vintage here that was impossible to source elsewhere. Dedicated concierge communication and climate-controlled transit made this a world-class buying experience.",
    highlight: "Museum vintage impossible to source elsewhere",
  },
  {
    id: 4,
    author: "David W.",
    role: "Verified Bidder · Auction Room",
    location: "Franschhoek",
    rating: 5,
    tag: "LIVE AUCTION",
    quote:
      "The auction platform is completely seamless. I won a coveted rare single cask lot, and insured transit directly to my private cellar was executed flawlessly without any friction.",
    highlight: "Seamless auction bidding & insured transit",
  },
  {
    id: 5,
    author: "Douglas Lyphe",
    role: "Estate Winemaker & Partner",
    location: "Cape Winelands",
    rating: 5,
    tag: "PROVENANCE PARTNER",
    quote:
      "Listing on The Grand Store has connected our wine farm with genuine connoisseurs who truly value the art of viticulture. The curation and presentation standards are exceptional.",
    highlight: "Exceptional viticulture curation & standards",
  },
  {
    id: 6,
    author: "Richard M.",
    role: "Verified Buyer · Executive Gifting",
    location: "Pretoria",
    rating: 5,
    tag: "PREMIUM SELECTION",
    quote:
      "Exceptional variety, authentic bottles, and prompt dispatch. The Grand Store has become our first destination for celebratory vintages and corporate executive gifts.",
    highlight: "First destination for celebratory vintages",
  },
];

export default function CustomerReviews() {
  const [filter, setFilter] = useState("ALL");

  const categories = ["ALL", "ESTATE BOTTLES", "SALON MASTERCLASS", "RARE ALLOCATION", "LIVE AUCTION"];

  const filteredReviews =
    filter === "ALL"
      ? REVIEWS_DATA
      : REVIEWS_DATA.filter((r) => r.tag === filter);

  return (
    <section className="reviews-section" id="reviews" aria-labelledby="reviews-heading">
      {/* Background Ambience Layer */}
      <div className="reviews-ambient-bg" aria-hidden="true">
        <div className="reviews-gold-glow" />
        <div className="reviews-dark-vignette" />
      </div>

      <div className="container reviews-container">
        {/* Header Block */}
        <div className="reviews-header">
          <div className="reviews-badge-row">
            <div className="reviews-star-badge">
              <div className="reviews-stars-group">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} weight="fill" className="gold-star-icon" />
                ))}
              </div>
              <span className="reviews-badge-text">
                4.9 / 5.0 RATED BY 240+ CONNOISSEURS & COLLECTORS
              </span>
            </div>
          </div>

          <h2 id="reviews-heading" className="reviews-title">
            VOICES OF THE <em>CELLAR</em>
          </h2>

          <p className="reviews-subtitle">
            Trusted by South Africa’s discerning collectors, winemakers, and spirits enthusiasts.
            Every allocation authenticated; every delivery protected.
          </p>

          {/* Category Filter Pills */}
          <div className="reviews-filter-pills" role="tablist" aria-label="Review categories">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`reviews-filter-btn ${filter === cat ? "active" : ""}`}
                onClick={() => setFilter(cat)}
                role="tab"
                aria-selected={filter === cat}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="reviews-grid">
          {filteredReviews.map((item) => (
            <article className="review-card" key={item.id}>
              <div className="review-card-top">
                <div className="review-stars-row">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={14} weight="fill" className="review-star" />
                  ))}
                </div>
                <span className="review-tag-badge">{item.tag}</span>
              </div>

              <blockquote className="review-quote">
                <Quotes size={24} weight="fill" className="review-quote-icon" aria-hidden="true" />
                <p>“{item.quote}”</p>
              </blockquote>

              <div className="review-author-footer">
                <div className="author-avatar-badge">
                  <span>{item.author.charAt(0)}</span>
                </div>
                <div className="author-meta">
                  <div className="author-name-row">
                    <strong className="author-name">{item.author}</strong>
                    <span className="verified-seal-tag" title="Verified Grand Store Purchase">
                      <SealCheck size={13} weight="fill" className="verified-seal-icon" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <span className="author-role">{item.role}</span>
                  <span className="author-location">{item.location}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Trust Metrics Strip */}
        <div className="reviews-trust-strip">
          <div className="trust-metric-item">
            <span className="metric-number">4.9 / 5</span>
            <span className="metric-label">Average Customer Rating</span>
          </div>
          <div className="trust-metric-divider" aria-hidden="true" />
          <div className="trust-metric-item">
            <span className="metric-number">100%</span>
            <span className="metric-label">Authenticated Provenance</span>
          </div>
          <div className="trust-metric-divider" aria-hidden="true" />
          <div className="trust-metric-item">
            <span className="metric-number">24hr</span>
            <span className="metric-label">Cold-Chain Cellar Dispatch</span>
          </div>
          <div className="trust-metric-divider" aria-hidden="true" />
          <div className="trust-metric-item">
            <span className="metric-number">1,200+</span>
            <span className="metric-label">Rare Allocations Delivered</span>
          </div>
        </div>

        {/* Community Link Action */}
        <div className="reviews-bottom-action">
          <a
            href={`${STORE}/community`}
            target="_blank"
            rel="noopener noreferrer"
            className="reviews-community-btn"
          >
            <span>EXPLORE COMMUNITY WALL OF LOVE</span>
            <ArrowUpRight size={14} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  );
}
