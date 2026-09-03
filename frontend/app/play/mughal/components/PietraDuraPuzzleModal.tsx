"use client";

import React, { useState, useEffect, useRef } from "react";

interface PietraDuraPuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onTimeout: () => void;
}

// 3x3 grid tiles: 0 to 8 in row-major order
const SOLVED_TILES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export default function PietraDuraPuzzleModal({
  isOpen,
  onClose,
  onSuccess,
  onTimeout,
}: PietraDuraPuzzleModalProps) {
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize easy shuffle when opened
  useEffect(() => {
    if (isOpen) {
      setIsSolved(false);
      setSelectedIdx(null);
      setTimeLeft(50);

      // Perform an easy 4-pair swap shuffle from solved state (easy to solve in 50s)
      let initial = [...SOLVED_TILES];
      const swaps = [
        [0, 1],
        [3, 4],
        [6, 7],
        [2, 5],
      ];
      for (const [a, b] of swaps) {
        const temp = initial[a];
        initial[a] = initial[b];
        initial[b] = temp;
      }
      setTiles(initial);
    }
  }, [isOpen]);

  // 50-second Countdown Timer
  useEffect(() => {
    if (!isOpen || isSolved) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isSolved, onTimeout]);

  if (!isOpen) return null;

  const handleTileClick = (idx: number) => {
    if (isSolved) return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      // Swap tiles
      const nextTiles = [...tiles];
      const temp = nextTiles[selectedIdx];
      nextTiles[selectedIdx] = nextTiles[idx];
      nextTiles[idx] = temp;
      setTiles(nextTiles);
      setSelectedIdx(null);

      // Check if solved
      const solved = nextTiles.every((val, index) => val === SOLVED_TILES[index]);
      if (solved) {
        setIsSolved(true);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    }
  };

  const getTileBackgroundStyle = (tileNum: number) => {
    const row = Math.floor(tileNum / 3);
    const col = tileNum % 3;
    // 3x3 background position mapping (0%, 50%, 100%)
    const xPos = col * 50;
    const yPos = row * 50;

    return {
      backgroundImage: `url('/pietra_dura_flower_art.png')`,
      backgroundSize: "300% 300%",
      backgroundPosition: `${xPos}% ${yPos}%`,
      backgroundRepeat: "no-repeat",
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#fff9ea] border-4 border-black rounded-2xl max-w-2xl w-full p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative flex flex-col md:flex-row gap-6">
        
        {/* Left / Top: Puzzle Game Grid */}
        <div className="flex-1 flex flex-col items-center">
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-3 border-b-2 border-amber-900/20 pb-2">
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-800 uppercase">
                Imperial Court Performance
              </span>
              <h2 className="text-xl font-black text-black leading-tight">
                Pietra Dura Floral Inlay
              </h2>
            </div>

            {/* 50-Second Countdown Timer Badge */}
            <div className={`px-3 py-1.5 rounded-lg border-2 border-black font-black text-sm flex items-center gap-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
              timeLeft <= 10 ? "bg-red-500 text-white animate-pulse" : "bg-amber-400 text-black"
            }`}>
              <span>⏳</span>
              <span>{timeLeft}s</span>
            </div>
          </div>

          <p className="text-xs font-bold text-gray-700 mb-3 text-center">
            Click two tiles to swap them and restore the sacred marble floral pattern before time runs out!
          </p>

          {/* 3x3 Interactive Puzzle Board */}
          <div className="relative p-2 bg-[#d4af37]/30 border-3 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="grid grid-cols-3 gap-1.5 w-[220px] h-[330px] sm:w-[240px] sm:h-[360px]">
              {tiles.map((tileNum, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrect = tileNum === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleTileClick(idx)}
                    style={getTileBackgroundStyle(tileNum)}
                    className={`relative w-full h-full rounded-lg border-2 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "border-amber-500 scale-105 shadow-[0_0_12px_rgba(245,158,11,1)] z-10"
                        : isCorrect && isSolved
                        ? "border-green-600 ring-2 ring-green-400"
                        : "border-black/60 hover:border-black hover:scale-[1.02]"
                    }`}
                  >
                    {/* Small tile index indicator */}
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[9px] px-1 rounded opacity-60">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Solved Overlay */}
            {isSolved && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center text-white animate-in zoom-in-90 duration-200">
                <span className="text-3xl mb-1">✨</span>
                <span className="text-xl font-black text-amber-300 drop-shadow">Art Restored!</span>
                <span className="text-xs font-bold text-gray-200 mt-1">Court Guards Captivated</span>
              </div>
            )}
          </div>
        </div>

        {/* Right / Side: Target Preview & Info */}
        <div className="w-full md:w-52 flex flex-col items-center justify-between border-t md:border-t-0 md:border-l-2 border-amber-900/20 pt-4 md:pt-0 md:pl-5">
          <div className="flex flex-col items-center w-full">
            <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider mb-2">
              Target Design
            </span>
            <div className="w-28 h-44 sm:w-32 sm:h-48 rounded-xl border-3 border-black overflow-hidden shadow-[3px_3px_0_0_rgba(0,0,0,1)] bg-white">
              <img
                src="/pietra_dura_flower_art.png"
                alt="Target Marble Art"
                className="w-full h-full object-fill"
              />
            </div>
            <div className="mt-3 bg-amber-100/80 border border-amber-800/20 rounded-lg p-2.5 text-[11px] text-amber-950 font-medium text-center leading-relaxed">
              <span className="font-bold">Instructions:</span> Match all 9 tiles to the sacred floral niche.
            </div>
          </div>

          {/* Quick Forfeit / Close Button */}
          <div className="w-full mt-4 flex flex-col gap-2">
            <button
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-black border-2 border-black font-extrabold text-xs py-2 rounded-lg transition-all cursor-pointer"
            >
              Step Away (Pause)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
