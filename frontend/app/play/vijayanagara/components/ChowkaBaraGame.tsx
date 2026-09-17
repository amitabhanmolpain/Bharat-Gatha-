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
  const [playerPieces, setPlayerPieces] = useState<number[]>([-1, -1, -1, -1]);
  const [aiPieces, setAiPieces] = useState<number[]>([-1, -1, -1, -1]);
  const [playerHasKadi, setPlayerHasKadi] = useState(false);
  const [aiHasKadi, setAiHasKadi] = useState(false);

  const [currentTurn, setCurrentTurn] = useState<"player" | "ai">("player");
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [cowries, setCowries] = useState<boolean[]>([true, false, true, false]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameStatus, setGameStatus] = useState<"playing" | "player_won" | "ai_won">("playing");
  const [gameAttempts, setGameAttempts] = useState(attempts);
  const [awaitingPawnSelection, setAwaitingPawnSelection] = useState(false);
  const [selectablePawns, setSelectablePawns] = useState<number[]>([]);
  const [dialogueMessage, setDialogueMessage] = useState<string>(
    "Roll the four cowrie shells. A roll of 4 or 8 lets a pawn enter the board!"
  );
  const [turnCount, setTurnCount] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialPage, setTutorialPage] = useState(0);

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
    setPlayerPieces([-1, -1, -1, -1]);
    setAiPieces([-1, -1, -1, -1]);
    setPlayerHasKadi(false);
    setAiHasKadi(false);
    setCurrentTurn("player");
    setLastRoll(null);
    setIsRolling(false);
    setAwaitingPawnSelection(false);
    setSelectablePawns([]);
    setGameStatus("playing");
    setTurnCount(0);
    setDialogueMessage(
      "Roll the four cowrie shells. A roll of 4 or 8 lets a pawn enter the board!"
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
        "Roll the four cowrie shells. A roll of 4 or 8 lets a pawn enter the board!",
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
    nextPathIndices: number[],
    opponentPathIndices: number[]
  ) => {
    const movedPath = movingTeam === "player" ? PLAYER_PATH : AI_PATH;
    const oppPath = movingTeam === "player" ? AI_PATH : PLAYER_PATH;

    let updatedOpponent = [...opponentPathIndices];
    let captured = false;

    for (let i = 0; i < 4; i++) {
      const pIdx = nextPathIndices[i];
      if (pIdx >= 0 && pIdx < 24) { 
        const boardCell = movedPath[pIdx];
        if (!SAFE_SQUARES.has(boardCell)) {
          for (let j = 0; j < 4; j++) {
            const oppIdx = updatedOpponent[j];
            if (oppIdx >= 0 && oppIdx < 24) {
              if (oppPath[oppIdx] === boardCell) {
                updatedOpponent[j] = -1; // sent off-board
                captured = true;
              }
            }
          }
        }
      }
    }
    if (captured) {
      soundFx.playTileSwap(); 
    }
    return { updatedOpponent, captured };
  };

  const executeMove = (team: "player" | "ai", pieces: number[], oppPieces: number[], roll: number, hasKadi: boolean) => {
    const oppPath = team === "player" ? AI_PATH : PLAYER_PATH;
    const myPath = team === "player" ? PLAYER_PATH : AI_PATH;
    
    let bestMove = -1; 
    let bestScore = -100;
    
    for (let i = 0; i < 4; i++) {
      const pos = pieces[i];
      if (pos === -1) {
        if (roll === 4 || roll === 8) {
          const score = 50; // Entering is good
          if (score > bestScore) { bestScore = score; bestMove = i; }
        }
        continue;
      }
      
      if (pos >= 24) continue;
      
      const nextPos = pos + roll;
      if (nextPos > 24) continue;
      
      // Kadi (Kill) Requirement
      if (pos <= 15 && nextPos >= 16 && !hasKadi) continue;
      
      let score = nextPos; // Progress score
      
      const boardCell = myPath[nextPos];
      let captures = false;
      if (!SAFE_SQUARES.has(boardCell)) {
        for(let j=0; j<4; j++) {
          if (oppPieces[j] >= 0 && oppPieces[j] < 24 && oppPath[oppPieces[j]] === boardCell) {
            captures = true;
          }
        }
      }
      
      if (captures) score += 1000;
      if (nextPos === 24) score += 500;
      if (SAFE_SQUARES.has(boardCell)) score += 10;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    
    return bestMove;
  };

  const executeAiTurn = (currentAi: number[], currentPlayer: number[], currentKadi: boolean) => {
    soundFx.playCowrieShellsSound();
    setDialogueMessage("Vidyaranya is casting the cowrie shells...");

    const { roll, faces } = rollCowries();
    setCowries(faces);
    setLastRoll(roll);

    aiTimeoutRef.current = setTimeout(() => {
      let aPieces = [...currentAi];
      let pPieces = [...currentPlayer];
      let aKadi = currentKadi;
      let getsExtraThrow = roll === 4 || roll === 8;

      const moveIdx = executeMove("ai", aPieces, pPieces, roll, aKadi);
      if (moveIdx !== -1) {
        if (aPieces[moveIdx] === -1) {
          aPieces[moveIdx] = 0;
        } else {
          aPieces[moveIdx] += roll;
        }
        
        soundFx.playTileSwap();
        const { updatedOpponent, captured } = checkCollisionAndCapture("ai", aPieces, pPieces);
        if (captured) {
          aKadi = true;
          getsExtraThrow = true;
          for(let i=0; i<4; i++) pPieces[i] = updatedOpponent[i];
        }
      }

      setAiPieces(aPieces);
      setPlayerPieces(pPieces);
      setAiHasKadi(aKadi);

      if (aPieces.every(p => p === 24)) {
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
      } else if (getsExtraThrow) {
        let msg = "";
        if (captured) {
          msg = "I have captured your pawn! The extra throw is mine.";
        } else {
          const rollSpoken = roll === 8 ? "Ashta" : roll === 4 ? "Chowka" : "A capture";
          msg = `Vidyaranya scored ${rollSpoken} and gets an extra throw!`;
        }
        setDialogueMessage(msg);
        stopAllCharacterVoice();
        playNarration(msg, { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true });
        
        aiTimeoutRef.current = setTimeout(() => {
          executeAiTurn(aPieces, pPieces, aKadi);
        }, 2000);
      } else {
        setCurrentTurn("player");
        let aiMsg = "";
        if (aPieces[moveIdx] === 24) {
            aiMsg = "My pawn has reached the sanctuary safely. Your turn to cast!";
        } else {
            aiMsg = `Vidyaranya rolled a ${roll}. Your turn to cast!`;
        }
        setDialogueMessage(aiMsg);
        stopAllCharacterVoice();
        playNarration(aiMsg, {
          speaker: "ratan",
          pace: 0.88,
          language_code: "en-IN",
          hideSubtitle: true,
        });
      }
    }, 1000);
  };

  const handleMovePawn = (pawnIndex: number) => {
    setAwaitingPawnSelection(false);
    setSelectablePawns([]);

    const roll = lastRoll as number;
    let nextPieces = [...playerPieces];
    
    if (nextPieces[pawnIndex] === -1) {
      nextPieces[pawnIndex] = 0;
    } else {
      nextPieces[pawnIndex] += roll;
    }

    soundFx.playTileSwap();

    // Check collision / capture on AI
    const { updatedOpponent, captured } = checkCollisionAndCapture("player", nextPieces, aiPieces);
    let pKadi = playerHasKadi;
    let getsExtraThrow = roll === 4 || roll === 8;

    const finalAiPieces = captured ? updatedOpponent : aiPieces;

    if (captured) {
      setAiPieces(finalAiPieces);
      pKadi = true;
      getsExtraThrow = true;
      setPlayerHasKadi(true);
    }
    
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
    if (nextPieces.every(p => p === 24)) {
      clearAllTimers();
      setGameStatus("player_won");
      setDialogueMessage(
        "🏆 Splendid match! All your Golden Gotis have reached the Sanctuary. You have won Vidyaranya's blessing!"
      );
      stopAllCharacterVoice();
      playNarration(
        "Splendid match! You navigated the board with patience and skill, winning Vidyaranya's blessing!",
        { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
      );
      return;
    }

    if (getsExtraThrow) {
      let msg = "";
      if (captured) {
        msg = "Excellent! You have captured my pawn. The extra throw is yours!";
      } else {
        const rollSpoken = roll === 8 ? "Ashta" : roll === 4 ? "Chowka" : "A capture";
        msg = `You scored ${rollSpoken} and get an extra throw!`;
      }
      setDialogueMessage(msg);
      stopAllCharacterVoice();
      playNarration(msg, { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true });
      return; 
    }

    setCurrentTurn("ai");
    let msg = "";
    if (nextPieces[pawnIndex] === 24) {
      msg = "Your pawn has reached the sanctuary safely! Now it is my turn.";
    } else {
      const rollSpoken = roll === 8 ? "Ashta" : roll === 4 ? "Chowka" : `a ${roll}`;
      msg = `You scored ${rollSpoken}. Now it is Vidyaranya's turn.`;
    }
    setDialogueMessage(`You moved Pawn ${pawnIndex + 1}. Vidyaranya prepares his move...`);
    stopAllCharacterVoice();
    playNarration(msg, {
      speaker: "ratan",
      pace: 0.88,
      language_code: "en-IN",
      hideSubtitle: true,
    });

    aiTimeoutRef.current = setTimeout(() => {
      executeAiTurn(finalAiPieces, nextPieces, aiHasKadi);
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

        const pPieces = [...playerPieces];
        const aPieces = [...aiPieces];
        let pKadi = playerHasKadi;
        let moved = false;
        let getsExtraThrow = roll === 4 || roll === 8;
        
        const currentTurnCount = turnCount + 1;
        if (!getsExtraThrow) setTurnCount(currentTurnCount);

        const moveIdx = executeMove("player", pPieces, aPieces, roll, pKadi);
        if (moveIdx !== -1) {
          moved = true;
          if (pPieces[moveIdx] === -1) {
            pPieces[moveIdx] = 0;
          } else {
            pPieces[moveIdx] += roll;
          }
          
          soundFx.playTileSwap();
          const { updatedOpponent, captured } = checkCollisionAndCapture("player", pPieces, aPieces);
          if (captured) {
            pKadi = true;
            getsExtraThrow = true;
            for(let i=0; i<4; i++) aPieces[i] = updatedOpponent[i];
          }
        } else {
          setDialogueMessage(`Rolled ${roll}! No valid moves available.`);
        }

        setPlayerPieces(pPieces);
        setAiPieces(aPieces);
        setPlayerHasKadi(pKadi);

        if (pPieces.every(p => p === 24)) {
          setGameStatus("player_won");
          setDialogueMessage(
            "Splendid match! You navigated all pawns to the Sanctuary with patience and skill."
          );
          stopAllCharacterVoice();
          playNarration(
            "Splendid match! You navigated all pawns to the sanctuary with patience and skill, winning Vidyaranya's blessing!",
            { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
          );

          return;
        } else if (currentTurnCount >= 30) {
          setGameStatus("player_won");
          setDialogueMessage(
            "We have played long enough! You have grasped the authentic rules of the game. I grant you my blessing."
          );
          stopAllCharacterVoice();
          playNarration(
            "We have played long enough! You have grasped the authentic rules of the game. I grant you my blessing.",
            { speaker: "ratan", pace: 0.88, language_code: "en-IN", hideSubtitle: true }
          );
          return;
        }

        if (getsExtraThrow) {
          const rollSpoken = roll === 8 ? "Ashta! (8)" : roll === 4 ? "Chowka! (4)" : "A capture!";
          setDialogueMessage(`${rollSpoken} You get an extra throw!`);
        } else {
          setCurrentTurn("ai");
          const rollSpoken = `You rolled a ${roll}! Vidyaranya observes and prepares his counter-move.`;
          if (moved) setDialogueMessage(rollSpoken);
          
          aiTimeoutRef.current = setTimeout(() => {
            executeAiTurn(aPieces, pPieces, aiHasKadi);
          }, 2500); 
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
      containerClassName="p-4 sm:p-5"
    >
      <div className="flex items-center justify-between pb-2 border-b-2 border-[#3d4b3b] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2b3a2a] border border-[#a8c3a6] flex items-center justify-center shadow-inner">
            <GameIcon name="sage" size={16} className="text-[#a8c3a6]" />
          </div>
          <div>
            <div className="text-[9px] font-mono text-[#a8c3a6] uppercase tracking-[0.2em]">
              Traditional Karnataka Board Match
            </div>
            <h2 id="chowka-bara-title" className="text-lg font-serif font-bold text-[#e8f1e6]">
              Chowka Bara with Sage Vidyaranya
            </h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={startLearningMode}
            className="text-[#96a992] hover:text-[#e8f1e6] text-xs bg-[#1c291b] hover:bg-[#2b3a2a] border border-[#3d4b3b] px-2 py-1 rounded-lg transition-all cursor-pointer"
          >
            ❓ How to Play
          </button>
          <button
            type="button"
            onClick={handleModalClose}
            className="text-[#96a992] hover:text-[#e8f1e6] text-xs bg-[#1c291b] hover:bg-[#2b3a2a] border border-[#3d4b3b] px-2 py-1 rounded-lg transition-all cursor-pointer"
          >
            ✕ Exit
          </button>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-[#1c241a] border border-[#31422f] text-xs font-serif leading-relaxed text-[#cde0cb] mb-3 flex items-start gap-2">
        <span className="text-xl mt-0.5">📿</span>
        <p className="flex-1 italic">{dialogueMessage}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-[#222e20] border border-[#d4a359] flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start w-full">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#d4a359]">
              Your Pawns (Gold)
            </div>
            <div className="flex gap-0.5">
              {playerPieces.map((p, idx) => (
                <span key={idx} className={`text-xs ${p === 24 ? "opacity-30" : ""}`}>🟡</span>
              ))}
            </div>
          </div>
          <div className="text-[10px] font-serif font-bold text-[#e8f1e6] mt-1 flex justify-between w-full">
            <span>{playerPieces.filter(p => p===24).length}/4 Home</span>
            <span className={playerHasKadi ? "text-[#a8c3a6]" : "text-[#d4a359] opacity-70"}>
              {playerHasKadi ? "✓ Kadi (Kill)" : "Kadi Required"}
            </span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-[#222e20] border border-[#c86446] flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start w-full">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#c86446]">
              Vidyaranya (Terracotta)
            </div>
            <div className="flex gap-0.5">
              {aiPieces.map((p, idx) => (
                <span key={idx} className={`text-xs ${p === 24 ? "opacity-30" : ""}`}>🔴</span>
              ))}
            </div>
          </div>
          <div className="text-[10px] font-serif font-bold text-[#e8f1e6] mt-1 flex justify-between w-full">
            <span>{aiPieces.filter(p => p===24).length}/4 Home</span>
            <span className={aiHasKadi ? "text-[#a8c3a6]" : "text-[#c86446] opacity-70"}>
              {aiHasKadi ? "✓ Kadi (Kill)" : "Kadi Required"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <div className="grid grid-cols-5 gap-0.5 p-2 bg-[#1e2a1d] rounded-lg border-2 border-[#121c11] shadow-xl w-fit">
          {Array.from({ length: 25 }).map((_, i) => {
            const isSafe = SAFE_SQUARES.has(i);
            const isHome = i === 12;
            
            const pCount = playerPieces.filter(p => p >= 0 && PLAYER_PATH[p] === i).length;
            const aCount = aiPieces.filter(p => p >= 0 && AI_PATH[p] === i).length;
            
            return (
              <div
                key={i}
                className={`w-12 h-12 sm:w-14 sm:h-14 flex flex-wrap items-center justify-center p-0.5 rounded-sm border border-[#2b3a2a] relative overflow-hidden ${
                  isHome
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

                <div className="z-10 flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {Array.from({ length: pCount }).map((_, idx) => (
                    <span key={`p-${idx}`} className="text-xs sm:text-sm drop-shadow-md">🟡</span>
                  ))}
                  {Array.from({ length: aCount }).map((_, idx) => (
                    <span key={`a-${idx}`} className="text-xs sm:text-sm drop-shadow-md">🔴</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-[#1c241a] border border-[#2b3a2a] mb-2">
        <div className="flex items-center gap-2">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#96a992]">
            Cowrie Shells:
          </div>
          <div className="flex gap-1.5">
            {cowries.map((openFace, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm shadow-inner transition-transform ${
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
            <div className="ml-1 px-2 py-0.5 rounded bg-[#151c14] border border-[#d4a359] text-[10px] font-mono font-bold text-[#d4a359]">
              Roll: {lastRoll} {lastRoll === 8 ? "(Ashta!)" : lastRoll === 4 ? "(Chowka!)" : ""}
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
        <span>Attempts: {gameAttempts} (Turns: {turnCount}/30 soft limit)</span>
        <span>Karnataka Traditional Strategy Game &bull; 1336 AD</span>
      </div>

      {showTutorial && (
        <div className="absolute inset-0 bg-[#121c11]/90 z-50 flex items-center justify-center p-3 rounded-xl">
          <div className="bg-[#1c241a] border border-[#d4a359] p-4 rounded-xl max-w-sm w-full shadow-2xl relative">
            <h3 className="text-lg font-serif font-bold text-[#e8f1e6] mb-3 border-b border-[#31422f] pb-1">Authentic Chowka Bara</h3>
            
            <div className="text-xs text-[#cde0cb] space-y-2 mb-4 min-h-[120px]">
              {tutorialPage === 0 && <p><strong>Goal:</strong> Move all 4 of your gold pawns to the center square (Sanctuary) before Sage Vidyaranya does.</p>}
              {tutorialPage === 1 && <p><strong>Entering the Board:</strong> Pawns start off-board. You MUST roll a 4 (Chowka) or 8 (Ashta/Bara) to bring a new pawn onto the start square.</p>}
              {tutorialPage === 2 && <p><strong>Kadi (Kill) Rule:</strong> A pawn cannot enter the inner path until your team has made at least ONE capture (Kadi) against the opponent. Crossed squares are safe zones.</p>}
              {tutorialPage === 3 && <p><strong>Extra Throws:</strong> If you roll a 4 or 8, OR if you land on an opponent and capture them, you get an extra throw immediately!</p>}
              {tutorialPage === 4 && <p><strong>Game Length:</strong> This authentic version can take a long time! If the game goes over 30 turns, Vidyaranya will acknowledge your skill and grant his blessing anyway.</p>}
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={() => setTutorialPage(prev => Math.max(0, prev - 1))}
                disabled={tutorialPage === 0}
                className="px-3 py-1.5 bg-[#222e20] text-[#96a992] text-xs rounded-md disabled:opacity-50 hover:bg-[#2b3a2a] transition-colors"
              >
                Previous
              </button>
              <span className="text-[10px] font-bold tracking-widest text-[#71856c]">{tutorialPage + 1} / 5</span>
              {tutorialPage < 4 ? (
                <button 
                  onClick={() => setTutorialPage(prev => Math.min(4, prev + 1))}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#8b6528] to-[#d4a359] text-[#141210] text-xs rounded-md font-bold hover:brightness-110 transition-all shadow-md"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={() => { setShowTutorial(false); setTutorialPage(0); }}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#8b6528] to-[#d4a359] text-[#141210] text-xs rounded-md font-bold hover:brightness-110 transition-all shadow-md"
                >
                  Got it!
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AccessibleModal>
  );
}

