import { useState } from 'react'
import { ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react'
import { subscribeNewsletter } from '../api'
import './Newsletter.css'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!email || submitting) return
    setError('')
    setSubmitting(true)

    try {
      await subscribeNewsletter(email)
      setSubscribed(true)
    } catch (err) {
      setError(err.message || 'Unable to subscribe. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="newsletter-section">
      <div className="newsletter-visual" aria-hidden="true" />
      <div className="newsletter-inner" data-reveal>
        <p className="eyebrow">The private list</p>
        <h2>Subscribe to<br />our newsletter.</h2>
        <p>Stay updated with our latest wines, offers, and events.</p>
        {subscribed ? (
          <div className="newsletter-success">
            <Check size={18} /> Welcome to the collection.
          </div>
        ) : (
          <div>
            <form onSubmit={submit}>
              <input 
                type="email" 
                aria-label="Email address" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required 
              />
              <button 
                type="submit" 
                aria-label="Subscribe"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 size={18} className="newsletter-spin" />
                ) : (
                  <ArrowRight size={19} />
                )}
              </button>
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
