import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  ChevronLeft, Gavel, PackageCheck, Heart, AlertCircle, 
  Trophy, CheckCircle2, Clock, Sparkles, CreditCard, 
  ExternalLink, ShieldCheck, ChevronRight 
} from 'lucide-react';
import Price from '../../components/ui/Price';
import BidderKycCard from '../../components/auction/BidderKycCard';

export default function UserAuctionDashboard() {
  const [bids, setBids] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [wonLots, setWonLots] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const res = await api.get(`/auction/user/dashboard`, {
          headers: { Authorization: `Bearer ${userInfo?.token}` }
        });
        setBids(res.data.activeLots);
        setWonLots(res.data.wonLots);
        setWatchlist(res.data.watchlist);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#e1bd70]">Loading...</div>;
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 md:gap-12">

        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-[#eee8dd] font-serif text-4xl font-medium tracking-tight mb-2 flex items-center gap-4">
              <Gavel className="text-purple-500" size={32} /> Auction Bids
            </h1>
            <p className="text-[#918a7f]">Track your active bids, watched lots, and auction wins.</p>
          </div>
        </div>

        {/* 18+ Bidder Qualification & VIP Upgrade */}
        <BidderKycCard />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Active Bids */}
          <div className="bg-[#11100d] border border-white/5 rounded-xl p-6">
            <h2 className="text-[#eee8dd] text-lg font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
              <Gavel size={18} className="text-gold-gradient" /> Active Bids
            </h2>
            {bids.length > 0 ? (
              <div className="space-y-4">
                {bids.map(lot => (
                  <div key={lot._id} className="flex justify-between items-center bg-black/40 p-4 rounded-lg border border-white/5">
                    <div>
                      <Link to={`/auction/${lot._id}`} className="text-white hover:text-gold-gradient transition-colors font-serif block">{lot.title}</Link>
                      <span className="text-xs text-[#918a7f]">Current Bid: <Price amount={lot.currentBid.toLocaleString('en-ZA')} /></span>
                    </div>
                    <Link to={`/auction/${lot._id}`} className="px-3 py-1 bg-gold-gradient text-black rounded text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#918a7f]">
                <p className="mb-4">You have no active bids.</p>
                <Link to="/auction" className="text-gold-gradient hover:text-white underline text-sm">Explore live auctions</Link>
              </div>
            )}
          </div>

          {/* Won Auctions */}
          <div className="bg-white/[0.02] border border-white/[0.07] hover:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--color-gold)]/10 text-gold-gradient rounded-xl border border-[var(--color-gold)]/20 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                  <Trophy size={18} />
                </div>
                <div>
                  <h2 className="text-white font-serif text-xl tracking-wide flex items-center gap-2">
                    Won Lots
                  </h2>
                  <p className="text-[var(--color-ivory-muted)] text-xs font-light">
                    Auction acquisitions & settlement records
                  </p>
                </div>
              </div>
              {wonLots.length > 0 && (
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/25">
                  {wonLots.length} {wonLots.length === 1 ? 'Lot' : 'Lots'}
                </span>
              )}
            </div>

            {wonLots.length > 0 ? (
              <div className="space-y-4">
                {wonLots.map((lot) => {
                  const lotImage = lot.images && lot.images[0] ? lot.images[0] : null;
                  const lotNumberFormatted = lot.lotNumber || (lot._id ? lot._id.slice(-6).toUpperCase() : '');
                  const isPaid = lot.paymentStatus === 'Paid' || lot.isPaid;
                  const isVerifying = !isPaid && (lot.paymentStatus === 'Awaiting_Approval' || lot.proofUrl);
                  const isPendingPayment = !isPaid && !isVerifying;

                  return (
                    <div
                      key={lot._id}
                      className="bg-black/40 hover:bg-black/60 border border-white/[0.08] hover:border-[var(--color-gold)]/30 rounded-xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                    >
                      {/* Subtle luxury ambient glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/[0.03] rounded-full blur-2xl pointer-events-none group-hover:bg-[var(--color-gold)]/[0.06] transition-colors"></div>

                      {/* Header row: Image + Lot info */}
                      <div className="flex gap-3 sm:gap-4 items-start">
                        {/* Lot Thumbnail */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-[#141414] border border-white/10 p-1 shrink-0 overflow-hidden flex items-center justify-center relative group-hover:border-[var(--color-gold)]/30 transition-colors">
                          {lotImage ? (
                            <img
                              src={lotImage}
                              alt={lot.title}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-white/30 gap-1">
                              <Gavel size={20} className="text-[var(--color-gold)]/50" />
                              <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">LOT</span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--color-gold)] font-bold bg-[var(--color-gold)]/10 px-2 py-0.5 rounded border border-[var(--color-gold)]/20">
                              LOT {lotNumberFormatted}
                            </span>
                            {lot.category && (
                              <span className="text-[10px] uppercase tracking-wider text-white/40 font-light truncate max-w-[150px]">
                                {lot.category}
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/auction/${lot._id}`}
                            className="text-white hover:text-[var(--color-gold)] transition-colors font-serif block text-base sm:text-lg font-normal leading-snug line-clamp-2"
                          >
                            {lot.title}
                          </Link>

                          {lot.vendor?.storeName && (
                            <p className="text-[11px] text-white/40 font-light mt-0.5">
                              Consignor: <span className="text-white/60">{lot.vendor.storeName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status & Actions Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-white/[0.06]">
                        {/* Status Badge */}
                        <div>
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                              <CheckCircle2 size={12} className="text-emerald-400" />
                              Payment Completed
                            </span>
                          ) : isVerifying ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/25">
                              <Clock size={12} className="text-amber-300" />
                              Awaiting Verification
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30">
                              <Sparkles size={11} className="text-[var(--color-gold)] animate-pulse" />
                              Awaiting Settlement
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {isPendingPayment && (
                            <Link
                              to={`/auction/checkout/${lot._id}`}
                              className="px-4 py-1.5 rounded-full bg-gold-gradient text-black text-[11px] font-bold uppercase tracking-wider hover:opacity-95 shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all flex items-center gap-1.5"
                            >
                              <CreditCard size={13} />
                              Pay Now
                            </Link>
                          )}

                          {isVerifying && (
                            <Link
                              to={`/auction/checkout/${lot._id}`}
                              className="px-3.5 py-1.5 rounded-full bg-[var(--color-gold)]/10 hover:bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30 text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                            >
                              <Clock size={12} />
                              View Status
                            </Link>
                          )}

                          <Link
                            to={`/auction/${lot._id}`}
                            className="px-3 py-1.5 rounded-full border border-white/10 hover:border-[var(--color-gold)]/30 text-white/70 hover:text-white bg-white/[0.02] text-[11px] font-medium uppercase tracking-wider transition-all flex items-center gap-1"
                          >
                            <ExternalLink size={12} className="text-white/40" />
                            View Lot
                          </Link>
                        </div>
                      </div>

                      {/* Financial Settlement Breakdown */}
                      <div className="mt-3.5 pt-3.5 border-t border-white/[0.06]">
                        {!isPaid ? (
                          /* Unpaid summary strip */
                          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-lg px-4 py-3">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono block">
                                Winning Hammer Bid
                              </span>
                              <div className="text-lg sm:text-xl font-serif text-white font-medium">
                                <Price amount={lot.winningBid?.toLocaleString('en-ZA')} />
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-amber-300/80 font-mono block">
                                Final invoice at checkout
                              </span>
                              <span className="text-[9px] text-white/40">
                                Includes 10% premium & 15% VAT
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Paid complete itemization */
                          <div className="bg-white/[0.015] border border-white/5 rounded-lg p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-[10px] uppercase font-mono text-white/40 border-b border-white/5 pb-1">
                              <span>Settlement Ledger</span>
                              <span>Amount</span>
                            </div>

                            <div className="flex justify-between text-xs text-white/70">
                              <span className="font-light">Winning Hammer Bid</span>
                              <span className="font-mono text-white"><Price amount={lot.winningBid?.toLocaleString('en-ZA')} /></span>
                            </div>

                            {Number(lot.buyerPremiumAmount || 0) > 0 && (
                              <div className="flex justify-between text-xs text-white/70">
                                <span className="font-light">Buyer's Premium</span>
                                <span className="font-mono text-white/90"><Price amount={lot.buyerPremiumAmount?.toLocaleString('en-ZA')} /></span>
                              </div>
                            )}

                            {Number(lot.barChargeAmount || 0) > 0 && (
                              <div className="flex justify-between text-xs text-white/70">
                                <span className="font-light">BAR Administration Fee</span>
                                <span className="font-mono text-white/90"><Price amount={lot.barChargeAmount?.toLocaleString('en-ZA')} /></span>
                              </div>
                            )}

                            {Number(lot.vatAmount || 0) > 0 && (
                              <div className="flex justify-between text-xs text-white/70">
                                <span className="font-light">Value Added Tax (15% VAT)</span>
                                <span className="font-mono text-white/90"><Price amount={lot.vatAmount?.toLocaleString('en-ZA')} /></span>
                              </div>
                            )}

                            {lot.shippingCost !== undefined && (
                              <div className="flex justify-between text-xs text-white/70">
                                <span className="font-light">Insured Logistics & Delivery</span>
                                <span className="font-mono text-white/90">
                                  {Number(lot.shippingCost) === 0 ? 'Complimentary' : <Price amount={lot.shippingCost?.toLocaleString('en-ZA')} />}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between items-baseline pt-2.5 mt-1.5 border-t border-white/10">
                              <div>
                                <span className="text-[11px] uppercase tracking-wider text-[var(--color-gold)] font-mono font-bold block">
                                  Total Paid
                                </span>
                                <span className="text-[9px] text-emerald-400/90 font-mono flex items-center gap-1 mt-0.5">
                                  <ShieldCheck size={10} /> Fully Settled
                                </span>
                              </div>
                              <div className="text-lg sm:text-xl font-serif font-bold text-white">
                                <Price amount={lot.totalPaidByBuyer?.toLocaleString('en-ZA')} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                <div className="w-12 h-12 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center justify-center mx-auto mb-3 border border-[var(--color-gold)]/20">
                  <Trophy size={22} />
                </div>
                <p className="text-white font-serif text-base mb-1">No Auction Wins Yet</p>
                <p className="text-[var(--color-ivory-muted)] text-xs max-w-sm mx-auto mb-4 font-light">
                  When your bids win in live auctions, your allocations, settlement receipts, and logistics tracking will appear here.
                </p>
                <Link
                  to="/auction"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gold-gradient text-black font-semibold text-xs tracking-wider uppercase hover:opacity-95 transition-opacity"
                >
                  Explore Live Auctions
                </Link>
              </div>
            )}
          </div>

          {/* Watchlist */}
          <div className="md:col-span-2 bg-[#11100d] border border-white/5 rounded-xl p-6">
            <h2 className="text-[#eee8dd] text-lg font-medium mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
              <Heart size={18} className="text-red-500" /> Auction Watchlist
            </h2>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {watchlist.map(lot => (
                  <Link key={lot._id} to={`/auction/${lot._id}`} className="block group">
                    <div className="bg-black/40 border border-white/5 rounded-lg overflow-hidden relative">
                      <div className="h-24 bg-[#1a1a1a] flex items-center justify-center p-2">
                         <img src={lot.images && lot.images[0] ? lot.images[0] : '/assets/auction/hibiki-17.jpeg'} alt={lot.title} className="max-h-full object-contain group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="p-3">
                        <h3 className="text-white text-xs font-serif line-clamp-1 group-hover:text-gold-gradient transition-colors">{lot.title}</h3>
                        <p className="text-[10px] text-[#918a7f] mt-1"><Price amount={(lot.currentBid || 0).toLocaleString('en-ZA')} /></p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#918a7f]">
                <p>You haven't saved any upcoming lots.</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
