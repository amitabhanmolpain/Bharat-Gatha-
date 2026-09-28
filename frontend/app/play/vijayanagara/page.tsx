"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  setStage1Complete, setStage2Complete, setStage3Complete, setStage4Complete,
  setHasRecruitedHistorian,
  setHasVidyaranyaBlessing, setHasMetVidyaranya, setIsChowkaBaraComplete,
  setIsFestivalSceneRestored, setIsLedgerAssembled, setIsCampaignComplete, setIsUncleKidnapped
} from '../../store/slices/progressionSlice';
import {
  addJournalEntry, setJournalEntries, addCollectedFragment,
  setHasJournalToy, setHasFinalKeepsake,
  setHasFirstLedgerFragment, setHasSecondLedgerFragment, setHasFinalLedgerFragment
} from '../../store/slices/inventorySlice';
import { setIsSoundMuted, setIsMusicMuted, setIsTimerVisible } from '../../store/slices/settingsSlice';

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
import AnimatedAnimal from "./components/AnimatedAnimal";
import PatrollingGuard from "./components/PatrollingGuard";
import PedestrianNPC from "./components/PedestrianNPC";
import UncleFollower from "./components/UncleFollower";
import TempleWallInspectionController from "./components/TempleWallInspectionController";

// Visual scale for player character (enlarged for prominent, clear hero presence)
const PLAYER_VISUAL_SCALE = 2.2;

