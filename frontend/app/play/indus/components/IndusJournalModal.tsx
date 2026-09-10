"use client";

import React, { useState } from "react";
import { INDUS_JOURNAL_ENTRIES, INDUS_RELICS } from "../constants";

interface IndusJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedEntryIds: string[];
  relicsCount: number;
}

export default function IndusJournalModal({
  isOpen,
  onClose,
  unlockedEntryIds,
  relicsCount,
}: IndusJournalModalProps) {
  const [activeTab, setActiveTab] = useState<"journal" | "relics">("journal");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center text-2xl shadow-inner">
              📜
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                Harappan Archaeological Inscriptions
              </div>
              <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                Chronicles of the Indus Valley (c. 2500 BCE)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex gap-2 mb-4 border-b border-[#3e2e1f] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("journal")}
            className={`px-4 py-2 rounded-xl font-serif text-xs font-bold transition-all cursor-pointer ${
              activeTab === "journal"
                ? "bg-[#c29357] text-[#140f0b] shadow-md"
                : "bg-[#271e16] text-[#c9b7a1] hover:bg-[#382b1e]"
            }`}
          >
            📖 Inscriptions ({unlockedEntryIds.length}/{INDUS_JOURNAL_ENTRIES.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("relics")}
            className={`px-4 py-2 rounded-xl font-serif text-xs font-bold transition-all cursor-pointer ${
              activeTab === "relics"
                ? "bg-[#c29357] text-[#140f0b] shadow-md"
                : "bg-[#271e16] text-[#c9b7a1] hover:bg-[#382b1e]"
            }`}
          >
            🏺 Excavated Relics ({relicsCount}/{INDUS_RELICS.length})
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {activeTab === "journal" ? (
            INDUS_JOURNAL_ENTRIES.map((entry) => {
              const isUnlocked = unlockedEntryIds.includes(entry.id);

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isUnlocked
                      ? "bg-[#241c14] border-[#6b533a] shadow-sm"
                      : "bg-[#18130e] border-[#31251c] opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2e2319] border border-[#c29357] flex items-center justify-center text-xl shrink-0">
                      {isUnlocked ? entry.icon : "🔒"}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-serif font-bold text-[#fdfaf3]">
                          {isUnlocked ? entry.title : "Undiscovered Inscription"}
                        </h4>
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-[#16110d] text-[#c29357] border border-[#3e2e1f]">
                          {entry.category.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="text-xs font-serif leading-relaxed text-[#eedbbf] mb-1.5">
                        {isUnlocked
                          ? entry.historicalNote
                          : "Explore deeper into Mohenjo-daro and Dholavira to decode this ancient inscription."}
                      </p>

                      {isUnlocked && (
                        <div className="text-[10px] font-mono text-[#a8947d] italic">
                          ✦ {entry.gameplayContext}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            INDUS_RELICS.map((relic, idx) => {
              const isUnlocked = idx < relicsCount;

              return (
                <div
                  key={relic.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isUnlocked
                      ? "bg-[#241c14] border-[#c29357] shadow-sm"
                      : "bg-[#18130e] border-[#31251c] opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center text-2xl shrink-0">
                      {isUnlocked ? relic.icon : "🔒"}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-serif font-bold text-[#fdfaf3]">
                          {isUnlocked ? relic.name : "Unclaimed Artifact"}
                        </h4>
                        <span className="text-[10px] font-mono text-[#d8a86a]">
                          {relic.stageName}
                        </span>
                      </div>

                      <p className="text-xs font-serif text-[#eedbbf] mb-1">
                        {isUnlocked ? relic.description : "This relic awaits discovery in the ancient ruins."}
                      </p>

                      {isUnlocked && (
                        <p className="text-[11px] font-mono text-[#a8947d]">
                          ★ <strong>Significance:</strong> {relic.significance}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-[#3e2e1f] flex items-center justify-between text-[10px] font-mono text-[#a8947d]">
          <span>Indus-Saraswati Civilization • 2600–1900 BCE</span>
          <span>Verified RAG Historical Record</span>
        </div>
      </div>
    </div>
  );
}
