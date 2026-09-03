"use client";

import React, { useEffect, useState } from "react";
import { narrator, NarratorState, stopNarration } from "../services/narratorService";

export default function NarratorSubtitle() {
  const [state, setState] = useState<NarratorState>(narrator.getState());

  useEffect(() => {
    const unsubscribe = narrator.subscribe(setState);
    return () => unsubscribe();
  }, []);

  // Listen for Escape key to close/skip narration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (state.isPlaying || state.isLoading)) {
        stopNarration();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isPlaying, state.isLoading]);

  if (!state.isPlaying && !state.isLoading) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 pointer-events-auto animate-in slide-in-from-bottom-6 duration-200">
      <div className="bg-[#fff9e6] border-4 border-black rounded-lg p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        
        {/* Top Bar: Name & Controls */}
        <div className="flex justify-between items-start mb-2.5">
          <div>
            <h3 className="text-xl font-black text-black leading-tight">Narrator</h3>
            <p className="text-sm font-medium text-gray-600">The Voice of History · Year 1653</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => stopNarration()}
              className="bg-[#ffdc5e] border-2 border-black rounded p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] cursor-pointer"
              title="Narrator Audio Active"
            >
              <span className="text-sm">🔊</span>
            </button>
            <button 
              onClick={() => stopNarration()}
              className="bg-white hover:bg-gray-100 border-2 border-black rounded px-3 py-1 font-bold text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Esc · leave
            </button>
          </div>
        </div>

        {/* Narration Text */}
        <div className="mb-2">
          <p className="text-black font-semibold text-[15px] leading-relaxed whitespace-pre-line">
            {state.currentText || "Channeling historical chronicles..."}
          </p>
        </div>

        {/* Speaking Indicator */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-[#f5a623] text-xs">🔊</span>
          <span className="text-[#f5a623] font-bold text-xs uppercase tracking-wider animate-pulse">
            {state.isLoading ? "Loading voice..." : "SPEAKING..."}
          </span>
        </div>

        {/* Action Choice Button (No typing field for narrator) */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => stopNarration()}
            className="bg-white hover:bg-gray-50 border-[3px] border-black rounded-md px-4 py-2 font-bold text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all text-left cursor-pointer"
          >
            <span className="text-[#f5a623] mr-1">1.</span> Step into History
          </button>
        </div>

      </div>
    </div>
  );
}
