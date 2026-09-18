import React, { useState } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import api from '../api'
import './TradeContact.css'

export default function TradeContact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/trade-enquiries`, {
        fullname: formData.name,
        email: formData.email,
        message: formData.message,
        source: 'contact'
      });

      setSubmitted(true)
      setTimeout(() => {
        setFormData({ name: '', email: '', message: '' })
        setSubmitted(false)
      }, 5000)
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert(error.response?.data?.message || 'There was a problem sending your message. Please try again.');
    }
  }

  return (
    <main className="trade-subpage trade-contact">
      <div className="shell">
        <div className="trade-contact-wrapper">
          <div className="trade-contact-info">
            <span className="trade-sub-eyebrow">Get In Touch</span>
            <h1 className="trade-sub-title">Contact <span className="trade-script-accent">Us</span></h1>
            <p className="contact-lead">
              We look forward to discussing how we can partner together. Reach out to our trade specialists today.
            </p>

            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon"><Phone size={24} /></div>
                <div className="contact-text">
                  <strong>Phone</strong>
                  <a href="tel:+27824967256">+27 82 496 7256</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon"><Mail size={24} /></div>
                <div className="contact-text">
                  <strong>Mail Us</strong>
                  <a href="mailto:vendor@grandstore.co.za">vendor@grandstore.co.za</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon"><MapPin size={24} /></div>
                <div className="contact-text">
                  <strong>Visit Us</strong>
                  <span>Pivot Building, 1 Montecasino Blvd, Fourways,<br/>Sandton. Johannesburg, 2191, South Africa.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="trade-contact-form-container">
            <h3 className="form-title">Drop Us a Line</h3>
            {submitted ? (
              <div className="form-success">
                <p>Thank you for reaching out. A trade representative will contact you shortly.</p>
              </div>
            ) : (
              <form className="trade-contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    rows="5" 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
                <button type="submit" className="submit-btn">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
