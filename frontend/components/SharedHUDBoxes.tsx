import React from "react";

export interface SharedHUDBoxesProps {
  heading: React.ReactNode;
  objective: React.ReactNode;
  cluesStatus: boolean[];
  cluesLabel?: string;
  onCluesClick: () => void;
  isTransitioning?: boolean;
}

export default function SharedHUDBoxes({
  heading,
  objective,
  cluesStatus,
  cluesLabel = "clues",
  onCluesClick,
  isTransitioning = false,
}: SharedHUDBoxesProps) {
  const cluesCount = cluesStatus.filter(Boolean).length;
  const cluesTotal = cluesStatus.length;

  return (
    <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 pointer-events-auto">
      {/* Box 1 - Instruction / Objective Box */}
      <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-80 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest mb-0.5">
          {heading}
        </div>
        <div className="text-[13px] font-black text-black leading-snug">
          {objective}
        </div>
      </div>

      {/* Box 2 - Clue / Progress Box */}
      <button
        type="button"
        onClick={onCluesClick}
        disabled={isTransitioning}
        tabIndex={isTransitioning ? -1 : 0}
        className="bg-[#fff9ea] hover:bg-[#fff2cc] border-2 border-black rounded-lg px-3 py-1.5 w-64 shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-between cursor-pointer transition-all active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] group disabled:pointer-events-none disabled:opacity-40"
        title="Click to inspect discovered historical clues"
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
            {cluesStatus.map((isFound, i) => (
              <div
                key={i}
                className={`w-3.5 h-1.5 rounded-sm transition-all ${
                  isFound ? "bg-amber-500 shadow-sm" : "bg-amber-200"
                }`}
              ></div>
            ))}
          </div>
        </div>
        <span className="text-[12px] font-extrabold text-black flex items-center gap-1">
          {cluesCount}/{cluesTotal} {cluesLabel}
          <span className="text-[10px] text-amber-700 underline font-bold group-hover:text-black">
            open
          </span>
        </span>
      </button>
    </div>
  );
}
