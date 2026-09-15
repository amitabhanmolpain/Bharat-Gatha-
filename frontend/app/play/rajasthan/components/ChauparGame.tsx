"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { soundFx } from "../../../../services/soundService";
import { recordGameWinToDatabase } from "../../../../services/gameProgressService";
import { playNarration, stopNarration } from "../../../../services/narratorService";

/**
 * Royal Indian Chaupar (Pachisi) Game Component
 *
 * Traditional Rajputana cross-board strategy game adaptation for Bharat Gatha.
 * Features:
 * - Strict 1:1 Aspect Square coordinate system matching /chaupar-board.jpg.
 * - 32-cell continuous perimeter loop + dedicated home lanes + central Charkoni (HOME).
 * - 2 independent Gold Gotis (Player) vs 2 Ruby Gotis (Buzurg Chacha).
 * - Animated long wooden pasa dice physics (rotational wobble, roll SFX, compact non-overflowing size).
 * - Step-by-step bouncing hop animation across intermediate board squares.
 * - Unified movement & legal-move calculation engine for both Player and Chacha AI.
 * - Safe castle squares, capturing mechanics, extra turns on doubles/captures.
 * - Fully offline capable with IndexedDB persistence via gameProgressService.
 */

export type PieceState = "home" | "circuit" | "home-lane" | "finished";

export interface ChauparPiece {
  id: string; // 'gold-1' | 'gold-2' | 'ruby-1' | 'ruby-2'
  player: "player" | "chacha";
  state: PieceState;
  circuitIndex: number | null; // 0..31 when in 'circuit'
  circuitStepsTaken: number;   // 0..31 steps taken along circuit from player's start index
  homeLaneIndex: number | null; // 0..3 when in 'home-lane'
  currentCoords: { x: number; y: number };
}

export interface LegalMove {
  pieceId: string;
  nextState: PieceState;
  nextCircuitIndex: number | null;
  nextStepsTaken: number;
  nextHomeLaneIndex: number | null;
  animationPath: { x: number; y: number }[];
  isCapture: boolean;
  capturedPieceId: string | null;
}

// -------------------------------------------------------------
// CENTRALIZED BOARD CONFIGURATION (Exact 1:1 map for chaupar-board.jpg)
// -------------------------------------------------------------
// Container is strict 1:1 square aspect ratio.
// 4 Arms: South (bottom), East (right), North (top), West (left)
// Shared Circuit: 32 cells (0 to 31 counter-clockwise around 4 arms)
// Player Home Lane: 4 cells up South middle column
// Chacha Home Lane: 4 cells down North middle column
// Central Sanctuary: Charkoni at (50.0%, 50.0%)

export const CHAUPAR_BOARD_CONFIG = {
  // 32 Shared Outer Circuit Cells
  circuit: [
    // South Arm (Right Col, heading UP towards center): 0..3
    { index: 0, x: 58.0, y: 90.0, safe: true, label: "S-Start" },
    { index: 1, x: 58.0, y: 82.5, safe: false },
    { index: 2, x: 58.0, y: 74.5, safe: false },
    { index: 3, x: 58.0, y: 66.5, safe: false },

    // East Arm (Bottom Row, heading RIGHT towards outer tip): 4..7
    { index: 4, x: 66.5, y: 58.0, safe: false },
    { index: 5, x: 74.5, y: 58.0, safe: false },
    { index: 6, x: 82.5, y: 58.0, safe: true, label: "E-Safe" },
    { index: 7, x: 90.0, y: 58.0, safe: false },

    // East Arm (Top Row, heading LEFT towards center): 8..11
    { index: 8, x: 90.0, y: 42.0, safe: false },
    { index: 9, x: 82.5, y: 42.0, safe: false },
    { index: 10, x: 74.5, y: 42.0, safe: false },
    { index: 11, x: 66.5, y: 42.0, safe: false },

    // North Arm (Right Col, heading UP towards outer tip): 12..15
    { index: 12, x: 58.0, y: 33.5, safe: false },
    { index: 13, x: 58.0, y: 25.5, safe: false },
    { index: 14, x: 58.0, y: 17.5, safe: false },
    { index: 15, x: 58.0, y: 10.0, safe: false },

    // North Arm (Left Col, heading DOWN towards center): 16..19
    { index: 16, x: 42.0, y: 10.0, safe: true, label: "N-Start" },
    { index: 17, x: 42.0, y: 17.5, safe: false },
    { index: 18, x: 42.0, y: 25.5, safe: false },
    { index: 19, x: 42.0, y: 33.5, safe: false },

    // West Arm (Top Row, heading LEFT towards outer tip): 20..23
    { index: 20, x: 33.5, y: 42.0, safe: false },
    { index: 21, x: 25.5, y: 42.0, safe: false },
    { index: 22, x: 17.5, y: 42.0, safe: true, label: "W-Safe" },
    { index: 23, x: 10.0, y: 42.0, safe: false },

    // West Arm (Bottom Row, heading RIGHT towards center): 24..27
    { index: 24, x: 10.0, y: 58.0, safe: false },
    { index: 25, x: 17.5, y: 58.0, safe: false },
    { index: 26, x: 25.5, y: 58.0, safe: false },
    { index: 27, x: 33.5, y: 58.0, safe: false },

    // South Arm (Left Col, heading DOWN towards outer tip): 28..31
    { index: 28, x: 42.0, y: 66.5, safe: false },
    { index: 29, x: 42.0, y: 74.5, safe: false },
    { index: 30, x: 42.0, y: 82.5, safe: false },
    { index: 31, x: 42.0, y: 90.0, safe: false },
  ],

  // Player (Gold) Dedicated Home Lane: South middle column heading up
  playerHomeLane: [
    { index: 0, x: 50.0, y: 90.0 },
    { index: 1, x: 50.0, y: 82.5 },
    { index: 2, x: 50.0, y: 74.5 },
    { index: 3, x: 50.0, y: 66.5 },
  ],

  // Chacha (Ruby) Dedicated Home Lane: North middle column heading down
  chachaHomeLane: [
    { index: 0, x: 50.0, y: 10.0 },
    { index: 1, x: 50.0, y: 17.5 },
    { index: 2, x: 50.0, y: 25.5 },
    { index: 3, x: 50.0, y: 33.5 },
  ],

  // Central Sanctuary (Charkoni / Home)
  center: { x: 50.0, y: 50.0 },

  // Base Resting Positions (Inside the cloth boundaries)
  playerBases: [
    { id: "gold-1", x: 45.0, y: 92.0 },
    { id: "gold-2", x: 55.0, y: 92.0 },
  ],
  chachaBases: [
    { id: "ruby-1", x: 45.0, y: 8.0 },
    { id: "ruby-2", x: 55.0, y: 8.0 },
  ],

  playerStartIndex: 0,
  chachaStartIndex: 16,
  safeCellIndices: [0, 6, 16, 22],
};

