import React, { useState } from 'react';
import { Smartphone, QrCode, Mail, User, MessageSquare, Send, CheckCircle2, Phone } from 'lucide-react';
import api from '../../../api';
import AppDownloadBadges from '../../../components/AppDownloadBadges';

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
        }, 6000);
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
    <section className="bg-[#050505] py-20 lg:py-32 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--color-gold)]/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-[1240px] mx-auto px-6 relative z-10">
        
        {/* App Promo Part */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mb-32">
          {/* Phone Mockup */}
          <div className="w-full lg:w-1/2 relative group perspective-1000">
            <div className="relative w-full max-w-[400px] mx-auto transform transition-all duration-700 hover:rotate-y-[-5deg] hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-gold)]/20 to-transparent rounded-[3rem] blur-2xl transform group-hover:scale-110 transition-transform duration-700"></div>
              <img 
                src="/assets/images/app-mockup.jpg" 
                alt="The Grand Store App on Smartphone" 
                className="w-full h-auto object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] border-[4px] border-[#1a1a1a]"
              />
            </div>
          </div>

          {/* App Info & QR Code */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
              <Smartphone size={16} className="text-[var(--color-gold)]" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-ivory)]">Mobile Experience</span>
            </div>
            
            <h2 className="text-3xl lg:text-5xl font-serif text-[var(--color-ivory)] mb-4 leading-tight">
              Luxury in your <span className="text-transparent bg-clip-text bg-gold-gradient italic">pocket.</span>
            </h2>
            
            <p className="text-[var(--color-ivory-muted)] text-base lg:text-lg mb-8 max-w-md font-light leading-relaxed">
              Explore our curated selection of fine wines and premium spirits anywhere, anytime. Download The Grand Store app for exclusive offers and a seamless shopping experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#0a0a0a]/80 p-4 lg:p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl w-full max-w-lg justify-between">
              <AppDownloadBadges className="w-full flex-1 justify-center sm:justify-start" />

              <div className="hidden sm:block w-[1px] h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
              
              <div className="flex flex-col items-center gap-3">
                <a href="/app/download" className="block transition-transform hover:scale-105">
                  <div className="bg-gradient-to-tr from-[var(--color-gold)] to-[#b38d45] rounded-2xl p-[2px] shadow-[0_0_20px_rgba(217,157,57,0.3)]">
                    <div className="bg-white rounded-xl p-2 overflow-hidden">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/app/download')}&margin=0`} alt="Scan to download" className="w-28 h-28 lg:w-36 lg:h-36 rounded object-cover mix-blend-multiply" />
                    </div>
                  </div>
                </a>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-gold)] uppercase tracking-widest font-bold bg-white/5 px-3 py-1.5 rounded-full border border-[var(--color-gold)]/20">
                  <QrCode size={14} /> Scan to install
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Part */}
        <div className="w-full">
          <div className="text-center mb-12">
            <h3 className="text-3xl lg:text-4xl font-serif text-[var(--color-ivory)] mb-4">
              Get in <span className="text-[var(--color-gold)]">Touch</span>
            </h3>
            <p className="text-[var(--color-ivory-muted)] text-sm uppercase tracking-widest">We are here to assist you</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
            {/* Subtle glow effect on form */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <div className="flex flex-col gap-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="relative">
                  <User className="absolute top-1/2 -translate-y-1/2 left-4 text-[var(--color-gold)]/50" size={20} />
                  <input 
                    type="text" 
                    required
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/50 border-b-2 border-white/10 px-12 py-4 text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20 font-serif text-lg"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute top-1/2 -translate-y-1/2 left-4 text-[var(--color-gold)]/50" size={20} />
                  <input 
                    type="email" 
                    required
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black/50 border-b-2 border-white/10 px-12 py-4 text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20 font-serif text-lg"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute top-1/2 -translate-y-1/2 left-4 text-[var(--color-gold)]/50" size={20} />
                  <input 
                    type="tel" 
                    required
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black/50 border-b-2 border-white/10 px-12 py-4 text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20 font-serif text-lg"
                  />
                </div>
              </div>
              
              <div className="relative">
                <MessageSquare className="absolute top-5 left-4 text-[var(--color-gold)]/50" size={20} />
                <textarea 
                  required
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full min-h-[120px] bg-black/50 border-b-2 border-white/10 px-12 py-4 text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)] transition-colors placeholder:text-white/20 font-serif text-lg resize-none"
                ></textarea>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-6 text-center text-rose-400 text-sm font-sans bg-rose-500/10 border border-rose-500/20 py-2 px-4 rounded-xl">
                {errorMessage}
              </div>
            )}

            {submitted && (
              <div className="mt-6 text-center text-emerald-300 text-sm font-sans bg-emerald-500/10 border border-emerald-500/30 py-3 px-6 rounded-2xl flex items-center justify-center gap-2 animate-fade-in">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>Thank you! Your message has been received by our admin desk. We will get in touch shortly.</span>
              </div>
            )}

            <div className="mt-12 flex justify-center relative z-10">
              <button 
                type="submit"
                disabled={submitted || loading}
                className="group/btn relative overflow-hidden bg-[var(--color-gold)] text-black px-12 py-4 rounded-full font-bold text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-80 disabled:hover:scale-100 flex items-center gap-3 cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10">
                  {loading ? 'Sending...' : submitted ? 'Message Sent to Admin' : 'Send Message'}
                </span>
                {submitted ? (
                  <CheckCircle2 size={18} className="relative z-10 text-emerald-950" />
                ) : (
                  <Send size={18} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
