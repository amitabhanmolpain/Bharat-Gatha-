"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";
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

interface PathWaypoint {
  x: number;
  y: number;
}

interface PathState {
  x: number;
  y: number;
  opacity: number;
  isInside: boolean;
  facingLeft: boolean;
  scale: number;
  filter: string;
}

function getPathPosition(
  waypoints: PathWaypoint[],
  walkDuration: number,
  pauseDuration: number,
  elapsedTime: number
): PathState {
  const totalCycle = walkDuration + pauseDuration;
  const cycleTime = elapsedTime % totalCycle;

  // If in pause duration (inside house/building):
  if (cycleTime >= walkDuration) {
    const last = waypoints[waypoints.length - 1];
    return {
      x: last.x,
      y: last.y,
      opacity: 0,
      isInside: true,
      facingLeft: false,
      scale: 0.75,
      filter: "brightness(0.5)",
    };
  }

  // Door entering transition in the last 1.2 seconds:
  const timeLeft = walkDuration - cycleTime;
  let scale = 1;
  let opacity = 1;
  let filter = "none";

  if (timeLeft < 1.2) {
    const t = 1 - timeLeft / 1.2; // 0 (start entering doorway) to 1 (fully inside)
    scale = 1 - t * 0.28; // smooth perspective shrink into the doorway
    filter = `brightness(${Math.max(0.4, 1 - t * 0.6)})`; // enters indoor shadow
    if (timeLeft < 0.4) {
      opacity = Math.max(0, timeLeft / 0.4); // cleanly vanishes into the interior
    }
  }

  // Compute total path distance
  const dists: number[] = [];
  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = Math.hypot(
      waypoints[i + 1].x - waypoints[i].x,
      waypoints[i + 1].y - waypoints[i].y
    );
    dists.push(d);
    totalDist += d;
  }

  const currentDist = (cycleTime / walkDuration) * totalDist;
  let acc = 0;
  for (let i = 0; i < dists.length; i++) {
    if (acc + dists[i] >= currentDist || i === dists.length - 1) {
      const segT = dists[i] > 0 ? (currentDist - acc) / dists[i] : 0;
      const x = waypoints[i].x + (waypoints[i + 1].x - waypoints[i].x) * segT;
      const y = waypoints[i].y + (waypoints[i + 1].y - waypoints[i].y) * segT;
      const dx = waypoints[i + 1].x - waypoints[i].x;
      // Facing left if moving towards negative x, facing right if moving towards positive x
      const facingLeft = dx < 0;
      return { x, y, opacity, isInside: false, facingLeft, scale, filter };
    }
    acc += dists[i];
  }

  const first = waypoints[0];
  return { x: first.x, y: first.y, opacity: 1, isInside: false, facingLeft: false, scale: 1, filter: "none" };
}

interface TwoWayPatrolState {
  x: number;
  y: number;
  isWalking: boolean;
  facingLeft: boolean;
}

function getTwoWayPatrolPosition(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
  walkDuration: number,
  stayDuration: number,
  elapsedTime: number
): TwoWayPatrolState {
  const halfCycle = walkDuration + stayDuration;
  const totalCycle = halfCycle * 2;
  const t = ((elapsedTime % totalCycle) + totalCycle) % totalCycle;

  if (t < walkDuration) {
    // Walking A -> B
    const prog = t / walkDuration;
    return {
      x: pointA.x + (pointB.x - pointA.x) * prog,
      y: pointA.y + (pointB.y - pointA.y) * prog,
      isWalking: true,
      facingLeft: pointB.x < pointA.x,
    };
  } else if (t < halfCycle) {
    // Paused at B for stayDuration (keep facing B direction)
    return {
      x: pointB.x,
      y: pointB.y,
      isWalking: false,
      facingLeft: pointB.x < pointA.x,
    };
  } else if (t < halfCycle + walkDuration) {
    // Walking back B -> A
    const prog = (t - halfCycle) / walkDuration;
    return {
      x: pointB.x + (pointA.x - pointB.x) * prog,
      y: pointB.y + (pointA.y - pointB.y) * prog,
      isWalking: true,
      facingLeft: pointA.x < pointB.x,
    };
  } else {
    // Paused at A for stayDuration (keep facing A direction)
    return {
      x: pointA.x,
      y: pointA.y,
      isWalking: false,
      facingLeft: pointA.x < pointB.x,
    };
  }
}

// Stage 1.5: Municipal Drain Inspector / Water Carrier Route (User's red line route)
// Walks full straight along the right avenue from bottom (74.0, 98.0) to top (88.5, 36.0),
// disappears at the end, stays disappeared for 6 seconds, then restarts from the start point.
function getRightAvenuePatrolState(elapsedTime: number) {
  const pointA = { x: 48.0, y: 90.0 }; // Start point: bottom of central drain walkway
  const pointB = { x: 48.0, y: 44.0 }; // End point: top of central drain walkway
  const walkDuration = 15.0; // Duration of straight walk up avenue
  const disappearDuration = 6.0; // Exactly 6 seconds disappeared before restarting
  const totalCycle = walkDuration + disappearDuration; // 21.0s total cycle
  const t = ((elapsedTime % totalCycle) + totalCycle) % totalCycle;

  let x: number;
  let y: number;
  let facingLeft: boolean = false;
  let isWalking: boolean;
  let opacity: number;
  let isInside: boolean = false;

  if (t < walkDuration) {
    // 1. Walking straight UP along the avenue (A -> B)
    const prog = t / walkDuration;
    x = pointA.x + (pointB.x - pointA.x) * prog;
    y = pointA.y + (pointB.y - pointA.y) * prog;
    facingLeft = false;
    isWalking = true;

    // Smooth fade-in at start point and fade-out as reaching top before disappearing
    if (t < 0.6) {
      opacity = Math.min(1, t / 0.6);
    } else if (t > walkDuration - 0.8) {
      opacity = Math.max(0, (walkDuration - t) / 0.8);
    } else {
      opacity = 1;
    }
  } else {
    // 2. Disappeared at the end for 6 seconds, waiting to restart from start point
    x = pointA.x;
    y = pointA.y;
    facingLeft = false;
    isWalking = false;
    opacity = 0;
    isInside = true; // Disable clicks/hover interactions while disappeared
  }

  // Perspective depth scaling along the avenue
  const scale = 0.65 + (y / 100) * 0.35;

  return {
    x,
    y,
    scale,
    facingLeft,
    isWalking,
    opacity,
    isInside,
    filter: "none",
  };
}

interface BoatPatrolState {
  x: number;
  y: number;
  scale: number;
  facingLeft: boolean;
  isSailing: boolean;
  rockingAngle: number;
  bobbingY: number;
}

function getBoatPatrolPosition(
  waypoints: { x: number; y: number }[],
  downstreamDuration: number,
  upstreamDuration: number,
  stayDuration: number,
  elapsedTime: number
): BoatPatrolState {
  const dists: number[] = [];
  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = Math.hypot(
      waypoints[i + 1].x - waypoints[i].x,
      waypoints[i + 1].y - waypoints[i].y
    );
    dists.push(d);
    totalDist += d;
  }

  const cycleTime = downstreamDuration + stayDuration + upstreamDuration + stayDuration;
  const t = ((elapsedTime % cycleTime) + cycleTime) % cycleTime;

  let x = waypoints[0].x;
  let y = waypoints[0].y;
  let facingLeft = false;
  let isSailing = false;

  if (t < downstreamDuration) {
    // Sailing downstream (with Indus current)
    isSailing = true;
    const currentDist = (t / downstreamDuration) * totalDist;
    let acc = 0;
    for (let i = 0; i < dists.length; i++) {
      if (acc + dists[i] >= currentDist || i === dists.length - 1) {
        const segT = dists[i] > 0 ? (currentDist - acc) / dists[i] : 0;
        x = waypoints[i].x + (waypoints[i + 1].x - waypoints[i].x) * segT;
        y = waypoints[i].y + (waypoints[i + 1].y - waypoints[i].y) * segT;
        facingLeft = waypoints[i + 1].x < waypoints[i].x;
        break;
      }
      acc += dists[i];
    }
  } else if (t < downstreamDuration + stayDuration) {
    // Paused at downstream delta
    const last = waypoints[waypoints.length - 1];
    x = last.x;
    y = last.y;
    facingLeft = true;
    isSailing = false;
  } else if (t < downstreamDuration + stayDuration + upstreamDuration) {
    // Sailing upstream (against Indus current)
    isSailing = true;
    const progress = (t - (downstreamDuration + stayDuration)) / upstreamDuration;
    const currentDist = (1 - progress) * totalDist;
    let acc = 0;
    for (let i = 0; i < dists.length; i++) {
      if (acc + dists[i] >= currentDist || i === dists.length - 1) {
        const segT = dists[i] > 0 ? (currentDist - acc) / dists[i] : 0;
        x = waypoints[i].x + (waypoints[i + 1].x - waypoints[i].x) * segT;
        y = waypoints[i].y + (waypoints[i + 1].y - waypoints[i].y) * segT;
        facingLeft = !(waypoints[i + 1].x < waypoints[i].x);
        break;
      }
      acc += dists[i];
    }
  } else {
    // Paused at upstream horizon
    x = waypoints[0].x;
    y = waypoints[0].y;
    facingLeft = false;
    isSailing = false;
  }

  // Perspective scale along the Indus river
  const scale = 0.46 + Math.max(0, Math.min(1.0, y / 100)) * 0.70;
  const bobbingY = Math.sin(elapsedTime * 2.8) * 3.5;
  const rockingAngle = Math.sin(elapsedTime * 1.8) * 2.2;

  return { x, y, scale, facingLeft, isSailing, rockingAngle, bobbingY };
}

// Stage 2: Great Bath Potter Gate-to-Gate Animation
// 1. Walks up left ramp, enters the FIRST GATE (left gate) and DISAPPEARS into the dark portal.
// 2. Then, EMERGES from the SECOND GATE (right gate) and walks down the right ramp.
// 3. Loops continuously with realistic timing.
// NEVER walks on walls, lintels, rooftops, or across the front wall. Strictly grounded on brick ramps.
function getGreatBathPotterState(elapsedTime: number) {
  // First Gate (left) waypoints:
  const p1Bottom = { x: 2.0, y: 101.5 };
  const p1Lower = { x: 7.5, y: 96.5 };
  const p1Mid = { x: 12.5, y: 91.5 };
  const p1Upper = { x: 16.5, y: 87.0 };
  const p1Door = { x: 19.8, y: 83.5 };
  const p1Inside = { x: 20.2, y: 81.5 };

  // Second Gate (right) waypoints:
  const p2Inside = { x: 80.0, y: 81.5 };
  const p2Door = { x: 80.5, y: 83.5 };
  const p2Upper = { x: 83.5, y: 87.0 };
  const p2Mid = { x: 87.5, y: 91.5 };
  const p2Lower = { x: 92.5, y: 96.5 };
  const p2Bottom = { x: 98.0, y: 101.5 };

  const loopPeriod = 19.0;
  const t = ((elapsedTime % loopPeriod) + loopPeriod) % loopPeriod;

  let x = p1Bottom.x;
  let y = p1Bottom.y;
  let opacity = 1.0;
  let facingLeft = false;

  if (t < 6.5) {
    // 1. Walking up left ramp towards the FIRST GATE
    const segT = t / 6.5;
    facingLeft = false;
    opacity = 1.0;
    if (segT < 0.20) {
      const u = segT / 0.20;
      x = p1Bottom.x + u * (p1Lower.x - p1Bottom.x);
      y = p1Bottom.y + u * (p1Lower.y - p1Bottom.y);
    } else if (segT < 0.50) {
      const u = (segT - 0.20) / 0.30;
      x = p1Lower.x + u * (p1Mid.x - p1Lower.x);
      y = p1Lower.y + u * (p1Mid.y - p1Lower.y);
    } else if (segT < 0.80) {
      const u = (segT - 0.50) / 0.30;
      x = p1Mid.x + u * (p1Upper.x - p1Mid.x);
      y = p1Mid.y + u * (p1Upper.y - p1Mid.y);
    } else {
      const u = (segT - 0.80) / 0.20;
      x = p1Upper.x + u * (p1Door.x - p1Upper.x);
      y = p1Upper.y + u * (p1Door.y - p1Upper.y);
    }
  } else if (t < 8.0) {
    // 2. ENTERS the first gate and DISAPPEARS into dark portal
    const segT = (t - 6.5) / 1.5;
    facingLeft = false;
    x = p1Door.x + segT * (p1Inside.x - p1Door.x);
    y = p1Door.y + segT * (p1Inside.y - p1Door.y);
    opacity = Math.max(0, 1.0 - segT * 1.5);
  } else if (t < 10.0) {
    // 3. Inside citadel passage / completely disappeared
    x = p1Inside.x;
    y = p1Inside.y;
    opacity = 0;
    facingLeft = false;
  } else if (t < 11.5) {
    // 4. EMERGES from the SECOND GATE doorway onto right ramp
    const segT = (t - 10.0) / 1.5;
    facingLeft = false;
    x = p2Inside.x + segT * (p2Door.x - p2Inside.x);
    y = p2Inside.y + segT * (p2Door.y - p2Inside.y);
    opacity = Math.min(1.0, segT * 1.5);
  } else if (t < 17.5) {
    // 5. Walking down right ramp away from the second gate
    const segT = (t - 11.5) / 6.0;
    facingLeft = false;
    opacity = 1.0;
    if (segT < 0.20) {
      const u = segT / 0.20;
      x = p2Door.x + u * (p2Upper.x - p2Door.x);
      y = p2Door.y + u * (p2Upper.y - p2Door.y);
    } else if (segT < 0.50) {
      const u = (segT - 0.20) / 0.30;
      x = p2Upper.x + u * (p2Mid.x - p2Upper.x);
      y = p2Upper.y + u * (p2Mid.y - p2Upper.y);
    } else if (segT < 0.80) {
      const u = (segT - 0.50) / 0.30;
      x = p2Mid.x + u * (p2Lower.x - p2Mid.x);
      y = p2Mid.y + u * (p2Lower.y - p2Mid.y);
    } else {
      const u = (segT - 0.80) / 0.20;
      x = p2Lower.x + u * (p2Bottom.x - p2Lower.x);
      y = p2Lower.y + u * (p2Bottom.y - p2Lower.y);
    }
  } else if (t < 18.5) {
    // 6. Fades out at the end of the road
    const segT = (t - 17.5) / 1.0;
    x = p2Bottom.x;
    y = p2Bottom.y;
    opacity = Math.max(0, 1.0 - segT);
    facingLeft = false;
  } else {
    // 7. Brief pause offscreen before restarting from the first gate
    x = p1Bottom.x;
    y = p1Bottom.y;
    opacity = 0;
    facingLeft = false;
  }

  // Perspective scaling (reduced by 10% per user request: "reduce the size of person by 10 % it is too big")
  const scale = (0.95 + (y / 100) * 0.38) * 0.90;
  return { x, y, opacity, facingLeft, scale };
}

function IndusValleyGameComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // HUD & Session Control States (Matching Image 2)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);

  // Core Progression State
  const [stage, setStage] = useState<IndusStage>(INITIAL_INDUS_STATE.stage);
  const urlScene = searchParams.get("scene") as IndusSceneType | null;
  const [scene, setScene] = useState<IndusSceneType>(urlScene || INITIAL_INDUS_STATE.scene);

  // Sync scene state to URL query parameter
  useEffect(() => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentParams.get("scene") !== scene) {
      currentParams.set("scene", scene);
      router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
    }
  }, [scene, pathname, router, searchParams]);
  const [playerPos, setPlayerPos] = useState(INITIAL_INDUS_STATE.playerPos);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoadingToHarappa, setIsLoadingToHarappa] = useState(false);
  const [harappaTravelProgress, setHarappaTravelProgress] = useState(0);
  const [travelDestinationName, setTravelDestinationName] = useState("HARAPPA");

  // Travel Audio for Harappa Journey Loading Screen (Bullock Cart sound effect)
  const bullockSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      bullockSoundRef.current = new Audio("/bullock_cart_travel.mp3");
      bullockSoundRef.current.volume = 0.75;
      bullockSoundRef.current.loop = true;
    }
  }, []);

  useEffect(() => {
    if (isLoadingToHarappa) {
      if (bullockSoundRef.current && !isSoundMuted) {
        bullockSoundRef.current.currentTime = 0;
        bullockSoundRef.current.play().catch(() => {});
      }
    } else {
      if (bullockSoundRef.current) {
        bullockSoundRef.current.pause();
        bullockSoundRef.current.currentTime = 0;
      }
    }
  }, [isLoadingToHarappa, isSoundMuted]);

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

  // Stage 1.55: Central Domestic Courtyard
  const [showCourtyardToiletModal, setShowCourtyardToiletModal] = useState(false);
  const [showCourtyardWellModal, setShowCourtyardWellModal] = useState(false);
  const [showCourtyardStaircaseModal, setShowCourtyardStaircaseModal] = useState(false);
  const [hasInspectedCourtyardToilet, setHasInspectedCourtyardToilet] = useState(false);
  const [lastCourtyardDoor, setLastCourtyardDoor] = useState<"left" | "right">("right");
  const [courtyardReturnScene, setCourtyardReturnScene] = useState<"residential_grid" | "great_bath_citadel">("residential_grid");

  // Stage 1.6: House Interior
  const [showInteriorStaircaseModal, setShowInteriorStaircaseModal] = useState(false);
  const [showInteriorCharpoyModal, setShowInteriorCharpoyModal] = useState(false);
  const [showInteriorBathModal, setShowInteriorBathModal] = useState(false);
  const [showInteriorQuernModal, setShowInteriorQuernModal] = useState(false);

  // Stage 1.7: The Great Granary
  const [showGranaryDuctsModal, setShowGranaryDuctsModal] = useState(false);
  const [showGranaryPlatformsModal, setShowGranaryPlatformsModal] = useState(false);
  const [hasInspectedGranaryDucts, setHasInspectedGranaryDucts] = useState(false);
  const [hasInspectedGranaryPlatforms, setHasInspectedGranaryPlatforms] = useState(false);

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

  // Stage 1.5: Animated walking Water Carriers (Image 1 & 2 routes with 4-frame walk cycle)
  const [carrierTime, setCarrierTime] = useState(0);
  const [carrierFrame, setCarrierFrame] = useState(1); // 1 to 4
  const [talkingArtisansFrame, setTalkingArtisansFrame] = useState<1 | 2>(1);
  const [rooftopFrame, setRooftopFrame] = useState<1 | 2>(1);
  const [boatRowFrame, setBoatRowFrame] = useState<1 | 2>(1);
  const [grainWorkerFrame, setGrainWorkerFrame] = useState<1 | 2 | 3>(1);
  const [batherFrame, setBatherFrame] = useState<1 | 2>(1);
  const [mournerFrame, setMournerFrame] = useState<1 | 2 | 3>(1);

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

  // Crying mourner 3-frame animation loop (changes frame every 450ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setMournerFrame((prev) => (prev % 3 === 0 ? 1 : ((prev + 1) as 1 | 2 | 3)));
    }, 450);
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
    setHasInspectedGranaryDucts(false);
    setHasInspectedGranaryPlatforms(false);
    setShowGranaryDuctsModal(false);
    setShowGranaryPlatformsModal(false);
    setShowCourtyardToiletModal(false);
    setShowCourtyardWellModal(false);
    setShowCourtyardStaircaseModal(false);
    setHasInspectedCourtyardToilet(false);
    setShowInteriorStaircaseModal(false);
    setShowInteriorCharpoyModal(false);
    setShowInteriorBathModal(false);
    setShowInteriorQuernModal(false);
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

  // Stage 1: Ancient Egyptian Sailor River Boat Route along the Indus River
  const egyptianBoatWaypoints = [
    { x: 6.5, y: 16.0 },
    { x: 5.0, y: 36.0 },
    { x: 4.8, y: 56.0 },
    { x: 5.8, y: 76.0 },
    { x: 3.2, y: 94.0 },
    { x: 1.0, y: 104.0 },
  ];
  const boatState = getBoatPatrolPosition(egyptianBoatWaypoints, 22.0, 26.0, 4.0, carrierTime);

  // Proximity to Egyptian Sailor boat along the riverbank
  const isNearEgyptianSailor =
    scene === "lower_town_gate" &&
    Math.hypot(playerPos.x - boatState.x, playerPos.y - boatState.y) <= 24.0;
  const isNearGranaryExit =
    scene === "lower_town_gate" &&
    hasFirstRelicChertWeight &&
    playerPos.x >= 67.0 &&
    playerPos.x <= 76.0 &&
    playerPos.y >= 32.0 &&
    playerPos.y <= 38.0;

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

  // Stage 1.5: Residential Grid -> Enter Courtyard Doorway (Image 4 doorway on avenue right side: x: ~80%, y: ~78%)
  const isNearHouseDoorway =
    scene === "residential_grid" &&
    playerPos.x >= 70.0 &&
    playerPos.x <= 88.0 &&
    playerPos.y >= 66.0 &&
    playerPos.y <= 86.0;

  // Stage 1.55: Central Domestic Courtyard -> Exit back to Street Grid (at bottom entrance)
  const isNearCourtyardExit =
    scene === "house_courtyard" &&
    playerPos.x >= 42.0 &&
    playerPos.x <= 58.0 &&
    playerPos.y >= 78.0;

  // Stage 1.55: Central Domestic Courtyard -> Outside Doorway of Latrine Room (Bottom-left room)
  const isNearCourtyardToiletDoor =
    scene === "house_courtyard" &&
    playerPos.x >= 32.0 &&
    playerPos.x <= 46.0 &&
    playerPos.y >= 52.0 &&
    playerPos.y <= 68.0;

  // Stage 1.55: Central Domestic Courtyard -> Inside Enclosed Latrine Room
  const isInsideCourtyardToilet =
    scene === "house_courtyard" &&
    playerPos.x <= 34.0 &&
    playerPos.y >= 54.0;

  // Stage 1.55: Central Domestic Courtyard -> Enclosed Harappan Brick Latrine Inspection Hotspot
  const isNearCourtyardToilet =
    scene === "house_courtyard" &&
    playerPos.x >= 14.0 &&
    playerPos.x <= 34.0 &&
    playerPos.y >= 54.0 &&
    playerPos.y <= 76.0;

  // Stage 1.55: Central Domestic Courtyard -> Doorway to Street Grid Exit (Right door - as requested)
  const isNearCourtyardRightExitDoor =
    scene === "house_courtyard" &&
    playerPos.x >= 54.0 &&
    playerPos.x <= 78.0 &&
    playerPos.y >= 38.0 &&
    playerPos.y <= 64.0;

  // Stage 1.55: Central Domestic Courtyard -> Doorway to Ground Floor Interior (Left door - Image 3)
  const isNearCourtyardLeftInteriorDoor =
    scene === "house_courtyard" &&
    playerPos.x >= 28.0 &&
    playerPos.x <= 44.0 &&
    playerPos.y >= 32.0 &&
    playerPos.y <= 52.0;

  const isNearCourtyardInteriorDoor = isNearCourtyardLeftInteriorDoor;

  // Stage 1.55: Central Domestic Courtyard -> Outside Doorway of Bath Room
  const isNearCourtyardBathDoor =
    scene === "house_courtyard" &&
    playerPos.x >= 52.0 &&
    playerPos.x <= 64.0 &&
    playerPos.y >= 70.0 &&
    playerPos.y <= 82.0;

  // Stage 1.55: Central Domestic Courtyard -> Inside Private Bath Room
  const isInsideCourtyardBath =
    scene === "house_courtyard" &&
    playerPos.x >= 64.0 &&
    playerPos.y >= 54.0;

  // Stage 1.55: Central Domestic Courtyard -> Private Bath Platform Inspection Hotspot
  const isNearCourtyardBath =
    scene === "house_courtyard" &&
    playerPos.x >= 64.0 &&
    playerPos.x <= 84.0 &&
    playerPos.y >= 54.0 &&
    playerPos.y <= 84.0;

  // Stage 1.55: Central Domestic Courtyard -> Household Brick Well with Pulley
  const isNearCourtyardWell =
    scene === "house_courtyard" &&
    playerPos.x >= 44.0 &&
    playerPos.x <= 58.0 &&
    playerPos.y >= 38.0 &&
    playerPos.y <= 54.0;

  // Stage 1.55: Central Domestic Courtyard -> Top of Brick Staircase (Climb to 2nd Floor)
  const isNearCourtyardToInterior =
    scene === "house_courtyard" &&
    playerPos.y <= 32.0 &&
    playerPos.x >= 44.0 &&
    playerPos.x <= 58.0;

  // Stage 1.55: Central Domestic Courtyard -> Brick Staircase Inspection (Lower steps)
  const isNearCourtyardStaircase =
    scene === "house_courtyard" &&
    playerPos.x >= 44.0 &&
    playerPos.x <= 58.0 &&
    playerPos.y >= 34.0 &&
    playerPos.y <= 44.0;

  // Stage 1.6: House Interior -> Exit to Central Courtyard (Doorway Image 4)
  const isNearHouseExit =
    scene === "house_interior" &&
    playerPos.y >= 78.0;

  // Stage 1.6: House Interior -> Brick Staircase to Upper Floor (middle back wall)
  const isNearInteriorStaircase =
    scene === "house_interior" &&
    playerPos.x >= 38.0 &&
    playerPos.x <= 58.0 &&
    playerPos.y >= 46.0 &&
    playerPos.y <= 62.0;

  // Stage 1.6: House Interior -> Traditional Woven Charpoy Bed (left room side)
  const isNearInteriorCharpoy =
    scene === "house_interior" &&
    playerPos.x >= 14.0 &&
    playerPos.x <= 36.0 &&
    playerPos.y >= 58.0 &&
    playerPos.y <= 78.0;

  // Stage 1.6: House Interior -> Saddle Quern & Storage Jars (right side)
  const isNearInteriorQuern =
    scene === "house_interior" &&
    playerPos.x >= 64.0 &&
    playerPos.x <= 82.0 &&
    playerPos.y >= 64.0 &&
    playerPos.y <= 80.0;

  // Stage 1.56: Residential Second Floor & Roof Terrace Proximity Flags
  const isNearSecondFloorExit =
    scene === "house_second_floor" &&
    playerPos.y >= 68.0 &&
    playerPos.x >= 36.0 &&
    playerPos.x <= 64.0;

  const isNearSecondFloorGallery =
    scene === "house_second_floor" &&
    playerPos.x >= 46.0 &&
    playerPos.x <= 86.0 &&
    playerPos.y >= 44.0 &&
    playerPos.y <= 66.0;

  const isNearSecondFloorCharpoy =
    scene === "house_second_floor" &&
    playerPos.x >= 14.0 &&
    playerPos.x <= 34.0 &&
    playerPos.y >= 40.0 &&
    playerPos.y <= 62.0;

  const isNearSecondFloorStorage =
    scene === "house_second_floor" &&
    playerPos.x >= 8.0 &&
    playerPos.x <= 30.0 &&
    playerPos.y >= 66.0 &&
    playerPos.y <= 86.0;

  // Stage 1.5: Residential Grid -> The Great Granary (Moving forward up avenue to top-right)
  const isNearResidentialGranaryForward =
    scene === "residential_grid" &&
    playerPos.x >= 68.0 &&
    playerPos.y <= 44.0;

  // Stage 1.5: Residential Grid -> Return to Ghat Gate or Toy Market Street (at bottom of avenue)
  const isNearResidentialGhatReturn =
    scene === "residential_grid" &&
    playerPos.y >= 74.0;

  // Stage 3: Harappan Cemetery Archway Gate (At top of central avenue)
  const isNearCemeteryGate =
    scene === "residential_grid" &&
    playerPos.x >= 44.0 &&
    playerPos.x <= 72.0 &&
    playerPos.y <= 34.0;

  // Stage 3: Harappan Cemetery R37 Exit -> Return to Residential Area
  const isNearCemeteryExit =
    scene === "harappa_cemetery" &&
    playerPos.y >= 80.0;

  // Stage 3: Cemetery R37 Grave Pottery Offerings Hotspot
  const isNearGravePottery =
    scene === "harappa_cemetery" &&
    playerPos.x >= 32.0 &&
    playerPos.x <= 48.0 &&
    playerPos.y >= 45.0 &&
    playerPos.y <= 68.0;

  // Stage 3: Cemetery R37 Excavated Rectangular Grave Hotspot (Open pit marked with black line: x: ~22%, y: ~56%)
  const isNearExcavatedGrave =
    scene === "harappa_cemetery" &&
    playerPos.x >= 12.0 &&
    playerPos.x <= 34.0 &&
    playerPos.y >= 45.0 &&
    playerPos.y <= 68.0;

  // Stage 3: Solemn Harappan Elder / Funeral Observer Hotspot
  const isNearSolemnElder =
    scene === "harappa_cemetery" &&
    playerPos.x >= 65.0 &&
    playerPos.y >= 45.0 &&
    playerPos.y <= 75.0;

  // Stage 3: Cemetery R37 Upper Passage to Citadel Sanctuary (Top horizon archway)
  const isNearCitadelPassage =
    scene === "harappa_cemetery" &&
    playerPos.x >= 44.0 &&
    playerPos.x <= 72.0 &&
    playerPos.y <= 34.0;

  // Stage 3: Empty Burial Slot Hotspot
  const isNearEmptyBurialPlot =
    scene === "harappa_cemetery" &&
    playerPos.x >= 15.0 &&
    playerPos.x <= 35.0 &&
    playerPos.y >= 45.0 &&
    playerPos.y <= 68.0;

  // Stage 1.7: The Great Granary -> Return to Residential Grid (at bottom-left x: 22%, y: 82%)
  const isNearGranaryGridReturn =
    scene === "granary_avenue" &&
    playerPos.x <= 32.0 &&
    playerPos.y >= 72.0;

  // Stage 1.7: The Great Granary -> Citadel & Great Bath Ascent (at ramp top-right x: 76%, y: 50%)
  const isNearGranaryCitadelAscent =
    scene === "granary_avenue" &&
    playerPos.x >= 68.0 &&
    playerPos.y <= 56.0;

  // Stage 1.7: Raised Brick Air Ducts (Subterranean ventilation)
  const isNearGranaryAirDucts =
    scene === "granary_avenue" &&
    playerPos.x >= 38.0 &&
    playerPos.x <= 54.0 &&
    playerPos.y >= 62.0 &&
    playerPos.y <= 76.0;

  // Stage 1.7: Elevated Loading Platforms & Grain Reserves
  const isNearGranaryPlatforms =
    scene === "granary_avenue" &&
    playerPos.x >= 56.0 &&
    playerPos.x <= 70.0 &&
    playerPos.y >= 58.0 &&
    playerPos.y <= 74.0;

  // Stage 1.7: Granary Worker / Sack Carrier
  const isNearGranaryWorker =
    scene === "granary_avenue" &&
    playerPos.x >= 28.0 &&
    playerPos.x <= 40.0 &&
    playerPos.y >= 54.0 &&
    playerPos.y <= 68.0;

  // Stage 1.7: Granary Metrology Scribe
  const isNearGranaryScribe =
    scene === "granary_avenue" &&
    playerPos.x >= 70.0 &&
    playerPos.x <= 82.0 &&
    playerPos.y >= 60.0 &&
    playerPos.y <= 76.0;

  // Stage 1.7: Granary Bullock Cart Grain Unloader in Right Dirt Yard (Worker at cart at x: 89.0%, y: 79.0%)
  const isNearGrainCartWorker =
    scene === "granary_avenue" &&
    playerPos.x >= 82.0 &&
    playerPos.x <= 96.0 &&
    playerPos.y >= 72.0 &&
    playerPos.y <= 86.0;

  // Stage 1.7: Harappan Merchants Conversing in Dirt Yard in front of ladder (x: 70.5%, y: 84.0%)
  const isNearGranaryArtisans =
    scene === "granary_avenue" &&
    playerPos.x >= 65.0 &&
    playerPos.x <= 76.0 &&
    playerPos.y >= 78.0 &&
    playerPos.y <= 90.0;

  // Stage 2 -> Return to The Great Granary (specifically at bottom central archway, never blocking the passage)
  const isNearGreatBathGranaryReturn =
    scene === "great_bath_citadel" &&
    playerPos.y >= 88.0 &&
    playerPos.x >= 42.0 &&
    playerPos.x <= 58.0;

  // Stage 2: Great Bath Citadel -> Upper Gate Doorway to The Caravan Road of the Harappan (press E to go to Harappan location)
  const isNearGreatBathHarappanGate =
    scene === "great_bath_citadel" &&
    playerPos.x >= 60.0 &&
    playerPos.x <= 76.0 &&
    playerPos.y >= 26.0 &&
    playerPos.y <= 38.0;

  // Caravan Road: Single Bullock Cart Hotspot (Post-noon Harappa Road)
  const isNearCaravanCart =
    scene === "caravan_road" &&
    playerPos.x >= 32.0 &&
    playerPos.x <= 58.0 &&
    playerPos.y >= 54.0 &&
    playerPos.y <= 78.0;

  // Caravan Road: Enter Harappa City Gates (Forward passage to Stage 3)
  const isNearCaravanRoadHarappaGate =
    scene === "caravan_road" &&
    playerPos.x >= 76.0 &&
    playerPos.y <= 34.0;

  // Caravan Road: Southbound return to The Great Bath / Mohenjo-daro
  const isNearCaravanRoadReturn =
    scene === "caravan_road" &&
    playerPos.y >= 86.0;

  // Stage 2: Great Bath Potter walking along Image 2 red area route (from left end, through gateway/passage, to right end and exiting)
  const greatBathPotterState = getGreatBathPotterState(carrierTime);
  const isNearGreatBathPotter =
    scene === "great_bath_citadel" &&
    greatBathPotterState.opacity > 0.25 &&
    Math.hypot(playerPos.x - greatBathPotterState.x, playerPos.y - greatBathPotterState.y) <= 8.5;


  // Person 1: Foreground Rooftop Lookout (Grounded on left flat terrace floor)
  const roof1PointA = { x: 14.0, y: 34.0 };
  const roof1PointB = { x: 22.0, y: 34.0 };
  const roof1State = getTwoWayPatrolPosition(roof1PointA, roof1PointB, 5.0, 6.0, carrierTime);

  // Person 2: Upper Balustrade Resident (Grounded on upper house roof terrace)
  const roof2PointA = { x: 26.0, y: 26.0 };
  const roof2PointB = { x: 32.0, y: 26.0 };
  const roof2State = getTwoWayPatrolPosition(roof2PointA, roof2PointB, 5.5, 6.0, carrierTime + 2.5);

  // Stage 1.5: Rooftop Resident (Upper terrace patrol)
  const isNearRooftopCitizen =
    scene === "residential_grid" &&
    Math.hypot(playerPos.x - roof2State.x, playerPos.y - roof2State.y) <= 12.0;

  // Stage 1.5: Foreground Rooftop Lookout (Foreground terrace patrol)
  const isNearRooftopLookout =
    scene === "residential_grid" &&
    Math.hypot(playerPos.x - roof1State.x, playerPos.y - roof1State.y) <= 12.0;

  // Water Carrier / Potter Route (Grounded on solid central brick avenue street, walking straight)
  const guy1Waypoints = [
    { x: 58.0, y: 90.0 },
    { x: 58.0, y: 76.0 },
    { x: 58.0, y: 62.0 },
    { x: 58.0, y: 44.0 },
  ];
  const guy1State = getPathPosition(guy1Waypoints, 17.5, 4.0, carrierTime);

  // Stage 1.5: 2 Citizens Standing & Talking in Front Right Street
  const isNearTalkingCitizens =
    scene === "residential_grid" &&
    Math.hypot(playerPos.x - 82.0, playerPos.y - 84.0) <= 12.0;

  // Right Lane Water Carrier Route (Straight along user's red line between bottom of avenue and cargo inspector)
  const guy2State = getRightAvenuePatrolState(carrierTime);

  const isNearResidentialWaterCarrier1 =
    scene === "residential_grid" &&
    guy1State.opacity > 0.25 &&
    Math.hypot(playerPos.x - guy1State.x, playerPos.y - guy1State.y) <= 10.0;

  const isNearResidentialWaterCarrier2 =
    scene === "residential_grid" &&
    guy2State.opacity > 0.25 &&
    Math.hypot(playerPos.x - guy2State.x, playerPos.y - guy2State.y) <= 10.0;

  // Stage 1.7: Animated Granary Porters (Lifting grain sacks, walking on solid land/ramps, keeping sacks, and walking back empty)
  const grainCarrierWalkFrame = ((carrierFrame - 1) % 3) + 1;

  // Worker 1: 4-point path following user's red marked route into Platform 2 sunken sand/grain bay (clear of all pots):
  // P0: Hall floor in front of reserve (34.0, 36.5)
  // P1: Wooden plank bridge head (44.0, 37.0)
  // P2: Entering sunken sand bay walkway (56.0, 38.0)
  // P3: Platform 2 sunken sand bay deposit point (68.0, 39.5)
  const getW1InterpolatedPos = (normT: number) => {
    if (normT <= 0.35) {
      const segT = normT / 0.35;
      return {
        x: 34.0 + segT * (44.0 - 34.0),
        y: 36.5 + segT * (37.0 - 36.5),
      };
    } else if (normT <= 0.65) {
      const segT = (normT - 0.35) / 0.30;
      return {
        x: 44.0 + segT * (56.0 - 44.0),
        y: 37.0 + segT * (38.0 - 37.0),
      };
    } else {
      const segT = (normT - 0.65) / 0.35;
      return {
        x: 56.0 + segT * (68.0 - 56.0),
        y: 38.0 + segT * (39.5 - 38.0),
      };
    }
  };

  const w1Cycle = carrierTime % 16;
  let w1Pos = { x: 34.0, y: 36.5 };
  let w1FacingLeft = false;
  let w1Carrying = true;

  if (w1Cycle < 1.5) {
    // Lifting/picking up grain sack at Point A
    w1Pos = { x: 34.0, y: 36.5 };
    w1FacingLeft = false;
    w1Carrying = true;
  } else if (w1Cycle < 7.0) {
    // Walking carrying sack Point A -> Bridge -> Platform 2 sunken sand bay
    const t = (w1Cycle - 1.5) / 5.5;
    w1FacingLeft = false;
    w1Carrying = true;
    w1Pos = getW1InterpolatedPos(t);
  } else if (w1Cycle < 8.5) {
    // Keeping/depositing grain sack at Platform 2 sunken sand bay
    w1Pos = { x: 68.0, y: 39.5 };
    w1FacingLeft = false;
    w1Carrying = false;
  } else if (w1Cycle < 14.0) {
    // Walking back empty-handed Platform 2 sunken sand bay -> Bridge -> Point A
    const t = (w1Cycle - 8.5) / 5.5;
    w1FacingLeft = true;
    w1Carrying = false;
    w1Pos = getW1InterpolatedPos(1.0 - t);
  } else {
    // Resetting at Point A to start next sack
    w1Pos = { x: 34.0, y: 36.5 };
    w1FacingLeft = false;
    w1Carrying = false;
  }

  const showDepositedSack1 = w1Cycle >= 7.0 && w1Cycle <= 15.5;

  const granaryWorker1Pos = {
    x: w1Pos.x,
    y: w1Pos.y,
    facingLeft: w1FacingLeft,
    isCarrying: w1Carrying,
  };

  // Worker 2: Ground Porter in Lower Dirt Yard (Fix: stays strictly grounded on dirt road, never flies onto arch wall, never goes past cart):
  // Point A (Cart front/shafts where sacks are unloaded: 53.5%, 96.5%) <-> Point B (Open dirt ground staging: 38.0%, 97.5%)
  // Total cycle: 14s, staggered by 5s
  const w2Cycle = (carrierTime + 5) % 14;
  let w2Pos = { x: 53.5, y: 96.5 };
  let w2FacingLeft = true;
  let w2Carrying = true;

  if (w2Cycle < 1.5) {
    // Lifting/picking up grain sack at cart front Point A
    w2Pos = { x: 53.5, y: 96.5 };
    w2FacingLeft = true;
    w2Carrying = true;
  } else if (w2Cycle < 6.5) {
    // Walking carrying sack across open dirt ground towards Point B (maintaining ground physics, y >= 96.5)
    const t = (w2Cycle - 1.5) / 5.0;
    w2FacingLeft = true;
    w2Carrying = true;
    w2Pos = {
      x: 53.5 - t * (53.5 - 38.0),
      y: 96.5 + t * (97.5 - 96.5),
    };
  } else if (w2Cycle < 8.0) {
    // Keeping/depositing grain sack on open dirt ground at Point B
    w2Pos = { x: 38.0, y: 97.5 };
    w2FacingLeft = true;
    w2Carrying = false;
  } else if (w2Cycle < 13.0) {
    // Walking back empty-handed across open dirt ground from Point B to cart Point A
    const t = (w2Cycle - 8.0) / 5.0;
    w2FacingLeft = false;
    w2Carrying = false;
    w2Pos = {
      x: 38.0 + t * (53.5 - 38.0),
      y: 97.5 - t * (97.5 - 96.5),
    };
  } else {
    // Resetting at cart front Point A to start next sack
    w2Pos = { x: 53.5, y: 96.5 };
    w2FacingLeft = true;
    w2Carrying = false;
  }

  const showDepositedSack2 = w2Cycle >= 6.5 && w2Cycle <= 13.5;

  const granaryWorker2Pos = {
    x: w2Pos.x,
    y: w2Pos.y,
    facingLeft: w2FacingLeft,
    isCarrying: w2Carrying,
  };



  // Worker 3: Back Colonnade Hall (Walking towards left side/westward as in Image 3):
  // Point A (56.0%, 30.0%) -> Point B (43.0%, 31.5%)
  const w3Cycle = (carrierTime + 2) % 15;
  let w3Pos = { x: 56.0, y: 30.0 };
  let w3FacingLeft = true;
  let w3Carrying = true;
  if (w3Cycle < 1.5) {
    w3Pos = { x: 56.0, y: 30.0 };
    w3FacingLeft = true;
    w3Carrying = true;
  } else if (w3Cycle < 6.5) {
    const t = (w3Cycle - 1.5) / 5.0;
    w3FacingLeft = true;
    w3Carrying = true;
    w3Pos = {
      x: 56.0 - t * (56.0 - 43.0),
      y: 30.0 + t * (31.5 - 30.0),
    };
  } else if (w3Cycle < 8.0) {
    w3Pos = { x: 43.0, y: 31.5 };
    w3FacingLeft = true;
    w3Carrying = false;
  } else if (w3Cycle < 13.0) {
    const t = (w3Cycle - 8.0) / 5.0;
    w3FacingLeft = false;
    w3Carrying = false;
    w3Pos = {
      x: 43.0 + t * (56.0 - 43.0),
      y: 31.5 - t * (31.5 - 30.0),
    };
  } else {
    w3Pos = { x: 56.0, y: 30.0 };
    w3FacingLeft = true;
    w3Carrying = false;
  }
  const showDepositedSack3 = w3Cycle >= 6.5 && w3Cycle <= 13.5;
  const granaryWorker3Pos = { x: w3Pos.x, y: w3Pos.y, facingLeft: w3FacingLeft, isCarrying: w3Carrying };

  // Worker 4: Upper Roof Flat Sand Terrace (Image 2 fix: grounded strictly on yellow sand floor, never on front brick railing):
  // Point A (Flat sand floor beside basket/jars: 67.0%, 32.2%) <-> Point B (Flat sand floor deposit area: 79.5%, 32.6%)
  const w4Cycle = (carrierTime + 6) % 14;
  let w4Pos = { x: 67.0, y: 32.2 };
  let w4FacingLeft = false;
  let w4Carrying = true;
  if (w4Cycle < 1.5) {
    // Picking up sack at Point A
    w4Pos = { x: 67.0, y: 32.2 };
    w4FacingLeft = false;
    w4Carrying = true;
  } else if (w4Cycle < 6.5) {
    // Walking carrying sack across flat sand floor towards Point B
    const t = (w4Cycle - 1.5) / 5.0;
    w4FacingLeft = false;
    w4Carrying = true;
    w4Pos = {
      x: 67.0 + t * (79.5 - 67.0),
      y: 32.2 + t * (32.6 - 32.2),
    };
  } else if (w4Cycle < 8.0) {
    // Depositing sack on sand floor at Point B
    w4Pos = { x: 79.5, y: 32.6 };
    w4FacingLeft = false;
    w4Carrying = false;
  } else if (w4Cycle < 13.0) {
    // Walking empty-handed back to Point A
    const t = (w4Cycle - 8.0) / 5.0;
    w4FacingLeft = true;
    w4Carrying = false;
    w4Pos = {
      x: 79.5 - t * (79.5 - 67.0),
      y: 32.6 - t * (32.6 - 32.2),
    };
  } else {
    // Resetting at Point A
    w4Pos = { x: 67.0, y: 32.2 };
    w4FacingLeft = false;
    w4Carrying = false;
  }
  const showDepositedSack4 = w4Cycle >= 6.5 && w4Cycle <= 13.5;
  const granaryWorker4Pos = { x: w4Pos.x, y: w4Pos.y, facingLeft: w4FacingLeft, isCarrying: w4Carrying };

  // Worker 6: Central Hall Aisle (Walking from back to front along the open dirt floor as in Image 4):
  // Point A (Back: 29.0%, 42.0%) -> Point B (Front: 40.0%, 48.5%)
  const w6Cycle = (carrierTime + 8) % 14;
  let w6Pos = { x: 29.0, y: 42.0 };
  let w6FacingLeft = false;
  let w6Carrying = true;
  if (w6Cycle < 1.5) {
    w6Pos = { x: 29.0, y: 42.0 };
    w6FacingLeft = false;
    w6Carrying = true;
  } else if (w6Cycle < 6.5) {
    const t = (w6Cycle - 1.5) / 5.0;
    w6FacingLeft = false;
    w6Carrying = true;
    w6Pos = {
      x: 29.0 + t * (40.0 - 29.0),
      y: 42.0 + t * (48.5 - 42.0),
    };
  } else if (w6Cycle < 8.0) {
    w6Pos = { x: 40.0, y: 48.5 };
    w6FacingLeft = false;
    w6Carrying = false;
  } else if (w6Cycle < 13.0) {
    const t = (w6Cycle - 8.0) / 5.0;
    w6FacingLeft = true;
    w6Carrying = false;
    w6Pos = {
      x: 40.0 - t * (40.0 - 29.0),
      y: 48.5 - t * (48.5 - 42.0),
    };
  } else {
    w6Pos = { x: 29.0, y: 42.0 };
    w6FacingLeft = false;
    w6Carrying = false;
  }
  const showDepositedSack6 = w6Cycle >= 6.5 && w6Cycle <= 13.5;
  const granaryWorker6Pos = { x: w6Pos.x, y: w6Pos.y, facingLeft: w6FacingLeft, isCarrying: w6Carrying };

  // Ground Porter 1: Unloading from Cart 1 to Ramp Staging
  // Point A (82.0%, 72.0%) -> Point B (86.0%, 76.0%)
  const gp1Cycle = (carrierTime + 3) % 12;
  let gp1Pos = { x: 82.0, y: 72.0 };
  let gp1FacingLeft = false;
  let gp1Carrying = true;
  if (gp1Cycle < 1.5) {
    gp1Pos = { x: 82.0, y: 72.0 };
    gp1FacingLeft = false;
    gp1Carrying = true;
  } else if (gp1Cycle < 5.5) {
    const t = (gp1Cycle - 1.5) / 4.0;
    gp1FacingLeft = false;
    gp1Carrying = true;
    gp1Pos = {
      x: 82.0 + t * (86.0 - 82.0),
      y: 72.0 + t * (76.0 - 72.0),
    };
  } else if (gp1Cycle < 7.0) {
    gp1Pos = { x: 86.0, y: 76.0 };
    gp1FacingLeft = false;
    gp1Carrying = false;
  } else if (gp1Cycle < 11.0) {
    const t = (gp1Cycle - 7.0) / 4.0;
    gp1FacingLeft = true;
    gp1Carrying = false;
    gp1Pos = {
      x: 86.0 - t * (86.0 - 82.0),
      y: 76.0 - t * (76.0 - 72.0),
    };
  } else {
    gp1Pos = { x: 82.0, y: 72.0 };
    gp1FacingLeft = false;
    gp1Carrying = false;
  }
  const showGroundSack1 = gp1Cycle >= 5.5 && gp1Cycle <= 11.5;
  const groundWorker1Pos = { x: gp1Pos.x, y: gp1Pos.y, facingLeft: gp1FacingLeft, isCarrying: gp1Carrying };

  const isNearAnyGranaryWorker =
    scene === "granary_avenue" &&
    (Math.hypot(playerPos.x - granaryWorker1Pos.x, playerPos.y - granaryWorker1Pos.y) <= 8.0 ||
     Math.hypot(playerPos.x - granaryWorker2Pos.x, playerPos.y - granaryWorker2Pos.y) <= 8.0 ||
     Math.hypot(playerPos.x - granaryWorker3Pos.x, playerPos.y - granaryWorker3Pos.y) <= 8.0 ||
     Math.hypot(playerPos.x - granaryWorker4Pos.x, playerPos.y - granaryWorker4Pos.y) <= 8.0 ||
     Math.hypot(playerPos.x - granaryWorker6Pos.x, playerPos.y - granaryWorker6Pos.y) <= 8.0 ||
     Math.hypot(playerPos.x - groundWorker1Pos.x, playerPos.y - groundWorker1Pos.y) <= 8.0);

  const isNearAnyGrainCart =
    scene === "granary_avenue" &&
    ((playerPos.x >= 76.0 && playerPos.x <= 87.0 && playerPos.y >= 66.0 && playerPos.y <= 77.0) ||
     (playerPos.x >= 83.0 && playerPos.x <= 95.0 && playerPos.y >= 73.0 && playerPos.y <= 85.0) ||
     (playerPos.x >= 51.0 && playerPos.x <= 63.0 && playerPos.y >= 89.0 && playerPos.y <= 99.0));

  // Stage 1.5: Road Pedestrian / Water Carrier (Walking along left paved avenue)
  const isNearRoadPedestrian =
    scene === "residential_grid" &&
    !guy1State.isInside &&
    Math.hypot(playerPos.x - guy1State.x, playerPos.y - guy1State.y) <= 8.5;

  // Stage 1.5: Marked Spot 1 - Cargo Inspector (at x: 87.5%, y: 43.5%)
  const isNearCargoInspector =
    scene === "residential_grid" &&
    playerPos.x >= 78.0 &&
    playerPos.x <= 96.0 &&
    playerPos.y >= 36.0 &&
    playerPos.y <= 52.0;

  // Stage 1.5: Marked Spot 2 - Municipal Drain Inspector (Walking along right paved avenue)
  const isNearDrainInspector =
    scene === "residential_grid" &&
    !guy2State.isInside &&
    Math.hypot(playerPos.x - guy2State.x, playerPos.y - guy2State.y) <= 8.5;

  // Stage 1.5: Marked Spot 3 & 4 - Harappan Artisans Conversing (Courtyard at x: 87.5%, y: 93.5%)
  const isNearArtisans =
    scene === "residential_grid" &&
    playerPos.x >= 76.0 &&
    playerPos.x <= 98.0 &&
    playerPos.y >= 78.0 &&
    playerPos.y <= 99.0;
  const isNearCottonWeaver = isNearArtisans;
  const isNearMasterPotter = isNearArtisans;

  // Stage 1.5: Courtyard Resident (Grounded inside courtyard stone floor at x: 31%, y: 61.8%)
  const isNearCourtyardResident =
    scene === "residential_grid" &&
    playerPos.x >= 24.0 &&
    playerPos.x <= 38.0 &&
    playerPos.y >= 54.0 &&
    playerPos.y <= 68.0;

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

  // Stage 3: Harappan Terracotta Toy Workshop Counter & Stalls (Foreground Left)
  const isNearSealBench =
    scene === "steatite_seal_workshop" &&
    playerPos.x <= 36.0 &&
    playerPos.y >= 58.0;

  // Stage 3: Harappa Toy Street Way to Go Back to Caravan Road (Upper Left Archway)
  const isNearHarappaExitArchway =
    scene === "steatite_seal_workshop" &&
    playerPos.x <= 25.0 &&
    playerPos.y <= 45.0;

  // Stage 3 -> Stage 4 Citadel stairs (Upper Right Avenue)
  const isNearCitadelStairs =
    scene === "steatite_seal_workshop" &&
    playerPos.x >= 78.0 &&
    playerPos.y <= 38.0;

  // Stage 3: Harappa Toy Street Way to enter the Toy Workshop Interior
  const isNearWorkshopEntrance =
    scene === "steatite_seal_workshop" &&
    playerPos.x >= 36.0 &&
    playerPos.x <= 48.0 &&
    playerPos.y >= 40.0 &&
    playerPos.y <= 56.0;

  // Stage 3: Harappa Toy Street Entrance to Residential Area
  const isNearResidentialAreaEntrance =
    scene === "steatite_seal_workshop" &&
    playerPos.x >= 54.0 &&
    playerPos.x <= 74.0 &&
    playerPos.y >= 38.0 &&
    playerPos.y <= 62.0;



  // Stage 4: Priest-King
  const isNearPriestKing =
    scene === "priest_king_citadel" &&
    playerPos.x >= 40.0 &&
    playerPos.x <= 62.0 &&
    playerPos.y >= 52.0 &&
    playerPos.y <= 72.0;

  // Stage 4: Workshop Interior Way to Go Back to Toy Street
  const isNearWorkshopExit =
    scene === "priest_king_citadel" &&
    playerPos.y >= 85.0;

  // Stage 3 -> Carnelian Bead Quarter
  const isNearBeadQuarterEntrance =
    scene === "steatite_seal_workshop" &&
    playerPos.x >= 85.0 &&
    playerPos.y >= 45.0;

  const isNearBeadQuarterExit =
    scene === "carnelian_bead_quarter" &&
    playerPos.x <= 25.0;

  // Stage 2 -> Drainage Culvert
  const isNearDrainageEntrance =
    scene === "great_bath_citadel" &&
    playerPos.x >= 35.0 &&
    playerPos.x <= 65.0 &&
    playerPos.y >= 40.0 &&
    playerPos.y <= 55.0;

  const isNearDrainageExit =
    scene === "drainage_culvert" &&
    playerPos.y >= 80.0;

  // Carnelian Bead Quarter -> Closing Reflection
  const isNearSunsetReflection =
    scene === "carnelian_bead_quarter" &&
    playerPos.x >= 85.0;

  const isNearSunsetExit =
    scene === "closing_reflection" &&
    playerPos.y >= 80.0;



  // 5. Scene Transitions (Normal fast transition for internal rooms and avenues, 600ms)
  const triggerTransition = (
    nextScene: IndusSceneType,
    nextPos: { x: number; y: number },
    nextStage?: IndusStage,
    durationMs: number = 600
  ) => {
    setIsTransitioning(true);
    soundFx.playSelect();
    setTimeout(() => {
      setScene(nextScene);
      setPlayerPos(nextPos);
      if (nextStage) setStage(nextStage);
      setIsTransitioning(false);
    }, durationMs);
  };

  // Dedicated 8-Second Bullock Cart Journey from Mohenjo-daro to Harappa with Animated Progress
  const startLongTravelTransition = (
    targetScene: IndusSceneType,
    targetPos: { x: number; y: number },
    targetStage: IndusStage,
    destinationName: string
  ) => {
    setIsLoadingToHarappa(true);
    setHarappaTravelProgress(0);
    setTravelDestinationName(destinationName);
    soundFx.playSelect();
    const duration = 8000;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / duration) * 100), 100);
      setHarappaTravelProgress(progress);
      if (elapsed >= duration) {
        clearInterval(timer);
        setScene(targetScene);
        setPlayerPos(targetPos);
        setStage(targetStage);
        setIsLoadingToHarappa(false);
      }
    }, 50);
  };

  // 5.5. Animated Entities Engine (Water carriers, rooftop citizens, Egyptian boat, granary unloader & talking artisans)
  useEffect(() => {
    if (
      scene !== "residential_grid" &&
      scene !== "lower_town_gate" &&
      scene !== "granary_avenue" &&
      scene !== "great_bath_citadel"
    )
      return;

    // Cycle walk animation frames (1 -> 2 -> 3 -> 4 for carriers and potter, 1 -> 2 for rooftop)
    const frameInterval = setInterval(() => {
      setCarrierFrame((prev) => (prev % 4) + 1);
      setRooftopFrame((prev) => (prev === 1 ? 2 : 1));
    }, 200);

    // Cycle bather animation frames in Great Bath (1 -> 2)
    const batherInterval = setInterval(() => {
      setBatherFrame((prev) => (prev === 1 ? 2 : 1));
    }, 1200);

    // Cycle rowing stroke animation frames for Egyptian sailor (1 -> 2)
    const boatInterval = setInterval(() => {
      setBoatRowFrame((prev) => (prev === 1 ? 2 : 1));
    }, 600);

    // Cycle talking animation frames between woman and man (1 -> 2)
    const talkInterval = setInterval(() => {
      setTalkingArtisansFrame((prev) => (prev === 1 ? 2 : 1));
    }, 1400);

    // Cycle grain unloading animation frames (3 -> 2 -> 1 -> 2 -> 3)
    const grainSequence: (1 | 2 | 3)[] = [3, 2, 1, 2];
    let grainSeqIdx = 0;
    const grainWorkerInterval = setInterval(() => {
      grainSeqIdx = (grainSeqIdx + 1) % grainSequence.length;
      setGrainWorkerFrame(grainSequence[grainSeqIdx]);
    }, 750);

    // Continuous smooth game time loop for walking and river routes
    let lastTime = performance.now();
    let animId: number;

    const moveLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      setCarrierTime((prev) => prev + dt);
      animId = requestAnimationFrame(moveLoop);
    };

    animId = requestAnimationFrame(moveLoop);

    return () => {
      clearInterval(frameInterval);
      clearInterval(batherInterval);
      clearInterval(boatInterval);
      clearInterval(talkInterval);
      clearInterval(grainWorkerInterval);
      cancelAnimationFrame(animId);
    };
  }, [scene]);

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
        showCourtyardToiletModal ||
        showCourtyardWellModal ||
        showCourtyardStaircaseModal ||
        showInteriorStaircaseModal ||
        showInteriorCharpoyModal ||
        showInteriorBathModal ||
        showInteriorQuernModal ||
        showGranaryDuctsModal ||
        showGranaryPlatformsModal ||
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

      // Enter key: [E] or [e] (Per user requirement: "for entering anywhere E")
      if (e.key === "e" || e.key === "E") {
        if (isNearGreatBathHarappanGate) {
          startLongTravelTransition("caravan_road", { x: 45.0, y: 84.0 }, 2, "HARAPPA");
          return;
        } else if (isNearCaravanRoadHarappaGate) {
          triggerTransition("steatite_seal_workshop", { x: 20.0, y: 38.0 }, 3, 600);
          return;
        } else if (isNearHouseDoorway) {
          setCourtyardReturnScene("residential_grid");
          triggerTransition("house_courtyard", { x: 50.0, y: 72.0 });
          return;
        } else if (isNearCourtyardToiletDoor) {
          setPlayerPos({ x: 26.0, y: 68.0 });
          soundFx.playSelect();
          return;
        } else if (isNearCourtyardBathDoor) {
          setPlayerPos({ x: 70.0, y: 70.0 });
          soundFx.playSelect();
          return;
        } else if (isNearCourtyardLeftInteriorDoor || isNearCourtyardInteriorDoor) {
          triggerTransition("house_interior", { x: 50.0, y: 80.0 });
          return;
        } else if (isNearCourtyardToInterior) {
          triggerTransition("house_second_floor", { x: 50.0, y: 64.0 });
          return;
        } else if (isNearInteriorStaircase) {
          triggerTransition("house_second_floor", { x: 50.0, y: 64.0 });
          return;
        } else if (isNearGranaryExit) {
          triggerTransition("residential_grid", { x: 80.0, y: 38.0 });
          return;
        } else if (isNearResidentialGranaryForward) {
          triggerTransition("granary_avenue", { x: 26.0, y: 78.0 });
          return;
        } else if (isNearGranaryCitadelAscent) {
          triggerTransition("great_bath_citadel", { x: 50.0, y: 82.0 }, 2);
          return;
        } else if (isNearArtisanQuarterExit) {
          triggerTransition("steatite_seal_workshop", { x: 25.0, y: 72.0 }, 3);
          return;
        } else if (isNearCitadelStairs) {
          triggerTransition("priest_king_citadel", { x: 50.0, y: 80.0 }, 4);
          return;
        } else if (isNearWorkshopEntrance) {
          triggerTransition("priest_king_citadel", { x: 50.0, y: 80.0 }, 4);
          return;
        } else if (isNearResidentialAreaEntrance) {
          triggerTransition("residential_grid", { x: 50.0, y: 80.0 }, 3, 600);
          return;
        } else if (isNearCemeteryGate) {
          triggerTransition("harappa_cemetery", { x: 50.0, y: 82.0 }, 3, 600);
          return;
        } else if (isNearCitadelPassage) {
          triggerTransition("priest_king_citadel", { x: 50.0, y: 80.0 }, 4, 600);
          return;
        } else if (isNearBeadQuarterEntrance) {
          triggerTransition("carnelian_bead_quarter", { x: 30.0, y: 70.0 });
          return;
        } else if (isNearDrainageEntrance) {
          triggerTransition("drainage_culvert", { x: 50.0, y: 50.0 });
          return;
        } else if (isNearSunsetReflection) {
          triggerTransition("closing_reflection", { x: 50.0, y: 60.0 });
          return;
        }
      }

      // Exit key: [F] or [f] (Per user requirement: "exiting F")
      if (e.key === "f" || e.key === "F") {
        if (isNearHarappaExitArchway) {
          triggerTransition("caravan_road", { x: 80.0, y: 32.0 }, undefined, 600);
          return;
        } else if (isNearCaravanRoadReturn) {
          startLongTravelTransition("great_bath_citadel", { x: 68.0, y: 32.0 }, 2, "MOHENJO-DARO");
          return;
        } else if (isNearWorkshopExit) {
          triggerTransition("steatite_seal_workshop", { x: 50.0, y: 65.0 }, 3, 600);
          return;
        } else if (isNearBeadQuarterExit) {
          triggerTransition("steatite_seal_workshop", { x: 80.0, y: 60.0 });
          return;
        } else if (isNearDrainageExit) {
          triggerTransition("great_bath_citadel", { x: 50.0, y: 65.0 });
          return;
        } else if (isNearSunsetExit) {
          triggerTransition("carnelian_bead_quarter", { x: 80.0, y: 60.0 });
          return;
        } else if (isInsideCourtyardToilet) {
          // Exit latrine room to corridor outside
          setPlayerPos({ x: 38.0, y: 58.0 });
          soundFx.playSelect();
          return;
        } else if (isInsideCourtyardBath) {
          setPlayerPos({ x: 60.0, y: 56.0 });
          soundFx.playSelect();
          return;
        } else if (isNearCourtyardRightExitDoor || isNearCourtyardExit) {
          // Exit from courtyard back to Great Bath or street grid depending on entry point
          if (courtyardReturnScene === "great_bath_citadel") {
            triggerTransition("great_bath_citadel", { x: 68.0, y: 32.0 });
          } else {
            triggerTransition("residential_grid", isNearCourtyardRightExitDoor ? { x: 48.0, y: 60.0 } : { x: 80.0, y: 38.0 });
          }
          return;
        } else if (isNearHouseExit) {
          // Exit from ground floor interior back to courtyard
          triggerTransition("house_courtyard", { x: 36.0, y: 46.0 });
          return;
        } else if (isNearSecondFloorExit) {
          // Descend from second floor back to top of stairs in courtyard
          triggerTransition("house_courtyard", { x: 51.0, y: 28.0 });
          return;
        } else if (isNearResidentialGhatReturn) {
          if (stage >= 3) {
            triggerTransition("steatite_seal_workshop", { x: 60.0, y: 55.0 }, 3, 600);
          } else {
            triggerTransition("lower_town_gate", { x: 71.5, y: 41.0 });
          }
          return;
        } else if (isNearCemeteryExit) {
          triggerTransition("residential_grid", { x: 58.0, y: 34.0 }, 3, 600);
          return;
        } else if (isNearGranaryGridReturn) {
          triggerTransition("residential_grid", { x: 76.0, y: 38.0 });
          return;
        } else if (isNearGreatBathGranaryReturn) {
          triggerTransition("granary_avenue", { x: 72.0, y: 52.0 });
          return;
        }
      }

      // Inspect key: [G] or [g] (Per user requirement: "for all the inspect part keep G")
      if (e.key === "g" || e.key === "G") {
        if (isNearCaravanCart) {
          setActiveCitizenDialogue({
            name: "Harappan Bullock Cart",
            title: "Traditional Indus Valley Freight Transport",
            icon: "",
            text: "A solid-wheeled wooden ox cart harnessed to a pair of humped zebu oxen, laden with terracotta storage jars, woven grain sacks, and trade goods along the post-noon highway to Harappa.",
          });
          soundFx.playSelect();
        } else if (isNearCourtyardToilet) {
          setShowCourtyardToiletModal(true);
        } else if (isNearCourtyardBath) {
          setShowInteriorBathModal(true);
        } else if (isNearCourtyardWell) {
          setShowCourtyardWellModal(true);
        } else if (isNearCourtyardStaircase) {
          setShowCourtyardStaircaseModal(true);
        } else if (isNearInteriorStaircase) {
          setShowInteriorStaircaseModal(true);
        } else if (isNearInteriorCharpoy || isNearSecondFloorCharpoy) {
          setShowInteriorCharpoyModal(true);
        } else if (isNearInteriorQuern || isNearSecondFloorStorage) {
          setShowInteriorQuernModal(true);
        } else if (isNearSecondFloorGallery) {
          setActiveCitizenDialogue({
            name: "Harappan Upper Balustrade Gallery",
            title: "Mohenjo-daro Two-Story Domestic Architecture",
            icon: "",
            text: "Looking down from this upper wooden balustrade, the central courtyard acts as an evaporative chimney. Cool air from the water jars and well rises up through the upper story, keeping both floors comfortably ventilated under the summer sun.",
          });
          soundFx.playSelect();
        } else if (isNearOverseer) {
          setShowOverseerDialogue(true);
        } else if (isNearForeignTraders) {
          setShowForeignTradersModal(true);
        } else if (isNearEgyptianSailor) {
          setActiveCitizenDialogue({
            name: "Kheti the Egyptian Sailor",
            title: "Nile River Navigator & Trade Envoy • 2500 BCE",
            icon: "",
            text: "Greetings from the lands of Kemet (Ancient Egypt)! Our royal cedarwood and reed barques sail the Red Sea from the shores of Punt to the Arabian Gulf and across the ocean to your great city of Meluhha on the Indus. We trade Egyptian linen, gold, and fine faience beads in exchange for your prized Indus carnelian, lapis lazuli, and fragrant timber!",
          });
          soundFx.playSelect();
        } else if (isNearRooftopCitizen) {
          setActiveCitizenDialogue({
            name: "Harappan Rooftop Resident",
            title: "Citizen of the Upper Terraces • Mohenjo-daro",
            icon: "",
            text: "From atop our baked-brick roofs, you can see how our streets cross at perfect cardinal angles! When the summer sun sets over the Indus, our families gather on these cool flat terraces to spin cotton and catch the river breeze.",
          });
          soundFx.playSelect();
        } else if (isNearRooftopLookout) {
          setActiveCitizenDialogue({
            name: "Harappan Lookout",
            title: "Lower Town Watcher • Mohenjo-daro",
            icon: "",
            text: "I watch the sunrise over the eastern wall! Look along the street below—the covered drains carry every drop of wastewater away safely under the stone slabs. No other city on earth has such engineering.",
          });
          soundFx.playSelect();
        } else if (isNearGravePottery) {
          setActiveCitizenDialogue({
            name: "Harappan Funerary Pottery",
            title: "Grave Offerings • Cemetery R37 Harappa",
            icon: "",
            text: "Painted terracotta vessels, dishes-on-stand, and food offerings left at the head of the burial. Harappans placed authentic domestic pottery with their departed for the journey beyond.",
          });
          soundFx.playSelect();
        } else if (isNearExcavatedGrave) {
          setActiveCitizenDialogue({
            name: "Excavated Rectangular Grave R37",
            title: "North-South Extended Burial • Cemetery R37",
            icon: "",
            text: "Excavations at Cemetery R37 reveal rectangular earthen pits oriented strictly North-South. Bodies were placed extended on their backs with head pointing North, adorned with simple shell bangles, steatite beads, and copper rings.",
          });
          soundFx.playSelect();
        } else if (isNearSolemnElder) {
          setActiveCitizenDialogue({
            name: "Harappan Solemn Funeral Observer",
            title: "Elder of Cemetery R37 • Harappa",
            icon: "",
            text: "Peace be with our ancestors. Unlike the grandiose pyramid tombs of Egypt or royal graves of Sumer, Harappans honored all citizens with dignified, uniform earthen burials and modest pottery offerings.",
          });
          soundFx.playSelect();
        } else if (isNearEmptyBurialPlot) {
          setActiveCitizenDialogue({
            name: "Unexcavated Earthen Burial Slot",
            title: "Reserved Grave Mound • Cemetery R37",
            icon: "",
            text: "An open earthen grave plot preserved for future burial rituals. Harappans maintained dedicated rectangular burial spaces outside the living city grid.",
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
        } else if (isNearCargoInspector) {
          setActiveCitizenDialogue({
            name: "Harappan Cargo Inspector",
            title: "River Quay Port Official • Mohenjo-daro",
            icon: "",
            text: "Boats from the lower Indus delta arrive at our river quays laden with lapis lazuli, carnelian beads, and timber! I inspect and log every shipment before carts bring the goods into the inner city avenues.",
          });
          soundFx.playSelect();
        } else if (isNearDrainInspector) {
          setActiveCitizenDialogue({
            name: "Municipal Drain Inspector",
            title: "Civic Sanitation Surveyor • Mohenjo-daro",
            icon: "",
            text: "I inspect this sediment silt-trap. Every week, municipal crews lift the stone inspection slabs to scoop out sediment, ensuring our covered drainage channels flow freely towards the city perimeter.",
          });
          soundFx.playSelect();
        } else if (isNearArtisans) {
          setActiveCitizenDialogue({
            name: "Harappan Artisans (Weaver & Potter)",
            title: "Craft Guild • Mohenjo-daro Artisan Quarter",
            icon: "",
            text: "We are preparing goods for the maritime trade caravans! The weaver spins fine dyed cotton textiles using standardized terracotta whorls, while the master potter crafts wheel-thrown storage amphorae and glazed beads. Together, our artisan quarter supplies exports from Dilmun to ancient Mesopotamia!",
          });
          soundFx.playSelect();
        } else if (isNearCemeteryGate) {
          setActiveCitizenDialogue({
            name: "Harappan Cemetery Gate",
            title: "Ancient Sacred Burial Grounds • Harappa",
            icon: "",
            text: "You stand before the ancient Harappan cemetery archway! Beyond this gateway lie the earthen burial mounds, lined graves, and terracotta funerary urns where ancient Harappan families laid their ancestors to rest with honored pottery offerings.",
          });
          soundFx.playSelect();
        } else if (isNearTalkingCitizens) {
          setActiveCitizenDialogue({
            name: "Harappan Merchants & Citizens",
            title: "Lower Town Citizens • Mohenjo-daro & Harappa",
            icon: "",
            text: "We were just discussing how all standardized baked bricks across our twin cities adhere to the exact 1:2:4 ratio, and how our street drains prevent summer monsoon overflow!",
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
        } else if (isNearGranaryWorker) {
          setActiveCitizenDialogue({
            name: "Harappan Granary Laborer",
            title: "Grain Carrier • Mohenjo-daro Granary",
            icon: "",
            text: "We haul sacks of freshly threshed barley and emmer wheat from the river quays up these wooden ramps! Notice how the platforms are raised above the ground—warm, dry air circulates continuously through the brick vents to prevent rot.",
          });
          soundFx.playSelect();
        } else if (isNearAnyGrainCart) {
          setActiveCitizenDialogue({
            name: "Dhanu the Granary Worker",
            title: "Bullock Cart Grain Handler • Mohenjo-daro Granary",
            icon: "",
            text: "Hup! Another wooden cart loaded with winter barley has arrived from the fertile alluvial fields along the Indus river. We carefully unload each heavy sack down to the staging ground, ready to be weighed and hauled up the wooden ramp to the ventilated loading platforms!",
          });
          soundFx.playSelect();
        } else if (isNearGranaryArtisans) {
          setActiveCitizenDialogue({
            name: "Harappan Merchants (Weaver & Grain Overseer)",
            title: "Civic Distribution Guild • Mohenjo-daro",
            icon: "",
            text: "We are verifying the grain tallies for the city's craftspeople and municipal workers! Standardized binary chert weights ensure that every family and artisan receives their exact monthly ration of barley and sesame seeds directly from the state granary.",
          });
          soundFx.playSelect();
        } else if (isNearGranaryScribe) {
          setActiveCitizenDialogue({
            name: "Granary Metrology Scribe",
            title: "Civic Grain Overseer • Mohenjo-daro",
            icon: "",
            text: "Every basket entering these rectangular bays is measured against standard chert cube weights. Centralized storage ensures that even during drought years or unpredictable Indus river floods, the civic granary guarantees food security for the entire population.",
          });
          soundFx.playSelect();
        } else if (isNearAnyGranaryWorker) {
          setActiveCitizenDialogue({
            name: "Harappan Grain Porter",
            title: "Granary Reserve Carrier • Mohenjo-daro",
            icon: "",
            text: "Step aside, friend! We are hauling sacks of harvested barley and emmer wheat between the storage bays and distribution loading platforms. The subterranean air ducts below keep the grain dry and fresh through every season!",
          });
          soundFx.playSelect();
        } else if (isNearGranaryAirDucts) {
          setShowGranaryDuctsModal(true);
        } else if (isNearGranaryPlatforms) {
          setShowGranaryPlatformsModal(true);
        } else if (isNearResidentialDrains) {
          setShowDrainsModal(true);
        } else if (isNearResidentialHouse) {
          setShowHouseModal(true);
        } else if (isNearGreatBathBasin) {
          setShowDrainagePuzzleModal(true);

        } else if (isNearGreatBathPotter) {
          setActiveCitizenDialogue({
            name: "Harappan Master Potter",
            title: "Terracotta Artisan & Vessel Carrier • Mohenjo-daro",
            icon: "",
            text: "I transport wheel-thrown terracotta water jars, ritual lotas, and storage amphorae from the artisan kilns into the Great Bath complex. Standardized pottery ensures pure ritual storage for the sacred bathing ablutions!",
          });
          soundFx.playSelect();
        } else if (isNearSealBench) {
          setShowSealPuzzleModal(true);
        } else if (isNearPriestKing) {
          setShowPriestKingDialogue(true);
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
    showForeignTradersModal,
    showDrainsModal,
    showHouseModal,
    showInteriorStaircaseModal,
    showInteriorCharpoyModal,
    showInteriorBathModal,
    showInteriorQuernModal,
    showGranaryDuctsModal,
    showGranaryPlatformsModal,
    showCourtyardToiletModal,
    showCourtyardWellModal,
    showCourtyardStaircaseModal,
    showDrainagePuzzleModal,
    showSealPuzzleModal,
    showPriestKingDialogue,
    activeCitizenDialogue,
    isJournalOpen,
    showVictoryModal,
    isNearOverseer,
    isNearForeignTraders,
    isNearEgyptianSailor,
    isNearRooftopCitizen,
    isNearRooftopLookout,
    isNearRoadPedestrian,
    isNearResidentialWaterCarrier1,
    isNearResidentialWaterCarrier2,
    isNearCourtyardResident,
    isNearTalkingCitizens,
    isNearResidentialDrains,
    isNearResidentialHouse,
    isNearHouseDoorway,
    isNearCourtyardExit,
    isNearCourtyardToiletDoor,
    isInsideCourtyardToilet,
    isNearCourtyardInteriorDoor,
    isNearCourtyardRightExitDoor,
    isNearCourtyardLeftInteriorDoor,
    isNearCourtyardBathDoor,
    isInsideCourtyardBath,
    isNearCourtyardToInterior,
    isNearCourtyardToilet,
    isNearCourtyardBath,
    isNearCourtyardWell,
    isNearCourtyardStaircase,
    isNearHouseExit,
    isNearInteriorStaircase,
    isNearInteriorCharpoy,
    isNearInteriorQuern,
    isNearSecondFloorExit,
    isNearSecondFloorGallery,
    isNearSecondFloorCharpoy,
    isNearSecondFloorStorage,
    isNearResidentialGranaryForward,
    isNearResidentialGhatReturn,
    isNearGranaryGridReturn,
    isNearGranaryCitadelAscent,
    isNearGranaryAirDucts,
    isNearGranaryPlatforms,
    isNearGranaryWorker,
    isNearAnyGranaryWorker,
    isNearAnyGrainCart,
    isNearGranaryArtisans,
    isNearGranaryScribe,
    isNearGreatBathBasin,
    isNearGreatBathPotter,
    isNearGreatBathGranaryReturn,
    isNearGreatBathHarappanGate,
    isNearCaravanCart,
    isNearCaravanRoadHarappaGate,
    isNearCaravanRoadReturn,
    courtyardReturnScene,
    isNearSealBench,
    isNearHarappaExitArchway,
    isNearPriestKing,
    isNearGranaryExit,
    isNearArtisanQuarterExit,
    isNearCitadelStairs,
    isNearWorkshopEntrance,
    isNearResidentialAreaEntrance,
    isNearWorkshopExit,
    isNearBeadQuarterEntrance,
    isNearBeadQuarterExit,
    isNearDrainageEntrance,
    isNearDrainageExit,
    isNearSunsetReflection,
    isNearSunsetExit,
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
            {/* Sprite container aligned so feet touch bottom */}
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              {isNearOverseer && (
                <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                  <span>Speak with Dock Official</span>
                </div>
              )}
              <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-2 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mb-1 whitespace-nowrap transition-opacity duration-200 ${
                isNearOverseer ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                Dock Official Somnath
              </span>
              <img
                src="/sprite-indus-official.png?v=4"
                alt="Dock Official Somnath"
                className="h-24 sm:h-[108px] md:h-[122px] w-auto object-contain block select-none"
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
            {/* Sprite container aligned so feet touch bottom */}
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              {isNearForeignTraders && (
                <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#38bdf8] text-[#f0f9ff] px-2.5 py-0.5 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
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
                className="h-24 sm:h-[108px] md:h-[122px] w-auto object-contain block select-none"
              />
            </div>
          </div>
        )}

        {/* Stage 1: Ancient Egyptian Sailor River Boat Sailing along the Indus River */}
        {scene === "lower_town_gate" && (
          <div
            className="absolute z-12 pointer-events-auto cursor-pointer select-none group transition-opacity duration-300"
            style={{
              left: `${boatState.x}%`,
              top: `${boatState.y}%`,
            }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Kheti the Egyptian Sailor",
                title: "Nile River Navigator & Trade Envoy • 2500 BCE",
                icon: "",
                text: "Greetings from the lands of Kemet (Ancient Egypt)! Our royal cedarwood and reed barques sail the Red Sea from the shores of Punt to the Arabian Gulf and across the ocean to your great city of Meluhha on the Indus. We trade Egyptian linen, gold, and fine faience beads in exchange for your prized Indus carnelian, lapis lazuli, and fragrant timber!",
              });
              soundFx.playSelect();
            }}
          >
            {/* Water wake ripple under boat */}
            <div
              className="absolute left-1/2 bottom-2 -translate-x-1/2 w-28 h-6 bg-cyan-200/25 rounded-[100%] blur-[2px] pointer-events-none animate-pulse"
              style={{
                transform: `translateX(-50%) scale(${boatState.scale * 1.15})`,
              }}
            />

            <div
              className="relative flex flex-col items-center transition-transform duration-200 group-hover:scale-105"
              style={{
                transform: `translate(-50%, -85%) translateY(${boatState.bobbingY}px) rotate(${boatState.rockingAngle}deg) scale(${boatState.scale}) ${
                  boatState.facingLeft ? "scale-x-100" : "-scale-x-100"
                }`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className={`absolute bottom-full mb-1 flex flex-col items-center pointer-events-none ${
                  boatState.facingLeft ? "scale-x-100" : "-scale-x-100"
                }`}
              >
                {isNearEgyptianSailor && (
                  <div className="mb-1 bg-[#1b1510]/95 border-2 border-[#38bdf8] text-[#f0f9ff] px-2.5 py-0.5 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap pointer-events-auto">
                    <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                    <span>Hail Egyptian Sailor</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f0f9ff] bg-[#0c1a24]/90 px-2 py-0.5 rounded border border-[#38bdf8]/60 shadow-md whitespace-nowrap transition-opacity duration-200 ${
                    isNearEgyptianSailor ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Egyptian River Boat
                </span>
              </div>
              <img
                src={
                  boatState.isSailing
                    ? `/sprite-egyptian-boat-${boatRowFrame}.png?v=2`
                    : "/sprite-egyptian-boat-1.png?v=2"
                }
                alt="Ancient Egyptian Sailor in River Boat"
                className="h-28 sm:h-32 md:h-36 w-auto object-contain block select-none drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>
        )}

        {/* Stage 1: Mohenjo-daro City Gateway Trigger to Residential Grid */}
        {scene === "lower_town_gate" && hasFirstRelicChertWeight && isNearGranaryExit && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "71.5%", top: "31%" }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▲ [E] Enter City Gate to Residential Grid</span>
            </div>
          </div>
        )}

        {/* Stage 1.5: Rooftop Citizen on Upper House Terrace (Patrolling to left corner, staying 6s, walking back) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-12 pointer-events-auto cursor-pointer select-none group"
            style={{ left: `${roof2State.x}%`, top: `${roof2State.y}%` }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Rooftop Resident",
                title: "Citizen of the Upper Terraces • Mohenjo-daro",
                icon: "",
                text: "From atop our baked-brick roofs, you can see how our streets cross at perfect cardinal angles! When the summer sun sets over the Indus, our families gather on these cool flat terraces to spin cotton and catch the river breeze.",
              })
            }
          >
            <div
              className={`relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 group-hover:scale-105 ${
                roof2State.facingLeft ? "-scale-x-100" : "scale-x-100"
              }`}
            >
              <div
                className={`absolute bottom-full mb-1 flex flex-col items-center pointer-events-none ${
                  roof2State.facingLeft ? "-scale-x-100" : "scale-x-100"
                }`}
              >
                {isNearRooftopCitizen && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[10px] font-serif shadow-lg animate-bounce whitespace-nowrap pointer-events-auto">
                    <span className="text-[#d8a86a] font-bold mr-1">[G]</span>
                    <span>Greet Rooftop Resident</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearRooftopCitizen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Rooftop Citizen
                </span>
              </div>
              <img
                src={
                  roof2State.isWalking
                    ? `/sprite-rooftop-walk-${rooftopFrame}.png?v=2`
                    : "/sprite-indus-rooftop.png?v=3"
                }
                alt="Harappan Rooftop Resident"
                className="h-[68px] sm:h-[75px] md:h-[84px] w-auto object-contain block select-none"
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Foreground Rooftop Lookout (Patrolling foreground terrace to front corner, staying 6s, walking back) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-14 pointer-events-auto cursor-pointer select-none group"
            style={{ left: `${roof1State.x}%`, top: `${roof1State.y}%` }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Lookout",
                title: "Lower Town Watcher • Mohenjo-daro",
                icon: "",
                text: "I watch the sunrise over the eastern wall! Look along the street below—the covered drains carry every drop of wastewater away safely under the stone slabs. No other city on earth has such engineering.",
              })
            }
          >
            <div
              className={`relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 group-hover:scale-105 ${
                roof1State.facingLeft ? "-scale-x-100" : "scale-x-100"
              }`}
            >
              <div
                className={`absolute bottom-full mb-1 flex flex-col items-center pointer-events-none ${
                  roof1State.facingLeft ? "-scale-x-100" : "scale-x-100"
                }`}
              >
                {isNearRooftopLookout && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[10px] font-serif shadow-lg animate-bounce whitespace-nowrap pointer-events-auto">
                    <span className="text-[#d8a86a] font-bold mr-1">[G]</span>
                    <span>Greet Terrace Watcher</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearRooftopLookout ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Terrace Watcher
                </span>
              </div>
              <img
                src={
                  roof1State.isWalking
                    ? `/sprite-rooftop-walk-${rooftopFrame}.png?v=2`
                    : "/sprite-indus-rooftop.png?v=3"
                }
                alt="Harappan Terrace Lookout"
                className="h-[75px] sm:h-[84px] md:h-[95px] w-auto object-contain block select-none"
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Road Townsman / Water Carrier (Animated along Image 1 red line route) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-15 select-none group transition-opacity duration-300"
            style={{
              left: `${guy1State.x}%`,
              top: `${guy1State.y}%`,
              opacity: guy1State.opacity,
              filter: guy1State.filter,
              transform: `scale(${guy1State.scale})`,
              transformOrigin: "bottom center",
              pointerEvents: guy1State.isInside ? "none" : "auto",
              cursor: guy1State.isInside ? "default" : "pointer",
            }}
            onClick={() => {
              if (guy1State.isInside) return;
              setActiveCitizenDialogue({
                name: "Harappan Water Carrier",
                title: "Neighborhood Municipal Worker • Mohenjo-daro",
                icon: "",
                text: "I carry cool water from our neighborhood brick well into the residential houses! Notice that our streets have covered drains on both sides with sediment traps. No waste ever pools in our lanes—our city stays cleaner than any kingdom in Sumer or Dilmun!",
              });
            }}
          >
            <div
              className={`relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 ${
                guy1State.facingLeft ? "-scale-x-100" : "scale-x-100"
              }`}
            >
              {/* Floating badges positioned above the head without affecting ground anchoring */}
              <div
                className={`absolute bottom-full mb-1 flex flex-col items-center pointer-events-none ${
                  guy1State.facingLeft ? "-scale-x-100" : ""
                }`}
              >
                {isNearRoadPedestrian && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#38bdf8] text-[#f0f9ff] px-2.5 py-0.5 rounded text-[11px] font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap pointer-events-auto">
                    <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                    <span>Greet Water Carrier</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f0f9ff] bg-[#0c1a24]/90 px-2 py-0.5 rounded border border-[#38bdf8]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearRoadPedestrian ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Water Carrier
                </span>
              </div>
              <img
                src={`/sprite-pedestrian-walk-${carrierFrame}.png?v=2`}
                alt="Harappan Water Carrier Walking"
                className="h-[96px] sm:h-[108px] md:h-[118px] w-auto object-contain block select-none"
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Courtyard Resident Woman (Grounded at left street courtyard entrance) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-13 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "18.0%", top: "78.0%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Courtyard Inhabitant",
                title: "Domestic Artisan • Mohenjo-daro",
                icon: "",
                text: "Welcome to our inner courtyard! Notice how our home has no windows facing the busy street. The thick baked-brick walls keep out the street dust and noise, giving our family acoustic peace and natural cooling throughout the year.",
              })
            }
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 group-hover:scale-105">
              <div className="absolute bottom-full mb-1 flex flex-col items-center pointer-events-none">
                {isNearCourtyardResident && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[11px] font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap pointer-events-auto">
                    <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                    <span>Speak with Courtyard Resident</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearCourtyardResident ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Courtyard Resident
                </span>
              </div>
              <img
                src="/sprite-indus-courtyard.png?v=3"
                alt="Harappan Courtyard Resident"
                className="h-[68px] sm:h-[75px] md:h-[84px] w-auto object-contain block select-none"
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: 2 People Talking in Front (Foreground Right Street Plaza) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-16 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "82.0%", top: "84.0%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Merchants & Citizens",
                title: "Lower Town Citizens • Mohenjo-daro & Harappa",
                icon: "",
                text: "We were just discussing how all standardized baked bricks across our twin cities adhere to the exact 1:2:4 ratio, and how our street drains prevent summer monsoon overflow!",
              })
            }
          >
            <div className="relative flex items-center justify-center gap-1 transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              <div className="absolute bottom-full mb-1 flex flex-col items-center pointer-events-none">
                {isNearTalkingCitizens && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[10px] font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap pointer-events-auto">
                    <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                    <span>Listen to Citizens</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearTalkingCitizens ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Harappan Citizens
                </span>
              </div>
              {/* Person 1 (Facing Right) */}
              <img
                src="/sprite-indus-trader.png?v=3"
                alt="Talking Citizen 1"
                className="h-[75px] sm:h-[84px] md:h-[95px] w-auto object-contain block select-none scale-x-100"
              />
              {/* Person 2 (Facing Left) */}
              <img
                src="/sprite-indus-courtyard.png?v=3"
                alt="Talking Citizen 2"
                className="h-[75px] sm:h-[84px] md:h-[95px] w-auto object-contain block select-none -scale-x-100"
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Harappan Cargo Inspector (Grounded on right rooftop terrace) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-13 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "82.0%", top: "34.0%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Cargo Inspector",
                title: "River Quay Port Official • Mohenjo-daro",
                icon: "",
                text: "Boats from the lower Indus delta arrive at our river quays laden with lapis lazuli, carnelian beads, and timber! I inspect and log every shipment before carts bring the goods into the inner city avenues.",
              })
            }
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform group-hover:scale-105">
              {isNearCargoInspector && (
                <div className="mb-1.5 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2 py-0.5 rounded text-[10px] font-serif shadow-lg animate-bounce whitespace-nowrap">
                  <span className="text-[#d8a86a] font-bold mr-1">[G]</span>
                  <span>Speak with Cargo Inspector</span>
                </div>
              )}
              <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow mb-1 whitespace-nowrap transition-opacity duration-200 ${
                isNearCargoInspector ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                Cargo Inspector
              </span>
              <img
                src="/sprite-indus-official.png?v=4"
                alt="Cargo Inspector"
                className="h-[68px] sm:h-[75px] md:h-[84px] w-auto object-contain block select-none"
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Marked Spot 2 - Municipal Drain Inspector (Animated along Image 2 red line route) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-14 select-none group transition-opacity duration-300"
            style={{
              left: `${guy2State.x}%`,
              top: `${guy2State.y}%`,
              opacity: guy2State.opacity,
              filter: guy2State.filter,
              transform: `scale(${guy2State.scale})`,
              transformOrigin: "bottom center",
              pointerEvents: guy2State.isInside ? "none" : "auto",
              cursor: guy2State.isInside ? "default" : "pointer",
            }}
            onClick={() => {
              if (guy2State.isInside) return;
              setActiveCitizenDialogue({
                name: "Municipal Drain Inspector",
                title: "Civic Sanitation Surveyor • Mohenjo-daro",
                icon: "",
                text: "I inspect this sediment silt-trap and deliver fresh water to the east wing quarters. Every week, municipal crews lift the stone inspection slabs to scoop out sediment, ensuring our covered drainage channels flow freely towards the city perimeter.",
              });
            }}
          >
            <div
              className={`relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 ${
                guy2State.facingLeft ? "-scale-x-100" : "scale-x-100"
              }`}
            >
              <div
                className={`absolute bottom-full mb-1 flex flex-col items-center pointer-events-none ${
                  guy2State.facingLeft ? "-scale-x-100" : ""
                }`}
              >
                {isNearDrainInspector && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#38bdf8] text-[#f0f9ff] px-2.5 py-0.5 rounded text-[11px] font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap pointer-events-auto">
                    <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                    <span>Speak with Drain Inspector</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f0f9ff] bg-[#0c1a24]/90 px-2 py-0.5 rounded border border-[#38bdf8]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearDrainInspector ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Drain Inspector
                </span>
              </div>
              <img
                src={`/sprite-pedestrian-walk-${guy2State.isWalking ? carrierFrame : 1}.png?v=2`}
                alt="Drain Inspector Walking"
                className="h-[96px] sm:h-[108px] md:h-[118px] w-auto object-contain block select-none"
              />
            </div>
          </div>
        )}

        {/* Stage 1.5: Harappan Artisans Conversing (Cotton Weaver & Master Potter down on courtyard ground) */}
        {scene === "residential_grid" && (
          <div
            className="absolute z-16 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "87.5%", top: "93.5%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Artisans (Weaver & Potter)",
                title: "Craft Guild • Mohenjo-daro Artisan Quarter",
                icon: "",
                text: "We are coordinating our shipment for the maritime trade caravans! The weaver spins fine dyed cotton textiles using standardized terracotta whorls, while the master potter crafts wheel-thrown storage amphorae and glazed beads. Together, our artisan quarter supplies exports from Dilmun to ancient Mesopotamia!",
              })
            }
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 group-hover:scale-105">
              {/* Floating interaction badges above head without affecting ground anchoring */}
              <div className="absolute bottom-full mb-1 flex flex-col items-center pointer-events-none">
                {isNearArtisans && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[11px] font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap pointer-events-auto">
                    <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                    <span>Speak with Artisans</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearArtisans ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Weaver & Potter in Conversation
                </span>
              </div>

              <img
                src={`/sprite-artisans-talk-${talkingArtisansFrame}.png?v=2`}
                alt="Harappan Artisans Conversing"
                className="h-[102px] sm:h-[114px] md:h-[126px] w-auto object-contain block select-none"
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
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
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
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
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

        {/* Stage 1.5: Residential Grid -> Enter Central Courtyard Doorway */}
        {scene === "residential_grid" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "48%", top: "54%" }}
          >
            {isNearHouseDoorway && (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <span>▲ [E] Enter Central Courtyard</span>
              </div>
            )}
          </div>
        )}

        {/* Stage 1.5: Residential Grid -> The Great Granary (Moving forward up avenue to top-right) */}
        {scene === "residential_grid" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "80%", top: "34%" }}
            onClick={() => triggerTransition("granary_avenue", { x: 26.0, y: 78.0 })}
          >
            {isNearResidentialGranaryForward ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <span>▲ [E] To The Great Granary</span>
              </div>
            ) : (
              <div className="bg-[#1b1510]/80 border border-[#52a45a]/60 text-[#baf1be]/80 px-2 py-0.5 rounded text-[11px] font-serif whitespace-nowrap">
                <span>To The Great Granary</span>
              </div>
            )}
          </div>
        )}

        {/* Stage 1.5 & Stage 3: Residential Grid -> Return to Ghat Gate or Toy Market Street */}
        {scene === "residential_grid" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "58%", top: "90%" }}
            onClick={() => {
              if (stage >= 3) {
                triggerTransition("steatite_seal_workshop", { x: 60.0, y: 55.0 }, 3, 600);
              } else {
                triggerTransition("lower_town_gate", { x: 71.5, y: 41.0 });
              }
            }}
          >
            {isNearResidentialGhatReturn ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <span>▼ [F] {stage >= 3 ? "To Toy Market Street" : "To River Ghat"}</span>
              </div>
            ) : (
              <div className="bg-[#1b1510]/80 border border-[#d8a86a]/60 text-[#f7eedf]/80 px-2 py-0.5 rounded text-[11px] font-serif whitespace-nowrap">
                <span>{stage >= 3 ? "To Toy Market Street" : "To River Ghat"}</span>
              </div>
            )}
          </div>
        )}

        {/* Stage 3: Harappan Cemetery Archway Gate */}
        {scene === "residential_grid" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "58%", top: "24%" }}
            onClick={() => triggerTransition("harappa_cemetery", { x: 50.0, y: 82.0 }, 3, 600)}
          >
            {isNearCemeteryGate ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>✨ Enter Cemetery Area (Press E)</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>🪦 Harappan Cemetery R37</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* Stage 3: Harappan Cemetery R37 & Sacred Burial Ground     */}
        {/* ========================================================= */}

        {/* Cemetery R37 -> Return to Residential Area */}
        {scene === "harappa_cemetery" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "90%" }}
            onClick={() => triggerTransition("residential_grid", { x: 58.0, y: 34.0 }, 3, 600)}
          >
            {isNearCemeteryExit ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">F</div>
                <span>▼ Return to Residential Area</span>
              </div>
            ) : (
              <div className="bg-[#1b1510]/80 border border-[#d8a86a]/60 text-[#f7eedf]/80 px-2 py-0.5 rounded text-[11px] font-serif whitespace-nowrap">
                <span>Return to Residential Area</span>
              </div>
            )}
          </div>
        )}

        {/* Hotspot 1: Grave Pottery Offerings */}
        {scene === "harappa_cemetery" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "40%", top: "58%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Funerary Pottery",
                title: "Grave Offerings • Cemetery R37 Harappa",
                icon: "",
                text: "Painted terracotta vessels, dishes-on-stand, and food offerings left at the head of the burial. Harappans placed authentic domestic pottery with their departed for the journey beyond.",
              })
            }
          >
            {isNearGravePottery ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Grave Pottery</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Grave Pottery Offerings</span>
              </div>
            )}
          </div>
        )}

        {/* Hotspot 2: Deceased Harappan Body inside Open Grave Pit (Enlarged and rotated to match grave pit angle) */}
        {scene === "harappa_cemetery" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-15"
            style={{ left: "23.2%", top: "54.0%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Excavated Rectangular Grave R37",
                title: "North-South Extended Burial • Cemetery R37",
                icon: "",
                text: "Excavations at Cemetery R37 reveal rectangular earthen pits oriented strictly North-South. The deceased lies extended on their back with head pointing North, accompanied by domestic pottery vessels and personal shell bangles.",
              })
            }
          >
            {isNearExcavatedGrave && (
              <div className="mb-1 bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Deceased & Grave Offerings</span>
              </div>
            )}
            <img
              src="/sprite-indus-deceased.png"
              alt="Deceased Harappan in Grave"
              className="h-[120px] sm:h-[145px] md:h-[170px] w-auto object-contain block select-none opacity-95 mix-blend-multiply transform -rotate-[28deg] pointer-events-auto"
            />
          </div>
        )}

        {/* Hotspot 3: Animated Crying Harappan Mourner sitting on ground facing RIGHT towards the body */}
        {scene === "harappa_cemetery" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-16"
            style={{ left: "11.5%", top: "56.0%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Grieving Harappan Family Member",
                title: "Crying Mourner • Cemetery R37",
                icon: "",
                text: "My heart aches for my lost kin... We lay them to rest in accordance with ancient Indus traditions, providing painted terracotta jars of clean water and grain so their spirit finds peace.",
              })
            }
          >
            {isNearExcavatedGrave && (
              <div className="mb-1 bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Console Crying Mourner</span>
              </div>
            )}
            <img
              src={`/sprite-indus-mourner-${mournerFrame}.png`}
              alt="Animated Crying Harappan Mourner"
              className="h-[85px] sm:h-[98px] md:h-[110px] w-auto object-contain block select-none transition-transform duration-200 group-hover:scale-105 mix-blend-multiply -scale-x-100"
            />
          </div>
        )}

        {/* Hotspot 4: Solemn Harappan Elder (Standing properly on ground at right side) */}
        {scene === "harappa_cemetery" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-16"
            style={{ left: "68.0%", top: "74.0%" }}
            onClick={() =>
              setActiveCitizenDialogue({
                name: "Harappan Solemn Funeral Observer",
                title: "Elder of Cemetery R37 • Harappa",
                icon: "",
                text: "Peace be with our ancestors. Unlike the grandiose pyramid tombs of Egypt or royal graves of Sumer, Harappans honored all citizens with dignified, uniform earthen burials and modest pottery offerings.",
              })
            }
          >
            {isNearSolemnElder && (
              <div className="mb-1 bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Speak with Solemn Elder</span>
              </div>
            )}
            <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow mb-1 whitespace-nowrap transition-opacity duration-200 ${
              isNearSolemnElder ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Solemn Elder
            </span>
            <img
              src="/sprite-indus-official.png?v=4"
              alt="Solemn Harappan Elder"
              className="h-[75px] sm:h-[84px] md:h-[94px] w-auto object-contain block select-none"
            />
          </div>
        )}

        {/* Cemetery R37 -> Upper Passage to Citadel Workshop */}
        {scene === "harappa_cemetery" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "58%", top: "22%" }}
            onClick={() => triggerTransition("priest_king_citadel", { x: 50.0, y: 80.0 }, 4, 600)}
          >
            {isNearCitadelPassage ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>✨ Passage to Citadel Workshop (Press E)</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Passage to Citadel Workshop</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* Stage 1.55: Central Domestic Courtyard Canvas Scene       */}
        {/* ========================================================= */}

        {/* Stage 1.55: House Courtyard -> Exit to Street Grid / Great Bath Trigger */}
        {scene === "house_courtyard" && isNearCourtyardExit && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "86%" }}
            onClick={() => {
              if (courtyardReturnScene === "great_bath_citadel") {
                triggerTransition("great_bath_citadel", { x: 68.0, y: 32.0 });
              } else {
                triggerTransition("residential_grid", { x: 80.0, y: 38.0 });
              }
            }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▼ [F] {courtyardReturnScene === "great_bath_citadel" ? "Exit to The Great Bath" : "Exit to Street Grid"}</span>
            </div>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Doorway to Latrine Room (Outside -> Enter E) */}
        {scene === "house_courtyard" && isNearCourtyardToiletDoor && !isInsideCourtyardToilet && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "38%", top: "54%" }}
            onClick={() => {
              setPlayerPos({ x: 26.0, y: 68.0 });
              soundFx.playSelect();
            }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▲ [E] Enter Latrine Room</span>
            </div>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Latrine Room (Inside -> Exit F) */}
        {scene === "house_courtyard" && isInsideCourtyardToilet && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "26%", top: "68%" }}
            onClick={() => {
              setPlayerPos({ x: 38.0, y: 58.0 });
              soundFx.playSelect();
            }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▼ [F] Exit to Courtyard</span>
            </div>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Doorway to Exit (Right door - Street Grid or Great Bath) */}
        {scene === "house_courtyard" && isNearCourtyardRightExitDoor && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "68%", top: "34%" }}
            onClick={() => {
              if (courtyardReturnScene === "great_bath_citadel") {
                triggerTransition("great_bath_citadel", { x: 68.0, y: 32.0 });
              } else {
                triggerTransition("residential_grid", { x: 48.0, y: 60.0 });
              }
            }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▼ [F] {courtyardReturnScene === "great_bath_citadel" ? "Exit to The Great Bath" : "Exit to Street Grid"}</span>
            </div>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Doorway to Ground Floor Interior Room (Left - Image 3) */}
        {scene === "house_courtyard" && isNearCourtyardLeftInteriorDoor && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "36%", top: "32%" }}
            onClick={() => triggerTransition("house_interior", { x: 50.0, y: 80.0 })}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▲ [E] Enter Interior Room</span>
            </div>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Doorway to Bath Room (Outside -> Enter E) */}
        {scene === "house_courtyard" && isNearCourtyardBathDoor && !isInsideCourtyardBath && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "58%", top: "74%" }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▲ [E] Enter Bath Room</span>
            </div>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Bath Room (Inside -> Exit F) */}
        {scene === "house_courtyard" && isInsideCourtyardBath && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "70%", top: "72%" }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▼ [F] Exit to Courtyard</span>
            </div>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Climb to Second Floor Trigger (At Top of Stairs) */}
        {scene === "house_courtyard" && isNearCourtyardToInterior && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "51%", top: "28%" }}
            onClick={() => triggerTransition("house_second_floor", { x: 50.0, y: 64.0 })}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▲ [E] Enter Second Floor</span>
            </div>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Enclosed Harappan Toilet & Wall Chute Hotspot (Left Room) */}
        {scene === "house_courtyard" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "21%", top: "68%" }}
            onClick={() => setShowCourtyardToiletModal(true)}
          >
            {isNearCourtyardToilet && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#38bdf8] text-[#f0f9ff] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Enclosed Brick Latrine</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#1b252b]/90 border-2 border-[#38bdf8] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#e0f2fe] bg-[#0c1a24]/90 px-1.5 py-0.5 rounded border border-[#38bdf8]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearCourtyardToilet ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Enclosed Brick Latrine & Chute
            </span>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Private Bathing Platform with Water Hotspot (Right Room) */}
        {scene === "house_courtyard" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "74%", top: "74%" }}
            onClick={() => setShowInteriorBathModal(true)}
          >
            {isNearCourtyardBath && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#38bdf8] text-[#f0f9ff] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Private Bath with Water</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#1b252b]/90 border-2 border-[#38bdf8] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#e0f2fe] bg-[#0c1a24]/90 px-1.5 py-0.5 rounded border border-[#38bdf8]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearCourtyardBath ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Private Bath & Water Drain
            </span>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Household Brick Well Hotspot */}
        {scene === "house_courtyard" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "51%", top: "45%" }}
            onClick={() => setShowCourtyardWellModal(true)}
          >
            {isNearCourtyardWell && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#38bdf8] text-[#f0f9ff] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Household Well</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#1b252b]/90 border-2 border-[#38bdf8] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#e0f2fe] bg-[#0c1a24]/90 px-1.5 py-0.5 rounded border border-[#38bdf8]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearCourtyardWell ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Household Brick Well
            </span>
          </div>
        )}

        {/* Stage 1.55: House Courtyard -> Brick Staircase to Upper Gallery */}
        {scene === "house_courtyard" && !isNearCourtyardToInterior && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "51%", top: "38%" }}
            onClick={() => setShowCourtyardStaircaseModal(true)}
          >
            {isNearCourtyardStaircase && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Staircase to Upper Story</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearCourtyardStaircase ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Staircase to Upper Story
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* Stage 1.6: Harappan Residence Interior Canvas Scene       */}
        {/* ========================================================= */}

        {/* Stage 1.6: House Interior -> Return to Courtyard Trigger */}
        {scene === "house_interior" && isNearHouseExit && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "86%" }}
            onClick={() => {
              const returnPos = lastCourtyardDoor === "left"
                ? { x: 36.0, y: 46.0 } // Left door (Image 3)
                : { x: 67.0, y: 54.0 }; // Right door (Image 1)
              triggerTransition("house_courtyard", returnPos);
            }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▼ [F] Exit to Courtyard</span>
            </div>
          </div>
        )}

        {/* Stage 1.6: House Interior -> Brick Staircase to Upper Floor Hotspot */}
        {scene === "house_interior" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "48%", top: "44%" }}
            onClick={() => setShowInteriorStaircaseModal(true)}
          >
            {isNearInteriorStaircase && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Brick Staircase</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearInteriorStaircase ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Staircase to Upper Floor
            </span>
          </div>
        )}

        {/* Stage 1.6: House Interior -> Traditional Woven Charpoy Bed Hotspot */}
        {scene === "house_interior" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "24%", top: "68%" }}
            onClick={() => setShowInteriorCharpoyModal(true)}
          >
            {isNearInteriorCharpoy && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Woven Charpoy Bed</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearInteriorCharpoy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Woven Charpoy Bed
            </span>
          </div>
        )}

        {/* Stage 1.6: House Interior -> Saddle Quern & Storage Jars Hotspot */}
        {scene === "house_interior" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "74%", top: "72%" }}
            onClick={() => setShowInteriorQuernModal(true)}
          >
            {isNearInteriorQuern && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Saddle Quern & Grain Jars</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearInteriorQuern ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Saddle Quern & Food Jars
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* Stage 1.56: Residential Second Floor & Upper Gallery Scene*/}
        {/* ========================================================= */}

        {/* Stage 1.56: Second Floor -> Return to Courtyard Trigger (Image 3) */}
        {scene === "house_second_floor" && isNearSecondFloorExit && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "72%" }}
            onClick={() => triggerTransition("house_courtyard", { x: 55.0, y: 26.0 })}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▼ [F] Descend to Courtyard</span>
            </div>
          </div>
        )}

        {/* Stage 1.56: Second Floor -> Upper Balustrade & Mohenjo-daro Avenue View Hotspot */}
        {scene === "house_second_floor" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "66%", top: "54%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Second Floor Rooftop Balustrade",
                title: "Harappan Upper Balustrade Overlooking Mohenjo-daro",
                icon: "",
                text: "Looking out from the second floor terrace across the residential avenue, you can see how the standardized baked-brick houses line the central stone-covered municipal drain. Cool afternoon winds from the Indus river sweep across the flat roofs, where families relax on charpoys and dry freshly dyed cotton.",
              });
              soundFx.playSelect();
            }}
          >
            {isNearSecondFloorGallery && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#38bdf8] text-[#f0f9ff] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Mohenjo-daro Avenue & Covered Drain</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#1b252b]/90 border-2 border-[#38bdf8] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#e0f2fe] bg-[#0c1a24]/90 px-1.5 py-0.5 rounded border border-[#38bdf8]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearSecondFloorGallery ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Avenue & Covered Drain View
            </span>
          </div>
        )}

        {/* Stage 1.56: Second Floor -> Rooftop Charpoy Sleeping Platform Hotspot */}
        {scene === "house_second_floor" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "22%", top: "50%" }}
            onClick={() => setShowInteriorCharpoyModal(true)}
          >
            {isNearSecondFloorCharpoy && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Rooftop Charpoy Bed</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearSecondFloorCharpoy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Rooftop Charpoy Bed
            </span>
          </div>
        )}

        {/* Stage 1.56: Second Floor -> Rooftop Storage & Quern Hotspot */}
        {scene === "house_second_floor" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "14%", top: "78%" }}
            onClick={() => setShowInteriorQuernModal(true)}
          >
            {isNearSecondFloorStorage && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Rooftop Grain Jars & Quern</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearSecondFloorStorage ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Rooftop Storage & Grain Jars
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* Stage 1.7: The Great Granary of Mohenjo-daro Canvas Scene */}
        {/* ========================================================= */}

        {/* Stage 1.7: Return to Residential Grid Trigger */}
        {scene === "granary_avenue" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "20%", top: "84%" }}
            onClick={() => triggerTransition("residential_grid", { x: 76.0, y: 38.0 })}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▼ [F] Return to Residential Grid</span>
            </div>
          </div>
        )}

        {/* Stage 1.7: Ascend to Citadel & Great Bath Trigger */}
        {scene === "granary_avenue" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "76%", top: "48%" }}
            onClick={() => triggerTransition("great_bath_citadel", { x: 50.0, y: 82.0 }, 2)}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▲ [E] Ascend to The Great Bath (Stage 2)</span>
            </div>
          </div>
        )}

        {/* Stage 1.7: Granary Grain Reserves & Baskets Hotspot */}
        {scene === "granary_avenue" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "34%", top: "62%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Harappan Granary Grain Reserves",
                title: "Barley & Emmer Wheat Storage • Mohenjo-daro",
                icon: "",
                text: "Heaps of freshly threshed barley and emmer wheat fill these woven reed baskets and burlap sacks! Notice how the brick platforms are elevated above the ground—warm, dry air circulates continuously through the subterranean vents to prevent rot and pest infestation.",
              });
              soundFx.playSelect();
            }}
          >
            {isNearGranaryWorker && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Grain Sacks & Baskets</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`text-[9px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearGranaryWorker ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Grain Sacks & Reserves
            </span>
          </div>
        )}

        {/* Stage 1.7: Granary Metrology Station Hotspot */}
        {scene === "granary_avenue" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "74%", top: "66%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Granary Metrology Station",
                title: "Standardized Chert Weights & Grain Registry",
                icon: "",
                text: "Every basket entering these rectangular bays is measured against standard binary chert cube weights. Centralized storage ensures that even during drought years or unpredictable Indus river floods, the civic granary guarantees food security for the entire population.",
              });
              soundFx.playSelect();
            }}
          >
            {isNearGranaryScribe && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Metrology Station</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className={`text-[9px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearGranaryScribe ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Metrology Registry
            </span>
          </div>
        )}

        {/* Stage 1.7: Subterranean Brick Air Ducts Hotspot */}
        {scene === "granary_avenue" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "46%", top: "69%" }}
            onClick={() => setShowGranaryDuctsModal(true)}
          >
            {isNearGranaryAirDucts && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Raised Brick Air Ducts</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <span className={`text-[9px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearGranaryAirDucts ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Raised Air Ducts
            </span>
          </div>
        )}

        {/* Stage 1.7: Elevated Loading Bays & Platforms Hotspot */}
        {scene === "granary_avenue" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "64%", top: "64%" }}
            onClick={() => setShowGranaryPlatformsModal(true)}
          >
            {isNearGranaryPlatforms && (
              <div className="mb-1.5 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-2.5 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Examine Grain Loading Bays</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#281c14]/90 border-2 border-[#d8a86a] flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-5 h-5 text-[#d8a86a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`text-[9px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-1.5 py-0.5 rounded border border-[#d8a86a]/60 shadow-md mt-0.5 whitespace-nowrap transition-opacity duration-200 ${
              isNearGranaryPlatforms ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              Rectangular Grain Bays
            </span>
          </div>
        )}

        {/* Stage 1.7: Granary Worker Unloading Grains from Bullock Cart 1 (At Ramp Base) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-13 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "81.5%", top: "71.0%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Dhanu the Granary Worker",
                title: "Bullock Cart Grain Handler • Mohenjo-daro Granary",
                icon: "",
                text: "Hup! Another wooden cart loaded with winter barley has arrived from the fertile alluvial fields along the Indus river. We carefully unload each heavy sack down to the staging ground, ready to be weighed and hauled up the wooden ramp to the ventilated loading platforms!",
              });
              soundFx.playSelect();
            }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 group-hover:scale-105">
              <div className="absolute bottom-full mb-1 flex flex-col items-center pointer-events-none">
                {isNearAnyGrainCart && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[10px] font-serif shadow-lg animate-bounce whitespace-nowrap pointer-events-auto">
                    <span className="text-[#d8a86a] font-bold mr-1">[G]</span>
                    <span>Speak with Grain Unloader</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearAnyGrainCart ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Unloading Grain Cart
                </span>
              </div>
              <img
                src={`/sprite-grain-cart-${grainWorkerFrame}.png?v=4`}
                alt="Harappan Laborer Unloading Grains from Cart"
                className="h-18 sm:h-20 md:h-[78px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        )}

        {/* Stage 1.7: Grain Cart 3 (Far Right Sunlit Yard) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-13 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "89.0%", top: "79.0%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Civic Grain Carter",
                title: "Municipal Grain Delivery • Mohenjo-daro",
                icon: "",
                text: "Barley sacks unloaded for the civic distribution guild! Porters will haul these sacks across to the weighing stations.",
              });
              soundFx.playSelect();
            }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 group-hover:scale-105">
              <img
                src={`/sprite-grain-cart-${grainWorkerFrame}.png?v=4`}
                alt="Unloading Grain Cart 3"
                className="h-18 sm:h-20 md:h-[78px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] -scale-x-100"
              />
            </div>
          </div>
        )}

        {/* Stage 1.7: Grain Cart 4 (Lower Central Dirt Avenue) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-14 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "57.0%", top: "96.0%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Alluvial Grain Carrier",
                title: "Rural Harvest Team • Indus Basin",
                icon: "",
                text: "Freshly winnowed grain brought directly from the eastern alluvial farms. We are storing these sacks in the cool arched ground-level depots!",
              });
              soundFx.playSelect();
            }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 group-hover:scale-105">
              <img
                src={`/sprite-grain-cart-${grainWorkerFrame}.png?v=4`}
                alt="Unloading Grain Cart 4"
                className="h-20 sm:h-22 md:h-[88px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        )}

        {/* Ground Porter 1 (Carrying sacks from Cart 1 to Ramp Staging) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-13 pointer-events-none select-none"
            style={{ left: `${groundWorker1Pos.x}%`, top: `${groundWorker1Pos.y}%` }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-100">
              <img
                src={
                  groundWorker1Pos.isCarrying
                    ? `/sprite-grain-carrier-${grainCarrierWalkFrame}.png`
                    : `/sprite-grain-carrier-empty-${grainCarrierWalkFrame}.png`
                }
                alt="Ground Porter 1"
                className={`h-18 sm:h-20 md:h-[78px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 ${
                  groundWorker1Pos.facingLeft ? "-scale-x-100" : "scale-x-100"
                }`}
              />
            </div>
          </div>
        )}

        {/* Deposited Ground Sack 1 at Ramp Staging */}
        {scene === "granary_avenue" && showGroundSack1 && (
          <div
            className="absolute z-12 pointer-events-none select-none transition-opacity duration-300"
            style={{ left: "86.8%", top: "76.2%" }}
          >
            <img
              src="/sprite-grain-sack.png"
              alt="Deposited Ground Sack 1"
              className="h-6 sm:h-7 md:h-[28px] w-auto object-contain block select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transform -translate-x-1/2 -translate-y-full"
            />
          </div>
        )}

        {/* Stage 1.7: Harappan Merchants Conversing in Dirt Yard (Clear of ladder & ramp on solid ground) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-12 pointer-events-auto cursor-pointer select-none group"
            style={{ left: "70.5%", top: "84.0%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Harappan Merchants (Weaver & Grain Overseer)",
                title: "Civic Distribution Guild • Mohenjo-daro",
                icon: "",
                text: "We are verifying the grain tallies for the city's craftspeople and municipal workers! Standardized binary chert weights ensure that every family and artisan receives their exact monthly ration of barley and sesame seeds directly from the state granary.",
              });
              soundFx.playSelect();
            }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 group-hover:scale-105">
              <div className="absolute bottom-full mb-1 flex flex-col items-center pointer-events-none">
                {isNearGranaryArtisans && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[10px] font-serif shadow-lg animate-bounce whitespace-nowrap pointer-events-auto">
                    <span className="text-[#d8a86a] font-bold mr-1">[G]</span>
                    <span>Speak with Grain Merchants</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearGranaryArtisans ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Grain Merchants
                </span>
              </div>
              <img
                src={`/sprite-artisans-talk-${talkingArtisansFrame}.png?v=2`}
                alt="Harappan Merchants Conversing"
                className="h-16 sm:h-18 md:h-[75px] w-auto object-contain block select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        )}

        {/* Stage 1.7: Grain Porter 1 (Midground Hall to Platform 2 on solid floor & ramp: carries grain, deposits, returns empty) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-11 pointer-events-auto cursor-pointer select-none group"
            style={{
              left: `${granaryWorker1Pos.x}%`,
              top: `${granaryWorker1Pos.y}%`,
            }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Harappan Grain Porter",
                title: "Granary Reserve Carrier • Mohenjo-daro",
                icon: "",
                text: "Step aside, friend! We are hauling sacks of harvested barley and emmer wheat from the cool storage chambers across to the distribution loading bays. The subterranean air ducts below keep the grain dry and fresh through every season!",
              });
              soundFx.playSelect();
            }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-100 group-hover:scale-105">
              <div className="absolute bottom-full mb-1 flex flex-col items-center pointer-events-none">
                {isNearAnyGranaryWorker && (
                  <div className="mb-0.5 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2 py-0.5 rounded text-[9px] font-serif shadow animate-bounce whitespace-nowrap pointer-events-auto">
                    <span className="text-[#d8a86a] font-bold mr-1">[G]</span>
                    <span>Speak with Porter</span>
                  </div>
                )}
                <span
                  className={`text-[9px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/85 px-1.5 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearAnyGranaryWorker ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Grain Porter
                </span>
              </div>
              <img
                src={
                  granaryWorker1Pos.isCarrying
                    ? `/sprite-grain-carrier-${grainCarrierWalkFrame}.png`
                    : `/sprite-grain-carrier-empty-${grainCarrierWalkFrame}.png`
                }
                alt="Grain Porter carrying sack"
                className={`h-18 sm:h-20 md:h-[78px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 ${
                  granaryWorker1Pos.facingLeft ? "-scale-x-100" : "scale-x-100"
                }`}
              />
            </div>
          </div>
        )}

        {/* Stage 1.7: Grain Porter 2 (Foreground Platform 1 solid flat deck: carries grain, deposits, returns empty) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-12 pointer-events-auto cursor-pointer select-none group"
            style={{
              left: `${granaryWorker2Pos.x}%`,
              top: `${granaryWorker2Pos.y}%`,
            }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Harappan Grain Porter",
                title: "Granary Reserve Carrier • Mohenjo-daro",
                icon: "",
                text: "Step aside, friend! We are hauling sacks of harvested barley and emmer wheat from the cool storage chambers across to the distribution loading bays. The subterranean air ducts below keep the grain dry and fresh through every season!",
              });
              soundFx.playSelect();
            }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-100 group-hover:scale-105">
              <img
                src={
                  granaryWorker2Pos.isCarrying
                    ? `/sprite-grain-carrier-${grainCarrierWalkFrame}.png`
                    : `/sprite-grain-carrier-empty-${grainCarrierWalkFrame}.png`
                }
                alt="Grain Porter carrying sack"
                className={`h-20 sm:h-22 md:h-[84px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 ${
                  granaryWorker2Pos.facingLeft ? "-scale-x-100" : "scale-x-100"
                }`}
              />
            </div>
          </div>
        )}

        {/* Stage 1.7: Deposited Grain Bag on Platform 2 (appears when Worker 1 deposits grain) */}
        {scene === "granary_avenue" && showDepositedSack1 && (
          <div
            className="absolute z-10 pointer-events-none select-none transition-opacity duration-300"
            style={{ left: "55.5%", top: "49.8%" }}
          >
            <img
              src="/sprite-grain-sack.png"
              alt="Deposited Grain Bag on Platform 2"
              className="h-6 sm:h-7 md:h-[28px] w-auto object-contain block select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transform -translate-x-1/2 -translate-y-full"
            />
          </div>
        )}

        {/* Stage 1.7: Deposited Grain Bag on Platform 1 (appears when Worker 2 deposits grain) */}
        {scene === "granary_avenue" && showDepositedSack2 && (
          <div
            className="absolute z-11 pointer-events-none select-none transition-opacity duration-300"
            style={{ left: "34.5%", top: "57.5%" }}
          >
            <img
              src="/sprite-grain-sack.png"
              alt="Deposited Grain Bag on Platform 1"
              className="h-7 sm:h-8 md:h-[32px] w-auto object-contain block select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transform -translate-x-1/2 -translate-y-full"
            />
          </div>
        )}

        {/* Stage 1.7: Grain Porter 3 (Back Colonnade Hall: moving backwards right-to-left) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-10 pointer-events-none select-none"
            style={{ left: `${granaryWorker3Pos.x}%`, top: `${granaryWorker3Pos.y}%` }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-100">
              <img
                src={
                  granaryWorker3Pos.isCarrying
                    ? `/sprite-grain-carrier-${grainCarrierWalkFrame}.png`
                    : `/sprite-grain-carrier-empty-${grainCarrierWalkFrame}.png`
                }
                alt="Grain Porter 3"
                className={`h-15 sm:h-17 md:h-[68px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 ${
                  granaryWorker3Pos.facingLeft ? "-scale-x-100" : "scale-x-100"
                }`}
              />
            </div>
          </div>
        )}

        {/* Deposited Sack on Back Colonnade */}
        {scene === "granary_avenue" && showDepositedSack3 && (
          <div
            className="absolute z-9 pointer-events-none select-none transition-opacity duration-300"
            style={{ left: "43.0%", top: "31.5%" }}
          >
            <img
              src="/sprite-grain-sack.png"
              alt="Deposited Grain Bag 3"
              className="h-5 sm:h-6 md:h-[24px] w-auto object-contain block select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transform -translate-x-1/2 -translate-y-full"
            />
          </div>
        )}

        {/* Stage 1.7: Grain Porter 4 (Upper Roof Flat Sand Terrace: user's marked RED area in Image 2) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-9 pointer-events-none select-none"
            style={{ left: `${granaryWorker4Pos.x}%`, top: `${granaryWorker4Pos.y}%` }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-100">
              <img
                src={
                  granaryWorker4Pos.isCarrying
                    ? `/sprite-grain-carrier-${grainCarrierWalkFrame}.png`
                    : `/sprite-grain-carrier-empty-${grainCarrierWalkFrame}.png`
                }
                alt="Grain Porter 4"
                className={`h-12 sm:h-14 md:h-[54px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 ${
                  granaryWorker4Pos.facingLeft ? "-scale-x-100" : "scale-x-100"
                }`}
              />
            </div>
          </div>
        )}

        {/* Deposited Sack on Upper Roof Flat Sand Terrace */}
        {scene === "granary_avenue" && showDepositedSack4 && (
          <div
            className="absolute z-9 pointer-events-none select-none transition-opacity duration-300"
            style={{ left: "80.5%", top: "33.2%" }}
          >
            <img
              src="/sprite-grain-sack.png"
              alt="Deposited Grain Bag 4"
              className="h-4 sm:h-5 md:h-[18px] w-auto object-contain block select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transform -translate-x-1/2 -translate-y-full"
            />
          </div>
        )}

        {/* Stage 1.7: Grain Porter 6 (Central Hall Aisle: walking from back to front along dirt floor as in Image 4) */}
        {scene === "granary_avenue" && (
          <div
            className="absolute z-11 pointer-events-none select-none"
            style={{ left: `${granaryWorker6Pos.x}%`, top: `${granaryWorker6Pos.y}%` }}
          >
            <div className="relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-100">
              <img
                src={
                  granaryWorker6Pos.isCarrying
                    ? `/sprite-grain-carrier-${grainCarrierWalkFrame}.png`
                    : `/sprite-grain-carrier-empty-${grainCarrierWalkFrame}.png`
                }
                alt="Grain Porter 6"
                className={`h-16 sm:h-18 md:h-[70px] w-auto object-contain block select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 ${
                  granaryWorker6Pos.facingLeft ? "-scale-x-100" : "scale-x-100"
                }`}
              />
            </div>
          </div>
        )}

        {/* Deposited Sack on Central Hall Aisle */}
        {scene === "granary_avenue" && showDepositedSack6 && (
          <div
            className="absolute z-10 pointer-events-none select-none transition-opacity duration-300"
            style={{ left: "40.5%", top: "48.5%" }}
          >
            <img
              src="/sprite-grain-sack.png"
              alt="Deposited Grain Bag 6"
              className="h-5 sm:h-6 md:h-[25px] w-auto object-contain block select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transform -translate-x-1/2 -translate-y-full"
            />
          </div>
        )}

        {/* Stage 2: Great Bath Hotspot */}
        {scene === "great_bath_citadel" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-12"
            style={{ left: "52%", top: "54%" }}
            onClick={() => {
              if (isDrainagePuzzleSolved) {
                setActiveCitizenDialogue({
                  name: "The Great Bath of Mohenjo-daro",
                  title: "Ritual Purification Basin",
                  icon: "",
                  text: "The monumental Great Bath pool measures approximately 12 by 7 meters with a depth of 2.4 meters. Lined with natural bitumen waterproofing and gypsum mortar between finely dressed bricks, it served as the sacred bathing sanctum of the ancient metropolis.",
                });
                soundFx.playSelect();
              } else {
                setShowDrainagePuzzleModal(true);
              }
            }}
          >
            {isNearGreatBathBasin && (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>
                  {isDrainagePuzzleSolved
                    ? "Inspect Restored Hydraulic Basin"
                    : "Restore Great Bath Drainage Culvert"}
                </span>
              </div>
            )}
            <div className="w-14 h-14 bg-[#231b14]/90 border-2 border-[#5dbcd2] rounded-2xl flex items-center justify-center shadow-lg group-hover:border-[#eedbbf] transition-all">
              <svg className="w-7 h-7 text-[#5dbcd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className="text-[10px] font-serif font-bold text-[#e6f7fa] bg-[#16110c]/85 px-2 py-0.5 rounded border border-[#376b75] mt-1 shadow-md">
              The Great Bath
            </span>
          </div>
        )}

        {/* Stage 2: East Colonnade to Artisan Quarter */}
        {scene === "great_bath_citadel" && isDrainagePuzzleSolved && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "82%", top: "52%" }}
            onClick={() => triggerTransition("steatite_seal_workshop", { x: 25.0, y: 72.0 }, 3)}
          >
            <div className="mb-1 bg-[#1b1510]/90 border-2 border-[#d8a86a] text-[#f7eedf] px-3 py-1 rounded-lg text-xs font-serif shadow-md animate-pulse whitespace-nowrap group-hover:bg-[#251d16] transition-colors">
              <span>► [E] Enter Steatite Artisan Quarter (Stage 3)</span>
            </div>
          </div>
        )}

        {/* Stage 2: Animated Potter entering Image 2 gate door and exiting Image 3 courtyard door (increased size, walking on ground) */}
        {scene === "great_bath_citadel" && (
          <div
            className="absolute pointer-events-auto cursor-pointer select-none group transition-opacity duration-300"
            style={{
              left: `${greatBathPotterState.x}%`,
              top: `${greatBathPotterState.y}%`,
              opacity: greatBathPotterState.opacity,
              transform: `scale(${greatBathPotterState.scale})`,
              transformOrigin: "bottom center",
              zIndex: Math.floor(greatBathPotterState.y) + 5,
            }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Harappan Master Potter",
                title: "Terracotta Artisan & Vessel Carrier • Mohenjo-daro",
                icon: "",
                text: "I transport wheel-thrown terracotta water jars, ritual lotas, and storage amphorae from the artisan kilns through the citadel gate into the Great Bath complex. Standardized pottery ensures pure ritual storage for the sacred bathing ablutions!",
              });
              soundFx.playSelect();
            }}
          >
            <div
              className={`relative flex flex-col items-center transform -translate-x-1/2 -translate-y-full transition-transform duration-200 ${
                greatBathPotterState.facingLeft ? "-scale-x-100" : "scale-x-100"
              }`}
            >
              <div
                className={`absolute bottom-full mb-1 flex flex-col items-center pointer-events-none ${
                  greatBathPotterState.facingLeft ? "-scale-x-100" : ""
                }`}
              >
                {isNearGreatBathPotter && (
                  <div className="mb-1 bg-[#1b1510]/95 border border-[#d8a86a] text-[#f7eedf] px-2.5 py-0.5 rounded text-[11px] font-serif shadow-lg animate-bounce flex items-center gap-1 whitespace-nowrap pointer-events-auto">
                    <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                    <span>Speak with Potter</span>
                  </div>
                )}
                <span
                  className={`text-[10px] font-serif font-bold text-[#f7eedf] bg-[#16110c]/90 px-2 py-0.5 rounded border border-[#d8a86a]/50 shadow whitespace-nowrap transition-opacity duration-200 ${
                    isNearGreatBathPotter ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  Master Potter
                </span>
              </div>
              <img
                src={`/sprite-pedestrian-walk-${carrierFrame}.png?v=2`}
                alt="Harappan Master Potter"
                className="h-[86px] sm:h-[94px] md:h-[100px] w-auto object-contain block select-none drop-shadow-[0_5px_12px_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>
        )}

        {/* Stage 2: Return to The Great Granary */}
        {scene === "great_bath_citadel" && isNearGreatBathGranaryReturn && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "92%" }}
            onClick={() => triggerTransition("granary_avenue", { x: 72.0, y: 52.0 })}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span>▼ [F] Return to The Great Granary</span>
            </div>
          </div>
        )}

        {/* Stage 2: Great Bath Citadel -> Upper Gate Doorway to The Caravan Road of the Harappan */}
        {scene === "great_bath_citadel" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "68%", top: "26%" }}
            onClick={() => {
              startLongTravelTransition("caravan_road", { x: 45.0, y: 84.0 }, 2, "HARAPPA");
            }}
          >
            {isNearGreatBathHarappanGate ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>Travel to Harappa</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Highway to Harappa</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* THE CARAVAN ROAD TO HARAPPA (SCENE INTERACTIONS)          */}
        {/* ========================================================= */}

        {/* Caravan Road: Single Zebu Bullock Cart on the Ancient Trade Highway */}
        {scene === "caravan_road" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-15"
            style={{ left: "45%", top: "66%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Harappan Bullock Cart",
                title: "Traditional Indus Valley Freight Transport",
                icon: "",
                text: "A solid-wheeled wooden ox cart harnessed to a pair of humped zebu oxen, laden with terracotta storage jars, woven grain sacks, and trade goods along the post-noon highway to Harappa.",
              });
              soundFx.playSelect();
            }}
          >
            {isNearCaravanCart && (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Bullock Cart</span>
              </div>
            )}
            <div className="px-2.5 py-0.5 rounded bg-[#16110c]/85 border border-[#d8a86a]/60 text-[#f7eedf] text-[10px] font-serif font-bold shadow-md">
              Zebu Bullock Cart
            </div>
          </div>
        )}

        {/* Caravan Road: Enter Harappa City Gates (Forward passage to Stage 3) */}
        {scene === "caravan_road" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "85%", top: "23%" }}
            onClick={() => triggerTransition("steatite_seal_workshop", { x: 20.0, y: 38.0 }, 3, 600)}
          >
            {isNearCaravanRoadHarappaGate ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>Enter Harappa City Gates (Stage 3)</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Harappa City Gates</span>
              </div>
            )}
          </div>
        )}

        {/* Caravan Road: Southbound return to The Great Bath */}
        {scene === "caravan_road" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "15%", top: "92%" }}
            onClick={() => triggerTransition("great_bath_citadel", { x: 68.0, y: 32.0 }, 2, 600)}
          >
            {isNearCaravanRoadReturn ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">F</div>
                <span>Return to The Great Bath</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Return South toward Mohenjo-daro</span>
              </div>
            )}
          </div>
        )}

        {/* Stage 3: Harappan Terracotta Toy Workshop & Stalls */}
        {scene === "steatite_seal_workshop" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-15"
            style={{ left: "18%", top: "72%" }}
            onClick={() => {
              setActiveCitizenDialogue({
                name: "Harappan Toy Craftsman",
                title: "Master Artisan of Clay Figurines & Wheeled Toys • Harappa",
                icon: "",
                text: "Welcome to Harappa's toy workshop! Along this street, we hand-craft solid-wheeled toy bullock carts, whistling terracotta birds, climbing monkeys, and humped zebu oxen from fine river clay. Standardized toys and artisan goods travel across the entire Indus valley!",
              });
              soundFx.playSelect();
            }}
          >
            {isNearSealBench && (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
                <span>Inspect Terracotta Toy Stalls</span>
              </div>
            )}
            <div className="px-2.5 py-0.5 rounded bg-[#16110c]/85 border border-[#d8a86a]/60 text-[#f7eedf] text-[10px] font-serif font-bold shadow-md">
              Terracotta Toy Workshop
            </div>
          </div>
        )}

        {/* Harappa Toy Workshop: Archway Way to Go Back to Caravan Road */}
        {scene === "steatite_seal_workshop" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "14%", top: "28%" }}
            onClick={() => triggerTransition("caravan_road", { x: 80.0, y: 32.0 }, undefined, 600)}
          >
            {isNearHarappaExitArchway ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">F</div>
                <span>Return to Caravan Road</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Exit Archway (Back to Caravan Road)</span>
              </div>
            )}
          </div>
        )}

        {/* Stage 3: Avenue to Citadel Platform */}
        {scene === "steatite_seal_workshop" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "88%", top: "22%" }}
            onClick={() => triggerTransition("priest_king_citadel", { x: 50.0, y: 80.0 }, 4, 600)}
          >
            {isNearCitadelStairs ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>Ascend to Citadel Platform (Stage 4)</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Citadel Platform</span>
              </div>
            )}
          </div>
        )}

        {/* Harappa Toy Workshop: Entrance from the Street */}
        {scene === "steatite_seal_workshop" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "42%", top: "50%" }}
            onClick={() => triggerTransition("priest_king_citadel", { x: 50.0, y: 80.0 }, 4, 600)}
          >
            {isNearWorkshopEntrance ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>Enter Toy Workshop</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Toy Workshop Entrance</span>
              </div>
            )}
          </div>
        )}

        {/* Harappa Toy Street: Entrance to Harappan Residential Area */}
        {scene === "steatite_seal_workshop" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "64%", top: "50%" }}
            onClick={() => triggerTransition("residential_grid", { x: 50.0, y: 80.0 }, 3, 600)}
          >
            {isNearResidentialAreaEntrance ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>✨ Enter Residential Area (Press E)</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>✨ Harappan Residential Area</span>
              </div>
            )}
          </div>
        )}

        {/* Stage 4: Priest-King Hotspot */}
        {scene === "priest_king_citadel" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "52%", top: "62%" }}
          >
            {isNearPriestKing && (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>
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

        {/* Harappa Toy Workshop Interior: Exit back to Market Street */}
        {scene === "priest_king_citadel" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "92%" }}
            onClick={() => triggerTransition("steatite_seal_workshop", { x: 50.0, y: 65.0 }, 3, 600)}
          >
            {isNearWorkshopExit ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">F</div>
                <span>Return to Toy Market Street</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Exit Workshop (Back to Street)</span>
              </div>
            )}
          </div>
        )}

        {/* --- CARNELIAN BEAD QUARTER ENDPOINTS --- */}
        {scene === "steatite_seal_workshop" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "92%", top: "60%" }}
            onClick={() => triggerTransition("carnelian_bead_quarter", { x: 30.0, y: 70.0 }, 3, 600)}
          >
            {isNearBeadQuarterEntrance ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>To Carnelian Bead Quarter</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Carnelian Bead Quarter</span>
              </div>
            )}
          </div>
        )}

        {scene === "carnelian_bead_quarter" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "8%", top: "60%" }}
            onClick={() => triggerTransition("steatite_seal_workshop", { x: 80.0, y: 60.0 }, 3, 600)}
          >
            {isNearBeadQuarterExit ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">F</div>
                <span>Return to Artisan Street</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Back to Artisan Street</span>
              </div>
            )}
          </div>
        )}

        {/* --- DRAINAGE CULVERT ENDPOINTS --- */}
        {scene === "great_bath_citadel" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "45%" }}
            onClick={() => triggerTransition("drainage_culvert", { x: 50.0, y: 50.0 }, 2, 600)}
          >
            {isNearDrainageEntrance ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>Enter Drainage Culvert</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Drainage Culvert</span>
              </div>
            )}
          </div>
        )}

        {scene === "drainage_culvert" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "90%" }}
            onClick={() => triggerTransition("great_bath_citadel", { x: 50.0, y: 65.0 }, 2, 600)}
          >
            {isNearDrainageExit ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">F</div>
                <span>Return to Great Bath</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Exit Culvert</span>
              </div>
            )}
          </div>
        )}

        {/* --- CLOSING REFLECTION ENDPOINTS --- */}
        {scene === "carnelian_bead_quarter" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "92%", top: "60%" }}
            onClick={() => triggerTransition("closing_reflection", { x: 50.0, y: 60.0 }, 4, 600)}
          >
            {isNearSunsetReflection ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>Conclude Journey</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Closing Reflection</span>
              </div>
            )}
          </div>
        )}

        {scene === "closing_reflection" && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none group z-20"
            style={{ left: "50%", top: "90%" }}
            onClick={() => triggerTransition("carnelian_bead_quarter", { x: 80.0, y: 60.0 }, 3, 600)}
          >
            {isNearSunsetExit ? (
              <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">F</div>
                <span>Return to City</span>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1b1510]/90 border border-[#d8a86a]/60 text-[#f7eedf] px-2.5 py-1 rounded text-[11px] font-serif shadow-md whitespace-nowrap">
                <span>Return to City</span>
              </div>
            )}
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

      {/* ========================================================= */}
      {/* INDUS VALLEY TRAVEL LOADING SCREEN (BULLOCK CART)         */}
      {/* ========================================================= */}
      {isLoadingToHarappa && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#18110a] text-white transition-opacity duration-300 overflow-hidden select-none animate-fade-in">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/bg-indus-travel-loading.jpg")' }}
          />
          {/* Subtle warm atmospheric vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#150e08]/90 via-black/20 to-[#150e08]/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#150e08]/40 via-transparent to-[#150e08]/40" />

          {/* Top Travel Banner: LOADING TO {travelDestinationName} */}
          <div className="absolute top-6 px-7 py-2.5 rounded-2xl bg-[#1b120a]/92 border-2 border-[#d8a86a] text-[#f7eedf] shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <div className="flex flex-col items-center">
              <span className="tracking-widest font-serif font-black text-sm sm:text-base text-amber-300 uppercase drop-shadow">
                LOADING TO {travelDestinationName}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#eed7ba] font-serif tracking-wider">
                Traveling by Zebu Bullock Cart • Ancient Trade Route c. 2500 BCE
              </span>
            </div>
          </div>

          {/* Bottom Historical Note & Animated Progress Bar */}
          <div className="absolute bottom-6 w-full max-w-xl mx-4 p-4 rounded-xl bg-[#1b120a]/92 border border-[#d8a86a]/80 text-center shadow-2xl backdrop-blur-md flex flex-col items-center gap-3">
            {/* Travel stage status & percentage */}
            <div className="w-full flex items-center justify-between text-xs font-serif text-[#f7eedf] px-1">
              <span className="text-[#d8a86a] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {harappaTravelProgress < 25 && "Preparing the Zebu Bullock Caravan..."}
                {harappaTravelProgress >= 25 && harappaTravelProgress < 55 && "Rolling along the ancient northern trade highway..."}
                {harappaTravelProgress >= 55 && harappaTravelProgress < 85 && "Approaching the monumental brick ramparts of Harappa..."}
                {harappaTravelProgress >= 85 && "Entering Harappa's ancient artisan quarters..."}
              </span>
              <span className="font-mono text-amber-300 font-bold text-sm drop-shadow">{harappaTravelProgress}%</span>
            </div>

            {/* Custom animated progress bar */}
            <div className="w-full h-3.5 bg-[#2d1e12] rounded-full overflow-hidden border border-[#d8a86a]/60 shadow-inner relative p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 via-[#d8a86a] to-amber-300 transition-all duration-75 relative overflow-hidden shadow-lg"
                style={{ width: `${harappaTravelProgress}%` }}
              >
                {/* Glowing traveling head */}
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 rounded-full blur-[2px] animate-pulse" />
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-[#eed7ba] font-serif leading-relaxed">
              Solid-wheeled wooden bullock carts pulled by humped zebu oxen were the essential freight and passenger transport of the Indus Civilization, journeying between Mohenjo-daro and Harappa.
            </p>
          </div>
        </div>
      )}

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
        isTransitioning={isTransitioning || isLoadingToHarappa}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#fffdf5] text-black rounded-2xl border-[4px] border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b-[3px] border-black mb-5 gap-4">
              <div className="flex flex-col">
                <h3 className="text-3xl font-black tracking-wide uppercase">
                  Overseer Somnath
                </h3>
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mt-1">
                  Chief Architect of the Lower Town · Mohenjo-daro
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  onClick={() => setShowOverseerDialogue(false)}
                  className="bg-white border-[3px] border-black rounded-xl px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Esc · leave
                </button>
              </div>
            </div>

            <div className="bg-white border-[2px] border-gray-300 rounded-xl p-5 mb-5 text-sm font-bold leading-relaxed shadow-sm space-y-3">
              <p>
                &ldquo;Welcome, traveler, to the riverside ghat of Mohenjo-daro on the great Indus river!&rdquo;
              </p>
              <p className="text-gray-600">
                &ldquo;All cargo arriving on these riverboats must be inspected here at our raised checkpoint platform. Notice how our city walls and avenues cross at exact ninety-degree angles. Every baked brick in this city adheres to the sacred ratio: 1 thickness to 2 width to 4 length. Under this law of proportion, our foundations endure seasonal inundations without buckling.&rdquo;
              </p>
              <p className="italic text-gray-800">
                &ldquo;Take this polished chert cube. Our binary balance weights are recognized in every market from Gujarat to ancient Mesopotamia. The city gate behind me is now open to Mohenjo-daro&apos;s residential grid!&rdquo;
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                Relic I: Polished Chert Binary Weight Secured
              </div>
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
                className="w-full text-left bg-white border-[3px] border-black rounded-xl px-5 py-4 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center"
              >
                <span className="text-[#c85a17] mr-3 text-lg">1.</span> Accept Chert Weight & Open City Gate
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

      {/* --- STAGE 1.55 CENTRAL COURTYARD: ENCLOSED BRICK TOILET MODAL --- */}
      {showCourtyardToiletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#38bdf8] p-6 shadow-[0_0_50px_rgba(56,189,248,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1e293b] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0f172a] border-2 border-[#38bdf8] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest">
                    Harappan Hydraulic & Sanitation Engineering • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#f0f9ff]">
                    Enclosed Brick Flush Toilet & Wall Drainage Chute
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowCourtyardToiletModal(false)}
                className="text-[#94a3b8] hover:text-[#f8fafc] text-sm bg-[#1e293b] hover:bg-[#334155] border border-[#475569] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] text-sm font-serif leading-relaxed text-[#cbd5e1] mb-5 space-y-3">
              <p className="font-bold text-[#38bdf8]">
                &ldquo;Over 4,500 years ago, Mohenjo-daro pioneered the world&apos;s earliest private enclosed flush latrines, built entirely of baked mud bricks.&rdquo;
              </p>
              <p className="text-xs text-[#94a3b8]">
                As uncovered in archaeological excavations and preserved in museum reconstructions, each Harappan toilet was enclosed in a private brick stall. Two sturdy brick side piers flanked a raised horizontal bench seat constructed of kiln-fired bricks with a central aperture.
              </p>
              <p className="text-xs text-[#38bdf8]">
                Water stored in clay jars was poured to flush effluent downward into a steeply sloped brick chute running through the exterior wall. From there, waste emptied directly into the covered municipal stone street drain or a perforated soak-pit outside, ensuring odorless, sanitary domestic life.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
              <span className="text-[10px] font-mono text-[#64748b]">
                Journal Entry: Enclosed Flush Toilets & Wall Chutes
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowCourtyardToiletModal(false);
                  setHasInspectedCourtyardToilet(true);
                  if (!unlockedJournalEntries.includes("harappan_closed_toilet")) {
                    setUnlockedJournalEntries((prev) => [...prev, "harappan_closed_toilet"]);
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

      {/* --- STAGE 1.55 CENTRAL COURTYARD: HOUSEHOLD WELL MODAL --- */}
      {showCourtyardWellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#38bdf8] p-6 shadow-[0_0_50px_rgba(56,189,248,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1e293b] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0f172a] border-2 border-[#38bdf8] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest">
                    Domestic Hydrology • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#f0f9ff]">
                    Household Brick Well & Wedge Brick Architecture
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowCourtyardWellModal(false)}
                className="text-[#94a3b8] hover:text-[#f8fafc] text-sm bg-[#1e293b] hover:bg-[#334155] border border-[#475569] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] text-sm font-serif leading-relaxed text-[#cbd5e1] mb-5 space-y-3">
              <p className="font-bold text-[#38bdf8]">
                &ldquo;Over 700 brick wells across Mohenjo-daro ensured independent clean groundwater for every domestic courtyard.&rdquo;
              </p>
              <p className="text-xs text-[#94a3b8]">
                Indus well builders crafted specially shaped trapezoidal (wedge-shaped) baked bricks. When placed in a ring, the narrower inner edges wedged tightly against one another under the lateral pressure of the surrounding earth, preventing the well cylinder from ever collapsing.
              </p>
              <p className="text-xs text-[#38bdf8]">
                Ropes and pulleys mounted over wooden crossbeams allowed residents to draw fresh water into terracotta jars for drinking, cooking, and daily bathing.
              </p>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => {
                  setShowCourtyardWellModal(false);
                  soundFx.playClueFound();
                }}
                className="bg-gradient-to-r from-[#0284c7] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0284c7] text-[#081521] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 1.55 CENTRAL COURTYARD: STAIRCASE MODAL --- */}
      {showCourtyardStaircaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                    Harappan Domestic Architecture • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Courtyard Staircase & Upper Gallery
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowCourtyardStaircaseModal(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-3">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;Standardized two-story residences with thick load-bearing brick walls, upper sleeping rooms, and flat rooftop terraces.&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                Twin brick stairways framed by timber balustrades ascended from the open-air courtyard to the second-floor gallery and roof terrace. Thick baked-brick walls kept the interior bedrooms insulated and cool through Sindh&apos;s intense daytime heat.
              </p>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#3e2e1f]">
              <button
                type="button"
                onClick={() => {
                  setShowCourtyardStaircaseModal(false);
                  soundFx.playClueFound();
                }}
                className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 1.6 HOUSE INTERIOR: BRICK STAIRCASE MODAL --- */}
      {showInteriorStaircaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                    Harappan Domestic Architecture • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Staircase to Upper Story & Roof Terrace
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowInteriorStaircaseModal(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-3">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;Standardized two-story residences with thick load-bearing brick walls and flat rooftop terraces.&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                Archaeological digs across Mohenjo-daro consistently revealed massive brick foundations and recessed wooden beam sockets engineered specifically to support a second floor. The ground floor housed grain storage, private bathing, and daily work, while upper rooms offered quiet, cool sleeping quarters away from street dust.
              </p>
              <p className="text-xs text-[#d8a86a]">
                The sturdy brick staircase led all the way to the flat rooftop. In the blistering summers of Sindh, families slept on the roof terrace to catch the cool night breeze, and used the sunlit terrace by day for spinning cotton, drying wheat grains, and preparing pottery.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
              <span className="text-[10px] font-mono text-[#a8947d]">
                Journal Entry: The Cardinal Grid & Insulae
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowInteriorStaircaseModal(false);
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

      {/* --- STAGE 1.6 HOUSE INTERIOR: WOVEN CHARPOY BED MODAL --- */}
      {showInteriorCharpoyModal && (
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
                    Harappan Woodcraft & Domestic Comfort • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Traditional Woven Charpoy Bedstead
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowInteriorCharpoyModal(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-3">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;Lightweight timber bedsteads woven with natural coir and hemp rope provided cool, elevated comfort off the baked brick floor.&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                Terracotta miniature models and preserved joinery from Indus excavations reveal that Harappan carpenters fashioned wooden charpoy frames with four turned legs and mortise-and-tenon joints.
              </p>
              <p className="text-xs text-[#d8a86a]">
                The bed was strung with breathable rope webbing and dressed with woven reed mats, woven cotton blankets, and soft bolsters. Because of its light wooden construction, families could easily carry the charpoy up the brick staircase to sleep under the starlit sky on the roof terrace during warm summer nights.
              </p>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#3e2e1f]">
              <button
                type="button"
                onClick={() => {
                  setShowInteriorCharpoyModal(false);
                  soundFx.playClueFound();
                }}
                className="bg-gradient-to-r from-[#9e733b] to-[#d8a86a] hover:from-[#b58545] hover:to-[#eec085] text-[#140f0b] font-serif font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 1.6 HOUSE INTERIOR: PRIVATE BATH & DRAIN MODAL --- */}
      {showInteriorBathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#38bdf8] p-6 shadow-[0_0_50px_rgba(56,189,248,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1e293b] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0f172a] border-2 border-[#38bdf8] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest">
                    Domestic Sanitation Engineering • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#f0f9ff]">
                    Private Brick Bathing Platform & Wall Drain
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowInteriorBathModal(false)}
                className="text-[#94a3b8] hover:text-[#f8fafc] text-sm bg-[#1e293b] hover:bg-[#334155] border border-[#475569] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] text-sm font-serif leading-relaxed text-[#cbd5e1] mb-5 space-y-3">
              <p className="font-bold text-[#38bdf8]">
                &ldquo;Nearly every private home had its own waterproof brick bathroom connected directly to municipal street drains.&rdquo;
              </p>
              <p className="text-xs text-[#94a3b8]">
                The bathing area was paved with finely-rubbed, tightly-fitted baked bricks with a gentle slope towards the corner drain. This waterproof brick basin ensured that water never pooled or rotted the house foundation.
              </p>
              <p className="text-xs text-[#38bdf8]">
                Wastewater flowed through an earthenware pipe built directly inside the exterior house wall, discharging cleanly into the covered municipal stone drain running outside. This level of domestic hygiene and municipal infrastructure remained unmatched anywhere in the ancient world for millennia.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
              <span className="text-[10px] font-mono text-[#64748b]">
                Journal Entry: Covered Municipal Drains
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowInteriorBathModal(false);
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

      {/* --- STAGE 1.6 HOUSE INTERIOR: SADDLE QUERN & GRAIN JARS MODAL --- */}
      {showInteriorQuernModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                    Harappan Domestic Life & Diet • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Saddle Quern & Terracotta Grain Storage Jars
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowInteriorQuernModal(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-3">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;Hard quartzite grinding stones and painted storage amphorae formed the hearth of daily Indus sustenance.&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                The saddle quern (a curved stone base with a cylindrical muller/roller) was an essential tool in every kitchen. Household cooks ground harvested emmer wheat, barley, and lentils into fine flour to prepare daily flatbreads over clay hearths.
              </p>
              <p className="text-xs text-[#d8a86a]">
                Large painted earthenware vessels with black slip motifs held grain, sesame oil, and clean water drawn from neighborhood wells. Clay oil lamps set into wall alcoves provided gentle illumination during evening family gatherings.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
              <span className="text-[10px] font-mono text-[#a8947d]">
                Journal Entry: Universal 1:2:4 Baked Brick Ratio
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowInteriorQuernModal(false);
                  if (!unlockedJournalEntries.includes("standard_brick_ratio")) {
                    setUnlockedJournalEntries((prev) => [...prev, "standard_brick_ratio"]);
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

      {/* --- STAGE 1.7 THE GREAT GRANARY AIR DUCTS MODAL --- */}
      {showGranaryDuctsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                    Harappan Ventilation Engineering • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Subterranean Air Ducts & High Brick Vents
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowGranaryDuctsModal(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-3">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;Ingenious air channels beneath the floorboards protected harvested grain from moisture rot and mold.&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                The real Great Granary of Mohenjo-daro was constructed upon a high, elevated brick podium with rows of deep subterranean air ducts running between each storage platform. In the humid river climate of the Indus floodplains, moisture was the primary enemy of grain storage.
              </p>
              <p className="text-xs text-[#d8a86a]">
                Warm, dusty daylight poured into the bays through high brick vents set into the upper walls. These vents allowed dry breezes to circulate continuously under the wooden floorboards, keeping tens of thousands of grain bushels dry, cool, and safe from insect infestation throughout the year.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
              <span className="text-[10px] font-mono text-[#a8947d]">
                Journal Entry: The Great Granary & Subterranean Air Ducts
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowGranaryDuctsModal(false);
                  setHasInspectedGranaryDucts(true);
                  if (!unlockedJournalEntries.includes("great_granary_reserves")) {
                    setUnlockedJournalEntries((prev) => [...prev, "great_granary_reserves"]);
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

      {/* --- STAGE 1.7 THE GREAT GRANARY LOADING PLATFORMS MODAL --- */}
      {showGranaryPlatformsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#1c1611] text-[#f4ebd9] rounded-2xl border-4 border-[#c29357] p-6 shadow-[0_0_50px_rgba(194,147,87,0.35)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#54412e] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2e2319] border-2 border-[#c29357] flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-[#c29357]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#c29357] uppercase tracking-widest">
                    Civic Planning & Metrology • Mohenjo-daro
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#fdfaf3]">
                    Rectangular Loading Bays & Food Security
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowGranaryPlatformsModal(false)}
                className="text-[#a4917b] hover:text-[#fdfaf3] text-sm bg-[#2e2319] hover:bg-[#423223] border border-[#6b533a] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#281f16] border border-[#4d3a28] text-sm font-serif leading-relaxed text-[#eedbbf] mb-5 space-y-3">
              <p className="font-bold text-[#d8a86a]">
                &ldquo;Centralized surplus grain storage ensured civic stability and famine prevention across the Indus realm.&rdquo;
              </p>
              <p className="text-xs text-[#c9b7a1]">
                The structure was partitioned into 27 rectangular baked-brick platforms arranged in neat rows. Wooden ramps led up to each bay, enabling porters and ox-cart handlers to move heavy sacks of barley and wheat directly into the building from the lower river quays.
              </p>
              <p className="text-xs text-[#d8a86a]">
                To historians, this granary represents undeniable evidence of municipal food security and centralized governance. Mohenjo-daro stored collective surplus to feed specialized craftspeople (bead-makers, seal-carvers, coppersmiths) and guarantee sustenance during bad harvests, without relying on militarized conquest.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e2e1f]">
              <span className="text-[10px] font-mono text-[#a8947d]">
                Journal Entry: The Great Granary & Subterranean Air Ducts
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowGranaryPlatformsModal(false);
                  setHasInspectedGranaryPlatforms(true);
                  if (!unlockedJournalEntries.includes("great_granary_reserves")) {
                    setUnlockedJournalEntries((prev) => [...prev, "great_granary_reserves"]);
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

      {activeCitizenDialogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#fffdf5] text-black rounded-2xl border-[4px] border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b-[3px] border-black mb-5 gap-4">
              <div className="flex flex-col">
                <h3 className="text-3xl font-black tracking-wide uppercase">
                  {activeCitizenDialogue.name}
                </h3>
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mt-1">
                  {activeCitizenDialogue.title}
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  onClick={() => setActiveCitizenDialogue(null)}
                  className="bg-white border-[3px] border-black rounded-xl px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Esc · leave
                </button>
              </div>
            </div>

            <div className="bg-white border-[2px] border-gray-300 rounded-xl p-5 mb-5 text-sm font-bold leading-relaxed shadow-sm">
              &ldquo;{activeCitizenDialogue.text}&rdquo;
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setActiveCitizenDialogue(null)}
                className="w-full text-left bg-white border-[3px] border-black rounded-xl px-5 py-4 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center"
              >
                <span className="text-[#c85a17] mr-3 text-lg">1.</span> Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 4 PRIEST-KING DIALOGUE MODAL --- */}
      {showPriestKingDialogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#fffdf5] text-black rounded-2xl border-[4px] border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b-[3px] border-black mb-5 gap-4">
              <div className="flex flex-col">
                <h3 className="text-3xl font-black tracking-wide uppercase">
                  The Priest-King
                </h3>
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mt-1">
                  Spiritual Dignitary of the Citadel · Mohenjo-daro
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  onClick={() => setShowPriestKingDialogue(false)}
                  className="bg-white border-[3px] border-black rounded-xl px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Esc · leave
                </button>
              </div>
            </div>

            <div className="bg-white border-[2px] border-gray-300 rounded-xl p-5 mb-5 text-sm font-bold leading-relaxed shadow-sm space-y-3">
              <p>
                &ldquo;You have traced the full lifeblood of our civilisation, seeker.&rdquo;
              </p>
              <p className="text-gray-600">
                &ldquo;You began in the quiet streets of the Lower Town where standard bricks form peaceful homes. You purified the waters of the Great Bath using bitumen culverts. You aligned the Unicorn seal that brands our ships sailing to Meluhha.&rdquo;
              </p>
              <p className="italic text-gray-800">
                &ldquo;Unlike realms built upon conquest, our civilization stands on civic harmony, craftsmanship, and hydraulic mastery. Accept this lost-wax cast Bronze Dancing Girl - the immortal embodiment of Harappan artistic spirit.&rdquo;
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                Supreme Cultural Relic: Bronze Dancing Girl (cire perdue)
              </div>
              <button
                type="button"
                onClick={handlePriestKingBlessing}
                className="w-full text-left bg-white border-[3px] border-black rounded-xl px-5 py-4 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center"
              >
                <span className="text-[#c85a17] mr-3 text-lg">1.</span> Receive Bronze Dancing Girl
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

export default function IndusValleyGameScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#140f0b] text-[#f7eedf] flex items-center justify-center font-serif text-2xl tracking-widest uppercase">Entering Indus Valley...</div>}>
      <IndusValleyGameComponent />
    </Suspense>
  );
}
