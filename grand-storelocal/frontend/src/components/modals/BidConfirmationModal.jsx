import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck } from 'lucide-react';
import Price from '../ui/Price';

export default function BidConfirmationModal({ isOpen, onClose, lot, bidAmount, isMaxBid, onConfirm, loading, currency }) {
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#11100d] border border-[#c9a35b]/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-[#eee8dd]">Confirm Your Bid</h3>
          <button onClick={onClose} disabled={loading} className="text-[#918a7f] hover:text-white transition-colors cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-[#918a7f] mb-1">You are bidding on:</p>
            <p className="font-semibold text-[#eee8dd] text-base">{lot.title}</p>
            <p className="text-xs text-gold-gradient font-mono mt-0.5">Lot {lot.lotNumber}</p>
          </div>

          <div className="bg-[#0a0907] p-4 rounded-xl border border-white/5 mb-6 text-center">
            <p className="text-xs text-[#918a7f] uppercase tracking-wider mb-1 font-semibold">{isMaxBid ? 'Your Maximum Bid' : 'Your Bid'}</p>
            <p className="text-3xl font-bold text-[#eee8dd] font-mono"><Price amount={Number(bidAmount)} /></p>
            {currency && currency !== 'ZAR' && (
              <p className="text-xs text-[var(--color-gold)] font-mono mt-1.5 opacity-90">
                ≈ R {Number(bidAmount).toLocaleString('en-ZA')} ZAR (Settlement currency)
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 bg-[#c9a35b]/10 text-gold-gradient p-4 rounded-xl text-xs sm:text-sm mb-6 border border-[#c9a35b]/20">
            <ShieldCheck size={20} className="shrink-0 mt-0.5 text-[#c9a35b]" />
            <div className="space-y-2 leading-relaxed">
              <p>
                By confirming, you agree to purchase this lot if you are the successful bidder. 
                {isMaxBid && " The system will automatically bid on your behalf up to your maximum amount."}
              </p>
              <p className="text-[#eee8dd]/80 text-[11px]">
                Please note: A Buyer's Premium, BAR charge, flat shipping fee, and VAT (15%) will be added to the final winning bid amount at checkout.
              </p>
              <p className="font-bold text-white">This is a legally binding contract.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 py-3 text-[#eee8dd] bg-transparent border border-white/20 rounded-xl hover:bg-white/5 font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              disabled={loading}
              className="flex-1 py-3 bg-gold-gradient text-black rounded-xl hover:brightness-110 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
            >
              {loading ? 'Processing...' : 'Confirm Bid'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
