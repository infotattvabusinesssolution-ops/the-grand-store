import React from "react";
import { Star, Quotes } from "@phosphor-icons/react";

const REVIEWS = [
  {
    id: 1,
    name: "Thabo Selwane",
    location: "Johannesburg",
    image: "/assets/testimonials/thabo-selwane.jpg",
    rating: 5,
    bottle: "Stellenbosch Reserve 2018",
    text: "The richness of South African terroir arrived in pristine cellar condition. Authenticity that genuinely recalls the private tastings of the Cape.",
  },
  {
    id: 2,
    name: "Michelle Steyn",
    location: "Stellenbosch",
    image: "/assets/testimonials/michelle-steyn.jpg",
    rating: 5,
    bottle: "Grand Vintage Prestige Cuvée",
    text: "The Grand Store combines global cellar standards with local taste. It is rare to find an online purveyor that feels this considered, discreet, and trustworthy.",
  },
  {
    id: 3,
    name: "Themba Nkosi",
    location: "Pretoria",
    image: "/assets/testimonials/themba-nkosi.jpg",
    rating: 5,
    bottle: "Rare 25-Year Islay Cask",
    text: "What I value most is the uncompromised provenance. The single malt curation feels deeply intentional, and the delivery is pure white-glove luxury.",
  },
  {
    id: 4,
    name: "Rajesh Pillay",
    location: "Johannesburg",
    image: "/assets/testimonials/rajesh-pillay.jpg",
    rating: 5,
    bottle: "Highland Single Cask Release",
    text: "My primary source for milestone entertaining. Exceptional allocations, transparent estate pricing, and dependable delivery every single time.",
  },
  {
    id: 5,
    name: "Liam van der Merwe",
    location: "Cape Town",
    image: "/assets/testimonials/liam-van-der-merwe.jpg",
    rating: 5,
    bottle: "Estate Cabernet Reserve",
    text: "An absolute delight to be part of The Grand Store. Our vineyard has seen incredible engagement since joining the platform. Truly the future of fine wine commerce!",
  },
  {
    id: 6,
    name: "Zanele Khumalo",
    location: "Durban",
    image: "/assets/testimonials/zanele-khumalo.jpg",
    rating: 5,
    bottle: "Small-Batch Coastal Gin",
    text: "As a small family-run vineyard, reaching new customers used to be a challenge. This portal has given us a beautiful space to showcase our wines and connect with buyers we wouldn't have reached otherwise.",
  },
  {
    id: 7,
    name: "Sipho Dlamini",
    location: "Franschhoek",
    image: "/assets/testimonials/sipho-dlamini.jpg",
    rating: 5,
    bottle: "Winelands Estate Partner",
    text: "We're very pleased with how this platform has represented our wine farm. The quality of the listings and the visibility we've gained have exceeded our expectations.",
  },
];

export default function Testimonials() {
  // Duplicate list for continuous infinite marquee
  const marqueeList = [...REVIEWS, ...REVIEWS];

  return (
    <section className="collector-registry-section" id="reviews" aria-labelledby="testimonials-title">
      {/* Ambient Radial Golden Glow */}
      <div className="collector-registry-glow" aria-hidden="true" />

      <div className="container collector-registry-container">
        {/* Header Block matching Screenshot 2 */}
        <div className="collector-registry-header">
          <div className="collector-registry-eyebrow">
            <span className="eyebrow-line" aria-hidden="true" />
            <span className="eyebrow-text">THE COLLECTOR REGISTRY</span>
            <span className="eyebrow-line" aria-hidden="true" />
          </div>

          <h2 id="testimonials-title" className="collector-registry-title">
            Private <span className="gold-text">Notes</span>
          </h2>

          <p className="collector-registry-subtitle">
            <em>From our private list.</em> Discerning collector reflections, moving quietly through
            the moments, vintages, and bottles they remember.
          </p>
        </div>
      </div>

      {/* Infinite Smooth Scrolling Marquee Track */}
      <div className="collector-marquee-wrapper" aria-label="Discerning collector reflections marquee">
        <div className="collector-marquee-track">
          {marqueeList.map((item, idx) => {
            const initials = item.name
              .split(" ")
              .map((n) => n[0])
              .join("");

            return (
              <article className="collector-card" key={`${item.id}-${idx}`}>
                {/* Ambient Subtle Card Orb */}
                <div className="collector-card-orb" aria-hidden="true" />

                {/* Watermark Quote Icon */}
                <div className="collector-card-quote-watermark" aria-hidden="true">
                  <Quotes size={36} weight="fill" />
                </div>

                <div className="collector-card-content">
                  {/* Top: 5 Stars + Bottle Tag */}
                  <div className="collector-card-top">
                    <div className="collector-stars-row">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} size={14} weight="fill" className="collector-star-icon" />
                      ))}
                    </div>
                    <span className="collector-bottle-tag">{item.bottle}</span>
                  </div>

                  {/* Quote Body */}
                  <blockquote className="collector-quote-text">
                    “{item.text}”
                  </blockquote>
                </div>

                {/* Bottom: Author Avatar with Gold Ring & Info */}
                <div className="collector-author-row">
                  <div className="collector-avatar-ring">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="collector-avatar-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = "flex";
                        }
                      }}
                    />
                    <div className="collector-avatar-fallback">
                      <span>{initials}</span>
                    </div>
                  </div>

                  <div className="collector-author-info">
                    <strong className="collector-author-name">{item.name}</strong>
                    <span className="collector-author-location">{item.location}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
