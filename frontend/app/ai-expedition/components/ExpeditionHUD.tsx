import React from "react";
import { WorldMetadata, QuestDefinition } from "../types/expedition";

interface ExpeditionHUDProps {
  metadata: WorldMetadata;
  activeQuest: QuestDefinition | null;
  discoveredCount: number;
  totalEvidenceCount: number;
  onOpenCodex: () => void;
  onRestart: () => void;
  onBackToGenerator: () => void;
}

export default function ExpeditionHUD({
  metadata,
  activeQuest,
  discoveredCount,
  totalEvidenceCount,
  onOpenCodex,
  onRestart,
  onBackToGenerator
}: ExpeditionHUDProps) {
  const currentObjective = activeQuest?.objectives.find((o) => !o.isCompleted) || activeQuest?.objectives[0];

  return (
    <header className="absolute top-4 left-4 right-4 z-40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pointer-events-none">
      {/* Expedition Header Card */}
      <div className="bg-[#fff9e6]/95 border-3 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] pointer-events-auto max-w-md backdrop-blur-sm">
        
        {/* Fallback Banner if Gemini API was unavailable */}
        {metadata.isFallback && (
          <div className="mb-2 bg-[#fef3c7] border border-[#b45309] rounded p-1.5 text-[11px] font-bold text-[#b45309] flex items-center gap-1.5" title={metadata.fallbackReason}>
            <span>⚠️</span>
            <span>Gemini unavailable — using development fallback</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-0.5">
          <span className="bg-[#d97706] text-white text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-black tracking-wider">
            {metadata.era} ({metadata.year})
          </span>
          <span className="text-xs font-bold text-[#78350f] font-mono">
            {metadata.archetype.replace("_", " ")}
          </span>
        </div>
        <h2 className="text-lg font-serif font-bold text-black leading-tight drop-shadow-sm truncate">
          {metadata.title}
        </h2>
        
        {/* Active Mission Banner */}
        {activeQuest && (
          <div className="mt-1.5 pt-1.5 border-t border-black/20 flex items-start gap-2">
            <span className="text-sm">🎯</span>
            <div className="text-xs">
              <span className="font-bold text-[#b45309] block uppercase tracking-wide">
                Objective: {activeQuest.title}
              </span>
              <p className="text-gray-800 font-medium">
                {currentObjective ? currentObjective.description : "Mission objectives completed!"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls Group */}
      <div className="flex items-center gap-2 pointer-events-auto self-end md:self-auto">
        <button
          onClick={onOpenCodex}
          className="bg-[#ffdc5e] hover:bg-[#eab308] border-3 border-black rounded-lg px-3.5 py-2 font-black text-xs text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="text-sm">📜</span>
          <span className="text-black font-extrabold text-xs tracking-wide">Codex</span>
          <span className="bg-black text-[#ffdc5e] text-[11px] font-mono font-black px-2 py-0.5 rounded-full ml-0.5">
            {discoveredCount}/{totalEvidenceCount}
          </span>
        </button>

        <button
          onClick={onRestart}
          title="Restart Expedition"
          className="bg-white hover:bg-gray-100 border-3 border-black rounded-lg px-3.5 py-2 font-black text-xs text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span className="text-sm">🔄</span>
          <span className="text-black font-extrabold text-xs tracking-wide">Restart</span>
        </button>

        <button
          onClick={onBackToGenerator}
          title="Exit Expedition"
          className="bg-[#ef4444] hover:bg-[#dc2626] border-3 border-black rounded-lg px-3.5 py-2 font-black text-xs text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span className="text-sm">🚪</span>
          <span className="text-white font-extrabold text-xs tracking-wide">Exit</span>
        </button>
      </div>
    </header>
  );
}
