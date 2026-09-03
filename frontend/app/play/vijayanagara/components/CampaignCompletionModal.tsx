"use client";

import React from "react";
import Link from "next/link";
import AccessibleModal from "./AccessibleModal";

interface CampaignCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenJournal: () => void;
}

export default function CampaignCompletionModal({
  isOpen,
  onClose,
  onOpenJournal,
}: CampaignCompletionModalProps) {
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="campaign-completion-title"
      maxWidthClass="max-w-2xl"
      containerClassName="p-6 md:p-8 text-center border-[#d4a359] shadow-[0_0_70px_rgba(212,163,89,0.5)]"
    >
      {/* Sacred Keepsake Emblem */}
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#3d3328] to-[#141210] border-2 border-[#d4a359] flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(212,163,89,0.5)] animate-pulse">
        🦅
      </div>

      <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#d4a359] mb-1">
        Vijayanagara Empire Campaign Completed
      </div>

      <h2 id="campaign-completion-title" className="text-2xl md:text-3xl font-serif font-bold text-[#f6ede0] mb-2">
        A Legacy Preserved Across Time
      </h2>

      <div className="text-xs font-mono text-[#a89985] mb-6">
        1336 AD – 1565 AD • +1000 Historic XP • Master Chronicler
      </div>

      {/* Keepsake Reward Card */}
      <div className="p-4 rounded-xl bg-[#26201b] border-2 border-[#5a4d3f] text-left mb-6 space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-[#383027]">
          <span className="text-3xl">🪨</span>
          <div>
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-wider">
              Awarded Sacred Keepsake
            </div>
            <h3 className="text-sm font-serif font-bold text-[#f6ede0]">
              The Carved Gandaberunda Stone Seal of Vijayanagara
            </h3>
          </div>
        </div>

        <p className="text-xs font-serif text-[#d6c7b2] leading-relaxed">
          The mythical two-headed eagle of strength and resilience, engraved into polished Hampi granite. It symbolizes the eternal truth of this land: empires of stone may weather, but art, knowledge, literature, music, and people&apos;s memories live forever.
        </p>
      </div>

      {/* Campaign Milestones Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-center">
        <div className="p-2.5 rounded-lg bg-[#171412] border border-[#383027]">
          <span className="text-lg">🌊</span>
          <div className="text-[10px] font-serif font-bold text-[#f6ede0] mt-1">Stage 1: Anegundi</div>
          <div className="text-[9px] font-mono text-[#d4a359]">Where It Began</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#171412] border border-[#383027]">
          <span className="text-lg">💎</span>
          <div className="text-[10px] font-serif font-bold text-[#f6ede0] mt-1">Stage 2: Hampi Bazaar</div>
          <div className="text-[9px] font-mono text-[#d4a359]">Global Commerce</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#171412] border border-[#383027]">
          <span className="text-lg">🛞</span>
          <div className="text-[10px] font-serif font-bold text-[#f6ede0] mt-1">Stage 3: Vittala Temple</div>
          <div className="text-[9px] font-mono text-[#d4a359]">The Golden Age</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#171412] border border-[#383027]">
          <span className="text-lg">🏛️</span>
          <div className="text-[10px] font-serif font-bold text-[#f6ede0] mt-1">Stage 4: Mahanavami</div>
          <div className="text-[9px] font-mono text-[#d4a359]">Eternal Memory</div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 border-t border-[#383027]">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenJournal();
          }}
          className="w-full sm:w-auto bg-[#2b2520] hover:bg-[#3d3329] border border-[#d4a359] text-[#f6ede0] font-serif font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          🪶 Inspect Full Palm-Leaf Journal (15/15)
        </button>

        <Link
          href="/dashboard"
          className="w-full sm:w-auto bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-7 py-2.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer"
        >
          🏰 Return to Dashboard Hub
        </Link>
      </div>
    </AccessibleModal>
  );
}
