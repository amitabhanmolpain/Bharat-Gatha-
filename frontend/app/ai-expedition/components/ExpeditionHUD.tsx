"use client";

import React, { useState, useEffect } from "react";
import { ExpeditionMetadata, QuestDefinition } from "../types/expedition";
import { narrationManager } from "../services/narrationManager";

interface ExpeditionHUDProps {
  metadata?: ExpeditionMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  world?: any;
  currentSceneName?: string;
  cluesCount?: number;
  currentStageIndex?: number;
  onOpenCodex: () => void;
  onLeave?: () => void;
  activeQuest?: QuestDefinition | null;
  discoveredCount?: number;
  totalEvidenceCount?: number;
  onRestart?: () => void;
  onBackToGenerator?: () => void;
}

export default function ExpeditionHUD({
  metadata: propMetadata,
  world,
  activeQuest = null,
  discoveredCount = 0,
  totalEvidenceCount = 0,
  onOpenCodex,
  onRestart = () => {},
  onBackToGenerator = () => {}
}: ExpeditionHUDProps) {
  const metadata: ExpeditionMetadata = propMetadata || {
    id: world?.worldId || "world-1",
    title: world?.title || "Historical Expedition",
    era: world?.historicalEra || "Historical Era",
    year: String(world?.year || 1857),
    location: world?.region || "India",
    summary: world?.summary || "",
    archetype: "INVESTIGATION" as const,
    difficulty: "Intermediate" as const,
    estimatedPlaytimeMinutes: 10,
    createdAt: new Date().toISOString(),
    isFallback: false,
    fallbackReason: undefined
  };
  const [narrationEnabled, setNarrationEnabled] = useState(() => narrationManager.isEnabled());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeText, setActiveText] = useState<string | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const unsub = narrationManager.subscribe((state) => {
      setIsSpeaking(state.isSpeaking);
      setActiveText(state.activeText);
      setIsUnavailable(state.isUnavailable);
      setNarrationEnabled(state.isEnabled);
    });
    return () => unsub();
  }, []);

  const toggleNarration = () => {
    const nextState = !narrationEnabled;
    narrationManager.setEnabled(nextState);
    setNarrationEnabled(nextState);
  };

  const currentObjective = activeQuest?.objectives.find((o) => !o.isCompleted);

  const handleReplayObjective = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    narrationManager.unlockAudio();
    if (currentObjective) {
      const presId = `objective_replay_${currentObjective.id}`;
      const activePres = narrationManager.getActivePresentation();
      if (activePres && activePres.presentationId === presId) {
        void narrationManager.replay(presId);
      } else {
        narrationManager.narrate(`Your objective: ${currentObjective.description}`, {
          type: "OBJECTIVE",
          key: presId,
          priority: 100,
          presentationId: presId,
          forceRepeat: true
        });
      }
    }
  };

  return (
    <>
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
            {isSpeaking && (
              <span className="bg-[#b45309] text-white text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-black animate-pulse flex items-center gap-1 ml-auto">
                <span>🎙️</span>
                <span>NARRATOR</span>
              </span>
            )}
          </div>
          <h2 className="text-lg font-serif font-bold text-black leading-tight drop-shadow-sm truncate">
            {metadata.title}
          </h2>
          
          {/* Active Mission Banner */}
          {activeQuest && (
            <div className="mt-1.5 pt-1.5 border-t border-black/20 flex items-start gap-2 group">
              <button
                onClick={handleReplayObjective}
                title="Click to hear objective narrated"
                className="text-sm cursor-pointer hover:scale-125 transition-transform"
              >
                🎯
              </button>
              <div className="text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#b45309] block uppercase tracking-wide">
                    Objective: {activeQuest.title}
                  </span>
                  <button
                    onClick={handleReplayObjective}
                    className="text-[11px] bg-[#ffdc5e] hover:bg-[#f59e0b] text-black px-2 py-0.5 rounded border border-black font-extrabold ml-1 flex items-center gap-1 cursor-pointer shadow-xs active:translate-y-0.5"
                    title="Replay Narrator Audio for Objective"
                  >
                    <span>↻</span>
                    <span>Replay</span>
                  </button>
                </div>
                <p className="text-gray-800 font-medium">
                  {currentObjective ? currentObjective.description : "Mission objectives completed!"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Controls Group — Restyled to match Pre-defined Game Visual Grammar */}
        <div className="flex items-center gap-2 pointer-events-auto self-end md:self-auto">
          <button
            onClick={toggleNarration}
            title={narrationEnabled ? "Disable Male Narrator Audio" : "Enable Male Narrator Audio"}
            className={`border-3 border-black rounded-lg px-3.5 py-2 font-black text-xs shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer ${
              narrationEnabled ? "bg-[#3b82f6] text-white hover:bg-[#2563eb]" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className="text-sm">{narrationEnabled ? (isSpeaking ? "🔊" : "🔈") : "🔇"}</span>
            <span className="font-extrabold text-xs tracking-wide">{narrationEnabled ? "Audio ON" : "Audio OFF"}</span>
          </button>

          <button
            onClick={onOpenCodex}
            className="bg-[#ffdc5e] hover:bg-[#f59e0b] border-3 border-black rounded-lg px-3.5 py-2 font-black text-xs text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer"
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

      {/* Live Narrator Subtitle Overlay at Bottom Center */}
      {isSpeaking && activeText && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto max-w-2xl w-11/12 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-[#0f172a]/95 border-3 border-[#f59e0b] rounded-xl px-5 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-black shrink-0 flex items-center justify-center font-bold text-lg animate-pulse shadow-md border-2 border-black">
              🎙️
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-[#f59e0b] uppercase block mb-0.5">
                Male Historical Narrator
              </span>
              <p className="text-white font-serif text-sm leading-snug drop-shadow font-medium">
                &quot;{activeText}&quot;
              </p>
            </div>
            <button
              onClick={() => narrationManager.stop()}
              className="text-gray-300 hover:text-white text-xs font-bold px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded border border-white/20 cursor-pointer shrink-0 transition-colors"
              title="Skip Active Narration"
            >
              SKIP ⏩
            </button>
          </div>
        </div>
      )}

      {/* Subtle status if Speech Synthesis is blocked by browser */}
      {isUnavailable && !isSpeaking && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto max-w-md w-11/12 animate-in fade-in duration-200">
          <div className="bg-[#451a03]/95 border-2 border-[#f59e0b] rounded-lg px-4 py-2 text-center shadow-lg text-amber-200 text-xs font-mono font-bold flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>Narration unavailable on this browser</span>
          </div>
        </div>
      )}
    </>
  );
}
