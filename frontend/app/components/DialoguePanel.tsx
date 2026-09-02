import React from 'react';

interface DialogueOption {
  id: number | string;
  text: string;
}

interface DialoguePanelProps {
  characterName: string;
  characterTitle?: string;
  dialogueText: string;
  isSpeaking?: boolean;
  options?: DialogueOption[];
  onOptionSelect?: (option: DialogueOption) => void;
  onClose: () => void;
}

export default function DialoguePanel({
  characterName,
  characterTitle,
  dialogueText,
  isSpeaking = false,
  options = [],
  onOptionSelect,
  onClose
}: DialoguePanelProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 pointer-events-auto">
      <div className="bg-[#fff9e6] border-4 border-black rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-bottom-8 duration-200">
        
        {/* Top Bar: Name & Controls */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-black leading-tight">{characterName}</h3>
            {characterTitle && (
              <p className="text-sm font-medium text-gray-600">{characterTitle}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button className="bg-[#ffdc5e] border-2 border-black rounded p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)]">
              <span className="text-sm">🔊</span>
            </button>
            <button 
              onClick={onClose}
              className="bg-white border-2 border-black rounded px-3 py-1 font-bold text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all"
            >
              Esc - leave
            </button>
          </div>
        </div>

        {/* Dialogue Text */}
        <div className="mb-2">
          <p className="text-black font-semibold text-[15px] leading-relaxed">
            {dialogueText}
          </p>
        </div>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="mb-4 flex items-center gap-1.5">
            <span className="text-[#f5a623] text-xs">🔊</span>
            <span className="text-[#f5a623] font-bold text-xs uppercase tracking-wider animate-pulse">
              Speaking...
            </span>
          </div>
        )}
        {!isSpeaking && <div className="mb-4"></div>}

        {/* Options */}
        {options.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {options.map((opt, index) => (
              <button
                key={opt.id}
                onClick={() => onOptionSelect && onOptionSelect(opt)}
                className="bg-white hover:bg-gray-50 border-[3px] border-black rounded-md px-3 py-2 font-bold text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all text-left"
              >
                <span className="text-[#f5a623] mr-1">{index + 1}.</span> {opt.text}
              </button>
            ))}
          </div>
        )}

        {/* Text Input */}
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder={`Say anything to ${characterName.split(' ')[0]}...`}
            className="flex-1 bg-white border-[3px] border-black rounded-md px-3 py-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
          />
          <button className="bg-[#ffdc5e] hover:bg-[#ffcf33] border-[3px] border-black rounded-md px-4 flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all">
            <span className="text-lg translate-y-[1px]">➢</span>
          </button>
        </div>

      </div>
    </div>
  );
}
