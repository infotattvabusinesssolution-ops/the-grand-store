import React from 'react';
import { Megaphone, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import Price from '../../components/ui/Price';

export default function VendorMarketing() {
  const goldTextClass = "text-[#c9a35b] ";
  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4 leading-tight">
            Marketing <span className={goldTextClass} >Centre</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light leading-relaxed">
            Grow your business by participating in Grand Store campaigns, curated collections, and promotions.
          </p>
        </div>
        
        {/* Vendor Level Badge */}
        <div className="border-l-2 border-[var(--color-gold)] pl-6 py-2 flex items-center gap-4">
          <div className="p-3 bg-[#c9a35b] text-black rounded-full">
            <Star size={24} className="fill-black" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#e1bd70] font-bold mb-1">Current Status</div>
            <div className="font-serif text-xl text-white">Verified Vendor</div>
          </div>
        </div>
      </section>

      {/* Active Campaigns */}
      <section>
        <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-6 flex items-center gap-3">
          <Megaphone className="text-[#e1bd70]" />
          Active Campaigns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[var(--color-gold)]/40 transition-all">
            <div className="absolute inset-0 bg-black/75 z-10"></div>
            <img src="/assets/categories/wine-dark.png" alt="Campaign" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40 mix-blend-screen" />
            <div className="relative z-20 p-8 h-full flex flex-col justify-end min-h-[300px]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest font-bold mb-4 w-max">
                Closes in 5 Days
              </div>
              <h4 className="text-3xl font-serif text-white mb-2">Women's Month Showcase</h4>
              <p className="text-[var(--color-ivory-muted)] text-sm font-light mb-6">Submit your products by 20 August. Grand Store will heavily promote selected products across the platform and our newsletter.</p>
              <button className="flex items-center justify-center gap-2 w-full py-3 bg-[#c9a35b] text-black rounded-full font-bold uppercase tracking-widest text-xs  transition-all">
                Submit Products
              </button>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[var(--color-gold)]/40 transition-all bg-[#0a0a0a]">
            <div className="absolute inset-0 bg-black/75 z-10"></div>
            <div className="relative z-20 p-8 h-full flex flex-col justify-end min-h-[300px]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-widest font-bold mb-4 w-max">
                Ongoing
              </div>
              <h4 className="text-3xl font-serif text-white mb-2">Weekend Flash Sales</h4>
              <p className="text-[var(--color-ivory-muted)] text-sm font-light mb-6">Offer a minimum of 15% off to be featured on our homepage every Friday-Sunday. Boost volume instantly.</p>
              <button className="flex items-center justify-center gap-2 w-full py-3 border border-[var(--color-gold)]/40 text-[#e1bd70] rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[var(--color-gold)]/10 transition-all">
                Create Promotion
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Curated Collections */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-serif text-[var(--color-ivory)]">Grand Store Collections</h3>
          <p className="text-sm text-[var(--color-ivory-muted)]">Apply to have your products featured.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Best South African Reds", icon: "🍷", status: "Open" },
            { title: "Sparkling for Celebrations", icon: "🥂", status: "Open" },
            { title: "Rare & Collectible", icon: "💎", status: "Invite Only" },
            { title: "Whisky Under <Price amount={1000} />", icon: "🥃", status: "Open" },
            { title: "Corporate Gifts", icon: "🎁", status: "Open" },
            { title: "Proudly South African", icon: "🇿🇦", status: "Open" }
          ].map((collection, idx) => (
            <div key={idx} className="p-5 border-b border-white/10 flex items-center justify-between hover:border-[var(--color-gold)]/40 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{collection.icon}</span>
                <div>
                  <h5 className="text-[var(--color-ivory)] font-medium text-sm group-hover:text-[#e1bd70] transition-colors">{collection.title}</h5>
                  <span className={`text-[9px] uppercase tracking-widest font-semibold ${collection.status === 'Open' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {collection.status}
                  </span>
                </div>
              </div>
              <ArrowRight size={16} className="text-[var(--color-ivory-muted)] group-hover:text-[#e1bd70] transition-colors" />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
