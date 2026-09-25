"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import GameIcon, { GameIconType } from "./GameIcon";
import {
  playCharacterDialogue,
  stopAllCharacterVoice,
  subscribeCharacterVoice,
} from "../../../../services/characterVoiceService";

export interface DialogueChoice {
  id: string;
  label: string;
  subLabel?: string;
  icon?: GameIconType;
  isActive?: boolean;
  onSelect: () => void;
}

export interface HistoricalNPCDialogueCardProps {
  npcRole: string;
  npcName: string;
  npcIcon: GameIconType;
  npcIconColor?: string;
  primaryQuote: string;
  supportingText?: React.ReactNode;
  choices?: DialogueChoice[];
  statusText: string;
  actionButtonText: string;
  actionButtonIcon?: GameIconType;
  actionButtonVariant?: "gold" | "subtle";
  onAction: () => void;
  onClose: () => void;
  characterVoiceId: "kallappa" | "somappa" | string;
  currentSpeechText: string;
  autoPlayVoice?: boolean;
}

export default function HistoricalNPCDialogueCard({
  npcRole,
  npcName,
  npcIcon,
  npcIconColor = "text-[#d4a359]",
  primaryQuote,
  supportingText,
  choices = [],
  statusText,
  actionButtonText,
  actionButtonIcon,
  actionButtonVariant = "subtle",
  onAction,
  onClose,
  characterVoiceId,
  currentSpeechText,
  autoPlayVoice = true,
}: HistoricalNPCDialogueCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const triggerVoice = useCallback(
    (textToSpeak: string) => {
      const trimmed = textToSpeak?.trim();
      if (!trimmed) return;
      const reqId = ++requestIdRef.current;
      stopAllCharacterVoice();
      setIsSpeaking(false);
      setIsLoading(true);
      void playCharacterDialogue({
        character: characterVoiceId,
        text: trimmed,
        onStart: () => {
          if (isMountedRef.current && requestIdRef.current === reqId) {
            setIsSpeaking(true);
            setIsLoading(false);
          }
        },
        onEnd: () => {
          if (isMountedRef.current && requestIdRef.current === reqId) {
            setIsSpeaking(false);
            setIsLoading(false);
          }
        },
        onError: () => {
          if (isMountedRef.current && requestIdRef.current === reqId) {
            setIsSpeaking(false);
            setIsLoading(false);
          }
        },
      });
    },
    [characterVoiceId]
  );

  useEffect(() => {
    const unsubscribe = subscribeCharacterVoice((state) => {
      if (isMountedRef.current) {
        setIsSpeaking(state.isPlaying);
        setIsLoading(state.isLoading);
      }
    });
    return () => unsubscribe();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoPlayVoice && currentSpeechText) {
      triggerVoice(currentSpeechText);
    }
  }, [currentSpeechText, autoPlayVoice]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestIdRef.current++;
      stopAllCharacterVoice();
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = () => {
    requestIdRef.current++;
    stopAllCharacterVoice();
    setIsSpeaking(false);
    setIsLoading(false);
    onClose();
  };

  const handleAction = () => {
    requestIdRef.current++;
    stopAllCharacterVoice();
    setIsSpeaking(false);
    setIsLoading(false);
    onAction();
  };

  const handleChoiceClick = (choice: DialogueChoice) => {
    if (choice.isActive) return;
    requestIdRef.current++;
    stopAllCharacterVoice();
    setIsSpeaking(false);
    setIsLoading(false);
    choice.onSelect();
  };

  const handleStopVoice = () => {
    requestIdRef.current++;
    stopAllCharacterVoice();
    setIsSpeaking(false);
    setIsLoading(false);
  };

  const handleReplayVoice = () => {
    triggerVoice(currentSpeechText);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/78 backdrop-blur-[3px] animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="npc-dialogue-name"
    >
      <div className="relative w-full max-w-[680px] rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.96)] border border-[#4a3a28]">
        <div className="relative bg-[#1a1510] text-[#f0e6d3] max-h-[90vh] overflow-y-auto">

          {/* HEADER */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="shrink-0 w-[52px] h-[52px] rounded-xl bg-[#241d16] border border-[#d4a359]/30 flex items-center justify-center shadow-inner">
                <GameIcon name={npcIcon} size={26} className={npcIconColor} />
              </div>
              <div className="min-w-0">
                <p className="text-[9.5px] sm:text-[10.5px] font-mono tracking-[0.18em] text-[#c89a50] uppercase leading-none mb-1.5 truncate">
                  {npcRole}
                </p>
                <h3
                  id="npc-dialogue-name"
                  className="text-[22px] sm:text-[26px] font-serif font-bold text-[#f5eadb] tracking-wide leading-tight"
                >
                  {npcName}
                </h3>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1812] hover:bg-[#2a2118] border border-[#3e3025] text-[#9a8878] hover:text-[#e8d9c5] text-[11px] font-mono transition-all duration-200 cursor-pointer select-none"
              aria-label="Close dialogue"
            >
              <GameIcon name="close" size={11} className="text-[#9a8878]" />
              <span>Close</span>
            </button>
          </div>

          {/* Divider */}
          <div className="mx-5 border-b border-[#2c2218]" />

          {/* MAIN DIALOGUE BOX */}
          <div className="mx-5 mt-4 mb-3 p-4 sm:p-5 rounded-xl bg-[#120e0a] border border-[#2b211a]">
            <p className="font-serif font-bold text-sm sm:text-[15px] text-[#f0e6d3] leading-[1.65]">
              &ldquo;{primaryQuote}&rdquo;
            </p>
            {supportingText && (
              <div className="mt-3 pt-3 border-t border-[#231c14]/80 text-[11px] sm:text-xs text-[#c0ad98] font-serif leading-relaxed space-y-1.5">
                {supportingText}
              </div>
            )}
          </div>

          {/* VOICE STATUS BAR */}
          <div className="mx-5 mb-3.5 px-3.5 py-2 rounded-lg bg-[#130f0c] border border-[#26201a] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isLoading ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-[#c89a50] animate-pulse shrink-0" />
                  <span className="text-[10px] font-mono text-[#c89a50] truncate">
                    {npcName} &middot; Generating Voice&hellip;
                  </span>
                </>
              ) : isSpeaking ? (
                <>
                  <GameIcon name="volume" size={12} className="text-[#d4a359] shrink-0" />
                  <span className="text-[10px] font-mono text-[#d4a359] truncate">
                    {npcName} &middot; Elderly Male IndicParler Voice
                  </span>
                  <span className="inline-flex items-end gap-[2px] h-3 ml-1" aria-hidden="true">
                    <span className="w-[3px] bg-[#d4a359] rounded-full animate-bounce" style={{ height: "5px", animationDuration: "0.7s", animationDelay: "0ms" }} />
                    <span className="w-[3px] bg-[#d4a359] rounded-full animate-bounce" style={{ height: "10px", animationDuration: "0.7s", animationDelay: "0.12s" }} />
                    <span className="w-[3px] bg-[#d4a359] rounded-full animate-bounce" style={{ height: "7px", animationDuration: "0.7s", animationDelay: "0.24s" }} />
                    <span className="w-[3px] bg-[#d4a359] rounded-full animate-bounce" style={{ height: "12px", animationDuration: "0.7s", animationDelay: "0.36s" }} />
                    <span className="w-[3px] bg-[#d4a359] rounded-full animate-bounce" style={{ height: "6px", animationDuration: "0.7s", animationDelay: "0.48s" }} />
                  </span>
                </>
              ) : (
                <>
                  <GameIcon name="volume_x" size={12} className="text-[#6a5e52] shrink-0" />
                  <span className="text-[10px] font-mono text-[#6a5e52] truncate">
                    {npcName} &middot; Voice Paused
                  </span>
                </>
              )}
            </div>
            <div className="shrink-0">
              {isSpeaking || isLoading ? (
                <button
                  onClick={handleStopVoice}
                  title="Stop Audio"
                  className="px-2.5 py-1 rounded bg-[#1e1812] hover:bg-[#2a2118] border border-[#3e3025] text-[#d0c4b5] hover:text-[#f0e6d3] text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer select-none"
                >
                  <GameIcon name="stop" size={8} className="text-[#e07040]" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleReplayVoice}
                  title="Replay Voice"
                  className="px-2.5 py-1 rounded bg-[#1e1812] hover:bg-[#2a2118] border border-[#3e3025] text-[#d0c4b5] hover:text-[#f0e6d3] text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer select-none"
                >
                  <GameIcon name="play" size={8} className="text-[#d4a359]" />
                  <span>Replay</span>
                </button>
              )}
            </div>
          </div>

          {/* CHOICE BUTTONS */}
          {choices.length > 0 && (
            <div className="mx-5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {choices.map((choice) => {
                const isSelected = !!choice.isActive;
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceClick(choice)}
                    className={`p-3 rounded-xl border text-left text-[11px] sm:text-xs font-serif transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-[#231a10] border-[#b07e30] text-[#f5eadb] font-semibold shadow-[0_0_12px_rgba(176,126,48,0.18)]"
                        : "bg-[#161109] border-[#2b2118] text-[#9c8c78] hover:border-[#4a3624] hover:text-[#e2d3be]"
                    }`}
                  >
                    <GameIcon
                      name={choice.icon || "ledger"}
                      size={14}
                      className={
                        isSelected
                          ? choice.icon === "gem"
                            ? "text-[#38bdf8] mt-0.5 shrink-0"
                            : "text-[#d4a359] mt-0.5 shrink-0"
                          : "text-[#7a6e60] mt-0.5 shrink-0"
                      }
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="leading-snug">{choice.label}</span>
                      {choice.subLabel && (
                        <span className="text-[10px] text-[#7a6e60] font-normal leading-tight mt-0.5">
                          {choice.subLabel}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* BOTTOM STATUS + ACTION BUTTON */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 pb-5 pt-3 border-t border-[#251e17]">
            <p className="text-[10px] font-mono text-[#7a6e60] tracking-wide leading-snug">
              {statusText}
            </p>
            <button
              onClick={handleAction}
              className={
                actionButtonVariant === "gold"
                  ? "bg-gradient-to-r from-[#8a611f] via-[#b07e30] to-[#c89a50] hover:from-[#9e7228] hover:to-[#d4aa5a] text-[#12100e] font-serif font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-[11px] uppercase tracking-wider flex items-center gap-2 shrink-0 select-none"
                  : "bg-[#1e1812] hover:bg-[#2c2218] border border-[#3e3025] text-[#e2d3be] hover:text-[#f5eadb] font-serif px-6 py-2 rounded-xl text-[11px] transition-all cursor-pointer shrink-0 self-end sm:self-auto select-none"
              }
            >
              {actionButtonIcon && (
                <GameIcon
                  name={actionButtonIcon}
                  size={14}
                  className={actionButtonVariant === "gold" ? "text-[#12100e]" : "text-[#d4a359]"}
                />
              )}
              <span>{actionButtonText}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
