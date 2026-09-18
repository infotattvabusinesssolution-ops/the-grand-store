import React from 'react';

const benefits = [
  {
    number: '01.',
    title: 'Exclusive Access to',
    subtitle: 'Premium Wines'
  },
  {
    number: '02.',
    title: 'Get best Discounts',
    subtitle: '& Offers'
  },
  {
    number: '03.',
    title: 'Invitations to',
    subtitle: 'Exclusive Events'
  },
  {
    number: '04.',
    title: 'Personalized Wine',
    subtitle: 'Recommendations'
  }
];

export default function WineFarmBenefits() {
  return (
    <section className="py-[60px] bg-white border-b border-black/5 relative z-[2]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between max-w-[1200px] mx-auto gap-y-[40px] lg:gap-y-0">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-4 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-1 justify-start pl-[20%] sm:pl-0 sm:justify-center relative px-5 
                ${index !== benefits.length - 1 ? 'lg:after:content-[\'\'] lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:-translate-y-1/2 lg:after:h-[40px] lg:after:w-[1px] lg:after:bg-[#800020]/15' : ''}
                ${index % 2 === 0 ? 'sm:after:content-[\'\'] sm:after:absolute sm:after:right-0 sm:after:top-1/2 sm:after:-translate-y-1/2 sm:after:h-[40px] sm:after:w-[1px] sm:after:bg-[#800020]/15 lg:after:block' : 'sm:after:hidden lg:after:block'}
              `}
            >
              <div className="font-sans text-[36px] font-bold text-[#7b263c] leading-none tracking-tighter">
                {benefit.number}
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-sans text-[14px] font-semibold text-ink leading-tight">
                  {benefit.title}
                </span>
                <span className="font-sans text-[14px] font-semibold text-ink leading-tight">
                  {benefit.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
