import React from "react";

export default function ElephantSvg({ className = "", style = {} }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background shadow/glow for depth */}
      <circle cx="50" cy="55" r="40" fill="url(#elephantShadowGrad)" opacity="0.4" />
      
      {/* Base Platform */}
      <path
        d="M20,75 L80,75 L85,85 L15,85 Z"
        fill="#4A3B32"
        stroke="#2E231B"
        strokeWidth="1.5"
      />
      <rect x="25" y="70" width="50" height="5" fill="#5C4A3D" />

      {/* Elephant Body */}
      <path 
        d="M 65 35 C 75 35 80 45 80 55 C 80 65 75 75 75 75 L 65 75 L 65 65 L 55 65 L 55 75 L 35 75 L 35 65 L 25 65 L 25 75 L 15 75 C 15 75 10 65 10 50 C 10 35 25 25 45 25 C 55 25 60 30 65 35 Z" 
        fill="#665243" 
        stroke="#3B2D22" 
        strokeWidth="1.5" 
      />
      
      {/* Elephant Ear */}
      <path d="M 45 35 C 55 35 60 45 55 55 C 50 65 40 60 40 50 C 40 40 45 35 45 35 Z" fill="#5C4A3D" stroke="#3B2D22" strokeWidth="1" />
      
      {/* Eye */}
      <circle cx="28" cy="38" r="2" fill="#2E231B" />
      
      {/* Tusk */}
      <path d="M 20 45 C 15 50 10 50 5 45 C 10 42 15 42 20 45 Z" fill="#E8DCC4" stroke="#8C7A6B" strokeWidth="1" />
      
      {/* Trunk curled up */}
      <path d="M 15 50 C 5 60 0 50 5 40 C 8 35 12 35 15 40" fill="none" stroke="#665243" strokeWidth="6" strokeLinecap="round" />
      
      {/* Howdah / Caparison details (Saddle) */}
      <path d="M 40 25 C 50 20 60 25 65 35 L 45 35 Z" fill="#8B2500" stroke="#D4A359" strokeWidth="2" />
      <path d="M 35 35 L 75 35 L 70 50 L 40 50 Z" fill="#CD3333" stroke="#D4A359" strokeWidth="1.5" />
      
      {/* Gold tassels */}
      <circle cx="45" cy="53" r="1.5" fill="#D4A359" />
      <circle cx="55" cy="53" r="1.5" fill="#D4A359" />
      <circle cx="65" cy="53" r="1.5" fill="#D4A359" />
      
      {/* Head Ornament */}
      <path d="M 25 25 L 32 35 L 18 35 Z" fill="#D4A359" />
      
      {/* Tail */}
      <path d="M 80 50 C 85 55 85 65 80 70" fill="none" stroke="#3B2D22" strokeWidth="2" />
      <circle cx="80" cy="70" r="2" fill="#2E231B" />

      {/* Decorative dots on saddle */}
      <circle cx="45" cy="42" r="2" fill="#D4A359" />
      <circle cx="55" cy="42" r="2" fill="#D4A359" />
      <circle cx="65" cy="42" r="2" fill="#D4A359" />

      <defs>
        <radialGradient id="elephantShadowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
