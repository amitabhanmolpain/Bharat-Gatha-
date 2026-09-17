"use client";

import React from "react";

interface VijayStambhGlyphArtProps {
  glyphId: string;
  size?: number | string;
  mode?: "camouflaged" | "target" | "revealing" | "collected" | "chiseled";
  className?: string;
}

export default function VijayStambhGlyphArt({
  glyphId,
  size = 48,
  mode = "target",
  className = "",
}: VijayStambhGlyphArtProps) {
  // Color Palettes based on state
  // Camouflaged: Blends into warm sandstone (#8c5831, #5e371b, #a87143)
  // Target / Active: Crisp golden & amber highlights (#fbbf24, #f59e0b, #78350f)
  // Revealing: Radiant gold & white-hot chisel glow
  const isCamouflaged = mode === "camouflaged";
  const isRevealing = mode === "revealing";
  const isCollected = mode === "collected";

  const primaryColor = isRevealing
    ? "#ffffff"
    : isCamouflaged
    ? "#9a6538"
    : isCollected
    ? "#eab308"
    : "#fef08a";

  const accentColor = isRevealing
    ? "#fde047"
    : isCamouflaged
    ? "#6f421f"
    : isCollected
    ? "#ca8a04"
    : "#f59e0b";

  const shadowColor = isRevealing
    ? "#ca8a04"
    : isCamouflaged
    ? "#3d2210"
    : isCollected
    ? "#713f12"
    : "#451a03";

  const renderGlyphContent = () => {
    switch (glyphId.toUpperCase()) {
      case "BHOOMI":
        // Foundation Bedrock / Kurma Earth Tortoise & Strata Runes
        return (
          <g>
            {/* Base Strata Bedrock */}
            <path
              d="M6 38 H42 V42 H6 Z"
              fill={shadowColor}
            />
            <path
              d="M10 34 H38 V37 H10 Z"
              fill={accentColor}
            />
            {/* Kurma Dome Shell */}
            <path
              d="M14 33 C14 20 34 20 34 33 Z"
              fill={primaryColor}
              stroke={shadowColor}
              strokeWidth="2"
            />
            {/* Foundation Runes inside shell */}
            <path
              d="M20 28 L24 23 L28 28"
              fill="none"
              stroke={shadowColor}
              strokeWidth="2"
            />
            <circle cx="24" cy="20" r="2" fill={accentColor} />
            <path d="M8 36 L12 36 M36 36 L40 36" stroke={shadowColor} strokeWidth="2" />
          </g>
        );

      case "JALA":
        // Sacred Waters & 8-Petaled Lotus Ripple
        return (
          <g>
            {/* Water Waves */}
            <path
              d="M6 36 Q15 30 24 36 Q33 42 42 36"
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
            />
            <path
              d="M8 40 Q16 36 24 40 Q32 44 40 40"
              fill="none"
              stroke={shadowColor}
              strokeWidth="2"
            />
            {/* Lotus Petals */}
            <path
              d="M24 10 C20 18 20 28 24 30 C28 28 28 18 24 10 Z"
              fill={primaryColor}
              stroke={shadowColor}
              strokeWidth="1.5"
            />
            <path
              d="M16 16 C16 22 20 28 24 30 C18 28 14 22 16 16 Z"
              fill={accentColor}
            />
            <path
              d="M32 16 C32 22 28 28 24 30 C30 28 34 22 32 16 Z"
              fill={accentColor}
            />
            <circle cx="24" cy="22" r="2.5" fill={shadowColor} />
          </g>
        );

      case "AGNI":
        // Sacred Sarangpur Fire Altar & Triple Flame
        return (
          <g>
            {/* Stepped Fire Altar Base */}
            <path d="M10 40 H38 V43 H10 Z" fill={shadowColor} />
            <path d="M14 36 H34 V39 H14 Z" fill={accentColor} />
            <path d="M18 33 H30 V35 H18 Z" fill={primaryColor} />
            {/* Central Flame */}
            <path
              d="M24 8 C20 15 16 22 24 32 C32 22 28 15 24 8 Z"
              fill={primaryColor}
              stroke={shadowColor}
              strokeWidth="1.5"
            />
            {/* Left Flame Flank */}
            <path
              d="M16 18 C13 22 16 28 21 31 C17 28 15 24 16 18 Z"
              fill={accentColor}
            />
            {/* Right Flame Flank */}
            <path
              d="M32 18 C35 22 32 28 27 31 C31 28 33 24 32 18 Z"
              fill={accentColor}
            />
            <circle cx="24" cy="22" r="2" fill={shadowColor} />
          </g>
        );

      case "VAYU":
        // Royal Victory Pennant & Swirling Wind Vortex
        return (
          <g>
            {/* Flagpole & Finial */}
            <line x1="14" y1="8" x2="14" y2="42" stroke={shadowColor} strokeWidth="3" />
            <circle cx="14" cy="7" r="2" fill={primaryColor} />
            {/* Fluttering Royal Rajput Triangular Banner */}
            <path
              d="M14 10 L38 20 L14 30 Z"
              fill={primaryColor}
              stroke={accentColor}
              strokeWidth="2"
            />
            {/* Solar Sun Motif inside banner */}
            <circle cx="21" cy="20" r="3" fill={shadowColor} />
            {/* Wind Swirl Trails */}
            <path
              d="M6 16 Q10 12 12 18"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
            />
            <path
              d="M22 34 Q30 38 38 33 Q44 28 40 24"
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
            />
          </g>
        );

      case "SUTRA":
        // Sutradhara Jaita's Compass & Architect Plumb Line
        return (
          <g>
            {/* Outer Geometric Mandala Square */}
            <rect
              x="10"
              y="10"
              width="28"
              height="28"
              fill="none"
              stroke={shadowColor}
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            {/* Architect's Compass / Divider Legs */}
            <path
              d="M24 8 L12 40 M24 8 L36 40"
              stroke={primaryColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Compass Pivot Joint */}
            <circle cx="24" cy="8" r="3.5" fill={accentColor} stroke={shadowColor} strokeWidth="1.5" />
            {/* Horizontal Arc Scale */}
            <path
              d="M16 28 Q24 33 32 28"
              fill="none"
              stroke={shadowColor}
              strokeWidth="2"
            />
            <line x1="24" y1="12" x2="24" y2="36" stroke={accentColor} strokeWidth="1.5" />
          </g>
        );

      case "SANGEET":
        // Ancient Rajasthani Sarangi Lute & Melodic Note Resonance
        return (
          <g>
            {/* Instrument Body */}
            <rect
              x="18"
              y="12"
              width="12"
              height="26"
              rx="4"
              fill={primaryColor}
              stroke={shadowColor}
              strokeWidth="2"
            />
            {/* Sound Holes & Bridge */}
            <circle cx="21" cy="20" r="1.5" fill={shadowColor} />
            <circle cx="27" cy="20" r="1.5" fill={shadowColor} />
            <rect x="20" y="28" width="8" height="3" fill={accentColor} />
            {/* Strings / Pegbox */}
            <line x1="24" y1="6" x2="24" y2="40" stroke={shadowColor} strokeWidth="1.5" />
            <path d="M19 8 H29" stroke={accentColor} strokeWidth="2" />
            {/* Musical Swara Wave Trails */}
            <path
              d="M10 22 Q6 16 10 10 Q14 14 10 22 Z"
              fill={accentColor}
            />
            <path
              d="M38 24 Q42 18 38 12 Q34 16 38 24 Z"
              fill={primaryColor}
            />
          </g>
        );

      case "DHARMA":
        // 12-Spoked Sudarshana Chakra of Lord Vishnu
        return (
          <g>
            {/* Outer Sacred Ring */}
            <circle
              cx="24"
              cy="24"
              r="17"
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.5"
            />
            {/* Inner Hub */}
            <circle
              cx="24"
              cy="24"
              r="6"
              fill={accentColor}
              stroke={shadowColor}
              strokeWidth="2"
            />
            <circle cx="24" cy="24" r="2" fill={primaryColor} />
            {/* 8 Cardinal & Diagonal Spokes */}
            <line x1="24" y1="7" x2="24" y2="41" stroke={shadowColor} strokeWidth="2" />
            <line x1="7" y1="24" x2="41" y2="24" stroke={shadowColor} strokeWidth="2" />
            <line x1="12" y1="12" x2="36" y2="36" stroke={shadowColor} strokeWidth="1.5" />
            <line x1="12" y1="36" x2="36" y2="12" stroke={shadowColor} strokeWidth="1.5" />
          </g>
        );

      case "KUMBHA":
        // Maharana Kumbha Royal Crown & Crossed Talwar Swords
        return (
          <g>
            {/* Crossed Talwar Swords */}
            <line x1="10" y1="10" x2="38" y2="38" stroke={shadowColor} strokeWidth="2.5" />
            <line x1="38" y1="10" x2="10" y2="38" stroke={shadowColor} strokeWidth="2.5" />
            {/* Royal Crown / Chhatri */}
            <path
              d="M12 28 L15 16 L24 22 L33 16 L36 28 Z"
              fill={primaryColor}
              stroke={shadowColor}
              strokeWidth="2"
            />
            {/* Crown Gems */}
            <circle cx="15" cy="16" r="2" fill={accentColor} />
            <circle cx="24" cy="22" r="2" fill={accentColor} />
            <circle cx="33" cy="16" r="2" fill={accentColor} />
            {/* Royal Crest Base */}
            <rect x="14" y="29" width="20" height="4" fill={accentColor} />
          </g>
        );

      case "AKASHA":
        // Celestial Kalasha Pinnacle & Cosmic 8-Pointed Star
        return (
          <g>
            {/* Celestial 8-Pointed Star */}
            <path
              d="M24 6 L27 15 L36 12 L30 20 L38 24 L30 28 L36 36 L27 33 L24 42 L21 33 L12 36 L18 28 L10 24 L18 20 L12 12 L21 15 Z"
              fill={primaryColor}
              stroke={shadowColor}
              strokeWidth="1.5"
            />
            {/* Central Cosmic Sun Vault */}
            <circle cx="24" cy="24" r="6" fill={accentColor} stroke={shadowColor} strokeWidth="1.5" />
            <circle cx="24" cy="24" r="2.5" fill={primaryColor} />
          </g>
        );

      default:
        return (
          <g>
            <circle cx="24" cy="24" r="16" stroke={primaryColor} strokeWidth="2" fill="none" />
            <path d="M16 16 L32 32 M32 16 L16 32" stroke={accentColor} strokeWidth="2" />
          </g>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${
        isRevealing ? "animate-pulse" : ""
      }`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full"
        style={{
          imageRendering: "pixelated",
          filter: isRevealing
            ? "drop-shadow(0 0 8px rgba(253, 224, 71, 0.95)) drop-shadow(0 0 16px rgba(245, 158, 11, 0.8))"
            : isCamouflaged
            ? "drop-shadow(1px 1px 0 rgba(40, 20, 10, 0.7)) contrast(1.15) brightness(0.95)"
            : isCollected
            ? "drop-shadow(0 0 4px rgba(234, 179, 8, 0.6))"
            : "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
        }}
      >
        {renderGlyphContent()}
      </svg>
    </div>
  );
}
