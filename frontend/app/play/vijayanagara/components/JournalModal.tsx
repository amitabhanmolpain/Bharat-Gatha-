"use client";

import React, { useState } from "react";
import { JournalCategory, JournalEntry } from "../types";
import { JOURNAL_DATABASE, LEDGER_FRAGMENTS } from "../constants";
import AccessibleModal from "./AccessibleModal";

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedEntryIds: string[];
  collectedFragmentIds: string[];
}

export default function JournalModal({
  isOpen,
  onClose,
  unlockedEntryIds,
  collectedFragmentIds,
}: JournalModalProps) {
  const [activeCategory, setActiveCategory] = useState<JournalCategory>("FOUNDING");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const categories: { key: JournalCategory; label: string; icon: string }[] = [
    { key: "FOUNDING", label: "Founding", icon: "🌊" },
    { key: "CITY_AND_TRADE", label: "Trade & Bazaar", icon: "🏛️" },
    { key: "GOLDEN_AGE", label: "Golden Age", icon: "👑" },
    { key: "MEMORY_AND_FALL", label: "Memory & Fall", icon: "🌅" },
    { key: "MYSTERY", label: "Ledger Mystery", icon: "📜" },
  ];

  const categoryEntries = JOURNAL_DATABASE.filter((e) => e.category === activeCategory);
  const activeEntry: JournalEntry | undefined =
    categoryEntries.find((e) => e.id === selectedEntryId) || categoryEntries[0];

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="journal-modal-title"
      maxWidthClass="max-w-4xl"
      containerClassName="overflow-hidden"
    >
      {/* Header Ribbon with Temple Arch Geometry */}
      <div className="relative bg-gradient-to-r from-[#2c2621] via-[#3d3329] to-[#2c2621] px-6 py-4 border-b-2 border-[#5a4d3f] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5a4d3f]/60 border border-[#d4a359] flex items-center justify-center text-xl shadow-inner">
            🪶
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#d4a359]">
              Tale of the Tungabhadra • Historical Codex
            </div>
            <h2 id="journal-modal-title" className="text-xl md:text-2xl font-serif text-[#f6ede0] tracking-wide flex items-center gap-2">
              Vijayanagara Palm-Leaf Journal
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-lg bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] hover:border-[#d4a359] flex items-center justify-center text-[#e6d5bc] text-sm font-bold transition-all cursor-pointer shadow-md"
          aria-label="Close Journal"
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 px-6 py-3 bg-[#171412] border-b border-[#3d3329]">
        {categories.map((cat) => (
          <button
            type="button"
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key);
              setSelectedEntryId(null);
            }}
            aria-pressed={activeCategory === cat.key}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-serif tracking-wider uppercase transition-all cursor-pointer border ${
              activeCategory === cat.key
                ? "bg-[#5a4d3f] border-[#d4a359] text-[#f6ede0] shadow-[0_2px_10px_rgba(212,163,89,0.25)] font-bold"
                : "bg-[#201c18] border-[#383027] text-[#a89985] hover:text-[#f6ede0] hover:bg-[#2b2520]"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden bg-[#1a1714]">
        {/* Left Column: Entries List */}
        <div className="p-4 border-r border-[#383027] overflow-y-auto space-y-2 max-h-[50vh] md:max-h-[60vh]">
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#a89985] px-1 mb-2">
            Discovered Records ({categoryEntries.filter((e) => unlockedEntryIds.includes(e.id)).length}/{categoryEntries.length})
          </div>

          {categoryEntries.map((entry) => {
            const isUnlocked = unlockedEntryIds.includes(entry.id);
            const isSelected = activeEntry?.id === entry.id;

            return (
              <button
                type="button"
                key={entry.id}
                onClick={() => setSelectedEntryId(entry.id)}
                aria-pressed={isSelected}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? "bg-[#332b23] border-[#d4a359] text-[#f6ede0] shadow-md"
                    : isUnlocked
                    ? "bg-[#231e1a] border-[#383027] hover:border-[#5a4d3f] text-[#d6c7b2]"
                    : "bg-[#181512] border-[#29231e] text-[#6b6053] opacity-65"
                }`}
              >
                <span className="text-xl mt-0.5">{isUnlocked ? entry.icon : "🔒"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-serif font-bold truncate">
                    {isUnlocked ? entry.title : "Unrecorded Tablet"}
                  </div>
                  <div className="text-[10px] font-mono text-[#a89985] mt-0.5 truncate">
                    {isUnlocked ? "Historical Inscription" : "Explore campaign to uncover"}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Special Ledger Section for Mystery Tab */}
          {activeCategory === "MYSTERY" && (
            <div className="mt-4 pt-4 border-t border-[#383027]">
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#d4a359] px-1 mb-2">
                Merchant Ledger Pieces ({collectedFragmentIds.length}/3)
              </div>
              {LEDGER_FRAGMENTS.map((frag, idx) => {
                const isFound = collectedFragmentIds.includes(frag.id);
                return (
                  <div
                    key={frag.id}
                    className={`p-2.5 rounded-lg border mb-2 text-xs font-serif ${
                      isFound
                        ? "bg-[#2e261f] border-[#d4a359] text-[#f6ede0]"
                        : "bg-[#161311] border-[#29231e] text-[#6b6053]"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <span>{isFound ? frag.sealIcon : "🔒"}</span>
                      <span>Fragment #{idx + 1}: {isFound ? frag.title : "Hidden in " + frag.stageName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Reader Pane */}
        <div className="md:col-span-2 p-6 overflow-y-auto bg-gradient-to-b from-[#1e1b17] to-[#171412] flex flex-col justify-between max-h-[50vh] md:max-h-[60vh]">
          {activeEntry && unlockedEntryIds.includes(activeEntry.id) ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="text-3xl p-2 rounded-xl bg-[#2b2520] border border-[#5a4d3f]">
                  {activeEntry.icon}
                </div>
                <div>
                  <div className="text-[11px] font-mono tracking-widest text-[#d4a359] uppercase">
                    Category: {activeCategory.split("_").join(" ")}
                  </div>
                  <h3 className="text-lg md:text-xl font-serif text-[#f6ede0] font-bold">
                    {activeEntry.title}
                  </h3>
                </div>
              </div>

              {/* Palm-Leaf Inscription Styling */}
              <div className="p-4 rounded-xl bg-[#26201b] border-2 border-[#473d32] shadow-inner text-[#eedfc8] font-serif text-sm leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#d4a359]"></div>
                <p className="italic text-[#d4a359] text-xs mb-2 font-mono">
                  Historical Record & Archaeological Context:
                </p>
                <p>{activeEntry.historicalNote}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#1a1714] border border-[#383027] text-xs font-mono text-[#a89985]">
                <span className="text-[#d4a359] font-bold">Discovery Note: </span>
                {activeEntry.gameplayContext}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#8c7e6d]">
              <div className="text-4xl mb-3 opacity-40">🔒</div>
              <h4 className="text-base font-serif text-[#d4a359] mb-1">Tablet Inscription Sealed</h4>
              <p className="text-xs max-w-sm leading-relaxed">
                Continue your journey through the four stages of the Vijayanagara Empire to discover this historical record.
              </p>
            </div>
          )}

          {/* Bottom Inscription Seal Footer */}
          <div className="mt-6 pt-4 border-t border-[#383027] flex items-center justify-between text-[11px] font-mono text-[#8c7e6d]">
            <span>Hampi Archaeological Codex</span>
            <span className="text-[#d4a359]">Empires fall • Memory endures</span>
          </div>
        </div>
      </div>
    </AccessibleModal>
  );
}
