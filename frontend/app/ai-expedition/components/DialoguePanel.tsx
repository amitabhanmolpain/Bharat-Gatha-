import React, { useEffect } from "react";
import { NPCDefinition, DialogueOption } from "../types/expedition";
import { narrationManager } from "../services/narrationManager";

interface DialoguePanelProps {
  npc: NPCDefinition;
  currentNodeId?: string;
  portraitUrl?: string;
  onOptionSelect: (option: DialogueOption) => void;
  onClose: () => void;
}

const STATIC_CHARACTER_PORTRAITS: Record<string, string> = {
  char_clive: "/ai-expedition/plassey/characters/robert-clive.png",
  char_siraj: "/ai-expedition/plassey/characters/siraj-ud-daulah.png",
  char_jafar: "/ai-expedition/plassey/characters/mir-jafar.png",
  char_company_guard: "/ai-expedition/plassey/characters/company-guard.png",
  char_company_soldier: "/ai-expedition/plassey/characters/company-soldier.png",
  char_camp_clerk: "/ai-expedition/plassey/characters/camp-clerk.png",
  char_bengal_merchant: "/ai-expedition/plassey/characters/bengal-merchant.png",
  char_silk_merchant: "/ai-expedition/plassey/characters/bengal-merchant.png",
  char_political_observer: "/ai-expedition/plassey/characters/court-official.png",
  char_artisan: "/ai-expedition/plassey/characters/artisan.png",
  char_traveller: "/ai-expedition/plassey/characters/player-bengal-messenger.png",
  char_resident: "/ai-expedition/plassey/characters/artisan.png",
  char_court_official: "/ai-expedition/plassey/characters/court-official.png",
  char_narrator_observer: "/ai-expedition/plassey/characters/court-official.png"
};

export default function DialoguePanel({
  npc,
  currentNodeId,
  portraitUrl,
  onOptionSelect,
  onClose
}: DialoguePanelProps) {
  const dialogueTree = npc.dialogueTree || [];
  const currentNode = dialogueTree.find((node) => node.id === currentNodeId) || dialogueTree[0];

  const promptText = currentNode ? currentNode.prompt : npc.initialDialogue;
  const options = currentNode ? currentNode.options : [];
  const characterPortrait = portraitUrl || npc.portraitAsset || npc.spriteAsset || STATIC_CHARACTER_PORTRAITS[npc.id];

  useEffect(() => {
    if (promptText) {
      const dialogueKey = `dialogue_${npc.id}_${currentNodeId || "init"}_${promptText.slice(0, 20)}`;
      narrationManager.narrate(dialogueKey, promptText, { type: "DIALOGUE", priority: 50 });

      // Preload next dialogue option lines in the background
      options.forEach((opt) => {
        if (opt.nextDialogueId) {
          const nextNode = dialogueTree.find((n) => n.id === opt.nextDialogueId);
          if (nextNode && nextNode.prompt) {
            const nextKey = `dialogue_${npc.id}_${opt.nextDialogueId}_${nextNode.prompt.slice(0, 20)}`;
            narrationManager.preloadNext(nextKey, nextNode.prompt, { type: "DIALOGUE", priority: 50 });
          }
        }
      });
    }
    return () => {
      narrationManager.stopCurrentNarration("dialogue-unmount");
    };
  }, [npc.id, currentNodeId, promptText]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    narrationManager.unlockAudio();
    narrationManager.stopCurrentNarration("dialogue-close");
    onClose();
  };

  const handleOptionSelect = (opt: DialogueOption, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    narrationManager.unlockAudio();
    narrationManager.stopCurrentNarration("dialogue-option-select");
    onOptionSelect(opt);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-end justify-center pb-6 px-4 pointer-events-auto animate-in fade-in duration-200"
    >
      <div className="bg-[#fff9e6] border-4 border-black rounded-xl p-5 w-full max-w-3xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-bottom-8 duration-200 relative z-[1100]">
        
        {/* Top Header */}
        <div className="flex justify-between items-start mb-3 pb-2 border-b-2 border-black/15">
          <div className="flex items-center gap-3">
            {characterPortrait && (
              <div className="w-14 h-14 rounded-lg border-2 border-black overflow-hidden bg-black shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <img src={characterPortrait} alt={npc.name} className="w-full h-full object-cover object-top" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-bold text-black leading-tight">
                  {npc.name}
                </h3>
                <span className="bg-[#f59e0b] text-black text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-black">
                  {npc.title}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-600 mt-0.5">
                {npc.historicalRole} • <span className="italic">{npc.personality}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="bg-white hover:bg-gray-100 border-2 border-black rounded-lg px-3 py-1 font-bold text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            Esc - Leave
          </button>
        </div>

        {/* Dialogue Text */}
        <div className="mb-4 bg-white/80 border-2 border-black/20 rounded-lg p-3">
          <p className="text-black font-semibold text-base leading-relaxed">
            &quot;{promptText}&quot;
          </p>
        </div>

        {/* Dialogue Choice Options */}
        {options.length > 0 ? (
          <div className="flex flex-col gap-2">
            {options.map((opt, idx) => (
              <button
                key={opt.id}
                onClick={() => handleOptionSelect(opt)}
                className="bg-white hover:bg-[#fef3c7] border-3 border-black rounded-lg px-4 py-2.5 font-bold text-sm text-left shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-start gap-2 cursor-pointer"
              >
                <span className="text-[#d97706] font-mono font-extrabold">{idx + 1}.</span>
                <span className="text-black">{opt.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="bg-[#ffdc5e] hover:bg-[#ffcf33] border-3 border-black rounded-lg px-4 py-2 font-bold text-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Continue Exploring
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
