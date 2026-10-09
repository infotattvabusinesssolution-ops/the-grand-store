import React from 'react';

export default function WineFarmSpecials() {
  return (
    <section className="py-[100px] bg-[#f7f4ea]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-[60px]">
          <h2 className="font-serif text-[38px] text-ink font-medium">Get The Specials</h2>
          <a 
            href="#" 
            className="inline-block bg-[#7b263c] text-white font-sans font-bold uppercase tracking-[0.1em] text-[13px] px-8 py-4 rounded-sm no-underline transition-all duration-300 hover:bg-ink hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
          >
            Advertise With Us
          </a>
        </div>
        
        <div className="flex flex-col gap-10">
          {/* Top Card: Flight */}
          <div className="relative rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] w-full group hover:-translate-y-1 hover:shadow-[0_30px_50px_rgba(0,0,0,0.12)]">
            <img 
              src="/assets/images/flight.png" 
              alt="Flight to Victoria Falls" 
              className="block w-full h-auto object-cover transition-transform duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]" 
            />
          </div>
          
          {/* Bottom Card: Resort */}
          <div className="relative rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] w-full group hover:-translate-y-1 hover:shadow-[0_30px_50px_rgba(0,0,0,0.12)]">
            <img 
              src="/assets/images/resort.png" 
              alt="Resort in Zambia" 
              className="block w-full h-auto object-cover transition-transform duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
