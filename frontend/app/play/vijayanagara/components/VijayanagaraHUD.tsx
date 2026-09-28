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
  /** When non-null: active Stage 4 kidnapper countdown (seconds). Drives TIMER button. */
  stage4Timer?: number | null;
  /** Remaining guesses in the Stage 4 kidnapper challenge */
  stage4Attempts?: number;
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
  stage4Timer = null,
  stage4Attempts = 2,
}: VijayanagaraHUDProps) {
  const isStage4Countdown = stage4Timer !== null;
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
      className={`absolute inset-0 pointer-events-none z-[9998] flex flex-col justify-between p-4 md:p-6 select-none font-sans ${
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
            onClick={() => !isStage4Countdown && setIsTimerVisible(!isTimerVisible)}
            title={
              isStage4Countdown
                ? `Stage 4: ${stage4Timer}s left — ${stage4Attempts} chance${stage4Attempts === 1 ? '' : 's'} remaining`
                : isTimerVisible ? "Timer Active (Click to hide)" : "Click to view session timer"
            }
            className={`h-10 px-3.5 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 font-black text-xs cursor-pointer ${
              isStage4Countdown
                ? (stage4Timer !== null && stage4Timer <= 15
                    ? "bg-red-500 text-white animate-pulse border-red-700"
                    : "bg-[#fcd34d] text-black")
                : isTimerVisible
                ? "bg-[#fcd34d] text-black"
                : "bg-white/90 hover:bg-white text-gray-800"
            }`}
          >
            <span>⏱️</span>
            {isStage4Countdown ? (
              <span className="font-mono tracking-tight">
                00:{String((stage4Timer ?? 0) % 60).padStart(2, '0')}
                <span className="ml-2 text-[10px] opacity-80">🕵️{stage4Attempts}/2</span>
              </span>
            ) : isTimerVisible ? (
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


    </div>
  );
}
