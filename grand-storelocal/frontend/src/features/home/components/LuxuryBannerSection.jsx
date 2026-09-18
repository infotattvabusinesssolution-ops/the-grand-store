import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function LuxuryBannerSection() {
  return (
    <section 
      className="relative flex w-[calc(100%-48px)] lg:w-[calc(100%-60px)] min-h-[350px] lg:min-h-[400px] max-w-[1500px] mx-auto my-[18px] border border-[#e1bd70]/20 bg-[#0b0a08]" 
      aria-labelledby="luxury-banner-title"
      style={{ isolation: 'isolate' }}
    >
      <img 
        className="absolute inset-0 -z-20 w-full h-full object-cover lg:object-center object-[68%_center]" 
        src="https://res.cloudinary.com/oioqrgj0/image/upload/v1788172077/grand-store/assets/xxvwe50zmbqo9jkrwhsj.jpg" 
        alt="Premium wine and luxury lifestyle selections" 
      />
      <div 
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,7,6,0.35),rgba(7,7,6,0.95)_70%)] lg:bg-[linear-gradient(90deg,rgba(7,7,6,0.93),rgba(7,7,6,0.66)_37%,rgba(7,7,6,0.08)_65%),linear-gradient(180deg,rgba(7,7,6,0.15),transparent_55%,rgba(7,7,6,0.54))]" 
      />
      
      <Link 
        className="flex flex-col justify-end lg:justify-center items-start w-full lg:w-[min(620px,48%)] p-[24px_24px_30px] lg:p-[clamp(32px,5vw,64px)] text-inherit no-underline cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#e1bd70] focus-visible:-outline-offset-[5px]" 
        to="/shop" 
        aria-label="Explore premium wines and spirits"
      >
        <h2 
          id="luxury-banner-title" 
          className="m-0 font-serif text-[32px] lg:text-[clamp(36px,3.5vw,56px)] font-medium tracking-[-0.02em] leading-[1.05] text-[#eee8dd]"
        >
          Explore Premium<br />
          <span
            className="inline-block pr-2 text-[1em] text-[#eee8dd]"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'normal',
              fontWeight: 500,
            }}
          >
            Selections
          </span>
        </h2>
        <p className="max-w-[550px] mt-3 mb-5 text-[rgba(244,238,224,0.76)] text-[15px] md:text-[16px] leading-[1.65]">
          <span className="font-serif text-[#f0cf76] italic text-[1.06em]">All in one destination.</span>{' '}
          Discover our exquisite collection of fine wines, spirits, and unforgettable experiences.
        </p>
        <span className="inline-flex items-center justify-center min-h-[49px] px-6 gap-[14px] border border-white/10 text-[#eee8dd] bg-white/5 text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-180 group-hover:bg-[#f0c86e] group-hover:text-black group-hover:border-[#f0c86e] group-hover:-translate-y-0.5 group-focus-visible:bg-[#f0c86e] group-focus-visible:text-black group-focus-visible:-translate-y-0.5 pointer-events-none">
          Shop Now <ArrowRight size={17} />
        </span>
      </Link>
    </section>
  )
}
