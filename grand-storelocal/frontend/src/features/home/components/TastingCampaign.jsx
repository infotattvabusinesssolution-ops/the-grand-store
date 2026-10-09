import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProteaEmblem from './ProteaEmblem'

export default function TastingCampaign() {
  return (
    <section 
      className="relative w-[calc(100%-32px)] sm:w-[calc(100%-48px)] lg:w-[calc(100%-60px)] max-w-[1500px] mx-auto my-6 sm:my-8 border border-[#caa458]/40 bg-[#070706] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden" 
      aria-labelledby="tasting-title"
      style={{ isolation: 'isolate' }}
    >
      {/* 100% Uncropped Full-Fidelity Aspect Ratio Container (exact 1024:572 ratio) */}
      <div className="relative w-full aspect-[1024/572] flex items-center">
        {/* The 2x High-Quality Uncropped Hero Artwork */}
        <img 
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" 
          src="/assets/campaigns/wine-tasting-arch.png" 
          alt="Royal Lifestyle Wine Tasting Room with vaulted arch and sommelier wine pour" 
        />

        {/* Delicate Left Vignette Scrim (only on the left where text sits, leaving the arch keystone medallion and wine pour completely clear) */}
        <div 
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_52%,rgba(7,7,6,0.82)_0%,rgba(7,7,6,0.45)_50%,transparent_80%)]" 
        />

        {/* Content Block strictly positioned on the left side of the arch */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-start p-6 sm:p-10 md:p-12 lg:p-16 max-w-[55%]">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 mb-2 sm:mb-3 rounded-full bg-[#caa458]/15 border border-[#caa458]/35 text-[#caa458] text-[9px] sm:text-[11px] font-bold tracking-[0.18em] uppercase backdrop-blur-sm">
            <ProteaEmblem className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#caa458]" />
            <span>Curated Sommelier Experiences</span>
          </div>

          <h2 
            id="tasting-title" 
            className="m-0 font-serif text-[24px] sm:text-[34px] md:text-[42px] lg:text-[54px] xl:text-[60px] font-medium tracking-[-0.02em] leading-[1.06] text-[#eee8dd]"
          >
            The Private<br />
            <span
              className="inline-block pr-2 text-[1em] text-[#f0cf76]"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: 'normal',
                fontWeight: 600,
              }}
            >
              Tasting Room
            </span>
          </h2>

          <p className="max-w-[440px] mt-2 sm:mt-3 mb-3.5 sm:mb-5 text-[rgba(244,238,224,0.85)] text-[12px] sm:text-[14px] md:text-[15px] lg:text-[16px] leading-[1.5] sm:leading-[1.65] line-clamp-3 sm:line-clamp-none">
            <span className="font-serif text-[#f0cf76] italic">Heritage, craft, character.</span>{' '}
            Explore exceptional vintage pours with master sommelier guidance, considered culinary pairings and cellar stories.
          </p>

          {/* Luxury CTA Button */}
          <Link
            to="/events"
            aria-label="Reserve an evening at the private tasting room"
            className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[46px] px-5 sm:px-7 gap-2.5 sm:gap-3 border border-[#caa458]/60 text-[#eee8dd] bg-[#11110f]/85 backdrop-blur-md text-[10px] sm:text-xs font-bold tracking-[0.14em] uppercase transition-all duration-200 hover:bg-[#caa458] hover:text-black hover:border-[#caa458] hover:shadow-[0_0_25px_rgba(202,164,88,0.45)] hover:-translate-y-0.5 cursor-pointer no-underline"
          >
            Reserve an evening <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}
