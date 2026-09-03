"use client";

import React from "react";
import { LEDGER_FRAGMENTS } from "../constants";
import AccessibleModal from "./AccessibleModal";

interface LedgerAssemblyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToNarration: () => void;
}

export default function LedgerAssemblyModal({
  isOpen,
  onClose,
  onProceedToNarration,
}: LedgerAssemblyModalProps) {
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="ledger-assembly-title"
      maxWidthClass="max-w-3xl"
      containerClassName="p-6 md:p-8 border-[#d4a359] shadow-[0_0_60px_rgba(212,163,89,0.4)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#3d3328] border-2 border-[#d4a359] flex items-center justify-center text-3xl shadow-inner">
            📜
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.25em]">
              The Mystery Resolved • 3 of 3 Fragments Reunited
            </div>
            <h2 id="ledger-assembly-title" className="text-xl md:text-2xl font-serif font-bold text-[#f6ede0]">
              The Missing Merchant&apos;s Master Ledger
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-[#a89985] hover:text-[#f6ede0] text-sm bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          ✕ Close
        </button>
      </div>

      {/* 3 Fragments Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {LEDGER_FRAGMENTS.map((frag, idx) => (
          <div
            key={frag.id}
            className="p-3.5 rounded-xl bg-[#231e1a] border border-[#d4a359]/70 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl">{frag.sealIcon}</span>
                <span className="text-[9px] font-mono uppercase text-[#d4a359] bg-[#141210] px-2 py-0.5 rounded border border-[#383027]">
                  Fragment {idx + 1}/3
                </span>
              </div>
              <h3 className="text-xs font-serif font-bold text-[#f6ede0] mb-1">
                {frag.title}
              </h3>
              <div className="text-[10px] font-mono text-[#a89985] mb-2">
                Origin: {frag.stageName}
              </div>
              <p className="text-[11px] font-serif text-[#d6c7b2] italic leading-relaxed">
                &ldquo;{frag.clueText}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Master Revelation Text */}
      <div className="p-5 rounded-xl bg-[#26201b] border-2 border-[#5a4d3f] mb-6 space-y-3">
        <div className="text-xs font-mono text-[#d4a359] uppercase tracking-wider flex items-center gap-1.5">
          <span>✦</span>
          <span>Master Revelation: The True Treasury of Vijayanagara</span>
        </div>

        <p className="text-xs font-serif text-[#eedfc8] leading-relaxed">
          As the three palm-leaf folios click into alignment, Merchant Ramayya&apos;s cipher is unveiled:
        </p>

        <blockquote className="p-3.5 rounded-lg bg-[#1a1714] border-l-4 border-[#d4a359] text-xs font-serif italic text-[#f6ede0] leading-relaxed">
          &ldquo;To whoever reassembles this record across the ages: Gold may be looted, and granite palaces may weather to dust. But when darkness threatens the empire, the wise do not hoard bullion — they disperse seeds of knowledge. The royal endowments were safely transferred to endow our temples, craftsmen guilds, musical traditions, and scholar archives across the southern lands. What was hidden was not wealth, but continuity.&rdquo;
        </blockquote>

        <div className="text-[10px] font-mono text-[#8c7e6d] pt-1">
          * Historical Note: The merchant mystery is a campaign narrative thread exploring historical themes of cultural preservation and resilience.
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#383027]">
        <div className="text-xs font-mono text-[#d4a359]">
          ✦ Master Ledger Assembled & Preserved
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onProceedToNarration();
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider cursor-pointer"
        >
          Witness Battle of Talikota Chronicle ⚔️
        </button>
      </div>
    </AccessibleModal>
  );
}
