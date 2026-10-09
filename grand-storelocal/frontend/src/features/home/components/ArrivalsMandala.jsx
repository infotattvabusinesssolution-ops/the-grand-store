import React, { memo } from 'react';

// Pre-calculate all coordinates once at module evaluation to prevent any runtime lag
const SPOKES = Array.from({ length: 48 }, (_, i) => {
  const angle = (i * 7.5 * Math.PI) / 180;
  return {
    x1: +(720 + 380 * Math.cos(angle)).toFixed(1),
    y1: +(80 + 380 * Math.sin(angle)).toFixed(1),
    x2: +(720 + 420 * Math.cos(angle)).toFixed(1),
    y2: +(80 + 420 * Math.sin(angle)).toFixed(1),
  };
});

const OUTER_RAYS = Array.from({ length: 64 }, (_, i) => {
  const angle = (i * 5.625 * Math.PI) / 180;
  return {
    x1: +(720 + 660 * Math.cos(angle)).toFixed(1),
    y1: +(80 + 660 * Math.sin(angle)).toFixed(1),
    x2: +(720 + 730 * Math.cos(angle)).toFixed(1),
    y2: +(80 + 730 * Math.sin(angle)).toFixed(1),
  };
});

const CHEVRONS_500 = Array.from({ length: 48 }, (_, i) => {
  const a1 = ((i * 7.5 - 3.75) * Math.PI) / 180;
  const a2 = (i * 7.5 * Math.PI) / 180;
  const a3 = ((i * 7.5 + 3.75) * Math.PI) / 180;
  const x1 = +(720 + 500 * Math.cos(a1)).toFixed(1);
  const y1 = +(80 + 500 * Math.sin(a1)).toFixed(1);
  const x2 = +(720 + 540 * Math.cos(a2)).toFixed(1);
  const y2 = +(80 + 540 * Math.sin(a2)).toFixed(1);
  const x3 = +(720 + 500 * Math.cos(a3)).toFixed(1);
  const y3 = +(80 + 500 * Math.sin(a3)).toFixed(1);
  return `${x1},${y1} ${x2},${y2} ${x3},${y3}`;
});

const CHEVRONS_260 = Array.from({ length: 36 }, (_, i) => {
  const a1 = ((i * 10 - 5) * Math.PI) / 180;
  const a2 = (i * 10 * Math.PI) / 180;
  const a3 = ((i * 10 + 5) * Math.PI) / 180;
  const x1 = +(720 + 260 * Math.cos(a1)).toFixed(1);
  const y1 = +(80 + 260 * Math.sin(a1)).toFixed(1);
  const x2 = +(720 + 300 * Math.cos(a2)).toFixed(1);
  const y2 = +(80 + 300 * Math.sin(a2)).toFixed(1);
  const x3 = +(720 + 260 * Math.cos(a3)).toFixed(1);
  const y3 = +(80 + 260 * Math.sin(a3)).toFixed(1);
  return `${x1},${y1} ${x2},${y2} ${x3},${y3}`;
});

const DOTS_580 = Array.from({ length: 72 }, (_, i) => {
  const angle = (i * 5 * Math.PI) / 180;
  return {
    cx: +(720 + 580 * Math.cos(angle)).toFixed(1),
    cy: +(80 + 580 * Math.sin(angle)).toFixed(1),
  };
});

const DOTS_340 = Array.from({ length: 48 }, (_, i) => {
  const angle = (i * 7.5 * Math.PI) / 180;
  return {
    cx: +(720 + 340 * Math.cos(angle)).toFixed(1),
    cy: +(80 + 340 * Math.sin(angle)).toFixed(1),
  };
});

const DOTS_180 = Array.from({ length: 30 }, (_, i) => {
  const angle = (i * 12 * Math.PI) / 180;
  return {
    cx: +(720 + 180 * Math.cos(angle)).toFixed(1),
    cy: +(80 + 180 * Math.sin(angle)).toFixed(1),
  };
});

