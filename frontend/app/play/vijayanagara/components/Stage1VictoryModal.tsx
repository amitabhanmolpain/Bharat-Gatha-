"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Stage1VictoryModalProps {
  onCross: () => void;
}

export default function Stage1VictoryModal({ onCross }: Stage1VictoryModalProps) {
  const [isCrossing, setIsCrossing] = useState(false);

  const handleCross = () => {
    if (isCrossing) return;
    setIsCrossing(true);
    onCross();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#5a4d3f] p-8 shadow-[0_0_50px_rgba(0,0,0,0.95)] text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4a359] to-transparent rounded-t-2xl" />

        <div className="text-4xl mb-3">&#127963;</div>
        <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.3em] mb-1">
          Historical Milestone Achieved
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#f6ede0] mb-2">
          Stage 1 Complete: Anegundi
        </h2>
        <p className="text-xs font-mono text-[#a89985] mb-4">
          Where It All Began &bull; 1336 AD &bull; +500 Historic XP
        </p>

        <div className="mb-5 px-4 py-3 rounded-xl bg-[#1c2e1c] border-2 border-[#4a7a3a] flex items-center gap-3 text-left shadow-[0_0_12px_rgba(74,122,58,0.3)]">
          <span className="text-2xl flex-shrink-0">&#128026;</span>
          <div>
            <div className="text-[10px] font-mono text-[#6fcf6f] uppercase tracking-widest mb-0.5">
              Reward Acquired
            </div>
            <div className="text-sm font-serif font-bold text-[#b8e0a8] leading-snug">
              Vidyaranya&apos;s Cowrie Shell
            </div>
            <div className="text-[11px] font-serif text-[#7ab87a] mt-0.5">
              The shell grants you passage &mdash; row the boat to Hampi Bazaar.
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#231e1a] border border-[#3d3329] text-xs font-serif text-[#d6c7b2] leading-relaxed mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-[#d4a359] font-bold">
            <span>&#10086;</span>
            <span>Discovered the Cradle of the Empire at Anegundi</span>
          </div>
          <div className="flex items-center gap-2 text-[#d4a359] font-bold">
            <span>&#10086;</span>
            <span>Received Sage Vidyaranya&apos;s Founding Guidance</span>
          </div>
          <div className="flex items-center gap-2 text-[#d4a359] font-bold">
            <span>&#10086;</span>
            <span>Mastered the Traditional Karnataka Chowka Bara Grid</span>
          </div>
          <div className="flex items-center gap-2 text-[#d4a359] font-bold">
            <span>&#10086;</span>
            <span>Unlocked 4 Palm-Leaf Journal Inscriptions</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="cross-to-stage2-btn"
            type="button"
            onClick={handleCross}
            disabled={isCrossing}
            className={`font-serif font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${
              isCrossing
                ? "bg-[#5a4d3f] text-[#a89985] cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] cursor-pointer active:translate-y-0.5"
            }`}
          >
            {isCrossing ? (
              <>
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#a89985] border-t-transparent rounded-full" />
                Crossing...
              </>
            ) : (
              <>&#128758; Cross to Hampi Bazaar (Stage 2)</>
            )}
          </button>
          <Link
            href="/dashboard"
            className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center"
          >
            &#127984; Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
