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
        
        {/* Left: Quest & Stage Card */}
        <div className="pointer-events-auto bg-[#1a1714]/90 backdrop-blur-md border-2 border-[#5a4d3f] rounded-xl p-3.5 shadow-[4px_4px_0_0_rgba(0,0,0,0.8)] max-w-md w-full text-[#f6ede0] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d4a359]"></div>
          
          <div className="flex items-center justify-between gap-2 mb-1.5 pl-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#d4a359] font-bold">
              Stage {stage} • {currentStageMeta.era}
            </span>
            <span className="text-[10px] font-serif bg-[#2b2520] border border-[#5a4d3f] text-[#d6c7b2] px-2 py-0.5 rounded">
              {currentSceneMeta.title}
            </span>
          </div>

          <div className="pl-2">
            <h1 className="text-sm md:text-base font-serif font-bold text-[#f6ede0] truncate">
              {currentStageMeta.title}
            </h1>
            <p className="text-xs font-serif text-[#d6c7b2] mt-1 line-clamp-2">
              <span className="text-[#d4a359] font-bold">Objective: </span>
              {objective}
            </p>
          </div>
        </div>

        {/* Right: Actions, Mystery Ledger & Journal Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5 self-end md:self-auto">
          
          {/* Mystery Ledger Pieces Badge */}
          <div className="bg-[#1a1714]/90 backdrop-blur-md border-2 border-[#5a4d3f] rounded-xl px-3.5 py-2 text-center text-[#f6ede0] shadow-[3px_3px_0_0_rgba(0,0,0,0.8)]">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#d4a359]">
              Ledger Pieces
            </div>
            <div className="text-sm font-serif font-bold text-[#eedfc8] flex items-center justify-center gap-1.5 mt-0.5">
              <GameIcon name="ledger" size={14} className="text-[#d4a359]" />
              <span>{fragmentsCollectedCount}/3 Found</span>
            </div>
          </div>

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
