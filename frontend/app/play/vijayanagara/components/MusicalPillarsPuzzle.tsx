"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AccessibleModal from "./AccessibleModal";
import GameIcon from "./GameIcon";
import { soundFx } from "../../../../services/soundService";
import { playNarration, stopAllCharacterVoice } from "../../../../services/narratorService";

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

// 5 Resonant Classical Swara Pillars (Static outside component)
const SWARA_PILLARS: SwaraPillar[] = [
  { id: 0, swara: "Sa", name: "Shadja Pillar", freq: 261.63, color: "#d4a359", glowColor: "rgba(212,163,89,0.8)" },
  { id: 1, swara: "Re", name: "Rishabha Pillar", freq: 293.66, color: "#c86446", glowColor: "rgba(200,100,70,0.8)" },
  { id: 2, swara: "Ga", name: "Gandhara Pillar", freq: 329.63, color: "#368b94", glowColor: "rgba(54,139,148,0.8)" },
  { id: 3, swara: "Pa", name: "Panchama Pillar", freq: 392.0, color: "#e5b56a", glowColor: "rgba(229,181,106,0.8)" },
  { id: 4, swara: "Dha", name: "Dhaivata Pillar", freq: 440.0, color: "#a89985", glowColor: "rgba(168,153,133,0.8)" },
];

// 3 Progressive Melodic Sequences (Static outside component)
const MELODIC_SEQUENCES: number[][] = [
  [0, 2, 3],          // Phase 1: Sa - Ga - Pa (3 notes)
  [0, 1, 3, 4],       // Phase 2: Sa - Re - Pa - Dha (4 notes)
  [2, 1, 0, 3, 4],    // Phase 3: Ga - Re - Sa - Pa - Dha (5 notes)
];

