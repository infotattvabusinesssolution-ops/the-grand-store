import { Sparkles, Trophy, ArrowDown, Check, Gift } from 'lucide-react'
import './BottleGiveawayPoster.css'

export default function BottleGiveawayPoster() {
  const handleScrollToNewsletter = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    
    // Smooth scroll to the newsletter section
    const target = document.getElementById('giveaway')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
      
      // Update hash without jumping
      if (window.history.pushState) {
        window.history.pushState(null, '', '#giveaway')
      }
      
      // Highlight and focus the form input
      setTimeout(() => {
        const input = target.querySelector('input[type="text"]') || target.querySelector('input[type="email"]')
        if (input) {
          input.focus()
        }
      }, 700)
    }
  }

  return (
    <section className="bottle-poster-section" id="bottle-giveaway" data-reveal>
      <div className="bottle-poster-container">
        
        {/* Section Header */}
        <div className="bottle-poster-header">
          <div className="bottle-poster-kicker">
            <Sparkles size={14} className="kicker-sparkle" />
            <span>M Collection • Private Cellar Allocation</span>
          </div>
          <h2 className="bottle-poster-title">
            Stand A Chance To Win A <em>Rare Collection Bottle</em>
          </h2>
          <p className="bottle-poster-subtitle">
            Enter our exclusive private cellar draw. One distinguished patron will be awarded a complimentary bottle of our flagship Cuvée Brut Reserve vintage sparkling wine.
          </p>
        </div>

        {/* Poster Card */}
        <div className="bottle-poster-card" onClick={handleScrollToNewsletter}>
          
          {/* Visual Poster Frame */}
          <div className="bottle-poster-image-wrap">
            <img 
              src="/assets/giveaway-bottle-poster.jpg" 
              alt="Millionaires Collection Cuvée Brut Reserve Vintage Sparkling Wine" 
              className="bottle-poster-image"
              loading="lazy"
            />
            <div className="bottle-poster-image-overlay" />
            
            <div className="bottle-poster-floating-badge">
              <Gift size={13} />
              <span>Limited Bottle Draw</span>
            </div>

            <div className="bottle-poster-trophy-badge">
              <div className="trophy-badge-icon">
                <Trophy size={18} />
              </div>
              <div className="trophy-badge-text">
                <strong>Vintage 2012</strong>
                <span>Cuvée Brut Reserve</span>
              </div>
            </div>
          </div>

          {/* Editorial / Action Details */}
          <div className="bottle-poster-info">
            <div className="poster-info-top">
              <span className="poster-cuvee-tag">Méthode Traditionnelle</span>
              <h3 className="poster-info-heading">
                The Pinnacle of Luxury. Unforgettable Moments.
              </h3>
              <p className="poster-info-desc">
                Crafted for collectors who accept only the rarest and the best. Join our private cellar list below for your official entry into the upcoming bottle allocation draw.
              </p>

              <ul className="poster-perks-list">
                <li className="poster-perk-item">
                  <span className="perk-check"><Check size={12} /></span>
                  <span>1x Bottle of M Collection Cuvée Brut Reserve (Valued R2,450)</span>
                </li>
                <li className="poster-perk-item">
                  <span className="perk-check"><Check size={12} /></span>
                  <span>Official Cellar Certificate of Authenticity &amp; Provenance</span>
                </li>
                <li className="poster-perk-item">
                  <span className="perk-check"><Check size={12} /></span>
                  <span>Priority VIP Invitation to All Future Vintage Releases</span>
                </li>
              </ul>
            </div>

            <div className="poster-action-wrap">
              <button 
                type="button" 
                onClick={handleScrollToNewsletter} 
                className="poster-cta-btn"
                aria-label="Enter draw and subscribe to newsletter"
              >
                <span>Enter Draw &amp; Subscribe Now</span>
                <span className="cta-arrow-bubble">
                  <ArrowDown size={14} />
                </span>
              </button>
              <p className="poster-disclaimer">
                * Entrants must be 18+ years of age. Winner contacted via registered email.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
