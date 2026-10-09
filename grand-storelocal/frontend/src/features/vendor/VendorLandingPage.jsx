import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Globe, Users, CreditCard, Truck, BarChart3, ChevronRight, Eye } from 'lucide-react';
import PreviewStoreModal from './PreviewStoreModal';
import Price from '../../components/ui/Price';

export default function VendorLandingPage() {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-6">
          Become a Grand Store <span className="text-gold italic font-serif">Partner</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 font-light">
          Put your wines and spirits in front of a growing community of customers. 
          You bring the products. We bring the marketplace, technology, and customers.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/vendor/onboarding')}
            className="bg-gold text-black px-8 py-4 rounded-lg font-medium tracking-wide hover:bg-white transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Start Your Journey <ChevronRight size={18} />
          </button>
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="border border-white/20 text-white px-8 py-4 rounded-lg font-medium tracking-wide hover:border-gold hover:text-gold transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Eye size={18} /> Preview Your Store
          </button>
        </div>
        <p className="mt-6 text-sm text-white/40">Already registered? <a href="/login" className="text-gold hover:underline">Sign in here</a></p>
      </section>

      {/* Benefits Grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-xs tracking-widest uppercase text-gold mb-2">Why Grand Store?</h2>
          <h3 className="text-3xl font-light">Your Grand Store Benefits</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Store />, title: "Online Storefront", desc: "Your dedicated digital embassy." },
            { icon: <Users />, title: "New Customers", desc: "Tap into our growing network." },
            { icon: <Globe />, title: "Global Exposure", desc: "Potential export and trade opportunities." },
            { icon: <CreditCard />, title: "Secure Payments", desc: "We handle all payment processing." },
            { icon: <Truck />, title: "Delivery Support", desc: "Streamlined logistics and fulfillment." },
            { icon: <BarChart3 />, title: "Real-time Analytics", desc: "Track sales and store health." }
          ].map((benefit, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl hover:border-gold/30 transition-colors">
              <div className="text-gold mb-6">{benefit.icon}</div>
              <h4 className="text-lg mb-2">{benefit.title}</h4>
              <p className="text-sm text-white/50">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing / Business Model */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 mb-20">
        <div className="bg-gradient-to-br from-[#111] to-black border border-gold/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <h3 className="text-2xl font-light mb-8 relative z-10">Transparent Partnership Model</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 relative z-10">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-2">Once-off Setup</div>
              <div className="text-3xl font-mono text-gold"><Price amount={2500} /></div>
            </div>
            <div className="md:border-l md:border-r border-white/10">
              <div className="text-xs uppercase tracking-widest text-white/40 mb-2">Monthly Fee</div>
              <div className="text-3xl font-mono text-gold"><Price amount={500} /></div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-2">Sales Commission</div>
              <div className="text-3xl font-mono text-gold">15%</div>
            </div>
          </div>
          
          <p className="text-sm text-white/60 max-w-2xl mx-auto relative z-10 italic">
            "No upfront inventory purchase required by Grand Store. You remain the seller of your products while Grand Store provides the marketplace, customer acquisition and technology."
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6">
        <button 
          onClick={() => navigate('/vendor/onboarding')}
          className="bg-white text-black px-10 py-4 rounded-lg font-medium tracking-wide hover:bg-gold transition-colors"
        >
          Begin Application
        </button>
      </section>

      <PreviewStoreModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
    </div>
  );
}
