import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X, ArrowRight, AlertCircle } from 'lucide-react';

export default function AgeVerificationPromptModal({
  isOpen,
  onClose,
  onConfirm,
  title = "18+ Age & Bidder Verification Required",
  message = "Bidder qualification required. Please submit your 18+ age verification and ID details to request bidding approval."
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-prompt-title"
    >
      <div
        className="relative w-full max-w-md bg-[#12110e] border border-[#c9a35b]/60 rounded-3xl p-6 sm:p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden cursor-default animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gold ambient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd54f] to-transparent" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* 18+ Golden Shield Icon */}
        <div className="w-16 h-16 rounded-full bg-[#c9a35b]/15 border border-[#c9a35b]/40 flex items-center justify-center mx-auto mb-4 text-[#ffd54f] shadow-[0_0_20px_rgba(201,163,91,0.25)]">
          <div className="text-center">
            <span className="font-serif font-black text-xl tracking-tight block leading-none">18+</span>
            <span className="text-[8px] uppercase tracking-widest text-[#f5d77f] font-mono block mt-0.5">LEGAL</span>
          </div>
        </div>

        {/* Title */}
        <h3 id="age-prompt-title" className="text-2xl font-serif text-[#f4efe6] font-bold mb-2.5">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-[#c5bfae] leading-relaxed mb-6 font-light">
          {message}
        </p>

        {/* Primary Clickable Action */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ffd54f] via-[#e5b144] to-[#c9a35b] text-black font-bold uppercase tracking-wider text-xs sm:text-sm hover:shadow-[0_0_25px_rgba(212,175,55,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
          >
            <ShieldCheck size={18} />
            <span>YES, I'M 18+</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
