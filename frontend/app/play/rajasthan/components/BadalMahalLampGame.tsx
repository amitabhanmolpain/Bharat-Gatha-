"use client";

import React, { useState, useEffect, useCallback } from "react";
import { soundFx } from "../../../../services/soundService";
import { recordGameWinToDatabase } from "../../../../services/gameProgressService";
import {
  LampDef,
  BADAL_MAHAL_LAMPS,
  CANONICAL_BADAL_MAHAL_INTRO,
} from "../data/badalMahalData";

interface BadalMahalLampGameProps {
  playerPos: { x: number; y: number };
  onTriggerJollySpeech: (text: string, badge?: "normal" | "glowing" | "shaking" | "doubt") => void;
  onGameComplete?: () => void;
}

export default function BadalMahalLampGame({
  playerPos,
  onTriggerJollySpeech,
  onGameComplete,
}: BadalMahalLampGameProps) {
  // Lit lamps state persisted in LocalStorage
  const [litLampIds, setLitLampIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("badal_mahal_lit_lamps");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [nearbyUnlitLamp, setNearbyUnlitLamp] = useState<LampDef | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(() => litLampIds.length === 3);

  // Proximity detection for unlit lamps
  useEffect(() => {
    let found: LampDef | null = null;
    for (const lamp of BADAL_MAHAL_LAMPS) {
      // Skip if already lit
      if (litLampIds.includes(lamp.id)) {
        continue;
      }
      const dx = playerPos.x - lamp.x;
      const dy = playerPos.y - lamp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= lamp.radius) {
        found = lamp;
        break;
      }
    }
    setNearbyUnlitLamp(found);
  }, [playerPos, litLampIds]);

  // Persist lit lamps helper
  const saveLitLamps = (ids: string[]) => {
    setLitLampIds(ids);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("badal_mahal_lit_lamps", JSON.stringify(ids));
      } catch (e) {}
    }
  };

  // Handler for lighting a lamp
  const handleLightLamp = useCallback(
    async (lamp: LampDef) => {
      if (litLampIds.includes(lamp.id)) return;

      soundFx.playClueChime();
      const nextLit = [...litLampIds, lamp.id];
      saveLitLamps(nextLit);

      if (nextLit.length === 1) {
        onTriggerJollySpeech("One flame restored!", "normal");
      } else if (nextLit.length === 2) {
        onTriggerJollySpeech("Two to go, mere aaka!", "normal");
      } else if (nextLit.length === 3) {
        setIsCompleted(true);
        soundFx.playClueFound();
        onTriggerJollySpeech("Wah, mere aaka! Badal Mahal shines again!", "glowing");

        // Record victory in game progress service
        await recordGameWinToDatabase({
          era: "rajputana",
          gameType: "badal_mahal_lamps",
          prizeUnlocked: "badal_mahal_light_master",
          score: 500,
          metadata: {
            litLampsCount: 3,
          },
        });

        onGameComplete?.();
      }
    },
    [litLampIds, onTriggerJollySpeech, onGameComplete]
  );

  // Keyboard listener for E key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        if (nearbyUnlitLamp) {
          e.preventDefault();
          e.stopPropagation();
          handleLightLamp(nearbyUnlitLamp);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nearbyUnlitLamp, handleLightLamp]);

  return (
    <>
      {/* --- HUD OBJECTIVE CAPSULE --- */}
      <div className="fixed top-24 left-6 z-20 flex flex-col gap-2">
        <div className="bg-[#fff9ea] border-2 border-black rounded-xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-72">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
              BADAL MAHAL — LIGHT THE LAMPS
            </span>
            <span
              className={`text-[11px] font-black border px-2 py-0.5 rounded shadow-sm ${
                isCompleted
                  ? "bg-emerald-400 text-emerald-950 border-emerald-700"
                  : "bg-amber-400 text-amber-950 border-black"
              }`}
            >
              {isCompleted ? "✓ 3 / 3 RESTORED" : `🪔 ${litLampIds.length} / 3 LAMPS`}
            </span>
          </div>

          <div className="w-full bg-amber-200/60 rounded-full h-2 border border-amber-800/40 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isCompleted ? "bg-emerald-600" : "bg-amber-600"
              }`}
              style={{ width: `${(litLampIds.length / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* --- VISUAL LAMP FLAME INDICATORS OVERLAY --- */}
      <div className="fixed inset-0 pointer-events-none z-15">
        {BADAL_MAHAL_LAMPS.map((lamp) => {
          const isLit = litLampIds.includes(lamp.id);
          return (
            <div
              key={lamp.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              style={{ left: `${lamp.x}%`, top: `${lamp.y}%` }}
            >
              {isLit ? (
                /* Lit Diya Flame Effect */
                <div className="flex flex-col items-center animate-pulse">
                  <div className="w-5 h-5 rounded-full bg-amber-400/80 shadow-[0_0_16px_rgba(251,191,36,0.95)] border border-amber-300 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping opacity-75" />
                  </div>
                </div>
              ) : (
                /* Unlit Diya Bracket Indicator */
                <div className="w-4 h-4 rounded-full border border-amber-800/50 bg-amber-950/20 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-700/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- PROXIMITY INTERACTION PROMPT FOR UNLIT LAMP --- */}
      {nearbyUnlitLamp && (
        <div
          className="fixed bottom-[16%] left-1/2 -translate-x-1/2 z-30 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-extrabold text-black flex items-center gap-2 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => handleLightLamp(nearbyUnlitLamp)}
        >
          <span className="bg-amber-400 border border-black rounded px-2 py-0.5 text-[11px]">
            E
          </span>
          <span>[E] LIGHT LAMP ({nearbyUnlitLamp.name})</span>
        </div>
      )}
    </>
  );
}
