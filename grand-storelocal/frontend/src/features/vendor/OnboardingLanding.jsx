import Price from '../../components/ui/Price';
import React from 'react';
import { Store, TrendingUp, Smartphone, CreditCard, Truck, Globe, Presentation, Tag, Gavel } from 'lucide-react';

export default function OnboardingLanding({ onNext }) {
  const benefits = [
    { icon: Store, title: 'Your own online storefront', desc: 'A dedicated, premium page for your estate' },
    { icon: TrendingUp, title: 'Reach new customers', desc: 'Access to a growing luxury wine and spirits community' },
    { icon: Smartphone, title: 'Mobile-friendly catalogue', desc: 'Beautifully designed for all devices' },
    { icon: CreditCard, title: 'Secure online payments', desc: 'We handle the transaction processing securely' },
    { icon: Truck, title: 'Delivery support', desc: 'Integrated logistics for smooth fulfillment' },
    { icon: Globe, title: 'Export opportunities', desc: 'Potential international exposure' },
    { icon: Tag, title: 'Featured product opportunities', desc: 'Marketing exposure on our homepage' },
    { icon: Gavel, title: 'Access to auctions', desc: 'List your rare bottles on our exclusive auction platform' }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 fade-in">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl sm:text-5xl font-serif text-white mb-6">Become a Grand Store Vendor</h1>
        <p className="text-xl text-neutral-300 font-light">
          Put your wines and spirits in front of a growing community of customers. No upfront inventory purchase required. You remain the seller while we provide the marketplace, customer acquisition, and technology.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="mb-20">
        <h2 className="text-2xl font-serif text-white text-center mb-10">Your Grand Store Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-[#c9a35b]/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#c9a35b]/10 flex items-center justify-center text-gold-gradient mb-4">
                <benefit.icon size={24} />
              </div>
              <h3 className="text-white font-medium mb-2">{benefit.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing & Commercial Model */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto mb-16 shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#c9a35b]/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center mb-10">
          <h2 className="text-3xl font-serif text-white mb-4">Your Grand Store Package</h2>
          <p className="text-neutral-300">Transparent pricing. No hidden fees. Complete business control.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 relative z-10">
          <div className="text-center p-6 bg-neutral-950/50 rounded-xl border border-neutral-800">
            <p className="text-neutral-400 text-sm uppercase tracking-wider mb-2">Once-off Registration</p>
            <p className="text-3xl font-serif text-white"><Price amount={2500} /></p>
          </div>
          <div className="text-center p-6 bg-neutral-950/50 rounded-xl border border-[#c9a35b]/30">
            <p className="text-gold-gradient text-sm uppercase tracking-wider mb-2">Commission</p>
            <p className="text-4xl font-serif text-white">15%</p>
            <p className="text-neutral-400 text-xs mt-2">per completed sale</p>
          </div>
          <div className="text-center p-6 bg-neutral-950/50 rounded-xl border border-neutral-800">
            <p className="text-neutral-400 text-sm uppercase tracking-wider mb-2">Monthly Fee</p>
            <p className="text-3xl font-serif text-white"><Price amount={500} /></p>
          </div>
        </div>

        <div className="text-center relative z-10">
          <button 
            onClick={onNext}
            className="bg-gold-gradient hover:bg-[#e1bd70] text-white px-10 py-4 rounded-full font-medium transition-all shadow-[0_0_20px_rgba(201,163,91,0.3)] hover:shadow-[0_0_30px_rgba(201,163,91,0.5)] flex items-center justify-center mx-auto space-x-2"
          >
            <Presentation size={20} />
            <span>PREVIEW MY GRAND STORE</span>
          </button>
          <p className="text-neutral-400 text-sm mt-4">Already registered? <a href="/login" className="text-gold-gradient hover:text-[#e1bd70] underline decoration-[#c9a35b]/30 underline-offset-4">Sign in</a></p>
        </div>
      </div>

    </div>
  );
}
