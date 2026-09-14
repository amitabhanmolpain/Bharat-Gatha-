"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AccessibleModal from "./AccessibleModal";
import GameIcon, { GameIconType } from "./GameIcon";
import ChariotSvg from "./ChariotSvg";
import { playCharacterDialogue, stopAllCharacterVoice } from "../../../../services/characterVoiceService";
import { soundFx } from "../../../../services/soundService";

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
  icon: GameIconType;
  material: string;
  description: string;
  angles: { [key: number]: string };
  undersideClue: string;
  hasSecretCompartment: boolean;
}

const TOYS: ToyItem[] = [
  {
    id: "doll",
    name: "Lacquered Kinhal Dancing Doll",
    icon: "artisan",
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
    name: "Royal Caparisoned War Elephant",
    icon: "crown",
    material: "Carved Hale wood, gold foil inlay & herbal resin",
    description: "A ceremonial tusker toy carrying a miniature howdah. Unusually heavy at its base.",
    angles: {
      0: "Front view: Carved trunk raised in royal salutation with gilded tusk tips.",
      90: "Right profile: Embroidered saddlecloth detailing and fine wood-joint seams along the bottom edge.",
      180: "Back view: Symmetrical tail ornament and bell tassels painted in saffron yellow.",
      270: "Left profile: A hairline seam is visible where the wooden pedestal joins the feet.",
    },
    undersideClue: "The wooden base has an intricate floral engraving with an off-center wooden sliding latch.",
    hasSecretCompartment: true,
  },
  {
    id: "chariot",
    name: "Miniature Stone Chariot Model",
    icon: "wheel",
    material: "Lightweight balsa wood painted to mimic Hampi granite",
    description: "A handcrafted replica of the Garuda shrine at Vittala Temple with revolving toy wheels.",
    angles: {
      0: "Front view: Miniature elephant guards flanking the entrance steps.",
      90: "Right profile: Carved concentric wheel spokes inspired by the Sun Temple motifs.",
      180: "Back view: Terraced gopuram tower with delicate finial carvings.",
      270: "Left profile: Rotating wheel axle fixed securely with a brass pin.",
    },
    undersideClue: "The base is carved with Kannada numerals: '1540 AD — Golden Age'. Solid wood throughout.",
    hasSecretCompartment: false,
  },
];

