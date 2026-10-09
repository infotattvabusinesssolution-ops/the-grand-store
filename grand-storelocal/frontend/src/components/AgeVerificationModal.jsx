import { useEffect, useState } from 'react'

const AGE_VERIFICATION_KEY = 'grand-store-age-verified'

export default function AgeVerificationModal() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return true

    try {
      return window.localStorage.getItem(AGE_VERIFICATION_KEY) !== 'true'
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const confirmAge = () => {
    try {
      window.localStorage.setItem(AGE_VERIFICATION_KEY, 'true')
    } catch {
      // The gate can still be dismissed when browser storage is unavailable.
    }

    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-5 py-8"
      style={{ zIndex: 2147483000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-verification-title"
      aria-describedby="age-verification-description"
    >
      <div className="absolute inset-0 bg-black/95" aria-hidden="true" />

      <section className="relative w-full max-w-lg border border-[#c9a35b]/55 bg-[#11100d] px-7 py-9 text-center text-[#eee8dd] shadow-2xl sm:px-12 sm:py-12">
        <img
          src="/grand-store-logo.png"
          alt="The Grand Store"
          className="mx-auto mb-8 h-auto w-full max-w-[280px] object-contain"
        />

        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-[#d8b76d]">
          Age verification
        </p>
        <h2 id="age-verification-title" className="font-serif text-4xl leading-tight text-[#f4efe6] sm:text-5xl">
          Are you over 18?
        </h2>
        <p id="age-verification-description" className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#aaa296] sm:text-base">
          You must be of legal drinking age to enter The Grand Store.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={confirmAge}
            className="min-h-12 border border-[#c9a35b] bg-[#c9a35b] px-5 text-xs font-bold uppercase tracking-[0.16em] text-[#0b0a08] transition-colors hover:bg-[#e1bd70]"
          >
            Yes, I am over 18
          </button>
          <button
            type="button"
            className="min-h-12 border border-white/20 bg-transparent px-5 text-xs font-bold uppercase tracking-[0.16em] text-[#eee8dd]"
          >
            No
          </button>
        </div>
      </section>
    </div>
  )
}
