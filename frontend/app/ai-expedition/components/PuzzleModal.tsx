import React, { useState, useEffect } from "react";
import { PuzzleDefinition, PuzzleOption } from "../types/expedition";
import { narrationManager } from "../services/narrationManager";

interface PuzzleModalProps {
  puzzle: PuzzleDefinition;
  onSolve: () => void;
  onClose: () => void;
}

export default function PuzzleModal({ puzzle, onSolve, onClose }: PuzzleModalProps) {
  const [selectedOpt, setSelectedOpt] = useState<PuzzleOption | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isSolved, setIsSolved] = useState(puzzle.isSolved);

  const presentationId = `puzzle_question_${puzzle.id}`;

  useEffect(() => {
    if (!puzzle.isSolved) {
      const puzzleKey = `puzzle_question_${puzzle.id}`;
      const fullText = `Historical reasoning challenge. ${puzzle.title}. ${puzzle.historicalContext}. ${puzzle.question}`;
      narrationManager.narrate(puzzleKey, fullText, { type: "PUZZLE", priority: 40, presentationId });
    }
    return () => {
      narrationManager.stopCurrentNarration("puzzle-unmount");
    };
  }, [puzzle.id, puzzle.title, puzzle.historicalContext, puzzle.question, puzzle.isSolved, presentationId]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    narrationManager.unlockAudio();
    narrationManager.stopCurrentNarration("puzzle-close");
    onClose();
  };

  const handleSelectOption = (opt: PuzzleOption, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    narrationManager.unlockAudio();
    narrationManager.stopCurrentNarration("puzzle-answer");
    setSelectedOpt(opt);
    if (opt.isCorrect) {
      setIsSolved(true);
      narrationManager.narrate(
        `puzzle_correct_${puzzle.id}`,
        `Correct. HISTORICAL INSIGHT UNLOCKED. ${puzzle.historicalInsightUnlocked}`,
        { type: "INSIGHT", priority: 70, forceRepeat: true, presentationId: `puzzle_correct_${puzzle.id}` }
      );
      setTimeout(() => {
        onSolve();
      }, 1800);
    } else {
      setShowHint(true);
      narrationManager.narrate(
        `puzzle_hint_${puzzle.id}`,
        `Not quite. ${opt.explanation || puzzle.hint}`,
        { type: "INFO", priority: 35, forceRepeat: true, presentationId: `puzzle_hint_${puzzle.id}` }
      );
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
    >
      <div className="bg-[#fff9e6] border-4 border-black rounded-xl p-6 max-w-xl w-full shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-2 border-b-2 border-black/20">
          <div>
            <span className="bg-[#f59e0b] text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-black tracking-wider">
              Historical Reasoning Challenge
            </span>
            <h3 className="text-xl font-serif font-bold text-black mt-1">
              {puzzle.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                narrationManager.replay(presentationId);
              }}
              title="Replay Puzzle Narration"
              className="bg-[#ffdc5e] hover:bg-[#f59e0b] border-2 border-black rounded-lg px-2.5 py-1 text-xs font-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer flex items-center gap-1 text-black"
            >
              <span>↻</span>
              <span>Replay</span>
            </button>
            <button
              onClick={handleClose}
              className="bg-white border-2 border-black rounded-lg px-2.5 py-1 text-xs font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
            >
              ✕ Esc
            </button>
          </div>
        </div>

        {/* Puzzle Success Banner */}
        {isSolved ? (
          <div className="bg-[#d1fae5] border-3 border-[#059669] rounded-lg p-5 text-center my-4 animate-in zoom-in-95 duration-300">
            <span className="text-3xl">✨</span>
            <h4 className="text-lg font-bold text-[#065f46] uppercase tracking-wide mt-1">
              HISTORICAL INSIGHT UNLOCKED!
            </h4>
            <p className="text-sm font-semibold text-black mt-2">
              &quot;{puzzle.historicalInsightUnlocked}&quot;
            </p>
          </div>
        ) : (
          <>
            {/* Context & Question */}
            <div className="bg-[#fef3c7] border-2 border-black/20 rounded-lg p-3.5 mb-4 text-xs font-medium text-gray-800">
              <span className="font-bold text-[#b45309] block mb-1">Historical Context:</span>
              {puzzle.historicalContext}
            </div>

            <p className="font-serif font-bold text-base text-black mb-4 leading-snug">
              &quot;{puzzle.question}&quot;
            </p>

            {/* Options */}
            <div className="space-y-2.5 mb-4">
              {puzzle.options.map((opt, idx) => (
                <button
                  key={opt.id || `opt_${idx}`}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full border-3 border-black rounded-lg p-3 text-left font-bold text-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-start gap-2.5 ${
                    selectedOpt?.id === opt.id
                      ? opt.isCorrect
                        ? "bg-[#10b981] text-white"
                        : "bg-[#ef4444] text-white"
                      : "bg-white hover:bg-[#fef3c7] text-black"
                  }`}
                >
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-black/10">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>

            {/* Hint & Feedback Banner */}
            {selectedOpt && !selectedOpt.isCorrect && (
              <div className="bg-[#fee2e2] border-2 border-[#dc2626] rounded-lg p-3 text-xs text-[#991b1b] animate-in fade-in">
                <span className="font-bold">Not quite: </span>
                {selectedOpt.explanation}
                {showHint && (
                  <p className="mt-1 font-semibold text-black">
                    💡 <span className="underline">Hint:</span> {puzzle.hint}
                  </p>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
