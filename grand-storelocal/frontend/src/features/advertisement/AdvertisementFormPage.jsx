import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import api from '../../api';

export default function AdvertisementFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    productName: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/advertisements/request', formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center p-8 bg-[#0a0a0a] border border-[#d8b76d]/20 rounded-xl">
          <h2 className="text-[#d8b76d] font-serif text-3xl mb-4">Request Submitted</h2>
          <p className="text-[var(--color-ivory-muted)] mb-8">
            Thank you for your interest in advertising with The Grand Store. Our team will review your request and get back to you shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-[10px] rounded-md hover:bg-[#e1bd70] transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-12 px-4 relative">
      <div className="max-w-3xl mx-auto relative">
        <Link
          to="/"
          className="absolute -top-20 left-0 flex items-center gap-3 text-[var(--color-ivory-muted)] hover:text-[#c9a35b] transition-colors text-[11px] uppercase tracking-[0.2em] font-bold z-50 group"
        >
          <div className="p-2.5 border border-white/10 rounded-full group-hover:border-[#c9a35b]/30 group-hover:bg-[#c9a35b]/10 transition-all duration-300">
            <ArrowLeft size={18} />
          </div>
          Back to Store
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-[#d8b76d] font-serif text-4xl md:text-5xl mb-4">Advertise With Us</h1>
          <p className="text-[var(--color-ivory-muted)] max-w-xl mx-auto">
            Partner with The Grand Store to showcase your luxury products to our exclusive clientele.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/10 p-6 md:p-10 rounded-xl shadow-2xl">
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-[var(--color-ivory-muted)] text-[10px] font-bold uppercase tracking-widest mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="block w-full py-3 border-b border-white/10 bg-transparent text-[var(--color-ivory)] placeholder-white/20 focus:outline-none focus:border-[var(--color-gold)] sm:text-sm transition-colors rounded-none"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-[var(--color-ivory-muted)] text-[10px] font-bold uppercase tracking-widest mb-2">
                Contact Name
              </label>
              <input
                type="text"
                name="contactName"
                required
                value={formData.contactName}
                onChange={handleChange}
                className="block w-full py-3 border-b border-white/10 bg-transparent text-[var(--color-ivory)] placeholder-white/20 focus:outline-none focus:border-[var(--color-gold)] sm:text-sm transition-colors rounded-none"
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <label className="block text-[var(--color-ivory-muted)] text-[10px] font-bold uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full py-3 border-b border-white/10 bg-transparent text-[var(--color-ivory)] placeholder-white/20 focus:outline-none focus:border-[var(--color-gold)] sm:text-sm transition-colors rounded-none"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-[var(--color-ivory-muted)] text-[10px] font-bold uppercase tracking-widest mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="block w-full py-3 border-b border-white/10 bg-transparent text-[var(--color-ivory)] placeholder-white/20 focus:outline-none focus:border-[var(--color-gold)] sm:text-sm transition-colors rounded-none"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-[var(--color-ivory-muted)] text-[10px] font-bold uppercase tracking-widest mb-2">
              Product Name / Title
            </label>
            <input
              type="text"
              name="productName"
              required
              value={formData.productName}
              onChange={handleChange}
              className="block w-full py-3 border-b border-white/10 bg-transparent text-[var(--color-ivory)] placeholder-white/20 focus:outline-none focus:border-[var(--color-gold)] sm:text-sm transition-colors rounded-none"
              placeholder="What are you advertising?"
            />
          </div>

          <div className="mb-8">
            <label className="block text-[var(--color-ivory-muted)] text-[10px] font-bold uppercase tracking-widest mb-2">
              Product Description & Pitch
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="block w-full py-3 border-b border-white/10 bg-transparent text-[var(--color-ivory)] placeholder-white/20 focus:outline-none focus:border-[var(--color-gold)] sm:text-sm transition-colors rounded-none resize-none"
              placeholder="Tell us about the product and why it fits our catalog..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-4 px-4 text-[10px] uppercase tracking-widest font-bold text-black bg-[#c9a35b] hover:bg-[#e1bd70] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
            {!loading && <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
