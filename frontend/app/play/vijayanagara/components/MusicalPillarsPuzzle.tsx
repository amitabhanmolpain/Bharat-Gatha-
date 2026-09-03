"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface MusicalPillarsPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  alreadyFoundFragment: boolean;
  onDiscoverFragment: () => void;
}

interface SwaraPillar {
  id: number;
  swara: string;
  name: string;
  freq: number;
  color: string;
  glowColor: string;
}

export default function MusicalPillarsPuzzle({
  isOpen,
  onClose,
  alreadyFoundFragment,
  onDiscoverFragment,
}: MusicalPillarsPuzzleProps) {
  // 5 Resonant Classical Swara Pillars
  const pillars: SwaraPillar[] = [
    { id: 0, swara: "Sa", name: "Shadja Pillar", freq: 261.63, color: "#d4a359", glowColor: "rgba(212,163,89,0.8)" },
    { id: 1, swara: "Re", name: "Rishabha Pillar", freq: 293.66, color: "#c86446", glowColor: "rgba(200,100,70,0.8)" },
    { id: 2, swara: "Ga", name: "Gandhara Pillar", freq: 329.63, color: "#368b94", glowColor: "rgba(54,139,148,0.8)" },
    { id: 3, swara: "Pa", name: "Panchama Pillar", freq: 392.0, color: "#e5b56a", glowColor: "rgba(229,181,106,0.8)" },
    { id: 4, swara: "Dha", name: "Dhaivata Pillar", freq: 440.0, color: "#a89985", glowColor: "rgba(168,153,133,0.8)" },
  ];

  // 3 Progressive Melodic Sequences
  const sequences = [
    [0, 2, 3],          // Phase 1: Sa - Ga - Pa (3 notes)
    [0, 1, 3, 4],       // Phase 2: Sa - Re - Pa - Dha (4 notes)
    [2, 1, 0, 3, 4],    // Phase 3: Ga - Re - Sa - Pa - Dha (5 notes)
  ];

  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activePillarGlow, setActivePillarGlow] = useState<number | null>(null);
  const [isAiPlaying, setIsAiPlaying] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(alreadyFoundFragment);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Listen closely as the temple musician strikes the resonant granite pillars, then reproduce the acoustic melody."
  );

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API on client
  const playPillarTone = (freq: number) => {
    try {
      if (typeof window === "undefined") return;
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Warm bell-like acoustic chime synthesis
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch {
      // Audio fallback silent
    }
  };

  // Play Sequence Demonstration
  const playDemonstration = useCallback((phaseIdx: number) => {
    setIsAiPlaying(true);
    setPlayerSequence([]);
    setStatusMessage("Maestoso Raghavendra strikes the musical pillars in harmony...");

    const seq = sequences[phaseIdx];
    let step = 0;

    const interval = setInterval(() => {
      if (step < seq.length) {
        const pillarId = seq[step];
        const pillar = pillars[pillarId];
        setActivePillarGlow(pillarId);
        playPillarTone(pillar.freq);

        setTimeout(() => {
          setActivePillarGlow(null);
        }, 400);

        step++;
      } else {
        clearInterval(interval);
        setIsAiPlaying(false);
        setStatusMessage("Now your turn! Strike the pillars in the exact acoustic order.");
      }
    }, 700);
  }, [sequences, pillars]);

  useEffect(() => {
    if (isOpen && !isCompleted) {
      const timer = setTimeout(() => {
        playDemonstration(currentPhase);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentPhase, isCompleted, playDemonstration]);

  if (!isOpen) return null;

  const handlePillarClick = (pillarId: number) => {
    if (isAiPlaying || isCompleted) return;

    const pillar = pillars[pillarId];
    playPillarTone(pillar.freq);
    setActivePillarGlow(pillarId);
    setTimeout(() => setActivePillarGlow(null), 300);

    const nextSeq = [...playerSequence, pillarId];
    setPlayerSequence(nextSeq);

    const targetSeq = sequences[currentPhase];
    const currentIndex = nextSeq.length - 1;

    // Check if correct note
    if (nextSeq[currentIndex] !== targetSeq[currentIndex]) {
      // Wrong note
      setStatusMessage("The granite tone diverged from harmony. Listen once more!");
      setTimeout(() => {
        playDemonstration(currentPhase);
      }, 1000);
      return;
    }

    // Check if phase finished
    if (nextSeq.length === targetSeq.length) {
      if (currentPhase + 1 < sequences.length) {
        setStatusMessage(`✦ Harmonic Phrase ${currentPhase + 1} mastered! Preparing next sacred swara...`);
        setTimeout(() => {
          setCurrentPhase((prev) => prev + 1);
        }, 1200);
      } else {
        // All 3 Phases Complete!
        setIsCompleted(true);
        onDiscoverFragment();
        setStatusMessage(
          "✦ Magnificence! The 56 pillars resonate in perfect symphony, unsealing a hidden niche in the central mandapa!"
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Musical Pillars Mandapa Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#5a4d3f] p-6 shadow-[0_0_50px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3d3328] border border-[#d4a359] flex items-center justify-center text-2xl shadow-inner">
              🎶
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.2em]">
                Vittala Temple Ranga Mandapa • Acoustic Harmony
              </div>
              <h2 className="text-xl font-serif font-bold text-[#f6ede0]">
                Resonant Musical Pillars of Hampi
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#a89985] hover:text-[#f6ede0] text-sm bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Narrative Guidance */}
        <div className="p-3.5 rounded-xl bg-[#26201b] border border-[#473d32] text-xs font-serif leading-relaxed text-[#eedfc8] mb-5 flex items-start gap-3">
          <span className="text-2xl mt-0.5">🪘</span>
          <p className="flex-1 italic">{statusMessage}</p>
        </div>

        {/* Progress Gauge */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#171412] rounded-xl border border-[#383027] mb-5">
          <div className="text-xs font-serif font-bold text-[#d4a359]">
            Melodic Phrasing Progress:
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                  isCompleted || idx < currentPhase
                    ? "bg-[#3d3328] border-[#d4a359] text-[#d4a359]"
                    : idx === currentPhase
                    ? "bg-[#25201b] border-[#e5b56a] text-[#f6ede0] animate-pulse"
                    : "bg-[#1c1815] border-[#2e261f] text-[#6b6053]"
                }`}
              >
                Phase {idx + 1} {isCompleted || idx < currentPhase ? "✓" : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Resonant Musical Pillars Display */}
        <div className="grid grid-cols-5 gap-3 p-6 bg-[#171412] rounded-xl border border-[#383027] mb-5 min-h-[220px] items-end justify-center">
          {pillars.map((pillar) => {
            const isGlowing = activePillarGlow === pillar.id;

            return (
              <button
                key={pillar.id}
                onClick={() => handlePillarClick(pillar.id)}
                disabled={isAiPlaying || isCompleted}
                style={{
                  boxShadow: isGlowing ? `0 0 30px ${pillar.glowColor}` : undefined,
                  borderColor: isGlowing ? pillar.color : "#473d32",
                }}
                className={`flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer h-44 ${
                  isGlowing
                    ? "bg-[#3d3328] -translate-y-2 scale-105"
                    : "bg-gradient-to-t from-[#1e1b18] to-[#2b2520] hover:from-[#2a241f] hover:to-[#383027] active:translate-y-0.5"
                } ${isAiPlaying ? "cursor-not-allowed" : ""}`}
              >
                {/* Pillar Header Fluting */}
                <div className="w-full flex justify-center pt-1 border-b border-[#383027]">
                  <span className="text-xs font-mono text-[#a89985]">🏛️</span>
                </div>

                {/* Pillar Central Shaft & Swara Letter */}
                <div className="flex flex-col items-center">
                  <div
                    className="text-2xl md:text-3xl font-serif font-bold transition-colors"
                    style={{ color: isGlowing ? pillar.color : "#d6c7b2" }}
                  >
                    {pillar.swara}
                  </div>
                  <div className="text-[9px] font-mono text-[#8c7e6d] mt-1">
                    {pillar.freq.toFixed(0)} Hz
                  </div>
                </div>

                {/* Pillar Base */}
                <div className="w-full text-center py-1 bg-[#141210]/60 rounded-lg border border-[#383027]">
                  <span className="text-[9px] font-serif font-bold text-[#eedfc8] block truncate">
                    {pillar.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Second Ledger Fragment Unlocked Panel */}
        {isCompleted && (
          <div className="p-4 rounded-xl bg-[#2e261f] border-2 border-[#d4a359] mb-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📜</span>
              <div className="flex-1">
                <div className="text-xs font-mono text-[#d4a359] uppercase tracking-wider">
                  Discovery Unsealed
                </div>
                <h3 className="text-sm font-serif font-bold text-[#f6ede0]">
                  Second Ledger Fragment: The Guild Account Notebook (2/3)
                </h3>
                <p className="text-xs font-serif text-[#d6c7b2] mt-1">
                  &ldquo;...The treasury endowments are safeguarded in three trusts. The final seal was moved to the high ceremonial terrace of Mahanavami Dibba...&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#383027]">
          {!isCompleted ? (
            <button
              onClick={() => playDemonstration(currentPhase)}
              disabled={isAiPlaying}
              className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#d4a359] text-xs font-serif px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              🔊 Replay Swara Harmony
            </button>
          ) : (
            <div className="text-xs font-mono text-[#d4a359]">
              ✦ Resonant Acoustic Harmony Completed
            </div>
          )}

          <button
            onClick={onClose}
            className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif px-6 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            {isCompleted ? "Accept Discovery & Return" : "Exit Pillars"}
          </button>
        </div>

      </div>
    </div>
  );
}
