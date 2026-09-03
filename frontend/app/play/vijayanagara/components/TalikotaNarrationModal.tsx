"use client";

import React from "react";

interface TalikotaNarrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToReflection: () => void;
}

export default function TalikotaNarrationModal({
  isOpen,
  onClose,
  onProceedToReflection,
}: TalikotaNarrationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Solemn Historical Chronicle Container */}
      <div className="relative w-full max-w-2xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#5a4d3f] p-6 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2b2520] border-2 border-[#c86446] flex items-center justify-center text-3xl shadow-inner">
              ⚔️
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#c86446] uppercase tracking-[0.25em]">
                Solemn Historical Chronicle • 1565 AD
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#f6ede0]">
                The Turning of Fortunes: Battle of Talikota
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#a89985] hover:text-[#f6ede0] text-sm bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Narrative Progression Sections */}
        <div className="space-y-4 mb-6 text-xs font-serif leading-relaxed text-[#eedfc8]">
          <div className="p-4 rounded-xl bg-[#26201b] border border-[#473d32]">
            <h4 className="text-sm font-serif font-bold text-[#d4a359] mb-1.5">
              The Winter of 1565 AD
            </h4>
            <p className="text-[#d6c7b2]">
              In January 1565, at the fateful plains of Rakkasagi-Tangadagi near the Krishna River, the formidable armies of the Vijayanagara Empire met the combined forces of the Deccan Sultanates. Despite centuries of military prowess, tactical shifts and leadership fractures altered the course of southern Indian history in a single day.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#26201b] border border-[#473d32]">
            <h4 className="text-sm font-serif font-bold text-[#d4a359] mb-1.5">
              The Fall of the Imperial Metropolis
            </h4>
            <p className="text-[#d6c7b2]">
              Following the battle, the grand metropolis of Vijayanagara on the southern bank of the Tungabhadra fell into ruins. The great bazaar colonnades grew silent, and the royal palaces ceased to echo with court ceremonies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#231e1a] border-2 border-[#d4a359]">
            <h4 className="text-sm font-serif font-bold text-[#f6ede0] mb-1.5">
              ✦ But Memory Endured
            </h4>
            <p className="text-[#eedfc8] italic">
              Empires of stone and gold may fall, but the soul of a people cannot be erased. The songs of Purandara Dasa, the Sanskrit and Telugu epics, the master stone carvings of Vittala, the Kinhal lacquered crafts, and the sacred temples continued to live in the hearts of succeeding generations.
            </p>
          </div>
        </div>

        {/* Action Button to Closing Reflection */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#383027]">
          <div className="text-[10px] font-mono text-[#a89985]">
            Chronicle Recorded in Palm-Leaf Journal
          </div>

          <button
            onClick={() => {
              onClose();
              onProceedToReflection();
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            Visit Pushkarani for Closing Reflection 🌅
          </button>
        </div>

      </div>
    </div>
  );
}
