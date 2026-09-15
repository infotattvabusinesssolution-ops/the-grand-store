import React, { useEffect, useRef } from "react";
import { X, QrCode, Sparkle, ShieldCheck, Bell, CaretRight } from "@phosphor-icons/react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.grandstore";
const APP_STORE_URL = "https://apps.apple.com/in/app/grand-store/id6449220111";
const SMART_REDIRECT_URL = "https://thegrandstore.co.za/app/download";

export default function AppDownloadModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  // Close on Escape key and lock scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
    SMART_REDIRECT_URL
  )}&margin=1&format=svg`;

  return (
    <div
      className="app-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-modal-title"
    >
      <div className="app-modal-card" ref={modalRef}>
        {/* Ambient Top Glow */}
        <div className="app-modal-glow" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          className="app-modal-close"
          onClick={onClose}
          aria-label="Close download modal"
        >
          <X size={18} weight="bold" />
        </button>

        {/* Header Content */}
        <div className="app-modal-header">
          <div className="app-modal-badge">
            <Sparkle size={12} weight="fill" className="app-sparkle-icon" />
            <span>THE GRAND STORE MOBILE</span>
          </div>

          <h2 id="app-modal-title" className="app-modal-title">
            Luxury in Your <em>Pocket.</em>
          </h2>

          <p className="app-modal-desc">
            Experience our curated cellar, private allocations, live reserve auctions,
            and instant sommelier flights wherever you are.
          </p>
        </div>

        {/* Main Grid: QR Code + Direct Store Downloads */}
        <div className="app-modal-body">
          {/* Left / Top: Gilded Scannable QR Code */}
          <div className="app-qr-pane">
            <div className="app-qr-frame">
              <div className="app-qr-box">
                <img
                  src={qrImageUrl}
                  alt="Scan to download The Grand Store App"
                  className="app-qr-img"
                  width="180"
                  height="180"
                  loading="eager"
                />
              </div>
              <div className="app-qr-scanline" aria-hidden="true" />
              <div className="qr-corner-top-left" />
              <div className="qr-corner-top-right" />
              <div className="qr-corner-bottom-left" />
              <div className="qr-corner-bottom-right" />
            </div>

            <div className="app-qr-caption">
              <QrCode size={16} weight="fill" className="qr-caption-icon" />
              <span>Point smartphone camera to scan</span>
            </div>
          </div>

          {/* Right / Bottom: Store Badges & Feature Perks */}
          <div className="app-links-pane">
            <div className="app-store-buttons">
              {/* Google Play Store Badge */}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="store-badge-btn google-play-btn"
                aria-label="Download on Google Play"
              >
                <div className="store-badge-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                    <path d="M3.609 1.814L13.793 12 3.61 22.186a1.95 1.95 0 0 1-.36-.957V2.771c.06-.347.185-.68.36-.957z" fill="#4285F4" />
                    <path d="M17.155 8.638l-3.362 3.362 3.362 3.362 3.791-2.189a1.69 1.69 0 0 0 0-2.346l-3.791-2.189z" fill="#FBBC05" />
                    <path d="M3.609 1.814l10.184 10.186 3.362-3.362L4.996.732a1.86 1.86 0 0 0-1.387 1.082z" fill="#EA4335" />
                    <path d="M13.793 12L3.609 22.186a1.86 1.86 0 0 0 1.387 1.082l12.159-7.006-3.362-3.362z" fill="#34A853" />
                  </svg>
                </div>
                <div className="store-badge-text">
                  <span className="store-badge-sub">GET IT ON</span>
                  <span className="store-badge-title">Google Play</span>
                </div>
                <CaretRight size={14} className="store-badge-arrow" />
              </a>

              {/* Apple App Store Badge */}
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="store-badge-btn apple-store-btn"
                aria-label="Download on the Apple App Store"
              >
                <div className="store-badge-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.88-.9.04-2 .6-2.64 1.35-.56.65-1.05 1.71-.92 2.76 1 .08 2.02-.48 2.64-1.23z" />
                  </svg>
                </div>
                <div className="store-badge-text">
                  <span className="store-badge-sub">DOWNLOAD ON THE</span>
                  <span className="store-badge-title">App Store</span>
                </div>
                <CaretRight size={14} className="store-badge-arrow" />
              </a>
            </div>

            {/* In-App Perks */}
            <div className="app-perks-list">
              <div className="app-perk-item">
                <Bell size={14} weight="bold" className="perk-icon" />
                <span>Rare Allocation & Vault Drop Alerts</span>
              </div>
              <div className="app-perk-item">
                <ShieldCheck size={14} weight="bold" className="perk-icon" />
                <span>Encrypted Provenance Certificates & QR Event Tickets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="app-modal-footer">
          <span>Compatible with iOS 14+ and Android 8.0+. Requires legal drinking age verification.</span>
        </div>
      </div>
    </div>
  );
}
