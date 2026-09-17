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

type TutorialStep =
  | "inactive"
  | "intro"
  | "pawns_board"
  | "roll_cowries"
  | "roll_result"
  | "move_pawn"
  | "opponent_turn"
  | "safe_spaces"
  | "captures"
  | "center_goal"
  | "summary";

export default function ChowkaBaraGame({
  isOpen,
  onClose,
  attempts,
  onComplete,
}: ChowkaBaraGameProps) {
  // Track pieces by their path index: 0 to 24 (24 is Home/Sanctuary)
  const [playerPieces, setPlayerPieces] = useState<[number, number]>([0, 0]);
  const [aiPieces, setAiPieces] = useState<[number, number]>([0, 0]);
  const [currentTurn, setCurrentTurn] = useState<"player" | "ai">("player");
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [cowries, setCowries] = useState<boolean[]>([true, false, true, false]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameStatus, setGameStatus] = useState<"playing" | "player_won" | "ai_won">("playing");
  const [gameAttempts, setGameAttempts] = useState(attempts);
  const [awaitingPawnSelection, setAwaitingPawnSelection] = useState(false);
  const [selectablePawns, setSelectablePawns] = useState<number[]>([]);
  const [dialogueMessage, setDialogueMessage] = useState<string>(
    "Roll the four cowrie shells to advance your pawns toward the center."
  );

  // Tutorial / Learning Mode State
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>("inactive");

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
    clearAllTimers();
    setPlayerPieces([0, 0]);
    setAiPieces([0, 0]);
    setCurrentTurn("player");
    setLastRoll(null);
    setIsRolling(false);
    setAwaitingPawnSelection(false);
    setSelectablePawns([]);
    setGameStatus("playing");
    setTutorialStep("inactive");
    setDialogueMessage(
      "Roll the four cowrie shells to advance your pawns toward the center."
    );
  }, [clearAllTimers]);

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
    if (openCount === 0) roll = 8; // Ashta!
    else if (openCount === 4) roll = 4; // Chowka!
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
                updatedOpponent[j] = 0; // Captured! Sent back to starting square
                soundFx.playTileSwap();
              }
            }
          }
        }
      }
    }
    return updatedOpponent;
  };

  // AI Turn Execution
  const executeAiTurn = useCallback(() => {
    if (gameStatus !== "playing") return;

    soundFx.playCowrieShellsSound();
    setDialogueMessage("Vidyaranya is casting the cowrie shells...");

    const { roll, faces } = rollCowries();
    setCowries(faces);
    setLastRoll(roll);

    aiTimeoutRef.current = setTimeout(() => {
      aiTimeoutRef.current = null;
      if (gameStatus !== "playing") return;

      setAiPieces((prevAi) => {
        const a1 = prevAi[0];
        const a2 = prevAi[1];

        // Determine legal moves for AI
        const a1CanMove = a1 < 24 && a1 + roll <= 24;
        const a2CanMove = a2 < 24 && a2 + roll <= 24;

        let nextAiPieces: [number, number] = [a1, a2];
        let aiMoved = false;

        if (a1CanMove && a2CanMove) {
          // AI strategy: move the piece that advances closer to finish or balances progression
          if (a1 <= a2) {
            nextAiPieces = [a1 + roll, a2];
          } else {
            nextAiPieces = [a1, a2 + roll];
          }
          aiMoved = true;
        } else if (a1CanMove) {
          nextAiPieces = [a1 + roll, a2];
          aiMoved = true;
        } else if (a2CanMove) {
          nextAiPieces = [a1, a2 + roll];
          aiMoved = true;
        }

        if (aiMoved) {
          soundFx.playTileSwap();
          setPlayerPieces((prevPlayer) =>
            checkCollisionAndCapture("ai", nextAiPieces, prevPlayer)
          );
        }

        // Check if AI Won
        if (nextAiPieces[0] === 24 && nextAiPieces[1] === 24) {
          clearAllTimers();
          setGameStatus("ai_won");
          setGameAttempts((prevAtt) => {
            const nextAtt = prevAtt + 1;
            const endMsg =
              nextAtt >= 2
                ? "Vidyaranya smiles warmly: 'True leadership comes from resilience. You have proven your spirit.'"
                : "Vidyaranya's pawns reach the sanctuary first. 'A wise strategist learns from each turn. Try again!'";
            setDialogueMessage(endMsg);
            stopAllCharacterVoice();
            playNarration(endMsg, {
              speaker: "ratan",
              pace: 0.88,
              language_code: "en-IN",
              hideSubtitle: true,
            });
            return nextAtt;
          });
          return nextAiPieces;
        }

        // If not won, hand turn back to player
        setCurrentTurn("player");
        const rollDesc =
          roll === 8
            ? "Vidyaranya rolled an 8 (Ashta!)"
            : roll === 4
            ? "Vidyaranya rolled a 4 (Chowka!)"
            : `Vidyaranya rolled ${roll}`;

        const aiMsg = aiMoved
          ? `${rollDesc} and moved his pawn. Your turn to cast!`
          : `${rollDesc} but had no legal move. Your turn to cast!`;

        setDialogueMessage(aiMsg);
        stopAllCharacterVoice();
        playNarration(`Vidyaranya rolled a ${roll}. Your turn to cast!`, {
          speaker: "ratan",
          pace: 0.88,
          language_code: "en-IN",
          hideSubtitle: true,
        });

        return nextAiPieces;
      });
    }, 1200);
  }, [clearAllTimers, gameStatus]);

  // Execute Player Pawn Move
  const handleMovePawn = (pawnIndex: number) => {
    if (gameStatus !== "playing" || currentTurn !== "player" || lastRoll === null) return;
    if (!selectablePawns.includes(pawnIndex)) return;

    setAwaitingPawnSelection(false);
    setSelectablePawns([]);

    const roll = lastRoll;
    const p1 = playerPieces[0];
    const p2 = playerPieces[1];

    let nextPieces: [number, number] = [p1, p2];
    if (pawnIndex === 0) {
      nextPieces = [p1 + roll, p2];
    } else {
      nextPieces = [p1, p2 + roll];
    }

    soundFx.playTileSwap();

    // Check collision / capture on AI
    setAiPieces((prevAi) => checkCollisionAndCapture("player", nextPieces, prevAi));
    setPlayerPieces(nextPieces);

    // If Tutorial is active, advance to next tutorial step
    if (tutorialStep === "move_pawn") {
      setTutorialStep("opponent_turn");
      setDialogueMessage(
        "Well done! Now Vidyaranya will cast his shells and move his Terracotta pawns from the opposite corner."
      );
      stopAllCharacterVoice();
      playNarration(
        "Well done! Now watch Vidyaranya respond with his move from the upper corner.",
        { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
      );
    }

    // CHECK WIN CONDITION IMMEDIATELY
    if (nextPieces[0] === 24 && nextPieces[1] === 24) {
      clearAllTimers();
      setGameStatus("player_won");
      setDialogueMessage(
        "🏆 Splendid match! Both your Golden Gotis have reached the Sanctuary. You have won Vidyaranya's blessing!"
      );
      stopAllCharacterVoice();
      playNarration(
        "Splendid match! You navigated the board with patience and skill, winning Vidyaranya's blessing!",
        { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
      );
      return;
    }

    // Turn passes to AI
    setCurrentTurn("ai");
    const rollSpoken =
      roll === 8
        ? "Ashta! You rolled an eight! Your pawn leaps forward."
        : roll === 4
        ? "Chowka! You rolled a four! Your pawn surges ahead."
        : `You rolled a ${roll}! Your pawn advances.`;

    setDialogueMessage(`You moved Pawn ${pawnIndex + 1}. Vidyaranya prepares his move...`);
    stopAllCharacterVoice();
    playNarration(rollSpoken, {
      speaker: "ratan",
      pace: 0.88,
      language_code: "en-IN",
      hideSubtitle: true,
    });

    aiTimeoutRef.current = setTimeout(() => {
      executeAiTurn();
    }, 1800);
  };

  // Player Cast Cowrie Shells
  const handlePlayerRoll = () => {
    if (isRolling || currentTurn !== "player" || gameStatus !== "playing") return;
    if (awaitingPawnSelection) return;

    clearAllTimers();
    setIsRolling(true);
    setSelectablePawns([]);

    stopAllCharacterVoice();
    soundFx.playCowrieShellsSound();

    let spins = 0;
    spinIntervalRef.current = setInterval(() => {
      setCowries([
        Math.random() > 0.5,
        Math.random() > 0.5,
        Math.random() > 0.5,
        Math.random() > 0.5,
      ]);
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

        // Evaluate legal moves for Player
        const p1 = playerPieces[0];
        const p2 = playerPieces[1];

        const p1Legal = p1 < 24 && p1 + roll <= 24;
        const p2Legal = p2 < 24 && p2 + roll <= 24;

        if (tutorialStep === "roll_cowries") {
          setTutorialStep("roll_result");
          const rollName =
            roll === 8 ? "an Ashta (8 points)" : roll === 4 ? "a Chowka (4 points)" : `${roll} points`;
          setDialogueMessage(
            `You cast ${rollName}! In Chowka Bara, cowrie mouths facing upward count as points (all down = 8, all up = 4).`
          );
          stopAllCharacterVoice();
          playNarration(
            `You cast ${rollName}! Now choose your pawn to advance.`,
            { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
          );
        }

        if (!p1Legal && !p2Legal) {
          // No legal moves possible (e.g. overshoots sanctuary)
          setDialogueMessage(
            `Rolled ${roll}! A leap beyond the sanctuary (no legal moves). Vidyaranya takes his turn.`
          );
          stopAllCharacterVoice();
          playNarration(
            `Rolled a ${roll}! A leap beyond the sanctuary — turn passes to Vidyaranya.`,
            { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
          );

          setCurrentTurn("ai");
          aiTimeoutRef.current = setTimeout(() => {
            executeAiTurn();
          }, 2000);
          return;
        }

        // Identify legal pawns
        const legalList: number[] = [];
        if (p1Legal) legalList.push(0);
        if (p2Legal) legalList.push(1);

        setSelectablePawns(legalList);
        setAwaitingPawnSelection(true);

        if (tutorialStep === "roll_result") {
          setTutorialStep("move_pawn");
        }

        if (legalList.length === 1) {
          setDialogueMessage(
            `Rolled ${roll}! Click the highlighted Golden Goti (Pawn ${legalList[0] + 1}) to move.`
          );
        } else {
          setDialogueMessage(
            `Rolled ${roll}! Choose which Golden Goti (Pawn 1 or Pawn 2) to advance.`
          );
        }
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
    if (won) {
      playNarration(
        "Well done, traveler! You carry Vidyaranya's blessing. Cross the Tungabhadra to enter Hampi Bazaar!",
        { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
      );
    }
    onComplete(won, gameAttempts);
  };

  const handleModalClose = () => {
    clearAllTimers();
    stopAllCharacterVoice();
    resetMatchState();
    onClose();
  };

  // Start Beginner Learning Mode
  const startLearningMode = () => {
    clearAllTimers();
    stopAllCharacterVoice();
    resetMatchState();
    setTutorialStep("intro");
    setDialogueMessage(
      "Namaste, seeker. I am Sage Vidyaranya. Welcome to Chowka Bara — the ancient 5x5 strategic race of Karnataka."
    );
    playNarration(
      "Namaste, seeker. I am Sage Vidyaranya. Let us learn Chowka Bara together step by step.",
      { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
    );
  };

  const advanceTutorial = () => {
    stopAllCharacterVoice();
    switch (tutorialStep) {
      case "intro":
        setTutorialStep("pawns_board");
        setDialogueMessage(
          "You command the two Golden Gotis (🟡) starting at the bottom-left corner. Your goal is to guide both into the Center Sanctuary (Cell 12)."
        );
        playNarration(
          "You command the Golden Gotis at the bottom corner. Your goal is to guide both into the Center Sanctuary.",
          { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
        );
        break;
      case "pawns_board":
        setTutorialStep("roll_cowries");
        setDialogueMessage(
          "Each turn, cast the 4 cowrie shells to determine your movement. Click the pulsing [Cast Cowrie Shells] button now!"
        );
        playNarration(
          "Click the Cast Cowrie Shells button to roll your distance.",
          { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
        );
        break;
      case "opponent_turn":
        setTutorialStep("safe_spaces");
        setDialogueMessage(
          "Notice the cross-marked squares (✖) on the four corners and the center. These are Safe Sanctuaries where pawns can never be captured."
        );
        playNarration(
          "Cross-marked squares are Safe Sanctuaries where your pawns are protected from captures.",
          { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
        );
        break;
      case "safe_spaces":
        setTutorialStep("captures");
        setDialogueMessage(
          "On regular unmarked squares, if your pawn lands on an opponent's pawn, it captures it and sends it all the way back to the start!"
        );
        playNarration(
          "Landing on an opponent on regular squares captures them and sends them back to the start.",
          { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
        );
        break;
      case "captures":
        setTutorialStep("center_goal");
        setDialogueMessage(
          "Pawns move around the outer ring, then spiral into the inner track, and finally enter the Center Sanctuary with an exact roll."
        );
        playNarration(
          "Pawns move along the outer perimeter, spiral inside, and enter the center with an exact count.",
          { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
        );
        break;
      case "center_goal":
        setTutorialStep("summary");
        setDialogueMessage(
          "The first player to bring BOTH pawns safely into the Center Sanctuary wins the match and receives my royal blessing!"
        );
        playNarration(
          "The first player to bring both pawns into the Center Sanctuary wins. You are now ready to play!",
          { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
        );
        break;
      case "summary":
        setTutorialStep("inactive");
        resetMatchState();
        break;
      default:
        break;
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleModalClose}
      titleId="chowka-bara-title"
      maxWidthClass="max-w-2xl"
      containerClassName="p-6"
    >
      {/* --- HEADER --- */}
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

        <div className="flex items-center gap-2">
          {tutorialStep === "inactive" ? (
            <button
              type="button"
              onClick={startLearningMode}
              className="text-[#d4a359] hover:text-[#fff] text-xs font-serif font-bold bg-[#292215] hover:bg-[#3d321d] border border-[#d4a359]/60 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Learn Chowka Bara rules step-by-step with Sage Vidyaranya"
            >
              <span>📖</span>
              <span>Learn How to Play</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTutorialStep("inactive");
                resetMatchState();
              }}
              className="text-amber-300 hover:text-amber-100 text-xs font-mono bg-neutral-900 border border-amber-600/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Skip Tutorial ✕
            </button>
          )}

          <button
            type="button"
            onClick={handleModalClose}
            className="text-[#96a992] hover:text-[#e8f1e6] text-sm bg-[#1c291b] hover:bg-[#2b3a2a] border border-[#3d4b3b] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {/* --- SAGE DIALOGUE & TUTOR PANEL --- */}
      <div
        className={`p-3.5 rounded-xl border text-xs font-serif leading-relaxed mb-4 flex items-start gap-3 transition-all ${
          tutorialStep !== "inactive"
            ? "bg-[#292215] border-[#d4a359] text-[#f4ecd8] shadow-[0_0_15px_rgba(212,163,89,0.15)]"
            : "bg-[#1c241a] border-[#31422f] text-[#cde0cb]"
        }`}
      >
        <span className="text-2xl mt-0.5">{tutorialStep !== "inactive" ? "🧘‍♂️" : "📿"}</span>
        <div className="flex-1">
          {tutorialStep !== "inactive" && (
            <div className="text-[10px] font-mono font-bold text-[#d4a359] uppercase tracking-widest mb-1">
              SAGE VIDYARANYA &bull; TUTORIAL GUIDE
            </div>
          )}
          <p className="italic">{dialogueMessage}</p>
        </div>

        {tutorialStep !== "inactive" &&
          tutorialStep !== "roll_cowries" &&
          tutorialStep !== "move_pawn" && (
            <button
              type="button"
              onClick={advanceTutorial}
              className="px-3 py-1.5 rounded-lg bg-[#d4a359] hover:bg-[#e5b56a] text-[#141210] font-mono text-[11px] font-bold tracking-wide transition-all cursor-pointer shrink-0 shadow"
            >
              {tutorialStep === "summary" ? "Start Game →" : "Got It →"}
            </button>
          )}
      </div>

      {/* --- PAWN SCOREBOARDS --- */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Player Pawns */}
        <div
          className={`p-3 rounded-xl bg-[#222e20] border-2 flex items-center justify-between shadow-md transition-all ${
            awaitingPawnSelection
              ? "border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              : "border-[#d4a359]"
          }`}
        >
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#d4a359]">
              Your Pawns (Gold)
            </div>
            <div className="text-xs sm:text-sm font-serif font-bold text-[#e8f1e6] mt-0.5">
              Pawn 1: {playerPieces[0]}/24 • Pawn 2: {playerPieces[1]}/24
            </div>
          </div>
          <div className="flex gap-2">
            {/* Pawn 1 Button */}
            <button
              type="button"
              onClick={() => handleMovePawn(0)}
              disabled={!awaitingPawnSelection || !selectablePawns.includes(0)}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                awaitingPawnSelection && selectablePawns.includes(0)
                  ? "bg-amber-500/30 border-2 border-amber-400 animate-pulse cursor-pointer hover:scale-105"
                  : playerPieces[0] === 24
                  ? "opacity-40 cursor-default"
                  : "opacity-80"
              }`}
              title={selectablePawns.includes(0) ? "Click to move Pawn 1" : "Pawn 1"}
            >
              <span className="text-base sm:text-lg">🟡</span>
              <span className="text-[10px] font-mono font-bold text-amber-200">#1</span>
            </button>

            {/* Pawn 2 Button */}
            <button
              type="button"
              onClick={() => handleMovePawn(1)}
              disabled={!awaitingPawnSelection || !selectablePawns.includes(1)}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                awaitingPawnSelection && selectablePawns.includes(1)
                  ? "bg-amber-500/30 border-2 border-amber-400 animate-pulse cursor-pointer hover:scale-105"
                  : playerPieces[1] === 24
                  ? "opacity-40 cursor-default"
                  : "opacity-80"
              }`}
              title={selectablePawns.includes(1) ? "Click to move Pawn 2" : "Pawn 2"}
            >
              <span className="text-base sm:text-lg">🟡</span>
              <span className="text-[10px] font-mono font-bold text-amber-200">#2</span>
            </button>
          </div>
        </div>

        {/* AI Pawns */}
        <div className="p-3 rounded-xl bg-[#222e20] border-2 border-[#c86446] flex items-center justify-between shadow-md">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#c86446]">
              Vidyaranya (Terracotta)
            </div>
            <div className="text-xs sm:text-sm font-serif font-bold text-[#e8f1e6] mt-0.5">
              Pawn 1: {aiPieces[0]}/24 • Pawn 2: {aiPieces[1]}/24
            </div>
          </div>
          <div className="flex gap-1.5">
            <span
              className={`px-2 py-1 rounded bg-red-950/40 border border-red-800/40 text-xs font-mono font-bold text-red-300 flex items-center gap-1 ${
                aiPieces[0] === 24 ? "opacity-40" : ""
              }`}
            >
              <span>🔴</span>
              <span>#1</span>
            </span>
            <span
              className={`px-2 py-1 rounded bg-red-950/40 border border-red-800/40 text-xs font-mono font-bold text-red-300 flex items-center gap-1 ${
                aiPieces[1] === 24 ? "opacity-40" : ""
              }`}
            >
              <span>🔴</span>
              <span>#2</span>
            </span>
          </div>
        </div>
      </div>

      {/* --- 5x5 BOARD --- */}
      <div className="flex justify-center mb-4">
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

            // Check if this square has a movable player piece
            const isP1Movable =
              awaitingPawnSelection && selectablePawns.includes(0) && showP1;
            const isP2Movable =
              awaitingPawnSelection && selectablePawns.includes(1) && showP2;

            // Tutorial highlights
            const isTutorialHighlight =
              (tutorialStep === "pawns_board" && (i === 20 || i === 12)) ||
              (tutorialStep === "safe_spaces" && isSafe) ||
              (tutorialStep === "center_goal" && isHome);

            return (
              <div
                key={i}
                onClick={() => {
                  if (isP1Movable) handleMovePawn(0);
                  else if (isP2Movable) handleMovePawn(1);
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 flex flex-wrap items-center justify-center p-1 rounded-sm border relative overflow-hidden transition-all ${
                  isP1Movable || isP2Movable
                    ? "cursor-pointer ring-2 ring-amber-400 bg-amber-950/40 animate-pulse border-amber-400"
                    : isTutorialHighlight
                    ? "ring-2 ring-[#d4a359] bg-[#2d422a] border-[#d4a359]"
                    : isHome
                    ? "bg-[#2d422a] border-2 border-[#d4a359]"
                    : isSafe
                    ? "bg-[#283827] border-[#2b3a2a]"
                    : "bg-[#182417] border-[#2b3a2a]"
                }`}
              >
                {/* Safe cross markers */}
                {isSafe && !isHome && (
                  <svg
                    className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="0" x2="100" y2="100" stroke="#d4a359" strokeWidth="4" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke="#d4a359" strokeWidth="4" />
                  </svg>
                )}

                {/* Sanctuary Center Icon */}
                {isHome && (
                  <svg
                    className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
                    viewBox="0 0 100 100"
                  >
                    <circle cx="50" cy="50" r="30" stroke="#d4a359" strokeWidth="4" fill="none" />
                    <circle cx="50" cy="50" r="15" fill="#d4a359" />
                  </svg>
                )}

                {/* Pawns */}
                <div className="z-10 flex gap-1 flex-wrap justify-center items-center">
                  {showP1 && (
                    <span
                      className={`text-sm sm:text-base drop-shadow-md transition-transform ${
                        isP1Movable ? "scale-125 animate-bounce" : ""
                      }`}
                      title="Player Pawn 1"
                    >
                      🟡
                    </span>
                  )}
                  {showP2 && (
                    <span
                      className={`text-sm sm:text-base drop-shadow-md transition-transform ${
                        isP2Movable ? "scale-125 animate-bounce" : ""
                      }`}
                      title="Player Pawn 2"
                    >
                      🟡
                    </span>
                  )}
                  {showA1 && (
                    <span className="text-sm sm:text-base drop-shadow-md" title="Vidyaranya Pawn 1">
                      🔴
                    </span>
                  )}
                  {showA2 && (
                    <span className="text-sm sm:text-base drop-shadow-md" title="Vidyaranya Pawn 2">
                      🔴
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- COWRIE SHELLS & ACTION BAR --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#1c241a] border border-[#2b3a2a] mb-3">
        {/* Cowrie Display */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#96a992]">
            Cowries:
          </div>
          <div className="flex gap-2">
            {cowries.map((openFace, idx) => (
              <div
                key={idx}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center text-lg shadow-inner transition-transform ${
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
            <div className="ml-1 px-2.5 py-1 rounded bg-[#151c14] border border-[#d4a359] text-xs font-mono font-bold text-[#d4a359]">
              Roll: {lastRoll} {lastRoll === 8 ? "(Ashta!)" : lastRoll === 4 ? "(Chowka!)" : "steps"}
            </div>
          )}
        </div>

        {/* Action Controls */}
        {gameStatus === "playing" ? (
          <div className="flex items-center gap-2">
            {awaitingPawnSelection ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif italic text-amber-300 animate-pulse">
                  Select Pawn to Move:
                </span>
                {selectablePawns.map((pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleMovePawn(pIdx)}
                    className="px-3.5 py-1.5 rounded-lg font-mono font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black border-2 border-black shadow cursor-pointer transition-transform active:scale-95"
                  >
                    Move Pawn #{pIdx + 1}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePlayerRoll}
                disabled={isRolling || currentTurn !== "player"}
                className={`px-5 py-2.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                  currentTurn === "player" && !isRolling
                    ? tutorialStep === "roll_cowries"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black ring-4 ring-amber-400/50 animate-bounce"
                      : "bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] active:translate-y-0.5"
                    : "bg-[#222e20] text-[#71856c] border border-[#31422f] cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-1.5 justify-center">
                  {isRolling
                    ? "Casting Shells..."
                    : currentTurn === "player"
                    ? "Cast Cowrie Shells"
                    : "Sage's Turn..."}
                  {!isRolling && currentTurn === "player" && <GameIcon name="dice" size={14} />}
                </div>
              </button>
            )}
          </div>
        ) : (
          /* WIN / LOSS STATE OVERLAY BUTTONS */
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRestartMatch}
              className="bg-[#222e20] hover:bg-[#2d422a] border border-[#d4a359] text-[#e8f1e6] font-serif font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              Play Again ↺
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className={`font-serif font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                gameStatus === "player_won"
                  ? "bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210]"
                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600"
              }`}
            >
              {gameStatus === "player_won"
                ? "Receive Vidyaranya's Blessing 📿"
                : "Proceed ➜"}
            </button>
          </div>
        )}
      </div>

      {/* --- FOOTER STATUS --- */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#71856c] pt-2 border-t border-[#31422f]">
        <span>Attempts Logged: {gameAttempts}</span>
        <span>Karnataka Traditional Strategy Game &bull; 1336 AD</span>
      </div>
    </AccessibleModal>
  );
}