export default function VijayanagaraGameScreen() {
  const dispatch = useAppDispatch();
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
  const hasMetVidyaranya = useAppSelector(state => state.progression.hasMetVidyaranya);
  const [chowkaBaraAttempts, setChowkaBaraAttempts] = useState(0);
  const isChowkaBaraComplete = useAppSelector(state => state.progression.isChowkaBaraComplete);
  const hasVidyaranyaBlessing = useAppSelector(state => state.progression.hasVidyaranyaBlessing);
  const isStage1Complete = useAppSelector(state => state.progression.isStage1Complete);
  const [showOpeningAtmosphere, setShowOpeningAtmosphere] = useState(true);

  // Stage 2 Story & Interaction State
  const [hasEncounteredFirstRumor, setHasEncounteredFirstRumor] = useState(false);
  const hasFirstLedgerFragment = useAppSelector(state => state.inventory.hasFirstLedgerFragment);
  const [inspectedToys, setInspectedToys] = useState<string[]>([]);
  const hasJournalToy = useAppSelector(state => state.inventory.hasJournalToy);
  const [talkedToForeignTraveler, setTalkedToForeignTraveler] = useState(false);
  const isStage2Complete = useAppSelector(state => state.progression.isStage2Complete);
  const [showStage2OpeningBanner, setShowStage2OpeningBanner] = useState(true);

  // Stage 3 Story & Interaction State
  const hasSecondLedgerFragment = useAppSelector(state => state.inventory.hasSecondLedgerFragment);
  const [isMusicalPillarsComplete, setIsMusicalPillarsComplete] = useState(false);
  const [hasHazaraRamaDiscovery, setHasHazaraRamaDiscovery] = useState(false);
  const [hasMusicianWarning, setHasMusicianWarning] = useState(false);
  const isStage3Complete = useAppSelector(state => state.progression.isStage3Complete);
  const [showStage3OpeningBanner, setShowStage3OpeningBanner] = useState(true);
  const [stage3Countdown, setStage3Countdown] = useState<number | null>(null);
  const [showCaughtByGuardsModal, setShowCaughtByGuardsModal] = useState(false);

  // Stage 4 Story & Climax State
  const isFestivalSceneRestored = useAppSelector(state => state.progression.isFestivalSceneRestored);
  const hasFinalLedgerFragment = useAppSelector(state => state.inventory.hasFinalLedgerFragment);
  const isLedgerAssembled = useAppSelector(state => state.progression.isLedgerAssembled);
  const [hasTalikotaNarrationViewed, setHasTalikotaNarrationViewed] = useState(false);
  const [isJournalFullyUnlocked, setIsJournalFullyUnlocked] = useState(false);
  const hasFinalKeepsake = useAppSelector(state => state.inventory.hasFinalKeepsake);
  const isCampaignComplete = useAppSelector(state => state.progression.isCampaignComplete);
  const hasRecruitedHistorian = useAppSelector(state => state.progression.hasRecruitedHistorian);
  const isUncleKidnapped = useAppSelector(state => state.progression.isUncleKidnapped);
  const [showStage4OpeningBanner, setShowStage4OpeningBanner] = useState(true);

  // Stage 4 Kidnapper Mini-Game State (1-Minute Timer & 2 Chances)
  const [stage4Timer, setStage4Timer] = useState<number | null>(null);
  const [stage4Attempts, setStage4Attempts] = useState<number>(2);
  const [stage4KidnapperFound, setStage4KidnapperFound] = useState<boolean>(false);
  const [showStage4FailModal, setShowStage4FailModal] = useState<boolean>(false);
  const [showStage4SuccessModal, setShowStage4SuccessModal] = useState<boolean>(false);
  const [activeCitizenDialogue, setActiveCitizenDialogue] = useState<{
    name: string;
    title: string;
    text: string;
  } | null>(null);

  // Kidnap Event State
  const [showKidnapCutscene, setShowKidnapCutscene] = useState(false);

  // Guard Animation State
  const [guardPos, setGuardPos] = useState({ x: 15.0, y: 75.0 });
  const [guardFacingLeft, setGuardFacingLeft] = useState(false);
  const [guardFrame, setGuardFrame] = useState(1);
  const [showGuardDialogue, setShowGuardDialogue] = useState(false);
  const guardDirectionRef = useRef(1);

  // Journal Unlocks State
  const unlockedJournalEntries = useAppSelector(state => state.inventory.unlockedJournalEntries);
  const isMusicMuted = useAppSelector(state => state.settings.isMusicMuted);
  const mahanavamiAudioRef = useRef<HTMLAudioElement | null>(null);

  // Reliable background music playback for Mahanavami scene (pauses during Talikota victory screen)
  useEffect(() => {
    const audio = mahanavamiAudioRef.current;
    if (!audio) return;

    if (scene === "mahanavami_celebration" && !isMusicMuted && !showStage4SuccessModal) {
      audio.volume = 0.5;
      audio.muted = false;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const unlock = () => {
            if (mahanavamiAudioRef.current && scene === "mahanavami_celebration" && !isMusicMuted && !showStage4SuccessModal) {
              mahanavamiAudioRef.current.play().catch(() => {});
            }
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
          };
          window.addEventListener("pointerdown", unlock, { once: true });
          window.addEventListener("keydown", unlock, { once: true });
        });
      }
    } else {
      audio.pause();
    }
  }, [scene, isMusicMuted, showStage4SuccessModal]);

  // Uncle Companion State
  const [showUncleDialogue, setShowUncleDialogue] = useState(false);
  const [uncleSpeechText, setUncleSpeechText] = useState("");
  const [uncleOptions, setUncleOptions] = useState<Array<{ id: number; text: string }>>([]);

  // Merchant Dialogue State
  const [showMerchantDialogue, setShowMerchantDialogue] = useState(false);
  const [activeMerchantId, setActiveMerchantId] = useState<number | null>(null);
  const [merchantSpeechText, setMerchantSpeechText] = useState("");
  const [merchantOptions, setMerchantOptions] = useState<Array<{id: number, text: string}>>([]);
  const [merchantAudioUrl, setMerchantAudioUrl] = useState<string | undefined>(undefined);

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
  const [showOarUnlockModal, setShowOarUnlockModal] = useState(false);
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
  const [travelerTalkFrame, setTravelerTalkFrame] = useState(0);
  const [merchantAnimFrame, setMerchantAnimFrame] = useState(0);
  const [activeMerchantBubble, setActiveMerchantBubble] = useState<number | null>(null);

  // Shoe Sequence State
  const [shoeSequenceState, setShoeSequenceState] = useState<"idle" | "kallappa_speaking" | "shoe_reveal" | "shoe_unlocked" | "genie_activating" | "genie_hint" | "completed">("idle");
  const [hasShoeClue, setHasShoeClue] = useState(false);
  const [pendingShoeSequence, setPendingShoeSequence] = useState(false);
  const [showShoeUnlockModal, setShowShoeUnlockModal] = useState(false);
  
  // Musical Pillars Sequence State
  const [musicalPillarsSequenceState, setMusicalPillarsSequenceState] = useState<"idle" | "genie_activating" | "genie_hint" | "time_coin_reveal" | "time_coin_unlocked" | "completed">("idle");
  const [showTimeCoinUnlockModal, setShowTimeCoinUnlockModal] = useState(false);

  // Animated speaking frame toggling while Portuguese Traveler is speaking
  useEffect(() => {
    if (!showForeignTravelerDialogue) {
      setTravelerTalkFrame(0);
      return;
    }
    let timeoutId: NodeJS.Timeout;
    const animateSpeech = () => {
      setTravelerTalkFrame((prev) => (prev === 0 ? 1 : 0));
      // Random interval between 100ms and 350ms for more natural talking cadence
      const nextDelay = 100 + Math.random() * 250;
      timeoutId = setTimeout(animateSpeech, nextDelay);
    };
    animateSpeech();
    return () => clearTimeout(timeoutId);
  }, [showForeignTravelerDialogue]);

  // General animation loop for merchants
  useEffect(() => {
    const interval = setInterval(() => {
      setMerchantAnimFrame(prev => (prev + 1) % 3);
    }, 400); // Faster toggle for 3-frame animation
    return () => clearInterval(interval);
  }, []);

  // Stage 3 Modals
  const [showRaghavendraDialogue, setShowRaghavendraDialogue] = useState(false);
  const [raghavendraTopic, setRaghavendraTopic] = useState<"king" | "chariot" | "pillars" | "warning">("king");
  const [showMusicalPillarsModal, setShowMusicalPillarsModal] = useState(false);
  const [showHazaraRamaModal, setShowHazaraRamaModal] = useState(false);
  const [cameraTransform, setCameraTransform] = useState("scale(1) translate(0%, 0%)");
  const [showStage3VictoryModal, setShowStage3VictoryModal] = useState(false);

  // Stage 4 Modals
  const [showFestivalPuzzleModal, setShowFestivalPuzzleModal] = useState(false);
  const [showLedgerAssemblyModal, setShowLedgerAssemblyModal] = useState(false);
  const [showTalikotaModal, setShowTalikotaModal] = useState(false);
  const [showKeeperDialogue, setShowKeeperDialogue] = useState(false);
  const [showCampaignCompletionModal, setShowCampaignCompletionModal] = useState(false);

  // =========================================================================
  // GUARD ANIMATION LOOP
  // =========================================================================
  useEffect(() => {
    if (scene !== "toymaker_stall" && scene !== "mahanavami_celebration") return;
    
    const interval = setInterval(() => {
      setGuardPos(prev => {
        let newX = prev.x + (0.5 * guardDirectionRef.current);
        const maxBound = scene === "mahanavami_celebration" ? 50.0 : 35.0;
        const minBound = 10.0;
        if (newX >= maxBound) guardDirectionRef.current = -1;
        if (newX <= minBound) guardDirectionRef.current = 1;
        return { ...prev, x: newX };
      });
      setGuardFacingLeft(guardDirectionRef.current === -1);
      setGuardFrame(prev => (prev % 3) + 1);
    }, 200);
    
    return () => clearInterval(interval);
  }, [scene]);

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
    setShowUncleDialogue(false);
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
            if (parsed.hasMetVidyaranya !== undefined) dispatch(setHasMetVidyaranya(parsed.hasMetVidyaranya));
            if (parsed.chowkaBaraAttempts !== undefined) setChowkaBaraAttempts(parsed.chowkaBaraAttempts);
            if (parsed.isChowkaBaraComplete !== undefined) dispatch(setIsChowkaBaraComplete(parsed.isChowkaBaraComplete));
            if (parsed.hasVidyaranyaBlessing !== undefined) {
              dispatch(setHasVidyaranyaBlessing(parsed.hasVidyaranyaBlessing));
              dispatch(setStage1Complete(parsed.hasVidyaranyaBlessing));
            }
            if (parsed.hasEncounteredFirstRumor !== undefined) setHasEncounteredFirstRumor(parsed.hasEncounteredFirstRumor);
            if (parsed.hasFirstLedgerFragment !== undefined) {
              dispatch(setHasFirstLedgerFragment(parsed.hasFirstLedgerFragment));
              if (parsed.hasFirstLedgerFragment && parsed.hasEncounteredFirstRumor) {
                dispatch(setStage2Complete(true));
              }
            }
            if (parsed.inspectedToys) setInspectedToys(parsed.inspectedToys);
            if (parsed.hasJournalToy !== undefined) dispatch(setHasJournalToy(parsed.hasJournalToy));
            if (parsed.talkedToForeignTraveler !== undefined) setTalkedToForeignTraveler(parsed.talkedToForeignTraveler);
            if (parsed.hasSecondLedgerFragment !== undefined) {
              dispatch(setHasSecondLedgerFragment(parsed.hasSecondLedgerFragment));
              setIsMusicalPillarsComplete(parsed.isMusicalPillarsComplete || parsed.hasSecondLedgerFragment);
              if (parsed.hasSecondLedgerFragment && parsed.hasMusicianWarning) {
                dispatch(setStage3Complete(true));
              }
            }
            if (parsed.hasHazaraRamaDiscovery !== undefined) setHasHazaraRamaDiscovery(parsed.hasHazaraRamaDiscovery);
            if (parsed.hasMusicianWarning !== undefined) setHasMusicianWarning(parsed.hasMusicianWarning);
            
            // Stage 4 Loaded Properties
            if (parsed.isFestivalSceneRestored !== undefined) dispatch(setIsFestivalSceneRestored(parsed.isFestivalSceneRestored));
            if (parsed.hasFinalLedgerFragment !== undefined) dispatch(setHasFinalLedgerFragment(parsed.hasFinalLedgerFragment));
            if (parsed.isLedgerAssembled !== undefined) dispatch(setIsLedgerAssembled(parsed.isLedgerAssembled));
            if (parsed.hasTalikotaNarrationViewed !== undefined) setHasTalikotaNarrationViewed(parsed.hasTalikotaNarrationViewed);
            if (parsed.isJournalFullyUnlocked !== undefined) setIsJournalFullyUnlocked(parsed.isJournalFullyUnlocked);
            if (parsed.hasFinalKeepsake !== undefined) dispatch(setHasFinalKeepsake(parsed.hasFinalKeepsake));
            if (parsed.isCampaignComplete !== undefined) dispatch(setIsCampaignComplete(parsed.isCampaignComplete));

            if (parsed.unlockedJournalEntries) dispatch(setJournalEntries(parsed.unlockedJournalEntries));
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
        "The year is 1336 AD. On the banks of the Tungabhadra river stands Anegundi — the seat of a new empire, Vijayanagara, ruled by two brothers, Harihara I and Bukka Raya I.\n\nYou are a historian from the year 2026. A time machine has brought you here — but no one in this era can ever know that truth. Reveal it, and the consequences will be far worse than disbelief.";
      const timer = setTimeout(() => {
        setShowOpeningAtmosphere(false);
        void playNarration(introText, { speaker: "ratan", pace: 0.88, language_code: "en-IN" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scene]);

  // Stage entry narrations
  const hasPlayedStage2NarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && stage === 2 && !hasPlayedStage2NarrationRef.current) {
      hasPlayedStage2NarrationRef.current = true;
      const timer = setTimeout(() => {
        setShowStage2OpeningBanner(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, stage]);

  const hasPlayedStage3NarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && stage === 3 && !hasPlayedStage3NarrationRef.current) {
      hasPlayedStage3NarrationRef.current = true;
      const text =
        "Welcome to the Vittala Temple in Raja Krishnadevaraya's time, the golden period of Vijayanagara. Now find out all the ledgers in this time period before the guards catch you";
      const timer = setTimeout(() => {
        setShowStage3OpeningBanner(false);
        playNarration(text, { 
          speaker: "ratan", 
          pace: 0.88, 
          language_code: "en-IN"
        }).then((audio) => {
          if (audio) {
            audio.addEventListener("ended", () => {
              // setStage3Countdown(120); // Disabled patrol caught logic
            }, { once: true });
          }
        }).catch((err) => console.error("Narration error:", err));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, stage]);

  // Helper to trigger Jolly Genie's speech & start the 1-minute timer (60s)
  const triggerStage4KidnapperGeniePrompt = useCallback(() => {
    const genieSpeech =
      "Listen to me, akka—one of these people in the crowd is the kidnapper! You only have two chances to spot them. Hurry up, find them before the Deccan army gets here and blows this whole place apart!";

    setJollySpeechText(genieSpeech);
    setJollyDialogueScene("mahanavami_celebration");
    setShowJollyDialogue(true);
    setStage4Attempts(2);
    setStage4KidnapperFound(false);
    setShowStage4FailModal(false);
    // NOTE: timer starts in onEnd so it only begins AFTER narrator finishes speaking

    void playCharacterDialogue({
      character: "jolly",
      text: genieSpeech,
      onEnd: () => {
        // Start the 60-second countdown only after Genie finishes
        setStage4Timer(60);
      },
    });

    // Fallback: if character voice onEnd never fires, start timer after ~10s
    setTimeout(() => {
      setStage4Timer((prev) => (prev === null ? 60 : prev));
    }, 10000);
  }, []);

  const handleRestartStage4Checkpoint = () => {
    if (typeof (soundFx as any).playKeyboardClick === "function") (soundFx as any).playKeyboardClick();
    setShowStage4FailModal(false);
    setShowStage4SuccessModal(false);
    setActiveCitizenDialogue(null);
    setStage4KidnapperFound(false);
    setPlayerPos({ x: 50.0, y: 80.0 });
    triggerStage4KidnapperGeniePrompt();
  };

  const handleCrowdCitizenClick = (
    isKidnapper: boolean,
    citizenName: string,
    defaultDialogue: string,
    citizenTitle: string = "Festival Attendee"
  ) => {
    if (stage === 4 && scene === "mahanavami_celebration" && !stage4KidnapperFound && !showStage4FailModal) {
      if (isKidnapper) {
        setStage4KidnapperFound(true);
        setStage4Timer(null);
        setActiveCitizenDialogue(null);
        setShowStage4SuccessModal(true);
        stopAllCharacterVoice();
        if (mahanavamiAudioRef.current) {
          mahanavamiAudioRef.current.pause();
        }

        const victoryNarration =
          "You saved your friend from getting killed, leaving the jealous kidnapper behind to perish in the Battle of Talikota—a catastrophic war where such a massive empire was destroyed because generals turned traitor, enemy cannons tore through the army, and King Rama Raya was beheaded on the battlefield.";
        void playNarration(victoryNarration, { speaker: "ratan", pace: 0.9, language_code: "en-IN", hideSubtitle: true });
      } else {
        const remainingAttempts = stage4Attempts - 1;
        setStage4Attempts(remainingAttempts);

        if (remainingAttempts <= 0) {
          setStage4Timer(null);
          setActiveCitizenDialogue(null);
          setShowStage4FailModal(true);
          const failText = "Oh no, akka! That was your last chance! The kidnapper escaped into the festival crowd!";
          setJollySpeechText(failText);
          setShowJollyDialogue(true);
          void playCharacterDialogue({ character: "jolly", text: failText });
        } else {
          setActiveCitizenDialogue({
            name: citizenName,
            title: citizenTitle,
            text: `${defaultDialogue}\n\n⚠️ (Jolly Bhai: "That is NOT the kidnapper! You have only ${remainingAttempts} chance left!")`,
          });
          const warningText = `That's not the kidnapper! Be careful, akka—you only have ${remainingAttempts} chance left to spot them!`;
          setJollySpeechText(warningText);
          void playCharacterDialogue({ character: "jolly", text: warningText });
        }
      }
      return;
    }

    setActiveCitizenDialogue({
      name: citizenName,
      title: citizenTitle,
      text: defaultDialogue,
    });
    if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
  };

  const hasPlayedStage4NarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && stage === 4 && !hasPlayedStage4NarrationRef.current) {
      hasPlayedStage4NarrationRef.current = true;
      const text =
        "The year is 1565. It is the final celebration of the Vijayanagara Empire. Soon, the Deccan Sultanates will arrive and reduce this city to ruins. Your mission begins now: find your friend before the empire collapses.";

      const timer = setTimeout(() => {
        setShowStage4OpeningBanner(false);
        void playNarration(text, {
          speaker: "ratan",
          pace: 0.88,
          language_code: "en-IN",
          onEnd: () => {
            triggerStage4KidnapperGeniePrompt();
          },
        });

        // Fallback timer in case narration onEnd does not trigger
        const fallbackTimer = setTimeout(() => {
          if (stage4Timer === null && !stage4KidnapperFound && !showStage4FailModal) {
            triggerStage4KidnapperGeniePrompt();
          }
        }, 14000);
        return () => clearTimeout(fallbackTimer);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, stage, triggerStage4KidnapperGeniePrompt, stage4Timer, stage4KidnapperFound, showStage4FailModal]);

  // Stage 4 Countdown Timer Logic (1 minute = 60s)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      stage4Timer !== null &&
      stage4Timer > 0 &&
      !showStage4FailModal &&
      !stage4KidnapperFound &&
      stage === 4 &&
      scene === "mahanavami_celebration"
    ) {
      interval = setInterval(() => {
        setStage4Timer((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(interval);
            setShowStage4FailModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage4Timer, showStage4FailModal, stage4KidnapperFound, stage, scene]);

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
        void playCharacterDialogue({
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
      dispatch(setHasMetVidyaranya(false));
      setChowkaBaraAttempts(0);
      dispatch(setIsChowkaBaraComplete(false));
      dispatch(setHasVidyaranyaBlessing(false));
      dispatch(setStage1Complete(false));
      setShowOpeningAtmosphere(true);
      setHasEncounteredFirstRumor(false);
      dispatch(setHasFirstLedgerFragment(false));
      setInspectedToys([]);
      dispatch(setHasJournalToy(false));
      setTalkedToForeignTraveler(false);
      dispatch(setStage2Complete(false));
      setShowStage2OpeningBanner(true);
      dispatch(setHasSecondLedgerFragment(false));
      setIsMusicalPillarsComplete(false);
      setHasHazaraRamaDiscovery(false);
      setHasMusicianWarning(false);
      dispatch(setStage3Complete(false));
      setShowStage3OpeningBanner(true);
      dispatch(setIsFestivalSceneRestored(false));
      dispatch(setHasFinalLedgerFragment(false));
      dispatch(setIsLedgerAssembled(false));
      setHasTalikotaNarrationViewed(false);
      setIsJournalFullyUnlocked(false);
      dispatch(setHasFinalKeepsake(false));
      dispatch(setIsCampaignComplete(false));
      setShowStage4OpeningBanner(true);
      dispatch(setJournalEntries(INITIAL_VIJAYANAGARA_STATE.unlockedJournalEntries));
    }
  };

  // --- PROXIMITY & INTERACTION CHECKS ---
  // Stage 1 Proximities
  const isNearRiverUphillExit =
    scene === "anegundi_river_crossing" &&
    playerPos.y <= 58.0 &&
    playerPos.x >= 20.0 &&
    playerPos.x <= 45.0;

  const unclePos = { x: 18.0, y: 78.0 };
  const distToUncle = Math.sqrt(
    Math.pow(playerPos.x - unclePos.x, 2) + Math.pow(playerPos.y - unclePos.y, 2)
  );
  const isNearUncle = scene === "anegundi_river_crossing" && distToUncle < 11.0 && !hasRecruitedHistorian;

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
    playerPos.x >= 25.0 &&
    playerPos.x <= 40.0 &&
    playerPos.y >= 36.0 &&
    playerPos.y <= 48.0;

  const isNearBazaarGemRow =
    scene === "hampi_bazaar_entry" &&
    playerPos.x >= 78.0 &&
    playerPos.y >= 80.0;

  const isNearBazaarToymaker = scene === "hampi_bazaar_entry" && playerPos.x >= 45.0 && playerPos.x <= 65.0 && playerPos.y >= 85.0 && playerPos.y <= 100.0;

  const isNearBazaarForeignTraveler =
    scene === "hampi_bazaar_entry" &&
    playerPos.x >= 56.0 &&
    playerPos.x <= 72.0 &&
    playerPos.y >= 52.0 &&
    playerPos.y <= 66.0;

  const isNearBazaarStage3Road =
    scene === "hampi_bazaar_entry" &&
    playerPos.x >= 68.0 &&
    playerPos.x <= 82.0 &&
    playerPos.y >= 60.0 &&
    playerPos.y <= 74.0;

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
    playerPos.x >= 50.0 &&
    playerPos.x <= 70.0 &&
    playerPos.y >= 70.0 &&
    playerPos.y <= 100.0;

  // Stage 3 Proximities
  const isNearChariotMusician =
    scene === "stone_chariot_entry" &&
    playerPos.x >= 28.0 &&
    playerPos.x <= 44.0 &&
    playerPos.y >= 78.0 &&
    playerPos.y <= 100.0;

  const isNearChariotMandapaExit =
    scene === "stone_chariot_entry" &&
    playerPos.x >= 65.0 &&
    playerPos.y >= 78.0;

  const isNearChariotHazaraRamaExit =
    scene === "stone_chariot_entry" &&
    playerPos.x <= 30.0 &&
    playerPos.x >= 20.0 &&
    playerPos.y >= 78.0;

  const isNearChariotStage4Road =
    scene === "stone_chariot_entry" &&
    playerPos.x >= 80.0 &&
    playerPos.y >= 78.0;

  const isNearChariotBazaarReturn =
    scene === "stone_chariot_entry" &&
    playerPos.x <= 20.0 &&
    playerPos.y >= 78.0;

  const isNearMusicalPillarsCenter =
    scene === "musical_pillars" &&
    playerPos.x >= 38.0 &&
    playerPos.x <= 62.0 &&
    playerPos.y >= 65.0 &&
    playerPos.y <= 90.0;

  const isNearMusicalPillarsExit =
    scene === "musical_pillars" &&
    playerPos.x <= 28.0 &&
    playerPos.y >= 76.0;

  const isNearHazaraFriezes =
    scene === "hazara_rama_walls" &&
    playerPos.x >= 35.0 &&
    playerPos.x <= 55.0 &&
    playerPos.y >= 76.0 &&
    playerPos.y <= 100.0;

  const isNearHazaraRamaExit =
    scene === "hazara_rama_walls" &&
    playerPos.x >= 70.0 &&
    playerPos.y >= 76.0;

  const isNearHazaraRamaStage4Exit =
    scene === "hazara_rama_walls" &&
    playerPos.x <= 25.0 &&
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

  // --- BOUNDARY RESCUE EFFECT ---
  // If the player is loaded outside the walkable area (e.g. after a code update), push them back in.
  useEffect(() => {
    const config = SCENE_CONFIGS[scene];
    if (config) {
      let newX = playerPos.x;
      let newY = playerPos.y;
      let needsRescue = false;
      
      if (playerPos.y < config.minY) { newY = config.minY; needsRescue = true; }
      if (playerPos.y > config.maxY) { newY = config.maxY; needsRescue = true; }
      if (playerPos.x < config.minX) { newX = config.minX; needsRescue = true; }
      if (playerPos.x > config.maxX) { newX = config.maxX; needsRescue = true; }
      
      if (needsRescue) {
        setPlayerPos({ x: newX, y: newY });
      }
    }
  }, [scene, playerPos.x, playerPos.y]);

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
        // Allow unrestricted movement so the player can reach the uncle everywhere
      }

      if (activeScene === "anegundi_old_fort") {
        if (targetX < 32.0 && targetY < 68.0) return false;
        if (targetX > 62.0 && targetY < 60.0) return false;
        if (targetX >= 34.0 && targetX <= 42.0 && targetY >= 62.0 && targetY <= 68.0) return false;
      }

      // Stage 2 Physics
      if (activeScene === "hampi_bazaar_entry") {
        if (targetY < 37.0) return false;
        // Pathway heading back towards the golden temple entrance
        if (targetY < 52.0) {
          if (targetX < 26.0 || targetX > 42.0) return false;
        } else {
          // Main street area
          if (targetX < 11.0) return false;
          if (targetX > 89.0) return false;
          // Upper-left colonnade wall/stairs
          if (targetX < 18.0 && targetY < 64.0) return false;
        }
      }

      if (activeScene === "gem_traders_row") {
        if (targetX < 30.0 && targetY < 68.0) return false;
        if (targetX > 72.0 && targetY < 62.0) return false;
      }

      if (activeScene === "toymaker_stall") {
        // The street is now completely open in the new background image.
        // No internal obstacles needed!
      }

      // Stage 3 Physics
      if (activeScene === "stone_chariot_entry") {
        if (targetX >= 44.0 && targetX <= 58.0 && targetY >= 58.0 && targetY <= 72.0) return false;
        if (targetY < 52.0) return false;
      }

      if (activeScene === "musical_pillars") {
        // Prevent walking ON the pillar base (y: 58 to 72)
        if (targetX >= 42.0 && targetX <= 58.0 && targetY >= 58.0 && targetY <= 72.0) return false;
        if (targetY < 54.0) return false;
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
    showCampaignCompletionModal ||
    showKidnapCutscene;

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
      // Debug / Fast-Travel Key [F]
      if (key === "f" && !isAnyModalOpen) {
        if (scene === "toymaker_stall") {
          triggerTransition(
            "stone_chariot_entry",
            { x: 35.0, y: 85.0 },
            "Traveling to Vittala Temple Complex",
            "Leaving the Toymaker's stall and heading directly to the legendary Stone Chariot in Stage 3.",
            "stone_road"
          );
        } else if (scene === "stone_chariot_entry") {
          triggerTransition(
            "hampi_bazaar_entry",
            { x: 50.0, y: 80.0 },
            "Returning to Hampi Bazaar",
            "Leaving the Vittala Temple complex and fast-traveling back to the bustling bazaar.",
            "stone_road"
          );
        } else if (scene === "hazara_rama_walls") {
          triggerTransition(
            "stone_chariot_entry",
            { x: 32.0, y: 85.0 },
            "Returning to Vittala Temple Courtyard",
            "Returning to the central stone courtyard of the Stone Chariot.",
            "temple_walk"
          );
        }
      }

      // Stage 4 Transition Key [G]
      if (key === "g" && !isAnyModalOpen) {
        if (isNearHazaraRamaStage4Exit) {
          triggerTransition(
            "mahanavami_celebration",
            { x: 50.0, y: 80.0 },
            "Approaching Mahanavami Dibba (Stage 4)",
            "Ascending toward the multi-tiered royal ceremonial platform as evening shadows stretch across the granite landscape.",
            "stone_road"
          );
          setStage(4);
          if (!unlockedJournalEntries.includes("mahanavami_dibba_platform")) {
            dispatch(addJournalEntry("mahanavami_dibba_platform"));
          }
        }
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
            dispatch(setHasMetVidyaranya(true));
            if (!unlockedJournalEntries.includes("harihara_bukka_founding")) {
              dispatch(addJournalEntry("harihara_bukka_founding"));
            }
          }
        } else if (isNearUncle) {
setUncleSpeechText("Hello, I'm Raju, a time traveller from 2026 who came here seeking to understand the tragic fall of such a magnificent empire.");
          setUncleOptions([
            { id: 1, text: "Let us seek the truth together." }
          ]);
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowUncleDialogue(true);
        } else if (isNearCoracle) {
          if (hasVidyaranyaBlessing) {
            triggerTransition(
              "hampi_bazaar_entry",
              { x: 33.0, y: 80.0 }, // Changed y from 45.0 to 80.0 to stand on the ground path
              "Crossing Tungabhadra to Hampi Bazaar (Stage 2)",
              "Skimming across the swirling river rapids as the morning mist parts to reveal the grand Car Street of Virupaksha.",
              "coracle"
            );
            setStage(2);
            if (!unlockedJournalEntries.includes("hampi_bazaar_trade")) {
              dispatch(addJournalEntry("hampi_bazaar_trade"));
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
          triggerTransition("toymaker_stall", { x: 85.0, y: 93.0 }, "Entering Kinhal Artisan Workshop",
            "Visiting the fragrant timber workshop filled with colorful lacquered toys.",
            "stone_road"
          );
        } else if (isNearBazaarForeignTraveler) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowForeignTravelerDialogue(true);
          setTalkedToForeignTraveler(true);
          if (!unlockedJournalEntries.includes("foreign_chronicles_paes")) {
            dispatch(addJournalEntry("foreign_chronicles_paes"));
          }
        } else if (isNearBazaarStage3Road) {
          if (isStage2Complete || hasFirstLedgerFragment) {
            triggerTransition(
              "stone_chariot_entry",
              { x: 35.0, y: 85.0 },
              "Royal Car Street Procession to Vittala Temple (Stage 3)",
              "Journeying along the grand paved ceremonial pathway toward the architectural masterpiece of the Golden Age.",
              "stone_road"
            );
            setStage(3);
            if (!unlockedJournalEntries.includes("stone_chariot_garuda")) {
              dispatch(addJournalEntry("stone_chariot_garuda"));
            }
          }
        } else if (isNearGemRowExit) {
          triggerTransition(
            "hampi_bazaar_entry",
            { x: 84.0, y: 86.0 },
            "Returning to Virupaksha Car Street",
            "Stepping back out into the bustling main market thoroughfare.",
            "stone_road"
          );
        } else if (isNearGemAssessor) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowGemAssessorDialogue(true);
          setGemDialogueTopic("gems");
          if (!unlockedJournalEntries.includes("gem_markets")) {
            dispatch(addJournalEntry("gem_markets"));
          }
        } else if (isNearToymakerExit) {
          triggerTransition(
            "hampi_bazaar_entry",
            { x: 18.0, y: 72.0 },
            "Returning to Virupaksha Car Street",
            "Exiting the artisan stall back into the sunlight of the grand bazaar.",
            "stone_road"
          );
        } else if (isNearToymakerNpc) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowToymakerDialogue(true);
          if (!unlockedJournalEntries.includes("kinhal_toys")) {
            dispatch(addJournalEntry("kinhal_toys"));
          }
        }

        // --- STAGE 3 INTERACTIONS ---
        else if (isNearChariotMusician) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowRaghavendraDialogue(true);
          setRaghavendraTopic(hasSecondLedgerFragment ? "warning" : "king");
          if (!unlockedJournalEntries.includes("krishnadevaraya_era")) {
            dispatch(addJournalEntry("krishnadevaraya_era"));
          }
        } else if (isNearChariotMandapaExit) {
          triggerTransition(
            "musical_pillars",
            { x: 75.0, y: 80.0 },
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
              { x: 50.0, y: 66.0 },
              "Approaching Mahanavami Dibba (Stage 4)",
              "Ascending toward the multi-tiered royal ceremonial platform as evening shadows stretch across the granite landscape.",
              "stone_road"
            );
            setStage(4);
            if (!unlockedJournalEntries.includes("mahanavami_dibba_platform")) {
              dispatch(addJournalEntry("mahanavami_dibba_platform"));
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
            { x: 65.0, y: 85.0 },
            "Returning to Vittala Temple Courtyard",
            "Stepping back out into the sunlit stone courtyard facing the Garuda Shrine.",
            "temple_walk"
          );
        } else if (isNearHazaraFriezes) {
          setShowHazaraRamaModal(true);
          setHasHazaraRamaDiscovery(true);
          if (!unlockedJournalEntries.includes("hazara_rama_friezes")) {
            dispatch(addJournalEntry("hazara_rama_friezes"));
          }
        }

        // --- STAGE 4 INTERACTIONS ---
        else if (isNearMahanavamiNiche && !hasFinalLedgerFragment) {
          dispatch(setHasFinalLedgerFragment(true));
          setShowLedgerAssemblyModal(true);
          dispatch(setIsLedgerAssembled(true));
          if (!unlockedJournalEntries.includes("pushkarani_secret_vault")) {
            dispatch(addJournalEntry("pushkarani_secret_vault"));
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
            { x: 50.0, y: 85.0 },
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
        setShowUncleDialogue(false);
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
        setShowKidnapCutscene(false);
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
    isNearHazaraRamaStage4Exit,
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
      if (showCoracleNotice) setShowCoracleNotice(false);
      if (hasTriggeredCoracleNotice) setHasTriggeredCoracleNotice(false);
    }
  }, [isNearCoracle, hasVidyaranyaBlessing, hasTriggeredCoracleNotice, showCoracleNotice]);

  // Kidnap Event Trigger
  useEffect(() => {
    let kidnapTimer: number;
    if (scene === "hampi_bazaar_entry" && !isUncleKidnapped) {
      kidnapTimer = window.setTimeout(() => {
        setShowKidnapCutscene(true);
      }, 6000);
    }
    return () => clearTimeout(kidnapTimer);
  }, [scene, isUncleKidnapped]);

  // Stage 1 Handler
  const handleChowkaBaraComplete = (won: boolean, attempts: number) => {
    setShowChowkaBaraModal(false);
    setChowkaBaraAttempts(attempts);

    if (won) {
      dispatch(setIsChowkaBaraComplete(true));
      dispatch(setHasVidyaranyaBlessing(true));
      dispatch(setStage1Complete(true));

      dispatch(addJournalEntry("chowka_bara_game"));
      dispatch(addJournalEntry("tungabhadra_defenses"));

      setShowBlessingCutscene(true);
    }
  };

  const handleToyFragmentDiscovery = () => {
    dispatch(setHasFirstLedgerFragment(true));
    if (!unlockedJournalEntries.includes("missing_ledger_mystery")) {
      dispatch(addJournalEntry("missing_ledger_mystery"));
    }
    // As requested: Immediately trigger Stage 2 completion / Stage 3 redirect
    dispatch(setStage2Complete(true));
    
    setPendingShoeSequence(true);
  };

  const startKallappaShoeSequence = () => {
    if (shoeSequenceState !== "idle" && shoeSequenceState !== "completed") return; // Prevent duplicate triggers
    setShoeSequenceState("kallappa_speaking");
    
    // Play Kallappa TTS
    playNarration("The kidnapper left this behind.", { speaker: "ratan", pace: 0.88, language_code: "en-IN" });
    
    setTimeout(() => {
       setShoeSequenceState("shoe_unlocked");
       if (typeof soundFx.playItemUnlock === "function") soundFx.playItemUnlock();
       
       setHasShoeClue(true);
       setShowShoeUnlockModal(true);
    }, 500);
  };

  const handleSelectJournalToy = () => {
    dispatch(setHasJournalToy(true));
    if (!unlockedJournalEntries.includes("kinhal_toys")) {
      dispatch(addJournalEntry("kinhal_toys"));
    }
  };

  // Stage 3 Handler
  const handleMusicalPillarsDiscovery = () => {
    if (musicalPillarsSequenceState !== "idle" && musicalPillarsSequenceState !== "completed") return; // Prevent duplicate triggers
    setShowMusicalPillarsModal(false);
    
    // Start sequence
    setMusicalPillarsSequenceState("genie_activating");
    soundFx.playSelect();

    setTimeout(() => {
      setMusicalPillarsSequenceState("genie_hint");
      playNarration("Good job you played well", { speaker: "ratan", pace: 0.9, language_code: "en-IN" });
      
      setTimeout(() => {
        setMusicalPillarsSequenceState("time_coin_reveal");
        
        setTimeout(() => {
          setMusicalPillarsSequenceState("time_coin_unlocked");
          soundFx.playItemUnlock();
          
          setShowTimeCoinUnlockModal(true);
        }, 1000);
      }, 3000);
    }, 1000);
  };

  // Stage 4 Handlers
  const handleFestivalReconstructionComplete = () => {
    setShowFestivalPuzzleModal(false);
    dispatch(setIsFestivalSceneRestored(true));
  };

  const handleCompleteCampaignFinale = () => {
    setShowKeeperDialogue(false);
    setIsJournalFullyUnlocked(true);
    dispatch(setHasFinalKeepsake(true));
    dispatch(setIsCampaignComplete(true));

    // Unlock all 15 journal entries
    const allJournalIds = JOURNAL_DATABASE.map((e) => e.id);
    dispatch(setJournalEntries(allJournalIds));

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
  const sceneVisualScale = PLAYER_VISUAL_SCALE;
  const depthScale = (0.7 + ((playerPos.y - 50.0) / 40.0) * 0.55) * sceneVisualScale;
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
      <div 
        className="relative w-full h-full max-w-[1920px] max-h-[1080px] overflow-hidden shadow-2xl transition-transform duration-1000 origin-center"
        style={{ transform: cameraTransform }}
      >
        
        {/* Background Artwork */}
        <img
          src={currentSceneConfig.backgroundImage}
          alt={currentSceneConfig.title}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Atmospheric Lighting Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25 pointer-events-none"></div>

        {/* --- ANEGUNDI BACKGROUND MUSIC --- */}
        {(scene === "anegundi_river_crossing" || scene === "anegundi_old_fort") && (
          <audio id="anegundi-music" src="/anegundi_music.mp3" loop muted={isMusicMuted} className="hidden pointer-events-none" onCanPlay={(e) => { e.currentTarget.volume = 0.5; e.currentTarget.play().catch(() => {}); }} />
        )}

        {/* --- STAGE 1 SCENE 1: ANEGUNDI RIVER CROSSING HOTSPOTS --- */}
        {scene === "anegundi_river_crossing" && (
          <>
            {/* Realistic Sailing Boat in River */}
            <div className="absolute top-[38%] left-0 pointer-events-none z-0 animate-river-sail opacity-90 drop-shadow-2xl">
              <div className="animate-river-bob">
                <img 
                  src="/sprite-egyptian-boat-1.png" 
                  alt="Sailing Boat" 
                  className="w-24 h-auto object-contain"
                  style={{ 
                    imageRendering: "pixelated",
                    filter: "sepia(0.8) hue-rotate(-45deg) brightness(0.55) contrast(1.3) saturate(1.5)"
                  }}
                />
              </div>
            </div>

            {/* Animated Coracle Row Boat 1 (Left Lane) */}
            <PedestrianNPC
              id="animated_coracle_1"
              frames={["/coracle_row_1.png", "/coracle_row_2.png", "/coracle_row_3.png", "/coracle_row_4.png"]}
              path={[{ x: 62, y: 68 }, { x: 55, y: 50 }, { x: 50, y: 38 }]}
              speed={0.25}
              scale={1.8}
              circular={false}
              startDelay={0}
              animSpeed={400}
            />
            {/* Animated Coracle Row Boat 2 (Right Lane) */}
            <PedestrianNPC
              id="animated_coracle_2"
              frames={["/coracle_row_1.png", "/coracle_row_2.png", "/coracle_row_3.png", "/coracle_row_4.png"]}
              path={[{ x: 55, y: 38 }, { x: 65, y: 50 }, { x: 80, y: 68 }]}
              speed={0.25}
              scale={1.6}
              circular={false}
              startDelay={2000}
              animSpeed={400}
            />
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
            {/* River Ferry (Moved to where Portuguese guy was) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "64%", top: "61%" }}
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

            {/* Gem Arcade (Bottom Right near Spices as shown in 4th image) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "87%", top: "89%" }}
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

            {/* Kinhal Toys (Bottom Middle) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "55%", top: "93%" }}
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

            {/* Portuguese Traveler (Senhor Duarte) Animated NPC */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-[90%] flex flex-col items-center pointer-events-auto cursor-pointer z-20 group"
              style={{ left: "68%", top: "78%" }}
              onClick={() => {
                if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
                setShowForeignTravelerDialogue(true);
                setTalkedToForeignTraveler(true);
              }}
              title="Senhor Duarte — Portuguese Chronicler (Click or Press E to Speak)"
            >
              {/* Interaction Bubble when nearby */}
              {isNearBazaarForeignTraveler && !showForeignTravelerDialogue && (
                <div className="mb-2 bg-[#1a1714]/95 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-xl text-xs font-serif shadow-[0_4px_20px_rgba(0,0,0,0.85)] animate-bounce flex items-center gap-1.5 whitespace-nowrap pointer-events-none">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Speak with Senhor Duarte (Portuguese Traveler)</span>
                </div>
              )}

              {/* Speaking Indicator Bubble when talking */}
              {showForeignTravelerDialogue && (
                <div className="mb-2 bg-amber-950/90 border-2 border-[#f59e0b] text-[#fff9ea] px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide flex items-center gap-1.5 shadow-lg animate-pulse pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Speaking...</span>
                </div>
              )}

              {/* Character Sprite with Idle / Speaking Animation */}
              <div
                className={`relative transition-transform duration-200 group-hover:scale-105 ${
                  showForeignTravelerDialogue ? "scale-105" : ""
                }`}
              >
                <img
                  src={
                    showForeignTravelerDialogue
                      ? (travelerTalkFrame === 1
                          ? "/portuguese_traveler_talking.png"
                          : "/portuguese_traveler_idle.png")
                      : "/portuguese_traveler_idle.png"
                  }
                  alt="Senhor Duarte, Portuguese Traveler"
                  className={`w-20 h-32 md:w-24 md:h-36 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] ${
                    showForeignTravelerDialogue ? "animate-pulse" : ""
                  }`}
                  style={{
                    imageRendering: "pixelated",
                    transform: showForeignTravelerDialogue && travelerTalkFrame === 1
                      ? "translateY(-3px) rotate(1deg)"
                      : "none",
                  }}
                />

                {/* Nameplate below character */}
                <div className="mt-1 flex items-center justify-center">
                  <span className="text-[10px] font-serif font-bold text-[#eedfc8] bg-[#1a1714]/90 px-2.5 py-0.5 rounded-full border border-[#5a4d3f] shadow whitespace-nowrap group-hover:border-[#d4a359] group-hover:text-[#f6ede0] transition-colors">
                    Senhor Duarte
                  </span>
                </div>
              </div>
            </div>

            {/* Path to Stage 3: Vittala Temple Road */}
            {(isStage2Complete || hasFirstLedgerFragment) && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
                style={{ left: "75%", top: "66%" }}
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

            {/* Shopkeeper 1: Spice Merchant */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-[90%] flex flex-col items-center z-10 pointer-events-auto cursor-pointer group"
              style={{ left: "28%", top: "96%" }}
              onClick={() => {
                setActiveMerchantId(1);
                setMerchantSpeechText("Finest spices from Kerala! Come take a look!");
                setMerchantOptions([{ id: 1, text: "Did you see an old man getting kidnapped?" }]);
                setMerchantAudioUrl("/merchant_1_intro.mp3");
                if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
                setShowMerchantDialogue(true);
              }}
            >
              {activeMerchantBubble === 1 && (
                <div className="absolute -top-12 bg-amber-50 border-2 border-amber-600 text-amber-900 px-3 py-1 rounded-xl text-xs font-serif font-bold whitespace-nowrap shadow-lg animate-bounce z-30">
                  "Finest spices from Kerala! Come take a look!"
                </div>
              )}
              <img
                src={merchantAnimFrame === 0 ? "/merchant_1.png" : merchantAnimFrame === 1 ? "/merchant_1_anim1.png" : "/merchant_1_anim2.png"}
                alt="Spice Merchant"
                className="w-36 h-52 md:w-44 md:h-64 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            {/* Shopkeeper 2: Jewelry Merchant */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-[90%] flex flex-col items-center z-10 pointer-events-auto cursor-pointer group"
              style={{ left: "48%", top: "88%" }}
              onClick={() => {
                setActiveMerchantId(2);
                setMerchantSpeechText("Precious gems from Golconda! Only for the wealthy!");
                setMerchantOptions([{ id: 1, text: "Did you see an old man getting kidnapped?" }]);
                setMerchantAudioUrl("/merchant_2_intro.mp3");
                if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
                setShowMerchantDialogue(true);
              }}
            >
              {activeMerchantBubble === 2 && (
                <div className="absolute -top-12 bg-emerald-50 border-2 border-emerald-600 text-emerald-900 px-3 py-1 rounded-xl text-xs font-serif font-bold whitespace-nowrap shadow-lg animate-bounce z-30">
                  "Precious gems from Golconda! Only for the wealthy!"
                </div>
              )}
              <img
                src={merchantAnimFrame === 0 ? "/merchant_2.png" : merchantAnimFrame === 1 ? "/merchant_2_anim1.png" : "/merchant_2_anim2.png"}
                alt="Jewelry Merchant"
                className="w-36 h-52 md:w-44 md:h-64 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            {/* Shopkeeper 3: Fabric Merchant */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-[90%] flex flex-col items-center z-10 pointer-events-auto cursor-pointer group"
              style={{ left: "78%", top: "96%" }}
              onClick={() => {
                setActiveMerchantId(3);
                setMerchantSpeechText("Luxurious silks from Kanchipuram! Feel the texture!");
                setMerchantOptions([{ id: 1, text: "Did you see an old man getting kidnapped?" }]);
                setMerchantAudioUrl("/merchant_3_intro.mp3");
                if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
                setShowMerchantDialogue(true);
              }}
            >
              {activeMerchantBubble === 3 && (
                <div className="absolute -top-12 bg-rose-50 border-2 border-rose-600 text-rose-900 px-3 py-1 rounded-xl text-xs font-serif font-bold whitespace-nowrap shadow-lg animate-bounce z-30">
                  "Luxurious silks from Kanchipuram! Feel the texture!"
                </div>
              )}
              <img
                src={merchantAnimFrame === 0 ? "/merchant_3.png" : merchantAnimFrame === 1 ? "/merchant_3_anim1.png" : "/merchant_3_anim2.png"}
                alt="Fabric Merchant"
                className="w-36 h-52 md:w-44 md:h-64 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform"
                style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }}
              />
            </div>
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
              <img 
                src="/trader_pots_transparent.png" 
                alt="Shopkeeper" 
                className="w-40 h-auto drop-shadow-xl" 
              />
            </div>

            {/* --- ANIMATED GUARD --- */}
            {(() => {
              const gX = guardPos.x;
              // Path: Horizontal from x=35 to x=25, then curves back into depth from x=25 to x=10
              const gY = gX > 25 ? 96 : 80 + ((gX - 10) / 15) * 16;
              // Scale: 1.0 at foreground (y=96), 0.6 at background (y=80)
              const gScale = 0.6 + ((gY - 80) / 16) * 0.4;
              
              return (
                <div
                  className="absolute transform z-10 cursor-pointer hover:brightness-125 transition-all"
                  style={{ 
                    left: `${gX}%`, 
                    top: `${gY}%`, 
                    transform: `translate(-50%, -100%) scale(${guardFacingLeft ? -gScale : gScale}, ${gScale})` 
                  }}
                  onClick={() => setShowGuardDialogue(true)}
                  title="Speak to Royal Guard"
                >
                  <img 
                    src={`/guard_anim_${guardFrame}.png`} 
                    alt="Vijayanagara Guard" 
                    className="w-28 h-auto drop-shadow-[0_10px_8px_rgba(0,0,0,0.5)]" 
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              );
            })()}

            <div
              className="absolute transform -translate-x-1/2 -translate-y-[90%] flex flex-col items-center pointer-events-auto cursor-pointer z-10 hover:brightness-110 transition-all"
              style={{ left: "58%", top: "90%" }}
              onClick={() => setShowToymakerDialogue(true)}
            >
              {isNearToymakerNpc && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Speak with Toymaker Kallappa & Inspect Toys</span>
                </div>
              )}
              <img
                src="/kallappa_sprite.png"
                alt="Master Kallappa"
                className="w-24 h-36 md:w-28 md:h-44 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]"
                style={{ imageRendering: "pixelated" }}
              />
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

            {/* --- FAST TRAVEL STAGE 3 HOTSPOT --- */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "85%", top: "78%" }}
            >
              <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-pulse flex items-center gap-1.5 whitespace-nowrap">
                <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">F</kbd>
                <span>Travel to Stone Chariot (Stage 3)</span>
              </div>
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Stage 3
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

            {/* --- PEDESTRIAN NPCS --- */}

            {/* BULLOCK CART: LEFT SIDE (red area) - diagonal in front of left temple */}
            <PedestrianNPC
              id="bullock_cart_guy"
              frames={[
                "/bullock_cart_1.png",
                "/bullock_cart_2.png",
                "/bullock_cart_3.png",
                "/bullock_cart_4.png"
              ]}
              path={[
                { x: 28, y: 80 },
                { x: -10, y: 65 }
              ]}
              speed={2}
              animSpeed={450}
              scale={3.0}
              startDelay={1000}
            />

            {/* GUARDS: blue line zone - open courtyard diagonal */}
            <PedestrianNPC
              id="temple_guard_1"
              frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]}
              path={[
                { x: 65, y: 84 },
                { x: 78, y: 90 }
              ]}
              speed={4}
              animSpeed={320}
              scale={0.85}
            />
            <PedestrianNPC
              id="temple_guard_2"
              frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]}
              path={[
                { x: 78, y: 90 },
                { x: 65, y: 84 }
              ]}
              speed={3.5}
              animSpeed={320}
              scale={0.8}
              startDelay={4000}
            />
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
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-10 hover:scale-105 transition-transform"
              style={{ left: "45%", top: "68%" }}
              onClick={() => {
                soundFx.playSelect();
                setShowHazaraRamaModal(true);
                setHasHazaraRamaDiscovery(true);
                if (!unlockedJournalEntries.includes("hazara_rama_friezes")) {
                  dispatch(addJournalEntry("hazara_rama_friezes"));
                }
              }}
            >
              {isNearHazaraFriezes ? (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <span>Examine Narrative Ramayana Bas-Reliefs</span>
                </div>
              ) : (
                <div className="mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] flex items-center gap-1.5 whitespace-nowrap">
                  <span>Ramayana Friezes</span>
                </div>
              )}
              <div className="w-12 h-14 bg-[#2e261f]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg">
                <GameIcon name="archery" size={22} className="text-[#eedfc8]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Ramayana Friezes
              </span>
            </div>

            {/* --- FAST TRAVEL RETURN HOTSPOT --- */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-10 hover:scale-105 transition-transform"
              style={{ left: "72%", top: "78%" }}
              onClick={() => {
                soundFx.playSelect();
                triggerTransition(
                  "stone_chariot_entry",
                  { x: 32.0, y: 65.0 },
                  "Returning to Vittala Temple Courtyard",
                  "Returning to the central stone courtyard of the Stone Chariot.",
                  "temple_walk"
                );
              }}
            >
              <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-pulse flex items-center gap-1.5 whitespace-nowrap">
                <span>Return to Courtyard</span>
              </div>
              <div className="w-10 h-10 bg-[#2b2520]/80 border border-[#5a4d3f] rounded-xl flex items-center justify-center shadow">
                <GameIcon name="courtyard" size={18} className="text-[#d6c7b2]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d6c7b2] bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                Courtyard
              </span>
            </div>

            {/* --- PATH TO MAHANAVAMI DIBBA (STAGE 4) --- */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-10 hover:scale-105 transition-transform"
              style={{ left: "15%", top: "78%" }}
              onClick={() => {
                soundFx.playSelect();
                triggerTransition(
                  "mahanavami_celebration",
                  { x: 50.0, y: 66.0 },
                  "Approaching Mahanavami Dibba (Stage 4)",
                  "Ascending toward the multi-tiered royal ceremonial platform as evening shadows stretch across the granite landscape.",
                  "stone_road"
                );
                setStage(4);
                if (!unlockedJournalEntries.includes("mahanavami_dibba_platform")) {
                  dispatch(addJournalEntry("mahanavami_dibba_platform"));
                }
              }}
            >
              {isNearHazaraRamaStage4Exit ? (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <span>Path to Mahanavami Dibba (Stage 4)</span>
                </div>
              ) : (
                <div className="mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] flex items-center gap-1.5 whitespace-nowrap">
                  <span>Mahanavami Dibba</span>
                </div>
              )}
              <div className="w-11 h-11 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-xl flex items-center justify-center shadow-lg">
                <GameIcon name="temple" size={20} className="text-[#d4a359]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#d4a359] bg-[#1a1714]/90 px-2 py-0.5 rounded border border-[#d4a359] mt-1">
                Mahanavami Dibba
              </span>
            </div>
          </>
        )}

        {/* --- STAGE 4 SCENE 1: MAHANAVAMI CELEBRATION HOTSPOTS --- */}
        {scene === "mahanavami_celebration" && (
          <>
            {/* Upper Tier Interaction / Flashba            {/* Imperial Dais Hotspot */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: "42%", top: "78%" }}
            >
              {/* E-prompt tooltip removed per user request */}
              <div className="w-14 h-14 bg-[#3d3328]/90 border-2 border-[#d4a359] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <GameIcon name={isFestivalSceneRestored ? "ledger" : "temple"} size={26} className="text-[#d4a359]" />
              </div>
              <span className="text-[10px] font-serif font-bold text-[#f6ede0] bg-[#1a1714]/85 px-2 py-0.5 rounded border border-[#5a4d3f] mt-1">
                {isFestivalSceneRestored ? "Stone Vault Niche" : "Imperial Dais"}
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


            {/* --- COURTYARD PATROL GUARDS (4 INDEPENDENT SQUADS, NEVER OVERLAPPING) --- */}
            {/* Squad A: Left Courtyard Patrol */}
            <PedestrianNPC id="guard_m1" frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]} path={[{x: 8, y: 76}, {x: 18, y: 76}]} speed={3.0} scale={0.8} loop={true} startDelay={0} />
            <PedestrianNPC id="guard_m2" frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]} path={[{x: 10, y: 74}, {x: 20, y: 74}]} speed={3.0} scale={0.8} loop={true} startDelay={0} />

            {/* Squad B: Lower Left Gateway Patrol */}
            <PedestrianNPC id="guard_m3" frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]} path={[{x: 12, y: 92}, {x: 24, y: 92}]} speed={3.0} scale={0.8} loop={true} startDelay={0} />
            <PedestrianNPC id="guard_m4" frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]} path={[{x: 14, y: 90}, {x: 26, y: 90}]} speed={3.0} scale={0.8} loop={true} startDelay={0} />

            {/* Squad C: Lower Right Gateway Patrol */}
            <PedestrianNPC id="guard_m5" frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]} path={[{x: 74, y: 92}, {x: 86, y: 92}]} speed={3.0} scale={0.8} loop={true} startDelay={0} />
            <PedestrianNPC id="guard_m6" frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]} path={[{x: 76, y: 90}, {x: 88, y: 90}]} speed={3.0} scale={0.8} loop={true} startDelay={0} />

            {/* Squad D: Right Courtyard Patrol */}
            <PedestrianNPC id="guard_m7" frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]} path={[{x: 82, y: 76}, {x: 92, y: 76}]} speed={3.0} scale={0.8} loop={true} startDelay={0} />
            <PedestrianNPC id="guard_m8" frames={["/guard_anim_1.png", "/guard_anim_2.png", "/guard_anim_3.png"]} path={[{x: 84, y: 74}, {x: 94, y: 74}]} speed={3.0} scale={0.8} loop={true} startDelay={0} />

            <audio
              ref={mahanavamiAudioRef}
              id="vijayanagara-music"
              src="/vijayanagara_music.mp3"
              loop
              preload="auto"
              muted={isMusicMuted}
              className="hidden pointer-events-none"
            />
            <PedestrianNPC id="royal_elephant_1" frames={["/royal_elephant_1.png", "/royal_elephant_2.png"]} path={[{x: 5, y: 60}]} speed={0} scale={2.5} circular={true} startDelay={0} animSpeed={800} />
            <PedestrianNPC id="royal_elephant_2" frames={["/royal_elephant_1.png", "/royal_elephant_2.png"]} path={[{x: 26, y: 48}]} speed={0} scale={2.5} circular={true} startDelay={800} animSpeed={800} />
            <PedestrianNPC id="dancer_w1" frames={["/kuchipudi_1.png", "/kuchipudi_2.png", "/kuchipudi_3.png", "/kuchipudi_4.png"]} path={[{x: 82, y: 60}]} speed={0} scale={2.0} circular={true} startDelay={0} animSpeed={400} />
            <PedestrianNPC id="dancer_w2" frames={["/kuchipudi_1.png", "/kuchipudi_2.png", "/kuchipudi_3.png", "/kuchipudi_4.png"]} path={[{x: 88, y: 60}]} speed={0} scale={2.0} circular={true} startDelay={300} animSpeed={400} />

            {/* --- CROWD CITIZENS STANDING DOWN ON THE GROUND FLOOR (LEFT GROUP) --- */}
            <div
              className="absolute z-15 pointer-events-auto cursor-pointer group hover:scale-110 transition-transform duration-200"
              style={{ left: "30.0%", top: "60.0%", transform: "translate(-50%, -100%) scale(1.72)" }}
              title="Click to talk with Scholar Somappa"
              onClick={() => {
                handleCrowdCitizenClick(
                  false,
                  "Scholar Somappa",
                  "Greetings! The grand Mahanavami festival lasts for nine days. Rulers, foreign ambassadors, and merchants travel thousands of leagues to witness our Emperor's grand procession!",
                  "Royal Scholar"
                );
              }}
            >
              <img src="/crowd_citizen_1.png" alt="Scholar Somappa" className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]" />
            </div>

            <div
              className="absolute z-15 pointer-events-auto cursor-pointer group hover:scale-110 transition-transform duration-200"
              style={{ left: "36.0%", top: "60.0%", transform: "translate(-50%, -100%) scale(1.72)" }}
              title="Click to talk with Lady Annapurna"
              onClick={() => {
                handleCrowdCitizenClick(
                  false,
                  "Lady Annapurna",
                  "Look at the magnificent Kuchipudi dancers and war elephants! During this sacred festival, music and dance fill every corner of the capital.",
                  "Festival Noblewoman"
                );
              }}
            >
              <img src="/crowd_citizen_2.png" alt="Lady Annapurna" className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]" />
            </div>

            <div
              className="absolute z-15 pointer-events-auto cursor-pointer group hover:scale-110 transition-transform duration-200"
              style={{ left: "41.0%", top: "60.0%", transform: "translate(-50%, -100%) scale(1.72)" }}
              title="Click to talk with Merchant Devayya"
              onClick={() => {
                handleCrowdCitizenClick(
                  false,
                  "Merchant Devayya",
                  "Our markets thrive under the Emperor's patronage. Gems, gold coins, and spices from across the ocean are traded freely here in Vijayanagara!",
                  "Gem Merchant"
                );
              }}
            >
              <img src="/crowd_citizen_3.png" alt="Merchant Devayya" className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]" />
            </div>

            <div
              className="absolute z-15 pointer-events-auto cursor-pointer group hover:scale-110 transition-transform duration-200"
              style={{ left: "46.0%", top: "60.0%", transform: "translate(-50%, -100%) scale(1.72)" }}
              title="Click to talk with Lady Lakshmi"
              onClick={() => {
                handleCrowdCitizenClick(
                  false,
                  "Lady Lakshmi",
                  "The stepped stone carvings on this Dibba plinth depict continuous stories of army parades, royal hunts, and ancient legends. It is a masterpiece of granite artwork!",
                  "Temple Devotee"
                );
              }}
            >
              <img src="/crowd_citizen_4.png" alt="Lady Lakshmi" className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]" />
            </div>

            {/* --- CROWD CITIZENS STANDING DOWN ON THE GROUND FLOOR (RIGHT GROUP) --- */}
            <div
              className="absolute z-15 pointer-events-auto cursor-pointer group hover:scale-110 transition-transform duration-200"
              style={{ left: "62.0%", top: "57.0%", transform: "translate(-50%, -100%) scale(1.72)" }}
              title="Click to inspect the Suspicious Man with Blue Sneakers"
              onClick={() => {
                handleCrowdCitizenClick(
                  true,
                  "The Sneaker-Wearing Kidnapper",
                  "Wait! How did you notice my modern Nike blue sneakers?! I hid right inside the 1565 Mahanavami festival crowd!",
                  "The Kidnapper (In Disguise)"
                );
              }}
            >
              <img src="/jordan_man.png" alt="Suspicious Man with Blue Sneakers" className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]" />
            </div>

            <div
              className="absolute z-15 pointer-events-auto cursor-pointer group hover:scale-110 transition-transform duration-200"
              style={{ left: "68.0%", top: "57.0%", transform: "translate(-50%, -100%) scale(1.72)" }}
              title="Click to talk with Sage Someshwara"
              onClick={() => {
                handleCrowdCitizenClick(
                  false,
                  "Sage Someshwara",
                  "Greetings, traveler! I am Sage Someshwara. The Emperor Krishnadevaraya has gathered scholars and nobles from all 70 provinces of the kingdom for this grand event.",
                  "Court Sage"
                );
              }}
            >
              <img src="/trad_scholar.png" alt="Sage Someshwara" className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]" />
            </div>

            <div
              className="absolute z-15 pointer-events-auto cursor-pointer group hover:scale-110 transition-transform duration-200"
              style={{ left: "74.0%", top: "57.0%", transform: "translate(-50%, -100%) scale(1.72)" }}
              title="Click to talk with Royal Musician"
              onClick={() => {
                handleCrowdCitizenClick(
                  false,
                  "Royal Musician",
                  "The melodies of the Veena echo across the granite pavilion! Music is the heartbeat of Vijayanagara's eternal culture.",
                  "Court Musician"
                );
              }}
            >
              <img src="/trad_musician.png" alt="Royal Musician" className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]" />
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
            // Adjusted from -100% to -90% to visually lower the sprite so feet touch the actual Y-coordinate line
            transform: "translate(-50%, -90%)",
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
              className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)]"
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
          const isGlowing = (scene === "toymaker_stall" && shoeSequenceState === "genie_activating") ||
                            (scene === "musical_pillars") ||
                            (scene === "stone_chariot_entry");
                            
          const isGenieHinting = scene === "toymaker_stall" && shoeSequenceState === "genie_hint";

          // Move the Genie specifically to the hidden secret location to point it out clearly!
          if (isGlowing || isGenieHinting) {
            if (scene === "toymaker_stall") {
              genieX = 62.0;
              genieY = 58.0; // Directly above Master Kallappa and the toys
            } else if (scene === "musical_pillars") {
              genieX = 50.0;
              genieY = 60.0; // Hovering above center of musical pillars
            } else if (scene === "stone_chariot_entry") {
              genieX = 38.0;
              genieY = 72.0; // Hovering above the Stone Chariot wheels
            }
          }

          // Mode 2: 💥 Clue Alert (Stops once clue is heard or solved)
          const hasHeardThisClue = heardClueScenes.includes(scene);
          const isShaking = isGenieHinting || (!isGlowing && !hasHeardThisClue && (
            (scene === "anegundi_river_crossing" && !hasMetVidyaranya) ||
            (scene === "gem_traders_row" && !hasEncounteredFirstRumor && isNearGemAssessor) ||
            (scene === "musicians_warning" && !hasMusicianWarning) ||
            (scene === "mahanavami_celebration" && !isLedgerAssembled)
          ));

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
                  speechText = (shoeSequenceState === "genie_activating" || shoeSequenceState === "genie_hint" || shoeSequenceState === "completed")
                    ? "Mere akka, the given person we are finding is a time traveler. We have to go in our time machine to find this guy."
                    : hasFirstLedgerFragment
                    ? "You found the first ledger fragment! The merchant hid key records inside these wooden toys."
                    : "Check these wooden Channapatna toys closely! The missing merchant hid a secret clue inside one of them.";
                  customOptions = [
                    { id: 1, text: "How are Channapatna toys made?" },
                    { id: 2, text: "What does the first fragment say?" }
                  ];
                } else if (scene === "stone_chariot_entry" || scene === "musical_pillars") {
                  speechText = scene === "stone_chariot_entry"
                    ? "✨ Did you know? The wheels of this Stone Chariot could once spin! They were reportedly able to rotate, and were fixed in place later to protect the structure. Incredible craftsmanship from 1540 AD!"
                    : isMusicalPillarsComplete
                    ? "Great job! The musical pillars sang their notes and revealed the second fragment. We are close to the truth!"
                    : "✨ Did you know? The musical pillars here can play around 81 different instruments! Each pillar, when struck, produces a unique musical note.";
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
                void playCharacterDialogue({
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

          {/* --- UNCLE COMPANION NPC --- */}
          {scene === "anegundi_river_crossing" && !hasRecruitedHistorian && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-[100%] flex flex-col items-center z-10"
              style={{ left: `${unclePos.x}%`, top: `${unclePos.y}%` }}
            >
              {isNearUncle && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Talk to Friend</span>
                </div>
              )}
              <img
                src="/uncle_companion.png"
                alt="Uncle Companion"
                className="w-20 h-28 object-contain object-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)] cursor-pointer hover:drop-shadow-[0_8px_15px_rgba(212,163,89,0.8)] transition-all"
                style={{
                  transform: `scale(${depthScale})`,
                  imageRendering: "pixelated",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setUncleSpeechText("Hello, I'm Raju, a time traveller from 2026 come here seeking to understand the tragic fall of such a magnificent empire");
                  setUncleOptions([
                    { id: 1, text: "Let us seek the truth together." }
                  ]);
                  if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
                  setShowUncleDialogue(true);
                }}
              />
            </div>
          )}

        {/* --- UNCLE COMPANION FOLLOWER --- */}
        <UncleFollower
          playerPos={playerPos}
          playerFacingLeft={facingLeft}
          isVisible={!isUncleKidnapped && (hasRecruitedHistorian || scene === "hampi_bazaar_entry")}
          onClick={() => {
            setUncleSpeechText("Stay vigilant! We must find out why Ramayya vanished and who those men were!");
            setUncleOptions([{ id: 1, text: "I'll keep looking." }]);
            if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
            setShowUncleDialogue(true);
          }}
        />

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

        {/* --- HUD OVERLAY (Hidden during Battle of Talikota Aftermath Fullscreen) --- */}
        {!showStage4SuccessModal && (
          <VijayanagaraHUD
            stage={stage}
            scene={scene}
            objective={
              isCampaignComplete
                ? "Campaign Complete: Vijayanagara Legacy Preserved across stone and memory."
                : scene === "toymaker_stall" && shoeSequenceState === "completed"
                ? "Travel to another time period and uncover the time traveller's connection to the Vijayanagara Empire."
                : scene === "musical_pillars" && musicalPillarsSequenceState === "completed"
                ? "Ledger I recovered. Continue the investigation."
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
            stage4Timer={stage === 4 && scene === "mahanavami_celebration" && !stage4KidnapperFound ? stage4Timer : null}
            stage4Attempts={stage4Attempts}
          />
        )}

        {/* --- JOURNAL MODAL --- */}
        <JournalModal
          isOpen={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
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
          onClose={() => {
            setShowToyInspectionModal(false);
            if (pendingShoeSequence || (hasFirstLedgerFragment && !hasShoeClue && shoeSequenceState === "idle")) {
              setPendingShoeSequence(false);
              startKallappaShoeSequence();
            }
          }}
          alreadyFoundFragment={hasFirstLedgerFragment}
          onDiscoverFragment={handleToyFragmentDiscovery}
          onSelectJournalToy={handleSelectJournalToy}
          hasJournalToy={hasJournalToy}
        />

        {/* --- TIME COIN REWARD MODAL --- */}
        {showTimeCoinUnlockModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto">
            <audio autoPlay loop src="https://www.myinstants.com/media/sounds/subway-surfers-theme-song.mp3" />
            
            {/* Background Glow Effect */}
            <div className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(212,163,89,0.3)_0%,_transparent_70%)] pointer-events-none animate-pulse"></div>

            <div className="relative w-[460px] bg-gradient-to-b from-[#251f18] via-[#1a1714] to-[#110e0c] border-2 border-[#d4a359] rounded-2xl shadow-[0_0_60px_rgba(212,163,89,0.4)] overflow-hidden flex flex-col items-center p-8 animate-[popIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] z-10">
              <div className="text-xs font-mono font-bold tracking-[0.3em] text-[#d4a359]/80 uppercase mb-1">
                ANCIENT REWARD
              </div>
              <h2 className="text-3xl font-serif font-bold text-[#f5d78e] mb-2 drop-shadow-[0_2px_10px_rgba(212,163,89,0.5)] text-center tracking-wider">
                VARAHA GOLD COIN
              </h2>
              <div className="text-[#8cd98c] font-bold tracking-widest text-sm mb-6 flex items-center gap-2 bg-[#8cd98c]/10 border border-[#8cd98c]/30 px-3.5 py-1 rounded-full shadow-inner">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                UNLOCKED
              </div>

              {/* Nano-generated Varaha Gold Coin */}
              <div className="w-44 h-44 rounded-full border-4 border-[#d4a359] shadow-[0_0_40px_rgba(212,163,89,0.7)] bg-gradient-to-br from-[#d4a359]/30 to-black flex items-center justify-center mb-6 relative group overflow-hidden">
                <div className="absolute inset-0 bg-[#d4a359]/20 rounded-full animate-pulse"></div>
                <img src="/varaha_coin.jpg?v=2" alt="Varaha Gold Coin" className="w-full h-full object-cover z-10 rounded-full drop-shadow-[0_5px_15px_rgba(0,0,0,0.9)] transition-transform duration-500 hover:scale-105" />
                <div className="absolute inset-0 rounded-full border-2 border-white/20 z-20 pointer-events-none"></div>
              </div>

              <div className="w-full bg-[#2b2520]/90 border border-[#5a4d3f] p-4 rounded-xl mb-6 flex items-center justify-between shadow-inner">
                <div>
                  <h3 className="text-[#f6ede0] font-serif font-bold text-base">LEDGER I</h3>
                  <p className="text-[#d6c7b2] text-xs">Second Fragment Recovered</p>
                </div>
                <div className="text-[#8cd98c] font-bold text-xs flex items-center gap-1 bg-[#8cd98c]/15 px-2.5 py-1 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  UNLOCKED
                </div>
              </div>
              
              <button
                className="w-full py-3.5 bg-gradient-to-r from-[#d4a359] via-[#e5b971] to-[#b38645] hover:from-[#e5b971] hover:to-[#c69a57] text-[#141210] font-bold font-serif uppercase tracking-widest rounded-xl shadow-[0_4px_20px_rgba(212,163,89,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                onClick={() => {
                  setShowTimeCoinUnlockModal(false);
                  setMusicalPillarsSequenceState("completed");
                  dispatch(setHasSecondLedgerFragment(true));
                  setIsMusicalPillarsComplete(true);
                  if (!unlockedJournalEntries.includes("musical_pillars_acoustics")) {
                    dispatch(addJournalEntry("musical_pillars_acoustics"));
                  }
                  soundFx.playSelect();
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

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
              dispatch(addJournalEntry("battle_of_talikota"));
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

        {/* --- KIDNAP CUTSCENE --- */}
        {showKidnapCutscene && (
          <div className="fixed inset-0 z-[100] bg-black animate-fadeIn overflow-hidden flex flex-col items-center justify-end pb-20 px-8 text-center">
            <img 
              src="/kidnap_scene.jpg" 
              alt="Kidnap" 
              className="absolute inset-0 w-full h-full object-cover opacity-60" 
            />
            
            {/* Gradient overlay to make text readable at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto w-full">
              <div className="text-[#e5b56a] uppercase tracking-[0.3em] font-mono text-sm font-bold mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                Urgent Warning
                <audio id="kidnap-warning" src="/kidnap_warning_sarvam.wav" onCanPlay={(e) => { e.currentTarget.play().catch(() => {}); }} />
              </div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,1)]">
                While you were busy in your business, your friend was kidnapped!
              </h2>
              <p className="text-[#f6ede0] text-xl mb-12 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                Rescue him before he gets killed!
              </p>
              
              <button
                onClick={() => {
                  setShowKidnapCutscene(false);
                  stopNarration();
                  dispatch(setIsUncleKidnapped(true));
                  
                  void playNarration(
                    "Find your friend. Ask the traders out here, they might give you a clue.",
                    { audioUrl: "/post_kidnap_hint_sarvam.wav" }
                  );
                }}
                className="bg-[#f0c05a] hover:bg-[#ffcf6a] text-black font-sans font-bold px-12 py-3 rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all cursor-pointer text-sm uppercase tracking-wider hover:scale-105"
              >
                I Must Find Him
              </button>
            </div>
          </div>
        )}

        {/* --- HAZARA RAMA BAS-RELIEF CINEMATIC --- */}
        <TempleWallInspectionController
          isActive={showHazaraRamaModal}
          onComplete={() => setShowHazaraRamaModal(false)}
          setCameraTransform={setCameraTransform}
        />

        {/* --- TEMPLE MUSICIAN RAGHAVENDRA DIALOGUE MODAL --- */}
        {showRaghavendraDialogue && scene === "stone_chariot_entry" && (
          <DialoguePanel
            sceneId="stone_chariot_entry"
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
                  dispatch(setStage3Complete(true));
                  setShowStage3VictoryModal(true);
                }
              } else {
                setRaghavendraTopic(opt.id as any);
                if (opt.id === "warning") {
                  setHasMusicianWarning(true);
                  if (hasSecondLedgerFragment) {
                    dispatch(setStage3Complete(true));
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

        {/* --- GUARD DIALOGUE MODAL --- */}
        {showGuardDialogue && scene === "toymaker_stall" && (
          <DialoguePanel
            sceneId="toymaker_stall"
            currentSceneId={scene}
            characterName="Royal Guard"
            characterTitle="EMPIRE SECURITY"
            dialogueText="Move along, traveler. The streets must be kept clear for the King's inspectors. Stay away from restricted areas."
            options={[
              { id: 1, text: "I will stay out of trouble." }
            ]}
            onOptionSelect={() => setShowGuardDialogue(false)}
            onClose={() => setShowGuardDialogue(false)}
          />
        )}

        {/* --- BAZAAR MERCHANT DIALOGUE MODAL --- */}
        {showMerchantDialogue && scene === "hampi_bazaar_entry" && (
          <DialoguePanel
            sceneId="hampi_bazaar_entry"
            currentSceneId={scene}
            characterName={activeMerchantId === 1 ? "Spice Merchant" : activeMerchantId === 2 ? "Jewelry Merchant" : "Fabric Merchant"}
            characterTitle="Bazaar Trader"
            characterId="merchant"
            dialogueText={merchantSpeechText}
            isSpeaking={true}
            showInput={false}
            options={merchantOptions}
            preventAiOnOptionSelect={true}
            audioUrl={merchantAudioUrl}
            onOptionSelect={(opt) => {
              if (opt.id === 1) {
                const response = "Don't disturb me during business";
                setMerchantSpeechText(response);
                setMerchantOptions([{ id: 2, text: "(Leave)" }]);
                setMerchantAudioUrl(`/merchant_${activeMerchantId}_response.mp3`);
              } else if (opt.id === 2) {
                setShowMerchantDialogue(false);
                stopNarration();
                if (typeof (soundFx as any).playDialogueClose === "function") (soundFx as any).playDialogueClose();
              }
            }}
            onClose={() => {
              setShowMerchantDialogue(false);
              stopNarration();
              if (typeof (soundFx as any).playDialogueClose === "function") (soundFx as any).playDialogueClose();
            }}
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
            dialogueText="Bom dia, senhor! I sailed from Lisbon for the spices and gems of this land. Here, diamonds are sold like vegetables!\n\nBut listen, my friend. A stranger dragged an older man towards Toy Street. If he is your friend, hurry!"
            audioUrl="/senhor_duarte_hint.wav"
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
                    setShowOarUnlockModal(true);
                    
                    soundFx.playItemUnlock();
                  }}
                  className="bg-gradient-to-r from-[#8b6528] to-[#d4a359] hover:from-[#a07430] hover:to-[#e5b56a] text-[#141210] font-serif font-bold px-8 py-3 rounded-xl shadow-lg transition-all cursor-pointer text-xs uppercase tracking-wider"
                >
                  Accept Blessing & Complete Stage 1 ✦
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- SHOE UNLOCK MODAL --- */}
        {showShoeUnlockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn" style={{ zIndex: 9999 }}>
            <div className="absolute inset-0 bg-white animate-flashWhite z-10" />
            
            <div className="relative aspect-video w-[90vw] max-w-5xl rounded-2xl border-4 border-[#d4a359] overflow-hidden shadow-[0_0_80px_rgba(212,163,89,0.7)] flex flex-col items-center justify-center z-20">
              {/* Background Burst */}
              <img 
                src="/unlock_bg.png" 
                alt="Unlock Burst" 
                className="absolute inset-0 w-full h-full object-cover opacity-90 scale-150 pointer-events-none" 
              />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] uppercase tracking-widest text-center">
                  Clue Discovered: The Time Traveller's Shoe
                </h2>
                <img 
                  src="/sneaker_clue.png" 
                  alt="Modern Sneaker Shoe" 
                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] hover:scale-110 transition-transform duration-500 mb-8"
                />
                
                {/* Continue Button */}
                <button
                  onClick={() => {
                    setShowShoeUnlockModal(false);
                    // Move to genie activating
                    setShoeSequenceState("genie_activating");
                    if (typeof soundFx.playSelect === "function") soundFx.playSelect();
                    
                    setTimeout(() => {
                       setShoeSequenceState("genie_hint");
                       // Automatically trigger Genie Dialogue instead of invisible narrator
                       setJollySpeechText("Mere akka, the given person we are finding is a time traveler. We have to go in our time machine to find this guy.");
                       setJollyOptions([
                         { id: 1, text: "Let's find the time machine!" }
                       ]);
                       setShowJollyDialogue(true);
                       
                       stopAllCharacterVoice();
                       void playCharacterDialogue({
                          character: "jolly",
                          text: "Mere akka, the given person we are finding is a time traveler. We have to go in our time machine to find this guy.",
                          onEnd: () => {}
                       });
                       
                       setTimeout(() => {
                           setShoeSequenceState("completed");
                       }, 7000);
                    }, 500);
                  }}
                  className="bg-white/10 hover:bg-white/20 border-2 border-white/50 text-white font-serif font-bold px-12 py-4 rounded-full shadow-lg transition-all cursor-pointer text-lg tracking-[0.2em] backdrop-blur-sm"
                >
                  CONTINUE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- OAR UNLOCK MODAL --- */}
        {showOarUnlockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn" style={{ zIndex: 9999 }}>
            <div className="absolute inset-0 bg-white animate-flashWhite z-10" />
            
            <div className="relative aspect-video w-[90vw] max-w-5xl rounded-2xl border-4 border-[#d4a359] overflow-hidden shadow-[0_0_80px_rgba(212,163,89,0.7)] flex flex-col items-center justify-center z-20">
              {/* Background Burst */}
              <img 
                src="/unlock_bg.png" 
                alt="Unlock Burst" 
                className="absolute inset-0 w-full h-full object-cover opacity-90 scale-150 pointer-events-none" 
              />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8 bg-black/20">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] uppercase tracking-widest text-center">
                  Unlocked the wooden oar to row to Hampi
                </h2>
                <img 
                  src="/wooden_oar.png" 
                  alt="Wooden Oar" 
                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] hover:scale-110 transition-transform duration-500 mb-8" 
                />
                
                {/* Continue Button */}
                <button
                  onClick={() => {
                    setShowOarUnlockModal(false);
                    setShowStage1VictoryModal(true);
                  }}
                  className="bg-white/10 hover:bg-white/20 border-2 border-white/50 text-white font-serif font-bold px-12 py-4 rounded-full shadow-lg transition-all cursor-pointer text-lg tracking-[0.2em] backdrop-blur-sm"
                >
                  CONTINUE
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
                      dispatch(addJournalEntry("hampi_bazaar_trade"));
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
                      dispatch(addJournalEntry("stone_chariot_garuda"));
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
                      dispatch(addJournalEntry("mahanavami_dibba_platform"));
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
                  // setStage3Countdown(120); // Disabled patrol caught logic
                  setPlayerPos({ x: 35.0, y: 70.0 });
                }}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-lg border-2 border-red-900 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* --- STAGE 4 KIDNAPPER CHECKPOINT FAIL MODAL --- */}
        {showStage4FailModal && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto">
            <div className="bg-[#1a0f0f] border-2 border-red-600 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.6)] text-center animate-scaleUp">
              <div className="w-16 h-16 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-600 animate-pulse">
                <span className="text-3xl">⚔️</span>
              </div>
              <h3 className="text-2xl font-serif font-black text-red-500 mb-2 uppercase tracking-wide">
                CHECKPOINT FAILED
              </h3>
              <p className="text-sm font-serif text-red-200/90 leading-relaxed mb-6">
                {stage4Timer === 0
                  ? "Time expired! The Deccan Sultanate forces arrived before you could spot the kidnapper."
                  : "You ran out of chances! The kidnapper escaped into the festival crowd."}
              </p>
              <button
                onClick={handleRestartStage4Checkpoint}
                className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-3.5 px-6 rounded-xl border border-red-400 shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <span>🔄 Restart Checkpoint</span>
              </button>
            </div>
          </div>
        )}

        {/* --- STAGE 4 KIDNAPPER SUCCESS / BATTLE OF TALIKOTA FULLSCREEN AFTERMATH SCREEN --- */}
        {showStage4SuccessModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black pointer-events-auto select-none animate-fadeIn">
            {/* Fullscreen background artwork */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src="/battle_of_talikota.jpg"
                alt="Battle of Talikota"
                className="w-full h-full object-cover object-center filter brightness-[0.50] contrast-[1.15] scale-105 transition-transform duration-1000"
              />
              {/* Dark atmospheric vignette & radial lighting overlay matching Rusticated reference UI */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.75)_100%)]" />
            </div>

            {/* Central Narrative Card */}
            <div className="relative z-10 max-w-2xl w-full text-center px-4 flex flex-col items-center">
              {/* Category / Subtitle */}
              <span className="text-xs uppercase tracking-[0.3em] font-mono text-[#f59e0b] font-bold mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                THE AFTERMATH • 1565 AD
              </span>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-white tracking-tight mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                The Fall of Vijayanagara
              </h2>

              {/* Main Narrative Text */}
              <p className="text-sm sm:text-base md:text-lg font-serif text-[#f0e6d6] leading-relaxed mb-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] max-w-xl">
                You saved your friend from getting killed, leaving the jealous kidnapper behind to perish in the Battle of Talikota—a catastrophic war where such a massive empire was destroyed because generals turned traitor, enemy cannons tore through the army, and King Rama Raya was beheaded on the battlefield.
              </p>

              {/* Golden Action Button matching 3rd reference image */}
              <button
                onClick={() => {
                  if (typeof (soundFx as any).playKeyboardClick === "function") (soundFx as any).playKeyboardClick();
                  stopNarration();
                  setShowStage4SuccessModal(false);
                  dispatch(setStage4Complete(true));
                  triggerTransition(
                    "closing_reflection",
                    { x: 35.0, y: 68.0 },
                    "Sacred Pushkarani - Final Reflection",
                    "Reflecting at the sacred Pushkarani on the golden era of Vijayanagara...",
                    "temple_walk"
                  );
                }}
                className="bg-[#f59e0b] hover:bg-[#fbbf24] text-black font-serif font-bold text-xs sm:text-sm tracking-wider uppercase py-3 px-8 rounded-md shadow-[0_4px_20px_rgba(245,158,11,0.5)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.8)] transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Continue to Reflection
              </button>
            </div>
          </div>
        )}

        {/* --- STAGE 4 CROWD CITIZEN DIALOGUE MODAL --- */}
        {activeCitizenDialogue && scene === "mahanavami_celebration" && (
          <DialoguePanel
            sceneId="mahanavami_celebration"
            currentSceneId={scene}
            characterName={activeCitizenDialogue.name}
            characterTitle={activeCitizenDialogue.title}
            dialogueText={activeCitizenDialogue.text}
            isSpeaking={true}
            showInput={false}
            options={[{ id: 1, text: "Continue Search" }]}
            onOptionSelect={() => {
              if (typeof soundFx.playSelect === "function") soundFx.playSelect();
              setActiveCitizenDialogue(null);
            }}
            onClose={() => {
              setActiveCitizenDialogue(null);
            }}
          />
        )}

        {/* --- UNCLE DIALOGUE MODAL --- */}
        {showUncleDialogue && scene === "anegundi_river_crossing" && (
          <DialoguePanel
            sceneId="anegundi_river_crossing"
            currentSceneId={scene}
            characterName="Raju"
            characterTitle="Your Loyal Friend"
            characterId="uncle"
            dialogueText={uncleSpeechText || "Greetings! I am the local historian."}
            isSpeaking={true}
            showInput={true}
            options={uncleOptions.length > 0 ? uncleOptions : [{ id: 1, text: "Tell me more." }]}
            onOptionSelect={(opt) => {
              if (opt.id === 1) {
                dispatch(setHasRecruitedHistorian(true));
                setShowUncleDialogue(false);
              }
            }}
            onClose={() => setShowUncleDialogue(false)}
          />
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
    setShowUncleDialogue(false);
              setHeardClueScenes((prev) => (prev.includes(scene) ? prev : [...prev, scene]));
            }}
            onClose={() => {
              stopAllCharacterVoice();
              setShowJollyDialogue(false);
    setShowUncleDialogue(false);
              setHeardClueScenes((prev) => (prev.includes(scene) ? prev : [...prev, scene]));
            }}
          />
        )}

        {/* --- NARRATOR SUBTITLE OVERLAY (Hidden only on the Battle of Talikota Aftermath Screen) --- */}
        {!showStage4SuccessModal && <NarratorSubtitle />}

        {/* Stone Chariot Entry specific YouTube Background Music (2 mins max) */}
        {scene === "stone_chariot_entry" && (
          <iframe
            width="0"
            height="0"
            src="https://www.youtube.com/embed/Y-rFA7Sio-c?autoplay=1&end=120&controls=0"
            title="Stone Chariot Music"
            allow="autoplay"
            style={{ display: "none" }}
          />
        )}

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
// Force Webpack Recompile
