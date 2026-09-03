"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AccessibleModal from "./AccessibleModal";

interface ChowkaBaraGameProps {
  isOpen: boolean;
  onClose: () => void;
  attempts: number;
  onComplete: (won: boolean, attempts: number) => void;
}

export default function ChowkaBaraGame({
  isOpen,
  onClose,
  attempts,
  onComplete,
}: ChowkaBaraGameProps) {
  // Game Board Positions (Track 0 to 12; Position 12 is Home)
  const [playerPieces, setPlayerPieces] = useState<[number, number]>([0, 0]);
  const [aiPieces, setAiPieces] = useState<[number, number]>([0, 0]);
  const [currentTurn, setCurrentTurn] = useState<"player" | "ai">("player");
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [cowries, setCowries] = useState<boolean[]>([true, false, true, false]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameStatus, setGameStatus] = useState<"playing" | "player_won" | "ai_won">("playing");
  const [gameAttempts, setGameAttempts] = useState(attempts);
  const [dialogueMessage, setDialogueMessage] = useState<string>(
    "Roll the four sacred cowrie shells to advance your carved stone pawns toward the central sanctuary."
  );

  // Timer references for clean cancellation
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
  }, []);

  const resetMatchState = useCallback(() => {
    setPlayerPieces([0, 0]);
    setAiPieces([0, 0]);
    setCurrentTurn("player");
    setLastRoll(null);
    setIsRolling(false);
    setGameStatus("playing");
    setDialogueMessage(
      "Roll the four sacred cowrie shells to advance your carved stone pawns toward the central sanctuary."
    );
  }, []);

  // Cancel pending turn work & reset in-progress match state when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      resetMatchState();
    }
    return () => {
      clearAllTimers();
    };
  }, [isOpen, clearAllTimers, resetMatchState]);

  // Cowrie Shell Roll Mechanics
  // 4 shells: Count open faces. 0 open = 8 (Ashta), 4 open = 4 (Chowka), otherwise 1, 2, or 3.
  const rollCowries = (): { roll: number; faces: boolean[] } => {
    const faces = [
      Math.random() > 0.45,
      Math.random() > 0.45,
      Math.random() > 0.45,
      Math.random() > 0.45,
    ];
    const openCount = faces.filter(Boolean).length;
    let roll = openCount;
    if (openCount === 0) roll = 8;
    else if (openCount === 4) roll = 4;
    return { roll, faces };
  };

  const executeAiTurn = useCallback(() => {
    const { roll, faces } = rollCowries();
    setCowries(faces);
    setLastRoll(roll);

    setAiPieces((prevAi) => {
      const a1 = prevAi[0];
      const a2 = prevAi[1];

      let nextAiPieces: [number, number];
      if (a1 + roll <= 12 && a1 <= a2) {
        nextAiPieces = [a1 + roll, a2];
      } else if (a2 + roll <= 12) {
        nextAiPieces = [a1, a2 + roll];
      } else if (a1 + roll <= 12) {
        nextAiPieces = [a1 + roll, a2];
      } else {
        nextAiPieces = [a1, a2];
      }

      if (nextAiPieces[0] === 12 && nextAiPieces[1] === 12) {
        setGameStatus("ai_won");
        setGameAttempts((prevAtt) => {
          const nextAtt = prevAtt + 1;
          if (nextAtt >= 2) {
            setDialogueMessage(
              "Vidyaranya smiles warmly: 'A true leader is not measured by winning every board game, but by their resilience and inner purpose. You have proven your spirit.'"
            );
          } else {
            setDialogueMessage(
              "Vidyaranya's pawns reach the sanctuary first. 'A good strategist learns from each turn of fortune. Try again, traveler!'"
            );
          }
          return nextAtt;
        });
      } else {
        setCurrentTurn("player");
        setDialogueMessage(`Vidyaranya rolled ${roll}. Your turn to cast the cowries!`);
      }

      return nextAiPieces;
    });
  }, []);

  const handlePlayerRoll = () => {
    if (isRolling || currentTurn !== "player" || gameStatus !== "playing") return;

    clearAllTimers();
    setIsRolling(true);
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

        const p1 = playerPieces[0];
        const p2 = playerPieces[1];

        let nextPieces: [number, number];
        if (p1 + roll <= 12 && p1 <= p2) {
          nextPieces = [p1 + roll, p2];
        } else if (p2 + roll <= 12) {
          nextPieces = [p1, p2 + roll];
        } else if (p1 + roll <= 12) {
          nextPieces = [p1 + roll, p2];
        } else {
          nextPieces = [p1, p2];
          setDialogueMessage(`Rolled ${roll}! A leap too far — steady your next roll.`);
        }

        setPlayerPieces(nextPieces);

        // Check Victory
        if (nextPieces[0] === 12 && nextPieces[1] === 12) {
          setGameStatus("player_won");
          setDialogueMessage(
            "Splendid match! You navigated the stone grid with patience and strategic grace."
          );
          return;
        }

        // Switch to Sage Vidyaranya AI turn
        setCurrentTurn("ai");
        setDialogueMessage(`You rolled ${roll}! Vidyaranya observes and prepares his counter-move.`);

        // AI Turn Delay with tracked timeout
        aiTimeoutRef.current = setTimeout(() => {
          executeAiTurn();
          aiTimeoutRef.current = null;
        }, 1200);
      }
    }, 80);
  };

  const handleRestartMatch = () => {
    clearAllTimers();
    resetMatchState();
  };

  const handleFinish = () => {
    clearAllTimers();
    const won = gameStatus === "player_won";
    onComplete(won, gameAttempts);
  };

  const handleModalClose = () => {
    clearAllTimers();
    resetMatchState();
    onClose();
  };

  // Board Tracks 0 to 12 Representation
  const boardCells = [
    { id: 0, label: "Start", safe: true },
    { id: 1, label: "Stone 1", safe: false },
    { id: 2, label: "Stone 2", safe: false },
    { id: 3, label: "Katti 3", safe: true },
    { id: 4, label: "Stone 4", safe: false },
    { id: 5, label: "Stone 5", safe: false },
    { id: 6, label: "Katti 6", safe: true },
    { id: 7, label: "Stone 7", safe: false },
    { id: 8, label: "Stone 8", safe: false },
    { id: 9, label: "Katti 9", safe: true },
    { id: 10, label: "Inner 10", safe: false },
    { id: 11, label: "Inner 11", safe: false },
    { id: 12, label: "Sanctuary (Home)", safe: true },
  ];

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleModalClose}
      titleId="chowka-bara-title"
      maxWidthClass="max-w-2xl"
      containerClassName="p-6"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#3d3328] border border-[#d4a359] flex items-center justify-center text-xl shadow-inner">
            🎲
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.2em]">
              Traditional Karnataka Board Match
            </div>
            <h2 id="chowka-bara-title" className="text-xl font-serif font-bold text-[#f6ede0]">
              Chowka Bara with Sage Vidyaranya
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleModalClose}
          className="text-[#a89985] hover:text-[#f6ede0] text-sm bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          ✕ Exit
        </button>
      </div>

      {/* Narrative & Dialogue Guidance Box */}
      <div className="p-3.5 rounded-xl bg-[#26201b] border border-[#473d32] text-xs font-serif leading-relaxed text-[#eedfc8] mb-5 flex items-start gap-3">
        <span className="text-2xl mt-0.5">📿</span>
        <p className="flex-1 italic">{dialogueMessage}</p>
      </div>

      {/* Score & Piece Status Banner */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Player Box */}
        <div className="p-3 rounded-xl bg-[#2b2520] border-2 border-[#d4a359] flex items-center justify-between shadow-md">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#d4a359]">
              Your Pawns (Gold)
            </div>
            <div className="text-sm font-serif font-bold text-[#f6ede0] mt-0.5">
              Pawn 1: {playerPieces[0]}/12 • Pawn 2: {playerPieces[1]}/12
            </div>
          </div>
          <div className="flex gap-1">
            <span className={`text-lg ${playerPieces[0] === 12 ? "opacity-40" : ""}`}>🟡</span>
            <span className={`text-lg ${playerPieces[1] === 12 ? "opacity-40" : ""}`}>🟡</span>
          </div>
        </div>

        {/* Vidyaranya Box */}
        <div className="p-3 rounded-xl bg-[#231e1a] border-2 border-[#c86446] flex items-center justify-between shadow-md">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#c86446]">
              Vidyaranya (Terracotta)
            </div>
            <div className="text-sm font-serif font-bold text-[#f6ede0] mt-0.5">
              Pawn 1: {aiPieces[0]}/12 • Pawn 2: {aiPieces[1]}/12
            </div>
          </div>
          <div className="flex gap-1">
            <span className={`text-lg ${aiPieces[0] === 12 ? "opacity-40" : ""}`}>🔴</span>
            <span className={`text-lg ${aiPieces[1] === 12 ? "opacity-40" : ""}`}>🔴</span>
          </div>
        </div>
      </div>

      {/* Visual Board Track Grid */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 p-3.5 bg-[#171412] rounded-xl border border-[#383027] mb-5">
        {boardCells.map((cell) => {
          const hasP1 = playerPieces[0] === cell.id;
          const hasP2 = playerPieces[1] === cell.id;
          const hasA1 = aiPieces[0] === cell.id;
          const hasA2 = aiPieces[1] === cell.id;

          return (
            <div
              key={cell.id}
              className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-between min-h-[55px] ${
                cell.id === 12
                  ? "bg-[#3d3328] border-[#d4a359] text-[#f6ede0] shadow-md md:col-span-1"
                  : cell.safe
                  ? "bg-[#25201b] border-[#5a4d3f] text-[#d6c7b2]"
                  : "bg-[#1c1815] border-[#29231e] text-[#8c7e6d]"
              }`}
            >
              <span className="text-[9px] font-mono font-bold tracking-tight">
                {cell.id === 12 ? "🏛️ HOME" : cell.safe ? `✦ ${cell.label}` : cell.label}
              </span>

              {/* Tokens on this tile */}
              <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                {hasP1 && <span title="Your Pawn 1" className="text-xs">🟡</span>}
                {hasP2 && <span title="Your Pawn 2" className="text-xs">🟡</span>}
                {hasA1 && <span title="Vidyaranya Pawn 1" className="text-xs">🔴</span>}
                {hasA2 && <span title="Vidyaranya Pawn 2" className="text-xs">🔴</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cowrie Shells Cast Tray */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#231e1a] border border-[#3d3329] mb-4">
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#a89985]">
            Cowrie Shells:
          </div>
          <div className="flex gap-2">
            {cowries.map((openFace, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg shadow-inner transition-transform ${
                  openFace
                    ? "bg-[#e5d4be] border-[#d4a359] text-[#2b2520] -translate-y-0.5"
                    : "bg-[#4a3f35] border-[#5a4d3f] text-[#d4a359]"
                }`}
                title={openFace ? "Mouth Up (1 Point)" : "Mouth Down"}
              >
                🐚
              </div>
            ))}
          </div>
          {lastRoll !== null && (
            <div className="ml-2 px-2.5 py-1 rounded bg-[#171412] border border-[#d4a359] text-xs font-mono font-bold text-[#d4a359]">
              Roll: {lastRoll} {lastRoll === 8 ? "(Ashta!)" : lastRoll === 4 ? "(Chowka!)" : "steps"}
            </div>
          )}
        </div>

        {/* Action Button */}
        {gameStatus === "playing" ? (
          <button
            type="button"
            onClick={handlePlayerRoll}
            disabled={isRolling || currentTurn !== "player"}
            className={`px-6 py-2.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
              currentTurn === "player" && !isRolling
                ? "bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] active:translate-y-0.5"
                : "bg-[#2b2520] text-[#6b6053] border border-[#3d3329] cursor-not-allowed"
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
                className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#d4a359] text-[#f6ede0] font-serif font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
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

      {/* Footer Guidance */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#8c7e6d] pt-2 border-t border-[#383027]">
        <span>Attempts Logged: {gameAttempts}</span>
        <span>Karnataka Traditional Strategy Game • 1336 AD</span>
      </div>
    </AccessibleModal>
  );
}
