import React, { memo, useId } from 'react';

function TribalSideWatermark({ side = "left", className = "" }) {
  const patternId = useId().replace(/:/g, "-");
  const isRight = side === "right";

  return (
    <div
      className={`pointer-events-none absolute top-0 bottom-0 z-0 hidden w-20 select-none overflow-hidden opacity-25 sm:w-28 md:w-36 lg:w-44 xl:block ${
        isRight ? "right-0" : "left-0"
      } ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 800"
        preserveAspectRatio="none"
        className={`h-full w-full text-[#c9a35b] ${isRight ? "scale-x-[-1]" : ""}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`tribal-side-${patternId}`}
            width="160"
            height="220"
            patternUnits="userSpaceOnUse"
          >
            {/* Outer margin lines */}
            <line x1="8" y1="0" x2="8" y2="220" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <line x1="16" y1="0" x2="16" y2="220" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />

            {/* African Chevron stack */}
            <path d="M28 20 L52 42 L28 64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M36 20 L60 42 L36 64" stroke="currentColor" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M44 20 L68 42 L44 64" stroke="currentColor" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Vertical tick hatchings */}
            <g stroke="currentColor" strokeWidth="1.2" opacity="0.6">
              <line x1="78" y1="18" x2="78" y2="34" />
              <line x1="84" y1="18" x2="84" y2="34" />
              <line x1="90" y1="18" x2="90" y2="34" />
              <line x1="96" y1="18" x2="96" y2="34" />
              <line x1="102" y1="18" x2="102" y2="34" />
            </g>

            {/* Tribal Diamond with central cross & dot */}
            <polygon points="120,18 148,46 120,74 92,46" stroke="currentColor" strokeWidth="1.8" fill="none" />
            <polygon points="120,27 139,46 120,65 101,46" stroke="currentColor" strokeWidth="1" opacity="0.5" fill="none" />
            <circle cx="120" cy="46" r="3" fill="currentColor" opacity="0.8" />

            {/* Hourglass double triangles */}
            <polygon points="30,90 70,90 50,115" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
            <polygon points="30,140 70,140 50,115" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
            <circle cx="50" cy="115" r="2.5" fill="currentColor" />

            {/* Aztec / African zigzag bands */}
            <path d="M85 90 L100 105 L85 120 L100 135 L85 150" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M105 90 L120 105 L105 120 L120 135 L105 150" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M125 90 L140 105 L125 120 L140 135 L125 150" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />

            {/* Inverted Chevron stack */}
            <path d="M60 170 L36 192 L60 214" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M68 170 L44 192 L68 214" stroke="currentColor" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />

            {/* Small accent diamonds */}
            <polygon points="120,175 126,185 120,195 114,185" fill="currentColor" opacity="0.7" />
            <polygon points="90,180 94,187 90,194 86,187" fill="currentColor" opacity="0.5" />
            <polygon points="144,180 148,187 144,194 140,187" fill="currentColor" opacity="0.5" />

            {/* Horizontal divider hatch */}
            <line x1="8" y1="218" x2="152" y2="218" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#tribal-side-${patternId})`} />
      </svg>
    </div>
  );
}

export default memo(TribalSideWatermark);
