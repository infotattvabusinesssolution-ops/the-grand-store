import { Link } from 'react-router-dom';
import './VendorHeroSection.css';

const REGISTRATION_URL = '/vendor/onboarding';

function VendorHeroSection() {
  return (
    <section className="vendor-hero" aria-label="The Grand Store vendor portal">
      <div className="vendor-hero__media">
        <img
          src="/assets/vendor/vendor-hero.jpeg"
          alt="Welcome to our vendor portal — Collaborate with us to reach more customers"
          fetchPriority="high"
        />
      </div>

      <div className="vendor-hero__action-bar">
        <p><span>Partner with The Grand Store</span> and place your portfolio before a premium global audience.</p>
        <div className="vendor-hero__actions">
          <a href="#vendor-opportunity" className="vendor-hero__link vendor-hero__link--quiet">
            Explore the opportunity
          </a>
          <Link to={REGISTRATION_URL} className="vendor-hero__link">
            Apply as a vendor <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default VendorHeroSection;
