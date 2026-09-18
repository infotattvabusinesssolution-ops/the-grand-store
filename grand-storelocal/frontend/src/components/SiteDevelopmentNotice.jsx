import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Construction, FlaskConical, Sparkles, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const NOTICE_KEY = 'grand-store-development-notice-dismissed-v1';
const AGE_VERIFIED_EVENT = 'grand-store-age-verified';

const hasValidAgeVerification = () => {
  try {
    if (sessionStorage.getItem('age_verified')) return true;
    const stored = localStorage.getItem('ageVerified');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return Number(parsed.expiry) > Date.now();
  } catch {
    return false;
  }
};

export default function SiteDevelopmentNotice() {
  const [isOpen, setIsOpen] = useState(false);
  const continueButtonRef = useRef(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(NOTICE_KEY) === 'true';
    } catch {
      // The notice can still work when browser storage is unavailable.
    }
    if (dismissed) return undefined;

    let frame;
    const showNotice = () => {
      frame = window.requestAnimationFrame(() => setIsOpen(true));
    };

    if (hasValidAgeVerification()) showNotice();
    else window.addEventListener(AGE_VERIFIED_EVENT, showNotice, { once: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(AGE_VERIFIED_EVENT, showNotice);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    continueButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(NOTICE_KEY, 'true');
    } catch {
      // Closing the notice should never depend on storage access.
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90000] flex items-center justify-center overflow-y-auto bg-black/85 px-4 py-6 backdrop-blur-md sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="development-notice-title"
      aria-describedby="development-notice-description"
    >
      <section className="relative my-auto w-full max-w-2xl overflow-hidden rounded-sm border border-[#c9a35b]/35 bg-[#0d0c0a] text-[#eee8dd] shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e1bd70] to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c9a35b]/10 blur-3xl" />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Close development notice"
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/20 p-2 text-white/45 transition hover:border-white/25 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="relative px-6 pb-7 pt-9 sm:px-10 sm:pb-10 sm:pt-11">
          <div className="inline-flex items-center gap-2 border border-[#c9a35b]/25 bg-[#c9a35b]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#dfbf7a]">
            <Construction size={14} /> Development preview
          </div>

          <h2 id="development-notice-title" className="mt-6 max-w-xl font-serif text-3xl leading-tight text-[#f5efe5] sm:text-5xl">
            The Grand Store is still being perfected.
          </h2>
          <p id="development-notice-description" className="mt-5 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
            You are viewing an early version of our online store. We are actively refining the catalogue, vendor marketplace, auctions, events and checkout experience before the official launch.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="border border-white/[0.08] bg-white/[0.025] p-4">
              <Sparkles size={18} className="text-[#d8b76d]" />
              <h3 className="mt-3 text-sm font-semibold text-white/85">Content may change</h3>
              <p className="mt-1.5 text-xs leading-5 text-white/45">Product information, prices, stock availability and delivery estimates may still be updated.</p>
            </div>
            <div className="border border-white/[0.08] bg-white/[0.025] p-4">
              <FlaskConical size={18} className="text-[#d8b76d]" />
              <h3 className="mt-3 text-sm font-semibold text-white/85">Some features are in testing</h3>
              <p className="mt-1.5 text-xs leading-5 text-white/45">If something behaves unexpectedly, please contact us—your feedback helps us improve the launch experience.</p>
            </div>
          </div>

          <p className="mt-6 border-l-2 border-[#c9a35b]/60 pl-4 text-xs leading-5 text-white/45">
            Important purchases, bookings and payments should be treated as confirmed only after you receive an official confirmation from our team.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              ref={continueButtonRef}
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#c9a35b] px-6 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#e1bd70] focus:outline-none focus:ring-2 focus:ring-[#e1bd70] focus:ring-offset-2 focus:ring-offset-[#0d0c0a]"
            >
              Continue exploring <ArrowRight size={15} />
            </button>
            <a
              href="/contact-us"
              onClick={dismiss}
              className="inline-flex min-h-12 items-center justify-center border border-white/15 px-6 text-xs font-bold uppercase tracking-[0.16em] text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
            >
              Contact our team
            </a>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
