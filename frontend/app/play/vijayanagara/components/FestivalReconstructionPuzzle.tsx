"use client";

import React, { useState } from "react";
import AccessibleModal from "./AccessibleModal";

interface FestivalReconstructionPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  alreadyRestored: boolean;
}

interface FestivalElement {
  id: string;
  name: string;
  icon: string;
  description: string;
  targetZoneId: string;
}

interface DropZone {
  id: string;
  name: string;
  hint: string;
}

const FESTIVAL_ELEMENTS: FestivalElement[] = [
  {
    id: "elephants",
    name: "Caparisoned Royal Elephants",
    icon: "🐘",
    description: "Ceremonial tuskers carrying gold-embroidered howdahs along the grand procession aisle.",
    targetZoneId: "zone_aisle",
  },
  {
    id: "dancers",
    name: "Kolata Folk Stick Dancers",
    icon: "💃",
    description: "Dancers in concentric rings performing rhythmic stick folk dances to festive beats.",
    targetZoneId: "zone_arena",
  },
  {
    id: "drummers",
    name: "Temple Mridangam Drummers",
    icon: "🪘",
    description: "Master percussionists creating thunderous rhythmic tempos near the stone pillars.",
    targetZoneId: "zone_dais",
  },
  {
    id: "royals",
    name: "Imperial Court Nobles & Kings",
    icon: "👑",
    description: "Royal dignitaries and foreign emissaries observing the 9-day spectacle from the high pavilion.",
    targetZoneId: "zone_tier",
  },
];

const DROP_ZONES: DropZone[] = [
  { id: "zone_tier", name: "Upper Imperial Viewing Dais", hint: "Reserved for the King and Royal Dignitaries" },
  { id: "zone_arena", name: "Central Festival Arena", hint: "Open courtyard for Kolata folk stick dancers" },
  { id: "zone_dais", name: "Music & Rhythm Mandapa", hint: "Pillar base for percussionists and horn blowers" },
  { id: "zone_aisle", name: "Grand Procession Carpet", hint: "Wide ceremonial route for the royal tuskers" },
];