export function getPieceAuthoritativeCoordinate(piece: ChauparPiece): { x: number; y: number } {
  if (piece.state === "home") {
    if (piece.id === "gold-1") return CHAUPAR_BOARD_CONFIG.playerBases[0];
    if (piece.id === "gold-2") return CHAUPAR_BOARD_CONFIG.playerBases[1];
    if (piece.id === "ruby-1") return CHAUPAR_BOARD_CONFIG.chachaBases[0];
    return CHAUPAR_BOARD_CONFIG.chachaBases[1];
  }
  if (piece.state === "finished") {
    return CHAUPAR_BOARD_CONFIG.center;
  }
  if (piece.state === "home-lane" && piece.homeLaneIndex !== null) {
    const lane =
      piece.player === "player"
        ? CHAUPAR_BOARD_CONFIG.playerHomeLane
        : CHAUPAR_BOARD_CONFIG.chachaHomeLane;
    return lane[Math.min(piece.homeLaneIndex, 3)] || CHAUPAR_BOARD_CONFIG.center;
  }
  if (piece.state === "circuit" && piece.circuitIndex !== null) {
    return CHAUPAR_BOARD_CONFIG.circuit[piece.circuitIndex % 32];
  }
  return piece.currentCoords;
}

const INITIAL_PIECES: ChauparPiece[] = [
  {
    id: "gold-1",
    player: "player",
    state: "home",
    circuitIndex: null,
    circuitStepsTaken: 0,
    homeLaneIndex: null,
    currentCoords: CHAUPAR_BOARD_CONFIG.playerBases[0],
  },
  {
    id: "gold-2",
    player: "player",
    state: "home",
    circuitIndex: null,
    circuitStepsTaken: 0,
    homeLaneIndex: null,
    currentCoords: CHAUPAR_BOARD_CONFIG.playerBases[1],
  },
  {
    id: "ruby-1",
    player: "chacha",
    state: "home",
    circuitIndex: null,
    circuitStepsTaken: 0,
    homeLaneIndex: null,
    currentCoords: CHAUPAR_BOARD_CONFIG.chachaBases[0],
  },
  {
    id: "ruby-2",
    player: "chacha",
    state: "home",
    circuitIndex: null,
    circuitStepsTaken: 0,
    homeLaneIndex: null,
    currentCoords: CHAUPAR_BOARD_CONFIG.chachaBases[1],
  },
];

