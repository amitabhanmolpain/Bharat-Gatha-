"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { soundFx } from "../../../../services/soundService";
import { recordGameWinToDatabase } from "../../../../services/gameProgressService";
import {
  CarvingHotspotDef,
  CARVING_HOTSPOTS,
  TARGET_HUNT_SEQUENCE,
  CANONICAL_SOLUTION_SEQUENCE,
  CANONICAL_JOLLY_INTRO,
  CANONICAL_JOLLY_ALL_FOUND,
} from "../data/vijayStambhData";
import VijayStambhGlyphArt from "./VijayStambhGlyphArt";

interface VijayStambhCarvingSystemProps {
  playerPos: { x: number; y: number };
  onTriggerJollySpeech: (text: string, badge?: "normal" | "glowing" | "shaking" | "doubt") => void;
  onPuzzleSolved?: () => void;
  onExitInterior?: () => void;
}

export default function VijayStambhCarvingSystem({
  playerPos,
  onTriggerJollySpeech,
  onPuzzleSolved,
  onExitInterior,
}: VijayStambhCarvingSystemProps) {
  // Discovered Glyphs state (loaded from LocalStorage for offline persistence)
  const [discoveredGlyphIds, setDiscoveredGlyphIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sculptors_testament_discovered_glyphs");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Shilpa Drishti modal state
  const [isShilpaDrishtiActive, setIsShilpaDrishtiActive] = useState(false);
  const [activeGlyph, setActiveGlyph] = useState<CarvingHotspotDef | null>(null);
  const [revealingGlyphId, setRevealingGlyphId] = useState<string | null>(null);

  // Journal & Final Puzzle state
  const [showJournal, setShowJournal] = useState(false);
  const [showFinalPuzzle, setShowFinalPuzzle] = useState(false);
  const [placedSlots, setPlacedSlots] = useState<(CarvingHotspotDef | null)[]>(
    Array(9).fill(null)
  );
  const [availableGlyphs, setAvailableGlyphs] = useState<CarvingHotspotDef[]>([]);
  const [puzzleFeedback, setPuzzleFeedback] = useState<string | null>(null);
  const [isPuzzleSolvedState, setIsPuzzleSolvedState] = useState(false);

  // Determine current target glyph in the sequential hunt
  const currentTargetId = useMemo(() => {
    for (const id of TARGET_HUNT_SEQUENCE) {
      if (!discoveredGlyphIds.includes(id)) {
        return id;
      }
    }
    return null; // All 9 discovered
  }, [discoveredGlyphIds]);

  const currentTargetDef = useMemo(() => {
    if (!currentTargetId) return null;
    return CARVING_HOTSPOTS.find((h) => h.glyphId === currentTargetId) || null;
  }, [currentTargetId]);

  // Check proximity STRICTLY to the CURRENT TARGET GLYPH only (Anti-Brute-Force)
  const isNearTargetGlyph = useMemo(() => {
    if (!currentTargetDef) return false;
    if (isShilpaDrishtiActive || showFinalPuzzle || showJournal) return false;

    const dx = playerPos.x - currentTargetDef.playerX;
    const dy = playerPos.y - currentTargetDef.playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= currentTargetDef.radius;
  }, [playerPos, currentTargetDef, isShilpaDrishtiActive, showFinalPuzzle, showJournal]);

  // Persist discovered glyphs
  const saveDiscoveredGlyphs = (ids: string[]) => {
    setDiscoveredGlyphIds(ids);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sculptors_testament_discovered_glyphs", JSON.stringify(ids));
      } catch (e) {}
    }
  };

  // Inspect & Discover Handler (Activates Shilpa Drishti)
  const handleInspectTarget = useCallback(() => {
    if (!currentTargetDef) return;
    if (discoveredGlyphIds.includes(currentTargetDef.glyphId)) return;

    soundFx.playClueChime();
    setRevealingGlyphId(currentTargetDef.glyphId);
    setActiveGlyph(currentTargetDef);
    setIsShilpaDrishtiActive(true);

    const updated = [...discoveredGlyphIds, currentTargetDef.glyphId];
    saveDiscoveredGlyphs(updated);

    if (updated.length === 9) {
      onTriggerJollySpeech(CANONICAL_JOLLY_ALL_FOUND, "glowing");
    } else {
      onTriggerJollySpeech(
        `Shilpa Drishti revealed the ${currentTargetDef.name}! ${updated.length} of 9 discovered.`,
        "normal"
      );
    }

    setTimeout(() => {
      setRevealingGlyphId(null);
    }, 1200);
  }, [currentTargetDef, discoveredGlyphIds, onTriggerJollySpeech]);

  // Keyboard handler for E key (Authoritative inside Vijay Stambh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        if (isNearTargetGlyph && !isShilpaDrishtiActive && !showFinalPuzzle && !showJournal) {
          e.preventDefault();
          e.stopPropagation();
          handleInspectTarget();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNearTargetGlyph, isShilpaDrishtiActive, showFinalPuzzle, showJournal, handleInspectTarget]);

  // Setup Final Puzzle available pieces when modal opens
  useEffect(() => {
    if (showFinalPuzzle) {
      const discoveredHotspots = CARVING_HOTSPOTS.filter((h) =>
        discoveredGlyphIds.includes(h.glyphId)
      );
      setAvailableGlyphs(discoveredHotspots);
      setPlacedSlots(Array(9).fill(null));
      setPuzzleFeedback(null);
    }
  }, [showFinalPuzzle, discoveredGlyphIds]);

  // Slot placement logic for final puzzle
  const handlePlaceGlyphInSlot = (glyph: CarvingHotspotDef, slotIndex: number) => {
    if (isPuzzleSolvedState) return;
    soundFx.playSelect();

    setPlacedSlots((prev) => {
      const next = [...prev];
      const existingIdx = next.findIndex((item) => item?.glyphId === glyph.glyphId);
      if (existingIdx !== -1) {
        next[existingIdx] = null;
      }
      next[slotIndex] = glyph;
      return next;
    });

    setAvailableGlyphs((prev) => prev.filter((g) => g.glyphId !== glyph.glyphId));
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    if (isPuzzleSolvedState) return;
    const item = placedSlots[slotIndex];
    if (!item) return;

    soundFx.playTileSwap();
    setPlacedSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setAvailableGlyphs((prev) => [...prev, item]);
  };

  const handleVerifyFinalSequence = async () => {
    const isFull = placedSlots.every((s) => s !== null);
    if (!isFull) {
      soundFx.playClose();
      setPuzzleFeedback("Place all nine discovered glyphs into the inscription slots.");
      return;
    }

    const currentSeq = placedSlots.map((s) => s!.glyphId);
    const isCorrect = currentSeq.every(
      (val, idx) => val === CANONICAL_SOLUTION_SEQUENCE[idx]
    );

    if (isCorrect) {
      soundFx.playClueFound();
      setIsPuzzleSolvedState(true);
      setPuzzleFeedback("✨ Sculptor's Inscription Deciphered! Mewar's heritage lives forever.");
      onTriggerJollySpeech(
        "Wah mere aaka! The true testament of Sutradhara Jaita has been revealed!",
        "glowing"
      );

      await recordGameWinToDatabase({
        era: "rajputana",
        gameType: "vijay_stambh_carvings",
        prizeUnlocked: "architect_inscription_seal",
        score: 1000,
        metadata: {
          discoveredCount: 9,
          solvedOrder: currentSeq,
        },
      });

      onPuzzleSolved?.();
    } else {
      soundFx.playClose();
      setPuzzleFeedback("The harmony of the testament is broken. Review the architectural clues!");
      onTriggerJollySpeech(
        "Something feels out of place, mere aaka. Match the bedrock to the sky.",
        "doubt"
      );
    }
  };

  return (
    <>
      {/* --- TOP HUD: TARGET GLYPH SEARCH OBJECTIVE --- */}
      <div className="fixed top-20 left-6 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="bg-[#fff9ea] border-2 border-black rounded-xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-80 pointer-events-auto">
          <div className="flex items-center justify-between mb-1.5 border-b border-amber-900/30 pb-1">
            <span className="text-[10px] font-black text-amber-950 uppercase tracking-widest flex items-center gap-1.5">
              <span>🏛️</span>
              <span>THE SCULPTOR&apos;S TESTAMENT</span>
            </span>
            <span className="text-[11px] font-black bg-amber-400 text-amber-950 border border-black px-2 py-0.5 rounded shadow-sm font-mono">
              {discoveredGlyphIds.length} / 9 GLYPHS
            </span>
          </div>

          {/* Target Glyph Display or Completed Banner */}
          {currentTargetDef ? (
            <div className="flex items-center gap-3 bg-amber-100/90 border border-amber-800/40 rounded-lg p-2">
              <div className="w-12 h-12 rounded-lg bg-[#2a1d13] border-2 border-amber-600 flex items-center justify-center shadow-inner shrink-0">
                <VijayStambhGlyphArt
                  glyphId={currentTargetDef.glyphId}
                  size={38}
                  mode="target"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider">
                  FIND THIS GLYPH IN THE ROOM:
                </span>
                <span className="text-xs font-mono font-black text-amber-950 tracking-wider">
                  {currentTargetDef.glyphId}
                </span>
                <span className="text-[10px] text-amber-900/80 italic font-serif">
                  Search the sandstone architecture
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 bg-emerald-100 border border-emerald-700 rounded-lg p-2">
              <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1">
                ✓ ALL 9 GLYPHS DISCOVERED!
              </span>
              <button
                onClick={() => setShowFinalPuzzle(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-md border border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                🧩 Assemble Testament
              </button>
            </div>
          )}

          {/* Progress Bar & Journal Button */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-amber-200/60 rounded-full h-2 border border-amber-800/40 overflow-hidden">
              <div
                className="bg-amber-600 h-full transition-all duration-500"
                style={{ width: `${(discoveredGlyphIds.length / 9) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setShowJournal(true)}
              className="bg-[#fff9ea] hover:bg-amber-200 text-amber-950 font-extrabold text-[10px] px-2 py-0.5 rounded border border-black shadow-xs cursor-pointer flex items-center gap-1"
            >
              📖 Journal
            </button>
          </div>
        </div>
      </div>

      {/* --- ALL 9 ENVIRONMENTAL CAMOUFLAGED GLYPHS IN THE ROOM --- */}
      <div className="fixed inset-0 pointer-events-none z-15">
        {CARVING_HOTSPOTS.map((hotspot) => {
          const isDiscovered = discoveredGlyphIds.includes(hotspot.glyphId);
          const isTarget = currentTargetId === hotspot.glyphId;
          const isRevealing = revealingGlyphId === hotspot.glyphId;

          return (
            <div
              key={hotspot.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-auto cursor-pointer"
              style={{
                left: `${hotspot.renderX}%`,
                top: `${hotspot.renderY}%`,
              }}
              onClick={() => {
                if (isTarget && isNearTargetGlyph) {
                  handleInspectTarget();
                }
              }}
              title={
                isDiscovered
                  ? `${hotspot.glyphId} (Discovered)`
                  : isTarget
                  ? `Target: ${hotspot.glyphId} (Approach & Press E to use Shilpa Drishti)`
                  : "Ancient Wall Carving"
              }
            >
              <div
                className={`transition-all duration-500 flex items-center justify-center ${
                  isRevealing
                    ? "scale-150 animate-pulse drop-shadow-[0_0_16px_rgba(251,191,36,1)]"
                    : isDiscovered
                    ? "opacity-40 grayscale-[30%] brightness-90 scale-95"
                    : isTarget && isNearTargetGlyph
                    ? "opacity-95 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    : "opacity-65 hover:opacity-90 transition-opacity"
                }`}
              >
                <VijayStambhGlyphArt
                  glyphId={hotspot.glyphId}
                  size={hotspot.renderSize}
                  mode={
                    isRevealing
                      ? "revealing"
                      : isDiscovered
                      ? "collected"
                      : "camouflaged"
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* --- AUTHORITATIVE PROXIMITY PROMPT (CURRENT TARGET ONLY) --- */}
      {isNearTargetGlyph && currentTargetDef && (
        <div
          className="fixed bottom-[16%] left-1/2 -translate-x-1/2 z-30 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-extrabold text-black flex items-center gap-2 animate-bounce cursor-pointer pointer-events-auto"
          onClick={handleInspectTarget}
        >
          <span className="bg-amber-400 border border-black rounded px-2 py-0.5 text-[11px] font-mono">
            E
          </span>
          <span className="flex items-center gap-1.5">
            <span>👁️</span>
            <span>USE SHILPA DRISHTI</span>
          </span>
        </div>
      )}

      {/* --- SHILPA DRISHTI INSPECTION REVEAL MODAL --- */}
      {isShilpaDrishtiActive && activeGlyph && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative bg-[#fff9ea] border-4 border-amber-900 rounded-2xl max-w-lg w-full p-5 shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col gap-3 text-black">
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <span className="text-xs font-black text-amber-950 uppercase tracking-widest">
                  SHILPA DRISHTI REVEAL
                </span>
              </div>
              <button
                onClick={() => setIsShilpaDrishtiActive(false)}
                className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-xs border border-black shadow flex items-center justify-center hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chiseled Lens Window */}
            <div className="relative w-full h-44 bg-[#20150d] rounded-xl border-2 border-amber-800/80 overflow-hidden flex flex-col items-center justify-center shadow-inner p-3">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.15)_0%,_transparent_70%)]" />
              <VijayStambhGlyphArt
                glyphId={activeGlyph.glyphId}
                size={64}
                mode="target"
                className="drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse"
              />
              <span className="text-amber-300 font-mono font-black text-lg tracking-widest uppercase mt-2">
                {activeGlyph.glyphId}
              </span>
              <span className="text-amber-200/80 text-[11px] font-bold text-center">
                {activeGlyph.featureName}
              </span>
            </div>

            {/* Contextual Carved Clue */}
            <div className="bg-[#fff3d4] border-2 border-amber-800/40 rounded-xl p-3 shadow-xs">
              <div className="text-[10px] font-black text-amber-900 uppercase tracking-wider mb-1">
                ANCIENT ARCHITECTURAL VERSE
              </div>
              <p className="text-xs font-serif italic font-bold text-amber-950 leading-relaxed">
                &ldquo;{activeGlyph.clue}&rdquo;
              </p>
            </div>

            {/* Lore Note */}
            <div className="bg-amber-100/70 rounded-lg p-2 border border-amber-700/30 text-[10px] text-amber-900 leading-tight">
              <span className="font-bold">Historical Fact: </span>
              {activeGlyph.historicalContext}
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={() => setIsShilpaDrishtiActive(false)}
                className="bg-amber-500 hover:bg-amber-400 text-black border-2 border-black font-black text-xs px-5 py-2 rounded-xl shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                Collect Glyph & Continue Hunt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SCULPTOR'S TESTAMENT JOURNAL MODAL --- */}
      {showJournal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-[#fff9ea] border-4 border-amber-900 rounded-2xl max-w-2xl w-full max-h-[85vh] p-5 shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col gap-3 text-black overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <div>
                <h2 className="text-base font-black text-amber-950 uppercase tracking-wide">
                  📖 SCULPTOR&apos;S TESTAMENT JOURNAL
                </h2>
                <div className="text-xs font-bold text-amber-800 font-mono">
                  {discoveredGlyphIds.length} of 9 Ancient Carvings Discovered
                </div>
              </div>
              <button
                onClick={() => setShowJournal(false)}
                className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-xs border border-black shadow flex items-center justify-center hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Discovered Clues Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {CARVING_HOTSPOTS.map((spot) => {
                const isDiscovered = discoveredGlyphIds.includes(spot.glyphId);
                return (
                  <div
                    key={spot.id}
                    className={`border-2 rounded-xl p-3 flex gap-3 transition-all ${
                      isDiscovered
                        ? "bg-[#fff5d6] border-amber-800/70 shadow-sm"
                        : "bg-amber-900/10 border-amber-900/20 opacity-50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#26190e] border border-amber-700 flex items-center justify-center shrink-0">
                      {isDiscovered ? (
                        <VijayStambhGlyphArt
                          glyphId={spot.glyphId}
                          size={32}
                          mode="target"
                        />
                      ) : (
                        <span className="text-amber-700/50 font-mono text-xs">?</span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-amber-950">
                          {isDiscovered ? spot.glyphId : "Undiscovered"}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                            isDiscovered
                              ? "bg-amber-400 text-black border-black"
                              : "bg-gray-300 text-gray-700 border-gray-400"
                          }`}
                        >
                          {isDiscovered ? "DISCOVERED" : "LOCKED"}
                        </span>
                      </div>
                      {isDiscovered ? (
                        <p className="text-[11px] font-serif italic text-amber-950 mt-1 leading-snug">
                          &ldquo;{spot.clue}&rdquo;
                        </p>
                      ) : (
                        <span className="text-[10px] text-amber-900/60 italic mt-1">
                          Search the Vijay Stambh architecture.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-1 border-t border-amber-800/20">
              <button
                onClick={() => setShowJournal(false)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl border-2 border-black cursor-pointer"
              >
                Close Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FINAL SCULPTOR'S TESTAMENT ASSEMBLY PUZZLE MODAL --- */}
      {showFinalPuzzle && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="relative bg-[#fff9ea] border-4 border-amber-950 rounded-3xl max-w-3xl w-full max-h-[90vh] p-6 shadow-[14px_14px_0_0_rgba(0,0,0,1)] flex flex-col gap-4 text-black overflow-hidden">
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/40 pb-3">
              <div>
                <h2 className="text-lg font-black text-amber-950 uppercase tracking-widest flex items-center gap-2">
                  <span>🏛️</span>
                  <span>THE SCULPTOR&apos;S TESTAMENT — INSCRIPTION BOARD</span>
                </h2>
                <span className="text-xs font-serif text-amber-900 font-semibold italic">
                  Order the 9 glyphs from Bedrock (Bhoomi) to the Celestial Sky (Akasha).
                </span>
              </div>
              <button
                onClick={() => setShowFinalPuzzle(false)}
                className="w-8 h-8 rounded-full bg-red-600 text-white font-black border border-black shadow flex items-center justify-center hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 9 Inscription Sequence Slots */}
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {placedSlots.map((slot, index) => (
                <div
                  key={index}
                  onClick={() => slot && handleRemoveFromSlot(index)}
                  className={`h-24 rounded-xl border-2 flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer ${
                    slot
                      ? "bg-amber-100 border-amber-800 shadow-sm hover:border-red-600"
                      : "bg-[#25170d]/10 border-dashed border-amber-900/40 hover:bg-amber-100/50"
                  }`}
                >
                  <span className="text-[10px] font-black text-amber-900 font-mono">
                    #{index + 1}
                  </span>
                  {slot ? (
                    <>
                      <VijayStambhGlyphArt glyphId={slot.glyphId} size={36} mode="target" />
                      <span className="text-[9px] font-mono font-black text-amber-950 truncate max-w-full">
                        {slot.glyphId}
                      </span>
                    </>
                  ) : (
                    <span className="text-[9px] text-amber-900/40 font-mono my-auto">
                      Empty
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Available Glyphs Tray */}
            <div className="bg-[#24170d]/15 border-2 border-amber-900/40 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider">
                AVAILABLE GLYPH PIECES (Click to place in next empty slot):
              </span>
              <div className="flex flex-wrap gap-2 min-h-[50px]">
                {availableGlyphs.length === 0 && !isPuzzleSolvedState ? (
                  <span className="text-xs text-amber-900/60 font-mono italic my-auto">
                    All glyphs placed. Press Verify Inscription below!
                  </span>
                ) : (
                  availableGlyphs.map((glyph) => (
                    <button
                      key={glyph.id}
                      onClick={() => {
                        const emptyIdx = placedSlots.findIndex((s) => s === null);
                        if (emptyIdx !== -1) {
                          handlePlaceGlyphInSlot(glyph, emptyIdx);
                        }
                      }}
                      className="bg-[#fff9ea] hover:bg-amber-200 border-2 border-black rounded-xl p-2 flex items-center gap-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <VijayStambhGlyphArt glyphId={glyph.glyphId} size={28} mode="target" />
                      <span className="text-xs font-mono font-black text-amber-950">
                        {glyph.glyphId}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Feedback & Actions */}
            {puzzleFeedback && (
              <div
                className={`p-2.5 rounded-xl border-2 font-bold text-xs text-center ${
                  isPuzzleSolvedState
                    ? "bg-emerald-100 text-emerald-950 border-emerald-700"
                    : "bg-amber-100 text-amber-950 border-amber-800"
                }`}
              >
                {puzzleFeedback}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-amber-800/20 pt-2">
              <button
                onClick={() => {
                  setPlacedSlots(Array(9).fill(null));
                  setAvailableGlyphs(CARVING_HOTSPOTS);
                  setPuzzleFeedback(null);
                }}
                className="text-amber-900 font-bold text-xs hover:underline cursor-pointer"
                disabled={isPuzzleSolvedState}
              >
                Reset Slots
              </button>

              <div className="flex items-center gap-3">
                {!isPuzzleSolvedState ? (
                  <button
                    onClick={handleVerifyFinalSequence}
                    className="bg-amber-500 hover:bg-amber-400 text-black border-2 border-black font-black text-xs px-6 py-2.5 rounded-xl shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer"
                  >
                    Verify Inscription
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowFinalPuzzle(false);
                      onExitInterior?.();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-black font-black text-xs px-6 py-2.5 rounded-xl shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer"
                  >
                    Complete Stage & Exit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
