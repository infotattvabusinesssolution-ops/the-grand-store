import React, { useState, useEffect } from 'react';
import { X, Gavel, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function HammerFallModal({ isOpen, onClose, onDeclareHammer, lot }) {
  const [hammerPrice, setHammerPrice] = useState(lot?.currentBid || lot?.startingBid || 0);
  const [notes, setNotes] = useState('Floor hammer fall confirmed by auctioneer.');
  const [declaring, setDeclaring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lot) {
      setHammerPrice(Number(lot.currentBid || lot.startingBid || 0));
      setNotes(`Auction hammer fell for Lot #${lot.lotNumber || lot._id} on floor.`);
    }
    setError('');
  }, [lot, isOpen]);

  if (!isOpen || !lot) return null;

  const finalPrice = Number(hammerPrice) || 0;
  const buyerPremium = Math.round(finalPrice * 0.05);
  const barFee = Math.round(finalPrice * 0.02);
  const vat = Math.round((finalPrice + buyerPremium) * 0.15);
  const totalDue = finalPrice + buyerPremium + barFee + vat;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (finalPrice <= 0) {
      setError('Please provide a valid hammer price.');
      return;
    }

    try {
      setDeclaring(true);
      setError('');
      await onDeclareHammer(lot._id, {
        hammerPrice: finalPrice,
        notes: notes.trim(),
        winnerId: lot.highBidder?._id || lot.highBidder || undefined
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to declare hammer fall');
    } finally {
      setDeclaring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Gavel size={18} className="text-amber-600" />
              Declare Hammer Fall (Going, Gone!)
            </h3>
            <p className="text-xs text-slate-500">
              Lot #{lot.lotNumber || 'N/A'}: {lot.title}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Final Hammer Price (ZAR) *</label>
            <input 
              type="number"
              min="1"
              required
              value={hammerPrice}
              onChange={(e) => setHammerPrice(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700 block mb-1">Winning Bidder</span>
            <div className="text-slate-900 font-bold">
              {lot.highBidder?.name || 'Current High Bidder (Floor / System)'}
            </div>
            {lot.highBidder?.email && (
              <div className="text-[11px] text-slate-500">{lot.highBidder.email}</div>
            )}
          </div>

          {/* Statutory Breakdown Box */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-slate-700">
            <span className="font-bold text-amber-900 text-xs block mb-1 flex items-center gap-1">
              <ShieldAlert size={13} className="text-amber-700" />
              Statutory 48h Accounting Breakdown
            </span>
            <div className="flex justify-between">
              <span>Hammer Price:</span>
              <span className="font-semibold">R {finalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Buyer's Premium (5%):</span>
              <span>R {buyerPremium.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Admin Reserve (BAR 2%):</span>
              <span>R {barFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>VAT (15%):</span>
              <span>R {vat.toLocaleString()}</span>
            </div>
            <div className="pt-1.5 border-t border-amber-200 flex justify-between font-extrabold text-slate-900 text-sm">
              <span>Total Settle Due:</span>
              <span className="text-blue-900">R {totalDue.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Auctioneer Notes</label>
            <input 
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            Declaring the hammer fall sets this lot status to <strong>Sold</strong>, sends it to the <strong>Unpaid Hammer Lots</strong> queue, and activates the Section 10 48-hour payment SLA timer.
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={declaring}
              className="px-5 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Gavel size={14} />
              {declaring ? 'Falling Hammer...' : 'Declare Sold (Hammer Fall)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
