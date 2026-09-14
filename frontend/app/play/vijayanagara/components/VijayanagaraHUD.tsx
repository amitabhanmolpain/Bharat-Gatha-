"use client";

import React from "react";
import Link from "next/link";
import { VijayanagaraStage } from "../types";
import { STAGE_METAS, SCENE_CONFIGS } from "../constants";
import { VijayanagaraSceneType } from "../types";
import GameIcon from "./GameIcon";

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

  return (
    <div
      aria-hidden={isTransitioning}
      className={`absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 md:p-6 select-none font-sans ${
        isTransitioning ? "opacity-40" : ""
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full">
        
        {/* Left: Quest & Stage Card (Mughal Style) */}
        <div className="flex flex-col gap-2 z-10 pointer-events-auto">
          <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-80 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest mb-0.5">
              VIJAYANAGARA EMPIRE • {currentSceneMeta.title.toUpperCase()} ({currentStageMeta.era})
            </div>
            <div className="text-[13px] font-black text-black leading-snug">
              {objective}
            </div>
          </div>

          <div 
            onClick={onOpenJournal}
            className="bg-[#fff9ea] hover:bg-[#fff2cc] border-2 border-black rounded-lg px-3 py-1.5 w-64 shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-between cursor-pointer transition-all active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] group"
            title="Open Historical Journal"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className={`w-3.5 h-1.5 rounded-sm transition-all ${
                      i < fragmentsCollectedCount ? "bg-amber-500 shadow-sm" : "bg-amber-200"
                    }`}
                  ></div>
                ))}
              </div>
            </div>
            <span className="text-[12px] font-extrabold text-black flex items-center gap-1">
              {fragmentsCollectedCount}/3 pieces
              <span className="text-[10px] text-amber-700 underline font-bold group-hover:text-black">open</span>
            </span>
          </div>
        </div>

        {/* Right: Actions, Mystery Ledger & Journal Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5 self-end md:self-auto">
          
          {/* Mystery Ledger Pieces Badge replaced by Left Clue Box */}

          {/* Palm-Leaf Journal Button */}
          <button
            type="button"
            onClick={onOpenJournal}
            disabled={isTransitioning}
            tabIndex={isTransitioning ? -1 : 0}
            className="flex items-center gap-2 bg-gradient-to-r from-[#2c241c] to-[#3d3328] hover:from-[#3d3328] hover:to-[#4f4234] border-2 border-[#d4a359] text-[#f6ede0] font-serif font-bold px-3.5 py-2.5 rounded-xl shadow-[3px_3px_0_0_rgba(0,0,0,0.8)] active:translate-y-0.5 transition-all cursor-pointer text-xs uppercase tracking-wider disabled:pointer-events-none disabled:opacity-40 group"
            title="Open Historical Journal"
          >
            <GameIcon name="journal" size={15} className="text-[#d4a359] group-hover:scale-110 transition-transform" />
            <span>Journal ({unlockedJournalCount})</span>
          </button>

          {/* Dashboard Return Button */}
          <Link
            href="/dashboard"
            tabIndex={isTransitioning ? -1 : 0}
            className={`flex items-center gap-1.5 justify-center bg-[#1a1714]/90 hover:bg-[#2b2520] border-2 border-[#5a4d3f] hover:border-[#d4a359] text-[#d6c7b2] hover:text-[#f6ede0] px-3.5 py-2.5 rounded-xl shadow-[3px_3px_0_0_rgba(0,0,0,0.8)] active:translate-y-0.5 transition-all text-xs font-serif font-bold uppercase tracking-wider group ${
              isTransitioning ? "pointer-events-none opacity-40" : ""
            }`}
            title="Return to Campaign Hub"
          >
            <GameIcon name="hub" size={15} className="text-[#d4a359] group-hover:scale-110 transition-transform" />
            <span>Hub</span>
          </Link>

          {/* Reset Campaign Button */}
          <button
            type="button"
            onClick={onResetCampaign}
            disabled={isTransitioning}
            tabIndex={isTransitioning ? -1 : 0}
            className="flex items-center justify-center bg-[#1a1714]/90 hover:bg-[#381a17] border-2 border-[#5a4d3f] hover:border-[#c86446] text-[#a89985] hover:text-[#fca5a5] p-2.5 rounded-xl shadow-[3px_3px_0_0_rgba(0,0,0,0.8)] active:translate-y-0.5 transition-all cursor-pointer text-xs disabled:pointer-events-none disabled:opacity-40 group"
            title="Reset Vijayanagara Campaign Progress"
          >
            <GameIcon name="reset" size={15} className="group-hover:rotate-[-45deg] transition-transform" />
          </button>
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
