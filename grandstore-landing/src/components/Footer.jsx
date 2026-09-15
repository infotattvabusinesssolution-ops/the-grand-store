import { useState } from 'react';
import {
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  YoutubeIcon,
  PinterestIcon,
  TiktokIcon,
} from './SocialIcons';

const STORE = "https://grandstoreglobal.com";

export default function Footer({
  onNavigateHome,
  onNavigateAbout,
  onNavigateAuctions,
  onOpenLegal,
  onOpenAppModal,
}) {
  const [newsletterStatus, setNewsletterStatus] = useState('');

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
            href={`${STORE}/about`}
            onClick={(e) => {
              if (onNavigateAbout) {
                e.preventDefault();
                onNavigateAbout();
              }
            }}
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
          <a className="footer-nav-link" href="https://sacoronavirus.co.za/" target="_blank" rel="noopener noreferrer">
            Covid protocol
          </a>

          <div className="footer-social-row">
            {socialLinks.map((social) => {
              const IconComponent = social.Icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-badge"
                  aria-label={`Visit The Grand Store on ${social.label}`}
                  title={social.label}
                >
                  <IconComponent size={social.label === 'YouTube' ? 21 : 18} />
                </a>
              );
            })}
          </div>
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
          <a className="footer-nav-link" href={`${STORE}/shop?category=Wine&style=Sparkling`} target="_blank" rel="noopener noreferrer">
            Sparkling wines
          </a>
          <a className="footer-nav-link" href={`${STORE}/shop?category=Wine&style=Red`} target="_blank" rel="noopener noreferrer">
            Red wine
          </a>
          <a className="footer-nav-link" href={`${STORE}/shop?category=Wine&style=White`} target="_blank" rel="noopener noreferrer">
            White wine
          </a>
          <a className="footer-nav-link" href={`${STORE}/shop?category=Wine&style=Rose`} target="_blank" rel="noopener noreferrer">
            Rosé wine
          </a>
          <a className="footer-nav-link" href={`${STORE}/tools/wine-pairing`} target="_blank" rel="noopener noreferrer">
            Wine Pairing Tool
          </a>
          <a className="footer-nav-link" href={`${STORE}/tools/whisky-finder`} target="_blank" rel="noopener noreferrer">
            Whisky Finder
          </a>
          <a className="footer-nav-link" href={`${STORE}/collections/best-wines-under-500`} target="_blank" rel="noopener noreferrer">
            Best Wines Under R500
          </a>
          <a className="footer-nav-link" href={`${STORE}/collections/best-whisky-under-1000`} target="_blank" rel="noopener noreferrer">
            Best Whisky Under R1,000
          </a>
          <a className="footer-nav-link" href={`${STORE}/brand/glenfiddich`} target="_blank" rel="noopener noreferrer">
            Glenfiddich Whisky
          </a>
          <a className="footer-nav-link" href={`${STORE}/brand/kanonkop`} target="_blank" rel="noopener noreferrer">
            Kanonkop Wine Estate
          </a>
          <a className="footer-nav-link" href={`${STORE}/brand/hennessy`} target="_blank" rel="noopener noreferrer">
            Hennessy Cognac
          </a>
          <a className="footer-nav-link" href={`${STORE}/winefarm`} target="_blank" rel="noopener noreferrer">
            Join Wine Farm
          </a>
          <a className="footer-nav-link" href={`${STORE}/glossary`} target="_blank" rel="noopener noreferrer">
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
          <strong className="footer-visitor-counter">
            Total Visitors <span className="visitor-colon">:</span> 538113
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
        <div className="footer-bottom-inner">
          <p className="footer-copyright">
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
          <img
            className="footer-payment-strip"
            src="/assets/footer/payment-strip.png"
            alt="Accepted payment methods"
          />
        </div>
      </div>
    </footer>
  );
}
