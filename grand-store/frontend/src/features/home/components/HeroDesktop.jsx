import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ArrowDown, ArrowRight } from 'lucide-react'

const heroFilms = [
  {
    src: '/assets/media/grand-store-hero-scrub.mp4',
    label: 'A premium whisky being served at an evening gathering',
    maxTime: 7,
    titleLine1: 'Not simply poured.',
    titleLine2: 'Remembered.',
    titleLine2Class: 'hero-title-line italic',
    ctaText: 'Explore the collection',
    ctaLink: '#arrivals',
  },
  {
    src: 'https://res.cloudinary.com/oioqrgj0/video/upload/v1788935569/grand-store/hero/auctioneer_conducts_rare_wine_auction.mp4',
    label: 'Exclusive Rare Spirits & Fine Wine Auctions',
    maxTime: 6,
    titleLine1: 'Rare Vintages.',
    titleLine2: 'Live Auctions.',
    titleLine2Class: 'hero-title-line italic text-[#e5a93c]',
    ctaText: 'Explore Live Auctions',
    ctaLink: '/auction',
  },
  {
    src: '/assets/media/grand-store-hero-third.mp4',
    label: 'Curated Masterclasses & Exclusive Tastings',
    maxTime: 13,
    titleLine1: 'Exclusive Tastings.',
    titleLine2: 'Private Events.',
    titleLine2Class: 'hero-title-line italic text-[#e5a93c]',
    ctaText: 'Discover Upcoming Events',
    ctaLink: '/events',
  },
  {
    src: 'https://res.cloudinary.com/oioqrgj0/video/upload/v1787819585/cigar-store/hero/tqvn9t0up9y8vsxrlbix.mp4',
    label: 'Premium handcrafted cigars',
    maxTime: 15,
    titleLine1: 'Premium Handcrafted',
    titleLine2: 'Cigars.',
    titleLine2Class: 'hero-title-line font-serif not-italic text-[#c9a35b]',
    ctaText: 'Explore',
    ctaLink: 'https://cigarconnoisseurclub.com',
  },
  {
    src: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2070&auto=format&fit=crop',
    isImage: true,
    label: 'Join our exclusive Wine Farm',
    maxTime: 8,
    titleLine1: 'The Grand',
    titleLine2: 'Wine Farm.',
    titleLine2Class: 'hero-title-line font-serif not-italic text-[#c9a35b]',
    ctaText: 'Explore',
    ctaLink: 'https://grandstoreglobal.com/winefarm',
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
      onComplete: () => setActiveFilmIndex(nextIndex),
    })
  }

  useEffect(() => {
    const section = sectionRef.current
    const content = heroContentRef.current
    if (!section || !content) return undefined

    const context = gsap.context(() => {
      gsap.from('.hero-title-line, .hero-cta-row', {
        y: 26,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.1,
      })
    }, section)

    return () => context.revert()
  }, [])

  useEffect(() => {
    const media = mediaRef.current
    if (!media) return undefined
    
    const activeFilm = heroFilms[activeFilmIndex]

    transitionLockRef.current = false

    if (activeFilm.isImage) {
      // It's an image, so no video events. Use a timer.
      const timer = setTimeout(() => {
        changeFilm((activeFilmIndex + 1) % heroFilms.length)
      }, (activeFilm.maxTime || 8) * 1000)

      gsap.fromTo(
        media,
        { autoAlpha: 0, scale: 1.018 },
        { autoAlpha: 1, scale: 1, duration: 0.72, ease: 'power2.out' },
      )

      return () => {
        clearTimeout(timer)
        gsap.killTweensOf(media)
      }
    }

    // It's a video
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
        { autoAlpha: 1, scale: 1, duration: 0.72, ease: 'power2.out' },
      )
    }

    if (media.readyState >= 3) revealVideo()
    else media.addEventListener('canplay', revealVideo, { once: true })

    return () => {
      media.removeEventListener('canplay', revealVideo)
      media.pause()
      gsap.killTweensOf(media)
    }
  }, [activeFilmIndex])

  const handleFilmProgress = (event) => {
    const film = heroFilms[activeFilmIndex]
    if (!film.isImage && event.currentTarget.currentTime >= film.maxTime) {
      changeFilm((activeFilmIndex + 1) % heroFilms.length)
    }
  }

  const activeFilm = heroFilms[activeFilmIndex]

  return (
    <section className="hero-scroll" ref={sectionRef}>
      <div className="hero-sticky">
        {activeFilm.isImage ? (
          <img
            key={activeFilm.src}
            ref={mediaRef}
            className="hero-video object-cover"
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

        <div className="shell hero-content" ref={heroContentRef}>
          <div className="hero-copy-block">
            <h1 key={activeFilmIndex}>
              <span className="hero-title-line">{activeFilm.titleLine1}</span>
              <span className={activeFilm.titleLine2Class || "hero-title-line italic"}>{activeFilm.titleLine2}</span>
            </h1>
            {activeFilm.ctaText && (
              <div className="hero-cta-row" key={`cta-${activeFilmIndex}`}>
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
            )}
          </div>
        </div>

        <a className="scroll-cue" href="#arrivals" aria-label="Scroll to featured arrivals">
          <ArrowDown size={17} />
        </a>

        <div className="hero-film-dots" role="tablist" aria-label="Hero films">
          {heroFilms.map((film, index) => (
            <button
              key={film.src}
              type="button"
              className={index === activeFilmIndex ? 'active' : ''}
              onClick={() => changeFilm(index)}
              role="tab"
              aria-selected={index === activeFilmIndex}
              aria-label={`Play hero film ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
