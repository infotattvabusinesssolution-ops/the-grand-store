import React, { memo, useId } from "react";

// Pre-calculate 24 radiant spokes and 24 decorative beads around center (100, 100)
const SPOKES_24 = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  return {
    x1: +(100 + 44 * Math.cos(angle)).toFixed(1),
    y1: +(100 + 44 * Math.sin(angle)).toFixed(1),
    x2: +(100 + 84 * Math.cos(angle)).toFixed(1),
    y2: +(100 + 84 * Math.sin(angle)).toFixed(1),
  };
});

const BEADS_24 = Array.from({ length: 24 }, (_, i) => {
  const angle = ((i * 15 + 7.5) * Math.PI) / 180;
  return {
    cx: +(100 + 72 * Math.cos(angle)).toFixed(1),
    cy: +(100 + 72 * Math.sin(angle)).toFixed(1),
  };
});

const CHEVRONS_24 = Array.from({ length: 24 }, (_, i) => {
  const a1 = ((i * 15 - 5) * Math.PI) / 180;
  const a2 = (i * 15 * Math.PI) / 180;
  const a3 = ((i * 15 + 5) * Math.PI) / 180;
  const x1 = +(100 + 54 * Math.cos(a1)).toFixed(1);
  const y1 = +(100 + 54 * Math.sin(a1)).toFixed(1);
  const x2 = +(100 + 62 * Math.cos(a2)).toFixed(1);
  const y2 = +(100 + 62 * Math.sin(a2)).toFixed(1);
  const x3 = +(100 + 54 * Math.cos(a3)).toFixed(1);
  const y3 = +(100 + 54 * Math.sin(a3)).toFixed(1);
  return `${x1},${y1} ${x2},${y2} ${x3},${y3}`;
});

function CardChakra({ className = "" }) {
  const rawId = useId();
  const gradId = `chakra-g-${rawId.replace(/:/g, "")}`;
  const glowId = `chakra-gl-${rawId.replace(/:/g, "")}`;

  return (
    <div
      className={`card-chakra-bg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[164px] h-[164px] sm:w-[176px] sm:h-[176px] md:w-[190px] md:h-[190px] aspect-square pointer-events-none select-none z-0 opacity-25 group-hover:opacity-55 transition-all duration-700 ease-out group-hover:scale-105 group-hover:rotate-6 ${className}`}
      style={{ willChange: "transform, opacity", transform: "translate(-50%, -50%) translateZ(0)" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full text-[#caa458]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7e1a0" stopOpacity="0.85" />
            <stop offset="48%" stopColor="#caa458" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#875f1a" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f7e1a0" stopOpacity="0.1" />
            <stop offset="45%" stopColor="#caa458" stopOpacity="0.05" />
            <stop offset="78%" stopColor="#caa458" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#caa458" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Center Glow */}
        <circle cx="100" cy="100" r="92" fill={`url(#${glowId})`} stroke="none" />

        <g stroke={`url(#${gradId})`}>
          {/* Concentric Geometric Rings */}
          <circle cx="100" cy="100" r="92" strokeWidth="0.75" strokeDasharray="2.5 3.5" />
          <circle cx="100" cy="100" r="86" strokeWidth="1" />
          <circle cx="100" cy="100" r="76" strokeWidth="0.8" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="66" strokeWidth="1" />
          <circle cx="100" cy="100" r="48" strokeWidth="0.9" />
          <circle cx="100" cy="100" r="32" strokeWidth="1.1" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="22" strokeWidth="1" />
          <circle cx="100" cy="100" r="12" strokeWidth="1.2" />

          {/* 24 Radiating Spokes */}
          {SPOKES_24.map((s, i) => (
            <line
              key={`spk-${i}`}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              strokeWidth="0.8"
            />
          ))}

          {/* Inner Chevron Band */}
          {CHEVRONS_24.map((points, i) => (
            <polyline
              key={`chv-${i}`}
              points={points}
              strokeWidth="0.9"
              fill="none"
            />
          ))}

          {/* Gold Beads on r=72 */}
          {BEADS_24.map((b, i) => (
            <circle
              key={`bd-${i}`}
              cx={b.cx}
              cy={b.cy}
              r="1.2"
              fill="#f7e1a0"
              stroke="none"
              opacity="0.8"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default memo(CardChakra);
