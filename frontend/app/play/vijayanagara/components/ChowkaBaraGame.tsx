"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AccessibleModal from "./AccessibleModal";
import GameIcon from "./GameIcon";
import { soundFx } from "../../../../services/soundService";
import { playNarration, stopAllCharacterVoice } from "../../../../services/narratorService";

interface ChowkaBaraGameProps {
  isOpen: boolean;
  onClose: () => void;
  attempts: number;
  onComplete: (won: boolean, attempts: number) => void;
}

// 5x5 Grid indices:
//  0  1  2  3  4
//  5  6  7  8  9
// 10 11 12 13 14
// 15 16 17 18 19
// 20 21 22 23 24

const PLAYER_PATH = [
  20, 21, 22, 23, 24, 19, 14, 9, 4, 3, 2, 1, 0, 5, 10, 15,
  16, 17, 18, 13, 8, 7, 6, 11,
  12
];

const AI_PATH = [
  4, 3, 2, 1, 0, 5, 10, 15, 20, 21, 22, 23, 24, 19, 14, 9,
  8, 7, 6, 11, 16, 17, 18, 13,
  12
];

const SAFE_SQUARES = new Set([0, 4, 12, 20, 24]);

export default function ChowkaBaraGame({
  isOpen,
  onClose,
  attempts,
  onComplete,
}: ChowkaBaraGameProps) {
  // Track pieces by their path index: 0 to 24 (24 is Home)
  const [playerPieces, setPlayerPieces] = useState<[number, number]>([0, 0]);
  const [aiPieces, setAiPieces] = useState<[number, number]>([0, 0]);
  const [currentTurn, setCurrentTurn] = useState<"player" | "ai">("player");
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [cowries, setCowries] = useState<boolean[]>([true, false, true, false]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameStatus, setGameStatus] = useState<"playing" | "player_won" | "ai_won">("playing");
  const [gameAttempts, setGameAttempts] = useState(attempts);
  const [dialogueMessage, setDialogueMessage] = useState<string>(
    "Roll the four cowrie shells to advance your pawns toward the center."
  );

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const narrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (narrationTimeoutRef.current) clearTimeout(narrationTimeoutRef.current);
    spinIntervalRef.current = null;
    aiTimeoutRef.current = null;
    narrationTimeoutRef.current = null;
  }, []);

  const resetMatchState = useCallback(() => {
    setPlayerPieces([0, 0]);
    setAiPieces([0, 0]);
    setCurrentTurn("player");
    setLastRoll(null);
    setIsRolling(false);
    setGameStatus("playing");
    setDialogueMessage(
      "Roll the four cowrie shells to advance your pawns toward the center."
    );
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      stopAllCharacterVoice();
      resetMatchState();
    } else {
      stopAllCharacterVoice();
      playNarration(
        "Roll the four cowrie shells to advance your pawns toward the center.",
        { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
      );
    }
    return () => {
      clearAllTimers();
      stopAllCharacterVoice();
    };
  }, [isOpen, clearAllTimers, resetMatchState]);

  const rollCowries = (): { roll: number; faces: boolean[] } => {
    const faces = [
      Math.random() > 0.5,
      Math.random() > 0.5,
      Math.random() > 0.5,
      Math.random() > 0.5,
    ];
    const openCount = faces.filter(Boolean).length;
    let roll = openCount;
    if (openCount === 0) roll = 8;
    else if (openCount === 4) roll = 4;
    return { roll, faces };
  };

  const checkCollisionAndCapture = (
    movingTeam: "player" | "ai",
    nextPathIndices: [number, number],
    opponentPathIndices: [number, number]
  ): [number, number] => {
    const movedPath = movingTeam === "player" ? PLAYER_PATH : AI_PATH;
    const oppPath = movingTeam === "player" ? AI_PATH : PLAYER_PATH;

    let updatedOpponent = [...opponentPathIndices] as [number, number];

    for (let i = 0; i < 2; i++) {
      const pIdx = nextPathIndices[i];
      if (pIdx > 0 && pIdx < 24) { 
        const boardCell = movedPath[pIdx];
        if (!SAFE_SQUARES.has(boardCell)) {
          for (let j = 0; j < 2; j++) {
            const oppIdx = updatedOpponent[j];
            if (oppIdx > 0 && oppIdx < 24) {
              if (oppPath[oppIdx] === boardCell) {
                updatedOpponent[j] = 0; 
                soundFx.playTileSwap(); 
              }
            }
          }
        }
      }
    }
    return updatedOpponent;
  };

  const executeAiTurn = useCallback(() => {
    soundFx.playCowrieShellsSound();
    
    setDialogueMessage("Vidyaranya is casting the cowrie shells...");

    const { roll, faces } = rollCowries();
    setCowries(faces);
    setLastRoll(roll);

    aiTimeoutRef.current = setTimeout(() => {
      setAiPieces((prevAi) => {
        const a1 = prevAi[0];
        const a2 = prevAi[1];

        let nextAiPieces: [number, number] = [a1, a2];
        let aiMoved = false;

        if (a1 + roll <= 24 && a1 <= a2) {
          nextAiPieces = [a1 + roll, a2];
          aiMoved = true;
        } else if (a2 + roll <= 24) {
          nextAiPieces = [a1, a2 + roll];
          aiMoved = true;
        } else if (a1 + roll <= 24) {
          nextAiPieces = [a1 + roll, a2];
          aiMoved = true;
        }

        if (aiMoved) {
          soundFx.playTileSwap();
          
          setPlayerPieces(prevPlayer => {
            return checkCollisionAndCapture("ai", nextAiPieces, prevPlayer);
          });
        }

        if (nextAiPieces[0] === 24 && nextAiPieces[1] === 24) {
          setGameStatus("ai_won");
          setGameAttempts((prevAtt) => {
            const nextAtt = prevAtt + 1;
            const endMsg =
              nextAtt >= 2
                ? "Vidyaranya smiles warmly: 'True leadership comes from resilience. You have proven your spirit.'"
                : "Vidyaranya's pawns reach the sanctuary first. 'A wise strategist learns from each turn. Try again!'";
            setDialogueMessage(endMsg);
            stopAllCharacterVoice();
            playNarration(endMsg, { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true });
            return nextAtt;
          });
        } else {
          setCurrentTurn("player");
          const aiMsg = `Vidyaranya rolled ${roll}. Your turn to cast!`;
          setDialogueMessage(aiMsg);
          stopAllCharacterVoice();
          playNarration(`Vidyaranya rolled a ${roll}. Your turn to cast!`, {
            speaker: "ratan",
            pace: 0.88,
            language_code: "en-IN",
            hideSubtitle: true,
          });
        }

        return nextAiPieces;
      });
    }, 1000);
  }, []);

  const handlePlayerRoll = () => {
    if (isRolling || currentTurn !== "player" || gameStatus !== "playing") return;

    clearAllTimers();
    setIsRolling(true);

    stopAllCharacterVoice();
    soundFx.playCowrieShellsSound();
    
    let spins = 0;

    spinIntervalRef.current = setInterval(() => {
      setCowries([Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5]);
      spins++;
      
      if (spins > 6) {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current);
          spinIntervalRef.current = null;
        }

        const { roll, faces } = rollCowries();
        setCowries(faces);
        setLastRoll(roll);
        setIsRolling(false);

        soundFx.playCowrieShellsSound();

        const p1 = playerPieces[0];
        const p2 = playerPieces[1];

        let nextPieces: [number, number] = [p1, p2];
        let moved = false;
        
        if (p1 + roll <= 24 && p1 <= p2) {
          nextPieces = [p1 + roll, p2];
          moved = true;
        } else if (p2 + roll <= 24) {
          nextPieces = [p1, p2 + roll];
          moved = true;
        } else if (p1 + roll <= 24) {
          nextPieces = [p1 + roll, p2];
          moved = true;
        } else {
          setDialogueMessage(`Rolled ${roll}! A leap beyond the sanctuary — try again next turn.`);
          playNarration(`Rolled a ${roll}! A leap beyond the sanctuary — try again next turn.`, {
            speaker: "ratan",
            pace: 0.88,
            language_code: "en-IN",
            hideSubtitle: true,
          });
        }

        if (moved) {
          soundFx.playTileSwap();
          
          setAiPieces(prevAi => {
            return checkCollisionAndCapture("player", nextPieces, prevAi);
          });
        }

        setPlayerPieces(nextPieces);

        if (nextPieces[0] === 24 && nextPieces[1] === 24) {
          setGameStatus("player_won");
          setDialogueMessage(
            "Splendid match! You navigated the board with patience and skill."
          );
          stopAllCharacterVoice();
          playNarration(
            "Splendid match! You navigated the board with patience and skill, winning Vidyaranya's blessing!",
            { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
          );
          return;
        }

        setCurrentTurn("ai");
        if (moved) {
          const rollSpoken =
            roll === 8
              ? "Ashta! You rolled an eight! Your pawn leaps forward."
              : roll === 4
              ? "Chowka! You rolled a four! Your pawn surges ahead."
              : `You rolled a ${roll}! Your pawn advances.`;
          setDialogueMessage(`You rolled ${roll}! Vidyaranya observes and prepares his counter-move.`);
          stopAllCharacterVoice();
          playNarration(rollSpoken, { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true });
        }

        aiTimeoutRef.current = setTimeout(() => {
          executeAiTurn();
          aiTimeoutRef.current = null;
        }, 2500); 
      }
    }, 80);
  };

  const handleRestartMatch = () => {
    clearAllTimers();
    stopAllCharacterVoice();
    resetMatchState();
  };

  const handleFinish = () => {
    clearAllTimers();
    stopAllCharacterVoice();
    const won = gameStatus === "player_won";
    playNarration(
      "Well done, traveler! You carry Vidyaranya's blessing. Cross the Tungabhadra to enter Hampi Bazaar!",
      { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
    );
    onComplete(won, gameAttempts);
  };

  const handleModalClose = () => {
    clearAllTimers();
    stopAllCharacterVoice();
    resetMatchState();
    onClose();
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleModalClose}
      titleId="chowka-bara-title"
      maxWidthClass="max-w-2xl"
      containerClassName="p-6"
    >
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#3d4b3b] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#2b3a2a] border border-[#a8c3a6] flex items-center justify-center shadow-inner">
            <GameIcon name="sage" size={20} className="text-[#a8c3a6]" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#a8c3a6] uppercase tracking-[0.2em]">
              Traditional Karnataka Board Match
            </div>
            <h2 id="chowka-bara-title" className="text-xl font-serif font-bold text-[#e8f1e6]">
              Chowka Bara with Sage Vidyaranya
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleModalClose}
          className="text-[#96a992] hover:text-[#e8f1e6] text-sm bg-[#1c291b] hover:bg-[#2b3a2a] border border-[#3d4b3b] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          ✕ Exit
        </button>
      </div>

      <div className="p-3.5 rounded-xl bg-[#1c241a] border border-[#31422f] text-xs font-serif leading-relaxed text-[#cde0cb] mb-5 flex items-start gap-3">
        <span className="text-2xl mt-0.5">📿</span>
        <p className="flex-1 italic">{dialogueMessage}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-[#222e20] border-2 border-[#d4a359] flex items-center justify-between shadow-md">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#d4a359]">
              Your Pawns (Gold)
            </div>
            <div className="text-sm font-serif font-bold text-[#e8f1e6] mt-0.5">
              Pawn 1: {playerPieces[0]}/24 • Pawn 2: {playerPieces[1]}/24
            </div>
          </div>
          <div className="flex gap-1">
            <span className={`text-lg ${playerPieces[0] === 24 ? "opacity-40" : ""}`}>🟡</span>
            <span className={`text-lg ${playerPieces[1] === 24 ? "opacity-40" : ""}`}>🟡</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#222e20] border-2 border-[#c86446] flex items-center justify-between shadow-md">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#c86446]">
              Vidyaranya (Terracotta)
            </div>
            <div className="text-sm font-serif font-bold text-[#e8f1e6] mt-0.5">
              Pawn 1: {aiPieces[0]}/24 • Pawn 2: {aiPieces[1]}/24
            </div>
          </div>
          <div className="flex gap-1">
            <span className={`text-lg ${aiPieces[0] === 24 ? "opacity-40" : ""}`}>🔴</span>
            <span className={`text-lg ${aiPieces[1] === 24 ? "opacity-40" : ""}`}>🔴</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-5">
        <div className="grid grid-cols-5 gap-1 p-3 bg-[#1e2a1d] rounded-xl border-4 border-[#121c11] shadow-xl w-fit">
          {Array.from({ length: 25 }).map((_, i) => {
            const isSafe = SAFE_SQUARES.has(i);
            const isHome = i === 12;
            
            const p1Here = PLAYER_PATH[playerPieces[0]] === i && playerPieces[0] > 0;
            const p2Here = PLAYER_PATH[playerPieces[1]] === i && playerPieces[1] > 0;
            const a1Here = AI_PATH[aiPieces[0]] === i && aiPieces[0] > 0;
            const a2Here = AI_PATH[aiPieces[1]] === i && aiPieces[1] > 0;
            
            const p1Start = playerPieces[0] === 0 && i === 20;
            const p2Start = playerPieces[1] === 0 && i === 20;
            const a1Start = aiPieces[0] === 0 && i === 4;
            const a2Start = aiPieces[1] === 0 && i === 4;
            
            const showP1 = p1Here || p1Start;
            const showP2 = p2Here || p2Start;
            const showA1 = a1Here || a1Start;
            const showA2 = a2Here || a2Start;

            return (
              <div
                key={i}
                className={`w-14 h-14 sm:w-16 sm:h-16 flex flex-wrap items-center justify-center p-1 rounded-sm border border-[#2b3a2a] relative overflow-hidden ${
                  isHome
                    ? "bg-[#2d422a] border-2 border-[#d4a359]"
                    : isSafe
                    ? "bg-[#283827]"
                    : "bg-[#182417]"
                }`}
              >
                {isSafe && !isHome && (
                  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100" y2="100" stroke="#d4a359" strokeWidth="4" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke="#d4a359" strokeWidth="4" />
                  </svg>
                )}
                
                {isHome && (
                  <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="30" stroke="#d4a359" strokeWidth="4" fill="none" />
                    <circle cx="50" cy="50" r="15" fill="#d4a359" />
                  </svg>
                )}

                <div className="z-10 flex gap-0.5 mt-1 flex-wrap justify-center">
                  {showP1 && <span className="text-sm sm:text-base drop-shadow-md">🟡</span>}
                  {showP2 && <span className="text-sm sm:text-base drop-shadow-md">🟡</span>}
                  {showA1 && <span className="text-sm sm:text-base drop-shadow-md">🔴</span>}
                  {showA2 && <span className="text-sm sm:text-base drop-shadow-md">🔴</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#1c241a] border border-[#2b3a2a] mb-4">
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#96a992]">
            Cowrie Shells:
          </div>
          <div className="flex gap-2">
            {cowries.map((openFace, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg shadow-inner transition-transform ${
                  openFace
                    ? "bg-[#e0e8de] border-[#d4a359] text-[#1c241a] -translate-y-0.5"
                    : "bg-[#2d422a] border-[#3d4b3b] text-[#d4a359]"
                }`}
                title={openFace ? "Mouth Up (1 Point)" : "Mouth Down"}
              >
                🐚
              </div>
            ))}
          </div>
          {lastRoll !== null && (
            <div className="ml-2 px-2.5 py-1 rounded bg-[#151c14] border border-[#d4a359] text-xs font-mono font-bold text-[#d4a359]">
              Roll: {lastRoll} {lastRoll === 8 ? "(Ashta!)" : lastRoll === 4 ? "(Chowka!)" : "steps"}
            </div>
          )}
        </div>

        {gameStatus === "playing" ? (
          <button
            type="button"
            onClick={handlePlayerRoll}
            disabled={isRolling || currentTurn !== "player"}
            className={`px-6 py-2.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
              currentTurn === "player" && !isRolling
                ? "bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] active:translate-y-0.5"
                : "bg-[#222e20] text-[#71856c] border border-[#31422f] cursor-not-allowed"
            }`}
          >
            {isRolling ? "Casting Shells..." : currentTurn === "player" ? "Cast Cowrie Shells 🎲" : "Sage's Turn..."}
          </button>
        ) : (
          <div className="flex gap-2">
            {gameStatus === "ai_won" && gameAttempts < 2 && (
              <button
                type="button"
                onClick={handleRestartMatch}
                className="bg-[#222e20] hover:bg-[#2d422a] border border-[#d4a359] text-[#e8f1e6] font-serif font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Try Match Again (Attempt #{gameAttempts + 1})
              </button>
            )}
            <button
              type="button"
              onClick={handleFinish}
              className="bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Receive Vidyaranya&apos;s Blessing 📿
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#71856c] pt-2 border-t border-[#31422f]">
        <span>Attempts Logged: {gameAttempts}</span>
        <span>Karnataka Traditional Strategy Game • 1336 AD</span>
      </div>
    </AccessibleModal>
  );
}
