import React from "react";
import { WorldDefinition } from "../types/expedition";

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
        <div className="bg-white border-3 border-black rounded-xl p-5 mb-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-left">
          <h4 className="font-bold text-sm text-black mb-2 flex items-center gap-2">
            <span>📜</span> Historical Conclusion
          </h4>
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
          className="bg-[#d97706] hover:bg-[#b45309] text-white border-3 border-black rounded-xl px-8 py-3.5 font-bold text-base shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <span>✨ Explore Another Historical Moment</span>
        </button>

      </div>
    </div>
  );
}
