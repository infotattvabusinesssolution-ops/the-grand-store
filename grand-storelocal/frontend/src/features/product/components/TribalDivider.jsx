import React, { memo } from 'react';

function TribalDivider({ className = "my-7" }) {
  return (
    <div className={`flex items-center justify-center gap-3 select-none ${className}`}>
      {/* Left Double Line */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-[#c9a35b]/50" />
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-[#c9a35b]/25" />
      </div>

      {/* Center Tribal Glyphs (exact geometry from reference design) */}
      <div className="flex items-center gap-2 text-[#c9a35b] px-3 shrink-0">
        <svg width="130" height="22" viewBox="0 0 130 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#c9a35b]">
          {/* Left Arrowheads / Chevrons */}
          <path d="M12 6 L22 11 L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 6 L34 11 L24 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="42" y1="5" x2="42" y2="17" stroke="currentColor" strokeWidth="1.5" />
          <line x1="48" y1="5" x2="48" y2="17" stroke="currentColor" strokeWidth="1" opacity="0.6" />

          {/* Central Aztec Diamond with Inset */}
          <polygon points="65,2 75,11 65,20 55,11" stroke="currentColor" strokeWidth="1.5" fill="#141310" />
          <polygon points="65,6 70,11 65,16 60,11" fill="currentColor" />

          {/* Right Arrowheads / Chevrons */}
          <line x1="82" y1="5" x2="82" y2="17" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="88" y1="5" x2="88" y2="17" stroke="currentColor" strokeWidth="1.5" />
          <path d="M106 6 L96 11 L106 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M118 6 L108 11 L118 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Right Double Line */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-[1px] w-full bg-gradient-to-l from-transparent via-white/15 to-[#c9a35b]/50" />
        <div className="h-[1px] w-full bg-gradient-to-l from-transparent via-white/5 to-[#c9a35b]/25" />
      </div>
    </div>
  );
}

export default memo(TribalDivider);
