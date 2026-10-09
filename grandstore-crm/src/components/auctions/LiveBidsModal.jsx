import React, { useEffect, useState } from 'react';
import { X, Gavel, UserCheck, ShieldCheck, Trophy, Clock, Phone, Mail, Award, AlertCircle, RefreshCw } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function LiveBidsModal({ isOpen, onClose, lot, onFetchBids }) {
  const [bidsData, setBidsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && lot && lot._id) {
      loadBids();
    } else {
      setBidsData(null);
      setError('');
    }
  }, [isOpen, lot]);

  const loadBids = async () => {
    if (!lot?._id || !onFetchBids) return;
    try {
      setLoading(true);
      setError('');
      const data = await onFetchBids(lot._id);
      setBidsData(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load live bids history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lot) return null;

  const currentLot = bidsData?.lot || lot;
  const bidsList = bidsData?.bids || [];
  const isSoldOrClosed = currentLot.status === 'sold' || currentLot.status === 'closed';
  const winner = currentLot.winner;
  const highBidder = currentLot.highBidder;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                Lot #{currentLot.lotNumber || '—'}
              </span>
              <StatusBadge status={currentLot.status} />
              <span className="text-xs text-slate-500 font-semibold">{currentLot.category || 'Luxury Spirits'}</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Gavel size={20} className="text-blue-600 shrink-0" />
              <span>{currentLot.title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live Bidding Telemetry & Allocation Record • Read-Only Integrity View
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={loadBids}
              className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 transition-colors"
              title="Refresh live bid stream"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Close telemetry view"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs crm-scrollbar">
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pricing Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Starting Bid</span>
              <span className="text-base font-extrabold text-slate-700 font-mono mt-1 block">
                R {Number(currentLot.startingBid || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                {isSoldOrClosed ? 'Winning Hammer Bid' : 'Current High Bid'}
              </span>
              <span className="text-base font-extrabold text-blue-900 font-mono mt-1 block">
                R {Number(currentLot.winningBid || currentLot.currentBid || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Reserve Price</span>
              <span className="text-base font-extrabold text-slate-700 font-mono mt-1 block">
                R {Number(currentLot.reservePrice || 0).toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold ${
                Number(currentLot.currentBid || 0) >= Number(currentLot.reservePrice || 0) 
                  ? 'text-emerald-600' 
                  : 'text-amber-600'
              }`}>
                {Number(currentLot.currentBid || 0) >= Number(currentLot.reservePrice || 0) ? '• Reserve Met' : '• Below Reserve'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Bids Placed</span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">
                {bidsList.length || currentLot.bidCount || 0} <span className="text-xs font-normal text-slate-500">bids</span>
              </span>
            </div>
          </div>

          {/* Winner Banner (If Lot Won / Closed) */}
          {isSoldOrClosed && winner && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Trophy size={14} className="text-emerald-600" />
                  Official Lot Winner (Hammer Fell)
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                  Payment: {currentLot.paymentStatus || 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">Winner Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{winner.name || 'Private Collector'}</span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold block mt-0.5">
                    Paddle: {winner.bidderNumber || ('GS-WINNER-' + String(winner._id || '').slice(-4))}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block">Contact Particulars</span>
                  <p className="text-slate-800 font-medium flex items-center gap-1 mt-0.5 truncate">
                    <Mail size={12} className="text-slate-400" /> {winner.email || 'N/A'}
                  </p>
                  <p className="text-slate-600 flex items-center gap-1 mt-0.5">
                    <Phone size={12} className="text-slate-400" /> {winner.phone || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block">Total with Buyer's Premium (15% VAT)</span>
                  <span className="font-extrabold text-emerald-700 text-base font-mono block mt-0.5">
                    R {Number(currentLot.totalPaidByBuyer || currentLot.winningBid || currentLot.currentBid || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Current Highest Bidder Banner (If Active or Has Leading Bidder) */}
          {highBidder && (!isSoldOrClosed || !winner) && (
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-blue-600" />
                  Current Leading High Bidder
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-blue-700 border border-blue-200">
                  Leading Bid
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">Bidder Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{highBidder.name || 'Anonymous Bidder'}</span>
                  <span className="font-mono text-[10px] text-blue-800 font-bold block mt-0.5">
                    Paddle: {highBidder.bidderNumber || ('GS-B' + String(highBidder._id || '').slice(-4))}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block">Verified Contact</span>
                  <p className="text-slate-800 font-medium flex items-center gap-1 mt-0.5 truncate">
                    <Mail size={12} className="text-slate-400" /> {highBidder.email || 'N/A'}
                  </p>
                  <p className="text-slate-600 flex items-center gap-1 mt-0.5">
                    <Phone size={12} className="text-slate-400" /> {highBidder.phone || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block">Standing High Offer</span>
                  <span className="font-extrabold text-blue-900 text-base font-mono block mt-0.5">
                    R {Number(currentLot.currentBid || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Live Bids Feed & Audit Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock size={14} className="text-slate-500" />
                Live Bid Feed History ({bidsList.length})
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">
                Telemetry synchronized in real-time
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5">#</th>
                    <th className="py-2.5 px-3.5">Bidder Identity & Paddle</th>
                    <th className="py-2.5 px-3.5">Bidder Contact</th>
                    <th className="py-2.5 px-3.5">Bid Amount</th>
                    <th className="py-2.5 px-3.5">Time Placed</th>
                    <th className="py-2.5 px-3.5">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        <RefreshCw size={18} className="animate-spin mx-auto mb-1 text-blue-600" />
                        Fetching live bid stream...
                      </td>
                    </tr>
                  ) : bidsList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No online bids placed yet for this lot catalog.
                      </td>
                    </tr>
                  ) : (
                    bidsList.map((bid, index) => {
                      const isTopBid = index === 0;
                      return (
                        <tr key={bid.id || bid._id || index} className={isTopBid ? 'bg-blue-50/40 font-semibold' : 'hover:bg-slate-50/50'}>
                          <td className="py-2.5 px-3.5 text-slate-400">
                            {isTopBid ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">HIGH</span>
                            ) : (
                              `#${bidsList.length - index}`
                            )}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <div className="font-bold text-slate-900">{bid.bidder?.name || 'Anonymous Bidder'}</div>
                            <span className="font-mono text-[10px] text-blue-700 font-semibold">
                              {bid.bidder?.bidderNumber || 'GS-BIDDER'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600">
                            <div className="truncate max-w-[140px]">{bid.bidder?.email || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400">{bid.bidder?.phone || '—'}</div>
                          </td>
                          <td className="py-2.5 px-3.5 font-bold font-mono text-slate-900">
                            R {Number(bid.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">
                            {bid.createdAt ? new Date(bid.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                              {bid.type || 'Web Online'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance & Read-Only Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] text-slate-500">
            <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Integrity Guard:</strong> Bid pricing is strictly auction-governed by registered patron bids. Staff cannot manually modify, inject, or tamper with bid amounts.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Catalog Reference: {currentLot.lotNumber || currentLot._id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Close Telemetry
          </button>
        </div>

      </div>
    </div>
  );
}
