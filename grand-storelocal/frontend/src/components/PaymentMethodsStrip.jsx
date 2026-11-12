import React from 'react';

const STRIP_STYLES = `
  .gs-pay-root {
    position: relative;
    width: 100%;
    max-width: 390px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  @media (min-width: 640px) {
    .gs-pay-root {
      max-width: 440px;
    }
  }
  @media (min-width: 1024px) {
    .gs-pay-root {
      width: 330px;
      max-width: 330px;
      flex-shrink: 0;
    }
  }
  @media (min-width: 1280px) {
    .gs-pay-root {
      width: 405px;
      max-width: 405px;
    }
  }

  .gs-pay-checkout-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .gs-pay-fade-left,
  .gs-pay-fade-right {
    pointer-events: none;
    position: absolute;
    top: 0;
    bottom: 0;
    width: 24px;
    z-index: 10;
  }
  .gs-pay-fade-left {
    left: 0;
    background: linear-gradient(to right, #070706 0%, rgba(7, 7, 6, 0) 100%);
  }
  .gs-pay-fade-right {
    right: 0;
    background: linear-gradient(to left, #070706 0%, rgba(7, 7, 6, 0) 100%);
  }

  .gs-pay-scroller {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .gs-pay-scroller::-webkit-scrollbar {
    display: none;
  }

  @keyframes gs-pay-marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  .gs-pay-track {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    width: max-content;
    animation: gs-pay-marquee 26s linear infinite;
    will-change: transform;
  }
  .gs-pay-scroller:hover .gs-pay-track,
  .gs-pay-scroller:focus-within .gs-pay-track {
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    .gs-pay-track {
      animation: none;
    }
  }

  .gs-pay-group {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    padding-right: 8px;
    flex-shrink: 0;
  }

  .gs-pay-card {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    flex-shrink: 0;
    height: 30px;
    padding: 0 10px;
    border-radius: 6px;
    background: linear-gradient(180deg, #FFFFFF 0%, #F7F3EA 100%);
    border: 1px solid rgba(201, 163, 91, 0.5);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    user-select: none;
    transition: transform 0.2s ease, border-color 0.2s ease;
    line-height: 1;
  }
  .gs-pay-card:hover {
    transform: translateY(-1px);
    border-color: rgba(225, 189, 112, 0.85);
  }
  .gs-pay-card--checkout {
    height: 36px;
    padding: 0 12px;
    border-radius: 8px;
    gap: 6px;
  }

  .gs-pay-wordmark {
    line-height: 1;
    white-space: nowrap;
    letter-spacing: -0.02em;
  }
`;

const BadgeCard = ({ children, title, isCheckout = false }) => (
  <span
    title={title}
    aria-label={title}
    className={`gs-pay-card${isCheckout ? ' gs-pay-card--checkout' : ''}`}
  >
    {children}
  </span>
);