export default function ToyInspectionPuzzle({
  isOpen,
  onClose,
  alreadyFoundFragment,
  onDiscoverFragment,
  onSelectJournalToy,
  hasJournalToy,
}: ToyInspectionPuzzleProps) {
  const [selectedToyId, setSelectedToyId] = useState<string>("elephant");
  const [rotationAngle, setRotationAngle] = useState<number>(0); // Unbounded angle for smooth CSS rotation
  const [isViewingUnderside, setIsViewingUnderside] = useState<boolean>(false);
  const [isLatchOpened, setIsLatchOpened] = useState<boolean>(alreadyFoundFragment);
  const [inspectedToys, setInspectedToys] = useState<string[]>(["elephant"]);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Examine the Kinhal artisan's wooden toys. Rotate and inspect the sides and bases for subtle craftsman seams."
  );

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const currentToy = TOYS.find((t) => t.id === selectedToyId) || TOYS[1];

  const triggerVoice = useCallback((textToSpeak: string) => {
    const trimmed = textToSpeak?.trim();
    if (!trimmed) return;
    const reqId = ++requestIdRef.current;
    
    stopAllCharacterVoice();
    setIsSpeaking(false);
    setIsLoadingVoice(true);
    
    playCharacterDialogue({
      character: "kallappa",
      text: trimmed,
      onStart: () => {
        if (isMountedRef.current && requestIdRef.current === reqId) {
          setIsSpeaking(true);
          setIsLoadingVoice(false);
        }
      },
      onEnd: () => {
        if (isMountedRef.current && requestIdRef.current === reqId) {
          setIsSpeaking(false);
          setIsLoadingVoice(false);
        }
      },
      onError: () => {
        if (isMountedRef.current && requestIdRef.current === reqId) {
          setIsSpeaking(false);
          setIsLoadingVoice(false);
        }
      }
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      triggerVoice("Examine the Kinhal artisan's wooden toys. Rotate and inspect the sides and bases for subtle craftsman seams.");
    }
    return () => {
      isMountedRef.current = false;
      stopAllCharacterVoice();
      requestIdRef.current++;
    };
  }, [isOpen, triggerVoice]);

  const handleStopVoice = () => {
    requestIdRef.current++;
    stopAllCharacterVoice();
    setIsSpeaking(false);
    setIsLoadingVoice(false);
  };

  const handleSelectToy = (toyId: string) => {
    if (isRotating) return;
    soundFx.playSelect();
    setSelectedToyId(toyId);
    setRotationAngle(0);
    setIsViewingUnderside(false);
    if (!inspectedToys.includes(toyId)) {
      setInspectedToys((prev) => [...prev, toyId]);
    }
    const toy = TOYS.find((t) => t.id === toyId);
    if (toy) {
      const msg = `Inspecting ${toy.name}. Rotate to examine craftsmanship from every angle.`;
      setStatusMessage(msg);
      triggerVoice(msg);
    }
  };

  const getNormalizedAngle = (angle: number) => ((angle % 360) + 360) % 360;

  const handleRotate = (delta: number) => {
    if (isRotating) return;
    setIsRotating(true);
    soundFx.playSelect();
    setIsViewingUnderside(false);
    
    // Use unbounded angle for smooth visual CSS transition
    const newAbsoluteAngle = rotationAngle + delta;
    setRotationAngle(newAbsoluteAngle);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsRotating(false);
        const normalizedAngle = getNormalizedAngle(newAbsoluteAngle);
        const observation = currentToy.angles[normalizedAngle] || currentToy.description;
        triggerVoice(observation);
      }
    }, 700);
  };

  const handleInspectBase = () => {
    if (isRotating) return;
    setIsRotating(true);
    soundFx.playSelect();
    
    setIsViewingUnderside((prev) => {
      const isNowUnderside = !prev;
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsRotating(false);
          if (isNowUnderside) {
            triggerVoice(currentToy.undersideClue);
          } else {
            const normalizedAngle = getNormalizedAngle(rotationAngle);
            const observation = currentToy.angles[normalizedAngle] || currentToy.description;
            triggerVoice(observation);
          }
        }
      }, 700);
      return isNowUnderside;
    });
  };

  const handleOpenLatch = () => {
    if (isLatchOpened) return;
    if (typeof soundFx.playKeyboardClick === "function") soundFx.playKeyboardClick(1.2);
    setIsLatchOpened(true);
    const msg = "Click! The secret base slides open to reveal a tightly rolled palm-leaf folio bearing the scribe's seal!";
    setStatusMessage(msg);
    triggerVoice(msg);
    onDiscoverFragment();
  };

  const handleClose = () => {
    handleStopVoice();
    onClose();
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleClose}
      titleId="toy-inspection-title"
      maxWidthClass="max-w-3xl"
      containerClassName="p-6 md:p-8"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#2e261f] border border-[#c86446] flex items-center justify-center shadow-inner">
            <GameIcon name="artisan" size={22} className="text-[#d4a359]" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.2em]">
              Kinhal Craft Guild • Workbench (c. 1520 AD)
            </div>
            <h2 id="toy-inspection-title" className="text-xl md:text-2xl font-serif font-bold text-[#f6ede0]">
              Handcrafted Wooden Toy Inspection
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="text-[#a89985] hover:text-[#f6ede0] text-sm bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <GameIcon name="close" size={14} /> Exit
        </button>
      </div>

      {/* Narrative Box */}
      <div className="p-3.5 rounded-xl bg-[#26201b] border border-[#473d32] text-xs font-serif leading-relaxed text-[#eedfc8] mb-5 flex items-start gap-3">
        <GameIcon name="search" size={24} className="text-[#d4a359] mt-0.5" />
        <p className="flex-1 italic">{statusMessage}</p>
      </div>

      {/* Toy Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-5">
        {TOYS.map((toy) => {
          const isSelected = toy.id === selectedToyId;
          return (
            <button
              type="button"
              key={toy.id}
              onClick={() => handleSelectToy(toy.id)}
              aria-pressed={isSelected}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                isSelected
                  ? "bg-[#3d3328] border-[#d4a359] text-[#f6ede0] shadow-md"
                  : "bg-[#201c18] border-[#383027] text-[#a89985] hover:text-[#f6ede0] hover:bg-[#28231e]"
              }`}
            >
              <GameIcon name={toy.icon} size={24} className={isSelected ? "text-[#d4a359]" : "text-[#8b7d6b]"} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-serif font-bold truncate">{toy.name}</div>
                <div className="text-[9px] font-mono text-[#d4a359] mt-0.5 flex items-center gap-1">
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
        <div className="flex flex-col items-center justify-center p-6 bg-[#211d19] rounded-xl border border-[#3d3329] relative min-h-[260px] overflow-hidden">
          <div className="absolute top-2 left-2 text-[10px] font-mono text-[#a89985] uppercase z-20">
            Orientation: {isViewingUnderside ? "Base / Underside" : `${getNormalizedAngle(rotationAngle)}° Profile`}
          </div>

          {/* Rendered Visual Artifact */}
          <div 
            className={`my-6 transform transition-all duration-700 ease-in-out flex items-center justify-center ${isRotating ? "scale-[0.98] drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)]" : "drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] scale-100"}`}
            style={{ 
              transform: `rotateX(${isViewingUnderside ? 75 : 0}deg) rotateY(${rotationAngle}deg)`,
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center'
            }}
          >
            {currentToy.id === "chariot" ? (
              <ChariotSvg className="w-32 h-32 text-[#c89a50]" />
            ) : (
              <GameIcon name={currentToy.icon} size={80} className="text-[#c89a50]" />
            )}
          </div>

          {/* Rotation Controls */}
          <div className="flex gap-2 mt-auto relative z-10">
            <button
              type="button"
              onClick={() => handleRotate(-90)}
              disabled={isRotating}
              className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] disabled:opacity-50 disabled:cursor-not-allowed text-[#f6ede0] text-xs font-serif px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title="Rotate Left"
            >
              <GameIcon name="rotate_cw" size={14} className="scale-x-[-1]" /> Rotate Left
            </button>
            <button
              type="button"
              onClick={handleInspectBase}
              disabled={isRotating}
              className={`border text-xs font-serif px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer ${
                isViewingUnderside
                  ? "bg-[#d4a359] text-[#141210] border-[#d4a359] font-bold"
                  : "bg-[#2b2520] hover:bg-[#3d3329] border-[#5a4d3f] text-[#f6ede0]"
              }`}
            >
              {isViewingUnderside ? "View Sides" : <><GameIcon name="search" size={14} /> Inspect Base</>}
            </button>
            <button
              type="button"
              onClick={() => handleRotate(90)}
              disabled={isRotating}
              className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] disabled:opacity-50 disabled:cursor-not-allowed text-[#f6ede0] text-xs font-serif px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title="Rotate Right"
            >
              Rotate Right <GameIcon name="rotate_cw" size={14} />
            </button>
          </div>
        </div>

        {/* Right: Observation Notes & Secret Chamber Trigger */}
        <div className="flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-wider">
                Craftsman Inspection Log
              </div>
              
              {/* TTS Audio Control */}
              <button
                onClick={isSpeaking || isLoadingVoice ? handleStopVoice : () => {
                  const txt = isViewingUnderside 
                    ? currentToy.undersideClue 
                    : (currentToy.angles[getNormalizedAngle(rotationAngle)] || currentToy.description);
                  triggerVoice(txt);
                }}
                className="flex items-center justify-center p-1.5 rounded-md bg-[#2e261f] border border-[#5a4d3f] hover:bg-[#3d3329] transition-colors cursor-pointer"
                title={isSpeaking ? "Stop Voice" : "Play Voice"}
              >
                {isLoadingVoice ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-[#c89a50] animate-pulse" />
                ) : isSpeaking ? (
                  <GameIcon name="volume" size={14} className="text-[#d4a359]" />
                ) : (
                  <GameIcon name="volume_x" size={14} className="text-[#8b7d6b]" />
                )}
              </button>
            </div>
            
            <h3 className="text-base font-serif font-bold text-[#f6ede0] mb-1">
              {currentToy.name}
            </h3>
            <div className="text-[11px] font-mono text-[#a89985] mb-3">
              Material: {currentToy.material}
            </div>

            <div className="p-3 rounded-lg bg-[#26201b] border border-[#473d32] text-xs font-serif text-[#eedfc8] leading-relaxed transition-opacity duration-300">
              {isViewingUnderside ? (
                <div>
                  <span className="text-[#d4a359] font-bold block mb-1">Base Analysis:</span>
                  <div className={isRotating ? "opacity-50" : "opacity-100 transition-opacity"}>
                    {currentToy.undersideClue}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-[#d4a359] font-bold block mb-1">Side Analysis:</span>
                  <div className={isRotating ? "opacity-50" : "opacity-100 transition-opacity"}>
                    {currentToy.angles[getNormalizedAngle(rotationAngle)] || currentToy.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secret Compartment Discovery Area */}
          {currentToy.hasSecretCompartment && isViewingUnderside && (
            <div className="p-3.5 rounded-xl bg-[#2e261f] border-2 border-[#d4a359] animate-fadeIn">
              <div className="text-xs font-serif font-bold text-[#d4a359] mb-1 flex items-center gap-1.5">
                <GameIcon name="key" size={14} />
                <span>Concealed Wooden Sliding Latch Detected!</span>
              </div>
              <p className="text-[11px] font-serif text-[#d6c7b2] mb-3 leading-relaxed">
                A hidden sliding compartment is disguised along the grain line of the elephant&apos;s base.
              </p>
              {!isLatchOpened ? (
                <button
                  type="button"
                  onClick={handleOpenLatch}
                  className="w-full bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <GameIcon name="search" size={14} /> Slide Open Secret Latch
                </button>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#1a1714] border border-[#5a4d3f] text-xs font-serif text-[#f6ede0] flex items-center gap-2">
                  <GameIcon name="ledger" size={24} className="text-[#d4a359] shrink-0" />
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
              type="button"
              onClick={() => {
                soundFx.playButtonClick(0.9);
                onSelectJournalToy(currentToy.name);
              }}
              className="flex items-center gap-2 text-xs font-serif bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#d4a359] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <GameIcon name="bookmark" size={14} /> Keep {currentToy.name} for Journal
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#d4a359] flex items-center gap-1.5">
              <GameIcon name="bookmark" size={12} /> Kinhal Wooden Keepsake added to Journal
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif px-6 py-2 rounded-xl text-xs transition-all cursor-pointer"
        >
          {isLatchOpened ? "Complete Inspection & Return" : "Exit Workbench"}
        </button>
      </div>
    </AccessibleModal>
  );
}
