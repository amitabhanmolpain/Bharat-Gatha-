"use client";

import React, { useEffect, useRef } from "react";

interface TransitionModalProps {
  isActive: boolean;
  progress: number;
  title: string;
  description: string;
  travelType?: "coracle" | "stone_road" | "temple_walk";
}

export default function TransitionModal({
  isActive,
  progress,
  title,
  description,
  travelType = "coracle",
}: TransitionModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  // Single audio instance — prevents double-play and guarantees clean teardown
  const boatAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- BOAT ROWING SOUND (existing /boat-transition.webm asset) ---
  // Plays only during a coracle river crossing and stops the moment the
  // transition ends or the component unmounts.
  useEffect(() => {
    if (!isActive || travelType !== "coracle") {
      // Not a coracle crossing — stop any leftover audio
      if (boatAudioRef.current) {
        try {
          boatAudioRef.current.pause();
          boatAudioRef.current.currentTime = 0;
          boatAudioRef.current.src = "";
        } catch (_) {}
        boatAudioRef.current = null;
      }
      return;
    }

    // Already playing — don't start a second instance
    if (boatAudioRef.current) return;

    const audio = new Audio("/boat-transition.webm");
    audio.loop = true;
    audio.volume = 0.55;
    boatAudioRef.current = audio;

    audio.play().catch(() => {
      // Autoplay may be blocked until a user gesture — silent fail is acceptable
    });

    return () => {
      // Transition ended or component unmounted — stop immediately
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
      } catch (_) {}
      if (boatAudioRef.current === audio) {
        boatAudioRef.current = null;
      }
    };
  }, [isActive, travelType]);

  // --- FOCUS MANAGEMENT ---
  useEffect(() => {
    if (!isActive) return;

    // Save previous active element to restore focus when transition finishes
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Immediately blur any active background control (e.g., HUD buttons)
    if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === "function") {
      (document.activeElement as HTMLElement).blur();
    }

    // Move focus into the modal container
    const focusTimer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.focus();
      }
    }, 20);

    // Trap focus and prevent key activations from bubbling to background
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        if (containerRef.current) {
          containerRef.current.focus();
        }
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown, { capture: true });

      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === "function" &&
        document.body.contains(previousActiveElementRef.current)
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transition-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg animate-fadeIn p-4 outline-none"
    >
      <div className="relative w-full max-w-2xl bg-[#1e1b18] border-4 border-[#5a4d3f] rounded-2xl p-8 text-center text-[#f6ede0] shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Top Decorative Border Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#d4a359] to-transparent"></div>

        {/* Dynamic Animated Travel Icon Badge */}
        <div className="mx-auto w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-[#2c2621] to-[#141210] border-2 border-[#d4a359] flex items-center justify-center text-5xl shadow-[0_0_25px_rgba(212,163,89,0.3)] animate-pulse">
          {travelType === "coracle" ? "🛶" : travelType === "stone_road" ? "🏛️" : "🛕"}
        </div>

        {/* Journey Subtitle */}
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#d4a359] mb-2">
          {travelType === "coracle"
            ? "Tungabhadra Coracle Crossing"
            : travelType === "stone_road"
            ? "Royal Granite Car Street"
            : "Hampi Monumental Pathway"}
        </div>

        {/* Title */}
        <h2 id="transition-title" className="text-2xl md:text-3xl font-serif font-bold text-[#f6ede0] tracking-wide mb-3">
          {title}
        </h2>

        {/* Description */}
        <p className="text-sm font-serif text-[#d6c7b2] max-w-lg mx-auto leading-relaxed mb-8 italic">
          &ldquo;{description}&rdquo;
        </p>

        {/* Progress Bar Container */}
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Journey Travel Progress"
          className="w-full bg-[#141210] rounded-full h-3.5 border border-[#4a4034] p-0.5 overflow-hidden shadow-inner mb-3"
        >
          <div
            className="bg-gradient-to-r from-[#8b6528] via-[#d4a359] to-[#f3cb85] h-full rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(212,163,89,0.6)]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>

        {/* Progress Label */}
        <div className="flex justify-between text-[11px] font-mono text-[#a89985] px-1">
          <span>Departing</span>
          <span className="text-[#d4a359] font-bold">{Math.round(progress)}%</span>
          <span>Arriving at Next Enclosure</span>
        </div>
      </div>
    </div>
  );
}
