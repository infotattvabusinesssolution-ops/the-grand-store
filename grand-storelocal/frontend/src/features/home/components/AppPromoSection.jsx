import React, { useState } from 'react';
import { 
  Smartphone, QrCode, Mail, User, MessageSquare, Send, 
  CheckCircle2, Phone, Clock, ShieldCheck 
} from 'lucide-react';
import api from '../../../api';
import AppDownloadBadges from '../../../components/AppDownloadBadges';
import ProteaEmblem from './ProteaEmblem';
import ArrivalsMandala from './ArrivalsMandala';
import TribalCardBorder from './TribalCardBorder';

export default function AppPromoSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const res = await api.post('/trade-enquiries', {
        fullname: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        source: 'app_promo'
      });

      if (res.data && res.data.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => {
          setSubmitted(false);
        }, 8000);
      } else {
        setErrorMessage(res.data?.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      const msg = err.response?.data?.message || 'Network error. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="arrivals-section showcase-section relative w-full bg-[#0a0c0e] text-white py-16 lg:py-24 overflow-hidden select-none" id="app-promo">
      {/* Subtle Background Mandala: gentle and delicate ("just a little bit only mandala") */}
      <ArrivalsMandala 
        gradientId="mandala-promo-subtle" 
        position="top-right" 
        className="opacity-15 md:opacity-20 max-w-[500px] pointer-events-none" 
      />

      {/* Ambient subtle golden glow */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#caa458]/5 pointer-events-none rounded-full blur-[140px] opacity-50 z-0" />

      <div className="shell relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Top Part: Mobile App Experience */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mb-24 md:mb-28">
          {/* Phone Mockup */}
          <div className="w-full lg:w-1/2 relative group perspective-1000">
            <div className="relative w-full max-w-[380px] mx-auto transform transition-all duration-700 hover:rotate-y-[-4deg] hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#caa458]/20 to-transparent rounded-[3rem] blur-2xl transform group-hover:scale-110 transition-transform duration-700"></div>
              <img 
                src="/assets/images/app-mockup.jpg" 
                alt="The Grand Store Mobile App" 
                className="w-full h-auto object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[2.5rem] border-[4px] border-[#1f2226]"
              />
            </div>
          </div>

          {/* App Info & QR Code */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5 backdrop-blur-md">
              <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#caa458]">Mobile Experience</span>
            </div>
            
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.02em] text-white font-serif mb-4 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Luxury in your <span className="italic text-[#caa458]">pocket.</span>
            </h2>
            
            <p className="text-[#a0a4a8] text-sm sm:text-base mb-7 max-w-md font-light leading-relaxed font-sans">
              Explore our curated selection of rare fine wines and premium spirits anywhere, anytime. Download The Grand Store app for cellar release alerts and seamless concierge access.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-b from-[#181a1d] to-[#0f1114] p-4 lg:p-5 rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg justify-between">
              <AppDownloadBadges className="w-full flex-1 justify-center sm:justify-start" />

              <div className="hidden sm:block w-[1px] h-28 bg-gradient-to-b from-transparent via-white/15 to-transparent"></div>
              
              <div className="flex flex-col items-center gap-2.5">
                <a href="/app/download" className="block transition-transform hover:scale-105">
                  <div className="bg-gradient-to-tr from-[#caa458] to-[#875f1a] rounded-xl p-[2px] shadow-[0_0_20px_rgba(202,164,88,0.25)]">
                    <div className="bg-white rounded-[10px] p-1.5 overflow-hidden">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/app/download')}&margin=0`} 
                        alt="Scan to download" 
                        className="w-24 h-24 lg:w-28 lg:h-28 rounded object-cover mix-blend-multiply" 
                      />
                    </div>
                  </div>
                </a>
                <div className="flex items-center gap-1.5 text-[10px] text-[#caa458] uppercase tracking-widest font-bold bg-white/5 px-3 py-1 rounded-full border border-[#caa458]/20">
                  <QrCode size={12} /> Scan to install
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Part - Completely Redesigned to South African Grand Store Luxury Theme */}
        <div className="w-full" id="contact-desk">
          
          {/* Section Heading */}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4 relative">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#caa458]">
                  PRIVATE CLIENT CONCIERGE & CELLAR DESK
                </span>
                <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
              </div>

              <h2 
                className="text-3xl sm:text-4xl lg:text-[46px] font-normal tracking-[-0.02em] leading-tight m-0 text-white font-serif"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Get in Touch
              </h2>

              <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#a0a4a8] mt-3 mb-0 max-w-xl font-sans">
                Whether you are sourcing a rare Cape allocation, scheduling private estate tastings, or inquiring about corporate cellaring, our curators are at your service.
              </p>
            </div>
          </div>

          {/* Luxury Card Form Container */}
          <div className="arrival-luxury-card relative w-full bg-gradient-to-b from-[#1c1f24] via-[#14161a] to-[#0c0e10] border border-white/[0.09] hover:border-[#caa458]/40 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
            
            {/* Subtle internal mandala background watermark: just a touch ("a little bit only") */}
            <div className="absolute -top-20 -right-20 w-80 h-80 opacity-[0.07] pointer-events-none select-none overflow-hidden" aria-hidden="true">
              <ArrivalsMandala gradientId="mandala-form-inner" position="top-right" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12 relative z-10">
              
              {/* Left Column: Concierge Info Desk (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-8 lg:pb-0 lg:pr-10">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#caa458]/10 border border-[#caa458]/30 flex items-center justify-center mb-5">
                    <ProteaEmblem className="w-6 h-6 text-[#caa458]" />
                  </div>

                  <h3 
                    className="text-2xl font-serif text-white mb-2"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Cape Town & Global Concierge
                  </h3>
                  
                  <p className="text-[13.5px] text-[#a0a4a8] font-light leading-relaxed mb-6 font-sans">
                    Direct access to certified sommeliers, spirit specialists, and private cellar curators across South Africa and international ports.
                  </p>

                  {/* Direct Contact Channels */}
                  <div className="space-y-3 mb-6">
                    {/* WhatsApp */}
                    <a 
                      href="https://wa.me/27824967256" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/40 border border-white/[0.07] hover:border-[#caa458]/50 hover:bg-black/60 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#caa458]/15 text-[#caa458] flex items-center justify-center shrink-0">
                        <Phone size={15} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <div className="text-[10px] uppercase tracking-widest text-[#caa458] font-semibold">WhatsApp Concierge</div>
                        <div className="text-[13px] font-medium text-white group-hover:text-[#caa458] transition-colors truncate">
                          +27 82 496 7256
                        </div>
                      </div>
                    </a>

                    {/* Email */}
                    <a 
                      href="mailto:orders@grandstoreglobal.com" 
                      className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/40 border border-white/[0.07] hover:border-[#caa458]/50 hover:bg-black/60 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#caa458]/15 text-[#caa458] flex items-center justify-center shrink-0">
                        <Mail size={15} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <div className="text-[10px] uppercase tracking-widest text-[#caa458] font-semibold">Private Desk Email</div>
                        <div className="text-[13px] font-medium text-white group-hover:text-[#caa458] transition-colors truncate">
                          orders@grandstoreglobal.com
                        </div>
                      </div>
                    </a>

                    {/* Hours */}
                    <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/40 border border-white/[0.07]">
                      <div className="w-9 h-9 rounded-lg bg-white/5 text-[#a0a4a8] flex items-center justify-center shrink-0">
                        <Clock size={15} />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-widest text-[#a0a4a8] font-semibold">Cellar Hours</div>
                        <div className="text-[12.5px] text-[#e0e3e7]">Mon – Sat: 08:00 – 18:00 SAST</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Guarantee */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-[#caa458] font-medium">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>Confidential private advisory & rapid response</span>
                </div>
              </div>

              {/* Right Column: Interactive Form (7 cols) */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="space-y-5">
                  

                  {/* Name and Email in 2 columns on sm+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a0a4a8] mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute top-1/2 -translate-y-1/2 left-3.5 text-[#caa458]/60" size={16} />
                        <input 
                          type="text" 
                          required
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 focus:border-[#caa458] focus:ring-1 focus:ring-[#caa458]/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/25 text-sm font-sans outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a0a4a8] mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute top-1/2 -translate-y-1/2 left-3.5 text-[#caa458]/60" size={16} />
                        <input 
                          type="email" 
                          required
                          placeholder="client@domain.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 focus:border-[#caa458] focus:ring-1 focus:ring-[#caa458]/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/25 text-sm font-sans outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a0a4a8] mb-1.5">
                      Phone Number / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute top-1/2 -translate-y-1/2 left-3.5 text-[#caa458]/60" size={16} />
                      <input 
                        type="tel" 
                        placeholder="+27 (0) ... or international"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 focus:border-[#caa458] focus:ring-1 focus:ring-[#caa458]/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/25 text-sm font-sans outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a0a4a8] mb-1.5">
                      Your Message / Bottle Request *
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute top-3.5 left-3.5 text-[#caa458]/60" size={16} />
                      <textarea 
                        required
                        rows={4}
                        placeholder="Please share your vintage preferences, cellar requirements, or event inquiries..."
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 focus:border-[#caa458] focus:ring-1 focus:ring-[#caa458]/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/25 text-sm font-sans outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Error & Success Feedback */}
                  {errorMessage && (
                    <div className="text-rose-300 text-xs font-sans bg-rose-950/40 border border-rose-500/30 p-3 rounded-lg">
                      {errorMessage}
                    </div>
                  )}

                  {submitted && (
                    <div className="text-emerald-300 text-xs sm:text-sm font-sans bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-lg flex items-center gap-2.5">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      <span>Your inquiry has been received by our Cellar Desk. A concierge will be in touch shortly.</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button 
                      type="submit"
                      disabled={submitted || loading}
                      className="w-full sm:w-auto bg-[#caa458] hover:bg-[#d8b566] text-black font-bold text-xs tracking-[0.2em] uppercase py-3.5 px-8 rounded-lg shadow-[0_3px_15px_rgba(202,164,88,0.35)] hover:shadow-[0_5px_22px_rgba(202,164,88,0.5)] transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span>TRANSMITTING...</span>
                      ) : submitted ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>ENQUIRY DISPATCHED</span>
                        </>
                      ) : (
                        <>
                          <span>SEND CONCIERGE ENQUIRY</span>
                          <Send size={14} />
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-[#8f959e] font-sans">
                      Protected by Grand Store Client Privacy Protocol
                    </span>
                  </div>
                </form>
              </div>
            </div>

            {/* Authentic South African Tribal Geometric Gold Border Strip */}
            <TribalCardBorder />
          </div>
        </div>

      </div>
    </section>
  );
}
