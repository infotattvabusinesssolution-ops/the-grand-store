import { useState, useEffect, useRef } from 'react'
import { gsap as gsapLib } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Award, Truck, Sparkles, CheckCircle2 } from 'lucide-react'

gsapLib.registerPlugin(ScrollTrigger)

export default function WhyChooseUs() {
  const [activeTab, setActiveTab] = useState(null)
  const sectionRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return undefined

    video.playbackRate = 0.94
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reduceMotion) video.play().catch(() => undefined)
      else video.pause()
    }, { rootMargin: '100px 0px', threshold: 0.08 })

    observer.observe(section)
    const ctx = gsapLib.context(() => {
      gsapLib.from('.why-card', {
        y: 22,
        scale: 0.99,
        stagger: 0.1,
        duration: 0.65,
        ease: 'power2.out',
        immediateRender: false,
        clearProps: 'transform',
        scrollTrigger: { trigger: section, start: 'top 90%', once: true },
      })
    }, section)

    return () => {
      observer.disconnect()
      video.pause()
      ctx.revert()
    }
  }, [])

  const pillars = [
    {
      id: '01',
      icon: Award,
      titlePrefix: '',
      titleAccent: 'Quality',
      description: 'All our beverages are supplied by proven manufacturers and distributors from all around the world. We are very selective with our choices and guarantee a high class quality product with great Service. A good product quality is paramount to our business’s bottom line. All our selection of wines have been tasted and reviewed by South Africa’s top panels and most importantly our very own valued consumer customers.',
      highlight: '100% Certified Provenance',
    },
    {
      id: '02',
      icon: Truck,
      titlePrefix: 'Domestic &',
      titleAccent: 'Commercial',
      description: 'The market value of the E-commerce industry has grown phenomenally.With the pandemic we saw an unexpected boost to the online shopping preferences among consumers. We at Grandstore are able to deliver throughout South Africa and internationally with a cost effective and On time principle by partnering with reputed shipping and logistic companies',
      highlight: 'Insured Temperature Transit',
    },
    {
      id: '03',
      icon: Sparkles,
      titlePrefix: 'Best',
      titleAccent: 'Cost',
      description: 'One of the most nerve-wracking tasks in e-commerce is determining your product pricing. We have adopted a cost-based pricing model. We offer our valued consumer customers the most suitable price which is fair and affordable.',
      highlight: 'Transparent Estate Pricing',
    },
  ]

  return (
    <section 
      className="relative overflow-hidden border-t border-white/10 bg-[#141414] py-11 md:py-14"
      ref={sectionRef} 
      id="why-us"
    >
      {/* Ambient Radial Golden Glows (Matching Vendor Dashboard) */}
      <div className="absolute -top-40 right-0 w-[400px] h-[400px] bg-[var(--color-gold)]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 left-0 w-[400px] h-[400px] bg-[var(--color-gold)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[1320px] px-5 sm:px-7 xl:px-10">
        
        {/* Header & KPI Summary Section */}
        <div className="mb-8 flex flex-col justify-between gap-6 text-left md:mb-9 lg:flex-row lg:items-end">
          <div className="max-w-[680px]">
            <h2 className="m-0 font-serif text-[clamp(44px,4.2vw,66px)] font-medium leading-[1] tracking-[-0.035em] text-[#eee8dd]">
              Why <span className="text-[#dfbd72]">Choose Us</span>
            </h2>
            <p className="mt-4 max-w-[650px] text-[16px] leading-[1.65] text-[rgba(244,238,224,0.76)] md:text-[18px]">
              <span className="font-serif text-[#f0cf76] italic text-[1.06em]">Uncompromising excellence.</span>{' '}
              Quiet expertise, trusted provenance and thoughtful service from our cellar to your door.
            </p>
          </div>

          {/* KPI Stats Trio */}
          <div className="grid shrink-0 grid-cols-3 gap-2.5 sm:gap-3">
            <div className="group min-w-0 rounded-xl border border-white/10 bg-[#11100d] p-3 text-center transition-all hover:border-[#c9a35b]/40 sm:min-w-[128px] sm:p-4">
              <div className="mb-1 font-serif text-2xl font-bold text-[#dfbd72] sm:text-[28px]">100%</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a69e92] sm:text-[11px]">Estate Direct</div>
            </div>
            <div className="group min-w-0 rounded-xl border border-white/10 bg-[#11100d] p-3 text-center transition-all hover:border-[#c9a35b]/40 sm:min-w-[128px] sm:p-4">
              <div className="mb-1 font-serif text-2xl font-bold text-[#dfbd72] sm:text-[28px]">500+</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a69e92] sm:text-[11px]">Curated Bottles</div>
            </div>
            <div className="group min-w-0 rounded-xl border border-white/10 bg-[#11100d] p-3 text-center transition-all hover:border-[#c9a35b]/40 sm:min-w-[128px] sm:p-4">
              <div className="mb-1 font-serif text-2xl font-bold text-[#dfbd72] sm:text-[28px]">24/7</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a69e92] sm:text-[11px]">Cellar Concierge</div>
            </div>
          </div>
        </div>

        {/* Interactive Experience Grid */}
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
          
          {/* 3 Pillars List */}
          <div className="flex flex-col gap-3 text-left lg:col-span-7">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon
              const isActive = activeTab === idx
              return (
                <div
                  key={pillar.id}
                  onMouseEnter={() => setActiveTab(idx)}
                  onMouseLeave={() => setActiveTab(null)}
                  className={`why-card group relative overflow-hidden rounded-xl border px-4 py-4 text-left shadow-lg transition-all duration-300 md:px-5 md:py-[18px] ${
                    isActive 
                      ? 'border-[#c9a35b]/60 bg-[#15120e] shadow-[0_8px_30px_rgba(0,0,0,0.45)]' 
                      : 'border-white/10 bg-[#11100d] hover:border-[#c9a35b]/40 hover:bg-[#15120e]'
                  }`}
                >
                  {/* Glowing blur orb */}
                  <div className="absolute -top-10 -right-10 w-36 h-36 bg-[var(--color-gold)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-gold)]/20 transition-all pointer-events-none" />

                  {/* Active Indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d5ad58]" />
                  )}

                  <div className="relative z-10 grid grid-cols-[54px_minmax(0,1fr)] items-start gap-4 text-left sm:grid-cols-[60px_minmax(0,1fr)] sm:gap-5">
                    
                    {/* Large Icon & Number Column */}
                    <div className="flex shrink-0 flex-col items-center justify-start gap-2.5">
                      <div className={`flex h-[50px] w-[50px] items-center justify-center rounded-xl border shadow-md transition-all duration-300 ${
                        isActive 
                          ? 'border-[#c9a35b] bg-[#1a1711] text-[#dfbd72] shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                          : 'border-white/10 bg-[#0a0a0a] text-[#918a7f] group-hover:text-[#dfbd72] group-hover:border-[#c9a35b]/50'
                      }`}>
                        <Icon size={23} strokeWidth={1.5} className="text-[#dfbd72]" />
                      </div>
                      <span className="shrink-0 font-serif text-[24px] font-bold tracking-tight text-[#dfbd72] md:text-[27px]">
                        {pillar.id}
                      </span>
                    </div>

                    {/* Content Column */}
                    <div className="text-left flex-1">
                      <h3 className="m-0 text-left font-serif text-[27px] font-medium leading-[1.05] text-[#eee8dd] transition-colors group-hover:text-white md:text-[31px]">
                        {pillar.titlePrefix && <>{pillar.titlePrefix}{' '}</>}
                        <span className="inline-block pr-1 font-serif text-[#dfbd72]">
                          {pillar.titleAccent}
                        </span>
                      </h3>
                      <p className="mb-0 mt-2 text-left text-[15px] font-normal leading-[1.52] text-[rgba(244,238,224,0.78)] md:text-[16px]">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Video & Dynamic Highlight Frame (Vendor Health / Intelligence style) */}
          <div className="group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#11100d] p-5 shadow-2xl transition-all hover:border-[#c9a35b]/40 sm:p-6 lg:col-span-5 lg:min-h-0">
            <video 
              className="absolute inset-0 w-full h-full object-cover scale-[1.02] transition-transform duration-700 group-hover:scale-105 opacity-80" 
              ref={videoRef} 
              src="/assets/media/why-choose-us.mp4" 
              muted 
              loop 
              playsInline 
              disablePictureInPicture
              preload="metadata"
              aria-label="Friends enjoying wine together"
            />
            {/* Ambient Darkened Gradient Overlays */}
            <div className="absolute inset-0 bg-black/55 pointer-events-none" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-gold)]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute inset-2.5 border border-white/10 rounded-lg pointer-events-none" />

            {/* Floating Top Badge */}
            <div className="relative z-10 self-start">
              <span className="inline-flex items-center gap-2 rounded-lg border border-[#c9a35b]/40 bg-black/75 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.13em] text-[#dfbd72] shadow-lg backdrop-blur-md">
                <CheckCircle2 size={14} className="text-[#e6c97a]" />
                {activeTab === null ? 'The Grand Store Standard' : pillars[activeTab].highlight}
              </span>
            </div>

            {/* Bottom Caption Box */}
            <div className="relative z-10 mt-auto p-4 rounded-lg bg-black/65 backdrop-blur-md border border-white/10 text-left">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#dfbd72]">
                The Connoisseur Experience
              </div>
              <p className="m-0 font-serif text-[17px] italic leading-[1.5] text-[var(--color-ivory)] sm:text-[19px]">
                “The pleasure of good company, elevated by extraordinary craft.”
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Trust Guarantee Strip */}
        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-left md:grid-cols-4">
          {[
            'Temperature Insured',
            'Certified Provenance',
            'Sommelier Support',
            'Global Dispatch',
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="group flex items-center gap-3 rounded-lg border border-white/5 bg-[#11100d] p-3.5 transition-all hover:border-[#c9a35b]/30"
            >
              <div className="p-1.5 rounded-md bg-[var(--color-gold)]/10 text-[#dfbd72] border border-[var(--color-gold)]/20 group-hover:bg-[var(--color-gold)]/20 transition-colors shrink-0">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.05em] sm:tracking-[0.13em] text-[var(--color-ivory)] leading-snug break-words">
                {item}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
