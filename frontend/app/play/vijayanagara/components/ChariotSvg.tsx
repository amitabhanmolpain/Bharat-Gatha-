import React from "react";

export default function ChariotSvg({ className = "", style = {} }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background shadow/glow for depth */}
      <circle cx="50" cy="55" r="40" fill="url(#shadowGrad)" opacity="0.4" />
      
      {/* Base Platform */}
      <path
        d="M20,65 L80,65 L85,75 L15,75 Z"
        fill="#4A3B32"
        stroke="#2E231B"
        strokeWidth="1.5"
      />
      <rect x="25" y="60" width="50" height="5" fill="#5C4A3D" />

      {/* Main Body (Shrine) */}
      <path
        d="M30,60 L30,40 C30,35 40,30 50,30 C60,30 70,35 70,40 L70,60 Z"
        fill="#665243"
        stroke="#3B2D22"
        strokeWidth="1.5"
      />
      
      {/* Pillar details */}
      <rect x="35" y="42" width="6" height="15" fill="#4A3B32" />
      <rect x="59" y="42" width="6" height="15" fill="#4A3B32" />
      
      {/* Central opening/sanctum */}
      <path d="M45,57 L45,45 C45,40 55,40 55,45 L55,57 Z" fill="#2E231B" />
      <circle cx="50" cy="50" r="3" fill="#D4A359" opacity="0.8" />

      {/* Wheels */}
      {/* Left Wheel */}
      <circle cx="35" cy="70" r="10" fill="#3B2D22" />
      <circle cx="35" cy="70" r="8" fill="#5C4A3D" stroke="#2E231B" strokeWidth="1" />
      <circle cx="35" cy="70" r="2" fill="#2E231B" />
      <path d="M35,62 L35,78 M27,70 L43,70 M29,64 L41,76 M29,76 L41,64" stroke="#2E231B" strokeWidth="1" />
      
      {/* Right Wheel */}
      <circle cx="65" cy="70" r="10" fill="#3B2D22" />
      <circle cx="65" cy="70" r="8" fill="#5C4A3D" stroke="#2E231B" strokeWidth="1" />
      <circle cx="65" cy="70" r="2" fill="#2E231B" />
      <path d="M65,62 L65,78 M57,70 L73,70 M59,64 L71,76 M59,76 L71,64" stroke="#2E231B" strokeWidth="1" />

      {/* Top Vimana (Tower) */}
      <path d="M35,30 L65,30 L60,20 L40,20 Z" fill="#755E4C" />
      <path d="M42,20 L58,20 L54,12 L46,12 Z" fill="#665243" />
      <circle cx="50" cy="10" r="4" fill="#D4A359" />

      {/* Decorative details */}
      <path d="M35,30 L65,30" stroke="#3B2D22" strokeWidth="1" strokeDasharray="2,2" />
      <path d="M25,65 L75,65" stroke="#3B2D22" strokeWidth="1" strokeDasharray="2,2" />

      <defs>
        <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
