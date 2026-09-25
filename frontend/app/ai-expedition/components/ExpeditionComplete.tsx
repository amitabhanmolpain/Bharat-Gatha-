import React, { useEffect } from "react";
import { WorldDefinition } from "../types/expedition";
import { narrationManager } from "../services/narrationManager";
import { sfxManager } from "../services/sfxManager";

interface ExpeditionCompleteProps {
  world: WorldDefinition;
  discoveredCount: number;
  onExploreAnother: () => void;
}

export default function ExpeditionComplete({
  world,
  discoveredCount,
  onExploreAnother
}: ExpeditionCompleteProps) {
  const presentationId = `expedition_ending_${world.metadata.id}`;

  useEffect(() => {
    sfxManager.playDiscover();
    const endingText = world.expeditionEndingText || "Expedition complete. The Battle of Plassey reshaped the destiny of Bengal and the subcontinent.";
    narrationManager.narrate(`expedition_ending_${world.metadata.id}`, endingText, {
      type: "CRITICAL",
      priority: 100,
      forceRepeat: true,
      presentationId
    });
    return () => {
      narrationManager.stopCurrentNarration("expedition-complete-unmount");
    };
  }, [world, presentationId]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300">
      <div className="bg-[#fff9e6] border-4 border-black rounded-2xl p-8 max-w-2xl w-full shadow-[10px_10px_0_0_rgba(0,0,0,1)] text-center relative overflow-hidden">
        
        {/* Top Victory Badge */}
        <div className="inline-block bg-[#f59e0b] border-3 border-black rounded-full px-4 py-1 font-mono font-extrabold text-xs uppercase tracking-widest text-black mb-3">
          🏆 EXPEDITION COMPLETE
        </div>

        <h2 className="text-3xl font-serif font-extrabold text-black mb-2">
          {world.metadata.title}
        </h2>
        <p className="text-xs font-bold text-[#78350f] uppercase tracking-wider mb-6">
          {world.metadata.era} ({world.metadata.year}) • {world.metadata.location}
        </p>

        {/* Narrative Ending Summary */}
        <div className="bg-white border-3 border-black rounded-xl p-5 mb-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-left relative">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-sm text-black flex items-center gap-2">
              <span>📜</span> Historical Conclusion
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void narrationManager.replay(presentationId);
              }}
              className="text-[11px] bg-[#ffdc5e] hover:bg-[#f59e0b] text-black px-2.5 py-1 rounded-lg border-2 border-black font-extrabold flex items-center gap-1 cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
              title="Replay Ending Narration Audio"
            >
              <span>↻</span>
              <span>Replay</span>
            </button>
          </div>
          <p className="text-xs text-gray-800 font-medium leading-relaxed italic">
            &quot;{world.expeditionEndingText}&quot;
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#fef3c7] border-3 border-black rounded-lg p-3 text-center">
            <span className="text-2xl font-black text-black">{discoveredCount} / {world.evidence.length}</span>
            <p className="text-[10px] font-bold uppercase text-gray-700 tracking-wider mt-0.5">Evidence Discovered</p>
          </div>
          <div className="bg-[#fef3c7] border-3 border-black rounded-lg p-3 text-center">
            <span className="text-2xl font-black text-black">{world.learningObjectives.length}</span>
            <p className="text-[10px] font-bold uppercase text-gray-700 tracking-wider mt-0.5">Historical Insights Gained</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onExploreAnother}
          className="bg-[#d97706] hover:bg-[#b45309] text-white border-3 border-black rounded-xl px-8 py-3.5 font-bold text-base shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <span>✨ Explore Another Historical Moment</span>
        </button>

      </div>
    </div>
  );
}
