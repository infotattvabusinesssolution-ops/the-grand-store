import React from 'react';

const steps = [
  {
    icon: '/assets/images/discover.png',
    title: 'Discover',
    desc: 'our wine and spirits destinations worldwide for your next luxury holiday.'
  },
  {
    icon: '/assets/images/choose.png',
    title: 'CHOOSE',
    desc: 'to customize a tailor-made trip with a local expert or plan on your own.'
  },
  {
    icon: '/assets/images/contact.png',
    title: 'CONTACT',
    desc: 'our local travel experts or our wineries, distilleries, hotels & restaurants by simply filling out a form.'
  },
  {
    icon: '/assets/images/book.png',
    title: 'BOOK',
    desc: 'an unforgettable travel experience unique to Wine Paths. Relax & enjoy!'
  }
];

export default function WineFarmEstates() {
  return (
    <section className="py-[120px] bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-[80px]">
          <h2 className="font-sans text-[32px] font-normal text-ink">Get access to the most exclusive estates all over the world</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px] lg:gap-x-[30px] sm:gap-y-[40px] py-5">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className={`relative bg-[#fcfbf8] rounded-2xl p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-black/5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2.5 hover:shadow-[0_20px_40px_rgba(128,0,32,0.08)] hover:border-[#800020]/10 group ${idx % 2 !== 0 ? 'lg:translate-y-10 lg:hover:translate-y-[30px]' : ''}`}
            >
              <div className="absolute -top-5 -right-2.5 font-serif text-[120px] font-bold text-[#800020]/[0.03] leading-none pointer-events-none transition-colors duration-400 ease-in-out group-hover:text-[#800020]/[0.06]">
                0{idx + 1}
              </div>
              <div className="w-[80px] h-[80px] mx-auto mb-[30px] bg-white rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.05)] relative z-10">
                <img src={step.icon} alt={step.title} className="w-[40px] h-[40px] object-contain" />
              </div>
              <h3 className="font-sans text-[16px] font-bold text-ink uppercase tracking-[0.1em] mb-[15px] relative z-10">{step.title}</h3>
              <p className="font-sans text-[14px] leading-[1.6] text-ink/60 relative z-10">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
