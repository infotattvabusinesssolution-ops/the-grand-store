import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight, X, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import api from '../../../api';
import Price from '../../../components/ui/Price';

export default function AuctionWinnerHomeAlert() {
  const navigate = useNavigate();
  const [winningLot, setWinningLot] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuctionWins = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (!userInfo || !userInfo.token) return;

        // 1. Fetch user won lots from auction dashboard
        const dashRes = await api.get('/auction/user/dashboard', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }).catch(() => null);

        if (dashRes && dashRes.data && Array.isArray(dashRes.data.wonLots) && dashRes.data.wonLots.length > 0) {
          // Find the first won lot that is genuinely pending initial payment action
          const pendingLot = dashRes.data.wonLots.find((lot) => {
            if (lot.status !== 'sold') return false;
            // Exclude already paid lots
            if (lot.isPaid || lot.paymentStatus === 'Paid') return false;
            // Exclude lots where bank transfer / EFT proof is submitted & awaiting approval
            if (lot.paymentStatus === 'Awaiting_Approval' || lot.proofUrl) return false;
            // Check if dismissed in localStorage
            if (localStorage.getItem(`dismissed_auction_win_${lot._id}`)) return false;
            // Only show for strictly pending unsubmitted lots
            return lot.paymentStatus === 'Pending';
          });

          if (pendingLot && isMounted) {
            setWinningLot(pendingLot);
            return;
          }
        }

        // 2. Fallback check in notifications
        const notifRes = await api.get('/notifications?limit=15', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }).catch(() => null);

        if (notifRes && notifRes.data && Array.isArray(notifRes.data.notifications)) {
          const winNotif = notifRes.data.notifications.find(
            (n) => n.type === 'auction' && (n.title?.includes('Won') || n.message?.toLowerCase().includes('won'))
          );
          if (winNotif && isMounted) {
            const lotId = winNotif.metadata?.lotId || winNotif.link?.split('/').pop();
            if (lotId && !localStorage.getItem(`dismissed_auction_win_${lotId}`)) {
              // Fetch minimal lot details to confirm it's still unpaid and pending
              const lotRes = await api.get(`/auction/${lotId}`).catch(() => null);
              const lot = lotRes?.data?.lot;
              if (
                lot &&
                isMounted &&
                lot.status === 'sold' &&
                lot.paymentStatus === 'Pending' &&
                !lot.isPaid &&
                !lot.proofUrl
              ) {
                setWinningLot(lot);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not check won auctions on home page:', err);
      }
    };

    checkAuctionWins();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!winningLot || isDismissed) return null;

  const hammerPrice = winningLot.winningBid || winningLot.currentBid || 0;
  const lotTitle = winningLot.title || 'Exclusive Reserve Bottle';
  const lotNumber = winningLot.lotNumber || winningLot._id?.slice(-6)?.toUpperCase() || 'GS-LOT';
  const lotImage = winningLot.images && winningLot.images.length > 0 ? winningLot.images[0] : null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (winningLot?._id) {
      try {
        localStorage.setItem(`dismissed_auction_win_${winningLot._id}`, 'true');
      } catch (e) {
        // ignore
      }
    }
  };

  const handleGoToLot = () => {
    if (winningLot?._id) {
      try {
        localStorage.setItem(`dismissed_auction_win_${winningLot._id}`, 'true');
      } catch (e) {
        // ignore
      }
      navigate(`/auction/${winningLot._id}?celebrate=true`);
    }
  };

  return (
    <AnimatePresence>
      {isMinimized ? (
        /* Minimized floating ribbon pill */
        <motion.div
          key="minimized-pill"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#130f08]/95 border border-[#d4af37]/60 px-4 py-2.5 rounded-full shadow-[0_10px_35px_rgba(212,175,55,0.35)] backdrop-blur-xl cursor-pointer hover:border-[#ffd700] hover:scale-105 transition-all text-xs font-mono text-[#f9e295]"
          title="Click to view your won auction lot"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#ffd700] flex items-center justify-center text-black font-bold">
            <Trophy size={13} />
          </div>
          <span className="font-bold tracking-wider">Auction Won: Lot #{lotNumber}</span>
          <span className="text-white/40">•</span>
          <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Claim Now</span>
        </motion.div>
      ) : (
        /* Full Luxury Celebration Alert Card */
        <motion.div
          key="full-card"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 w-[calc(100vw-32px)] sm:w-[480px] max-w-full"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#181308] via-[#0e0b06] to-[#070604] border border-[#d4af37]/70 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.25)] backdrop-blur-2xl p-5 sm:p-6 text-left">
            {/* Ambient gold glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#d4af37]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#ffd700]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar with Badge & Controls */}
            <div className="flex items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-gradient-to-r from-[#d4af37]/25 to-[#ffd700]/15 text-[#ffd700] border border-[#d4af37]/40 shadow-sm">
                  <Trophy size={12} className="text-[#ffd700] animate-bounce" />
                  Auction Victory
                </span>
                <span className="text-[10px] font-mono tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck size={11} /> Highest Bidder
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="text-white/40 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors font-mono"
                  title="Minimize"
                >
                  Minimize
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex items-start gap-4 mb-4">
              {lotImage ? (
                <div className="w-16 h-20 rounded-xl bg-black/60 border border-white/10 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  <img
                    src={lotImage}
                    alt={lotTitle}
                    className="w-full h-full object-contain drop-shadow"
                  />
                </div>
              ) : (
                <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-[#1d1607] to-black border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                  <Trophy size={24} className="text-[#d4af37]" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-serif font-bold text-white tracking-wide truncate mb-1">
                  {lotTitle}
                </h4>
                <p className="text-xs text-[var(--color-ivory-muted)] font-light leading-relaxed mb-2 line-clamp-2">
                  Congratulations! You won the hammer for <span className="text-[#f9e295] font-mono font-medium">Lot #{lotNumber}</span>. Proceed to your lot page to celebrate and finalize delivery.
                </p>

                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">Winning Hammer:</span>
                  <span className="text-base font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] via-[#f5d77f] to-[#d4af37]">
                    <Price amount={hammerPrice} />
                  </span>
                </div>
              </div>
            </div>

            {/* Gold Action Button */}
            <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between gap-3">
              <span className="text-[11px] text-white/40 font-mono hidden sm:inline">
                Tamper-proof vault collection ready
              </span>
              <button
                type="button"
                onClick={handleGoToLot}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#ffd700] via-[#f5d77f] to-[#d4af37] text-black font-black uppercase tracking-widest text-[11px] py-3 px-5 rounded-xl shadow-[0_0_25px_rgba(212,175,55,0.45)] hover:shadow-[0_0_35px_rgba(212,175,55,0.7)] hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Sparkles size={14} className="text-black/80" />
                <span>Claim Lot & Celebrate</span>
                <ArrowRight size={14} className="text-black/80" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
