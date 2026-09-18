import React, { useEffect, useState } from 'react';
import { Sparkles, Crown, ShieldCheck } from 'lucide-react';

/**
 * MagicalBidEffect
 * Triggers an enchanting golden sparkle burst, expanding ethereal shockwave,
 * and Web Audio crystal harmonic chime chord upon placing a successful bid.
 */
export default function MagicalBidEffect({ onFinished, lotTitle, amount }) {
  const [particles] = useState(() => {
    // Generate randomized golden particle burst physics
    return Array.from({ length: 32 }).map((_, i) => {
      const angle = (i / 32) * (Math.PI * 2) + (Math.random() - 0.5) * 0.4;
      const distance = Math.random() * 180 + 70;
      return {
        id: i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - Math.random() * 40,
        scale: Math.random() * 0.7 + 0.5,
        rotation: Math.random() * 720 - 360,
        delay: Math.random() * 0.15,
        duration: Math.random() * 0.6 + 0.9,
        size: Math.random() * 10 + 6,
        color: ['#FFD700', '#D4AF37', '#FFF8DC', '#F5D77F', '#E6CA65'][i % 5],
        symbol: ['✦', '★', '◆', '✨', '•'][i % 5]
      };
    });
  });

  useEffect(() => {
    // 1. Play Luxury Web Audio Crystal Chime Chord
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        // Royal C-Major 9th Crystal Chord (C5, E5, G5, B5, D6, E6)
        const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51];

        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = index % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Subtle harmonic sparkle detuning
          osc.detune.setValueAtTime((index - 2) * 4, ctx.currentTime);

          // Envelope: instant crystal attack, gentle lingering ring
          const noteStart = ctx.currentTime + index * 0.05;
          const noteEnd = noteStart + 1.8;

          gain.gain.setValueAtTime(0, noteStart);
          gain.gain.linearRampToValueAtTime(0.09 / (index * 0.2 + 1), noteStart + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteStart);
          osc.stop(noteEnd);
        });
      }
    } catch (err) {
      // Audio autoplay policy fallback
      console.warn('Web Audio synthesis prevented:', err);
    }

    // 2. Timer to auto-clear effect
    const timer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[10001] flex items-center justify-center overflow-hidden">
      {/* Radiant Golden Shockwave Ripple */}
      <div className="absolute w-24 h-24 rounded-full border-2 border-[#d4af37] bg-radial from-[#ffd700]/30 to-transparent animate-ping duration-1000 opacity-80" />
      <div className="absolute w-48 h-48 rounded-full border border-[#f5d77f]/60 animate-pulse duration-700 opacity-60" />

      {/* Floating Golden Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute select-none font-bold"
          style={{
            color: p.color,
            fontSize: `${p.size}px`,
            textShadow: `0 0 12px ${p.color}, 0 0 20px #FFD700`,
            transform: `translate(${p.dx}px, ${p.dy}px) rotate(${p.rotation}deg) scale(${p.scale})`,
            transition: `transform ${p.duration}s cubic-bezier(0.12, 0.8, 0.32, 1), opacity ${p.duration}s ease-out`,
            transitionDelay: `${p.delay}s`,
            animation: `fadeParticle ${p.duration}s ease-out forwards`
          }}
        >
          {p.symbol}
        </div>
      ))}

      {/* Floating Leading Bid Prestige Toast */}
      <div 
        className="relative z-10 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#12100a]/95 via-[#231b0a]/95 to-[#12100a]/95 border-2 border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.6)] backdrop-blur-xl flex items-center gap-4 text-center animate-bounce duration-1000"
        style={{
          animation: 'magicalToastAppear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ffd700] to-[#c9a35b] text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.7)] shrink-0">
          <Crown size={22} className="animate-pulse" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#ffd700] flex items-center gap-1">
              <Sparkles size={11} className="text-[#ffd700]" />
              Bid Recorded With Vault
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={10} /> Certified
            </span>
          </div>
          <p className="text-sm md:text-base font-serif text-white font-medium mt-0.5">
            You Hold The Leading Position!
          </p>
        </div>
      </div>

      <style>{`
        @keyframes magicalToastAppear {
          0% {
            opacity: 0;
            transform: scale(0.6) translateY(40px);
          }
          70% {
            opacity: 1;
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeParticle {
          0% {
            opacity: 1;
          }
          80% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translate(calc(${particles[0].dx}px * 1.3), calc(${particles[0].dy}px * 1.3)) scale(0.2);
          }
        }
      `}</style>
    </div>
  );
}
