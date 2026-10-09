import React from 'react';

const benefits = [
  {
    icon: '/assets/images/voice.png',
    text: 'A Single voice for industry',
    theme: 'dark', // ink background
    className: 'col-span-1 md:col-span-1 lg:col-span-1 row-span-1 lg:row-span-2'
  },
  {
    icon: '/assets/images/meeting.png',
    text: 'All activities coordinated around the industry strategy.',
    theme: 'light', // cream background
    className: 'col-span-1 md:col-span-1 lg:col-span-2'
  },
  {
    icon: '/assets/images/globe.png',
    text: 'Single point of accountability for delivering on the overall industry strategy and needs.',
    theme: 'light',
    className: 'col-span-1 md:col-span-1 lg:col-span-1'
  },
  {
    icon: '/assets/images/handshake.png',
    text: 'Optimised application of resources and improved collaboration between functions, in line with industry strategy and objectives.',
    theme: 'light',
    className: 'col-span-1 md:col-span-1 lg:col-span-1'
  },
  {
    icon: '/assets/images/link.png',
    text: 'Improved speed and agility, especially in terms of decision-making.',
    theme: 'dark',
    className: 'col-span-1 md:col-span-1 lg:col-span-2'
  },
  {
    icon: '/assets/images/group.png',
    text: 'Increased flexibility in allocating funding to meet industry needs (consolidated levy structure).',
    theme: 'wine', // wine background
    className: 'col-span-1 md:col-span-2 lg:col-span-3'
  }
];

const getThemeClasses = (theme) => {
  switch(theme) {
    case 'dark':
      return 'bg-ink text-white [&_.vendor-icon]:brightness-0 [&_.vendor-icon]:invert [&_.vendor-icon]:drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]';
    case 'wine':
      return 'bg-[#7b263c] text-white [&_.vendor-icon]:brightness-0 [&_.vendor-icon]:invert [&_.vendor-icon]:drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]';
    case 'light':
    default:
      return 'bg-white text-ink';
  }
};

export default function WineFarmVendorBenefits() {
  return (
    <section className="py-[120px] bg-[#f7f4ea]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-[80px]">
          <h2 className="font-sans text-[32px] font-normal text-ink max-w-[800px] mx-auto">
            The Benefits of being a Registered Vendor of South Africa WINE
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(280px,auto)] gap-[24px]">
          {benefits.map((benefit, idx) => (
            <div 
              key={idx} 
              className={`rounded-2xl p-10 flex flex-col justify-end transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative overflow-hidden hover:-translate-y-1.5 ${getThemeClasses(benefit.theme)} ${benefit.className}`}
            >
              <div className="absolute top-[30px] right-[30px] lg:top-[40px] lg:right-[40px] w-[70px] h-[70px] lg:w-auto lg:h-[60px] max-w-[60%] flex items-center justify-end">
                <img 
                  src={benefit.icon} 
                  alt="Benefit Icon" 
                  className="vendor-icon w-full h-full object-contain object-right opacity-90 drop-shadow-[0_4px_6px_rgba(0,0,0,0.05)]" 
                />
              </div>
              <p className="font-sans text-[16px] lg:text-[18px] leading-[1.5] font-medium max-w-full lg:max-w-[80%] m-0 relative z-10 mt-[60px] lg:mt-0">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