export default function MusicalPillarsPuzzle({
  isOpen,
  onClose,
  alreadyFoundFragment,
  onDiscoverFragment,
}: MusicalPillarsPuzzleProps) {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activePillarGlow, setActivePillarGlow] = useState<number | null>(null);
  const [isAiPlaying, setIsAiPlaying] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(alreadyFoundFragment);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Listen closely as the temple musician strikes the resonant granite pillars, then reproduce the acoustic melody."
  );

  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const glowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current);
      demoTimeoutRef.current = null;
    }
    if (glowTimeoutRef.current) {
      clearTimeout(glowTimeoutRef.current);
      glowTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setActivePillarGlow(null);
  }, []);

  const playPillarTone = useCallback((freq: number) => {
    soundFx.playStonePillar(freq);
  }, []);

  // Play Sequence Demonstration
  const playDemonstration = useCallback((phaseIdx: number) => {
    clearAllTimers();
    setIsAiPlaying(true);
    setPlayerSequence([]);
    setStatusMessage("Maestoso Raghavendra strikes the musical pillars in harmony...");

    const seq = MELODIC_SEQUENCES[phaseIdx];
    let step = 0;

    demoIntervalRef.current = setInterval(() => {
      if (step < seq.length) {
        const pillarId = seq[step];
        const pillar = SWARA_PILLARS[pillarId];
        setActivePillarGlow(pillarId);
        playPillarTone(pillar.freq);

        if (glowTimeoutRef.current) {
          clearTimeout(glowTimeoutRef.current);
        }
        glowTimeoutRef.current = setTimeout(() => {
          setActivePillarGlow(null);
          glowTimeoutRef.current = null;
        }, 400);

        step++;
      } else {
        if (demoIntervalRef.current) {
          clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
        }
        setIsAiPlaying(false);
        setStatusMessage("Now your turn! Strike the pillars in the exact acoustic order.");
      }
    }, 700);
  }, [clearAllTimers, playPillarTone]);

  useEffect(() => {
    if (isOpen && !isCompleted) {
      clearAllTimers();
      
      // Stop any other active voice
      stopAllCharacterVoice();
      // Only narration to guide the player initially
      playNarration("Listen carefully to the resonance of each pillar. Strike them in the correct order.");
    } else if (!isOpen) {
      clearAllTimers();
      setIsAiPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
      stopAllCharacterVoice(); // cleanup when unmounting/closing
    };
  }, [clearAllTimers]);

  const handlePillarClick = (pillarId: number) => {
    if (isAiPlaying || isCompleted) return;

    const pillar = SWARA_PILLARS[pillarId];
    playPillarTone(pillar.freq);
    setActivePillarGlow(pillarId);

    if (glowTimeoutRef.current) {
      clearTimeout(glowTimeoutRef.current);
    }
    glowTimeoutRef.current = setTimeout(() => {
      setActivePillarGlow(null);
      glowTimeoutRef.current = null;
    }, 300);

    const nextSeq = [...playerSequence, pillarId];
    setPlayerSequence(nextSeq);

    const targetSeq = MELODIC_SEQUENCES[currentPhase];
    const currentIndex = nextSeq.length - 1;

    // Check correctness of current note
    if (nextSeq[currentIndex] !== targetSeq[currentIndex]) {
      // Wrong note: reset sequence for current phase
      setStatusMessage(`Incorrect harmony! Listen again as Raghavendra plays the melody.`);
      setPlayerSequence([]);
      clearAllTimers();
      retryTimeoutRef.current = setTimeout(() => {
        playDemonstration(currentPhase);
        retryTimeoutRef.current = null;
      }, 1000);
      return;
    }

    // Correct note: Check if phase completed
    if (nextSeq.length === targetSeq.length) {
      if (currentPhase < MELODIC_SEQUENCES.length - 1) {
        // Advance to next phase
        const nextPhaseIdx = currentPhase + 1;
        setCurrentPhase(nextPhaseIdx);
        setPlayerSequence([]);
        setStatusMessage(`✦ Harmonic Resonance achieved! Advancing to Melodic Phase ${nextPhaseIdx + 1}...`);
        clearAllTimers();
        retryTimeoutRef.current = setTimeout(() => {
          playDemonstration(nextPhaseIdx);
          retryTimeoutRef.current = null;
        }, 1200);
      } else {
        // Complete puzzle!
        clearAllTimers();
        setIsCompleted(true);
        setStatusMessage("✦ Masterful harmony! The resonant frequency unseals the central temple stone niche!");
        onDiscoverFragment();
      }
    } else {
      setStatusMessage(`Resonating correctly! (${nextSeq.length}/${targetSeq.length} swaras matched)`);
    }
  };

  const handleCloseModal = () => {
    clearAllTimers();
    setIsAiPlaying(false);
    stopAllCharacterVoice();
    onClose();
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleCloseModal}
      titleId="musical-pillars-title"
      maxWidthClass="max-w-3xl"
      containerClassName="p-6 md:p-8"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#3d3328] border border-[#d4a359] flex items-center justify-center text-[#d4a359] shadow-inner">
            <GameIcon name="music" size={20} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.2em]">
              Ranga Mandapa • Vittala Temple (c. 1540 AD)
            </div>
            <h2 id="musical-pillars-title" className="text-xl md:text-2xl font-serif font-bold text-[#f6ede0]">
              56 Resonant Musical Pillars of Vittala
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCloseModal}
          className="flex items-center gap-1.5 text-[#a89985] hover:text-[#f6ede0] text-sm bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          <GameIcon name="close" size={14} /> Exit
        </button>
      </div>

      {/* Narrative Box */}
      <div className="p-3.5 rounded-xl bg-[#26201b] border border-[#473d32] text-xs font-serif leading-relaxed text-[#eedfc8] mb-5 flex items-start gap-3">
        <GameIcon name="music" size={24} className="text-[#d4a359] mt-0.5" />
        <p className="flex-1 italic">{statusMessage}</p>
      </div>

      {/* Phase Progress Indicators */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#171412] rounded-xl border border-[#383027] mb-6">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#a89985]">
          Acoustic Phase:
        </div>
        <div className="flex gap-2">
          {MELODIC_SEQUENCES.map((_, idx) => (
            <div
              key={idx}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                isCompleted || idx < currentPhase
                  ? "bg-[#286b72] border-[#368b94] text-white"
                  : idx === currentPhase
                  ? "bg-[#3d3328] border-[#d4a359] text-[#f6ede0] animate-pulse"
                  : "bg-[#201c18] border-[#383027] text-[#6b6053]"
              }`}
            >
              Phase {idx + 1} {isCompleted || idx < currentPhase ? "✓" : ""}
            </div>
          ))}
        </div>
      </div>

      {/* 5 Classical Swara Pillars Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {SWARA_PILLARS.map((pillar) => {
          const isGlowing = activePillarGlow === pillar.id;

          return (
            <button
              type="button"
              key={pillar.id}
              onClick={() => handlePillarClick(pillar.id)}
              disabled={isAiPlaying || isCompleted}
              className={`relative p-4 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[160px] select-none ${
                isGlowing
                  ? "scale-[0.98] shadow-inner border-[#e8dccb] bg-[#362e26]" // subtle press in instead of pop out
                  : "bg-[#211c18] border-[#3d3329] hover:border-[#6b5847] hover:bg-[#2c251f]" // stone aesthetic
              } ${isAiPlaying ? "opacity-90" : ""}`}
              style={{
                borderColor: isGlowing ? pillar.color : undefined,
              }}
            >
              {/* Stone Pillar Column Visual */}
              <div
                className="w-10 h-[80px] rounded-sm mb-3 border border-[#473d32] flex flex-col items-center justify-center transition-all overflow-hidden relative shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                style={{
                  background: isGlowing
                    ? `linear-gradient(to right, #362e26 0%, ${pillar.color} 50%, #362e26 100%)`
                    : "linear-gradient(to right, #2b2520 0%, #473d32 30%, #3d3329 70%, #2b2520 100%)",
                }}
              >
                {/* Fluting/Carving indentations on pillar */}
                <div className="absolute inset-y-0 left-[20%] w-[1px] bg-black/40"></div>
                <div className="absolute inset-y-0 left-[50%] w-[1px] bg-black/40"></div>
                <div className="absolute inset-y-0 right-[20%] w-[1px] bg-black/40"></div>
                {/* Horizontal banding at top and bottom */}
                <div className="absolute top-1 inset-x-1 h-[2px] bg-black/30"></div>
                <div className="absolute bottom-1 inset-x-1 h-[2px] bg-black/30"></div>
              </div>

              {/* Swara Name */}
              <div className="text-sm font-serif font-bold text-[#f6ede0]">
                {pillar.swara}
              </div>
              <div className="text-[10px] font-mono text-[#a89985]">
                {pillar.name.split(" ")[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Discovery Reward Banner (when completed) */}
      {isCompleted && (
        <div className="p-4 rounded-xl bg-[#231e1a] border-2 border-[#d4a359] mb-5 animate-fadeIn">
          <div className="flex items-center gap-3">
            <GameIcon name="ledger" size={32} className="text-[#d4a359]" />
            <div>
              <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-wider">
                Unsealed Temple Niche Discovery
              </div>
              <h3 className="text-sm font-serif font-bold text-[#f6ede0]">
                Ledger Fragment II: The Guild Account Notebook (2/3)
              </h3>
              <p className="text-xs font-serif text-[#d6c7b2] italic mt-0.5">
                &ldquo;Merchant Ramayya recorded secret royal endowments inside this stone niche before departing for the royal platform.&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-[#383027]">
        <button
          type="button"
          onClick={() => {
            if (!isAiPlaying && !isCompleted) {
              playDemonstration(currentPhase);
            }
          }}
          disabled={isAiPlaying || isCompleted}
          className="flex items-center gap-1.5 text-xs font-serif text-[#d4a359] hover:text-[#eedfc8] bg-[#231e1a] border border-[#473d32] px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
        >
          <GameIcon name="rotate_cw" size={14} /> Replay Maestoso&apos;s Melody
        </button>

        <button
          type="button"
          onClick={handleCloseModal}
          className="bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          {isCompleted ? "Return to Courtyard ✓" : "Exit Puzzle"}
        </button>
      </div>
    </AccessibleModal>
  );
}
