"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- STAGE 1 STATE (Chittorgarh - Chaupar Game) ---
  const [showChachaDialogue, setShowChachaDialogue] = useState(false);
  const [showChauparGame, setShowChauparGame] = useState(false);
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

  // --- STAGE 3 STATE (Kuldhara) ---
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

  // --- STAGE 3 -> STAGE 4 TRANSITION (Nightfall Caravan) ---
  const [isBhangarhTravelling, setIsBhangarhTravelling] = useState(false);
  const [bhangarhTravelPhase, setBhangarhTravelPhase] = useState<1 | 2 | 3 | 4>(1);

  // --- STAGE 4 STATE (Bhangarh Fort 2-Min Relic Challenge) ---
  const [bhangarhTimer, setBhangarhTimer] = useState(120); // 2-minute countdown timer (120s)
  const [showBhangarhTimeOutModal, setShowBhangarhTimeOutModal] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [moonriseTimer, setMoonriseTimer] = useState(180);
  const [isMoonriseActive, setIsMoonriseActive] = useState(false);

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
    setShowBhangarhTimeOutModal(false);
    setScene("bhangarh_gate");
    setPlayerPos({ x: 50.0, y: 86.0 });
    setBhangarhTimer(120);
    setHasKathputliFragment(false);
    setHasPaliwalSeal(false);
    setHasWanderersVerse(false);
    setHasShield(false);
    setShowShieldModal(false);
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
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
    setIsTransitioning(true);
    setTimeout(() => {
      setStage(1);
      setScene("ram_pol");
      setPlayerPos({ x: 50.0, y: 88.0 });
      setFacingLeft(false);
      setShowChachaDialogue(false);
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

  // --- BHANGARH 2-MINUTE CHALLENGE TIMER (Stage 4) ---
  useEffect(() => {
    if (stage !== 4 || isCampaignComplete) return;

    const allRelicsFound = hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse;
    if (allRelicsFound) {
      if (!hasShield) {
        setHasShield(true);
        setShowShieldModal(true);
      }
      return; // Freeze countdown when all 3 artifacts collected
    }

    const interval = setInterval(() => {
      setBhangarhTimer((prev) => {
        if (prev <= 1) {
          setShowBhangarhTimeOutModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, isCampaignComplete, hasKathputliFragment, hasPaliwalSeal, hasWanderersVerse, hasShield]);

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
  const isNearHaveliOrnament = scene === "chiefs_house" && playerPos.x >= 52.0;
  const isNearHaveliTreasuryDoor = scene === "chiefs_house" && playerPos.y <= 62.0;
  const isNearHaveliGateExit = scene === "chiefs_house" && playerPos.y >= 88.0;
  const isNearTaxLedger = scene === "treasury" && playerPos.x >= 28.0 && playerPos.x <= 75.0 && playerPos.y <= 85.0;
  const isNearTreasuryWellDoor = scene === "treasury" && playerPos.x >= 70.0;
  const isNearTreasuryHaveliExit = scene === "treasury" && playerPos.y >= 88.0;
  const isNearStepwellPots = scene === "well" && playerPos.x <= 55.0 && playerPos.y >= 65.0;
  const isNearStepwellSquareDoor = scene === "well" && playerPos.x >= 70.0;
  const isNearStepwellTreasuryExit = scene === "well" && playerPos.y >= 88.0 && playerPos.x <= 60.0;
  const isNearChhatriDeduction = scene === "village_square" && playerPos.x >= 28.0 && playerPos.x <= 72.0 && playerPos.y >= 55.0 && playerPos.y <= 88.0;
  const isNearSquareWellExit = scene === "village_square" && playerPos.x <= 20.0 && playerPos.y >= 70.0;

  // --- STAGE 4 (BHANGARH FORT 1-MIN CHALLENGE) PROXIMITY TRIGGERS ---
  // Scene 1: Bhangarh Gate
  const isNearKathputliFragment = scene === "bhangarh_gate" && !hasKathputliFragment && playerPos.y >= 60.0;
  const isNearBhangarhGateMarker = scene === "bhangarh_gate" && playerPos.x >= 52.0 && playerPos.y >= 60.0;
  const isNearBhangarhGateArch = scene === "bhangarh_gate" && playerPos.y <= 78.0;

  // Scene 2: Gopinath Temple / Royal Baoli
  const isNearPaliwalSeal = scene === "gopinath_temple" && !hasPaliwalSeal && playerPos.y <= 85.0;
  const isNearTempleSanctuary = scene === "gopinath_temple" && playerPos.x <= 54.0 && playerPos.y <= 75.0;
  const isNearTemplePalaceDoor = scene === "gopinath_temple" && playerPos.y <= 82.0;
  const isNearTempleGateExit = scene === "gopinath_temple" && playerPos.y >= 75.0;

  // Scene 3: Bhangarh Palace Ruins
  const isNearWanderersVerse = scene === "palace_ruins" && !hasWanderersVerse && playerPos.y <= 85.0;
  const isNearPalaceStratum = scene === "palace_ruins" && playerPos.x <= 40.0 && playerPos.y >= 65.0; // Point A: 1783 CE famine stratum
  const isNearFolkloreBoard = scene === "palace_ruins" && playerPos.x >= 65.0 && playerPos.y >= 65.0; // Point B: Folklore vs Evidence
  const isNearFinalEvidenceBoard = scene === "palace_ruins" && playerPos.y <= 88.0 && hasKathputliFragment && hasPaliwalSeal && hasWanderersVerse;
  const isNearPalaceTempleExit = scene === "palace_ruins" && playerPos.y >= 75.0;

  // Scene 4: Bhangarh Chase Escape
  const isNearChaseGateExit = scene === "bhangarh_chase" && playerPos.x >= 68.0 && playerPos.y <= 65.0;

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
          state.setShowChachaDialogue(true);
        } else if (state.isNearVijayStambhDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("vijay_stambh_interior");
            state.setPlayerPos({ x: 50.0, y: 88.0 });
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
        }
        // Stage 4 (Bhangarh Fort 1-Min Relic Challenge)
        else if (state.isNearKathputliFragment) {
          state.setHasKathputliFragment?.(true);
          state.setShowKathputliModal?.(true);
          soundFx.playClueChime();
        } else if (state.isNearPaliwalSeal) {
          state.setHasPaliwalSeal?.(true);
          state.setShowPaliwalSealModal?.(true);
          soundFx.playClueChime();
        } else if (state.isNearWanderersVerse) {
          state.setHasWanderersVerse?.(true);
          state.setShowWanderersVerseModal?.(true);
          soundFx.playClueChime();
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
        } else if (state.isNearFinalEvidenceBoard || (state.scene === "palace_ruins" && state.hasKathputliFragment && state.hasPaliwalSeal && state.hasWanderersVerse)) {
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
            state.setPlayerPos({ x: 45.0, y: 60.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearTreasuryHaveliExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("chiefs_house");
            state.setPlayerPos({ x: 50.0, y: 60.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearStepwellTreasuryExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("treasury");
            state.setPlayerPos({ x: 74.0, y: 70.0 });
            state.setIsTransitioning(false);
          }, 400);
        } else if (state.isNearSquareWellExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("well");
            state.setPlayerPos({ x: 76.0, y: 78.0 });
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
        state.setShowChachaDialogue(false);
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

      if (pTotal > cTotal) {
        setChauparScore((prev) => ({ ...prev, player: prev.player + 1 }));
        setPlayerPawnPos((prev) => Math.min(12, prev + Math.ceil(pTotal / 2)));
        setChauparMessage(`🎲 You rolled ${d1} & ${d2} (${pTotal} pips)! Chacha rolled ${c1} & ${c2} (${cTotal}). Your Golden Goti advances on the Chaupar board!`);
      } else if (cTotal > pTotal) {
        setChauparScore((prev) => ({ ...prev, chacha: prev.chacha + 1 }));
        setChachaPawnPos((prev) => Math.min(12, prev + Math.ceil(cTotal / 2)));
        setChauparMessage(`🎲 You rolled ${d1} & ${d2} (${pTotal} pips). Chacha rolled ${c1} & ${c2} (${cTotal}). Chacha's Ruby Goti takes the point!`);
      } else {
        setChauparMessage(`🎲 Both rolled ${pTotal} pips! It's a tie round — pawns hold position.`);
      }

      setTimeout(() => {
        setIsPawnMoving(false);
      }, 600);
    }, 750);
  };

  const handleResetChauparMatch = () => {
    setChauparScore({ player: 0, chacha: 0 });
    setPlayerPawnPos(0);
    setChachaPawnPos(0);
    setDiceRoll1(3);
    setDiceRoll2(4);
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
        return "Explore the carved sandstone chamber of Vijay Stambh. Press F to exit outside to the plaza.";
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
        return "Explore the regal chambers of Badal Mahal. Ascend the interior stairs to the top terrace.";
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
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          stage === 4
            ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/85"
            : "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/60"
        }`}
      />

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

        {/* Stage 4 2-MIN TIMER CARD */}
        {stage === 4 && (
          <div className="bg-[#fff9ea] border-2 border-black rounded-xl px-3.5 py-2 w-64 shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <span className="animate-pulse text-sm">⏱️</span>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-950">
                TIMER
              </span>
            </div>
            <span className={`text-[13px] font-mono font-black px-2.5 py-0.5 rounded border ${
              bhangarhTimer <= 20
                ? "bg-red-600 text-white border-black animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                : "bg-red-100 text-red-600 border-red-300"
            }`}>
              {Math.floor(bhangarhTimer / 60)}:{(bhangarhTimer % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}

        {/* Stage 4 Ambient BGM YouTube Audio Player (Plays unless muted) */}
        {stage === 4 && !isMusicMuted && (
          <iframe
            className="w-1 h-1 opacity-0 absolute pointer-events-none"
            src="https://www.youtube.com/embed/-ldS2caI16I?autoplay=1&loop=1&playlist=-ldS2caI16I&enablejsapi=1"
            title="Bhangarh Fort Ambient BGM"
            allow="autoplay; encrypted-media"
          />
        )}
      </div>

      {/* --- TOP RIGHT ACTION BUTTONS (EXACT MUGHAL ENGINE FORMAT: IMAGE 2) --- */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          {/* Silent Switchable Timer Button */}
          <button 
            onClick={() => {
              soundFx.playButtonClick();
              setIsTimerVisible(!isTimerVisible);
            }}
            title={isTimerVisible ? "Timer Active (Click to hide)" : "Click to view session timer"}
            className={`h-10 px-3.5 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 font-black text-xs cursor-pointer ${
              isTimerVisible ? "bg-[#fcd34d] text-black" : "bg-white/90 hover:bg-white text-gray-800"
            }`}
          >
            <span>⏱️</span>
            {isTimerVisible ? (
              <span>
                {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
                {String(elapsedSeconds % 60).padStart(2, '0')}
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-black">TIMER</span>
            )}
          </button>

          <button
            onClick={() => {
              soundFx.playButtonClick();
              handleResetGame();
            }}
            title="Restart to Beginning"
            className="h-10 bg-red-600 text-white border-2 border-black rounded-lg px-3.5 text-[13px] font-extrabold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-red-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            <svg className="w-4 h-4 text-white group-hover:-rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Restart</span>
          </button>

          <button
            onClick={() => {
              soundFx.playButtonClick();
              setIsMusicMuted(!isMusicMuted);
            }}
            title={isMusicMuted ? "Unmute Background Music" : "Mute Background Music"}
            className={`w-10 h-10 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center cursor-pointer ${
              isMusicMuted ? "bg-gray-200 text-gray-500" : "bg-amber-400 text-black"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
            </svg>
          </button>

          <button
            onClick={() => {
              const muted = soundFx.toggleMute();
              setIsSoundMuted(muted);
            }}
            title={isSoundMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
            className={`w-10 h-10 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center cursor-pointer ${
              isSoundMuted ? "bg-gray-200 text-gray-500" : "bg-amber-400 text-black"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
            </svg>
          </button>

          <button
            onClick={() => {
              soundFx.playButtonClick();
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
            transform: `translate(-50%, -96%) scale(${
              scene === "vijay_stambh" ? 1.035
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

      {/* --- INTERACTION PROMPT BANNERS --- */}
      {/* Stage 1 */}
      {isNearRamPolDoor && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce pointer-events-none">
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Building
        </div>
      )}

      {isNearChacha && !showChachaDialogue && !showChauparGame && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => setShowChachaDialogue(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Play Chaupar with Buzurg Chacha
        </div>
      )}

      {isNearVijayStambhDoor && !showVijayStambhModal && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => setShowVijayStambhModal(true)}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Vijay Stambh (Tower of Victory)
        </div>
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
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => { setHasWeddingOrnament(true); setShowHaveliOrnamentModal(true); }}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Inspect Bridal Wedding Ornament in Alcove
        </div>
      )}

      {isNearTaxLedger && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => { setHasTaxLedger(true); setShowTaxLedgerModal(true); }}>
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Examine Torn Tax Ledger &amp; Grain Storage
        </div>
      )}

      {isNearStepwellPots && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto" onClick={() => { setHasWaterPotsSupplies(true); setShowStepwellModal(true); }}>
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

      {/* --- STAGE 4 PROMPTS (BHANGARH FORT 1-MIN CHALLENGE) --- */}
      {isNearKathputliFragment && (
        <div
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black rounded-xl px-5 py-2.5 shadow-[5px_5px_0_0_rgba(0,0,0,1)] text-[13px] font-black tracking-wide flex items-center gap-2.5 z-30 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => {
            soundFx.playClueChime();
            setHasKathputliFragment(true);
            setShowKathputliModal(true);
          }}
        >
          <span className="bg-black text-amber-400 rounded px-2 py-0.5 text-[11px] font-mono">E</span>
          ✨ Collect Kathputli Fragment (Stories Carved in Sand)
        </div>
      )}

      {isNearPaliwalSeal && (
        <div
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black rounded-xl px-5 py-2.5 shadow-[5px_5px_0_0_rgba(0,0,0,1)] text-[13px] font-black tracking-wide flex items-center gap-2.5 z-30 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => {
            soundFx.playClueChime();
            setHasPaliwalSeal(true);
            setShowPaliwalSealModal(true);
          }}
        >
          <span className="bg-black text-amber-400 rounded px-2 py-0.5 text-[11px] font-mono">E</span>
          ✨ Collect Paliwal Ledger Seal (Horse Emblem Medallion)
        </div>
      )}

      {isNearWanderersVerse && (
        <div
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black rounded-xl px-5 py-2.5 shadow-[5px_5px_0_0_rgba(0,0,0,1)] text-[13px] font-black tracking-wide flex items-center gap-2.5 z-30 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => {
            soundFx.playClueChime();
            setHasWanderersVerse(true);
            setShowWanderersVerseModal(true);
          }}
        >
          <span className="bg-black text-amber-400 rounded px-2 py-0.5 text-[11px] font-mono">E</span>
          ✨ Collect Wanderer&apos;s Verse (Antelope Medallion)
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

      {/* --- NAVIGATION DIRECTION PROMPTS --- */}
      {isNearGateVillagePath && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▲</span> Walk north into the Chief&apos;s Haveli (Press E)
        </div>
      )}

      {isNearHaveliTreasuryDoor && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▲</span> Walk north into the Grain Merchant Treasury (Press E)
        </div>
      )}

      {isNearTreasuryWellDoor && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>►</span> Walk east to the Village Stepwell (Press E)
        </div>
      )}

      {isNearStepwellSquareDoor && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>►</span> Walk east into the Central Village Square (Press E)
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

      {/* --- BUZURG CHACHA DIALOGUE & CHAUPAR MODALS (STAGE 1) --- */}
      {showChachaDialogue && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-3">
              <span className="text-sm font-extrabold text-amber-950 uppercase tracking-widest flex items-center gap-2">
                <span>👳</span> Buzurg Chacha
              </span>
              <button onClick={() => setShowChachaDialogue(false)} className="text-amber-900 hover:text-black font-bold text-sm bg-amber-200/60 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">
                ✕ Close
              </button>
            </div>
            <div className="text-amber-950 font-serif text-sm leading-relaxed">
              <p className="mb-3 font-semibold">&quot;Khamma Ghani, young traveller! Welcome to Chittorgarh. Challenge me to Chaupar!&quot;</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => { setShowChachaDialogue(false); setShowChauparGame(true); }} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-wider cursor-pointer">
                🎲 Play Chaupar Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- AUTHENTIC VISUAL CHAUPAR (PACHISI) GAME MODAL --- */}
      {showChauparGame && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-950 rounded-3xl p-5 shadow-[16px_16px_0_0_rgba(0,0,0,1)] max-w-xl w-full flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-200">
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
                  onClick={handleResetChauparMatch}
                  className="text-amber-900 hover:bg-amber-200 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-amber-800 cursor-pointer"
                  title="Reset score and pawns"
                >
                  🔄 Reset
                </button>
                <button
                  onClick={() => setShowChauparGame(false)}
                  className="text-amber-950 hover:bg-amber-200 font-bold text-xs px-3 py-1 rounded-lg border-2 border-amber-900 bg-amber-100 cursor-pointer shadow-sm"
                >
                  ✕ Exit Game
                </button>
              </div>
            </div>

            {/* Scoreboard Bar */}
            <div className="grid grid-cols-2 gap-3 bg-gradient-to-r from-amber-100 via-amber-200/70 to-amber-100 border-2 border-amber-900/70 p-2.5 rounded-xl text-center shadow-sm">
              <div className="flex items-center justify-between px-3 border-r-2 border-amber-800/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-600 via-amber-400 to-yellow-200 border-2 border-amber-950 flex items-center justify-center shadow-sm text-[10px] font-bold">
                    👑
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-amber-900 uppercase block">YOU (Gold Goti)</span>
                    <span className="text-[11px] font-bold text-amber-950">Track Step {playerPawnPos}/12</span>
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-950">{chauparScore.player}</div>
              </div>

              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-800 via-red-600 to-red-400 border-2 border-amber-950 flex items-center justify-center shadow-sm text-[10px] font-bold text-white">
                    👳
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-red-950 uppercase block">CHACHA (Ruby Goti)</span>
                    <span className="text-[11px] font-bold text-amber-950">Track Step {chachaPawnPos}/12</span>
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-950">{chauparScore.chacha}</div>
              </div>
            </div>

            {/* Visual Chaupar Cross Board (Google Nano Banana Clean Board Image & Exact Grid Pawn Positions) */}
            <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border-4 border-amber-950 shadow-2xl bg-[#1e0e07] flex items-center justify-center">
              {/* Google Nano Banana Clean 2D Orthogonal Chaupar Board Background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/chaupar-board.jpg"
                alt="Traditional Chaupar Board (Nano Banana)"
                className="w-full h-full object-contain p-1 opacity-95"
              />

              {/* Central Home (Charkoni) Highlight Ring */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-yellow-400/90 bg-yellow-500/25 backdrop-blur-[1px] animate-pulse flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.7)]">
                  <span className="text-[10px] font-serif font-black text-yellow-100 drop-shadow-md uppercase tracking-wider">HOME</span>
                </div>
              </div>

              {/* Player's Animated Golden Goti (Pawn) sitting precisely inside grid squares */}
              <div
                className={`absolute w-9 h-9 z-30 transition-all duration-700 ease-out transform -translate-x-1/2 -translate-y-1/2 ${
                  isPawnMoving ? "scale-125 -translate-y-3 shadow-[0_12px_24px_rgba(245,158,11,0.9)] animate-pulse" : "scale-100 shadow-md"
                }`}
                style={
                  playerPawnPos === 0
                    ? { left: "50%", top: "86%" }
                    : playerPawnPos === 1
                    ? { left: "50%", top: "78%" }
                    : playerPawnPos === 2
                    ? { left: "50%", top: "70%" }
                    : playerPawnPos === 3
                    ? { left: "50%", top: "62%" }
                    : playerPawnPos === 4
                    ? { left: "50%", top: "55%" }
                    : playerPawnPos === 5
                    ? { left: "50%", top: "48%" }
                    : playerPawnPos === 6
                    ? { left: "58%", top: "50%" }
                    : playerPawnPos === 7
                    ? { left: "66%", top: "50%" }
                    : playerPawnPos === 8
                    ? { left: "74%", top: "50%" }
                    : playerPawnPos === 9
                    ? { left: "82%", top: "50%" }
                    : playerPawnPos === 10
                    ? { left: "88%", top: "50%" }
                    : playerPawnPos === 11
                    ? { left: "94%", top: "50%" }
                    : { left: "50%", top: "50%" }
                }
              >
                <div className="relative w-full h-full rounded-t-full rounded-b-md bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-100 border-2 border-amber-950 shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-900 shadow-inner flex items-center justify-center text-[9px]">👑</div>
                </div>
              </div>

              {/* Chacha's Animated Ruby Goti (Pawn) sitting precisely inside grid squares */}
              <div
                className={`absolute w-9 h-9 z-30 transition-all duration-700 ease-out transform -translate-x-1/2 -translate-y-1/2 ${
                  isPawnMoving ? "scale-125 -translate-y-3 shadow-[0_12px_24px_rgba(239,68,68,0.9)] animate-pulse" : "scale-100 shadow-md"
                }`}
                style={
                  chachaPawnPos === 0
                    ? { left: "50%", top: "14%" }
                    : chachaPawnPos === 1
                    ? { left: "50%", top: "22%" }
                    : chachaPawnPos === 2
                    ? { left: "50%", top: "30%" }
                    : chachaPawnPos === 3
                    ? { left: "50%", top: "38%" }
                    : chachaPawnPos === 4
                    ? { left: "50%", top: "45%" }
                    : chachaPawnPos === 5
                    ? { left: "50%", top: "52%" }
                    : chachaPawnPos === 6
                    ? { left: "42%", top: "50%" }
                    : chachaPawnPos === 7
                    ? { left: "34%", top: "50%" }
                    : chachaPawnPos === 8
                    ? { left: "26%", top: "50%" }
                    : chachaPawnPos === 9
                    ? { left: "18%", top: "50%" }
                    : chachaPawnPos === 10
                    ? { left: "12%", top: "50%" }
                    : chachaPawnPos === 11
                    ? { left: "6%", top: "50%" }
                    : { left: "50%", top: "50%" }
                }
              >
                <div className="relative w-full h-full rounded-t-full rounded-b-md bg-gradient-to-tr from-red-950 via-red-600 to-red-400 border-2 border-amber-950 shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-200 border border-red-950 shadow-inner flex items-center justify-center text-[9px] text-white">👳</div>
                </div>
              </div>
            </div>

            {/* Long Wooden Dice (Pasa) Animation Section (Image 2 style) */}
            <div className="bg-amber-100/90 border-2 border-amber-900/60 p-2.5 rounded-xl flex flex-col items-center gap-2">
              <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider">
                LONG WOODEN PASA DICE (ROYAL RAJASTHANI DICE)
              </span>

              <div className="flex items-center justify-center gap-6">
                {/* Die 1 */}
                <div className={`relative w-28 h-10 bg-gradient-to-r from-[#d89e5a] via-[#f5d09b] to-[#c68c47] border-2 border-[#4a2e12] rounded-md shadow-md flex items-center justify-around px-3 transition-all duration-500 transform ${
                  isDiceRolling ? "rotate-45 scale-110 shadow-xl animate-bounce" : "rotate-0"
                }`}>
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#6e431a] rounded-l border-r border-[#4a2e12]"></div>
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#6e431a] rounded-r border-l border-[#4a2e12]"></div>
                  {Array.from({ length: diceRoll1 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-red-700 border border-red-950 rounded-full shadow-inner"></div>
                  ))}
                </div>

                {/* Die 2 */}
                <div className={`relative w-28 h-10 bg-gradient-to-r from-[#d89e5a] via-[#f5d09b] to-[#c68c47] border-2 border-[#4a2e12] rounded-md shadow-md flex items-center justify-around px-3 transition-all duration-500 transform ${
                  isDiceRolling ? "-rotate-45 scale-110 shadow-xl animate-bounce" : "rotate-0"
                }`}>
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#6e431a] rounded-l border-r border-[#4a2e12]"></div>
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#6e431a] rounded-r border-l border-[#4a2e12]"></div>
                  {Array.from({ length: diceRoll2 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-red-700 border border-red-950 rounded-full shadow-inner"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Message Box */}
            <div className="bg-amber-200/70 border border-amber-400 p-2.5 rounded-xl text-center text-xs font-serif font-bold text-amber-950 leading-relaxed shadow-inner">
              {chauparMessage}
            </div>

            {/* Roll Action Button */}
            <button
              onClick={handleRollDice}
              disabled={isDiceRolling || isPawnMoving}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-extrabold py-3 px-6 rounded-xl border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-widest cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>🎲</span>
              <span>{isDiceRolling ? "Rolling Wooden Pasa..." : isPawnMoving ? "Moving Goti..." : "Roll Pasa Dice"}</span>
            </button>
          </div>
        </div>
      )}

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
                💍 Clue 1: Bridal Wedding Ornament
              </span>
              <button onClick={() => setShowHaveliOrnamentModal(false)} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bg-kuldhara-chiefs-house.jpg" alt="Bridal Ornament" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                <span className="text-amber-200 font-serif font-bold text-xs">💍 Village Chief&apos;s Haveli Evidence</span>
                <span className="text-amber-400 text-[10px] uppercase font-mono">Forced Marriage Ultimatum</span>
              </div>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-serif bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded italic">
              &quot;Left behind in the village chief&apos;s haveli. Proves the forced marriage ultimatum by Prime Minister Salim Singh against the Paliwal daughter.&quot;
            </p>
            <button onClick={() => setShowHaveliOrnamentModal(false)} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
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
              <button onClick={() => setShowTaxLedgerModal(false)} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/clue-torn-tax-ledger.jpg" alt="Torn Tax Ledger" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                <span className="text-amber-200 font-serif font-bold text-xs">📜 Merchant Treasury Tax Ledger</span>
                <span className="text-amber-400 text-[10px] uppercase font-mono">Quadrupled Taxes &amp; Economic Extortion</span>
              </div>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-serif bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded italic">
              &quot;Found in the merchant treasury. Records quadrupled taxes and ruthless economic extortion imposed by Salim Singh upon Kuldhara&apos;s merchants.&quot;
            </p>
            <button onClick={() => setShowTaxLedgerModal(false)} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
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
              <button onClick={() => setShowStepwellModal(false)} className="text-amber-900 font-bold text-xs bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer">✕ Close</button>
            </div>
            <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bg-kuldhara-stepwell.jpg" alt="Stepwell Supplies" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                <span className="text-amber-200 font-serif font-bold text-xs">🏺 Kuldhara Stepwell Supplies</span>
                <span className="text-amber-400 text-[10px] uppercase font-mono">Coordinated Overnight Evacuation</span>
              </div>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-serif bg-amber-100/90 border-l-4 border-amber-600 p-2.5 rounded italic">
              &quot;Stacked neatly at the stepwell. Proves a secret, coordinated overnight evacuation in total unison across all 84 Paliwal Brahmin villages.&quot;
            </p>
            <button onClick={() => setShowStepwellModal(false)} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer self-end">
              Add to Journal
            </button>
          </div>
        </div>
      )}



      {/* Stage 3 Complete Modal (Offers journey into Stage 4 Bhangarh) */}
      {showStage3CompleteModal && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-950 rounded-2xl p-8 max-w-xl w-full shadow-[20px_20px_0_0_rgba(0,0,0,1)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-amber-500 text-white border-3 border-black rounded-full flex items-center justify-center text-3xl shadow-md mb-4">🏛️</div>
            <span className="text-xs font-mono font-bold text-amber-800 uppercase tracking-widest mb-1">STAGE 3 COMPLETED • MYSTERY SOLVED</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-amber-950 font-black tracking-wide uppercase mb-3">The Legend of Kuldhara: Preserved in Honor</h2>
            <div className="text-amber-950 font-serif text-xs sm:text-sm leading-relaxed text-left bg-amber-100/60 p-4 rounded-xl border border-amber-400 my-3">
              <p>When Prime Minister Salim Singh gave the village an ultimatum, all 84 Paliwal Brahmin settlements chose their dignity and evacuated in complete secrecy.</p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button onClick={() => setShowStage3CompleteModal(false)} className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 px-4 rounded-xl border-2 border-black text-xs uppercase">
                Explore Kuldhara
              </button>
              <button onClick={startBhangarhJourney} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-wider animate-bounce">
                Continue to Bhangarh Fort (Stage 4 - Final) →
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
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
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
              <button onClick={() => setShowGrandCampaignCompleteModal(false)} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 px-4 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer">
                Revisit Bhangarh Fort
              </button>
              <button onClick={() => router.push("/dashboard")} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-wider cursor-pointer">
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

      {/* --- STAGE 4 SHIELD UNLOCK & GAME COMPLETE MODAL --- */}
      {showShieldModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-6 shadow-[14px_14px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-4 border-amber-950 rounded-full flex items-center justify-center mx-auto text-4xl shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-bounce">
              🛡️
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-widest bg-amber-200/70 py-0.5 px-3 rounded-full border border-amber-400 self-center">
                ★ LEGENDARY ITEM UNLOCKED ★
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-amber-950 font-black tracking-wide uppercase">
                Royal Shield of Rajputana
              </h2>
            </div>
            <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-amber-900 shadow-md bg-gradient-to-b from-amber-950 via-amber-900 to-black flex flex-col items-center justify-center p-4">
              <div className="text-6xl drop-shadow-[0_4px_12px_rgba(255,215,0,0.8)] animate-pulse">🛡️</div>
              <div className="mt-2 text-amber-200 font-serif text-sm font-bold tracking-wider uppercase">ROYAL KAVACH OF BHANGARH</div>
              <div className="text-amber-400 text-[10px] uppercase tracking-widest font-sans mt-0.5 font-bold">Forged in Rajput Honor • Curse Lifted</div>
            </div>
            <div className="bg-amber-100/90 border-l-4 border-amber-600 p-3 rounded text-xs text-amber-950 leading-relaxed italic text-left font-serif">
              &quot;By gathering all 3 ancient artifact fragments within 2 minutes inside Bhangarh Fort, you have unlocked the legendary Royal Shield of Rajputana! You have broken the darkness and completed the entire game!&quot;
            </div>
            <button
              onClick={() => {
                setShowShieldModal(false);
                setIsCampaignComplete(true);
                setShowGrandCampaignCompleteModal(true);
                soundFx.playClueChime();
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-widest cursor-pointer transition-all active:translate-y-0.5"
            >
              🏆 Claim Shield & Complete Game
            </button>
          </div>
        </div>
      )}

      {/* --- BHANGARH 2-MIN CHALLENGE TIMEOUT MODAL --- */}
      {showBhangarhTimeOutModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-red-900 rounded-2xl p-6 shadow-[14px_14px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
              ⏳
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-black text-red-950 uppercase tracking-wide">2-Minute Time Expired!</h2>
              <p className="text-xs font-semibold text-red-800 uppercase tracking-widest">Bhangarh Challenge Failed</p>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3.5 text-xs text-red-950 leading-relaxed text-left font-serif">
              You failed to discover all 3 ancient artifact fragments within 2 minutes! The eerie night shadows overtake you. You have been returned to the entrance gate of Bhangarh Fort.
            </div>
            <button
              onClick={handleRestartBhangarhFort}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs uppercase tracking-widest cursor-pointer transition-all active:translate-y-0.5"
            >
              🔄 Try Again (Restart Bhangarh Fort)
            </button>
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
