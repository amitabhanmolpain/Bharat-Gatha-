"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { soundFx } from "../../../../services/soundService";
import { recordGameWinToDatabase } from "../../../../services/gameProgressService";
import {
  CarvingHotspotDef,
  CARVING_HOTSPOTS,
  TARGET_HUNT_SEQUENCE,
  CANONICAL_SOLUTION_SEQUENCE,
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
  // Container ref for accurate coordinate space conversions
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Shilpa Drishti Magnifying Glass State
  const [isShilpaDrishtiActive, setIsShilpaDrishtiActive] = useState(false);
  const [lensPos, setLensPos] = useState<{ x: number; y: number }>({ x: 50, y: 70 });
  const [collectingGlyph, setCollectingGlyph] = useState<CarvingHotspotDef | null>(null);
  const [feedbackHint, setFeedbackHint] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnnouncedFoundRef = useRef(false);

  // Journal & Final Puzzle State
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

  // Distance calculation in normalized container percentage space (0 - 100)
  const distanceToTarget = useMemo(() => {
    if (!currentTargetDef) return 999;
    const dx = lensPos.x - currentTargetDef.renderX;
    const dy = lensPos.y - currentTargetDef.renderY;
    return Math.sqrt(dx * dx + dy * dy);
  }, [currentTargetDef, lensPos]);

  // Detection threshold (generous radius matching visible lens aperture)
  const detectionRadius = useMemo(() => {
    return currentTargetDef?.radius || 11.5;
  }, [currentTargetDef]);

  // Check if current target glyph is currently UNDER the magnifying lens
  const isTargetUnderLens = useMemo(() => {
    if (!isShilpaDrishtiActive || !currentTargetDef || collectingGlyph) return false;
    return distanceToTarget <= detectionRadius;
  }, [isShilpaDrishtiActive, currentTargetDef, collectingGlyph, distanceToTarget, detectionRadius]);

  // Persist discovered glyphs
  const saveDiscoveredGlyphs = (ids: string[]) => {
    setDiscoveredGlyphIds(ids);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sculptors_testament_discovered_glyphs", JSON.stringify(ids));
      } catch (e) {}
    }
  };

  // Collect Glyph Handler (Pressed G when detected under lens)
  const handleCollectDetectedGlyph = useCallback(() => {
    if (!currentTargetDef || !isTargetUnderLens || collectingGlyph) return;

    soundFx.playClueFound();
    setCollectingGlyph(currentTargetDef);

    setTimeout(() => {
      const updated = [...discoveredGlyphIds, currentTargetDef.glyphId];
      saveDiscoveredGlyphs(updated);
      setCollectingGlyph(null);

      if (updated.length === 9) {
        setIsShilpaDrishtiActive(false);
        if (!hasAnnouncedFoundRef.current) {
          hasAnnouncedFoundRef.current = true;
          onTriggerJollySpeech(CANONICAL_JOLLY_ALL_FOUND, "glowing");
        }
        setTimeout(() => {
          setShowFinalPuzzle(true);
        }, 600);
      } else {
        const nextId = TARGET_HUNT_SEQUENCE.find((id) => !updated.includes(id));
        const nextDef = CARVING_HOTSPOTS.find((h) => h.glyphId === nextId);
        onTriggerJollySpeech(
          `Carving recorded! Next glyph to find: ${nextDef?.name || "Next Inscription"}.`,
          "normal"
        );
      }
    }, 800);
  }, [currentTargetDef, isTargetUnderLens, collectingGlyph, discoveredGlyphIds, onTriggerJollySpeech]);

  // Update lens position from client screen coordinates to container percentages
  const updateLensFromClientCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(4, Math.min(96, ((clientY - rect.top) / rect.height) * 100));
    setLensPos({ x, y });
  }, []);

  // Window-level pointer listener for ultra-smooth lens tracking
  useEffect(() => {
    if (!isShilpaDrishtiActive) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      updateLensFromClientCoords(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
    };
  }, [isShilpaDrishtiActive, updateLensFromClientCoords]);

  // Keyboard Handlers: E (Toggle Shilpa Drishti), G (Collect Glyph), ` (Toggle Debug)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // [~ / `] TOGGLE DEVELOPMENT DEBUG OVERLAY
      if (key === "`" || key === "~") {
        setShowDebug((prev) => !prev);
        return;
      }

      // [E] TOGGLE SHILPA DRISHTI MAGNIFYING GLASS
      if (key === "e") {
        if (!showFinalPuzzle && !showJournal) {
          e.preventDefault();
          e.stopPropagation();
          soundFx.playSelect();
          setIsShilpaDrishtiActive((prev) => !prev);
        }
      }

      // [G] COLLECT GLYPH WHEN UNDER LENS
      else if (key === "g") {
        if (isShilpaDrishtiActive && !showFinalPuzzle && !showJournal) {
          e.preventDefault();
          e.stopPropagation();
          if (isTargetUnderLens && currentTargetDef) {
            handleCollectDetectedGlyph();
          } else {
            soundFx.playSelect();
            setFeedbackHint("Nothing here... search the sandstone carvings!");
            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
            hintTimeoutRef.current = setTimeout(() => setFeedbackHint(null), 1800);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isShilpaDrishtiActive,
    isTargetUnderLens,
    currentTargetDef,
    showFinalPuzzle,
    showJournal,
    handleCollectDetectedGlyph,
  ]);

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
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-15 select-none">
      {/* --- INTERACTIVE SEARCH LAYER (Pointer Tracking Area) --- */}
      <div
        className={`absolute inset-0 select-none ${
          isShilpaDrishtiActive ? "cursor-none pointer-events-auto" : "pointer-events-none"
        }`}
        onPointerMove={(e) => updateLensFromClientCoords(e.clientX, e.clientY)}
        onClick={() => {
          if (isShilpaDrishtiActive && isTargetUnderLens && currentTargetDef) {
            handleCollectDetectedGlyph();
          }
        }}
      >
        {/* --- CAMOUFLAGED ARCHITECTURAL CARVINGS (EMBEDDED DIRECTLY IN SANDSTONE) --- */}
        {CARVING_HOTSPOTS.map((hotspot) => {
          const isDiscovered = discoveredGlyphIds.includes(hotspot.glyphId);
          const isCurrentTarget = currentTargetId === hotspot.glyphId;
          const isCollecting = collectingGlyph?.glyphId === hotspot.glyphId;

          return (
            <div
              key={hotspot.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500"
              style={{
                left: `${hotspot.renderX}%`,
                top: `${hotspot.renderY}%`,
              }}
            >
              <div
                className={`transition-all duration-700 flex items-center justify-center relative ${
                  isCollecting
                    ? "scale-175 drop-shadow-[0_0_30px_rgba(251,191,36,1)] brightness-150 animate-pulse"
                    : isDiscovered
                    ? "opacity-60 grayscale-[15%] brightness-90 scale-95"
                    : "opacity-40 hover:opacity-60"
                }`}
              >
                <VijayStambhGlyphArt
                  glyphId={hotspot.glyphId}
                  size={hotspot.renderSize}
                  mode={isCollecting ? "revealing" : isDiscovered ? "collected" : "camouflaged"}
                />

                {/* Chisel Dust Particle Burst on Collection */}
                {isCollecting && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <span
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,1)] animate-ping"
                        style={{
                          transform: `rotate(${i * 30}deg) translateY(-${24 + (i % 3) * 10}px)`,
                          animationDuration: "0.8s",
                          animationIterationCount: 1,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* --- SHILPA DRISHTI MAGNIFYING GLASS LENS --- */}
        {isShilpaDrishtiActive && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 ease-out z-25"
            style={{
              left: `${lensPos.x}%`,
              top: `${lensPos.y}%`,
            }}
          >
            {/* Outer Lens Frame (Ornate Brass/Gold Rim with Engravings) */}
            <div
              className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 transition-all duration-300 overflow-hidden ${
                isTargetUnderLens
                  ? "border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.95),inset_0_0_30px_rgba(0,0,0,0.6)] scale-105"
                  : "border-amber-600/90 shadow-[0_0_25px_rgba(217,119,6,0.5),inset_0_0_20px_rgba(0,0,0,0.7)]"
              }`}
            >
              {/* Magnified Optical Chamber Background (220% Zoom centered at lens position) */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundImage: "url('/bg-vijay-stambh-interior.jpg')",
                  backgroundSize: "220% 220%",
                  backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                  filter: isTargetUnderLens
                    ? "contrast(1.18) brightness(1.12)"
                    : "contrast(1.08) brightness(1.02)",
                }}
              />

              {/* Magnified Target Glyph Rendering inside the Lens when in range */}
              {currentTargetDef && (
                (() => {
                  const dx = currentTargetDef.renderX - lensPos.x;
                  const dy = currentTargetDef.renderY - lensPos.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist > 18) return null;

                  // Magnified offset from center of lens
                  const offsetX = 50 + dx * 2.2;
                  const offsetY = 50 + dy * 2.2;

                  return (
                    <div
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                      style={{
                        left: `${offsetX}%`,
                        top: `${offsetY}%`,
                      }}
                    >
                      <div
                        className={`flex items-center justify-center transition-all duration-300 ${
                          isTargetUnderLens
                            ? "scale-140 drop-shadow-[0_0_24px_rgba(251,191,36,1)] brightness-125"
                            : "scale-110 opacity-70"
                        }`}
                      >
                        <VijayStambhGlyphArt
                          glyphId={currentTargetDef.glyphId}
                          size={currentTargetDef.renderSize * 1.5}
                          mode={isTargetUnderLens ? "revealing" : "camouflaged"}
                        />
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Lens Optical Reflection & Glass Gradient */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.12)_0%,_rgba(251,191,36,0.06)_50%,_rgba(0,0,0,0.35)_100%)] pointer-events-none" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />

              {/* Ancient Reticle & Crosshair Rings */}
              <div className="absolute inset-2 rounded-full border border-amber-400/30 pointer-events-none" />
              <div className="absolute inset-6 rounded-full border border-dashed border-amber-400/20 pointer-events-none" />
              <div className="absolute left-1/2 top-2 bottom-2 w-px bg-amber-400/25 -translate-x-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-2 right-2 h-px bg-amber-400/25 -translate-y-1/2 pointer-events-none" />

              {/* Lens Brass Handle Mount */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-amber-700 border border-black rounded-b-lg shadow-md" />
            </div>

            {/* Target Detected Floating Prompt */}
            {isTargetUnderLens && currentTargetDef && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap bg-[#fff9ea] border-2 border-black rounded-xl px-4 py-1.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-black font-extrabold text-xs flex items-center gap-2 animate-bounce pointer-events-auto cursor-pointer" onClick={handleCollectDetectedGlyph}>
                <span className="bg-amber-400 border border-black rounded px-1.5 py-0.5 text-[10px] font-mono">
                  G
                </span>
                <span className="text-amber-950">
                  COLLECT {currentTargetDef.glyphId} GLYPH
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- TOP HUD: OBJECTIVE & SHILPA DRISHTI CONTROLS --- */}
      <div className="fixed top-20 left-6 z-20 flex flex-col gap-2 pointer-events-none select-none">
        <div className="bg-[#fff9ea] border-2 border-black rounded-xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-84 pointer-events-auto">
          {/* Title & Counter */}
          <div className="flex items-center justify-between mb-1.5 border-b border-amber-900/30 pb-1">
            <span className="text-[10px] font-black text-amber-950 uppercase tracking-widest flex items-center gap-1.5">
              <span>🏛️</span>
              <span>THE SCULPTOR&apos;S TESTAMENT</span>
            </span>
            <span className="text-[11px] font-black bg-amber-400 text-amber-950 border border-black px-2 py-0.5 rounded shadow-sm font-mono">
              {discoveredGlyphIds.length} / 9 GLYPHS
            </span>
          </div>

          {/* Current Target Objective Display */}
          {currentTargetDef ? (
            <div className="flex items-center gap-3 bg-amber-100/90 border border-amber-800/40 rounded-lg p-2.5">
              <div className="w-12 h-12 rounded-lg bg-[#2a1d13] border-2 border-amber-600 flex items-center justify-center shadow-inner shrink-0">
                <VijayStambhGlyphArt
                  glyphId={currentTargetDef.glyphId}
                  size={36}
                  mode="target"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider">
                  FIND THE GLYPH:
                </span>
                <span className="text-xs font-mono font-black text-amber-950 tracking-wider">
                  {currentTargetDef.name}
                </span>
                <span className="text-[10px] text-amber-900/80 italic font-serif">
                  Search the sandstone architecture.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 bg-emerald-100 border border-emerald-700 rounded-lg p-2.5">
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

          {/* Shilpa Drishti Toggle Button & Journal */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playSelect();
                setIsShilpaDrishtiActive((prev) => !prev);
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg border-2 border-black text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer transition-all ${
                isShilpaDrishtiActive
                  ? "bg-amber-400 text-amber-950 scale-102"
                  : "bg-amber-200/80 hover:bg-amber-300 text-amber-900"
              }`}
            >
              <span>👁️</span>
              <span>{isShilpaDrishtiActive ? "SHILPA DRISHTI: ON" : "[E] USE SHILPA DRISHTI"}</span>
            </button>

            <button
              onClick={() => setShowJournal(true)}
              className="bg-[#fff9ea] hover:bg-amber-200 text-amber-950 font-extrabold text-xs px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer flex items-center gap-1"
            >
              📖 Journal
            </button>
          </div>

          {/* Feedback Hint */}
          {feedbackHint && (
            <div className="mt-1.5 text-[10px] font-bold text-amber-900 text-center bg-amber-200/60 rounded px-2 py-0.5 border border-amber-700/30 animate-pulse">
              {feedbackHint}
            </div>
          )}
        </div>

        {/* Development Debug Overlay (Press ` or ~ to toggle) */}
        {showDebug && currentTargetDef && (
          <div className="bg-black/90 text-amber-300 border border-amber-500 rounded-lg p-2 text-[10px] font-mono pointer-events-auto">
            <div><strong>DEBUG INSPECTOR (~):</strong></div>
            <div>Lens: ({lensPos.x.toFixed(1)}%, {lensPos.y.toFixed(1)}%)</div>
            <div>Target: {currentTargetDef.glyphId} ({currentTargetDef.renderX}%, {currentTargetDef.renderY}%)</div>
            <div>Distance: {distanceToTarget.toFixed(1)}% (Max: {detectionRadius}%)</div>
            <div className={isTargetUnderLens ? "text-emerald-400 font-bold" : "text-amber-400"}>
              Status: {isTargetUnderLens ? "🎯 TARGET DETECTED (Press G)" : "Searching..."}
            </div>
          </div>
        )}
      </div>

      {/* --- SCULPTOR'S TESTAMENT JOURNAL MODAL --- */}
      {showJournal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none pointer-events-auto">
          <div className="relative bg-[#fff9ea] border-4 border-amber-900 rounded-2xl max-w-2xl w-full max-h-[85vh] p-5 shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col gap-3 text-black overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <div>
                  <h3 className="font-extrabold text-sm text-amber-950 font-serif">
                    Sutradhara Jaita&apos;s Field Journal
                  </h3>
                  <p className="text-[10px] text-amber-800 font-mono">
                    {discoveredGlyphIds.length} of 9 Inscriptions Discovered
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJournal(false)}
                className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-sm border-2 border-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              >
                ✕
              </button>
            </div>

            {/* Glyph Cards Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CARVING_HOTSPOTS.map((hotspot) => {
                const isFound = discoveredGlyphIds.includes(hotspot.glyphId);

                return (
                  <div
                    key={hotspot.id}
                    className={`rounded-xl border-2 p-3 flex gap-2.5 transition-all ${
                      isFound
                        ? "bg-amber-100/90 border-amber-800/50 shadow-sm"
                        : "bg-amber-200/30 border-dashed border-amber-700/30 opacity-60"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 ${
                        isFound
                          ? "bg-[#2b1c12] border-amber-600"
                          : "bg-amber-900/10 border-amber-900/20"
                      }`}
                    >
                      {isFound ? (
                        <VijayStambhGlyphArt
                          glyphId={hotspot.glyphId}
                          size={32}
                          mode="collected"
                        />
                      ) : (
                        <span className="text-amber-900/40 text-lg font-bold">?</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-950 font-mono">
                          {isFound ? hotspot.name : `Inscription ${hotspot.targetOrder}`}
                        </span>
                        {isFound && (
                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                            Found
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-900/80 line-clamp-2 mt-0.5">
                        {isFound ? hotspot.clue : "Undiscovered architectural inscription."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-amber-800/20 pt-2 flex items-center justify-between">
              <span className="text-[10px] text-amber-900 italic font-serif">
                &ldquo;Every stone of the Tower of Victory speaks to those who observe.&rdquo;
              </span>
              <button
                onClick={() => setShowJournal(false)}
                className="bg-amber-500 hover:bg-amber-400 text-black border-2 border-black font-extrabold text-xs px-4 py-1.5 rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FINAL SCULPTOR'S TESTAMENT RECONSTRUCTION PUZZLE --- */}
      {showFinalPuzzle && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 select-none pointer-events-auto">
          <div className="relative bg-[#fff9ea] border-4 border-amber-900 rounded-3xl max-w-3xl w-full max-h-[90vh] p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col gap-4 text-black overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <div>
                <h2 className="font-extrabold text-lg text-amber-950 font-serif flex items-center gap-2">
                  <span>🏛️</span>
                  <span>Assemble the Architect&apos;s Testament</span>
                </h2>
                <p className="text-xs text-amber-800">
                  Arrange the 9 discovered glyphs in canonical harmony: from Bedrock to Sky.
                </p>
              </div>
              <button
                onClick={() => setShowFinalPuzzle(false)}
                className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-sm border-2 border-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              >
                ✕
              </button>
            </div>

            {/* Inscription Slots (1 to 9 Canonical Ladder) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
                Monument Inscription Slots (1: Bedrock → 9: Celestial Sky):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {placedSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRemoveFromSlot(idx)}
                    className={`h-20 sm:h-22 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                      slot
                        ? "bg-amber-100 border-amber-800 shadow-md hover:scale-105"
                        : "bg-amber-200/40 border-dashed border-amber-700/40 hover:bg-amber-200/60"
                    }`}
                  >
                    <span className="text-[9px] font-mono font-bold text-amber-800/80 mb-0.5">
                      #{idx + 1}
                    </span>
                    {slot ? (
                      <>
                        <div className="w-8 h-8 rounded bg-[#2b1c12] border border-amber-600 flex items-center justify-center shadow-inner">
                          <VijayStambhGlyphArt
                            glyphId={slot.glyphId}
                            size={24}
                            mode="collected"
                          />
                        </div>
                        <span className="text-[8px] font-black text-amber-950 mt-1 truncate max-w-full font-mono">
                          {slot.glyphId}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-amber-800/40 font-bold">+</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Available Glyphs Dock */}
            <div className="flex flex-col gap-1.5 bg-amber-200/30 p-3 rounded-2xl border border-amber-800/20">
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
                Available Inscription Pieces (Click slot to place):
              </span>
              <div className="flex flex-wrap gap-2 min-h-[60px] items-center">
                {availableGlyphs.length === 0 ? (
                  <span className="text-xs text-amber-800/60 italic font-serif">
                    All glyphs have been slotted into the testament. Click &ldquo;Verify Inscription&rdquo;!
                  </span>
                ) : (
                  availableGlyphs.map((glyph) => (
                    <button
                      key={glyph.id}
                      onClick={() => {
                        const firstEmptyIdx = placedSlots.findIndex((s) => s === null);
                        if (firstEmptyIdx !== -1) {
                          handlePlaceGlyphInSlot(glyph, firstEmptyIdx);
                        }
                      }}
                      className="flex items-center gap-1.5 bg-[#fff9ea] hover:bg-amber-100 text-amber-950 border-2 border-black px-2.5 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      <div className="w-6 h-6 rounded bg-[#2b1c12] border border-amber-600 flex items-center justify-center">
                        <VijayStambhGlyphArt
                          glyphId={glyph.glyphId}
                          size={18}
                          mode="target"
                        />
                      </div>
                      <span className="text-[10px] font-extrabold font-mono">{glyph.glyphId}</span>
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
    </div>
  );
}
