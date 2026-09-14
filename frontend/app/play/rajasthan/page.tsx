"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Timer, AlertTriangle, RotateCcw } from "lucide-react";
import DialoguePanel from "../../components/DialoguePanel";
import ChauparGame from "./components/ChauparGame";
import VijayStambhCarvingSystem from "./components/VijayStambhCarvingSystem";
import BadalMahalLampGame from "./components/BadalMahalLampGame";
import { playCharacterDialogue, stopCharacterDialogue } from "../../../services/characterVoiceService";
import { playNarration, stopNarration } from "../../../services/narratorService";
import { soundFx } from "../../../services/soundService";

export type RajasthanStage = 1 | 2 | 3 | 4;

export type RajasthanSceneType =
  // Stage 1: Chittorgarh Fort
  | "ram_pol"
  | "inner_courtyard"
  | "courtyard_passage"
  | "vijay_stambh"
  | "vijay_stambh_interior"
  | "jauhar_passage"
  | "jauhar_kund"
  | "desert_outskirts"
  // Stage 2: Kumbhalgarh Fort
  | "kumbhalgarh_gate"
  | "kumbhalgarh_interior_stairs"
  | "kumbhalgarh_great_wall"
  | "kumbhalgarh_zigzag_gates"
  | "badal_mahal_courtyard"
  | "badal_mahal_interior"
  | "badal_mahal_terrace"
  // Stage 3: Kuldhara Ghost Village
  | "kuldhara_gate"
  | "chiefs_house"
  | "treasury"
  | "well"
  | "village_square"
  // Stage 4: Bhangarh Fort (Final Stage)
  | "bhangarh_gate"
  | "gopinath_temple"
  | "palace_ruins"
  | "bhangarh_chase";

interface DeductionState {
  ornamentChoice: string | null;
  ledgerChoice: string | null;
  suppliesChoice: string | null;
}

