"use client";

import React from "react";
import {
  Scroll,
  BookOpen,
  Landmark,
  RotateCcw,
  Keyboard,
  Mountain,
  Sailboat,
  Sparkles,
  Waves,
  Gem,
  Palette,
  Compass,
  Music,
  Shield,
  Sunset,
  Layers,
  LucideProps,
} from "lucide-react";

export type GameIconType =
  | "ledger"
  | "journal"
  | "hub"
  | "reset"
  | "controls"
  | "fort_trail"
  | "coracle"
  | "sage"
  | "river"
  | "gem"
  | "artisan"
  | "traveler"
  | "temple"
  | "music"
  | "archery"
  | "courtyard"
  | "sunset"
  | "keeper";

interface GameIconProps extends Omit<LucideProps, "ref"> {
  name: GameIconType;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<GameIconType, React.ComponentType<LucideProps>> = {
  ledger: Scroll,
  journal: BookOpen,
  hub: Landmark,
  reset: RotateCcw,
  controls: Keyboard,
  fort_trail: Mountain,
  coracle: Sailboat,
  sage: Sparkles,
  river: Waves,
  gem: Gem,
  artisan: Palette,
  traveler: Compass,
  temple: Landmark,
  music: Music,
  archery: Shield,
  courtyard: RotateCcw,
  sunset: Sunset,
  keeper: Layers,
};

export default function GameIcon({
  name,
  className = "",
  size = 18,
  ...props
}: GameIconProps) {
  const IconComponent = ICON_MAP[name] || Sparkles;

  return (
    <IconComponent
      size={size}
      className={`shrink-0 inline-block align-middle transition-transform ${className}`}
      strokeWidth={2.2}
      aria-hidden="true"
      {...props}
    />
  );
}
