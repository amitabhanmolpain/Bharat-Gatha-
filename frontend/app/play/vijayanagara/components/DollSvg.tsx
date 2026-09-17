import React from "react";

export default function DollSvg({ className = "", style = {} }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background shadow/glow for depth */}
      <circle cx="50" cy="55" r="40" fill="url(#dollShadowGrad)" opacity="0.4" />
      
      {/* Base Platform */}
      <path
        d="M30,85 L70,85 L75,95 L25,95 Z"
        fill="#3B2D22"
        stroke="#2E231B"
        strokeWidth="1.5"
      />
      <rect x="35" y="80" width="30" height="5" fill="#4A3B32" />

      {/* Skirt/Sari (Wide conical base) */}
      <path 
        d="M 50 45 C 65 45 75 75 80 80 L 20 80 C 25 75 35 45 50 45 Z" 
        fill="#CD3333" 
        stroke="#8B2500" 
        strokeWidth="1.5" 
      />
      {/* Gold trims on skirt */}
      <path d="M 25 75 C 40 78 60 78 75 75" stroke="#D4A359" strokeWidth="2" fill="none" />
      <path d="M 22 78 C 40 81 60 81 78 78" stroke="#D4A359" strokeWidth="2" fill="none" />
      <path d="M 40 45 L 30 70" stroke="#D4A359" strokeWidth="1" opacity="0.6" />
      <path d="M 60 45 L 70 70" stroke="#D4A359" strokeWidth="1" opacity="0.6" />

      {/* Torso */}
      <path d="M 42 30 C 42 30 38 40 42 45 C 50 48 58 45 58 30 Z" fill="#665243" stroke="#3B2D22" strokeWidth="1" />
      
      {/* Sari Drape over shoulder */}
      <path d="M 40 30 C 50 35 60 45 60 45 L 45 45 C 40 40 38 35 40 30 Z" fill="#CD3333" stroke="#D4A359" strokeWidth="1" />

      {/* Head & Neck */}
      <rect x="47" y="22" width="6" height="8" fill="#665243" />
      <circle cx="50" cy="18" r="10" fill="#665243" stroke="#3B2D22" strokeWidth="1.5" />
      
      {/* Hair (Braided bun on side/back) */}
      <circle cx="50" cy="18" r="11" fill="#1A1A1A" clipPath="url(#hairClip)" />
      <circle cx="60" cy="18" r="4" fill="#1A1A1A" />
      
      {/* Hair Ornaments (Jasmine flowers) */}
      <circle cx="59" cy="15" r="1.5" fill="#FFFFFF" />
      <circle cx="61" cy="17" r="1.5" fill="#FFFFFF" />
      <circle cx="59" cy="20" r="1.5" fill="#FFFFFF" />

      {/* Facial Features (Painted on wood) */}
      <circle cx="46" cy="17" r="1" fill="#1A1A1A" />
      <circle cx="54" cy="17" r="1" fill="#1A1A1A" />
      <circle cx="50" cy="15" r="1.5" fill="#CD3333" /> {/* Bindi */}
      <path d="M 48 21 C 49 22 51 22 52 21" stroke="#CD3333" strokeWidth="1.5" fill="none" />

      {/* Jewelry */}
      <path d="M 45 28 C 48 30 52 30 55 28" stroke="#D4A359" strokeWidth="1.5" fill="none" /> {/* Necklace */}
      <circle cx="42" cy="20" r="1.5" fill="#D4A359" /> {/* Earring L */}
      <circle cx="58" cy="20" r="1.5" fill="#D4A359" /> {/* Earring R */}
      
      {/* Arms (Mudra gesture) */}
      {/* Left Arm folded */}
      <path d="M 42 32 C 35 35 30 40 32 45 C 34 50 40 45 42 42" fill="none" stroke="#665243" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right Arm raised */}
      <path d="M 58 32 C 65 30 70 25 68 20 C 67 18 64 18 64 20" fill="none" stroke="#665243" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Bangles */}
      <path d="M 32 42 L 35 45" stroke="#D4A359" strokeWidth="2" />
      <path d="M 68 23 L 64 22" stroke="#D4A359" strokeWidth="2" />

      <defs>
        <radialGradient id="dollShadowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <clipPath id="hairClip">
          <rect x="35" y="5" width="30" height="13" />
        </clipPath>
      </defs>
    </svg>
  );
}
