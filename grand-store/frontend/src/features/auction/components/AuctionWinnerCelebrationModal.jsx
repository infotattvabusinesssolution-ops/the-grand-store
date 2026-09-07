import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Sparkles, CheckCircle2, ArrowRight, X, ShieldCheck, Download } from 'lucide-react';
import Price from '../../../components/ui/Price';

/**
 * Luxury Gold & Champagne Canvas Confetti Particle System
 */
function LuxuryConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      '#ffd700', // Bright Gold
      '#f5d77f', // Pale Champagne
      '#d4af37', // Imperial Gold
      '#c99742', // Warm Amber
      '#ffffff', // Diamond White
      '#e6ca65', // Metallic Gold
    ];

    const particleCount = Math.min(120, Math.floor(window.innerWidth / 10));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 2.5,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 5,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      opacity: Math.random() * 0.5 + 0.5,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Auto-stop after 8 seconds to preserve GPU
    const stopTimer = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
    }, 8000);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(stopTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9998] w-full h-full"
    />
  );
}

export default function AuctionWinnerCelebrationModal({
  isOpen,
  onClose,
  lot,
  user,
}) {
  const navigate = useNavigate();

  if (!isOpen || !lot) return null;

  const hammerPrice = lot.winningBid || lot.currentBid || 0;
  const lotNumber = lot.lotNumber || lot._id?.slice(-6)?.toUpperCase() || 'GS-LOT';
  const lotImage = lot.images && lot.images.length > 0 ? lot.images[0] : null;

  const isPaid = Boolean(lot.isPaid || lot.paymentStatus === 'Paid');
  const isAwaiting = Boolean(lot.paymentStatus === 'Awaiting_Approval' || lot.proofUrl);

  const handleProceedToCheckout = () => {
    onClose?.();
    navigate(`/auction/checkout/${lot._id}`);
  };

  const handleDownloadCertificate = () => {
    if (!lot?._id) return;
    window.open(`/api/auction/${lot._id}/certificate`, '_blank');
  };

  const handleViewCertificate = () => {
    onClose?.();
    const el = document.getElementById('acquisition-certificate');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        />

        {/* Confetti Animation */}
        <LuxuryConfettiCanvas />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-b from-[#1b1509] via-[#0e0c08] to-[#050505] border border-[#ffd700]/70 p-6 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_60px_rgba(212,175,55,0.3)] z-10 text-center"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors border border-white/10 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Golden Badge Icon */}
          <div className="relative mx-auto mb-5 w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#8a6d1c] p-0.5 shadow-[0_0_40px_rgba(212,175,55,0.6)]">
            <div className="w-full h-full rounded-3xl bg-black flex items-center justify-center">
              <Crown className="text-[#ffd700]" size={38} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs shadow-lg border-2 border-black">
              ✓
            </div>
          </div>

          {/* Heading Proclamation */}
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[var(--color-gold)]/15 text-[#ffd700] border border-[var(--color-gold)]/30 mb-2">
            Lot Hammer Won • Official Winner
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
            Congratulations, You Won!
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-md mx-auto font-light">
            You placed the definitive winning bid on <strong className="text-white font-medium">"{lot.title}"</strong>.
          </p>

          {/* Certificate & Price Snapshot */}
          <div className="my-6 p-4 rounded-2xl bg-black/60 border border-[var(--color-gold)]/30 text-left">
            <div className="flex items-center justify-between text-xs font-mono text-white/50 border-b border-white/10 pb-2 mb-3">
              <span>CATALOGUE LOT #{lotNumber}</span>
              <span className="text-emerald-400 font-bold">ACQUISITION RESERVED</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-white/40 block uppercase">Final Hammer Fall</span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f5d77f] to-[#d4af37]">
                  <Price amount={hammerPrice} />
                </span>
              </div>
              {lotImage && (
                <img
                  src={lotImage}
                  alt={lot.title}
                  className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-lg"
                />
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f5d77f] to-[#d4af37] text-black font-black uppercase tracking-widest text-xs shadow-[0_0_35px_rgba(212,175,55,0.6)] hover:brightness-110 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-black/80" />
              <span>
                {isPaid
                  ? 'View Settlement & Delivery Status'
                  : isAwaiting
                    ? 'View EFT Verification Status'
                    : 'Complete Checkout & Secure Delivery'}
              </span>
              <ArrowRight size={16} className="text-black/80" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="w-1/2 py-3 px-4 rounded-xl bg-[#1f1a10] hover:bg-[#2a2215] text-[#ffd700] font-mono uppercase tracking-widest text-[11px] border border-[var(--color-gold)]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download size={14} className="text-[#ffd700]" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleViewCertificate}
                className="w-1/2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono uppercase tracking-widest text-[11px] border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck size={14} className="text-[#ffd700]" />
                <span>View Certificate</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-5 text-[10px] font-mono text-white/40 tracking-wider">
            Protected by Grand Store Bonded Vault Escrow • Direct Insured Dispatch
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
