import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { subscribeCigarNewsletter } from '../api';
import './NewsletterSection.css';

function NewsletterSection() {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await subscribeCigarNewsletter(email.trim());
      setMessage({ type: 'success', text: res.message || 'Thank you for subscribing to Mcigar!' });
      setEmail('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Subscription failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="newsletter-section" id="newsletter">
      <div 
        ref={ref}
        className={`newsletter-section__inner reveal-left ${isVisible ? 'is-visible' : ''}`}
      >
        <p className="newsletter-section__eyebrow">
          Be the first to know about our new arrivals and exclusive offers.
        </p>
        <h2 className="newsletter-section__title">
          Sign Up <em>Newsletter</em>
        </h2>
        
        <form className="newsletter-section__form" onSubmit={handleSubmit}>
          <div className="newsletter-section__input-group">
            <input 
              type="email" 
              placeholder="Enter your email here.." 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="newsletter-section__input"
            />
            <button type="submit" disabled={loading} className="newsletter-section__button">
              {loading ? (
                <>Subscribing <Loader2 size={16} className="animate-spin" /></>
              ) : (
                <>Sign Up <ArrowRight size={18} strokeWidth={2} /></>
              )}
            </button>
          </div>
          {message && (
            <p style={{ marginTop: '10px', fontSize: '13px', color: message.type === 'success' ? '#4ade80' : '#f87171' }}>
              {message.text}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

export default NewsletterSection;
