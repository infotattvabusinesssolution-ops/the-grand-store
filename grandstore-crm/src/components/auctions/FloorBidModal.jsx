import React, { useState, useEffect } from 'react';
import { X, Gavel, DollarSign, User, Phone, Plus } from 'lucide-react';

export default function FloorBidModal({ isOpen, onClose, onPlaceBid, lot }) {
  const currentBid = Number(lot?.currentBid || lot?.startingBid || 0);
  const increment = Number(lot?.bidIncrement || 500);
  const minNextBid = currentBid + increment;

  const [bidAmount, setBidAmount] = useState(minNextBid);
  const [bidderName, setBidderName] = useState('');
  const [bidderNumber, setBidderNumber] = useState('');
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lot) {
      const next = Number(lot.currentBid || lot.startingBid || 0) + Number(lot.bidIncrement || 500);
      setBidAmount(next);
      setBidderNumber(`PADDLE-${Math.floor(100 + Math.random() * 900)}`);
    }
    setError('');
  }, [lot, isOpen]);

  if (!isOpen || !lot) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(bidAmount);
    if (amount <= currentBid) {
      setError(`Bid amount must exceed current bid of R ${currentBid.toLocaleString()}`);
      return;
    }

    try {
      setBidding(true);
      setError('');
      await onPlaceBid(lot._id, {
        amount,
        bidderName: bidderName.trim() || 'Floor Bidder',
        bidderNumber: bidderNumber.trim()
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to place floor bid');
    } finally {
      setBidding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Gavel size={18} className="text-blue-600" />
              Place Floor / Phone Bid
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

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block">Current High Bid</span>
            <span className="text-base font-bold text-slate-900">R {currentBid.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Minimum Next Bid</span>
            <span className="text-base font-bold text-blue-700">R {minNextBid.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Enter Bid Amount (ZAR) *</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="number"
                min={minNextBid}
                required
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setBidAmount((prev) => Number(prev) + 1000)}
                className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-0.5"
              >
                <Plus size={10} /> R1,000
              </button>
              <button
                type="button"
                onClick={() => setBidAmount((prev) => Number(prev) + 5000)}
                className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-0.5"
              >
                <Plus size={10} /> R5,000
              </button>
              <button
                type="button"
                onClick={() => setBidAmount((prev) => Number(prev) + 10000)}
                className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-0.5"
              >
                <Plus size={10} /> R10,000
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Paddle / Ref Number</label>
              <input 
                type="text"
                placeholder="e.g. PADDLE-42"
                value={bidderNumber}
                onChange={(e) => setBidderNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Bidder Name / Channel</label>
              <input 
                type="text"
                placeholder="e.g. Phone - John Doe"
                value={bidderName}
                onChange={(e) => setBidderName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
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
              disabled={bidding}
              className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Gavel size={14} />
              {bidding ? 'Submitting Bid...' : 'Submit Floor Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