export default function FestivalReconstructionPuzzle({
  isOpen,
  onClose,
  onComplete,
  alreadyRestored,
}: FestivalReconstructionPuzzleProps) {
  const [placedElements, setPlacedElements] = useState<Record<string, string>>(
    alreadyRestored
      ? {
          zone_tier: "royals",
          zone_arena: "dancers",
          zone_dais: "drummers",
          zone_aisle: "elephants",
        }
      : {}
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(alreadyRestored);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Reconstruct the 16th-century Mahanavami festival memory. Place each ceremonial element into its proper festival position."
  );

  const handleSelectElement = (elemId: string) => {
    if (isFinished) return;
    setSelectedElementId(elemId);
    const elem = FESTIVAL_ELEMENTS.find((e) => e.id === elemId);
    if (elem) {
      setStatusMessage(`Selected: ${elem.name}. Now select where this group belongs in the festival celebration.`);
    }
  };

  const handleZoneClick = (zoneId: string) => {
    if (isFinished || !selectedElementId) return;

    const elem = FESTIVAL_ELEMENTS.find((e) => e.id === selectedElementId);
    if (!elem) return;

    if (elem.targetZoneId === zoneId) {
      // Correct Placement
      const nextPlaced = { ...placedElements, [zoneId]: elem.id };
      setPlacedElements(nextPlaced);
      setSelectedElementId(null);
      setStatusMessage(`✦ Correct! ${elem.name} takes their rightful place in the festival.`);

      // Check if all 4 are placed
      if (Object.keys(nextPlaced).length === 4) {
        setIsFinished(true);
        setStatusMessage("✦ Magnificent! The imperial Mahanavami celebration is fully reconstructed in vivid memory!");
        onComplete();
      }
    } else {
      // Incorrect Placement
      setStatusMessage(`Not quite — consider the role of ${elem.name} during the 9-day imperial celebration.`);
    }
  };

  const remainingElements = FESTIVAL_ELEMENTS.filter(
    (elem) => !Object.values(placedElements).includes(elem.id)
  );

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="festival-puzzle-title"
      maxWidthClass="max-w-3xl"
      containerClassName="p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3d3328] border border-[#d4a359] flex items-center justify-center text-2xl shadow-inner">
            🎪
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.2em]">
              Mahanavami Dibba • Memory Reconstruction
            </div>
            <h2 id="festival-puzzle-title" className="text-xl font-serif font-bold text-[#f6ede0]">
              Reconstruct the Grand Festival (1565 AD)
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

      {/* Narrative Box */}
      <div className="p-3.5 rounded-xl bg-[#26201b] border border-[#473d32] text-xs font-serif leading-relaxed text-[#eedfc8] mb-5 flex items-start gap-3">
        <span className="text-2xl mt-0.5">🕯️</span>
        <p className="flex-1 italic">{statusMessage}</p>
      </div>

      {/* Available Elements Tray */}
      {!isFinished && (
        <div className="mb-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#d4a359] mb-2">
            Available Ceremonial Groups:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {remainingElements.map((elem) => {
              const isSelected = selectedElementId === elem.id;

              return (
                <button
                  type="button"
                  key={elem.id}
                  onClick={() => handleSelectElement(elem.id)}
                  aria-pressed={isSelected}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-[#3d3328] border-[#d4a359] text-[#f6ede0] scale-105 shadow-md"
                      : "bg-[#201c18] border-[#383027] text-[#a89985] hover:text-[#f6ede0] hover:bg-[#28231e]"
                  }`}
                >
                  <span className="text-3xl mb-1">{elem.icon}</span>
                  <span className="text-xs font-serif font-bold leading-tight">{elem.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reconstruction Zones Grid (Accessible Buttons) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-4 bg-[#171412] rounded-xl border border-[#383027] mb-5">
        {DROP_ZONES.map((zone) => {
          const placedElemId = placedElements[zone.id];
          const placedElem = FESTIVAL_ELEMENTS.find((e) => e.id === placedElemId);

          return (
            <button
              type="button"
              key={zone.id}
              onClick={() => handleZoneClick(zone.id)}
              disabled={isFinished || (!!placedElem && !selectedElementId)}
              aria-label={`${zone.name}: ${placedElem ? `Placed ${placedElem.name}` : zone.hint}`}
              className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3.5 min-h-[90px] cursor-pointer ${
                placedElem
                  ? "bg-[#26201b] border-[#d4a359] text-[#f6ede0] shadow-md"
                  : selectedElementId
                  ? "bg-[#211d19] border-dashed border-[#d4a359]/60 hover:border-[#d4a359] hover:bg-[#2a241f] focus:outline-none focus:border-[#d4a359]"
                  : "bg-[#1c1815] border-[#2f2821] text-[#8c7e6d]"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#141210] border border-[#383027] flex items-center justify-center text-2xl shadow-inner shrink-0">
                {placedElem ? placedElem.icon : "✦"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-serif font-bold text-[#eedfc8]">
                  {zone.name}
                </div>
                <div className="text-[10px] font-mono text-[#a89985] mt-0.5">
                  {placedElem ? `Placed: ${placedElem.name} ✓` : zone.hint}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Guidance & Acceptance */}
      <div className="flex items-center justify-between pt-3 border-t border-[#383027]">
        <div className="text-xs font-mono text-[#d4a359]">
          {isFinished
            ? "✦ Festival Flashback Restored"
            : `Placed: ${Object.keys(placedElements).length} / 4 elements`}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif px-6 py-2 rounded-xl text-xs transition-all cursor-pointer"
        >
          {isFinished ? "Return to Present Ruins" : "Exit Puzzle"}
        </button>
      </div>
    </AccessibleModal>
  );
}
