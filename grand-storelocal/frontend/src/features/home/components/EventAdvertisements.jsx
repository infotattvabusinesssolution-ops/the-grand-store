import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

export default function EventAdvertisements() {
  return (
    <section className="section pb-24" id="event-advertisements">
      <div className="shell">
        <div className="flex flex-col md:block relative w-full max-w-6xl mx-auto rounded-2xl overflow-hidden group bg-[#0a0a0a]">
          {/* Background Image / Gradient */}
          <div className="relative w-full h-[250px] md:absolute md:inset-0 md:h-full">
            <img
              src="/auc-ev/wine tasting event.webp"
              alt="Host with The Grand Store"
              className="w-full h-full object-cover opacity-80 md:opacity-40 md:mix-blend-luminosity group-hover:opacity-50 transition-opacity duration-700 md:group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent md:bg-gradient-to-r md:from-[#050505] md:via-[#050505]/80 md:to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 pt-4 md:p-16 lg:p-20 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-[#c9a35b] mb-4 text-sm font-semibold tracking-[0.2em] uppercase">
                <Star size={14} className="fill-[#c9a35b]" />
                <span>Partner With Us</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
                Host An Event <br className="hidden md:block" /> Or Auction
              </h2>
              <p className="text-[#918a7f] text-lg md:text-xl mb-10 leading-relaxed font-light">
                Elevate your brand by hosting an exclusive luxury auction or
                curated tasting event on our platform. Reach our discerning
                audience of connoisseurs.
              </p>

              <Link
                to="/vendor/onboarding"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#c9a35b] hover:bg-[#d8b76d] text-[#050505] font-semibold tracking-wider uppercase text-sm rounded-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,163,91,0.4)] hover:-translate-y-1 gap-3"
              >
                Become a Host <ArrowRight size={18} />
              </Link>
            </div>

            {/* Visual accent on the right for desktop */}
            <div className="hidden md:flex flex-col gap-4">
              <div className="w-48 h-64 rounded-lg overflow-hidden border border-white/10 rotate-3 shadow-2xl relative">
                <img
                  src="/auc-ev/wine-tasting.webp"
                  alt="Auction"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <span className="text-white font-serif tracking-wide">
                    Auctions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle border glow */}
          <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none group-hover:border-[#c9a35b]/30 transition-colors duration-700"></div>
        </div>
      </div>
    </section>
  );
}
