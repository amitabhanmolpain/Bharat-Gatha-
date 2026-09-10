"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { soundFx } from "../../../../services/soundService";
import { IndusStage, IndusSceneType } from "../types";

interface IndusHUDProps {
  stage: IndusStage;
  scene: IndusSceneType;
  objective: string;
  relicsCount: number;
  totalRelics?: number;
  journalCount: number;
  totalJournal?: number;
  onOpenJournal: () => void;
  onResetCampaign: () => void;
  isTransitioning?: boolean;
  elapsedSeconds?: number;
  isTimerVisible?: boolean;
  onToggleTimer?: () => void;
  isMusicMuted?: boolean;
  onToggleMusic?: () => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  onLeaveWorld?: () => void;
}

export default function IndusHUD({
  stage,
  scene,
  objective,
  relicsCount,
  totalRelics = 4,
  journalCount,
  totalJournal = 5,
  onOpenJournal,
  onResetCampaign,
  isTransitioning = false,
  elapsedSeconds = 0,
  isTimerVisible = false,
  onToggleTimer,
  isMusicMuted = false,
  onToggleMusic,
  isSoundMuted = false,
  onToggleSound,
  onLeaveWorld,
}: IndusHUDProps) {
  const router = useRouter();

  const getLocationTitle = (sc: IndusSceneType) => {
    switch (sc) {
      case "lower_town_gate":
        return "INDUS VALLEY - THE GHAT OF MOHENJO-DARO (c. 2500 BCE)";
      case "granary_avenue":
        return "INDUS VALLEY - LOWER TOWN & GRANARY (c. 2500 BCE)";
      case "great_bath_citadel":
      case "drainage_culvert":
        return "INDUS VALLEY - THE GREAT BATH (MOHENJO-DARO)";
      case "steatite_seal_workshop":
      case "carnelian_bead_quarter":
        return "INDUS VALLEY - STEATITE SEAL WORKSHOP (HARAPPA)";
      case "priest_king_citadel":
      case "closing_reflection":
        return "INDUS VALLEY - CITADEL PLATFORM (MOHENJO-DARO)";
      default:
        return "INDUS VALLEY CIVILISATION (c. 2500 BCE)";
    }
  };

  const getSceneDisplayName = (sc: IndusSceneType) => {
    switch (sc) {
      case "lower_town_gate":
        return "The Indus Ghat";
      case "granary_avenue":
        return "Lower Town Grid";
      case "great_bath_citadel":
      case "drainage_culvert":
        return "The Great Bath";
      case "steatite_seal_workshop":
      case "carnelian_bead_quarter":
        return "Seal Workshop";
      case "priest_king_citadel":
      case "closing_reflection":
        return "Citadel Platform";
      default:
        return "Mohenjo-daro";
    }
  };

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-30 transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Top Left: Scenario Quest Box & Clues (Exact Image 2 Style) */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 pointer-events-auto">
        {/* Quest Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-80 sm:w-96 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest mb-0.5">
            {getLocationTitle(scene)}
          </div>
          <div className="text-[13px] font-black text-black leading-snug">
            {objective}
          </div>
        </div>

        {/* Clues / Relics Bar */}
        <div
          onClick={() => {
            soundFx.playKeyboardClick();
            onOpenJournal();
          }}
          className="bg-[#fff9ea] hover:bg-[#fff2cc] border-2 border-black rounded-lg px-3 py-1.5 w-64 shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-between cursor-pointer transition-all active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] group"
          title="Click to inspect discovered Indus relics and inscriptions"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <div className="flex gap-1">
              {[...Array(totalRelics)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-1.5 rounded-sm transition-all ${
                    i < relicsCount ? "bg-amber-500 shadow-sm" : "bg-amber-200"
                  }`}
                ></div>
              ))}
            </div>
          </div>
          <span className="text-[12px] font-extrabold text-black flex items-center gap-1">
            {relicsCount}/{totalRelics} clues{" "}
            <span className="text-[10px] text-amber-700 underline font-bold group-hover:text-black">
              open
            </span>
          </span>
        </div>
      </div>

      {/* Top Right: Actions & Minimap (Exact Image 2 Style) */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex items-center gap-2.5">
          {/* Timer Button */}
          <button
            onClick={() => {
              soundFx.playKeyboardClick();
              onToggleTimer?.();
            }}
            title={isTimerVisible ? "Timer Active (Click to hide)" : "Click to view session timer"}
            className={`h-10 px-3.5 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 font-black text-xs cursor-pointer ${
              isTimerVisible ? "bg-[#fcd34d] text-black" : "bg-white/90 hover:bg-white text-gray-800"
            }`}
          >
            <span>⏱️</span>
            {isTimerVisible ? (
              <span>
                {String(Math.floor((elapsedSeconds || 0) / 60)).padStart(2, "0")}:
                {String((elapsedSeconds || 0) % 60).padStart(2, "0")}
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-black">
                Timer
              </span>
            )}
          </button>

          {/* Restart Button */}
          <button
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              onResetCampaign();
            }}
            title="Restart Indus Valley Journey"
            className="h-10 bg-red-600 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-3 gap-1.5 group cursor-pointer text-white"
          >
            <svg
              className="w-5 h-5 text-white group-hover:-rotate-180 transition-transform duration-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            <span className="text-[13px] font-bold text-white">Restart</span>
          </button>

          {/* Music Toggle */}
          <button
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              onToggleMusic?.();
            }}
            title={isMusicMuted ? "Unmute Music" : "Mute Music"}
            className={`w-10 h-10 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer ${
              isMusicMuted ? "bg-gray-200 text-gray-500" : "bg-amber-400 text-black"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              ></path>
            </svg>
          </button>

          {/* Sound Toggle */}
          <button
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              onToggleSound?.();
            }}
            title={isSoundMuted ? "Unmute Sound" : "Mute Sound"}
            className={`w-10 h-10 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer ${
              isSoundMuted ? "bg-gray-200 text-gray-500" : "bg-amber-400 text-black"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 5.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              ></path>
            </svg>
          </button>

          {/* Leave World */}
          <button
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              if (onLeaveWorld) {
                onLeaveWorld();
              } else {
                router.push("/dashboard");
              }
            }}
            className="h-10 bg-red-600 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-4 cursor-pointer"
          >
            <span className="text-[13px] font-bold text-white">Leave world</span>
          </button>
        </div>

        {/* Minimap Box (Image 2 style) */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-44 h-36 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-amber-50/50 rounded">
            {/* Top row: Priest-King Citadel */}
            <div className="bg-transparent"></div>
            <div
              className={
                scene === "priest_king_citadel"
                  ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600"
                  : "bg-amber-100 rounded-sm"
              }
            ></div>
            <div className="bg-transparent"></div>

            {/* Middle row: Great Bath (west) & Steatite Workshop (east) */}
            <div
              className={
                scene === "great_bath_citadel" || scene === "drainage_culvert"
                  ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600"
                  : "bg-amber-100 rounded-sm"
              }
            ></div>
            <div className="bg-transparent"></div>
            <div
              className={
                scene === "steatite_seal_workshop" || scene === "carnelian_bead_quarter"
                  ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600"
                  : "bg-amber-100 rounded-sm"
              }
            ></div>

            {/* Bottom row: Lower Town Gate */}
            <div className="bg-transparent"></div>
            <div
              className={
                scene === "lower_town_gate" || scene === "granary_avenue"
                  ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600"
                  : "bg-amber-100 rounded-sm"
              }
            ></div>
            <div className="bg-transparent"></div>
          </div>

          <div className="text-center mt-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-950">
              {getSceneDisplayName(scene)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
