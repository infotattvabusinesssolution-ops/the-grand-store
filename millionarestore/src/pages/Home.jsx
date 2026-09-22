import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import HeroScrollVideo from '../components/HeroScrollVideo'
import WinemakerMessage from '../components/WinemakerMessage'
import ExperienceCollection from '../components/ExperienceCollection'
import Process from '../components/Process'
import AgeingGallery from '../components/AgeingGallery'
import GalleryVideoSection from '../components/GalleryVideoSection'
import Newsletter from '../components/Newsletter'
import EnquireForm from '../components/EnquireForm'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  useLayoutEffect(() => {
    document.title = 'Millionaires Collection — Premium Sparkling Wine'
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      gsap.set('main > section, [data-reveal]', { clearProps: 'all' })
      return undefined
    }

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1.2,
      normalizeWheel: true,
      syncTouch: true,
    })
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const context = gsap.context(() => {
      const sections = gsap.utils.toArray('main > section:not(.hero-scroll)')

      sections.forEach((section) => {
        const content = gsap.utils.toArray(section.querySelectorAll('[data-reveal]'))

        gsap.set(section, {
          y: 72,
          autoAlpha: 0,
          clipPath: 'inset(7% 0 0 0)',
          willChange: 'transform, opacity, clip-path',
        })
        gsap.set(content, { y: 46, autoAlpha: 0, willChange: 'transform, opacity' })

        const revealSection = () => {
          const timeline = gsap.timeline()

          timeline.to(section, {
            y: 0,
            autoAlpha: 1,
            clipPath: 'inset(0% 0 0 0)',
            duration: 1.05,
            ease: 'power3.out',
            clearProps: 'transform,opacity,visibility,clipPath,willChange',
          })

          if (content.length) {
            timeline.to(
              content,
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.82,
                stagger: 0.13,
                ease: 'power3.out',
                clearProps: 'transform,opacity,visibility,willChange',
              },
              '-=0.7',
            )
          }
        }

        ScrollTrigger.create({
          trigger: section,
          start: 'top 84%',
          once: true,
          invalidateOnRefresh: true,
          onEnter: revealSection,
        })
      })

      window.requestAnimationFrame(() => ScrollTrigger.refresh())
    })

    return () => {
      context.revert()
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return (
    <main>
      <HeroScrollVideo />
      <WinemakerMessage />
      <ExperienceCollection />
      <Process />
      <GalleryVideoSection />
      <AgeingGallery />
      <Newsletter />
      <EnquireForm />
    </main>
  )
}
