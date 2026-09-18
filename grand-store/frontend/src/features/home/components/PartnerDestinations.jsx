import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import api from '../../../api'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_DESTINATIONS = [
  {
    href: 'https://cigar.yogapranafitness.com/',
    image: '/assets/partners/cigar-connoisseur.webp',
    eyebrow: 'The Smoking Room',
    title: 'Cigar Connoisseur Club',
    description: 'African tobacco, rich heritage, and exceptional cigars for the considered collector.',
    label: 'Explore the club',
  },
  {
    href: 'https://millionair.yogapranafitness.com/',
    image: '/assets/partners/millionaires-collection.webp',
    eyebrow: 'A Private World',
    title: 'Millionaires Collection',
    description: 'A distinctive world of premier sparkling wine and elevated private experiences.',
    label: 'Discover the collection',
  },
]

export default function PartnerDestinations() {
  const sectionRef = useRef(null)
  const [destinations, setDestinations] = useState(DEFAULT_DESTINATIONS)

  useEffect(() => {
    let isMounted = true
    api.get('/partners')
      .then(res => {
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          const valid = res.data.filter(
            d => d.isVisible !== false && d.title && d.image && !d.title.toLowerCase().includes('chillar')
          )
          if (valid.length > 0) {
            setDestinations(valid)
          }
        }
      })
      .catch(err => {
        console.warn('Using default partner destinations:', err.message)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!reduceMotion) {
        gsap.from('[data-partner-card]', {
          y: 24,
          scale: 0.985,
          stagger: 0.1,
          duration: 0.7,
          ease: 'power3.out',
          immediateRender: false,
          clearProps: 'transform',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 86%',
            once: true,
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="partners"
      className="relative overflow-hidden border-y border-[#c9a35b]/15 bg-[#0b0907] py-7 lg:py-8"
      ref={sectionRef}
      aria-labelledby="partner-title"
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(201,163,91,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(201,163,91,0.07)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#8e642e]/10 blur-[110px]" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-7 xl:px-10">
        <header className="mx-auto mb-5 max-w-2xl text-center lg:mb-6">
          <h2
            id="partner-title"
            className="m-0 font-serif text-[clamp(34px,3.7vw,52px)] font-medium leading-[0.98] tracking-[-0.035em] text-[#f5efe4]"
          >
            Partner <span className="text-[#dfbd72]">Houses</span>
          </h2>

          <p className="mb-0 mt-3 text-[14px] leading-[1.55] text-[#b8afa2]">
            Complementary houses selected for clients who appreciate craftsmanship, rarity, and luxury beyond the bottle.
          </p>
        </header>

        <div className="mx-auto grid min-w-0 max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-2">
          {destinations.map((destination) => (
            <a
              data-partner-card
              className="group relative flex min-w-0 flex-col overflow-hidden border border-[#d8b56c]/35 bg-[#17130e] text-left shadow-[0_18px_55px_rgba(0,0,0,0.28)] transition-[border-color,background-color] duration-300 hover:border-[#e5c274]/65 hover:bg-[#1b1711] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e5c274]"
              href={destination.href}
              target="_blank"
              rel="noopener noreferrer"
              key={destination.title}
              aria-label={`${destination.label} (opens in a new tab)`}
            >
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden border-b border-[#d8b56c]/20 bg-[#0c0a08]">
                <img
                  className="block w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  src={destination.image}
                  alt={destination.title}
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:px-5 sm:py-[18px]">
                <div>
                  <small className="block text-[13px] font-bold uppercase tracking-[0.18em] text-[#d8b56c] sm:text-[14px]">
                    {destination.eyebrow}
                  </small>
                  <strong className="mt-2 block font-serif text-[clamp(29px,2.25vw,38px)] font-medium leading-[1.05] tracking-[-0.025em] text-[#f3eee5]">
                    {destination.title}
                  </strong>
                  <p className="mb-0 mt-2.5 text-[16px] leading-[1.5] text-[#aaa196] sm:text-[17px]">
                    {destination.description}
                  </p>
                </div>

                <span className="mt-3.5 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[13px] font-bold uppercase tracking-[0.11em] text-[#eee5d6] sm:text-[14px]">
                  <span>{destination.label}</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d8b56c]/40 text-[#e7c576] transition-colors duration-300 group-hover:border-[#e7c576] group-hover:bg-[#e7c576] group-hover:text-[#17120b]">
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
