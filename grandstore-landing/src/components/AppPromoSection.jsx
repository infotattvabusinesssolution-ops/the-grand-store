import React from "react";
import { DeviceMobile, QrCode } from "@phosphor-icons/react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.grandstore";
const APP_STORE_URL = "https://apps.apple.com/in/app/grand-store/id6449220111";
const SMART_REDIRECT_URL = "https://thegrandstore.co.za/app/download";

export default function AppPromoSection() {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    SMART_REDIRECT_URL
  )}&margin=0`;

  return (
    <section className="app-promo-section" id="download-app" aria-labelledby="app-promo-title">
      {/* Atmospheric Ambient Glow */}
      <div className="app-promo-ambient-glow" aria-hidden="true" />

      <div className="container app-promo-container">
        {/* Left: Phone Mockup in Cellar */}
        <div className="app-promo-left">
          <div className="app-promo-phone-card">
            <div className="app-promo-phone-halo" aria-hidden="true" />
            <img
              src="/assets/images/app-mockup.jpg"
              alt="The Grand Store Mobile App on Smartphone"
              className="app-promo-phone-img"
              loading="lazy"
            />
          </div>
        </div>

        {/* Right: Editorial Narrative & Download Badges Box */}
        <div className="app-promo-right">
          {/* Eyebrow Badge */}
          <div className="app-promo-badge">
            <DeviceMobile size={15} weight="fill" className="app-promo-badge-icon" />
            <span>MOBILE EXPERIENCE</span>
          </div>

          {/* Heading */}
          <h2 id="app-promo-title" className="app-promo-title">
            Luxury in your <em>pocket.</em>
          </h2>

          {/* Body Paragraph */}
          <p className="app-promo-desc">
            Explore our curated selection of fine wines and premium spirits anywhere, anytime. Download The Grand Store app for exclusive offers and a seamless shopping experience.
          </p>

          {/* Black & Gold Download Box */}
          <div className="app-promo-card-box">
            {/* Left: Store Badges */}
            <div className="app-promo-badges-col">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="app-store-badge-link"
                aria-label="Get it on Google Play"
              >
                <img
                  src="/assets/footer/google-play.svg"
                  alt="Get it on Google Play"
                  className="app-store-badge-img"
                  width="162"
                  height="48"
                />
              </a>

              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="app-store-badge-link"
                aria-label="Download on the App Store"
              >
                <img
                  src="/assets/footer/app-store.svg"
                  alt="Download on the App Store"
                  className="app-store-badge-img"
                  width="144"
                  height="48"
                />
              </a>
            </div>

            {/* Vertical Divider */}
            <div className="app-promo-box-divider" aria-hidden="true" />

            {/* Right: Golden QR Code */}
            <div className="app-promo-qr-col">
              <a
                href={SMART_REDIRECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="app-promo-qr-link"
                aria-label="Scan to download The Grand Store app"
              >
                <div className="app-promo-qr-outer-frame">
                  <div className="app-promo-qr-inner-frame">
                    <img
                      src={qrUrl}
                      alt="Scan QR code to install"
                      className="app-promo-qr-image"
                      width="120"
                      height="120"
                    />
                  </div>
                </div>
              </a>

              <div className="app-promo-scan-pill">
                <QrCode size={13} weight="bold" />
                <span>SCAN TO INSTALL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
