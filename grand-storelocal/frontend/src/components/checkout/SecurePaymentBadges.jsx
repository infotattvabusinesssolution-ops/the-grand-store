import React from 'react';
import { ShieldCheck, Lock, CreditCard, Banknote } from 'lucide-react';

export default function SecurePaymentBadges({ compact = false }) {
  return (
    <div className={`${compact ? 'mt-5 mb-3 rounded-lg' : 'mt-8 mb-4 rounded-2xl'} overflow-hidden border border-[#c9a35b]/20 bg-gradient-to-br from-[#1a1814]/90 to-black/80 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl relative`}>
      {/* Inline styles for marquee animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes payment-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-payment-marquee {
          animation: payment-marquee 25s linear infinite;
        }
        .payment-marquee-container:hover .animate-payment-marquee {
          animation-play-state: paused;
        }
      `}} />

      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#c9a35b] to-transparent opacity-50 blur-[3px]"></div>

      <div className={`${compact ? 'p-3' : 'p-5'} border-b border-white/5 relative z-10 flex flex-col items-center`}>
        <h4 className={`${compact ? 'text-base' : 'text-sm md:text-base'} font-serif uppercase tracking-[0.18em] font-bold text-[#c9a35b] flex items-center gap-3`}>
          <ShieldCheck size={20} />
          Guaranteed Secure Checkout
        </h4>
      </div>
      
      <div className={`${compact ? 'py-4' : 'py-8'} w-full overflow-hidden payment-marquee-container relative z-10`}>
        {/* Left/Right fading gradients */}
        <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-[#11100d] to-transparent z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-[#11100d] to-transparent z-20 pointer-events-none"></div>

        <div className="flex w-max animate-payment-marquee items-center">
          {/* We render the track twice to create a seamless infinite loop */}
          {[1, 2].map((setIndex) => (
            <div key={setIndex} className={`${compact ? 'gap-10 px-6' : 'gap-14 px-7'} flex items-center shrink-0`}>
              
              {/* Item 1: Payment Logos */}
              <div className="flex items-center">
                <img 
                  src="/assets/footer/payment-strip.png" 
                  alt="Accepted Payments" 
                  className={`${compact ? 'h-9' : 'h-12 md:h-14'} w-auto object-contain opacity-90`}
                />
              </div>

              {/* Item 2: SSL Encryption */}
              <div className="flex items-center gap-3">
                <div className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full bg-white/5 border border-white/10 flex items-center justify-center`}>
                  <Lock size={20} className="text-[#c9a35b]" />
                </div>
                <div className="flex flex-col">
                  <span className={`${compact ? 'text-sm' : 'text-xs'} uppercase font-bold tracking-widest text-[#f2ede4]`}>256-Bit SSL</span>
                  <span className={`${compact ? 'text-xs' : 'text-[10px]'} uppercase tracking-wider text-[#918a7f]`}>Encryption</span>
                </div>
              </div>

              {/* Item 3: Payment Options */}
              <div className="flex items-center gap-3">
                <div className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full bg-white/5 border border-white/10 flex items-center justify-center`}>
                  <CreditCard size={20} className="text-[#c9a35b]" />
                </div>
                <div className="flex flex-col">
                  <span className={`${compact ? 'text-sm' : 'text-xs'} uppercase font-bold tracking-widest text-[#f2ede4]`}>PayFast & EFT</span>
                  <span className={`${compact ? 'text-xs' : 'text-[10px]'} uppercase tracking-wider text-[#918a7f]`}>Supported</span>
                </div>
              </div>

              {/* Item 4: Buyer Protection */}
              <div className="flex items-center gap-3">
                <div className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full bg-[#c9a35b]/10 border border-[#c9a35b]/30 flex items-center justify-center`}>
                  <ShieldCheck size={20} className="text-[#e5a93c]" />
                </div>
                <div className="flex flex-col">
                  <span className={`${compact ? 'text-sm' : 'text-xs'} uppercase font-bold tracking-widest text-[#e5a93c]`}>Buyer Protection</span>
                  <span className={`${compact ? 'text-xs' : 'text-[10px]'} uppercase tracking-wider text-[#c9a35b]/70`}>Guaranteed</span>
                </div>
              </div>

              {/* Item 5: No Hidden Fees */}
              <div className="flex items-center gap-3">
                <div className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full bg-white/5 border border-white/10 flex items-center justify-center`}>
                  <Banknote size={20} className="text-[#c9a35b]" />
                </div>
                <div className="flex flex-col">
                  <span className={`${compact ? 'text-sm' : 'text-xs'} uppercase font-bold tracking-widest text-[#f2ede4]`}>No Hidden Fees</span>
                  <span className={`${compact ? 'text-xs' : 'text-[10px]'} uppercase tracking-wider text-[#918a7f]`}>Transparent</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
