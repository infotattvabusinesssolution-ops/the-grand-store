import React from 'react';

export default function WineFarmAbout() {
  return (
    <section className="py-[100px] bg-[#fcfbf8] relative">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
        <div className="flex flex-col lg:flex-row items-center gap-[50px] lg:gap-[60px]">
          
          <div className="flex-1 max-w-full lg:max-w-[500px] text-center lg:text-left">
            <span className="font-sans text-[12px] font-bold text-[#7b263c] tracking-[0.15em] uppercase inline-block mb-3">
              The Grand Store
            </span>
            <h2 className="font-serif text-[36px] text-ink font-medium leading-[1.2] mb-6">
              Welcome to South African Wine Farms Estate
            </h2>
            
            <div className="mb-[30px]">
              <p className="font-sans text-[15px] leading-[1.6] text-ink/70 mb-4">
                We've crafted a unique platform tailored specifically for wine farmers from South Africa and beyond. Our mission is to provide a seamless way for vineyards to showcase their products and reach a global audience. Whether you're a small family-run vineyard or a larger estate, our portal is designed to help you expand your market presence and connect with wine lovers and businesses around the world.
              </p>
              
              <p className="font-sans text-[15px] leading-[1.6] text-ink/70">
                By joining our platform, wine farmers can easily register as vendors and create detailed profiles that highlight their farm's story, unique offerings, and the rich heritage behind their wines. This not only allows you to tell your vineyard's story but also provides potential customers and retailers with an in-depth look at what makes your wines special. You can list your entire range of products with detailed descriptions, pricing, and high-quality images, making it easy for consumers to find and purchase.
              </p>
            </div>
            
            <a href="#" className="inline-block font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-[#7b263c] no-underline px-6 py-3 border border-[#7b263c] rounded-sm transition-all duration-300 hover:bg-[#7b263c] hover:text-white">
              Discover Our Story
            </a>
          </div>
          
          <div className="flex-1 relative flex justify-center items-center w-full mt-10 lg:mt-0">
            <div className="relative rounded-[20px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.06)] bg-white p-5 border border-black/5 group">
              <img 
                src="/assets/images/about_1.png" 
                alt="South African Wine Farms" 
                className="max-w-full h-auto max-h-[500px] object-contain transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]" 
              />
            </div>
            <div className="absolute left-[20px] bottom-[20px] lg:-left-[20px] lg:-bottom-[20px] bg-white p-5 rounded-full w-[100px] h-[100px] flex flex-col items-center justify-center text-center shadow-[0_10px_20px_rgba(0,0,0,0.08)] border border-black/5">
              <span className="font-serif text-[16px] font-bold text-[#7b263c] mb-1">Est. 2024</span>
              <span className="font-sans text-[9px] uppercase tracking-[0.1em] text-ink/50">Premium Quality</span>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
