import React from 'react';
import { Award } from 'lucide-react';

export const LONG_DOG_AWARDS = [
  {
    id: 'platters-4-5-star',
    title: "Platter's 4.5 Stars",
    year: '2027',
    competition: "Platter's by Diners Club International",
    badge: '4.5 Stars (Outstanding)',
    image: '/assets/estate/long-dog-wines/award_platters_2027.png',
    alt: "Platter's by Diners Club International 4.5 Stars Wine Guide 2027",
    isWide: false,
  },
  {
    id: 'michelangelo-gold',
    title: 'Michelangelo Gold',
    year: '2025',
    competition: 'Michelangelo Int. Wine & Spirits Awards',
    badge: 'Gold Medal',
    image: '/assets/estate/long-dog-wines/award_gold.png',
    alt: 'Michelangelo International Wine & Spirits Awards Gold Medal 2025',
    isWide: true,
  },
  {
    id: 'iwsc-silver',
    title: 'IWSC Silver',
    year: '2026',
    competition: 'International Wine & Spirit Competition',
    badge: 'Silver Medal',
    image: '/assets/estate/long-dog-wines/award_iwsc_silver.png',
    alt: 'IWSC Silver Medal 2026',
    isWide: false,
  },
  {
    id: 'vitis-gold',
    title: 'Vitis Vinifera Gold',
    year: '2026',
    competition: 'Vitis Vinifera Wine Awards',
    badge: 'Gold Medal',
    image: '/assets/estate/long-dog-wines/award_vitis_vinifera_gold.png',
    alt: 'Vitis Vinifera Gold Medal 2026',
    isWide: false,
  },
  {
    id: 'vine-spirit-gold',
    title: 'Vine & Spirit Gold',
    year: '2026',
    competition: 'The Annual Vine & Spirit Awards',
    badge: 'Gold Medal',
    image: '/assets/estate/long-dog-wines/award_wine_spirit.png',
    alt: 'The Annual Vine & Spirit Awards Gold Medal 2026',
    isWide: true,
  },
  {
    id: 'aurora-silver',
    title: 'Aurora Challenge Silver',
    year: '2026',
    competition: 'Aurora International Taste Challenge',
    badge: 'Silver Medal',
    image: '/assets/estate/long-dog-wines/award_aurora.png',
    alt: 'Aurora International Taste Challenge Silver Medal 2026',
    isWide: false,
  },
  {
    id: 'fb-silver',
    title: 'SA F&B Silver',
    year: '2026',
    competition: 'South African Food & Beverage Awards',
    badge: 'Silver Medal',
    image: '/assets/estate/long-dog-wines/award_fb.png',
    alt: 'South African Food & Beverage Awards Silver Medal 2026',
    isWide: false,
  },
];

export default function LongDogAwards({ variant = 'storefront' }) {
  if (variant === 'product') {
    return (
      <div className="w-full bg-[#0a0a09] border border-[#c9a35b]/30 rounded-xl p-4 sm:p-5 mb-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#c9a35b]/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-[#ffd700]" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#e1bd70]">
              Official Accolades & Wine Awards
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            7 Certified Accolades & Medals
          </span>
        </div>

        {/* Medals Showcase Strip */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 py-1">
          {LONG_DOG_AWARDS.map((award) => (
            <div 
              key={award.id}
              className="group/medal relative flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105"
              title={`${award.competition} — ${award.badge} (${award.year})`}
            >
              <div className="h-16 sm:h-20 flex items-center justify-center p-1">
                <img 
                  src={award.image} 
                  alt={award.alt}
                  className={`max-h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] transition-all duration-200 group-hover/medal:brightness-110 group-hover/medal:drop-shadow-[0_6px_16px_rgba(212,175,55,0.3)] ${
                    award.isWide ? 'max-w-[120px] sm:max-w-[140px]' : 'max-w-[70px] sm:max-w-[85px]'
                  }`}
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] font-medium text-white/70 tracking-tight text-center mt-1 group-hover/medal:text-[#ffd700] transition-colors whitespace-nowrap">
                {award.title}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            100% Estate Authenticated • Simonsberg, Stellenbosch
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-white/30">
            Vintage 2023 · Hand-harvested & Basket-pressed
          </span>
        </div>
      </div>
    );
  }

  // Default: Storefront Variant
  return (
    <div className="w-full bg-gradient-to-b from-[#13120f] to-[#090908] border border-[#c9a35b]/35 rounded-2xl p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a35b]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#c9a35b]/15 border border-[#c9a35b]/40 flex items-center justify-center text-[#ffd700] shrink-0 shadow-[0_0_15px_rgba(201,163,91,0.2)]">
            <Award size={22} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-serif text-white tracking-wide flex items-center gap-2">
              Official Wine Awards & Accolades
            </h3>
            <p className="text-xs text-[#c9a35b] tracking-wider uppercase font-semibold mt-0.5">
              Recognised Excellence • Judged by South African & Global Sommelier Panels
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-200 bg-[#c9a35b]/10 border border-[#c9a35b]/30 px-3.5 py-1 rounded-full font-medium shadow-sm">
            7 Certified Accolades & Medals
          </span>
        </div>
      </div>

      {/* Awards Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5 items-stretch relative z-10">
        {LONG_DOG_AWARDS.map((award) => (
          <div 
            key={award.id}
            className="group/card flex flex-col items-center justify-between bg-black/40 hover:bg-[#181611] border border-white/10 hover:border-[#c9a35b]/50 rounded-xl p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(201,163,91,0.15)]"
          >
            {/* Medal Image Container */}
            <div className="w-full h-24 sm:h-28 flex items-center justify-center p-1 mb-2">
              <img 
                src={award.image} 
                alt={award.alt}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] transition-all duration-300 group-hover/card:scale-110 group-hover/card:brightness-110"
                loading="lazy"
              />
            </div>

            {/* Medal Details */}
            <div className="text-center w-full pt-2 border-t border-white/5">
              <div className="text-xs font-semibold text-white group-hover/card:text-[#ffd700] transition-colors leading-tight mb-1">
                {award.title}
              </div>
              <div className="text-[10px] text-white/50 leading-tight line-clamp-2">
                {award.competition}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estate Guarantee Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50 relative z-10">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Awarded to <strong>Long Dog Blend 2023</strong> · 50% Cabernet Franc · 50% Tannat</span>
        </span>
        <span className="text-[11px] text-[#c9a35b] tracking-wider uppercase">
          Simonsberg, Stellenbosch • Handcrafted 1.5-Acre Sanctuary Farm
        </span>
      </div>
    </div>
  );
}
