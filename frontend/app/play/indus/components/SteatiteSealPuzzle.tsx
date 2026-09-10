"use client";

import React, { useState, useEffect } from "react";
import { soundFx } from "../../../../services/soundService";

interface SteatiteSealPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  alreadySolved?: boolean;
}

// 4 quadrants of the ancient Unicorn Steatite Seal
// Target order: [0, 1, 2, 3]
interface SealTile {
  id: number;
  label: string;
  glyph: string;
  historicDetail: string;
}

const SEAL_TILES: SealTile[] = [
  { id: 0, label: "Top-Left", glyph: "𐤀 𐤂", historicDetail: "Indus Script Signboard Symbols (Written Right-to-Left)" },
  { id: 1, label: "Top-Right", glyph: "𐤃 𐤄", historicDetail: "Guild Merchant Inscription & Line Crest" },
  { id: 2, label: "Bottom-Left", glyph: "🦄", historicDetail: "The Sacred Ekasringa (One-Horned Unicorn Beast)" },
  { id: 3, label: "Bottom-Right", glyph: "🏺", historicDetail: "Ritual Incense Manger & Standardized Footprint" },
];

export default function SteatiteSealPuzzle({
  isOpen,
  onClose,
  onComplete,
  alreadySolved = false,
}: SteatiteSealPuzzleProps) {
  const [tiles, setTiles] = useState<number[]>([2, 0, 3, 1]); // Shuffled state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (alreadySolved) {
        setTiles([0, 1, 2, 3]);
        setIsSolved(true);
      } else {
        setTiles([2, 0, 3, 1]);
        setIsSolved(false);
      }
      setSelectedIdx(null);
    }
  }, [isOpen, alreadySolved]);

  if (!isOpen) return null;

  const handleTileClick = (idx: number) => {
    if (isSolved && !alreadySolved) return;
    soundFx.playTileSwap();

    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      // Swap the two tiles
      const nextTiles = [...tiles];
      const temp = nextTiles[selectedIdx];
      nextTiles[selectedIdx] = nextTiles[idx];
      nextTiles[idx] = temp;
      setTiles(nextTiles);
      setSelectedIdx(null);

      // Check if solved
      const solved = nextTiles.every((val, index) => val === index);
      if (solved) {
        setIsSolved(true);
        soundFx.playClueFound();
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center text-2xl shadow-inner">
              🦄
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                Harappa & Lothal Artisans • c. 2500 BCE
              </div>
              <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                Steatite Unicorn Seal Decryption
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Narrative Box */}
        <div className="p-3.5 rounded-xl bg-[#281f16] border border-[#4d3a28] text-xs font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-1">
          <p className="font-bold text-[#d8a86a]">
            &ldquo;A merchant of Meluhha must stamp his clay bales before the ship departs the Lothal dockyard.&rdquo;
          </p>
          <p className="text-[11px] text-[#c9b7a1]">
            Click two quadrants to swap them until the carved white steatite seal shows the ancient script at the top and the majestic Unicorn before its ritual manger at the bottom.
          </p>
        </div>

        {/* 2x2 Interactive Seal Board */}
        <div className="p-6 rounded-2xl bg-[#140f0c] border-2 border-[#4a3928] mb-5 flex flex-col items-center">
          <div className="grid grid-cols-2 gap-3 w-64 h-64 md:w-80 md:h-80">
            {tiles.map((tileId, currentPos) => {
              const tileData = SEAL_TILES[tileId];
              const isSelected = selectedIdx === currentPos;
              const isCorrect = tileId === currentPos;

              return (
                <button
                  key={currentPos}
                  type="button"
                  onClick={() => handleTileClick(currentPos)}
                  className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 select-none ${
                    isSelected
                      ? "bg-[#3d2f20] border-[#d8a86a] scale-105 shadow-[0_0_20px_rgba(216,168,106,0.6)] z-10"
                      : isCorrect
                      ? "bg-[#271e16] border-[#8a683e] hover:border-[#d8a86a]"
                      : "bg-[#1d1611] border-[#3f2f20] hover:border-[#6e5338]"
                  }`}
                  title={tileData.historicDetail}
                >
                  <span className="text-3xl md:text-4xl">{tileData.glyph}</span>
                  <span className="text-[10px] font-mono text-[#c9b7a1] text-center mt-1">
                    {tileData.label}
                  </span>
                  {isCorrect && (
                    <span className="absolute top-2 right-2 text-[10px] text-[#9df1a3]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Solved Banner */}
        {isSolved && (
          <div className="p-4 rounded-xl bg-[#2a382b] border border-[#528755] text-center mb-5 animate-fadeIn">
            <div className="text-sm font-serif font-bold text-[#b9f2bd] flex items-center justify-center gap-2">
              <span>✨</span>
              <span>Imperial Steatite Seal Assembled!</span>
            </div>
            <p className="text-xs text-[#d3eed5] mt-1">
              The Ekasringa Unicorn stands proudly beneath the sacred Harappan script symbols. Overseas trade clearance to ancient Mesopotamia granted!
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
          <div className="text-[10px] font-mono text-[#a8947d]">
            Glyptic Steatite Art • Fired Talc Coating (c. 2500 BCE)
          </div>

          <div className="flex gap-2">
            {alreadySolved && (
              <button
                type="button"
                onClick={() => {
                  setTiles([2, 0, 3, 1]);
                  setIsSolved(false);
                }}
                className="bg-[#2e2319] hover:bg-[#423223] border border-[#c29357] text-[#f4ebd9] text-xs font-serif font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Reset & Replay Puzzle ⟳
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (!isSolved) {
                  setTiles([0, 1, 2, 3]);
                  setIsSolved(true);
                  soundFx.playClueFound();
                  setTimeout(() => onComplete(), 1000);
                } else {
                  onClose();
                }
              }}
              className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              {isSolved ? "Complete Seal Challenge ✦" : "Align Steatite Seal 🦄"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
