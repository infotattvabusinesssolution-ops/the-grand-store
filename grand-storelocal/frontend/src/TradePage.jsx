import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  BadgeCheck,
  Blend,
  Boxes,
  Container,
  Globe2,
  PackageCheck,
  Ship,
} from 'lucide-react'
import './TradePage.css'

gsap.registerPlugin(ScrollTrigger)

const services = [
  {
    title: 'Private Label Development',
    desc: 'We work with quality suppliers and service providers to offer our clients the best private label options available. We customise every product to the client’s specifications.',
    icon: BadgeCheck,
  },
  {
    title: 'Sourcing and Blending',
    desc: 'We source a wide range of bulk wines from established producers across South Africa’s celebrated wine regions.',
    icon: Blend,
  },
  {
    title: 'Procurement and Filling',
    desc: 'We manage packaging procurement, filling, warehousing, documentation and the approvals required to get every order market-ready.',
    icon: PackageCheck,
  },
  {
    title: 'Transport and Shipping',
    desc: 'Our logistics team manages FOB, CIF and DAP shipments, including container loading, documentation and door-to-door insurance.',
    icon: Ship,
  },
]

const capabilities = [
  { icon: Globe2, value: 'Global', label: 'trade reach' },
  { icon: Boxes, value: 'End-to-end', label: 'supply support' },
  { icon: Container, value: 'FOB · CIF · DAP', label: 'shipping options' },
]

