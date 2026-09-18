import React, { memo, useId } from 'react';

function TribalCardBorder({ className = "" }) {
  const patternId = useId().replace(/:/g, "-");

  return (
    <div className={`w-full h-[18px] select-none overflow-hidden bg-[#0c0d0f] border-t border-[#cda75b]/30 ${className}`}>
      <svg 
        viewBox="0 0 360 18" 
        preserveAspectRatio="none" 
        className="w-full h-full text-[#caa458]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`tribal-gold-${patternId}`} width="48" height="18" patternUnits="userSpaceOnUse">
            {/* Top and Bottom framing lines */}
            <line x1="0" y1="2" x2="48" y2="2" stroke="currentColor" strokeWidth="1" opacity="0.8" />
            <line x1="0" y1="16" x2="48" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.8" />
            
            {/* Left Geometric Diamond Motif (No sharp spikes) */}
            <polygon points="12,5 16,9 12,13 8,9" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.85" />
            <circle cx="12" cy="9" r="1.5" fill="currentColor" opacity="0.9" />
            
            {/* Center Vertical Dividers & Accent */}
            <line x1="24" y1="4" x2="24" y2="14" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
            <line x1="27" y1="5" x2="27" y2="13" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
            
            {/* Right Geometric Diamond Motif (No sharp spikes) */}
            <polygon points="36,5 40,9 36,13 32,9" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.85" />
            <circle cx="36" cy="9" r="1.5" fill="currentColor" opacity="0.9" />

            {/* Micro accent dots */}
            <circle cx="3" cy="9" r="1" fill="currentColor" opacity="0.6" />
            <circle cx="21" cy="9" r="1" fill="currentColor" opacity="0.6" />
            <circle cx="30" cy="9" r="1" fill="currentColor" opacity="0.6" />
            <circle cx="45" cy="9" r="1" fill="currentColor" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="18" fill={`url(#tribal-gold-${patternId})`} />
      </svg>
    </div>
  );
}

export default memo(TribalCardBorder);


