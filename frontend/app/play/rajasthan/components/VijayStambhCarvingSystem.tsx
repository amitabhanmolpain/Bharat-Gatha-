"use client";

import React, { useState, useEffect, useCallback } from "react";
import { soundFx } from "../../../../services/soundService";
import { recordGameWinToDatabase } from "../../../../services/gameProgressService";
import {
  CarvingHotspotDef,
  CARVING_HOTSPOTS,
  CANONICAL_SOLUTION_SEQUENCE,
  CANONICAL_JOLLY_ALL_FOUND,
  CANONICAL_JOLLY_WRONG_HINT,
} from "../data/vijayStambhData";

interface VijayStambhCarvingSystemProps {
  playerPos: { x: number; y: number };
  onTriggerJollySpeech: (text: string, badge?: "normal" | "glowing" | "shaking" | "doubt") => void;
  onPuzzleSolved: () => void;
  onExitInterior: () => void;
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

  const [activeHotspot, setActiveHotspot] = useState<CarvingHotspotDef | null>(null);
  const [isShilpaDrishtiActive, setIsShilpaDrishtiActive] = useState<boolean>(false);
  const [showJournal, setShowJournal] = useState<boolean>(false);

  // Final Inscription Puzzle state
  const [showFinalPuzzle, setShowFinalPuzzle] = useState<boolean>(false);
  const [placedSlots, setPlacedSlots] = useState<Array<CarvingHotspotDef | null>>(Array(9).fill(null));
  const [availableGlyphs, setAvailableGlyphs] = useState<CarvingHotspotDef[]>([]);
  const [isPuzzleSolvedState, setIsPuzzleSolvedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sculptors_testament_solved") === "true";
    }
    return false;
  });
  const [puzzleFeedback, setPuzzleFeedback] = useState<string | null>(null);
  const [isVictoryAnim, setIsVictoryAnim] = useState<boolean>(false);
  const [showHistoricalCard, setShowHistoricalCard] = useState<boolean>(false);

  // Proximity detection to undiscovered hotspots
  const [nearbyHotspot, setNearbyHotspot] = useState<CarvingHotspotDef | null>(null);

  // Proximity detection to interior exit door
  const isNearInteriorExit =
    playerPos.x >= 38.0 &&
    playerPos.x <= 62.0 &&
    playerPos.y >= 78.0 &&
    playerPos.y <= 84.0;

  useEffect(() => {
    if (isShilpaDrishtiActive || showFinalPuzzle || showJournal) {
      setNearbyHotspot(null);
      return;
    }

    let found: CarvingHotspotDef | null = null;
    for (const spot of CARVING_HOTSPOTS) {
      // Discovered hotspots are permanently non-interactive in the world
      if (discoveredGlyphIds.includes(spot.glyphId)) {
        continue;
      }
      const dx = playerPos.x - spot.x;
      const dy = playerPos.y - spot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= spot.radius) {
        found = spot;
        break;
      }
    }
    setNearbyHotspot(found);
  }, [playerPos, isShilpaDrishtiActive, showFinalPuzzle, showJournal, discoveredGlyphIds]);

  // Persist discovered glyphs
  const saveDiscoveredGlyphs = (ids: string[]) => {
    setDiscoveredGlyphIds(ids);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sculptors_testament_discovered_glyphs", JSON.stringify(ids));
      } catch (e) {}
    }
  };

  // Open Shilpa Drishti Inspection
  const handleOpenShilpaDrishti = useCallback(
    (spot: CarvingHotspotDef) => {
      // Discovered hotspots cannot be inspected again in the world
      if (discoveredGlyphIds.includes(spot.glyphId)) {
        return;
      }
      soundFx.playKeyboardClick();
      setActiveHotspot(spot);
      setIsShilpaDrishtiActive(true);

      const updated = [...discoveredGlyphIds, spot.glyphId];
      saveDiscoveredGlyphs(updated);

      if (updated.length === 9) {
        onTriggerJollySpeech(CANONICAL_JOLLY_ALL_FOUND, "glowing");
      }
    },
    [discoveredGlyphIds, onTriggerJollySpeech]
  );

  // Authoritative Keyboard Shortcut Handler for E & J keys inside Vijay Stambh Interior
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        if (nearbyHotspot && !isShilpaDrishtiActive && !showFinalPuzzle && !showJournal) {
          e.preventDefault();
          e.stopPropagation();
          handleOpenShilpaDrishti(nearbyHotspot);
        } else if (isNearInteriorExit && !isShilpaDrishtiActive && !showFinalPuzzle && !showJournal) {
          e.preventDefault();
          e.stopPropagation();
          onExitInterior();
        }
      } else if (e.key.toLowerCase() === "j") {
        if (!isShilpaDrishtiActive && !showFinalPuzzle) {
          setShowJournal((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    nearbyHotspot,
    isNearInteriorExit,
    isShilpaDrishtiActive,
    showFinalPuzzle,
    showJournal,
    handleOpenShilpaDrishti,
    onExitInterior,
  ]);

  // Initialize Final Puzzle tray
  const handleOpenFinalPuzzle = () => {
    soundFx.playKeyboardClick();
    const discoveredHotspots = CARVING_HOTSPOTS.filter((h) =>
      discoveredGlyphIds.includes(h.glyphId)
    );
    setAvailableGlyphs(discoveredHotspots);
    setPlacedSlots(Array(9).fill(null));
    setPuzzleFeedback(null);
    setShowFinalPuzzle(true);
  };

  const handlePlaceGlyphInSlot = (glyph: CarvingHotspotDef, slotIndex: number) => {
    soundFx.playKeyboardClick();
    setPlacedSlots((prev) => {
      const next = [...prev];
      // If glyph is already in another slot, remove it from there
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
    soundFx.playKeyboardClick();
    const item = placedSlots[slotIndex];
    if (!item) return;

    setPlacedSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });

    setAvailableGlyphs((prev) => [...prev, item]);
  };

  const handleVerifySequence = async () => {
    soundFx.playKeyboardClick();

    // Check if all 9 slots filled
    if (placedSlots.some((s) => s === null)) {
      setPuzzleFeedback("Place all nine discovered glyphs into the inscription slots.");
      return;
    }

    const currentSeq = placedSlots.map((s) => s!.glyphId);
    const isCorrect = currentSeq.every(
      (id, idx) => id === CANONICAL_SOLUTION_SEQUENCE[idx]
    );

    if (isCorrect) {
      setIsVictoryAnim(true);
      setPuzzleFeedback(null);
      soundFx.playClueFound();
      setIsPuzzleSolvedState(true);

      if (typeof window !== "undefined") {
        localStorage.setItem("sculptors_testament_solved", "true");
      }

      // Record victory via gameProgressService
      await recordGameWinToDatabase({
        era: "rajputana",
        gameType: "sculptors_testament",
        prizeUnlocked: "sculptors_testament_master",
        score: 1000,
        metadata: {
          solution: CANONICAL_SOLUTION_SEQUENCE,
          discoveredCount: 9,
        },
      });

      onTriggerJollySpeech(
        "✨ Mere aaka! The hidden Sculptor's Testament shines forth in pure gold! The secret of Chittorgarh's master builders is restored!",
        "glowing"
      );

      setTimeout(() => {
        setIsVictoryAnim(false);
        setShowFinalPuzzle(false);
        setShowHistoricalCard(true);
        onPuzzleSolved();
      }, 2400);
    } else {
      onTriggerJollySpeech(CANONICAL_JOLLY_WRONG_HINT, "shaking");
      setPuzzleFeedback(
        "The inscription does not read naturally. Re-read the clues in your Sculptor's Testament Journal to deduce the true order."
      );
    }
  };

  return (
    <>
      {/* --- HUD PROGRESS CAPSULE (SINGLE-SCREEN PUZZLE STYLE) --- */}
      <div className="fixed top-24 left-6 z-20 flex flex-col gap-2">
        <div className="bg-[#fff9ea] border-2 border-black rounded-xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
              THE SCULPTOR&apos;S TESTAMENT
            </span>
            <span className="text-[11px] font-black bg-amber-400 border border-black px-2 py-0.5 rounded shadow-sm">
              {discoveredGlyphIds.length} / 9 GLYPHS
            </span>
          </div>

          <div className="w-full bg-amber-200/60 rounded-full h-2 border border-amber-800/40 overflow-hidden mb-2">
            <div
              className="bg-amber-600 h-full transition-all duration-500"
              style={{ width: `${(discoveredGlyphIds.length / 9) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                soundFx.playKeyboardClick();
                setShowJournal(true);
              }}
              className="text-[11px] font-bold text-amber-950 underline hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              📖 Open Journal [J]
            </button>

            {discoveredGlyphIds.length === 9 && !isPuzzleSolvedState && (
              <button
                onClick={handleOpenFinalPuzzle}
                className="bg-amber-500 hover:bg-amber-400 text-black border border-black px-2.5 py-1 rounded text-[11px] font-extrabold shadow-[2px_2px_0_0_rgba(0,0,0,1)] animate-bounce cursor-pointer"
              >
                📜 Reconstruct Inscription
              </button>
            )}

            {isPuzzleSolvedState && (
              <span className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1">
                ✓ Solved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- PROXIMITY INTERACTION PROMPTS --- */}
      {nearbyHotspot && !isShilpaDrishtiActive && !showFinalPuzzle && !showJournal && (
        <div
          className="fixed bottom-[16%] left-1/2 -translate-x-1/2 z-30 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-extrabold text-black flex items-center gap-2 animate-bounce cursor-pointer"
          onClick={() => handleOpenShilpaDrishti(nearbyHotspot)}
        >
          <span className="bg-amber-400 border border-black rounded px-2 py-0.5 text-[11px]">
            E
          </span>
          <span>[E] INSPECT WITH SHILPA DRISHTI (शिल्प दृष्टि)</span>
        </div>
      )}

      {!nearbyHotspot && isNearInteriorExit && !isShilpaDrishtiActive && !showFinalPuzzle && !showJournal && (
        <div
          className="fixed bottom-[16%] left-1/2 -translate-x-1/2 z-30 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer"
          onClick={onExitInterior}
        >
          <span className="bg-amber-400 border border-black rounded px-2 py-0.5 text-[11px]">
            E
          </span>
          <span>[E] EXIT TO PLAZA</span>
        </div>
      )}

      {/* --- SHILPA DRISHTI INSPECTION OVERLAY --- */}
      {isShilpaDrishtiActive && activeHotspot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative bg-[#fff9ea] border-4 border-amber-900 rounded-2xl max-w-2xl w-full p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col gap-4 text-black">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-amber-950 font-mono font-bold text-xs px-2.5 py-1 rounded border border-black shadow-sm">
                  SHILPA DRISHTI (शिल्प दृष्टि)
                </span>
                <span className="text-xs font-bold text-amber-800">
                  {activeHotspot.featureName}
                </span>
              </div>
              <button
                onClick={() => setIsShilpaDrishtiActive(false)}
                className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold border border-black shadow flex items-center justify-center hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Lens View Component */}
            <div className="relative w-full h-56 bg-[#2a1d13] rounded-xl border-2 border-amber-900/60 overflow-hidden flex items-center justify-center shadow-inner">
              {/* Subtle Warm Torch Vignette Lens */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.85)_80%)] pointer-events-none" />

              {/* Faint Golden Chisel Marks & SVG Glyph Artwork */}
              <div className="relative flex flex-col items-center gap-2 text-center z-10 p-4 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                  <svg className="w-12 h-12 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                    <path d="M12 6v12M6 12h12" />
                    <path d="M8 8l8 8M8 16l8-8" strokeOpacity="0.5" />
                  </svg>
                </div>
                <div className="text-amber-300 font-mono font-black text-xl tracking-widest uppercase shadow-sm">
                  {activeHotspot.glyphId}
                </div>
                <div className="text-amber-100/90 text-xs italic max-w-md">
                  {activeHotspot.motifDescription}
                </div>
              </div>
            </div>

            {/* Poetic Contextual Clue Card */}
            <div className="bg-[#fff3d4] border-2 border-amber-800/40 rounded-xl p-4 shadow-sm">
              <div className="text-[10px] font-extrabold text-amber-900 uppercase tracking-widest mb-1">
                DISCOVERED CONTEXTUAL CLUE
              </div>
              <div className="text-sm font-serif italic font-bold text-amber-950 leading-relaxed">
                &ldquo;{activeHotspot.clue}&rdquo;
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsShilpaDrishtiActive(false)}
                className="bg-amber-500 hover:bg-amber-400 text-black border-2 border-black font-extrabold text-xs px-5 py-2 rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                Collect Glyph & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SCULPTOR'S TESTAMENT JOURNAL MODAL --- */}
      {showJournal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative bg-[#fff9ea] border-4 border-amber-900 rounded-2xl max-w-3xl w-full max-h-[85vh] p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col gap-4 text-black overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-3">
              <div>
                <h2 className="text-lg font-black text-amber-950 uppercase tracking-wide">
                  SCULPTOR&apos;S TESTAMENT JOURNAL
                </h2>
                <div className="text-xs font-bold text-amber-800">
                  Discovered {discoveredGlyphIds.length} of 9 Ancient Carvings
                </div>
              </div>
              <button
                onClick={() => setShowJournal(false)}
                className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold border border-black shadow flex items-center justify-center hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Discovered Clues Grid */}
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {CARVING_HOTSPOTS.map((spot) => {
                const isDiscovered = discoveredGlyphIds.includes(spot.glyphId);
                return (
                  <div
                    key={spot.id}
                    className={`border-2 rounded-xl p-3 flex flex-col gap-1 transition-all ${
                      isDiscovered
                        ? "bg-[#fff5d6] border-amber-800/60 shadow-sm"
                        : "bg-amber-900/10 border-amber-900/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-amber-950 tracking-wider">
                        {isDiscovered ? spot.glyphId : "?????"}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                          isDiscovered
                            ? "bg-amber-400 text-black border-black"
                            : "bg-gray-300 text-gray-700 border-gray-400"
                        }`}
                      >
                        {isDiscovered ? "DISCOVERED" : "UNDISCOVERED"}
                      </span>
                    </div>

                    {isDiscovered ? (
                      <>
                        <div className="text-[11px] font-bold text-amber-900">
                          {spot.featureName}
                        </div>
                        <div className="text-xs font-serif italic text-amber-950 border-t border-amber-800/20 pt-1.5 mt-1">
                          &ldquo;{spot.clue}&rdquo;
                        </div>
                      </>
                    ) : (
                      <div className="text-xs font-mono text-amber-900/60 italic py-2">
                        Explore Vijay Stambh to inspect this carved feature with Shilpa Drishti.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-amber-800/30 pt-3">
              <span className="text-xs text-amber-900 font-bold">
                Read and compare the discovered clues to deduce the secret sequence.
              </span>
              {discoveredGlyphIds.length === 9 && !isPuzzleSolvedState && (
                <button
                  onClick={() => {
                    setShowJournal(false);
                    handleOpenFinalPuzzle();
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black border-2 border-black font-extrabold text-xs px-4 py-2 rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer"
                >
                  📜 Proceed to Reconstruct Inscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- FINAL INSCRIPTION RECONSTRUCTION PUZZLE OVERLAY --- */}
      {showFinalPuzzle && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative bg-[#fff9ea] border-4 border-amber-900 rounded-2xl max-w-4xl w-full p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col gap-5 text-black">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-3">
              <div>
                <h2 className="text-xl font-black text-amber-950 uppercase tracking-wide">
                  RECONSTRUCT THE SCULPTOR&apos;S TESTAMENT
                </h2>
                <div className="text-xs font-bold text-amber-800">
                  Arrange the 9 discovered glyphs into their true logical sequence.
                </div>
              </div>
              <button
                onClick={() => setShowFinalPuzzle(false)}
                className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold border border-black shadow flex items-center justify-center hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 9 Inscription Slots */}
            <div className="bg-[#fff5d6] border-2 border-amber-900/40 rounded-xl p-4 shadow-inner flex flex-col gap-2">
              <div className="text-[11px] font-black text-amber-900 uppercase tracking-widest text-center mb-1">
                INSCRIPTION SLOTS
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {placedSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    onClick={() => slot && handleRemoveFromSlot(idx)}
                    className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                      slot
                        ? "bg-amber-400 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-amber-300"
                        : "bg-amber-900/10 border-dashed border-amber-800/40 hover:border-amber-700"
                    } ${isVictoryAnim ? "animate-pulse border-emerald-600 bg-emerald-300" : ""}`}
                  >
                    {slot ? (
                      <>
                        <span className="font-mono font-black text-xs text-amber-950 tracking-wider">
                          {slot.glyphId}
                        </span>
                        <span className="text-[9px] text-amber-900/80 font-bold truncate max-w-full">
                          {slot.name.split(" ")[0]}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono font-bold text-xs text-amber-900/40">
                        [ ? ]
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Banner */}
            {puzzleFeedback && (
              <div className="bg-amber-100 border border-amber-400 text-amber-900 text-xs font-bold p-3 rounded-lg text-center animate-shake">
                ⚠️ {puzzleFeedback}
              </div>
            )}

            {/* Available Glyphs Tray */}
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-black text-amber-900 uppercase tracking-widest">
                AVAILABLE DISCOVERED GLYPHS ({availableGlyphs.length} REMAINING)
              </div>
              <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-amber-900/5 rounded-xl border border-amber-900/20">
                {availableGlyphs.map((glyph) => (
                  <button
                    key={glyph.glyphId}
                    onClick={() => {
                      const emptyIdx = placedSlots.findIndex((s) => s === null);
                      if (emptyIdx !== -1) {
                        handlePlaceGlyphInSlot(glyph, emptyIdx);
                      }
                    }}
                    className="bg-[#fff9ea] hover:bg-amber-300 text-amber-950 border-2 border-black px-3 py-2 rounded-lg font-mono font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    {glyph.glyphId}
                  </button>
                ))}
                {availableGlyphs.length === 0 && (
                  <div className="text-xs text-amber-900/60 font-bold italic py-1">
                    All glyphs have been placed into the slots above. Click any slot to remove or reposition a glyph.
                  </div>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 border-t border-amber-800/30 pt-3">
              <button
                onClick={handleVerifySequence}
                className="bg-amber-500 hover:bg-amber-400 text-black border-2 border-black font-extrabold text-sm px-6 py-2.5 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] cursor-pointer active:translate-y-0.5"
              >
                📜 Submit Reconstruction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REAL HISTORICAL CONTEXT CARD (SHOWN POST-SOLVE) --- */}
      {showHistoricalCard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative bg-[#fff9ea] border-4 border-amber-900 rounded-2xl max-w-2xl w-full p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col gap-4 text-black">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <h2 className="text-lg font-black text-amber-950 uppercase tracking-wide">
                HISTORICAL CONTEXT — VIJAY STAMBH
              </h2>
              <button
                onClick={() => setShowHistoricalCard(false)}
                className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold border border-black shadow flex items-center justify-center hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-amber-950 font-serif">
              <div className="bg-amber-100 border border-amber-300 p-3 rounded-lg text-amber-900 font-sans font-bold">
                🏛️ <strong>REAL HISTORY vs GAME FICTION:</strong> The &ldquo;Sculptor&apos;s Testament&rdquo; cipher is a fictional narrative layer created for <em>Bharat Gatha</em>. The historical Vijay Stambh itself stands as one of India&apos;s greatest victory monuments.
              </div>

              <p>
                <strong>Construction & Purpose:</strong> Vijay Stambh (Tower of Victory) at Chittorgarh Fort was built by <strong>Maharana Kumbha</strong> in 1448 AD to commemorate his military victory over the combined armies of Malwa and Gujarat at the Battle of Sarangpur in 1437 AD.
              </p>

              <p>
                <strong>Architects:</strong> The tower was designed by the chief master architect <strong>Sutradhara Jaita</strong> and his three sons: <strong>Napa, Poma, and Puja</strong>. Their names are inscribed on the 5th floor of the tower.
              </p>

              <p>
                <strong>Architecture:</strong> Standing 9 storeys (37.2 meters) high, it is dedicated to Lord Vishnu and decorated with thousands of intricate Hindu deity carvings, musical instruments, season motifs, and royal emblems.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHistoricalCard(false)}
                className="bg-amber-500 hover:bg-amber-400 text-black border-2 border-black font-extrabold text-xs px-5 py-2 rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                Continue Adventure
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
