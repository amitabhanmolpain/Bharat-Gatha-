"use client";

import React, { useState } from "react";
import { WorldDefinition, HistoricalReflectionQuestion } from "../types/world";

interface HistoricalReflectionModalProps {
  world: WorldDefinition;
  onComplete: () => void;
}

export default function HistoricalReflectionModal({
  world,
  onComplete,
}: HistoricalReflectionModalProps) {
  const reflectionQuestion: HistoricalReflectionQuestion | undefined =
    world.quest.reflectionQuestions?.[0] || {
      id: "default-reflection",
      question: `What was the primary historical significance of ${world.region} during ${world.historicalEra}?`,
      options: [
        {
          id: "opt-default-1",
          text: `${world.title} demonstrated key geopolitical and administrative strategies during ${world.historicalEra}.`,
          isCorrect: true,
          explanation: "Correct! The investigation revealed primary historical evidence regarding regional governance and strategic architecture.",
        },
        {
          id: "opt-default-2",
          text: "The region had no recorded historical significance.",
          isCorrect: false,
          explanation: "Incorrect. The region was a major center of historical events and trade/defense infrastructure.",
        },
      ],
      insightUnlocked: "Historical Reasoning Mastery",
    };

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelectOption = (optionId: string) => {
    if (hasAnswered) return;
    const option = reflectionQuestion.options.find((o) => o.id === optionId);
    setSelectedOptionId(optionId);
    setHasAnswered(true);
    if (option?.isCorrect) {
      setIsCorrect(true);
    }
  };

  const selectedOption = reflectionQuestion.options.find((o) => o.id === selectedOptionId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans animate-in zoom-in-95 duration-300">
      <div className="bg-[#fff9e6] border-4 border-black p-8 rounded-2xl max-w-xl w-full shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-black overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black/10 pb-4">
          <div className="text-4xl mb-1">🏛️</div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a6835]">
            Historical Investigation Completed
          </span>
          <h2 className="text-2xl font-serif font-bold text-black mt-0.5">
            {world.title}
          </h2>
        </div>

        <div className="overflow-y-auto flex-1 space-y-6 pr-1">
          {/* Key Insights Summary */}
          {world.quest.keyInsights && world.quest.keyInsights.length > 0 && (
            <div className="bg-[#fef3c7] border-2 border-black p-4 rounded-xl space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <span>📚</span> What You Discovered & Learned
              </h3>
              <ul className="space-y-1.5 text-xs text-amber-950 font-medium">
                {world.quest.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reflection Question Section */}
          <div className="bg-white border-2 border-black p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700">
              <span>🧠</span> Historical Reflection & Reasoning
            </div>

            <p className="text-sm font-bold leading-snug text-black">
              {reflectionQuestion.question}
            </p>

            <div className="space-y-2.5">
              {reflectionQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                let btnStyle = "bg-[#fff9e6] hover:bg-[#ffedb3] border-2 border-black text-black";

                if (hasAnswered) {
                  if (option.isCorrect) {
                    btnStyle = "bg-emerald-100 border-2 border-emerald-700 text-emerald-950 font-bold";
                  } else if (isSelected && !option.isCorrect) {
                    btnStyle = "bg-rose-100 border-2 border-rose-700 text-rose-950";
                  } else {
                    btnStyle = "bg-gray-100 border border-gray-300 text-gray-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-3.5 rounded-lg text-xs transition-all flex items-start justify-between gap-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${btnStyle}`}
                  >
                    <span>{option.text}</span>
                    {hasAnswered && option.isCorrect && (
                      <span className="text-emerald-700 font-black text-sm">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback Box */}
            {hasAnswered && selectedOption && (
              <div
                className={`p-3.5 rounded-lg border-2 text-xs font-medium space-y-1 ${
                  isCorrect
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900"
                    : "bg-rose-50 border-rose-600 text-rose-900"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{isCorrect ? "✓ HISTORICAL INSIGHT UNLOCKED!" : "⚠️ Historical Analysis Note"}</span>
                  {isCorrect && (
                    <span className="text-[10px] uppercase font-black bg-emerald-200 px-2 py-0.5 rounded text-emerald-800 border border-emerald-400">
                      {reflectionQuestion.insightUnlocked}
                    </span>
                  )}
                </div>
                <p>{selectedOption.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t-2 border-black/10 mt-4">
          <button
            onClick={onComplete}
            className="w-full bg-[#ffdc5e] hover:bg-[#ffcf33] border-3 border-black rounded-xl py-3.5 font-black text-sm uppercase tracking-wider text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all"
          >
            Complete Expedition & Claim {world.quest.rewardXp} XP 🏆
          </button>
        </div>
      </div>
    </div>
  );
}