function ArrivalsMandala({ 
  className = "", 
  gradientId = "mandala-gold-grad",
  position = "top-right" 
}) {
  const positionClass = position === "top-left"
    ? "absolute -top-12 -left-12 sm:-top-16 sm:-left-16 md:-top-20 md:-left-20"
    : "absolute -top-12 -right-12 sm:-top-16 sm:-right-16 md:-top-20 md:-right-20";

  return (
    <div 
      className={`${positionClass} w-[420px] sm:w-[580px] md:w-[740px] lg:w-[860px] aspect-square pointer-events-none select-none z-0 opacity-40 overflow-visible ${className}`}
      style={{ willChange: "transform", transform: "translateZ(0)" }}
      aria-hidden="true"
    >
      <svg 
        viewBox="0 0 800 800" 
        className="w-full h-full text-[#caa458]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7e1a0" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#caa458" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#875f1a" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <g stroke={`url(#${gradientId})`}>
          {/* Concentric Framing Rings */}
          <circle cx="720" cy="80" r="760" strokeWidth="1.2" strokeDasharray="3 5" />
          <circle cx="720" cy="80" r="730" strokeWidth="1.5" />
          <circle cx="720" cy="80" r="695" strokeWidth="2" strokeDasharray="5 7" />
          <circle cx="720" cy="80" r="660" strokeWidth="1.5" />
          <circle cx="720" cy="80" r="620" strokeWidth="2" />
          <circle cx="720" cy="80" r="580" strokeWidth="1.2" strokeDasharray="4 4" />
          <circle cx="720" cy="80" r="540" strokeWidth="2" />
          <circle cx="720" cy="80" r="500" strokeWidth="1.5" />
          <circle cx="720" cy="80" r="460" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="720" cy="80" r="420" strokeWidth="1.5" />
          <circle cx="720" cy="80" r="380" strokeWidth="2" />
          <circle cx="720" cy="80" r="340" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx="720" cy="80" r="300" strokeWidth="2" />
          <circle cx="720" cy="80" r="260" strokeWidth="1.5" />
          <circle cx="720" cy="80" r="220" strokeWidth="1.8" strokeDasharray="4 4" />
          <circle cx="720" cy="80" r="180" strokeWidth="1.5" />
          <circle cx="720" cy="80" r="140" strokeWidth="2" />
          <circle cx="720" cy="80" r="100" strokeWidth="1.5" />
          <circle cx="720" cy="80" r="60" strokeWidth="2" />

          {/* Radiating Sunburst Spokes */}
          {SPOKES.map((s, i) => (
            <line key={`s-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth="1.2" />
          ))}

          {/* Outer Sunburst Rays */}
          {OUTER_RAYS.map((r, i) => (
            <line key={`r-${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} strokeWidth="1.4" />
          ))}

          {/* African Chevron Teeth Band 500 */}
          {CHEVRONS_500.map((points, i) => (
            <polyline key={`c500-${i}`} points={points} strokeWidth="1.3" fill="none" />
          ))}

          {/* Inner Chevron Teeth Band 260 */}
          {CHEVRONS_260.map((points, i) => (
            <polyline key={`c260-${i}`} points={points} strokeWidth="1.2" fill="none" />
          ))}

          {/* Beaded Ring at r=580 */}
          {DOTS_580.map((d, i) => (
            <circle key={`d580-${i}`} cx={d.cx} cy={d.cy} r="2" fill="#caa458" stroke="none" opacity="0.85" />
          ))}

          {/* Beaded Ring at r=340 */}
          {DOTS_340.map((d, i) => (
            <circle key={`d340-${i}`} cx={d.cx} cy={d.cy} r="2.2" fill="#f7e1a0" stroke="none" opacity="0.9" />
          ))}

          {/* Beaded Ring at r=180 */}
          {DOTS_180.map((d, i) => (
            <circle key={`d180-${i}`} cx={d.cx} cy={d.cy} r="2.5" fill="#caa458" stroke="none" />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default memo(ArrivalsMandala);


