import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './HeroScrollVideo.css'

gsap.registerPlugin(ScrollTrigger)

export default function HeroScrollVideo() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const mediaRef = useRef(null)
  const introRef = useRef(null)
  const terroirRef = useRef(null)
  const editionRef = useRef(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let context

    const createExperience = () => {
      if (reducedMotion || window.innerWidth <= 768) return

      context = gsap.context(() => {
        // Intro text animations on load
        gsap.fromTo(
          introRef.current.children,
          { y: 68, autoAlpha: 0, clipPath: 'inset(0 0 100% 0)' },
          {
            y: 0,
            autoAlpha: 1,
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.05,
            stagger: 0.16,
            ease: 'power3.out',
            delay: 0.12,
            clearProps: 'transform,clipPath', // keep opacity
          },
        )



        // Text sequencing timeline (loops with the video)
        const timeline = gsap.timeline({
          repeat: -1,
          defaults: { ease: 'power2.inOut' }
        })

        timeline
          // Intro stays for a bit, then fades out
          .to(introRef.current, { y: -45, autoAlpha: 0, duration: 1 }, 2.5)
          // Terroir fades in
          .fromTo(terroirRef.current, { x: -45, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1 }, 3.5)
          // Terroir fades out
          .to(terroirRef.current, { x: 28, autoAlpha: 0, duration: 1 }, 6.0)
          // Edition fades in
          .fromTo(editionRef.current, { x: 45, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1 }, 7.0)
          // Edition fades out before loop restarts
          .to(editionRef.current, { y: -24, autoAlpha: 0, duration: 1 }, 9.5)
          // Reset intro for the next loop (so it matches the 10 second loop of the video)
          .set(introRef.current, { y: 68, autoAlpha: 0 }, 10)

      }, sectionRef)
    }

    createExperience()

    return () => {
      context?.revert()
    }
  }, [])

  return (
    <section className="hero-scroll" id="home" ref={sectionRef}>
      <div className="hero-stage" ref={stageRef}>
        <div className="hero-mobile-only">
          <img src="/assets/mobile-hero.jpg" alt="Millionaires Collection" />
          <div className="hero-mobile-text">
            <p>Millionaires Collection</p>
            <h1>Premier Sparkling Wine</h1>
          </div>
        </div>

        <div className="hero-desktop-only">
          <div className="hero-media" ref={mediaRef}>
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-label="Millionaires Collection sparkling wine film sequence"
            >
              <source src="https://res.cloudinary.com/oioqrgj0/video/upload/v1789992104/millionaire-store/hero/mgy82l4bxwmkq9o9pyvc.mp4" type="video/mp4" />
              <source src="/assets/hero-film.mp4" type="video/mp4" />
            </video>
            <div className="hero-film-shade" />
          </div>

          <div className="hero-intro shell" ref={introRef}>
            <p>Méthode Cap Classique</p>
            <h1><span>The 2021</span>Limited Edition</h1>
          </div>

          <article className="hero-chapter hero-terroir" ref={terroirRef}>
            <strong>13</strong>
            <h2>Distinct Terroirs</h2>
          </article>

          <article className="hero-chapter hero-edition" ref={editionRef}>
            <h2>The <em>Millionaire</em> Marque</h2>
            <p>Timeless sophistication crafted for connoisseurs.</p>
            <a href="#story">Enter the collection</a>
          </article>
        </div>
      </div>
    </section>
  )
}
