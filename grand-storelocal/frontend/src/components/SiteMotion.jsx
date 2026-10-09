import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap as gsapLib } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsapLib.registerPlugin(ScrollTrigger)

export default function SiteMotion() {
  const location = useLocation()

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let revealContext
    let frame

    frame = window.requestAnimationFrame(() => {
      const sections = gsapLib.utils.toArray('main > section, main > article')

      if (reduceMotion) {
        gsapLib.set(sections, { clearProps: 'all' })
      } else {
        revealContext = gsapLib.context(() => {
          sections.forEach((section) => {
            gsapLib.fromTo(
              section,
              { autoAlpha: 0 },
              {
                autoAlpha: 1,
                duration: 0.92,
                ease: 'power3.out',
                clearProps: 'opacity,visibility',
                scrollTrigger: {
                  trigger: section,
                  start: 'top 88%',
                  once: true,
                  invalidateOnRefresh: true,
                },
              },
            )
          })
        })
      }

      ScrollTrigger.refresh()

      const hashTarget = location.hash && document.getElementById(location.hash.slice(1))
      if (hashTarget) hashTarget.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      else if (location.pathname !== '/') window.scrollTo({ top: 0, behavior: 'auto' })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      revealContext?.revert()
    }
  }, [location.hash, location.pathname, location.search])

  return null
}
