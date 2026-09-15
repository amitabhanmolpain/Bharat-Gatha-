import React, { useState } from "react";
import { EvidenceItem, HistoricalContext, LearningObjective } from "../types/expedition";

interface HistoricalCodexModalProps {
  evidenceList: EvidenceItem[];
  historicalContext: HistoricalContext;
  learningObjectives: LearningObjective[];
  onClose: () => void;
}

export default function HistoricalCodexModal({
  evidenceList,
  historicalContext,
  learningObjectives,
  onClose
}: HistoricalCodexModalProps) {
  const [activeTab, setActiveTab] = useState<"evidence" | "facts" | "myths">("evidence");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs pointer-events-auto animate-in fade-in duration-200">
      <div className="bg-[#fff9e6] border-4 border-black rounded-xl max-w-2xl w-full h-[80vh] flex flex-col shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-[#f59e0b] border-b-4 border-black p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-xl font-serif font-bold text-black leading-tight">
                Historical Codex & Evidence Archive
              </h2>
              <p className="text-xs font-bold text-black/80">
                Discovered Facts & Primary Sources
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 border-2 border-black rounded-lg px-3 py-1 font-bold text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
          >
            ✕ Close
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-3 border-black bg-[#fef3c7]">
          <button
            onClick={() => setActiveTab("evidence")}
            className={`flex-1 py-2.5 font-black text-xs uppercase tracking-wider border-r-2 border-black transition-all cursor-pointer ${
              activeTab === "evidence" ? "bg-[#fff9e6] text-black border-b-4 border-b-[#d97706]" : "text-gray-800 hover:text-black"
            }`}
          >
            🔍 Discovered Evidence ({evidenceList.filter((e) => e.isDiscovered).length})
          </button>
          <button
            onClick={() => setActiveTab("facts")}
            className={`flex-1 py-2.5 font-black text-xs uppercase tracking-wider border-r-2 border-black transition-all cursor-pointer ${
              activeTab === "facts" ? "bg-[#fff9e6] text-black border-b-4 border-b-[#d97706]" : "text-gray-800 hover:text-black"
            }`}
          >
            📚 Historical Facts
          </button>
          <button
            onClick={() => setActiveTab("myths")}
            className={`flex-1 py-2.5 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "myths" ? "bg-[#fff9e6] text-black border-b-4 border-b-[#d97706]" : "text-gray-800 hover:text-black"
            }`}
          >
            🛡️ Debunked Myths
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {activeTab === "evidence" && (
            <div className="space-y-3">
              {evidenceList.length === 0 ? (
                <p className="text-black font-bold italic text-center py-8">No evidence items discovered yet. Explore the historical scene to find clues!</p>
              ) : (
                evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className={`border-3 border-black rounded-lg p-3.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${
                      ev.isDiscovered ? "bg-white" : "bg-[#fefce8] border-dashed"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {ev.isDiscovered
                          ? ev.iconType === "document" ? "📄" : ev.iconType === "map" ? "🗺️" : ev.iconType === "inscription" ? "🏛️" : "🗡️"
                          : "🔒"}
                      </span>
                      <h4 className="font-black text-sm text-black">{ev.isDiscovered ? ev.title : "??? (Undiscovered Clue)"}</h4>
                    </div>
                    {ev.isDiscovered ? (
                      <>
                        {ev.imageAsset && (
                          <div className="my-2 rounded-lg border-2 border-black/30 p-3 bg-[#fef3c7]/60 flex items-center justify-center min-h-[100px]">
                            <img
                              src={ev.imageAsset}
                              alt={ev.title}
                              style={{ imageRendering: "pixelated" }}
                              className="max-h-36 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                            />
                          </div>
                        )}
                        <p className="text-xs text-black font-semibold mb-2 leading-relaxed">{ev.description}</p>
                        <div className="bg-[#fef3c7] border-2 border-black/20 rounded-lg p-2.5 text-xs">
                          <span className="font-black text-[#92400e] block mb-0.5">Historical Fact:</span>
                          <span className="text-black font-extrabold leading-normal">{ev.historicalFact}</span>
                          {ev.sourceCitation && (
                            <p className="text-[11px] text-black font-mono font-bold mt-1.5 pt-1 border-t border-black/10">Source: {ev.sourceCitation}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-900 font-bold">Explore the historical scenes and inspect world objects to uncover this clue.</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "facts" && (
            <div className="space-y-4">
              <div className="bg-white border-3 border-black rounded-lg p-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                <h4 className="font-black text-sm text-black mb-2 flex items-center gap-1.5">
                  <span>📖</span> Factual Historical Context
                </h4>
                <p className="text-xs text-black leading-relaxed font-semibold">
                  {historicalContext.factualBackground}
                </p>
              </div>

              {learningObjectives.map((obj) => (
                <div key={obj.id} className="bg-[#fef3c7] border-3 border-black rounded-lg p-3.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                  <h5 className="font-black text-xs uppercase tracking-wider text-[#92400e] mb-1">{obj.factTitle}</h5>
                  <p className="text-xs text-black font-extrabold">{obj.historicalFact}</p>
                  {obj.citation && <p className="text-[11px] text-gray-900 font-mono font-bold mt-1">Citation: {obj.citation}</p>}
                </div>
              ))}
            </div>
          )}

          {activeTab === "myths" && (
            <div className="space-y-3">
              {historicalContext.historicalMythsDebunked.map((myth, idx) => (
                <div key={idx} className="bg-white border-3 border-black rounded-lg p-3.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-start gap-2.5">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <h5 className="font-black text-xs text-[#b91c1c] uppercase tracking-wider">Debunked Misconception #{idx + 1}</h5>
                    <p className="text-xs text-black font-extrabold mt-1">{myth}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
