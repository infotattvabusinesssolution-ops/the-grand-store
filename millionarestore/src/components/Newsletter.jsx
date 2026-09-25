import { useState, useEffect } from 'react'
import { ArrowRight, Check, Loader2, AlertCircle, Sparkles, Trophy } from 'lucide-react'
import { subscribeNewsletter } from '../api'
import './Newsletter.css'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [isGiveawayMode, setIsGiveawayMode] = useState(false)

  useEffect(() => {
    const checkGiveaway = () => {
      const hash = window.location.hash.toLowerCase()
      const search = window.location.search.toLowerCase()
      if (hash.includes('win') || hash.includes('giveaway') || search.includes('win') || search.includes('giveaway')) {
        setIsGiveawayMode(true)
        const el = document.getElementById('giveaway')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }

    checkGiveaway()
    window.addEventListener('hashchange', checkGiveaway)
    return () => window.removeEventListener('hashchange', checkGiveaway)
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (!email || submitting) return
    setError('')
    setSubmitting(true)

    try {
      await subscribeNewsletter({
        email,
        name,
        phone,
        source: 'millionaires-collection',
        isGiveawayEntry: true,
      })
      setSubscribed(true)
    } catch (err) {
      setError(err.message || 'Unable to submit entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={`newsletter-section ${isGiveawayMode ? 'is-giveaway-highlight' : ''}`} id="giveaway">
      <div className="newsletter-visual" aria-hidden="true" />
      <div className="newsletter-inner" data-reveal>
        <div className="eyebrow-row">
          <Sparkles size={14} className="eyebrow-icon" />
          <p className="eyebrow">
            {isGiveawayMode ? 'M Collection Exclusive Bottle Draw' : 'The private list'}
          </p>
        </div>

        <h2>
          {isGiveawayMode ? (
            <>Stand a chance to win<br />The Brut Reserve.</>
          ) : (
            <>Subscribe to<br />our newsletter.</>
          )}
        </h2>

        <p>
          {isGiveawayMode
            ? 'Enter your details below to join the private cellar list and secure your entry into our limited-edition M Collection Champagne bottle draw.'
            : 'Stay updated with our latest vintage releases, private cellar allocations, and invitation-only tastings.'}
        </p>

        {subscribed ? (
          <div className="newsletter-success">
            <Trophy size={24} className="trophy-icon" />
            <div>
              <strong>Entry Confirmed!</strong>
              <p>You are officially entered into the M Collection Bottle Draw. Winners will be drawn and contacted via our live cellar allocation system.</p>
            </div>
          </div>
        ) : (
          <div className="giveaway-form-wrap">
            <form onSubmit={submit} className="giveaway-entry-form">
              {isGiveawayMode && (
                <div className="form-row-grid">
                  <input
                    type="text"
                    aria-label="Full Name"
                    placeholder="Your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                  />
                  <input
                    type="tel"
                    aria-label="Phone Number"
                    placeholder="Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              )}

              <div className="email-input-row">
                <input 
                  type="email" 
                  aria-label="Email address" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required 
                />
                <button 
                  type="submit" 
                  aria-label={isGiveawayMode ? "Click to Win" : "Subscribe"}
                  disabled={submitting}
                  className="submit-btn"
                >
                  {submitting ? (
                    <Loader2 size={18} className="newsletter-spin" />
                  ) : isGiveawayMode ? (
                    <span className="btn-label-win">
                      <span>ENTER DRAW &amp; WIN</span>
                      <ArrowRight size={17} />
                    </span>
                  ) : (
                    <ArrowRight size={19} />
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="newsletter-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