export default function TradePage() {
  const heroRef = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const sections = document.querySelectorAll('.trade-page [data-trade-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14 },
    )

    sections.forEach((section) => observer.observe(section))

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mm = gsap.matchMedia()
    
    mm.add({
      isDesktop: '(min-width: 841px)',
      isMobile: '(max-width: 840px)'
    }, (context) => {
      let { isDesktop } = context.conditions

      if (reduceMotion) {
        gsap.set('[data-hero-reveal], [data-trade-truck], [data-trade-phone]', { clearProps: 'all' })
        return
      }

      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      intro
        .fromTo('.trade-hero-bg-image', { scale: 1.1 }, { scale: 1.02, duration: 1.8 })
        .fromTo('[data-hero-reveal]', { y: 28 }, { y: 0, duration: .72, stagger: .08 }, .08)
        
      if (isDesktop) {
        intro.fromTo(
          '[data-trade-truck]',
          { x: -72, y: 32, scale: .92, opacity: 0 },
          { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' },
          .38,
        )
      }
      
      intro.fromTo('[data-trade-phone]', { x: -42, y: 28, rotation: -2 }, { x: 0, y: 0, rotation: 0, duration: 1.15, ease: 'back.out(1.18)' }, .58)

      gsap.to('[data-trade-phone]', {
        y: -10,
        rotation: -.8,
        duration: 2.35,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.2,
      })

      gsap.to('.trade-hero-bg-image', {
        yPercent: 7,
        scale: 1.07,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      if (isDesktop) {
        gsap.to('[data-trade-truck]', {
          xPercent: 24,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        })
      }

      gsap.to('[data-trade-phone]', {
        xPercent: 0,
        yPercent: -9,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })
    }, heroRef)

    return () => {
      observer.disconnect()
      mm.revert()
    }
  }, [])

  return (
    <main className="trade-page">
      <section ref={heroRef} className="trade-hero trade-motion-hero" aria-label="Grand Store global trade partnerships">
        <div className="trade-hero-media" aria-hidden="true">
          <img className="trade-hero-bg-image" src="/assets/trade/trade-port-hero-blue-v3.png" alt="" />
          <div className="trade-hero-overlay" />
          <div className="trade-hero-grid" />
        </div>

        <div className="shell trade-hero-stage">
          <div className="trade-hero-copy">
            <span className="trade-hero-eyebrow" data-hero-reveal>Grand Store Trade · South Africa</span>
            <h1 data-hero-reveal>
              <span>Global trade.</span>
              <span className="trade-hero-accent">Simplified.</span>
            </h1>
            <p data-hero-reveal>
              Sourcing, private label and logistics—from Cape Town to global markets.
            </p>
            <div className="trade-hero-actions" data-hero-reveal>
              <Link to="/trade/partner-enquiry" className="trade-button trade-button-gold">
                Partner with us <ArrowRight size={18} />
              </Link>
              <Link to="/trade/trade-export" className="trade-button trade-button-ghost">
                Explore exports
              </Link>
            </div>
          </div>

          <div className="trade-logistics-scene" aria-hidden="true">
            <div className="trade-hero-truck" data-trade-truck>
              <img
                className="trade-hero-truck-image"
                src="/assets/trade/grand-store-trade-truck-blue-v4.png"
                alt=""
              />
              <div className="trade-hero-truck-brand">
                <img className="trade-hero-truck-brand-mark" src="/logo.png" alt="" />
              </div>
            </div>
            <img
              className="trade-hero-phone"
              src="/assets/trade/grand-store-trade-phone-v2.png"
              alt=""
              data-trade-phone
            />
          </div>
        </div>
      </section>

      <section className="trade-intro" data-trade-reveal>
        <div className="shell trade-intro-grid">
          <div>
            <span className="trade-kicker">Built for modern trade</span>
            <h1>A dependable route to <span className="trade-script-accent">global markets.</span></h1>
          </div>
          <div className="trade-intro-copy">
            <p>
              Grand Store brings sourcing, private label development, procurement and export logistics into one coordinated trade service. Our team helps partners move with clarity from product selection to final delivery.
            </p>
            <Link to="/trade/trade-export" className="trade-text-link">
              Explore our export capabilities <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="shell trade-partnership-feature" data-trade-reveal>
          <div className="trade-partnership-visual">
            <span className="trade-partnership-index">01 / Partnership</span>
            <img src="/assets/trade/grand-store-trade-handshake-v2.png" alt="Grand Store international trade partners shaking hands" />
          </div>
          <div className="trade-partnership-copy">
            <span className="trade-kicker">Relationships that move markets</span>
            <h2>Built on trust.<span className="trade-script-accent">Connected globally.</span></h2>
            <p>We unite trusted producers, retailers and logistics specialists through one coordinated trade partnership—from the first conversation to final delivery.</p>
            <Link to="/trade/partner-enquiry" className="trade-text-link">
              Become a trade partner <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="shell trade-capability-strip">
          {capabilities.map(({ icon: Icon, value, label }) => (
            <div className="trade-capability" key={label}>
              <Icon size={22} strokeWidth={1.6} />
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="trade-services-section" data-trade-reveal>
        <div className="shell">
          <div className="trade-section-header">
            <div>
              <span className="trade-kicker">What we deliver</span>
              <h2>Trade made <span className="trade-script-accent">seamless.</span></h2>
            </div>
            <p>Practical, coordinated services designed to reduce complexity at every stage of the beverage supply chain.</p>
          </div>

          <div className="trade-services-grid">
            {services.map(({ title, desc, icon: Icon }, index) => (
              <article className="trade-service-card" key={title}>
                <div className="trade-service-topline">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <Icon size={25} strokeWidth={1.5} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="trade-export-section" data-trade-reveal>
        <div className="shell trade-export-layout">
          <div className="trade-export-visual">
            <img src="/assets/trade/maritime.jpeg" alt="International maritime freight and beverage exports" />
            <div className="trade-export-badge">
              <Ship size={22} />
              <span>Export-ready logistics</span>
            </div>
          </div>

          <div className="trade-export-content">
            <span className="trade-kicker">Export and logistics</span>
            <h2>From documentation to <span className="trade-script-accent">destination.</span></h2>
            <p>
              We adhere to the required wine export approval and transport procedures, maintain records and retention samples for export loads, and coordinate the shipment details that keep trade moving.
            </p>
            <ul className="trade-export-list">
              <li><span>01</span> Export preparation and approval support</li>
              <li><span>02</span> Documentation, records and retention samples</li>
              <li><span>03</span> International shipping coordination</li>
            </ul>
            <Link to="/trade/trade-procedures" className="trade-button trade-button-outline">
              View trade procedures <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="trade-closing-cta" data-trade-reveal>
        <div className="shell trade-closing-inner">
          <div>
            <span className="trade-kicker">Start a conversation</span>
            <h2>Let’s build your next <span className="trade-script-accent">route to market.</span></h2>
          </div>
          <Link to="/trade/partner-enquiry" className="trade-button trade-button-gold">
            Submit a trade enquiry <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  )
}
