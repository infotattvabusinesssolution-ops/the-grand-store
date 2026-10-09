import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  Coins,
  Users,
  ShoppingCart,
  Quotes,
  Sparkle,
} from "@phosphor-icons/react";

const STORE = "https://grandstoreglobal.com";

const reasons = [
  {
    icon: Compass,
    title: "Discover new bottles",
    text: "The biggest resource of different types of spirits from across the world. We promote a lot of local craft spirits and local wines from manufacturers who are passionate about their work. We take great pride in bringing their products directly to you. Since launching the site, we’ve made it our goal to help you uncover fresh and interesting content about wines and spirits that matter to you.",
  },
  {
    icon: Coins,
    title: "Track your collection",
    text: "Create an account and track your collection. All information is pre-filled; just search the bottles you own and keep track of the value increase and size of your own collection.",
  },
  {
    icon: Users,
    title: "Contribute to Grandstore",
    text: "The best way to contribute to our growth is by being yourself. Enjoy your experience and spread the word. Give us your reviews, keep checking our new additions and bring in your suggestions so we can keep improving our level of service.",
  },
  {
    icon: ShoppingCart,
    title: "Buy and Sell in the market",
    text: "Searching for a bottle? Maybe one of the Grandstore members has it for sale. Buy it in the marketplace or offer your spare bottles yourself. Help Grandstore friends complete their collections.",
  },
];

