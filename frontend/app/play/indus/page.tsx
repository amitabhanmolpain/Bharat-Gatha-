"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundFx } from "../../../services/soundService";
import { playNarration, stopNarration } from "../../../services/narratorService";
import { playCharacterDialogue, stopCharacterDialogue } from "../../../services/characterVoiceService";
import { recordGameWinToDatabase } from "../../../services/gameProgressService";

import {
  IndusStage,
  IndusSceneType,
  IndusSaveState,
} from "./types";
import {
  INDUS_STORAGE_KEY,
  INITIAL_INDUS_STATE,
  INDUS_SCENE_CONFIGS,
} from "./constants";

import IndusHUD from "./components/IndusHUD";
import IndusJournalModal from "./components/IndusJournalModal";
import GreatBathDrainagePuzzle from "./components/GreatBathDrainagePuzzle";
import SteatiteSealPuzzle from "./components/SteatiteSealPuzzle";

// TTS is strictly disabled in Indus Valley per user instruction until explicit permission is given
const ALLOW_INDUS_TTS = false;
const triggerIndusNarration = (
  text: string,
  options?: { speaker?: string; pace?: number; language_code?: string }
) => {
  if (!ALLOW_INDUS_TTS) return;
  playNarration(text, options);
};

export default function IndusValleyGameScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // HUD & Session Control States (Matching Image 2)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);

  // Core Progression State
  const [stage, setStage] = useState<IndusStage>(INITIAL_INDUS_STATE.stage);
  const [scene, setScene] = useState<IndusSceneType>(INITIAL_INDUS_STATE.scene);
  const [playerPos, setPlayerPos] = useState(INITIAL_INDUS_STATE.playerPos);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Stage 1: Lower Town & Granary
  const [hasMetCityOverseer, setHasMetCityOverseer] = useState(INITIAL_INDUS_STATE.hasMetCityOverseer);
  const [hasInspectedBrickRatio, setHasInspectedBrickRatio] = useState(INITIAL_INDUS_STATE.hasInspectedBrickRatio);
  const [hasFirstRelicChertWeight, setHasFirstRelicChertWeight] = useState(INITIAL_INDUS_STATE.hasFirstRelicChertWeight);
  const [showOverseerDialogue, setShowOverseerDialogue] = useState(false);
  const [showForeignTradersModal, setShowForeignTradersModal] = useState(false);
  const [hasInspectedForeignTraders, setHasInspectedForeignTraders] = useState(false);

  // Stage 1.5: Residential Grid
  const [showDrainsModal, setShowDrainsModal] = useState(false);
  const [showHouseModal, setShowHouseModal] = useState(false);
  const [hasInspectedDrains, setHasInspectedDrains] = useState(false);
  const [hasInspectedHouse, setHasInspectedHouse] = useState(false);
  const [activeCitizenDialogue, setActiveCitizenDialogue] = useState<{
    name: string;
    title: string;
    icon: string;
    text: string;
  } | null>(null);

  // Stage 2: Great Bath
  const [isDrainagePuzzleSolved, setIsDrainagePuzzleSolved] = useState(INITIAL_INDUS_STATE.isDrainagePuzzleSolved);
  const [hasInspectedBitumenLining, setHasInspectedBitumenLining] = useState(INITIAL_INDUS_STATE.hasInspectedBitumenLining);
  const [hasGreatBathPurificationBlessing, setHasGreatBathPurificationBlessing] = useState(INITIAL_INDUS_STATE.hasGreatBathPurificationBlessing);
  const [showDrainagePuzzleModal, setShowDrainagePuzzleModal] = useState(false);

  // Stage 3: Steatite Seal Workshop
  const [isSealPuzzleSolved, setIsSealPuzzleSolved] = useState(INITIAL_INDUS_STATE.isSealPuzzleSolved);
  const [hasUnicornSeal, setHasUnicornSeal] = useState(INITIAL_INDUS_STATE.hasUnicornSeal);
  const [hasPashupatiSeal, setHasPashupatiSeal] = useState(INITIAL_INDUS_STATE.hasPashupatiSeal);
  const [showSealPuzzleModal, setShowSealPuzzleModal] = useState(false);

  // Stage 4: Priest-King's Citadel Platform
  const [hasMetPriestKing, setHasMetPriestKing] = useState(INITIAL_INDUS_STATE.hasMetPriestKing);
  const [hasBronzeDancingGirl, setHasBronzeDancingGirl] = useState(INITIAL_INDUS_STATE.hasBronzeDancingGirl);
  const [isCampaignComplete, setIsCampaignComplete] = useState(INITIAL_INDUS_STATE.isCampaignComplete);
  const [showPriestKingDialogue, setShowPriestKingDialogue] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Journal & Relics State
  const [unlockedJournalEntries, setUnlockedJournalEntries] = useState<string[]>(
    INITIAL_INDUS_STATE.unlockedJournalEntries
  );
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  // Scene Configuration
  const currentSceneConfig = INDUS_SCENE_CONFIGS[scene] || INDUS_SCENE_CONFIGS.lower_town_gate;

  // Compute total relics collected
  const relicsCount =
    (hasFirstRelicChertWeight ? 1 : 0) +
    (hasInspectedBitumenLining ? 1 : 0) +
    (hasUnicornSeal ? 1 : 0) +
    (hasBronzeDancingGirl ? 1 : 0);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(INDUS_STORAGE_KEY);
        if (saved) {
          const p: IndusSaveState = JSON.parse(saved);
          setStage(p.stage || 1);
          setScene(p.scene || "lower_town_gate");
          setPlayerPos(p.playerPos || { x: 50.0, y: 82.0 });
          setHasMetCityOverseer(Boolean(p.hasMetCityOverseer));
          setHasInspectedBrickRatio(Boolean(p.hasInspectedBrickRatio));
          setHasFirstRelicChertWeight(Boolean(p.hasFirstRelicChertWeight));
          setIsDrainagePuzzleSolved(Boolean(p.isDrainagePuzzleSolved));
          setHasInspectedBitumenLining(Boolean(p.hasInspectedBitumenLining));
          setHasGreatBathPurificationBlessing(Boolean(p.hasGreatBathPurificationBlessing));
          setIsSealPuzzleSolved(Boolean(p.isSealPuzzleSolved));
          setHasUnicornSeal(Boolean(p.hasUnicornSeal));
          setHasPashupatiSeal(Boolean(p.hasPashupatiSeal));
          setHasMetPriestKing(Boolean(p.hasMetPriestKing));
          setHasBronzeDancingGirl(Boolean(p.hasBronzeDancingGirl));
          setIsCampaignComplete(Boolean(p.isCampaignComplete));
          setUnlockedJournalEntries(
            p.unlockedJournalEntries || INITIAL_INDUS_STATE.unlockedJournalEntries
          );
        }
      } catch (err) {
        console.error("Failed to load Indus Valley state", err);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // 2. State Persistence
  const saveState = useCallback(() => {
    if (typeof window === "undefined" || isLoading) return;
    try {
      const stateToSave: IndusSaveState = {
        stage,
        scene,
        playerPos,
        tutorialCompleted: true,
        hasMetCityOverseer,
        hasInspectedBrickRatio,
        hasFirstRelicChertWeight,
        isDrainagePuzzleSolved,
        hasInspectedBitumenLining,
        hasGreatBathPurificationBlessing,
        isSealPuzzleSolved,
        hasUnicornSeal,
        hasPashupatiSeal,
        hasMetPriestKing,
        hasBronzeDancingGirl,
        isCampaignComplete,
        unlockedJournalEntries,
      };
      localStorage.setItem(INDUS_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error("Failed to persist Indus Valley state", err);
    }
  }, [
    stage,
    scene,
    playerPos,
    hasMetCityOverseer,
    hasInspectedBrickRatio,
    hasFirstRelicChertWeight,
    isDrainagePuzzleSolved,
    hasInspectedBitumenLining,
    hasGreatBathPurificationBlessing,
    isSealPuzzleSolved,
    hasUnicornSeal,
    hasPashupatiSeal,
    hasMetPriestKing,
    hasBronzeDancingGirl,
    isCampaignComplete,
    unlockedJournalEntries,
    isLoading,
  ]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  // Cleanup voices on unmount
  useEffect(() => {
    return () => {
      stopNarration();
      stopCharacterDialogue();
    };
  }, []);

  // Session timer increment
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Reset Campaign Handler
  const handleResetCampaign = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(INDUS_STORAGE_KEY);
      } catch {}
    }
    setStage(1);
    setScene("lower_town_gate");
    setPlayerPos({ x: 38.0, y: 80.0 });
    setHasMetCityOverseer(false);
    setHasInspectedBrickRatio(false);
    setHasFirstRelicChertWeight(false);
    setIsDrainagePuzzleSolved(false);
    setHasInspectedBitumenLining(false);
    setHasGreatBathPurificationBlessing(false);
    setIsSealPuzzleSolved(false);
    setHasUnicornSeal(false);
    setHasPashupatiSeal(false);
    setHasMetPriestKing(false);
    setHasBronzeDancingGirl(false);
    setIsCampaignComplete(false);
    setUnlockedJournalEntries(INITIAL_INDUS_STATE.unlockedJournalEntries);
    setShowRestartConfirmModal(false);
  };

  // 4. Proximity Checks
  // Stage 1: Dock Official Somnath at Inspection Platform (at x: 70.5%, y: 56.5%)
  const isNearOverseer =
    scene === "lower_town_gate" &&
    playerPos.x >= 60.0 &&
    playerPos.x <= 82.0 &&
    playerPos.y >= 46.0 &&
    playerPos.y <= 68.0;

  // Stage 1: Foreign Mesopotamian & Dilmun Traders on the Paved Brick Quay (at x: 31%, y: 76%)
  const isNearForeignTraders =
    scene === "lower_town_gate" &&
    playerPos.x >= 20.0 &&
    playerPos.x <= 42.0 &&
    playerPos.y >= 66.0 &&
    playerPos.y <= 86.0;

  // Stage 1 -> Stage 1.5 City Gateway to Residential Grid (at gate x: 64-78, y: 34-46)
  const isNearGranaryExit =
    scene === "lower_town_gate" &&
    hasFirstRelicChertWeight &&
    playerPos.x >= 64.0 &&
    playerPos.x <= 78.0 &&
    playerPos.y <= 46.0;

  // Stage 1.5: Residential Grid - Covered Drains inspection (at x: 62%, y: 58%)
  const isNearResidentialDrains =
    scene === "residential_grid" &&
    playerPos.x >= 54.0 &&
    playerPos.x <= 72.0 &&
    playerPos.y >= 50.0 &&
    playerPos.y <= 66.0;

  // Stage 1.5: Residential Grid - Standardized House & Courtyard (at x: 21%, y: 66%)
  const isNearResidentialHouse =
    scene === "residential_grid" &&
    playerPos.x >= 14.0 &&
    playerPos.x <= 27.0 &&
    playerPos.y >= 58.0 &&
    playerPos.y <= 74.0;

  // Stage 1.5: Residential Grid -> Citadel & Great Bath Exit (at x: 68%, y: 84%)
  const isNearResidentialCitadelExit =
    scene === "residential_grid" &&
    playerPos.x >= 58.0 &&
    playerPos.x <= 78.0 &&
    playerPos.y >= 78.0;

  // Stage 1.5: Residential Grid -> Return to Ghat Gate (at x: 82%, y: 37%)
  const isNearResidentialGhatReturn =
    scene === "residential_grid" &&
    playerPos.x >= 74.0 &&
    playerPos.y <= 44.0;

  // Stage 1.5: Rooftop Resident (at x: 43.5%, y: 41.5%)
  const isNearRooftopCitizen =
    scene === "residential_grid" &&
    playerPos.x >= 36.0 &&
    playerPos.x <= 52.0 &&
    playerPos.y >= 36.0 &&
    playerPos.y <= 48.0;

  // Stage 1.5: Road Pedestrian / Water Carrier (at x: 38%, y: 76% on open left avenue)
  const isNearRoadPedestrian =
    scene === "residential_grid" &&
    playerPos.x >= 28.0 &&
    playerPos.x <= 46.0 &&
    playerPos.y >= 68.0 &&
    playerPos.y <= 84.0;

  // Stage 1.5: Courtyard Resident (at x: 33.5%, y: 57.5%)
  const isNearCourtyardResident =
    scene === "residential_grid" &&
    playerPos.x >= 28.0 &&
    playerPos.x <= 39.0 &&
    playerPos.y >= 52.0 &&
    playerPos.y <= 64.0;

  // Stage 2: Great Bath sunken basin
  const isNearGreatBathBasin =
    scene === "great_bath_citadel" &&
    playerPos.x >= 35.0 &&
    playerPos.x <= 65.0 &&
    playerPos.y >= 52.0 &&
    playerPos.y <= 75.0;

  // Stage 2 -> Stage 3 East Artisan archway
  const isNearArtisanQuarterExit =
    scene === "great_bath_citadel" &&
    isDrainagePuzzleSolved &&
    playerPos.x >= 75.0;

  // Stage 3: Seal Carving Bench
  const isNearSealBench =
    scene === "steatite_seal_workshop" &&
    playerPos.x >= 35.0 &&
    playerPos.x <= 65.0 &&
    playerPos.y >= 52.0 &&
    playerPos.y <= 75.0;

  // Stage 3 -> Stage 4 Citadel stairs
  const isNearCitadelStairs =
    scene === "steatite_seal_workshop" &&
    isSealPuzzleSolved &&
    playerPos.y <= 52.0;

  // Stage 4: Priest-King
  const isNearPriestKing =
    scene === "priest_king_citadel" &&
    playerPos.x >= 40.0 &&
    playerPos.x <= 62.0 &&
    playerPos.y >= 52.0 &&
    playerPos.y <= 72.0;

  // 5. Scene Transitions
  const triggerTransition = (
    nextScene: IndusSceneType,
    nextPos: { x: number; y: number },
    nextStage?: IndusStage
  ) => {
    setIsTransitioning(true);
    soundFx.playSelect();
    setTimeout(() => {
      setScene(nextScene);
      setPlayerPos(nextPos);
      if (nextStage) setStage(nextStage);
      setIsTransitioning(false);
    }, 600);
  };

  // 6. Keyboard Movement Engine
  useEffect(() => {
    let animationFrameId: number;
    const keysPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        showOverseerDialogue ||
        showForeignTradersModal ||
        showDrainsModal ||
        showHouseModal ||
        showDrainagePuzzleModal ||
        showSealPuzzleModal ||
        showPriestKingDialogue ||
        activeCitizenDialogue !== null ||
        isJournalOpen ||
        showVictoryModal
      ) {
        return;
      }

      keysPressed[e.key.toLowerCase()] = true;

      // Exit key: [F] or [f] (Per user requirement: "if the player wants to exit from this place has to press F")
      if (e.key === "f" || e.key === "F") {
        if (isNearResidentialGhatReturn) {
          triggerTransition("lower_town_gate", { x: 71.5, y: 44.0 });
          return;
        } else if (isNearResidentialCitadelExit) {
          triggerTransition("great_bath_citadel", { x: 50.0, y: 82.0 }, 2);
          return;
        } else if (isNearGranaryExit) {
          triggerTransition("residential_grid", { x: 80.0, y: 38.0 });
          return;
        } else if (isNearArtisanQuarterExit) {
          triggerTransition("steatite_seal_workshop", { x: 25.0, y: 72.0 }, 3);
          return;
        } else if (isNearCitadelStairs) {
          triggerTransition("priest_king_citadel", { x: 50.0, y: 80.0 }, 4);
          return;
        }
      }

      // Interaction key: [E] or Spacebar (also allow E on exits for smooth navigation)
      if (e.key === "e" || e.key === "E" || e.key === " ") {
        if (isNearOverseer) {
          setShowOverseerDialogue(true);
        } else if (isNearForeignTraders) {
          setShowForeignTradersModal(true);
        } else if (isNearRooftopCitizen) {
          setActiveCitizenDialogue({
            name: "Harappan Rooftop Resident",
            title: "Citizen of the Upper Terraces • Mohenjo-daro",
            icon: "",
            text: "From atop our baked-brick roofs, you can see how our streets cross at perfect cardinal angles! When the summer sun sets over the Indus, our families gather on these cool flat terraces to spin cotton and catch the river breeze.",
          });
          soundFx.playSelect();
        } else if (isNearRoadPedestrian) {
          setActiveCitizenDialogue({
            name: "Harappan Water Carrier",
            title: "Neighborhood Municipal Worker • Mohenjo-daro",
            icon: "",
            text: "I carry cool water from our neighborhood brick well. Notice that our streets have covered drains on both sides with sediment traps. No waste ever pools in our lanes—our city stays cleaner than any kingdom in Sumer or Dilmun!",
          });
          soundFx.playSelect();
        } else if (isNearCourtyardResident) {
          setActiveCitizenDialogue({
            name: "Harappan Courtyard Inhabitant",
            title: "Domestic Artisan • Mohenjo-daro",
            icon: "",
            text: "Welcome to our inner courtyard! Notice how our home has no windows facing the busy street. The thick baked-brick walls keep out the street dust and noise, giving our family acoustic peace and natural cooling throughout the year.",
          });
          soundFx.playSelect();
        } else if (isNearResidentialDrains) {
          setShowDrainsModal(true);
        } else if (isNearResidentialHouse) {
          setShowHouseModal(true);
        } else if (isNearResidentialCitadelExit) {
          triggerTransition("great_bath_citadel", { x: 50.0, y: 82.0 }, 2);
        } else if (isNearResidentialGhatReturn) {
          triggerTransition("lower_town_gate", { x: 71.5, y: 44.0 });
        } else if (isNearGreatBathBasin) {
          setShowDrainagePuzzleModal(true);
        } else if (isNearSealBench) {
          setShowSealPuzzleModal(true);
        } else if (isNearPriestKing) {
          setShowPriestKingDialogue(true);
        } else if (isNearGranaryExit) {
          triggerTransition("residential_grid", { x: 80.0, y: 38.0 });
        } else if (isNearArtisanQuarterExit) {
          triggerTransition("steatite_seal_workshop", { x: 25.0, y: 72.0 }, 3);
        } else if (isNearCitadelStairs) {
          triggerTransition("priest_king_citadel", { x: 50.0, y: 80.0 }, 4);
        }
      };
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = false;
    };

    const updateMovement = () => {
      let dx = 0;
      let dy = 0;

      if (keysPressed["arrowup"] || keysPressed["w"]) dy -= 0.65;
      if (keysPressed["arrowdown"] || keysPressed["s"]) dy += 0.65;
      if (keysPressed["arrowleft"] || keysPressed["a"]) {
        dx -= 0.75;
        setFacingLeft(true);
      }
      if (keysPressed["arrowright"] || keysPressed["d"]) {
        dx += 0.75;
        setFacingLeft(false);
      }

      if (dx !== 0 || dy !== 0) {
        setIsWalking(true);
        setWalkPhase((prev) => (prev + 0.25) % (Math.PI * 2));

        setPlayerPos((prev) => {
          const targetX = Math.min(
            Math.max(prev.x + dx, currentSceneConfig.minX),
            currentSceneConfig.maxX
          );
          const targetY = Math.min(
            Math.max(prev.y + dy, currentSceneConfig.minY),
            currentSceneConfig.maxY
          );
          return { x: targetX, y: targetY };
        });
      } else {
        setIsWalking(false);
      }

      animationFrameId = requestAnimationFrame(updateMovement);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    animationFrameId = requestAnimationFrame(updateMovement);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    scene,
    currentSceneConfig,
    showOverseerDialogue,
    showDrainagePuzzleModal,
    showSealPuzzleModal,
    showPriestKingDialogue,
    isJournalOpen,
    showVictoryModal,
    isNearOverseer,
    isNearGreatBathBasin,
    isNearSealBench,
    isNearPriestKing,
    isNearGranaryExit,
    isNearArtisanQuarterExit,
    isNearCitadelStairs,
    hasFirstRelicChertWeight,
    isDrainagePuzzleSolved,
    isSealPuzzleSolved,
  ]);

  // Dynamic Depth Scaling (0.88 to 1.15)
  const depthScale = 0.88 + ((playerPos.y - 45) / 45) * 0.26;
  const walkBob = isWalking ? Math.sin(walkPhase * 2) * 3 : 0;
  const walkSway = isWalking ? Math.sin(walkPhase) * 2 : 0;

  // Handlers for Puzzle Completions
  const handleDrainageComplete = () => {
    setIsDrainagePuzzleSolved(true);
    setHasInspectedBitumenLining(true);
    setHasGreatBathPurificationBlessing(true);
    setShowDrainagePuzzleModal(false);

    if (!unlockedJournalEntries.includes("great_bath_hydraulics")) {
      setUnlockedJournalEntries((prev) => [...prev, "great_bath_hydraulics"]);
    }

    triggerIndusNarration(
      "Sublime engineering! The bitumen seal holds firm, and the subterranean culvert directs the sacred water into the Great Bath.",
      { speaker: "ratan", pace: 0.88, language_code: "en-IN" }
    );

    recordGameWinToDatabase({
      era: "indus",
      gameType: "great_bath_drainage",
      prizeUnlocked: "Corbelled Terracotta Sluice Fragment",
      score: 150,
    });
  };

  const handleSealComplete = () => {
    setIsSealPuzzleSolved(true);
    setHasUnicornSeal(true);
    setHasPashupatiSeal(true);
    setShowSealPuzzleModal(false);

    if (!unlockedJournalEntries.includes("steatite_seals_script")) {
      setUnlockedJournalEntries((prev) => [...prev, "steatite_seals_script"]);
    }

    triggerIndusNarration(
      "The Ekasringa Unicorn seal is assembled! Its sacred inscription grants you clearance to ascend the high Citadel platform.",
      { speaker: "ratan", pace: 0.88, language_code: "en-IN" }
    );

    recordGameWinToDatabase({
      era: "indus",
      gameType: "steatite_seal_decryption",
      prizeUnlocked: "Ekasringa Unicorn Steatite Seal",
      score: 200,
    });
  };

  const handlePriestKingBlessing = () => {
    setHasMetPriestKing(true);
    setHasBronzeDancingGirl(true);
    setIsCampaignComplete(true);
    setShowPriestKingDialogue(false);

    if (!unlockedJournalEntries.includes("lost_wax_bronze")) {
      setUnlockedJournalEntries((prev) => [...prev, "lost_wax_bronze"]);
    }

    setShowVictoryModal(true);
    soundFx.playClueFound();

    triggerIndusNarration(
      "You hold the Bronze Dancing Girl in your hands, crafted through the lost-wax process 4,500 years ago. You have mastered the urban dawn of the Indus Valley!",
      { speaker: "ratan", pace: 0.88, language_code: "en-IN" }
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
      {/* --- SCENE BACKGROUND CANVAS --- */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-95"
        style={{ backgroundImage: `url('${currentSceneConfig.backgroundImage}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none"></div>

        {/* --- SCENE HOTSPOTS & NPCS --- */}

        {/* Stage 1: Dock Official Somnath at Inspection Platform */}
        {scene === "lower_town_gate" && (
          <div
            className="absolute z-15 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "70.5%", top: "56.5%" }}
            onClick={() => setShowOverseerDialogue(true)}
          >
            {/* Soft ground contact shadow touching the brick floor */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-10 h-2 bg-black/60 rounded-full blur-[2px] pointer-events-none" />

            {/* Sprite container aligned so feet touch bottom */}
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              {isNearOverseer && (
                <div className="mb-1 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-[#d8a86a] font-bold">[E]</span>
                  <span>Speak with Dock Official</span>
                </div>
              )}
              <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-2 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mb-1 whitespace-nowrap transition-opacity duration-200 ${
                isNearOverseer ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                Dock Official Somnath
              </span>
              <img
                src="/sprite-indus-official.png?v=3"
                alt="Dock Official Somnath"
                className="h-16 sm:h-18 md:h-20 w-auto object-contain block select-none"
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.4))" }}
              />
            </div>
          </div>
        )}

        {/* Stage 1: Foreign Mesopotamian & Dilmun Traders on the Brick Quay */}
        {scene === "lower_town_gate" && (
          <div
            className="absolute z-15 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "31%", top: "76%" }}
            onClick={() => setShowForeignTradersModal(true)}
          >
            {/* Soft ground contact shadow touching the brick floor */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-10 h-2 bg-black/60 rounded-full blur-[2px] pointer-events-none" />

            {/* Sprite container aligned so feet touch bottom */}
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              {isNearForeignTraders && (
                <div className="mb-1 bg-[#1b1510]/95 border-2 border-[#38bdf8] text-[#f0f9ff] px-2.5 py-0.5 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-[#38bdf8] font-bold">[E]</span>
                  <span>Inspect Foreign Trader</span>
                </div>
              )}
              <span className={`text-[10px] font-serif font-bold text-[#f0f9ff] bg-[#0c1a24]/90 px-2 py-0.5 rounded border border-[#38bdf8]/60 shadow-md mb-1 whitespace-nowrap transition-opacity duration-200 ${
                isNearForeignTraders ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                Foreign Trader (Sumer & Dilmun)
              </span>
              <img
                src="/sprite-indus-trader.png?v=3"
                alt="Foreign Mesopotamian Trader"
                className="h-16 sm:h-18 md:h-20 w-auto object-contain block select-none"
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.4))" }}
              />
            </div>
          </div>
        )}

        {/* Stage 1: Mohenjo-daro City Gateway Trigger to Residential Grid */}
        {scene === "lower_town_gate" && hasFirstRelicChertWeight && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "71.5%", top: "33%" }}
          >
            <div className="bg-[#1b1510]/95 border-2 border-[#52a45a] text-[#baf1be] px-3.5 py-1.5 rounded-lg text-xs font-serif shadow-md animate-pulse whitespace-nowrap">
              <span>▲ [F] Enter City Gate to Residential Grid</span>
            </div>
          </div>
        )}

        {/* Stage 1.5: Rooftop Citizen on Upper House Terrace */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-12 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "43.5%", top: "41.5%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Rooftop Resident",
                title: "Citizen of the Upper Terraces • Mohenjo-daro",
                icon: "",
                text: "From atop our baked-brick roofs, you can see how our streets cross at perfect cardinal angles! When the summer sun sets over the Indus, our families gather on these cool flat terraces to spin cotton and catch the river breeze.",
              })
            }
          >
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-7 h-1.5 bg-black/55 rounded-full blur-[1px] pointer-events-none" />
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              {isNearRooftopCitizen && (
                <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2 py-0.5 rounded text-[10px] font-serif shadow-lg animate-bounce whitespace-nowrap">
                  <span className="text-[#d8a86a] font-bold mr-1">[E]</span>
                  <span>Greet Rooftop Resident</span>
                </div>
              )}
              <span className={`text-[8px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-1.5 py-0.5 rounded border border-[#d8a86a]/50 shadow mb-0.5 whitespace-nowrap transition-opacity duration-200 ${
                isNearRooftopCitizen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                Rooftop Citizen
              </span>
              <img
                src="/sprite-indus-rooftop.png?v=3"
                alt="Harappan Rooftop Resident"
                className="h-9 sm:h-10 md:h-11 w-auto object-contain block select-none"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Foreground Rooftop Lookout */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-14 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "10.5%", top: "52%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Lookout",
                title: "Lower Town Watcher • Mohenjo-daro",
                icon: "",
                text: "I watch the sunrise over the eastern wall! Look along the street below—the covered drains carry every drop of wastewater away safely under the stone slabs. No other city on earth has such engineering.",
              })
            }
          >
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-9 h-2 bg-black/55 rounded-full blur-[1.5px] pointer-events-none" />
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105 -scale-x-100">
              <span className="text-[9px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-1.5 py-0.5 rounded border border-[#d8a86a]/50 shadow mb-0.5 whitespace-nowrap -scale-x-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Terrace Watcher
              </span>
              <img
                src="/sprite-indus-rooftop.png?v=3"
                alt="Harappan Terrace Lookout"
                className="h-13 sm:h-14 md:h-15 w-auto object-contain block select-none"
                style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.4))" }}
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Road Townsman / Water Carrier (Placed on the OPEN LEFT AVENUE away from drain) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-15 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "38%", top: "76%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Water Carrier",
                title: "Neighborhood Municipal Worker • Mohenjo-daro",
                icon: "",
                text: "I carry cool water from our neighborhood brick well. Notice that our streets have covered drains on both sides with sediment traps. No waste ever pools in our lanes—our city stays cleaner than any kingdom in Sumer or Dilmun!",
              })
            }
          >
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-8 h-1.5 bg-black/60 rounded-full blur-[2px] pointer-events-none" />
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              {isNearRoadPedestrian && (
                <div className="mb-1 bg-[#1b1510]/95 border border-[#38bdf8] text-[#f0f9ff] px-2.5 py-0.5 rounded text-[11px] font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap">
                  <span className="text-[#38bdf8] font-bold">[E]</span>
                  <span>Greet Water Carrier</span>
                </div>
              )}
              <span className={`text-[9px] font-serif font-bold text-[#f0f9ff] bg-[#0c1a24]/90 px-2 py-0.5 rounded border border-[#38bdf8]/50 shadow mb-0.5 whitespace-nowrap transition-opacity duration-200 ${
                isNearRoadPedestrian ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                Water Carrier
              </span>
              <img
                src="/sprite-indus-pedestrian.png?v=3"
                alt="Harappan Water Carrier"
                className="h-13 sm:h-14 md:h-15 w-auto object-contain block select-none"
                style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.45))" }}
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Courtyard Resident Woman (Inside the Courtyard) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-13 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "33.5%", top: "57.5%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Courtyard Inhabitant",
                title: "Domestic Artisan • Mohenjo-daro",
                icon: "",
                text: "Welcome to our inner courtyard! Notice how our home has no windows facing the busy street. The thick baked-brick walls keep out the street dust and noise, giving our family acoustic peace and natural cooling throughout the year.",
              })
            }
          >
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-7 h-1.5 bg-black/60 rounded-full blur-[1.5px] pointer-events-none" />
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              {isNearCourtyardResident && (
                <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[11px] font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap">
                  <span className="text-[#d8a86a] font-bold">[E]</span>
                  <span>Speak with Courtyard Resident</span>
                </div>
              )}
              <span className={`text-[9px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow mb-0.5 whitespace-nowrap transition-opacity duration-200 ${
                isNearCourtyardResident ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                Courtyard Resident
              </span>
              <img
                src="/sprite-indus-courtyard.png?v=3"
                alt="Harappan Courtyard Resident"
                className="h-11 sm:h-12 md:h-13 w-auto object-contain block select-none"
                style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.4))" }}
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Residential Grid - Covered Drains Hotspot (Along drain at right) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-15 pointer-events-auto cursor-pointer select-none group flex flex-col items-center"
            style={{ left: "62%", top: "58%", transform: "translate(-50%, -50%)" }}
            onClick={() => setShowDrainsModal(true)}
          >
            {isNearResidentialDrains && !isNearRoadPedestrian && (
              <div className="mb-1 bg-[#1b1510]/95 border-2 border-[#38bdf8] text-[#f0f9ff] px-2.5 py-0.5 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap">
                <span className="text-[#38bdf8] font-bold">[E]</span>
                <span>Inspect Covered Drain</span>
              </div>
            )}
            <div className="w-8 h-8 rounded-lg bg-[#1b252b]/90 border border-[#38bdf8] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <svg className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className={`text-[9px] font-serif font-bold text-[#e0f2fe] bg-[#0c1a24]/90 px-1.5 py-0.5 rounded border border-[#38bdf8]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearResidentialDrains ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Covered Municipal Drain
            </span>
          </div>
        )}

        {/* Stage 1.5: Residential Grid - Standardized House Hotspot (At front entrance on left street) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-15 pointer-events-auto cursor-pointer select-none group flex flex-col items-center"
            style={{ left: "21%", top: "66%", transform: "translate(-50%, -50%)" }}
            onClick={() => setShowHouseModal(true)}
          >
            {isNearResidentialHouse && !isNearCourtyardResident && (
              <div className="mb-1 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap">
                <span className="text-[#d8a86a] font-bold">[E]</span>
                <span>Inspect Brick Residence</span>
              </div>
            )}
            <div className="w-8 h-8 rounded-lg bg-[#281c14]/90 border border-[#d8a86a] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <svg className="w-4 h-4 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className={`text-[9px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearResidentialHouse ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Standard Brick Residence
            </span>
          </div>
        )}

        {/* Stage 1.5: Residential Grid -> Citadel Archway */}
        {scene === "residential_grid" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "68%", top: "84%" }}
          >
            <div className="bg-[#1b1510]/95 border-2 border-[#52a45a] text-[#baf1be] px-3 py-1 rounded-lg text-xs font-serif shadow-md animate-pulse whitespace-nowrap">
              <span>▲ [F] To The Great Bath (Stage 2)</span>
            </div>
          </div>
        )}

        {/* Stage 1.5: Residential Grid -> Return to Ghat Gate */}
        {scene === "residential_grid" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "82%", top: "37%" }}
          >
            <div className="bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-[11px] font-serif shadow-md whitespace-nowrap">
              <span>▼ [F] To River Ghat</span>
            </div>
          </div>
        )}

        {/* Stage 2: Great Bath Hotspot */}
        {scene === "great_bath_citadel" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "50%", top: "65%" }}
          >
            {isNearGreatBathBasin && (
              <div className="mb-2 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-3 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[#d8a86a] font-bold">[E]</span>
                <span>
                  {isDrainagePuzzleSolved
                    ? "Inspect Restored Hydraulic Basin"
                    : "Restore Great Bath Drainage Culvert"}
                </span>
              </div>
            )}
            <div className="w-14 h-14 bg-[#231b14]/90 border-2 border-[#5dbcd2] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <svg className="w-7 h-7 text-[#5dbcd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className="text-[10px] font-serif font-bold text-[#e6f7fa] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#376b75] mt-1">
              The Great Bath
            </span>
          </div>
        )}

        {/* Stage 2: East Colonnade to Artisan Quarter */}
        {scene === "great_bath_citadel" && isDrainagePuzzleSolved && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "80%", top: "68%" }}
          >
            <div className="mb-1 bg-[#1b1510]/90 border-2 border-[#d8a86a] text-[#f7eedf] px-3 py-1 rounded-lg text-xs font-serif shadow-md animate-pulse whitespace-nowrap">
              <span>► [F] Enter Steatite Artisan Quarter (Stage 3)</span>
            </div>
          </div>
        )}

        {/* Stage 3: Seal Carver Bench Hotspot */}
        {scene === "steatite_seal_workshop" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "50%", top: "65%" }}
          >
            {isNearSealBench && (
              <div className="mb-2 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-3 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[#d8a86a] font-bold">[E]</span>
                <span>
                  {isSealPuzzleSolved
                    ? "Examine Master Unicorn Seal"
                    : "Carve & Align Steatite Unicorn Seal"}
                </span>
              </div>
            )}
            <div className="w-14 h-14 bg-[#2d2218]/90 border-2 border-[#d8a86a] rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#54412e] mt-1">
              Seal Carver&apos;s Bench
            </span>
          </div>
        )}

        {/* Stage 3: North Stairs to Citadel Platform */}
        {scene === "steatite_seal_workshop" && isSealPuzzleSolved && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "50%", top: "50%" }}
          >
            <div className="mb-1 bg-[#1b1510]/90 border-2 border-[#52a45a] text-[#baf1be] px-3 py-1 rounded-lg text-xs font-serif shadow-md animate-pulse whitespace-nowrap">
              <span>▲ [F] Ascend Citadel to The Priest-King (Stage 4)</span>
            </div>
          </div>
        )}

        {/* Stage 4: Priest-King Hotspot */}
        {scene === "priest_king_citadel" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "52%", top: "62%" }}
          >
            {isNearPriestKing && (
              <div className="mb-2 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-3 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[#d8a86a] font-bold">[E]</span>
                <span>Speak with The Priest-King</span>
              </div>
            )}
            <div className="w-14 h-18 bg-[#382b1d]/90 border-2 border-[#c29357] rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
              <svg className="w-8 h-8 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] font-serif font-bold text-[#fdfaf3] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#6b533a] mt-1">
              The Priest-King
            </span>
          </div>
        )}

        {/* --- MAIN HERO SPRITE --- */}
        <div
          className="absolute pointer-events-none flex flex-col items-center z-20"
          style={{
            left: `${playerPos.x}%`,
            top: `${playerPos.y}%`,
            transformOrigin: "bottom center",
            transform: `translate(-50%, -96%) scale(${depthScale}) scaleX(${
              facingLeft ? -1 : 1
            })`,
          }}
        >
          <img
            src="/player.png"
            alt="Hero Player"
            className="w-32 h-32 md:w-36 md:h-36 object-contain"
            style={{
              imageRendering: "pixelated",
              transform: `translateY(${walkBob}px) rotate(${walkSway}deg)`,
              transition: isWalking ? "none" : "transform 0.15s ease-out",
            }}
          />
        </div>
      </div>

      {/* --- HUD OVERLAY (Exact Image 2 Style) --- */}
      <IndusHUD
        stage={stage}
        scene={scene}
        objective={currentSceneConfig.defaultObjective}
        relicsCount={relicsCount}
        totalRelics={4}
        journalCount={unlockedJournalEntries.length}
        totalJournal={5}
        onOpenJournal={() => setIsJournalOpen(true)}
        onResetCampaign={() => setShowRestartConfirmModal(true)}
        isTransitioning={isTransitioning}
        elapsedSeconds={elapsedSeconds}
        isTimerVisible={isTimerVisible}
        onToggleTimer={() => setIsTimerVisible((prev) => !prev)}
        isMusicMuted={isMusicMuted}
        onToggleMusic={() => setIsMusicMuted((prev) => !prev)}
        isSoundMuted={isSoundMuted}
        onToggleSound={() => {
          const muted = soundFx.toggleMute();
          setIsSoundMuted(muted);
        }}
        onLeaveWorld={() => router.push("/dashboard")}
      />

      {/* --- JOURNAL & RELICS MODAL --- */}
      <IndusJournalModal
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        unlockedEntryIds={unlockedJournalEntries}
        relicsCount={relicsCount}
      />

      {/* --- GREAT BATH DRAINAGE PUZZLE MODAL --- */}
      <GreatBathDrainagePuzzle
        isOpen={showDrainagePuzzleModal}
        onClose={() => setShowDrainagePuzzleModal(false)}
        onComplete={handleDrainageComplete}
        alreadySolved={isDrainagePuzzleSolved}
      />

      {/* --- STEATITE SEAL PUZZLE MODAL --- */}
      <SteatiteSealPuzzle
        isOpen={showSealPuzzleModal}
        onClose={() => setShowSealPuzzleModal(false)}
        onComplete={handleSealComplete}
        alreadySolved={isSealPuzzleSolved}
      />

      {/* --- STAGE 1 OVERSEER DIALOGUE MODAL --- */}
      {showOverseerDialogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                    Chief Architect of the Lower Town • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Overseer Somnath
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowOverseerDialogue(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-2">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;Welcome, traveler, to the riverside ghat of Mohenjo-daro on the great Indus river!&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                &ldquo;All cargo arriving on these riverboats must be inspected here at our raised checkpoint platform. Notice how our city walls and avenues cross at exact ninety-degree angles. Every baked brick in this city adheres to the sacred ratio: 1 thickness to 2 width to 4 length. Under this law of proportion, our foundations endure seasonal inundations without buckling.&rdquo;
              </p>
              <p className="text-xs text-[#d8a86a] italic">
                &ldquo;Take this polished chert cube. Our binary balance weights are recognized in every market from Gujarat to ancient Mesopotamia. The city gate behind me is now open to Mohenjo-daro&apos;s residential grid!&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
              <span className="text-[10px] font-mono text-[#a8947d]">
                Relic I: Polished Chert Binary Weight Secured
              </span>

              <button
                type="button"
                onClick={() => {
                  setHasMetCityOverseer(true);
                  setHasInspectedBrickRatio(true);
                  setHasFirstRelicChertWeight(true);
                  setShowOverseerDialogue(false);
                  soundFx.playClueFound();
                  triggerIndusNarration(
                    "You receive the polished chert binary balance weight! The city gate to Mohenjo-daro's residential grid is now open.",
                    { speaker: "ratan", pace: 0.88, language_code: "en-IN" }
                  );
                }}
                className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Accept Chert Weight & Open City Gate ▲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 1 FOREIGN TRADERS (MESOPOTAMIA & DILMUN) MODAL --- */}
      {showForeignTradersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#38bdf8] p-6 shadow-[0_0_50px_rgba(56,189,248,0.3)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#122838] border-2 border-[#38bdf8] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest">
                    Maritime Trade Delegation • Bronze Age (c. 2500 BCE)
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Foreign Merchants of Sumer & Dilmun
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowForeignTradersModal(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#131d24] border border-[#234559] text-sm font-serif leading-relaxed text-[#d7e9f4] mb-5 space-y-2.5">
              <p className="font-bold text-[#38bdf8]">
                &ldquo;Greetings from the Persian Gulf! We have sailed across the high seas from the ports of Dilmun and the great city of Ur in Sumer.&rdquo;
              </p>
              <p className="text-xs text-[#b8d5e5]">
                In Mesopotamian cuneiform tablets from King Sargon of Akkad, your realm is celebrated as <strong className="text-amber-300">&ldquo;Meluhha&rdquo;</strong> — the legendary eastern land of exotic timbers, gold, lapis lazuli, ivory dice, and prized deep-red carnelian beads.
              </p>
              <p className="text-xs text-[#b8d5e5]">
                The bearded Sumerian merchant in the fringed kaunakes mantle opens his carved chest, presenting bars of pure silver bullion, cedar beams, and fine wool. They await inspection by <strong className="text-amber-300">Dock Official Somnath</strong> to calibrate their exchange against Harappan standard chert weights!
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
              <span className="text-[10px] font-mono text-[#38bdf8]">
                Historical Lore: Meluhha-Mesopotamia Maritime Trade
              </span>

              <button
                type="button"
                onClick={() => {
                  setHasInspectedForeignTraders(true);
                  setShowForeignTradersModal(false);
                  soundFx.playClueFound();
                  triggerIndusNarration(
                    "You discover the ancient trade ties between Meluhha and Mesopotamia! Foreign merchants from Sumer and Dilmun arrived with silver and wool to trade for Harappan carnelian and ivory.",
                    { speaker: "ratan", pace: 0.88, language_code: "en-IN" }
                  );
                }}
                className="bg-gradient-to-r from-[#0284c7] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0284c7] text-[#082f49] font-serif font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Record in Trade Annals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 1.5 COVERED DRAINS MODAL --- */}
      {showDrainsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#0f171e] text-[#f0f9ff] rounded-2xl border-4 border-[#38bdf8] p-6 shadow-[0_0_50px_rgba(56,189,248,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1e293b] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#1e293b] border-2 border-[#38bdf8] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest">
                    World&apos;s First Municipal Sanitation • c. 2500 BCE
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#f8fafc]">
                    Covered Municipal Drainage & Silt Sumps
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowDrainsModal(false)}
                className="text-[#94a3b8] hover:text-[#f8fafc] text-sm bg-[#1e293b] hover:bg-[#334155] border border-[#475569] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#17222f] border border-[#25384d] text-sm font-serif leading-relaxed text-[#e2e8f0] mb-5 space-y-3">
              <p className="font-bold text-[#38bdf8]">
                &ldquo;No contemporary Bronze Age civilization—not Mesopotamia, not Egypt—matched Mohenjo-daro&apos;s municipal sanitation.&rdquo;
              </p>
              <p className="text-xs text-[#cbd5e1]">
                Running along the edges of every straight street were covered drainage channels constructed from carefully fired baked bricks. The tops were sealed with heavy, removable limestone slabs and terracotta tiles to prevent noxious odours and contamination.
              </p>
              <p className="text-xs text-[#93c5fd]">
                Notice the deep rectangular brick basins positioned at intervals along the channel. These were <strong className="text-white">sediment catch-pits (sumps)</strong>. As wastewater flowed from household latrines and bathing floors, heavy sand and debris settled at the bottom of the pits while clean water flowed smoothly over the top. Municipal inspectors lifted the stone covers to scoop out silt, keeping the subterranean network flowing unobstructed.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
              <span className="text-[10px] font-mono text-[#64748b]">
                Journal Entry: Covered Municipal Drains Unlocked
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowDrainsModal(false);
                  setHasInspectedDrains(true);
                  if (!unlockedJournalEntries.includes("covered_drainage_system")) {
                    setUnlockedJournalEntries((prev) => [...prev, "covered_drainage_system"]);
                  }
                  soundFx.playClueFound();
                }}
                className="bg-gradient-to-r from-[#0284c7] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0284c7] text-[#081521] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Record in Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 1.5 RESIDENTIAL HOUSE & COURTYARD MODAL --- */}
      {showHouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                    Harappan Domestic Architecture • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Standardized Brick Residences & Central Courtyard
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowHouseModal(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-3">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;Privacy, acoustic comfort, and natural climate control 4,500 years ahead of its time.&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                Every house is constructed with standardized kiln-fired bricks of the strict 1:2:4 dimensional ratio. Unlike contemporary Mesopotamian dwellings, Harappan houses had no street-facing ground-floor windows, protecting families from bustling avenue noise and desert dust.
              </p>
              <p className="text-xs text-[#d8a86a]">
                Life centered around an open interior courtyard with staircases leading to upper-floor sleeping quarters and flat terrace roofs. Each home featured its own dedicated brick-paved bathroom, complete with sloping floors and vertical earthenware drainage pipes set inside the exterior wall, directing bathing water directly into the street drain.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
              <span className="text-[10px] font-mono text-[#a8947d]">
                Journal Entry: The Cardinal Grid & Insulae
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowHouseModal(false);
                  setHasInspectedHouse(true);
                  if (!unlockedJournalEntries.includes("grid_planning")) {
                    setUnlockedJournalEntries((prev) => [...prev, "grid_planning"]);
                  }
                  soundFx.playClueFound();
                }}
                className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Record in Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CITIZEN DIALOGUE MODAL --- */}
      {activeCitizenDialogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#d8a86a] p-5 shadow-[0_0_40px_rgba(216,168,106,0.3)]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#4d3a28] mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#2e2319] border border-[#d8a86a] flex items-center justify-center shadow-inner">
                  {activeCitizenDialogue.icon ? (
                    <span className="text-2xl">{activeCitizenDialogue.icon}</span>
                  ) : (
                    <svg className="w-6 h-6 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-[9px] font-mono text-[#d8a86a] uppercase tracking-wider">
                    {activeCitizenDialogue.title}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#fdfaf3]">
                    {activeCitizenDialogue.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveCitizenDialogue(null)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="p-3.5 rounded-xl bg-[#281f16] border border-[#4d3a28] text-xs font-serif leading-relaxed text-[#eedbbf] mb-4">
              &ldquo;{activeCitizenDialogue.text}&rdquo;
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCitizenDialogue(null)}
                className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 4 PRIEST-KING DIALOGUE MODAL --- */}
      {showPriestKingDialogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                    Spiritual Dignitary of the Citadel • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    The Priest-King
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowPriestKingDialogue(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-2">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;You have traced the full lifeblood of our civilisation, seeker.&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                &ldquo;You began in the quiet streets of the Lower Town where standard bricks form peaceful homes. You purified the waters of the Great Bath using bitumen culverts. You aligned the Unicorn seal that brands our ships sailing to Meluhha.&rdquo;
              </p>
              <p className="text-xs text-[#eedbbf] italic">
                &ldquo;Unlike realms built upon conquest, our civilization stands on civic harmony, craftsmanship, and hydraulic mastery. Accept this lost-wax cast Bronze Dancing Girl — the immortal embodiment of Harappan artistic spirit.&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
              <span className="text-[10px] font-mono text-[#a8947d]">
                Supreme Cultural Relic • Bronze Dancing Girl (cire perdue)
              </span>

              <button
                type="button"
                onClick={handlePriestKingBlessing}
                className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Receive Bronze Dancing Girl
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VICTORY FINALE MODAL --- */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-7 shadow-[0_0_60px_rgba(194,147,87,0.5)] text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
              <svg className="w-8 h-8 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            <span className="text-[10px] font-mono text-[#d8a86a] uppercase tracking-[0.25em]">
              Chronicle Completed • Mature Harappan Civilisation
            </span>

            <h3 className="text-2xl font-serif font-bold text-[#fdfaf3] mt-1 mb-3">
              The First Urban Dawn Preserved
            </h3>

            <p className="text-xs font-serif text-[#eedbbf] leading-relaxed max-w-md mx-auto mb-6">
              You have uncovered the four pillars of the Indus Valley: cardinal grid architecture, bitumen hydraulic engineering, steatite glyptic seals, and the lost-wax Bronze Dancing Girl.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[#241c14] border border-[#54412e] text-left">
                <div className="text-[10px] font-mono text-[#a8947d]">Relics Secured</div>
                <div className="text-sm font-bold text-[#d8a86a] font-serif">4 / 4 Complete</div>
              </div>
              <div className="p-3 rounded-xl bg-[#241c14] border border-[#54412e] text-left">
                <div className="text-[10px] font-mono text-[#a8947d]">Era Placement</div>
                <div className="text-sm font-bold text-[#baf1be] font-serif">Era 1 of 4 (Opening)</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setIsJournalOpen(true)}
                className="bg-[#2e2319] hover:bg-[#423223] border border-[#c29357] text-[#f4ebd9] text-xs font-serif font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Inspect All Inscriptions
              </button>

              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md block"
              >
                Return to Games Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* --- RESTART CONFIRMATION MODAL (Exact Image 2 Style) --- */}
      {showRestartConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#fff9ea] border-4 border-black rounded-2xl p-6 max-w-md w-full shadow-[6px_6px_0_0_rgba(0,0,0,1)] text-center">
            <div className="w-14 h-14 bg-red-100 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-3 text-3xl shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-black mb-2">
              Restart Indus Valley Odyssey?
            </h3>
            <p className="text-xs text-gray-700 font-medium leading-relaxed mb-6">
              Are you sure you want to start from the beginning? Your current Harappan puzzle clearances, unlocked relics, and journal records will be reset.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  soundFx.playKeyboardClick();
                  handleResetCampaign();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
              >
                Yes, Start Again
              </button>
              <button
                onClick={() => {
                  soundFx.playKeyboardClick();
                  setShowRestartConfirmModal(false);
                }}
                className="flex-1 bg-white hover:bg-gray-100 text-black font-bold text-xs py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
