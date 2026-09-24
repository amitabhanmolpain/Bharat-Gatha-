"use client";

import React, { useState, useEffect } from "react";
import AccessibleModal from "./AccessibleModal";
import GameIcon from "./GameIcon";
import { soundFx } from "../../../../services/soundService";

interface StoneChariotMiniGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  alreadySolved?: boolean;
}

export default function StoneChariotMiniGame({
  isOpen,
  onClose,
  onComplete,
  alreadySolved = false
}: StoneChariotMiniGameProps) {
  const [outerAngle, setOuterAngle] = useState(0);
  const [middleAngle, setMiddleAngle] = useState(0);
  const [innerAngle, setInnerAngle] = useState(0);
  const [isSolved, setIsSolved] = useState(alreadySolved);

  useEffect(() => {
    if (isOpen && !alreadySolved) {
      // Randomize initial angles (0, 90, 180, 270) but make sure it's not solved
      setOuterAngle([90, 180, 270][Math.floor(Math.random() * 3)]);
      setMiddleAngle([90, 180, 270][Math.floor(Math.random() * 3)]);
      setInnerAngle([90, 180, 270][Math.floor(Math.random() * 3)]);
      setIsSolved(false);
    }
  }, [isOpen, alreadySolved]);

  const handleRotate = (ring: "outer" | "middle" | "inner") => {
    if (isSolved) return;
    soundFx.playSelect();
    
    if (ring === "outer") {
      setOuterAngle((prev) => (prev + 90) % 360);
    } else if (ring === "middle") {
      setMiddleAngle((prev) => (prev + 90) % 360);
    } else if (ring === "inner") {
      setInnerAngle((prev) => (prev + 90) % 360);
    }
  };

  useEffect(() => {
    if (outerAngle === 0 && middleAngle === 0 && innerAngle === 0 && !isSolved) {
      setIsSolved(true);
      if (typeof soundFx.playClueFound === "function") {
        soundFx.playClueFound();
      }
    }
  }, [outerAngle, middleAngle, innerAngle, isSolved]);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="stone-chariot-puzzle-title"
      maxWidthClass="max-w-2xl"
      containerClassName="p-6 md:p-8"
    >
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#2e261f] border-2 border-[#d4a359] flex items-center justify-center shadow-inner">
            <GameIcon name="wheel" size={24} className="text-[#d4a359]" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-widest">
              Stone Chariot Wheels (c. 1540 AD)
            </div>
            <h2 id="stone-chariot-puzzle-title" className="text-xl font-serif font-bold text-[#f6ede0]">
              Garuda Shrine Alignment
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-[#a89985] hover:text-[#f6ede0] text-sm bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          ✕ Exit
        </button>
      </div>

      <div className="text-sm font-serif text-[#eedfc8] bg-[#26201b] p-4 rounded-xl border border-[#473d32] mb-6">
        {isSolved ? (
          <div className="text-[#6ee7a0] font-bold">
            ✦ Perfect Alignment! The heavy stone wheels lock into place with a satisfying resonance. You have uncovered a hidden compartment!
          </div>
        ) : (
          <div>
            The intricate stone wheels of the chariot were engineered to rotate. Align the sacred motifs to match the central axis!
            Click the outer, middle, and inner rings to rotate them.
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center p-8 bg-[#171412] rounded-xl border-2 border-[#3d3329] shadow-inner mb-6 relative min-h-[350px]">
        
        {/* Outer Ring */}
        <div 
          onClick={() => handleRotate("outer")}
          className="absolute w-64 h-64 rounded-full border-[16px] border-[#3d3328] flex items-center justify-center cursor-pointer transition-transform duration-500 ease-in-out hover:border-[#5a4d3f]"
          style={{ transform: `rotate(${outerAngle}deg)` }}
        >
          <div className="absolute -top-4 w-6 h-6 bg-[#d4a359] rounded-full shadow-[0_0_10px_rgba(212,163,89,0.8)]" />
        </div>

        {/* Middle Ring */}
        <div 
          onClick={() => handleRotate("middle")}
          className="absolute w-44 h-44 rounded-full border-[12px] border-[#5a4d3f] flex items-center justify-center cursor-pointer transition-transform duration-500 ease-in-out hover:border-[#736453]"
          style={{ transform: `rotate(${middleAngle}deg)` }}
        >
          <div className="absolute -top-3 w-5 h-5 bg-[#d4a359] rounded-full shadow-[0_0_10px_rgba(212,163,89,0.8)]" />
        </div>

        {/* Inner Ring */}
        <div 
          onClick={() => handleRotate("inner")}
          className="absolute w-28 h-28 rounded-full border-[10px] border-[#736453] flex items-center justify-center cursor-pointer transition-transform duration-500 ease-in-out hover:border-[#8b7a66]"
          style={{ transform: `rotate(${innerAngle}deg)` }}
        >
          <div className="absolute -top-2 w-4 h-4 bg-[#d4a359] rounded-full shadow-[0_0_10px_rgba(212,163,89,0.8)]" />
        </div>

        {/* Center Axis (Fixed) */}
        <div className="absolute w-12 h-12 rounded-full bg-[#1e1a17] border-4 border-[#d4a359] flex items-center justify-center z-10 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          <GameIcon name="gem" size={20} className="text-[#d4a359] animate-pulse" />
        </div>

        <div className="absolute -top-6 text-[10px] font-mono text-[#a89985] uppercase tracking-[0.2em] w-full text-center">
          Match alignment indicators here
          <div className="w-0.5 h-6 bg-[#d4a359]/30 mx-auto mt-1" />
        </div>

      </div>

      <div className="flex justify-center">
        {isSolved && (
          <button
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-8 py-3 rounded-xl uppercase tracking-widest shadow-[0_4px_15px_rgba(212,163,89,0.4)] transition-all cursor-pointer animate-pulse"
          >
            Claim the Golden Time Coin
          </button>
        )}
      </div>
    </AccessibleModal>
  );
}
