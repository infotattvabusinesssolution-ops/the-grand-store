import { useState, useEffect } from 'react';
import {
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  YoutubeIcon,
  PinterestIcon,
  TiktokIcon,
} from './SocialIcons';
import PaymentMethodsStrip from './PaymentMethodsStrip';

const STORE = "https://grandstoreglobal.com";

export default function Footer({
  onNavigateHome,
  onNavigateAbout,
  onNavigateAuctions,
  onOpenLegal,
  onOpenAppModal,
}) {
  const [newsletterStatus, setNewsletterStatus] = useState('');

  // Dynamic Visitor Counter (starting baseline: 545,462)
  const BASE_VISITORS = 545462;
  const [visitorCount, setVisitorCount] = useState(() => {
    try {
      const stored = localStorage.getItem('tgs_total_visitors');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= BASE_VISITORS) return parsed;
      }
    } catch {}
    return BASE_VISITORS;
  });
  const [displayCount, setDisplayCount] = useState(visitorCount);
  const [isBumping, setIsBumping] = useState(false);

  // Increment visitor count consistently by +5
  const incrementVisitors = (amount = 5) => {
    setVisitorCount((prev) => {
      const next = prev + amount;
      try {
        localStorage.setItem('tgs_total_visitors', String(next));
      } catch {}
      return next;
    });
    setIsBumping(true);
    setTimeout(() => setIsBumping(false), 500);
  };

  // Handle click on Total Visitors to add +5
  const handleVisitorClick = () => {
    incrementVisitors(5);
  };

  // Smooth roll-up on mount (+5 once per browser session)
  useEffect(() => {
    let initialTarget = visitorCount;
    try {
      const hasCounted = sessionStorage.getItem('tgs_session_counted');
      if (!hasCounted) {
        sessionStorage.setItem('tgs_session_counted', 'true');
        initialTarget = visitorCount + 5;
        setVisitorCount(initialTarget);
        localStorage.setItem('tgs_total_visitors', String(initialTarget));
      }
    } catch {}

    const startValue = Math.max(BASE_VISITORS, initialTarget - 15);
    const endValue = initialTarget;
    const duration = 900;
    const startTime = performance.now();

    let animationFrameId;
    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * ease);
      setDisplayCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayCount(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Periodically increment dynamically (+5 per tick)
  useEffect(() => {
    let timerId;
    const scheduleNext = () => {
      const randomDelay = Math.floor(Math.random() * 4000) + 4500;
      timerId = setTimeout(() => {
        incrementVisitors(5);
        scheduleNext();
      }, randomDelay);
    };

    scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    setDisplayCount(visitorCount);
  }, [visitorCount]);

  const handleNewsletterSignup = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get('email');

    try {
      setNewsletterStatus('Subscribing...');

      // Fetch geolocation from frontend to bypass backend proxy masking
      let country = 'Unknown';
      let ipAddress = 'Unknown';
      try {
        const cfResponse = await fetch('https://1.1.1.1/cdn-cgi/trace');
        const cfText = await cfResponse.text();

        const cfData = {};
        cfText
          .trim()
          .split('\n')
          .forEach((line) => {
            const [key, value] = line.split('=');
            cfData[key] = value;
          });

        if (cfData.ip && cfData.loc) {
          ipAddress = cfData.ip;
          const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
          country = regionNames.of(cfData.loc) || cfData.loc;
        } else {
          const geoResponse = await fetch('https://ipapi.co/json/');
          const geoData = await geoResponse.json();
          if (geoData.country_name) {
            country = geoData.country_name;
            ipAddress = geoData.ip;
          }
        }
      } catch (e) {
        console.warn('Could not fetch geolocation on frontend', e);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, country, ipAddress }),
      });

      if (response.ok) {
        setNewsletterStatus(`Thank you — updates will be sent to ${email}.`);
        form.reset();
      } else {
        const data = await response.json().catch(() => ({}));
        setNewsletterStatus(data.message || `Thank you — updates will be sent to ${email}.`);
        form.reset();
      }
    } catch (error) {
      setNewsletterStatus(`Thank you — updates will be sent to ${email}.`);
      form.reset();
    }
  };

  const socialLinks = [
    { label: 'Facebook', Icon: FacebookIcon, href: 'https://www.facebook.com/thegrandstoreofficial' },
    { label: 'X', Icon: TwitterIcon, href: 'https://x.com/Thegrandstore1' },
    { label: 'Instagram', Icon: InstagramIcon, href: 'https://www.instagram.com/thegrandstoreofficial/' },
    { label: 'Pinterest', Icon: PinterestIcon, href: 'https://www.pinterest.com/thegrandstore1/' },
    { label: 'YouTube', Icon: YoutubeIcon, href: 'https://www.youtube.com/@thegrandstoreofficial' },
    { label: 'TikTok', Icon: TiktokIcon, href: 'https://www.tiktok.com/@thegrandstoreofficial' },
  ];

  return (
    <footer className="site-footer" id="footer" aria-label="The Grand Store Footer">
      <div className="footer-grid-container">
        {/* Column 1: The Grand Store */}
        <div className="footer-col">
          <h3 className="footer-heading">The Grand Store</h3>
          <a
            className="footer-nav-link"
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
          >
            About us
          </a>
          <a className="footer-nav-link" href={`${STORE}/trade`} target="_blank" rel="noopener noreferrer">
            Trade
          </a>
          <a className="footer-nav-link" href={`${STORE}/blogs`} target="_blank" rel="noopener noreferrer">
            News &amp; blogs
          </a>
          <a className="footer-nav-link" href={`${STORE}/cocktail`} target="_blank" rel="noopener noreferrer">
            Cocktail
          </a>
          <a
            className="footer-nav-link"
            href={`${STORE}/auction`}
            onClick={(e) => {
              if (onNavigateAuctions) {
                e.preventDefault();
                onNavigateAuctions();
              }
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Auction
          </a>
          <a className="footer-nav-link" href={`${STORE}/contact-us`} target="_blank" rel="noopener noreferrer">
            Contact us
          </a>
        </div>

        {/* Column 2: Our Policies */}
        <div className="footer-col">
          <h3 className="footer-heading">Our Policies</h3>
          <a
            className="footer-nav-link"
            href={`${STORE}/terms-and-conditions`}
            onClick={(e) => {
              if (onOpenLegal) {
                e.preventDefault();
                onOpenLegal('terms');
              }
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms &amp; conditions
          </a>
          <a
            className="footer-nav-link"
            href={`${STORE}/terms-of-service`}
            onClick={(e) => {
              if (onOpenLegal) {
                e.preventDefault();
                onOpenLegal('tos');
              }
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of service
          </a>
          <a
            className="footer-nav-link"
            href={`${STORE}/privacy-policy`}
            onClick={(e) => {
              if (onOpenLegal) {
                e.preventDefault();
                onOpenLegal('privacy');
              }
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy &amp; cookies policy
          </a>
          <a
            className="footer-nav-link"
            href="#faq"
            onClick={(e) => {
              const el = document.getElementById('faq');
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            FAQ
          </a>
          <a className="footer-nav-link" href={`${STORE}/vendor-portal`} target="_blank" rel="noopener noreferrer">
            Sell on The Grand Store
          </a>
          <a className="footer-nav-link" href={`${STORE}/refer-and-earn`} target="_blank" rel="noopener noreferrer">
            Refer &amp; earn
          </a>
        </div>

        {/* Column 3: Wines & Tools */}
        <div className="footer-col">
          <h3 className="footer-heading">Wines &amp; Tools</h3>
          <a className="footer-nav-link" href={`${STORE}/shop?category=Wine&style=Sparkling`}>
            Sparkling wines
          </a>
          <a className="footer-nav-link" href={`${STORE}/shop?category=Wine&style=Red`}>
            Red wine
          </a>
          <a className="footer-nav-link" href={`${STORE}/shop?category=Wine&style=White`}>
            White wine
          </a>
          <a className="footer-nav-link" href={`${STORE}/shop?category=Wine&style=Rose`}>
            Rosé wine
          </a>
          <a className="footer-nav-link" href={`${STORE}/tools/wine-pairing`}>
            Wine Pairing Tool
          </a>
          <a className="footer-nav-link" href={`${STORE}/tools/whisky-finder`}>
            Whisky Finder
          </a>
          <a className="footer-nav-link" href={`${STORE}/collections/best-wines-under-500`}>
            Best Wines Under R500
          </a>
          <a className="footer-nav-link" href={`${STORE}/collections/best-whisky-under-1000`}>
            Best Whisky Under R1,000
          </a>
          <a className="footer-nav-link" href={`${STORE}/brand/glenfiddich`}>
            Glenfiddich Whisky
          </a>
          <a className="footer-nav-link" href={`${STORE}/brand/kanonkop`}>
            Kanonkop Wine Estate
          </a>
          <a className="footer-nav-link" href={`${STORE}/brand/hennessy`}>
            Hennessy Cognac
          </a>
          <a className="footer-nav-link" href={`${STORE}/winefarm`} target="_blank" rel="noopener noreferrer">
            Join Wine Farm
          </a>
          <a className="footer-nav-link" href={`${STORE}/glossary`}>
            Glossary
          </a>
        </div>

        {/* Column 4: Newsletter */}
        <div className="footer-col footer-col-newsletter">
          <h3 className="footer-heading">Newsletter</h3>
          <p className="footer-newsletter-text">
            Subscribe to our newsletter to get latest updates and amazing offers.
          </p>
          <form className="footer-signup-form" onSubmit={handleNewsletterSignup}>
            <input
              className="footer-signup-input"
              name="email"
              type="email"
              required
              aria-label="Email address"
              placeholder="Enter your email here.."
            />
            <button className="footer-signup-btn" type="submit">
              Sign up
            </button>
          </form>
          {newsletterStatus && (
            <p className="footer-status-text" role="status">
              {newsletterStatus}
            </p>
          )}
          <strong 
            onClick={handleVisitorClick}
            className="footer-visitor-counter cursor-pointer select-none"
            title="Click to increment total visitors (+5)"
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            Total Visitors <span className="visitor-colon">:</span>
            <span 
              style={{
                fontFamily: "'Manrope Variable', 'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: isBumping ? '#fff4b8' : '#ffd700',
                textShadow: isBumping ? '0 0 16px rgba(255,215,0,0.9)' : '0 2px 8px rgba(212,175,55,0.35)',
                display: 'inline-block',
                marginLeft: '4px',
                transition: 'all 0.3s ease',
                fontVariantNumeric: 'tabular-nums',
                transform: isBumping ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {displayCount.toLocaleString()}
            </span>
          </strong>
          <div className="footer-app-links" aria-label="Download The Grand Store mobile app">
            <a
              className="footer-store-link"
              href="https://apps.apple.com/in/app/grand-store/id6449220111"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download on the App Store"
            >
              <img
                className="footer-store-badge"
                src="/assets/footer/app-store.svg"
                alt="Download on the App Store"
              />
            </a>
            <a
              className="footer-store-link"
              href="https://play.google.com/store/apps/details?id=com.grandstore"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get it on Google Play"
            >
              <img
                className="footer-store-badge"
                src="/assets/footer/google-play.svg"
                alt="Get it on Google Play"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Payment Strip */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-inner flex flex-col lg:flex-row items-center justify-between min-h-[86px] py-6 lg:py-0 gap-6">
          <p className="footer-copyright order-2 lg:order-1">
            Copyright © {new Date().getFullYear()}{' '}
            <a
              className="footer-brand-gold-link"
              href="#home"
              onClick={(e) => {
                if (onNavigateHome) {
                  e.preventDefault();
                  onNavigateHome();
                }
              }}
            >
              The Grand Store
            </a>
            . All Rights Reserved.
          </p>

          <div className="flex items-center gap-[12px] order-1 lg:order-2" aria-label="Follow The Grand Store on Social Media">
            {socialLinks.map((social) => {
              const IconComponent = social.Icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid place-items-center w-[38px] h-[38px] rounded-full bg-[#1c1d1d] text-[#f5d77f] border border-[#d4af37]/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:border-[#ffd700] hover:bg-gradient-to-tr hover:from-[#ffd700] hover:to-[#d4af37] hover:text-[#0b0c0c] hover:scale-110 hover:shadow-[0_0_18px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label={`Visit The Grand Store on ${social.label}`}
                  title={social.label}
                >
                  <IconComponent size={social.label === 'YouTube' ? 19 : 16} />
                </a>
              );
            })}
          </div>

          <PaymentMethodsStrip variant="footer" className="order-3 font-sans" />
        </div>
      </div>
    </footer>
  );
}
