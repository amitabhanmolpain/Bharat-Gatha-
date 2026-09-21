"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { playNarration, stopNarration } from "../../../services/narratorService";
import { playCharacterDialogue, stopCharacterDialogue, stopAllCharacterVoice } from "../../../services/characterVoiceService";
import { soundFx } from "../../../services/soundService";
import Link from "next/link";
import {
  VijayanagaraStage,
  VijayanagaraSceneType,
  VijayanagaraSaveState,
} from "./types";
import {
  INITIAL_VIJAYANAGARA_STATE,
  VIJAYANAGARA_STORAGE_KEY,
  SCENE_CONFIGS,
  JOURNAL_DATABASE,
} from "./constants";
import VijayanagaraHUD from "./components/VijayanagaraHUD";
import JournalModal from "./components/JournalModal";
import TransitionModal from "./components/TransitionModal";
import ChowkaBaraGame from "./components/ChowkaBaraGame";
import ToyInspectionPuzzle from "./components/ToyInspectionPuzzle";
import MusicalPillarsPuzzle from "./components/MusicalPillarsPuzzle";
import FestivalReconstructionPuzzle from "./components/FestivalReconstructionPuzzle";
import LedgerAssemblyModal from "./components/LedgerAssemblyModal";
import TalikotaNarrationModal from "./components/TalikotaNarrationModal";
import CampaignCompletionModal from "./components/CampaignCompletionModal";
import DialoguePanel from "../../components/DialoguePanel";
import NarratorSubtitle from "../../../components/NarratorSubtitle";
import GameIcon from "./components/GameIcon";
import HistoricalNPCDialogueCard from "./components/HistoricalNPCDialogueCard";

// 10% visual increase requested by user
const PLAYER_VISUAL_SCALE = 1.925;

