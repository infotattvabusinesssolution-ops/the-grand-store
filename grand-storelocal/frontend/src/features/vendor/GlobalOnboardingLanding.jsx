import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ShieldCheck, TrendingUp, Truck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function GlobalOnboardingLanding() {
  const benefits = [
    {
      icon: <Globe size={40} className="text-gold-gradient drop-shadow-[0_0_15px_rgba(201,163,91,0.6)]" />,
      title: "Global Reach, Local Curation",
      desc: "Tap into a curated audience of collectors and enthusiasts across our network. We position your winery alongside the world's most prestigious estates."
    },
    {
      icon: <TrendingUp size={40} className="text-gold-gradient drop-shadow-[0_0_15px_rgba(201,163,91,0.6)]" />,
      title: "Premium Positioning",
      desc: "Our platform is designed for luxury. Your wines will never be discounted or placed alongside mass-market brands."
    },
    {
      icon: <ShieldCheck size={40} className="text-gold-gradient drop-shadow-[0_0_15px_rgba(201,163,91,0.6)]" />,
      title: "Brand Protection",
      desc: "You control your pricing, your allocations, and your brand story. We provide the platform; you provide the excellence."
    },
    {
      icon: <Truck size={40} className="text-gold-gradient drop-shadow-[0_0_15px_rgba(201,163,91,0.6)]" />,
      title: "Streamlined Logistics",
      desc: "We assist with cross-border logistics, customs documentation, and climate-controlled storage solutions."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0907] pt-0 pb-20 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c9a35b]/10 via-[#0a0907]/0 to-[#0a0907]/0 pointer-events-none rounded-full blur-3xl opacity-80 mix-blend-screen translate-x-1/4 -translate-y-1/4"></div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 border-b border-[#c9a35b]/50 text-[#e6c97a] text-xs font-bold tracking-[0.2em] uppercase mb-8 shadow-[0_4px_10px_-4px_rgba(201,163,91,0.3)]">
              <Globe size={14} className="drop-shadow-[0_0_5px_rgba(201,163,91,0.8)]" /> International Partner Program
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-[#eee8dd] mb-8 leading-tight tracking-wide drop-shadow-lg">
              Bring Your Estate to <span className="text-[#c9a35b]">The Grand Store</span>
            </h1>
            <p className="text-[#918a7f] text-xl font-light mb-12 max-w-xl leading-relaxed">
              We are actively sourcing exceptional international wines for our discerning clientele. Join a curated portfolio of the world's finest estates.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                to="/vendor/onboarding" 
                className="inline-flex justify-center items-center gap-3 px-10 py-5 bg-[#c9a35b] text-black font-bold uppercase tracking-[0.2em] text-xs hover:brightness-110 transition-all shadow-[0_0_30px_rgba(201,163,91,0.3)] hover:shadow-[0_0_50px_rgba(201,163,91,0.5)] rounded-sm"
              >
                Apply Now <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[500px] lg:h-[700px] rounded-none overflow-hidden group"
          >
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2070&auto=format&fit=crop)' }} />
            {/* Edge fades so it blends perfectly into the black background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0907]/40 to-[#0a0907]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0907] via-transparent to-[#0a0907]/40" />
            <div className="absolute inset-0 bg-gradient-to-l from-[#0a0907] via-transparent to-[#0a0907]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0907] via-transparent to-[#0a0907]/40" />
          </motion.div>
        </div>

        {/* Value Proposition - Floating Glowy Icons */}
        <div className="mb-40 relative z-10">
          <div className="text-center mb-20 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-[#c9a35b]/10 blur-3xl rounded-full"></div>
            <h2 className="text-4xl md:text-6xl font-serif text-[#eee8dd] mb-6 relative z-10">Why Partner With Us?</h2>
            <p className="text-[#918a7f] text-xl font-light max-w-2xl mx-auto relative z-10">We understand that importing and distributing luxury wine requires care, precision, and the right audience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="flex flex-col items-start"
              >
                <div className="mb-8 p-1 relative">
                  <div className="absolute inset-0 bg-[#c9a35b]/20 blur-xl rounded-full"></div>
                  <div className="relative z-10">{benefit.icon}</div>
                </div>
                <h3 className="text-3xl font-serif text-[#eee8dd] mb-4 tracking-wide">{benefit.title}</h3>
                <p className="text-[#918a7f] text-lg font-light leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Glowing Timeline Process */}
        <div className="relative mb-32 z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-serif text-[#eee8dd] tracking-wide mb-6">Application Process</h2>
            <p className="text-[#918a7f] text-xl font-light max-w-2xl mx-auto">A streamlined journey from application to your first global sale.</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            {/* The glowing line */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#c9a35b] to-transparent shadow-[0_0_15px_rgba(201,163,91,0.8)] z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-[#0a0907] border border-[#c9a35b] rounded-full flex items-center justify-center text-[#e6c97a] font-serif text-2xl mx-auto mb-8 shadow-[0_0_20px_rgba(201,163,91,0.4)] group-hover:shadow-[0_0_30px_rgba(201,163,91,0.8)] transition-all duration-500">1</div>
                <h4 className="text-2xl font-serif text-white mb-4">Submit Application</h4>
                <p className="text-[#918a7f] font-light text-lg">Tell us about your estate, history, and available allocations.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-[#0a0907] border border-[#c9a35b] rounded-full flex items-center justify-center text-[#e6c97a] font-serif text-2xl mx-auto mb-8 shadow-[0_0_20px_rgba(201,163,91,0.4)] group-hover:shadow-[0_0_30px_rgba(201,163,91,0.8)] transition-all duration-500">2</div>
                <h4 className="text-2xl font-serif text-white mb-4">Curation Review</h4>
                <p className="text-[#918a7f] font-light text-lg">Our sommeliers review your portfolio for alignment with our clientele.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-[#0a0907] border border-[#c9a35b] rounded-full flex items-center justify-center text-[#e6c97a] font-serif text-2xl mx-auto mb-8 shadow-[0_0_20px_rgba(201,163,91,0.4)] group-hover:shadow-[0_0_30px_rgba(201,163,91,0.8)] transition-all duration-500">3</div>
                <h4 className="text-2xl font-serif text-white mb-4">Onboarding</h4>
                <p className="text-[#918a7f] font-light text-lg">Configure your storefront, logistics, and launch your pavilion.</p>
              </motion.div>
            </div>
          </div>
          
          <div className="mt-24 text-center relative z-10">
            <Link 
              to="/vendor/onboarding" 
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gold-gradient text-black font-bold uppercase tracking-[0.2em] text-xs hover:brightness-110 transition-all rounded-sm shadow-[0_0_30px_rgba(201,163,91,0.3)] hover:shadow-[0_0_50px_rgba(201,163,91,0.5)]"
            >
              Start the process <ArrowRight size={18} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
