"use client";

import React, { useState } from "react";
import { WorldDefinition, SceneDefinition } from "../types/world";

interface HistoricalCodexModalProps {
  world: WorldDefinition;
  currentScene: SceneDefinition;
  discoveredClueIds: string[];
  onClose: () => void;
}

export default function HistoricalCodexModal({
  world,
  discoveredClueIds,
  onClose,
}: HistoricalCodexModalProps) {
  const [activeTab, setActiveTab] = useState<"evidence" | "insights" | "npcs" | "locations">("evidence");

  // Collect all discovered historical evidence across all scenes
  const discoveredEvidence = Object.values(world.scenes).flatMap((scene) =>
    scene.clues.filter((c) => discoveredClueIds.includes(c.id))
  );

  // Collect all NPCs talked to or present in the expedition
  const allNPCs = Object.values(world.scenes).flatMap((scene) => scene.npcs);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-200">
      <div className="bg-[#16120e] border-2 border-[#483824] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_16px_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#251d16] border-b border-[#3a2d1d] p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#91714b]">
              Interactive History Journal • {world.historicalEra}
            </span>
            <h2 className="text-xl font-serif text-[#e4c794] mt-0.5">{world.title} Codex</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#16120e] hover:bg-[#3a2d1d] text-[#e4c794] font-bold border border-[#483824] flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3a2d1d] bg-[#0a0806] px-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab("evidence")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "evidence"
                ? "border-[#91714b] text-[#e4c794] bg-[#16120e]"
                : "border-transparent text-gray-400 hover:text-[#e4c794]"
            }`}
          >
            📜 Historical Evidence ({discoveredEvidence.length})
          </button>

          <button
            onClick={() => setActiveTab("insights")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "insights"
                ? "border-[#91714b] text-[#e4c794] bg-[#16120e]"
                : "border-transparent text-gray-400 hover:text-[#e4c794]"
            }`}
          >
            💡 Learning Insights
          </button>

          <button
            onClick={() => setActiveTab("npcs")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "npcs"
                ? "border-[#91714b] text-[#e4c794] bg-[#16120e]"
                : "border-transparent text-gray-400 hover:text-[#e4c794]"
            }`}
          >
            👤 Historical Figures ({allNPCs.length})
          </button>

          <button
            onClick={() => setActiveTab("locations")}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "locations"
                ? "border-[#91714b] text-[#e4c794] bg-[#16120e]"
                : "border-transparent text-gray-400 hover:text-[#e4c794]"
            }`}
          >
            🏛️ Locations ({Object.keys(world.scenes).length})
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-[#a89985]">
          {/* TAB 1: HISTORICAL EVIDENCE */}
          {activeTab === "evidence" && (
            <div>
              {discoveredEvidence.length > 0 ? (
                <div className="space-y-4">
                  {discoveredEvidence.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#0a0806] border border-[#3a2d1d] p-4 rounded-xl space-y-2 shadow-inner"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-serif text-[#e4c794] font-bold">
                          {item.name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold bg-[#91714b]/20 text-[#e4c794] px-2 py-0.5 rounded border border-[#91714b]/40">
                          {item.category || "Primary Source"}
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{item.description}</p>
                      {item.historicalFact && (
                        <div className="bg-[#251d16]/80 border-l-2 border-[#91714b] p-2.5 rounded text-amber-200/90 font-medium">
                          <span className="font-bold text-[#e4c794]">Historical Fact: </span>
                          {item.historicalFact}
                        </div>
                      )}
                      {item.learningObjective && (
                        <p className="text-[11px] text-[#91714b] italic">
                          🎯 Learning Objective: {item.learningObjective}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="font-bold text-[#e4c794] mb-1">No Historical Evidence Discovered Yet</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Explore the environment, inspect primary sources, and speak with scholars to unlock historical evidence in your codex.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEARNING INSIGHTS */}
          {activeTab === "insights" && (
            <div className="space-y-4">
              <div className="bg-[#251d16]/60 border border-[#483824] p-4 rounded-xl">
                <h4 className="text-sm font-serif text-[#e4c794] font-bold mb-1">
                  Mission Objective: {world.quest.title}
                </h4>
                <p className="text-gray-300 mb-2">{world.quest.objective}</p>
                {world.quest.learningObjective && (
                  <p className="text-amber-200/90 font-medium text-[11px]">
                    🎯 <span className="font-bold">Core Learning Focus:</span> {world.quest.learningObjective}
                  </p>
                )}
              </div>

              {world.quest.keyInsights && world.quest.keyInsights.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#91714b] mb-2">
                    Key Historical Insights
                  </h4>
                  <div className="space-y-2">
                    {world.quest.keyInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0a0806] border border-[#3a2d1d] p-3 rounded-lg flex items-start gap-2.5"
                      >
                        <span className="text-amber-400 font-bold">💡</span>
                        <p className="text-gray-300 leading-snug">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORICAL FIGURES */}
          {activeTab === "npcs" && (
            <div className="space-y-3">
              {allNPCs.map((npc) => (
                <div
                  key={npc.id}
                  className="bg-[#0a0806] border border-[#3a2d1d] p-4 rounded-xl flex items-start gap-4"
                >
                  <img
                    src={npc.spriteUrl}
                    alt={npc.name}
                    className="w-12 h-16 object-contain bg-[#16120e] p-1 rounded-lg border border-[#251d16]"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-[#e4c794]">{npc.name}</h4>
                      <span className="text-[10px] bg-[#251d16] text-[#91714b] px-2 py-0.5 rounded border border-[#3a2d1d]">
                        {npc.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">{npc.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: LOCATIONS */}
          {activeTab === "locations" && (
            <div className="space-y-3">
              {Object.values(world.scenes).map((scene) => (
                <div
                  key={scene.id}
                  className="bg-[#0a0806] border border-[#3a2d1d] p-4 rounded-xl space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-[#e4c794]">{scene.name}</h4>
                    <span className="text-[10px] uppercase font-bold text-[#91714b]">
                      {scene.archetype}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-300">Period: </span>
                    {scene.historicalPeriod} • {scene.locationName}
                  </p>
                  {scene.historicalPurpose && (
                    <p className="text-gray-300 italic pt-1 border-t border-[#251d16]">
                      &quot;{scene.historicalPurpose}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#251d16] border-t border-[#3a2d1d] p-4 flex justify-between items-center text-xs">
          <span className="text-[#91714b] font-medium">
            Expedition Progress: {discoveredEvidence.length}/{world.quest.cluesRequired || 1} Evidence Discovered
          </span>
          <button
            onClick={onClose}
            className="bg-[#91714b] hover:bg-[#a68257] text-black font-bold py-2 px-5 rounded-lg transition-all uppercase tracking-wider text-[11px]"
          >
            Resume Investigation
          </button>
        </div>
      </div>
    </div>
  );
}
