import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import './VendorPortalFeatures.css';

const portalFeatures = [
  {
    icon: '/assets/vendor/media-9.png',
    title: 'Dashboard',
    description: 'Brings together all the data you need to plan and fulfill your upcoming orders'
  },
  {
    icon: '/assets/vendor/media-10.png',
    title: 'Account',
    description: 'Manage your payments.'
  },
  {
    icon: '/assets/vendor/media-11.png',
    title: 'Stock',
    description: 'Different product Categories'
  },
  {
    icon: '/assets/vendor/media-12.png',
    title: 'Data',
    description: 'Make sure you stay informed about your customer ordering patterns etc.'
  },
  {
    icon: '/assets/vendor/media-13.png',
    title: 'Sales',
    description: 'Manage your sales.'
  },
  {
    icon: '/assets/vendor/media-14.png',
    title: 'Orders',
    description: 'Manage all your Orders from start to finish.'
  }
];

function PortalFeatureCard({ feature, index }) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  
  // Stagger animation based on index
  return (
    <div 
      ref={ref} 
      className={`vendor-portal-card ${isVisible ? 'reveal-up' : 'hidden-up'}`}
      style={{ transitionDelay: `${(index % 3) * 100}ms` }}
    >
      <div className="vendor-portal-card__icon">
        <img src={feature.icon} alt={feature.title} />
      </div>
      <h5 className="vendor-portal-card__title">{feature.title}</h5>
      <p className="vendor-portal-card__desc">{feature.description}</p>
    </div>
  );
}

function VendorPortalFeatures() {
  const [headerRef, headerVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section className="vendor-portal-features">
      <div className="vendor-portal-features__container">
        <div 
          ref={headerRef} 
          className={`vendor-portal-features__header ${headerVisible ? 'reveal-up' : 'hidden-up'}`}
        >
          <h2>The Grand Store <span className="text-gold">Vendor Portal</span></h2>
          <p className="vendor-portal-features__subtitle">
            Manage your Products, Stock, Pricing and Orders using the Grandstore Seller Portal online platform.
          </p>
        </div>
        
        <div className="vendor-portal-features__grid">
          {portalFeatures.map((feature, idx) => (
            <PortalFeatureCard key={idx} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default VendorPortalFeatures;
