import React from "react";
import { InputState } from "../engine/physics";

interface VirtualDPadProps {
  onInputStateChange: (updater: (prev: InputState) => InputState) => void;
  onTalk?: () => void;
  onObjectInteract?: () => void;
  isNpcNear?: boolean;
  isObjectNear?: boolean;
  npcLabel?: string;
  objectLabel?: string;
  // Legacy props for compatibility
  onInteract?: () => void;
  isInteractNear?: boolean;
  interactLabel?: string;
}

export default function VirtualDPad({
  onInputStateChange,
  onTalk,
  onObjectInteract,
  isNpcNear = false,
  isObjectNear = false,
  npcLabel = "Talk",
  objectLabel = "Examine",
  onInteract,
  isInteractNear,
  interactLabel: _interactLabel = "Interact"
}: VirtualDPadProps) {
  const setDir = (dir: keyof InputState, active: boolean) => {
    onInputStateChange((prev) => ({ ...prev, [dir]: active }));
  };

  const handleTalkClick = () => {
    if (onTalk) onTalk();
    else if (onInteract) onInteract();
  };

  const handleObjectClick = () => {
    if (onObjectInteract) onObjectInteract();
    else if (onInteract) onInteract();
  };

  const talkActive = isNpcNear || (isInteractNear && npcLabel.includes("Talk"));
  const objectActive = isObjectNear || (isInteractNear && !npcLabel.includes("Talk"));

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

      {/* Action Buttons Group */}
      <div className="flex gap-2 pointer-events-auto">
        {/* E Button (Talk NPC) */}
        <button
          onClick={handleTalkClick}
          disabled={!talkActive}
          title={npcLabel}
          className={`w-14 h-14 rounded-full border-3 border-black font-extrabold text-xs shadow-lg flex flex-col items-center justify-center transition-all select-none ${
            talkActive
              ? "bg-[#ffdc5e] hover:bg-[#ffcf33] text-black active:scale-95 animate-pulse"
              : "bg-gray-300 text-gray-500 opacity-50"
          }`}
        >
          <span className="text-base leading-none">💬</span>
          <span className="text-[10px] uppercase font-mono mt-0.5">E</span>
        </button>

        {/* G Button (Examine Object / Exit) */}
        <button
          onClick={handleObjectClick}
          disabled={!objectActive}
          title={objectLabel}
          className={`w-14 h-14 rounded-full border-3 border-black font-extrabold text-xs shadow-lg flex flex-col items-center justify-center transition-all select-none ${
            objectActive
              ? "bg-[#3b82f6] hover:bg-[#2563eb] text-white active:scale-95 animate-pulse"
              : "bg-gray-300 text-gray-500 opacity-50"
          }`}
        >
          <span className="text-base leading-none">🔍</span>
          <span className="text-[10px] uppercase font-mono mt-0.5">G</span>
        </button>
      </div>
    </div>
  );
}