interface ChauparGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function ChauparGame({
  isOpen,
  onClose,
  onComplete,
}: ChauparGameProps) {
  // --- STATE ---
  const [pieces, setPieces] = useState<ChauparPiece[]>(INITIAL_PIECES);
  const piecesRef = useRef<ChauparPiece[]>(INITIAL_PIECES);

  // Keep piecesRef in sync with React state
  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  const [currentTurn, setCurrentTurn] = useState<"player" | "chacha">("player");
  const [diceRoll1, setDiceRoll1] = useState<number>(3);
  const [diceRoll2, setDiceRoll2] = useState<number>(4);
  const [lastRollTotal, setLastRollTotal] = useState<number | null>(null);
  const [isDiceRolling, setIsDiceRolling] = useState<boolean>(false);
  const [isPawnMoving, setIsPawnMoving] = useState<boolean>(false);
  const [activeHoppingPieceId, setActiveHoppingPieceId] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [gameScore, setGameScore] = useState<{ player: number; chacha: number }>({ player: 0, chacha: 0 });
  const [chauparRound, setChauparRound] = useState<number>(1);
  const [chauparMessage, setChauparMessage] = useState<string>(
    "Roll the long wooden pasa dice to challenge Buzurg Chacha in ancient Chaupar!"
  );
  const [winner, setWinner] = useState<"player" | "chacha" | null>(null);

  // Timers and cancellation refs
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const turnTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasWonReportedRef = useRef<boolean>(false);

  const clearAllTimers = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
    if (turnTransitionTimeoutRef.current) {
      clearTimeout(turnTransitionTimeoutRef.current);
      turnTransitionTimeoutRef.current = null;
    }
  }, []);

  const resetMatchState = useCallback(() => {
    clearAllTimers();
    stopNarration();
    hasWonReportedRef.current = false;
    setPieces([
      {
        id: "gold-1",
        player: "player",
        state: "home",
        circuitIndex: null,
        circuitStepsTaken: 0,
        homeLaneIndex: null,
        currentCoords: CHAUPAR_BOARD_CONFIG.playerBases[0],
      },
      {
        id: "gold-2",
        player: "player",
        state: "home",
        circuitIndex: null,
        circuitStepsTaken: 0,
        homeLaneIndex: null,
        currentCoords: CHAUPAR_BOARD_CONFIG.playerBases[1],
      },
      {
        id: "ruby-1",
        player: "chacha",
        state: "home",
        circuitIndex: null,
        circuitStepsTaken: 0,
        homeLaneIndex: null,
        currentCoords: CHAUPAR_BOARD_CONFIG.chachaBases[0],
      },
      {
        id: "ruby-2",
        player: "chacha",
        state: "home",
        circuitIndex: null,
        circuitStepsTaken: 0,
        homeLaneIndex: null,
        currentCoords: CHAUPAR_BOARD_CONFIG.chachaBases[1],
      },
    ]);
    setCurrentTurn("player");
    setDiceRoll1(3);
    setDiceRoll2(4);
    setLastRollTotal(null);
    setIsDiceRolling(false);
    setIsPawnMoving(false);
    setActiveHoppingPieceId(null);
    setLegalMoves([]);
    setGameScore({ player: 0, chacha: 0 });
    setChauparRound(1);
    setWinner(null);
    setChauparMessage("Match reset! Roll the pasa dice to challenge Buzurg Chacha.");
  }, [clearAllTimers]);

  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      stopNarration();
      resetMatchState();
    }
    return () => {
      clearAllTimers();
      stopNarration();
    };
  }, [isOpen, clearAllTimers, resetMatchState]);

  // -------------------------------------------------------------
  // MOVEMENT ENGINE & LEGAL MOVE CALCULATOR
  // -------------------------------------------------------------
  const calculateLegalMoves = useCallback(
    (player: "player" | "chacha", roll: number, currentPieces: ChauparPiece[]): LegalMove[] => {
      const moves: LegalMove[] = [];
      const playerPieces = currentPieces.filter((p) => p.player === player && p.state !== "finished");
      const opponentPieces = currentPieces.filter((p) => p.player !== player && p.state !== "finished");
      const startIndex =
        player === "player"
          ? CHAUPAR_BOARD_CONFIG.playerStartIndex
          : CHAUPAR_BOARD_CONFIG.chachaStartIndex;

      const homeLaneConfig =
        player === "player"
          ? CHAUPAR_BOARD_CONFIG.playerHomeLane
          : CHAUPAR_BOARD_CONFIG.chachaHomeLane;

      for (const piece of playerPieces) {
        // 1. Piece in 'home' base entering the board
        if (piece.state === "home") {
          // Entry rule: Entering places goti on Start Cell, then advances to target (roll steps from base)
          const targetTotalSteps = roll;
          const targetCircuitIndex = (startIndex + targetTotalSteps) % 32;

          // Build intermediate animation path from base -> start cell -> ... -> target cell
          const animationPath: { x: number; y: number }[] = [];
          animationPath.push(CHAUPAR_BOARD_CONFIG.circuit[startIndex]);
          for (let s = 1; s <= targetTotalSteps; s++) {
            const stepIdx = (startIndex + s) % 32;
            animationPath.push(CHAUPAR_BOARD_CONFIG.circuit[stepIdx]);
          }

          // Check capture at destination
          const targetCell = CHAUPAR_BOARD_CONFIG.circuit[targetCircuitIndex];
          let capturedPieceId: string | null = null;
          let isCapture = false;

          if (!targetCell.safe) {
            const oppAtTarget = opponentPieces.find(
              (o) => o.state === "circuit" && o.circuitIndex === targetCircuitIndex
            );
            if (oppAtTarget) {
              isCapture = true;
              capturedPieceId = oppAtTarget.id;
            }
          }

          moves.push({
            pieceId: piece.id,
            nextState: "circuit",
            nextCircuitIndex: targetCircuitIndex,
            nextStepsTaken: targetTotalSteps,
            nextHomeLaneIndex: null,
            animationPath,
            isCapture,
            capturedPieceId,
          });
        }

        // 2. Piece currently on the shared circuit
        else if (piece.state === "circuit" && piece.circuitIndex !== null) {
          const currentSteps = piece.circuitStepsTaken;
          const targetTotalSteps = currentSteps + roll;

          // Case A: Stays on the outer circuit (< 32 total steps from start)
          if (targetTotalSteps < 32) {
            const targetCircuitIndex = (startIndex + targetTotalSteps) % 32;
            const animationPath: { x: number; y: number }[] = [];

            for (let s = currentSteps + 1; s <= targetTotalSteps; s++) {
              const stepIdx = (startIndex + s) % 32;
              animationPath.push(CHAUPAR_BOARD_CONFIG.circuit[stepIdx]);
            }

            const targetCell = CHAUPAR_BOARD_CONFIG.circuit[targetCircuitIndex];
            let capturedPieceId: string | null = null;
            let isCapture = false;

            if (!targetCell.safe) {
              const oppAtTarget = opponentPieces.find(
                (o) => o.state === "circuit" && o.circuitIndex === targetCircuitIndex
              );
              if (oppAtTarget) {
                isCapture = true;
                capturedPieceId = oppAtTarget.id;
              }
            }

            moves.push({
              pieceId: piece.id,
              nextState: "circuit",
              nextCircuitIndex: targetCircuitIndex,
              nextStepsTaken: targetTotalSteps,
              nextHomeLaneIndex: null,
              animationPath,
              isCapture,
              capturedPieceId,
            });
          }

          // Case B: Completes circuit (>= 32 steps) and enters dedicated Home Lane / Sanctuary
          else {
            const stepsRemainingInCircuit = 31 - currentSteps;
            const stepsInHomeLane = targetTotalSteps - 32; // 0..3 for home lane, 4+ for Sanctuary

            const animationPath: { x: number; y: number }[] = [];

            // 1. Traverse remaining circuit steps
            for (let s = 1; s <= stepsRemainingInCircuit; s++) {
              const stepIdx = (startIndex + currentSteps + s) % 32;
              animationPath.push(CHAUPAR_BOARD_CONFIG.circuit[stepIdx]);
            }

            // 2. Traverse home lane steps
            const laneStepsToHop = Math.min(stepsInHomeLane, 3);
            for (let l = 0; l <= laneStepsToHop; l++) {
              animationPath.push(homeLaneConfig[l]);
            }

            // 3. If reaches or exceeds sanctuary (step 4+)
            if (stepsInHomeLane >= 4) {
              animationPath.push(CHAUPAR_BOARD_CONFIG.center);
              moves.push({
                pieceId: piece.id,
                nextState: "finished",
                nextCircuitIndex: null,
                nextStepsTaken: 36,
                nextHomeLaneIndex: null,
                animationPath,
                isCapture: false,
                capturedPieceId: null,
              });
            } else {
              moves.push({
                pieceId: piece.id,
                nextState: "home-lane",
                nextCircuitIndex: null,
                nextStepsTaken: 32 + laneStepsToHop,
                nextHomeLaneIndex: laneStepsToHop,
                animationPath,
                isCapture: false,
                capturedPieceId: null,
              });
            }
          }
        }

        // 3. Piece already in dedicated Home Lane
        else if (piece.state === "home-lane" && piece.homeLaneIndex !== null) {
          const currentLaneIdx = piece.homeLaneIndex;
          const targetLaneIdx = currentLaneIdx + roll;

          const animationPath: { x: number; y: number }[] = [];

          if (targetLaneIdx >= 4) {
            // Reaches Sanctuary
            for (let l = currentLaneIdx + 1; l < 4; l++) {
              animationPath.push(homeLaneConfig[l]);
            }
            animationPath.push(CHAUPAR_BOARD_CONFIG.center);

            moves.push({
              pieceId: piece.id,
              nextState: "finished",
              nextCircuitIndex: null,
              nextStepsTaken: 36,
              nextHomeLaneIndex: null,
              animationPath,
              isCapture: false,
              capturedPieceId: null,
            });
          } else {
            // Advances along home lane
            for (let l = currentLaneIdx + 1; l <= targetLaneIdx; l++) {
              animationPath.push(homeLaneConfig[l]);
            }

            moves.push({
              pieceId: piece.id,
              nextState: "home-lane",
              nextCircuitIndex: null,
              nextStepsTaken: 32 + targetLaneIdx,
              nextHomeLaneIndex: targetLaneIdx,
              animationPath,
              isCapture: false,
              capturedPieceId: null,
            });
          }
        }
      }

      return moves;
    },
    []
  );

  // -------------------------------------------------------------
  // EXECUTE MOVE WITH CELL-BY-CELL BOUNCING HOP ANIMATION
  // -------------------------------------------------------------
  const executeMove = useCallback(
    (move: LegalMove, rolledDoubles: boolean) => {
      setIsPawnMoving(true);
      setActiveHoppingPieceId(move.pieceId);
      setLegalMoves([]);

      const path = move.animationPath;
      if (!path || path.length === 0) {
        setIsPawnMoving(false);
        setActiveHoppingPieceId(null);
        return;
      }

      let stepIndex = 0;
      soundFx.playSelect();

      const movingPlayer = move.pieceId.startsWith("gold") ? "player" : "chacha";

      // Step-by-step hopper (110ms per tile hop)
      animIntervalRef.current = setInterval(() => {
        stepIndex++;
        if (stepIndex < path.length) {
          const nextCoord = path[stepIndex];
          setPieces((prev) =>
            prev.map((p) =>
              p.id === move.pieceId ? { ...p, currentCoords: nextCoord } : p
            )
          );
          soundFx.playKeyboardClick(1.2);
        } else {
          // Animation Complete
          if (animIntervalRef.current) {
            clearInterval(animIntervalRef.current);
            animIntervalRef.current = null;
          }

          const finalCoord = path[path.length - 1];

          const updatedPieces = piecesRef.current.map((p) => {
            if (p.id === move.pieceId) {
              return {
                ...p,
                state: move.nextState,
                circuitIndex: move.nextCircuitIndex,
                circuitStepsTaken: move.nextStepsTaken,
                homeLaneIndex: move.nextHomeLaneIndex,
                currentCoords: finalCoord,
              };
            }
            // Handle captured piece returning to base
            if (move.isCapture && p.id === move.capturedPieceId) {
              const baseCoord =
                p.id === "gold-1"
                  ? CHAUPAR_BOARD_CONFIG.playerBases[0]
                  : p.id === "gold-2"
                  ? CHAUPAR_BOARD_CONFIG.playerBases[1]
                  : p.id === "ruby-1"
                  ? CHAUPAR_BOARD_CONFIG.chachaBases[0]
                  : CHAUPAR_BOARD_CONFIG.chachaBases[1];

              return {
                ...p,
                state: "home" as PieceState,
                circuitIndex: null,
                circuitStepsTaken: 0,
                homeLaneIndex: null,
                currentCoords: baseCoord,
              };
            }
            return p;
          });

          piecesRef.current = updatedPieces;
          setPieces(updatedPieces);

          // Play capture / finish sound
          if (move.isCapture) {
            soundFx.playClueChime();
          } else if (move.nextState === "finished") {
            soundFx.playClueFound();
          }

          setActiveHoppingPieceId(null);

          // Check Win Conditions & Transition Turns
          turnTransitionTimeoutRef.current = setTimeout(() => {
            const latestPieces = piecesRef.current;
            const playerFinished = latestPieces.filter(
              (p) => p.player === "player" && p.state === "finished"
            ).length;
            const chachaFinished = latestPieces.filter(
              (p) => p.player === "chacha" && p.state === "finished"
            ).length;

            setGameScore({ player: playerFinished, chacha: chachaFinished });

            if (playerFinished === 2) {
              setWinner("player");
              setIsPawnMoving(false);
              setChauparMessage("🏆 Royal Victory! Both Golden Gotis reached the Home Sanctuary! You have won the Chaupar match!");
              playNarration(
                "Shabash, mere aaka! Both your Golden Gotis have safely reached the Home Sanctuary! You have mastered the royal Rajput game of Chaupar!",
                { speaker: "ratan", pace: 0.9, language_code: "en-IN" }
              );

              if (!hasWonReportedRef.current) {
                hasWonReportedRef.current = true;
                recordGameWinToDatabase({
                  era: "rajasthan",
                  gameType: "chaupar",
                  prizeUnlocked: "Royal Rajput Chaupar Victory",
                  score: 100,
                }).catch(() => {});
                onComplete();
              }
              return;
            }

            if (chachaFinished === 2) {
              setWinner("chacha");
              setIsPawnMoving(false);
              setChauparMessage("Buzurg Chacha's Ruby Gotis have both reached Home and won this match! Reset to challenge him again!");
              playNarration(
                "Khamma Ghani! Buzurg Chacha has brought both Ruby Gotis to the Home Sanctuary. Reset to challenge the master elder again!",
                { speaker: "ratan", pace: 0.9, language_code: "en-IN" }
              );
              return;
            }

            // Extra Turn Logic
            const hasExtraTurn = rolledDoubles || move.isCapture;
            if (hasExtraTurn) {
              const reason = rolledDoubles && move.isCapture ? "doubles & capture" : rolledDoubles ? "doubles" : "capture";
              if (movingPlayer === "player") {
                setCurrentTurn("player");
                setIsPawnMoving(false);
                setChauparMessage(`🎉 Extra Turn (${reason})! Roll the pasa dice again!`);
              } else {
                setCurrentTurn("chacha");
                setIsPawnMoving(false);
                setChauparMessage(`Buzurg Chacha earned an extra turn (${reason})!`);
                aiTimeoutRef.current = setTimeout(() => {
                  executeAiTurn();
                }, 1000);
              }
            } else {
              // Switch Turn
              if (movingPlayer === "player") {
                setCurrentTurn("chacha");
                setIsPawnMoving(false);
                setChauparMessage("Buzurg Chacha is contemplating his tactical roll...");
                aiTimeoutRef.current = setTimeout(() => {
                  executeAiTurn();
                }, 1000);
              } else {
                setCurrentTurn("player");
                setIsPawnMoving(false);
                setChauparMessage("Your turn, mere aaka! Roll the wooden pasa dice!");
                setChauparRound((prev) => prev + 1);
              }
            }
          }, 250);
        }
      }, 110);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onComplete]
  );

  // -------------------------------------------------------------
  // BUZURG CHACHA AI ENGINE
  // -------------------------------------------------------------
  const executeAiTurn = useCallback(() => {
    if (winner) return;
    setIsDiceRolling(true);
    soundFx.playCowrieShellsSound();

    // Animate dice roll
    aiTimeoutRef.current = setTimeout(() => {
      const possibleFaces = [1, 2, 3, 4, 6];
      const d1 = possibleFaces[Math.floor(Math.random() * possibleFaces.length)];
      const d2 = possibleFaces[Math.floor(Math.random() * possibleFaces.length)];
      const total = d1 + d2;
      const rolledDoubles = d1 === d2;

      setDiceRoll1(d1);
      setDiceRoll2(d2);
      setLastRollTotal(total);
      setIsDiceRolling(false);

      const currentPieces = piecesRef.current;
      const aiMoves = calculateLegalMoves("chacha", total, currentPieces);

      if (aiMoves.length === 0) {
        setChauparMessage(`Chacha rolled ${d1} & ${d2} (${total}), but has no legal moves! Turn passes to you.`);
        aiTimeoutRef.current = setTimeout(() => {
          setCurrentTurn("player");
          setChauparMessage("Your turn, mere aaka! Roll the wooden pasa dice!");
          setChauparRound((prev) => prev + 1);
        }, 1400);
        return;
      }

      // Chacha AI Decision Hierarchy:
      // 1. Capture player piece if possible
      // 2. Finish piece into Home if possible
      // 3. Enter piece from base onto board
      // 4. Advance piece closest to Home
      let selectedMove: LegalMove | null = null;

      const captureMove = aiMoves.find((m) => m.isCapture);
      const finishMove = aiMoves.find((m) => m.nextState === "finished");
      const entryMove = aiMoves.find((m) => {
        const piece = currentPieces.find((p) => p.id === m.pieceId);
        return piece && piece.state === "home";
      });

      if (captureMove) {
        selectedMove = captureMove;
      } else if (finishMove) {
        selectedMove = finishMove;
      } else if (entryMove) {
        selectedMove = entryMove;
      } else {
        // Maximize steps taken towards home
        selectedMove = aiMoves.reduce((prev, curr) =>
          curr.nextStepsTaken > prev.nextStepsTaken ? curr : prev
        );
      }

      const moveName = selectedMove.pieceId === "ruby-1" ? "Ruby Goti 1" : "Ruby Goti 2";
      setChauparMessage(`👳 Chacha rolled ${d1} & ${d2} (${total}) and advances ${moveName}!`);

      aiTimeoutRef.current = setTimeout(() => {
        if (selectedMove) {
          executeMove(selectedMove, rolledDoubles);
        }
      }, 500);
    }, 600);
  }, [calculateLegalMoves, executeMove, winner]);

  // -------------------------------------------------------------
  // PLAYER ROLL & SELECTION HANDLERS
  // -------------------------------------------------------------
  const handleRollDice = () => {
    if (isDiceRolling || isPawnMoving || currentTurn !== "player" || legalMoves.length > 0 || winner) return;

    setIsDiceRolling(true);
    soundFx.playButtonClick();
    soundFx.playCowrieShellsSound();
    stopNarration();

    rollTimeoutRef.current = setTimeout(() => {
      const possibleFaces = [1, 2, 3, 4, 6];
      const d1 = possibleFaces[Math.floor(Math.random() * possibleFaces.length)];
      const d2 = possibleFaces[Math.floor(Math.random() * possibleFaces.length)];
      const total = d1 + d2;

      setDiceRoll1(d1);
      setDiceRoll2(d2);
      setLastRollTotal(total);
      setIsDiceRolling(false);

      const currentPieces = piecesRef.current;
      const calculatedMoves = calculateLegalMoves("player", total, currentPieces);

      if (calculatedMoves.length === 0) {
        setChauparMessage(`You rolled ${d1} & ${d2} (${total} pips), but have no legal moves! Turn passes to Chacha.`);
        turnTransitionTimeoutRef.current = setTimeout(() => {
          setCurrentTurn("chacha");
          setChauparMessage("Buzurg Chacha is taking his turn...");
          aiTimeoutRef.current = setTimeout(() => {
            executeAiTurn();
          }, 1100);
        }, 1400);
        return;
      }

      setLegalMoves(calculatedMoves);

      if (calculatedMoves.length === 1) {
        const pieceName = calculatedMoves[0].pieceId === "gold-1" ? "Gold Goti 1" : "Gold Goti 2";
        setChauparMessage(`🎲 You rolled ${d1} & ${d2} (${total} pips)! Click on ${pieceName} (highlighted) to advance.`);
      } else {
        setChauparMessage(`🎲 You rolled ${d1} & ${d2} (${total} pips)! Choose which highlighted Golden Goti to move.`);
      }
    }, 600);
  };

  const handleSelectGoti = (pieceId: string) => {
    if (isPawnMoving || isDiceRolling || currentTurn !== "player" || winner) return;

    const move = legalMoves.find((m) => m.pieceId === pieceId);
    if (!move) return;

    setLegalMoves([]);
    const rolledDoubles = diceRoll1 === diceRoll2;
    executeMove(move, rolledDoubles);
  };

  if (!isOpen) return null;

  // Stacking offset helper
  const getRenderOffsets = (piece: ChauparPiece) => {
    const isHopping = activeHoppingPieceId === piece.id;
    const baseCoords = isHopping ? piece.currentCoords : getPieceAuthoritativeCoordinate(piece);

    const overlapping = pieces.filter((p) => {
      if (p.id === piece.id) return false;
      const otherCoords =
        activeHoppingPieceId === p.id ? p.currentCoords : getPieceAuthoritativeCoordinate(p);
      return (
        Math.abs(otherCoords.x - baseCoords.x) < 2 && Math.abs(otherCoords.y - baseCoords.y) < 2
      );
    });

    if (overlapping.length > 0) {
      const isFirst = piece.id < overlapping[0].id;
      return {
        offsetX: isFirst ? -2.5 : 2.5,
        offsetY: isFirst ? -2.5 : 2.5,
      };
    }
    return { offsetX: 0, offsetY: 0 };
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto">
      <div className="bg-[#fff9ea] border-4 border-amber-950 rounded-3xl p-5 shadow-[16px_16px_0_0_rgba(0,0,0,1)] max-w-xl w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-amber-800/40 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <div>
              <h3 className="font-extrabold text-amber-950 uppercase tracking-widest text-sm leading-tight">
                Royal Chaupar (Pachisi) Game
              </h3>
              <span className="text-[10px] font-serif text-amber-800 font-semibold italic">
                Traditional Rajput Board of Kings & Court
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetMatchState}
              className="text-amber-900 hover:bg-amber-200 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-amber-800 cursor-pointer transition-colors"
              title="Reset score and pawns"
            >
              🔄 Reset
            </button>
            <button
              onClick={onClose}
              className="text-amber-950 hover:bg-amber-200 font-bold text-xs px-3 py-1 rounded-lg border-2 border-amber-900 bg-amber-100 cursor-pointer shadow-sm transition-colors"
            >
              ✕ Exit Game
            </button>
          </div>
        </div>

        {/* Scoreboard Bar */}
        <div className="grid grid-cols-2 gap-3 bg-gradient-to-r from-amber-100 via-amber-200/70 to-amber-100 border-2 border-amber-900/70 p-2 rounded-xl text-center shadow-sm">
          {/* Player Score */}
          <div className="flex items-center justify-between px-3 border-r-2 border-amber-800/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-600 via-amber-400 to-yellow-200 border-2 border-amber-950 flex items-center justify-center shadow-sm text-[10px] font-bold">
                👑
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black text-amber-900 uppercase block">YOU (GOLD GOTI)</span>
                <span className="text-[10px] font-bold text-amber-950">
                  {pieces.filter((p) => p.player === "player" && p.state === "finished").length}/2 in Home
                </span>
              </div>
            </div>
            <div className="text-2xl font-black text-amber-950">{gameScore.player}</div>
          </div>

          {/* Chacha Score */}
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-800 via-red-600 to-red-400 border-2 border-amber-950 flex items-center justify-center shadow-sm text-[10px] font-bold text-white">
                👳
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black text-red-950 uppercase block">CHACHA (RUBY GOTI)</span>
                <span className="text-[10px] font-bold text-amber-950">
                  {pieces.filter((p) => p.player === "chacha" && p.state === "finished").length}/2 in Home
                </span>
              </div>
            </div>
            <div className="text-2xl font-black text-amber-950">{gameScore.chacha}</div>
          </div>
        </div>

        {/* Visual Chaupar Cross Board (Strict 1:1 Aspect Square Container) */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto rounded-2xl overflow-hidden border-4 border-amber-950 shadow-2xl bg-[#1e0e07] flex items-center justify-center">
          {/* Traditional Cloth Chaupar Board Artwork (100% Fill matching coordinate space) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/chaupar-board.jpg"
            alt="Traditional Royal Chaupar Board"
            className="w-full h-full object-fill pointer-events-none select-none opacity-95"
          />

          {/* Central Home (Charkoni) Highlight Sanctuary */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-2 border-yellow-400/90 bg-yellow-500/25 backdrop-blur-[1px] animate-pulse flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.7)]">
              <span className="text-[10px] font-serif font-black text-yellow-100 drop-shadow-md uppercase tracking-wider">
                HOME
              </span>
            </div>
          </div>

          {/* Render All 4 Interactive Gotis */}
          {pieces.map((piece) => {
            const isPlayer = piece.player === "player";
            const isLegalToMove = legalMoves.some((m) => m.pieceId === piece.id);
            const isHopping = activeHoppingPieceId === piece.id;
            const visualCoords = isHopping
              ? piece.currentCoords
              : getPieceAuthoritativeCoordinate(piece);
            const { offsetX, offsetY } = getRenderOffsets(piece);

            return (
              <div
                key={piece.id}
                onClick={() => isLegalToMove && handleSelectGoti(piece.id)}
                className={`absolute w-7 h-7 sm:w-8 sm:h-8 z-30 transition-all duration-100 ease-out transform -translate-x-1/2 -translate-y-1/2 ${
                  isLegalToMove
                    ? "cursor-pointer scale-110 ring-4 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)] animate-bounce"
                    : isHopping
                    ? "scale-125 -translate-y-2.5 shadow-2xl"
                    : "scale-100 shadow-md"
                }`}
                style={{
                  left: `${visualCoords.x + offsetX}%`,
                  top: `${visualCoords.y + offsetY}%`,
                  zIndex: isLegalToMove || isHopping ? 40 : 30,
                }}
                title={
                  isPlayer
                    ? `${piece.id === "gold-1" ? "Gold Goti 1" : "Gold Goti 2"} (${piece.state})`
                    : `${piece.id === "ruby-1" ? "Ruby Goti 1" : "Ruby Goti 2"} (${piece.state})`
                }
              >
                <div
                  className={`relative w-full h-full rounded-t-full rounded-b-md border-2 border-amber-950 shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center ${
                    isPlayer
                      ? "bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-100"
                      : "bg-gradient-to-tr from-red-950 via-red-600 to-red-400"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full border shadow-inner flex items-center justify-center text-[7.5px] font-bold ${
                      isPlayer
                        ? "bg-amber-100 border-amber-900 text-amber-950"
                        : "bg-red-200 border-red-950 text-white"
                    }`}
                  >
                    {isPlayer ? "👑" : "👳"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Long Wooden Dice (Pasa) Section */}
        <div className="bg-amber-100/90 border-2 border-amber-900/60 py-2 px-3 rounded-xl flex flex-col items-center gap-1.5 w-full">
          <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider">
            LONG WOODEN PASA DICE (ROYAL RAJASTHANI DICE)
          </span>

          <div className="flex items-center justify-center gap-5 py-0.5">
            {/* Die 1 */}
            <div
              className={`relative w-24 h-9 bg-gradient-to-r from-[#d89e5a] via-[#f5d09b] to-[#c68c47] border-2 border-[#4a2e12] rounded-md shadow-md flex items-center justify-around px-2.5 transition-all duration-300 origin-center ${
                isDiceRolling ? "rotate-12 scale-105 shadow-xl animate-bounce" : "rotate-0 scale-100"
              }`}
            >
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-[#6e431a] rounded-l border-r border-[#4a2e12]"></div>
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-[#6e431a] rounded-r border-l border-[#4a2e12]"></div>
              {Array.from({ length: diceRoll1 }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 bg-red-700 border border-red-950 rounded-full shadow-inner"></div>
              ))}
            </div>

            {/* Die 2 */}
            <div
              className={`relative w-24 h-9 bg-gradient-to-r from-[#d89e5a] via-[#f5d09b] to-[#c68c47] border-2 border-[#4a2e12] rounded-md shadow-md flex items-center justify-around px-2.5 transition-all duration-300 origin-center ${
                isDiceRolling ? "-rotate-12 scale-105 shadow-xl animate-bounce" : "rotate-0 scale-100"
              }`}
            >
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-[#6e431a] rounded-l border-r border-[#4a2e12]"></div>
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-[#6e431a] rounded-r border-l border-[#4a2e12]"></div>
              {Array.from({ length: diceRoll2 }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 bg-red-700 border border-red-950 rounded-full shadow-inner"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Message / Status Bar */}
        <div className="bg-amber-200/70 border border-amber-400 p-2 rounded-xl text-center text-xs font-serif font-bold text-amber-950 leading-relaxed shadow-inner min-h-[36px] flex items-center justify-center">
          {chauparMessage}
        </div>

        {/* Roll Action Button */}
        <button
          onClick={handleRollDice}
          disabled={isDiceRolling || isPawnMoving || currentTurn !== "player" || legalMoves.length > 0 || winner !== null}
          className={`font-extrabold py-2.5 px-6 rounded-xl border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-widest cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2 ${
            isDiceRolling || isPawnMoving || currentTurn !== "player" || legalMoves.length > 0 || winner !== null
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-amber-600 hover:bg-amber-700 text-white"
          }`}
        >
          <span>🎲</span>
          <span>
            {isDiceRolling
              ? "Rolling Wooden Pasa..."
              : isPawnMoving
              ? "Moving Goti..."
              : legalMoves.length > 0
              ? "Select Highlighted Goti"
              : currentTurn === "chacha"
              ? "Chacha's Turn..."
              : winner
              ? "Match Concluded"
              : "Roll Pasa Dice"}
          </span>
        </button>
      </div>
    </div>
  );
}
