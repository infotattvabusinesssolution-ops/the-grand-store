import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function FooterPageShell({ eyebrow, title, intro, children, wide = false }) {
  useEffect(() => {
    document.title = `${title} | The Grand Store`
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [title])

  return (
    <main className="min-h-screen bg-[#0a0907] pt-28 text-[#d8d0c4] sm:pt-32">
      <header className="border-y border-[#d99d39]/20 bg-[radial-gradient(circle_at_75%_20%,rgba(217,157,57,.14),transparent_30rem)]">
        <div className={`${wide ? 'max-w-6xl' : 'max-w-4xl'} mx-auto px-6 py-14 sm:py-20`}>
          <nav className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#9d9488]" aria-label="Breadcrumb">
            <Link className="transition-colors hover:text-[#d99d39]" to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#d99d39]">{eyebrow || title}</span>
          </nav>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#d99d39]">{eyebrow || 'The Grand Store'}</p>
          <h1 className="max-w-4xl font-serif text-4xl leading-tight text-[#f6f0e6] sm:text-5xl lg:text-6xl">{title}</h1>
          {intro && <p className="mt-6 max-w-3xl text-base leading-8 text-[#b9b0a4] sm:text-lg">{intro}</p>}
        </div>
      </header>
      <div className={`${wide ? 'max-w-6xl' : 'max-w-4xl'} mx-auto px-6 py-14 sm:py-20`}>
        {children}
      </div>
    </main>
  )
}

export function ContentSection({ title, children, className = '' }) {
  return (
    <section className={`border-b border-white/10 py-8 first:pt-0 last:border-0 last:pb-0 ${className}`}>
      {title && <h2 className="mb-5 font-serif text-2xl text-[#f2ede4] sm:text-3xl">{title}</h2>}
      <div className="space-y-4 text-[15px] leading-7 text-[#c9c0b4] sm:text-base sm:leading-8">{children}</div>
    </section>
  )
}
