"use client";

import React, { useState } from "react";

interface ToyInspectionPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  alreadyFoundFragment: boolean;
  onDiscoverFragment: () => void;
  onSelectJournalToy: (toyName: string) => void;
  hasJournalToy: boolean;
}

interface ToyItem {
  id: string;
  name: string;
  icon: string;
  material: string;
  description: string;
  angles: { [key: number]: string };
  undersideClue: string;
  hasSecretCompartment: boolean;
}

export default function ToyInspectionPuzzle({
  isOpen,
  onClose,
  alreadyFoundFragment,
  onDiscoverFragment,
  onSelectJournalToy,
  hasJournalToy,
}: ToyInspectionPuzzleProps) {
  const [selectedToyId, setSelectedToyId] = useState<string>("elephant");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isViewingUnderside, setIsViewingUnderside] = useState<boolean>(false);
  const [isLatchOpened, setIsLatchOpened] = useState<boolean>(alreadyFoundFragment);
  const [inspectedToys, setInspectedToys] = useState<string[]>(["elephant"]);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Examine the Kinhal artisan's wooden toys. Rotate and inspect the sides and bases for subtle craftsman seams."
  );

  if (!isOpen) return null;

  const toys: ToyItem[] = [
    {
      id: "doll",
      name: "Lacquered Kinhal Dancing Doll",
      icon: "🪆",
      material: "Polished Wrightia tinctoria wood & Tamarind lacquer",
      description: "A traditional dancing figurine painted with natural vermilion and turmeric mineral pigments.",
      angles: {
        0: "Front view: Ornate necklace and traditional temple attire painted in layered vegetal lacquer.",
        90: "Right profile: Slender wooden posture with carved flowing sari folds.",
        180: "Back view: Braided hair adorned with jasmine blossom carvings.",
        270: "Left profile: Graceful mudra hand gesture carved from a single piece of wood.",
      },
      undersideClue: "The base is solid, smooth, and bears Master Kallappa's artisan mark: 'Kinhal Guild 1520'.",
      hasSecretCompartment: false,
    },
    {
      id: "elephant",
      name: "Carved Royal Elephant Figurine",
      icon: "🐘",
      material: "Hand-chiseled seasoned teak & brass inlays",
      description: "A ceremonial royal tusker with a raised trunk and an ornate temple howdah seat.",
      angles: {
        0: "Front view: Raised trunk with floral forehead markings and polished brass tusk bands.",
        90: "Right flank: Royal saddlecloth carved with motifs of the mythical Yali beast.",
        180: "Rear view: Intricate bell hangings and rope harness carvings.",
        270: "Left flank: Notice a subtle grain discrepancy along the bottom edge of the belly.",
      },
      undersideClue: "Upon looking closely beneath the belly, there is a hairline seam and a concealed sliding wooden latch!",
      hasSecretCompartment: true,
    },
    {
      id: "chariot",
      name: "Miniature Temple Chariot Model",
      icon: "🛞",
      material: "Carved rosewood with revolving axles",
      description: "A scale replica of a stone temple chariot featuring four revolving carved wheels.",
      angles: {
        0: "Front view: Detailed tier-roofed mandapa with guardian figures.",
        90: "Side view: Spoke-carved wooden wheels connected by an intact central wooden peg.",
        180: "Rear view: Stepped stairs leading into the miniature sanctum.",
        270: "Opposite side: Precision-fitted wheel struts spinning smoothly on the axle.",
      },
      undersideClue: "The axle frame is firmly dowelled with solid brass pins. No hollow chambers are present.",
      hasSecretCompartment: false,
    },
  ];

  const currentToy = toys.find((t) => t.id === selectedToyId) || toys[0];

  const handleSelectToy = (toyId: string) => {
    setSelectedToyId(toyId);
    setRotationAngle(0);
    setIsViewingUnderside(false);
    if (!inspectedToys.includes(toyId)) {
      setInspectedToys((prev) => [...prev, toyId]);
    }
    setStatusMessage(`Now examining the ${toys.find((t) => t.id === toyId)?.name}.`);
  };

  const handleRotate = (delta: number) => {
    setIsViewingUnderside(false);
    setRotationAngle((prev) => (prev + delta + 360) % 360);
  };

  const handleOpenLatch = () => {
    if (currentToy.hasSecretCompartment && !isLatchOpened) {
      setIsLatchOpened(true);
      onDiscoverFragment();
      setStatusMessage(
        "✦ Click! The sliding wooden base opens, revealing a rolled palm-leaf parchment: FIRST LEDGER FRAGMENT — THE SCRIBE'S SEAL!"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Wooden Artisan Workbench Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#5a4d3f] p-6 shadow-[0_0_50px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3d3328] border border-[#d4a359] flex items-center justify-center text-2xl shadow-inner">
              🎨
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.2em]">
                Kinhal Artisan Workshop • Observation Puzzle
              </div>
              <h2 className="text-xl font-serif font-bold text-[#f6ede0]">
                Inspect Master Kallappa&apos;s Wooden Toys
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

        {/* Narrative Box */}
        <div className="p-3.5 rounded-xl bg-[#26201b] border border-[#473d32] text-xs font-serif leading-relaxed text-[#eedfc8] mb-5 flex items-start gap-3">
          <span className="text-2xl mt-0.5">🔍</span>
          <p className="flex-1 italic">{statusMessage}</p>
        </div>

        {/* Toy Selection Tabs */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {toys.map((toy) => {
            const isSelected = toy.id === selectedToyId;
            return (
              <button
                key={toy.id}
                onClick={() => handleSelectToy(toy.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? "bg-[#3d3328] border-[#d4a359] text-[#f6ede0] shadow-md"
                    : "bg-[#201c18] border-[#383027] text-[#a89985] hover:text-[#f6ede0] hover:bg-[#28231e]"
                }`}
              >
                <span className="text-2xl">{toy.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-serif font-bold truncate">{toy.name}</div>
                  <div className="text-[9px] font-mono text-[#d4a359] mt-0.5">
                    {inspectedToys.includes(toy.id) ? "Inspected ✦" : "Unexamined"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3D/2.5D Inspection Workbench */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-[#171412] rounded-xl border border-[#383027] mb-5">
          
          {/* Left: Visual Representation & Rotation Pedestal */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#211d19] rounded-xl border border-[#3d3329] relative min-h-[220px]">
            <div className="absolute top-2 left-2 text-[10px] font-mono text-[#a89985] uppercase">
              Orientation: {isViewingUnderside ? "Base / Underside" : `${rotationAngle}° Profile`}
            </div>

            {/* Rendered Visual Artifact */}
            <div className="my-6 text-7xl transform transition-transform duration-300 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              {currentToy.icon}
            </div>

            {/* Rotation Controls */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleRotate(-90)}
                className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] text-xs font-serif px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                title="Rotate Left"
              >
                ⟲ Rotate Left
              </button>
              <button
                onClick={() => setIsViewingUnderside((prev) => !prev)}
                className={`border text-xs font-serif px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isViewingUnderside
                    ? "bg-[#d4a359] text-[#141210] border-[#d4a359] font-bold"
                    : "bg-[#2b2520] hover:bg-[#3d3329] border-[#5a4d3f] text-[#f6ede0]"
                }`}
              >
                {isViewingUnderside ? "View Sides" : "Inspect Base 🔍"}
              </button>
              <button
                onClick={() => handleRotate(90)}
                className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] text-xs font-serif px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                title="Rotate Right"
              >
                Rotate Right ⟳
              </button>
            </div>
          </div>

          {/* Right: Observation Notes & Secret Chamber Trigger */}
          <div className="flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-wider mb-1">
                Craftsman Inspection Log
              </div>
              <h3 className="text-base font-serif font-bold text-[#f6ede0] mb-1">
                {currentToy.name}
              </h3>
              <div className="text-[11px] font-mono text-[#a89985] mb-3">
                Material: {currentToy.material}
              </div>

              {/* Dynamic Inspection Details */}
              <div className="p-3 rounded-lg bg-[#26201b] border border-[#473d32] text-xs font-serif text-[#eedfc8] leading-relaxed">
                {isViewingUnderside ? (
                  <div>
                    <span className="text-[#d4a359] font-bold block mb-1">Base Analysis:</span>
                    {currentToy.undersideClue}
                  </div>
                ) : (
                  <div>
                    <span className="text-[#d4a359] font-bold block mb-1">Side Analysis:</span>
                    {currentToy.angles[rotationAngle] || currentToy.description}
                  </div>
                )}
              </div>
            </div>

            {/* Secret Compartment Discovery Area */}
            {currentToy.hasSecretCompartment && isViewingUnderside && (
              <div className="p-3.5 rounded-xl bg-[#2e261f] border-2 border-[#d4a359] animate-fadeIn">
                <div className="text-xs font-serif font-bold text-[#d4a359] mb-1 flex items-center gap-1.5">
                  <span>🗝️</span>
                  <span>Concealed Wooden Sliding Latch Detected!</span>
                </div>
                <p className="text-[11px] font-serif text-[#d6c7b2] mb-3 leading-relaxed">
                  A hidden sliding compartment is disguised along the grain line of the elephant&apos;s base.
                </p>
                {!isLatchOpened ? (
                  <button
                    onClick={handleOpenLatch}
                    className="w-full bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Slide Open Secret Latch ✦
                  </button>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#1a1714] border border-[#5a4d3f] text-xs font-serif text-[#f6ede0] flex items-center gap-2">
                    <span className="text-xl">📜</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#d4a359]">First Ledger Fragment Retrieved!</div>
                      <div className="text-[10px] text-[#a89985]">Scribe&apos;s seal of the missing merchant.</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions & Keepsake Option */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#383027]">
          {/* Journal Toy Collectible Option */}
          <div className="flex items-center gap-2">
            {!hasJournalToy ? (
              <button
                onClick={() => onSelectJournalToy(currentToy.name)}
                className="text-xs font-serif bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#d4a359] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                🪆 Keep {currentToy.name} for Journal
              </button>
            ) : (
              <span className="text-[11px] font-mono text-[#d4a359]">
                ✓ Kinhal Wooden Keepsake added to Journal
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif px-6 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            {isLatchOpened ? "Complete Inspection & Return" : "Exit Workbench"}
          </button>
        </div>

      </div>
    </div>
  );
}
