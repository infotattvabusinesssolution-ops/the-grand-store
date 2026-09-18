import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ArrowDown, ArrowRight } from 'lucide-react'

const heroFilms = [
  {
    type: 'image',
    src: 'https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_1920,h_1080,b_gen_fill/v1789646474/grand-store/hero/grand_store_celebration_gathering.jpg',
    label: 'Friends celebrating with fine beverages at an evening gathering',
    maxTime: 7,
    badge: 'Shared Moments & Fine Spirits',
    titleLine1: 'Every Gathering.',
    titleLine2: 'Celebrated.',
    titleLine2Class: 'text-transparent bg-clip-text bg-gradient-to-r from-[#fff3cc] via-[#e5a93c] to-[#c9a35b]',
    subtitle: 'Curated fine spirits, rare vintages & private cellar selections for memorable moments.',
    ctaText: 'Explore Collection',
    ctaLink: '#arrivals',
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_1920,h_1080,b_gen_fill/v1789646759/grand-store/hero/south_african_wine_clean.jpg',
    label: 'Pristine South African Stellenbosch vineyard estate at sunset',
    maxTime: 7,
    badge: 'Estate Direct Cellar',
    titleLine1: "South Africa's Best.",
    titleLine2: 'Sourced From Farm.',
    titleLine2Class: 'text-transparent bg-clip-text bg-gradient-to-r from-[#ffe49e] via-[#e5a93c] to-[#b37c16]',
    subtitle: 'Direct cellar allocations from premier Stellenbosch & Franschhoek wine estates.',
    ctaText: 'Explore Wine Collection',
    ctaLink: '/shop?category=Wine',
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/oioqrgj0/image/upload/c_pad,w_1920,h_1080,b_gen_fill/v1789646476/grand-store/hero/grand_store_events_toast.png',
    label: 'Celebratory toast with fine glassware in a private tasting room',
    maxTime: 7,
    badge: 'Private Tastings & Masterclasses',
    titleLine1: 'Exclusive Tastings.',
    titleLine2: 'Private Events.',
    titleLine2Class: 'text-transparent bg-clip-text bg-gradient-to-r from-[#fff2c8] via-[#e5a93c] to-[#a86c0c]',
    subtitle: 'Sommelier-led masterclasses, intimate cellar tastings & bespoke culinary pairings.',
    ctaText: 'Discover Upcoming Events',
    ctaLink: '/events',
  },
  {
    type: 'video',
    src: 'https://res.cloudinary.com/oioqrgj0/video/upload/c_pad,w_1920,h_1080,b_black/v1788935569/grand-store/hero/auctioneer_conducts_rare_wine_auction.mp4',
    label: 'Exclusive Rare Spirits & Fine Wine Auctions',
    maxTime: 6,
    badge: 'Live Premier Bidding',
    titleLine1: 'Rare Vintages.',
    titleLine2: 'Live Auctions.',
    titleLine2Class: 'text-transparent bg-clip-text bg-gradient-to-r from-[#ffeaa7] via-[#e5a93c] to-[#d48806]',
    subtitle: 'Verified provenance, sealed cellar reserves & premier global collector bidding.',
    ctaText: 'Explore Live Auctions',
    ctaLink: '/auction',
  },
  {
    type: 'video',
    src: 'https://res.cloudinary.com/oioqrgj0/video/upload/c_pad,w_1920,h_1080,b_black/v1787819585/cigar-store/hero/tqvn9t0up9y8vsxrlbix.mp4',
    label: 'Premium handcrafted cigars',
    maxTime: 15,
    badge: 'Handcrafted Heritage',
    titleLine1: 'Handcrafted Luxury.',
    titleLine2: 'Cigars & Lounge.',
    titleLine2Class: 'text-transparent bg-clip-text bg-gradient-to-r from-[#fae19c] via-[#c9a35b] to-[#8a6825]',
    subtitle: 'Hand-rolled heritage cigars from master blenders, paired with aged spirits.',
    ctaText: 'Explore Cigars',
    ctaLink: 'https://cigar.yogapranafitness.com',
  },
]

