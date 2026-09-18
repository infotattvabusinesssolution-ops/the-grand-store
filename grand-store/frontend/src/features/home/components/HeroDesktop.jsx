import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

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
  const isFirstMountRef = useRef(true)
  const [activeFilmIndex, setActiveFilmIndex] = useState(0)
  const [slideProgress, setSlideProgress] = useState(0)

  const changeFilm = (nextIndex) => {
    if (nextIndex === activeFilmIndex || transitionLockRef.current) return

    const media = mediaRef.current
    if (!media) {
      setSlideProgress(0)
      setActiveFilmIndex(nextIndex)
      return
    }

    transitionLockRef.current = true
    setSlideProgress(0)
    gsap.killTweensOf(media)
    gsap.to(media, {
      autoAlpha: 0,
      scale: 1.02,
      duration: 0.38,
      ease: 'power2.inOut',
      onComplete: () => {
        setActiveFilmIndex(nextIndex)
      },
    })
  }

  // Initial Page Load Animation
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const context = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        mediaRef.current,
        { autoAlpha: 0, scale: 1.07 },
        { autoAlpha: 1, scale: 1, duration: 1.15, ease: 'power2.out' }
      )
        .fromTo(
          '.hero-glass-capsule',
          { autoAlpha: 0, scale: 0.94, y: 18 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.8 },
          '-=0.75'
        )
        .fromTo(
          '.hero-eyebrow-badge',
          { autoAlpha: 0, y: -12 },
          { autoAlpha: 1, y: 0, duration: 0.5 },
          '-=0.5'
        )
        .fromTo(
          '.hero-title-line-1',
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.55 },
          '-=0.4'
        )
        .fromTo(
          '.hero-title-line-2',
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.55 },
          '-=0.45'
        )
        .fromTo(
          '.hero-subtitle',
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.5 },
          '-=0.35'
        )
        .fromTo(
          '.hero-cta-btn',
          { autoAlpha: 0, scale: 0.94 },
          { autoAlpha: 1, scale: 1, duration: 0.45 },
          '-=0.3'
        )
        .fromTo(
          '.hero-controls-bar, .hero-side-nav, .scroll-cue',
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.6, stagger: 0.08 },
          '-=0.2'
        )
    }, section)

    return () => context.revert()
  }, [])

  // Slide-Change Text Animation
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
      return undefined
    }

    const section = sectionRef.current
    if (!section) return undefined

    const context = gsap.context(() => {
      gsap.fromTo(
        '.hero-eyebrow-badge, .hero-title-line-1, .hero-title-line-2, .hero-subtitle, .hero-cta-btn',
        { y: 12, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.6,
          stagger: 0.04,
          ease: 'power2.out',
        }
      )
    }, section)

    return () => context.revert()
  }, [activeFilmIndex])

  // Media Playback & Auto-Advance Progress
  useEffect(() => {
    const media = mediaRef.current
    if (!media) return undefined

    const film = heroFilms[activeFilmIndex]
    transitionLockRef.current = false
    setSlideProgress(0)

    if (film.type === 'image') {
      gsap.killTweensOf(media)
      gsap.fromTo(
        media,
        { autoAlpha: 0, scale: 1.03 },
        { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power2.out' }
      )

      const durationMs = (film.maxTime || 7) * 1000
      const startTime = Date.now()

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const pct = Math.min(100, (elapsed / durationMs) * 100)
        setSlideProgress(pct)

        if (elapsed >= durationMs) {
          clearInterval(progressInterval)
          changeFilm((activeFilmIndex + 1) % heroFilms.length)
        }
      }, 50)

      return () => {
        clearInterval(progressInterval)
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
    if (film.type === 'video') {
      const current = event.currentTarget.currentTime
      const maxT = film.maxTime || 10
      const pct = Math.min(100, (current / maxT) * 100)
      setSlideProgress(pct)

      if (current >= maxT) {
        changeFilm((activeFilmIndex + 1) % heroFilms.length)
      }
    }
  }

  const activeFilm = heroFilms[activeFilmIndex]

  return (
    <section className="hero-scroll" ref={sectionRef}>
      <div className="hero-sticky">
        {/* Background Media */}
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

        {/* Previous / Next Slide Nav Arrows */}
        <button
          type="button"
          onClick={() => changeFilm((activeFilmIndex - 1 + heroFilms.length) % heroFilms.length)}
          className="hero-side-nav absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/80 border border-white/10 hover:border-[#e5a93c]/60 text-white/75 hover:text-[#e5a93c] backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-60 hover:opacity-100 hover:scale-105 shadow-lg group cursor-pointer"
          aria-label="Previous hero slide"
        >
          <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => changeFilm((activeFilmIndex + 1) % heroFilms.length)}
          className="hero-side-nav absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/80 border border-white/10 hover:border-[#e5a93c]/60 text-white/75 hover:text-[#e5a93c] backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-60 hover:opacity-100 hover:scale-105 shadow-lg group cursor-pointer"
          aria-label="Next hero slide"
        >
          <ChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Centralized Hero Content */}
        <div className="shell hero-content !justify-center !items-center" ref={heroContentRef}>
          <div className="hero-copy-block !w-full !max-w-[760px] !mx-auto flex flex-col items-center justify-center text-center">
            
            {/* Luxury Glass Capsule Plaque */}
            <div className="hero-glass-capsule relative flex flex-col items-center text-center w-full px-6 py-6 sm:px-10 sm:py-7 rounded-3xl bg-black/40 backdrop-blur-[4px] border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.55)]">
              
              {/* Eyebrow Badge */}
              {activeFilm.badge && (
                <div className="hero-eyebrow-badge inline-flex items-center gap-2 px-3.5 py-1 mb-3.5 rounded-full border border-[#e5a93c]/35 bg-black/55 backdrop-blur-md text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#f3cf7a] shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                  <span className="text-[#e5a93c] text-xs">✧</span>
                  <span>{activeFilm.badge}</span>
                  <span className="text-[#e5a93c] text-xs">✧</span>
                </div>
              )}

              {/* Centralized & Scaled Down Luxury Typography */}
              <h1 key={`title-${activeFilmIndex}`} className="font-serif select-none m-0 p-0 text-center flex flex-col items-center">
                <span 
                  className="hero-title-line-1 font-serif font-bold uppercase tracking-[0.14em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] text-xl sm:text-2xl md:text-3xl lg:text-[32px] block leading-tight text-center"
                  style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
                >
                  {activeFilm.titleLine1}
                </span>
                <span 
                  className={`hero-title-line-2 font-serif italic text-2xl sm:text-3xl md:text-4xl lg:text-[42px] block mt-1 drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)] leading-tight text-center ${activeFilm.titleLine2Class || "text-[#e5a93c]"}`}
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {activeFilm.titleLine2}
                </span>
              </h1>

              {/* Subtitle / Description */}
              {activeFilm.subtitle && (
                <p 
                  key={`sub-${activeFilmIndex}`}
                  className="hero-subtitle text-xs sm:text-[13px] md:text-sm font-sans font-normal text-white/85 tracking-[0.03em] leading-relaxed max-w-lg mx-auto mt-2.5 mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
                >
                  {activeFilm.subtitle}
                </p>
              )}

              {/* CTA Action */}
              <div className="hero-cta-btn" key={`cta-${activeFilmIndex}`}>
                {activeFilm.ctaLink.startsWith('http') || activeFilm.ctaLink.startsWith('#') ? (
                  <a 
                    className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[11px] font-semibold tracking-[0.18em] uppercase bg-gradient-to-r from-[#e5a93c] via-[#f7d383] to-[#c9a35b] text-[#120f09] hover:from-[#ffe8a8] hover:to-[#dfaf4d] shadow-[0_4px_22px_rgba(229,169,60,0.35)] transition-all duration-300 hover:scale-[1.04] group cursor-pointer"
                    href={activeFilm.ctaLink} 
                    target={activeFilm.ctaLink.startsWith('http') ? '_blank' : '_self'} 
                    rel="noreferrer"
                  >
                    <span>{activeFilm.ctaText}</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <Link 
                    className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[11px] font-semibold tracking-[0.18em] uppercase bg-gradient-to-r from-[#e5a93c] via-[#f7d383] to-[#c9a35b] text-[#120f09] hover:from-[#ffe8a8] hover:to-[#dfaf4d] shadow-[0_4px_22px_rgba(229,169,60,0.35)] transition-all duration-300 hover:scale-[1.04] group cursor-pointer"
                    to={activeFilm.ctaLink}
                  >
                    <span>{activeFilm.ctaText}</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* Bottom Bar: Auto-Scroll Progress & Slide Selection */}
        <div className="hero-controls-bar absolute bottom-9 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2.5">
          
          {/* Linear Progress Bar Indicator */}
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 shadow-xl">
            <span className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-[#e5a93c]">
              0{activeFilmIndex + 1}
            </span>
            <div className="w-24 sm:w-32 h-[3px] bg-white/20 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-[#e5a93c] to-[#fff3cc] rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${slideProgress}%` }}
              />
            </div>
            <span className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-white/50">
              0{heroFilms.length}
            </span>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero films">
            {heroFilms.map((film, index) => (
              <button
                key={film.src}
                type="button"
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  index === activeFilmIndex 
                    ? 'w-6 bg-gradient-to-r from-[#e5a93c] to-[#f7d383]' 
                    : 'w-1.5 bg-white/35 hover:bg-white/60'
                }`}
                onClick={() => changeFilm(index)}
                role="tab"
                aria-selected={index === activeFilmIndex}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

        </div>

        {/* Scroll-Down Cue to Arrivals */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('arrivals');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="scroll-cue absolute bottom-8 right-8 sm:right-12 z-20 flex items-center gap-2.5 text-white/70 hover:text-[#e5a93c] transition-colors cursor-pointer group"
          aria-label="Scroll to featured collection"
        >
          <span className="text-[10px] tracking-[0.22em] uppercase font-medium">DISCOVER</span>
          <div className="w-4 h-7 rounded-full border border-white/30 group-hover:border-[#e5a93c]/60 flex items-start justify-center p-1 transition-colors">
            <div className="w-1 h-1.5 bg-[#e5a93c] rounded-full animate-bounce" />
          </div>
        </button>

      </div>
    </section>
  )
}
