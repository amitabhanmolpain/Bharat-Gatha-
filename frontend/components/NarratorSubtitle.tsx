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
      if (e.key === "Escape" && (state.isPlaying || state.isLoading || state.currentText)) {
        stopNarration(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isPlaying, state.isLoading, state.currentText]);

  if ((!state.isPlaying && !state.isLoading && !state.currentText) || state.options?.hideSubtitle) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 pointer-events-auto select-none animate-in slide-in-from-bottom-6 duration-200">
      <div className="bg-[#fff9e6] border-4 border-black rounded-xl p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
        
        {/* Top Bar: Name & Controls */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-black text-black tracking-tight leading-tight">Narrator</h3>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-0.5">The Voice of History</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (!state.isPlaying) {
                  narrator.playActiveAudio();
                } else {
                  stopNarration(true);
                }
              }}
              className="bg-[#fcd34d] hover:bg-[#fbbf24] border-2 border-black rounded-lg p-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] cursor-pointer transition-all"
              title={state.isPlaying ? "Pause Narration" : "Play Narration"}
            >
              <span className="text-sm text-black">{state.isPlaying ? "⏸" : "🔊"}</span>
            </button>
            <button 
              onClick={() => stopNarration(true)}
              className="bg-white hover:bg-gray-100 border-2 border-black rounded-lg px-3.5 py-1.5 font-black text-xs text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Esc · leave
            </button>
          </div>
        </div>

        {/* Narration Text */}
        <div className="mb-3 bg-white/60 border border-black/10 rounded-lg p-3">
          <p className="text-black font-bold text-[15px] leading-relaxed whitespace-pre-line">
            {state.currentText || "You have entered the year 1653... the heart of the Mughal Empire."}
          </p>
        </div>

        {/* Speaking Indicator */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[#b45309] text-xs">🔊</span>
          <span className="text-[#b45309] font-black text-xs uppercase tracking-wider animate-pulse">
            {state.isPlaying ? "SPEAKING NARRATION..." : "CLICK BUTTON BELOW TO LISTEN"}
          </span>
        </div>

        {/* Action Choice Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              if (!state.isPlaying) {
                narrator.playActiveAudio();
              } else {
                stopNarration(true);
              }
            }}
            className="bg-white hover:bg-amber-50 text-black border-2 border-black rounded-lg px-4 py-2 font-black text-xs shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all text-left cursor-pointer flex items-center"
          >
            <span className="text-[#b45309] font-black mr-2 text-sm">1.</span>
            <span className="text-black font-extrabold">{state.isPlaying ? "Stop Voice & Continue" : "🔊 Listen to Voice & Step into History"}</span>
          </button>
          <button
            onClick={() => stopNarration(true)}
            className="bg-white hover:bg-gray-100 text-black border-2 border-black rounded-lg px-3.5 py-2 font-bold text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all text-left cursor-pointer"
          >
            <span className="text-gray-500 mr-1.5">2.</span>
            <span className="text-gray-800">Skip Intro</span>
          </button>
        </div>

      </div>
    </div>
  );
}
