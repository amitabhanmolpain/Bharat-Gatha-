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
  { id: 2, label: "Bottom-Left", glyph: "Ekasringa", historicDetail: "The Sacred Ekasringa (One-Horned Unicorn Beast)" },
  { id: 3, label: "Bottom-Right", glyph: "Manger", historicDetail: "Ritual Incense Manger & Standardized Footprint" },
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
            <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
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
            Click two fragments to swap their positions. Reassemble the 4-part steatite seal: top inscription signs above, sacred Ekasringa unicorn and ritual manger below.
          </p>
        </div>

        {/* Interactive 2x2 Seal Plate */}
        <div className="flex flex-col items-center mb-6">
          <div className="text-xs font-mono text-[#d8a86a] mb-2 uppercase tracking-wider">
            Steatite Soapstone Carving Block (2 × 2 Quadrants)
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-[#140e0a] rounded-2xl border-2 border-[#54412e] shadow-2xl">
            {tiles.map((tileId, idx) => {
              const tile = SEAL_TILES.find((t) => t.id === tileId);
              const isSelected = selectedIdx === idx;
              const isCorrectPosition = tileId === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTileClick(idx)}
                  className={`w-36 h-36 sm:w-44 sm:h-44 rounded-xl flex flex-col items-center justify-center p-3 border-2 transition-all cursor-pointer select-none relative group ${
                    isSelected
                      ? "border-[#fcd34d] bg-[#3a2c1d] shadow-[0_0_20px_rgba(252,211,77,0.5)] scale-102 z-10"
                      : isCorrectPosition
                      ? "border-[#528755] bg-[#221c16] hover:bg-[#2e241c]"
                      : "border-[#4a3928] bg-[#1a140f] hover:bg-[#261d15]"
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#a8947d] uppercase tracking-wider mb-1">
                    {tile?.label}
                  </span>

                  <span className="text-3xl sm:text-4xl my-1 group-hover:scale-110 transition-transform">
                    {tile?.glyph}
                  </span>

                  <span className="text-[9px] font-serif text-[#c9b7a1] text-center line-clamp-2 leading-tight mt-1">
                    {tile?.historicDetail}
                  </span>

                  {isCorrectPosition && (
                    <span className="absolute top-2 right-2 text-xs font-bold text-[#65bd69]">
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
              <svg className="w-5 h-5 text-[#65bd69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
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
                Reset & Replay Puzzle
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
              {isSolved ? "Complete Seal Challenge" : "Align Steatite Seal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
