import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function TastingCampaign() {
  return (
    <section
      className="relative flex h-full min-h-[330px] sm:min-h-[460px] lg:min-h-[520px] border-0 bg-[#0b0a08]"
      aria-labelledby="tasting-title"
      style={{ isolation: 'isolate' }}
    >
      <img
        className="absolute inset-0 -z-20 w-full h-full object-cover lg:object-center object-[68%_center]"
        src="/assets/campaigns/whisky-tasting-editorial.png"
        alt="Whisky bottles and a crystal tasting glass in a private tasting room"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,7,6,0.7)_0%,rgba(7,7,6,0.85)_50%,rgba(7,7,6,0.95)_100%)] lg:bg-[linear-gradient(90deg,rgba(7,7,6,0.93),rgba(7,7,6,0.66)_37%,rgba(7,7,6,0.08)_65%),linear-gradient(180deg,rgba(7,7,6,0.15),transparent_55%,rgba(7,7,6,0.54))]"
      />

      <Link
        className="flex flex-col justify-center items-start w-full p-[22px_16px] sm:p-[36px_28px] lg:p-[clamp(28px,4vw,60px)] text-inherit no-underline cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#e1bd70] focus-visible:-outline-offset-[5px]"
        to="/events"
        aria-label="Explore and book an in-store tasting"
      >
        <h2
          id="tasting-title"
          className="m-0 font-serif text-[clamp(22px,4vw,38px)] sm:text-[clamp(24px,4.5vw,42px)] lg:text-[clamp(26px,3vw,44px)] font-medium tracking-[-0.02em] leading-[1.1] text-[#eee8dd]"
        >
          The Private Tasting Room
        </h2>
        <p className="max-w-[550px] mt-2 mb-3 sm:mt-3 sm:mb-5 text-[rgba(244,238,224,0.82)] text-[13px] sm:text-[15px] md:text-[16px] leading-[1.55]">
          <span className="font-serif text-[#f0cf76] italic text-[1.06em]">Heritage, craft, character.</span>{' '}
          Explore exceptional pours with expert guidance, considered pairings and stories from the makers.
        </p>
        <span className="inline-flex items-center justify-center min-h-[38px] sm:min-h-[49px] px-4 sm:px-6 gap-[10px] sm:gap-[14px] border border-white/10 text-[#eee8dd] bg-white/5 text-[11px] sm:text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-180 group-hover:bg-[#f0c86e] group-hover:text-black group-hover:border-[#f0c86e] group-hover:-translate-y-0.5 group-focus-visible:bg-[#f0c86e] group-focus-visible:text-black group-focus-visible:-translate-y-0.5 pointer-events-none">
          Reserve an evening <ArrowRight size={14} />
        </span>
      </Link>
    </section>
  )
}
