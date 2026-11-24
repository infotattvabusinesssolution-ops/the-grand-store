import React, { useState } from 'react'
import api from '../api'
import './TradePartnerEnquiry.css'

export default function TradePartnerEnquiry() {
  const [formData, setFormData] = useState({ 
    fullname: '', 
    email: '', 
    phone: '', 
    companyname: '', 
    website: '',
    signatoryTitle: '',
    electronicSignature: '',
    tradeAgreementAccepted: true,
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Simulate honeypot
    if (formData.website) {
      setSubmitted(true)
      return
    }
    
    try {
      await api.post(`/trade-enquiries`, {
        ...formData,
        signedAt: new Date().toISOString()
      });

      setSubmitted(true)
      setTimeout(() => {
        setFormData({ 
          fullname: '', 
          email: '', 
          phone: '', 
          companyname: '', 
          website: '',
          signatoryTitle: '',
          electronicSignature: '',
          tradeAgreementAccepted: true,
        })
        setSubmitted(false)
      }, 5000)
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(error.response?.data?.message || 'There was a problem submitting your enquiry. Please try again.');
    }
  }

  return (
    <main className="trade-subpage trade-enquiry">
      <div className="shell trade-enquiry-container">
        <div className="trade-enquiry-image">
          <div className="image-frame-gold">
            <img src="/assets/trade/enquiry.jpeg" alt="Partner Enquiry" />
          </div>
        </div>
        <div className="trade-enquiry-content">
          <div className="trade-contact-form-container enquiry-form-container">
            <span className="trade-sub-eyebrow">Get Started</span>
            <h1 className="form-title trade-enquiry-title">Apply for <span className="trade-script-accent">Trade</span></h1>
            
            {submitted ? (
              <div className="form-success mt-2">
                <p>Thank you for your enquiry. Our trade team will review your application and contact you shortly.</p>
              </div>
            ) : (
              <form className="trade-contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group half-width">
                    <label htmlFor="fullname">Full Name</label>
                    <input 
                      type="text" 
                      id="fullname" 
                      required 
                      placeholder="Full Name"
                      value={formData.fullname}
                      onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    />
                  </div>
                  <div className="form-group half-width">
                    <label htmlFor="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      required 
                      placeholder="e-Mail"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    required 
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                {/* Honeypot hidden field */}
                <input 
                  type="hidden" 
                  id="website" 
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
                
                <div className="form-group">
                  <label htmlFor="companyname">Company Name</label>
                  <input 
                    type="text" 
                    id="companyname" 
                    required 
                    placeholder="Company Name"
                    value={formData.companyname}
                    onChange={(e) => setFormData({...formData, companyname: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="signatoryTitle">Signatory Title / Capacity</label>
                  <input 
                    type="text" 
                    id="signatoryTitle" 
                    required 
                    placeholder="e.g. Managing Director, Beverage Director, Buyer"
                    value={formData.signatoryTitle}
                    onChange={(e) => setFormData({...formData, signatoryTitle: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="electronicSignature">Electronic Signature (Type Legal Name)</label>
                  <input 
                    type="text" 
                    id="electronicSignature" 
                    required 
                    placeholder="Type your full legal name to sign"
                    value={formData.electronicSignature}
                    onChange={(e) => setFormData({...formData, electronicSignature: e.target.value})}
                  />
                  {formData.electronicSignature && (
                    <div className="mt-2 p-3 bg-black/60 border border-white/10 rounded text-center">
                      <span className="font-serif italic text-xl text-[#c9a35b]">
                        {formData.electronicSignature}
                      </span>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                        ECTA 25/2002 Certified Electronic Sign-off &bull; NIVARP INTERNATIONAL PTY LTD
                      </p>
                    </div>
                  )}
                </div>

                <div className="form-group agreement-checkbox">
                  <label className="flex items-start gap-2.5 text-xs text-white/70 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required 
                      checked={formData.tradeAgreementAccepted}
                      onChange={(e) => setFormData({...formData, tradeAgreementAccepted: e.target.checked})}
                      className="mt-0.5 accent-[#c9a35b]"
                    />
                    <span>
                      I agree to the <strong>Grand Store B2B Trade Agreement &amp; Wholesale Terms</strong> (NIVARP INTERNATIONAL PTY LTD, Reg: 2015/268820/07).
                    </span>
                  </label>
                </div>
                
                <button type="submit" className="submit-btn mt-10">Submit Now</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