export default function HeroDesktop() {
  const sectionRef = useRef(null)
  const mediaRef = useRef(null)
  const heroContentRef = useRef(null)
  const transitionLockRef = useRef(false)
  const [activeFilmIndex, setActiveFilmIndex] = useState(0)

  const changeFilm = (nextIndex) => {
    if (nextIndex === activeFilmIndex || transitionLockRef.current) return

    const media = mediaRef.current
    if (!media) {
      setActiveFilmIndex(nextIndex)
      return
    }

    transitionLockRef.current = true
    gsap.killTweensOf(media)
    gsap.to(media, {
      autoAlpha: 0,
      scale: 1.018,
      duration: 0.42,
      ease: 'power2.inOut',
      onComplete: () => {
        setActiveFilmIndex(nextIndex)
      },
    })
  }

  useEffect(() => {
    const section = sectionRef.current
    const content = heroContentRef.current
    if (!section || !content) return undefined

    const context = gsap.context(() => {
      gsap.fromTo(
        '.hero-title-line, .hero-cta-row',
        { y: 26, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.05,
        }
      )
    }, section)

    return () => context.revert()
  }, [activeFilmIndex])

  useEffect(() => {
    const media = mediaRef.current
    if (!media) return undefined

    const film = heroFilms[activeFilmIndex]
    transitionLockRef.current = false

    if (film.type === 'image') {
      gsap.killTweensOf(media)
      gsap.fromTo(
        media,
        { autoAlpha: 0, scale: 1.04 },
        { autoAlpha: 1, scale: 1, duration: 0.85, ease: 'power2.out' }
      )

      const timer = setTimeout(() => {
        changeFilm((activeFilmIndex + 1) % heroFilms.length)
      }, (film.maxTime || 7) * 1000)

      return () => {
        clearTimeout(timer)
        gsap.killTweensOf(media)
      }
    } else {
      media.currentTime = 0
      media.muted = true
      media.defaultMuted = true
      media.volume = 0

      const revealVideo = () => {
        media.muted = true
        media.volume = 0
        media.play().catch(() => undefined)
        gsap.fromTo(
          media,
          { autoAlpha: 0, scale: 1.018 },
          { autoAlpha: 1, scale: 1, duration: 0.72, ease: 'power2.out' }
        )
      }

      if (media.readyState >= 3) {
        revealVideo()
      } else {
        media.addEventListener('canplay', revealVideo, { once: true })
      }

      return () => {
        media.removeEventListener('canplay', revealVideo)
        media.pause()
        gsap.killTweensOf(media)
      }
    }
  }, [activeFilmIndex])

  const handleFilmProgress = (event) => {
    const film = heroFilms[activeFilmIndex]
    if (film.type === 'video' && event.currentTarget.currentTime >= film.maxTime) {
      changeFilm((activeFilmIndex + 1) % heroFilms.length)
    }
  }

  const activeFilm = heroFilms[activeFilmIndex]

  return (
    <section className="hero-scroll" ref={sectionRef}>
      <div className="hero-sticky">
        {activeFilm.type === 'image' ? (
          <img
            key={activeFilm.src}
            ref={mediaRef}
            className="hero-video"
            src={activeFilm.src}
            alt={activeFilm.label}
          />
        ) : (
          <video
            key={activeFilm.src}
            ref={mediaRef}
            className="hero-video"
            src={activeFilm.src}
            muted
            defaultMuted
            autoPlay
            playsInline
            preload="auto"
            onTimeUpdate={handleFilmProgress}
            onEnded={() => changeFilm((activeFilmIndex + 1) % heroFilms.length)}
            aria-label={activeFilm.label}
          />
        )}
        <div className="hero-shade" />
        <div className="hero-grain" />

        <div className="shell hero-content !justify-center" ref={heroContentRef}>
          <div className="hero-copy-block !w-full !max-w-[880px] !text-center !mx-auto flex flex-col items-center justify-center">
            <h1 key={activeFilmIndex} className="font-serif select-none m-0 p-0 leading-none text-center">
              <span 
                className="hero-title-line font-serif font-extrabold uppercase tracking-[0.05em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] text-[clamp(44px,5.2vw,84px)] block leading-[1.02] text-center mx-auto"
                style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
              >
                {activeFilm.titleLine1}
              </span>
              <span 
                className={`hero-title-line font-serif italic text-[clamp(48px,5.8vw,92px)] block mt-2 drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)] leading-[1.05] text-center mx-auto ${activeFilm.titleLine2Class || "text-[#e5a93c]"}`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {activeFilm.titleLine2}
              </span>
            </h1>
            <div className="hero-cta-row !justify-center !mx-auto mt-8" key={`cta-${activeFilmIndex}`}>
              {activeFilm.ctaLink.startsWith('http') || activeFilm.ctaLink.startsWith('#') ? (
                <a className="button button-gold" href={activeFilm.ctaLink} target={activeFilm.ctaLink.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">
                  {activeFilm.ctaText} <ArrowRight size={17} />
                </a>
              ) : (
                <Link className="button button-gold" to={activeFilm.ctaLink}>
                  {activeFilm.ctaText} <ArrowRight size={17} />
                </Link>
              )}
            </div>
          </div>
        </div>

        <a className="scroll-cue" href="#arrivals" aria-label="Scroll to featured arrivals">
          <ArrowDown size={17} />
        </a>

        <div className="hero-film-dots flex items-center gap-3" role="tablist" aria-label="Hero films">
          {heroFilms.map((film, index) => (
            <button
              key={film.src}
              type="button"
              className={index === activeFilmIndex ? 'active' : ''}
              onClick={() => changeFilm(index)}
              role="tab"
              aria-selected={index === activeFilmIndex}
              aria-label={`Play hero slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