export default function VijayanagaraGameScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionTitle, setTransitionTitle] = useState("");
  const [transitionDesc, setTransitionDesc] = useState("");
  const [travelType, setTravelType] = useState<"coracle" | "stone_road" | "temple_walk">("coracle");

  // Core Campaign Progression State
  const [stage, setStage] = useState<VijayanagaraStage>(1);
  const [scene, setScene] = useState<VijayanagaraSceneType>("anegundi_river_crossing");
  const [playerPos, setPlayerPos] = useState({ x: 50.0, y: 82.0 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);

  // Stage 1 Story & Interaction State
  const [hasMetVidyaranya, setHasMetVidyaranya] = useState(false);
  const [chowkaBaraAttempts, setChowkaBaraAttempts] = useState(0);
  const [isChowkaBaraComplete, setIsChowkaBaraComplete] = useState(false);
  const [hasVidyaranyaBlessing, setHasVidyaranyaBlessing] = useState(false);
  const [isStage1Complete, setIsStage1Complete] = useState(false);
  const [showOpeningAtmosphere, setShowOpeningAtmosphere] = useState(true);

  // Stage 2 Story & Interaction State
  const [hasEncounteredFirstRumor, setHasEncounteredFirstRumor] = useState(false);
  const [hasFirstLedgerFragment, setHasFirstLedgerFragment] = useState(false);
  const [inspectedToys, setInspectedToys] = useState<string[]>([]);
  const [hasJournalToy, setHasJournalToy] = useState(false);
  const [talkedToForeignTraveler, setTalkedToForeignTraveler] = useState(false);
  const [isStage2Complete, setIsStage2Complete] = useState(false);
  const [showStage2OpeningBanner, setShowStage2OpeningBanner] = useState(true);

  // Stage 3 Story & Interaction State
  const [hasSecondLedgerFragment, setHasSecondLedgerFragment] = useState(false);
  const [isMusicalPillarsComplete, setIsMusicalPillarsComplete] = useState(false);
  const [hasHazaraRamaDiscovery, setHasHazaraRamaDiscovery] = useState(false);
  const [hasMusicianWarning, setHasMusicianWarning] = useState(false);
  const [isStage3Complete, setIsStage3Complete] = useState(false);
  const [showStage3OpeningBanner, setShowStage3OpeningBanner] = useState(true);
  const [stage3Countdown, setStage3Countdown] = useState<number | null>(null);
  const [showCaughtByGuardsModal, setShowCaughtByGuardsModal] = useState(false);

  // Stage 4 Story & Climax State
  const [isFestivalSceneRestored, setIsFestivalSceneRestored] = useState(false);
  const [hasFinalLedgerFragment, setHasFinalLedgerFragment] = useState(false);
  const [isLedgerAssembled, setIsLedgerAssembled] = useState(false);
  const [hasTalikotaNarrationViewed, setHasTalikotaNarrationViewed] = useState(false);
  const [isJournalFullyUnlocked, setIsJournalFullyUnlocked] = useState(false);
  const [hasFinalKeepsake, setHasFinalKeepsake] = useState(false);
  const [isCampaignComplete, setIsCampaignComplete] = useState(false);
  const [showStage4OpeningBanner, setShowStage4OpeningBanner] = useState(true);

  // Journal Unlocks State
  const [unlockedJournalEntries, setUnlockedJournalEntries] = useState<string[]>([
    "anegundi_origin",
    "vidyaranya_sage",
  ]);

  // Jolly Bhai Companion State
  const [showJollyDialogue, setShowJollyDialogue] = useState(false);
  const [jollySpeechText, setJollySpeechText] = useState<string>("");
  const [jollyOptions, setJollyOptions] = useState<Array<{ id: number; text: string }>>([]);
  const [jollyDialogueScene, setJollyDialogueScene] = useState<VijayanagaraSceneType | null>(null);
  const [hasTalkedToJolly, setHasTalkedToJolly] = useState<boolean>(false);
  const [heardClueScenes, setHeardClueScenes] = useState<string[]>([]);

  // Modal UI States
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [showVidyaranyaDialogue, setShowVidyaranyaDialogue] = useState(false);
  const [isVidyaranyaVoiceActive, setIsVidyaranyaVoiceActive] = useState(false);
  const [dialogueTopic, setDialogueTopic] = useState<"intro" | "founders" | "region" | "vidyaranya">("intro");
  const [showChowkaBaraModal, setShowChowkaBaraModal] = useState(false);
  const [showBlessingCutscene, setShowBlessingCutscene] = useState(false);
  const [showStage1VictoryModal, setShowStage1VictoryModal] = useState(false);
  const [showCoracleNotice, setShowCoracleNotice] = useState(false);
  const [hasTriggeredCoracleNotice, setHasTriggeredCoracleNotice] = useState(false);

  // Stage 2 Modals
  const [showGemAssessorDialogue, setShowGemAssessorDialogue] = useState(false);
  const [gemDialogueTopic, setGemDialogueTopic] = useState<"gems" | "rumor" | "merchant">("gems");
  const [showToymakerDialogue, setShowToymakerDialogue] = useState(false);
  const [showToyInspectionModal, setShowToyInspectionModal] = useState(false);
  const [showForeignTravelerDialogue, setShowForeignTravelerDialogue] = useState(false);
  const [showStage2VictoryModal, setShowStage2VictoryModal] = useState(false);

  // Stage 3 Modals
  const [showRaghavendraDialogue, setShowRaghavendraDialogue] = useState(false);
  const [raghavendraTopic, setRaghavendraTopic] = useState<"king" | "chariot" | "pillars" | "warning">("king");
  const [showMusicalPillarsModal, setShowMusicalPillarsModal] = useState(false);
  const [showHazaraRamaModal, setShowHazaraRamaModal] = useState(false);
  const [showStage3VictoryModal, setShowStage3VictoryModal] = useState(false);

  // Stage 4 Modals
  const [showFestivalPuzzleModal, setShowFestivalPuzzleModal] = useState(false);
  const [showLedgerAssemblyModal, setShowLedgerAssemblyModal] = useState(false);
  const [showTalikotaModal, setShowTalikotaModal] = useState(false);
  const [showKeeperDialogue, setShowKeeperDialogue] = useState(false);
  const [showCampaignCompletionModal, setShowCampaignCompletionModal] = useState(false);

  // =========================================================================
  // GLOBAL DIALOGUE & AUDIO LIFECYCLE CLEANUP ON SCENE / STAGE CHANGE
  // =========================================================================
  useEffect(() => {
    // 1. Invalidate active voice & stop dialogue audio immediately
    stopAllCharacterVoice();
    stopCharacterDialogue();

    // 2. Immediately close active dialogue panels & clear ownership
    setShowVidyaranyaDialogue(false);
    setIsVidyaranyaVoiceActive(false);
    setShowGemAssessorDialogue(false);
    setShowToymakerDialogue(false);
    setShowForeignTravelerDialogue(false);
    setShowRaghavendraDialogue(false);
    setShowKeeperDialogue(false);
    setShowCoracleNotice(false);
    setShowJollyDialogue(false);
    setJollyDialogueScene(null);
  }, [scene, stage]);

  // --- PERSISTENCE: LOAD ON MOUNT ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        try {
          const saved = localStorage.getItem(VIJAYANAGARA_STORAGE_KEY);
          if (saved) {
            const parsed: VijayanagaraSaveState = JSON.parse(saved);
            if (parsed.stage) setStage(parsed.stage);
            if (parsed.scene) setScene(parsed.scene);
            if (parsed.playerPos) setPlayerPos(parsed.playerPos);
            if (parsed.hasMetVidyaranya !== undefined) setHasMetVidyaranya(parsed.hasMetVidyaranya);
            if (parsed.chowkaBaraAttempts !== undefined) setChowkaBaraAttempts(parsed.chowkaBaraAttempts);
            if (parsed.isChowkaBaraComplete !== undefined) setIsChowkaBaraComplete(parsed.isChowkaBaraComplete);
            if (parsed.hasVidyaranyaBlessing !== undefined) {
              setHasVidyaranyaBlessing(parsed.hasVidyaranyaBlessing);
              setIsStage1Complete(parsed.hasVidyaranyaBlessing);
            }
            if (parsed.hasEncounteredFirstRumor !== undefined) setHasEncounteredFirstRumor(parsed.hasEncounteredFirstRumor);
            if (parsed.hasFirstLedgerFragment !== undefined) {
              setHasFirstLedgerFragment(parsed.hasFirstLedgerFragment);
              if (parsed.hasFirstLedgerFragment && parsed.hasEncounteredFirstRumor) {
                setIsStage2Complete(true);
              }
            }
            if (parsed.inspectedToys) setInspectedToys(parsed.inspectedToys);
            if (parsed.hasJournalToy !== undefined) setHasJournalToy(parsed.hasJournalToy);
            if (parsed.talkedToForeignTraveler !== undefined) setTalkedToForeignTraveler(parsed.talkedToForeignTraveler);
            if (parsed.hasSecondLedgerFragment !== undefined) {
              setHasSecondLedgerFragment(parsed.hasSecondLedgerFragment);
              setIsMusicalPillarsComplete(parsed.isMusicalPillarsComplete || parsed.hasSecondLedgerFragment);
              if (parsed.hasSecondLedgerFragment && parsed.hasMusicianWarning) {
                setIsStage3Complete(true);
              }
            }
            if (parsed.hasHazaraRamaDiscovery !== undefined) setHasHazaraRamaDiscovery(parsed.hasHazaraRamaDiscovery);
            if (parsed.hasMusicianWarning !== undefined) setHasMusicianWarning(parsed.hasMusicianWarning);
            
            // Stage 4 Loaded Properties
            if (parsed.isFestivalSceneRestored !== undefined) setIsFestivalSceneRestored(parsed.isFestivalSceneRestored);
            if (parsed.hasFinalLedgerFragment !== undefined) setHasFinalLedgerFragment(parsed.hasFinalLedgerFragment);
            if (parsed.isLedgerAssembled !== undefined) setIsLedgerAssembled(parsed.isLedgerAssembled);
            if (parsed.hasTalikotaNarrationViewed !== undefined) setHasTalikotaNarrationViewed(parsed.hasTalikotaNarrationViewed);
            if (parsed.isJournalFullyUnlocked !== undefined) setIsJournalFullyUnlocked(parsed.isJournalFullyUnlocked);
            if (parsed.hasFinalKeepsake !== undefined) setHasFinalKeepsake(parsed.hasFinalKeepsake);
            if (parsed.isCampaignComplete !== undefined) setIsCampaignComplete(parsed.isCampaignComplete);

            if (parsed.unlockedJournalEntries) setUnlockedJournalEntries(parsed.unlockedJournalEntries);
          }
        } catch (err) {
          console.error("Failed to load Vijayanagara save state", err);
        } finally {
          setIsLoading(false);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // --- GLOBAL UNMOUNT AUDIO CLEANUP ---
  useEffect(() => {
    return () => {
      stopNarration();
      stopAllCharacterVoice();
    };
  }, []);

  // Intro narration for Vijayanagara Empire (Stage 1: 1336 AD)
  const hasPlayedIntroNarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && scene === "anegundi_river_crossing" && !hasPlayedIntroNarrationRef.current) {
      hasPlayedIntroNarrationRef.current = true;
      const introText =
        "The year is 1336 AD. Vijayanagara begins here at Anegundi beside the Tungabhadra River. Cross the river and speak with Sage Vidyaranya.";
      const timer = setTimeout(() => {
        setShowOpeningAtmosphere(false);
        playNarration(introText, { speaker: "ratan", pace: 0.88, language_code: "en-IN" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scene]);

  // Stage entry narrations
  const hasPlayedStage2NarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && stage === 2 && !hasPlayedStage2NarrationRef.current) {
      hasPlayedStage2NarrationRef.current = true;
      const text =
        "The year is 1520 AD. Welcome to Hampi Bazaar during the golden age. Search the market and find the missing merchant's ledger.";
      const timer = setTimeout(() => {
        setShowStage2OpeningBanner(false);
        playNarration(text, { speaker: "ratan", pace: 0.88, language_code: "en-IN" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, stage]);

  const hasPlayedStage3NarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && stage === 3 && !hasPlayedStage3NarrationRef.current) {
      hasPlayedStage3NarrationRef.current = true;
      const text =
        "Welcome to the vittala temple in raja krishnaverya time the golden period of vijaynagra now find out all the ledgers in this time period before the guards catch you";
      const timer = setTimeout(async () => {
        setShowStage3OpeningBanner(false);
        const audio = await playNarration(text, { 
          speaker: "ratan", 
          pace: 0.88, 
          language_code: "en-IN",
          audioUrl: "/audio_cache/stage3_opening_narration.wav"
        });
        if (audio) {
          audio.addEventListener("ended", () => {
            setStage3Countdown(120);
          });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, stage]);

  const hasPlayedStage4NarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && stage === 4 && !hasPlayedStage4NarrationRef.current) {
      hasPlayedStage4NarrationRef.current = true;
      const text =
        "The year is 1565 AD at Mahanavami Dibba. Find the last ledger fragment to preserve the story of Vijayanagara.";
      const timer = setTimeout(() => {
        setShowStage4OpeningBanner(false);
        playNarration(text, { speaker: "ratan", pace: 0.88, language_code: "en-IN" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, stage]);

  // Stage 3 Countdown Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage3Countdown !== null && stage3Countdown > 0 && !showCaughtByGuardsModal && stage === 3) {
      if (hasSecondLedgerFragment) {
        // Player found the ledger! Stop the timer.
        setStage3Countdown(null);
      } else {
        interval = setInterval(() => {
          setStage3Countdown((prev) => {
            if (prev === null) return null;
            if (prev <= 1) {
              clearInterval(interval);
              setShowCaughtByGuardsModal(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [stage3Countdown, showCaughtByGuardsModal, stage, hasSecondLedgerFragment]);

  // Sage Vidyaranya Dialogue Narration (1336 AD Sringeri Scholar)
  useEffect(() => {
    if (showVidyaranyaDialogue) {
      let speech = "";
      if (dialogueTopic === "intro") {
        speech =
          "Welcome to Anegundi. This town stands beside the Tungabhadra River. It is an important place in Vijayanagara's history. Before you travel south, let us talk. A great empire will soon rise across the river. I can also teach you a game called Chowka Bara.";
      } else if (dialogueTopic === "founders") {
        speech =
          "Harihara and Bukka founded Vijayanagara in 1336. The two brothers wanted to protect our culture, arts, and trade. They built a strong and united kingdom.";
      } else if (dialogueTopic === "region") {
        speech =
          "These huge granite rocks and the river protect us like a natural fort. Enemy armies cannot enter easily. The river valley also gives good soil and water.";
      } else if (dialogueTopic === "vidyaranya") {
        speech =
          "Kings and armies pass away, but knowledge and culture last forever. I guided the founders to build temples, support learning, and protect justice.";
      }

      if (speech) {
        setIsVidyaranyaVoiceActive(true);
        // Use the dedicated Indic Parler-TTS character route for Vidyaranya so he gets
        // his own aged, gravelly South Indian Kannada old-sage accent rather than the
        // generic narrator voice.  The "vidyaranya" character key maps to the dedicated
        // voice profile in parler_tts_service.py (slow pace, reverent Indian English).
        stopAllCharacterVoice();
        playCharacterDialogue({
          character: "vidyaranya",
          text: speech,
          onStart: () => setIsVidyaranyaVoiceActive(true),
          onEnd: () => setIsVidyaranyaVoiceActive(false),
          onError: () => setIsVidyaranyaVoiceActive(false),
        });
      }
    } else {
      setIsVidyaranyaVoiceActive(false);
    }
    return () => {
      stopAllCharacterVoice();
      setIsVidyaranyaVoiceActive(false);
    };
  }, [showVidyaranyaDialogue, dialogueTopic]);

  // Cleanup narration on component unmount
  useEffect(() => {
    return () => {
      stopAllCharacterVoice();
    };
  }, []);

  // --- PERSISTENCE: SAVE ON CHANGE ---
  const saveState = useCallback(() => {
    if (typeof window === "undefined" || isLoading) return;
    try {
      const stateToSave: VijayanagaraSaveState = {
        stage,
        scene,
        playerPos,
        tutorialCompleted: true,
        hasMetVidyaranya,
        chowkaBaraAttempts,
        isChowkaBaraComplete,
        hasVidyaranyaBlessing,
        hasEncounteredFirstRumor,
        hasFirstLedgerFragment,
        inspectedToys,
        hasJournalToy,
        talkedToForeignTraveler,
        hasSecondLedgerFragment,
        isMusicalPillarsComplete,
        hasHazaraRamaDiscovery,
        hasMusicianWarning,
        isFestivalSceneRestored,
        hasFinalLedgerFragment,
        isLedgerAssembled,
        hasTalikotaNarrationViewed,
        isJournalFullyUnlocked,
        hasFinalKeepsake,
        isCampaignComplete,
        unlockedJournalEntries,
      };
      localStorage.setItem(VIJAYANAGARA_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error("Failed to persist Vijayanagara state", err);
    }
  }, [
    stage,
    scene,
    playerPos,
    hasMetVidyaranya,
    chowkaBaraAttempts,
    isChowkaBaraComplete,
    hasVidyaranyaBlessing,
    hasEncounteredFirstRumor,
    hasFirstLedgerFragment,
    inspectedToys,
    hasJournalToy,
    talkedToForeignTraveler,
    hasSecondLedgerFragment,
    isMusicalPillarsComplete,
    hasHazaraRamaDiscovery,
    hasMusicianWarning,
    isFestivalSceneRestored,
    hasFinalLedgerFragment,
    isLedgerAssembled,
    hasTalikotaNarrationViewed,
    isJournalFullyUnlocked,
    hasFinalKeepsake,
    isCampaignComplete,
    unlockedJournalEntries,
    isLoading,
  ]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  // URL Synchronization
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      const url = new URL(window.location.href);
      url.searchParams.set("stage", stage.toString());
      url.searchParams.set("scene", scene);
      window.history.replaceState({}, "", url.toString());
    }
  }, [stage, scene, isLoading]);

  // --- RESET HANDLER ---
  const handleResetCampaign = () => {
    if (window.confirm("Are you sure you want to restart your Vijayanagara Empire journey from Anegundi?")) {
      // Audio Cleanup
      stopNarration();
      stopAllCharacterVoice();

      // Reset Narration Refs to allow them to play again
      hasPlayedIntroNarrationRef.current = false;
      hasPlayedStage2NarrationRef.current = false;
      hasPlayedStage3NarrationRef.current = false;
      hasPlayedStage4NarrationRef.current = false;

      localStorage.removeItem(VIJAYANAGARA_STORAGE_KEY);
      setStage(INITIAL_VIJAYANAGARA_STATE.stage);
      setScene(INITIAL_VIJAYANAGARA_STATE.scene);
      setPlayerPos(INITIAL_VIJAYANAGARA_STATE.playerPos);
      setHasMetVidyaranya(false);
      setChowkaBaraAttempts(0);
      setIsChowkaBaraComplete(false);
      setHasVidyaranyaBlessing(false);
      setIsStage1Complete(false);
      setShowOpeningAtmosphere(true);
      setHasEncounteredFirstRumor(false);
      setHasFirstLedgerFragment(false);
      setInspectedToys([]);
      setHasJournalToy(false);
      setTalkedToForeignTraveler(false);
      setIsStage2Complete(false);
      setShowStage2OpeningBanner(true);
      setHasSecondLedgerFragment(false);
      setIsMusicalPillarsComplete(false);
      setHasHazaraRamaDiscovery(false);
      setHasMusicianWarning(false);
      setIsStage3Complete(false);
      setShowStage3OpeningBanner(true);
      setIsFestivalSceneRestored(false);
      setHasFinalLedgerFragment(false);
      setIsLedgerAssembled(false);
      setHasTalikotaNarrationViewed(false);
      setIsJournalFullyUnlocked(false);
      setHasFinalKeepsake(false);
      setIsCampaignComplete(false);
      setShowStage4OpeningBanner(true);
      setUnlockedJournalEntries(INITIAL_VIJAYANAGARA_STATE.unlockedJournalEntries);
    }
  };

  // --- PROXIMITY & INTERACTION CHECKS ---
  // Stage 1 Proximities
  const isNearRiverUphillExit =
    scene === "anegundi_river_crossing" &&
    playerPos.y <= 58.0 &&
    playerPos.x >= 20.0 &&
    playerPos.x <= 45.0;

  const coraclePos = { x: 65.0, y: 78.0 };
  const distToCoracle = Math.sqrt(
    Math.pow(playerPos.x - coraclePos.x, 2) + Math.pow(playerPos.y - coraclePos.y, 2)
  );
  const isNearCoracle = scene === "anegundi_river_crossing" && distToCoracle < 11.0;

  const isNearFortDownhillExit =
    scene === "anegundi_old_fort" &&
    playerPos.y >= 80.0 &&
    playerPos.x >= 55.0;

  const vidyaranyaFortPos = { x: 38.0, y: 65.0 };
  const distToVidyaranya = Math.sqrt(
    Math.pow(playerPos.x - vidyaranyaFortPos.x, 2) + Math.pow(playerPos.y - vidyaranyaFortPos.y, 2)
  );
  const isNearVidyaranya = scene === "anegundi_old_fort" && distToVidyaranya < 11.0;

  // Stage 2 Proximities
  const isNearBazaarNorthExit =
    scene === "hampi_bazaar_entry" &&
    playerPos.x <= 25.0 &&
    playerPos.y >= 75.0;

  const isNearBazaarGemRow =
    scene === "hampi_bazaar_entry" &&
    playerPos.x >= 70.0 &&
    playerPos.y <= 74.0;

  const isNearBazaarToymaker =
    scene === "hampi_bazaar_entry" &&
    playerPos.x >= 38.0 &&
    playerPos.x <= 52.0 &&
    playerPos.y >= 68.0 &&
    playerPos.y <= 78.0;

  const isNearBazaarForeignTraveler =
    scene === "hampi_bazaar_entry" &&
    playerPos.x >= 58.0 &&
    playerPos.x <= 72.0 &&
    playerPos.y >= 52.0 &&
    playerPos.y <= 62.0;

  const isNearBazaarStage3Road =
    scene === "hampi_bazaar_entry" &&
    playerPos.x >= 74.0 &&
    playerPos.y >= 78.0;

  const isNearGemRowExit =
    scene === "gem_traders_row" &&
    playerPos.x <= 28.0 &&
    playerPos.y >= 75.0;

  const isNearGemAssessor =
    scene === "gem_traders_row" &&
    playerPos.x >= 30.0 &&
    playerPos.x <= 45.0 &&
    playerPos.y >= 60.0 &&
    playerPos.y <= 72.0;

  const isNearToymakerExit =
    scene === "toymaker_stall" &&
    playerPos.x <= 28.0 &&
    playerPos.y >= 75.0;

  const isNearToymakerNpc =
    scene === "toymaker_stall" &&
    playerPos.x >= 54.0 &&
    playerPos.x <= 70.0 &&
    playerPos.y >= 60.0 &&
    playerPos.y <= 74.0;

  // Stage 3 Proximities
  const isNearChariotMusician =
    scene === "stone_chariot_entry" &&
    playerPos.x >= 28.0 &&
    playerPos.x <= 44.0 &&
    playerPos.y >= 64.0 &&
    playerPos.y <= 76.0;

  const isNearChariotMandapaExit =
    scene === "stone_chariot_entry" &&
    playerPos.x >= 68.0 &&
    playerPos.y <= 66.0;

  const isNearChariotHazaraRamaExit =
    scene === "stone_chariot_entry" &&
    playerPos.x <= 26.0 &&
    playerPos.y <= 62.0;

  const isNearChariotStage4Road =
    scene === "stone_chariot_entry" &&
    playerPos.x >= 72.0 &&
    playerPos.y >= 78.0;

  const isNearChariotBazaarReturn =
    scene === "stone_chariot_entry" &&
    playerPos.x <= 26.0 &&
    playerPos.y >= 78.0;

  const isNearMusicalPillarsCenter =
    scene === "musical_pillars" &&
    playerPos.x >= 40.0 &&
    playerPos.x <= 60.0 &&
    playerPos.y >= 58.0 &&
    playerPos.y <= 72.0;

  const isNearMusicalPillarsExit =
    scene === "musical_pillars" &&
    playerPos.x <= 28.0 &&
    playerPos.y >= 76.0;

  const isNearHazaraFriezes =
    scene === "hazara_rama_walls" &&
    playerPos.x >= 35.0 &&
    playerPos.x <= 55.0 &&
    playerPos.y >= 62.0 &&
    playerPos.y <= 74.0;

  const isNearHazaraRamaExit =
    scene === "hazara_rama_walls" &&
    playerPos.x >= 70.0 &&
    playerPos.y >= 76.0;

  // Stage 4 Proximities
  const isNearMahanavamiTierTrigger =
    scene === "mahanavami_celebration" &&
    playerPos.x >= 42.0 &&
    playerPos.x <= 58.0 &&
    playerPos.y >= 58.0 &&
    playerPos.y <= 70.0;

  const isNearMahanavamiNiche =
    scene === "mahanavami_celebration" &&
    playerPos.x >= 42.0 &&
    playerPos.x <= 58.0 &&
    playerPos.y >= 58.0 &&
    playerPos.y <= 70.0 &&
    isFestivalSceneRestored;

  const isNearMahanavamiSouthExit =
    scene === "mahanavami_celebration" &&
    playerPos.x >= 40.0 &&
    playerPos.x <= 60.0 &&
    playerPos.y >= 80.0;

  const isNearMahanavamiWestExit =
    scene === "mahanavami_celebration" &&
    playerPos.x <= 26.0 &&
    playerPos.y >= 75.0;

  const isNearPushkaraniKeeper =
    scene === "closing_reflection" &&
    playerPos.x >= 28.0 &&
    playerPos.x <= 46.0 &&
    playerPos.y >= 62.0 &&
    playerPos.y <= 74.0;

  const isNearPushkaraniReturn =
    scene === "closing_reflection" &&
    playerPos.x >= 70.0 &&
    playerPos.y >= 78.0;

  // --- COLLISION BOUNDARY FUNCTION ---
  const checkWalkablePosition = useCallback(
    (targetX: number, targetY: number, activeScene: VijayanagaraSceneType) => {
      const config = SCENE_CONFIGS[activeScene];
      if (!config) return true;

      // Outer bounding box
      if (
        targetX < config.minX ||
        targetX > config.maxX ||
        targetY < config.minY ||
        targetY > config.maxY
      ) {
        return false;
      }

      // Stage 1 Physics
      if (activeScene === "anegundi_river_crossing") {
        if (targetX > 54.0 && targetY < 65.0) return false;
        if (targetX < 24.0 && targetY > 78.0) return false;
      }

      if (activeScene === "anegundi_old_fort") {
        if (targetX < 32.0 && targetY < 68.0) return false;
        if (targetX > 62.0 && targetY < 60.0) return false;
        if (targetX >= 34.0 && targetX <= 42.0 && targetY >= 62.0 && targetY <= 68.0) return false;
      }

      // Stage 2 Physics
      if (activeScene === "hampi_bazaar_entry") {
        if (targetY < 52.0) return false;
        if (targetX > 78.0 && targetY > 80.0) return false;
        if (targetX < 22.0 && targetY < 64.0) return false;
      }

      if (activeScene === "gem_traders_row") {
        if (targetX < 30.0 && targetY < 68.0) return false;
        if (targetX > 72.0 && targetY < 62.0) return false;
      }

      if (activeScene === "toymaker_stall") {
        if (targetX > 60.0 && targetY < 65.0) return false;
        if (targetX < 32.0 && targetY < 66.0) return false;
      }

      // Stage 3 Physics
      if (activeScene === "stone_chariot_entry") {
        if (targetX >= 44.0 && targetX <= 58.0 && targetY >= 58.0 && targetY <= 72.0) return false;
        if (targetY < 52.0) return false;
      }

      if (activeScene === "musical_pillars") {
        if (targetX >= 45.0 && targetX <= 55.0 && targetY >= 62.0 && targetY <= 68.0) return false;
        if (targetY < 54.0) return false;
      }

      if (activeScene === "hazara_rama_walls") {
        if (targetX < 26.0) return false;
        if (targetY < 56.0) return false;
      }

      // Stage 4 Physics
      if (activeScene === "mahanavami_celebration" || activeScene === "final_ledger_fragment") {
        // High platform central stone shrine boundary
        if (targetX >= 46.0 && targetX <= 54.0 && targetY >= 56.0 && targetY <= 62.0) return false;
      }

      if (activeScene === "closing_reflection") {
        // Stepped water basin boundary (center-left)
        if (targetX >= 42.0 && targetX <= 72.0 && targetY >= 68.0 && targetY <= 86.0) return false;
      }

      return true;
    },
    []
  );

  const transitionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionIntervalRef.current) {
        clearInterval(transitionIntervalRef.current);
      }
    };
  }, []);

  // --- THEMATIC TRANSITION HELPER ---
  const triggerTransition = (
    nextScene: VijayanagaraSceneType,
    nextPos: { x: number; y: number },
    title: string,
    desc: string,
    type: "coracle" | "stone_road" | "temple_walk" = "stone_road"
  ) => {
    // Re-entrancy guard
    if (isTransitioning) return;

    stopAllCharacterVoice();
    setIsVidyaranyaVoiceActive(false);

    setIsTransitioning(true);
    setTransitionTitle(title);
    setTransitionDesc(desc);
    setTravelType(type);
    setTransitionProgress(0);

    if (transitionIntervalRef.current) {
      clearInterval(transitionIntervalRef.current);
    }

    let curr = 0;
    transitionIntervalRef.current = setInterval(() => {
      curr += 5;
      setTransitionProgress(curr);
      if (curr >= 100) {
        if (transitionIntervalRef.current) {
          clearInterval(transitionIntervalRef.current);
          transitionIntervalRef.current = null;
        }

        // Automatic Stage Determination based on destination scene
        if (
          nextScene === "anegundi_river_crossing" ||
          nextScene === "anegundi_old_fort" ||
          nextScene === "anegundi_chowka_bara"
        ) {
          setStage(1);
        } else if (
          nextScene === "hampi_bazaar_entry" ||
          nextScene === "gem_traders_row" ||
          nextScene === "toymaker_stall" ||
          nextScene === "foreign_traveler_corner"
        ) {
          setStage(2);
        } else if (
          nextScene === "stone_chariot_entry" ||
          nextScene === "musical_pillars" ||
          nextScene === "hazara_rama_walls" ||
          nextScene === "musicians_warning"
        ) {
          setStage(3);
        } else if (
          nextScene === "mahanavami_celebration" ||
          nextScene === "final_ledger_fragment" ||
          nextScene === "talikota_narration" ||
          nextScene === "closing_reflection"
        ) {
          setStage(4);
        }

        setScene(nextScene);
        setPlayerPos(nextPos);
        setIsTransitioning(false);
      }
    }, 40);
  };

  // --- 60 FPS GAME LOOP & KEYBOARD MOVEMENT ---
  const isAnyModalOpen =
    isTransitioning ||
    isJournalOpen ||
    showVidyaranyaDialogue ||
    showChowkaBaraModal ||
    showBlessingCutscene ||
    showStage1VictoryModal ||
    // Note: showCoracleNotice is intentionally NOT here — the ferry hint is
    // a non-blocking informational overlay. Player can still move while it
    // is displayed, and walking away from the ferry will dismiss it.
    showGemAssessorDialogue ||
    showToymakerDialogue ||
    showToyInspectionModal ||
    showForeignTravelerDialogue ||
    showStage2VictoryModal ||
    showRaghavendraDialogue ||
    showMusicalPillarsModal ||
    showHazaraRamaModal ||
    showStage3VictoryModal ||
    showFestivalPuzzleModal ||
    showLedgerAssemblyModal ||
    showTalikotaModal ||
    showKeeperDialogue ||
    showCampaignCompletionModal;

  useEffect(() => {
    if (isLoading || isTransitioning) return;

    const keysHeld = new Set<string>();
    let animationFrameId: number;
    let localWalkTimer = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysHeld.add(key);

      // Dismiss opening banners
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        setShowOpeningAtmosphere(false);
        setShowStage2OpeningBanner(false);
        setShowStage3OpeningBanner(false);
        setShowStage4OpeningBanner(false);
      }

      // Handle Interaction Key [E]
      if (key === "e" && !isAnyModalOpen) {
        // --- STAGE 1 INTERACTIONS ---
        if (isNearRiverUphillExit) {
          triggerTransition(
            "anegundi_old_fort",
            { x: 65.0, y: 80.0 },
            "Ascending to Anegundi Old Fort",
            "Climbing the rugged stone steps past ancient granite bastions to the sacred mandapa.",
            "stone_road"
          );
        } else if (isNearFortDownhillExit) {
          triggerTransition(
            "anegundi_river_crossing",
            { x: 35.0, y: 62.0 },
            "Returning to Tungabhadra Riverbank",
            "Descending the rocky hill track back toward the calm coracle crossing at the water's edge.",
            "stone_road"
          );
        } else if (isNearVidyaranya) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowVidyaranyaDialogue(true);
          setDialogueTopic("intro");
          if (!hasMetVidyaranya) {
            setHasMetVidyaranya(true);
            if (!unlockedJournalEntries.includes("harihara_bukka_founding")) {
              setUnlockedJournalEntries((prev) => [...prev, "harihara_bukka_founding"]);
            }
          }
        } else if (isNearCoracle) {
          if (hasVidyaranyaBlessing) {
            triggerTransition(
              "hampi_bazaar_entry",
              { x: 35.0, y: 80.0 },
              "Crossing Tungabhadra to Hampi Bazaar (Stage 2)",
              "Skimming across the swirling river rapids as the morning mist parts to reveal the grand Car Street of Virupaksha.",
              "coracle"
            );
            setStage(2);
            if (!unlockedJournalEntries.includes("hampi_bazaar_trade")) {
              setUnlockedJournalEntries((prev) => [...prev, "hampi_bazaar_trade"]);
            }
          } else {
            // Player presses E at the ferry but does not yet have the blessing:
            // Show (or re-show) the Oracle Ferry requirement notice.
            stopAllCharacterVoice();
            setShowCoracleNotice(true);
            setHasTriggeredCoracleNotice(true);
          }
        }

        // --- STAGE 2 INTERACTIONS ---
        else if (isNearBazaarNorthExit) {
          triggerTransition(
            "anegundi_river_crossing",
            { x: 50.0, y: 82.0 },
            "Returning to Anegundi River Crossing",
            "Gliding northward across the Tungabhadra toward the quiet cradle of the empire.",
            "coracle"
          );
          setStage(1);
        } else if (isNearBazaarGemRow) {
          triggerTransition(
            "gem_traders_row",
            { x: 32.0, y: 78.0 },
            "Entering Gem Traders' Row",
            "Stepping into the stone arcade where rubies and diamonds are weighed by dry measure.",
            "stone_road"
          );
        } else if (isNearBazaarToymaker) {
          triggerTransition(
            "toymaker_stall",
            { x: 32.0, y: 78.0 },
            "Entering Kinhal Artisan Workshop",
            "Visiting the fragrant timber workshop filled with colorful lacquered toys.",
            "stone_road"
          );
        } else if (isNearBazaarForeignTraveler) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowForeignTravelerDialogue(true);
          setTalkedToForeignTraveler(true);
          if (!unlockedJournalEntries.includes("foreign_chronicles_paes")) {
            setUnlockedJournalEntries((prev) => [...prev, "foreign_chronicles_paes"]);
          }
        } else if (isNearBazaarStage3Road) {
          if (isStage2Complete || hasFirstLedgerFragment) {
            triggerTransition(
              "stone_chariot_entry",
              { x: 35.0, y: 78.0 },
              "Royal Car Street Procession to Vittala Temple (Stage 3)",
              "Journeying along the grand paved ceremonial pathway toward the architectural masterpiece of the Golden Age.",
              "stone_road"
            );
            setStage(3);
            if (!unlockedJournalEntries.includes("stone_chariot_garuda")) {
              setUnlockedJournalEntries((prev) => [...prev, "stone_chariot_garuda"]);
            }
          }
        } else if (isNearGemRowExit) {
          triggerTransition(
            "hampi_bazaar_entry",
            { x: 70.0, y: 72.0 },
            "Returning to Virupaksha Car Street",
            "Stepping back out into the bustling main market thoroughfare.",
            "stone_road"
          );
        } else if (isNearGemAssessor) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowGemAssessorDialogue(true);
          setGemDialogueTopic("gems");
          if (!unlockedJournalEntries.includes("gem_markets")) {
            setUnlockedJournalEntries((prev) => [...prev, "gem_markets"]);
          }
        } else if (isNearToymakerExit) {
          triggerTransition(
            "hampi_bazaar_entry",
            { x: 45.0, y: 76.0 },
            "Returning to Virupaksha Car Street",
            "Exiting the artisan stall back into the sunlight of the grand bazaar.",
            "stone_road"
          );
        } else if (isNearToymakerNpc) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowToymakerDialogue(true);
          if (!unlockedJournalEntries.includes("kinhal_toys")) {
            setUnlockedJournalEntries((prev) => [...prev, "kinhal_toys"]);
          }
        }

        // --- STAGE 3 INTERACTIONS ---
        else if (isNearChariotMusician) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowRaghavendraDialogue(true);
          setRaghavendraTopic(hasSecondLedgerFragment ? "warning" : "king");
          if (!unlockedJournalEntries.includes("krishnadevaraya_era")) {
            setUnlockedJournalEntries((prev) => [...prev, "krishnadevaraya_era"]);
          }
        } else if (isNearChariotMandapaExit) {
          triggerTransition(
            "musical_pillars",
            { x: 35.0, y: 76.0 },
            "Entering Ranga Mandapa (Musical Pillars)",
            "Stepping onto the polished granite pavilion surrounded by 56 monolithic resonant pillars.",
            "temple_walk"
          );
        } else if (isNearChariotHazaraRamaExit) {
          triggerTransition(
            "hazara_rama_walls",
            { x: 65.0, y: 76.0 },
            "Approaching Hazara Rama Temple Walls",
            "Walking toward the royal enclosure lined with continuous narrative bas-reliefs.",
            "temple_walk"
          );
        } else if (isNearChariotStage4Road) {
          if (isStage3Complete || hasSecondLedgerFragment) {
            triggerTransition(
              "mahanavami_celebration",
              { x: 50.0, y: 80.0 },
              "Approaching Mahanavami Dibba (Stage 4)",
              "Ascending toward the multi-tiered royal ceremonial platform as evening shadows stretch across the granite landscape.",
              "stone_road"
            );
            setStage(4);
            if (!unlockedJournalEntries.includes("mahanavami_dibba_platform")) {
              setUnlockedJournalEntries((prev) => [...prev, "mahanavami_dibba_platform"]);
            }
          }
        } else if (isNearChariotBazaarReturn) {
          triggerTransition(
            "hampi_bazaar_entry",
            { x: 70.0, y: 76.0 },
            "Returning to Hampi Bazaar",
            "Traveling back toward the bustling market colonnade of Virupaksha.",
            "stone_road"
          );
          setStage(2);
        } else if (isNearMusicalPillarsCenter) {
          setShowMusicalPillarsModal(true);
        } else if (isNearMusicalPillarsExit) {
          triggerTransition(
            "stone_chariot_entry",
            { x: 65.0, y: 68.0 },
            "Returning to Vittala Temple Courtyard",
            "Stepping back out into the sunlit stone courtyard facing the Garuda Shrine.",
            "temple_walk"
          );
        } else if (isNearHazaraFriezes) {
          setShowHazaraRamaModal(true);
          setHasHazaraRamaDiscovery(true);
          if (!unlockedJournalEntries.includes("hazara_rama_friezes")) {
            setUnlockedJournalEntries((prev) => [...prev, "hazara_rama_friezes"]);
          }
        } else if (isNearHazaraRamaExit) {
          triggerTransition(
            "stone_chariot_entry",
            { x: 32.0, y: 65.0 },
            "Returning to Vittala Temple Courtyard",
            "Returning to the central stone courtyard of the Stone Chariot.",
            "temple_walk"
          );
        }

        // --- STAGE 4 INTERACTIONS ---
        else if (isNearMahanavamiNiche && !hasFinalLedgerFragment) {
          setHasFinalLedgerFragment(true);
          setShowLedgerAssemblyModal(true);
          setIsLedgerAssembled(true);
          if (!unlockedJournalEntries.includes("pushkarani_secret_vault")) {
            setUnlockedJournalEntries((prev) => [...prev, "pushkarani_secret_vault"]);
          }
        } else if (isNearMahanavamiTierTrigger && !isFestivalSceneRestored) {
          setShowFestivalPuzzleModal(true);
        } else if (isNearMahanavamiSouthExit) {
          triggerTransition(
            "closing_reflection",
            { x: 35.0, y: 70.0 },
            "Walking to Pushkarani Stepped Tank",
            "Descending the stone steps to the quiet waters of the royal stepped tank under sunset.",
            "temple_walk"
          );
        } else if (isNearMahanavamiWestExit) {
          triggerTransition(
            "stone_chariot_entry",
            { x: 70.0, y: 76.0 },
            "Returning to Vittala Temple Courtyard",
            "Traveling back along the paved pathway toward the Stone Chariot.",
            "stone_road"
          );
          setStage(3);
        } else if (isNearPushkaraniKeeper) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowKeeperDialogue(true);
        } else if (isNearPushkaraniReturn) {
          triggerTransition(
            "mahanavami_celebration",
            { x: 50.0, y: 78.0 },
            "Returning to Mahanavami Dibba",
            "Climbing back toward the multi-tiered ceremonial platform.",
            "temple_walk"
          );
        }
      }

      // Handle Journal Key [J]
      if (key === "j" && !isTransitioning) {
        setIsJournalOpen((prev) => !prev);
      }

      // Handle Escape Key to close modals & immediately stop voice
      if (key === "escape") {
        stopAllCharacterVoice();
        setIsJournalOpen(false);
        setShowVidyaranyaDialogue(false);
        setShowJollyDialogue(false);
        setShowCoracleNotice(false);
        setShowGemAssessorDialogue(false);
        setShowToymakerDialogue(false);
        setShowForeignTravelerDialogue(false);
        setShowRaghavendraDialogue(false);
        setShowHazaraRamaModal(false);
        setShowFestivalPuzzleModal(false);
        setShowLedgerAssemblyModal(false);
        setShowTalikotaModal(false);
        setShowKeeperDialogue(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const gameLoop = () => {
      if (!isAnyModalOpen) {
        let dx = 0;
        let dy = 0;
        const speed = 0.38;

        if (keysHeld.has("arrowleft") || keysHeld.has("a")) dx -= speed;
        if (keysHeld.has("arrowright") || keysHeld.has("d")) dx += speed;
        if (keysHeld.has("arrowup") || keysHeld.has("w")) dy -= speed * 0.85;
        if (keysHeld.has("arrowdown") || keysHeld.has("s")) dy += speed * 0.85;

        const moving = dx !== 0 || dy !== 0;
        setIsWalking(moving);

        if (dx < 0) setFacingLeft(true);
        if (dx > 0) setFacingLeft(false);

        if (moving) {
          localWalkTimer += 0.25;
          setWalkPhase(localWalkTimer);

          setPlayerPos((prev) => {
            const nextX = prev.x + dx;
            const nextY = prev.y + dy;

            const canMoveBoth = checkWalkablePosition(nextX, nextY, scene);
            if (canMoveBoth) {
              return { x: nextX, y: nextY };
            }

            const canMoveX = checkWalkablePosition(nextX, prev.y, scene);
            if (canMoveX) {
              return { x: nextX, y: prev.y };
            }

            const canMoveY = checkWalkablePosition(prev.x, nextY, scene);
            if (canMoveY) {
              return { x: prev.x, y: nextY };
            }

            return prev;
          });
        }
      } else {
        setIsWalking(false);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isLoading,
    isTransitioning,
    scene,
    isAnyModalOpen,
    isNearRiverUphillExit,
    isNearFortDownhillExit,
    isNearVidyaranya,
    isNearCoracle,
    hasMetVidyaranya,
    hasVidyaranyaBlessing,
    isNearBazaarNorthExit,
    isNearBazaarGemRow,
    isNearBazaarToymaker,
    isNearBazaarForeignTraveler,
    isNearBazaarStage3Road,
    isNearGemRowExit,
    isNearGemAssessor,
    isNearToymakerExit,
    isNearToymakerNpc,
    isNearChariotMusician,
    isNearChariotMandapaExit,
    isNearChariotHazaraRamaExit,
    isNearChariotStage4Road,
    isNearChariotBazaarReturn,
    isNearMusicalPillarsCenter,
    isNearMusicalPillarsExit,
    isNearHazaraFriezes,
    isNearHazaraRamaExit,
    isNearMahanavamiTierTrigger,
    isNearMahanavamiNiche,
    isNearMahanavamiSouthExit,
    isNearMahanavamiWestExit,
    isNearPushkaraniKeeper,
    isNearPushkaraniReturn,
    isStage2Complete,
    isStage3Complete,
    hasFirstLedgerFragment,
    hasSecondLedgerFragment,
    hasFinalLedgerFragment,
    isFestivalSceneRestored,
    unlockedJournalEntries,
    checkWalkablePosition,
  ]);

  // Oracle Ferry Proximity Trigger
  // - Auto-shows a non-blocking hint when player enters the coracle radius without Vidyaranya's blessing.
  // - Dismisses the hint when the player walks away (radius exit).
  // - Also cleans up if the player somehow obtains the blessing while standing at the ferry.
  useEffect(() => {
    if (isNearCoracle && !hasVidyaranyaBlessing) {
      // Enter zone without blessing — show hint once per approach.
      if (!hasTriggeredCoracleNotice) {
        stopAllCharacterVoice();
        setShowCoracleNotice(true);
        setHasTriggeredCoracleNotice(true);
      }
    } else if (isNearCoracle && hasVidyaranyaBlessing) {
      // Player is at the ferry AND now has the blessing — close any open hint.
      if (showCoracleNotice) {
        setShowCoracleNotice(false);
      }
      // Reset trigger so the zone can fire again if needed.
      if (hasTriggeredCoracleNotice) {
        setHasTriggeredCoracleNotice(false);
      }
    } else {
      // Player has left the interaction radius — dismiss the hint and reset
      // the trigger guard so the notice can appear again on the next approach.
      if (showCoracleNotice) {
        setShowCoracleNotice(false);
      }
      if (hasTriggeredCoracleNotice) {
        setHasTriggeredCoracleNotice(false);
      }
    }
  }, [isNearCoracle, hasVidyaranyaBlessing, hasTriggeredCoracleNotice, showCoracleNotice]);

  // Stage 1 Handler
  const handleChowkaBaraComplete = (won: boolean, attempts: number) => {
    setShowChowkaBaraModal(false);
    setChowkaBaraAttempts(attempts);

    if (won) {
      setIsChowkaBaraComplete(true);
      setHasVidyaranyaBlessing(true);
      setIsStage1Complete(true);

      setUnlockedJournalEntries((prev) => {
        const next = [...prev];
        if (!next.includes("chowka_bara_game")) next.push("chowka_bara_game");
        if (!next.includes("tungabhadra_defenses")) next.push("tungabhadra_defenses");
        return next;
      });

      setShowBlessingCutscene(true);
    }
  };

  // Stage 2 Handlers
  const handleToyFragmentDiscovery = () => {
    setHasFirstLedgerFragment(true);
    if (!unlockedJournalEntries.includes("missing_ledger_mystery")) {
      setUnlockedJournalEntries((prev) => [...prev, "missing_ledger_mystery"]);
    }
    if (hasEncounteredFirstRumor) {
      setIsStage2Complete(true);
      setShowStage2VictoryModal(true);
    }
  };

  const handleSelectJournalToy = () => {
    setHasJournalToy(true);
    if (!unlockedJournalEntries.includes("kinhal_toys")) {
      setUnlockedJournalEntries((prev) => [...prev, "kinhal_toys"]);
    }
  };

  // Stage 3 Handler
  const handleMusicalPillarsDiscovery = () => {
    setHasSecondLedgerFragment(true);
    setIsMusicalPillarsComplete(true);
    if (!unlockedJournalEntries.includes("musical_pillars_acoustics")) {
      setUnlockedJournalEntries((prev) => [...prev, "musical_pillars_acoustics"]);
    }
  };

  // Stage 4 Handlers
  const handleFestivalReconstructionComplete = () => {
    setShowFestivalPuzzleModal(false);
    setIsFestivalSceneRestored(true);
  };

  const handleCompleteCampaignFinale = () => {
    setShowKeeperDialogue(false);
    setIsJournalFullyUnlocked(true);
    setHasFinalKeepsake(true);
    setIsCampaignComplete(true);

    // Unlock all 15 journal entries
    const allJournalIds = JOURNAL_DATABASE.map((e) => e.id);
    setUnlockedJournalEntries(allJournalIds);

    setShowCampaignCompletionModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-[#141210] items-center justify-center flex-col relative overflow-hidden font-sans">
        <div className="w-16 h-16 border-4 border-[#5a4d3f]/40 border-t-[#d4a359] rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(212,163,89,0.4)]"></div>
        <h1 className="text-2xl font-serif text-[#f6ede0] tracking-widest uppercase mb-2">
          Vijayanagara Empire
        </h1>
        <p className="text-xs font-mono text-[#d4a359] tracking-wider">
          Stage {stage}: {STAGE_NAMES[stage] || "Karnataka Arc"}
        </p>
      </div>
    );
  }

  const currentSceneConfig = SCENE_CONFIGS[scene];

  // Dynamic Perspective Depth Scaling for Vijayanagara Landscapes
  const depthScale = (0.7 + ((playerPos.y - 50.0) / 40.0) * 0.55) * PLAYER_VISUAL_SCALE;
  const walkBob = isWalking ? Math.sin(walkPhase) * 1.8 : 0;
  const walkSway = isWalking ? Math.sin(walkPhase * 0.5) * 1.5 : 0;

  // Mystery fragments collected count
  const collectedFragments = [
    hasFirstLedgerFragment && "frag_1",
    hasSecondLedgerFragment && "frag_2",
    hasFinalLedgerFragment && "frag_3",
  ].filter(Boolean) as string[];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#141210] select-none flex items-center justify-center font-sans">
      
      {/* 2.5D Pixel Game World Viewport */}
      <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] overflow-hidden shadow-2xl">
        
        {/* Background Artwork */}
        <img
          src={currentSceneConfig.backgroundImage}
          alt={currentSceneConfig.title}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Atmospheric Lighting Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25 pointer-events-none"></div>

        {/* --- STAGE 1 SCENE 1: ANEGUNDI RIVER CROSSING HOTSPOTS --- */}
        {scene === "anegundi_river_crossing" && (
          <>
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "32%", top: "56%" }}
            >
              {isNearRiverUphillExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Ascend Trail to Anegundi Old Fort Ruins</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#383027]/85 border border-[#d4a359] rounded-xl flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,0.6)]">
                <GameIcon name="fort_trail" size={20} className="text-[#eedfc8]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Old Fort Trail
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${coraclePos.x}%`, top: `${coraclePos.y}%` }}
            >
              {isNearCoracle && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>
                    {hasVidyaranyaBlessing
                      ? "Cross River to Hampi Bazaar (Stage 2)"
                      : "Oracle Ferry — What is required?"}
                  </span>
                </div>
              )}
              <div className="w-11 h-11 bg-[#233538]/85 border-2 border-[#1b4d52] rounded-full flex items-center justify-center shadow-lg">
                <GameIcon name="coracle" size={20} className="text-[#8ec5c8]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#384e50] mt-1">
                Oracle Ferry
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 1 SCENE 2: ANEGUNDI OLD FORT RUINS HOTSPOTS --- */}
        {scene === "anegundi_old_fort" && (
          <>
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${vidyaranyaFortPos.x}%`, top: `${vidyaranyaFortPos.y}%` }}
            >
              {isNearVidyaranya && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>{isStage1Complete ? "Speak with Sage Vidyaranya" : "Speak & Challenge to Chowka Bara"}</span>
                </div>
              )}
              <div className="w-12 h-14 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <GameIcon name="sage" size={24} className="text-[#d4a359]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Sage Vidyaranya
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "65%", top: "82%" }}
            >
              {isNearFortDownhillExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Descend to Tungabhadra River Crossing</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="river" size={18} className="text-[#89b4c4]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Riverbank Trail
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 2 SCENE 1: HAMPI BAZAAR ENTRY HOTSPOTS --- */}
        {scene === "hampi_bazaar_entry" && (
          <>
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "22%", top: "80%" }}
            >
              {isNearBazaarNorthExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Board Coracle back to Anegundi (Stage 1)</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#233538]/85 border-2 border-[#1b4d52] rounded-full flex items-center justify-center shadow">
                <GameIcon name="coracle" size={18} className="text-[#8ec5c8]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#384e50] mt-1">
                River Ferry
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "75%", top: "70%" }}
            >
              {isNearBazaarGemRow && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Enter Gem Traders&apos; Row</span>
                </div>
              )}
              <div className="w-11 h-11 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-xl flex items-center justify-center shadow-lg">
                <GameIcon name="gem" size={20} className="text-[#6ee7b7]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Gem Arcade
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "45%", top: "74%" }}
            >
              {isNearBazaarToymaker && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Visit Kinhal Toymaker Stall</span>
                </div>
              )}
              <div className="w-11 h-11 bg-[#2e261f]/90 border-2 border-[#c86446] rounded-xl flex items-center justify-center shadow-lg">
                <GameIcon name="artisan" size={20} className="text-[#f59e0b]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Kinhal Toys
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "65%", top: "58%" }}
            >
              {isNearBazaarForeignTraveler && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Speak with Overseas Traveler (Portuguese Visitor)</span>
                </div>
              )}
              <div className="w-12 h-16 md:w-14 md:h-20 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <GameIcon name="traveler" size={24} className="text-[#eedfc8]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Overseas Traveler
              </span>
            </div>

            {(isStage2Complete || hasFirstLedgerFragment) && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
                style={{ left: "80%", top: "82%" }}
              >
                {isNearBazaarStage3Road && (
                  <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                    <span>Royal Procession Road to Vittala Temple (Stage 3)</span>
                  </div>
                )}
                <div className="w-11 h-11 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-xl flex items-center justify-center shadow-lg">
                  <GameIcon name="temple" size={20} className="text-[#d4a359]" />
                </div>
                <span className="text-[10px] font-serif font-bold text-[#d4a359] bg-[#1a1714]/90 px-2 py-0.5 rounded border border-[#d4a359] mt-1">
                  Vittala Temple Road
                </span>
              </div>
            )}
          </>
        )}

        {/* --- STAGE 2 SCENE 2: GEM TRADERS' ROW HOTSPOTS --- */}
        {scene === "gem_traders_row" && (
          <>
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "38%", top: "66%" }}
            >
              {isNearGemAssessor && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Speak with Master Gem Assessor (Setti Somappa)</span>
                </div>
              )}
              <div className="w-12 h-14 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg">
                <GameIcon name="gem" size={22} className="text-[#6ee7b7]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Setti Somappa
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "25%", top: "78%" }}
            >
              {isNearGemRowExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Return to Virupaksha Car Street</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Car Street
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 2 SCENE 3: TOYMAKER STALL HOTSPOTS --- */}
        {scene === "toymaker_stall" && (
          <>
            {/* Animated Shopkeeper on the right stall */}
            <div
              className="absolute pointer-events-none z-10"
              style={{ 
                left: "82%", 
                top: "85%", 
                transform: "translate(-50%, -100%)",
                animation: "wiggle_shopkeeper 3s ease-in-out infinite",
                transformOrigin: "bottom center"
              }}
            >
              <style>{`
                @keyframes wiggle_shopkeeper {
                  0%, 100% { transform: translate(-50%, -100%) rotate(-1deg) scale(1); }
                  50% { transform: translate(-50%, -100%) rotate(1deg) scale(1.03); }
                }
              `}</style>
              <img 
                src="/trader_pots_transparent.png" 
                alt="Shopkeeper" 
                className="w-40 h-auto drop-shadow-xl" 
              />
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "62%", top: "66%" }}
            >
              {isNearToymakerNpc && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Speak with Toymaker Kallappa & Inspect Toys</span>
                </div>
              )}
              <div className="w-12 h-14 bg-[#2e261f]/90 border-2 border-[#c86446] rounded-2xl flex items-center justify-center shadow-lg">
                <GameIcon name="artisan" size={22} className="text-[#f59e0b]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Master Kallappa
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "25%", top: "78%" }}
            >
              {isNearToymakerExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Return to Virupaksha Car Street</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Car Street
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 3 SCENE 1: VITTALA TEMPLE STONE CHARIOT HOTSPOTS --- */}
        {scene === "stone_chariot_entry" && (
          <>
            <style>{`
              @keyframes patrol_guard_1 {
                0% { left: -15%; transform: translate(-50%, -100%) scaleX(1); }
                45% { left: 115%; transform: translate(-50%, -100%) scaleX(1); }
                50% { left: 115%; transform: translate(-50%, -100%) scaleX(-1); }
                95% { left: -15%; transform: translate(-50%, -100%) scaleX(-1); }
                100% { left: -15%; transform: translate(-50%, -100%) scaleX(1); }
              }
              @keyframes patrol_guard_2 {
                0% { left: 115%; transform: translate(-50%, -100%) scaleX(-1); }
                45% { left: -15%; transform: translate(-50%, -100%) scaleX(-1); }
                50% { left: -15%; transform: translate(-50%, -100%) scaleX(1); }
                95% { left: 115%; transform: translate(-50%, -100%) scaleX(1); }
                100% { left: 115%; transform: translate(-50%, -100%) scaleX(-1); }
              }
              @keyframes walk_bob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
            `}</style>

            {/* Animated Patrolling Guards */}
            <div
              className="absolute pointer-events-none z-[5]"
              style={{ top: "82%", animation: "patrol_guard_1 22s linear infinite" }}
            >
              <img src="/guard.png" alt="Patrol Guard" className="w-24 h-24 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" style={{ imageRendering: "pixelated", animation: "walk_bob 0.5s ease-in-out infinite" }} />
            </div>
            <div
              className="absolute pointer-events-none z-[12]"
              style={{ top: "92%", animation: "patrol_guard_2 28s linear infinite" }}
            >
              <img src="/rajasthan-guard-v2.png" alt="Patrol Guard" className="w-28 h-28 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" style={{ imageRendering: "pixelated", animation: "walk_bob 0.6s ease-in-out infinite" }} />
            </div>
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "35%", top: "70%" }}
            >
              {isNearChariotMusician && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>
                    {hasSecondLedgerFragment
                      ? "Listen to Musician's Warning"
                      : "Speak with Maestoso Raghavendra"}
                  </span>
                </div>
              )}
              <div className="w-12 h-14 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <GameIcon name="music" size={24} className="text-[#d4a359]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Maestoso Raghavendra
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "72%", top: "64%" }}
            >
              {isNearChariotMandapaExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Enter Ranga Mandapa (Musical Pillars)</span>
                </div>
              )}
              <div className="w-11 h-11 bg-[#2e261f]/90 border-2 border-[#d4a359] rounded-xl flex items-center justify-center shadow-lg">
                <GameIcon name="temple" size={20} className="text-[#d4a359]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Musical Mandapa
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "24%", top: "60%" }}
            >
              {isNearChariotHazaraRamaExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Inspect Hazara Rama Temple Walls (Optional)</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#25201b]/80 border border-[#d4a359] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="archery" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Hazara Rama
              </span>
            </div>

            {/* Path to Stage 4: Mahanavami Dibba */}
            {(isStage3Complete || hasSecondLedgerFragment) && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
                style={{ left: "80%", top: "82%" }}
              >
                {isNearChariotStage4Road && (
                  <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                    <span>Path to Mahanavami Dibba (Stage 4)</span>
                  </div>
                )}
                <div className="w-11 h-11 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-xl flex items-center justify-center shadow-lg">
                  <GameIcon name="temple" size={20} className="text-[#d4a359]" />
                </div>
                <span className="text-[10px] font-serif font-bold text-[#d4a359] bg-[#1a1714]/90 px-2 py-0.5 rounded border border-[#d4a359] mt-1">
                  Mahanavami Dibba
                </span>
              </div>
            )}

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "22%", top: "80%" }}
            >
              {isNearChariotBazaarReturn && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Return to Hampi Bazaar (Stage 2)</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Hampi Bazaar
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 3 SCENE 2: MUSICAL PILLARS HOTSPOTS --- */}
        {scene === "musical_pillars" && (
          <>
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "50%", top: "65%" }}
            >
              {isNearMusicalPillarsCenter && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Resonate 56 Musical Pillars of Vittala</span>
                </div>
              )}
              <div className="w-14 h-14 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <GameIcon name="music" size={26} className="text-[#d4a359]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Musical Pillars
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "25%", top: "78%" }}
            >
              {isNearMusicalPillarsExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Return to Stone Chariot Courtyard</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Courtyard
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 3 SCENE 3: HAZARA RAMA WALLS HOTSPOTS --- */}
        {scene === "hazara_rama_walls" && (
          <>
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "45%", top: "68%" }}
            >
              {isNearHazaraFriezes && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Examine Narrative Ramayana Bas-Reliefs</span>
                </div>
              )}
              <div className="w-12 h-14 bg-[#2e261f]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg">
                <GameIcon name="archery" size={22} className="text-[#eedfc8]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Ramayana Friezes
              </span>
            </div>

            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "72%", top: "78%" }}
            >
              {isNearHazaraRamaExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Return to Stone Chariot Courtyard</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Courtyard
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 4 SCENE 1: MAHANAVAMI CELEBRATION HOTSPOTS --- */}
        {scene === "mahanavami_celebration" && (
          <>
            {/* Upper Tier Interaction / Flashback Trigger */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "50%", top: "64%" }}
            >
              {isNearMahanavamiTierTrigger && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>
                    {!isFestivalSceneRestored
                      ? "Witness 1565 Festival Flashback"
                      : !hasFinalLedgerFragment
                      ? "Unseal Royal Niche for Final Fragment"
                      : "Inspect Master Ledger Niche"}
                  </span>
                </div>
              )}
              <div className="w-14 h-14 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <GameIcon name={isFestivalSceneRestored ? "ledger" : "temple"} size={26} className="text-[#d4a359]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                {isFestivalSceneRestored ? "Stone Vault Niche" : "Imperial Dais"}
              </span>
            </div>

            {/* South Exit to Pushkarani Stepped Tank */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "50%", top: "82%" }}
            >
              {isNearMahanavamiSouthExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Walk to Pushkarani Stepped Tank (Closing Reflection)</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#233538]/85 border-2 border-[#1b4d52] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="sunset" size={18} className="text-[#f59e0b]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#384e50] mt-1">
                Pushkarani Path
              </span>
            </div>

            {/* West Return to Stage 3 */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "22%", top: "78%" }}
            >
              {isNearMahanavamiWestExit && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Return to Vittala Temple (Stage 3)</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Vittala Temple
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 4 SCENE 2: PUSHKARANI CLOSING REFLECTION HOTSPOTS --- */}
        {scene === "closing_reflection" && (
          <>
            {/* Keeper of Memory Elder NPC (x: 35%, y: 68%) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "35%", top: "68%" }}
            >
              {isNearPushkaraniKeeper && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>
                    {isCampaignComplete
                      ? "Speak with Keeper of Memory"
                      : "Closing Reflection & Receive Final Keepsake"}
                  </span>
                </div>
              )}
              <div className="w-12 h-14 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <GameIcon name="keeper" size={24} className="text-[#d4a359]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Keeper of Memory
              </span>
            </div>

            {/* Return Path to Mahanavami Dibba */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "75%", top: "80%" }}
            >
              {isNearPushkaraniReturn && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Return to Mahanavami Dibba</span>
                </div>
              )}
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Mahanavami Platform
              </span>
            </div>
          </>
        )}

        {/* --- 2.5D PLAYER SPRITE --- */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${playerPos.x}%`,
            top: `${playerPos.y}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div
            className="flex flex-col items-center transition-transform duration-75"
            style={{
              transformOrigin: "bottom center",
              transform: `scale(${depthScale}) rotate(${walkSway}deg) translateY(${walkBob}px)`,
            }}
          >
            <img
              src="/player.png"
              alt="Player Character"
              className="w-12 h-16 object-contain object-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)]"
              style={{
                transform: facingLeft ? "scaleX(-1)" : "scaleX(1)",
                imageRendering: "pixelated",
              }}
            />
          </div>
        </div>

        {/* --- JOLLY BHAI (GENIE) COMPANION FOLLOWER --- */}
        {(() => {
          let genieX = facingLeft ? playerPos.x + 8.5 : playerPos.x - 8.5;
          let genieY = playerPos.y - 12.0;

          // Mode 1: ✨ Glowing (Only for major hidden secrets when nearby)
          const isGlowing = (scene === "toymaker_stall" && !hasFirstLedgerFragment) ||
                            (scene === "musical_pillars" && !isMusicalPillarsComplete);

          // Move the Genie specifically to the hidden secret location to point it out clearly!
          if (isGlowing) {
            if (scene === "toymaker_stall") {
              genieX = 62.0;
              genieY = 58.0; // Directly above Master Kallappa and the toys
            } else if (scene === "musical_pillars") {
              genieX = 50.0;
              genieY = 55.0; // Center of musical pillars
            }
          }

          // Mode 2: 💥 Clue Alert (Stops once clue is heard or solved)
          const hasHeardThisClue = heardClueScenes.includes(scene);
          const isShaking = !isGlowing && !hasHeardThisClue && (
            (scene === "anegundi_river_crossing" && !hasMetVidyaranya) ||
            (scene === "gem_traders_row" && !hasEncounteredFirstRumor && isNearGemAssessor) ||
            (scene === "musicians_warning" && !hasMusicianWarning) ||
            (scene === "mahanavami_celebration" && !isLedgerAssembled)
          );

          const mode = isGlowing ? "glowing" : isShaking ? "shaking" : "normal";

          return (
            <div
              className="absolute z-20 pointer-events-auto cursor-pointer group transition-all duration-700 ease-out"
              onClick={() => {
                let speechText = "";
                let customOptions: Array<{ id: number; text: string }> = [];

                if (scene === "anegundi_river_crossing") {
                  speechText = "Welcome, friend! I am Jolly Bhai. Before grand Hampi, there was Anegundi beside the Tungabhadra River. Find Sage Vidyaranya at the Old Fort to discover how it all began!";
                  customOptions = [
                    { id: 1, text: "Who was Sage Vidyaranya?" },
                    { id: 2, text: "How was the empire founded?" },
                    { id: 3, text: "How do we cross the river?" }
                  ];
                } else if (scene === "anegundi_old_fort") {
                  speechText = "Sage Vidyaranya holds ancient wisdom. Ask him about founding Vijayanagara, and play a match of Chowka Bara!";
                  customOptions = [
                    { id: 1, text: "What is Chowka Bara?" },
                    { id: 2, text: "Who were Harihara and Bukka?" }
                  ];
                } else if (scene === "gem_traders_row") {
                  speechText = "Welcome to Hampi Bazaar! The gem merchants are whispering about a missing royal scribe who hid secret ledgers.";
                  customOptions = [
                    { id: 1, text: "Why were gems sold on the street?" },
                    { id: 2, text: "Where is the missing merchant?" }
                  ];
                } else if (scene === "toymaker_stall") {
                  speechText = hasFirstLedgerFragment
                    ? "You found the first ledger fragment! The merchant hid key records inside these wooden toys."
                    : "Check these wooden Channapatna toys closely! The missing merchant hid a secret clue inside one of them.";
                  customOptions = [
                    { id: 1, text: "How are Channapatna toys made?" },
                    { id: 2, text: "What does the first fragment say?" }
                  ];
                } else if (scene === "stone_chariot_entry" || scene === "musical_pillars") {
                  speechText = isMusicalPillarsComplete
                    ? "Great job! The musical pillars sang their notes and revealed the second fragment. We are close to the truth!"
                    : "This is the Stone Chariot of Vittala Temple from Emperor Krishnadevaraya's golden age. The musical pillars hold your next clue!";
                  customOptions = [
                    { id: 1, text: "How do musical pillars work?" },
                    { id: 2, text: "Who was Krishnadevaraya?" }
                  ];
                } else if (scene === "hazara_rama_walls") {
                  speechText = "Look at the stone carvings on these walls! They tell stories from the Ramayana epic in beautiful detail.";
                  customOptions = [
                    { id: 1, text: "Why was this temple special?" },
                    { id: 2, text: "What do the carvings show?" }
                  ];
                } else if (scene === "musicians_warning") {
                  speechText = "The royal musicians warn of gathering armies. Head to Mahanavami Dibba where the fate of the empire awaits.";
                  customOptions = [
                    { id: 1, text: "Why is danger coming?" },
                    { id: 2, text: "What is Mahanavami Dibba?" }
                  ];
                } else if (scene === "mahanavami_celebration") {
                  speechText = isLedgerAssembled
                    ? "The truth is revealed! Merchant Ramayya hid these records so Vijayanagara's memory and culture would never be lost."
                    : "This is the grand Mahanavami platform. Here the King inspected troops, artists, and guests during the sacred festival!";
                  customOptions = [
                    { id: 1, text: "What was the festival like?" },
                    { id: 2, text: "What was the merchant protecting?" }
                  ];
                } else if (scene === "closing_reflection") {
                  speechText = "Empires rise and fall, but the art, music, and spirit of Vijayanagara live forever. Thank you for walking this journey with me!";
                  customOptions = [
                    { id: 1, text: "What is Vijayanagara's legacy?" },
                    { id: 2, text: "What can we see in Hampi today?" }
                  ];
                } else {
                  speechText = "Hello, traveler! I am Jolly Bhai. Ask me anything about Vijayanagara, Hampi, and its glorious history!";
                  customOptions = [
                    { id: 1, text: "Tell me about Vijayanagara art." },
                    { id: 2, text: "Who were the great rulers?" }
                  ];
                }

                setJollySpeechText(speechText);
                setJollyOptions(customOptions);
                if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
                setJollyDialogueScene(scene);
                setShowJollyDialogue(true);
                if (isShaking) {
                  setHeardClueScenes((prev) => [...prev, scene]);
                }
                stopAllCharacterVoice();
                playCharacterDialogue({
                  character: "jolly",
                  text: speechText,
                  onEnd: () => {
                    setHeardClueScenes((prev) => [...prev, scene]);
                  }
                });
                if (!hasTalkedToJolly) {
                  setHasTalkedToJolly(true);
                }
              }}
              style={{
                left: `${genieX}%`,
                top: `${genieY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title={
                mode === "glowing"
                  ? "✨ Jolly Bhai (Special Story Secret)"
                  : mode === "shaking"
                  ? "💥 Jolly Bhai (Clue Nearby!)"
                  : "🧞 Jolly Bhai (Genie Guide - Click for Story)"
              }
            >
              <div className={`relative ${mode === "shaking" ? "animate-crazy-shake" : mode === "glowing" ? "animate-celestial-glow" : "animate-bounce"}`} style={mode === "normal" && !showJollyDialogue ? { animationDuration: '3.5s' } : undefined}>
                <img
                  src="/genie_rajasthani_transparent.png"
                  alt="Jolly Bhai Genie"
                  className={`w-24 h-24 md:w-28 md:h-28 object-contain transition-all group-hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${
                    mode === "glowing" ? "filter drop-shadow-[0_0_25px_rgba(251,191,36,1)] brightness-125" : ""
                  }`}
                  style={{
                    imageRendering: "pixelated",
                    transform: facingLeft ? "scaleX(1)" : "scaleX(-1)",
                  }}
                />
                
                {!showJollyDialogue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 border-2 border-black rounded-full px-2.5 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[9.5px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[#fff9ea] text-black flex items-center gap-1 pointer-events-none">
                    {mode === "glowing" && <span>✨ Secret Lore</span>}
                    {mode === "shaking" && <span>💥 Clue Alert!</span>}
                    {mode === "normal" && <span>Ask Jolly Bhai 🧞</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* --- OPENING ATMOSPHERE FLOATING BANNERS --- */}
        {showOpeningAtmosphere && scene === "anegundi_river_crossing" && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 bg-[#1a1714]/95 border-2 border-[#d4a359] px-6 py-3 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.85)] max-w-lg text-center animate-fadeIn">
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.25em] mb-1">
              Anegundi • 1336 AD
            </div>
            <p className="text-sm font-serif text-[#eedfc8] italic leading-relaxed">
              &ldquo;Before there was a Hampi, there was Anegundi. This is where the story starts.&rdquo;
            </p>
            <div className="mt-2 text-[10px] font-mono text-[#a89985]">
              Press <span className="text-[#d4a359] font-bold">[W A S D]</span> to begin walking along the riverbank
            </div>
          </div>
        )}

        {showStage2OpeningBanner && scene === "hampi_bazaar_entry" && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 bg-[#1a1714]/95 border-2 border-[#d4a359] px-6 py-3 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.85)] max-w-lg text-center animate-fadeIn">
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.25em] mb-1">
              Hampi Bazaar • c. 1520 AD
            </div>
            <p className="text-sm font-serif text-[#eedfc8] italic leading-relaxed">
              &ldquo;This is what the brothers&apos; small kingdom became — a city richer than most in the world.&rdquo;
            </p>
            <div className="mt-2 text-[10px] font-mono text-[#a89985]">
              Explore the covered colonnade and inquire about the missing merchant.
            </div>
          </div>
        )}

        {showStage3OpeningBanner && scene === "stone_chariot_entry" && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 bg-[#1a1714]/95 border-2 border-[#d4a359] px-6 py-3 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.85)] max-w-lg text-center animate-fadeIn">
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.25em] mb-1">
              Vittala Temple • c. 1540 AD
            </div>
            <p className="text-sm font-serif text-[#eedfc8] italic leading-relaxed">
              &ldquo;Under this king, the empire didn&apos;t just grow strong — it grew beautiful.&rdquo;
            </p>
            <div className="mt-2 text-[10px] font-mono text-[#a89985]">
              Speak with Maestoso Raghavendra and approach the musical pillars.
            </div>
          </div>
        )}

        {showStage4OpeningBanner && scene === "mahanavami_celebration" && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 bg-[#1a1714]/95 border-2 border-[#d4a359] px-6 py-3 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.85)] max-w-lg text-center animate-fadeIn">
            <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.25em] mb-1">
              Mahanavami Dibba • 1565 AD
            </div>
            <p className="text-sm font-serif text-[#eedfc8] italic leading-relaxed">
              &ldquo;The high platform where emperors observed the 9-day spectacle of power, festival, and memory.&rdquo;
            </p>
            <div className="mt-2 text-[10px] font-mono text-[#a89985]">
              Ascend the stepped tiers to reconstruct the ancient festival memory.
            </div>
          </div>
        )}

        {/* --- HUD OVERLAY --- */}
        <VijayanagaraHUD
          stage={stage}
          scene={scene}
          objective={
            isCampaignComplete
              ? "Campaign Complete: Vijayanagara Legacy Preserved across stone and memory."
              : isStage3Complete && stage === 3
              ? "Stage 3 Complete! Follow the road to Mahanavami Dibba (Stage 4)."
              : isStage2Complete && stage === 2
              ? "Stage 2 Complete! Travel along the Procession Road to Vittala Temple (Stage 3)."
              : isStage1Complete && stage === 1
              ? "Stage 1 Complete! Board the coracle ferry to cross into Hampi Bazaar (Stage 2)."
              : currentSceneConfig.defaultObjective
          }
          fragmentsCollectedCount={collectedFragments.length}
          unlockedJournalCount={unlockedJournalEntries.length}
          onOpenJournal={() => setIsJournalOpen(true)}
          onResetCampaign={handleResetCampaign}
          isTransitioning={isTransitioning}
        />

        {/* --- JOURNAL MODAL --- */}
        <JournalModal
          isOpen={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
          unlockedEntryIds={unlockedJournalEntries}
          collectedFragmentIds={collectedFragments}
        />

        {/* --- REGIONAL JOURNEY TRANSITION MODAL --- */}
        <TransitionModal
          isActive={isTransitioning}
          progress={transitionProgress}
          title={transitionTitle}
          description={transitionDesc}
          travelType={travelType}
        />

        {/* --- CHOWKA BARA MINIGAME MODAL --- */}
        <ChowkaBaraGame
          isOpen={showChowkaBaraModal}
          onClose={() => setShowChowkaBaraModal(false)}
          attempts={chowkaBaraAttempts}
          onComplete={handleChowkaBaraComplete}
        />

        {/* --- TOY INSPECTION PUZZLE MODAL --- */}
        <ToyInspectionPuzzle
          isOpen={showToyInspectionModal}
          onClose={() => setShowToyInspectionModal(false)}
          alreadyFoundFragment={hasFirstLedgerFragment}
          onDiscoverFragment={handleToyFragmentDiscovery}
          onSelectJournalToy={handleSelectJournalToy}
          hasJournalToy={hasJournalToy}
        />

        {/* --- MUSICAL PILLARS PUZZLE MODAL --- */}
        <MusicalPillarsPuzzle
          isOpen={showMusicalPillarsModal}
          onClose={() => setShowMusicalPillarsModal(false)}
          alreadyFoundFragment={hasSecondLedgerFragment}
          onDiscoverFragment={handleMusicalPillarsDiscovery}
        />

        {/* --- FESTIVAL RECONSTRUCTION PUZZLE MODAL --- */}
        <FestivalReconstructionPuzzle
          isOpen={showFestivalPuzzleModal}
          onClose={() => setShowFestivalPuzzleModal(false)}
          alreadyRestored={isFestivalSceneRestored}
          onComplete={handleFestivalReconstructionComplete}
        />

        {/* --- MASTER LEDGER ASSEMBLY MODAL --- */}
        <LedgerAssemblyModal
          isOpen={showLedgerAssemblyModal}
          onClose={() => setShowLedgerAssemblyModal(false)}
          onProceedToNarration={() => setShowTalikotaModal(true)}
        />

        {/* --- BATTLE OF TALIKOTA NARRATION MODAL --- */}
        <TalikotaNarrationModal
          isOpen={showTalikotaModal}
          onClose={() => setShowTalikotaModal(false)}
          onProceedToReflection={() => {
            setShowTalikotaModal(false);
            setHasTalikotaNarrationViewed(true);
            if (!unlockedJournalEntries.includes("battle_of_talikota")) {
              setUnlockedJournalEntries((prev) => [...prev, "battle_of_talikota"]);
            }
            triggerTransition(
              "closing_reflection",
              { x: 35.0, y: 70.0 },
              "Walking to Pushkarani Stepped Tank",
              "Descending the stone steps to the quiet waters of the royal stepped tank under sunset.",
              "temple_walk"
            );
          }}
        />

        {/* --- KEEPER OF MEMORY CLOSING DIALOGUE MODAL --- */}
        {showKeeperDialogue && scene === "closing_reflection" && (
          <DialoguePanel
            sceneId="closing_reflection"
            currentSceneId={scene}
            characterName="Keeper of Memory"
            characterTitle="Guardian of Pushkarani Traditions • Hampi"
            characterId="keeper"
            historicalContext={{
              current_year: 1565,
              era: "Vijayanagara Empire",
              location: "Lotus Mahal",
              ruler: "Aliya Rama Raya (Regent)",
              nearby_monuments: "Pushkarani Stepped Tank",
              historical_events: "Gathering of historical records"
            }}
            dialogueText="You have walked the full path of our ancestors, traveler. You began at Anegundi, explored the gem bazaar, unlocked the musical pillars, and stood atop Mahanavami Dibba. Merchant Ramayya was right: Gold may fade, but knowledge, art, and stories survive forever. You are now a Master Chronicler of Vijayanagara."
            isSpeaking={true}
            options={[
              { id: 1, text: "Accept Gandaberunda Seal ✦" }
            ]}
            onOptionSelect={() => {
              if (typeof soundFx.playSelect === "function") soundFx.playSelect();
              handleCompleteCampaignFinale();
            }}
            onClose={() => setShowKeeperDialogue(false)}
          />
        )}

        {/* --- CAMPAIGN COMPLETION FINAL KEEPSAKE MODAL --- */}
        <CampaignCompletionModal
          isOpen={showCampaignCompletionModal}
          onClose={() => {
            stopAllCharacterVoice();
            setShowCampaignCompletionModal(false);
          }}
          onOpenJournal={() => setIsJournalOpen(true)}
        />

        {/* --- HAZARA RAMA BAS-RELIEF MODAL --- */}
        {showHazaraRamaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#5a4d3f] p-6 shadow-[0_0_50px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#5a4d3f] mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#2e261f] border-2 border-[#d4a359] flex items-center justify-center shadow-inner">
                    <GameIcon name="archery" size={26} className="text-[#d4a359]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-widest">
                      Royal Enclosure • Stone Narrative Carvings (c. 1540 AD)
                    </div>
                    <h3 className="text-xl font-serif font-bold text-[#f6ede0]">
                      Hazara Rama Temple Wall Friezes
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    stopAllCharacterVoice();
                    setShowHazaraRamaModal(false);
                  }}
                  className="text-[#a89985] hover:text-[#f6ede0] text-sm bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#26201b] border border-[#473d32] text-sm font-serif leading-relaxed text-[#eedfc8] mb-5 space-y-2">
                <p className="font-semibold text-[#d4a359]">
                  Continuous Epic Stone Chronicle
                </p>
                <p className="text-xs text-[#d6c7b2]">
                  The outer walls of Hazara Rama Temple present thousands of stone friezes. Lower rows depict royal elephants and dancers, while upper panels narrate the entire Ramayana epic.
                </p>
                <p className="text-xs text-[#eedfc8] italic">
                  &ldquo;A king&apos;s valor may conquer lands, but devotion and righteous rule outlive all conquerors.&rdquo;
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#383027]">
                <div className="text-[10px] font-mono text-[#d4a359]">
                  ✦ Hazara Rama Inscription added to Palm-Leaf Journal
                </div>
                <button
                  onClick={() => {
                    stopAllCharacterVoice();
                    setShowHazaraRamaModal(false);
                  }}
                  className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif px-6 py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Return to Courtyard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TEMPLE MUSICIAN RAGHAVENDRA DIALOGUE MODAL --- */}
        {showRaghavendraDialogue && scene === "musical_pillars" && (
          <DialoguePanel
            sceneId="musical_pillars"
            currentSceneId={scene}
            characterName="Maestoso Raghavendra"
            characterTitle="Royal Court Musician & Scholar • Vittala Temple (c. 1540 AD)"
            characterId="raghavendra"
            historicalContext={{
              current_year: 1540,
              era: "Vijayanagara Empire",
              location: "Vittala Temple",
              ruler: "Emperor Achyuta Deva Raya",
              nearby_monuments: "Stone Chariot",
              historical_events: "Performance at the Ranga Mandapa"
            }}
            dialogueText={
              raghavendraTopic === "king" 
                ? "Krishnadevaraya led our empire to its golden age. He was a brave leader, a fine poet, and a great patron of scholars and artists."
                : raghavendraTopic === "chariot"
                ? "This Garuda shrine is carved from granite with turning stone wheels. Travelers from all lands marvel at its beauty."
                : raghavendraTopic === "pillars"
                ? "Each pillar cluster in the Ranga Mandapa is carved from solid stone. When tapped gently, they ring out musical notes. Test them yourself!"
                : "You have found the second ledger fragment. Ramayya hid the final part at Mahanavami Dibba. Danger approaches our borders in 1565. Your mission is to protect the memory and culture of our people."
            }
            isSpeaking={true}
            options={[
              { id: "king", text: "The King" },
              { id: "chariot", text: "Stone Chariot" },
              { id: "pillars", text: "Musical Pillars" },
              { id: "warning", text: "Musician's Warning" },
              { id: "close", text: hasSecondLedgerFragment && raghavendraTopic === "warning" ? "Accept Warning & Continue" : "Thank Raghavendra" }
            ]}
            onOptionSelect={(opt) => {
              if (typeof soundFx.playSelect === "function") soundFx.playSelect();
              if (opt.id === "close") {
                setShowRaghavendraDialogue(false);
                if (raghavendraTopic === "warning" && hasSecondLedgerFragment) {
                  setIsStage3Complete(true);
                  setShowStage3VictoryModal(true);
                }
              } else {
                setRaghavendraTopic(opt.id as any);
                if (opt.id === "warning") {
                  setHasMusicianWarning(true);
                  if (hasSecondLedgerFragment) {
                    setIsStage3Complete(true);
                  }
                }
              }
            }}
            onClose={() => setShowRaghavendraDialogue(false)}
          />
        )}

        {showVidyaranyaDialogue && (scene === "anegundi_river_crossing" || scene === "anegundi_old_fort") && (
          <DialoguePanel
            sceneId={scene}
            currentSceneId={scene}
            characterName="Sage Vidyaranya"
            characterTitle="Spiritual Guide & Scholar • Sringeri Tradition (1336 AD)"
            characterId="vidyaranya"
            historicalContext={{
              current_year: 1336,
              era: "Vijayanagara Empire",
              location: "Anegundi / Hampi",
              ruler: "Harihara & Bukka",
              nearby_monuments: "Tungabhadra River",
              historical_events: "Founding of the Empire"
            }}
            dialogueText={
              dialogueTopic === "intro"
                ? "Welcome to Anegundi. This town stands beside the Tungabhadra River. It is an important place in Vijayanagara's history. Before you travel south, let us talk. A great empire will soon rise across the river. I can also teach you a game called Chowka Bara."
                : dialogueTopic === "founders"
                ? "Harihara and Bukka founded Vijayanagara in 1336. The two brothers wanted to protect our culture, arts, and trade. They built a strong and united kingdom."
                : dialogueTopic === "region"
                ? "These huge granite rocks and the river protect us like a natural fort. Enemy armies cannot enter easily. The river valley also gives good soil and water."
                : "Kings and armies pass away, but knowledge and culture last forever. I guided the founders to build temples, support learning, and protect justice."
            }
            isSpeaking={true}
            options={[
              { id: "founders", text: "Who founded it?" },
              { id: "region", text: "Why are these rocks important?" },
              { id: "vidyaranya", text: "What did Vidyaranya believe?" },
              { id: "play", text: isStage1Complete ? "Replay Chowka Bara Match ✦" : "Play Chowka Bara Match ✦" },
              { id: "close", text: "Close" }
            ]}
            onOptionSelect={(opt) => {
              if (typeof soundFx.playSelect === "function") soundFx.playSelect();
              if (opt.id === "close") {
                setIsVidyaranyaVoiceActive(false);
                setShowVidyaranyaDialogue(false);
              } else if (opt.id === "play") {
                setIsVidyaranyaVoiceActive(false);
                setShowVidyaranyaDialogue(false);
                setShowChowkaBaraModal(true);
              } else {
                setDialogueTopic(opt.id as any);
              }
            }}
            onClose={() => {
              setIsVidyaranyaVoiceActive(false);
              setShowVidyaranyaDialogue(false);
            }}
          />
        )}

        {/* --- MASTER GEM ASSESSOR DIALOGUE MODAL (IMAGE 2 DESIGN) --- */}
        {showGemAssessorDialogue && (scene === "gem_traders_row" || scene === "hampi_bazaar_entry") && (
          <DialoguePanel
            sceneId={scene}
            currentSceneId={scene}
            characterName="Setti Somappa"
            characterTitle="ROYAL MERCHANT GUILD ASSESSOR"
            characterId="somappa"
            historicalContext={{
              current_year: 1520,
              era: "Vijayanagara Empire",
              location: "Hampi Bazaar",
              ruler: "Emperor Krishnadevaraya",
              nearby_monuments: "Virupaksha Temple, Matanga Hill",
              historical_events: "Flourishing international gem trade"
            }}
            dialogueText={
              gemDialogueTopic === "gems"
                ? "Welcome, traveler! Nowhere under heaven will you behold wealth like ours. We measure diamonds from Kollur, pearls from the Persian Gulf, and Ceylon rubies by the dry measure like sesame seeds! Ask me what you wish of our commerce, or of the strange rumors stirring our market colonnades."
                : gemDialogueTopic === "rumor"
                ? "Ramayya the Scribe-Merchant managed royal accounts. He feared our records might be lost one day, so he hid three ledger fragments. He left the first clue with his friend Master Kallappa, the toymaker."
                : "Ramayya believed gold and stone fade over time, but written records and culture last forever. Inspect Kallappa's wooden toys to learn more."
            }
            isSpeaking={true}
            options={[
              { id: 1, text: "Precious Gem Trade" },
              { id: 2, text: "The Missing Merchant (Rumor)" },
              { id: 3, text: "Why Hide the Ledger?" }
            ]}
            onOptionSelect={(opt) => {
              if (opt.id === 1) setGemDialogueTopic("gems");
              if (opt.id === 2) {
                setGemDialogueTopic("rumor");
                setHasEncounteredFirstRumor(true);
              }
              if (opt.id === 3) {
                setGemDialogueTopic("merchant");
                setHasEncounteredFirstRumor(true);
              }
            }}
            onClose={() => setShowGemAssessorDialogue(false)}
          />
        )}

        {/* --- MASTER TOYMAKER DIALOGUE MODAL (IMAGE 2 DESIGN) --- */}
        {showToymakerDialogue && scene === "toymaker_stall" && (
          <DialoguePanel
            sceneId="toymaker_stall"
            currentSceneId={scene}
            characterName="Master Kallappa"
            characterTitle="KINHAL CRAFT GUILD ARTISAN"
            characterId="kallappa"
            historicalContext={{
              current_year: 1520,
              era: "Vijayanagara Empire",
              location: "Hampi Bazaar",
              ruler: "Emperor Krishnadevaraya",
              nearby_monuments: "Virupaksha Temple",
              historical_events: "Flourishing woodcraft and artisan guilds"
            }}
            dialogueText="Namaskara! Every toy on these shelves is hand-carved from seasoned wood and coated with natural mineral lacquer from Kinhal. You ask of Merchant Ramayya? Yes, he was my dearest childhood friend. Shortly before he vanished, he spent hours in my workshop, admiring these very pieces and carving intricate marks into their bases. He told me: A child sees play, but a discerning seeker will discover memory. Feel free to inspect them closely upon my workbench!"
            isSpeaking={true}
            options={[
              { id: 1, text: "Inspect Handcrafted Toys" },
              { id: 2, text: "Thank you, Master Kallappa" }
            ]}
            onOptionSelect={(opt) => {
              if (opt.id === 1) {
                setShowToymakerDialogue(false);
                setShowToyInspectionModal(true);
              }
              if (opt.id === 2) {
                setShowToymakerDialogue(false);
              }
            }}
            onClose={() => setShowToymakerDialogue(false)}
          />
        )}

        {/* --- FOREIGN TRAVELER DIALOGUE MODAL (OPTIONAL) --- */}
        {showForeignTravelerDialogue && scene === "hampi_bazaar_entry" && (
          <DialoguePanel
            sceneId="hampi_bazaar_entry"
            currentSceneId={scene}
            characterName="Senhor Duarte"
            characterTitle="Overseas Chronicler & Emissary"
            characterId="duarte"
            historicalContext={{
              current_year: 1520,
              era: "Kingdom of Portugal",
              location: "Hampi Bazaar",
              ruler: "Emperor Krishnadevaraya",
              nearby_monuments: "Virupaksha Temple",
              historical_events: "Portuguese horse trade with Vijayanagara"
            }}
            dialogueText="Bom dia, senhor! In all my voyages across Venice, Cairo, and Lisbon, I have never seen a city of such boundless prosperity. Portugal trades war horses with Vijayanagara for fine silks and spices. Royal scribes keep detailed records of every trade. I heard an elder merchant hid secret scrolls within artisan wares across the city to protect historical knowledge."
            isSpeaking={true}
            options={[
              { id: 1, text: "Farewell, Duarte" }
            ]}
            onOptionSelect={() => {
              if (typeof soundFx.playSelect === "function") soundFx.playSelect();
              setShowForeignTravelerDialogue(false);
            }}
            onClose={() => setShowForeignTravelerDialogue(false)}
          />
        )}

        {/* --- VIDYARANYA BLESSING CUTSCENE MODAL --- */}
        {showBlessingCutscene && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#d4a359] p-8 shadow-[0_0_60px_rgba(212,163,89,0.5)] text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#3d3328] to-[#141210] border-2 border-[#d4a359] flex items-center justify-center shadow-[0_0_30px_rgba(212,163,89,0.4)] animate-pulse">
                <GameIcon name="sage" size={36} className="text-[#d4a359]" />
              </div>

              <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#d4a359] mb-2">
                Sacred Blessing Bestowed
              </div>

              <h2 className="text-2xl font-serif font-bold text-[#f6ede0] mb-4">
                Vidyaranya&apos;s Benediction
              </h2>

              <div className="p-4 rounded-xl bg-[#26201b] border border-[#473d32] text-sm font-serif italic text-[#eedfc8] leading-relaxed mb-6">
                &ldquo;A kingdom begins with enduring purpose, not just stone walls. You have shown patience and balance. Across the river lies Hampi, where our journey continues.&rdquo;
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    stopAllCharacterVoice();
                    setShowBlessingCutscene(false);
                    setShowStage1VictoryModal(true);
                  }}
                  className="bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-8 py-3 rounded-xl shadow-lg transition-all cursor-pointer text-xs uppercase tracking-wider"
                >
                  Accept Blessing & Complete Stage 1 ✦
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STAGE 1 COMPLETION VICTORY MODAL --- */}
        {showStage1VictoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#5a4d3f] p-8 shadow-[0_0_50px_rgba(0,0,0,0.95)] text-center">
              <div className="text-4xl mb-3">🏛️</div>
              <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.3em] mb-1">
                Historical Milestone Achieved
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#f6ede0] mb-2">
                Stage 1 Complete: Anegundi
              </h2>
              <p className="text-xs font-mono text-[#a89985] mb-6">
                Where It All Began • 1336 AD • +500 Historic XP
              </p>

              <div className="p-4 rounded-xl bg-[#231e1a] border border-[#3d3329] text-xs font-serif text-[#d6c7b2] leading-relaxed mb-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Discovered the Cradle of the Empire at Anegundi</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Received Sage Vidyaranya&apos;s Founding Guidance</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Mastered the Traditional Karnataka Chowka Bara Grid</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Unlocked 4 Palm-Leaf Journal Inscriptions</span>
                </div>
              </div>

              {/* Rowing Tool Reward — awarded on Chowka Bara win, required by Oracle Ferry */}
              <div className="flex items-center gap-3 px-4 py-2.5 mb-6 rounded-xl bg-[#1a2e20] border border-[#2e6b40] text-left">
                <span className="text-2xl">🐚</span>
                <div>
                  <div className="text-[10px] font-mono text-[#6ee7a0] uppercase tracking-widest mb-0.5">Item Acquired</div>
                  <div className="text-sm font-serif font-bold text-[#a3f0c0]">Rowing Tool — Cowrie Shell</div>
                  <div className="text-[10px] font-serif text-[#6ee7a0] opacity-80">Required to row the boat to Hampi Market</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    // Guard against double-click — triggerTransition has its own re-entrancy
                    // guard (isTransitioning) but we also close the modal first
                    if (isTransitioning) return;
                    stopAllCharacterVoice();
                    setShowStage1VictoryModal(false);
                    triggerTransition(
                      "hampi_bazaar_entry",
                      { x: 35.0, y: 80.0 },
                      "Crossing Tungabhadra to Hampi Bazaar (Stage 2)",
                      "Skimming across the swirling river rapids as the morning mist parts to reveal the grand Car Street of Virupaksha.",
                      "coracle"
                    );
                    setStage(2);
                    if (!unlockedJournalEntries.includes("hampi_bazaar_trade")) {
                      setUnlockedJournalEntries((prev) => [...prev, "hampi_bazaar_trade"]);
                    }
                  }}
                  disabled={isTransitioning}
                  className="bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] disabled:opacity-60 disabled:cursor-not-allowed text-[#141210] font-serif font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer"
                >
                  {isTransitioning ? "Crossing..." : "🛶 Cross to Hampi Bazaar (Stage 2)"}
                </button>
                <Link
                  href="/dashboard"
                  className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center"
                >
                  🏰 Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* --- STAGE 2 COMPLETION VICTORY MODAL --- */}
        {showStage2VictoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#d4a359] p-8 shadow-[0_0_60px_rgba(212,163,89,0.4)] text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#3d3328] border-2 border-[#d4a359] flex items-center justify-center text-3xl shadow-inner">
                📜
              </div>
              <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.3em] mb-1">
                Mystery Chapter I Unlocked
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#f6ede0] mb-2">
                Stage 2 Complete: Hampi Bazaar
              </h2>
              <p className="text-xs font-mono text-[#a89985] mb-6">
                The Missing Merchant&apos;s Ledger • c. 1520 AD • +600 Historic XP
              </p>

              <div className="p-4 rounded-xl bg-[#231e1a] border border-[#3d3329] text-xs font-serif text-[#d6c7b2] leading-relaxed mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Uncovered the Rumor of Merchant Ramayya&apos;s Secret Ledger</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Inspected Master Kallappa&apos;s Kinhal Handcrafted Toys</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Discovered Ledger Fragment I: The Scribe&apos;s Seal (1/3)</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Clue points toward the sacred Stone Chariot of Vittala Temple</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowStage2VictoryModal(false);
                    triggerTransition(
                      "stone_chariot_entry",
                      { x: 35.0, y: 78.0 },
                      "Royal Car Street Procession to Vittala Temple (Stage 3)",
                      "Journeying along the grand paved ceremonial pathway toward the architectural masterpiece of the Golden Age.",
                      "stone_road"
                    );
                    setStage(3);
                    if (!unlockedJournalEntries.includes("stone_chariot_garuda")) {
                      setUnlockedJournalEntries((prev) => [...prev, "stone_chariot_garuda"]);
                    }
                  }}
                  className="bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer"
                >
                  🏛️ Advance to Stage 3: Vittala Temple
                </button>
                <button
                  onClick={() => {
                    setShowStage2VictoryModal(false);
                    setIsJournalOpen(true);
                  }}
                  className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#d4a359] text-[#f6ede0] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  🪶 Inspect Journal
                </button>
                <Link
                  href="/dashboard"
                  className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center"
                >
                  🏰 Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* --- STAGE 3 COMPLETION VICTORY MODAL --- */}
        {showStage3VictoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-xl bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#d4a359] p-8 shadow-[0_0_60px_rgba(212,163,89,0.5)] text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#3d3328] border-2 border-[#d4a359] flex items-center justify-center text-3xl shadow-inner">
                🎵
              </div>
              <div className="text-[10px] font-mono text-[#d4a359] uppercase tracking-[0.3em] mb-1">
                Golden Age Milestone Achieved
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#f6ede0] mb-2">
                Stage 3 Complete: Vittala Temple
              </h2>
              <p className="text-xs font-mono text-[#a89985] mb-6">
                The Zenith of Art, Architecture & Harmony • c. 1540 AD • +750 Historic XP
              </p>

              <div className="p-4 rounded-xl bg-[#231e1a] border border-[#3d3329] text-xs font-serif text-[#d6c7b2] leading-relaxed mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Encountered the Iconic Monolithic Stone Chariot (Garuda Shrine)</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Mastered the 56 Resonant Sa-Re-Ga-Ma Musical Pillars</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Discovered Ledger Fragment II: Guild Account Notebook (2/3)</span>
                </div>
                <div className="flex items-center gap-2 text-[#d4a359] font-bold">
                  <span>✦</span>
                  <span>Received the Musician&apos;s Solemn Warning of Approaching Shadows</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowStage3VictoryModal(false);
                    triggerTransition(
                      "mahanavami_celebration",
                      { x: 50.0, y: 80.0 },
                      "Approaching Mahanavami Dibba (Stage 4)",
                      "Ascending toward the multi-tiered royal ceremonial platform as evening shadows stretch across the granite landscape.",
                      "stone_road"
                    );
                    setStage(4);
                    if (!unlockedJournalEntries.includes("mahanavami_dibba_platform")) {
                      setUnlockedJournalEntries((prev) => [...prev, "mahanavami_dibba_platform"]);
                    }
                  }}
                  className="bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer"
                >
                  🏛️ Advance to Stage 4: Mahanavami Dibba
                </button>
                <button
                  onClick={() => {
                    setShowStage3VictoryModal(false);
                    setIsJournalOpen(true);
                  }}
                  className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#d4a359] text-[#f6ede0] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  🪶 Inspect Journal
                </button>
                <Link
                  href="/dashboard"
                  className="bg-[#2b2520] hover:bg-[#3d3329] border border-[#5a4d3f] text-[#f6ede0] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center"
                >
                  🏰 Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* --- STAGE 3 COUNTDOWN TIMER UI --- */}
        {stage3Countdown !== null && stage3Countdown > 0 && stage === 3 && (
          <div className="absolute top-20 right-6 bg-black/80 border-2 border-red-500 rounded-lg px-4 py-2 flex items-center gap-2 z-40 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <span className="text-xl">⏳</span>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider">Guards Patrol</span>
              <span className="text-xl font-mono text-white font-bold leading-none">
                {Math.floor(stage3Countdown / 60)}:{(stage3Countdown % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* --- CAUGHT BY GUARDS MODAL --- */}
        {showCaughtByGuardsModal && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 pointer-events-auto">
            <div className="bg-[#1a0f0f] border-2 border-red-700 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.5)]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-700">
                  <span className="text-3xl">⚔️</span>
                </div>
                <h3 className="text-2xl font-black text-red-500 mb-2">CAUGHT BY PATROL</h3>
                <p className="text-sm text-red-200/80 leading-relaxed">
                  You took too long to find the ledger fragment. The royal guards have discovered you trespassing in the sacred courtyard!
                </p>
              </div>
              <button
                onClick={() => {
                  soundFx.playKeyboardClick();
                  setShowCaughtByGuardsModal(false);
                  setStage3Countdown(120);
                  setPlayerPos({ x: 35.0, y: 70.0 });
                }}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-lg border-2 border-red-900 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* --- CORACLE FERRY INSPECTION MODAL (STAGE 1 LOCKED STATE) --- */}
        {showCoracleNotice && scene === "anegundi_river_crossing" && (
          <DialoguePanel
            sceneId="anegundi_river_crossing"
            currentSceneId={scene}
            characterName="Oracle Ferry"
            characterTitle="Travel Requirement"
            dialogueText="You need the shell to row the boat to the Hampi Market."
            isSpeaking={false}
            showInput={false}
            onClose={() => setShowCoracleNotice(false)}
          />
        )}

        {/* --- JOLLY BHAI DIALOGUE MODAL --- */}
        {showJollyDialogue && jollyDialogueScene === scene && (
          <DialoguePanel 
            sceneId={jollyDialogueScene || undefined}
            currentSceneId={scene}
            characterName="Jolly Bhai"
            characterTitle="Ancient Time-Traveling Genie Companion"
            characterId="jolly"
            historicalContext={{
              current_year: stage === 1 ? 1336 : stage === 2 ? 1520 : stage === 3 ? 1540 : 1565,
              era: "Vijayanagara Empire",
              location: scene === "anegundi_river_crossing" ? "Anegundi - Tungabhadra River Bank" :
                        scene === "anegundi_old_fort" ? "Anegundi - Old Fort Ruins" :
                        scene === "hampi_bazaar_entry" ? "Hampi Bazaar - Virupaksha Car Street" :
                        scene === "gem_traders_row" ? "Hampi Bazaar - Gem Traders' Row" :
                        scene === "toymaker_stall" ? "Hampi Bazaar - Toy-Maker's Stall" :
                        scene === "stone_chariot_entry" ? "Vittala Temple - Stone Chariot Courtyard" :
                        scene === "musical_pillars" ? "Vittala Temple - Musical Pillars Mandapa" :
                        scene === "hazara_rama_walls" ? "Hazara Rama Temple Carvings" :
                        scene === "mahanavami_celebration" ? "Mahanavami Dibba Platform" :
                        "Vijayanagara Empire",
              ruler: "Emperor Krishnadevaraya / Rama Raya",
              nearby_monuments: "Vittala Temple, Virupaksha Temple, Stone Chariot, Hazara Rama, Mahanavami Dibba",
              historical_events: "Founding of Vijayanagara (1336 AD), Golden Age under Krishnadevaraya, Battle of Talikota (1565 AD)"
            }}
            dialogueText={
              jollySpeechText || "Hello, friend! I am Jolly Bhai. Ask me anything about Vijayanagara!"
            }
            isSpeaking={true}
            showInput={true}
            options={
              jollyOptions.length > 0
                ? jollyOptions
                : [
                    { id: 1, text: "How was Vijayanagara founded?" },
                    { id: 2, text: "Why was Hampi Bazaar famous?" },
                    { id: 3, text: "How do musical pillars work?" }
                  ]
            }
            onOptionSelect={() => {
              if (typeof soundFx.playSelect === "function") soundFx.playSelect();
              stopAllCharacterVoice();
              setShowJollyDialogue(false);
              setHeardClueScenes((prev) => (prev.includes(scene) ? prev : [...prev, scene]));
            }}
            onClose={() => {
              stopAllCharacterVoice();
              setShowJollyDialogue(false);
              setHeardClueScenes((prev) => (prev.includes(scene) ? prev : [...prev, scene]));
            }}
          />
        )}

        {/* --- NARRATOR SUBTITLE OVERLAY --- */}
        <NarratorSubtitle />

      </div>
    </div>
  );
}

const STAGE_NAMES: Record<number, string> = {
  1: "Anegundi (1336 AD)",
  2: "Hampi Bazaar (c. 1520 AD)",
  3: "Vittala Temple (c. 1540 AD)",
  4: "Mahanavami Dibba (1565 AD)",
};
