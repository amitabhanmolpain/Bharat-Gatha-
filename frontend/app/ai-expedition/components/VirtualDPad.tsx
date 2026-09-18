import React from "react";
import { InputState } from "../engine/physics";

interface VirtualDPadProps {
  onInputStateChange: (updater: (prev: InputState) => InputState) => void;
  onInteract: () => void;
  isInteractNear: boolean;
  interactLabel?: string;
}

export default function VirtualDPad({
  onInputStateChange,
  onInteract,
  isInteractNear,
  interactLabel = "Interact"
}: VirtualDPadProps) {
  const setDir = (dir: keyof InputState, active: boolean) => {
    onInputStateChange((prev) => ({ ...prev, [dir]: active }));
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-40 flex justify-between items-end pointer-events-none md:hidden">
      {/* Directional Pad */}
      <div className="relative w-36 h-36 bg-black/30 backdrop-blur-xs rounded-full border-3 border-white/40 p-2 pointer-events-auto shadow-lg">
        {/* Up */}
        <button
          onTouchStart={() => setDir("up", true)}
          onTouchEnd={() => setDir("up", false)}
          onMouseDown={() => setDir("up", true)}
          onMouseUp={() => setDir("up", false)}
          className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-white/80 active:bg-[#f59e0b] border-2 border-black rounded-t-lg font-bold text-lg flex items-center justify-center select-none"
        >
          ▲
        </button>

        {/* Down */}
        <button
          onTouchStart={() => setDir("down", true)}
          onTouchEnd={() => setDir("down", false)}
          onMouseDown={() => setDir("down", true)}
          onMouseUp={() => setDir("down", false)}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-white/80 active:bg-[#f59e0b] border-2 border-black rounded-b-lg font-bold text-lg flex items-center justify-center select-none"
        >
          ▼
        </button>

        {/* Left */}
        <button
          onTouchStart={() => setDir("left", true)}
          onTouchEnd={() => setDir("left", false)}
          onMouseDown={() => setDir("left", true)}
          onMouseUp={() => setDir("left", false)}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 active:bg-[#f59e0b] border-2 border-black rounded-l-lg font-bold text-lg flex items-center justify-center select-none"
        >
          ◀
        </button>

        {/* Right */}
        <button
          onTouchStart={() => setDir("right", true)}
          onTouchEnd={() => setDir("right", false)}
          onMouseDown={() => setDir("right", true)}
          onMouseUp={() => setDir("right", false)}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 active:bg-[#f59e0b] border-2 border-black rounded-r-lg font-bold text-lg flex items-center justify-center select-none"
        >
          ▶
        </button>
      </div>

      {/* Action Button */}
      <button
        onClick={onInteract}
        disabled={!isInteractNear}
        title={interactLabel}
        className={`w-16 h-16 rounded-full border-3 border-black font-extrabold text-sm shadow-lg pointer-events-auto flex flex-col items-center justify-center transition-all select-none ${
          isInteractNear
            ? "bg-[#ffdc5e] hover:bg-[#ffcf33] text-black active:scale-95 animate-pulse"
            : "bg-gray-300 text-gray-500 opacity-60"
        }`}
      >
        <span className="text-lg leading-none">✋</span>
        <span className="text-[10px] uppercase font-mono mt-0.5">E</span>
      </button>
    </div>
  );
}
