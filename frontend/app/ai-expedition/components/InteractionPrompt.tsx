import React from "react";

interface InteractionPromptProps {
  label: string;
  onClick: () => void;
  xPercent?: number;
  yPercent?: number;
}

export default function InteractionPrompt({
  label,
  onClick,
  xPercent = 50,
  yPercent = 70
}: InteractionPromptProps) {
  return (
    <div
      onClick={onClick}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`
      }}
      className="absolute -translate-x-1/2 -translate-y-full z-30 cursor-pointer pointer-events-auto group animate-bounce"
    >
      <div className="bg-[#ffdc5e] hover:bg-[#ffcf33] border-3 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 whitespace-nowrap">
        <span className="bg-black text-[#ffdc5e] font-mono font-extrabold text-xs px-1.5 py-0.5 rounded">
          E
        </span>
        <span className="text-black font-extrabold text-xs tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}
