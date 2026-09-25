import React, { useEffect } from "react";
import { narrationManager } from "../services/narrationManager";

interface NarratorPanelProps {
  text: string;
  tone?: "dramatic" | "informative" | "mysterious";
  onDismiss: () => void;
}

export default function NarratorPanel({ text, tone = "informative", onDismiss }: NarratorPanelProps) {
  const presentationId = `narrator_panel_${text.slice(0, 30)}`;

  useEffect(() => {
    if (text) {
      narrationManager.narrate(`narrator_panel_${text.slice(0, 30)}`, text, {
        type: "SCENE_INTRO",
        priority: 85,
        presentationId
      });
    }
    return () => {
      narrationManager.stopCurrentNarration("narrator-panel-unmount");
    };
  }, [text, presentationId]);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    narrationManager.unlockAudio();
    narrationManager.stopCurrentNarration("narrator-panel-dismiss");
    onDismiss();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs pointer-events-auto animate-in fade-in duration-200"
    >
      <div className="bg-[#fef3c7] border-4 border-black rounded-xl p-6 max-w-xl w-full shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative overflow-hidden">
        
        {/* Top Decorative Border */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-black/30">
          <span className="text-xl">📜</span>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#92400e]">
            Historical Narrator • {tone}
          </h3>
        </div>

        {/* Narrator Text */}
        <p className="text-black font-serif font-medium text-lg leading-relaxed mb-6 italic">
          &quot;{text}&quot;
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              void narrationManager.replay(presentationId);
            }}
            title="Replay Narrator Audio"
            className="bg-[#ffdc5e] hover:bg-[#f59e0b] text-black border-3 border-black rounded-lg px-4 py-2 font-black text-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>↻</span>
            <span>Replay</span>
          </button>
          <button
            onClick={handleDismiss}
            className="bg-[#d97706] hover:bg-[#b45309] text-white border-3 border-black rounded-lg px-5 py-2 font-bold text-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Continue Expedition</span>
            <span>➔</span>
          </button>
        </div>

      </div>
    </div>
  );
}
