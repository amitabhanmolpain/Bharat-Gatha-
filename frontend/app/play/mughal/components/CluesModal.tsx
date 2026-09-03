"use client";

import React from "react";

export interface ClueItem {
  id: string;
  title: string;
  location: string;
  category: "Permit" | "Artifact" | "Architecture" | "Manuscript" | "Mystery";
  icon: string;
  discovered: boolean;
  discoveredAt?: string;
  description: string;
  hint: string;
}

export const MUGHAL_HISTORICAL_CLUES: ClueItem[] = [
  {
    id: "guard_permit",
    title: "Sentry's Royal Passage Permit",
    location: "Agra Fort - Amar Singh Gate",
    category: "Permit",
    icon: "📜",
    discovered: false,
    description:
      "A stamped imperial token from the Amar Singh Gate guard allowing passage into the inner ramp and Diwan-i-Khas. Mentions a mysterious foreigner spotted ascending toward the throne hall.",
    hint: "Converse with the Amar Singh Gate Guard and present your talent to gain entry."
  },
  {
    id: "pietra_dura_seal",
    title: "Pietra Dura Floral Inlay Parchment",
    location: "Diwan-i-Aam & Throne Chamber",
    category: "Artifact",
    icon: "💎",
    discovered: false,
    description:
      "Sketches of semi-precious lapis lazuli and jasper floral inlays crafted by Italian and Persian lapidaries under Shah Jahan. A message scribbled on the back points to the Palace of Mirrors.",
    hint: "Inspect the golden canopy throne in the imperial Diwan-i-Aam."
  },
  {
    id: "sheesh_mirror_shard",
    title: "Belgian Concave Mirror Shard",
    location: "Sheesh Mahal (Palace of Mirrors)",
    category: "Architecture",
    icon: "🪞",
    discovered: false,
    description:
      "A piece of concave silvered glass from the royal bathing chambers. When held to torchlight, it reveals the secret reflection geometry aligned with the Taj Mahal across the Yamuna.",
    hint: "Examine the central marble fountain in the Sheesh Mahal."
  },
  {
    id: "calligraphy_scroll",
    title: "Amanat Khan's Thuluth Calligraphy",
    location: "Taj Mahal - Darwaza-i-Rauza",
    category: "Manuscript",
    icon: "✒️",
    discovered: false,
    description:
      "A transcription of the Surah Al-Fajr verses inscribed along the Great Gate. The calligraphy gradually expands in scale towards the top to create the optical illusion of uniform size from the ground.",
    hint: "Approach the Great Gate of the Taj Mahal and solve the inscription puzzle."
  },
  {
    id: "charbagh_paradise_map",
    title: "Ustad Lahori's Four-Fold Paradise Map",
    location: "Taj Mahal - Charbagh Persian Gardens",
    category: "Architecture",
    icon: "🌺",
    discovered: false,
    description:
      "The architectural layout of the Charbagh garden representing the four rivers of Paradise flowing to the central marble water tank (Al Hawd al-Kawthar).",
    hint: "Examine the central lotus reflection pool in the Charbagh gardens."
  },
  {
    id: "mehtab_bagh_journal",
    title: "Archaeologist's Field Journal Entry",
    location: "Mehtab Bagh (Moonlight Garden)",
    category: "Mystery",
    icon: "🗺️",
    discovered: false,
    description:
      "Notes by Dr. Ananya detailing the octagonal moonlight viewing pavilion and eyewitness accounts of the traveler departing toward the Red Fort in Old Delhi.",
    hint: "Cross the Yamuna to Mehtab Bagh and talk with the Caretaker Archaeologist."
  }
];

interface CluesModalProps {
  discoveredIds: string[];
  onClose: () => void;
}

export default function CluesModal({ discoveredIds, onClose }: CluesModalProps) {
  const discoveredCount = discoveredIds.length;
  const totalCount = MUGHAL_HISTORICAL_CLUES.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#fff9ea] border-4 border-black rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b-3 border-black bg-amber-200/70 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔍</span>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight leading-none">Historical Clues & Chronicles</h2>
              <p className="text-xs font-bold text-gray-700 mt-1 uppercase tracking-wider">
                Mughal Empire · 1653 AD ({discoveredCount}/{totalCount} Discovered)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 border-2 border-black rounded-lg px-3 py-1 font-black text-xs text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            Esc · close
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-5 pt-3 pb-1 bg-amber-50">
          <div className="flex justify-between items-center text-xs font-black text-black mb-1.5">
            <span>Investigation Progress</span>
            <span>{Math.round((discoveredCount / totalCount) * 100)}%</span>
          </div>
          <div className="w-full bg-amber-100 border-2 border-black rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(discoveredCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Clues List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {MUGHAL_HISTORICAL_CLUES.map((clue, idx) => {
            const isFound = discoveredIds.includes(clue.id);

            return (
              <div 
                key={clue.id}
                className={`border-2 border-black rounded-xl p-3.5 transition-all shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${
                  isFound 
                    ? "bg-white" 
                    : "bg-gray-100/70 border-dashed border-gray-400 opacity-75 shadow-none"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center text-lg ${
                    isFound ? "bg-amber-300" : "bg-gray-200 text-gray-400"
                  }`}>
                    {isFound ? clue.icon : "?"}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-sm text-black leading-tight">
                          {isFound ? clue.title : `Undiscovered Clue #${idx + 1}`}
                        </h4>
                        <p className="text-[11px] font-bold text-gray-600 mt-0.5 uppercase tracking-wide">
                          📍 {clue.location}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-black ${
                        isFound ? "bg-emerald-200 text-emerald-900" : "bg-gray-200 text-gray-600 border-gray-400"
                      }`}>
                        {isFound ? "Discovered" : "Locked"}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-800 mt-2 leading-relaxed">
                      {isFound ? clue.description : `Hint: ${clue.hint}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-black bg-amber-100/60 flex justify-between items-center text-xs font-bold text-gray-700">
          <span>💡 Tip: Inspecting monuments and solving riddles uncovers hidden clues.</span>
          <button
            onClick={onClose}
            className="bg-amber-400 hover:bg-amber-500 border-2 border-black rounded-lg px-4 py-1.5 font-black text-xs text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            Continue Journey
          </button>
        </div>

      </div>
    </div>
  );
}
