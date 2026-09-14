"use client";

import React from "react";
import {
  Scroll,
  BookOpen,
  Landmark,
  RotateCcw,
  RotateCw,
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
  Search,
  Key,
  Volume2,
  VolumeX,
  Play,
  Square,
  X,
  Crown,
  Dice5,
  Tent,
  Swords,
  CircleDot,
  Target,
  Bookmark,
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
  | "keeper"
  | "search"
  | "key"
  | "volume"
  | "volume_x"
  | "play"
  | "stop"
  | "close"
  | "crown"
  | "dice"
  | "tent"
  | "swords"
  | "wheel"
  | "target"
  | "bookmark"
  | "rotate_cw";

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
  search: Search,
  key: Key,
  volume: Volume2,
  volume_x: VolumeX,
  play: Play,
  stop: Square,
  close: X,
  crown: Crown,
  dice: Dice5,
  tent: Tent,
  swords: Swords,
  wheel: CircleDot,
  target: Target,
  bookmark: Bookmark,
  rotate_cw: RotateCw,
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