export default function AboutPage({ onNavigateHome }) {
  useEffect(() => {
    document.title = "About Us | The Grand Store";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="about-page-view black-gold-theme">
      {/* Top sticky navigation bar */}
      <nav className="about-page-nav" aria-label="About page navigation">
        <div className="container about-page-nav-inner">
          <button
            type="button"
            className="about-back-btn"
            onClick={onNavigateHome}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
          <div className="about-nav-breadcrumb">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={onNavigateHome}
            >
              Home
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-curr">About us</span>
          </div>
          <a
            href={`${STORE}/shop`}
            className="about-store-cta"
            target="_blank"
            rel="noreferrer"
          >
            <span>Visit Boutique</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="about-page-header">
        <div className="container">
          <div className="about-header-content">
            <p className="about-eyebrow">
              <Sparkle size={13} weight="fill" className="gold-icon" />
              <span>ABOUT US</span>
            </p>
            <h1 className="about-main-title">
              A preeminent supplier and marketer in the{" "}
              <em>liquor industry</em>
            </h1>
            <p className="about-intro">
              The Grand Store offers an extensive variety of luxury wines and
              spirits for every occasion, sourced from South Africa and around
              the globe.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content: Two-column broad layout using horizontal space */}
      <div className="container about-body-container">
        <div className="about-main-grid">
          {/* Left Column: Authentic Core Sections */}
          <div className="about-content-col">
            <section className="about-section-block">
              <h2 className="section-title">About us</h2>
              <div className="section-text">
                <p>
                  As a preeminent wholesale supplier and marketer in the liquor
                  industry, The Grand Store offers an extensive variety of luxury
                  wines and spirits for all occasions. We at Grand Store have
                  successfully identified the top wines and spirits from our
                  beloved homeland South Africa and around the globe. We have
                  also formed strong partnerships with prestigious suppliers to
                  bring you the best products at the best prices.
                </p>
                <p>
                  The Grand Store is committed to excellence in every sphere. Our
                  online, innovative approach will ensure that you have a great
                  online shopping experience accompanied by superior customer
                  service.
                </p>
              </div>
            </section>

            <section className="about-section-block">
              <h2 className="section-title">A Cut Above The Rest</h2>
              <div className="section-text">
                <p>
                  Our innovative approach illustrates our ability to offer our
                  customers the utmost value for money. Through unprecedented
                  involvement in every step of the process, we have raised the bar.
                  Our elite range of products is in line with international
                  trends. We have focused on intricate details from top
                  sommeliers and connoisseurs that offer high-quality products,
                  topped with scheduled, timeous deliveries.
                </p>
                <p>
                  We make sure that our products are thoroughly checked right from
                  the start to the final stage of production or supply under the
                  presence of qualified quality inspectors.
                </p>
                <p className="highlight-quote-gold">
                  “For us quality is not a formality but rather an expression of
                  our hard work and dedication.”
                </p>
              </div>
            </section>

            <section className="about-section-block">
              <h2 className="section-title">Our Strength</h2>
              <div className="section-text">
                <p>
                  We work relentlessly with our team to bring professionalism and
                  zeal to outperform our competitors.
                </p>
                <p>
                  Our team of highly experienced professionals is empowered with
                  sophisticated infrastructure. We are fully immersed and
                  dedicated, and our extensive industry knowledge backed by a
                  network of resourceful contacts gives us a better understanding
                  of market requirements. Our experience in the liquor and wine
                  industry has granted us increasing accolades across the industry.
                </p>
              </div>
            </section>

            <section className="about-section-block">
              <h2 className="section-title">Our Patrons</h2>
              <div className="section-text">
                <p>
                  Optimum pricing together with on-schedule delivery has made us
                  immensely popular among our wide clientele across the country.
                  We boast committed clients who enable our quest for excellence
                  by consistently ordering from Grand Store.
                </p>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Presentation & Lifestyle Quote */}
          <aside className="about-aside-col">
            <div className="about-aside-sticky">
              <div className="about-hero-media-box">
                <img
                  className="about-hero-img"
                  src="/assets/about-new-hero.jpg"
                  alt="A curated Grand Store wine presentation"
                  loading="lazy"
                />
                <div className="about-media-overlay" />
              </div>
              <blockquote className="about-lifestyle-quote">
                <Quotes size={26} weight="fill" className="quote-icon-gold" />
                <p className="quote-text">
                  “Best wines are the ones we drink with friends.”
                </p>
                <cite className="quote-cite">Wine is a lifestyle</cite>
              </blockquote>
            </div>
          </aside>
        </div>

        {/* Chairman Statement Banner with Mr. Pravin Upasani's Authentic Photo */}
        <section className="about-chairman-card" aria-label="Chairman Statement">
          <div className="chairman-img-wrap">
            <img
              className="chairman-img"
              src="/assets/chairman.jpg"
              alt="Mr. Pravin Upasani, Chairman & Founder of The Grand Store"
              loading="lazy"
            />
            <div className="chairman-img-badge">
              <span className="badge-gold-dot" />
              <span>CHAIRMAN & FOUNDER</span>
            </div>
          </div>
          <div className="chairman-body">
            <div className="chairman-header-line">
              <p className="chairman-kicker">CHAIRMAN STATEMENT</p>
              <div className="gold-divider-mini" />
            </div>
            <blockquote className="chairman-quote">
              “This pandemic has taught us the new order of engaging in business.
              Our response to these challenges reflects who we are as
              individuals and as an organization. It has changed the way we
              think and interact with our customers. Digitalization is an
              integral part of our transformation. We remain optimistic that this
              is a decade of great opportunity. We should capitalize on this
              opportunity and do our fair share for our market’s recovery.”
            </blockquote>
            <div className="chairman-author-block">
              <p className="chairman-author">— Mr. Pravin Upasani</p>
              <span className="chairman-role">Chairman & Founder · The Grand Store</span>
            </div>
          </div>
        </section>

        {/* Our Motto */}
        <section className="about-motto-section">
          <div className="motto-box">
            <h2 className="section-title center">Our Motto</h2>
            <p className="motto-text">
              To offer a great variety of spirits and wines from emerging and
              established companies. We ensure that our innovative solutions and
              exceptional service support and enable lasting connections between
              wineries and our valued consumer customers.
            </p>
          </div>
        </section>

        {/* Why Choose Us: Four Pillars */}
        <section className="about-reasons-section">
          <div className="reasons-header">
            <p className="reasons-eyebrow">WHY CHOOSE US</p>
            <h2 className="reasons-title">
              A better way to discover and collect
            </h2>
          </div>

          <div className="reasons-four-grid">
            {reasons.map(({ icon: Icon, title, text }) => (
              <article className="reason-card" key={title}>
                <div className="reason-icon-box">
                  <Icon size={28} weight="thin" />
                </div>
                <h3 className="reason-card-title">{title}</h3>
                <p className="reason-card-text">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom Navigation CTA */}
        <section className="about-bottom-cta">
          <div className="bottom-cta-inner">
            <span className="bottom-cta-eyebrow">READY TO EXPLORE?</span>
            <h2 className="bottom-cta-heading">
              Discover The Grand Store Catalog
            </h2>
            <p className="bottom-cta-sub">
              Browse our master collection of boutique vintages and single-barrel
              allocations.
            </p>
            <div className="bottom-cta-buttons">
              <button
                type="button"
                className="btn-gold-primary"
                onClick={onNavigateHome}
              >
                Return to Landing Page
              </button>
              <a
                href={`${STORE}/shop`}
                className="btn-gold-outline"
                target="_blank"
                rel="noreferrer"
              >
                <span>Visit Boutique</span>
                <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
