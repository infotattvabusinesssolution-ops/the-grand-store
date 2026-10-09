import { Link } from 'react-router-dom'
import { brands } from '../../../data'

export default function BrandSection() {
  const list = [...brands, ...brands]
  return (
    <section className="relative py-8 pb-8 bg-[#0e0d0b] bg-[radial-gradient(ellipse_at_50%_112%,rgba(143,84,24,0.17),transparent_48%),linear-gradient(120deg,rgba(103,68,25,0.12),transparent_45%)]" id="brands">
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-10 bg-[radial-gradient(ellipse_at_50%_50%,#e1bd70,transparent_60%)]" />
      <div className="max-w-[1240px] mx-auto px-6 sm:px-0 mb-3.5 text-center">
        <h2 className="m-0 font-serif text-[clamp(40px,3.8vw,62px)] font-medium tracking-[-0.02em] leading-[1.05] text-[#eee8dd]">
          Top Whisky{' '}
          <span
            className="gold-gradient-text inline-block pr-2 text-[1.12em]"
            
          >
            Brands
          </span>
        </h2>
      </div>
      <div 
        className="relative overflow-hidden w-full group py-1" 
        style={{ maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}
        aria-label="Featured whisky brands"
      >
        <div className="flex w-max animate-[marquee_24s_linear_infinite] group-hover:[animation-play-state:paused] will-change-transform items-center">
          {list.map((brand, index) => (
            <Link 
              className="relative flex items-center justify-center flex-[0_0_240px] sm:flex-[0_0_300px] md:flex-[0_0_360px] min-h-[140px] sm:min-h-[165px] md:min-h-[190px] mx-5 sm:mx-8 md:mx-10 transition-all duration-300 hover:scale-110 hover:-translate-y-1 group/brand select-none" 
              to={`/shop?brand=${encodeURIComponent(brand.name)}`} 
              key={`${brand.name}-${index}`} 
              aria-label={`Shop ${brand.name}`}
            >
              <img 
                className="w-auto h-auto max-w-[220px] sm:max-w-[280px] md:max-w-[340px] max-h-[120px] sm:max-h-[145px] md:max-h-[170px] object-contain filter contrast-[1.08] brightness-[0.95] group-hover/brand:brightness-110 group-hover/brand:drop-shadow-[0_10px_30px_rgba(225,189,112,0.45)] transition-all duration-300" 
                src={brand.image} 
                alt={brand.name} 
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
