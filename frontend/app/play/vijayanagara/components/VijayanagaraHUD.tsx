"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundFx } from "../../../../services/soundService";
import { VijayanagaraStage } from "../types";
import { STAGE_METAS, SCENE_CONFIGS } from "../constants";
import { VijayanagaraSceneType } from "../types";
import GameIcon from "./GameIcon";
import SharedHUDBoxes from "../../../../components/SharedHUDBoxes";

interface VijayanagaraHUDProps {
  stage: VijayanagaraStage;
  scene: VijayanagaraSceneType;
  objective: string;
  fragmentsCollectedCount: number;
  unlockedJournalCount: number;
  onOpenJournal: () => void;
  onResetCampaign: () => void;
  isTransitioning?: boolean;
}

export default function VijayanagaraHUD({
  stage,
  scene,
  objective,
  fragmentsCollectedCount,
  unlockedJournalCount,
  onOpenJournal,
  onResetCampaign,
  isTransitioning = false,
}: VijayanagaraHUDProps) {
  const currentStageMeta = STAGE_METAS[stage];
  const currentSceneMeta = SCENE_CONFIGS[scene];

  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden={isTransitioning}
      className={`absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 md:p-6 select-none font-sans ${
        isTransitioning ? "opacity-40" : ""
      }`}
    >
      <SharedHUDBoxes
        heading={
          <>VIJAYANAGARA EMPIRE • {currentSceneMeta.title.toUpperCase()} ({currentStageMeta.era})</>
        }
        objective={objective}
        cluesStatus={[0, 1, 2].map((i) => i < fragmentsCollectedCount)}
        cluesLabel="pieces"
        onCluesClick={onOpenJournal}
        isTransitioning={isTransitioning}
      />

      {/* Top Right: Actions & Minimap */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsTimerVisible(!isTimerVisible)}
            title={isTimerVisible ? "Timer Active (Click to hide)" : "Click to view session timer"}
            className={`h-10 px-3.5 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 font-black text-xs cursor-pointer ${
              isTimerVisible ? "bg-[#fcd34d] text-black" : "bg-white/90 hover:bg-white text-gray-800"
            }`}
          >
            <span>⏱️</span>
            {isTimerVisible ? (
              <span>
                {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
                {String(elapsedSeconds % 60).padStart(2, '0')}
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-black">Timer</span>
            )}
          </button>

          <button 
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              onResetCampaign();
            }}
            title="Restart to Beginning"
            className="h-10 bg-red-600 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-3 gap-1.5 group cursor-pointer"
          >
            <svg className="w-5 h-5 text-white group-hover:-rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span className="text-[13px] font-bold text-white">Restart</span>
          </button>
          <button 
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              setIsMusicMuted((prev) => !prev);
            }}
            title={isMusicMuted ? "Unmute Music" : "Mute Music"}
            className={`w-10 h-10 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer ${
              isMusicMuted ? "bg-gray-200 text-gray-500" : "bg-amber-400 text-black"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
          </button>
          <button 
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              const muted = soundFx.toggleMute();
              setIsSoundMuted(muted);
            }}
            title={isSoundMuted ? "Unmute Sound" : "Mute Sound"}
            className={`w-10 h-10 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer ${
              isSoundMuted ? "bg-gray-200 text-gray-500" : "bg-amber-400 text-black"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 5.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
          </button>
          <button 
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              router.push('/dashboard');
            }} 
            className="h-10 bg-red-600 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-4 cursor-pointer"
          >
            <span className="text-[13px] font-bold text-white">Leave world</span>
          </button>
        </div>

        {/* Minimap Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-44 h-36 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-amber-50/50 rounded">
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-amber-100 rounded-sm"></div>
             
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600 flex items-center justify-center">
                <span className="text-[10px] font-bold">YOU</span>
             </div>
             <div className="bg-amber-100 rounded-sm"></div>

             <div className="bg-transparent"></div>
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-amber-100 rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#a89985] bg-[#1a1714]/90 backdrop-blur-md border border-[#5a4d3f] px-4 py-2 rounded-xl max-w-2xl mx-auto pointer-events-auto shadow-[3px_3px_0_0_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[#d4a359] font-bold tracking-wider">
            <GameIcon name="controls" size={14} className="text-[#d4a359]" />
            <span>CONTROLS</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#25201b] border border-[#5a4d3f] text-[#eedfc8] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.7)]">W</kbd>
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#25201b] border border-[#5a4d3f] text-[#eedfc8] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.7)]">A</kbd>
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#25201b] border border-[#5a4d3f] text-[#eedfc8] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.7)]">S</kbd>
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#25201b] border border-[#5a4d3f] text-[#eedfc8] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.7)]">D</kbd>
          </div>
          <span className="text-[#7d7060]">or</span>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#25201b] border border-[#5a4d3f] text-[#eedfc8] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.7)]">↑</kbd>
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#25201b] border border-[#5a4d3f] text-[#eedfc8] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.7)]">←</kbd>
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#25201b] border border-[#5a4d3f] text-[#eedfc8] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.7)]">↓</kbd>
            <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#25201b] border border-[#5a4d3f] text-[#eedfc8] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.7)]">→</kbd>
          </div>
          <span>to Walk</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="inline-flex items-center justify-center min-w-[20px] h-[20px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1.5 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
          <span className="text-[#eedfc8] font-serif font-semibold">Interact & Speak</span>
        </div>
      </div>
    </div>
  );
}
