import React from 'react';

export default function ProteaEmblem({ className = "w-5 h-5 text-[#caa458]" }) {
  return (
    <svg 
      viewBox="0 0 28 28" 
      fill="currentColor" 
      className={`inline-block shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* South African King Protea Flower Blossom */}
      {/* Stem & Sepal Calyx */}
      <path
        d="M14 26 C13.4 24.5 13.3 23 13.5 21.5 C13.8 21.5 14.2 21.5 14.5 21.5 C14.7 23 14.6 24.5 14 26 Z"
        opacity="0.9"
      />
      {/* Lower Involucral Bracts (Cup/Chalice Base) */}
      <path
        d="M10 21.5 C11.2 22.2 12.8 22.5 14 22.5 C15.2 22.5 16.8 22.2 18 21.5 C19.5 20 20.5 18 20.8 15.5 C18.5 16.5 16.2 17 14 17 C11.8 17 9.5 16.5 7.2 15.5 C7.5 18 8.5 20 10 21.5 Z"
        opacity="0.85"
      />
      {/* Outer Pointed Bracts (Flaring Crown Petals) */}
      {/* Far Left Petal */}
      <path
        d="M5 14.5 C4.2 12 4.5 9.5 5.5 7.5 C6.8 9.5 8 11.5 9 13.5 C7.5 14 6.2 14.2 5 14.5 Z"
        opacity="0.9"
      />
      {/* Mid Left Petal */}
      <path
        d="M7.8 13 C7.5 10 8.5 7 10 4.8 C11 7.2 11.8 9.8 12.2 12.2 C10.8 12.5 9.2 12.8 7.8 13 Z"
      />
      {/* Center King Petal / Spire */}
      <path
        d="M12.5 11.5 C12.8 7.5 13.2 4.5 14 2 C14.8 4.5 15.2 7.5 15.5 11.5 C15 11.8 14.5 12 14 12 C13.5 12 13 11.8 12.5 11.5 Z"
      />
      {/* Mid Right Petal */}
      <path
        d="M20.2 13 C20.5 10 19.5 7 18 4.8 C17 7.2 16.2 9.8 15.8 12.2 C17.2 12.5 18.8 12.8 20.2 13 Z"
      />
      {/* Far Right Petal */}
      <path
        d="M23 14.5 C23.8 12 23.5 9.5 22.5 7.5 C21.2 9.5 20 11.5 19 13.5 C20.5 14 21.8 14.2 23 14.5 Z"
        opacity="0.9"
      />
      {/* Inner Central Floret Cone / Texture */}
      <path
        d="M11.5 16 C12.2 14 12.8 12.5 14 12.5 C15.2 12.5 15.8 14 16.5 16 C15.8 16.4 15 16.6 14 16.6 C13 16.6 12.2 16.4 11.5 16 Z"
        opacity="0.75"
      />
    </svg>
  );
}