const BadgeTrackItems = ({ isCheckout = false }) => {
  const iconSm = isCheckout ? 14 : 12;
  const iconMd = isCheckout ? 16 : 13;

  return (
    <>
      {/* VISA */}
      <BadgeCard title="Visa" isCheckout={isCheckout}>
        <svg viewBox="0 0 42 14" style={{ height: isCheckout ? 14 : 11, width: 'auto', display: 'block' }} aria-hidden="true">
          <path
            d="M16.9 1.1L14.1 12.9h-2.5L14.4 1.1h2.5zm10.6 7.6l1.3-3.6.7 3.6h-2zm2.8 4.2h2.3L30.6 1.1h-2.1c-.5 0-.9.3-1.1.7l-3.8 11.1h2.6l.5-1.5h3.2l.4 1.5zM24 9c0-3.1-4.3-3.3-4.3-4.7 0-.4.4-.9 1.3-.9.9 0 1.7.2 2.2.4l.4-1.9c-.6-.2-1.4-.4-2.4-.4-2.5 0-4.3 1.3-4.3 3.2 0 1.4 1.3 2.2 2.2 2.6 1 .5 1.3.8 1.3 1.2 0 .7-.8 1-1.6 1-1.3 0-2-.3-2.6-.6l-.5 2c.6.3 1.7.5 2.8.5 2.7.1 4.5-1.2 4.5-3.4zM12.2 1.1L8.1 12.9H5.4L3.4 3.5c-.1-.5-.2-.7-.6-.9C2.1 2.2 1 1.9 0 1.7l.1-.6h4.2c.6 0 1 .4 1.1 1l1 5.5 2.6-6.5h3.2z"
            fill="#1A1F71"
          />
          <polygon points="0,1.1 3.7,1.1 4.3,3.7 1.4,1.9" fill="#F7B600" />
        </svg>
      </BadgeCard>

      {/* Mastercard */}
      <BadgeCard title="Mastercard" isCheckout={isCheckout}>
        <svg viewBox="0 0 28 18" style={{ height: isCheckout ? 16 : 14, width: 'auto', display: 'block' }} aria-hidden="true">
          <circle cx="10" cy="9" r="7" fill="#EB001B" />
          <circle cx="18" cy="9" r="7" fill="#F79E1B" />
          <path d="M14 3.3a7 7 0 0 1 0 11.4 7 7 0 0 1 0-11.4z" fill="#FF5F00" />
        </svg>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 11 : 10, fontWeight: 700, color: '#1A1A1A' }}>
          mastercard
        </span>
      </BadgeCard>

      {/* American Express */}
      <BadgeCard title="American Express" isCheckout={isCheckout}>
        <svg viewBox="0 0 42 18" style={{ height: isCheckout ? 18 : 16, width: 'auto', display: 'block' }} aria-hidden="true">
          <rect width="42" height="18" rx="3" fill="#006FCF" />
          <text
            x="21"
            y="12.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9.5"
            fontWeight="900"
            letterSpacing="0.5"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            AMEX
          </text>
        </svg>
      </BadgeCard>

      {/* Instant EFT */}
      <BadgeCard title="Instant EFT by PayFast" isCheckout={isCheckout}>
        <svg viewBox="0 0 16 16" style={{ height: iconMd, width: iconMd, display: 'block' }} aria-hidden="true">
          <path d="M9.5 1.5L3.5 9h4.2l-1.2 5.5L12.5 7H8.3l1.2-5.5z" fill="#059669" />
        </svg>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 11 : 10, fontWeight: 700, color: '#111827' }}>
          Instant<span style={{ color: '#059669' }}>EFT</span>
        </span>
      </BadgeCard>

      {/* Apple Pay */}
      <BadgeCard title="Apple Pay" isCheckout={isCheckout}>
        <svg viewBox="0 0 14 17" style={{ height: iconMd, width: 'auto', display: 'block' }} aria-hidden="true">
          <path
            d="M11.6 9.1c0-2 1.6-3 1.7-3.1-.9-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.3 2C.1 8.8 1.2 12.4 2.5 14.3c.7.9 1.4 2 2.5 1.9 1 0 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-.9 2.4-1.9.8-1.1 1.1-2.2 1.1-2.3-.1 0-2.1-.8-2.1-3zM9.6 3.1c.5-.7.9-1.6.8-2.6-.8 0-1.8.5-2.3 1.2-.5.6-.9 1.5-.8 2.5.9.1 1.8-.4 2.3-1.1z"
            fill="#000000"
          />
        </svg>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 11.5 : 10.5, fontWeight: 600, color: '#000000' }}>
          Pay
        </span>
      </BadgeCard>

      {/* Samsung Pay */}
      <BadgeCard title="Samsung Pay" isCheckout={isCheckout}>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 10.5 : 9.5, fontWeight: 800, color: '#1428A0' }}>
          SAMSUNG <span style={{ fontWeight: 600, color: '#1E40AF' }}>Pay</span>
        </span>
      </BadgeCard>

      {/* Mobicred */}
      <BadgeCard title="Mobicred" isCheckout={isCheckout}>
        <svg viewBox="0 0 16 14" style={{ height: iconSm, width: 'auto', display: 'block' }} aria-hidden="true">
          <path
            d="M1.5 11.5V6.2c0-2 1.6-3.7 3.6-3.7 1.3 0 2.4.7 3 1.7.6-1 1.7-1.7 3-1.7 2 0 3.6 1.7 3.6 3.7v5.3h-2.3V6.3c0-.9-.6-1.6-1.4-1.6-.8 0-1.5.7-1.5 1.6v5.2H6.9V6.3c0-.9-.6-1.6-1.5-1.6-.8 0-1.4.7-1.4 1.6v5.2H1.5z"
            fill="#0284C7"
          />
        </svg>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 11 : 10, fontWeight: 700, color: '#0369A1' }}>
          mobicred
        </span>
      </BadgeCard>

      {/* SnapScan */}
      <BadgeCard title="SnapScan" isCheckout={isCheckout}>
        <svg viewBox="0 0 16 16" style={{ height: iconMd, width: iconMd, display: 'block' }} aria-hidden="true">
          <path
            d="M2 5V2.8A.8.8 0 0 1 2.8 2H5M11 2h2.2a.8.8 0 0 1 .8.8V5M14 11v2.2a.8.8 0 0 1-.8.8H11M5 14H2.8a.8.8 0 0 1-.8-.8V11"
            stroke="#0077B6"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="5.2" y="5.2" width="5.6" height="5.6" rx="1.2" fill="#0077B6" />
        </svg>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 11 : 10, fontWeight: 700, color: '#0F172A' }}>
          SnapScan
        </span>
      </BadgeCard>

      {/* Zapper */}
      <BadgeCard title="Zapper" isCheckout={isCheckout}>
        <svg viewBox="0 0 14 14" style={{ height: iconSm, width: iconSm, display: 'block' }} aria-hidden="true">
          <path
            d="M2 2.5h10L5.2 11.5H12"
            stroke="#0891B2"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 11 : 10, fontWeight: 800, color: '#0E7490' }}>
          zapper
        </span>
      </BadgeCard>

      {/* RCS */}
      <BadgeCard title="RCS Store Cards" isCheckout={isCheckout}>
        <svg viewBox="0 0 14 14" style={{ height: iconSm, width: iconSm, display: 'block' }} aria-hidden="true">
          <path d="M7 1.2L12.8 7 7 12.8 1.2 7 7 1.2z" fill="#EA580C" />
          <circle cx="7" cy="7" r="2" fill="#FAF8F4" />
        </svg>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 11 : 10, fontWeight: 900, letterSpacing: '0.04em', color: '#1F2937' }}>
          RCS
        </span>
      </BadgeCard>

      {/* Scan to Pay */}
      <BadgeCard title="Scan to Pay" isCheckout={isCheckout}>
        <svg viewBox="0 0 16 16" style={{ height: iconMd, width: iconMd, display: 'block' }} aria-hidden="true">
          <rect x="2" y="2" width="4.5" height="4.5" rx="0.8" stroke="#E11D48" strokeWidth="1.6" fill="none" />
          <rect x="9.5" y="2" width="4.5" height="4.5" rx="0.8" stroke="#E11D48" strokeWidth="1.6" fill="none" />
          <rect x="2" y="9.5" width="4.5" height="4.5" rx="0.8" stroke="#E11D48" strokeWidth="1.6" fill="none" />
          <rect x="9.5" y="9.5" width="2.1" height="2.1" fill="#E11D48" />
          <rect x="12" y="12" width="2.1" height="2.1" fill="#E11D48" />
        </svg>
        <span className="gs-pay-wordmark" style={{ fontSize: isCheckout ? 11 : 10, fontWeight: 700, color: '#111827' }}>
          Scan to Pay
        </span>
      </BadgeCard>
    </>
  );
};

export default function PaymentMethodsStrip({ variant = 'footer', className = '' }) {
  if (variant === 'checkout') {
    return (
      <>
        <style>{STRIP_STYLES}</style>
        <div className={`gs-pay-checkout-row ${className}`} role="group" aria-label="Accepted payment methods">
          <BadgeTrackItems isCheckout={true} />
        </div>
      </>
    );
  }

  return (
    <div
      className={`gs-pay-root ${className}`}
      role="group"
      aria-label="Accepted payment methods"
    >
      <style>{STRIP_STYLES}</style>

      {/* Soft left/right fade masks matching footer bar */}
      <div className="gs-pay-fade-left" />
      <div className="gs-pay-fade-right" />

      <div className="gs-pay-scroller">
        <div className="gs-pay-track">
          <div className="gs-pay-group">
            <BadgeTrackItems isCheckout={false} />
          </div>
          <div className="gs-pay-group" aria-hidden="true">
            <BadgeTrackItems isCheckout={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
