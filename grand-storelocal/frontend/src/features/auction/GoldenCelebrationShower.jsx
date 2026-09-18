import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw, X } from 'lucide-react';

/**
 * GoldenCelebrationShower
 * Ultra-smooth 60fps HTML5 Canvas celebration shower designed for Grand Store auctions.
 * Renders tumbling 3D metallic gold foil ribbons, shimmering stars, and floating champagne embers.
 */
export default function GoldenCelebrationShower({ 
  duration = 6000, 
  onComplete, 
  showControls = true,
  particleCount = 140 
}) {
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Palette of rich 24K gold foil tones
  const GOLD_PALETTE = [
    '#FFD700', // Classic pure gold
    '#D4AF37', // Metallic royal gold
    '#F5D77F', // Champagne gold highlight
    '#E6CA65', // Gilded shimmer
    '#FFF8DC', // Pearl corn silk gold
    '#B8860B', // Antique deep bronze gold
    '#C9A35B'  // Grand Store signature gold
  ];

  const initParticles = (width, height) => {
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const isRibbon = Math.random() > 0.35;
      const isStar = !isRibbon && Math.random() > 0.4;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * -height * 0.8 - 20, // Stagger above viewport
        size: isRibbon ? Math.random() * 8 + 6 : (isStar ? Math.random() * 6 + 4 : Math.random() * 4 + 2),
        width: isRibbon ? Math.random() * 12 + 8 : 0,
        height: isRibbon ? Math.random() * 6 + 4 : 0,
        speedY: Math.random() * 2.8 + 1.8,
        speedX: Math.random() * 2 - 1,
        color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.08 + 0.03,
        tiltAngle: Math.random() * Math.PI,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        type: isRibbon ? 'ribbon' : (isStar ? 'star' : 'ember'),
        opacity: Math.random() * 0.4 + 0.6,
        pulseSpeed: Math.random() * 0.05 + 0.02
      });
    }
    return particles;
  };

  const startAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.width = window.innerWidth;
        height = canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles = initParticles(width, height);
    startTimeRef.current = Date.now();
    setIsActive(true);

    const drawStar = (cx, cy, spikes, outerRadius, innerRadius, color, alpha) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const elapsed = Date.now() - startTimeRef.current;
      const isFading = duration && elapsed > duration;
      const fadeProgress = isFading ? Math.min((elapsed - duration) / 1200, 1) : 0;

      if (fadeProgress >= 1) {
        setIsActive(false);
        if (onComplete) onComplete();
        return;
      }

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.tiltAngle) * 0.8;
        p.rotation += p.rotationSpeed;

        const currentOpacity = (p.opacity * (1 - fadeProgress)).toFixed(2);

        ctx.save();
        ctx.globalAlpha = Math.max(0, currentOpacity);

        if (p.type === 'ribbon') {
          // 3D Tumbling Ribbon Effect
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          const currentWidth = p.width * Math.cos(p.tiltAngle);

          const gradient = ctx.createLinearGradient(-currentWidth / 2, 0, currentWidth / 2, 0);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(0.5, '#FFF8DC');
          gradient.addColorStop(1, '#B8860B');

          ctx.fillStyle = gradient;
          ctx.shadowColor = '#D4AF37';
          ctx.shadowBlur = 4;
          ctx.fillRect(-currentWidth / 2, -p.height / 2, currentWidth, p.height);
        } else if (p.type === 'star') {
          // 4-point Star Shimmer
          const starAlpha = Math.abs(Math.sin(p.tiltAngle * 2)) * 0.5 + 0.5;
          drawStar(p.x, p.y, 4, p.size * 1.5, p.size * 0.6, p.color, currentOpacity * starAlpha);
        } else {
          // Soft Golden Glowing Ember
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          ctx.fill();
        }

        ctx.restore();

        // Respawn particle at top if still within active duration
        if (p.y > height + 20) {
          if (!isFading) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  };

  useEffect(() => {
    const cleanup = startAnimation();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleReplay = (e) => {
    e.stopPropagation();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    startAnimation();
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsActive(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-700 ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {showControls && (
        <div className="fixed bottom-6 right-6 z-[10000] flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplay}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#16140e]/90 hover:bg-[#241f12] text-[#f5d77f] border border-[#d4af37]/40 shadow-[0_4px_20px_rgba(212,175,55,0.3)] backdrop-blur-md text-xs font-semibold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Replay Winner Celebration Shower"
          >
            <Sparkles size={14} className="text-[#ffd700] animate-pulse" />
            <span>Celebrate Again</span>
            <RotateCcw size={12} className="opacity-70" />
          </button>
          
          {isActive && (
            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 rounded-full bg-black/70 hover:bg-black text-white/50 hover:text-white border border-white/10 transition-colors backdrop-blur-md cursor-pointer"
              title="Dismiss Confetti Shower"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
