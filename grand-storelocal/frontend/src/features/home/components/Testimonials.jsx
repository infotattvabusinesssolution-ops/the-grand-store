import { Star, Quote, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../../../api'

export default function Testimonials() {
  const [reviews, setReviews] = useState([])
  
  const defaultReviews = [
    {
      _id: 1,
      name: 'Thabo Selwane',
      location: 'Johannesburg',
      image: '/assets/testimonials/thabo-selwane.jpg',
      rating: 5,
      bottle: 'Stellenbosch Reserve 2018',
      text: 'The richness of South African terroir arrived in pristine cellar condition. Authenticity that genuinely recalls the private tastings of the Cape.',
      date: 'Verified Client',
    },
    {
      _id: 2,
      name: 'Michelle Steyn',
      location: 'Stellenbosch',
      image: '/assets/testimonials/michelle-steyn.jpg',
      rating: 5,
      bottle: 'Grand Vintage Prestige Cuvée',
      text: 'The Grand Store combines global cellar standards with local taste. It is rare to find an online purveyor that feels this considered, discreet, and trustworthy.',
      date: 'Verified Client',
    },
    {
      _id: 3,
      name: 'Themba Nkosi',
      location: 'Pretoria',
      image: '/assets/testimonials/themba-nkosi.jpg',
      rating: 5,
      bottle: 'Rare 25-Year Islay Cask',
      text: 'What I value most is the uncompromised provenance. The single malt curation feels deeply intentional, and the delivery is pure white-glove luxury.',
      date: 'Verified Client',
    },
    {
      _id: 4,
      name: 'Rajesh Pillay',
      location: 'Johannesburg',
      image: '/assets/testimonials/rajesh-pillay.jpg',
      rating: 5,
      bottle: 'Highland Single Cask Release',
      text: 'My primary source for milestone entertaining. Exceptional allocations, transparent estate pricing, and dependable delivery every single time.',
      date: 'Verified Client',
    },
  ]

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get(`/testimonials`)
        const data = res.data
        if (data && data.length > 0) {
          setReviews(data)
        } else {
          setReviews(defaultReviews)
        }
      } catch (error) {
        console.error('Failed to load testimonials', error)
        setReviews(defaultReviews)
      }
    }
    fetchTestimonials()
  }, [])

  const marqueeReviews = [...reviews, ...reviews]

  return (
    <section 
      className="py-[44px] md:py-[52px] border-t border-white/10 bg-[#0a0a0a] relative overflow-hidden" 
      aria-labelledby="testimonials-title"
      id="testimonials"
    >
      {/* Ambient Radial Golden Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[var(--color-gold)]/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-6 sm:px-0 relative z-10">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
          <div className="text-[10px] md:text-xs uppercase tracking-widest font-semibold text-[#918a7f] mb-1.5 flex items-center justify-center gap-2">
            <span className="w-5 h-px bg-[#b58b38] inline-block" />
            The Collector Registry
            <span className="w-5 h-px bg-[#b58b38] inline-block" />
          </div>
          
          <h2 
            id="testimonials-title" 
            className="m-0 font-serif text-[clamp(40px,3.8vw,62px)] font-medium tracking-[-0.02em] leading-[1.05] text-[#eee8dd]"
          >
            Private <span className="text-[#dfbd72]">Notes</span>
          </h2>
          
          <p className="mt-2.5 text-[rgba(244,238,224,0.76)] text-[15px] md:text-[16px] leading-[1.6] max-w-[620px] mx-auto">
            <span className="font-serif text-[#f0cf76] italic text-[1.06em]">From our private list.</span>{' '}
            Discerning collector reflections, moving quietly through the moments, vintages, and bottles they remember.
          </p>
        </div>
      </div>

      {/* Infinite Auto-Scrolling Testimonial Track */}
      <div 
        className="relative overflow-hidden w-full group py-2" 
        style={{ maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}
        aria-label="Client testimonials marquee"
      >
        <div className="flex w-max gap-5 animate-[marquee_38s_linear_infinite] group-hover:[animation-play-state:paused] will-change-transform px-4">
          {marqueeReviews.map((item, index) => {
            const safeName = item.name || 'Client'
            const initials = safeName
              .split(' ')
              .map((n) => n ? n[0] : '')
              .join('')
            const ratingCount = Math.max(1, Math.min(5, Number(item.rating) || 5))

            return (
              <article 
                key={`${item._id}-${index}`}
                className="w-[340px] sm:w-[380px] md:w-[420px] shrink-0 p-5 md:p-6 rounded-2xl border border-white/10 bg-[#11100d] hover:border-[#c9a35b]/60 hover:bg-[#16130e] hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group/card text-left shadow-xl"
              >
                {/* Ambient Hover Orb */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--color-gold)]/10 rounded-full blur-3xl group-hover/card:bg-[var(--color-gold)]/20 transition-all pointer-events-none" />

                {/* Watermark Quote Icon */}
                <div className="absolute top-4 right-5 text-[#c9a35b]/10 group-hover/card:text-[#c9a35b]/20 transition-colors select-none pointer-events-none">
                  <Quote size={38} />
                </div>

                <div>
                  {/* Rating & Tag */}
                  <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
                    <div className="flex text-[#f0cf76] gap-0.5">
                      {[...Array(ratingCount)].map((_, i) => (
                        <Star key={i} size={14} fill="#f0cf76" stroke="none" />
                      ))}
                    </div>
                    <span className="text-[10px] md:text-[11px] uppercase tracking-widest font-bold text-[#dfbd72] bg-[#c9a35b]/10 px-2.5 py-0.5 rounded-full border border-[#c9a35b]/20 truncate max-w-[190px]">
                      {item.bottle}
                    </span>
                  </div>

                  {/* Quote Text */}
                  <p className="font-serif text-[16px] md:text-[18px] text-[#f4eee3] leading-[1.6] font-normal italic relative z-10 m-0 my-3 break-words min-h-[88px]">
                    “{item.text || item.quote || ''}”
                  </p>
                </div>

                {/* Verified Author Row with Luxury Golden Avatar Ring */}
                <div className="flex items-center gap-3.5 pt-3.5 mt-3 border-t border-white/10 relative z-10">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-[#dfbd72]/70 bg-[#17130e] p-[2px] shadow-md shrink-0 flex items-center justify-center">
                    <img 
                      className="w-full h-full rounded-full object-cover bg-[#1c1913]" 
                      src={item.image} 
                      alt={item.name} 
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div 
                      className="hidden w-full h-full rounded-full bg-[#1c1913] items-center justify-center font-serif font-bold text-xs text-[#f0cf76]"
                    >
                      {initials}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-base md:text-[18px] font-medium text-[#eee8dd] truncate">
                      {safeName}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-[#918a7f] mt-0.5 flex items-center gap-1.5">
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {/* Bottom Trust & Hover Indicator Bar */}
      <div className="max-w-[1240px] mx-auto px-6 sm:px-0 relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="flex text-[#f0cf76] gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill="#f0cf76" stroke="none" />
            ))}
          </div>
          <span className="text-xs uppercase tracking-widest text-[#918a7f] font-semibold">
            4.98 / 5.0 Rating • 350+ Verified Cellars Delivered
          </span>
        </div>
      </div>
    </section>
  )
}
