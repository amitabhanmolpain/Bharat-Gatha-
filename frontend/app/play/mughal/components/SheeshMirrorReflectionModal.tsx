"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

interface SheeshMirrorReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 3 Pedestals for Candle: "left" | "center" | "right"
type CandlePosition = "left" | "center" | "right";

export default function SheeshMirrorReflectionModal({
  isOpen,
  onClose,
  onSuccess,
}: SheeshMirrorReflectionModalProps) {
  // Candle position on the floor
  const [candlePos, setCandlePos] = useState<CandlePosition>("left");

  // 3 Ornate Mirrors with rotation angles (0 to 360)
  // Target angles to form the sacred 8-fold ceiling star:
  // Mirror 1 (West arch): 45°
  // Mirror 2 (East arch): 135°
  // Mirror 3 (Fountain arch): 90°
  const [mirror1Angle, setMirror1Angle] = useState<number>(0);
  const [mirror2Angle, setMirror2Angle] = useState<number>(180);
  const [mirror3Angle, setMirror3Angle] = useState<number>(0);

  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [sparkleCount, setSparkleCount] = useState<number>(0);
  const [showCelebrationEffects, setShowCelebrationEffects] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context for authentic crystal glass and celestial sounds
  const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Sound 1: Crystal Mirror Glass Click
  const playMirrorSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  // Sound 2: Candle Pedestal Placement Sound
  const playCandleSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  // Sound 3: Majestic Sheesh Mahal Celestial Chimes & Glass Harmonics
  const playCelebrationSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0]; // C5, E5, G5, C6, E6, G6, C7
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.12;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.7);
      });
    } catch (e) {}
  };

  // Sparkle animation loop
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSparkleCount((prev) => (prev + 1) % 100);
    }, 150);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Check if optical alignment is achieved
  const isM1Aligned = Math.abs(mirror1Angle - 45) < 15 || Math.abs(mirror1Angle - 225) < 15;
  const isM2Aligned = Math.abs(mirror2Angle - 135) < 15 || Math.abs(mirror2Angle - 315) < 15;
  const isM3Aligned = Math.abs(mirror3Angle - 90) < 15 || Math.abs(mirror3Angle - 270) < 15;
  const isCandleCentered = candlePos === "center";

  const totalAligned =
    (isCandleCentered ? 1 : 0) +
    (isM1Aligned ? 1 : 0) +
    (isM2Aligned ? 1 : 0) +
    (isM3Aligned ? 1 : 0);

  const allAligned = isCandleCentered && isM1Aligned && isM2Aligned && isM3Aligned;
  const hasCalledSuccessRef = useRef(false);

  useEffect(() => {
    if (allAligned && !hasCalledSuccessRef.current) {
      hasCalledSuccessRef.current = true;
      setIsSolved(true);
      setShowCelebrationEffects(true);
      playCelebrationSound();

      // Trigger success callback after celebratory animation
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  }, [allAligned, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#12100e] border-4 border-[#d4af37] rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(212,175,55,0.3)] relative flex flex-col md:flex-row gap-5 text-white overflow-hidden">
        
        {/* Background Subtle Sheesh Mahal Silhouette */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: "url('/bg-agra-sheesh-mahal.jpg')" }}
        />

        {/* Left / Main Simulation Stage: Mirrored Ceiling Dome & Optical Chamber */}
        <div className="flex-1 flex flex-col items-center relative z-10">
          
          {/* Title Header */}
          <div className="w-full flex items-center justify-between mb-2 border-b border-amber-500/30 pb-2">
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                Aina-Kari Optical Chamber
              </span>
              <h2 className="text-lg sm:text-xl font-black text-amber-200 flex items-center gap-2">
                <span>🕯️</span> Sheesh Mahal Starlight Reflection
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg border border-amber-400/50 shadow transition-all duration-300 ${
                allAligned
                  ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.9)] scale-105"
                  : "bg-black/60 text-amber-300"
              }`}>
                Alignment: {totalAligned}/4
              </span>
            </div>
          </div>

          <p className="text-xs text-amber-100/80 mb-3 text-center max-w-md">
            Position the Imperial Candle on the Sacred Lotus pedestal and rotate the ornate mirrors to form the legendary <span className="text-amber-300 font-bold">8-Fold Mughal Celestial Star</span> on the ceiling dome!
          </p>

          {/* --- CEILING DOME VIEW (THE ROOF PATTERN) --- */}
          <div className={`relative w-full h-[225px] sm:h-[245px] bg-gradient-to-b from-[#080706] to-[#1a1714] border-3 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-2 mb-4 transition-all duration-700 ${
            allAligned ? "border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.6)] ring-4 ring-amber-500/30" : "border-amber-500/70"
          }`}>
            
            {/* Ambient Ceiling Dome Shadow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)]" />

            {/* Pulsing Shockwave Ripple Rings when Solved */}
            {showCelebrationEffects && (
              <>
                <div className="absolute w-24 h-24 rounded-full border-2 border-amber-300/80 animate-ping pointer-events-none" style={{ animationDuration: "1.8s" }} />
                <div className="absolute w-48 h-48 rounded-full border border-yellow-200/60 animate-ping pointer-events-none" style={{ animationDuration: "2.4s" }} />
                <div className="absolute w-72 h-72 rounded-full border border-amber-400/40 animate-ping pointer-events-none" style={{ animationDuration: "3s" }} />
              </>
            )}

            {/* Intricate Mughal Ceiling Dome Radial Geometry */}
            <div className={`relative w-44 h-44 sm:w-48 sm:h-48 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
              allAligned
                ? "border-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.8)] scale-105"
                : "border-amber-400/40 shadow-[0_0_30px_rgba(0,0,0,0.9)]"
            }`}>
              
              {/* Outer Mirrored Vault Rings */}
              <div 
                className={`absolute inset-0 rounded-full border transition-all duration-700 ${
                  allAligned ? "border-amber-300/80 animate-spin" : "border-dashed border-amber-300/30 animate-spin"
                }`} 
                style={{ animationDuration: allAligned ? "20s" : "60s" }} 
              />
              <div className="absolute inset-2 rounded-full border border-amber-400/20" />
              <div className="absolute inset-5 rounded-full border border-amber-400/30" />

              {/* 8-Pointed Star Stucco Inlays (Mughal Khatam Pattern) */}
              <svg className="w-full h-full absolute inset-0 text-amber-300 transition-all duration-700" viewBox="0 0 100 100">
                {/* 8 Triangular facet lines radiating from center */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={50 + 44 * Math.cos((angle * Math.PI) / 180)}
                    y2={50 + 44 * Math.sin((angle * Math.PI) / 180)}
                    stroke={allAligned ? "rgba(254, 240, 138, 0.95)" : "rgba(212, 175, 55, 0.25)"}
                    strokeWidth={allAligned ? "2" : "0.75"}
                    strokeDasharray={allAligned ? "none" : "2,2"}
                  />
                ))}

                {/* 8-Pointed Outer Star */}
                <polygon
                  points="50,10 62,38 90,50 62,62 50,90 38,62 10,50 38,38"
                  fill={allAligned ? "rgba(251, 191, 36, 0.45)" : "rgba(212, 175, 55, 0.05)"}
                  stroke={allAligned ? "#fef08a" : "rgba(212, 175, 55, 0.4)"}
                  strokeWidth={allAligned ? "2" : "1.5"}
                  className="transition-all duration-700"
                  style={{
                    filter: allAligned ? "drop-shadow(0 0 10px rgba(251, 191, 36, 0.9))" : "none",
                  }}
                />

                {/* Inner Lotus Rosette */}
                <polygon
                  points="50,25 58,42 75,50 58,58 50,75 42,58 25,50 42,42"
                  fill={allAligned ? "rgba(245, 158, 11, 0.65)" : "rgba(0, 0, 0, 0.2)"}
                  stroke={allAligned ? "#ffffff" : "rgba(212, 175, 55, 0.3)"}
                  strokeWidth={allAligned ? "1.5" : "1"}
                  style={{
                    filter: allAligned ? "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))" : "none",
                  }}
                />
              </svg>

              {/* Thousands of tiny convex mirror glass sparkles */}
              {allAligned && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const angle = (i * 11.25 * Math.PI) / 180;
                    const r = 14 + ((i * 17) % 52);
                    const x = 50 + r * Math.cos(angle);
                    const y = 50 + r * Math.sin(angle);
                    const isFlicker = (i + sparkleCount) % 3 === 0;

                    return (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-cyan-100 rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] transition-all duration-200"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          opacity: isFlicker ? 1 : 0.4,
                          transform: `scale(${isFlicker ? 1.8 : 0.9})`,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Central Glowing Keystone */}
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
                allAligned
                  ? "bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 border-white shadow-[0_0_40px_rgba(251,191,36,1)] scale-125 animate-pulse"
                  : "bg-amber-950/80 border-amber-500/50"
              }`}>
                <span className="text-sm">{allAligned ? "🌟" : "✦"}</span>
              </div>
            </div>

            {/* Beams streaming dynamically from bottom candle & mirrors up into the ceiling dome */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {isCandleCentered && (
                <>
                  {/* Central direct beam */}
                  <line
                    x1="50"
                    y1="95"
                    x2="50"
                    y2="50"
                    stroke={allAligned ? "#fef08a" : "rgba(251, 191, 36, 0.7)"}
                    strokeWidth={allAligned ? "2.5" : "1.5"}
                    strokeDasharray={allAligned ? "none" : "4 2"}
                    className="animate-pulse drop-shadow-[0_0_8px_rgba(254,240,138,0.9)]"
                  />
                  {/* Left mirror beam */}
                  <line
                    x1="50"
                    y1="95"
                    x2="20"
                    y2="65"
                    stroke={isM1Aligned ? "#fef08a" : "rgba(251, 191, 36, 0.5)"}
                    strokeWidth={isM1Aligned ? "2" : "1.2"}
                  />
                  {/* Right mirror beam */}
                  <line
                    x1="50"
                    y1="95"
                    x2="80"
                    y2="65"
                    stroke={isM2Aligned ? "#fef08a" : "rgba(251, 191, 36, 0.5)"}
                    strokeWidth={isM2Aligned ? "2" : "1.2"}
                  />

                  {/* Reflected beams when mirrors are aligned */}
                  {isM1Aligned && (
                    <line
                      x1="20"
                      y1="65"
                      x2="50"
                      y2="50"
                      stroke="#fef08a"
                      strokeWidth="2.5"
                      className="drop-shadow-[0_0_8px_rgba(254,240,138,0.9)] animate-pulse"
                    />
                  )}
                  {isM2Aligned && (
                    <line
                      x1="80"
                      y1="65"
                      x2="50"
                      y2="50"
                      stroke="#fef08a"
                      strokeWidth="2.5"
                      className="drop-shadow-[0_0_8px_rgba(254,240,138,0.9)] animate-pulse"
                    />
                  )}
                  {isM3Aligned && (
                    <line
                      x1="50"
                      y1="82"
                      x2="50"
                      y2="50"
                      stroke="#fef08a"
                      strokeWidth="2.5"
                      className="drop-shadow-[0_0_8px_rgba(254,240,138,0.9)] animate-pulse"
                    />
                  )}
                </>
              )}
            </svg>

            {/* Solved Celebration Overlay with Prize Reveal on Screen */}
            {isSolved && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-white animate-in zoom-in-90 duration-300 z-30">
                <div className="bg-amber-400 text-black px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-black mb-1 animate-bounce">
                  🏆 Imperial Prize Unlocked
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,1)] leading-tight">
                  Permission to Khas Mahal!
                </h3>
                
                {/* Transparent Parchment Decree Preview */}
                <div className="my-1.5 max-w-[200px] flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-500">
                  <img
                    src="/khas_mahal_permission_decree.png"
                    alt="Permission to Khas Mahal"
                    className="w-full h-auto object-contain max-h-24"
                  />
                </div>

                <p className="text-[11px] font-bold text-amber-100/90 text-center max-w-[240px] leading-tight mb-2">
                  The celestial star has illuminated the palace! Emperor Shah Jahan grants clearance to enter Khas Mahal.
                </p>

                <button
                  onClick={() => onSuccess()}
                  className="bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black font-black text-xs px-4 py-1.5 rounded-lg border border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
                >
                  📜 Claim Decree & Open Passage
                </button>
              </div>
            )}

            {/* Ceiling Status Banner with Animation */}
            {!isSolved && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full border text-[11px] font-black transition-all duration-500 shadow-md bg-black/75 text-amber-200 border-amber-500/40">
                🔭 Adjust Candle & Mirrors to Form Mandala
              </div>
            )}
          </div>

          {/* --- LOWER CONTROLS: CANDLE PEDESTALS & MIRROR ANGLE DIALS --- */}
          <div className="w-full bg-[#1e1b18] border-2 border-amber-500/40 rounded-xl p-3 flex flex-col gap-3">
            
            {/* Candle Placement Selector */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider mb-1.5 flex items-center gap-1">
                <span>🕯️</span> 1. Select Candle Pedestal
              </span>
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                {(["left", "center", "right"] as CandlePosition[]).map((pos) => {
                  const isCurrent = candlePos === pos;
                  const isOptimal = pos === "center";

                  return (
                    <button
                      key={pos}
                      onClick={() => {
                        setCandlePos(pos);
                        playCandleSound();
                      }}
                      className={`py-2 px-1 rounded-lg border-2 font-black text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        isCurrent
                          ? "bg-amber-400 text-black border-white shadow-[0_0_12px_rgba(251,191,36,0.7)] scale-105"
                          : "bg-black/40 text-amber-200 border-amber-500/30 hover:border-amber-400 hover:bg-black/60"
                      }`}
                    >
                      <span className="text-base">{isCurrent ? "🔥" : "🪔"}</span>
                      <span className="capitalize">{pos === "center" ? "Sacred Lotus" : `${pos} Pedestal`}</span>
                      {isCurrent && (
                        <span className="text-[8px] bg-black text-amber-300 px-1 rounded">
                          {isOptimal ? "Optimal Focus" : "Scattered"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 Mirrors Angle Dials */}
            <div>
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider mb-1.5 block text-center">
                🪞 2. Angle The Ornate Arch Mirrors
              </span>

              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Mirror 1 */}
                <div className={`p-2 rounded-lg border flex flex-col items-center justify-between transition-colors ${
                  isM1Aligned ? "bg-amber-950/40 border-amber-400" : "bg-black/30 border-amber-500/20"
                }`}>
                  <span className="text-[10px] font-bold text-amber-300">West Mirror</span>
                  <div 
                    className="w-10 h-10 my-1 rounded-full border-2 border-cyan-300 bg-slate-800 flex items-center justify-center shadow-inner transition-transform duration-300"
                    style={{ transform: `rotate(${mirror1Angle}deg)` }}
                  >
                    <div className="w-1 h-8 bg-cyan-200 rounded shadow-[0_0_6px_rgba(34,211,238,1)]" />
                  </div>
                  <div className="flex gap-1 w-full">
                    <button
                      onClick={() => {
                        setMirror1Angle((a) => (a + 45) % 360);
                        playMirrorSound();
                      }}
                      className="flex-1 bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black rounded text-[10px] font-bold py-1 border border-amber-400/40 cursor-pointer transition-all"
                    >
                      ↻ 45° ({mirror1Angle}°)
                    </button>
                  </div>
                </div>

                {/* Mirror 3 (Center Arch) */}
                <div className={`p-2 rounded-lg border flex flex-col items-center justify-between transition-colors ${
                  isM3Aligned ? "bg-amber-950/40 border-amber-400" : "bg-black/30 border-amber-500/20"
                }`}>
                  <span className="text-[10px] font-bold text-amber-300">Fountain Mirror</span>
                  <div 
                    className="w-10 h-10 my-1 rounded-full border-2 border-cyan-300 bg-slate-800 flex items-center justify-center shadow-inner transition-transform duration-300"
                    style={{ transform: `rotate(${mirror3Angle}deg)` }}
                  >
                    <div className="w-1 h-8 bg-cyan-200 rounded shadow-[0_0_6px_rgba(34,211,238,1)]" />
                  </div>
                  <div className="flex gap-1 w-full">
                    <button
                      onClick={() => {
                        setMirror3Angle((a) => (a + 45) % 360);
                        playMirrorSound();
                      }}
                      className="flex-1 bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black rounded text-[10px] font-bold py-1 border border-amber-400/40 cursor-pointer transition-all"
                    >
                      ↻ 45° ({mirror3Angle}°)
                    </button>
                  </div>
                </div>

                {/* Mirror 2 */}
                <div className={`p-2 rounded-lg border flex flex-col items-center justify-between transition-colors ${
                  isM2Aligned ? "bg-amber-950/40 border-amber-400" : "bg-black/30 border-amber-500/20"
                }`}>
                  <span className="text-[10px] font-bold text-amber-300">East Mirror</span>
                  <div 
                    className="w-10 h-10 my-1 rounded-full border-2 border-cyan-300 bg-slate-800 flex items-center justify-center shadow-inner transition-transform duration-300"
                    style={{ transform: `rotate(${mirror2Angle}deg)` }}
                  >
                    <div className="w-1 h-8 bg-cyan-200 rounded shadow-[0_0_6px_rgba(34,211,238,1)]" />
                  </div>
                  <div className="flex gap-1 w-full">
                    <button
                      onClick={() => {
                        setMirror2Angle((a) => (a + 45) % 360);
                        playMirrorSound();
                      }}
                      className="flex-1 bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black rounded text-[10px] font-bold py-1 border border-amber-400/40 cursor-pointer transition-all"
                    >
                      ↻ 45° ({mirror2Angle}°)
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Historical Lore & Guide Card */}
        <div className="w-full md:w-60 flex flex-col justify-between border-t md:border-t-0 md:border-l border-amber-500/30 pt-3 md:pt-0 md:pl-4 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1">
              Royal Architecture Lore
            </span>
            <h4 className="text-base font-black text-amber-200 leading-tight mb-2">
              The Thousand-Star Ceiling
            </h4>

            <div className="bg-amber-950/50 border border-amber-500/40 rounded-lg p-2.5 text-[11px] text-amber-100 leading-relaxed mb-3 shadow-inner">
              <p className="mb-1.5 font-medium">
                In 1653, Emperor Shah Jahan designed the Sheesh Mahal as a royal imperial dressing room.
              </p>
              <p className="font-semibold text-amber-300">
                Syrian convex mirrors embedded into the plaster stucco multiply a single flame into a celestial galaxy of reflections across the vaulted roof dome!
              </p>
            </div>

            <div className="bg-black/60 border border-amber-500/30 rounded-lg p-2.5 text-[11px] text-gray-300">
              <span className="font-bold text-amber-300">✨ Goal:</span>
              <ul className="list-disc list-inside mt-1 space-y-1 text-[10.5px]">
                <li>Place candle on the <strong>Sacred Lotus</strong> pedestal.</li>
                <li>Rotate West, Fountain, and East mirrors until beams converge into the ceiling dome.</li>
                <li>Reveal the glowing <strong>Mughal Khatam Star</strong>!</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setCandlePos("left");
                setMirror1Angle(0);
                setMirror2Angle(180);
                setMirror3Angle(0);
                setIsSolved(false);
                setShowCelebrationEffects(false);
                playMirrorSound();
              }}
              className="flex-1 bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black border border-amber-400/50 rounded-lg py-2 font-black text-xs shadow cursor-pointer transition-all"
            >
              🔄 Reset
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white border border-black rounded-lg px-4 py-2 font-black text-xs shadow cursor-pointer transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
