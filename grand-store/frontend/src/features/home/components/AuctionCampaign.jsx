import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function AuctionCampaign() {
  return (
    <section
      className="relative flex h-full min-h-[330px] lg:min-h-[520px] border-0 bg-[#0b0a08]"
      aria-labelledby="auction-campaign-title"
      style={{ isolation: 'isolate' }}
    >
      <video
        ref={(el) => {
          if (el) {
            el.muted = true;
            el.defaultMuted = true;
            el.volume = 0;
          }
        }}
        className="absolute inset-0 -z-20 w-full h-full object-cover lg:object-center object-[68%_center]"
        src="https://res.cloudinary.com/oioqrgj0/video/upload/v1788935569/grand-store/hero/auctioneer_conducts_rare_wine_auction.mp4"
        poster="https://res.cloudinary.com/oioqrgj0/image/upload/v1788172078/grand-store/assets/cu4jebfyyjt80fbqjzk0.jpg"
        autoPlay
        muted
        defaultMuted
        loop
        playsInline
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,7,6,0.35),rgba(7,7,6,0.95)_70%)] lg:bg-[linear-gradient(90deg,rgba(7,7,6,0.93),rgba(7,7,6,0.66)_37%,rgba(7,7,6,0.08)_65%),linear-gradient(180deg,rgba(7,7,6,0.15),transparent_55%,rgba(7,7,6,0.54))]"
      />

      <Link
        className="flex flex-col justify-end lg:justify-center items-start w-full p-[40px_34px_44px] sm:p-[44px_38px_48px] lg:p-[clamp(28px,4vw,56px)] text-inherit no-underline cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#e1bd70] focus-visible:-outline-offset-[5px]"
        to="/auction"
        aria-label="Discover our exclusive auctions"
      >
        <h2
          id="auction-campaign-title"
          className="m-0 font-serif text-[clamp(22px,4vw,34px)] sm:text-[34px] lg:text-[clamp(24px,3vw,40px)] font-medium tracking-[-0.02em] leading-[1.08] text-[#eee8dd]"
        >
          Exclusive Auctions
        </h2>
        <p className="max-w-[550px] mt-3 mb-5 text-[rgba(244,238,224,0.76)] text-[15px] md:text-[16px] leading-[1.65]">
          <span className="font-serif text-[#f0cf76] italic text-[1.06em]">Rare. Vintage. Exceptional.</span>{' '}
          Bid on the world's most sought-after spirits and exclusive collections curated by our experts.
        </p>
        <span className="inline-flex items-center justify-center min-h-[52px] px-8 gap-[14px] border border-white/10 text-[#eee8dd] bg-white/5 text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-180 group-hover:bg-[#f0c86e] group-hover:text-black group-hover:border-[#f0c86e] group-hover:-translate-y-0.5 group-focus-visible:bg-[#f0c86e] group-focus-visible:text-black group-focus-visible:-translate-y-0.5 pointer-events-none">
          Enter Auction <ArrowRight size={17} />
        </span>
      </Link>
    </section>
  )
}
