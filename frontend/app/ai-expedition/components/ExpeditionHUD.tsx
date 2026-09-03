"use client";

import React from "react";
import { WorldDefinition } from "../types/world";

interface ExpeditionHUDProps {
  world: WorldDefinition;
  currentSceneName: string;
  cluesCount: number;
  currentStageIndex: number;
  onOpenCodex?: () => void;
  onLeave: () => void;
}

export default function ExpeditionHUD({
  world,
  currentSceneName,
  cluesCount,
  currentStageIndex,
  onOpenCodex,
  onLeave,
}: ExpeditionHUDProps) {
  const currentStage = world.quest.stages[currentStageIndex] || world.quest.stages[world.quest.stages.length - 1];

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 font-sans">
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full gap-3">
        {/* Top-Left Mission Tracker */}
        <div className="pointer-events-auto bg-[#fff9e6] border-3 border-black rounded-lg p-3.5 max-w-md shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-black">
          <div className="flex items-center justify-between mb-1.5 border-b-2 border-black/15 pb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8a6835]">
              Historical Mission • {world.region} ({world.year})
            </span>
            <span className="bg-[#fef3c7] border border-black rounded text-[9px] font-bold px-1.5 py-0.5 text-amber-950">
              Stage {currentStageIndex + 1}/{world.quest.stages.length}
            </span>
          </div>
          <h4 className="font-bold text-black text-sm leading-tight mb-1">{world.quest.title}</h4>
          <p className="text-xs text-gray-800 font-medium leading-snug">
            {currentStage ? currentStage.description : world.quest.objective}
          </p>
          {world.quest.learningObjective && (
            <p className="text-[10px] text-amber-900 font-bold mt-1.5 pt-1 border-t border-black/10 flex items-center gap-1">
              <span>🎯 Focus:</span> {world.quest.learningObjective}
            </p>
          )}
        </div>

        {/* Top-Right Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <button
            onClick={onOpenCodex}
            className="bg-[#ffdc5e] hover:bg-[#ffcf33] border-3 border-black rounded-lg px-3 py-2 text-xs font-black text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-1.5"
          >
            <span>📜</span> Historical Codex
          </button>

          <div className="bg-[#fff9e6] border-3 border-black rounded-lg px-3.5 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            <span className="text-xs font-extrabold text-black uppercase tracking-wider">
              📍 {currentSceneName}
            </span>
          </div>

          <button
            onClick={onLeave}
            className="bg-white hover:bg-gray-100 border-3 border-black rounded-lg px-3 py-2 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all"
          >
            Esc - Exit
          </button>
        </div>
      </div>

      {/* Bottom Bar: Evidence Counter & Controls Hint */}
      <div className="flex justify-between items-end w-full">
        <button
          onClick={onOpenCodex}
          className="pointer-events-auto bg-[#fff9e6] hover:bg-[#ffedb3] border-3 border-black rounded-lg px-4 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center gap-2 text-left transition-all"
        >
          <span className="text-xl">📜</span>
          <div>
            <div className="text-[9px] font-black uppercase tracking-wider text-gray-700">Historical Evidence</div>
            <div className="text-xs font-bold text-black">
              {cluesCount} / {world.quest.cluesRequired} Discovered
            </div>
          </div>
        </button>

        <div className="pointer-events-auto bg-black/75 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-[11px] font-medium text-white/90">
          <span className="font-bold text-[#ffdc5e]">WASD / Arrow Keys</span> Move • <span className="font-bold text-[#ffdc5e]">[E]</span> Inspect Evidence & Talk
        </div>
      </div>
    </div>
  );
}
