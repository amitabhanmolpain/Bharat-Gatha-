"use client";

import React, { useState, useEffect } from "react";
import { soundFx } from "../../../../services/soundService";

interface GreatBathDrainagePuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  alreadySolved?: boolean;
}

// 6 pipe segments that must be rotated into correct alignment
// Directions: 0 = 0deg, 1 = 90deg, 2 = 180deg, 3 = 270deg
interface PipeSegment {
  id: number;
  name: string;
  type: "straight" | "corner" | "sluice";
  currentRotation: number; // 0, 1, 2, 3
  targetRotation: number;
}

const INITIAL_PIPES: PipeSegment[] = [
  { id: 0, name: "Intake Well Sluice", type: "straight", currentRotation: 1, targetRotation: 0 },
  { id: 1, name: "Bitumen Seal Canal", type: "corner", currentRotation: 2, targetRotation: 1 },
  { id: 2, name: "Desiltation Sump", type: "straight", currentRotation: 3, targetRotation: 0 },
  { id: 3, name: "Corbelled Vault Arch", type: "corner", currentRotation: 0, targetRotation: 3 },
  { id: 4, name: "Gypsum Mortar Channel", type: "straight", currentRotation: 1, targetRotation: 0 },
  { id: 5, name: "Great Bath Outlet Sluice", type: "corner", currentRotation: 3, targetRotation: 2 },
];

export default function GreatBathDrainagePuzzle({
  isOpen,
  onClose,
  onComplete,
  alreadySolved = false,
}: GreatBathDrainagePuzzleProps) {
  const [pipes, setPipes] = useState<PipeSegment[]>(INITIAL_PIPES);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [waterFlowing, setWaterFlowing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (alreadySolved) {
        setPipes(INITIAL_PIPES.map((p) => ({ ...p, currentRotation: p.targetRotation })));
        setIsSolved(true);
        setWaterFlowing(true);
      } else {
        setPipes(INITIAL_PIPES.map((p) => ({ ...p, currentRotation: (p.targetRotation + 1) % 4 })));
        setIsSolved(false);
        setWaterFlowing(false);
      }
    }
  }, [isOpen, alreadySolved]);

  if (!isOpen) return null;

  const handleRotate = (id: number) => {
    if (isSolved && !alreadySolved) return;
    soundFx.playTileSwap();

    setPipes((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, currentRotation: (p.currentRotation + 1) % 4 } : p
      );

      // Check if all are in target rotation
      const allAligned = updated.every((p) => {
        // Straight pipes are symmetric: rotation 0 == 2, 1 == 3
        if (p.type === "straight") {
          return p.currentRotation % 2 === p.targetRotation % 2;
        }
        return p.currentRotation === p.targetRotation;
      });

      if (allAligned) {
        setIsSolved(true);
        setWaterFlowing(true);
        soundFx.playClueFound();
        setTimeout(() => {
          onComplete();
        }, 1200);
      }

      return updated;
    });
  };

  const getRotationClass = (rot: number) => {
    switch (rot) {
      case 0:
        return "rotate-0";
      case 1:
        return "rotate-90";
      case 2:
        return "rotate-180";
      case 3:
        return "rotate-270";
      default:
        return "rotate-0";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6 text-[#5dbcd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                Mohenjo-daro Citadel • c. 2500 BCE
              </div>
              <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                Hydraulic Drainage Engineering of the Great Bath
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

        {/* Narrative Banner */}
        <div className="p-3.5 rounded-xl bg-[#281f16] border border-[#4d3a28] text-xs font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-1">
          <p className="font-bold text-[#d8a86a]">
            &ldquo;The sacred waters must flow through the bitumen-lined culvert into the central tank.&rdquo;
          </p>
          <p className="text-[11px] text-[#c9b7a1]">
            Rotate the six baked-brick channels to direct fresh water from the municipal supply well into the Great Bath without spilling into the overflow drainage trench.
          </p>
        </div>

        {/* Puzzle Grid */}
        <div className="p-5 rounded-2xl bg-[#120e0b] border-2 border-[#4a3928] mb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pipes.map((pipe) => {
              const isAligned =
                pipe.type === "straight"
                  ? pipe.currentRotation % 2 === pipe.targetRotation % 2
                  : pipe.currentRotation === pipe.targetRotation;

              return (
                <div
                  key={pipe.id}
                  onClick={() => handleRotate(pipe.id)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none group ${
                    isAligned
                      ? "bg-[#2c2217] border-[#c29357] shadow-[0_0_15px_rgba(194,147,87,0.3)]"
                      : "bg-[#1f1711] border-[#443324] hover:border-[#8f6d42] hover:bg-[#281e16]"
                  }`}
                  title="Click to rotate canal 90 degrees"
                >
                  <span className="text-[10px] font-mono text-[#a8947d] text-center font-bold">
                    {pipe.name}
                  </span>

                  {/* Visual Channel Pipe Graphic */}
                  <div
                    className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-transform duration-300 ${getRotationClass(
                      pipe.currentRotation
                    )} ${
                      isAligned
                        ? "bg-[#3d2f20] border-[#d8a86a] text-[#7be0ff]"
                        : "bg-[#251c14] border-[#5a432f] text-[#8c745c]"
                    }`}
                  >
                    {pipe.type === "straight" ? (
                      <div className="w-4 h-full bg-gradient-to-b from-[#c29357] via-[#5dbcd2] to-[#c29357] rounded-sm shadow-inner"></div>
                    ) : (
                      <div className="relative w-full h-full">
                        <div className="absolute top-0 left-6 w-4 h-10 bg-[#c29357] rounded-sm"></div>
                        <div className="absolute top-6 left-6 w-10 h-4 bg-[#5dbcd2] rounded-sm"></div>
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                      isAligned
                        ? "bg-[#3e3022] text-[#e6b97f] font-bold"
                        : "bg-[#18120e] text-[#7c6a56]"
                    }`}
                  >
                    {isAligned ? "✓ Water Flowing" : "⟳ Click to Align"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status / Victory Notification */}
        {isSolved && (
          <div className="p-4 rounded-xl bg-[#2a382b] border border-[#528755] text-center mb-5 animate-fadeIn">
            <div className="text-sm font-serif font-bold text-[#b9f2bd] flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-[#5dbcd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>The Great Bath Fills with Sacred Water!</span>
            </div>
            <p className="text-xs text-[#d3eed5] mt-1">
              Waterproofing holding firm with natural bitumen and gypsum mortar. You have earned the blessing of the Harappan civic architects!
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
          <div className="text-[10px] font-mono text-[#a8947d]">
            Municipal Sanitation • Mohenjo-daro Civil Engineering
          </div>

          <div className="flex gap-2">
            {alreadySolved && (
              <button
                type="button"
                onClick={() => {
                  setPipes(INITIAL_PIPES.map((p) => ({ ...p, currentRotation: (p.targetRotation + 1) % 4 })));
                  setIsSolved(false);
                  setWaterFlowing(false);
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
                  // Instant solve helper for accessibility
                  setPipes(INITIAL_PIPES.map((p) => ({ ...p, currentRotation: p.targetRotation })));
                  setIsSolved(true);
                  setWaterFlowing(true);
                  soundFx.playClueFound();
                  setTimeout(() => onComplete(), 1000);
                } else {
                  onClose();
                }
              }}
              className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              {isSolved ? "Complete Drainage Challenge" : "Restore Hydraulic Flow"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
