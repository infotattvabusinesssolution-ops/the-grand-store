import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Gavel, Martini, Wine } from 'lucide-react';
import AppDownloadBadges from '../../components/AppDownloadBadges';
import './LoginShowcase.css';

const GOLD_DUST = [
  [7, 24, 2, 0], [18, 48, 3, -2], [30, 15, 2, -4], [43, 36, 2, -1],
  [58, 20, 3, -5], [71, 44, 2, -3], [87, 28, 2, -6], [94, 58, 3, -2],
  [9, 74, 2, -5], [26, 65, 2, -3], [39, 82, 3, -1], [55, 61, 2, -4],
  [67, 77, 2, -6], [79, 63, 3, -2], [90, 86, 2, -4], [48, 53, 2, -5],
];

const tiltShowcase = (event) => {
  if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const stage = event.currentTarget;
  const rect = stage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
  const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
  stage.style.setProperty('--showcase-rotate-y', `${x * 5}deg`);
  stage.style.setProperty('--showcase-rotate-x', `${y * -3}deg`);
};

const resetShowcaseTilt = (event) => {
  event.currentTarget.style.setProperty('--showcase-rotate-y', '0deg');
  event.currentTarget.style.setProperty('--showcase-rotate-x', '0deg');
};

export default function LoginShowcase() {
  return (
    <aside className="login-showcase hidden lg:flex lg:col-span-6 xl:col-span-7" aria-label="Discover The Grand Store">
      <div className="login-showcase__atmosphere" aria-hidden="true">
        <div className="login-showcase__light" />
        {GOLD_DUST.map(([x, y, size, delay], index) => (
          <span
            key={index}
            className={`login-showcase__dust${index % 5 === 0 ? ' login-showcase__dust--star' : ''}`}
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animationDelay: `${delay}s`, animationDuration: `${6 + index % 4}s` }}
          />
        ))}
      </div>
      <header className="login-showcase__header">
        <Link to="/" aria-label="The Grand Store home" className="login-showcase__brand">
          <img src="/logo.png" alt="The Grand Store" width="4257" height="1350" />
        </Link>
        <Link to="/" className="login-showcase__back">
          <ArrowLeft size={14} aria-hidden="true" /> Back to store
        </Link>
      </header>

      <div className="login-showcase__content">
        <div className="login-showcase__intro">
          <div>
            <p className="login-showcase__eyebrow"><span aria-hidden="true" /> A taste for the exceptional</p>
            <h2>A world of <em>rare finds.</em></h2>
            <p className="login-showcase__description">Fine wines, exceptional spirits and live auctions.<br />Your next discovery starts here.</p>
          </div>
          <nav className="login-showcase__discover" aria-label="Explore the collection">
            <p className="login-showcase__discover-heading">Explore the collection</p>
            <Link to="/shop?category=Wine" className="login-showcase__discover-link">
              <Wine size={17} strokeWidth={1.4} aria-hidden="true" />
              <span>Fine wines</span>
              <ArrowUpRight size={13} aria-hidden="true" className="login-showcase__discover-arrow" />
            </Link>
            <Link to="/shop?category=Spirits" className="login-showcase__discover-link">
              <Martini size={17} strokeWidth={1.4} aria-hidden="true" />
              <span>Premium spirits</span>
              <ArrowUpRight size={13} aria-hidden="true" className="login-showcase__discover-arrow" />
            </Link>
            <Link to="/auction" className="login-showcase__discover-link">
              <Gavel size={17} strokeWidth={1.4} aria-hidden="true" />
              <span>Explore auctions</span>
              <ArrowUpRight size={13} aria-hidden="true" className="login-showcase__discover-arrow" />
            </Link>
          </nav>
        </div>

        <div
          className="login-showcase__collection"
          onPointerMove={tiltShowcase}
          onPointerLeave={resetShowcaseTilt}
          onPointerCancel={resetShowcaseTilt}
        >
          <figure className="login-showcase__item">
            <div className="login-showcase__app-stage">
              <div className="login-showcase__app-card">
                <img src="/images/auth-black-gold-hero.jpg" alt="The Grand Store mobile app showcase" className="login-showcase__app-image" />
                <span className="login-showcase__glass-shine" aria-hidden="true" />
              </div>
            </div>
            <figcaption className="login-showcase__caption">
              <span className="login-showcase__number" aria-hidden="true">01</span>
              <div>
                <p className="login-showcase__label">The app</p>
                <p className="login-showcase__caption-title">Your collection, wherever you are.</p>
              </div>
            </figcaption>
          </figure>

          <figure className="login-showcase__item">
            <div className="login-showcase__bottle-stage">
              <div className="login-showcase__bottle-scene">
                <div className="login-showcase__depth-type" aria-hidden="true">
                  <span className="login-showcase__depth-kicker">THE</span>
                  <span className="login-showcase__depth-word">GRAND</span>
                  <span className="login-showcase__depth-word">STORE</span>
                </div>
                <div className="login-showcase__arch" aria-hidden="true" />
                <div className="login-showcase__orbit" aria-hidden="true" />
                <div className="login-showcase__plinth" aria-hidden="true" />
                <div className="login-showcase__bottle-shadow" aria-hidden="true" />
                <img src="/assets/auction/macallan-25.png" alt="A bottle from the Grand Store spirits collection" className="login-showcase__bottle-image" />
                <span className="login-showcase__bottle-glint" aria-hidden="true" />
              </div>
            </div>
            <figcaption className="login-showcase__caption">
              <span className="login-showcase__number" aria-hidden="true">02</span>
              <div>
                <p className="login-showcase__label">The cellar</p>
                <p className="login-showcase__caption-title">Discover something worth keeping.</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>

      <footer className="login-showcase__footer">
        <div>
          <p className="login-showcase__download-title">Take The Grand Store with you.</p>
          <p className="login-showcase__download-note">Available on iOS & Android</p>
        </div>
        <AppDownloadBadges />
      </footer>
    </aside>
  );
}
