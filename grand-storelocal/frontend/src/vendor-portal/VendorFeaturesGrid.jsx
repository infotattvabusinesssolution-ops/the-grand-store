import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import './VendorFeaturesGrid.css';

const features = [
  {
    icon: '/assets/vendor/media-1.png',
    title: 'Vendor Sign-Up',
    description: "Begin the vendor registration process by providing a dedicated signup form on the website. Collect essential details such as the vendor's name, contact information, business name, and relevant documents."
  },
  {
    icon: '/assets/vendor/media-2.png',
    title: 'Membership Charges',
    description: "Clearly communicate one-time membership charges associated with becoming a vendor on the platform. Provide information about the different membership tiers, if applicable, and the benefits offered at each level."
  },
  {
    icon: '/assets/vendor/media-3.png',
    title: 'Payment Processing',
    description: "Set up a secure payment processing system to handle membership charges and any transaction fees. Integrate popular payment gateways to provide vendors with various options for making payments."
  },
  {
    icon: '/assets/vendor/media-4.png',
    title: 'Account Verification',
    description: "Implement a verification process to validate the vendor's identity and business details. Request relevant documents such as business licenses, tax identification numbers, or permits."
  },
  {
    icon: '/assets/vendor/media-5.png',
    title: 'Product Listing',
    description: "Enable vendors to create and manage their product listings efficiently. Provide an easy-to-use interface where vendors can add product details, including images, descriptions, pricing, and variations."
  },
  {
    icon: '/assets/vendor/media-6.png',
    title: 'Inventory Management',
    description: "Offer vendors a robust inventory management system to track their stock levels accurately. Enable vendors to easily add or remove products from their inventory as needed."
  },
  {
    icon: '/assets/vendor/media-7.png',
    title: 'Order Management',
    description: "Create a centralized order management system for vendors to process and fulfill customer orders. Provide a dashboard that displays new orders, order status, customer details, and shipping information."
  },
  {
    icon: '/assets/vendor/media-8.png',
    title: 'Shipping Management',
    description: "Integrate with shipping carriers to offer vendors a range of shipping options. Provide automated notifications to vendors and customers regarding order status and tracking information."
  }
];

function FeatureCard({ feature, index }) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  // Stagger animation based on index
  const animClass = index % 2 === 0 ? 'reveal-left' : 'reveal-right';
  const hiddenClass = index % 2 === 0 ? 'hidden-left' : 'hidden-right';
  
  return (
    <div 
      ref={ref} 
      className={`vendor-feature-card ${isVisible ? animClass : hiddenClass}`}
      style={{ transitionDelay: `${(index % 4) * 100}ms` }}
    >
      <div className="vendor-feature-card__icon">
        <img src={feature.icon} alt={feature.title} />
      </div>
      <h5 className="vendor-feature-card__title">{feature.title}</h5>
      <p className="vendor-feature-card__desc">{feature.description}</p>
    </div>
  );
}

function VendorFeaturesGrid() {
  const [headerRef, headerVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section className="vendor-features">
      <div className="vendor-features__container">
        <div 
          ref={headerRef} 
          className={`vendor-features__header ${headerVisible ? 'reveal-up' : 'hidden-up'}`}
        >
          <h2>Ready to <span className="text-gold">Launch</span></h2>
        </div>
        
        <div className="vendor-features__grid">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default VendorFeaturesGrid;
