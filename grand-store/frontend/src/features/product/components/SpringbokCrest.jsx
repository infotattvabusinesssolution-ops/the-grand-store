import React from 'react';

export default function SpringbokCrest({ className = "w-11 h-8 text-[#c9a35b]" }) {
  return (
    <svg
      viewBox="0 0 64 42"
      fill="currentColor"
      className={`inline-block shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Refined Leaping Springbok Silhouette */}
      <g fill="currentColor">
        {/* Back Horn */}
        <path d="M22 10 C21 6, 19 3, 16 1 C17 3, 18 6, 20 10 Z" />
        {/* Front Horn */}
        <path d="M24 10 C23 5, 20 2, 17 0 C19 3, 21 6, 22 10 Z" opacity="0.9" />
        {/* Head & Snout */}
        <path d="M20 10 C21 11, 23 12, 26 12 C28 12, 30 11, 31 10 C30 11, 28 13, 25 14 C23 14.5, 21 13.5, 20 12 Z" />
        {/* Ear */}
        <path d="M21 9 C20 7, 18 6, 17 6 C18 7, 19 8.5, 20 9.5 Z" />
        {/* Arching Neck & Shoulder */}
        <path d="M21 12 C21 16, 23 20, 27 22 C30 23, 34 23, 37 22 C33 20, 31 17, 26 14 C23 13, 22 12, 21 12 Z" />
        {/* Sleek Torso */}
        <path d="M27 22 C32 23.5, 38 23.5, 43 21 C46 19.5, 48 17.5, 51 17 C50 19, 47 22, 42 24 C37 25.5, 31 25, 27 22 Z" />
        {/* Front Legs - Bent gracefully in mid-air leap */}
        <path d="M29 23 C29 26, 28 29, 26 31 C25 32, 24 33, 22 34 C23 32, 25 30, 26 27 C27 24, 28 23, 29 23 Z" />
        <path d="M31 23 C31 27, 31 31, 30 34 C29.5 35.5, 29 37, 28 38 C28.5 36, 29.5 33, 30 29 C30.5 25, 31 23, 31 23 Z" opacity="0.85" />
        {/* Hind Legs - Extended backwards in mid-air leap */}
        <path d="M49 17 C52 19, 55 22, 57 26 C58 28, 59 31, 61 33 C59 31, 57 28, 55 24 C53 21, 50 18.5, 49 17 Z" />
        <path d="M51 18 C54 21, 57 25, 59 29 C60 32, 61 35, 63 37 C61 34, 59 30, 57 26 C54 22, 52 19, 51 18 Z" opacity="0.85" />
        {/* Tail */}
        <path d="M51 17 C52 15.5, 53 15, 54 15.5 C53 16.5, 52 17, 51 17.5 Z" />
      </g>
    </svg>
  );
}
