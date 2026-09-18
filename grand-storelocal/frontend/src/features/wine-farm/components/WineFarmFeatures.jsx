import React from 'react';

const features = [
  {
    number: '01',
    title: 'Exclusive Access to Premium Wines',
    description: 'Connect directly with elite vineyards and access rare collections that stand apart. Our curated selection process ensures only the finest vintages reach your table.',
    className: 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1 lg:row-span-2 bg-[#7b263c] text-white',
    numberClass: 'text-gold-bright text-[80px] mb-[60px]',
    titleClass: 'text-white text-[32px]',
    descClass: 'text-white/85 text-[18px]'
  },
  {
    number: '02',
    title: 'Customized Marketing & Sales Support',
    description: 'We provide the tools and exposure necessary to elevate your wine brand globally.',
    className: 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1 bg-white text-ink',
    numberClass: 'text-gold text-[64px] mb-auto opacity-80',
    titleClass: 'text-ink text-[22px]',
    descClass: 'text-ink/70 text-[15px]'
  },
  {
    number: '03',
    title: 'Direct Connection with Enthusiasts',
    description: 'Build lasting relationships with a dedicated community of wine connoisseurs.',
    className: 'col-span-1 md:col-span-2 lg:col-span-1 row-span-1 bg-white text-ink',
    numberClass: 'text-gold text-[64px] mb-auto opacity-80',
    titleClass: 'text-ink text-[22px]',
    descClass: 'text-ink/70 text-[15px]'
  }
];

export default function WineFarmFeatures() {
  return (
    <section className="py-[120px] bg-[#f7f4ea] relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-[80px]">
          <span className="font-sans text-[#7b263c] text-[14px] font-bold tracking-[0.15em] uppercase block mb-4">WHY CHOOSE US</span>
          <h2 className="font-serif text-[48px] text-ink font-medium">Unparalleled Wine Experiences</h2>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className={`rounded-3xl p-10 shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(128,0,32,0.08)] ${feature.className}`}
            >
              <div className="h-full flex flex-col">
                <span className={`font-serif leading-none ${feature.numberClass}`}>{feature.number}</span>
                <div className="mt-auto">
                  <h3 className={`font-sans font-bold mt-[30px] mb-[15px] leading-[1.3] ${feature.titleClass}`}>{feature.title}</h3>
                  <p className={`leading-[1.6] ${feature.descClass}`}>{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Decorative Bento Block */}
          <div 
            className="col-span-1 md:col-span-2 lg:col-span-1 row-span-1 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(128,0,32,0.08)] bg-cover bg-center min-h-[250px]" 
            style={{ backgroundImage: "url('/assets/images/carousel-2.png')" }}
          >
            <div className="absolute bottom-0 left-0 w-full p-[30px] bg-gradient-to-t from-black/80 to-transparent text-white font-semibold font-sans text-[18px]">
              <span>Join the community</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
