"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export type RajasthanStage = 1 | 2 | 3 | 4 | 5 | 6;

export type RajasthanSceneType =
  // Stage 1: Chittorgarh Fort
  | "ram_pol"
  | "inner_courtyard"
  | "vijay_stambh"
  | "jauhar_kund"
  // Stage 2: Kumbhalgarh Fort
  | "wall_approach"
  | "zigzag_gates"
  | "soldiers_quarters"
  | "badal_mahal"
  | "pratap_birthplace"
  // Stage 3: Jaigarh Fort -> Jal Mahal
  | "jaigarh_entry"
  | "jaivana_courtyard"
  | "jal_mahal"
  | "top_chhatri"
  // Stage 4: Kuldhara Ghost Village
  | "kuldhara_gate"
  | "chiefs_house"
  | "treasury"
  | "well"
  | "village_square"
  // Stage 5: Bhangarh Fort
  | "bhangarh_gate"
  | "gopinath_temple"
  | "palace_ruins"
  | "bhangarh_chase"
  // Stage 6: Jaisalmer Golden City
  | "jaisalmer_streets"
  | "kathputli_square"
  | "final_courtyard";

export default function RajasthanGameScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [stage, setStage] = useState<RajasthanStage>(1);
  const [scene, setScene] = useState<RajasthanSceneType>("ram_pol");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 82 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);

  // --- NEW FEATURE 1: CAMEL TRANSITION JOURNEY STATE ---
  const [isCamelJourneyActive, setIsCamelJourneyActive] = useState(false);
  const [camelProgress, setCamelProgress] = useState(0);
  const [camelJourneyTitle, setCamelJourneyTitle] = useState("");
  const [camelNextStage, setCamelNextStage] = useState<RajasthanStage>(2);
  const [camelNextScene, setCamelNextScene] = useState<RajasthanSceneType>("wall_approach");

  // --- NEW FEATURE 2: ANIMATED CASTLE HALL DOORS STATE ---
  const [doorOpenProgress, setDoorOpenProgress] = useState(0); // 0 = Closed, 1 = Fully Open
  const [isOpeningDoor, setIsOpeningDoor] = useState(false);

  // Transition Lock Cooldown Ref
  const transitionLockRef = useRef<number>(0);

  // Clues & Loss Tracker
  const [cluesFound, setCluesFound] = useState(0);
  const [lossCount, setLossCount] = useState(0);

  // --- STAGE 1 STATE (Chittorgarh Fort) ---
  const [showIntroNarrative, setShowIntroNarrative] = useState(true);
  const [showChachaDialogue, setShowChachaDialogue] = useState(false);
  const [showChauparGame, setShowChauparGame] = useState(false);
  const [isChauparSolved, setIsChauparSolved] = useState(false);
  const [playerChauparPos, setPlayerChauparPos] = useState(0);
  const [aiChauparPos, setAiChauparPos] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [chauparMessage, setChauparMessage] = useState("Roll cowrie shells to begin!");

  const [showCarvingPuzzle, setShowCarvingPuzzle] = useState(false);
  const [isCarvingSolved, setIsCarvingSolved] = useState(false);
  const [userCarvingOrder, setUserCarvingOrder] = useState<number[]>([]);
  const [carvingError, setCarvingError] = useState(false);
  const [showTowerView, setShowTowerView] = useState(false);
  const [showCaretakerDialogue, setShowCaretakerDialogue] = useState(false);

  const [showJauharCutscene, setShowJauharCutscene] = useState(false);
  const [isJauharCompleted, setIsJauharCompleted] = useState(false);
  const [showStage1Complete, setShowStage1Complete] = useState(false);

  // --- STAGE 2 STATE (Kumbhalgarh Fort) ---
  const [showGuardBheemDialogue, setShowGuardBheemDialogue] = useState(false);
  const [showLattuGame, setShowLattuGame] = useState(false);
  const [isLattuSolved, setIsLattuSolved] = useState(false);
  const [lattuPower, setLattuPower] = useState(50);
  const [lattuPowerDirection, setLattuPowerDirection] = useState(1);
  const [lattuMessage, setLattuMessage] = useState("Click Launch when power is in green zone!");
  const [lattuScore, setLattuScore] = useState({ player: 0, guard: 0 });

  const [showFrescoPuzzle, setShowFrescoPuzzle] = useState(false);
  const [isFrescoSolved, setIsFrescoSolved] = useState(false);
  const [selectedPigments, setSelectedPigments] = useState<string[]>([]);
  const [frescoError, setFrescoError] = useState(false);

  const [showPratapCutscene, setShowPratapCutscene] = useState(false);
  const [isPratapCompleted, setIsPratapCompleted] = useState(false);
  const [showStage2Complete, setShowStage2Complete] = useState(false);

  // --- STAGE 3 STATE (Jaigarh Fort & Jal Mahal) ---
  const [showArmorerDialogue, setShowArmorerDialogue] = useState(false);
  const [showCannonPuzzle, setShowCannonPuzzle] = useState(false);
  const [isCannonCalibrated, setIsCannonCalibrated] = useState(false);
  const [cannonElevation, setCannonElevation] = useState(30);
  const [cannonCharge, setCannonCharge] = useState(50);
  const [cannonMessage, setCannonMessage] = useState("Adjust elevation angle and gunpowder charge!");

  const [showHydraulicPuzzle, setShowHydraulicPuzzle] = useState(false);
  const [isHydraulicSolved, setIsHydraulicSolved] = useState(false);
  const [sluiceState, setSluiceState] = useState([true, false, false]);
  const [hydraulicError, setHydraulicError] = useState(false);

  const [showChhatriCutscene, setShowChhatriCutscene] = useState(false);
  const [isChhatriCompleted, setIsChhatriCompleted] = useState(false);
  const [showStage3Complete, setShowStage3Complete] = useState(false);

  // --- STAGE 4 STATE (Kuldhara Ghost Village) ---
  const [timerSeconds, setTimerSeconds] = useState(240);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [kuldharaClues, setKuldharaClues] = useState({
    gate: false,
    chief: false,
    treasury: false,
    well: false,
  });

  const [showGateMarkerModal, setShowGateMarkerModal] = useState(false);
  const [showChiefModal, setShowChiefModal] = useState(false);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [showWellModal, setShowWellModal] = useState(false);

  const [showEvidencePuzzle, setShowEvidencePuzzle] = useState(false);
  const [evidenceMatches, setEvidenceMatches] = useState<{ [key: string]: string }>({});
  const [evidenceError, setEvidenceError] = useState(false);
  const [isEvidenceSolved, setIsEvidenceSolved] = useState(false);

  const [showKuldharaTimeoutModal, setShowKuldharaTimeoutModal] = useState(false);
  const [showStage4Complete, setShowStage4Complete] = useState(false);

  // --- STAGE 5 STATE (Bhangarh Fort) ---
  const [bhangarhTimer, setBhangarhTimer] = useState(180);
  const [isBhangarhTimerActive, setIsBhangarhTimerActive] = useState(false);
  const [isTemplePaintingRestored, setIsTemplePaintingRestored] = useState(false);
  const [searchedRuinsSpots, setSearchedRuinsSpots] = useState({
    spot1: false,
    spot2: false,
    spot3: false,
  });
  const [isChalisaFound, setIsChalisaFound] = useState(false);

  const [showTempleModal, setShowTempleModal] = useState(false);
  const [showChalisaModal, setShowChalisaModal] = useState(false);
  const [isBhangarhChaseActive, setIsBhangarhChaseActive] = useState(false);
  const [showStage5Complete, setShowStage5Complete] = useState(false);

  // --- STAGE 6 STATE (Jaisalmer Golden City & Finale) ---
  const [showKathputliGame, setShowKathputliGame] = useState(false);
  const [isKathputliSolved, setIsKathputliSolved] = useState(false);
  const [puppetTiming, setPuppetTiming] = useState(50);
  const [puppetDirection, setPuppetDirection] = useState(1);
  const [puppetScore, setPuppetScore] = useState(0);
  const [kathputliMessage, setKathputliMessage] = useState("Pull puppet string when meter hits the green zone!");

  const [placedMosaicTiles, setPlacedMosaicTiles] = useState<number[]>([]);
  const [showMosaicAssembly, setShowMosaicAssembly] = useState(false);
  const [isMosaicAssembled, setIsMosaicAssembled] = useState(false);
  const [showFinaleCutscene, setShowFinaleCutscene] = useState(false);
  const [showCampaignCompleteModal, setShowCampaignCompleteModal] = useState(false);
  const [isCampaignComplete, setIsCampaignComplete] = useState(false);

  const router = useRouter();
  const horseSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      horseSoundRef.current = new Audio("/horse_sound.webm");
      horseSoundRef.current.volume = 0.5;
    }
  }, []);

  const handleResetGame = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStage(1);
      setScene("ram_pol");
      setPlayerPos({ x: 50, y: 82 });
      setFacingLeft(false);
      setCluesFound(0);
      setLossCount(0);
      setShowIntroNarrative(true);
      setDoorOpenProgress(0);
      setIsOpeningDoor(false);

      setShowChachaDialogue(false);
      setShowChauparGame(false);
      setIsChauparSolved(false);
      setPlayerChauparPos(0);
      setAiChauparPos(0);
      setIsPlayerTurn(true);
      setChauparMessage("Roll cowrie shells to begin!");

      setShowCarvingPuzzle(false);
      setIsCarvingSolved(false);
      setUserCarvingOrder([]);
      setCarvingError(false);
      setShowTowerView(false);
      setShowCaretakerDialogue(false);

      setShowJauharCutscene(false);
      setIsJauharCompleted(false);
      setShowStage1Complete(false);

      setShowGuardBheemDialogue(false);
      setShowLattuGame(false);
      setIsLattuSolved(false);
      setLattuScore({ player: 0, guard: 0 });
      setShowFrescoPuzzle(false);
      setIsFrescoSolved(false);
      setSelectedPigments([]);
      setShowPratapCutscene(false);
      setIsPratapCompleted(false);
      setShowStage2Complete(false);

      setShowArmorerDialogue(false);
      setShowCannonPuzzle(false);
      setIsCannonCalibrated(false);
      setCannonElevation(30);
      setCannonCharge(50);
      setShowHydraulicPuzzle(false);
      setIsHydraulicSolved(false);
      setSluiceState([true, false, false]);
      setShowChhatriCutscene(false);
      setIsChhatriCompleted(false);
      setShowStage3Complete(false);

      setTimerSeconds(240);
      setIsTimerActive(false);
      setKuldharaClues({ gate: false, chief: false, treasury: false, well: false });
      setShowGateMarkerModal(false);
      setShowChiefModal(false);
      setShowTreasuryModal(false);
      setShowWellModal(false);
      setShowEvidencePuzzle(false);
      setEvidenceMatches({});
      setEvidenceError(false);
      setIsEvidenceSolved(false);
      setShowKuldharaTimeoutModal(false);
      setShowStage4Complete(false);

      setBhangarhTimer(180);
      setIsBhangarhTimerActive(false);
      setIsTemplePaintingRestored(false);
      setSearchedRuinsSpots({ spot1: false, spot2: false, spot3: false });
      setIsChalisaFound(false);
      setShowTempleModal(false);
      setShowChalisaModal(false);
      setIsBhangarhChaseActive(false);
      setShowStage5Complete(false);

      setShowKathputliGame(false);
      setIsKathputliSolved(false);
      setPuppetScore(0);
      setPlacedMosaicTiles([]);
      setShowMosaicAssembly(false);
      setIsMosaicAssembled(false);
      setShowFinaleCutscene(false);
      setShowCampaignCompleteModal(false);
      setIsCampaignComplete(false);

      setIsTransitioning(false);

      localStorage.removeItem("rajasthan_save_v6");
    }, 400);
  };

  // Trigger Camel Caravan Journey Transition sequence
  const startCamelTransition = (nextStageNum: RajasthanStage, nextSceneName: RajasthanSceneType, titleBanner: string) => {
    setCamelJourneyTitle(titleBanner);
    setCamelNextStage(nextStageNum);
    setCamelNextScene(nextSceneName);
    setCamelProgress(0);
    setIsCamelJourneyActive(true);
  };

  // Camel Caravan Progress Loop
  useEffect(() => {
    if (!isCamelJourneyActive) return;
    const interval = setInterval(() => {
      setCamelProgress((prev) => {
        if (prev >= 100) {
          setIsCamelJourneyActive(false);
          setStage(camelNextStage);
          setScene(camelNextScene);
          setPlayerPos({ x: 50, y: 82 });
          setDoorOpenProgress(0); // Reset castle doors for new stage
          if (camelNextStage === 4) setIsTimerActive(true);
          if (camelNextStage === 5) setIsBhangarhTimerActive(true);
          return 100;
        }
        return prev + 2.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isCamelJourneyActive, camelNextStage, camelNextScene]);

  // Castle Hall Door Opening Animation Loop
  useEffect(() => {
    if (!isOpeningDoor) return;
    const interval = setInterval(() => {
      setDoorOpenProgress((prev) => {
        if (prev >= 1.0) {
          setIsOpeningDoor(false);
          return 1.0;
        }
        return prev + 0.08;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isOpeningDoor]);

  // Safe transition trigger with lock cooldown
  const triggerSceneTransition = useCallback((nextScene: RajasthanSceneType, nextSpawnPos: { x: number; y: number }) => {
    const now = Date.now();
    if (now - transitionLockRef.current < 600 || isTransitioning) return;
    transitionLockRef.current = now;
    setIsTransitioning(true);

    setTimeout(() => {
      setScene(nextScene);
      setPlayerPos(nextSpawnPos);
      setDoorOpenProgress(0); // Reset door state on new scene load
      setIsTransitioning(false);
    }, 400);
  }, [isTransitioning]);

  // Handle URL Endpoints and Save State
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlScene = urlParams.get("scene") as RajasthanSceneType | null;
        const saved = localStorage.getItem("rajasthan_save_v6");

        let finalStage: RajasthanStage = 1;
        let finalScene: RajasthanSceneType = urlScene || "ram_pol";
        let savedEvidenceSolved = false;
        let savedChalisaFound = false;

        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === "object") {
              if (parsed.isEvidenceSolved !== undefined) {
                savedEvidenceSolved = Boolean(parsed.isEvidenceSolved);
                setIsEvidenceSolved(savedEvidenceSolved);
              }
              if (parsed.isChalisaFound !== undefined) {
                savedChalisaFound = Boolean(parsed.isChalisaFound);
                setIsChalisaFound(savedChalisaFound);
              }
              if (parsed.stage) finalStage = Math.max(1, Math.min(6, Number(parsed.stage))) as RajasthanStage;
              if (!urlScene && parsed.scene) {
                finalScene = parsed.scene as RajasthanSceneType;
                if (parsed.playerPos && typeof parsed.playerPos.x === "number") setPlayerPos(parsed.playerPos);
              }
              if (parsed.cluesFound !== undefined) setCluesFound(Number(parsed.cluesFound));
              if (parsed.isChauparSolved !== undefined) setIsChauparSolved(Boolean(parsed.isChauparSolved));
              if (parsed.isCarvingSolved !== undefined) setIsCarvingSolved(Boolean(parsed.isCarvingSolved));
              if (parsed.isJauharCompleted !== undefined) setIsJauharCompleted(Boolean(parsed.isJauharCompleted));
              if (parsed.isLattuSolved !== undefined) setIsLattuSolved(Boolean(parsed.isLattuSolved));
              if (parsed.isFrescoSolved !== undefined) setIsFrescoSolved(Boolean(parsed.isFrescoSolved));
              if (parsed.isPratapCompleted !== undefined) setIsPratapCompleted(Boolean(parsed.isPratapCompleted));
              if (parsed.isCannonCalibrated !== undefined) setIsCannonCalibrated(Boolean(parsed.isCannonCalibrated));
              if (parsed.isHydraulicSolved !== undefined) setIsHydraulicSolved(Boolean(parsed.isHydraulicSolved));
              if (parsed.isChhatriCompleted !== undefined) setIsChhatriCompleted(Boolean(parsed.isChhatriCompleted));
              if (parsed.kuldharaClues !== undefined) setKuldharaClues(parsed.kuldharaClues);
              if (parsed.isTemplePaintingRestored !== undefined) setIsTemplePaintingRestored(Boolean(parsed.isTemplePaintingRestored));
              if (parsed.searchedRuinsSpots !== undefined) setSearchedRuinsSpots(parsed.searchedRuinsSpots);
              if (parsed.isKathputliSolved !== undefined) setIsKathputliSolved(Boolean(parsed.isKathputliSolved));
              if (parsed.isMosaicAssembled !== undefined) setIsMosaicAssembled(Boolean(parsed.isMosaicAssembled));
              if (parsed.isCampaignComplete !== undefined) setIsCampaignComplete(Boolean(parsed.isCampaignComplete));
            }
          } catch (e) {
            console.error("Failed to load Rajasthan save state safely", e);
          }
        }

        setStage(finalStage);
        setScene(finalScene);
        if (finalStage === 4 && !savedEvidenceSolved) {
          setIsTimerActive(true);
        }
        if (finalStage === 5 && !savedChalisaFound && finalScene !== "bhangarh_chase") {
          setIsBhangarhTimerActive(true);
        }
      }
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Sync endpoint URL on scene change
  useEffect(() => {
    if (typeof window !== "undefined" && scene !== "ram_pol") {
      window.history.replaceState(null, "", `?scene=${scene}`);
    } else if (typeof window !== "undefined" && scene === "ram_pol") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [scene]);

  // Save game progress automatically
  useEffect(() => {
    const handleBeforeUnload = () => {
      const saveState = {
        stage,
        scene,
        playerPos,
        cluesFound,
        isChauparSolved,
        isCarvingSolved,
        isJauharCompleted,
        isLattuSolved,
        isFrescoSolved,
        isPratapCompleted,
        isCannonCalibrated,
        isHydraulicSolved,
        isChhatriCompleted,
        kuldharaClues,
        isEvidenceSolved,
        isTemplePaintingRestored,
        searchedRuinsSpots,
        isChalisaFound,
        isKathputliSolved,
        isMosaicAssembled,
        isCampaignComplete,
      };
      localStorage.setItem("rajasthan_save_v6", JSON.stringify(saveState));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stage, scene, playerPos, cluesFound, isChauparSolved, isCarvingSolved, isJauharCompleted, isLattuSolved, isFrescoSolved, isPratapCompleted, isCannonCalibrated, isHydraulicSolved, isChhatriCompleted, kuldharaClues, isEvidenceSolved, isTemplePaintingRestored, searchedRuinsSpots, isChalisaFound, isKathputliSolved, isMosaicAssembled, isCampaignComplete]);

  // Stage 4 Countdown Timer Effect
  useEffect(() => {
    if (stage !== 4 || !isTimerActive || isEvidenceSolved) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          setShowKuldharaTimeoutModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, isTimerActive, isEvidenceSolved]);

  // Stage 5 Countdown Timer Effect
  useEffect(() => {
    if (stage !== 5 || !isBhangarhTimerActive || isChalisaFound || isBhangarhChaseActive) return;

    const interval = setInterval(() => {
      setBhangarhTimer((prev) => {
        if (prev <= 1) {
          setIsBhangarhTimerActive(false);
          setIsBhangarhChaseActive(true);
          setScene("bhangarh_chase");
          setPlayerPos({ x: 50, y: 30 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, isBhangarhTimerActive, isChalisaFound, isBhangarhChaseActive]);

  // Lattu Power Bar Oscillation
  useEffect(() => {
    if (!showLattuGame || isLattuSolved) return;
    const interval = setInterval(() => {
      setLattuPower((prev) => {
        if (prev >= 95) setLattuPowerDirection(-1);
        if (prev <= 5) setLattuPowerDirection(1);
        return prev + lattuPowerDirection * 5;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [showLattuGame, isLattuSolved, lattuPowerDirection]);

  // Kathputli Rhythm Bar Oscillation
  useEffect(() => {
    if (!showKathputliGame || isKathputliSolved) return;
    const interval = setInterval(() => {
      setPuppetTiming((prev) => {
        if (prev >= 95) setPuppetDirection(-1);
        if (prev <= 5) setPuppetDirection(1);
        return prev + puppetDirection * 6;
      });
    }, 35);
    return () => clearInterval(interval);
  }, [showKathputliGame, isKathputliSolved, puppetDirection]);

  // Check if any modal is currently open to pause gameplay movement
  const isAnyModalOpen =
    isCamelJourneyActive ||
    showIntroNarrative ||
    showChachaDialogue ||
    showChauparGame ||
    showCarvingPuzzle ||
    showTowerView ||
    showCaretakerDialogue ||
    showJauharCutscene ||
    showStage1Complete ||
    showGuardBheemDialogue ||
    showLattuGame ||
    showFrescoPuzzle ||
    showPratapCutscene ||
    showStage2Complete ||
    showArmorerDialogue ||
    showCannonPuzzle ||
    showHydraulicPuzzle ||
    showChhatriCutscene ||
    showStage3Complete ||
    showGateMarkerModal ||
    showChiefModal ||
    showTreasuryModal ||
    showWellModal ||
    showEvidencePuzzle ||
    showKuldharaTimeoutModal ||
    showStage4Complete ||
    showTempleModal ||
    showChalisaModal ||
    showStage5Complete ||
    showKathputliGame ||
    showMosaicAssembly ||
    showFinaleCutscene ||
    showCampaignCompleteModal;

  // Check if current scene features fort gate hall entrance doors
  const isFortGateScene = ["ram_pol", "wall_approach", "zigzag_gates", "badal_mahal", "jaigarh_entry", "kuldhara_gate", "bhangarh_gate", "jaisalmer_streets"].includes(scene);
  const isNearFortDoors = isFortGateScene && playerPos.y <= 67.5 && playerPos.x >= 42.0 && playerPos.x <= 58.0;

  // Proximities
  const chachaPos = { x: 30.0, y: 78.0 };
  const distToChacha = Math.sqrt(
    Math.pow(playerPos.x - chachaPos.x, 2) + Math.pow(playerPos.y - chachaPos.y, 2)
  );
  const isNearChacha = scene === "inner_courtyard" && distToChacha < 10.0;
  const isNearVijayTower = scene === "vijay_stambh" && playerPos.y <= 65.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;
  const caretakerPos = { x: 72.0, y: 74.0 };
  const distToCaretaker = Math.sqrt(
    Math.pow(playerPos.x - caretakerPos.x, 2) + Math.pow(playerPos.y - caretakerPos.y, 2)
  );
  const isNearCaretaker = scene === "vijay_stambh" && distToCaretaker < 9.0;
  const isNearJauharSanctuary = scene === "jauhar_kund" && playerPos.y <= 88.0;

  // Stage 2
  const guardBheemPos = { x: 45.0, y: 70.0 };
  const distToGuardBheem = Math.sqrt(
    Math.pow(playerPos.x - guardBheemPos.x, 2) + Math.pow(playerPos.y - guardBheemPos.y, 2)
  );
  const isNearGuardBheem = scene === "zigzag_gates" && distToGuardBheem < 9.0;
  const isNearLattuCircle = scene === "soldiers_quarters" && playerPos.y <= 75.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;
  const isNearBadalFresco = scene === "badal_mahal" && playerPos.y <= 68.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;
  const isNearPratapSanctuary = scene === "pratap_birthplace" && playerPos.y <= 88.0;

  // Stage 3
  const armorerPos = { x: 35.0, y: 72.0 };
  const distToArmorer = Math.sqrt(
    Math.pow(playerPos.x - armorerPos.x, 2) + Math.pow(playerPos.y - armorerPos.y, 2)
  );
  const isNearArmorer = scene === "jaivana_courtyard" && distToArmorer < 9.0;
  const isNearJaivanaCannon = scene === "jaivana_courtyard" && playerPos.y <= 68.0 && playerPos.x >= 40.0 && playerPos.x <= 65.0;
  const isNearHydraulicControls = scene === "jal_mahal" && playerPos.y <= 75.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;
  const isNearChhatriSanctuary = scene === "top_chhatri" && playerPos.y <= 88.0;

  // Stage 4
  const isNearGateMarker = scene === "kuldhara_gate" && playerPos.y <= 78.0;
  const isNearChiefHaveli = scene === "chiefs_house" && playerPos.y <= 78.0;
  const isNearTreasuryLedger = scene === "treasury" && playerPos.y <= 78.0;
  const isNearKuldharaWell = scene === "well" && playerPos.y <= 78.0;
  const isNearSquareDeduction = scene === "village_square" && playerPos.y <= 88.0;

  // Stage 5
  const isNearGopinathPainting = scene === "gopinath_temple" && playerPos.y <= 75.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;
  const isNearRuinsSpot1 = scene === "palace_ruins" && playerPos.y <= 70.0 && playerPos.x <= 35.0;
  const isNearRuinsSpot2 = scene === "palace_ruins" && playerPos.y <= 70.0 && playerPos.x >= 65.0;
  const isNearRuinsChalisaSpot = scene === "palace_ruins" && playerPos.y <= 65.0 && playerPos.x >= 42.0 && playerPos.x <= 58.0;
  const isNearChaseEscapeGate = scene === "bhangarh_chase" && playerPos.y >= 82.0;

  // Stage 6
  const isNearKathputliStage = scene === "kathputli_square" && playerPos.y <= 78.0 && playerPos.x >= 35.0 && playerPos.x <= 65.0;
  const isNearMosaicBoard = scene === "final_courtyard" && playerPos.y <= 78.0 && playerPos.x >= 35.0 && playerPos.x <= 65.0;

  // Chaupar Roll Logic
  const handleRollCowries = () => {
    if (!isPlayerTurn) return;
    const roll = Math.floor(Math.random() * 4) + 1;
    const newPlayerPos = Math.min(12, playerChauparPos + roll);
    setPlayerChauparPos(newPlayerPos);

    if (newPlayerPos >= 12) {
      setChauparMessage("🎉 Victory! You reached Home first!");
      setIsChauparSolved(true);
      if (cluesFound < 1) setCluesFound(1);
      return;
    }

    setChauparMessage(`You rolled ${roll}! Moved to space ${newPlayerPos}/12. Chacha's turn...`);
    setIsPlayerTurn(false);

    setTimeout(() => {
      const aiRoll = Math.floor(Math.random() * 3) + 1;
      const newAiPos = Math.min(12, aiChauparPos + aiRoll);
      setAiChauparPos(newAiPos);

      if (newAiPos >= 12) {
        setChauparMessage("Chacha won this round! Roll again to try!");
        setLossCount((prev) => prev + 1);
        setIsPlayerTurn(true);
        setTimeout(() => {
          setPlayerChauparPos(0);
          setAiChauparPos(0);
        }, 1200);
      } else {
        setChauparMessage(`Chacha rolled ${aiRoll} (space ${newAiPos}/12). Your turn!`);
        setIsPlayerTurn(true);
      }
    }, 1000);
  };

  // Carving Panel Puzzle
  const panelsData = [
    { id: 1, title: "1448 CE Rana Kumbha Proclamation", desc: "Commemorating victory over Malwa sultanate" },
    { id: 2, title: "Invocation of Lord Vishnu", desc: "Detailed relief carvings of Hindu pantheon" },
    { id: 3, title: "9-Storey Architectural Blueprints", desc: "157-foot tower structure & 158 spiral steps" },
    { id: 4, title: "Masons Inscription (Jaita & Sons)", desc: "Carved signatures of master architect Jaita" },
  ];

  const handleSelectPanel = (id: number) => {
    if (userCarvingOrder.includes(id)) {
      setUserCarvingOrder(userCarvingOrder.filter((p) => p !== id));
    } else if (userCarvingOrder.length < 4) {
      setUserCarvingOrder([...userCarvingOrder, id]);
    }
  };

  const handleVerifyCarvings = () => {
    const correct = [1, 2, 3, 4];
    const isCorrect = userCarvingOrder.length === 4 && userCarvingOrder.every((val, idx) => val === correct[idx]);

    if (isCorrect) {
      setIsCarvingSolved(true);
      setShowCarvingPuzzle(false);
      if (cluesFound < 2) setCluesFound(2);
      setShowTowerView(true);
    } else {
      setCarvingError(true);
    }
  };

  // Lattu Launch Mechanic
  const handleLaunchLattu = () => {
    if (lattuPower >= 70 && lattuPower <= 90) {
      const newPlayerScore = lattuScore.player + 1;
      setLattuScore((prev) => ({ ...prev, player: newPlayerScore }));
      if (newPlayerScore >= 2) {
        setLattuMessage("🎉 Perfect Launch! You won the Lattu challenge!");
        setIsLattuSolved(true);
        if (cluesFound < 2) setCluesFound(2);
      } else {
        setLattuMessage(`Great spin! Round won (${newPlayerScore}/2 rounds). Launch again!`);
      }
    } else {
      setLattuMessage("Spin wobbled outside green zone! Try timing your launch!");
    }
  };

  // Fresco Pigments
  const pigmentsList = [
    { id: "red", name: "Geru Red (Ochre)", color: "bg-red-700", text: "text-red-900" },
    { id: "blue", name: "Neel Blue (Indigo)", color: "bg-blue-700", text: "text-blue-900" },
    { id: "yellow", name: "Haldi Yellow (Turmeric)", color: "bg-amber-400", text: "text-amber-900" },
    { id: "black", name: "Kajol Black (Carbon)", color: "bg-gray-900", text: "text-gray-900" },
  ];

  const handleTogglePigment = (id: string) => {
    if (selectedPigments.includes(id)) {
      setSelectedPigments(selectedPigments.filter((p) => p !== id));
    } else {
      setSelectedPigments([...selectedPigments, id]);
    }
  };

  const handleVerifyFresco = () => {
    const required = ["red", "blue", "yellow"];
    const isCorrect = required.every((p) => selectedPigments.includes(p)) && selectedPigments.length === 3;

    if (isCorrect) {
      setIsFrescoSolved(true);
      setShowFrescoPuzzle(false);
      if (cluesFound < 3) setCluesFound(3);
    } else {
      setFrescoError(true);
    }
  };

  // Jaivana Cannon Calibration Fire Logic
  const handleFireCannon = () => {
    if (cannonElevation === 45 && cannonCharge === 80) {
      setCannonMessage("💥 BOOM! Jaivana Cannon test fired successfully! Target hit at 35 km!");
      setIsCannonCalibrated(true);
      if (cluesFound < 2) setCluesFound(2);
    } else {
      setCannonMessage("⚠️ Off-target! (Hint: Set Elevation to 45° and Powder Charge to 80 kg)");
    }
  };

  // Hydraulic Sluice Puzzle Verification
  const handleToggleSluice = (idx: number) => {
    setSluiceState((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleVerifyHydraulic = () => {
    if (!sluiceState[0] && sluiceState[1] && sluiceState[2]) {
      setIsHydraulicSolved(true);
      setShowHydraulicPuzzle(false);
      if (cluesFound < 3) setCluesFound(3);
    } else {
      setHydraulicError(true);
    }
  };

  // Stage 4 Evidence Matching Deduction
  const evidenceCards = [
    { id: "e1", label: "Broken Mirror & Wedding Ornament", icon: "💍" },
    { id: "e2", label: "Torn Grain Merchant Ledger", icon: "📜" },
    { id: "e3", label: "Intact Pots at Stepwell", icon: "🏺" },
  ];

  const conclusionOptions = [
    { id: "c1", label: "Forced Marriage Demand by Minister Salim Singh" },
    { id: "c2", label: "Oppressive Taxation & Arbitrary Revenue Demands" },
    { id: "c3", label: "Coordinated Evacuation of 83 Paliwal Brahmin Villages" },
  ];

  const handleSetEvidenceMatch = (evidenceId: string, conclusionId: string) => {
    setEvidenceMatches((prev) => ({ ...prev, [evidenceId]: conclusionId }));
  };

  const handleVerifyEvidence = () => {
    const isCorrect =
      evidenceMatches["e1"] === "c1" &&
      evidenceMatches["e2"] === "c2" &&
      evidenceMatches["e3"] === "c3";

    if (isCorrect) {
      setIsEvidenceSolved(true);
      setShowEvidencePuzzle(false);
      setIsTimerActive(false);
      if (cluesFound < 3) setCluesFound(3);
    } else {
      setEvidenceError(true);
    }
  };

  const handleRetryKuldharaTimer = () => {
    setShowKuldharaTimeoutModal(false);
    setTimerSeconds(180);
    setIsTimerActive(true);
  };

  const handleRetryBhangarhChase = () => {
    setIsBhangarhChaseActive(false);
    setScene("bhangarh_gate");
    setPlayerPos({ x: 50, y: 82 });
    setBhangarhTimer(120);
    setIsBhangarhTimerActive(true);
  };

  // Stage 6 Kathputli String Pull Rhythm Mechanic
  const handlePullPuppetString = () => {
    if (puppetTiming >= 65 && puppetTiming <= 90) {
      const nextScore = puppetScore + 1;
      setPuppetScore(nextScore);
      if (nextScore >= 3) {
        setKathputliMessage("🎭 Perfect Performance! Crowd applauds! Final relic fragment acquired!");
        setIsKathputliSolved(true);
        if (cluesFound < 3) setCluesFound(3);
      } else {
        setKathputliMessage(`Great rhythm! Step completed (${nextScore}/3). Pull again!`);
      }
    } else {
      setKathputliMessage("Puppet string missed rhythm! Watch the green zone!");
    }
  };

  // Mosaic Assembly
  const mosaicFragments = [
    { id: 1, name: "Chittorgarh Victory Plaque", icon: "🏆", desc: "Carved from Rana Kumbha's 1448 CE proclamation" },
    { id: 2, name: "Kumbhalgarh Wall Carving", icon: "🛡️", desc: "Engineered from the 36 km Great Wall of Mewar" },
    { id: 3, name: "Jaivana Cannon Emblem", icon: "⚔️", desc: "Molded from Jai Singh II's 50-ton bronze foundry" },
    { id: 4, name: "Kuldhara Paliwal Seal", icon: "📜", desc: "Rescued from the desert merchant stepwell" },
    { id: 5, name: "Gopinath Temple Scroll", icon: "🛕", desc: "Restored sacred Hanuman Chalisa manuscript" },
    { id: 6, name: "Golden Kathputli Puppet", icon: "🎭", desc: "Hand-crafted Rajasthani living heritage emblem" },
  ];

  const handlePlaceTile = (tileId: number) => {
    if (!placedMosaicTiles.includes(tileId)) {
      const updated = [...placedMosaicTiles, tileId];
      setPlacedMosaicTiles(updated);
      if (updated.length === 6) {
        setIsMosaicAssembled(true);
        setTimeout(() => {
          setShowMosaicAssembly(false);
          setShowFinaleCutscene(true);
        }, 1200);
      }
    }
  };

  // Comprehensive Collision Evaluation Function
  const checkWalkablePosition = useCallback((targetX: number, targetY: number, activeScene: RajasthanSceneType) => {
    let minX = 18.0;
    let maxX = 82.0;
    let minY = 52.0;
    let maxY = 88.0;

    if (activeScene === "ram_pol") { minX = 22.0; maxX = 78.0; minY = 62.0; maxY = 90.0; }
    else if (activeScene === "inner_courtyard") { minY = 56.0; }
    else if (activeScene === "vijay_stambh") { minX = 15.0; maxX = 85.0; minY = 50.0; }
    else if (activeScene === "wall_approach") { minX = 20.0; maxX = 80.0; minY = 58.0; maxY = 90.0; }
    else if (activeScene === "zigzag_gates") { minX = 15.0; maxX = 85.0; }
    else if (activeScene === "soldiers_quarters") { minY = 56.0; }
    else if (activeScene === "badal_mahal") { minY = 56.0; }
    else if (activeScene === "jaigarh_entry") { minX = 20.0; maxX = 80.0; minY = 58.0; maxY = 90.0; }
    else if (activeScene === "jaivana_courtyard") { minY = 56.0; }
    else if (activeScene === "jal_mahal") { minY = 56.0; }
    else if (activeScene === "kuldhara_gate") { minX = 20.0; maxX = 80.0; minY = 58.0; maxY = 90.0; }
    else if (activeScene === "chiefs_house") { minY = 56.0; }
    else if (activeScene === "treasury") { minY = 56.0; }
    else if (activeScene === "bhangarh_gate") { minX = 20.0; maxX = 80.0; minY = 58.0; maxY = 90.0; }
    else if (activeScene === "gopinath_temple") { minY = 56.0; }
    else if (activeScene === "bhangarh_chase") { minX = 18.0; maxX = 82.0; minY = 20.0; maxY = 90.0; }
    else if (activeScene === "jaisalmer_streets") { minX = 20.0; maxX = 80.0; minY = 58.0; maxY = 90.0; }

    // Outer bounds check
    if (targetX < minX || targetX > maxX || targetY < minY || targetY > maxY) {
      return false;
    }

    // --- FEATURE 3: CLOSED CASTLE HALL DOORS COLLISION ---
    // If closed castle hall doors are present and not opened, block entry through top entrance
    const isGateDoorScene = ["ram_pol", "wall_approach", "zigzag_gates", "badal_mahal", "jaigarh_entry", "kuldhara_gate", "bhangarh_gate", "jaisalmer_streets"].includes(activeScene);
    if (isGateDoorScene && doorOpenProgress < 0.9 && targetY <= 64.0 && targetX >= 42.0 && targetX <= 58.0) {
      return false;
    }

    // Per-scene solid obstacle collision boxes
    if (activeScene === "inner_courtyard" && targetX >= 25.0 && targetX <= 35.0 && targetY >= 72.0 && targetY <= 82.0) return false; // Chacha NPC
    if (activeScene === "vijay_stambh" && targetX >= 42.0 && targetX <= 58.0 && targetY >= 50.0 && targetY <= 64.0) return false; // Victory Tower Base
    if (activeScene === "jauhar_kund" && targetX >= 35.0 && targetX <= 65.0 && targetY >= 55.0 && targetY <= 75.0) return false; // Jauhar Water Tank
    if (activeScene === "zigzag_gates" && targetX > 35.0 && targetX < 65.0 && targetY > 60.0 && targetY < 78.0) return false; // Zigzag Fort Wall Maze
    if (activeScene === "jaivana_courtyard" && targetX >= 38.0 && targetX <= 62.0 && targetY >= 58.0 && targetY <= 70.0) return false; // 50-Ton Cannon
    if (activeScene === "well" && targetX >= 38.0 && targetX <= 62.0 && targetY >= 58.0 && targetY <= 74.0) return false; // Ancient Stone Stepwell
    if (activeScene === "gopinath_temple" && targetX >= 42.0 && targetX <= 58.0 && targetY >= 60.0 && targetY <= 70.0) return false; // Temple Altar
    if (activeScene === "kathputli_square" && targetX >= 40.0 && targetX <= 60.0 && targetY >= 62.0 && targetY <= 72.0) return false; // Puppet Stage

    return true;
  }, [doorOpenProgress]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (isLoading || isTransitioning) return;

    const keysHeld = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (isAnyModalOpen || isTransitioning) return;

      keysHeld.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e") {
        // --- FEATURE 3: OPEN CASTLE HALL DOORS WITH E KEY ---
        if (isNearFortDoors && doorOpenProgress < 0.9 && !isOpeningDoor) {
          setIsOpeningDoor(true);
        }

        // Stage 1
        if (isNearChacha) setShowChachaDialogue(true);
        if (isNearVijayTower) {
          if (!isCarvingSolved) setShowCarvingPuzzle(true);
          else setShowTowerView(true);
        }
        if (isNearCaretaker) setShowCaretakerDialogue(true);
        if (isNearJauharSanctuary && !isJauharCompleted) setShowJauharCutscene(true);

        // Stage 2
        if (isNearGuardBheem) setShowGuardBheemDialogue(true);
        if (isNearLattuCircle && !isLattuSolved) setShowLattuGame(true);
        if (isNearBadalFresco && !isFrescoSolved) setShowFrescoPuzzle(true);
        if (isNearPratapSanctuary && !isPratapCompleted) setShowPratapCutscene(true);

        // Stage 3
        if (isNearArmorer) setShowArmorerDialogue(true);
        if (isNearJaivanaCannon && !isCannonCalibrated) setShowCannonPuzzle(true);
        if (isNearHydraulicControls && !isHydraulicSolved) setShowHydraulicPuzzle(true);
        if (isNearChhatriSanctuary && !isChhatriCompleted) setShowChhatriCutscene(true);

        // Stage 4
        if (isNearGateMarker) {
          setShowGateMarkerModal(true);
          setKuldharaClues((prev) => ({ ...prev, gate: true }));
        }
        if (isNearChiefHaveli) {
          setShowChiefModal(true);
          setKuldharaClues((prev) => ({ ...prev, chief: true }));
        }
        if (isNearTreasuryLedger) {
          setShowTreasuryModal(true);
          setKuldharaClues((prev) => ({ ...prev, treasury: true }));
        }
        if (isNearKuldharaWell) {
          setShowWellModal(true);
          setKuldharaClues((prev) => ({ ...prev, well: true }));
        }
        if (isNearSquareDeduction && !isEvidenceSolved) {
          setShowEvidencePuzzle(true);
        }

        // Stage 5
        if (isNearGopinathPainting && !isTemplePaintingRestored) {
          setIsTemplePaintingRestored(true);
          setShowTempleModal(true);
          setCluesFound((prev) => Math.max(prev, 1));
        }
        if (isNearRuinsSpot1) {
          setSearchedRuinsSpots((prev) => ({ ...prev, spot1: true }));
        }
        if (isNearRuinsSpot2) {
          setSearchedRuinsSpots((prev) => ({ ...prev, spot2: true }));
        }
        if (isNearRuinsChalisaSpot && !isChalisaFound) {
          setIsChalisaFound(true);
          setShowChalisaModal(true);
          setIsBhangarhTimerActive(false);
          setCluesFound((prev) => Math.max(prev, 3));
        }
        if (isNearChaseEscapeGate && isBhangarhChaseActive) {
          handleRetryBhangarhChase();
        }

        // Stage 6
        if (isNearKathputliStage && !isKathputliSolved) {
          setShowKathputliGame(true);
        }
        if (isNearMosaicBoard && !isMosaicAssembled) {
          setShowMosaicAssembly(true);
        }
      }
      if (e.key === "Escape") {
        setShowIntroNarrative(false);
        setShowChachaDialogue(false);
        setShowChauparGame(false);
        setShowCarvingPuzzle(false);
        setShowTowerView(false);
        setShowCaretakerDialogue(false);
        setShowJauharCutscene(false);
        setShowStage1Complete(false);

        setShowGuardBheemDialogue(false);
        setShowLattuGame(false);
        setShowFrescoPuzzle(false);
        setShowPratapCutscene(false);
        setShowStage2Complete(false);

        setShowArmorerDialogue(false);
        setShowCannonPuzzle(false);
        setShowHydraulicPuzzle(false);
        setShowChhatriCutscene(false);
        setShowStage3Complete(false);

        setShowGateMarkerModal(false);
        setShowChiefModal(false);
        setShowTreasuryModal(false);
        setShowWellModal(false);
        setShowEvidencePuzzle(false);
        setShowKuldharaTimeoutModal(false);
        setShowStage4Complete(false);

        setShowTempleModal(false);
        setShowChalisaModal(false);
        setShowStage5Complete(false);

        setShowKathputliGame(false);
        setShowMosaicAssembly(false);
        setShowFinaleCutscene(false);
        setShowCampaignCompleteModal(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let animationFrameId: number;
    let localWalkTimer = 0;

    const gameLoop = () => {
      if (isAnyModalOpen) {
        setIsWalking(false);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      let dx = 0;
      let dy = 0;
      const speed = isBhangarhChaseActive ? 0.45 : 0.35;

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
          // Calculate intended position
          const targetX = prev.x + dx;
          const targetY = prev.y + dy;

          // Axis-based sliding collision resolution
          let finalX = prev.x;
          let finalY = prev.y;

          if (checkWalkablePosition(targetX, targetY, scene)) {
            finalX = targetX;
            finalY = targetY;
          } else if (checkWalkablePosition(targetX, prev.y, scene)) {
            finalX = targetX;
            finalY = prev.y;
          } else if (checkWalkablePosition(prev.x, targetY, scene)) {
            finalX = prev.x;
            finalY = targetY;
          }

          // Scene Transitions with Debounced Safe Spawn Points
          // STAGE 1
          if (scene === "ram_pol" && finalY <= 63.5 && finalX >= 44.0 && finalX <= 56.0) {
            triggerSceneTransition("inner_courtyard", { x: 50.0, y: 84.0 });
          } else if (scene === "inner_courtyard") {
            if (finalY <= 58.0 && finalX >= 65.0) {
              if (isChauparSolved || lossCount >= 2) {
                triggerSceneTransition("vijay_stambh", { x: 50.0, y: 84.0 });
              }
            } else if (finalY >= 87.5) {
              triggerSceneTransition("ram_pol", { x: 50.0, y: 66.0 });
            }
          } else if (scene === "vijay_stambh") {
            if (finalX >= 78.0) {
              if (isCarvingSolved) {
                triggerSceneTransition("jauhar_kund", { x: 30.0, y: 80.0 });
              }
            } else if (finalY >= 87.5) {
              triggerSceneTransition("inner_courtyard", { x: 68.0, y: 60.0 });
            }
          } else if (scene === "jauhar_kund" && finalY >= 87.5) {
            triggerSceneTransition("vijay_stambh", { x: 74.0, y: 65.0 });
          }

          // STAGE 2
          else if (scene === "wall_approach" && finalY <= 60.0 && finalX >= 44.0 && finalX <= 56.0) {
            triggerSceneTransition("zigzag_gates", { x: 25.0, y: 84.0 });
          } else if (scene === "zigzag_gates") {
            if (finalY <= 55.0 && finalX >= 70.0) {
              triggerSceneTransition("soldiers_quarters", { x: 50.0, y: 84.0 });
            } else if (finalY >= 87.5) {
              triggerSceneTransition("wall_approach", { x: 50.0, y: 64.0 });
            }
          } else if (scene === "soldiers_quarters") {
            if (finalY <= 58.0 && finalX >= 44.0 && finalX <= 56.0) {
              if (isLattuSolved) {
                triggerSceneTransition("badal_mahal", { x: 50.0, y: 84.0 });
              }
            } else if (finalY >= 87.5) {
              triggerSceneTransition("zigzag_gates", { x: 75.0, y: 60.0 });
            }
          } else if (scene === "badal_mahal") {
            if (finalX >= 78.0) {
              if (isFrescoSolved) {
                triggerSceneTransition("pratap_birthplace", { x: 30.0, y: 80.0 });
              }
            } else if (finalY >= 87.5) {
              triggerSceneTransition("soldiers_quarters", { x: 50.0, y: 64.0 });
            }
          } else if (scene === "pratap_birthplace" && finalY >= 87.5) {
            triggerSceneTransition("badal_mahal", { x: 74.0, y: 65.0 });
          }

          // STAGE 3
          else if (scene === "jaigarh_entry" && finalY <= 60.0 && finalX >= 44.0 && finalX <= 56.0) {
            triggerSceneTransition("jaivana_courtyard", { x: 50.0, y: 84.0 });
          } else if (scene === "jaivana_courtyard") {
            if (finalY <= 58.0 && finalX >= 44.0 && finalX <= 56.0) {
              if (isCannonCalibrated) {
                triggerSceneTransition("jal_mahal", { x: 50.0, y: 84.0 });
              }
            } else if (finalY >= 87.5) {
              triggerSceneTransition("jaigarh_entry", { x: 50.0, y: 64.0 });
            }
          } else if (scene === "jal_mahal") {
            if (finalX >= 78.0) {
              if (isHydraulicSolved) {
                triggerSceneTransition("top_chhatri", { x: 30.0, y: 80.0 });
              }
            } else if (finalY >= 87.5) {
              triggerSceneTransition("jaivana_courtyard", { x: 50.0, y: 64.0 });
            }
          } else if (scene === "top_chhatri" && finalY >= 87.5) {
            triggerSceneTransition("jal_mahal", { x: 74.0, y: 65.0 });
          }

          // STAGE 4
          else if (scene === "kuldhara_gate" && finalY <= 60.0 && finalX >= 44.0 && finalX <= 56.0) {
            triggerSceneTransition("chiefs_house", { x: 50.0, y: 84.0 });
          } else if (scene === "chiefs_house") {
            if (finalY <= 58.0 && finalX >= 44.0 && finalX <= 56.0) {
              triggerSceneTransition("treasury", { x: 50.0, y: 84.0 });
            } else if (finalY >= 87.5) {
              triggerSceneTransition("kuldhara_gate", { x: 50.0, y: 64.0 });
            }
          } else if (scene === "treasury") {
            if (finalX >= 78.0) {
              triggerSceneTransition("well", { x: 30.0, y: 80.0 });
            } else if (finalY >= 87.5) {
              triggerSceneTransition("chiefs_house", { x: 50.0, y: 64.0 });
            }
          } else if (scene === "well") {
            if (finalX >= 78.0) {
              triggerSceneTransition("village_square", { x: 30.0, y: 80.0 });
            } else if (finalY >= 87.5) {
              triggerSceneTransition("treasury", { x: 74.0, y: 65.0 });
            }
          } else if (scene === "village_square" && finalY >= 87.5) {
            triggerSceneTransition("well", { x: 74.0, y: 65.0 });
          }

          // STAGE 5
          else if (scene === "bhangarh_gate" && finalY <= 60.0 && finalX >= 44.0 && finalX <= 56.0) {
            triggerSceneTransition("gopinath_temple", { x: 50.0, y: 84.0 });
          } else if (scene === "gopinath_temple") {
            if (finalY <= 58.0 && finalX >= 44.0 && finalX <= 56.0) {
              if (isTemplePaintingRestored) {
                triggerSceneTransition("palace_ruins", { x: 50.0, y: 84.0 });
              }
            } else if (finalY >= 87.5) {
              triggerSceneTransition("bhangarh_gate", { x: 50.0, y: 64.0 });
            }
          } else if (scene === "palace_ruins" && finalY >= 87.5) {
            triggerSceneTransition("gopinath_temple", { x: 50.0, y: 64.0 });
          }

          // STAGE 6
          else if (scene === "jaisalmer_streets" && finalY <= 60.0 && finalX >= 44.0 && finalX <= 56.0) {
            triggerSceneTransition("kathputli_square", { x: 50.0, y: 84.0 });
          } else if (scene === "kathputli_square") {
            if (finalY <= 58.0 && finalX >= 44.0 && finalX <= 56.0) {
              if (isKathputliSolved) {
                triggerSceneTransition("final_courtyard", { x: 50.0, y: 84.0 });
              }
            } else if (finalY >= 87.5) {
              triggerSceneTransition("jaisalmer_streets", { x: 50.0, y: 64.0 });
            }
          } else if (scene === "final_courtyard" && finalY >= 87.5) {
            triggerSceneTransition("kathputli_square", { x: 50.0, y: 64.0 });
          }

          return { x: finalX, y: finalY };
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
  }, [isLoading, isTransitioning, scene, isAnyModalOpen, isNearChacha, isNearVijayTower, isNearCaretaker, isNearJauharSanctuary, isNearGuardBheem, isNearLattuCircle, isNearBadalFresco, isNearPratapSanctuary, isNearArmorer, isNearJaivanaCannon, isNearHydraulicControls, isNearChhatriSanctuary, isNearGateMarker, isNearChiefHaveli, isNearTreasuryLedger, isNearKuldharaWell, isNearSquareDeduction, isNearGopinathPainting, isNearRuinsSpot1, isNearRuinsSpot2, isNearRuinsChalisaSpot, isNearChaseEscapeGate, isNearKathputliStage, isNearMosaicBoard, isChauparSolved, isCarvingSolved, isJauharCompleted, isLattuSolved, isFrescoSolved, isPratapCompleted, isCannonCalibrated, isHydraulicSolved, isChhatriCompleted, isEvidenceSolved, isTemplePaintingRestored, isChalisaFound, isKathputliSolved, isMosaicAssembled, isBhangarhChaseActive, lossCount, isNearFortDoors, doorOpenProgress, isOpeningDoor, triggerSceneTransition, checkWalkablePosition]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-[#0a0704] items-center justify-center flex-col relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c9a776]/20 via-[#0a0704] to-[#0a0704]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#c9a776]/30 border-t-[#e4c794] rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(201,167,118,0.4)]"></div>
          <h1 className="text-3xl font-serif text-[#e4c794] tracking-[0.2em] uppercase mb-3 drop-shadow-md">
            {stage === 1 ? "Chittorgarh Fort — Stage 1" : stage === 2 ? "Kumbhalgarh Fort — Stage 2" : stage === 3 ? "Jaigarh Fort & Jal Mahal — Stage 3" : stage === 4 ? "Kuldhara Ghost Village — Stage 4" : stage === 5 ? "Bhangarh Fort — Stage 5" : "Jaisalmer — Stage 6 Finale"}
          </h1>
          <p className="text-[13px] text-[#a89985] tracking-widest uppercase">
            {stage === 1 ? "“The Old Man’s Board”" : stage === 2 ? "“The Wall That Never Ends”" : stage === 3 ? "“The Cannon and the Lake Palace”" : stage === 4 ? "“83 Villagers, One Night”" : stage === 5 ? "“Night of the Moonrise”" : "“The Golden City That Still Lives”"}
          </p>
        </div>
      </div>
    );
  }

  // --- FEATURE 4: DYNAMIC DEPTH-BASED TRAVELER SCALING ---
  // Background y=50% -> scale ~0.65; Foreground y=90% -> scale ~1.25
  const depthScale = 0.65 + ((playerPos.y - 50.0) / 40.0) * 0.60;
  const walkBob = isWalking ? Math.sin(walkPhase) * 1.8 : 0;
  const walkSway = isWalking ? Math.sin(walkPhase * 0.5) * 1.5 : 0;

  const getBackgroundSrc = () => {
    if (scene === "ram_pol") return "/bg-chittorgarh-ram-pol.jpg";
    if (scene === "inner_courtyard") return "/bg-chittorgarh-courtyard.jpg";
    if (scene === "vijay_stambh") return "/bg-chittorgarh-vijay-stambh.jpg";
    if (scene === "jauhar_kund") return "/bg-chittorgarh-jauhar-kund.jpg";

    if (scene === "wall_approach") return "/bg-kumbhalgarh-wall.jpg";
    if (scene === "zigzag_gates") return "/bg-kumbhalgarh-gates.jpg";
    if (scene === "soldiers_quarters") return "/bg-kumbhalgarh-quarters.jpg";
    if (scene === "badal_mahal") return "/bg-kumbhalgarh-badal-mahal.jpg";
    if (scene === "pratap_birthplace") return "/bg-kumbhalgarh-badal-mahal.jpg";

    if (scene === "jaigarh_entry") return "/bg-rajasthan-gate.jpg";
    if (scene === "jaivana_courtyard") return "/bg-rajasthan-rampart.jpg";
    if (scene === "jal_mahal") return "/bg-taj-mehtab-bagh.jpg";
    if (scene === "top_chhatri") return "/bg-rajasthan-court.jpg";

    if (scene === "kuldhara_gate") return "/bg-rajasthan-gate.jpg";
    if (scene === "chiefs_house") return "/bg-rajasthan-court.jpg";
    if (scene === "treasury") return "/bg-rajasthan-armory.jpg";
    if (scene === "well") return "/bg-chittorgarh-jauhar-kund.jpg";
    if (scene === "village_square") return "/bg-chittorgarh-courtyard.jpg";

    if (scene === "bhangarh_gate") return "/bg-rajasthan-gate.jpg";
    if (scene === "gopinath_temple") return "/bg-rajasthan-court.jpg";
    if (scene === "palace_ruins") return "/bg-rajasthan-armory.jpg";

    if (scene === "jaisalmer_streets") return "/bg-rajasthan-gate.jpg";
    if (scene === "kathputli_square") return "/bg-chittorgarh-courtyard.jpg";
    if (scene === "final_courtyard") return "/bg-rajasthan-court.jpg";
    return "/bg-rajasthan-gate.jpg";
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getTransitionLabel = () => {
    if (scene === "ram_pol") return "Entering Inner Courtyard...";
    if (scene === "inner_courtyard") return playerPos.x >= 60 ? "Ascending to Vijay Stambh..." : "Returning to Ram Pol...";
    if (scene === "vijay_stambh") return playerPos.x >= 70 ? "Entering Jauhar Kund Sanctuary..." : "Returning to Inner Courtyard...";
    if (scene === "jauhar_kund") return "Returning to Vijay Stambh...";

    if (scene === "wall_approach") return "Entering Fortified Zigzag Gates...";
    if (scene === "zigzag_gates") return playerPos.y <= 60 ? "Entering Soldiers Quarters..." : "Returning to Wall Approach...";
    if (scene === "soldiers_quarters") return playerPos.y <= 60 ? "Ascending to Badal Mahal..." : "Returning to Winding Gates...";
    if (scene === "badal_mahal") return playerPos.x >= 70 ? "Entering Maharana Pratap Birth Chamber..." : "Returning to Soldiers Quarters...";
    if (scene === "pratap_birthplace") return "Returning to Badal Mahal...";

    if (scene === "jaigarh_entry") return "Entering Jaivana Cannon Courtyard...";
    if (scene === "jaivana_courtyard") return playerPos.y <= 60 ? "Descending to Jal Mahal Lake..." : "Returning to Jaigarh Entry...";
    if (scene === "jal_mahal") return playerPos.x >= 70 ? "Ascending to Top Floor Chhatri..." : "Returning to Jaivana Courtyard...";
    if (scene === "top_chhatri") return "Returning to Jal Mahal...";

    if (scene === "kuldhara_gate") return "Entering Village Chief's Haveli...";
    if (scene === "chiefs_house") return playerPos.y <= 60 ? "Entering Village Treasury..." : "Returning to Village Gate...";
    if (scene === "treasury") return playerPos.x >= 70 ? "Approaching Village Stepwell..." : "Returning to Chief's Haveli...";
    if (scene === "well") return playerPos.x >= 70 ? "Entering Final Village Square..." : "Returning to Treasury...";
    if (scene === "village_square") return "Returning to Stepwell...";

    if (scene === "bhangarh_gate") return "Entering Gopinath Temple Sanctuary...";
    if (scene === "gopinath_temple") return playerPos.y <= 60 ? "Ascending to Bhangarh Palace Ruins..." : "Returning to Main Gate...";
    if (scene === "palace_ruins") return "Returning to Gopinath Temple...";

    if (scene === "jaisalmer_streets") return "Entering Kathputli Performance Square...";
    if (scene === "kathputli_square") return playerPos.y <= 60 ? "Ascending to Final Relic Mosaic Courtyard..." : "Returning to Golden Streets...";
    return "Returning to Kathputli Square...";
  };

  return (
    <div className="w-full h-screen relative overflow-hidden font-sans select-none bg-black">
      {/* Background Image */}
      <img
        src={getBackgroundSrc()}
        alt="Rajasthan Campaign World"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300"
      />

      {/* Lighting Overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
        stage === 6
          ? "bg-gradient-to-b from-amber-600/30 via-yellow-500/10 to-amber-950/50"
          : stage === 5
          ? "bg-gradient-to-b from-indigo-950/80 via-blue-950/40 to-black/90"
          : scene === "jauhar_kund" || scene === "pratap_birthplace" || scene === "top_chhatri"
          ? "bg-gradient-to-b from-indigo-950/50 via-transparent to-black/70" 
          : stage === 4
          ? "bg-gradient-to-b from-amber-950/40 via-amber-900/10 to-black/60"
          : "bg-gradient-to-b from-amber-950/20 via-transparent to-black/40"
      }`}></div>

      {/* --- FEATURE 3: ANIMATED HEAVY CARVED WOODEN CASTLE HALL DOORS --- */}
      {isFortGateScene && (
        <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-48 h-44 z-15 pointer-events-none flex overflow-hidden rounded-t-full border-4 border-amber-950 shadow-2xl bg-amber-950/80">
          {/* Left Door */}
          <div
            className="w-1/2 h-full bg-[#3a200d] border-r-2 border-amber-900/80 transition-transform duration-700 ease-out flex flex-col justify-around p-2 relative shadow-inner"
            style={{
              transform: `translateX(-${doorOpenProgress * 100}%) rotateY(-${doorOpenProgress * 75}deg)`,
              transformOrigin: "left center",
            }}
          >
            <div className="w-3 h-3 rounded-full border-2 border-yellow-600 bg-yellow-500 self-end shadow"></div>
            <div className="w-full h-1 bg-amber-900/90 rounded"></div>
            <div className="w-3 h-3 rounded-full border-2 border-yellow-600 bg-yellow-500 self-end shadow"></div>
          </div>
          {/* Right Door */}
          <div
            className="w-1/2 h-full bg-[#3a200d] border-l-2 border-amber-900/80 transition-transform duration-700 ease-out flex flex-col justify-around p-2 relative shadow-inner"
            style={{
              transform: `translateX(${doorOpenProgress * 100}%) rotateY(${doorOpenProgress * 75}deg)`,
              transformOrigin: "right center",
            }}
          >
            <div className="w-3 h-3 rounded-full border-2 border-yellow-600 bg-yellow-500 self-start shadow"></div>
            <div className="w-full h-1 bg-amber-900/90 rounded"></div>
            <div className="w-3 h-3 rounded-full border-2 border-yellow-600 bg-yellow-500 self-start shadow"></div>
          </div>
        </div>
      )}

      {/* Door Opening Prompt */}
      {isNearFortDoors && doorOpenProgress < 0.9 && (
        <div
          className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-35 animate-bounce"
          onClick={() => setIsOpeningDoor(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          🏰 Push Open Heavy Royal Castle Doors
        </div>
      )}

      {/* Fade Transition Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black animate-in fade-in duration-300 z-40 pointer-events-none flex items-center justify-center">
          <span className="text-amber-300 text-sm font-serif tracking-widest uppercase">
            {getTransitionLabel()}
          </span>
        </div>
      )}

      {/* --- FEATURE 1: CAMEL CARAVAN STAGE TRANSITION JOURNEY SCREEN --- */}
      {isCamelJourneyActive && (
        <div className="absolute inset-0 bg-[#0e0a05] z-50 flex flex-col items-center justify-center p-6 text-amber-100 font-serif">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-600 via-amber-950 to-black"></div>
          <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center">
            <span className="text-xs uppercase font-bold tracking-[0.3em] text-amber-400 mb-2">🐫 Royal Desert Caravan Passage</span>
            <h2 className="text-2xl font-bold text-amber-200 mb-6 drop-shadow-md">{camelJourneyTitle}</h2>

            {/* Animated Camel Journey Display */}
            <div className="w-full h-44 bg-[#1c140b] border-2 border-amber-700/80 rounded-2xl relative overflow-hidden shadow-2xl mb-6">
              {/* Dunes silhouette */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#2a1b0c] to-transparent"></div>
              {/* Moving Camel & Traveler */}
              <div
                className="absolute bottom-4 flex items-end gap-3 transition-all duration-75"
                style={{ left: `${camelProgress * 0.75 + 5}%` }}
              >
                <img src="/rajasthan-camel.jpg" alt="Camel" className="w-28 h-28 object-contain drop-shadow-lg" />
                <img src="/player.png" alt="Traveler" className="w-16 h-16 object-contain" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-amber-950 border border-amber-700 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-300 transition-all duration-75" style={{ width: `${camelProgress}%` }}></div>
            </div>
            <span className="text-xs text-amber-400/80 tracking-widest uppercase">Travelling across Rajasthan... {Math.round(camelProgress)}%</span>
          </div>
        </div>
      )}

      {/* --- FEATURE 1 & 2: RAJASTHANI NPCS & PROMPTS WITH TRADITIONAL SAFAS --- */}
      {scene === "inner_courtyard" && (
        <div className="absolute pointer-events-auto cursor-pointer z-10 flex flex-col items-center" style={{ left: `${chachaPos.x}%`, top: `${chachaPos.y}%`, transform: `translate(-50%, -96%) scale(1.15)` }} onClick={() => setShowChachaDialogue(true)}>
          {isNearChacha && !showChachaDialogue && !showChauparGame && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Talk to Buzurg Chacha
            </div>
          )}
          {/* Rajasthani Safa Turban Badge Indicator */}
          <div className="absolute -top-3 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow z-10">👳 Safa Elder</div>
          <img src="/rajasthan-guard.jpg" alt="Buzurg Chacha" className="w-28 h-28 object-contain rounded-lg border border-amber-900/40 shadow-md" />
        </div>
      )}

      {scene === "vijay_stambh" && (
        <div className="absolute pointer-events-auto cursor-pointer z-10 flex flex-col items-center" style={{ left: `${caretakerPos.x}%`, top: `${caretakerPos.y}%`, transform: `translate(-50%, -96%) scale(1.15)` }} onClick={() => setShowCaretakerDialogue(true)}>
          {isNearCaretaker && !showCaretakerDialogue && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Talk to Panditji
            </div>
          )}
          <div className="absolute -top-3 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow z-10">👳 Royal Pandit</div>
          <img src="/npc-archaeologist.png" alt="Caretaker" className="w-28 h-28 object-contain" style={{ imageRendering: "pixelated" }} />
        </div>
      )}

      {/* --- STAGE 2 NPCS & PROMPTS --- */}
      {scene === "zigzag_gates" && (
        <div className="absolute pointer-events-auto cursor-pointer z-10 flex flex-col items-center" style={{ left: `${guardBheemPos.x}%`, top: `${guardBheemPos.y}%`, transform: `translate(-50%, -96%) scale(1.15)` }} onClick={() => setShowGuardBheemDialogue(true)}>
          {isNearGuardBheem && !showGuardBheemDialogue && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Talk to Gate Guard Bheem
            </div>
          )}
          <div className="absolute -top-3 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow z-10">🗡️ Royal Fort Guard</div>
          <img src="/rajasthan-guard.jpg" alt="Guard Bheem" className="w-28 h-28 object-contain rounded-lg border border-amber-900/40 shadow-md" />
        </div>
      )}

      {/* --- STAGE 3 NPCS & PROMPTS --- */}
      {scene === "jaivana_courtyard" && (
        <div className="absolute pointer-events-auto cursor-pointer z-10 flex flex-col items-center" style={{ left: `${armorerPos.x}%`, top: `${armorerPos.y}%`, transform: `translate(-50%, -96%) scale(1.15)` }} onClick={() => setShowArmorerDialogue(true)}>
          {isNearArmorer && !showArmorerDialogue && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Talk to Master Armorer Ustad
            </div>
          )}
          <div className="absolute -top-3 bg-[#b91c1c] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow z-10">⚔️ Master Armorer</div>
          <img src="/rajasthan-guard.jpg" alt="Master Armorer" className="w-28 h-28 object-contain rounded-lg border border-amber-900/40 shadow-md" />
        </div>
      )}

      {/* --- STAGE 6 NPCS & PROMPTS --- */}
      {scene === "kathputli_square" && (
        <div className="absolute pointer-events-auto cursor-pointer z-10 flex flex-col items-center" style={{ left: `50%`, top: `68%`, transform: `translate(-50%, -96%) scale(1.15)` }} onClick={() => setShowKathputliGame(true)}>
          {isNearKathputliStage && !isKathputliSolved && !showKathputliGame && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Perform with Kathputli Master Ustadi Ustaad
            </div>
          )}
          <div className="absolute -top-3 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow z-10">🎭 Ustadi Ustaad</div>
          <img src="/npc-archaeologist.png" alt="Kathputli Master" className="w-32 h-32 object-contain" style={{ imageRendering: "pixelated" }} />
        </div>
      )}

      {scene === "final_courtyard" && isNearMosaicBoard && !isMosaicAssembled && !showMosaicAssembly && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowMosaicAssembly(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Assemble Great Rajputana Sun Relic Mosaic
        </div>
      )}

      {/* Prompts */}
      {scene === "vijay_stambh" && isNearVijayTower && !isCarvingSolved && !showCarvingPuzzle && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowCarvingPuzzle(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Restore Weathered Panel Carvings
        </div>
      )}

      {scene === "jauhar_kund" && isNearJauharSanctuary && !isJauharCompleted && !showJauharCutscene && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowJauharCutscene(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Pay Respects at Jauhar Kund
        </div>
      )}

      {scene === "soldiers_quarters" && isNearLattuCircle && !isLattuSolved && !showLattuGame && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowLattuGame(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Challenge Soldier to Lattu (Spinning Top)
        </div>
      )}

      {scene === "badal_mahal" && isNearBadalFresco && !isFrescoSolved && !showFrescoPuzzle && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowFrescoPuzzle(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Restore Faded Wall Fresco Pigments
        </div>
      )}

      {scene === "pratap_birthplace" && isNearPratapSanctuary && !isPratapCompleted && !showPratapCutscene && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowPratapCutscene(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Pay Respects at Maharana Pratap Birthplace
        </div>
      )}

      {scene === "jaivana_courtyard" && isNearJaivanaCannon && !isCannonCalibrated && !showCannonPuzzle && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowCannonPuzzle(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Calibrate Jaivana Cannon Trajectory
        </div>
      )}

      {scene === "jal_mahal" && isNearHydraulicControls && !isHydraulicSolved && !showHydraulicPuzzle && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowHydraulicPuzzle(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Operate Jal Mahal Hydraulic Sluice Gates
        </div>
      )}

      {scene === "top_chhatri" && isNearChhatriSanctuary && !isChhatriCompleted && !showChhatriCutscene && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce" onClick={() => setShowChhatriCutscene(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Reflect at Jal Mahal Rooftop Chhatri
        </div>
      )}

      {/* --- FEATURE 4: MAIN HERO WITH PERSPECTIVE DEPTH SCALING & RAJASTHANI PAGRI OVERLAY --- */}
      <div
        className="absolute pointer-events-none flex flex-col items-center z-20 transition-transform duration-75"
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transformOrigin: "bottom center",
          transform: `translate(-50%, -96%) scale(${depthScale}) scaleX(${facingLeft ? -1 : 1})`,
        }}
      >
        {/* Rajasthani Royal Pagri / Safa Turban Overlay */}
        <div className="absolute -top-1 bg-amber-500/90 text-amber-950 font-serif text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black shadow-sm z-30">
          👳 Rajasthani Safa
        </div>

        <img
          src="/player.png"
          alt="Main Hero"
          className="w-36 h-36 object-contain"
          style={{
            imageRendering: "pixelated",
            transform: `translateY(${walkBob}px) rotate(${walkSway}deg)`,
            transition: isWalking ? "none" : "transform 0.15s ease-out",
          }}
        />
      </div>

      {/* Top Left: Quest HUD */}
      <div className="absolute top-6 left-6 flex flex-col gap-3 z-30">
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-84">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
              {stage === 1 ? "Stage 1: Chittorgarh" : stage === 2 ? "Stage 2: Kumbhalgarh" : stage === 3 ? "Stage 3: Jaigarh & Jal Mahal" : stage === 4 ? "Stage 4: Kuldhara" : stage === 5 ? "Stage 5: Bhangarh" : "Stage 6: Jaisalmer (Finale)"}
            </span>
            {stage === 4 && (
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${timerSeconds <= 60 ? "bg-red-600 text-white animate-pulse" : "bg-amber-200 text-amber-950 border border-amber-500"}`}>
                ⏳ {formatTimer(timerSeconds)}
              </span>
            )}
            {stage === 5 && !isChalisaFound && scene !== "bhangarh_chase" && (
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${bhangarhTimer <= 45 ? "bg-red-600 text-white animate-pulse" : "bg-blue-900 text-blue-100 border border-blue-500"}`}>
                🌙 {formatTimer(bhangarhTimer)}
              </span>
            )}
          </div>

          <div className="text-[14px] font-bold text-black leading-snug">
            {scene === "ram_pol"
              ? "Walk up to the royal castle hall doors and press E to swing them open!"
              : scene === "inner_courtyard"
              ? !isChauparSolved && lossCount < 2
                ? "Talk to Buzurg Chacha and challenge him to Chaupar."
                : "Walk up the right stairs towards Vijay Stambh."
              : scene === "vijay_stambh"
              ? !isCarvingSolved
                ? "Examine the weathered carvings on Vijay Stambh to restore the sequence."
                : "Proceed right to Jauhar Kund."
              : scene === "jauhar_kund"
              ? "Approach the water tank to pay respects at Jauhar Kund."
              : scene === "wall_approach"
              ? "Walk forward towards the monumental fort entrance doors."
              : scene === "zigzag_gates"
              ? "Navigate the winding gate maze to reach Soldiers Quarters."
              : scene === "soldiers_quarters"
              ? !isLattuSolved
                ? "Challenge the resting soldier to a game of Lattu."
                : "Walk forward into Badal Mahal."
              : scene === "badal_mahal"
              ? !isFrescoSolved
                ? "Restore the faded wall fresco using natural mineral dyes."
                : "Walk right into Maharana Pratap Birthplace."
              : scene === "pratap_birthplace"
              ? "Pay respects at Maharana Pratap Birthplace."
              : scene === "jaigarh_entry"
              ? "Walk forward into the Jaivana Cannon Courtyard."
              : scene === "jaivana_courtyard"
              ? !isCannonCalibrated
                ? "Calibrate the Jaivana Cannon trajectory parameters (press E)."
                : "Descend to Man Sagar Lake Palace (Jal Mahal)."
              : scene === "jal_mahal"
              ? !isHydraulicSolved
                ? "Operate the sluice gates to balance the water level."
                : "Walk right to ascend to the Top Floor Chhatri."
              : scene === "top_chhatri"
              ? "Pay respects at Jal Mahal Rooftop Chhatri."
              : scene === "kuldhara_gate"
              ? "Inspect the stone marker '83' at the entrance of Kuldhara."
              : scene === "chiefs_house"
              ? "Examine the relics in the Village Chief's haveli."
              : scene === "treasury"
              ? "Inspect the torn grain merchant tax ledger."
              : scene === "well"
              ? "Inspect the intact water pots at the village stepwell."
              : scene === "village_square"
              ? !isEvidenceSolved
                ? "Match all 3 evidence cards in the Village Square!"
                : "Stage 4 Complete!"
              : scene === "bhangarh_gate"
              ? "Find the sacred verse before moonrise reaches its peak! Walk up into Gopinath Temple."
              : scene === "gopinath_temple"
              ? !isTemplePaintingRestored
                ? "Shine torchlight to reveal the faded temple wall painting."
                : "Walk up into the Palace Ruins."
              : scene === "palace_ruins"
              ? !isChalisaFound
                ? "Search the palace ruins for the glowing sacred Chalisa verses."
                : "Stage 5 Complete!"
              : scene === "jaisalmer_streets"
              ? "Explore the golden living streets of Jaisalmer Fort! Walk up into the Kathputli Square."
              : scene === "kathputli_square"
              ? !isKathputliSolved
                ? "Perform with Kathputli Master Ustadi Ustaad (pull puppet strings in rhythm)."
                : "Ascend to the Final Relic Mosaic Courtyard!"
              : !isMosaicAssembled
              ? "Assemble all 6 collected stage relics into the Great Rajputana Sun Mosaic!"
              : "CAMPAIGN FINALE COMPLETE!"}
          </div>
        </div>

        <div className="bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 w-max shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <div className="flex gap-1">
            <div className={`w-3 h-1 ${cluesFound >= 1 ? "bg-amber-500" : "bg-amber-200"}`}></div>
            <div className={`w-3 h-1 ${cluesFound >= 2 ? "bg-amber-500" : "bg-amber-200"}`}></div>
            <div className={`w-3 h-1 ${cluesFound >= 3 ? "bg-amber-500" : "bg-amber-200"}`}></div>
          </div>
          <span className="text-[12px] font-bold text-black">{cluesFound}/3 clues</span>
        </div>
      </div>

      {/* Top Right: Actions & Minimap */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-3 z-30">
        <div className="flex items-center gap-3">
          <button onClick={handleResetGame} className="h-10 bg-red-600 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center px-3">
            <span className="text-[13px] font-bold text-white">Restart</span>
          </button>
          <button onClick={() => router.push("/dashboard")} className="h-10 bg-amber-400 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center px-4">
            <span className="text-[13px] font-bold text-black">Leave world</span>
          </button>
        </div>

        {/* Minimap */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-44 h-36 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1 p-1 bg-amber-50/50 rounded">
            {stage === 1 ? (
              <>
                <div className={scene === "ram_pol" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "inner_courtyard" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "vijay_stambh" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "jauhar_kund" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
              </>
            ) : stage === 2 ? (
              <>
                <div className={scene === "wall_approach" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "zigzag_gates" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "soldiers_quarters" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "badal_mahal" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
              </>
            ) : stage === 3 ? (
              <>
                <div className={scene === "jaigarh_entry" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "jaivana_courtyard" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "jal_mahal" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "top_chhatri" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
              </>
            ) : stage === 4 ? (
              <>
                <div className={scene === "kuldhara_gate" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "chiefs_house" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "treasury" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "well" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "village_square" ? "bg-amber-400 border border-amber-600 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
              </>
            ) : stage === 5 ? (
              <>
                <div className={scene === "bhangarh_gate" ? "bg-blue-500 border border-blue-700 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "gopinath_temple" ? "bg-blue-500 border border-blue-700 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "palace_ruins" ? "bg-blue-500 border border-blue-700 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "bhangarh_chase" ? "bg-red-500 border border-red-700 rounded-sm animate-pulse" : "bg-amber-100 rounded-sm"}></div>
              </>
            ) : (
              <>
                <div className={scene === "jaisalmer_streets" ? "bg-amber-500 border border-amber-700 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "kathputli_square" ? "bg-amber-500 border border-amber-700 rounded-sm" : "bg-amber-100 rounded-sm"}></div>
                <div className={scene === "final_courtyard" ? "bg-amber-500 border border-amber-700 rounded-sm animate-pulse" : "bg-amber-100 rounded-sm"}></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Center: Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-600 rounded-full px-6 py-2 shadow-lg flex items-center gap-3">
          <span className="text-white text-[12px] font-bold tracking-wider">WASD / arrows</span>
          <span className="text-gray-400 text-[10px]">- move -</span>
          <span className="text-white text-[12px] font-bold tracking-wider">E</span>
          <span className="text-gray-400 text-[10px]">- interact / open doors</span>
        </div>
      </div>

      {/* STAGE 1 INTRO NARRATIVE */}
      {showIntroNarrative && scene === "ram_pol" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">📜 Chittorgarh — Stage 1</span>
              <button onClick={() => setShowIntroNarrative(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="italic font-bold text-amber-950">&ldquo;The manuscript&apos;s first page points to Chittorgarh... A board that guards the truth.&rdquo;</p>
            <button onClick={() => setShowIntroNarrative(false)} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black">Begin Exploration</button>
          </div>
        </div>
      )}

      {/* CHAUPAR GAME MODAL */}
      {showChauparGame && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🎲 Chaupar — Royal Board Challenge</span>
              <button onClick={() => setShowChauparGame(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <div className="w-full bg-amber-100 border-2 border-black rounded-xl p-4 flex flex-col items-center gap-3">
              <div className="flex justify-between w-full text-xs font-bold font-sans">
                <span className="text-blue-700">🔵 Player Position: {playerChauparPos}/12</span>
                <span className="text-red-700">🔴 Chacha Position: {aiChauparPos}/12</span>
              </div>
              <div className="w-full h-8 bg-amber-200 border-2 border-black rounded-lg flex items-center p-1 gap-1 relative overflow-hidden">
                {Array.from({ length: 13 }).map((_, idx) => (
                  <div key={idx} className="flex-1 h-full border-r border-amber-400 flex items-center justify-center relative">
                    <span className="text-[9px] text-gray-500 font-bold">{idx === 12 ? "HOME" : idx}</span>
                    {playerChauparPos === idx && <div className="w-3 h-3 rounded-full bg-blue-600 absolute shadow-md"></div>}
                    {aiChauparPos === idx && <div className="w-3 h-3 rounded-full bg-red-600 absolute shadow-md translate-y-1"></div>}
                  </div>
                ))}
              </div>
              <div className="text-xs font-bold text-amber-950 font-serif text-center mt-1">{chauparMessage}</div>
            </div>
            <button onClick={handleRollCowries} disabled={!isPlayerTurn || isChauparSolved} className={`w-full border-2 border-black rounded-lg py-2.5 text-xs font-bold ${isPlayerTurn && !isChauparSolved ? "bg-amber-400 hover:bg-amber-300 text-black cursor-pointer" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
              {isChauparSolved ? "Chaupar Completed!" : isPlayerTurn ? "🎲 Roll Cowrie Shells" : "Chacha is thinking..."}
            </button>
          </div>
        </div>
      )}

      {/* BUZURG CHACHA DIALOGUE */}
      {showChachaDialogue && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center pb-24 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-xl p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] max-w-xl w-full mx-4 flex gap-4 items-start relative">
            <div className="w-16 h-16 bg-amber-100 border-2 border-black rounded-lg shrink-0 flex items-center justify-center">
              <img src="/rajasthan-guard.jpg" alt="Chacha" className="w-20 h-20 object-contain rounded border border-amber-900/50" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] font-bold text-amber-800 tracking-wider uppercase block mb-1">Buzurg Chacha</span>
              <p className="text-black font-semibold text-[13px] leading-relaxed mb-3">
                &ldquo;Ah! Face me in Chaupar! Show me your wit before I reveal the path to Vijay Stambh!&rdquo;
              </p>
              <button onClick={() => { setShowChachaDialogue(false); setShowChauparGame(true); }} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-md px-3 py-1 text-xs font-bold text-black">
                &ldquo;I accept the Chaupar challenge!&rdquo;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARVING RESTORATION PUZZLE */}
      {showCarvingPuzzle && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🧩 Vijay Stambh Carving Restoration</span>
              <button onClick={() => setShowCarvingPuzzle(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <div className="flex flex-col gap-2">
              {panelsData.map((p) => {
                const selectedIndex = userCarvingOrder.indexOf(p.id);
                return (
                  <button key={p.id} onClick={() => handleSelectPanel(p.id)} className={`p-3 border-2 border-black rounded-lg flex items-center justify-between ${selectedIndex !== -1 ? "bg-amber-300 border-amber-900" : "bg-white hover:bg-amber-100"}`}>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold font-serif text-black">{p.title}</span>
                      <span className="text-[10.5px] text-gray-600">{p.desc}</span>
                    </div>
                    {selectedIndex !== -1 && <span className="bg-amber-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">Step {selectedIndex + 1}</span>}
                  </button>
                );
              })}
            </div>
            {carvingError && <span className="text-red-600 text-xs font-bold">⚠️ Incorrect order! (Start with 1448 CE proclamation)</span>}
            <button onClick={handleVerifyCarvings} disabled={userCarvingOrder.length !== 4} className={`w-full border-2 border-black rounded-lg py-2.5 text-xs font-bold ${userCarvingOrder.length === 4 ? "bg-amber-400 hover:bg-amber-300 text-black cursor-pointer" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
              Restore Panel Sequence
            </button>
          </div>
        </div>
      )}

      {/* TOWER VIEWPOINT PAYOFF MODAL */}
      {showTowerView && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🏰 Vijay Stambh Summit Viewpoint</span>
              <button onClick={() => setShowTowerView(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <div className="w-full h-44 rounded-lg overflow-hidden border-2 border-black relative">
              <img src="/bg-chittorgarh-vijay-stambh.jpg" alt="Tower View" className="w-full h-full object-cover" />
            </div>
            <p className="text-black font-serif text-[13.5px] leading-relaxed">
              From the 9th storey balcony of Vijay Stambh, 157 feet above the ground, you behold the magnificent sweeping panorama of Chittorgarh Fort!
            </p>
            <button onClick={() => setShowTowerView(false)} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer">
              Descend Tower
            </button>
          </div>
        </div>
      )}

      {/* JAUHAR KUND SOLEMN CUTSCENE */}
      {showJauharCutscene && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#0f0c09] border-2 border-amber-800/80 rounded-2xl p-8 max-w-lg w-full flex flex-col gap-5 text-amber-100 relative shadow-2xl">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest border-b border-amber-900/60 pb-2 block">🕊️ Jauhar Kund — Sacred Historic Sanctuary</span>
            <p className="font-serif text-[14px] leading-relaxed">
              In 1303 CE, Rani Padmini and noblewomen chose supreme self-respect and honor at Jauhar Kund. This sacred site stands as an enduring monument to courage and sacrifice.
            </p>
            <button onClick={() => { setShowJauharCutscene(false); setIsJauharCompleted(true); setShowStage1Complete(true); }} className="bg-amber-900/60 hover:bg-amber-800 border border-amber-600 rounded-lg py-2.5 text-xs font-bold text-amber-200 cursor-pointer">
              Pay Respects & Complete Stage 1
            </button>
          </div>
        </div>
      )}

      {/* STAGE 1 COMPLETE MODAL WITH CAMEL TRANSITION */}
      {showStage1Complete && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest border-b-2 border-amber-200 pb-2 block">🏆 Stage 1 Complete — Chittorgarh Fort!</span>
            <p className="text-black font-serif text-[14px]">You have completed Stage 1! Mount your desert camel caravan to travel to Stage 2 — Kumbhalgarh Fort!</p>
            <button
              onClick={() => {
                setShowStage1Complete(false);
                startCamelTransition(2, "wall_approach", "Caravan Journey: Chittorgarh → Kumbhalgarh Fort");
              }}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              🐫 Mount Camel & Travel to Stage 2 (Kumbhalgarh)
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2 MODALS */}
      {showGuardBheemDialogue && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center pb-24 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-xl p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] max-w-xl w-full mx-4 flex gap-4 items-start relative">
            <div className="w-16 h-16 bg-amber-100 border-2 border-black rounded-lg shrink-0 flex items-center justify-center">
              <img src="/rajasthan-guard.jpg" alt="Bheem" className="w-20 h-20 object-contain rounded border border-amber-900/50" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] font-bold text-amber-800 tracking-wider uppercase block mb-1">Gate Guard Bheem</span>
              <p className="text-black font-semibold text-[13px] leading-relaxed mb-3">
                &ldquo;Halt! These winding zigzag gates were engineered by Maharana Kumbha to break the momentum of charging war elephants and trap invaders under archer fire! Follow the worn stone path to the Soldiers Quarters!&rdquo;
              </p>
              <button onClick={() => setShowGuardBheemDialogue(false)} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-md px-3 py-1 text-xs font-bold text-black">
                &ldquo;I understand the defensive design.&rdquo;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LATTU SPINNING TOP GAME */}
      {showLattuGame && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🌀 Lattu — Mewar Spinning Top Challenge</span>
              <button onClick={() => setShowLattuGame(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px]">
              Time your launch when the oscillating power gauge is in the green zone (70% - 90%)!
            </p>
            <div className="w-full bg-amber-100 border-2 border-black rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between text-xs font-bold font-sans">
                <span className="text-blue-700">Player Score: {lattuScore.player}/2</span>
                <span className="text-amber-800">Target Power: 70-90%</span>
              </div>
              <div className="w-full h-6 bg-gray-200 border-2 border-black rounded-lg relative overflow-hidden">
                <div className="absolute left-[70%] width-[20%] w-1/5 h-full bg-emerald-300 border-x border-emerald-600"></div>
                <div className="h-full bg-amber-500 transition-all duration-75" style={{ width: `${lattuPower}%` }}></div>
              </div>
              <span className="text-xs font-bold text-amber-950 font-serif text-center">{lattuMessage}</span>
            </div>
            <button onClick={handleLaunchLattu} disabled={isLattuSolved} className={`w-full border-2 border-black rounded-lg py-2.5 text-xs font-bold ${!isLattuSolved ? "bg-amber-400 hover:bg-amber-300 text-black cursor-pointer" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
              {isLattuSolved ? "Lattu Challenge Won!" : "🌀 Launch Spinning Top"}
            </button>
          </div>
        </div>
      )}

      {/* FRESCO RESTORATION PUZZLE */}
      {showFrescoPuzzle && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🎨 Badal Mahal Fresco Restoration</span>
              <button onClick={() => setShowFrescoPuzzle(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px]">
              Select the 3 traditional mineral pigments used in royal Mewar court wall frescoes:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {pigmentsList.map((pig) => {
                const isSelected = selectedPigments.includes(pig.id);
                return (
                  <button key={pig.id} onClick={() => handleTogglePigment(pig.id)} className={`p-3 border-2 border-black rounded-lg flex items-center gap-2 ${isSelected ? "bg-amber-300 border-amber-900 font-bold" : "bg-white hover:bg-amber-50"}`}>
                    <div className={`w-4 h-4 rounded-full border border-black ${pig.color}`}></div>
                    <span className={`text-xs ${pig.text}`}>{pig.name}</span>
                  </button>
                );
              })}
            </div>
            {frescoError && <span className="text-red-600 text-xs font-bold">⚠️ Incorrect palette! (Select Red Ochre, Indigo Blue, and Turmeric Yellow)</span>}
            <button onClick={handleVerifyFresco} disabled={selectedPigments.length !== 3} className={`w-full border-2 border-black rounded-lg py-2.5 text-xs font-bold ${selectedPigments.length === 3 ? "bg-amber-400 hover:bg-amber-300 text-black cursor-pointer" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
              Restore Wall Fresco
            </button>
          </div>
        </div>
      )}

      {/* MAHARANA PRATAP BIRTHPLACE CUTSCENE */}
      {showPratapCutscene && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#0f0c09] border-2 border-amber-800/80 rounded-2xl p-8 max-w-lg w-full flex flex-col gap-5 text-amber-100 relative shadow-2xl">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest border-b border-amber-900/60 pb-2 block">🚩 Birthplace of Maharana Pratap</span>
            <div className="font-serif text-[14px] leading-relaxed flex flex-col gap-4 text-amber-200/90">
              <p className="italic text-amber-100 font-bold">You stand in the royal birth chamber at the summit of Kumbhalgarh Fort.</p>
              <p>Here, in May 1540 CE, Maharana Pratap was born. His heroic resistance, devotion to freedom, and legendary bond with his steed Chetak shaped the history of India.</p>
            </div>
            <button onClick={() => { setShowPratapCutscene(false); setIsPratapCompleted(true); setShowStage2Complete(true); }} className="bg-amber-900/60 hover:bg-amber-800 border border-amber-600 rounded-lg py-2.5 text-xs font-bold text-amber-200 cursor-pointer">
              Pay Respects & Complete Stage 2
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2 COMPLETE MODAL WITH CAMEL TRANSITION */}
      {showStage2Complete && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest border-b-2 border-amber-200 pb-2 block">🏆 Stage 2 Complete — Kumbhalgarh Fort!</span>
            <p className="text-black font-serif text-[14px]">You have completed Stage 2! Mount your camel caravan to travel to Stage 3 — Jaigarh Fort & Jal Mahal!</p>
            <button
              onClick={() => {
                setShowStage2Complete(false);
                startCamelTransition(3, "jaigarh_entry", "Caravan Journey: Kumbhalgarh → Jaigarh Fort & Jal Mahal");
              }}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              🐫 Mount Camel & Travel to Stage 3 (Jaigarh & Jal Mahal)
            </button>
          </div>
        </div>
      )}

      {/* --- STAGE 3 MODALS --- */}
      {showArmorerDialogue && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center pb-24 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-xl p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] max-w-xl w-full mx-4 flex gap-4 items-start relative">
            <div className="w-16 h-16 bg-amber-100 border-2 border-black rounded-lg shrink-0 flex items-center justify-center">
              <img src="/rajasthan-guard.jpg" alt="Armorer" className="w-20 h-20 object-contain rounded border border-amber-900/50" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] font-bold text-amber-800 tracking-wider uppercase block mb-1">Master Armorer Ustad</span>
              <p className="text-black font-semibold text-[13px] leading-relaxed mb-3">
                &ldquo;Welcome to Jaigarh Fort, traveler! Behold Jaivana—cast in 1720 CE under Maharaja Sawai Jai Singh II. Weighing 50 tons with a 20-foot barrel, it is traditionally said to have test-fired over 35 km! Calibrate its trajectory to unlock the secret path to Jal Mahal!&rdquo;
              </p>
              <button onClick={() => { setShowArmorerDialogue(false); setShowCannonPuzzle(true); }} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-md px-3 py-1 text-xs font-bold text-black">
                &ldquo;I will calibrate the cannon trajectory.&rdquo;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JAIVANA CANNON CALIBRATION PUZZLE */}
      {showCannonPuzzle && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🎯 Jaivana Cannon Calibration</span>
              <button onClick={() => setShowCannonPuzzle(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px]">Set optimal elevation angle and gunpowder charge to reach the 35 km test target range:</p>
            <div className="w-full bg-amber-100 border-2 border-black rounded-xl p-4 flex flex-col gap-3 font-sans">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-black">
                  <span>Elevation Angle:</span>
                  <span className="text-amber-800 font-serif font-bold">{cannonElevation}°</span>
                </div>
                <input type="range" min="15" max="60" step="5" value={cannonElevation} onChange={(e) => setCannonElevation(Number(e.target.value))} className="w-full accent-amber-600" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-black">
                  <span>Gunpowder Charge:</span>
                  <span className="text-amber-800 font-serif font-bold">{cannonCharge} kg</span>
                </div>
                <input type="range" min="20" max="100" step="10" value={cannonCharge} onChange={(e) => setCannonCharge(Number(e.target.value))} className="w-full accent-amber-600" />
              </div>
              <div className="text-xs font-bold text-amber-950 font-serif text-center mt-1">{cannonMessage}</div>
            </div>
            <button onClick={handleFireCannon} disabled={isCannonCalibrated} className={`w-full border-2 border-black rounded-lg py-2.5 text-xs font-bold ${!isCannonCalibrated ? "bg-amber-400 hover:bg-amber-300 text-black cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)]" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
              {isCannonCalibrated ? "Cannon Calibrated & Fired!" : "💥 Fire Calibration Test"}
            </button>
          </div>
        </div>
      )}

      {/* JAL MAHAL HYDRAULIC SLUICE PUZZLE */}
      {showHydraulicPuzzle && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🌊 Jal Mahal Hydraulic Sluice System</span>
              <button onClick={() => setShowHydraulicPuzzle(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px]">Operate the 3 water sluice gates to balance Man Sagar Lake water level and reveal the submerged archways:</p>
            <div className="grid grid-cols-3 gap-2 my-1">
              {["Sluice A (Inlet)", "Sluice B (Overflow)", "Sluice C (Aqueduct)"].map((label, idx) => (
                <button key={label} onClick={() => handleToggleSluice(idx)} className={`border-2 border-black rounded-lg py-3 px-1 flex flex-col items-center justify-center ${sluiceState[idx] ? "bg-emerald-100 border-emerald-900 text-emerald-950 font-bold" : "bg-red-100 border-red-900 text-red-950 font-bold"}`}>
                  <span className="text-[10px] uppercase text-center">{label}</span>
                  <span className="text-xs mt-1">{sluiceState[idx] ? "OPEN" : "CLOSED"}</span>
                </button>
              ))}
            </div>
            {hydraulicError && <span className="text-red-600 text-xs font-bold">⚠️ Imbalanced flow! (Close Inlet Gate A, Open Overflow B & Aqueduct C)</span>}
            <button onClick={handleVerifyHydraulic} disabled={isHydraulicSolved} className={`w-full border-2 border-black rounded-lg py-2.5 text-xs font-bold ${!isHydraulicSolved ? "bg-amber-400 hover:bg-amber-300 text-black cursor-pointer" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
              {isHydraulicSolved ? "Water Level Balanced!" : "🌊 Balance Water Level"}
            </button>
          </div>
        </div>
      )}

      {/* TOP FLOOR CHHATRI CUTSCENE */}
      {showChhatriCutscene && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#0f0c09] border-2 border-amber-800/80 rounded-2xl p-8 max-w-lg w-full flex flex-col gap-5 text-amber-100 relative shadow-2xl">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest border-b border-amber-900/60 pb-2 block">🌅 Jal Mahal Rooftop Chhatri Pavilion</span>
            <div className="font-serif text-[14px] leading-relaxed flex flex-col gap-4 text-amber-200/90">
              <p className="italic text-amber-100 font-bold">You stand on the rooftop pavilion of Jal Mahal as the golden sunset reflects across Man Sagar Lake.</p>
              <p>Built in the 18th century by Maharaja Jai Singh II, Jal Mahal has 4 storeys submerged underwater that remain cool naturally year-round!</p>
            </div>
            <button onClick={() => { setShowChhatriCutscene(false); setIsChhatriCompleted(true); setShowStage3Complete(true); }} className="bg-amber-900/60 hover:bg-amber-800 border border-amber-600 rounded-lg py-2.5 text-xs font-bold text-amber-200 cursor-pointer">
              Reflect & Complete Stage 3
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3 COMPLETE MODAL WITH CAMEL TRANSITION */}
      {showStage3Complete && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest border-b-2 border-amber-200 pb-2 block">🏆 Stage 3 Complete — Jaigarh & Jal Mahal!</span>
            <p className="text-black font-serif text-[14px]">You have completed Stage 3! Mount your camel caravan to travel to Stage 4 — Kuldhara Ghost Village!</p>
            <button
              onClick={() => {
                setShowStage3Complete(false);
                startCamelTransition(4, "kuldhara_gate", "Caravan Journey: Jaigarh → Kuldhara Ghost Village");
              }}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              🐫 Mount Camel & Travel to Stage 4 (Kuldhara)
            </button>
          </div>
        </div>
      )}

      {/* --- STAGE 4 MODALS --- */}
      {showGateMarkerModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">📜 Kuldhara Entrance Marker &ldquo;83&rdquo;</span>
              <button onClick={() => setShowGateMarkerModal(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px] leading-relaxed">
              You inspect the weathered sandstone pillar carved with the number <strong>83</strong>.
            </p>
            <p className="text-xs text-amber-900 bg-amber-100 p-2.5 rounded border border-amber-300">
              💡 <strong>Historical Clue:</strong> Oral tradition notes that 83 Paliwal Brahmin villages were deserted simultaneously in 1825.
            </p>
            <button onClick={() => setShowGateMarkerModal(false)} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black">
              Continue Investigation
            </button>
          </div>
        </div>
      )}

      {showChiefModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">💍 Chief Haveli — Relics & Voice Echo</span>
              <button onClick={() => setShowChiefModal(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px] leading-relaxed">
              Inside the ruined haveli, you find a broken mirror and a silver wedding ornament.
            </p>
            <p className="text-xs italic text-[#5c3a10] bg-amber-50 p-2.5 rounded border border-amber-300">
              🔊 <em>Echo Fragment: &ldquo;Minister Salim Singh has demanded the chief&apos;s daughter in marriage by sunset or face destruction... We must gather the council!&rdquo;</em>
            </p>
            <button onClick={() => setShowChiefModal(false)} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black">
              Collect Evidence
            </button>
          </div>
        </div>
      )}

      {showTreasuryModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">📜 Merchant Treasury — Tax Ledger</span>
              <button onClick={() => setShowTreasuryModal(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px] leading-relaxed">
              You discover a torn leather-bound ledger listing astronomical tax hikes.
            </p>
            <p className="text-xs text-amber-900 bg-amber-100 p-2.5 rounded border border-amber-300">
              💡 <strong>Historical Evidence:</strong> Salim Singh levied escalating extortion taxes on the merchant community.
            </p>
            <button onClick={() => setShowTreasuryModal(false)} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black">
              Collect Evidence
            </button>
          </div>
        </div>
      )}

      {showWellModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🏺 Village Stepwell — Intact Pots</span>
              <button onClick={() => setShowWellModal(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px] leading-relaxed">
              Beside the stepwell sit intact clay water pots left undisturbed.
            </p>
            <p className="text-xs text-amber-900 bg-amber-100 p-2.5 rounded border border-amber-300">
              💡 <strong>Archaeological Fact:</strong> Intact pottery corroborates a swift, organized overnight evacuation of all 83 villages.
            </p>
            <button onClick={() => setShowWellModal(false)} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black">
              Collect Evidence
            </button>
          </div>
        </div>
      )}

      {/* EVIDENCE MATCHING PUZZLE */}
      {showEvidencePuzzle && (
        <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🧩 Kuldhara Evidence Deduction Panel</span>
              <button onClick={() => setShowEvidencePuzzle(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>

            <p className="text-black font-serif text-[13.5px]">Match each evidence card to its correct historical conclusion:</p>

            <div className="flex flex-col gap-3 font-sans">
              {evidenceCards.map((card) => (
                <div key={card.id} className="bg-amber-50 border-2 border-black rounded-lg p-3 flex flex-col gap-2">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <span>{card.icon}</span> {card.label}
                  </span>
                  <select
                    value={evidenceMatches[card.id] || ""}
                    onChange={(e) => handleSetEvidenceMatch(card.id, e.target.value)}
                    className="border-2 border-black rounded px-2.5 py-1 text-xs bg-white text-black"
                  >
                    <option value="">-- Select Matching Conclusion --</option>
                    {conclusionOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {evidenceError && <span className="text-red-600 text-xs font-bold font-sans">⚠️ Incorrect deduction! Match Ornament to Forced Marriage, Ledger to Taxation, and Water Pots to Coordinated Evacuation</span>}

            <button onClick={handleVerifyEvidence} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer">
              Submit Investigation Conclusion
            </button>
          </div>
        </div>
      )}

      {showKuldharaTimeoutModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <span className="text-[12px] font-bold text-red-900 uppercase tracking-widest border-b-2 border-red-200 pb-2 block">⌛ Time Expired in Kuldhara!</span>
            <p className="text-black font-serif text-[13.5px] leading-relaxed">
              Night fell before evidence deduction was complete! Collected clues remain saved.
            </p>
            <button onClick={handleRetryKuldharaTimer} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer">
              🔄 Retry Investigation (Clues Retained)
            </button>
          </div>
        </div>
      )}

      {showStage4Complete || (isEvidenceSolved && !showStage4Complete && stage === 4 && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest border-b-2 border-amber-200 pb-2 block">🏆 Stage 4 Complete — Kuldhara Ghost Village!</span>
            <p className="text-black font-serif text-[14px]">You uncovered the truth behind Kuldhara! Mount your camel caravan to travel to Stage 5 — Bhangarh Fort!</p>
            <button
              onClick={() => {
                setShowStage4Complete(false);
                startCamelTransition(5, "bhangarh_gate", "Caravan Journey: Kuldhara → Bhangarh Fort");
              }}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              🐫 Mount Camel & Travel to Stage 5 (Bhangarh)
            </button>
          </div>
        </div>
      ))}

      {/* --- STAGE 5 MODALS --- */}
      {showTempleModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🛕 Gopinath Temple — Faded Fresco Verse</span>
              <button onClick={() => setShowTempleModal(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px] leading-relaxed">
              Torchlight reveals the restored wall painting of Lord Gopinath with the verse fragment:
            </p>
            <p className="text-xs font-bold text-blue-950 bg-blue-100 p-2.5 rounded border border-blue-300 font-serif italic text-center">
              &ldquo;Where shadows lengthen beneath the moonlit terrace, search the royal stone altar for the sacred Hanuman Chalisa verses.&rdquo;
            </p>
            <button onClick={() => setShowTempleModal(false)} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black">
              Ascend to Palace Ruins
            </button>
          </div>
        </div>
      )}

      {showChalisaModal && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/90 via-indigo-900/80 to-amber-950/90 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#0c0f18] border-2 border-blue-400/60 rounded-2xl p-8 max-w-lg w-full flex flex-col gap-5 text-blue-100 relative shadow-2xl">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest border-b border-blue-900/60 pb-2 block">🌅 Dawn Rises Over Bhangarh Fort</span>
            <p className="font-serif text-[14px] leading-relaxed text-blue-200/90">
              You discovered the sacred Hanuman Chalisa manuscript! Shadow silhouettes fade into morning mist as golden dawn touches the 17th-century ruins.
            </p>
            <button onClick={() => { setShowChalisaModal(false); setShowStage5Complete(true); }} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer">
              Complete Stage 5 & Reveal Final Clue
            </button>
          </div>
        </div>
      )}

      {isBhangarhChaseActive && (
        <div className="absolute inset-x-6 top-24 bg-red-950/90 border-2 border-red-500 rounded-xl p-4 z-40 text-red-100 flex items-center justify-between shadow-2xl animate-pulse">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">👻 Shadow Manifested — Chase Active!</span>
            <span className="text-xs font-serif italic text-red-200">&ldquo;Still searching, wanderer? Reach the entrance gate below!&rdquo;</span>
          </div>
          <button onClick={handleRetryBhangarhChase} className="bg-red-600 hover:bg-red-500 border border-black rounded px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
            Pass Gate to Retry
          </button>
        </div>
      )}

      {showStage5Complete || (isChalisaFound && !showStage5Complete && stage === 5 && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest border-b-2 border-amber-200 pb-2 block">🏆 Stage 5 Complete — Bhangarh Fort!</span>
            <p className="text-black font-serif text-[14px]">You completed Stage 5! Mount your camel caravan to travel to the Final Stage — Jaisalmer Fort!</p>
            <button
              onClick={() => {
                setShowStage5Complete(false);
                startCamelTransition(6, "jaisalmer_streets", "Caravan Journey: Bhangarh → Jaisalmer Golden City");
              }}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              🐫 Mount Camel & Travel to Stage 6 (Jaisalmer)
            </button>
          </div>
        </div>
      ))}

      {/* --- STAGE 6 MODALS (Jaisalmer Golden City & Finale) --- */}
      {showKathputliGame && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🎭 Kathputli — Rajasthani Puppet Rhythm</span>
              <button onClick={() => setShowKathputliGame(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px]">
              Master Ustadi Ustaad invites you to control the puppet strings! Pull strings when the rhythm bar is in the green zone (65% - 90%):
            </p>
            <div className="w-full bg-amber-100 border-2 border-black rounded-xl p-4 flex flex-col gap-3 font-sans">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-700">Rhythm Steps: {puppetScore}/3</span>
                <span className="text-amber-800">Target Rhythm: 65-90%</span>
              </div>
              <div className="w-full h-6 bg-gray-200 border-2 border-black rounded-lg relative overflow-hidden">
                <div className="absolute left-[65%] width-[25%] w-1/4 h-full bg-emerald-300 border-x border-emerald-600"></div>
                <div className="h-full bg-amber-500 transition-all duration-75" style={{ width: `${puppetTiming}%` }}></div>
              </div>
              <span className="text-xs font-bold text-amber-950 font-serif text-center">{kathputliMessage}</span>
            </div>
            <button onClick={handlePullPuppetString} disabled={isKathputliSolved} className={`w-full border-2 border-black rounded-lg py-2.5 text-xs font-bold ${!isKathputliSolved ? "bg-amber-400 hover:bg-amber-300 text-black cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)]" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
              {isKathputliSolved ? "Kathputli Performance Complete!" : "🎭 Pull Puppet String"}
            </button>
          </div>
        </div>
      )}

      {/* RELIC MOSAIC ASSEMBLY PUZZLE */}
      {showMosaicAssembly && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest">🧩 Great Rajputana Sun Relic Mosaic</span>
              <button onClick={() => setShowMosaicAssembly(false)} className="text-gray-500 hover:text-black font-bold text-sm">✕ Close</button>
            </div>
            <p className="text-black font-serif text-[13.5px]">
              Combine the 6 historic relic fragments collected across all Rajasthan campaign stages:
            </p>
            <div className="grid grid-cols-3 gap-2 my-2 font-sans">
              {mosaicFragments.map((frag) => {
                const isPlaced = placedMosaicTiles.includes(frag.id);
                return (
                  <button key={frag.id} onClick={() => handlePlaceTile(frag.id)} disabled={isPlaced} className={`p-3 border-2 border-black rounded-lg flex flex-col items-center text-center ${isPlaced ? "bg-amber-300 border-amber-900 font-bold" : "bg-white hover:bg-amber-100 cursor-pointer"}`}>
                    <span className="text-xl mb-1">{frag.icon}</span>
                    <span className="text-[10.5px] font-bold leading-tight">{frag.name}</span>
                    <span className="text-[9px] text-gray-600 mt-1">{isPlaced ? "✅ PLACED" : "Click to Place"}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-center text-xs font-bold text-amber-950 font-serif">
              Tiles Placed: {placedMosaicTiles.length}/6
            </div>
          </div>
        </div>
      )}

      {/* GRAND FINALE CUTSCENE */}
      {showFinaleCutscene && (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/95 via-yellow-900/90 to-amber-950/95 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#181109] border-2 border-amber-400/80 rounded-2xl p-8 max-w-xl w-full flex flex-col gap-5 text-amber-100 relative shadow-[0_0_50px_rgba(234,179,8,0.4)]">
            <span className="text-[12px] font-bold text-amber-400 uppercase tracking-widest border-b border-amber-900/60 pb-2 block text-center">☀️ Grand Finale — Spirit of Great Rajputana</span>
            <div className="font-serif text-[14.5px] leading-relaxed flex flex-col gap-4 text-amber-200/95">
              <p className="italic text-amber-100 font-bold text-center text-lg">
                &ldquo;Rajputana&apos;s spirit was never only in its walls.&rdquo;
              </p>
              <p>
                From the victorious heights of Chittorgarh and the continuous wall of Kumbhalgarh, to the bronze foundries of Jaigarh, the water architecture of Jal Mahal, the desert memory of Kuldhara, the moonlit sanctuary of Bhangarh, and the living golden streets of Jaisalmer—
              </p>
              <p>
                Heritage survives through its people, stories, art, and memory—enduring, dignified, and alive.
              </p>
            </div>
            <button onClick={() => { setShowFinaleCutscene(false); setIsCampaignComplete(true); setShowCampaignCompleteModal(true); }} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-3 text-xs font-bold text-black cursor-pointer shadow-lg">
              Claim Campaign Victory & Final Rewards
            </button>
          </div>
        </div>
      )}

      {/* FINAL CAMPAIGN COMPLETE MODAL */}
      {showCampaignCompleteModal || (isCampaignComplete && !showCampaignCompleteModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-black rounded-2xl p-8 shadow-[10px_10px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-5 relative text-center">
            <span className="text-[13px] font-bold text-amber-900 uppercase tracking-widest border-b-2 border-amber-300 pb-2 block">🏆 RAJASTHAN CAMPAIGN COMPLETE!</span>
            <div className="grid grid-cols-2 gap-3 text-left font-sans">
              <div className="bg-amber-100/70 border border-amber-300 p-3 rounded-lg flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-800">Stages Mastered</span>
                <span className="text-lg font-bold text-black">6 / 6 Stages</span>
              </div>
              <div className="bg-amber-100/70 border border-amber-300 p-3 rounded-lg flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-800">Puzzles Solved</span>
                <span className="text-lg font-bold text-black">6 / 6 Puzzles</span>
              </div>
              <div className="bg-amber-100/70 border border-amber-300 p-3 rounded-lg flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-800">Historical Clues</span>
                <span className="text-lg font-bold text-black">18 / 18 Clues</span>
              </div>
              <div className="bg-amber-100/70 border border-amber-300 p-3 rounded-lg flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-800">Campaign XP Gained</span>
                <span className="text-lg font-bold text-emerald-700">+1,500 XP</span>
              </div>
            </div>
            <button onClick={() => router.push("/dashboard")} className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-3 text-xs font-bold text-black cursor-pointer shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              Return to Campaign Hub
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
