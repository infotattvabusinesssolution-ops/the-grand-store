import { useEffect, useState } from "react";
import { X, ShieldCheck, FileText, LockKey } from "@phosphor-icons/react";

export default function LegalModal({ isOpen, onClose, initialTab = "privacy" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="legal-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={onClose}
    >
      <div
        className="legal-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="legal-modal-header">
          <div className="legal-header-tag">
            <ShieldCheck size={20} weight="bold" color="#dfba73" />
            <span>THE GRAND STORE · LEGAL & COMPLIANCE</span>
          </div>
          <button
            type="button"
            className="legal-modal-close"
            onClick={onClose}
            aria-label="Close legal modal"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Modal Content Tabs Header */}
        <div className="legal-modal-tabs">
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            <LockKey size={16} weight="bold" />
            <span>Privacy & Cookies Policy</span>
          </button>
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === "terms" ? "active" : ""}`}
            onClick={() => setActiveTab("terms")}
          >
            <FileText size={16} weight="bold" />
            <span>Terms & Conditions</span>
          </button>
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === "tos" ? "active" : ""}`}
            onClick={() => setActiveTab("tos")}
          >
            <ShieldCheck size={16} weight="bold" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Modal Scrollable Body with Real Authentic Grand Store Policies */}
        <div className="legal-modal-body">
          {activeTab === "privacy" && (
            <div className="legal-document-content">
              <h1 id="legal-modal-title" className="legal-title">
                Privacy & Cookies Policy
              </h1>
              <p className="legal-meta">
                Last updated: 2026 · Official Grandstore Global & Nivarp International Policy
              </p>

              <section className="legal-section">
                <h2>Overview</h2>
                <p>We respect your privacy and we will protect it.</p>
                <p>
                  This privacy policy sets out how Grandstore uses and protects any information you
                  give when you use our website. Grandstore is committed to ensuring that your
                  privacy is protected. Should we ask you to provide certain information by which
                  you can be identified when using our website, then you can be assured that it will
                  only be used in accordance with this privacy statement. The privacy policy may
                  change from time to time by updating this page. You should check this page
                  periodically to ensure that you are happy with any changes.
                </p>
              </section>

              <section className="legal-section">
                <h2>Information We Collect</h2>
                <p>We may collect the following information:</p>
                <ul>
                  <li>Contact details including your full name, email address, telephone number and physical delivery address.</li>
                  <li>Demographic information such as your postal code, province and delivery preferences across South Africa.</li>
                  <li>Your preferences including what wines and fine spirits you like to drink and how you prefer to purchase.</li>
                  <li>Other information relevant to improving the customer experience, cellar appraisals and tailoring exclusive allocations.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>What We Do with the Information We Gather</h2>
                <p>
                  We require this information to understand your needs and provide you with better
                  service, and in particular for the following reasons:
                </p>
                <ul>
                  <li>Internal record keeping and cold-chain dispatch logistics.</li>
                  <li>We may use the information to improve our reserve allocations and sommelier services.</li>
                  <li>
                    If you have opted in to receive our cellar bulletins, we periodically send you
                    emails about allocated lots, rare auctions, and private wine tastings using the
                    email address provided.
                  </li>
                  <li>
                    We may use collected wine preferences to customize the showcase according to your
                    collecting interests.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>Security & Storage</h2>
                <p>
                  We are committed to ensuring that your information is secure. In order to prevent
                  unauthorized access or disclosure, we have put in place suitable physical, electronic
                  and managerial procedures to safeguard and secure the information we collect online.
                  Payment processing utilizes 256-bit SSL encryption.
                </p>
              </section>

              <section className="legal-section">
                <h2>How We Use Cookies</h2>
                <p>
                  A cookie is a small file which asks permission to be placed on your computer’s hard
                  drive. Once you agree, the file is added and the cookie helps analyze web traffic or
                  lets you know when you visit a particular site. Cookies allow web applications to
                  respond to you as an individual.
                </p>
                <p>
                  We use traffic log cookies to identify which pages are being used. This helps us
                  analyze data about web page traffic and improve our website in order to tailor it to
                  customer needs. We only use this information for statistical analysis purposes and
                  then the data is removed from the system.
                </p>
              </section>

              <section className="legal-section">
                <h2>Controlling Your Personal Information</h2>
                <p>
                  You may choose to restrict the collection or use of your personal information in the
                  following ways:
                </p>
                <ul>
                  <li>
                    Whenever you are asked to fill in a form on the website, look for the box to
                    indicate that you do not want the information used for direct marketing.
                  </li>
                  <li>
                    If you have previously agreed to direct marketing, you may opt out at any time by
                    contacting us at <strong>info@grandstore.co.za</strong> or calling <strong>+27 82 496 7256</strong>.
                  </li>
                </ul>
                <p>
                  We will not sell, distribute or lease your personal information to third parties
                  unless we have your permission or are required by law to do so.
                </p>
              </section>

              <section className="legal-section">
                <h2>Direct Contact & Information Officer</h2>
                <p>
                  If you have queries regarding this policy, please write to:
                  <br />
                  <strong>The Grand Store Compliance Desk</strong>
                  <br />
                  Pivot Building, 1 Montecasino Blvd, Fourways, Sandton, Johannesburg, 2191, South Africa
                  <br />
                  Email: <strong>info@grandstore.co.za</strong> · Tel: <strong>+27 76 580 9522</strong>
                </p>
              </section>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="legal-document-content">
              <h1 id="legal-modal-title" className="legal-title">
                Terms & Conditions
              </h1>
              <p className="legal-meta">
                Governing Allocations, Bidding & Cellar Services · The Grand Store
              </p>

              <section className="legal-section">
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By accessing and using The Grand Store website and mobile services, you agree to be
                  bound by these Terms & Conditions. These terms govern all sales, tasting reservations,
                  auction bids, and cold-chain courier deliveries operated by The Grand Store and Nivarp
                  International (Pty) Ltd.
                </p>
              </section>

              <section className="legal-section">
                <h2>2. Age Verification Protocol (18+)</h2>
                <p>
                  In compliance with South African liquor legislation (Liquor Act 59 of 2003), you must
                  be at least 18 years of age to purchase alcoholic beverages, register for auction lots,
                  or attend private tasting experiences through The Grand Store. Age verification is
                  enforced at point of order and upon physical delivery.
                </p>
              </section>

              <section className="legal-section">
                <h2>3. Allocations & Vintage Availability</h2>
                <p>
                  All rare vintage wines, single casks, and boutique allocations are subject to cellar
                  availability and allotment limits. The Grand Store reserves the right to allocate
                  bottles on a pro-rata basis or cancel orders where estate quotas have been exhausted.
                </p>
              </section>

              <section className="legal-section">
                <h2>4. Climate Logistics & Delivery (Cold-Chain 48H)</h2>
                <p>
                  We dispatch all orders in specialized, shock-damped, temperature-controlled packaging
                  held between 12°C and 15°C. Delivery timelines are typically 48 hours to major
                  metropolitan hubs across South Africa. Complimentary cold-chain transit applies to
                  orders over R1,500.
                </p>
              </section>

              <section className="legal-section">
                <h2>5. Live Auction Protocol</h2>
                <p>
                  Bids placed during live auction events (including Prime Lot allocations) represent a
                  binding commitment to purchase. Winning bidders are notified immediately upon lot
                  closing and have 24 hours to settle escrow payment prior to cellar release.
                </p>
              </section>

              <section className="legal-section">
                <h2>6. Returns & Breakage Guarantee</h2>
                <p>
                  If any bottle arrives compromised, corked upon opening with verifiable batch provenance,
                  or damaged during transit, notify our concierge within 48 hours of receipt at{" "}
                  <strong>support@grandstore.co.za</strong> with photographic documentation for an
                  immediate replacement or full cellar credit.
                </p>
              </section>
            </div>
          )}

          {activeTab === "tos" && (
            <div className="legal-document-content">
              <h1 id="legal-modal-title" className="legal-title">
                Terms of Service
              </h1>
              <p className="legal-meta">
                Operated by Nivarp International Pvt Ltd for The Grand Store
              </p>

              <section className="legal-section">
                <h2>Overview & Scope</h2>
                <p>
                  This website is operated by Nivarp International Pvt Ltd. Throughout the site, the
                  terms “we”, “us” and “our” refer to The Grand Store. By visiting our site and/or
                  purchasing something from us, you engage in our “Service” and agree to be bound by
                  these Terms of Service.
                </p>
              </section>

              <section className="legal-section">
                <h2>Section 1: Online Store Terms</h2>
                <p>
                  By agreeing to these Terms of Service, you represent that you are at least the age
                  of majority in your country or province of residence. You may not use our products for
                  any illegal or unauthorized purpose nor may you violate any laws in your jurisdiction.
                </p>
              </section>

              <section className="legal-section">
                <h2>Section 2: Pricing & Service Modifications</h2>
                <p>
                  Prices for rare allocations and spirits are subject to change without notice. We
                  reserve the right at any time to modify or discontinue the Service (or any part
                  thereof) without liability to you or any third party.
                </p>
              </section>

              <section className="legal-section">
                <h2>Section 3: Governing Law</h2>
                <p>
                  These Terms of Service and any separate agreements whereby we provide you Services
                  shall be governed by and construed in accordance with the laws of the Republic of South
                  Africa.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="legal-modal-footer-bar">
          <span className="legal-footer-note">
            The Grand Store Global · Pivot Building, Montecasino Blvd, Sandton
          </span>
          <button type="button" className="legal-modal-btn" onClick={onClose}>
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}