export default function RajasthanGameScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stage, setStage] = useState<RajasthanStage>(1);
  const [scene, setScene] = useState<RajasthanSceneType>("ram_pol");

  // Player position (percentage based)
  const [playerPos, setPlayerPos] = useState({ x: 50.0, y: 88.0 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);

  // --- UNIFIED MUGHAL HUD & AUDIO CONTROL STATE ---
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  // --- CHITTORGARH FORT THEME MUSIC REF ---
  const chittorgarhAudioRef = useRef<HTMLAudioElement | null>(null);
  // --- BHANGARH KILA THEME MUSIC REF ---
  const bhangarhAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- NOW PLAYING SONG BANNER STATE (Image 1: 3s Display & Click-to-Mute) ---
  const [showSongBanner, setShowSongBanner] = useState<boolean>(true);
  const songBannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getStageSongTitle = useCallback((stg: RajasthanStage) => {
    switch (stg) {
      case 1:
        return "Rajasthani Folk (Kamaicha & Sarangi)";
      case 2:
        return "Echoes of Kumbhalgarh";
      case 3:
        return "Sands of Kuldhara";
      case 4:
        return "Fear Files Theme Song";
      default:
        return "Rajasthani Folk (Kamaicha & Sarangi)";
    }
  }, []);

  const triggerSongBanner = useCallback(() => {
    setShowSongBanner(true);
    if (songBannerTimerRef.current) clearTimeout(songBannerTimerRef.current);
    songBannerTimerRef.current = setTimeout(() => {
      setShowSongBanner(false);
    }, 3000);
  }, []);

  // Display song pill for first 3 seconds on mount and whenever stage changes
  useEffect(() => {
    triggerSongBanner();
    return () => {
      if (songBannerTimerRef.current) clearTimeout(songBannerTimerRef.current);
    };
  }, [stage, triggerSongBanner]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- CLUE ALERTS TRACKING (GENIE STOPS SHAKING ONCE CLUE IS GIVEN & NEVER REPEATS) ---
  const [givenClueAlerts, setGivenClueAlerts] = useState<{ [clueKey: string]: boolean }>({});

  const markClueGiven = useCallback((clueKey: string) => {
    setGivenClueAlerts((prev) => {
      if (prev[clueKey]) return prev;
      return { ...prev, [clueKey]: true };
    });
  }, []);

  // --- STAGE 1 STATE (Chittorgarh - Chaupar Game & Dialogue) ---
  // --- BUZURG CHACHA & JOLLY DIALOGUE VOICE URL STATE ---
  const [showChachaDialogue, setShowChachaDialogue] = useState(false);
  const [chachaSpeechText, setChachaSpeechText] = useState("");
  const [chachaOptions, setChachaOptions] = useState<Array<{ id: number | string; text: string }>>([]);
  const [chachaAudioUrl, setChachaAudioUrl] = useState<string | undefined>(undefined);

  // --- JOLLY BHAI GENIE COMPANION STATE ---
  const [showJollyDialogue, setShowJollyDialogue] = useState(false);
  const [jollySpeechText, setJollySpeechText] = useState("");
  const [jollyOptions, setJollyOptions] = useState<Array<{ id: number | string; text: string }>>([]);
  const [jollyStatusBadge, setJollyStatusBadge] = useState<"normal" | "glowing" | "shaking" | "doubt">("normal");
  const [jollyAudioUrl, setJollyAudioUrl] = useState<string | undefined>(undefined);
  const [hasHeardKuldharaSecretLore, setHasHeardKuldharaSecretLore] = useState(false);

  // --- RESTART CONFIRMATION STATE ---
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);

  // --- BUZURG CHACHA & VIJAY STAMBH DIALOGUE TRACKING ---
  const [hasPlayedChachaIntro, setHasPlayedChachaIntro] = useState(false);
  const hasPlayedChachaIntroRef = useRef(false);
  const hasPlayedVijayStambhIntroRef = useRef(false);
  const hasPlayedBadalMahalIntroRef = useRef(false);

  const triggerBuzurgChachaDialogue = (isAutoIntro: boolean = false) => {
    if (!hasPlayedChachaIntroRef.current) {
      hasPlayedChachaIntroRef.current = true;
      setHasPlayedChachaIntro(true);
      try {
        localStorage.setItem("rajasthan_chacha_intro_played", "true");
      } catch (e) { }

      const speechText = "Khamma Ghani, young traveller! Welcome to the royal courtyard of Chittorgarh. I am Buzurg Chacha, keeper of ancient Rajput tales. Before you proceed on your quest through Rajasthan, you must play the royal game of Chaupar with me! Roll the pasa dice, test your strategy, and prove your patience!";
      setChachaAudioUrl("/buzurg_chacha_intro.wav");
      setChachaSpeechText(speechText);
      setChachaOptions([
        { id: 1, text: "Khamma Ghani, Chacha-ji! Teach me the rules of Chaupar and let's play!" },
        { id: 2, text: "Tell me about the history of Chaupar and Chittorgarh Fort." },
        { id: 3, text: "I am ready to roll the pasa dice!" }
      ]);
      setShowChachaDialogue(true);
    } else {
      if (isAutoIntro) return; // Never repeat intro automatically
      const returnSpeech = "Khamma Ghani, young traveller! Are you ready to roll the wooden pasa dice and challenge me in royal Chaupar?";
      setChachaAudioUrl(undefined);
      setChachaSpeechText(returnSpeech);
      setChachaOptions([
        { id: 1, text: "I am ready! Let us roll the pasa dice!" },
        { id: 2, text: "Tell me about the history of Chaupar and Chittorgarh Fort." },
        { id: 4, text: "I will explore the courtyard first." }
      ]);
      setShowChachaDialogue(true);
    }
  };

  const triggerJollyDialogue = (overrideMode?: string) => {
    let speech = "Mere aaka! I am Jolly Bhai, your time-traveling genie companion. We are in the legendary realm of Rajputana! What wisdom do you seek?";
    let options: Array<{ id: number | string; text: string }> = [
      { id: 1, text: "Tell me about this historic fort." },
      { id: 2, text: "What should our next move be?" }
    ];
    let customAudioUrl: string | undefined = undefined;
    let badge: "normal" | "glowing" | "shaking" | "doubt" = "normal";

    if (overrideMode === "shaking") {
      badge = "shaking";
      if (scene === "chiefs_house") {
        markClueGiven("kuldhara_ornament");
        speech = "💥 Quick, mere aaka! A vital historical clue is hidden inside this Chief's Haveli! Inspect the alcove to discover the bridal ornament before time runs out!";
        options = [
          { id: 31, text: "Where should I search for clues?" },
          { id: 32, text: "I am investigating now!" }
        ];
        customAudioUrl = "/jolly_kuldhara_clues_hint.wav";
      } else if (scene === "treasury") {
        markClueGiven("kuldhara_ledger");
        speech = "💥 Mere aaka, look sharp! The merchant's iron vault holds the torn tax ledger of Diwan Salim Singh! Press [E] to investigate!";
        options = [
          { id: 31, text: "Where should I search for clues?" },
          { id: 32, text: "I will find the ledger!" }
        ];
        customAudioUrl = "/jolly_kuldhara_clues_hint.wav";
      } else if (scene === "well") {
        markClueGiven("kuldhara_well");
        speech = "💥 Look down the dry stone steps! Intact desert water pots were abandoned right here! Press [E] to inspect them before time runs out!";
        options = [
          { id: 31, text: "Why were the water pots left behind?" },
          { id: 32, text: "Searching the stepwell now!" }
        ];
        customAudioUrl = "/jolly_kuldhara_clues_hint.wav";
      } else if (scene === "bhangarh_gate") {
        markClueGiven("bhangarh_kathputli");
        speech = "💥 Mere aaka! A vital relic lies right here: the Kathputli Sandstone Fragment! Collect it before time runs out!";
        options = [
          { id: 31, text: "What is this sandstone fragment?" },
          { id: 32, text: "Collecting it now!" }
        ];
      } else if (scene === "gopinath_temple") {
        markClueGiven("bhangarh_seal");
        speech = "💥 Look inside the ancient temple shadows! The Paliwal Ledger Seal is resting right here! Collect it before the moon rises!";
        options = [
          { id: 31, text: "What is this ledger seal?" },
          { id: 32, text: "Collecting it now!" }
        ];
      } else if (scene === "palace_ruins") {
        markClueGiven("bhangarh_verse");
        speech = "💥 Beneath the broken palace arches! The Wanderer's Verse Medallion awaits you! Collect it swiftly!";
        options = [
          { id: 31, text: "What verse is etched here?" },
          { id: 32, text: "Retrieving the medallion!" }
        ];
      } else {
        speech = "💥 Quick, mere aaka! A vital clue is waiting right here! Search this chamber before time runs out!";
        options = [
          { id: 31, text: "Where should I search?" },
          { id: 32, text: "Understood!" }
        ];
        customAudioUrl = "/jolly_kuldhara_clues_hint.wav";
      }
    } else if (overrideMode === "doubt") {
      badge = "doubt";
      speech = "🤔 Mere aaka... something doesn't add up! Popular folklore blames an overnight curse, but what truly drove 84 prosperous villages away? We must assemble the clues to uncover the historical reality!";
      options = [
        { id: 30, text: "Why did the villagers go away from here?" },
        { id: 32, text: "Let us assemble the evidence!" }
      ];
      customAudioUrl = "/jolly_kuldhara_why_abandoned.wav";
    } else if (overrideMode === "glowing" || (stage === 3 && scene === "kuldhara_gate" && !hasHeardKuldharaSecretLore)) {
      badge = "glowing";
      setHasHeardKuldharaSecretLore(true);
      speech = "The biggest mystery is that Kuldhara wasn't alone. Rajasthan Tourism's popular legend says Kuldhara and 83 nearby villages were abandoned together, making the story much bigger than one supposedly haunted village";
      options = [
        { id: 30, text: "Why did the villagers go away from here?" },
        { id: 31, text: "Where should I search for the 3 clues?" },
        { id: 32, text: "Understood! Let's explore Kuldhara." }
      ];
      customAudioUrl = "/kuldhara_84_villages_genie.wav";
    } else if (stage === 1) {
      badge = "normal";
      speech = "Mere aaka! We have arrived at the mighty fort of Chittorgarh in Rajputana! Look ahead, Buzurg Chacha is waiting by the ancient Chaupar board. Go speak with him and play Chaupar to prove your mettle!";
      options = [
        { id: 10, text: "How do I beat Buzurg Chacha at Chaupar?" },
        { id: 11, text: "Tell me about the victory tower Vijay Stambh." },
        { id: 12, text: "What is the solemn history of Jauhar Kund?" }
      ];
      customAudioUrl = "/jolly_rajasthan_intro.wav";
    } else if (stage === 2) {
      badge = "normal";
      speech = "Mere aaka! This is Kumbhalgarh Fort, possessing the second-longest continuous wall in the world after the Great Wall of China! Explore the ramparts and find the passage up to Badal Mahal.";
      options = [
        { id: 20, text: "Tell me about the Great Wall of Kumbhalgarh." },
        { id: 21, text: "Who was Maharana Kumbha?" }
      ];
    } else if (stage === 3) {
      badge = "normal";
      speech = "Mere aaka! We are inside the abandoned havelis of Kuldhara. Search the Chief's Haveli, the Treasury, and the Stepwell to uncover the 3 historical artifacts before the desert sand covers them!";
      options = [
        { id: 30, text: "Why did the villagers go away from here?" },
        { id: 31, text: "Where should I search for the 3 clues?" },
        { id: 32, text: "Understood! Let's explore Kuldhara." }
      ];
      customAudioUrl = "/jolly_kuldhara_clues_hint.wav";
    } else if (stage === 4) {
      badge = "glowing";
      speech = "Mere aaka! Welcome to Bhangarh Fort, established in the 16th century at the foot of the Aravali hills. It was once a thriving township with over 10,000 residents and grand stone temples! What historical facts of Bhangarh Fort would you like to know?";
      options = [
        { id: 43, text: "Who built Bhangarh Fort and when?" },
        { id: 44, text: "What temples and architecture exist in Bhangarh?" },
        { id: 45, text: "Why does the ASI prohibit entry between sunset and sunrise?" },
        { id: 40, text: "Why is Bhangarh Palace haunted?" }
      ];
    }

    setJollyStatusBadge(badge);
    if (badge === "shaking") {
      setTimeout(() => {
        setJollyStatusBadge("normal");
      }, 3000);
    }
    setJollyAudioUrl(customAudioUrl);
    setJollySpeechText(speech);
    setJollyOptions(options);
    setShowJollyDialogue(true);
  };

  // Auto-play Buzurg Chacha dialogue when first entering inner_courtyard (exactly once)
  const chachaTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (scene === "inner_courtyard" && !hasPlayedChachaIntroRef.current) {
      hasPlayedChachaIntroRef.current = true;
      setHasPlayedChachaIntro(true);
      try {
        localStorage.setItem("rajasthan_chacha_intro_played", "true");
      } catch (e) { }

      if (chachaTimerRef.current) clearTimeout(chachaTimerRef.current);
      chachaTimerRef.current = setTimeout(() => {
        triggerBuzurgChachaDialogue(true);
      }, 500);
    }
    return () => {
      if (chachaTimerRef.current) {
        clearTimeout(chachaTimerRef.current);
        chachaTimerRef.current = null;
      }
    };
  }, [scene]);

  // Auto-play Jolly Bhai canonical intro dialogue when entering vijay_stambh_interior (exactly once)
  useEffect(() => {
    if (scene === "vijay_stambh_interior" && !hasPlayedVijayStambhIntroRef.current) {
      hasPlayedVijayStambhIntroRef.current = true;
      setTimeout(() => {
        setJollySpeechText("Mere aaka, some secrets are hiding in these stones… use the Shilpa Drishti and see what the eyes cannot.");
        setJollyStatusBadge("glowing");
        setJollyOptions([
          { id: 99, text: "I will examine the stones with Shilpa Drishti." }
        ]);
        setShowJollyDialogue(true);
      }, 400);
    }
  }, [scene]);

  // Auto-play Jolly Bhai intro dialogue when entering badal_mahal_interior (exactly once)
  useEffect(() => {
    if (scene === "badal_mahal_interior" && !hasPlayedBadalMahalIntroRef.current) {
      hasPlayedBadalMahalIntroRef.current = true;
      setTimeout(() => {
        setJollySpeechText("Mere aaka, these royal lamps have gone dark. Light all three and bring Badal Mahal back to life!");
        setJollyStatusBadge("glowing");
        setJollyOptions([
          { id: 99, text: "I will light the 3 royal lamps!" }
        ]);
        setShowJollyDialogue(true);
      }, 400);
    }
  }, [scene]);

  const [showChauparGame, setShowChauparGame] = useState(false);
  const [chauparRound, setChauparRound] = useState(1);
  const [chauparScore, setChauparScore] = useState({ player: 0, chacha: 0 });
  const [chauparMessage, setChauparMessage] = useState("Roll the long wooden pasa dice to challenge Buzurg Chacha in ancient Chaupar!");
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [diceRoll1, setDiceRoll1] = useState(3);
  const [diceRoll2, setDiceRoll2] = useState(4);
  const [playerPawnPos, setPlayerPawnPos] = useState(0); // 0 to 12 along board track
  const [chachaPawnPos, setChachaPawnPos] = useState(0); // 0 to 12 along board track
  const [isPawnMoving, setIsPawnMoving] = useState(false);
  const [showVijayStambhModal, setShowVijayStambhModal] = useState(false);
  const [showJauharModal, setShowJauharModal] = useState(false);

  // --- STAGE 2 -> STAGE 3 TRANSITION (Elephant Journey) ---
  const [isElephantTravelling, setIsElephantTravelling] = useState(false);
  const [elephantTravelPhase, setElephantTravelPhase] = useState<1 | 2 | 3 | 4>(1);

  // --- STAGE 3 STATE (Kuldhara 2-Min Clue Challenge) ---
  const [kuldharaTimer, setKuldharaTimer] = useState(120); // 2-minute countdown timer (120s)
  const [showKuldharaTimeOutModal, setShowKuldharaTimeOutModal] = useState(false);
  const [hasPillar83Inspected, setHasPillar83Inspected] = useState(false);
  const [hasWeddingOrnament, setHasWeddingOrnament] = useState(false);
  const [hasTaxLedger, setHasTaxLedger] = useState(false);
  const [hasWaterPotsSupplies, setHasWaterPotsSupplies] = useState(false);
  const [showPillar83Modal, setShowPillar83Modal] = useState(false);
  const [showHaveliOrnamentModal, setShowHaveliOrnamentModal] = useState(false);
  const [showTaxLedgerModal, setShowTaxLedgerModal] = useState(false);
  const [showStepwellModal, setShowStepwellModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showStage3CompleteModal, setShowStage3CompleteModal] = useState(false);
  const [deductionState, setDeductionState] = useState<DeductionState>({
    ornamentChoice: null,
    ledgerChoice: null,
    suppliesChoice: null,
  });
  const [deductionFeedback, setDeductionFeedback] = useState<string | null>(null);
  const [selectedDeductionClue, setSelectedDeductionClue] = useState<"ornament" | "ledger" | "supplies" | null>("ornament");

  // Restart Kuldhara Challenge Handler
  const handleRestartKuldhara = useCallback(() => {
    setShowKuldharaTimeOutModal(false);
    stopNarration();
    setShowKuldharaNarratorBanner(false);
    setHasKuldharaNarrationFinished(false);
    hasPlayedKuldharaNarrationRef.current = false;
    setScene("kuldhara_gate");
    setPlayerPos({ x: 50.0, y: 88.0 });
    setKuldharaTimer(120);
    setHasWeddingOrnament(false);
    setHasTaxLedger(false);
    setHasWaterPotsSupplies(false);
    setDeductionState({ ornamentChoice: null, ledgerChoice: null, suppliesChoice: null });
  }, []);

  // --- STAGE 3 -> STAGE 4 TRANSITION (Nightfall Caravan) ---
  const [isBhangarhTravelling, setIsBhangarhTravelling] = useState(false);
  const [bhangarhTravelPhase, setBhangarhTravelPhase] = useState<1 | 2 | 3 | 4>(1);

  // --- STAGE 4 STATE (Bhangarh Fort 1-Min Relic Challenge) ---
  const [bhangarhTimer, setBhangarhTimer] = useState(60); // 1-minute countdown timer (60s)
  const [showBhangarhTimeOutModal, setShowBhangarhTimeOutModal] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [moonriseTimer, setMoonriseTimer] = useState(180);
  const [isMoonriseActive, setIsMoonriseActive] = useState(false);

  // Stage 4 Narrator Warning Banner & Clue Auto-Touch Trigger Flags
  const [showBhangarhNarratorBanner, setShowBhangarhNarratorBanner] = useState(false);
  const hasPlayedBhangarhNarrationRef = useRef(false);
  const hasTriggeredClue1Ref = useRef(false);
  const hasTriggeredClue2Ref = useRef(false);
  const hasTriggeredClue3Ref = useRef(false);

  // Stage 4 Hidden Relic Artifacts
  const [hasKathputliFragment, setHasKathputliFragment] = useState(false); // Relic 1: Kathputli Sandstone Fragment
  const [hasPaliwalSeal, setHasPaliwalSeal] = useState(false); // Relic 2: Paliwal Horse Ledger Seal
  const [hasWanderersVerse, setHasWanderersVerse] = useState(false); // Relic 3: Wanderer's Verse Antelope Medallion
  const [hasBhangarhChronicleClue, setHasBhangarhChronicleClue] = useState(false);
  const [hasTempleArchitectureClue, setHasTempleArchitectureClue] = useState(false);
  const [hasFamineRecordClue, setHasFamineRecordClue] = useState(false);
  const [hasFolkloreDistinctionClue, setHasFolkloreDistinctionClue] = useState(false);

  // Stage 4 Modals
  const [showKathputliModal, setShowKathputliModal] = useState(false);
  const [showPaliwalSealModal, setShowPaliwalSealModal] = useState(false);
  const [showWanderersVerseModal, setShowWanderersVerseModal] = useState(false);
  const [showGateFragmentPuzzleModal, setShowGateFragmentPuzzleModal] = useState(false);
  const [showTorchlightRestorationModal, setShowTorchlightRestorationModal] = useState(false);
  const [showRuinsClueTrailModal, setShowRuinsClueTrailModal] = useState(false);
  const [showFolkloreClassifierModal, setShowFolkloreClassifierModal] = useState(false);
  const [showFinalEvidenceBoardModal, setShowFinalEvidenceBoardModal] = useState(false);
  const [showGrandCampaignCompleteModal, setShowGrandCampaignCompleteModal] = useState(false);

  // Restart Bhangarh Challenge Handler
  const handleRestartBhangarhFort = useCallback(() => {
    stopNarration();
    stopCharacterDialogue();
    setShowBhangarhTimeOutModal(false);
    setScene("bhangarh_gate");
    setPlayerPos({ x: 50.0, y: 86.0 });
    setBhangarhTimer(60);
    setHasKathputliFragment(false);
    setHasPaliwalSeal(false);
    setHasWanderersVerse(false);
    setHasShield(false);
    setShowShieldModal(false);
    hasPlayedBhangarhNarrationRef.current = false;
    hasTriggeredClue1Ref.current = false;
    hasTriggeredClue2Ref.current = false;
    hasTriggeredClue3Ref.current = false;
  }, []);

  // Puzzle 1 State: Gate Inscription Fragments Sequence
  const [gateFragmentsOrder, setGateFragmentsOrder] = useState<number[]>([]);
  const [gatePuzzleFeedback, setGatePuzzleFeedback] = useState<string | null>(null);

  // Puzzle 2 State: Torchlight Symbol Matching
  const [templeSymbolMatches, setTempleSymbolMatches] = useState<{
    gajalakshmi: string | null;
    kalasa: string | null;
    kirthimukha: string | null;
  }>({ gajalakshmi: null, kalasa: null, kirthimukha: null });
  const [templePuzzleFeedback, setTemplePuzzleFeedback] = useState<string | null>(null);

  // Puzzle 4 State: Folklore vs Evidence Sorting
  const [folkloreClassification, setFolkloreClassification] = useState<Record<string, "evidence" | "folklore" | null>>({
    statement1: null,
    statement2: null,
    statement3: null,
    statement4: null,
  });
  const [folkloreFeedback, setFolkloreFeedback] = useState<string | null>(null);

  // Puzzle 5 State: Final Evidence Board
  const [finalBoardMatches, setFinalBoardMatches] = useState<{
    origin: string | null;
    decline: string | null;
    legends: string | null;
  }>({ origin: null, decline: null, legends: null });
  const [finalBoardFeedback, setFinalBoardFeedback] = useState<string | null>(null);

  const [isCampaignComplete, setIsCampaignComplete] = useState(false);

  // --- BHANGARH KILA THEME MUSIC (FEAR FILES THEME SONG) ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (stage === 4 && !isBhangarhTravelling && !isCampaignComplete) {
      if (!bhangarhAudioRef.current) {
        const audio = new Audio("/bhangarh_theme.webm");
        audio.loop = true;
        audio.volume = 0.20; // Lowered comfortable ambient volume
        audio.onended = () => {
          audio.currentTime = 0;
          audio.play().catch(() => { });
        };
        bhangarhAudioRef.current = audio;
      }

      const audio = bhangarhAudioRef.current;
      audio.volume = 0.20; // Ensure lowered volume
      if (isMusicMuted) {
        audio.pause();
      } else {
        audio.play().catch((err) => {
          // Autoplay policy: will trigger on player's first click or movement key
          console.log("Bhangarh theme autoplay pending player gesture:", err?.message || err);
        });
      }

      const triggerOnGesture = () => {
        if (stage === 4 && !isMusicMuted && bhangarhAudioRef.current && bhangarhAudioRef.current.paused) {
          bhangarhAudioRef.current.play().catch(() => { });
        }
      };

      window.addEventListener("click", triggerOnGesture, { once: true });
      window.addEventListener("keydown", triggerOnGesture, { once: true });

      return () => {
        window.removeEventListener("click", triggerOnGesture);
        window.removeEventListener("keydown", triggerOnGesture);
      };
    } else {
      if (bhangarhAudioRef.current) {
        bhangarhAudioRef.current.pause();
        bhangarhAudioRef.current.currentTime = 0;
      }
    }
  }, [stage, isBhangarhTravelling, isCampaignComplete, isMusicMuted]);

  // --- CHITTORGARH FORT THEME MUSIC (KAMAICHA & SARANGI RAJASTHANI INSTRUMENTAL) ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (stage === 1 && !isTransitioning && !isCampaignComplete) {
      if (!chittorgarhAudioRef.current) {
        const audio = new Audio("/chittorgarh_theme.mp3");
        audio.loop = true;
        audio.volume = 0.18; // Low ambient background volume
        audio.onended = () => {
          audio.currentTime = 0;
          audio.play().catch(() => { });
        };
        chittorgarhAudioRef.current = audio;
      }

      const audio = chittorgarhAudioRef.current;
      audio.volume = 0.18; // Ensure low volume
      if (isMusicMuted) {
        audio.pause();
      } else {
        audio.play().catch((err) => {
          console.log("Chittorgarh theme autoplay pending player gesture:", err?.message || err);
        });
      }

      const triggerOnGesture = () => {
        if (stage === 1 && !isMusicMuted && chittorgarhAudioRef.current && chittorgarhAudioRef.current.paused) {
          chittorgarhAudioRef.current.play().catch(() => { });
        }
      };

      window.addEventListener("click", triggerOnGesture, { once: true });
      window.addEventListener("keydown", triggerOnGesture, { once: true });

      return () => {
        window.removeEventListener("click", triggerOnGesture);
        window.removeEventListener("keydown", triggerOnGesture);
      };
    } else {
      if (chittorgarhAudioRef.current) {
        chittorgarhAudioRef.current.pause();
        chittorgarhAudioRef.current.currentTime = 0;
      }
    }
  }, [stage, isTransitioning, isCampaignComplete, isMusicMuted]);

  // Pause all background music on unmount
  useEffect(() => {
    return () => {
      if (chittorgarhAudioRef.current) {
        chittorgarhAudioRef.current.pause();
        chittorgarhAudioRef.current.currentTime = 0;
      }
      if (bhangarhAudioRef.current) {
        bhangarhAudioRef.current.pause();
        bhangarhAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const router = useRouter();

  // Dynamic Clue Count Calculation per Stage
  const cluesFound =
    stage === 4
      ? (hasKathputliFragment ? 1 : 0) +
      (hasPaliwalSeal ? 1 : 0) +
      (hasWanderersVerse ? 1 : 0)
      : (hasWeddingOrnament ? 1 : 0) + (hasTaxLedger ? 1 : 0) + (hasWaterPotsSupplies ? 1 : 0);

  const maxClues = 3;

  // Reset Game Handler
  const handleResetGame = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("rajasthan_game_state");
      localStorage.removeItem("rajasthan_chacha_intro_played");
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
    setIsTransitioning(true);
    stopCharacterDialogue();
    stopNarration();
    if (chittorgarhAudioRef.current) {
      chittorgarhAudioRef.current.pause();
      chittorgarhAudioRef.current.currentTime = 0;
    }
    if (bhangarhAudioRef.current) {
      bhangarhAudioRef.current.pause();
      bhangarhAudioRef.current.currentTime = 0;
    }
    setShowKuldharaNarratorBanner(false);
    setHasKuldharaNarrationFinished(false);
    hasPlayedKuldharaNarrationRef.current = false;
    setTimeout(() => {
      hasPlayedChachaIntroRef.current = false;
      setHasPlayedChachaIntro(false);
      setStage(1);
      setScene("ram_pol");
      setPlayerPos({ x: 50.0, y: 88.0 });
      setFacingLeft(false);
      setShowChachaDialogue(false);
      setShowJollyDialogue(false);
      setShowChauparGame(false);
      setShowVijayStambhModal(false);
      setShowJauharModal(false);
      setIsElephantTravelling(false);
      setIsBhangarhTravelling(false);
      setHasPillar83Inspected(false);
      setHasWeddingOrnament(false);
      setHasTaxLedger(false);
      setHasWaterPotsSupplies(false);
      setShowPillar83Modal(false);
      setShowHaveliOrnamentModal(false);
      setShowTaxLedgerModal(false);
      setShowStepwellModal(false);
      setShowDeductionModal(false);
      setShowStage3CompleteModal(false);
      // Stage 4 Reset
      setBhangarhTimer(60);
      setShowBhangarhNarratorBanner(false);
      hasPlayedBhangarhNarrationRef.current = false;
      hasTriggeredClue1Ref.current = false;
      hasTriggeredClue2Ref.current = false;
      hasTriggeredClue3Ref.current = false;
      setHasKathputliFragment(false);
      setHasPaliwalSeal(false);
      setHasWanderersVerse(false);
      setHasShield(false);
      setShowShieldModal(false);
      setShowBhangarhTimeOutModal(false);
      setMoonriseTimer(180);
      setIsMoonriseActive(false);
      setHasBhangarhChronicleClue(false);
      setHasTempleArchitectureClue(false);
      setHasFamineRecordClue(false);
      setHasFolkloreDistinctionClue(false);
      setShowGateFragmentPuzzleModal(false);
      setShowTorchlightRestorationModal(false);
      setShowRuinsClueTrailModal(false);
      setShowFolkloreClassifierModal(false);
      setShowFinalEvidenceBoardModal(false);
      setShowGrandCampaignCompleteModal(false);
      setIsCampaignComplete(false);
      setIsTransitioning(false);
    }, 300);
  };

  // Restore saved state from URL or localStorage on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlScene = urlParams.get("scene") as RajasthanSceneType | null;
        const urlStage = urlParams.get("stage");
        const saved = localStorage.getItem("rajasthan_game_state");

        if (urlStage) {
          const parsedStage = parseInt(urlStage, 10);
          if ([1, 2, 3, 4].includes(parsedStage)) {
            setStage(parsedStage as RajasthanStage);
          }
        }
        if (urlScene) {
          setScene(urlScene);
        } else if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.stage) setStage(parsed.stage);
            if (parsed.scene) setScene(parsed.scene);
            if (parsed.playerPos) setPlayerPos(parsed.playerPos);
            if (parsed.hasPillar83Inspected) setHasPillar83Inspected(parsed.hasPillar83Inspected);
            if (parsed.hasWeddingOrnament) setHasWeddingOrnament(parsed.hasWeddingOrnament);
            if (parsed.hasTaxLedger) setHasTaxLedger(parsed.hasTaxLedger);
            if (parsed.hasWaterPotsSupplies) setHasWaterPotsSupplies(parsed.hasWaterPotsSupplies);
            if (parsed.hasBhangarhChronicleClue) setHasBhangarhChronicleClue(parsed.hasBhangarhChronicleClue);
            if (parsed.hasTempleArchitectureClue) setHasTempleArchitectureClue(parsed.hasTempleArchitectureClue);
            if (parsed.hasFamineRecordClue) setHasFamineRecordClue(parsed.hasFamineRecordClue);
            if (parsed.hasFolkloreDistinctionClue) setHasFolkloreDistinctionClue(parsed.hasFolkloreDistinctionClue);
            if (parsed.isCampaignComplete) setIsCampaignComplete(parsed.isCampaignComplete);
          } catch (e) {
            console.error("Failed to load saved state", e);
          }
        }

        const chachaIntroSaved = localStorage.getItem("rajasthan_chacha_intro_played");
        if (chachaIntroSaved === "true") {
          hasPlayedChachaIntroRef.current = true;
          setHasPlayedChachaIntro(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save game state to localStorage & sync URL search param
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      try {
        localStorage.setItem(
          "rajasthan_game_state",
          JSON.stringify({
            stage,
            scene,
            playerPos,
            cluesFound,
            hasPillar83Inspected,
            hasWeddingOrnament,
            hasTaxLedger,
            hasWaterPotsSupplies,
            hasBhangarhChronicleClue,
            hasTempleArchitectureClue,
            hasFamineRecordClue,
            hasFolkloreDistinctionClue,
            isCampaignComplete,
          })
        );
        const newUrl = `${window.location.pathname}?stage=${stage}&scene=${scene}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      } catch (e) {
        console.error("Failed to save game state", e);
      }
    }
  }, [
    stage,
    scene,
    playerPos,
    cluesFound,
    hasPillar83Inspected,
    hasWeddingOrnament,
    hasTaxLedger,
    hasWaterPotsSupplies,
    hasBhangarhChronicleClue,
    hasTempleArchitectureClue,
    hasFamineRecordClue,
    hasFolkloreDistinctionClue,
    isCampaignComplete,
    isLoading,
  ]);

  // Loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // --- KULDHARA HISTORICAL NARRATOR (SARVAM AI BULBUL) ---
  const [showKuldharaNarratorBanner, setShowKuldharaNarratorBanner] = useState(false);
  const [hasKuldharaNarrationFinished, setHasKuldharaNarrationFinished] = useState(false);
  const kuldharaNarratorSentence = "You have arrived at Kuldhara, the abandoned desert village where the villagers vanished overnight and no one knows the true mystery of that. Explore the silent ruins and find the clues that leads to the finding of that in stipulated time!";
  const hasPlayedKuldharaNarrationRef = useRef(false);

  useEffect(() => {
    if (!isLoading && stage === 3 && scene === "kuldhara_gate" && !hasPlayedKuldharaNarrationRef.current) {
      hasPlayedKuldharaNarrationRef.current = true;
      setShowKuldharaNarratorBanner(true);
      setHasKuldharaNarrationFinished(false);
      stopCharacterDialogue();
      playNarration(kuldharaNarratorSentence, {
        audioUrl: "/kuldhara_narration.wav",
        speaker: "ratan",
        pace: 0.88,
        language_code: "en-IN",
        onEnd: () => {
          setTimeout(() => {
            setShowKuldharaNarratorBanner(false);
            setHasKuldharaNarrationFinished(true);
          }, 1500);
        }
      });

      // Fallback safety in case audio playback is blocked by browser or ends early
      const fallbackTimer = setTimeout(() => {
        setShowKuldharaNarratorBanner(false);
        setHasKuldharaNarrationFinished(true);
      }, 10000);

      return () => {
        clearTimeout(fallbackTimer);
      };
    }
  }, [isLoading, stage, scene]);

  // --- KULDHARA 2-MINUTE CHALLENGE TIMER (Stage 3) ---
  useEffect(() => {
    const allCluesFound = hasWeddingOrnament && hasTaxLedger && hasWaterPotsSupplies;
    // When clues are found, mystery modal is shown, timeout occurred, narrator banner is active, or Jolly dialogue is open, freeze timer
    if (stage !== 3 || showStage3CompleteModal || allCluesFound || showKuldharaNarratorBanner || showKuldharaTimeOutModal || showJollyDialogue) return;

    const interval = setInterval(() => {
      setKuldharaTimer((prev) => {
        if (showStage3CompleteModal || allCluesFound || showKuldharaTimeOutModal || showJollyDialogue) return prev;
        if (prev <= 1) {
          setShowKuldharaTimeOutModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, showStage3CompleteModal, hasWeddingOrnament, hasTaxLedger, hasWaterPotsSupplies, showKuldharaNarratorBanner, showKuldharaTimeOutModal, showJollyDialogue]);

  // Play Sarvam AI narrator when Kuldhara mystery is solved & Stage 3 Complete Card opens
  useEffect(() => {
    if (showStage3CompleteModal) {
      stopCharacterDialogue();
      stopNarration();
      const solvedNarration = "Good job beta! You have found all the clues. The real story of Kuldhara is that the villagers did not vanish by magic. A cruel minister, Salim Singh, imposed crushing taxes, while their desert water dried up. To protect their honor, all eighty-four villages packed their wealth and evacuated overnight, cursing the barren land so no one would ever return!";
      playNarration(solvedNarration, {
        audioUrl: "/kuldhara_solved_narration.wav",
        speaker: "ratan",
        pace: 0.88,
        language_code: "en-IN",
      });
    }
  }, [showStage3CompleteModal]);

  // Play Sarvam AI narrator when Kuldhara 2-minute challenge timeout occurs
  useEffect(() => {
    if (showKuldharaTimeOutModal) {
      stopCharacterDialogue();
      stopNarration();
      const timeoutNarration = "Time has expired! You failed to uncover all the evidence clues before the desert patrol caught you trespassing. You are cast out into the sands! You must start from the entrance of Kuldhara and search again.";
      playNarration(timeoutNarration, {
        audioUrl: "/kuldhara_timeout_narration.wav",
        speaker: "ratan",
        pace: 0.88,
        language_code: "en-IN",
      });
    }
  }, [showKuldharaTimeOutModal]);

  // --- BHANGARH FORT NARRATOR INTRO (SARVAM AI RATAN) ---
  const bhangarhNarratorSentence = "Find the given clue in the Bhangarh Fort: why is the given palace haunted, before the evil spirits attack you!";

  useEffect(() => {
    if (!isLoading && stage === 4 && scene === "bhangarh_gate" && !hasPlayedBhangarhNarrationRef.current) {
      hasPlayedBhangarhNarrationRef.current = true;
      setShowBhangarhNarratorBanner(true);
      stopCharacterDialogue();
      playNarration(bhangarhNarratorSentence, {
        speaker: "ratan",
        pace: 0.90,
        language_code: "en-IN",
        onEnd: () => {
          setTimeout(() => {
            setShowBhangarhNarratorBanner(false);
          }, 1500);
        }
      });

      const fallbackTimer = setTimeout(() => {
        setShowBhangarhNarratorBanner(false);
      }, 10000);

      return () => {
        clearTimeout(fallbackTimer);
      };
    }
  }, [isLoading, stage, scene]);

  // --- BHANGARH 1-MINUTE EVIL SPIRITS COUNTDOWN TIMER (Stage 4) ---
  useEffect(() => {
    const allRelicsFound = hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse;
    if (
      stage !== 4 ||
      isBhangarhTravelling ||
      isCampaignComplete ||
      allRelicsFound ||
      showBhangarhTimeOutModal ||
      showBhangarhNarratorBanner ||
      showJollyDialogue ||
      showShieldModal ||
      showGrandCampaignCompleteModal
    ) return;

    const interval = setInterval(() => {
      setBhangarhTimer((prev) => {
        if (showBhangarhTimeOutModal || allRelicsFound) return prev;
        if (prev <= 1) {
          setShowBhangarhTimeOutModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    stage,
    isBhangarhTravelling,
    isCampaignComplete,
    hasKathputliFragment,
    hasPaliwalSeal,
    hasWanderersVerse,
    showBhangarhTimeOutModal,
    showBhangarhNarratorBanner,
    showJollyDialogue,
    showShieldModal,
    showGrandCampaignCompleteModal,
  ]);

  // Voice narration when Bhangarh 1-minute challenge timeout occurs (Evil Spirits Attack)
  useEffect(() => {
    if (showBhangarhTimeOutModal) {
      stopCharacterDialogue();
      stopNarration();
      const timeoutNarration = "Time has expired! The malevolent evil spirits of Bhangarh Fort have emerged from the darkness and attacked you! You must re-enter the ruins and uncover the hidden clues before the shadows consume you!";
      playNarration(timeoutNarration, {
        speaker: "ratan",
        pace: 0.90,
        language_code: "en-IN",
      });
    }
  }, [showBhangarhTimeOutModal]);

  // Voice narration when Bhangarh challenge is won (Curse Legend & Royal Shield Revealed - Screen 1)
  useEffect(() => {
    if (showShieldModal) {
      stopCharacterDialogue();
      stopNarration();
      const victoryNarration = "Having uncovered all hidden relics, the fateful mystery of why Bhangarh is believed to be haunted is revealed! According to historic folklore, Tantrik Singhia, a master of black magic, was desperately obsessed with the peerless beauty of Princess Ratnavati of Bhangarh. In secret, he enchanted a vial of scented oil with a dark love spell so she would surrender herself to him. Discerning the sinister sorcery, the astute princess cast the vial away onto a massive boulder. The bewitched rock was drawn to the tantrik, rolling down the hill and crushing Singhia beneath its immense weight! With his dying breath, the vengeful sorcerer cursed Bhangarh that every palace roof would crumble, destruction would follow, and no soul would ever live in peace. A year later, a catastrophic battle and the devastating Chalisa Famine of 1783 ruined the township, causing it to be deserted forever. To this day, the legend holds that the roofless palace and desolate walls are haunted by the trapped, restless spirits of the tantrik and fallen townsfolk!";
      playNarration(victoryNarration, {
        speaker: "ratan",
        pace: 0.90,
        language_code: "en-IN",
      });
      return () => {
        stopNarration();
      };
    }
  }, [showShieldModal]);

  // Voice narration when Grand Rajasthan Campaign Complete modal opens (Screen 2)
  useEffect(() => {
    if (showGrandCampaignCompleteModal) {
      stopCharacterDialogue();
      stopNarration();
      const campaignCompleteNarration = "Congratulations! You have completed the Rajasthan campaign.";
      playNarration(campaignCompleteNarration, {
        speaker: "ratan",
        pace: 0.90,
        language_code: "en-IN",
      });
      return () => {
        stopNarration();
      };
    }
  }, [showGrandCampaignCompleteModal]);

  // Automatically trigger Royal Shield modal when all 3 clues are discovered
  useEffect(() => {
    if (
      stage === 4 &&
      hasKathputliFragment &&
      hasPaliwalSeal &&
      hasWanderersVerse &&
      !showKathputliModal &&
      !showPaliwalSealModal &&
      !showWanderersVerseModal &&
      !showShieldModal &&
      !isCampaignComplete
    ) {
      setHasShield(true);
      setShowShieldModal(true);
    }
  }, [
    stage,
    hasKathputliFragment,
    hasPaliwalSeal,
    hasWanderersVerse,
    showKathputliModal,
    showPaliwalSealModal,
    showWanderersVerseModal,
    showShieldModal,
    isCampaignComplete,
  ]);

  // --- BHANGARH CLUES AUTOMATIC TOUCH TRIGGERS ---
  useEffect(() => {
    if (stage !== 4 || showShieldModal || showGrandCampaignCompleteModal || isCampaignComplete) return;

    // Clue 1: Kathputli Fragment tiny fallen on far-left ground in bhangarh_gate
    if (
      scene === "bhangarh_gate" &&
      !hasKathputliFragment &&
      !hasTriggeredClue1Ref.current &&
      playerPos.x >= 12.0 && playerPos.x <= 24.0 &&
      playerPos.y >= 74.0 && playerPos.y <= 90.0
    ) {
      hasTriggeredClue1Ref.current = true;
      markClueGiven("bhangarh_kathputli");
      soundFx.playClueChime();
      setHasKathputliFragment(true);
      setShowKathputliModal(true);
      stopNarration();
      playNarration("You have unlocked the first clue! The Kathputli Sandstone Fragment reveals the secrets of the royal court!", {
        speaker: "ratan",
        pace: 0.90,
        language_code: "en-IN",
      });
    }

    // Clue 2: Paliwal Ledger Seal tiny fallen on the dark stone steps in gopinath_temple
    if (
      scene === "gopinath_temple" &&
      !hasPaliwalSeal &&
      !hasTriggeredClue2Ref.current &&
      playerPos.x >= 75.0 && playerPos.x <= 90.0 &&
      playerPos.y >= 66.0 && playerPos.y <= 82.0
    ) {
      hasTriggeredClue2Ref.current = true;
      markClueGiven("bhangarh_seal");
      soundFx.playClueChime();
      setHasPaliwalSeal(true);
      setShowPaliwalSealModal(true);
      stopNarration();
      playNarration("You have unlocked the second clue! The Paliwal Ledger Seal sheds light on the trade and wealth of Bhangarh!", {
        speaker: "ratan",
        pace: 0.90,
        language_code: "en-IN",
      });
    }

    // Clue 3: Wanderer's Verse Medallion tiny fallen in cracked rubble on upper-left in palace_ruins
    if (
      scene === "palace_ruins" &&
      !hasWanderersVerse &&
      !hasTriggeredClue3Ref.current &&
      playerPos.x >= 13.0 && playerPos.x <= 25.0 &&
      playerPos.y >= 54.0 && playerPos.y <= 70.0
    ) {
      hasTriggeredClue3Ref.current = true;
      markClueGiven("bhangarh_verse");
      soundFx.playClueChime();
      setHasWanderersVerse(true);
      setShowWanderersVerseModal(true);
      stopNarration();
      playNarration("You have unlocked the third clue! The Wanderer's Verse Medallion uncovers the fateful curse of the palace ruins!", {
        speaker: "ratan",
        pace: 0.90,
        language_code: "en-IN",
      });
    }
  }, [stage, scene, playerPos, hasKathputliFragment, hasPaliwalSeal, hasWanderersVerse, markClueGiven]);

  // --- ELEPHANT JOURNEY SEQUENCE (Stage 2 -> Stage 3) ---
  const startElephantJourney = useCallback(() => {
    setIsElephantTravelling(true);
    setElephantTravelPhase(1);

    const p2 = setTimeout(() => setElephantTravelPhase(2), 2000);
    const p3 = setTimeout(() => setElephantTravelPhase(3), 4200);
    const p4 = setTimeout(() => setElephantTravelPhase(4), 6400);

    const fin = setTimeout(() => {
      setStage(3);
      setScene("kuldhara_gate");
      setPlayerPos({ x: 50.0, y: 88.0 });
      setIsElephantTravelling(false);
    }, 8600);

    return () => {
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(p4);
      clearTimeout(fin);
    };
  }, []);

  // --- BHANGARH NIGHTFALL CARAVAN JOURNEY (Stage 3 -> Stage 4) ---
  const startBhangarhJourney = useCallback(() => {
    stopNarration();
    setShowKuldharaNarratorBanner(false);
    setShowStage3CompleteModal(false);
    setIsBhangarhTravelling(true);
    setBhangarhTravelPhase(1);

    const p2 = setTimeout(() => setBhangarhTravelPhase(2), 2200);
    const p3 = setTimeout(() => setBhangarhTravelPhase(3), 4400);
    const p4 = setTimeout(() => setBhangarhTravelPhase(4), 6600);

    const fin = setTimeout(() => {
      setStage(4);
      setScene("bhangarh_gate");
      setPlayerPos({ x: 50.0, y: 88.0 });
      setIsBhangarhTravelling(false);
      setBhangarhTimer(60);
      hasPlayedBhangarhNarrationRef.current = false;
      hasTriggeredClue1Ref.current = false;
      hasTriggeredClue2Ref.current = false;
      hasTriggeredClue3Ref.current = false;
      setIsMoonriseActive(true);
      setMoonriseTimer(180);
    }, 8800);

    return () => {
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(p4);
      clearTimeout(fin);
    };
  }, []);

  // --- PROXIMITY TRIGGERS ---
  // Stage 1 Triggers
  const isNearRamPolDoor = scene === "ram_pol" && playerPos.x >= 56.0 && playerPos.x <= 74.0 && playerPos.y >= 78.0 && playerPos.y <= 94.0;
  const isNearChacha = scene === "inner_courtyard" && playerPos.x >= 15.0 && playerPos.x <= 38.0 && playerPos.y >= 58.0 && playerPos.y <= 85.0;
  const isNearCourtyardStairsTop = scene === "inner_courtyard" && playerPos.x >= 72.0 && playerPos.x <= 90.0 && playerPos.y >= 42.0 && playerPos.y <= 56.0;
  const isNearCourtyardExit = scene === "inner_courtyard" && playerPos.x >= 38.0 && playerPos.x <= 62.0 && playerPos.y >= 78.0 && playerPos.y <= 94.0;
  const isNearVijayStambhDoor = scene === "vijay_stambh" && playerPos.x >= 32.0 && playerPos.x <= 48.0 && playerPos.y >= 68.0 && playerPos.y <= 84.0;
  const isNearVijayStambhExit = scene === "vijay_stambh" && playerPos.x >= 38.0 && playerPos.x <= 62.0 && playerPos.y >= 78.0 && playerPos.y <= 94.0;
  const isNearJauharPath = scene === "vijay_stambh" && playerPos.x >= 64.0 && playerPos.x <= 84.0 && playerPos.y >= 68.0 && playerPos.y <= 84.0;
  const isNearJauharKundDoor = scene === "jauhar_passage" && playerPos.y <= 78.0;
  const isNearPassageBottomDoor = scene === "jauhar_passage" && playerPos.y >= 82.0;
  const isNearJauharPavilionStairs = scene === "jauhar_kund" && playerPos.x >= 32.0 && playerPos.x <= 56.0 && playerPos.y <= 64.0;
  const isNearJauharDesertExit = scene === "jauhar_kund" && playerPos.x <= 24.0 && playerPos.y >= 66.0;
  const isNearDesertPalaceGate = scene === "desert_outskirts" && playerPos.x >= 74.0 && playerPos.y <= 82.0;
  const isNearCamel = scene === "desert_outskirts" && playerPos.x >= 18.0 && playerPos.x <= 38.0 && playerPos.y >= 68.0 && playerPos.y <= 88.0;

  // Stage 2 Triggers
  const isNearKumbhalgarhGateDoor = scene === "kumbhalgarh_gate" && playerPos.x >= 20.0 && playerPos.x <= 36.0 && playerPos.y <= 74.0;
  const isNearKumbhalgarhInteriorExit = scene === "kumbhalgarh_interior_stairs" && playerPos.x <= 26.0 && playerPos.y >= 78.0;
  const isNearKumbhalgarhStairsTop = scene === "kumbhalgarh_interior_stairs" && playerPos.x >= 66.0 && playerPos.y <= 62.0;
  const isNearGreatWallStairs = scene === "kumbhalgarh_great_wall" && playerPos.y >= 84.0;
  const isNearWallEndZigzag = scene === "kumbhalgarh_great_wall" && playerPos.y <= 46.0;
  const isNearZigzagLowerExit = scene === "kumbhalgarh_zigzag_gates" && playerPos.y >= 88.0;
  const isNearZigzagUpperGate = scene === "kumbhalgarh_zigzag_gates" && playerPos.y <= 60.0;
  const isNearCourtyardColonnadeDoor = scene === "badal_mahal_courtyard" && ((playerPos.x >= 22.0 && playerPos.x <= 36.0 && playerPos.y <= 80.0) || (playerPos.x >= 38.0 && playerPos.x <= 62.0 && playerPos.y <= 62.0));
  const isNearCourtyardExitZigzag = scene === "badal_mahal_courtyard" && playerPos.y >= 88.0;
  const isNearBadalMahalInteriorExit = scene === "badal_mahal_interior" && playerPos.x <= 36.0 && playerPos.y <= 85.0;
  const isNearBadalMahalTerraceDoor = scene === "badal_mahal_interior" && (playerPos.x >= 74.0 || playerPos.y >= 88.0);
  const isNearBadalMahalTerraceExit = scene === "badal_mahal_terrace" && playerPos.y >= 76.0;
  const isNearTerraceElephant = scene === "badal_mahal_terrace" && playerPos.x >= 42.0;

  // Stage 3 Triggers (Kuldhara)
  const isNearPillar83 = scene === "kuldhara_gate" && playerPos.x >= 55.0;
  const isNearGateVillagePath = scene === "kuldhara_gate" && playerPos.y <= 62.0;
  const isNearHaveliOrnament = scene === "chiefs_house" && playerPos.x >= 54.0 && playerPos.y <= 78.0;
  const isNearHaveliTreasuryDoor = scene === "chiefs_house" && playerPos.y <= 62.0;
  const isNearHaveliGateExit = scene === "chiefs_house" && playerPos.y >= 80.0;
  const isNearTaxLedger = scene === "treasury" && playerPos.x >= 34.0 && playerPos.x <= 74.0 && playerPos.y <= 76.0;
  const isNearTreasuryWellDoor = scene === "treasury" && playerPos.x >= 68.0;
  const isNearTreasuryHaveliExit = scene === "treasury" && (playerPos.y >= 78.0 || playerPos.x <= 28.0);
  const isNearStepwellPots = scene === "well" && playerPos.x <= 55.0 && playerPos.y >= 65.0 && playerPos.y <= 84.0;
  const isNearStepwellSquareDoor = scene === "well" && playerPos.x >= 68.0;
  const isNearStepwellTreasuryExit = scene === "well" && (playerPos.x <= 32.0 || playerPos.y >= 82.0);
  const isNearChhatriDeduction = scene === "village_square" && playerPos.x >= 28.0 && playerPos.x <= 72.0 && playerPos.y >= 55.0 && playerPos.y <= 88.0;
  const isNearSquareWellExit = scene === "village_square" && playerPos.x <= 30.0;

  // --- STAGE 4 (BHANGARH FORT 1-MIN CHALLENGE) PROXIMITY TRIGGERS ---
  // Scene 1: Bhangarh Gate (Clue 1 tiny fallen on far-left ground)
  const isNearKathputliFragment = scene === "bhangarh_gate" && !hasKathputliFragment && playerPos.x >= 12.0 && playerPos.x <= 24.0 && playerPos.y >= 74.0 && playerPos.y <= 90.0;
  const isNearBhangarhGateMarker = scene === "bhangarh_gate" && playerPos.x >= 52.0 && playerPos.y >= 60.0;
  const isNearBhangarhGateArch = scene === "bhangarh_gate" && playerPos.y <= 78.0;

  // Scene 2: Gopinath Temple / Royal Baoli (Clue 2 tiny fallen on dark stone steps)
  const isNearPaliwalSeal = scene === "gopinath_temple" && !hasPaliwalSeal && playerPos.x >= 75.0 && playerPos.x <= 90.0 && playerPos.y >= 66.0 && playerPos.y <= 82.0;
  const isNearTempleSanctuary = scene === "gopinath_temple" && playerPos.x <= 54.0 && playerPos.y <= 75.0;
  const isNearTemplePalaceDoor = scene === "gopinath_temple" && playerPos.y <= 82.0;
  const isNearTempleGateExit = scene === "gopinath_temple" && playerPos.y >= 75.0;

  // Scene 3: Bhangarh Palace Ruins (Clue 3 tiny fallen in upper-left rubble)
  const isNearWanderersVerse = scene === "palace_ruins" && !hasWanderersVerse && playerPos.x >= 13.0 && playerPos.x <= 25.0 && playerPos.y >= 54.0 && playerPos.y <= 70.0;
  const isNearPalaceStratum = scene === "palace_ruins" && playerPos.x <= 40.0 && playerPos.y >= 65.0; // Point A: 1783 CE famine stratum
  const isNearFolkloreBoard = scene === "palace_ruins" && playerPos.x >= 65.0 && playerPos.y >= 65.0; // Point B: Folklore vs Evidence
  const isNearFinalEvidenceBoard = scene === "palace_ruins" && playerPos.y <= 88.0 && hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse;
  const isNearPalaceTempleExit = scene === "palace_ruins" && playerPos.y >= 75.0;

  // Scene 4: Bhangarh Chase Escape
  const isNearChaseGateExit = scene === "bhangarh_chase" && playerPos.x >= 68.0 && playerPos.y <= 65.0;

  // --- CLUE ALERTS AUTO-STOP EFFECT (GENIE STOPS SHAKING AFTER 3 SECONDS AND DOES NOT REPEAT) ---
  useEffect(() => {
    let clueKey: string | null = null;
    if (isNearHaveliOrnament && !hasWeddingOrnament && !givenClueAlerts["kuldhara_ornament"]) {
      clueKey = "kuldhara_ornament";
    } else if (isNearTaxLedger && !hasTaxLedger && !givenClueAlerts["kuldhara_ledger"]) {
      clueKey = "kuldhara_ledger";
    } else if (isNearStepwellPots && !hasWaterPotsSupplies && !givenClueAlerts["kuldhara_well"]) {
      clueKey = "kuldhara_well";
    } else if (stage === 4 && isNearKathputliFragment && !hasKathputliFragment && !givenClueAlerts["bhangarh_kathputli"]) {
      clueKey = "bhangarh_kathputli";
    } else if (stage === 4 && isNearPaliwalSeal && !hasPaliwalSeal && !givenClueAlerts["bhangarh_seal"]) {
      clueKey = "bhangarh_seal";
    } else if (stage === 4 && isNearWanderersVerse && !hasWanderersVerse && !givenClueAlerts["bhangarh_verse"]) {
      clueKey = "bhangarh_verse";
    }

    if (clueKey) {
      const timer = setTimeout(() => {
        markClueGiven(clueKey!);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [
    isNearHaveliOrnament, hasWeddingOrnament,
    isNearTaxLedger, hasTaxLedger,
    isNearStepwellPots, hasWaterPotsSupplies,
    stage,
    isNearKathputliFragment, hasKathputliFragment,
    isNearPaliwalSeal, hasPaliwalSeal,
    isNearWanderersVerse, hasWanderersVerse,
    givenClueAlerts, markClueGiven
  ]);

  // --- ARCHITECTURE: CENTRALIZED REF & GAME LOOP ---
  const keysHeldRef = useRef(new Set<string>());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const interactionStateRef = useRef<any>({});

  useEffect(() => {
    interactionStateRef.current = {
      isLoading,
      isTransitioning,
      isElephantTravelling,
      isBhangarhTravelling,
      stage,
      scene,
      playerPos,
      cluesFound,
      markClueGiven,
      // Triggers
      isNearRamPolDoor,
      isNearChacha,
      isNearCourtyardStairsTop,
      isNearCourtyardExit,
      isNearVijayStambhDoor,
      isNearJauharPath,
      isNearVijayStambhExit,
      isNearJauharKundDoor,
      isNearPassageBottomDoor,
      isNearJauharPavilionStairs,
      isNearJauharDesertExit,
      isNearDesertPalaceGate,
      isNearCamel,
      isNearKumbhalgarhGateDoor,
      isNearKumbhalgarhInteriorExit,
      isNearKumbhalgarhStairsTop,
      isNearGreatWallStairs,
      isNearWallEndZigzag,
      isNearZigzagLowerExit,
      isNearZigzagUpperGate,
      isNearCourtyardColonnadeDoor,
      isNearCourtyardExitZigzag,
      isNearBadalMahalInteriorExit,
      isNearBadalMahalTerraceDoor,
      isNearBadalMahalTerraceExit,
      isNearTerraceElephant,
      isNearPillar83,
      isNearGateVillagePath,
      isNearHaveliOrnament,
      isNearHaveliTreasuryDoor,
      isNearHaveliGateExit,
      isNearTaxLedger,
      isNearTreasuryWellDoor,
      isNearTreasuryHaveliExit,
      isNearStepwellPots,
      isNearStepwellSquareDoor,
      isNearStepwellTreasuryExit,
      isNearChhatriDeduction,
      isNearSquareWellExit,
      // Stage 4 Triggers & Artifacts
      isNearKathputliFragment,
      isNearPaliwalSeal,
      isNearWanderersVerse,
      hasKathputliFragment,
      hasPaliwalSeal,
      hasWanderersVerse,
      isNearBhangarhGateMarker,
      isNearBhangarhGateArch,
      isNearTempleSanctuary,
      isNearTemplePalaceDoor,
      isNearTempleGateExit,
      isNearPalaceStratum,
      isNearFolkloreBoard,
      isNearFinalEvidenceBoard,
      isNearPalaceTempleExit,
      isNearChaseGateExit,
      // Setters
      setStage,
      setScene,
      setPlayerPos,
      setIsTransitioning,
      setShowChachaDialogue,
      setShowJollyDialogue,
      triggerBuzurgChachaDialogue,
      triggerJollyDialogue,
      setShowChauparGame,
      setShowVijayStambhModal,
      setShowJauharModal,
      setShowPillar83Modal,
      setShowHaveliOrnamentModal,
      setShowTaxLedgerModal,
      setShowStepwellModal,
      setShowDeductionModal,
      setShowStage3CompleteModal,
      setShowGrandCampaignCompleteModal,
      setHasPillar83Inspected,
      setHasWeddingOrnament,
      setHasTaxLedger,
      setHasWaterPotsSupplies,
      setHasKathputliFragment,
      setHasPaliwalSeal,
      setHasWanderersVerse,
      setShowKathputliModal,
      setShowPaliwalSealModal,
      setShowWanderersVerseModal,
      setShowBhangarhTimeOutModal,
      startElephantJourney,
      startBhangarhJourney,
      // Stage 4 Modals
      setShowGateFragmentPuzzleModal,
      setShowTorchlightRestorationModal,
      setShowRuinsClueTrailModal,
      setShowFolkloreClassifierModal,
      setShowFinalEvidenceBoardModal,
      setIsWalking,
      setFacingLeft,
      setWalkPhase,
    };
  });

  // Focus Window on Load
  useEffect(() => {
    if (!isLoading && typeof window !== "undefined") {
      window.focus();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [isLoading]);

  // Main Keyboard & Continuous Movement Loop
  useEffect(() => {
    if (isLoading) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const state = interactionStateRef.current;
      const key = e.key.toLowerCase();
      keysHeldRef.current.add(key);

      // --- [E] INTERACTION KEY ---
      if (key === "e") {
        // Stage 1
        if (state.isNearRamPolDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("inner_courtyard");
            state.setPlayerPos({ x: 50.0, y: 84.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearChacha) {
          state.triggerBuzurgChachaDialogue(false);
        } else if (state.isNearVijayStambhDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("vijay_stambh_interior");
            state.setPlayerPos({ x: 50.0, y: 70.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearJauharPath) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_passage");
            state.setPlayerPos({ x: 50.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.scene === "jauhar_passage" || state.isNearJauharKundDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_kund");
            state.setPlayerPos({ x: 44.0, y: 59.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearJauharDesertExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("desert_outskirts");
            state.setPlayerPos({ x: 80.0, y: 72.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearDesertPalaceGate) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_kund");
            state.setPlayerPos({ x: 16.0, y: 74.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearCamel) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setStage(2);
            state.setScene("kumbhalgarh_gate");
            state.setPlayerPos({ x: 30.0, y: 80.0 });
            state.setIsTransitioning(false);
          }, 1200);
        }
        // Stage 2
        else if (state.isNearKumbhalgarhGateDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_interior_stairs");
            state.setPlayerPos({ x: 20.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearKumbhalgarhStairsTop) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_great_wall");
            state.setPlayerPos({ x: 50.0, y: 88.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearWallEndZigzag) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_zigzag_gates");
            state.setPlayerPos({ x: 58.0, y: 84.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearZigzagUpperGate) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_courtyard");
            state.setPlayerPos({ x: 50.0, y: 84.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearCourtyardColonnadeDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_interior");
            state.setPlayerPos({ x: 76.0, y: 80.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearBadalMahalInteriorExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_terrace");
            state.setPlayerPos({ x: 50.0, y: 78.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearTerraceElephant) {
          state.startElephantJourney();
        }
        // Stage 3 (Kuldhara)
        else if (state.isNearPillar83) {
          state.setHasPillar83Inspected(true);
          state.setShowPillar83Modal(true);
        } else if (state.isNearGateVillagePath) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("chiefs_house");
            state.setPlayerPos({ x: 50.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearHaveliOrnament) {
          state.markClueGiven?.("kuldhara_ornament");
          soundFx.playClueFound();
          state.setHasWeddingOrnament(true);
          state.setShowHaveliOrnamentModal(true);
        } else if (state.isNearHaveliTreasuryDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("treasury");
            state.setPlayerPos({ x: 50.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearTaxLedger) {
          state.markClueGiven?.("kuldhara_ledger");
          soundFx.playClueFound();
          state.setHasTaxLedger(true);
          state.setShowTaxLedgerModal(true);
        } else if (state.isNearTreasuryWellDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("well");
            state.setPlayerPos({ x: 22.0, y: 82.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearStepwellPots) {
          state.markClueGiven?.("kuldhara_well");
          soundFx.playClueFound();
          state.setHasWaterPotsSupplies(true);
          state.setShowStepwellModal(true);
        } else if (state.isNearStepwellSquareDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("village_square");
            state.setPlayerPos({ x: 25.0, y: 80.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearChhatriDeduction) {
          state.setShowStage3CompleteModal(true);
        } else if (state.isNearHaveliGateExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kuldhara_gate");
            state.setPlayerPos({ x: 50.0, y: 64.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearTreasuryHaveliExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("chiefs_house");
            state.setPlayerPos({ x: 50.0, y: 62.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearStepwellTreasuryExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("treasury");
            state.setPlayerPos({ x: 68.0, y: 72.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearSquareWellExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("well");
            state.setPlayerPos({ x: 74.0, y: 78.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Stage 4 (Bhangarh Fort 1-Min Relic Challenge)
        else if (state.isNearKathputliFragment) {
          hasTriggeredClue1Ref.current = true;
          state.markClueGiven?.("bhangarh_kathputli");
          state.setHasKathputliFragment?.(true);
          state.setShowKathputliModal?.(true);
          soundFx.playClueChime();
          stopNarration();
          playNarration("You have unlocked the first clue! The Kathputli Sandstone Fragment reveals the secrets of the royal court!", {
            speaker: "ratan",
            pace: 0.90,
            language_code: "en-IN",
          });
        } else if (state.isNearPaliwalSeal) {
          hasTriggeredClue2Ref.current = true;
          state.markClueGiven?.("bhangarh_seal");
          state.setHasPaliwalSeal?.(true);
          state.setShowPaliwalSealModal?.(true);
          soundFx.playClueChime();
          stopNarration();
          playNarration("You have unlocked the second clue! The Paliwal Ledger Seal sheds light on the trade and wealth of Bhangarh!", {
            speaker: "ratan",
            pace: 0.90,
            language_code: "en-IN",
          });
        } else if (state.isNearWanderersVerse) {
          hasTriggeredClue3Ref.current = true;
          state.markClueGiven?.("bhangarh_verse");
          state.setHasWanderersVerse?.(true);
          state.setShowWanderersVerseModal?.(true);
          soundFx.playClueChime();
          stopNarration();
          playNarration("You have unlocked the third clue! The Wanderer's Verse Medallion uncovers the fateful curse of the palace ruins!", {
            speaker: "ratan",
            pace: 0.90,
            language_code: "en-IN",
          });
        } else if (state.isNearBhangarhGateMarker) {
          state.setShowGateFragmentPuzzleModal?.(true);
        } else if (state.isNearBhangarhGateArch) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("gopinath_temple");
            state.setPlayerPos({ x: 50.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearTemplePalaceDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("palace_ruins");
            state.setPlayerPos({ x: 50.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearFinalEvidenceBoard || (state.scene === "palace_ruins" && state.hasKathputliFragment && state.hasPaliwalSeal && state.hasWanderersVerse && state.isCampaignComplete && !state.showShieldModal)) {
          if (typeof state.setShowGrandCampaignCompleteModal === "function") {
            state.setShowGrandCampaignCompleteModal(true);
          } else if (typeof state.setShowFinalEvidenceBoardModal === "function") {
            state.setShowFinalEvidenceBoardModal(true);
          }
        } else if (state.isNearChaseGateExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("bhangarh_gate");
            state.setPlayerPos({ x: 50.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
      }

      // --- [F] EXIT / BACKWARD KEY ---
      if (key === "f") {
        if (state.isNearCourtyardExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("ram_pol");
            state.setPlayerPos({ x: 68.0, y: 84.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearVijayStambhExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("courtyard_passage");
            state.setPlayerPos({ x: 50.0, y: 58.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.scene === "vijay_stambh_interior") {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("vijay_stambh");
            state.setPlayerPos({ x: 40.0, y: 76.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.scene === "jauhar_passage") {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("vijay_stambh");
            state.setPlayerPos({ x: 70.0, y: 76.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearJauharPavilionStairs) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_passage");
            state.setPlayerPos({ x: 50.0, y: 65.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearKumbhalgarhInteriorExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_gate");
            state.setPlayerPos({ x: 26.0, y: 68.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearGreatWallStairs) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_interior_stairs");
            state.setPlayerPos({ x: 72.0, y: 56.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearZigzagLowerExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_great_wall");
            state.setPlayerPos({ x: 50.0, y: 44.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearCourtyardExitZigzag) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_zigzag_gates");
            state.setPlayerPos({ x: 50.0, y: 62.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearBadalMahalTerraceDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_courtyard");
            state.setPlayerPos({ x: 29.0, y: 78.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearBadalMahalTerraceExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_interior");
            state.setPlayerPos({ x: 28.0, y: 76.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Stage 3 Backward Routes
        else if (state.isNearHaveliGateExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kuldhara_gate");
            state.setPlayerPos({ x: 50.0, y: 64.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearTreasuryHaveliExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("chiefs_house");
            state.setPlayerPos({ x: 50.0, y: 62.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearStepwellTreasuryExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("treasury");
            state.setPlayerPos({ x: 68.0, y: 72.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearSquareWellExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("well");
            state.setPlayerPos({ x: 74.0, y: 78.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Stage 4 Backward Routes
        else if (state.isNearTempleGateExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("bhangarh_gate");
            state.setPlayerPos({ x: 50.0, y: 65.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearPalaceTempleExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("gopinath_temple");
            state.setPlayerPos({ x: 68.0, y: 70.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
      }

      if (key === "escape") {
        stopCharacterDialogue();
        state.setShowChachaDialogue(false);
        state.setShowJollyDialogue(false);
        state.setShowChauparGame(false);
        state.setShowVijayStambhModal(false);
        state.setShowJauharModal(false);
        state.setShowPillar83Modal(false);
        state.setShowHaveliOrnamentModal(false);
        state.setShowTaxLedgerModal(false);
        state.setShowStepwellModal(false);
        state.setShowDeductionModal(false);
        state.setShowStage3CompleteModal(false);
        // Stage 4 Modals
        state.setShowGateFragmentPuzzleModal(false);
        state.setShowTorchlightRestorationModal(false);
        state.setShowRuinsClueTrailModal(false);
        state.setShowFolkloreClassifierModal(false);
        state.setShowFinalEvidenceBoardModal(false);
        state.setShowGrandCampaignCompleteModal(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let animationFrameId: number;
    let localWalkTimer = 0;

    const gameLoop = () => {
      const state = interactionStateRef.current;
      if (state.isTransitioning || state.isElephantTravelling || state.isBhangarhTravelling) {
        state.setIsWalking(false);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      let dx = 0;
      let dy = 0;
      const speed = 0.38;

      if (keysHeldRef.current.has("arrowleft") || keysHeldRef.current.has("a")) dx -= speed;
      if (keysHeldRef.current.has("arrowright") || keysHeldRef.current.has("d")) dx += speed;
      if (keysHeldRef.current.has("arrowup") || keysHeldRef.current.has("w")) dy -= speed * 0.85;
      if (keysHeldRef.current.has("arrowdown") || keysHeldRef.current.has("s")) dy += speed * 0.85;

      const moving = dx !== 0 || dy !== 0;
      state.setIsWalking(moving);

      if (dx < 0) state.setFacingLeft(true);
      if (dx > 0) state.setFacingLeft(false);

      if (moving) {
        localWalkTimer += 0.25;
        state.setWalkPhase(localWalkTimer);

        state.setPlayerPos((prev: { x: number; y: number }) => {
          // --- STAGE 1: RAM POL ---
          if (state.scene === "ram_pol") {
            const minX = 10.0, maxX = 90.0, minY = 75.0, maxY = 94.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 1: INNER COURTYARD ---
          else if (state.scene === "inner_courtyard") {
            const minX = 8.0, maxX = 92.0, minY = 44.0, maxY = 88.0;
            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));
            if (nextX >= 76.0 && nextY <= 52.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("courtyard_passage");
                state.setPlayerPos({ x: 50.0, y: 86.0 });
                state.setIsTransitioning(false);
              }, 300);
            }
            return { x: nextX, y: nextY };
          }
          // --- STAGE 1: COURTYARD PASSAGE ---
          else if (state.scene === "courtyard_passage") {
            const minX = 25.0, maxX = 75.0, minY = 50.0, maxY = 92.0;
            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));
            if (nextY <= 54.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("vijay_stambh");
                state.setPlayerPos({ x: 50.0, y: 86.0 });
                state.setIsTransitioning(false);
              }, 300);
            }
            if (nextY >= 90.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("inner_courtyard");
                state.setPlayerPos({ x: 80.0, y: 55.0 });
                state.setIsTransitioning(false);
              }, 300);
            }
            return { x: nextX, y: nextY };
          }
          // --- STAGE 1: VIJAY STAMBH ---
          else if (state.scene === "vijay_stambh") {
            const minX = 15.0, maxX = 85.0, minY = 62.0, maxY = 90.0;
            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));
            if (nextX >= 80.0 && nextY >= 68.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("jauhar_passage");
                state.setPlayerPos({ x: 20.0, y: 80.0 });
                state.setIsTransitioning(false);
              }, 400);
            }
            return { x: nextX, y: nextY };
          }
          // --- STAGE 1: VIJAY STAMBH INTERIOR ---
          else if (state.scene === "vijay_stambh_interior") {
            const minX = 12.0, maxX = 88.0, minY = 54.0, maxY = 86.0;
            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));
            if (nextY >= 85.0 && nextX >= 40.0 && nextX <= 60.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("vijay_stambh");
                state.setPlayerPos({ x: 40.0, y: 76.0 });
                state.setIsTransitioning(false);
              }, 400);
            }
            return { x: nextX, y: nextY };
          }
          // --- STAGE 1: JAUHAR PASSAGE ---
          else if (state.scene === "jauhar_passage") {
            const minX = 20.0, maxX = 80.0, minY = 56.0, maxY = 92.0;
            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));
            if (nextY <= 58.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("jauhar_kund");
                state.setPlayerPos({ x: 50.0, y: 88.0 });
                state.setIsTransitioning(false);
              }, 400);
            }
            if (nextY >= 90.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("vijay_stambh");
                state.setPlayerPos({ x: 70.0, y: 76.0 });
                state.setIsTransitioning(false);
              }, 400);
            }
            return { x: nextX, y: nextY };
          }
          // --- STAGE 1: JAUHAR KUND ---
          else if (state.scene === "jauhar_kund") {
            const minX = 12.0, maxX = 88.0, minY = 57.0, maxY = 85.0;
            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));
            if (nextX <= 14.0 && nextY >= 66.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("desert_outskirts");
                state.setPlayerPos({ x: 80.0, y: 72.0 });
                state.setIsTransitioning(false);
              }, 400);
            }
            return { x: nextX, y: nextY };
          }
          // --- STAGE 1: DESERT OUTSKIRTS ---
          else if (state.scene === "desert_outskirts") {
            const minX = 10.0, maxX = 88.0, minY = 62.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 2: KUMBHALGARH GATE ---
          else if (state.scene === "kumbhalgarh_gate") {
            const minX = 15.0, maxX = 85.0, minY = 65.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 2: BASTION & GRAND STAIRS ---
          else if (state.scene === "kumbhalgarh_interior_stairs") {
            const minX = 12.0, maxX = 88.0, minY = 52.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 2: GREAT WALL OF INDIA ---
          else if (state.scene === "kumbhalgarh_great_wall") {
            const progress = (prev.y - 38.0) / 52.0;
            const halfWidth = 5.0 + Math.max(0, Math.min(1, progress)) * 26.0;
            const minX = Math.max(16.0, 50.0 - halfWidth);
            const maxX = Math.min(84.0, 50.0 + halfWidth);
            const minY = 38.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 2: ZIGZAG GATES ---
          else if (state.scene === "kumbhalgarh_zigzag_gates") {
            const minY = 52.0, maxY = 98.0;
            const rampProgress = Math.max(0, Math.min(1, (prev.y - minY) / (maxY - minY)));
            const currentMinX = 35.0 + rampProgress * -23.0;
            const currentMaxX = 65.0 + rampProgress * 23.0;
            return { x: Math.max(currentMinX, Math.min(currentMaxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 2: BADAL MAHAL COURTYARD ---
          else if (state.scene === "badal_mahal_courtyard") {
            const minX = 12.0, maxX = 88.0, minY = 58.0, maxY = 96.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 2: BADAL MAHAL INTERIOR ---
          else if (state.scene === "badal_mahal_interior") {
            const minX = 14.0, maxX = 86.0, minY = 62.0, maxY = 92.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 2: BADAL MAHAL TERRACE ---
          else if (state.scene === "badal_mahal_terrace") {
            const minX = 16.0, maxX = 84.0, minY = 60.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 3: KULDHARA GATE ---
          else if (state.scene === "kuldhara_gate") {
            const minX = 16.0, maxX = 84.0, minY = 48.0, maxY = 92.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 3: CHIEF'S HAVELI ---
          else if (state.scene === "chiefs_house") {
            const minX = 22.0, maxX = 78.0, minY = 50.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 3: GRAIN MERCHANT TREASURY ---
          else if (state.scene === "treasury") {
            const minX = 18.0, maxX = 82.0, minY = 52.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 3: VILLAGE STEPWELL ---
          else if (state.scene === "well") {
            const targetX = prev.x + dx;
            const targetY = prev.y + dy;
            const isForeGround = targetY >= 72.0 && targetX >= 12.0 && targetX <= 88.0;
            const isSideWalkway = targetY >= 54.0 && targetY < 72.0 && (targetX <= 28.0 || targetX >= 72.0);
            if (isForeGround || isSideWalkway) {
              return { x: Math.max(12.0, Math.min(88.0, targetX)), y: Math.max(54.0, Math.min(92.0, targetY)) };
            }
            return { x: prev.x, y: prev.y };
          }
          // --- STAGE 3: VILLAGE SQUARE ---
          else if (state.scene === "village_square") {
            const minX = 14.0, maxX = 86.0, minY = 55.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 4: BHANGARH GATE ---
          else if (state.scene === "bhangarh_gate") {
            const minX = 14.0, maxX = 86.0, minY = 50.0, maxY = 92.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 4: GOPINATH TEMPLE SANCTUARY ---
          else if (state.scene === "gopinath_temple") {
            const minX = 18.0, maxX = 82.0, minY = 52.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 4: PALACE RUINS ---
          else if (state.scene === "palace_ruins") {
            const minX = 12.0, maxX = 88.0, minY = 48.0, maxY = 92.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // --- STAGE 4: BHANGARH CHASE (ESCAPE MIST ROUTE) ---
          else if (state.scene === "bhangarh_chase") {
            const minX = 14.0, maxX = 86.0, minY = 52.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
          // Fallback bounds
          else {
            const minX = 15.0, maxX = 85.0, minY = 40.0, maxY = 90.0;
            return { x: Math.max(minX, Math.min(maxX, prev.x + dx)), y: Math.max(minY, Math.min(maxY, prev.y + dy)) };
          }
        });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLoading]);

  // Chaupar Long Wooden Pasa Dice Roll & Goti Movement Handler
  const handleRollDice = () => {
    if (isDiceRolling || isPawnMoving) return;
    setIsDiceRolling(true);
    soundFx.playButtonClick();
    stopNarration();

    setTimeout(() => {
      // Long wooden dice (Pasa) face values: 1, 2, 3, 4, 6
      const possibleRolls = [1, 2, 3, 4, 6];
      const d1 = possibleRolls[Math.floor(Math.random() * possibleRolls.length)];
      const d2 = possibleRolls[Math.floor(Math.random() * possibleRolls.length)];
      const c1 = possibleRolls[Math.floor(Math.random() * possibleRolls.length)];
      const c2 = possibleRolls[Math.floor(Math.random() * possibleRolls.length)];

      const pTotal = d1 + d2;
      const cTotal = c1 + c2;

      setDiceRoll1(d1);
      setDiceRoll2(d2);
      setLastRoll(pTotal);
      setIsDiceRolling(false);
      setIsPawnMoving(true);

      const currentRound = chauparRound;
      setChauparRound((prev) => prev + 1);

      let spokenNarration = "";

      if (pTotal > cTotal) {
        const diff = pTotal - cTotal;
        const nextPos = Math.min(12, playerPawnPos + Math.ceil(pTotal / 2));
        setChauparScore((prev) => ({ ...prev, player: prev.player + 1 }));
        setPlayerPawnPos(nextPos);

        if (nextPos >= 12) {
          setChauparMessage(`🏆 Victory! Round ${currentRound}: You rolled ${d1} & ${d2} (${pTotal} pips) vs Chacha's ${c1} & ${c2} (${cTotal})! You won Round ${currentRound} by ${diff} points! Your Golden Goti reached Home!`);
          spokenNarration = `Round ${currentRound}! You rolled ${pTotal} and Chacha rolled ${cTotal}. You won this round by ${diff} points! Shabash! Your Golden Goti has reached the Home square! You won the Chaupar match!`;
        } else {
          setChauparMessage(`🎲 Round ${currentRound}: You rolled ${d1} & ${d2} (${pTotal} pips)! Chacha rolled ${c1} & ${c2} (${cTotal}). You won this round by ${diff} points! Your Golden Goti advances!`);
          spokenNarration = `Round ${currentRound}! You rolled ${pTotal} and Chacha rolled ${cTotal}. You won this round by ${diff} points! Your Golden Goti advances on the Chaupar board!`;
        }
      } else if (cTotal > pTotal) {
        const diff = cTotal - pTotal;
        const nextChachaPos = Math.min(12, chachaPawnPos + Math.ceil(cTotal / 2));
        setChauparScore((prev) => ({ ...prev, chacha: prev.chacha + 1 }));
        setChachaPawnPos(nextChachaPos);

        if (nextChachaPos >= 12) {
          setChauparMessage(`🎲 Round ${currentRound}: You rolled ${d1} & ${d2} (${pTotal} pips). Chacha rolled ${c1} & ${c2} (${cTotal}) and won this round by ${diff} points! Chacha's Ruby Goti reached Home!`);
          spokenNarration = `Round ${currentRound}! Chacha rolled ${cTotal} and you rolled ${pTotal}. Chacha won this round by ${diff} points! Buzurg Chacha's Ruby Goti has reached the Home square and won the match!`;
        } else {
          setChauparMessage(`🎲 Round ${currentRound}: You rolled ${d1} & ${d2} (${pTotal} pips). Chacha rolled ${c1} & ${c2} (${cTotal}). Chacha won this round by ${diff} points!`);
          spokenNarration = `Round ${currentRound}! Chacha rolled ${cTotal} and you rolled ${pTotal}. Chacha won this round by ${diff} points!`;
        }
      } else {
        setChauparMessage(`🎲 Round ${currentRound}: Both rolled ${pTotal} pips! It's a tied round — pawns hold position.`);
        spokenNarration = `Round ${currentRound}! Both rolled ${pTotal} points. It is a tied round!`;
      }

      // Voice narration announcing who won this round and by how much
      if (spokenNarration) {
        playNarration(spokenNarration, {
          speaker: "ratan",
          pace: 0.95,
          language_code: "en-IN",
        });
      }

      setTimeout(() => {
        setIsPawnMoving(false);
      }, 600);
    }, 750);
  };

  // Exit Chaupar Match Handler — Buzurg Chacha tells player to go towards staircase
  const handleExitChauparGame = () => {
    setShowChauparGame(false);
    stopNarration();
    stopCharacterDialogue();

    const chachaStairsText = "Beta, go towards the staircase! Ascend the steps to the upper passage and reach the glorious Vijay Stambh!";
    setChachaSpeechText(chachaStairsText);
    setChachaAudioUrl(undefined);
    setChachaOptions([
      { id: 10, text: "Ji Chacha-ji! Heading towards the staircase now." },
      { id: 11, text: "Thank you for the wonderful Chaupar match, Chacha-ji!" }
    ]);
    setShowChachaDialogue(true);

    playCharacterDialogue({
      character: "chacha",
      text: chachaStairsText,
      onError: () => {
        playNarration(chachaStairsText, { speaker: "ratan", pace: 0.85, language_code: "en-IN" });
      }
    });
  };

  const handleResetChauparMatch = () => {
    stopNarration();
    setChauparScore({ player: 0, chacha: 0 });
    setPlayerPawnPos(0);
    setChachaPawnPos(0);
    setDiceRoll1(3);
    setDiceRoll2(4);
    setChauparRound(1);
    setChauparMessage("Match reset! Roll the pasa dice to challenge Buzurg Chacha.");
    soundFx.playButtonClick();
  };

  // Stage 3 Deduction Puzzle Handler
  const handleEvaluateDeduction = () => {
    if (!hasWeddingOrnament || !hasTaxLedger || !hasWaterPotsSupplies) {
      setDeductionFeedback("You must discover all 3 evidence clues across Kuldhara before submitting the deduction!");
      return;
    }

    const { ornamentChoice, ledgerChoice, suppliesChoice } = deductionState;
    if (!ornamentChoice || !ledgerChoice || !suppliesChoice) {
      setDeductionFeedback("Please assign a deduction for every piece of discovered evidence.");
      return;
    }

    const isCorrect = ornamentChoice === "marriage" && ledgerChoice === "extortion" && suppliesChoice === "evacuation";

    if (isCorrect) {
      setShowDeductionModal(false);
      setShowStage3CompleteModal(true);
      setDeductionFeedback(null);
    } else {
      setDeductionFeedback("Your deduction does not match the historical record. Re-examine the nature of each clue and try again!");
    }
  };

  // --- STAGE 4 PUZZLE 1: GATE INSCRIBED FRAGMENTS HANDLER ---
  const handleToggleGateFragment = (fragId: number) => {
    if (gateFragmentsOrder.includes(fragId)) {
      setGateFragmentsOrder((prev) => prev.filter((id) => id !== fragId));
    } else if (gateFragmentsOrder.length < 4) {
      setGateFragmentsOrder((prev) => [...prev, fragId]);
    }
  };

  const handleVerifyGatePuzzle = () => {
    // Expected order: 1 (Foundation 1573) -> 2 (Madho Singh patron) -> 3 (5 Concentric Walls) -> 4 (18th-century Decline)
    const isCorrect = gateFragmentsOrder.length === 4 && gateFragmentsOrder[0] === 1 && gateFragmentsOrder[1] === 2 && gateFragmentsOrder[2] === 3 && gateFragmentsOrder[3] === 4;

    if (isCorrect) {
      setHasBhangarhChronicleClue(true);
      setShowGateFragmentPuzzleModal(false);
      setGatePuzzleFeedback(null);
    } else {
      setGatePuzzleFeedback("The chronicle sequence is out of chronological order. Arrange from foundation (1573 CE) to the 18th-century decline!");
    }
  };

  // --- STAGE 4 PUZZLE 2: GOPINATH TEMPLE SYMBOL MATCHING ---
  const handleVerifyTemplePuzzle = () => {
    const isCorrect = templeSymbolMatches.gajalakshmi === "sovereignty" && templeSymbolMatches.kalasa === "consecration" && templeSymbolMatches.kirthimukha === "guardian";

    if (isCorrect) {
      setHasTempleArchitectureClue(true);
      setShowTorchlightRestorationModal(false);
      setTemplePuzzleFeedback(null);
    } else {
      setTemplePuzzleFeedback("The sacred architectural meanings do not match Nagara temple traditions. Review the motifs and try again!");
    }
  };

  // --- STAGE 4 PUZZLE 4: FOLKLORE VS HISTORICAL EVIDENCE CLASSIFIER ---
  const handleVerifyFolkloreClassifier = () => {
    const { statement1, statement2, statement3, statement4 } = folkloreClassification;
    // Statement 1: 1573 CE Amber Kachwaha foundation -> evidence
    // Statement 2: Tantrik wizard curse crushes roofs -> folklore
    // Statement 3: 1783 CE Chalisa drought & warfare -> evidence
    // Statement 4: Hermit Guru Balu Nath's shadow curse -> folklore
    const isCorrect = statement1 === "evidence" && statement2 === "folklore" && statement3 === "evidence" && statement4 === "folklore";

    if (isCorrect) {
      setHasFolkloreDistinctionClue(true);
      setShowFolkloreClassifierModal(false);
      setFolkloreFeedback(null);
    } else {
      setFolkloreFeedback("Some statements have been misclassified. Distinguish documented archaeological/historical records from oral curse legends!");
    }
  };

  // --- STAGE 4 PUZZLE 5: FINAL EVIDENCE BOARD SYNTHESIS (CLIMAX) ---
  const handleVerifyFinalBoard = () => {
    if (!hasBhangarhChronicleClue || !hasTempleArchitectureClue || !hasFamineRecordClue || !hasFolkloreDistinctionClue) {
      setFinalBoardFeedback("You must discover all 4 major clues across Bhangarh Fort before completing the final synthesis!");
      return;
    }

    const { origin, decline, legends } = finalBoardMatches;
    const isCorrect = origin === "amber_capital" && decline === "famine_warfare" && legends === "cultural_memory";

    if (isCorrect) {
      setShowFinalEvidenceBoardModal(false);
      setIsMoonriseActive(false);
      setIsCampaignComplete(true);
      setShowGrandCampaignCompleteModal(true);
      setFinalBoardFeedback(null);
    } else {
      setFinalBoardFeedback("Your historical synthesis is incomplete. Cross-reference the architectural relics, famine records, and folklore distinctions!");
    }
  };

  const getTransitionLabel = () => {
    switch (scene) {
      case "ram_pol":
        return "Entering Ram Pol Gate...";
      case "inner_courtyard":
        return "Entering Chittorgarh Courtyard...";
      case "courtyard_passage":
        return "Entering Fortress Passageway...";
      case "vijay_stambh":
        return "Approaching Vijay Stambh...";
      case "vijay_stambh_interior":
        return "Entering Tower of Victory Chamber...";
      case "jauhar_passage":
        return "Entering Passage of Broken Walls...";
      case "jauhar_kund":
        return "Approaching Sacred Jauhar Kund...";
      case "desert_outskirts":
        return "Entering Desert Outskirts...";
      case "kumbhalgarh_gate":
        return "Caravan Arriving at Kumbhalgarh Fort (Stage 2)...";
      case "kumbhalgarh_interior_stairs":
        return "Entering Kumbhalgarh Bastion Hall...";
      case "kumbhalgarh_great_wall":
        return "Ascending to Top of the Great Wall of India...";
      case "kumbhalgarh_zigzag_gates":
        return "Approaching Fortified Zigzag Gates...";
      case "badal_mahal_courtyard":
        return "Entering Badal Mahal Royal Courtyard...";
      case "badal_mahal_interior":
        return "Entering Badal Mahal Palace Interior...";
      case "badal_mahal_terrace":
        return "Ascending to Cloud Terrace & Royal Dome...";
      case "kuldhara_gate":
        return "Approaching Kuldhara Ghost Village Gate (Stage 3)...";
      case "chiefs_house":
        return "Entering the Village Chief's Ruined Haveli...";
      case "treasury":
        return "Entering the Abandoned Grain Treasury...";
      case "well":
        return "Approaching the Ancient Village Stepwell (Baori)...";
      case "village_square":
        return "Entering the Central Memorial Village Square...";
      case "bhangarh_gate":
        return "Approaching Bhangarh Main Gate — Night of the Moonrise (Final Stage)...";
      case "gopinath_temple":
        return "Entering Gopinath Temple Sanctuary...";
      case "palace_ruins":
        return "Entering the 7-Tiered Royal Palace Ruins...";
      case "bhangarh_chase":
        return "Traversing the Misty Shadow Corridor...";
      default:
        return "Travelling across Rajasthan...";
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-screen bg-[#0a0806] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4 text-amber-400">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xl font-bold tracking-widest uppercase">Loading Rajasthan World...</span>
        </div>
      </div>
    );
  }

  // Background image mapping
  const getSceneBackground = () => {
    switch (scene) {
      case "ram_pol":
        return "/bg-ram-pol.jpg";
      case "inner_courtyard":
        return "/bg-chittorgarh-courtyard.jpg";
      case "courtyard_passage":
        return "/bg-chittorgarh-passage.jpg";
      case "vijay_stambh":
        return "/bg-chittorgarh-vijay-stambh.jpg";
      case "vijay_stambh_interior":
        return "/bg-vijay-stambh-interior.jpg";
      case "jauhar_passage":
        return "/bg-jauhar-passage.jpg";
      case "jauhar_kund":
        return "/bg-chittorgarh-jauhar-kund.jpg";
      case "desert_outskirts":
        return "/bg-chittorgarh-desert-side.jpg";
      case "kumbhalgarh_gate":
        return "/bg-kumbhalgarh-gate.jpg";
      case "kumbhalgarh_interior_stairs":
        return "/bg-kumbhalgarh-stairs.jpg";
      case "kumbhalgarh_great_wall":
        return "/bg-kumbhalgarh-wall-top.jpg";
      case "kumbhalgarh_zigzag_gates":
        return "/bg-kumbhalgarh-zigzag-gates.jpg";
      case "badal_mahal_courtyard":
        return "/bg-badal-mahal-courtyard.jpg";
      case "badal_mahal_interior":
        return "/bg-badal-mahal-interior.jpg";
      case "badal_mahal_terrace":
        return "/bg-badal-mahal-terrace.jpg";
      case "kuldhara_gate":
        return "/bg-kuldhara-gate.jpg";
      case "chiefs_house":
        return "/bg-kuldhara-chiefs-house.jpg";
      case "treasury":
        return "/bg-kuldhara-treasury.jpg";
      case "well":
        return "/bg-kuldhara-stepwell.jpg";
      case "village_square":
        return "/bg-kuldhara-square.jpg";
      case "bhangarh_gate":
        return "/bg-bhangarh-gate.jpg";
      case "gopinath_temple":
        return "/bg-bhangarh-baoli-scary-night.jpg";
      case "palace_ruins":
        return "/bg-bhangarh-palace-ruins.jpg";
      case "bhangarh_chase":
        return "/bg-bhangarh-chase.jpg";
      default:
        return "/bg-ram-pol.jpg";
    }
  };

  const getSceneInstruction = () => {
    switch (scene) {
      case "ram_pol":
        return "Approach Ram Pol gate and press E to enter the inner courtyard.";
      case "inner_courtyard":
        return "Explore the courtyard. Challenge Buzurg Chacha to Chaupar, or walk up the right stairs to the passage.";
      case "courtyard_passage":
        return "Ascend the royal fortress passage to reach the Vijay Stambh (Tower of Victory).";
      case "vijay_stambh":
        return "Gaze upon the majestic Vijay Stambh. Press E to go inside, or walk to the right path towards the Passage of Broken Walls.";
      case "vijay_stambh_interior":
        return "Explore the carved sandstone chamber of Vijay Stambh. Walk near architectural carvings and press E to inspect with Shilpa Drishti (शिल्प दृष्टि).";
      case "jauhar_passage":
        return "Traverse the Passage of Broken Walls. Move straight ahead towards the archway to enter Jauhar Kund.";
      case "jauhar_kund":
        return "Stand in reverence at sacred Jauhar Kund. Walk left to exit outside to the desert.";
      case "desert_outskirts":
        return "Gaze upon the desert dunes. Walk towards the camel caravan and press E to travel to Kumbhalgarh Fort (Stage 2).";
      case "kumbhalgarh_gate":
        return "Approach the grand Hanuman Pol gate and press E to enter the fort bastion.";
      case "kumbhalgarh_interior_stairs":
        return "Climb the grand stone staircase on the right and press E to ascend to the Great Wall of India.";
      case "kumbhalgarh_great_wall":
        return "Walk along the Great Wall of India straight to the far end to reach the fortified Zigzag Gates!";
      case "kumbhalgarh_zigzag_gates":
        return "Pass through the defensive zigzag gates to reach Badal Mahal Courtyard.";
      case "badal_mahal_courtyard":
        return "Enter Badal Mahal Courtyard and press E to go inside the Palace of Clouds.";
      case "badal_mahal_interior":
        return "Explore Badal Mahal. Walk near unlit wall lamps and press [E] to light all 3 royal diyas!";
      case "badal_mahal_terrace":
        return "Stand atop Badal Mahal terrace. Walk to the Royal Elephant and press E to travel to Kuldhara Ghost Village (Stage 3).";
      case "kuldhara_gate":
        return "Enter the eerie entrance of Kuldhara Ghost Village. Walk north into the Chief's Haveli.";
      case "chiefs_house":
        return "Inspect the inscribed '83' marker pillar (Press E) proving all 84 Paliwal Brahmin villages fled together overnight!";
      case "treasury":
        return "Search the stepwell platform. Inspect the intact clay water pots and caches (Press E) proving coordinated evacuation.";
      case "well":
        return "Search the stepwell platform. Inspect the intact clay water pots and caches (Press E) proving coordinated evacuation.";
      case "village_square":
        return "Approach the memorial chhatri and press E to piece together the evidence and solve the mystery of Kuldhara!";
      case "bhangarh_gate":
        return "You arrive at Bhangarh Fort at dusk. Inspect the gate inscription stone (Press E) to decode the foundation chronicle before entering.";
      case "gopinath_temple":
        return "Investigate Bhangarh Royal Baoli & Colonnade. Examine sacred Nagara temple motifs and stepwell reliefs (Press E).";
      case "palace_ruins":
        return "Search the 7-story palace ruins. Inspect the famine stratum (left), classify folklore vs evidence (right), and assemble the final evidence board (top)!";
      case "bhangarh_chase":
        return "Navigate through the misty shadow corridor back to the entrance gate before moonrise peaks!";
      default:
        return "Explore the historical grounds of Rajasthan.";
    }
  };

  const walkBob = isWalking ? Math.sin(walkPhase * 2) * 3 : 0;
  const walkSway = isWalking ? Math.cos(walkPhase) * 2 : 0;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none font-sans">
      {/* Background Image Scene */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 scale-[1.01]"
        style={{ backgroundImage: `url(${getSceneBackground()})` }}
      />

      {/* Vignette Overlay & Atmospheric Night Lighting */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${stage === 4
            ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/85"
            : "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/60"
          }`}
      />

      {/* --- NOW PLAYING SONG PILL (IMAGE 1: 3-Second Floating Capsule & Click-to-Mute) --- */}
      {showSongBanner && (
        <button
          onMouseEnter={() => soundFx.playButtonHover()}
          onClick={() => {
            soundFx.playKeyboardClick();
            setIsMusicMuted(!isMusicMuted);
            triggerSongBanner();
          }}
          title={isMusicMuted ? "Song Muted - Click to Unmute" : "Now Playing - Click to Mute"}
          className="fixed top-7 left-1/2 -translate-x-1/2 z-40 bg-black/85 hover:bg-black/95 backdrop-blur-md text-white border border-white/20 px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex items-center gap-2.5 transition-all animate-in fade-in duration-300 cursor-pointer group hover:scale-105 active:scale-95 select-none"
        >
          <span className="text-amber-400 group-hover:scale-110 transition-transform text-base">♪</span>
          <span className="tracking-tight text-white">{getStageSongTitle(stage)}</span>
          {isMusicMuted && (
            <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
              Muted
            </span>
          )}
        </button>
      )}

      {/* --- TOP LEFT HUD CARDS (EXACT MUGHAL ENGINE FORMAT) --- */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2.5">
        {/* Objective / Location Card */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-xl p-3.5 w-80 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest mb-1">
            {stage === 1
              ? "RAJASTHAN - CHITTORGARH FORT"
              : stage === 2
                ? "RAJASTHAN - KUMBHALGARH FORT"
                : stage === 3
                  ? "RAJASTHAN - KULDHARA GHOST VILLAGE"
                  : "RAJASTHAN - BHANGARH FORT (STAGE 4)"}
          </div>
          <div className="text-[13px] font-black text-black leading-snug">
            {getSceneInstruction()}
          </div>
        </div>

        {/* Clues Counter Card (Exact Mughal Pill Style: Image 2) */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-full px-3.5 py-1.5 w-fit min-w-[210px] shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-700 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <div className="flex gap-1.5">
              <div className={`w-3.5 h-1.5 rounded-full transition-colors duration-300 ${cluesFound >= 1 ? "bg-amber-500 border border-amber-600 shadow-[0_0_4px_rgba(245,158,11,0.5)]" : "bg-amber-200/90"}`}></div>
              <div className={`w-3.5 h-1.5 rounded-full transition-colors duration-300 ${cluesFound >= 2 ? "bg-amber-500 border border-amber-600 shadow-[0_0_4px_rgba(245,158,11,0.5)]" : "bg-amber-200/90"}`}></div>
              <div className={`w-3.5 h-1.5 rounded-full transition-colors duration-300 ${cluesFound >= 3 ? "bg-amber-500 border border-amber-600 shadow-[0_0_4px_rgba(245,158,11,0.5)]" : "bg-amber-200/90"}`}></div>
              {stage === 4 && (
                <div className={`w-3.5 h-1.5 rounded-full transition-colors duration-300 ${cluesFound >= 4 ? "bg-amber-500 border border-amber-600 shadow-[0_0_4px_rgba(245,158,11,0.5)]" : "bg-amber-200/90"}`}></div>
              )}
            </div>
          </div>
          <div className="text-[12px] font-black text-black flex items-center gap-1">
            <span>{cluesFound}/{maxClues} clues</span>
            <span className="text-amber-800 font-extrabold">open</span>
          </div>
        </div>
      </div>

      {/* --- TOP RIGHT ACTION BUTTONS (EXACT MUGHAL ENGINE FORMAT: IMAGE 2) --- */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          {/* Active Live Timer Pill (Stage 3: Kuldhara, Stage 4: Bhangarh 1-Min Challenge) */}
          {(stage === 3 || stage === 4) && (
            <div
              className={`h-10 px-3.5 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 font-black text-xs select-none transition-all ${(stage === 4 ? bhangarhTimer <= 15 : kuldharaTimer <= 20)
                  ? "bg-red-600 text-white animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                  : "bg-[#fff9ea] text-black"
                }`}
            >
              <Timer className={`w-4 h-4 ${(stage === 4 ? bhangarhTimer <= 15 : kuldharaTimer <= 20) ? "text-white animate-spin" : "text-amber-950"}`} />
              <span className={`text-[11px] font-black uppercase tracking-wider ${(stage === 4 ? bhangarhTimer <= 15 : kuldharaTimer <= 20) ? "text-white" : "text-amber-950"}`}>
                {stage === 4 ? "EVIL SPIRITS:" : "TIMER"}
              </span>
              <span className={`font-mono font-black text-[13px] px-2 py-0.5 rounded border ${(stage === 4 ? bhangarhTimer <= 15 : kuldharaTimer <= 20)
                  ? "bg-red-800 text-white border-white/40"
                  : "bg-red-100 text-red-600 border-red-300"
                }`}>
                {stage === 4
                  ? `${Math.floor(bhangarhTimer / 60)}:${(bhangarhTimer % 60).toString().padStart(2, "0")}`
                  : `${Math.floor(kuldharaTimer / 60)}:${(kuldharaTimer % 60).toString().padStart(2, "0")}`
                }
              </span>
            </div>
          )}

          <button
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              setShowRestartConfirmModal(true);
            }}
            title="Restart Campaign"
            className="h-10 bg-red-600 text-white border-2 border-black rounded-lg px-3.5 text-[13px] font-extrabold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-red-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            <RotateCcw className="w-4 h-4 text-white group-hover:-rotate-180 transition-transform duration-500" />
            <span>Restart</span>
          </button>

          <button
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              setIsMusicMuted(!isMusicMuted);
              triggerSongBanner();
            }}
            title={isMusicMuted ? "Unmute Background Music" : "Mute Background Music"}
            className={`w-10 h-10 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center cursor-pointer ${isMusicMuted ? "bg-gray-200 text-gray-500" : "bg-amber-400 text-black"
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
            </svg>
          </button>

          <button
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              const muted = soundFx.toggleMute();
              setIsSoundMuted(muted);
            }}
            title={isSoundMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
            className={`w-10 h-10 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center cursor-pointer ${isSoundMuted ? "bg-gray-200 text-gray-500" : "bg-amber-400 text-black"
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 5.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
            </svg>
          </button>

          <button
            onMouseEnter={() => soundFx.playButtonHover()}
            onClick={() => {
              soundFx.playKeyboardClick();
              if (chittorgarhAudioRef.current) {
                chittorgarhAudioRef.current.pause();
                chittorgarhAudioRef.current.currentTime = 0;
              }
              if (bhangarhAudioRef.current) {
                bhangarhAudioRef.current.pause();
                bhangarhAudioRef.current.currentTime = 0;
              }
              router.push("/dashboard");
            }}
            className="h-10 bg-red-600 text-white border-2 border-black rounded-lg px-4 text-[13px] font-extrabold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-red-700 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Leave world
          </button>
        </div>

        {/* Minimap Box Card (Exact Mughal Style) */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-2xl p-3 w-44 h-36 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          <div className="text-[9px] font-mono font-bold text-amber-950 uppercase mb-1 tracking-wider text-center">
            {stage === 1 ? "CHITTORGARH" : stage === 2 ? "KUMBHALGARH" : stage === 3 ? "KULDHARA" : "BHANGARH FORT"}
          </div>
          <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1.5 p-1.5 bg-[#fff5d6]/70 rounded-xl border border-amber-200">
            {stage === 1 && (
              <>
                <div className={scene === "ram_pol" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "inner_courtyard" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "courtyard_passage" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "vijay_stambh" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "vijay_stambh_interior" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "jauhar_passage" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "jauhar_kund" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "desert_outskirts" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className="bg-transparent"></div>
              </>
            )}
            {stage === 2 && (
              <>
                <div className={scene === "kumbhalgarh_gate" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "kumbhalgarh_interior_stairs" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "kumbhalgarh_great_wall" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "kumbhalgarh_zigzag_gates" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "badal_mahal_courtyard" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "badal_mahal_interior" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "badal_mahal_terrace" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
              </>
            )}
            {stage === 3 && (
              <>
                <div className={scene === "kuldhara_gate" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "chiefs_house" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "treasury" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "well" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "village_square" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
              </>
            )}
            {stage === 4 && (
              <>
                <div className={scene === "bhangarh_gate" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "gopinath_temple" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "palace_ruins" ? "bg-amber-400 rounded-md shadow-[0_0_6px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className={scene === "bhangarh_chase" ? "bg-red-400 rounded-md shadow-[0_0_6px_rgba(248,113,113,0.8)] border border-red-600" : "bg-[#fff9ea] rounded-md border border-amber-200/60"}></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- NPCS & CARAVAN SPRITES --- */}
      {scene === "inner_courtyard" && (
        <div className="absolute z-10 pointer-events-none flex flex-col items-center" style={{ left: "26%", top: "76%", transform: "translate(-50%, -96%) scale(1.15)" }}>
          <div className="bg-amber-900/90 text-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded border border-amber-400/50 shadow-md mb-1 whitespace-nowrap">
            👳 Buzurg Chacha
          </div>
          <img src="/rajasthan-guard-v2.png" alt="Buzurg Chacha" className="w-32 h-32 object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]" style={{ imageRendering: "pixelated" }} />
        </div>
      )}

      {scene === "desert_outskirts" && (
        <div className="absolute z-10 pointer-events-none flex flex-col items-center" style={{ left: "28%", top: "78%", transform: "translate(-50%, -85%)" }}>
          <div className="bg-[#fff9ea] text-amber-950 text-[11px] font-bold px-2.5 py-0.5 rounded border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] mb-1 whitespace-nowrap">
            🐫 Royal Desert Camel
          </div>
          <img src="/rajasthan-camel.png" alt="Royal Desert Camel" className="w-48 h-48 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]" style={{ imageRendering: "pixelated" }} />
        </div>
      )}

      {scene === "badal_mahal_terrace" && (
        <div className="absolute z-10 pointer-events-none flex flex-col items-center" style={{ left: "68%", top: "72%", transform: "translate(-50%, -80%) scale(1.25)" }}>
          <div className="bg-[#fff9ea] text-amber-950 text-[11px] font-bold px-2.5 py-0.5 rounded border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] mb-1 whitespace-nowrap animate-pulse">
            🐘 Royal Elephant to Kuldhara
          </div>
          <img src="/rajasthan-elephant.png" alt="Royal Elephant" className="w-44 h-44 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]" style={{ imageRendering: "pixelated" }} />
        </div>
      )}

      {scene === "kuldhara_gate" && (
        <div className="absolute z-10 pointer-events-none flex flex-col items-center" style={{ left: "22%", top: "84%", transform: "translate(-50%, -82%) scale(1.15)" }}>
          <div className="bg-[#fff9ea] text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded border border-black shadow-sm mb-1 whitespace-nowrap">
            🐘 Royal Elephant (Dismounted)
          </div>
          <img src="/rajasthan-elephant.png" alt="Royal Elephant" className="w-36 h-36 object-contain opacity-90 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]" style={{ imageRendering: "pixelated" }} />
        </div>
      )}

      {/* --- PLAYER SPRITE --- */}
      {!isElephantTravelling && !isBhangarhTravelling && (
        <div
          className="absolute z-20 pointer-events-none flex flex-col items-center"
          style={{
            left: `${playerPos.x}%`,
            top: `${playerPos.y}%`,
            transformOrigin: "bottom center",
            transform: `translate(-50%, -96%) scale(${scene === "vijay_stambh" ? 1.035
                : scene === "vijay_stambh_interior" ? 1.05
                  : scene === "jauhar_passage" ? 0.75 + (playerPos.y - 56) * 0.011
                    : scene === "jauhar_kund" ? 0.90 + (playerPos.y - 57) * 0.009
                      : scene === "kumbhalgarh_gate" ? 0.85 + (playerPos.y - 65) * 0.012
                        : scene === "kumbhalgarh_interior_stairs" ? 0.80 + (playerPos.y - 52) * 0.009
                          : scene === "kumbhalgarh_great_wall" ? 0.46 + (playerPos.y - 36) * 0.013
                            : scene === "kumbhalgarh_zigzag_gates" ? 0.75 + (playerPos.y - 52) * 0.011
                              : scene === "badal_mahal_courtyard" ? 1.00 + (playerPos.y - 70) * 0.010
                                : scene === "badal_mahal_interior" ? 1.45 + (playerPos.y - 80) * 0.008
                                  : scene === "badal_mahal_terrace" ? 1.10 + (playerPos.y - 60) * 0.010
                                    : scene === "kuldhara_gate" ? 0.80 + (playerPos.y - 48) * 0.009
                                      : scene === "chiefs_house" ? 0.95 + (playerPos.y - 50) * 0.008
                                        : scene === "treasury" ? 0.90 + (playerPos.y - 52) * 0.009
                                          : scene === "well" ? 0.85 + (playerPos.y - 54) * 0.010
                                            : scene === "village_square" ? 0.90 + (playerPos.y - 55) * 0.008
                                              : scene === "bhangarh_gate" ? 0.80 + (playerPos.y - 50) * 0.009
                                                : scene === "gopinath_temple" ? 0.95 + (playerPos.y - 52) * 0.008
                                                  : scene === "palace_ruins" ? 0.85 + (playerPos.y - 48) * 0.009
                                                    : scene === "bhangarh_chase" ? 0.80 + (playerPos.y - 52) * 0.010
                                                      : 1.15
              }) scaleX(${facingLeft ? -1 : 1})`,
          }}
        >
          <img
            src="/player.png"
            alt="Player"
            className="w-32 h-32 object-contain"
            style={{
              imageRendering: "pixelated",
              transform: `translateY(${walkBob}px) rotate(${walkSway}deg)`,
              transition: isWalking ? "none" : "transform 0.15s ease-out",
            }}
          />
        </div>
      )}

      {/* --- JOLLY BHAI (GENIE) COMPANION FOLLOWER WITH DYNAMIC BEHAVIORS --- */}
      {(() => {
        // Mode 1: 💥 Crazy Shake - ONLY when player is in actual close proximity to an uncollected clue that hasn't been given/alerted yet!
        const activeClueKey =
          (isNearHaveliOrnament && !hasWeddingOrnament && !givenClueAlerts["kuldhara_ornament"]) ? "kuldhara_ornament"
            : (isNearTaxLedger && !hasTaxLedger && !givenClueAlerts["kuldhara_ledger"]) ? "kuldhara_ledger"
              : (isNearStepwellPots && !hasWaterPotsSupplies && !givenClueAlerts["kuldhara_well"]) ? "kuldhara_well"
                : (stage === 4 && isNearKathputliFragment && !hasKathputliFragment && !givenClueAlerts["bhangarh_kathputli"]) ? "bhangarh_kathputli"
                  : (stage === 4 && isNearPaliwalSeal && !hasPaliwalSeal && !givenClueAlerts["bhangarh_seal"]) ? "bhangarh_seal"
                    : (stage === 4 && isNearWanderersVerse && !hasWanderersVerse && !givenClueAlerts["bhangarh_verse"]) ? "bhangarh_verse"
                      : null;

        const isClueNearby = !!activeClueKey;

        // Mode 2: 🤔 Doubt - In mystery deduction or conflicting evidence!
        const isDoubt =
          (stage === 3 && scene === "village_square" && !showStage3CompleteModal) ||
          (stage === 4 && showFolkloreClassifierModal);

        // Mode 3: ✨ Glowing - At the historical threshold or secret lore!
        const isGlowing = (stage === 3 && scene === "kuldhara_gate" && !hasHeardKuldharaSecretLore) || (stage === 4);

        // Resolved Mode
        const mode = isClueNearby ? "shaking" : isDoubt ? "doubt" : isGlowing ? "glowing" : "normal";

        return !isElephantTravelling && !isBhangarhTravelling && (
          <div
            className="absolute z-20 pointer-events-auto cursor-pointer group transition-all duration-700 ease-out"
            style={{
              left: `${facingLeft ? playerPos.x + 8.5 : playerPos.x - 8.5}%`,
              top: `${(mode === "glowing" || mode === "doubt") ? playerPos.y - 18.0 : playerPos.y - 12.0}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => {
              if (activeClueKey) {
                markClueGiven(activeClueKey);
              }
              triggerJollyDialogue(mode);
            }}
            title={
              mode === "shaking"
                ? "💥 Jolly Bhai (Crazy Shake: Clue is right here!)"
                : mode === "doubt"
                  ? "🤔 Jolly Bhai (Doubt: Weighing the mystery!)"
                  : mode === "glowing"
                    ? (stage === 4 ? "✨ Jolly Bhai (Bhangarh Fort Lore & History)" : "✨ Jolly Bhai (Secret Lore: Untold History!)")
                    : "🧞 Jolly Bhai (Your Time-Traveling Genie Companion)"
            }
          >
            <div
              className={`relative ${mode === "shaking"
                  ? "animate-crazy-shake"
                  : mode === "doubt"
                    ? "animate-puzzled-doubt"
                    : "animate-bounce"
                }`}
              style={mode === "normal" || mode === "glowing" ? { animationDuration: '3.5s' } : undefined}
            >
              <img
                src="/genie_rajasthani_transparent.png"
                alt="Jolly Bhai Genie"
                className="w-24 h-24 md:w-28 md:h-28 object-contain transition-all group-hover:scale-110"
                style={{
                  imageRendering: "pixelated",
                  transform: facingLeft ? "scaleX(1)" : "scaleX(-1)",
                  filter:
                    mode === "glowing"
                      ? "drop-shadow(2px 0 0 #ffffff) drop-shadow(-2px 0 0 #ffffff) drop-shadow(0 2px 0 #ffffff) drop-shadow(0 -2px 0 #ffffff) drop-shadow(1.5px 1.5px 0 #ffffff) drop-shadow(-1.5px -1.5px 0 #ffffff) drop-shadow(1.5px -1.5px 0 #ffffff) drop-shadow(-1.5px 1.5px 0 #ffffff) drop-shadow(0 0 8px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 18px rgba(254, 240, 138, 0.75)) brightness(1.15)"
                      : mode === "shaking"
                        ? "drop-shadow(0 0 16px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 30px rgba(249, 115, 22, 0.85)) brightness(1.25)"
                        : mode === "doubt"
                          ? "drop-shadow(0 0 12px rgba(168, 85, 247, 0.85)) drop-shadow(0 0 24px rgba(99, 102, 241, 0.65)) brightness(1.15)"
                          : "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
                }}
              />

              {/* Mode Badge - Matching exact design */}
              <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 border-[2.5px] border-black rounded-full px-3 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black whitespace-nowrap transition-all flex items-center gap-1.5 pointer-events-none z-30 ${mode !== "normal"
                    ? "opacity-100 bg-white text-black"
                    : "opacity-0 group-hover:opacity-100 bg-white text-black"
                  }`}
              >
                {mode === "shaking" && <span>💥 Clue Alert!</span>}
                {mode === "doubt" && <span>🤔 Pondering Doubt</span>}
                {mode === "glowing" && <span>{stage === 4 ? "✨ Bhangarh Fort Lore" : "✨ Secret Lore"}</span>}
                {mode === "normal" && <span>Ask Jolly Bhai 🧞</span>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- STAGE 4: TINY FALLEN CLUE FRAGMENTS ON THE GROUND (HARD TO FIND, NO TEXT, NO EMOJIS) --- */}
      {/* Clue 1: Kathputli Fragment (bhangarh_gate - tiny fragment fallen on far-left ground shadow) */}
      {stage === 4 && scene === "bhangarh_gate" && !hasKathputliFragment && (
        <div
          className="absolute z-10 pointer-events-auto cursor-pointer select-none transition-all duration-300"
          style={{ left: "16.5%", top: "82%", transform: "translate(-50%, -50%)" }}
          onClick={() => {
            hasTriggeredClue1Ref.current = true;
            markClueGiven("bhangarh_kathputli");
            soundFx.playClueChime();
            setHasKathputliFragment(true);
            setShowKathputliModal(true);
            stopNarration();
            playNarration("You have unlocked the first clue! The Kathputli Sandstone Fragment reveals the secrets of the royal court!", {
              speaker: "ratan",
              pace: 0.90,
              language_code: "en-IN",
            });
          }}
        >
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-xs overflow-hidden shadow-[0_3px_6px_rgba(0,0,0,0.95)] opacity-70 hover:opacity-100 transition-opacity border border-stone-800/60"
            style={{
              transform: "perspective(400px) rotateX(55deg) rotateZ(22deg)",
              filter: "brightness(0.65) contrast(1.15)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/artifact-kathputli-fragment.jpg" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Clue 2: Paliwal Ledger Seal (gopinath_temple - tiny seal fallen on the dark stone steps) */}
      {stage === 4 && scene === "gopinath_temple" && !hasPaliwalSeal && (
        <div
          className="absolute z-10 pointer-events-auto cursor-pointer select-none transition-all duration-300"
          style={{ left: "82.5%", top: "74%", transform: "translate(-50%, -50%)" }}
          onClick={() => {
            hasTriggeredClue2Ref.current = true;
            markClueGiven("bhangarh_seal");
            soundFx.playClueChime();
            setHasPaliwalSeal(true);
            setShowPaliwalSealModal(true);
            stopNarration();
            playNarration("You have unlocked the second clue! The Paliwal Ledger Seal sheds light on the trade and wealth of Bhangarh!", {
              speaker: "ratan",
              pace: 0.90,
              language_code: "en-IN",
            });
          }}
        >
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden shadow-[0_3px_6px_rgba(0,0,0,0.95)] opacity-70 hover:opacity-100 transition-opacity border border-stone-800/60"
            style={{
              transform: "perspective(400px) rotateX(50deg) rotateZ(-15deg)",
              filter: "brightness(0.62) contrast(1.15)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/artifact-paliwal-ledger-seal.jpg" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Clue 3: Wanderer's Verse (palace_ruins - tiny medallion fallen in the cracked rubble terrace) */}
      {stage === 4 && scene === "palace_ruins" && !hasWanderersVerse && (
        <div
          className="absolute z-10 pointer-events-auto cursor-pointer select-none transition-all duration-300"
          style={{ left: "18%", top: "62%", transform: "translate(-50%, -50%)" }}
          onClick={() => {
            hasTriggeredClue3Ref.current = true;
            markClueGiven("bhangarh_verse");
            soundFx.playClueChime();
            setHasWanderersVerse(true);
            setShowWanderersVerseModal(true);
            stopNarration();
            playNarration("You have unlocked the third clue! The Wanderer's Verse Medallion uncovers the fateful curse of the palace ruins!", {
              speaker: "ratan",
              pace: 0.90,
              language_code: "en-IN",
            });
          }}
        >
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden shadow-[0_3px_6px_rgba(0,0,0,0.95)] opacity-70 hover:opacity-100 transition-opacity border border-stone-800/60"
            style={{
              transform: "perspective(400px) rotateX(48deg) rotateZ(30deg)",
              filter: "brightness(0.62) contrast(1.15)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/artifact-wanderers-verse.jpg" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* --- INTERACTION PROMPT BANNERS --- */}
      {/* Stage 1 */}
      {isNearRamPolDoor && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce pointer-events-none">
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Building
        </div>
      )}

      {isNearChacha && !showChachaDialogue && !showChauparGame && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => triggerBuzurgChachaDialogue(false)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Play Chaupar with Buzurg Chacha
        </div>
      )}

      {isNearVijayStambhDoor && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => { setScene("vijay_stambh_interior"); setPlayerPos({ x: 50.0, y: 78.0 }); }}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Vijay Stambh (Tower of Victory)
        </div>
      )}

      {/* --- VIJAY STAMBH: THE SCULPTOR'S TESTAMENT SINGLE-SCREEN PUZZLE SYSTEM --- */}
      {scene === "vijay_stambh_interior" && (
        <VijayStambhCarvingSystem
          playerPos={playerPos}
          onTriggerJollySpeech={(text, badge = "normal") => {
            setJollySpeechText(text);
            setJollyStatusBadge(badge);
            setJollyOptions([
              { id: 99, text: "Understood, Jolly Bhai!" }
            ]);
            setShowJollyDialogue(true);
          }}
          onPuzzleSolved={() => {
            // Unlocks progression or campaign completion
          }}
          onExitInterior={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("vijay_stambh");
              setPlayerPos({ x: 40.0, y: 76.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        />
      )}

      {/* --- BADAL MAHAL: LIGHT THE 3 LAMPS MINI-GAME --- */}
      {scene === "badal_mahal_interior" && (
        <BadalMahalLampGame
          playerPos={playerPos}
          onTriggerJollySpeech={(text, badge = "normal") => {
            setJollySpeechText(text);
            setJollyStatusBadge(badge);
            setJollyOptions([
              { id: 99, text: "Understood, Jolly Bhai!" }
            ]);
            setShowJollyDialogue(true);
          }}
          onGameComplete={() => {
            // Completed 3 lamps
          }}
        />
      )}

      {isNearCamel && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce pointer-events-none">
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Board Camel to Kumbhalgarh Fort (Stage 2)
        </div>
      )}

      {/* Stage 2 */}
      {isNearTerraceElephant && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-5 py-2.5 shadow-[5px_5px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={startElephantJourney}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Mount Royal Elephant to Kuldhara Ghost Village (Stage 3)
        </div>
      )}

      {/* Stage 3 (Kuldhara) */}
      {isNearPillar83 && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => { setHasPillar83Inspected(true); setShowPillar83Modal(true); }}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Inspect Inscribed &apos;83&apos; Marker Pillar
        </div>
      )}

      {isNearHaveliOrnament && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => { soundFx.playClueFound(); setHasWeddingOrnament(true); setShowHaveliOrnamentModal(true); }}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Inspect Bridal Wedding Ornament in Alcove
        </div>
      )}

      {isNearTaxLedger && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => { soundFx.playClueFound(); setHasTaxLedger(true); setShowTaxLedgerModal(true); }}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Examine Torn Tax Ledger &amp; Grain Storage
        </div>
      )}

      {isNearStepwellPots && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => { soundFx.playClueFound(); setHasWaterPotsSupplies(true); setShowStepwellModal(true); }}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Inspect Intact Water Pots &amp; Supply Caches
        </div>
      )}

      {isNearChhatriDeduction && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black rounded-xl px-5 py-3 shadow-[5px_5px_0_0_rgba(0,0,0,1)] text-[13px] font-black tracking-wide flex items-center gap-2.5 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => setShowStage3CompleteModal(true)}>
          <span className="bg-black text-amber-400 rounded px-2 py-0.5 text-[11px] font-mono">E</span>
          Inspect Memorial Chhatri (Uncover Legend of Kuldhara)
        </div>
      )}


      {isNearBhangarhGateMarker && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => setShowGateFragmentPuzzleModal(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Decode Gate Inscription Fragments (Foundation Chronicle)
        </div>
      )}

      {isNearTempleSanctuary && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => setShowTorchlightRestorationModal(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Moonlight Inspection: Decode Nagara Reliefs &amp; Royal Baoli Motifs
        </div>
      )}

      {isNearPalaceStratum && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => setShowRuinsClueTrailModal(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Inspect Archaeological Stratum (1783 CE Chalisa Famine Layer)
        </div>
      )}

      {isNearFolkloreBoard && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => setShowFolkloreClassifierModal(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Classify Evidence: Historical Fact vs. Oral Folklore
        </div>
      )}

      {isNearFinalEvidenceBoard && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black rounded-xl px-6 py-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)] text-[14px] font-black tracking-wide flex items-center gap-2.5 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => setShowFinalEvidenceBoardModal(true)}>
          <span className="bg-black text-amber-400 rounded px-2.5 py-1 text-[12px] font-mono">E</span>
          The Grand Climax: Assemble Final Historical Evidence Board
        </div>
      )}

      {/* --- KULDHARA FORWARD NAVIGATION PROMPTS --- */}
      {isNearGateVillagePath && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("chiefs_house");
              setPlayerPos({ x: 50.0, y: 86.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>▲</span> Walk north into the Chief&apos;s Haveli (Press E or click)
        </div>
      )}

      {isNearHaveliTreasuryDoor && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("treasury");
              setPlayerPos({ x: 50.0, y: 86.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>▲</span> Walk north into the Grain Merchant Treasury (Press E or click)
        </div>
      )}

      {isNearTreasuryWellDoor && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("well");
              setPlayerPos({ x: 22.0, y: 82.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>►</span> Walk east to the Village Stepwell (Press E or click)
        </div>
      )}

      {isNearStepwellSquareDoor && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("village_square");
              setPlayerPos({ x: 25.0, y: 80.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>►</span> Walk east into the Central Village Square (Press E or click)
        </div>
      )}

      {/* --- KULDHARA BACKWARD NAVIGATION PROMPTS (ALLOW GOING BACK) --- */}
      {isNearHaveliGateExit && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("kuldhara_gate");
              setPlayerPos({ x: 50.0, y: 64.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>▼</span> Walk south to return to Kuldhara Village Gate (Press F or click)
        </div>
      )}

      {isNearTreasuryHaveliExit && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("chiefs_house");
              setPlayerPos({ x: 50.0, y: 62.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>▼</span> Walk south to return to Chief&apos;s Haveli (Press F or click)
        </div>
      )}

      {isNearStepwellTreasuryExit && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("treasury");
              setPlayerPos({ x: 68.0, y: 72.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>◄</span> Walk west to return to Grain Treasury (Press F or click)
        </div>
      )}

      {isNearSquareWellExit && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("well");
              setPlayerPos({ x: 74.0, y: 78.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>◄</span> Walk west to return to Village Stepwell (Press F or click)
        </div>
      )}

      {isNearBhangarhGateArch && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("gopinath_temple");
              setPlayerPos({ x: 50.0, y: 86.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>▲</span> Enter Royal Baoli &amp; Colonnade Ruins (Press E)
        </div>
      )}

      {isNearTemplePalaceDoor && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("palace_ruins");
              setPlayerPos({ x: 50.0, y: 86.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>►</span> Ascend to Royal Palace Ruins (Press E)
        </div>
      )}

      {/* Backward Exit Prompts */}
      {isNearTempleGateExit && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("bhangarh_gate");
              setPlayerPos({ x: 50.0, y: 65.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>▼</span> Walk down to return to Bhangarh Gate (Press F)
        </div>
      )}

      {isNearPalaceTempleExit && (
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("gopinath_temple");
              setPlayerPos({ x: 68.0, y: 70.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span>▼</span> Walk down to return to Royal Baoli (Press F)
        </div>
      )}

      {/* --- KULDHARA HISTORICAL NARRATOR BANNER (SARVAM AI) --- */}
      {showKuldharaNarratorBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl pointer-events-auto select-none animate-in slide-in-from-top-4 duration-300">
          <div className="bg-[#fff9e6] border-4 border-black rounded-xl p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-400 border-2 border-black flex items-center justify-center text-xl shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              🎙️
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-black text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  Chronicles of Rajasthan · Historical Narrator (Sarvam AI)
                </span>
                <button
                  onClick={() => {
                    stopNarration();
                    setShowKuldharaNarratorBanner(false);
                    setHasKuldharaNarrationFinished(true);
                  }}
                  className="bg-white hover:bg-gray-100 text-black border-2 border-black rounded-md px-2 py-0.5 text-xs font-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                  title="Dismiss Narration"
                >
                  ✕
                </button>
              </div>
              <p className="text-[13.5px] font-extrabold text-black leading-snug">
                &ldquo;{kuldharaNarratorSentence}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- BHANGARH HISTORICAL NARRATOR BANNER (SARVAM AI) --- */}
      {showBhangarhNarratorBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl pointer-events-auto select-none animate-in slide-in-from-top-4 duration-300">
          <div className="bg-[#fff9e6] border-4 border-red-950 rounded-xl p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-600 border-2 border-black flex items-center justify-center text-xl shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-white">
              🎙️
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-black text-red-900 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  Bhangarh Fort · Haunting Warning (Sarvam AI Narrator)
                </span>
                <button
                  onClick={() => {
                    stopNarration();
                    setShowBhangarhNarratorBanner(false);
                  }}
                  className="bg-white hover:bg-gray-100 text-black border-2 border-black rounded-md px-2 py-0.5 text-xs font-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                  title="Dismiss Narration"
                >
                  ✕
                </button>
              </div>
              <p className="text-[13.5px] font-extrabold text-black leading-snug">
                &ldquo;Find the given clue in the Bhangarh Fort: why is the given palace haunted, before the evil spirits attack you!&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- BUZURG CHACHA HISTORICAL DIALOGUE PANEL (STAGE 1) --- */}
      {showChachaDialogue && (
        <DialoguePanel
          characterName="Buzurg Chacha"
          characterTitle="Chaupar Master & Royal Elder of Chittorgarh"
          dialogueText={chachaSpeechText}
          characterId="chacha"
          audioUrl={chachaAudioUrl}
          preventAiOnOptionSelect={true}
          historicalContext={{
            era: "rajasthan",
            location: "Chittorgarh Fort - Royal Courtyard",
            ruler: "Maharana Kumbha & Rajput Rulers",
            nearby_monuments: "Vijay Stambh, Kirti Stambh, Jauhar Kund, Kumbhalgarh Fort, Kuldhara",
            historical_events: "Siege of Chittorgarh, construction of Vijay Stambh by Rana Kumbha, ancient game of Chaupar"
          }}
          options={chachaOptions}
          onOptionSelect={(option) => {
            if (option.id === 1 || option.id === 3) {
              stopCharacterDialogue();
              setShowChachaDialogue(false);
              setShowChauparGame(true);
            } else if (option.id === 2) {
              const loreText = "Ah! Chaupar is no ordinary board game. It was played by Rajput Maharajas and ancient kings since the Mahabharata era! It tests your destiny, your foresight, and your patience. Win three rounds with your Golden Goti, and the passage deeper into Chittorgarh Fort will open for you!";
              setChachaAudioUrl("/buzurg_chacha_chaupar_lore.wav");
              setChachaSpeechText(loreText);
              setChachaOptions([
                { id: 1, text: "I understand, Chacha-ji! Let us roll the pasa dice now!" },
                { id: 4, text: "I will look around the courtyard first." }
              ]);
            } else if (option.id === 4 || option.id === 10 || option.id === 11) {
              stopCharacterDialogue();
              setShowChachaDialogue(false);
            }
          }}
          onClose={() => {
            stopCharacterDialogue();
            setShowChachaDialogue(false);
          }}
        />
      )}

      {/* --- JOLLY BHAI COMPANION HISTORICAL DIALOGUE PANEL --- */}
      {showJollyDialogue && (
        <DialoguePanel
          characterName="Jolly Bhai"
          characterTitle="Ancient Time-Traveling Genie Companion"
          dialogueText={jollySpeechText}
          statusBadge={jollyStatusBadge}
          characterId="jolly"
          audioUrl={jollyAudioUrl}
          preventAiOnOptionSelect={true}
          historicalContext={{
            era: "rajasthan",
            location: stage === 1 ? "Chittorgarh Fort" : stage === 2 ? "Kumbhalgarh Fort" : stage === 3 ? "Kuldhara Village" : "Bhangarh Fort",
            ruler: "Rajput Dynasties & Mewar Maharanas",
            nearby_monuments: "Vijay Stambh, Kumbhalgarh Great Wall, Badal Mahal, Kuldhara, Bhangarh",
            historical_events: "Chaupar matches, Chittorgarh sieges, Rajput chivalry and architectural mastery"
          }}
          options={jollyOptions}
          onOptionSelect={(option) => {
            if (option.id === 10) {
              setJollyStatusBadge("normal");
              const text = "Roll the wooden pasa dice with patience, mere aaka! Score higher than Chacha across the rounds to advance your Golden Goti to victory!";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
            } else if (option.id === 11) {
              setJollyStatusBadge("glowing");
              const text = "Vijay Stambh was erected by Maharana Kumbha in 1448 AD to celebrate his victory over the combined armies of Malwa and Gujarat. It stands nine storeys high and is adorned with intricate Hindu deities!";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
            } else if (option.id === 12) {
              setJollyStatusBadge("glowing");
              const text = "Jauhar Kund is the sacred historical site of mass self-immolation led by Rani Padmini and Rajput women to preserve their royal honour and dignity during the imperial sieges.";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
            } else if (option.id === 20) {
              setJollyStatusBadge("glowing");
              const text = "The Great Wall of Kumbhalgarh spans an astounding 36 kilometers across the Aravali range, making it the second longest continuous wall on Earth!";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
            } else if (option.id === 21) {
              setJollyStatusBadge("glowing");
              const text = "Maharana Kumbha was a legendary Mewar monarch, scholar, and architect who commissioned 32 of Mewar's 84 principal fortresses!";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
            } else if (option.id === 30) {
              setJollyStatusBadge("normal");
              const text = "That you have to find out, my aaka! Search the silent ruins, inspect the three clues, and uncover the mystery yourself.";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
              setJollyOptions([
                { id: 31, text: "Where should I search for the 3 clues?" },
                { id: 32, text: "Understood! Let's explore Kuldhara." }
              ]);
            } else if (option.id === 31) {
              setJollyStatusBadge("shaking");
              const text = "Look carefully, mere aaka! Search the Chief's Haveli for the bridal ornament, the Treasury for the torn tax ledger, and the Stepwell for intact water pots before the timer runs out!";
              setJollyAudioUrl("/jolly_kuldhara_clues_hint.wav");
              setJollySpeechText(text);
              setJollyOptions([
                { id: 30, text: "Why did the villagers go away from here?" },
                { id: 32, text: "Understood! Let's explore Kuldhara." }
              ]);
            } else if (option.id === 43) {
              setJollyStatusBadge("glowing");
              const text = "Bhangarh Fort was established in 1573 CE by Raja Bhagwant Das of Amber for his younger son Madho Singh. Madho Singh was the brother of celebrated Amber ruler and Mughal general, Man Singh I. The stronghold guarded strategic trade routes across the Aravali range!";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
              setJollyOptions([
                { id: 44, text: "What temples and architecture exist in Bhangarh?" },
                { id: 45, text: "Why does the ASI prohibit entry between sunset and sunrise?" },
                { id: 40, text: "Why is Bhangarh Palace haunted?" }
              ]);
            } else if (option.id === 44) {
              setJollyStatusBadge("glowing");
              const text = "Bhangarh was fortified with five massive gates—Lahori, Ajmeri, Phulbari, Delhi, and Hanuman Pol. It houses magnificent Nagara-style stone temples including Gopinath Temple, Someshwar, Keshav Rai, and Mangla Devi, along with a multi-tiered palace complex and royal stepwell baoli!";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
              setJollyOptions([
                { id: 43, text: "Who built Bhangarh Fort and when?" },
                { id: 45, text: "Why does the ASI prohibit entry between sunset and sunrise?" },
                { id: 40, text: "Why is Bhangarh Palace haunted?" }
              ]);
            } else if (option.id === 45) {
              setJollyStatusBadge("glowing");
              const text = "The Archaeological Survey of India (ASI) has placed warning boards prohibiting entry between sunset and sunrise! This is because Bhangarh borders the dense wilderness of the Sariska Tiger Reserve, where nocturnal predators like leopards roam among the dark ruins.";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
              setJollyOptions([
                { id: 43, text: "Who built Bhangarh Fort and when?" },
                { id: 44, text: "What temples and architecture exist in Bhangarh?" },
                { id: 40, text: "Why is Bhangarh Palace haunted?" }
              ]);
            } else if (option.id === 40 || option.id === 41) {
              setJollyStatusBadge("glowing");
              const text = "Mere aaka! The secret of why Bhangarh Palace is haunted cannot be revealed by me! The ancient curse strictly forbids it! You must search the rugged grounds with your own eyes and discover the tiny fallen clues before the evil spirits attack you!";
              setJollyAudioUrl(undefined);
              setJollySpeechText(text);
              setJollyOptions([
                { id: 43, text: "Who built Bhangarh Fort and when?" },
                { id: 44, text: "What temples and architecture exist in Bhangarh?" },
                { id: 42, text: "Understood! I will search the grounds myself." }
              ]);
            } else {
              setJollyStatusBadge("normal");
              stopCharacterDialogue();
              setShowJollyDialogue(false);
            }
          }}
          onClose={() => {
            setJollyStatusBadge("normal");
            stopCharacterDialogue();
            setShowJollyDialogue(false);
          }}
        />
      )}

      {/* --- AUTHENTIC VISUAL CHAUPAR (PACHISI) GAME MODAL --- */}
      <ChauparGame
        isOpen={showChauparGame}
        onClose={handleExitChauparGame}
        onComplete={() => {
          // Buzurg Chacha congratulates player and opens courtyard staircase
          const chachaWinSpeech = "Shabash, young warrior! You have triumphed in royal Chaupar and proven your wisdom and patience! Ascend the grand staircase to the upper passage and reach the glorious Vijay Stambh!";
          setChachaSpeechText(chachaWinSpeech);
          setChachaAudioUrl(undefined);
          setChachaOptions([
            { id: 10, text: "Ji Chacha-ji! Heading towards the staircase now." },
            { id: 11, text: "Thank you for the wonderful Chaupar match, Chacha-ji!" }
          ]);
          setShowChachaDialogue(true);
          playCharacterDialogue({
            character: "chacha",
            text: chachaWinSpeech,
          });
        }}
      />

      {/* --- ELEPHANT JOURNEY OVERLAY (STAGE 2 -> STAGE 3) --- */}
      {isElephantTravelling && (
        <div className="absolute inset-0 bg-[#0d0a07] z-50 flex items-center justify-center pointer-events-auto animate-in fade-in duration-700">
          <div className="absolute inset-0 opacity-30 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: elephantTravelPhase <= 2 ? 'url("/bg-kumbhalgarh-wall-top.jpg")' : 'url("/bg-journey-desert.jpg")' }}></div>
          <div className="relative z-10 bg-[#fff9ea] border-4 border-black rounded-2xl p-8 max-w-xl w-full shadow-[16px_16px_0_0_rgba(0,0,0,1)] flex flex-col items-center text-center">
            <div className="w-28 h-28 mb-4 bg-amber-100 rounded-2xl border-2 border-black flex items-center justify-center shadow-inner relative overflow-hidden">
              <img src="/rajasthan-elephant.png" alt="Royal Elephant" className="w-24 h-24 object-contain animate-bounce" style={{ animationDuration: "1.2s" }} />
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-widest mb-1">ROYAL ELEPHANT EXPEDITION</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-amber-950 font-black tracking-wide uppercase mb-3">
              {elephantTravelPhase === 1 ? "Departing Kumbhalgarh Citadel" : elephantTravelPhase === 2 ? "Across the Aravalli Hills" : elephantTravelPhase === 3 ? "Entering the Great Thar Desert" : "Approaching Kuldhara Ruins"}
            </h2>
            <div className="w-full h-3 bg-amber-200 my-4 border-2 border-black rounded-full overflow-hidden relative shadow-inner">
              <div className="absolute top-0 left-0 h-full bg-amber-600 transition-all duration-1000" style={{ width: `${elephantTravelPhase * 25}%` }}></div>
            </div>
            <p className="text-amber-900 font-serif font-bold italic text-[14px]">
              {elephantTravelPhase === 1 && "The royal elephant descends the mountain passes of Kumbhalgarh..."}
              {elephantTravelPhase === 2 && "Traversing ancient trade highways through lush Aravalli valleys..."}
              {elephantTravelPhase === 3 && "The greenery gives way to vast golden dunes and desert winds..."}
              {elephantTravelPhase === 4 && "The silent sandstone ruins of Kuldhara emerge across the horizon..."}
            </p>
          </div>
        </div>
      )}

      {/* --- BHANGARH NIGHTFALL CARAVAN OVERLAY (STAGE 3 -> STAGE 4) --- */}
      {isBhangarhTravelling && (
        <div className="absolute inset-0 bg-[#070913] z-50 flex items-center justify-center pointer-events-auto animate-in fade-in duration-700">
          <div className="absolute inset-0 opacity-40 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: 'url("/bg-journey-bhangarh.jpg")' }}></div>
          <div className="relative z-10 bg-[#fff9ea] border-4 border-amber-950 rounded-2xl p-8 max-w-xl w-full shadow-[16px_16px_0_0_rgba(0,0,0,1)] flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-4 bg-amber-900 text-white rounded-full border-3 border-amber-500 flex items-center justify-center text-4xl shadow-inner animate-pulse">
              🌙
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-widest mb-1">STAGE 4 TRANSITION • THE FINAL EXPEDITION</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-amber-950 font-black tracking-wide uppercase mb-3">
              {bhangarhTravelPhase === 1 ? "Leaving the Desert of Kuldhara" : bhangarhTravelPhase === 2 ? "Road into the Dark Aravallis" : bhangarhTravelPhase === 3 ? "Twilight Over the Wilderness" : "Arrival at Bhangarh Fort"}
            </h2>
            <div className="w-full h-3 bg-amber-200 my-4 border-2 border-black rounded-full overflow-hidden relative shadow-inner">
              <div className="absolute top-0 left-0 h-full bg-amber-800 transition-all duration-1000" style={{ width: `${bhangarhTravelPhase * 25}%` }}></div>
            </div>
            <p className="text-amber-900 font-serif font-bold italic text-[14px]">
              {bhangarhTravelPhase === 1 && "Leaving the solemn sands of Kuldhara behind as night approaches..."}
              {bhangarhTravelPhase === 2 && "The caravan enters the rugged mountain wilderness of Alwar..."}
              {bhangarhTravelPhase === 3 && "Torches flicker along the ancient road as the moon begins to rise..."}
              {bhangarhTravelPhase === 4 && "The monumental battlements of Bhangarh Fort stand silent under the starlit sky..."}
            </p>
          </div>
        </div>
      )}

      {/* --- STAGE 3 MODALS: KULDHARA --- */}
      {showPillar83Modal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-6 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-3">
              <span className="text-sm font-extrabold text-amber-950 uppercase tracking-widest flex items-center gap-2">📜 The Inscribed Pillar — Marker &apos;83&apos;</span>
              <button onClick={() => setShowPillar83Modal(false)} className="text-amber-900 hover:text-black font-bold text-sm bg-amber-200/60 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="bg-amber-100 border-l-4 border-amber-600 p-3 italic text-xs leading-relaxed text-amber-950">
              &quot;Eighty-four prosperous settlements founded by the Paliwal Brahmins vanished in a single night in 1825 CE without blood or battle to protect their dignity...&quot;
            </div>
            <button onClick={() => setShowPillar83Modal(false)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl border-2 border-black text-xs uppercase cursor-pointer self-end">Continue</button>
          </div>
        </div>
      )}

      {showHaveliOrnamentModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-5 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <span className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                💍 Clue 1: Royal Bridal Kundan Ring
              </span>
              <button onClick={() => { soundFx.playClose(); setShowHaveliOrnamentModal(false); }} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-52 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md bg-[#120c18] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/clue-bridal-ornament.jpg" alt="Royal Bridal Kundan Ring" className="w-full h-full object-contain pixelated" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-2.5 pointer-events-none">
                <span className="text-amber-200 font-serif font-bold text-xs flex items-center gap-1">💍 Village Chief&apos;s Haveli · Royal Evidence</span>
                <span className="text-amber-400 text-[10px] uppercase font-mono tracking-wide">Forced Marriage Ultimatum · Kundan Ruby Ring</span>
              </div>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-serif bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded italic">
              &quot;Left behind in the village chief&apos;s haveli. An ancient royal Kundan bridal ring with ruby and pearl filigree, proving the forced marriage ultimatum delivered by Prime Minister Salim Singh against the Paliwal daughter.&quot;
            </p>
            <button onClick={() => { soundFx.playButtonClick(); setShowHaveliOrnamentModal(false); }} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
              Add to Journal
            </button>
          </div>
        </div>
      )}

      {showTaxLedgerModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-5 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <span className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                📖 Clue 2: Torn Tax Ledger (Extortion Record)
              </span>
              <button onClick={() => { soundFx.playClose(); setShowTaxLedgerModal(false); }} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-52 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md bg-[#120c18] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/clue-torn-tax-ledger.jpg" alt="Torn Tax Ledger" className="w-full h-full object-contain pixelated" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-2.5 pointer-events-none">
                <span className="text-amber-200 font-serif font-bold text-xs flex items-center gap-1">📜 Merchant Treasury · Tax Ledger (Bahi-Khata)</span>
                <span className="text-amber-400 text-[10px] uppercase font-mono tracking-wide">Quadrupled Taxes &amp; Salim Singh Wax Seal</span>
              </div>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-serif bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded italic">
              &quot;Found hidden in the merchant treasury. An ancient Bahi-Khata ledger stamped with Salim Singh&apos;s royal wax seal, recording crushing quadrupled tax quotas imposed on Kuldhara&apos;s Paliwal merchants.&quot;
            </p>
            <button onClick={() => { soundFx.playButtonClick(); setShowTaxLedgerModal(false); }} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
              Add to Journal
            </button>
          </div>
        </div>
      )}

      {showStepwellModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-5 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <span className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                🏺 Clue 3: Intact Water Pots &amp; Supplies
              </span>
              <button onClick={() => { soundFx.playClose(); setShowStepwellModal(false); }} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-52 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md bg-[#120c18] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/clue-intact-water-pots.jpg" alt="Stepwell Supplies" className="w-full h-full object-contain pixelated" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-2.5 pointer-events-none">
                <span className="text-amber-200 font-serif font-bold text-xs flex items-center gap-1">🏺 Kuldhara Stepwell · Desert Water Cache</span>
                <span className="text-amber-400 text-[10px] uppercase font-mono tracking-wide">Painted Clay Matkas &amp; Evacuation Ropes</span>
              </div>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-serif bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded italic">
              &quot;Stacked neatly at the stepwell. Traditional painted terracotta matkas tied with travel ropes, proving a calm, coordinated overnight evacuation across all 84 Paliwal Brahmin settlements.&quot;
            </p>
            <button onClick={() => { soundFx.playButtonClick(); setShowStepwellModal(false); }} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
              Add to Journal
            </button>
          </div>
        </div>
      )}



      {/* --- STAGE 3 KULDHARA EVIDENCE BOARD & DEDUCTION PUZZLE MODAL --- */}
      {showDeductionModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-950 rounded-3xl p-6 shadow-[16px_16px_0_0_rgba(0,0,0,1)] max-w-2xl w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="font-extrabold text-amber-950 uppercase tracking-widest text-sm sm:text-base leading-tight">
                    🧩 Memorial Chhatri: Evidence Board Puzzle
                  </h3>
                  <span className="text-[11px] font-serif text-amber-800 font-semibold italic">
                    Piece together the 3 discovered clues to solve why Kuldhara was deserted overnight!
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDeductionModal(false)}
                className="text-amber-950 hover:bg-amber-200 font-bold text-xs px-3 py-1 rounded-lg border-2 border-amber-900 bg-amber-100 cursor-pointer shadow-sm"
              >
                ✕ Close Board
              </button>
            </div>

            {/* Clues Progress Bar */}
            <div className="flex items-center justify-between bg-amber-100/90 border border-amber-400 p-2.5 rounded-xl text-xs font-bold text-amber-950">
              <span>DISCOVERED EVIDENCE CLUES:</span>
              <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded-full border border-black font-mono">
                {cluesFound}/3 Clues Found
              </span>
            </div>

            {/* Interactive Evidence Matching Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Clue 1: Bridal Ornament */}
              <div className={`border-2 rounded-xl p-3 flex flex-col gap-2 transition-all ${hasWeddingOrnament ? "bg-amber-50/90 border-amber-800" : "bg-gray-100/60 border-gray-300 opacity-60"
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-950 uppercase">💍 Bridal Ornament</span>
                  {hasWeddingOrnament ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">FOUND</span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">LOCKED</span>
                  )}
                </div>
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-900/50 bg-amber-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/clue-bridal-ornament.jpg" alt="Bridal Ornament" className="w-full h-full object-cover" />
                </div>
                <label className="text-[10px] font-bold text-amber-900 uppercase mt-1">Select Explanation:</label>
                <select
                  disabled={!hasWeddingOrnament}
                  value={deductionState.ornamentChoice || ""}
                  onChange={(e) => setDeductionState((prev) => ({ ...prev, ornamentChoice: e.target.value as any }))}
                  className="w-full bg-white border border-amber-800 rounded p-1 text-xs font-serif font-bold text-amber-950 cursor-pointer disabled:bg-gray-200"
                >
                  <option value="">-- Choose Meaning --</option>
                  <option value="marriage">1. Forced Marriage Ultimatum</option>
                  <option value="extortion">2. Economic Tax Extortion</option>
                  <option value="evacuation">3. Secret Overnight Evacuation</option>
                </select>
              </div>

              {/* Clue 2: Torn Tax Ledger */}
              <div className={`border-2 rounded-xl p-3 flex flex-col gap-2 transition-all ${hasTaxLedger ? "bg-amber-50/90 border-amber-800" : "bg-gray-100/60 border-gray-300 opacity-60"
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-950 uppercase">📖 Torn Tax Ledger</span>
                  {hasTaxLedger ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">FOUND</span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">LOCKED</span>
                  )}
                </div>
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-900/50 bg-amber-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/clue-torn-tax-ledger.jpg" alt="Torn Tax Ledger" className="w-full h-full object-cover" />
                </div>
                <label className="text-[10px] font-bold text-amber-900 uppercase mt-1">Select Explanation:</label>
                <select
                  disabled={!hasTaxLedger}
                  value={deductionState.ledgerChoice || ""}
                  onChange={(e) => setDeductionState((prev) => ({ ...prev, ledgerChoice: e.target.value as any }))}
                  className="w-full bg-white border border-amber-800 rounded p-1 text-xs font-serif font-bold text-amber-950 cursor-pointer disabled:bg-gray-200"
                >
                  <option value="">-- Choose Meaning --</option>
                  <option value="marriage">1. Forced Marriage Ultimatum</option>
                  <option value="extortion">2. Quadrupled Tax Extortion</option>
                  <option value="evacuation">3. Secret Overnight Evacuation</option>
                </select>
              </div>

              {/* Clue 3: Intact Water Pots */}
              <div className={`border-2 rounded-xl p-3 flex flex-col gap-2 transition-all ${hasWaterPotsSupplies ? "bg-amber-50/90 border-amber-800" : "bg-gray-100/60 border-gray-300 opacity-60"
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-950 uppercase">🏺 Intact Water Pots</span>
                  {hasWaterPotsSupplies ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">FOUND</span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">LOCKED</span>
                  )}
                </div>
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-900/50 bg-amber-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/clue-intact-water-pots.jpg" alt="Stepwell Water Pots" className="w-full h-full object-cover" />
                </div>
                <label className="text-[10px] font-bold text-amber-900 uppercase mt-1">Select Explanation:</label>
                <select
                  disabled={!hasWaterPotsSupplies}
                  value={deductionState.suppliesChoice || ""}
                  onChange={(e) => setDeductionState((prev) => ({ ...prev, suppliesChoice: e.target.value as any }))}
                  className="w-full bg-white border border-amber-800 rounded p-1 text-xs font-serif font-bold text-amber-950 cursor-pointer disabled:bg-gray-200"
                >
                  <option value="">-- Choose Meaning --</option>
                  <option value="marriage">1. Forced Marriage Ultimatum</option>
                  <option value="extortion">2. Economic Tax Extortion</option>
                  <option value="evacuation">3. Coordinated Overnight Evacuation</option>
                </select>
              </div>
            </div>

            {/* Feedback Banner */}
            {deductionFeedback && (
              <div className="bg-red-100 border-l-4 border-red-600 p-2.5 rounded text-xs font-serif font-bold text-red-950 text-center animate-pulse">
                {deductionFeedback}
              </div>
            )}

            {/* Action Submit Button */}
            <button
              onClick={handleEvaluateDeduction}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-widest cursor-pointer transition-all active:translate-y-0.5"
            >
              📜 Submit Historical Deduction
            </button>
          </div>
        </div>
      )}

      {/* Stage 3 Complete Full-Screen Cinematic (The Fall / Image 2 Style) */}
      {showStage3CompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black select-none animate-in fade-in duration-500 overflow-hidden">
          {/* Background Artwork - True Full Screen Edge-to-Edge with no black bars */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kuldhara_solved_cinematic.jpg"
            alt="The Disappearance of Kuldhara"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Balanced cinematic shading: soft vignette that keeps artwork vibrant and text 100% readable */}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/75"></div>

          {/* Centered Content Card exactly matching user 2nd image style */}
          <div className="relative z-10 max-w-xl mx-auto px-6 py-10 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            {/* Small Orange Subtitle (like THE FALL in Image 2) */}
            <span className="text-[#f97316] font-black text-xs sm:text-sm tracking-[0.35em] uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              THE EXODUS
            </span>

            {/* Bold White Title (like Rusticated in the Rain in Image 2) */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 drop-shadow-[0_4px_16px_rgba(0,0,0,1)]">
              A Village That Chose Honor
            </h1>

            {/* Narrative Description matching Image 2 paragraph layout */}
            <p className="text-[14px] sm:text-[15.5px] text-gray-100 font-sans leading-relaxed mb-8 max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,1)] font-medium bg-black/30 backdrop-blur-[2px] p-4 rounded-xl border border-white/10">
              High taxes... a dying land... but their spirit could not be broken. When the tyrant minister Salim Singh levied crushing extortion upon Kuldhara, all eighty-four Paliwal villages packed their wealth and vanished overnight into the Thar desert, cursing the land so no soul could ever settle here again.
            </p>

            {/* Yellow / Gold Rounded CTA Buttons (matching Image 2 button design) */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  stopNarration();
                  startBhangarhJourney();
                }}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-sm px-8 py-3.5 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Continue to Bhangarh Fort (Stage 4 - Final) →
              </button>
              <button
                onClick={() => {
                  stopNarration();
                  setShowStage3CompleteModal(false);
                }}
                className="bg-black/50 hover:bg-black/70 text-white font-bold text-sm px-6 py-3.5 rounded-lg border border-white/30 backdrop-blur-sm active:translate-y-0.5 transition-all cursor-pointer"
              >
                Explore Ruins
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 4 PUZZLE 1: BHANGARH GATE INSCRIBED FRAGMENTS MODAL --- */}
      {showGateFragmentPuzzleModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-950 rounded-2xl p-6 shadow-[16px_16px_0_0_rgba(0,0,0,1)] max-w-2xl w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b-2 border-amber-800/40 pb-3">
              <div>
                <h3 className="font-extrabold text-amber-950 uppercase tracking-widest text-sm">📜 Puzzle 1: Decode Foundation Inscription</h3>
                <span className="text-[11px] text-amber-800 font-semibold">Select and reassemble the 4 stone fragments in correct chronological order</span>
              </div>
              <button onClick={() => setShowGateFragmentPuzzleModal(false)} className="text-amber-950 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-800 cursor-pointer">✕ Close</button>
            </div>

            {/* Sequence Order Slots */}
            <div className="grid grid-cols-4 gap-2 bg-amber-100/70 p-3 rounded-xl border border-amber-300">
              {[0, 1, 2, 3].map((slotIdx) => {
                const fragId = gateFragmentsOrder[slotIdx];
                return (
                  <div key={slotIdx} className="h-16 bg-white border-2 border-amber-900/40 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-mono text-gray-500 font-bold">Slot #{slotIdx + 1}</span>
                    <span className="text-[11px] font-bold text-amber-950 leading-tight">
                      {fragId === 1 && "1. 1573 CE Foundation"}
                      {fragId === 2 && "2. Madho Singh Patron"}
                      {fragId === 3 && "3. 5 Concentric Walls"}
                      {fragId === 4 && "4. 18th-C. Decline"}
                      {!fragId && "— Empty —"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Available Fragments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-1">
              {[
                { id: 1, label: "Fragment A", text: "Founded in 1573 CE by Bhagwant Das of Amber" },
                { id: 2, label: "Fragment B", text: "Constructed for his younger son, Raja Madho Singh" },
                { id: 3, label: "Fragment C", text: "Protected by five concentric fortified gates and markets" },
                { id: 4, label: "Fragment D", text: "Flourished until 18th-century droughts, famines, and raids" },
              ].map((frag) => {
                const isSelected = gateFragmentsOrder.includes(frag.id);
                return (
                  <div
                    key={frag.id}
                    onClick={() => handleToggleGateFragment(frag.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                        ? "bg-amber-200 border-amber-800 text-amber-950 shadow-inner"
                        : "bg-white hover:bg-amber-50 border-black text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-800">{frag.label}</span>
                      <span className="text-xs font-bold">{isSelected ? "✓ Placed" : "+ Select"}</span>
                    </div>
                    <p className="text-xs font-serif leading-snug">{frag.text}</p>
                  </div>
                );
              })}
            </div>

            {gatePuzzleFeedback && <div className="bg-amber-900/10 border-2 border-amber-600 p-2 rounded-xl text-center text-xs font-bold text-amber-950">{gatePuzzleFeedback}</div>}

            <div className="flex justify-between items-center mt-2">
              <button onClick={() => setGateFragmentsOrder([])} className="text-xs font-bold text-amber-900 underline cursor-pointer">Clear Sequence</button>
              <button onClick={handleVerifyGatePuzzle} className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-wider cursor-pointer">
                Verify Inscription Order
              </button>
            </div>
          </div>
        </div>
      )}



      {/* --- GRAND RAJASTHAN CAMPAIGN COMPLETE MODAL (THE FINAL VICTORY) --- */}
      {showGrandCampaignCompleteModal && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-950 rounded-2xl p-8 max-w-2xl w-full shadow-[24px_24px_0_0_rgba(0,0,0,1)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Grand Emblem */}
            <div className="w-24 h-24 bg-amber-500 text-white border-4 border-black rounded-full flex items-center justify-center text-4xl shadow-lg mb-3 animate-bounce">
              👑
            </div>

            <span className="text-xs font-mono font-bold text-amber-800 uppercase tracking-widest mb-1">
              GRAND RAJASTHAN CAMPAIGN COMPLETE • ALL 4 STAGES ACCOMPLISHED
            </span>

            <h2 className="text-2xl sm:text-3xl font-serif text-amber-950 font-black tracking-wide uppercase mb-2">
              The Imperial Chronicles of Rajputana
            </h2>

            <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent my-2"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 text-left w-full text-xs font-serif">
              <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-300">
                <span className="font-bold text-amber-950 block uppercase text-[11px] mb-1">1. Chittorgarh Fort</span>
                <p className="text-amber-900">The immortal bastion of Rajput valor, sacrifice, and the 9-story Tower of Victory.</p>
              </div>
              <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-300">
                <span className="font-bold text-amber-950 block uppercase text-[11px] mb-1">2. Kumbhalgarh Fort</span>
                <p className="text-amber-900">The invincible 36km Great Wall of India and the birthplace of Maharana Pratap.</p>
              </div>
              <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-300">
                <span className="font-bold text-amber-950 block uppercase text-[11px] mb-1">3. Kuldhara Village</span>
                <p className="text-amber-900">The 84 Paliwal Brahmin settlements who chose exile and honor over Salim Singh&apos;s tyranny.</p>
              </div>
              <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-300">
                <span className="font-bold text-amber-950 block uppercase text-[11px] mb-1">4. Bhangarh Fort</span>
                <p className="text-amber-900">The archaeological truth of 1783 CE famines and the cultural heritage of oral folklore.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-100 border-2 border-emerald-600 text-emerald-950 font-extrabold px-5 py-2.5 rounded-xl text-xs mb-4 shadow-sm">
              <span>★</span> +2500 Master Traveler XP • Grand Rajputana Explorer Title Unlocked!
            </div>

            <div className="flex gap-4 w-full">
              <button onClick={() => {
                stopNarration();
                stopCharacterDialogue();
                setShowGrandCampaignCompleteModal(false);
              }} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 px-4 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer">
                Revisit Bhangarh Fort
              </button>
              <button onClick={() => {
                stopNarration();
                stopCharacterDialogue();
                router.push("/dashboard");
              }} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-wider cursor-pointer">
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 4 ARTIFACT MODAL 1: KATHPUTLI FRAGMENT --- */}
      {showKathputliModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-5 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <span className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                🎭 Kathputli Fragment (Jaisalmer)
              </span>
              <button onClick={() => {
                setShowKathputliModal(false);
                if (hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse) {
                  setHasShield(true);
                  setShowShieldModal(true);
                }
              }} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-56 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/artifact-kathputli-fragment.jpg" alt="Kathputli Fragment" className="w-full h-full object-cover" />
            </div>
            <div className="bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded text-xs text-amber-950 leading-relaxed italic">
              &quot;Even in the desert, stories find a way to dance. A sandstone fragment symbolizing the tradition of storytelling, resilience and joy that keeps Rajputana&apos;s heritage alive.&quot;
            </div>
            <button onClick={() => {
              setShowKathputliModal(false);
              if (hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse) {
                setHasShield(true);
                setShowShieldModal(true);
              }
            }} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
              Add to Collection
            </button>
          </div>
        </div>
      )}

      {/* --- STAGE 4 ARTIFACT MODAL 2: PALIWAL LEDGER SEAL --- */}
      {showPaliwalSealModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-5 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <span className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                🐎 Paliwal Ledger Seal (Horse Seal)
              </span>
              <button onClick={() => {
                setShowPaliwalSealModal(false);
                if (hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse) {
                  setHasShield(true);
                  setShowShieldModal(true);
                }
              }} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-56 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/artifact-paliwal-ledger-seal.jpg" alt="Paliwal Ledger Seal" className="w-full h-full object-cover" />
            </div>
            <div className="bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded text-xs text-amber-950 leading-relaxed italic">
              &quot;They left behind empty homes, but a fuller history. A seal fragment from Kuldhara symbolizing administrative acumen, economic strength, and dignity.&quot;
            </div>
            <button onClick={() => {
              setShowPaliwalSealModal(false);
              if (hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse) {
                setHasShield(true);
                setShowShieldModal(true);
              }
            }} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
              Add to Collection
            </button>
          </div>
        </div>
      )}

      {/* --- STAGE 4 ARTIFACT MODAL 3: WANDERER'S VERSE --- */}
      {showWanderersVerseModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-5 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-2">
              <span className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                🦌 Wanderer&apos;s Verse (Antelope Medallion)
              </span>
              <button onClick={() => {
                setShowWanderersVerseModal(false);
                if (hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse) {
                  setHasShield(true);
                  setShowShieldModal(true);
                }
              }} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-56 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/artifact-wanderers-verse.jpg" alt="Wanderer's Verse" className="w-full h-full object-cover" />
            </div>
            <div className="bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded text-xs text-amber-950 leading-relaxed italic">
              &quot;Some paths are lost, but their stories never stop walking. A fragment inspired by Bhangarh symbolizing freedom, grace, and resilience.&quot;
            </div>
            <button onClick={() => {
              setShowWanderersVerseModal(false);
              if (hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse) {
                setHasShield(true);
                setShowShieldModal(true);
              }
            }} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
              Add to Collection
            </button>
          </div>
        </div>
      )}

      {/* --- STAGE 4 VICTORY SCREEN: BHANGARH CURSE LEGEND (PRINCESS RATNAVATI & TANTRIK SINGHIA) --- */}
      {showShieldModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center pointer-events-auto bg-black select-none animate-in fade-in duration-500 pb-8 sm:pb-12 px-4">
          {/* Background Artwork - Princess Ratnavati watching crushed Tantrik Singhia in the rain */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bhangarh_curse_legend_victory.jpg"
            alt="The Curse of Princess Ratnavati and Tantrik Singhia"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Cinematic Shading: Vignette ensuring artwork is visible while maintaining high text contrast */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30 pointer-events-none" />

          {/* Content Card formatted exactly like Image 2 */}
          <div className="relative z-10 max-w-3xl w-full mx-auto px-4 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            {/* Small Orange/Gold Subtitle Kicker */}
            <span className="text-[#f59e0b] font-black text-xs sm:text-sm tracking-[0.35em] uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              THE ANCIENT LEGEND REVEALED · BHANGARH FORT
            </span>

            {/* Bold Dramatic Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3 sm:mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,1)] uppercase">
              The Curse of Princess Ratnavati
            </h1>

            {/* Proper text explaining the authentic reason for the belief of Bhangarh Fort being haunted */}
            <div className="text-[12.5px] sm:text-[14px] text-gray-200 font-sans leading-relaxed mb-6 max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,1)] font-medium bg-black/60 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-white/15 text-left flex flex-col gap-2.5">
              <p>
                Having uncovered all hidden relics, the fateful mystery of why Bhangarh is believed to be haunted is revealed! According to historic folklore, <strong>Tantrik Singhia</strong>, a master of black magic, was desperately obsessed with the peerless beauty of <strong>Princess Ratnavati of Bhangarh</strong>. In secret, he enchanted a vial of scented oil with a dark love spell so she would surrender herself to him.
              </p>
              <p>
                Discerning the sinister sorcery, the astute princess cast the vial away onto a massive boulder. The bewitched rock was drawn to the tantrik, rolling down the hill and crushing Singhia beneath its immense weight! With his dying breath, the vengeful sorcerer cursed Bhangarh that every palace roof would crumble, destruction would follow, and no soul would ever live in peace.
              </p>
              <p>
                A year later, a catastrophic battle and the devastating <strong>Chalisa Famine of 1783</strong> ruined the township, causing it to be deserted forever. To this day, the legend holds that the roofless palace and desolate walls are haunted by the trapped, restless spirits of the tantrik and fallen townsfolk!
              </p>
            </div>

            {/* Golden Action Button */}
            <button
              onClick={() => {
                stopNarration();
                stopCharacterDialogue();
                setShowShieldModal(false);
                setIsCampaignComplete(true);
                setShowGrandCampaignCompleteModal(true);
                soundFx.playClueChime();
              }}
              className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-2 border-black hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <span className="text-base">🛡️</span>
              <span>Claim Royal Shield & Complete Campaign</span>
            </button>
          </div>
        </div>
      )}

      {/* --- KULDHARA 2-MIN CHALLENGE TIMEOUT MODAL (CINEMATIC RETRIBUTION SCREEN) --- */}
      {showKuldharaTimeOutModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center pointer-events-auto bg-black select-none animate-in fade-in duration-500 pb-6 sm:pb-8 px-4">
          {/* Background Artwork - Guard kicking player out into sand */}
          <img
            src="/kuldhara_timeout.jpg"
            alt="Expelled from Kuldhara"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Cinematic Shading: vignette ensuring artwork is visible while maintaining high text contrast */}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/60 pointer-events-none"></div>

          {/* Bottom Content Card matching Mughal punishment dark theme */}
          <div className="relative z-10 max-w-xl w-full mx-auto px-4 py-4 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            {/* Small Orange Subtitle */}
            <span className="text-[#f97316] font-black text-xs sm:text-sm tracking-[0.35em] uppercase mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              TIME EXPIRED • EXPELLED FROM RUINS
            </span>

            {/* Bold Dramatic Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,1)] uppercase">
              Caught by the Patrol Guard
            </h1>

            {/* Narrative Description with dark translucent glass backdrop */}
            <p className="text-[13px] sm:text-[14.5px] text-gray-100 font-sans leading-relaxed mb-5 max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,1)] font-medium bg-black/55 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
              "Time has expired! You failed to uncover all the evidence clues before the desert patrol caught you trespassing. You are cast out into the sands! You must start from the entrance of Kuldhara and search again."
            </p>

            {/* Golden Action Button */}
            <button
              onClick={handleRestartKuldhara}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="text-base">🔄</span>
              <span>Restart from Kuldhara Gate</span>
            </button>
          </div>
        </div>
      )}

      {/* --- BHANGARH 1-MIN CHALLENGE TIMEOUT MODAL (EVIL SPIRITS ATTACK - FULLSCREEN CINEMATIC) --- */}
      {showBhangarhTimeOutModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center pointer-events-auto bg-black select-none animate-in fade-in duration-500 pb-8 sm:pb-12 px-4">
          {/* Background Artwork - Evil spirits attack */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bhangarh_evil_spirits_attack.jpg"
            alt="Evil Spirits Attack at Bhangarh Fort"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Cinematic Shading: Vignette ensuring artwork is visible while maintaining high text contrast */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30 pointer-events-none" />

          {/* Bottom Content Card matching Image 2 reference */}
          <div className="relative z-10 max-w-2xl w-full mx-auto px-4 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            {/* Small Orange Subtitle Kicker */}
            <span className="text-[#f97316] font-black text-xs sm:text-sm tracking-[0.35em] uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              THE OVERTAKING · TIME EXPIRED
            </span>

            {/* Bold Dramatic Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3 sm:mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,1)] uppercase">
              Attacked by the Evil Spirits
            </h1>

            {/* Narrative Description with dark translucent glass backdrop */}
            <p className="text-[13px] sm:text-[14.5px] text-gray-200 font-sans leading-relaxed mb-6 max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,1)] font-medium bg-black/55 backdrop-blur-md p-4 rounded-xl border border-white/15 text-center">
              Your sixty seconds elapsed in the ominous silence of the ruins. As pitch-black darkness envelops Bhangarh Fort, the restless evil spirits materialize from the shadows with vengeful shrieks, driving you violently out of the cursed complex! Your quest has ended in defeat, and the ancient curse remains unbroken.
            </p>

            {/* Golden Action Button */}
            <button
              onClick={handleRestartBhangarhFort}
              className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-2 border-black hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <span className="text-base">🔄</span>
              <span>Try Again (Restart Bhangarh Fort)</span>
            </button>
          </div>
        </div>
      )}

      {/* --- RESTART CONFIRMATION MODAL --- */}
      {showRestartConfirmModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 pointer-events-auto animate-in fade-in duration-150">
          <div className="bg-[#fff9ea] border-4 border-black rounded-3xl p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-amber-950 leading-tight tracking-wide">
                  Restart Campaign?
                </h3>
                <p className="text-xs font-semibold text-neutral-700 mt-1.5 leading-relaxed">
                  Are you sure you want to restart? You may lose your current progress, discovered clues, and stage checkpoints in this campaign.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-amber-950/15">
              <button
                onMouseEnter={() => soundFx.playButtonHover()}
                onClick={() => {
                  soundFx.playKeyboardClick();
                  setShowRestartConfirmModal(false);
                }}
                className="px-4 py-2 border-2 border-black rounded-xl text-xs font-bold text-neutral-800 bg-white hover:bg-neutral-100 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onMouseEnter={() => soundFx.playButtonHover()}
                onClick={() => {
                  soundFx.playKeyboardClick();
                  setShowRestartConfirmModal(false);
                  handleResetGame();
                }}
                className="px-4 py-2 border-2 border-black rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yes, Restart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SCENE FADE TRANSITION OVERLAY --- */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black animate-in fade-in duration-300 z-50 pointer-events-none flex items-center justify-center">
          <span className="text-amber-300 text-sm font-serif tracking-widest uppercase animate-pulse">
            {getTransitionLabel()}
          </span>
        </div>
      )}

      {/* --- BOTTOM CENTER CONTROLS GUIDE --- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-600 rounded-full px-6 py-2 shadow-lg flex items-center gap-3">
          <span className="text-white text-[12px] font-bold tracking-wider">WASD / arrows</span>
          <span className="text-gray-400 text-[10px]">- move -</span>
          <span className="text-white text-[12px] font-bold tracking-wider">E</span>
          <span className="text-gray-400 text-[10px]">- inspect/decode -</span>
          <span className="text-white text-[12px] font-bold tracking-wider">F</span>
          <span className="text-gray-400 text-[10px]">- exit outside -</span>
        </div>
      </div>
    </div>
  );
}
