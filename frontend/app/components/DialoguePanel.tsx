"use client";

import React, { useState, useEffect, useRef } from 'react';
import { askHistoricalQuestionDetailed, GameHistoricalContext } from '../../services/groqAiService';
import { playCharacterDialogue, stopAllCharacterVoice, subscribeCharacterVoice } from '../../services/characterVoiceService';
import { soundFx } from '../../services/soundService';

export interface DialogueOption {
  id: number | string;
  text: string;
}

export interface DialoguePanelProps {
  characterName: string;
  characterTitle?: string;
  dialogueText: string;
  statusBadge?: "normal" | "glowing" | "shaking" | "doubt" | string;
  isSpeaking?: boolean;
  showInput?: boolean;
  characterId?: "jolly" | "guard" | string;
  historicalContext?: GameHistoricalContext;
  options?: DialogueOption[];
  onOptionSelect?: (option: DialogueOption) => void;
  preventAiOnOptionSelect?: boolean;
  onPunish?: (punishment: { title: string; subtitle: string; description: string }) => void;
  onClose: () => void;
  audioUrl?: string;
  autoPlayVoice?: boolean;
}

export default function DialoguePanel({
  characterName,
  characterTitle,
  dialogueText,
  statusBadge = "normal",
  isSpeaking = false,
  showInput = true,
  characterId,
  historicalContext,
  options = [],
  onOptionSelect,
  preventAiOnOptionSelect = false,
  onPunish,
  onClose,
  audioUrl,
  autoPlayVoice = true,
}: DialoguePanelProps) {
  const [inputText, setInputText] = useState("");
  const [displayedText, setDisplayedText] = useState(dialogueText);
  const [activeBadge, setActiveBadge] = useState(statusBadge || "normal");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const lastSpokenTextRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const activeQueryIdRef = useRef<number>(0);

  // Clean up voice immediately when panel unmounts & track mounted status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeQueryIdRef.current++;
      stopAllCharacterVoice();
    };
  }, []);

  // Listen to Escape key globally to immediately close panel and stop voice
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClosePanel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setActiveBadge(statusBadge || "normal");
    // Stop shaking after clue is given and return to normal
    if (statusBadge === "shaking") {
      const timer = setTimeout(() => {
        setActiveBadge("normal");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusBadge]);

  // Subscribe to character voice playback state
  useEffect(() => {
    const unsubscribe = subscribeCharacterVoice((voiceState) => {
      setIsVoiceActive(voiceState.isPlaying);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setDisplayedText(dialogueText);
    if (!autoPlayVoice || !characterId || !dialogueText) return;

    const speechKey = `${characterId}:${dialogueText.trim()}`;
    if (lastSpokenTextRef.current === speechKey) {
      return;
    }
    lastSpokenTextRef.current = speechKey;

    playCharacterDialogue({
      character: characterId,
      text: dialogueText,
      audioUrl: audioUrl,
      onStart: () => setIsVoiceActive(true),
      onEnd: () => setIsVoiceActive(false),
      onError: () => setIsVoiceActive(false),
    });
  }, [dialogueText, characterId, audioUrl, autoPlayVoice]);

const VULGAR_WORDS = [
  "fuck", "shit", "bitch", "bastard", "asshole", "idiot", "stupid", "dumb", 
  "crap", "dick", "pussy", "cunt", "damn", "slut", "whore", "fucker", "fucking",
  "madarchod", "bhenchod", "harami", "kutta", "chutiya", "saala", "bhosdike", 
  "gaandu", "lodu", "kamina", "bewakoof", "ullu", "kamini", "mc", "bc"
];

function isVulgar(text: string): boolean {
  const lower = text.toLowerCase();
  const words = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
  return words.some(w => VULGAR_WORDS.includes(w)) || VULGAR_WORDS.some(v => lower.includes(v));
}

  const executeAskQuery = async (queryText: string) => {
    const query = queryText.trim();
    if (!query || isAskingAI) return;

    setInputText("");

    // Immediate Punishment for Vulgar / Bad Language
    if (isVulgar(query)) {
      activeQueryIdRef.current++;
      stopAllCharacterVoice();
      onClose();
      if (onPunish) {
        onPunish({
          title: "Punished for Foul Language",
          subtitle: "ROYAL BLASPHEMY & INSOLENCE",
          description: "You dared to utter vulgar and disrespectful words before the imperial sentry of Emperor Shah Jahan. The Royal Guard delivers immediate, merciless punishment for your foul tongue before casting you out of the gates."
        });
      }
      return;
    }

    const newCount = questionCount + 1;
    setQuestionCount(newCount);

    // Guard anger threshold: question 3 warning, question 4+ execution
    if (characterId === "guard" && newCount >= 3) {
      if (newCount === 3) {
        const warningText = "Again you ask me a question, you will be punished!";
        setDisplayedText(warningText);
        setIsVoiceActive(true);
        stopAllCharacterVoice();
        playCharacterDialogue({
          character: "guard",
          text: warningText,
          onStart: () => setIsVoiceActive(true),
          onEnd: () => setIsVoiceActive(false),
          onError: () => setIsVoiceActive(false)
        });
        return;
      } else {
        activeQueryIdRef.current++;
        stopAllCharacterVoice();
        onClose();
        if (onPunish) {
          onPunish({
            title: "Punished for Insolence",
            subtitle: "IMPERIAL RETRIBUTION",
            description: "You tested the royal sentry's patience with repeated inquiries after a direct warning. The enraged guard seizes you, strikes you down, and casts you out of the palace gates."
          });
        }
        return;
      }
    }

    const queryId = ++activeQueryIdRef.current;
    setIsAskingAI(true);
    stopAllCharacterVoice();
    setDisplayedText(`Thinking... Consulting chronicles of ${historicalContext?.era || "history"}...`);

    try {
      const res = await askHistoricalQuestionDetailed(
        query,
        historicalContext || {
          current_year: 1653,
          era: "Mughal Empire",
          location: "Taj Mahal",
          ruler: "Emperor Shah Jahan"
        },
        characterId
      );

      // Protect against stale async response if dialogue was closed or query changed
      if (!isMountedRef.current || activeQueryIdRef.current !== queryId) {
        return;
      }

      setDisplayedText(res.answer);
      if (characterId === "jolly") {
        setActiveBadge(res.behavior || "normal");
      }
      setIsAskingAI(false);

      // Play character voice for the generated answer only if panel is still active
      if (characterId && isMountedRef.current && activeQueryIdRef.current === queryId) {
        lastSpokenTextRef.current = `${characterId}:${res.answer.trim()}`;
        setIsVoiceActive(true);
        playCharacterDialogue({
          character: characterId,
          text: res.answer,
          onStart: () => {
            if (isMountedRef.current && activeQueryIdRef.current === queryId) {
              setIsVoiceActive(true);
            }
          },
          onEnd: () => setIsVoiceActive(false),
          onError: () => setIsVoiceActive(false)
        });
      }
    } catch (err) {
      if (!isMountedRef.current || activeQueryIdRef.current !== queryId) {
        return;
      }
      console.error("Ask AI error:", err);
      setDisplayedText("The royal archives are silent at this moment. Ask again shortly.");
      setIsAskingAI(false);
      setIsVoiceActive(false);
      setActiveBadge("normal");
    }
  };

  const handleSendQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeAskQuery(inputText);
  };

  const handleClosePanel = () => {
    isMountedRef.current = false;
    activeQueryIdRef.current++;
    stopAllCharacterVoice();
    onClose();
  };

  const handleToggleVoice = () => {
    if (isVoiceActive) {
      stopAllCharacterVoice();
      setIsVoiceActive(false);
    } else {
      if (characterId && displayedText) {
        stopAllCharacterVoice();
        setIsVoiceActive(true);
        lastSpokenTextRef.current = `${characterId}:${displayedText.trim()}`;
        playCharacterDialogue({
          character: characterId,
          text: displayedText,
          audioUrl: audioUrl,
          onStart: () => setIsVoiceActive(true),
          onEnd: () => setIsVoiceActive(false),
          onError: () => setIsVoiceActive(false),
        });
      }
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 pointer-events-auto select-none">
      <div className="bg-[#fff9e6] border-4 border-black rounded-xl p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Top Bar: Name & Controls */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            {characterId === "jolly" && (
              <div className={`relative w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] overflow-visible shrink-0 transition-all duration-300 ${
                activeBadge === "glowing"
                  ? "bg-amber-400/50 ring-2 ring-yellow-400"
                  : activeBadge === "shaking"
                  ? "bg-red-400/40 animate-crazy-shake border-red-900 ring-2 ring-red-500"
                  : "bg-amber-400/20"
              }`}>
                {/* Glow aura ONLY when Jolly is stating a historical fact */}
                {activeBadge === "glowing" && (
                  <div className="absolute inset-0 rounded-xl bg-yellow-300/80 blur-md animate-pulse pointer-events-none" />
                )}
                <img
                  src="/genie_rajasthani_transparent.png"
                  alt="Jolly Bhai"
                  className={`w-10 h-10 object-contain relative z-10 ${
                    activeBadge === "glowing"
                      ? "drop-shadow-[0_0_12px_rgba(251,191,36,1)] animate-bounce"
                      : activeBadge === "shaking"
                      ? "drop-shadow-[0_0_12px_rgba(239,68,68,1)] animate-crazy-shake"
                      : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  }`}
                  style={{ animationDuration: activeBadge === "shaking" ? '0.12s' : '2.5s' }}
                />
              </div>
            )}
            <div>
              <h3 className="text-xl font-black text-black tracking-tight leading-tight flex items-center gap-2">
                {characterName}
                {/* Rest of normal conversations: NOTHING (no badge). Glows for fact, shakes for serious clue. */}
                {characterId === "jolly" && activeBadge === "glowing" && (
                  <span className="text-[10px] bg-gradient-to-r from-amber-300 to-yellow-400 border border-black px-2 py-0.5 rounded-full font-black text-amber-950 shadow-sm animate-pulse">
                    ✨ Secret Fact
                  </span>
                )}
                {characterId === "jolly" && activeBadge === "shaking" && (
                  <span className="text-[10px] bg-red-600 text-white border border-black px-2 py-0.5 rounded-full font-black shadow-sm animate-bounce">
                    💥 Clue Alert!
                  </span>
                )}
                {characterId === "jolly" && activeBadge === "doubt" && (
                  <span className="text-[10px] bg-purple-600 text-white border border-black px-2 py-0.5 rounded-full font-black shadow-sm">
                    🤔 Pondering Doubt
                  </span>
                )}
              </h3>
              {characterTitle && (
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-0.5">{characterTitle}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* Volume / Replay Character Speech Button */}
            <button 
              type="button"
              onMouseEnter={() => soundFx.playButtonHover()}
              onClick={() => {
                soundFx.playKeyboardClick();
                handleToggleVoice();
              }}
              className={`border-2 border-black rounded-lg px-3 py-1.5 font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer ${
                isVoiceActive 
                  ? "bg-amber-400 text-black ring-2 ring-amber-500 animate-pulse" 
                  : "bg-white hover:bg-amber-100 text-black"
              }`}
              title={isVoiceActive ? "Stop character voice" : "Listen / Replay character voice"}
            >
              <span className="text-sm">{isVoiceActive ? "🔊" : "🔈"}</span>
              <span>{isVoiceActive ? "Voice: Playing" : "Volume / Replay"}</span>
            </button>

            <button 
              onMouseEnter={() => soundFx.playButtonHover()}
              onClick={() => {
                soundFx.playKeyboardClick();
                handleClosePanel();
              }}
              className="bg-white hover:bg-gray-100 border-2 border-black rounded-lg px-3.5 py-1.5 font-black text-xs text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Esc · leave
            </button>
          </div>
        </div>

        {/* Dialogue Text */}
        <div className="mb-3 bg-white/60 border border-black/10 rounded-lg p-3">
          <p className="text-black font-bold text-[15px] leading-relaxed">
            {displayedText}
          </p>
        </div>

        {/* Speaking Indicator */}
        {(isVoiceActive || isAskingAI) ? (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[#b45309] text-xs">🔊</span>
            <span className="text-[#b45309] font-black text-xs uppercase tracking-wider animate-pulse">
              {isAskingAI ? "CONSULTING CHRONICLES..." : "SPEAKING..."}
            </span>
          </div>
        ) : (
          <div className="mb-2"></div>
        )}

        {/* Options / Suggested Questions */}
        {options.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mb-3.5">
            {options.map((opt, index) => (
              <button
                key={opt.id}
                onMouseEnter={() => soundFx.playButtonHover()}
                onClick={() => {
                  soundFx.playKeyboardClick();
                  stopAllCharacterVoice();
                  if (onOptionSelect) onOptionSelect(opt);
                  if (!preventAiOnOptionSelect) {
                    executeAskQuery(opt.text);
                  }
                }}
                className="bg-white hover:bg-amber-50 text-black border-2 border-black rounded-lg px-3.5 py-2 font-black text-xs shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all text-left cursor-pointer flex items-center"
              >
                <span className="text-[#b45309] font-black mr-2 text-sm">{index + 1}.</span>
                <span className="text-black font-extrabold">{opt.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Text Input */}
        {showInput && (
          <form onSubmit={handleSendQuestion} className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask ${characterName.split(' ')[0]} anything about this era...`}
              disabled={isAskingAI}
              className="flex-1 bg-white border-2 border-black rounded-lg px-3.5 py-2 font-bold text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            />
            <button 
              type="submit"
              disabled={isAskingAI || !inputText.trim()}
              className="bg-[#fcd34d] hover:bg-[#fbbf24] disabled:opacity-50 border-2 border-black rounded-lg px-4 flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer font-black text-black"
              title="Ask AI"
            >
              <span className="text-base font-black text-black">➢</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
