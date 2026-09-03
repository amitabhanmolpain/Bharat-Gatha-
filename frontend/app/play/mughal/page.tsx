"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DialoguePanel from "../../components/DialoguePanel";
import { playNarration, stopNarration } from "../../../services/narratorService";
import { playCharacterDialogue, stopCharacterDialogue } from "../../../services/characterVoiceService";
import NarratorSubtitle from "../../../components/NarratorSubtitle";
import CluesModal, { MUGHAL_HISTORICAL_CLUES } from "./components/CluesModal";
import PietraDuraPuzzleModal from "./components/PietraDuraPuzzleModal";
import SheeshMirrorReflectionModal from "./components/SheeshMirrorReflectionModal";
import KhasMahalPermissionModal from "./components/KhasMahalPermissionModal";
import { soundFx } from "../../../services/soundService";
import { recordGameWinToDatabase, fetchUserWinsFromDatabase, fetchSolvedStatusFromDatabase } from "../../../services/gameProgressService";

export type SceneType =
  | "gate"
  | "passage"
  | "courtyard"
  | "interior"
  | "sheesh_passage"
  | "sheesh_mahal"
  | "brown_passage"
  | "khas_mahal"
  | "taj_gate"
  | "taj_charbagh"
  | "taj_exterior"
  | "taj_mausoleum"
  | "taj_mehtab_bagh"
  | "red_fort_lahori"
  | "red_fort_plaza"
  | "red_fort_interior"
  | "red_fort_diwani_khas"
  | "red_fort_rang_mahal"
  | "red_fort_corridor";

export default function MughalGameScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [scene, setScene] = useState<SceneType>("gate");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 85 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);
  const [showDialogue, setShowDialogue] = useState(false);
  const [showJollyDialogue, setShowJollyDialogue] = useState(false);
  const [showThroneScroll, setShowThroneScroll] = useState(false);
  const [showMirrorModal, setShowMirrorModal] = useState(false);
  const [showKhasModal, setShowKhasModal] = useState(false);
  const [cluesFound, setCluesFound] = useState(0);
  const [guardAttempts, setGuardAttempts] = useState(0);
  const [hasGuardPermission, setHasGuardPermission] = useState(false);
  const hasGuardPermissionRef = useRef(false);

  // Dynamic Historical Clues & Silent Timer state
  const [discoveredClueIds, setDiscoveredClueIds] = useState<string[]>([]);
  const [showCluesModal, setShowCluesModal] = useState(false);
  const [clueNotification, setClueNotification] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerVisible, setIsTimerVisible] = useState(false);

  // Dynamic Guard Punishment / Retribution Screen state
  const [punishmentState, setPunishmentState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    description: string;
  }>({
    isOpen: false,
    title: "Punished at Amar Singh Gate",
    subtitle: "THE TRESPASS",
    description: "You attempted to sneak past the Amar Singh Gate without sentry clearance. The royal guards seize you immediately, inflicting harsh imperial punishment before casting you back down the ramparts."
  });

  // Discover clue helper
  const discoverClue = (clueId: string) => {
    setDiscoveredClueIds((prev) => {
      if (prev.includes(clueId)) return prev;
      const next = [...prev, clueId];
      setCluesFound(next.length);
      soundFx.playClueChime();
      const clue = MUGHAL_HISTORICAL_CLUES.find((c) => c.id === clueId);
      if (clue) {
        setClueNotification(`✨ New Historical Clue: ${clue.title}`);
        setTimeout(() => setClueNotification(null), 4000);
      }
      return next;
    });
  };

  // Silent Background Exploration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // New Taj Mahal & Red Fort state variables
  const [showCalligraphyPuzzle, setShowCalligraphyPuzzle] = useState(false);
  const [isCalligraphySolved, setIsCalligraphySolved] = useState(false);
  const [calligraphyInput, setCalligraphyInput] = useState("");
  const [calligraphyError, setCalligraphyError] = useState(false);

  const [showSymmetryPuzzle, setShowSymmetryPuzzle] = useState(false);
  const [isSymmetrySolved, setIsSymmetrySolved] = useState(false);
  const [symmetryState, setSymmetryState] = useState([true, false, true, false]);

  const [showPietraDuraPuzzle, setShowPietraDuraPuzzle] = useState(false);
  const [isPietraDuraSolved, setIsPietraDuraSolved] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mughal_is_pietra_dura_solved") === "true";
    }
    return false;
  });
  const isPietraDuraSolvedRef = useRef(isPietraDuraSolved);
  useEffect(() => {
    isPietraDuraSolvedRef.current = isPietraDuraSolved;
  }, [isPietraDuraSolved]);

  const [showSheeshMirrorPuzzle, setShowSheeshMirrorPuzzle] = useState(false);
  const [isSheeshMirrorSolved, setIsSheeshMirrorSolved] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mughal_is_sheesh_mirror_solved") === "true";
    }
    return false;
  });
  const isSheeshMirrorSolvedRef = useRef(isSheeshMirrorSolved);
  useEffect(() => {
    isSheeshMirrorSolvedRef.current = isSheeshMirrorSolved;
  }, [isSheeshMirrorSolved]);

  const [showKhasPermissionModal, setShowKhasPermissionModal] = useState(false);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);
  const [throneGuardSpeech, setThroneGuardSpeech] = useState<string | null>(null);
  const [hasTalkedToJolly, setHasTalkedToJolly] = useState<boolean>(false);

  const [showMausoleumModal, setShowMausoleumModal] = useState(false);
  const [isMausoleumExplored, setIsMausoleumExplored] = useState(false);

  const [showArchaeologistDialogue, setShowArchaeologistDialogue] = useState(false);
  const [isArchaeologistTalked, setIsArchaeologistTalked] = useState(false);

  const [isCarriageTravelling, setIsCarriageTravelling] = useState(false);
  const [travelOverlayPhase, setTravelOverlayPhase] = useState(0);

  const [showCampaignComplete, setShowCampaignComplete] = useState(false);
  const router = useRouter();

  const horseSoundRef = useRef<HTMLAudioElement | null>(null);
  const boatSoundRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedIntroNarrationRef = useRef(false);

  // Play cinematic narrator voice once when entering 1653 Mughal Era (ONLY if at gate)
  useEffect(() => {
    if (!isLoading && !hasPlayedIntroNarrationRef.current) {
      hasPlayedIntroNarrationRef.current = true;
      if (scene === "gate") {
        const narrationTimer = setTimeout(() => {
          playNarration(
            "You have entered the year 1653... the heart of the Mughal Empire.\n\n" +
            "Mumtaz Mahal is gone... but her memory now stands immortal before you.\n\n" +
            "The Taj Mahal.\n\n" +
            "You now live under the rule of Emperor Shah Jahan.\n\n" +
            "Remember, time traveller... reveal your true identity to no one.\n\n" +
            "One wrong word... and your journey may end before it has even begun.\n\n" +
            "Now... step carefully into history.",
            {
              audioUrl: "/mughal_intro_narration.wav"
            }
          );
        }, 700);
        return () => clearTimeout(narrationTimer);
      }
    }
  }, [isLoading, scene]);

  // Clean up narration audio when navigating away
  useEffect(() => {
    return () => {
      stopNarration();
    };
  }, []);

  // Play cinematic Sarvam AI narrator voice on Punishment Screen (stops any character voice first)
  useEffect(() => {
    if (punishmentState.isOpen) {
      stopCharacterDialogue();
      playNarration(
        `${punishmentState.title}. ${punishmentState.description}`,
        {
          speaker: "ratan",
          pace: 0.88,
          language_code: "en-IN"
        }
      );
    }
  }, [punishmentState.isOpen, punishmentState.title, punishmentState.description]);

  // Play Sarvam AI narrator voice when entering Diwan-i-Aam / Throne Hall (interior)
  const hasPlayedInteriorNarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && scene === "interior" && !hasPlayedInteriorNarrationRef.current) {
      hasPlayedInteriorNarrationRef.current = true;
      const timer = setTimeout(() => {
        let solved = isPietraDuraSolvedRef.current || isPietraDuraSolved;
        if (typeof window !== "undefined") {
          if (localStorage.getItem("mughal_is_pietra_dura_solved") === "true") solved = true;
          try {
            const saved = localStorage.getItem("mughal_save");
            if (saved && JSON.parse(saved).discoveredClueIds?.includes("pietra_dura_seal")) solved = true;
          } catch(e) {}
        }

        if (solved) {
          playNarration(
            "You have earned royal clearance with your Pietra Dura marble art! The passage to the Sheesh Mahal is open.",
            {
              audioUrl: "/pietra_dura_solved_narration.wav",
              speaker: "ratan",
              pace: 0.88,
              language_code: "en-IN"
            }
          );
        } else {
          playNarration(
            "King Shah Jahan has gone for his prayers. Perform the famous Pietra Dura Marble Flower Art among the military guards, and you will get your next clue.",
            {
              speaker: "ratan",
              pace: 0.88,
              language_code: "en-IN",
              onEnd: () => {
                let recheckSolved = isPietraDuraSolvedRef.current;
                if (typeof window !== "undefined") {
                  if (localStorage.getItem("mughal_is_pietra_dura_solved") === "true") recheckSolved = true;
                }
                if (!recheckSolved) {
                  setShowPietraDuraPuzzle(true);
                }
              }
            }
          );
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scene, isPietraDuraSolved]);

  // Play Sarvam AI narrator voice when entering Sheesh Mahal (Palace of Mirrors)
  const hasPlayedSheeshNarrationRef = useRef(false);
  useEffect(() => {
    if (!isLoading && scene === "sheesh_mahal" && !hasPlayedSheeshNarrationRef.current) {
      hasPlayedSheeshNarrationRef.current = true;
      const timer = setTimeout(() => {
        let solved = isSheeshMirrorSolvedRef.current || isSheeshMirrorSolved;
        if (typeof window !== "undefined") {
          if (localStorage.getItem("mughal_is_sheesh_mirror_solved") === "true") solved = true;
          try {
            const saved = localStorage.getItem("mughal_save");
            if (saved && JSON.parse(saved).discoveredClueIds?.includes("sheesh_mirror_shard")) solved = true;
          } catch(e) {}
        }

        if (solved) {
          playNarration(
            "The starlight reflections in the Sheesh Mahal shine brightly under your mastery! The royal passage to Khas Mahal is clear.",
            {
              audioUrl: "/sheesh_mahal_solved_narration.wav",
              speaker: "ratan",
              pace: 0.88,
              language_code: "en-IN"
            }
          );
        } else {
          playNarration(
            "Welcome to the Sheesh Mahal, the Palace of Mirrors. In 1653, Mughal architects embedded thousands of mirror-glass inlays into the walls so a single candle would scatter light like a starry sky. Play this game of Sheesh Mahal: angle the mirror tiles to bounce the candlelight and reveal the hidden royal signet on the wall.",
            {
              speaker: "ratan",
              pace: 0.88,
              language_code: "en-IN",
              onEnd: () => {
                let recheckSolved = isSheeshMirrorSolvedRef.current;
                if (typeof window !== "undefined") {
                  if (localStorage.getItem("mughal_is_sheesh_mirror_solved") === "true") recheckSolved = true;
                }
                if (!recheckSolved) {
                  setShowSheeshMirrorPuzzle(true);
                }
              }
            }
          );
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scene, isSheeshMirrorSolved]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      horseSoundRef.current = new Audio('/horse_sound.webm');
      horseSoundRef.current.volume = 0.5;
      boatSoundRef.current = new Audio('/boat-transition.webm');
      boatSoundRef.current.volume = 0.7;

      // Global tactile game sound feedback for all clickable UI buttons
      const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const isInteractive = target.closest('button, [role="button"], a, input[type="submit"], .cursor-pointer');
        if (isInteractive) {
          soundFx.playButtonClick();
        }
      };

      window.addEventListener('click', handleGlobalClick, { capture: true });
      return () => {
        window.removeEventListener('click', handleGlobalClick, { capture: true });
      };
    }
  }, []);

  const startBoatTransition = (targetScene: SceneType, targetPos: { x: number; y: number }, durationMs: number = 5000) => {
    setIsTransitioning(true);
    if (boatSoundRef.current) {
      boatSoundRef.current.currentTime = 0;
      boatSoundRef.current.play().catch(() => {});
    }
    setTimeout(() => {
      setScene(targetScene);
      setPlayerPos(targetPos);
      setIsTransitioning(false);
      if (boatSoundRef.current) {
        boatSoundRef.current.pause();
        boatSoundRef.current.currentTime = 0;
      }
    }, durationMs);
  };

  useEffect(() => {
    if (isCarriageTravelling) {
      horseSoundRef.current?.play().catch(e => console.log("Audio play blocked", e));
    } else {
      if (horseSoundRef.current) {
        horseSoundRef.current.pause();
        horseSoundRef.current.currentTime = 0;
      }
    }
  }, [isCarriageTravelling]);

  const handleResetGame = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setScene("gate");
      setPlayerPos({ x: 50, y: 85 });
      setFacingLeft(false);
      setCluesFound(0);
      setGuardAttempts(0);
      setHasGuardPermission(false);
      hasGuardPermissionRef.current = false;
      setDiscoveredClueIds([]);
      setShowDialogue(false);
      setShowThroneScroll(false);
      setShowMirrorModal(false);
      setShowKhasModal(false);
      setShowCalligraphyPuzzle(false);
      setIsCalligraphySolved(false);
      setShowSymmetryPuzzle(false);
      setIsSymmetrySolved(false);
      setSymmetryState([true, false, true, false]);
      setShowPietraDuraPuzzle(false);
      setIsPietraDuraSolved(false);
      isPietraDuraSolvedRef.current = false;
      setShowSheeshMirrorPuzzle(false);
      setIsSheeshMirrorSolved(false);
      isSheeshMirrorSolvedRef.current = false;
      setShowKhasPermissionModal(false);
      setShowMausoleumModal(false);
      setIsMausoleumExplored(false);
      setShowArchaeologistDialogue(false);
      setIsArchaeologistTalked(false);
      setIsTransitioning(false);
      setHasTalkedToJolly(false);
      hasPlayedIntroNarrationRef.current = false;
      hasPlayedInteriorNarrationRef.current = false;
      hasPlayedSheeshNarrationRef.current = false;
      localStorage.removeItem('mughal_save');
      localStorage.removeItem('mughal_is_pietra_dura_solved');
      localStorage.removeItem('mughal_is_sheesh_mirror_solved');
    }, 400);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlScene = urlParams.get('scene') as SceneType | null;
        const saved = localStorage.getItem('mughal_save');
        
        let finalScene: SceneType = urlScene || 'gate';

        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (!urlScene && parsed.scene) {
               if (parsed.scene === "gate" || parsed.hasGuardPermission) {
                 finalScene = parsed.scene as SceneType;
                 if (parsed.playerPos) setPlayerPos(parsed.playerPos);
               } else {
                 finalScene = "gate";
                 setPlayerPos({ x: 50, y: 85 });
               }
            }
            if (parsed.hasGuardPermission) {
              setHasGuardPermission(true);
              hasGuardPermissionRef.current = true;
            }
            if (parsed.cluesFound !== undefined) setCluesFound(parsed.cluesFound);
            if (parsed.isPietraDuraSolved !== undefined) setIsPietraDuraSolved(parsed.isPietraDuraSolved);
            if (parsed.isSheeshMirrorSolved !== undefined) setIsSheeshMirrorSolved(parsed.isSheeshMirrorSolved);
            if (parsed.isCalligraphySolved !== undefined) setIsCalligraphySolved(parsed.isCalligraphySolved);
            if (parsed.isSymmetrySolved !== undefined) setIsSymmetrySolved(parsed.isSymmetrySolved);
            if (parsed.isMausoleumExplored !== undefined) setIsMausoleumExplored(parsed.isMausoleumExplored);
            if (parsed.isArchaeologistTalked !== undefined) setIsArchaeologistTalked(parsed.isArchaeologistTalked);
            if (parsed.discoveredClueIds) setDiscoveredClueIds(parsed.discoveredClueIds);
          } catch (e) {
            console.error("Failed to load save state", e);
          }
        }

        // Also sync explicit solved status from MongoDB
        try {
          const dbStatus = await fetchSolvedStatusFromDatabase("mughal");
          if (dbStatus.isPietraDuraSolved || dbStatus.solvedPuzzles.includes("pietra_dura_flower_art")) {
            setIsPietraDuraSolved(true);
            isPietraDuraSolvedRef.current = true;
            localStorage.setItem("mughal_is_pietra_dura_solved", "true");
          }
          if (dbStatus.isSheeshMirrorSolved || dbStatus.solvedPuzzles.includes("sheesh_mahal_reflection")) {
            setIsSheeshMirrorSolved(true);
            isSheeshMirrorSolvedRef.current = true;
            localStorage.setItem("mughal_is_sheesh_mirror_solved", "true");
          }
        } catch (e) {}
        
        setScene(finalScene);
      }
      setIsLoading(false);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && scene !== 'gate') {
      window.history.replaceState(null, '', `?scene=${scene}`);
    } else if (typeof window !== 'undefined' && scene === 'gate') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [scene]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      const saveState = {
        scene,
        playerPos,
        cluesFound,
        discoveredClueIds,
        hasGuardPermission,
        isPietraDuraSolved,
        isSheeshMirrorSolved,
        isCalligraphySolved,
        isSymmetrySolved,
        isMausoleumExplored,
        isArchaeologistTalked
      };
      localStorage.setItem('mughal_save', JSON.stringify(saveState));
    }
  }, [scene, playerPos, cluesFound, discoveredClueIds, hasGuardPermission, isPietraDuraSolved, isSheeshMirrorSolved, isCalligraphySolved, isSymmetrySolved, isMausoleumExplored, isArchaeologistTalked, isLoading]);

  const guardPos = { x: 43.5, y: 72.0 };
  const distToGuard = Math.sqrt(
    Math.pow(playerPos.x - guardPos.x, 2) + Math.pow(playerPos.y - guardPos.y, 2)
  );
  const isNearGuard = scene === "gate" && distToGuard < 9.0;

  const genieX = Math.min(92, Math.max(8, playerPos.x + (facingLeft ? 7.5 : -7.5)));
  const genieY = Math.max(12, playerPos.y - 9.5);

  const isNearThrone = scene === "interior" && playerPos.y <= 78.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;
  const isNearSheeshCorridor = scene === "interior" && playerPos.x >= 68.0 && playerPos.y >= 70.0 && playerPos.y <= 86.0;
  const isNearSheeshMahalDoor = scene === "sheesh_passage" && playerPos.y <= 82.0 && playerPos.x >= 38.0 && playerPos.x <= 62.0;
  const isNearMirrorFountain = scene === "sheesh_mahal" && playerPos.y <= 78.0 && playerPos.y >= 63.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;
  const isNearKhasFountain = scene === "khas_mahal" && playerPos.y <= 78.0 && playerPos.y >= 64.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;

  const archaeologistPos = { x: 45.0, y: 72.0 };
  const distToArchaeologist = Math.sqrt(
    Math.pow(playerPos.x - archaeologistPos.x, 2) + Math.pow(playerPos.y - archaeologistPos.y, 2)
  );
  const isNearArchaeologist = scene === "taj_mehtab_bagh" && distToArchaeologist < 9.0;

  const isNearCalligraphy = scene === "taj_gate" && playerPos.y <= 72.0 && playerPos.x >= 44.0 && playerPos.x <= 56.0;
  const isNearPool = scene === "taj_charbagh" && playerPos.y <= 58.0 && playerPos.y >= 42.0 && playerPos.x >= 42.0 && playerPos.x <= 58.0;
  const isNearTajPishtaq = scene === "taj_exterior" && playerPos.y <= 75.0 && playerPos.x >= 42.0 && playerPos.x <= 58.0;
  const isNearCenotaphs = scene === "taj_mausoleum" && playerPos.y <= 72.0 && playerPos.y >= 30.0 && playerPos.x >= 25.0 && playerPos.x <= 75.0;
  const isNearCharbaghReturn = scene === "taj_exterior" && playerPos.y >= 94.0;
  const isNearCarriage = scene === "taj_mehtab_bagh" && isArchaeologistTalked && playerPos.x >= 80.0 && playerPos.y >= 80.0;
  const isNearRedFortCarriage = scene === "red_fort_lahori" && playerPos.x <= 25.0 && playerPos.y >= 75.0;
  const isNearMehtabBaghCross = scene === "taj_exterior" && playerPos.x >= 73.0 && playerPos.y <= 84.0;
  const isNearLahoriGate = scene === "red_fort_lahori" && playerPos.y <= 68.0 && playerPos.x >= 44.0 && playerPos.x <= 56.0;
  const isNearDiwanIKhas = scene === "red_fort_diwani_khas" && playerPos.y <= 65.0 && playerPos.x >= 35.0 && playerPos.x <= 65.0;
  const isNearDiwaniKhasExit = scene === "red_fort_diwani_khas" && playerPos.y >= 88.0;
  const isNearRangMahalExit = scene === "red_fort_rang_mahal" && playerPos.y >= 88.0;

  const playerPosRef = useRef(playerPos);
  playerPosRef.current = playerPos;

  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    if (isLoading || isTransitioning) return;

    const keysHeld = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysHeld.add(key);
      const pos = playerPosRef.current;
      const curScene = sceneRef.current;

      // Handle 'F' Key (Quick Exits / Crossings)
      if (key === "f") {
        if (curScene === "sheesh_mahal") {
          setScene("sheesh_passage");
          setPlayerPos({ x: 50.0, y: 78.0 });
        } else if (curScene === "sheesh_passage") {
          setScene("interior");
          setPlayerPos({ x: 68.0, y: 76.0 });
        } else if (curScene === "interior") {
          setScene("courtyard");
          setPlayerPos({ x: 26.0, y: 46.0 });
        } else if (curScene === "brown_passage") {
          setScene("courtyard");
          setPlayerPos({ x: 82.0, y: 56.0 });
        } else if (curScene === "khas_mahal") {
          setScene("brown_passage");
          setPlayerPos({ x: 50.0, y: 64.0 });
        } else if (curScene === "taj_exterior") {
          if (pos.x >= 68.0) {
            setScene("taj_mehtab_bagh");
            setPlayerPos({ x: 50.0, y: 50.0 });
          } else {
            setScene("taj_charbagh");
            setPlayerPos({ x: 45.0, y: 20.0 });
          }
        } else if (curScene === "taj_mehtab_bagh") {
          setScene("taj_exterior");
          setPlayerPos({ x: 75.0, y: 80.0 });
        } else if (curScene === "taj_mausoleum") {
          setScene("taj_exterior");
          setPlayerPos({ x: 50.0, y: 76.0 });
        } else if (curScene === "taj_charbagh") {
          if (pos.y <= 30.0) {
            setScene("taj_exterior");
            setPlayerPos({ x: 50.0, y: 86.0 });
          } else {
            setScene("taj_gate");
            setPlayerPos({ x: 50.0, y: 74.0 });
          }
        } else if (curScene === "taj_gate") {
          if (pos.y >= 80.0) {
            setScene("gate");
            setPlayerPos({ x: 50.0, y: 88.0 });
          }
        } else if (curScene === "passage") {
          setScene("gate");
          setPlayerPos({ x: 50.0, y: 73.5 });
        }
        return;
      }

      // Handle 'E' Key (Interactions & Dialogue)
      if (key === "e") {
        if (curScene === "gate" && Math.hypot(pos.x - 43.5, pos.y - 72.0) < 14.0) {
          setShowDialogue(true);
          setGuardAttempts((prev) => {
            const next = prev + 1;
            if (next >= 3) {
              discoverClue("guard_permit");
            }
            return next;
          });
          playCharacterDialogue({
            character: "guard",
            text: "Halt, intruder! Stop right where you stand! Beyond this Amar Singh Gate is restricted imperial ground! Answer immediately, or you will be seized!"
          });
        }
        if (curScene === "interior") {
          if (pos.x >= 65.0) {
            if (isPietraDuraSolved) {
              setScene("sheesh_passage");
              setPlayerPos({ x: 50.0, y: 86.0 });
            } else {
              setThroneGuardSpeech("Halt! You must perform the Pietra Dura floral art before entering the Sheesh Mahal!");
              setTimeout(() => setThroneGuardSpeech(null), 5000);
              setShowPietraDuraPuzzle(true);
            }
          } else if (pos.x >= 35.0 && pos.x <= 65.0 && pos.y <= 85.0) {
            if (!isPietraDuraSolved) {
              setShowPietraDuraPuzzle(true);
            } else {
              setShowThroneScroll((prev) => !prev);
            }
          }
        }
        if (curScene === "sheesh_passage" && pos.y <= 85.0) {
          setScene("sheesh_mahal");
          setPlayerPos({ x: 50.0, y: 86.0 });
        }
        if (curScene === "sheesh_mahal") {
          if (!isSheeshMirrorSolved) {
            setShowSheeshMirrorPuzzle(true);
          } else {
            discoverClue("sheesh_mirror_shard");
            setShowMirrorModal((prev) => !prev);
          }
        }
        if (curScene === "khas_mahal" && pos.y <= 85.0 && pos.x >= 28.0 && pos.x <= 72.0) {
          setShowKhasModal(true);
        }
        if (curScene === "taj_gate" && pos.y <= 78.0 && pos.x >= 38.0 && pos.x <= 62.0 && !isCalligraphySolved) {
          setShowCalligraphyPuzzle(true);
        }
        if (curScene === "taj_charbagh" && pos.y <= 65.0 && pos.y >= 35.0 && pos.x >= 35.0 && pos.x <= 65.0 && !isSymmetrySolved) {
          setShowSymmetryPuzzle(true);
        }
        if (curScene === "taj_exterior") {
          if (pos.y <= 80.0 && pos.x >= 38.0 && pos.x <= 62.0) {
            setScene("taj_mausoleum");
            setPlayerPos({ x: 50.0, y: 86.0 });
          } else if (pos.y >= 90.0) {
            setScene("taj_charbagh");
            setPlayerPos({ x: 45.0, y: 20.0 });
          }
        }
        if (curScene === "taj_mausoleum" && pos.y <= 80.0 && pos.x >= 20.0 && pos.x <= 80.0 && !isMausoleumExplored) {
          setShowMausoleumModal(true);
        }
        if (curScene === "taj_mehtab_bagh" && Math.hypot(pos.x - 45.0, pos.y - 72.0) < 14.0) {
          discoverClue("mehtab_bagh_journal");
          setIsArchaeologistTalked(true);
          setShowArchaeologistDialogue((prev) => !prev);
          playCharacterDialogue({
            character: "archaeologist",
            text: "Greetings! I am the caretaker archaeologist here. You are standing on the ruins of Mehtab Bagh's pond foundations."
          });
        }
        if (curScene === "red_fort_lahori" && pos.y <= 68.0 && pos.x >= 44.0 && pos.x <= 56.0) {
          setScene("red_fort_plaza");
          setPlayerPos({ x: 50.0, y: 88.0 });
        }
        if (curScene === "red_fort_diwani_khas") {
          if (pos.y <= 68.0 && pos.x >= 32.0 && pos.x <= 68.0) {
            setShowCampaignComplete(true);
          } else if (pos.y >= 84.0) {
            setScene("red_fort_plaza");
            setPlayerPos({ x: 35.0, y: 78.0 });
          }
        }
        if (curScene === "red_fort_rang_mahal" && pos.y >= 84.0) {
          setScene("red_fort_plaza");
          setPlayerPos({ x: 65.0, y: 78.0 });
        }
        if ((curScene === "taj_mehtab_bagh" && isArchaeologistTalked && pos.x >= 75.0 && pos.y >= 75.0) || (curScene === "red_fort_lahori" && pos.x <= 30.0 && pos.y >= 70.0)) {
          setIsCarriageTravelling(true);
          setTravelOverlayPhase(1);
          setTimeout(() => {
            setTravelOverlayPhase(2);
            setTimeout(() => {
              setTravelOverlayPhase(3);
              setTimeout(() => {
                if (curScene === "taj_mehtab_bagh") {
                  setScene("red_fort_lahori");
                  setPlayerPos({ x: 50.0, y: 88.0 });
                } else {
                  setScene("taj_mehtab_bagh");
                  setPlayerPos({ x: 75.0, y: 80.0 });
                }
                setIsCarriageTravelling(false);
                setTravelOverlayPhase(0);
              }, 400);
            }, 1500);
          }, 500);
        }
      }
      if (e.key === "Escape") {
        setShowDialogue(false);
        setShowJollyDialogue(false);
        setShowThroneScroll(false);
        setShowMirrorModal(false);
        setShowKhasModal(false);
        setShowCalligraphyPuzzle(false);
        setShowSymmetryPuzzle(false);
        setShowMausoleumModal(false);
        setShowArchaeologistDialogue(false);
        setShowCampaignComplete(false);
        setShowCluesModal(false);
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
      let dx = 0;
      let dy = 0;
      const speed = 0.35;

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
          if (scene === "gate") {
            const rampProgress = Math.max(0, Math.min(1, (prev.y - 71.5) / (92.0 - 71.5)));
            const minX = 42.0 - rampProgress * 4.0;
            const maxX = 58.0 + rampProgress * 4.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(71.0, Math.min(92.0, prev.y + dy));

            // If player moves up towards the archway without speaking to the guard
            if (nextY <= 73.8) {
              if (!hasGuardPermissionRef.current) {
                stopCharacterDialogue();
                setPunishmentState({
                  isOpen: true,
                  title: "Expelled from the Imperial Gates",
                  subtitle: "THE FALL",
                  description: "You entered without taking permission from the royal guard. Under the fierce glare of the Amar Singh Gate sentries, your attempt to sneak into the palace of Emperor Shah Jahan has ended in disaster. You are seized, disciplined with the iron mace, and thrown outside the locked gates into the dust."
                });
                return { x: 50.0, y: 88.0 };
              }
            }

            if (nextY <= 71.8 && nextX >= 47.0 && nextX <= 53.0) {
              if (!hasGuardPermissionRef.current) {
                stopCharacterDialogue();
                setPunishmentState({
                  isOpen: true,
                  title: "Expelled from the Imperial Gates",
                  subtitle: "THE FALL",
                  description: "You entered without taking permission from the royal guard. Under the fierce glare of the Amar Singh Gate sentries, your attempt to sneak into the palace of Emperor Shah Jahan has ended in disaster. You are seized, disciplined with the iron mace, and thrown outside the locked gates into the dust."
                });
                return { x: 50.0, y: 88.0 };
              } else {
                setIsTransitioning(true);
                setTimeout(() => {
                  setScene("passage");
                  setPlayerPos({ x: 33.0, y: 90.0 });
                  setIsTransitioning(false);
                }, 400);
              }
            }

            return { x: nextX, y: nextY };
          } else if (scene === "passage") {
            // Safety check: if inside passage without permission, eject immediately
            if (!hasGuardPermissionRef.current) {
              setPunishmentState({
                isOpen: true,
                title: "Expelled from the Imperial Gates",
                subtitle: "THE FALL",
                description: "You entered without taking permission from the royal guard. Under the fierce glare of the Amar Singh Gate sentries, your attempt to sneak into the palace of Emperor Shah Jahan has ended in disaster. You are seized, disciplined with the iron mace, and thrown outside the locked gates into the dust."
              });
              setScene("gate");
              return { x: 50.0, y: 88.0 };
            }
            const t = Math.max(0, Math.min(1, (prev.y - 58.0) / (91.0 - 58.0)));
            const centerX = 52.0 - (1.0 - Math.pow(1.0 - t, 1.6)) * 19.0;
            const halfWidth = 4.0 + t * 8.0;

            const minX = centerX - halfWidth;
            const maxX = centerX + halfWidth;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(58.0, Math.min(92.0, prev.y + dy));

            if (nextY <= 59.2 && nextX >= 48.0 && nextX <= 56.0) {
              setScene("courtyard");
              setPlayerPos({ x: 18.0, y: 72.0 });
            }

            if (nextY >= 91.5) {
              setScene("gate");
              setPlayerPos({ x: 50.0, y: 73.5 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "courtyard") {
            const minX = 8.0;
            const maxX = 92.0;
            const minY = 40.0;
            const maxY = 76.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextX <= 32.0 && nextY <= 43.5) {
              setScene("interior");
              setPlayerPos({ x: 50.0, y: 86.0 });
            }

            if (nextX >= 78.0 && nextY <= 54.0) {
              setScene("brown_passage");
              setPlayerPos({ x: 30.0, y: 86.0 });
            }

            if (nextX <= 9.0 && nextY >= 68.0) {
              setScene("passage");
              setPlayerPos({ x: 51.0, y: 61.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "interior") {
            const minX = 14.0;
            const maxX = isPietraDuraSolved ? 82.0 : 69.0;
            const minY = 72.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (isPietraDuraSolved) {
              if (nextX >= 70.0 && nextY >= 70.0 && nextY <= 85.0) {
                setScene("sheesh_passage");
                setPlayerPos({ x: 50.0, y: 86.0 });
              }
            } else {
              if (prev.x + dx >= 69.0 && nextY >= 70.0 && nextY <= 85.0) {
                setThroneGuardSpeech("Halt! You must perform the Pietra Dura floral art before entering the Sheesh Mahal!");
                setTimeout(() => setThroneGuardSpeech(null), 5000);
                setShowPietraDuraPuzzle(true);
              }
            }

            if (nextY >= 87.5) {
              setScene("courtyard");
              setPlayerPos({ x: 26.0, y: 46.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "sheesh_passage") {
            const minX = 36.0;
            const maxX = 64.0;
            const minY = 74.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY <= 76.5 && nextX >= 40.0 && nextX <= 60.0) {
              setScene("sheesh_mahal");
              setPlayerPos({ x: 50.0, y: 86.0 });
            }

            if (nextY >= 89.0) {
              setScene("interior");
              setPlayerPos({ x: 68.0, y: 76.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "sheesh_mahal") {
            const minX = 18.0;
            const maxX = 82.0;
            const minY = 62.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Only exit when F key is pressed or exit button clicked
            return { x: nextX, y: nextY };
          } else if (scene === "brown_passage") {
            const minX = 22.0;
            const maxX = 65.0;
            const minY = 60.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY <= 62.0 && nextX >= 34.0 && nextX <= 50.0) {
              setScene("khas_mahal");
              setPlayerPos({ x: 50.0, y: 86.0 });
            }

            if (nextY >= 87.5) {
              setScene("courtyard");
              setPlayerPos({ x: 78.0, y: 52.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "khas_mahal") {
            const minX = 18.0;
            const maxX = 82.0;
            const minY = 64.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY >= 87.5) {
              setScene("brown_passage");
              setPlayerPos({ x: 42.0, y: 65.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_gate") {
            const minX = 20.0;
            const maxX = 80.0;
            const minY = 68.0;
            const maxY = 98.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY >= 96.0) {
              startBoatTransition("gate", { x: 50.0, y: 88.0 }, 5000);
            }

            if (nextY <= 68.5 && nextX >= 45.0 && nextX <= 55.0) {
              if (isCalligraphySolved) {
                setScene("taj_charbagh");
                setPlayerPos({ x: 50.0, y: 88.0 });
              } else {
                return { x: prev.x, y: Math.max(69.0, prev.y) };
              }
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_charbagh") {
            const minX = 15.0;
            const maxX = 85.0;
            const minY = 15.0;
            const maxY = 90.0;

            let nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            let nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextX >= 48.5 && nextX <= 51.5 && nextY >= 48.5 && nextY <= 51.5) {
              if (prev.x < 48.5 || prev.x > 51.5) {
                nextX = prev.x;
              } else if (prev.y < 48.5 || prev.y > 51.5) {
                nextY = prev.y;
              } else {
                nextY = 51.6;
              }
            }

            if (nextY <= 16.0 && nextX >= 45.0 && nextX <= 55.0) {
              if (isSymmetrySolved) {
                setScene("taj_exterior");
                setPlayerPos({ x: 50.0, y: 88.0 });
              } else {
                return { x: prev.x, y: Math.max(17.0, prev.y) };
              }
            }

            if (nextY >= 89.0) {
              setScene("taj_gate");
              setPlayerPos({ x: 50.0, y: 69.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_exterior") {
            const minX = 15.0;
            const maxX = 88.0;
            const maxY = 96.0;

            let nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            let nextY = Math.min(maxY, prev.y + dy);

            if (nextY < 69.0) {
              if (nextX >= 44.0 && nextX <= 56.0) {
                nextY = Math.max(58.0, nextY);
              } else {
                if (prev.y >= 69.0) {
                  nextY = 69.0;
                } else {
                  nextX = prev.x;
                  nextY = Math.max(58.0, nextY);
                }
              }
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_mausoleum") {
            const minX = 15.0;
            const maxX = 85.0;
            const minY = 42.0;
            const maxY = 88.0;

            let nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            let nextY = Math.min(maxY, prev.y + dy);

            if (nextX > 32.0 && nextX < 68.0 && nextY > 38.0 && nextY < 66.0) {
              if (!(prev.x + dx > 32.0 && prev.x + dx < 68.0 && prev.y > 38.0 && prev.y < 66.0)) {
                nextX = prev.x + dx;
                nextY = prev.y;
              } else if (!(prev.x > 32.0 && prev.x < 68.0 && prev.y + dy > 38.0 && prev.y + dy < 66.0)) {
                nextX = prev.x;
                nextY = prev.y + dy;
              } else {
                nextX = prev.x;
                nextY = prev.y;
              }
            }

            if (nextY >= 87.5) {
              setScene("taj_exterior");
              setPlayerPos({ x: 50.0, y: 74.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_mehtab_bagh") {
            const minX = 10.0;
            const maxX = 90.0;
            const minY = 46.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY <= 48.0 && nextX >= 44.0 && nextX <= 56.0) {
              setScene("taj_exterior");
              setPlayerPos({ x: 80.0, y: 78.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "red_fort_lahori") {
            const minX = 5.0;
            const maxX = 95.0;
            let minY = 75.0;
            const maxY = 95.0;

            if (prev.x >= 44.0 && prev.x <= 56.0) {
              minY = 65.0;
            }

            let nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            let nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY < 75.0 && (nextX < 44.0 || nextX > 56.0)) {
               nextX = prev.x;
               nextY = Math.max(75.0, nextY);
            }

            if (nextY <= 56.0 && nextX >= 45.0 && nextX <= 55.0) {
              setScene("red_fort_plaza");
              setPlayerPos({ x: 50.0, y: 88.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "red_fort_plaza") {
            const minX = 15.0;
            const maxX = 85.0;
            const minY = 48.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY >= 89.0) {
              setScene("red_fort_lahori");
              setPlayerPos({ x: 50.0, y: 58.0 });
            }

            if (nextY <= 49.0 && nextX > 35.0 && nextX < 65.0) {
              setScene("red_fort_interior");
              setPlayerPos({ x: 50.0, y: 88.0 });
            }

            if (nextX <= 35.0 && nextY <= 72.0) {
              setScene("red_fort_diwani_khas");
              setPlayerPos({ x: 50.0, y: 88.0 });
            }

            if (nextX >= 65.0 && nextY <= 72.0) {
              setScene("red_fort_rang_mahal");
              setPlayerPos({ x: 50.0, y: 88.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "red_fort_interior") {
            const progress = Math.max(0, Math.min(1, (prev.y - 45.0) / (90.0 - 45.0)));
            const minX = 35.0 - progress * 20.0;
            const maxX = 65.0 + progress * 20.0;
            const minY = 45.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY >= 89.0) {
              setScene("red_fort_plaza");
              setPlayerPos({ x: 50.0, y: 52.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "red_fort_diwani_khas") {
            const minX = 25.0;
            const maxX = 85.0;
            const minY = 50.0;
            const maxY = 98.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextX >= 83.0) {
              setScene("red_fort_corridor");
              setPlayerPos({ x: 50.0, y: 88.0 });
            }

            return { x: nextX, y: nextY };
          } else if (scene === "red_fort_corridor") {
            const minX = 25.0;
            const maxX = 75.0;
            const minY = 50.0;
            const maxY = 98.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            if (nextY >= 96.0) {
              setScene("red_fort_diwani_khas");
              setPlayerPos({ x: 80.0, y: 88.0 });
            }

            return { x: nextX, y: nextY };
          } else {
            const minX = 25.0;
            const maxX = 75.0;
            const minY = 50.0;
            const maxY = 98.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
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
  }, [isLoading, isTransitioning, scene, isNearGuard, isNearThrone, isNearMirrorFountain, isNearKhasFountain, isNearCalligraphy, isNearPool, isNearTajPishtaq, isNearCenotaphs, isNearArchaeologist, isNearCarriage, isNearLahoriGate, isNearDiwanIKhas, isNearDiwaniKhasExit, isNearRangMahalExit, isNearCharbaghReturn, isCalligraphySolved, isSymmetrySolved, isMausoleumExplored, isArchaeologistTalked, cluesFound, guardAttempts]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-[#050403] items-center justify-center flex-col relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#91714b]/20 via-[#050403] to-[#050403]"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#91714b]/30 border-t-[#e4c794] rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(145,113,75,0.4)]"></div>
          
          <h1 className="text-3xl font-serif text-[#e4c794] tracking-[0.2em] uppercase mb-3 drop-shadow-md">
            Mughal Empire
          </h1>
          <p className="text-[13px] text-[#a89985] tracking-widest uppercase">Traveling to Agra Fort...</p>
        </div>
      </div>
    );
  }

  const depthScale = scene === "gate"
    ? 1.22 + ((playerPos.y - 71.5) / 20.5) * 0.28
    : scene === "passage"
    ? 1.05 + ((playerPos.y - 58.0) / 33.0) * 0.65
    : scene === "courtyard"
    ? 0.90 + ((playerPos.y - 40.0) / 36.0) * 0.50
    : scene === "interior"
    ? 1.0 + ((playerPos.y - 72.0) / 16.0) * 0.25
    : scene === "sheesh_passage"
    ? 0.85 + ((playerPos.y - 74.0) / 16.0) * 0.35
    : scene === "sheesh_mahal"
    ? 0.95 + ((playerPos.y - 60.0) / 28.0) * 0.45
    : scene === "brown_passage"
    ? 0.90 + ((playerPos.y - 60.0) / 28.0) * 0.50
    : scene === "khas_mahal"
    ? 0.95 + ((playerPos.y - 64.0) / 24.0) * 0.45
    : scene === "taj_gate"
    ? 0.95 + ((playerPos.y - 60.0) / 30.0) * 0.40
    : scene === "taj_charbagh"
    ? 0.90 + ((playerPos.y - 40.0) / 50.0) * 0.50
    : scene === "taj_exterior"
    ? 0.95 + ((playerPos.y - 69.0) / 27.0) * 0.45
    : scene === "taj_mausoleum"
    ? 0.95 + ((playerPos.y - 35.0) / 53.0) * 0.45
    : scene === "taj_mehtab_bagh"
    ? 0.95 + ((playerPos.y - 40.0) / 48.0) * 0.45
    : scene === "red_fort_lahori"
    ? 0.85 + ((playerPos.y - 55.0) / 35.0) * 0.30
    : scene === "red_fort_plaza"
    ? 0.80 + ((playerPos.y - 35.0) / 55.0) * 0.30
    : scene === "red_fort_interior"
    ? 1.35 + ((playerPos.y - 45.0) / 45.0) * 0.50
    : scene === "red_fort_diwani_khas" || scene === "red_fort_rang_mahal" || scene === "red_fort_corridor"
    ? 1.55 + ((playerPos.y - 50.0) / 48.0) * 0.55
    : 0.95 + ((playerPos.y - 45.0) / 45.0) * 0.40;

  const walkBob = isWalking ? Math.sin(walkPhase) * 1.8 : 0;
  const walkSway = isWalking ? Math.sin(walkPhase * 0.5) * 1.5 : 0;

  const getBackgroundSrc = () => {
    if (scene === "gate") return "/bg-agra-fort.jpg";
    if (scene === "passage") return "/bg-agra-passage.jpg";
    if (scene === "courtyard") return "/bg-agra-courtyard.jpg";
    if (scene === "interior") return "/bg-agra-interior.jpg";
    if (scene === "sheesh_passage") return "/bg-agra-sheesh-passage.jpg";
    if (scene === "sheesh_mahal") return "/bg-agra-sheesh-mahal.jpg";
    if (scene === "brown_passage") return "/bg-agra-brown-passage.jpg";
    if (scene === "khas_mahal") return "/bg-agra-khas-mahal.jpg";
    if (scene === "taj_gate") return "/bg-taj-gate.jpg";
    if (scene === "taj_charbagh") return "/bg-taj-charbagh.jpg";
    if (scene === "taj_exterior") return "/bg-taj-exterior.jpg";
    if (scene === "taj_mausoleum") return "/bg-taj-mausoleum.jpg";
    if (scene === "taj_mehtab_bagh") return "/bg-taj-mehtab-bagh.jpg";
    if (scene === "red_fort_lahori") return "/bg-red-fort-lahori.jpg";
    if (scene === "red_fort_plaza") return "/bg-red-fort-plaza.jpg";
    if (scene === "red_fort_interior") return "/bg-red-fort-interior.jpg";
    if (scene === "red_fort_diwani_khas") return "/bg-red-fort-diwani-khas.jpg";
    if (scene === "red_fort_rang_mahal") return "/bg-red-fort-rang-mahal.jpg";
    if (scene === "red_fort_corridor") return "/bg-red-fort-corridor.jpg";
    return "/bg-red-fort-interior.jpg";
  };

  const getTransitionLabel = () => {
    if (scene === "gate") return "Entering Inner Ramp Passage...";
    if (scene === "passage") return playerPos.y <= 62 ? "Entering Diwan-i-Aam & Anguri Bagh..." : "Returning to Outer Gate...";
    if (scene === "courtyard") {
      if (playerPos.x >= 75) return "Entering Brown Palace Hallway...";
      return playerPos.y <= 45 ? "Entering Diwan-i-Aam Throne Hall..." : "Returning to Inner Passage...";
    }
    if (scene === "interior") return playerPos.x >= 70 ? "Entering Sheesh Mahal Corridor..." : "Returning to Anguri Bagh Garden...";
    if (scene === "sheesh_passage") return playerPos.y <= 62 ? "Entering Sheesh Mahal (Palace of Mirrors)..." : "Returning to Diwan-i-Aam...";
    if (scene === "sheesh_mahal") return "Returning to Sheesh Mahal Corridor...";
    if (scene === "brown_passage") return playerPos.y <= 64 ? "Entering Khas Mahal Palace..." : "Returning to Anguri Bagh...";
    if (scene === "khas_mahal") return "Crossing the Yamuna toward the Taj Mahal...";
    if (scene === "taj_gate") return playerPos.y >= 90 ? "Returning to Agra Fort Main Gate..." : "Entering the Taj Mahal Charbagh Gardens...";
    if (scene === "taj_charbagh") return playerPos.y <= 45 ? "Approaching the Taj Mahal Outside Terrace..." : "Returning to Great Gate...";
    if (scene === "taj_exterior") {
      if (playerPos.x >= 78) return "Crossing the Yamuna to Mehtab Bagh (Moonlight Garden)...";
      return playerPos.y <= 75 ? "Entering the Main Taj Mahal Mausoleum..." : "Returning to Charbagh Gardens...";
    }
    if (scene === "taj_mausoleum") return "Exiting to Outside Marble Terrace...";
    if (scene === "taj_mehtab_bagh") {
      if (playerPos.y <= 52) return "Returning across the Yamuna to Taj Mahal Exterior...";
      return "Leaving Agra for Delhi...";
    }
    if (scene === "red_fort_lahori") return "Entering the Red Fort Plaza...";
    if (scene === "red_fort_plaza") {
      if (playerPos.x <= 35) return "Entering Diwan-i-Khas Palace...";
      return playerPos.y <= 60 ? "Entering Chatta Chowk..." : "Exiting to Lahori Gate...";
    }
    if (scene === "red_fort_interior") return playerPos.y <= 60 ? "Exploring Chatta Chowk..." : "Returning to Plaza...";
    if (scene === "red_fort_diwani_khas") return playerPos.x >= 80 ? "Entering Hidden Corridor..." : "Returning to Plaza...";
    if (scene === "red_fort_corridor") return "Returning to Diwan-i-Khas...";
    return "Transitioning...";
  };

  return (
    <div className="w-full h-screen relative overflow-hidden font-sans select-none bg-black">
      
      {/* Game Background */}
      <img 
        src={getBackgroundSrc()} 
        alt="Agra Fort Game World" 
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300"
      />

      {/* Screen Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none"></div>

      {/* Fade Transition Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black animate-in fade-in duration-300 z-40 pointer-events-none flex items-center justify-center">
          <span className="text-amber-300 text-sm font-serif tracking-widest uppercase">
            {getTransitionLabel()}
          </span>
        </div>
      )}

      {/* --- MUGHAL ROYAL GUARD NPC (Only in Gate Scene) --- */}
      {scene === "gate" && (
        <div
          className="absolute pointer-events-auto cursor-pointer z-10 flex flex-col items-center"
          style={{
            left: `${guardPos.x}%`,
            top: `${guardPos.y}%`,
            transform: `translate(-50%, -96%) scale(1.15)`,
          }}
          onClick={() => {
            setShowDialogue(true);
            setGuardAttempts((prev) => {
              const next = prev + 1;
              if (next >= 3) {
                discoverClue("guard_permit");
              }
              return next;
            });
            playCharacterDialogue({
              character: "guard",
              text: "Halt, intruder! Stop right where you stand! Beyond this Amar Singh Gate is restricted imperial ground! Answer immediately, or you will be seized!"
            });
          }}
        >
          {/* Guard Proximity Indicator */}
          {isNearGuard && !showDialogue && !hasGuardPermission && !discoveredClueIds.includes("guard_permit") && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Talk to Royal Guard
            </div>
          )}

          {/* Guard Sprite */}
          <img
            src="/guard.png"
            alt="Mughal Guard NPC"
            className="w-32 h-32 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}

      {/* --- JOLLY BHAI (GENIE) COMPANION FOLLOWER WITH 3 DYNAMIC MODES --- */}
      {(() => {
        const isGuardClueNeeded = !hasGuardPermission && !discoveredClueIds.includes("guard_permit");
        const isThroneClueNeeded = !isPietraDuraSolved && !discoveredClueIds.includes("pietra_dura_seal");
        const isMirrorClueNeeded = !isSheeshMirrorSolved && !discoveredClueIds.includes("sheesh_mirror_shard");
        const isKhasClueNeeded = !discoveredClueIds.includes("khas_mahal_gem");
        const isCalligraphyClueNeeded = !isCalligraphySolved && !discoveredClueIds.includes("calligraphy_scroll");
        const isSymmetryClueNeeded = !isSymmetrySolved && !discoveredClueIds.includes("charbagh_layout");
        const isCenotaphClueNeeded = !isMausoleumExplored && !discoveredClueIds.includes("cenotaph_rubbing");
        const isArchaeologistClueNeeded = !isArchaeologistTalked && !discoveredClueIds.includes("mehtab_bagh_journal");

        // Mode 1: ✨ Glowing (Major story event / hidden secret)
        const isGlowing = 
          (scene === "gate" && isGuardClueNeeded && guardAttempts >= 1) ||
          (scene === "interior" && !isPietraDuraSolved) ||
          (scene === "sheesh_mahal" && !isSheeshMirrorSolved) ||
          (scene === "khas_mahal" && isKhasClueNeeded) ||
          (scene === "taj_gate" && !isCalligraphySolved) ||
          (scene === "taj_charbagh" && !isSymmetrySolved) ||
          (scene === "taj_mausoleum" && !isMausoleumExplored) ||
          (scene === "taj_mehtab_bagh" && !isArchaeologistTalked) ||
          (scene === "red_fort_diwani_khas" && !showCampaignComplete);

        // Mode 2: 💥 Crazy Shaking (Important historical clue or quest information nearby - only if unsolved)
        const isShaking = !isGlowing && (
          (isNearGuard && isGuardClueNeeded) ||
          (isNearThrone && isThroneClueNeeded) ||
          (isNearMirrorFountain && isMirrorClueNeeded) ||
          (isNearKhasFountain && isKhasClueNeeded) ||
          (isNearCalligraphy && isCalligraphyClueNeeded) ||
          (isNearPool && isSymmetryClueNeeded) ||
          (isNearTajPishtaq && !isMausoleumExplored) ||
          (isNearCenotaphs && isCenotaphClueNeeded) ||
          (isNearArchaeologist && isArchaeologistClueNeeded) ||
          (isNearCarriage && scene === "taj_mehtab_bagh" && isArchaeologistTalked) ||
          (isNearLahoriGate && scene === "red_fort_lahori") ||
          (isNearDiwanIKhas && scene === "red_fort_diwani_khas" && !showCampaignComplete)
        );

        // Mode 3: 🧞 Normal (Optional story / lore inquiry)
        const mode = isGlowing ? "glowing" : isShaking ? "shaking" : "normal";

        return (
          <div
            className="absolute z-20 pointer-events-auto cursor-pointer group transition-all duration-700 ease-out"
            onClick={() => {
              let speechText = "";
              if (!hasTalkedToJolly) {
                speechText = "Ah! Hello, traveller! I am Jolly Bhai. I was born many centuries ago and have witnessed great wars, powerful kingdoms, and the changing of history. But remember... only you can see me. I will guide you through this journey. And whenever you see me shaking and dancing like a madman... come quickly! It means I have something very important to tell you!";
              } else if (isGlowing) {
                if (scene === "gate") speechText = "Mere aaka! Look at the sentries closely! Speak with the Royal Guard and tell him you are here to perform your court talent!";
                else if (scene === "interior") speechText = "✨ Secret of the Throne: The Emperor has stepped away for prayers. Complete the sacred floral Pietra Dura marble mosaic on the dais!";
                else if (scene === "sheesh_mahal") speechText = "✨ Architectural Mystery: Align the three optical mirrors so the candle flame forms the eight-pointed cosmic star on the dome ceiling!";
                else if (scene === "khas_mahal") speechText = "Mere aaka, let me share a bittersweet truth with you... The golden domes you see beside us were once layered in pure, solid gold and inlaid with precious gems. Tragically, the gold was stripped away during colonial rule in the 18th century, and over time, tourists stole the remaining stones. What remains today is only a quiet shadow of our lost Mughal splendour.";
                else if (scene === "taj_gate") speechText = "✨ Sacred Inscription: The Great Gate bears Quranic Thuluth calligraphy. Complete the sacred verse of peace!";
                else if (scene === "taj_charbagh") speechText = "✨ Persian Symmetry: All four quadrants of paradise water channels must be activated symmetrically!";
                else if (scene === "taj_mausoleum") speechText = "✨ Hidden Truth: The decorated cenotaphs above are for viewing. The actual quiet graves lie in the lower crypt below!";
                else if (scene === "taj_mehtab_bagh") speechText = "✨ The Legend: The Black Taj is a myth born from the dark pool stones of Mehtab Bagh. Board the royal carriage to Delhi!";
                else speechText = "✨ Major Event Unfolding: We stand at the threshold of imperial history!";
              } else if (isShaking) {
                speechText = "💥 Quick, mere aaka! A vital historical clue is right next to you! Press [E] to investigate before the moment slips away!";
              } else {
                speechText = "Mere aaka, how can I help you? Ask me anything about Emperor Shah Jahan, the Taj Mahal, or Mughal architecture!";
              }

              setShowJollyDialogue(true);
              playCharacterDialogue({
                character: "jolly",
                text: speechText,
                audioUrl: scene === "khas_mahal" ? "/jolly_khas_mahal_gold.wav" : undefined
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
                ? "✨ Jolly Bhai is GLOWING! (Major Story Secret / Key Event)"
                : mode === "shaking"
                ? "💥 Jolly Bhai is SHAKING! (Crucial Clue Nearby)"
                : "🧞 Jolly Bhai (Genie Guide - Click for Story)"
            }
          >
            <div className={`relative ${mode === "shaking" ? "animate-crazy-shake" : mode === "glowing" ? "animate-celestial-glow" : "animate-bounce"}`} style={mode === "normal" ? { animationDuration: '3.5s' } : undefined}>
              <img
                src="/genie_rajasthani_transparent.png"
                alt="Jolly Bhai Genie Companion"
                className={`w-24 h-24 md:w-28 md:h-28 object-contain transition-all group-hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${
                  mode === "glowing" ? "filter drop-shadow-[0_0_25px_rgba(251,191,36,1)] brightness-125" : ""
                }`}
                style={{
                  imageRendering: "pixelated",
                  transform: facingLeft ? "scaleX(1)" : "scaleX(-1)",
                }}
              />
              
              {/* Dynamic Mode Badge Floating Above Genie */}
              {!showJollyDialogue && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 border-2 border-black rounded-full px-2.5 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[9.5px] font-black whitespace-nowrap transition-all flex items-center gap-1 ${
                  mode === "glowing"
                    ? "bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-black animate-pulse opacity-100 ring-2 ring-amber-400"
                    : mode === "shaking"
                    ? "bg-red-500 text-white animate-bounce opacity-100"
                    : "bg-[#fff9ea] text-black opacity-0 group-hover:opacity-100"
                }`}>
                  {mode === "glowing" && <span>✨ Story Secret!</span>}
                  {mode === "shaking" && <span>💥 Clue Alert!</span>}
                  {mode === "normal" && <span>Ask Jolly Bhai 🧞</span>}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Throne Inspection / Art Performance Prompt (Interior Scene) */}
      {scene === "interior" && isNearThrone && !showThroneScroll && !showPietraDuraPuzzle && (
        <div 
          className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            if (!isPietraDuraSolved) {
              setShowPietraDuraPuzzle(true);
            } else {
              setShowThroneScroll(true);
            }
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          {isPietraDuraSolved ? "Inspect Imperial Throne Dais" : "🎨 Perform Pietra Dura Marble Flower Art"}
        </div>
      )}

      {/* Mirror Fountain Inspection Prompt (Sheesh Mahal Scene) */}
      {scene === "sheesh_mahal" && isNearMirrorFountain && !showMirrorModal && (
        <div 
          className="absolute top-[62%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            discoverClue("sheesh_mirror_shard");
            setShowMirrorModal(true);
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Inspect Palace Mirror Fountain
        </div>
      )}

      {/* Khas Mahal Fountain Prompt */}
      {scene === "khas_mahal" && isNearKhasFountain && !showKhasModal && (
        <div 
          className="absolute top-[62%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowKhasModal(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Inspect Khas Mahal Pool
        </div>
      )}

      {/* Boat Ride Banner at Agra Fort / Taj Gate */}
      {scene === "gate" && playerPos.y >= 90.0 && (
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-4 py-1.5 rounded-full text-xs font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to take the royal ferry across Yamuna to Taj Mahal
        </div>
      )}

      {scene === "passage" && playerPos.y <= 62.0 && (
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Enter Diwan-i-Aam & Anguri Bagh
        </div>
      )}

      {scene === "passage" && playerPos.y >= 88.0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Amar Singh Gate
        </div>
      )}

      {scene === "courtyard" && playerPos.y <= 46.0 && (
        <div className="absolute top-[34%] left-[24%] -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Enter Diwan-i-Aam (Imperial Throne Hall)
        </div>
      )}

      {scene === "courtyard" && playerPos.x >= 75.0 && (
        <div className="absolute top-[46%] right-[10%] bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ► Enter Brown Palace Hallway
        </div>
      )}

      {scene === "courtyard" && playerPos.x <= 15.0 && playerPos.y >= 65.0 && (
        <div className="absolute bottom-[18%] left-[10%] bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ◄ Return to Ramp Passage
        </div>
      )}

      {scene === "interior" && playerPos.x >= 65.0 && (
        <div 
          className={`absolute top-[64%] right-[10%] border-2 border-black px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider animate-bounce z-10 cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${
            isPietraDuraSolved ? "bg-amber-400 text-black" : "bg-[#fed7aa] text-amber-950"
          }`}
          onClick={() => {
            if (isPietraDuraSolved) {
              setScene("sheesh_passage");
              setPlayerPos({ x: 50.0, y: 86.0 });
            } else {
              setThroneGuardSpeech("Halt! You must perform the Pietra Dura floral art before entering the Sheesh Mahal!");
              setTimeout(() => setThroneGuardSpeech(null), 5000);
              setShowPietraDuraPuzzle(true);
            }
          }}
        >
          <span className="bg-black text-amber-400 px-1.5 py-0.5 rounded mr-1.5 text-[10px]">E</span>
          {isPietraDuraSolved ? "Enter Sheesh Mahal Corridor" : "🔒 Corridor Locked (Perform Art First)"}
        </div>
      )}

      {scene === "interior" && playerPos.y >= 84.0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Anguri Bagh courtyard
        </div>
      )}

      {scene === "sheesh_passage" && playerPos.y <= 82.0 && (
        <div 
          className="absolute top-[48%] left-1/2 -translate-x-1/2 bg-amber-400 border-2 border-black px-4 py-1.5 rounded-full text-xs font-black text-black tracking-wider animate-bounce z-10 cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
          onClick={() => {
            setScene("sheesh_mahal");
            setPlayerPos({ x: 50.0, y: 86.0 });
          }}
        >
          <span className="bg-black text-amber-400 px-1.5 py-0.5 rounded mr-1.5 text-[10px]">E</span>
          Enter Sheesh Mahal (Palace of Mirrors)
        </div>
      )}

      {scene === "sheesh_passage" && playerPos.y >= 84.0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Diwan-i-Aam
        </div>
      )}

      {scene === "sheesh_mahal" && (
        <div 
          className="absolute bottom-[6%] left-1/2 -translate-x-1/2 bg-amber-400 border-2 border-black px-4 py-1.5 rounded-full text-xs font-black text-black tracking-wider animate-bounce z-10 cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
          onClick={() => {
            setScene("sheesh_passage");
            setPlayerPos({ x: 50.0, y: 78.0 });
          }}
        >
          <span className="bg-black text-amber-400 px-1.5 py-0.5 rounded mr-1.5 text-[10px]">F</span>
          Exit Sheesh Mahal (Return to Corridor)
        </div>
      )}

      {scene === "brown_passage" && playerPos.y <= 66.0 && (
        <div className="absolute top-[46%] left-[42%] -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Enter Khas Mahal Palace
        </div>
      )}

      {scene === "brown_passage" && playerPos.y >= 84.0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Anguri Bagh
        </div>
      )}

      {scene === "khas_mahal" && playerPos.y >= 84.0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to brown hallway
        </div>
      )}

      {scene === "taj_gate" && playerPos.y <= 62.0 && isCalligraphySolved && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Walk forward to enter Charbagh Gardens
        </div>
      )}

      {scene === "taj_charbagh" && playerPos.y <= 20.0 && isSymmetrySolved && (
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Walk up to the Taj Mahal Outside Terrace
        </div>
      )}

      {scene === "taj_charbagh" && playerPos.y >= 88.0 && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Great Gate
        </div>
      )}

      {scene === "taj_exterior" && isNearTajPishtaq && (
        <div 
          className="absolute top-[38%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            setScene("taj_mausoleum");
            setPlayerPos({ x: 50.0, y: 86.0 });
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 py-0.5 text-[10px]">E</span>
          Enter Mausoleum Chamber
        </div>
      )}

      {scene === "taj_exterior" && isNearMehtabBaghCross && (
        <div 
          className="absolute top-[52%] right-6 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            setScene("taj_mehtab_bagh");
            setPlayerPos({ x: 50.0, y: 50.0 });
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 py-0.5 text-[10px]">F</span>
          Cross River to Mehtab Bagh
        </div>
      )}

      {scene === "taj_exterior" && playerPos.y >= 94.0 && (
        <div 
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            setScene("taj_charbagh");
            setPlayerPos({ x: 45.0, y: 20.0 });
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Return to Charbagh Gardens
        </div>
      )}

      {scene === "taj_mausoleum" && playerPos.y >= 85.0 && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Outside Terrace
        </div>
      )}

      {scene === "taj_mehtab_bagh" && playerPos.y <= 55.0 && (
        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Cross River Pier back to Taj Mahal Exterior
        </div>
      )}

      {scene === "taj_mehtab_bagh" && isArchaeologistTalked && playerPos.x >= 75.0 && (
        <div className="absolute bottom-[14%] right-8 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ► Move right to board carriage to Delhi
        </div>
      )}

      {scene === "red_fort_lahori" && playerPos.y <= 58.0 && (
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Enter Lahori Gate
        </div>
      )}

      {/* --- MAIN HERO PLAYER CHARACTER SPRITE --- */}
      <div 
        className="absolute pointer-events-none flex flex-col items-center z-20"
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transformOrigin: "bottom center",
          transform: `translate(-50%, -96%) scale(${depthScale}) scaleX(${facingLeft ? -1 : 1})`,
        }}
      >
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

      {/* --- ROYAL SCROLL / CLUE MODAL (Throne Room Discovery) --- */}
      {showThroneScroll && scene === "interior" && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span>📜</span> Imperial Mughal Farman
              </span>
              <button 
                onClick={() => setShowThroneScroll(false)}
                className="text-gray-500 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="text-black font-serif text-[14px] leading-relaxed">
              <p className="mb-2 italic text-amber-950 font-bold">
                &ldquo;By Imperial Decree: The traveler was escorted through the eastern passage towards the Sheesh Mahal (Palace of Mirrors) for private consultation.&rdquo;
              </p>
              <p className="text-xs font-sans text-gray-700">
                ★ <strong className="text-black">New Objective:</strong> Head right through the colonnade archway to enter the Sheesh Mahal corridor!
              </p>
            </div>
            <button 
              onClick={() => setShowThroneScroll(false)}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
            >
              Continue to Sheesh Mahal
            </button>
          </div>
        </div>
      )}

      {/* --- SHEESH MAHAL / MIRROR MOSAIC MODAL --- */}
      {showMirrorModal && scene === "sheesh_mahal" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span>✨</span> Sheesh Mahal - Palace of Mirrors
              </span>
              <button 
                onClick={() => setShowMirrorModal(false)}
                className="text-gray-500 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="text-black font-serif text-[14px] leading-relaxed">
              <p className="mb-2 text-amber-950 font-bold">
                &ldquo;Thousands of imported Syrian convex glass mirrors glitter across the ceiling like a cosmic starry sky. In the reflection of the tranquil marble fountain, you discover the final royal signet of the Mughal dynasty!&rdquo;
              </p>
              <p className="text-xs font-sans text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 p-2 rounded">
                🏆 Quest Complete: You have fully explored the royal chambers of Agra Fort and uncovered the mystery of the Mughal court!
              </p>
            </div>
            <button 
              onClick={() => setShowMirrorModal(false)}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
            >
              Admire the Palace of Mirrors
            </button>
          </div>
        </div>
      )}

      {/* --- KHAS MAHAL MODAL --- */}
      {showKhasModal && scene === "khas_mahal" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span>🏛️</span> Khas Mahal — Yamuna River & Taj Mahal View
              </span>
              <button 
                onClick={() => setShowKhasModal(false)}
                className="text-gray-500 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="text-black font-serif text-[14px] leading-relaxed">
              <p className="mb-2 text-amber-950 font-bold">
                &ldquo;From this golden pavilion, Emperor Shah Jahan spent his twilight years gazing across the sparkling Yamuna River towards the Taj Mahal.&rdquo;
              </p>
              <p className="text-xs font-sans text-gray-700">
                ★ <strong className="text-black">Travel Option:</strong> Board a royal barge to cross the Yamuna River and explore the Taj Mahal complex directly!
              </p>
            </div>
            <button 
              onClick={() => {
                setShowKhasModal(false);
                startBoatTransition("taj_gate", { x: 50.0, y: 88.0 }, 5000);
              }}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 mt-2 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⛵</span> Board Boat Across Yamuna to Taj Mahal
            </button>
          </div>
        </div>
      )}

      {/* --- GUARD DIALOGUE MODAL --- */}
      {showDialogue && scene === "gate" && (
        <DialoguePanel 
          characterName="Amar Singh Gate Sentry"
          characterTitle="Agra Fort Royal Guard"
          characterId="guard"
          historicalContext={{
            current_year: 1653,
            era: "Mughal Empire",
            location: "Agra Fort - Amar Singh Gate",
            ruler: "Emperor Shah Jahan",
            nearby_monuments: "Amar Singh Gate, Elephant Gate (Hathi Pol), Yamuna River, Taj Mahal",
            historical_events: "Reign of Shah Jahan, construction of Taj Mahal across the Yamuna"
          }}
          dialogueText="Halt, intruder! Stop right where you stand! Beyond this Amar Singh Gate is restricted imperial ground! Answer immediately, or you will be seized!"
          isSpeaking={true}
          options={[
            { id: 1, text: "I am here to perform my talent in front of the court." },
            { id: 2, text: "Wait, who controls this imperial fort?" }
          ]}
          onOptionSelect={(opt) => {
            if (opt.id === 1) {
              hasGuardPermissionRef.current = true;
              setHasGuardPermission(true);
              discoverClue("guard_permit");
            } else {
              setGuardAttempts((prev) => {
                const next = prev + 1;
                if (next >= 3) {
                  hasGuardPermissionRef.current = true;
                  setHasGuardPermission(true);
                  discoverClue("guard_permit");
                }
                return next;
              });
            }
          }}
          onPunish={(punish) => {
            setShowDialogue(false);
            setPunishmentState({
              isOpen: true,
              ...punish
            });
          }}
          onClose={() => setShowDialogue(false)}
        />
      )}

      {/* --- JOLLY BHAI (GENIE) DIALOGUE MODAL WITH GROQ & LANGCHAIN ASK AI --- */}
      {showJollyDialogue && (
        <DialoguePanel 
          characterName="Jolly Bhai"
          characterTitle="Ancient Time-Traveling Genie Companion"
          characterId="jolly"
          historicalContext={{
            current_year: 1653,
            era: "Mughal Empire",
            location: scene === "gate" ? "Agra Fort - Amar Singh Gate" :
                      scene === "passage" ? "Agra Fort - Inner Ramp Passage" :
                      scene === "courtyard" ? "Agra Fort - Diwan-i-Aam Courtyard" :
                      scene === "interior" ? "Diwan-i-Aam (Imperial Throne Hall)" :
                      scene === "sheesh_passage" ? "Royal Marble Corridor" :
                      scene === "sheesh_mahal" ? "Sheesh Mahal (Palace of Mirrors)" :
                      scene === "khas_mahal" ? "Khas Mahal & Anguri Bagh" :
                      scene === "taj_gate" ? "Taj Mahal - Darwaza-i-Rauza (Great Gate)" :
                      scene === "taj_charbagh" ? "Taj Mahal - Charbagh Persian Gardens" :
                      scene === "taj_mausoleum" ? "Taj Mahal - Central Marble Chamber" :
                      scene === "taj_mehtab_bagh" ? "Mehtab Bagh (Moonlight Garden)" :
                      scene === "red_fort_plaza" ? "Red Fort - Lahori Gate Plaza" :
                      scene === "red_fort_interior" ? "Red Fort - Chatta Chowk Bazaars" :
                      "Red Fort - Diwan-i-Khas",
            ruler: "Emperor Shah Jahan",
            nearby_monuments: "Taj Mahal, Agra Fort, Amar Singh Gate, Yamuna River, Red Fort",
            historical_events: "Reign of Shah Jahan, completion of Taj Mahal, Mughal golden age"
          }}
          dialogueText={
            scene === "khas_mahal"
              ? "Mere aaka, let me share a bittersweet truth with you... The golden domes you see beside us were once layered in pure, solid gold and inlaid with precious gems. Tragically, the gold was stripped away during colonial rule in the 18th century, and over time, tourists stole the remaining stones. What remains today is only a quiet shadow of our lost Mughal splendour."
              : hasTalkedToJolly
              ? "Mere aaka, how can I help you?"
              : "Ah! Hello, traveller! I am Jolly Bhai. I was born many centuries ago and have witnessed great wars, powerful kingdoms, and the changing of history. But remember... only you can see me. I will guide you through this journey. And whenever you see me shaking and dancing like a madman... come quickly! It means I have something very important to tell you!"
          }
          isSpeaking={true}
          showInput={true}
          options={
            scene === "khas_mahal"
              ? [
                  { id: 1, text: "Why were the golden domes stripped of their gold?" },
                  { id: 2, text: "Tell me more about Khas Mahal and Anguri Bagh." },
                  { id: 3, text: "How do we cross the Yamuna River to the Taj Mahal?" }
                ]
              : [
                  { id: 1, text: "Who built the Taj Mahal and why?" },
                  { id: 2, text: "Tell me about Emperor Shah Jahan's reign." },
                  { id: 3, text: "Why is Agra Fort fortified so strongly?" }
                ]
          }
          onClose={() => setShowJollyDialogue(false)}
        />
      )}

      {/* Top Left: Scenario Quest Box & Clues */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 pointer-events-auto">
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-80 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest mb-0.5">
            {scene.startsWith("red_fort")
              ? "MUGHAL EMPIRE - RED FORT (OLD DELHI)"
              : scene.startsWith("taj")
              ? "MUGHAL EMPIRE - TAJ MAHAL COMPLEX"
              : scene === "gate"
              ? "MUGHAL EMPIRE - AGRA FORT (1653 AD)"
              : scene === "passage"
              ? "MUGHAL EMPIRE - INNER PASSAGE"
              : scene === "interior"
              ? "MUGHAL EMPIRE - DIWAN-I-AAM THRONE ROOM"
              : scene === "sheesh_mahal"
              ? "MUGHAL EMPIRE - SHEESH MAHAL"
              : scene === "khas_mahal"
              ? "MUGHAL EMPIRE - KHAS MAHAL"
              : "MUGHAL EMPIRE - DIWAN-I-AAM & ANGURI BAGH"}
          </div>
          <div className="text-[13px] font-black text-black leading-snug">
            {scene === "gate"
              ? hasGuardPermission || guardAttempts >= 1
                ? "You have clearance from the guard! Walk through the passage to reach the Diwan-i-Khas marble building."
                : "Talk to the Royal Guard at the gate to gain clearance into the palace."
              : scene === "passage"
              ? "Ascend the royal ramp passage to reach the Diwan-i-Khas marble building and Anguri Bagh."
              : scene === "courtyard"
              ? "Go to the white marble Diwan-i-Khas building (top-left palace) across the Anguri Bagh garden."
              : scene === "interior"
              ? isPietraDuraSolved
                ? "Pietra Dura Art performed! The passage to Sheesh Mahal is open to proceed."
                : "King Shah Jahan has gone for his prayers. Perform the famous Pietra Dura Marble Flower Art among the military guards or inspect the throne dais."
              : scene === "sheesh_passage"
              ? "Walk forward through the golden archway to enter the Sheesh Mahal (Palace of Mirrors)."
              : scene === "sheesh_mahal"
              ? isSheeshMirrorSolved
                ? "The starlight reflection is complete! The passage to Khas Mahal is open (Press F or door)."
                : "Position the candle and mirrors to form the Celestial Star on the ceiling dome."
              : scene === "brown_passage"
              ? "Walk through the colonnade to enter Khas Mahal, or walk down to return to the garden."
              : scene === "khas_mahal"
              ? "Inspect Khas Mahal and board the royal barge across Yamuna River to Taj Mahal."
              : scene === "taj_gate"
              ? !isCalligraphySolved
                ? "Decipher the sacred Thuluth calligraphy on the Great Gate to enter the Charbagh gardens."
                : "Walk through the Great Gate archway into the Charbagh gardens."
              : scene === "taj_charbagh"
              ? !isSymmetrySolved
                ? "Balance the Charbagh water gates to restore the fountains and unlock the path."
                : "Walk up the marble avenue to the Taj Mahal outside terrace."
              : scene === "taj_exterior"
              ? "Approach the main Pishtaq archway to enter the central mausoleum chamber, or press F to cross Yamuna."
              : scene === "taj_mausoleum"
              ? !isMausoleumExplored
                ? "Inspect the royal cenotaphs of Emperor Shah Jahan and Empress Mumtaz Mahal."
                : "Mausoleum fully explored! Walk down to exit to the terrace."
              : scene === "taj_mehtab_bagh"
              ? !isArchaeologistTalked
                ? "Explore Mehtab Bagh and talk to the Caretaker Archaeologist to locate your companion."
                : "Proceed to the bottom-right carriage to Delhi, or walk up across the pier to return to Taj exterior."
              : "Walk forward into the monumental Lahori Gate of the Red Fort."}
          </div>
        </div>

        {/* Interactive Dynamic Clues Box */}
        <div 
          onClick={() => setShowCluesModal(true)}
          className="bg-[#fff9ea] hover:bg-[#fff2cc] border-2 border-black rounded-lg px-4 py-2 w-max shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3 cursor-pointer transition-all active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] group"
          title="Click to inspect discovered historical clues"
        >
          <svg className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <div className="flex gap-1">
            {MUGHAL_HISTORICAL_CLUES.map((clue) => (
              <div 
                key={clue.id}
                className={`w-3.5 h-1.5 rounded-sm transition-all ${
                  discoveredClueIds.includes(clue.id) ? "bg-amber-500 shadow-sm" : "bg-amber-200"
                }`}
              ></div>
            ))}
          </div>
          <span className="text-[12px] font-extrabold text-black flex items-center gap-1.5">
            {discoveredClueIds.length}/{MUGHAL_HISTORICAL_CLUES.length} clues
            <span className="text-[10px] text-amber-700 underline font-bold group-hover:text-black">open</span>
          </span>
        </div>
      </div>

      {/* Top Right: Actions & Minimap */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
        <div className="flex items-center gap-2.5">
          {/* Silent Switchable Timer Button */}
          <button 
            onClick={() => setIsTimerVisible(!isTimerVisible)}
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-black">Timer</span>
            )}
          </button>

          <button 
            onClick={() => {
              soundFx.playButtonClick();
              setShowRestartConfirmModal(true);
            }}
            title="Restart to Beginning"
            className="h-10 bg-red-600 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-3 gap-1.5 group cursor-pointer"
          >
            <svg className="w-5 h-5 text-white group-hover:-rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span className="text-[13px] font-bold text-white">Restart</span>
          </button>
          <button className="w-10 h-10 bg-amber-400 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
          </button>
          <button className="w-10 h-10 bg-amber-400 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
          </button>
          <button onClick={() => router.push('/dashboard')} className="h-10 bg-red-600 border-2 border-black rounded-lg shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-4 cursor-pointer">
            <span className="text-[13px] font-bold text-white">Leave world</span>
          </button>
        </div>

        {/* Minimap Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-44 h-36 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          {["gate", "passage", "courtyard", "interior", "sheesh_passage", "sheesh_mahal", "brown_passage", "khas_mahal"].includes(scene) ? (
            <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-amber-50/50 rounded">
               <div className={scene === "sheesh_mahal" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "sheesh_passage" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "khas_mahal" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               
               <div className={scene === "interior" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "courtyard" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "brown_passage" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>

               <div className="bg-transparent"></div>
               <div className={scene === "passage" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "gate" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            </div>
          ) : ["taj_gate", "taj_charbagh", "taj_exterior", "taj_mausoleum", "taj_mehtab_bagh"].includes(scene) ? (
            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1 p-1 bg-amber-50/50 rounded">
               <div className={scene === "taj_charbagh" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "taj_exterior" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "taj_mausoleum" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               
               <div className={scene === "taj_gate" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className="bg-transparent"></div>
               <div className={scene === "taj_mehtab_bagh" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            </div>
          ) : (
            <div className="flex-1 flex bg-amber-50/50 rounded p-1 items-center justify-center">
               <div className="w-20 h-20 bg-amber-400 rounded-lg shadow-[0_0_8px_rgba(251,191,36,0.8)] border-2 border-black flex flex-col items-center justify-center text-center p-1 text-black">
                 <span className="text-[14px]">🚩</span>
                 <span className="text-[9px] font-extrabold tracking-wider uppercase mt-1 leading-none">Red Fort</span>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Center: Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-600 rounded-full px-6 py-2 shadow-lg flex items-center gap-3">
          <span className="text-white text-[12px] font-bold tracking-wider">WASD / arrows</span>
          <span className="text-gray-400 text-[10px]">- move -</span>
          <span className="text-white text-[12px] font-bold tracking-wider">E</span>
          <span className="text-gray-400 text-[10px]">- enter/inspect</span>
        </div>
      </div>

      {/* --- ARCHAEOLOGIST NPC (Mehtab Bagh) --- */}
      {scene === "taj_mehtab_bagh" && (
        <div
          className="absolute pointer-events-auto cursor-pointer z-10 flex flex-col items-center"
          style={{
            left: `${archaeologistPos.x}%`,
            top: `${archaeologistPos.y}%`,
            transform: `translate(-50%, -96%) scale(1.15)`,
          }}
          onClick={() => {
            setShowArchaeologistDialogue((prev) => !prev);
            playCharacterDialogue({
              character: "archaeologist",
              text: "Greetings! I am the caretaker archaeologist here. You are standing on the ruins of Mehtab Bagh's pond foundations."
            });
          }}
        >
          {isNearArchaeologist && !showArchaeologistDialogue && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Talk to Caretaker
            </div>
          )}

          <img
            src="/npc-archaeologist.png"
            alt="Caretaker Archaeologist NPC"
            className="w-32 h-32 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}

      {/* Mughal Royal Guards stationed in Anguri Bagh Courtyard */}
      {scene === "courtyard" && (
        <>
          {/* Diwan-i-Khas Marble Colonnade Guard (Left) */}
          <div className="absolute pointer-events-none z-10" style={{ left: '17%', top: '44%', transform: 'translate(-50%, -96%) scale(0.85)' }}>
            <img src="/guard.png" alt="Diwan-i-Khas Guard" className="w-24 h-24 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          {/* Diwan-i-Khas Marble Colonnade Guard (Right) */}
          <div className="absolute pointer-events-none z-10" style={{ left: '31%', top: '44%', transform: 'translate(-50%, -96%) scale(0.85)' }}>
            <img src="/guard.png" alt="Diwan-i-Khas Guard" className="w-24 h-24 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
          {/* Palace Terrace Sentry (Center North) */}
          <div className="absolute pointer-events-none z-10" style={{ left: '48%', top: '38%', transform: 'translate(-50%, -96%) scale(0.78)' }}>
            <img src="/guard.png" alt="Terrace Sentry" className="w-20 h-20 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          {/* Brown Palace Arcade Guard (Right) */}
          <div className="absolute pointer-events-none z-10" style={{ left: '84%', top: '52%', transform: 'translate(-50%, -96%) scale(0.95)' }}>
            <img src="/guard.png" alt="Palace Guard" className="w-26 h-26 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
        </>
      )}

      {/* Mughal Military Guards stationed in Imperial Throne Room (Interior) */}
      {scene === "interior" && (
        <>
          {/* Left Foreground Pillar Guard */}
          <div className="absolute pointer-events-none z-10" style={{ left: '13%', top: '88%', transform: 'translate(-50%, -96%) scale(1.15)' }}>
            <img src="/guard.png" alt="Imperial Guard" className="w-32 h-32 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          {/* Left Midground Colonnade Guard */}
          <div className="absolute pointer-events-none z-10" style={{ left: '28%', top: '78%', transform: 'translate(-50%, -96%) scale(0.95)' }}>
            <img src="/guard.png" alt="Imperial Guard" className="w-28 h-28 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          {/* Throne Dais Standing Guard (Beside Steps, Grounded on Carpet) */}
          <div className="absolute pointer-events-none z-15 flex flex-col items-center" style={{ left: '38%', top: '78%', transform: 'translate(-50%, -96%) scale(0.92)' }}>
            {throneGuardSpeech && (
              <div className="animate-bounce mb-1 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[11px] font-black text-black max-w-[200px] text-center leading-tight whitespace-normal">
                {throneGuardSpeech}
              </div>
            )}
            <img src="/guard.png" alt="Throne Dais Guard" className="w-28 h-28 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          {/* Right Midground Colonnade Guard */}
          <div className="absolute pointer-events-none z-10" style={{ left: '72%', top: '78%', transform: 'translate(-50%, -96%) scale(0.95)' }}>
            <img src="/guard.png" alt="Imperial Guard" className="w-28 h-28 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
          {/* Right Foreground Pillar Guard */}
          <div className="absolute pointer-events-none z-10" style={{ left: '87%', top: '88%', transform: 'translate(-50%, -96%) scale(1.15)' }}>
            <img src="/guard.png" alt="Imperial Guard" className="w-32 h-32 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
        </>
      )}

      {/* Mughal Traders in Taj Gate */}
      {scene === "taj_gate" && (
        <>
          <div className="absolute pointer-events-none z-10" style={{ left: '41%', top: '74%', transform: 'translate(-50%, -96%)' }}>
            <img src="/guard.png" alt="Mughal Guard" className="w-32 h-32 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '59%', top: '74%', transform: 'translate(-50%, -96%)' }}>
            <img src="/guard.png" alt="Mughal Guard" className="w-32 h-32 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '18%', top: '88%', transform: 'translate(-50%, -96%)' }}>
            <img src="/trader_pots_transparent.png" alt="Pot Trader" className="w-40 h-40 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '32%', top: '88%', transform: 'translate(-50%, -96%)' }}>
            <img src="/trader_toys_transparent.png" alt="Toy Trader" className="w-40 h-40 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '68%', top: '88%', transform: 'translate(-50%, -96%)' }}>
            <img src="/trader_marble_transparent.png" alt="Marble Trader" className="w-40 h-40 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '82%', top: '88%', transform: 'translate(-50%, -96%)' }}>
            <img src="/trader_spices_transparent.png" alt="Spice Trader" className="w-40 h-40 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
        </>
      )}

      {/* Horse Carriage Sprite in Mehtab Bagh */}
      {scene === "taj_mehtab_bagh" && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `78%`,
            top: `92%`,
            transform: `translate(-50%, -90%)`,
            zIndex: 5,
          }}
        >
          <img
            src="/carriage2_transparent.png"
            alt="Horse Carriage"
            className="w-[300px] md:w-[420px] h-auto object-contain"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      )}

      {/* Horse Carriage Sprite in Red Fort Lahori */}
      {scene === "red_fort_lahori" && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `2%`,
            top: `93%`,
            transform: `translate(0, -90%)`,
            zIndex: 5,
          }}
        >
          <img
            src="/carriage2_transparent.png"
            alt="Horse Carriage"
            className="w-[300px] md:w-[420px] h-auto object-contain"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      )}

      {/* Mughal Guards in Red Fort Plaza */}
      {scene === "red_fort_plaza" && (
        <>
          <div className="absolute pointer-events-none z-10" style={{ left: '41%', top: '51%', transform: 'translate(-50%, -96%) scale(0.95)' }}>
            <img src="/guard.png" alt="Mughal Guard" className="w-24 h-24 object-contain opacity-90" style={{ imageRendering: "pixelated", transform: "scaleX(1)" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '59%', top: '51%', transform: 'translate(-50%, -96%) scale(0.95)' }}>
            <img src="/guard.png" alt="Mughal Guard" className="w-24 h-24 object-contain opacity-90" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '38%', top: '76%', transform: 'translate(-50%, -96%) scale(1.15)' }}>
            <img src="/guard.png" alt="Mughal Guard" className="w-24 h-24 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(1)" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '62%', top: '76%', transform: 'translate(-50%, -96%) scale(1.15)' }}>
            <img src="/guard.png" alt="Mughal Guard" className="w-24 h-24 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
        </>
      )}

      {/* Mughal Traders in Red Fort Interior */}
      {scene === "red_fort_interior" && (
        <>
          <div className="absolute pointer-events-none z-10" style={{ left: '26%', top: '82%', transform: 'translate(-50%, -96%)' }}>
            <img src="/trader_silk_transparent.png" alt="Silk Trader" className="w-64 h-64 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="absolute pointer-events-none z-10" style={{ left: '72%', top: '80%', transform: 'translate(-50%, -96%)' }}>
            <img src="/trader_jewels_transparent.png" alt="Jewel Trader" className="w-64 h-64 object-contain" style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }} />
          </div>
        </>
      )}

      {/* Carriage Boarding Prompt in Mehtab Bagh */}
      {scene === "taj_mehtab_bagh" && isNearCarriage && (
        <div 
          className="absolute bottom-[16%] right-8 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-pulse animate-bounce"
          onClick={() => {
            setIsCarriageTravelling(true);
            setTravelOverlayPhase(1);
            setTimeout(() => {
              setTravelOverlayPhase(2);
              setTimeout(() => {
                setTravelOverlayPhase(3);
                setTimeout(() => {
                  setScene("red_fort_lahori");
                  setPlayerPos({ x: 50.0, y: 88.0 });
                  setIsCarriageTravelling(false);
                  setTravelOverlayPhase(0);
                }, 400);
              }, 1500);
            }, 500);
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Board Carriage to Delhi (Red Fort)
        </div>
      )}

      {/* Carriage Boarding Prompt in Red Fort Lahori */}
      {scene === "red_fort_lahori" && isNearRedFortCarriage && !showCampaignComplete && (
        <div 
          className="absolute bottom-[16%] left-16 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-pulse animate-bounce"
          onClick={() => {
            setIsCarriageTravelling(true);
            setTravelOverlayPhase(1);
            setTimeout(() => {
              setTravelOverlayPhase(2);
              setTimeout(() => {
                setTravelOverlayPhase(3);
                setTimeout(() => {
                  setScene("taj_mehtab_bagh");
                  setPlayerPos({ x: 75.0, y: 80.0 });
                  setIsCarriageTravelling(false);
                  setTravelOverlayPhase(0);
                }, 400);
              }, 1500);
            }, 500);
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Take Carriage back to Agra
        </div>
      )}

      {/* Lahori Gate Entrance Prompt */}
      {scene === "red_fort_lahori" && isNearLahoriGate && !showCampaignComplete && (
        <div 
          className="absolute top-[60%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            setScene("red_fort_plaza");
            setPlayerPos({ x: 50.0, y: 88.0 });
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Enter Lahori Gate
        </div>
      )}

      {/* Diwan-i-Khas Completion Prompt */}
      {scene === "red_fort_diwani_khas" && isNearDiwanIKhas && !showCampaignComplete && (
        <div 
          className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowCampaignComplete(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Conclude Campaign at Diwan-i-Khas
        </div>
      )}

      {/* Rang Mahal Exit Prompt */}
      {scene === "red_fort_rang_mahal" && isNearRangMahalExit && !showCampaignComplete && (
        <div 
          className="absolute bottom-[20%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            setScene("red_fort_plaza");
            setPlayerPos({ x: 65.0, y: 66.0 });
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Exit Palace
        </div>
      )}

      {/* Diwan-i-Khas Exit Prompt */}
      {scene === "red_fort_diwani_khas" && isNearDiwaniKhasExit && !showCampaignComplete && (
        <div 
          className="absolute bottom-[20%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            setScene("red_fort_plaza");
            setPlayerPos({ x: 35.0, y: 66.0 });
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Exit Palace
        </div>
      )}

      {/* Calligraphy Inspection Prompt (Taj Gate) */}
      {scene === "taj_gate" && isNearCalligraphy && !showCalligraphyPuzzle && !isCalligraphySolved && (
        <div 
          className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowCalligraphyPuzzle(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Decipher Inscription on Great Gate
        </div>
      )}

      {/* Symmetry Pool Inspection Prompt (Taj Charbagh) */}
      {scene === "taj_charbagh" && isNearPool && !showSymmetryPuzzle && !isSymmetrySolved && (
        <div 
          className="absolute top-[48%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowSymmetryPuzzle(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Inspect Charbagh Central Pool & Fountains
        </div>
      )}

      {/* Cenotaphs Inspection Prompt (Taj Mausoleum) */}
      {scene === "taj_mausoleum" && isNearCenotaphs && !showMausoleumModal && (
        <div 
          className="absolute top-[48%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowMausoleumModal(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Examine Royal Cenotaphs & Inscriptions
        </div>
      )}

      {/* --- CALLIGRAPHY PUZZLE MODAL --- */}
      {showCalligraphyPuzzle && scene === "taj_gate" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span>✒️</span> Darwaza-i-Rauza Calligraphy
              </span>
              <button 
                onClick={() => setShowCalligraphyPuzzle(false)}
                className="text-gray-500 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-black font-serif text-[14px] leading-relaxed">
              <p className="mb-2">
                The Great Gate is inscribed with black marble Arabic calligraphy created by the master calligrapher <strong>Amanat Khan</strong>. Complete the sacred verse from Surah Al-Fajr:
              </p>
              <div className="bg-amber-100/70 p-3 rounded-lg border border-amber-300 font-serif italic text-amber-900 text-center my-3 text-[15px]">
                &ldquo;O Soul, art thou at rest? Return to thy Lord at peace with Him, and He at <strong className="text-amber-600 uppercase underline">[?]</strong> with thee.&rdquo;
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Enter the missing word:</label>
              <input 
                type="text" 
                value={calligraphyInput}
                onChange={(e) => {
                  setCalligraphyInput(e.target.value);
                  setCalligraphyError(false);
                }}
                placeholder="Type word here..."
                className="border-2 border-black rounded-lg px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (calligraphyInput.trim().toLowerCase() === "peace") {
                      setIsCalligraphySolved(true);
                      discoverClue("calligraphy_scroll");
                      setShowCalligraphyPuzzle(false);
                    } else {
                      setCalligraphyError(true);
                    }
                  }
                }}
              />
              {calligraphyError && (
                <span className="text-red-600 text-xs font-bold font-sans">
                  ⚠️ Incorrect transcription! Try again. (Hint: opposite of war/conflict)
                </span>
              )}
            </div>

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={() => {
                  if (calligraphyInput.trim().toLowerCase() === "peace") {
                    setIsCalligraphySolved(true);
                    discoverClue("calligraphy_scroll");
                    setShowCalligraphyPuzzle(false);
                  } else {
                    setCalligraphyError(true);
                  }
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
              >
                Decipher Inscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FOUR-QUADRANT SYMMETRY PUZZLE MODAL --- */}
      {showSymmetryPuzzle && scene === "taj_charbagh" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span>⚖️</span> Charbagh Symmetry Puzzle
              </span>
              <button 
                onClick={() => setShowSymmetryPuzzle(false)}
                className="text-gray-500 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-black font-serif text-[14px] leading-relaxed">
              <p className="mb-2 text-amber-950">
                The Charbagh represents a perfect four-quadrant Mughal layout. Toggle the flow gates of all four quadrants to balance the water pressure symmetrically.
              </p>
              <p className="text-xs font-sans text-amber-900 font-bold mb-3">
                🎯 Goal: Make all quadrants ACTIVE (Green) to restore the fountains.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 my-2">
              {["North-West", "North-East", "South-West", "South-East"].map((label, idx) => (
                <button
                  key={label}
                  onClick={() => {
                    setSymmetryState((prev) => {
                      const next = [...prev];
                      next[idx] = !next[idx];
                      return next;
                    });
                  }}
                  className={`border-2 border-black rounded-lg py-3 px-2 flex flex-col items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors cursor-pointer ${
                    symmetryState[idx]
                      ? "bg-emerald-100 hover:bg-emerald-200 border-emerald-900 text-emerald-950"
                      : "bg-red-100 hover:bg-red-200 border-red-900 text-red-950"
                  }`}
                >
                  <span className="text-[11px] font-bold font-sans uppercase">{label}</span>
                  <span className="text-xs font-bold mt-1">
                    {symmetryState[idx] ? "🟢 ACTIVE" : "🔴 CLOSED"}
                  </span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => {
                const allActive = symmetryState.every((val) => val === true);
                if (allActive) {
                  setIsSymmetrySolved(true);
                  discoverClue("charbagh_paradise_map");
                  setShowSymmetryPuzzle(false);
                }
              }}
              disabled={!symmetryState.every((val) => val === true)}
              className={`border-2 border-black rounded-lg py-2.5 text-xs font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 w-full ${
                symmetryState.every((val) => val === true)
                  ? "bg-amber-400 hover:bg-amber-300 text-black cursor-pointer"
                  : "bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
              }`}
            >
              {symmetryState.every((val) => val === true) ? "Restore Fountains & Open Route" : "Balance Quadrants first..."}
            </button>
          </div>
        </div>
      )}

      {/* --- MAUSOLEUM INSCRIPTION / CENOTAPH DETAIL MODAL --- */}
      {showMausoleumModal && scene === "taj_mausoleum" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span>🕌</span> Royal Cenotaphs & Crypt
              </span>
              <button 
                onClick={() => setShowMausoleumModal(false)}
                className="text-gray-500 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-black font-serif text-[14px] leading-relaxed flex flex-col gap-3">
              <p>
                You stand inside the silent main chamber of the mausoleum, before the beautifully carved marble cenotaphs of Emperor Shah Jahan and Empress Mumtaz Mahal. 
              </p>
              <div className="bg-amber-100 border-l-4 border-amber-500 p-3 rounded-r-lg italic text-amber-950 font-serif">
                &ldquo;Note: These highly decorated marble cenotaphs are only for public viewing. The actual, historic graves of the royal couple lie in a completely unadorned, quiet brick crypt directly beneath this room at the garden level, in accordance with Islamic tradition that graves should not be ostentatious.&rdquo;
              </div>
              <p className="text-xs font-sans text-emerald-800 font-semibold bg-emerald-50 border border-emerald-300 p-2 rounded">
                ★ <strong className="text-black">Discovery:</strong> You have fully explored the main mausoleum chamber and learned the secret of the lower crypt!
              </p>
            </div>

            <button 
              onClick={() => {
                setIsMausoleumExplored(true);
                setShowMausoleumModal(false);
              }}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
            >
              Understand & Continue
            </button>
          </div>
        </div>
      )}

      {/* --- ARCHAEOLOGIST DIALOGUE MODAL --- */}
      {showArchaeologistDialogue && scene === "taj_mehtab_bagh" && (
        <DialoguePanel 
          characterName="Mehtab Bagh Caretaker"
          characterTitle="Archaeologist"
          historicalContext={{
            current_year: 1653,
            era: "Mughal Empire",
            location: "Mehtab Bagh (Moonlight Garden) - Agra",
            ruler: "Emperor Shah Jahan",
            nearby_monuments: "Taj Mahal across Yamuna River, Octagonal Pool ruins, Agra Fort",
            historical_events: "Myth of the Black Taj Mahal, completion of Taj Mahal complex"
          }}
          dialogueText="Greetings! I am the caretaker archaeologist here. You are standing on the ruins of Mehtab Bagh's pond foundations. See these scattered dark stone blocks? They inspired the legend that Shah Jahan wanted to build a 'Black Taj' out of black marble across the river as his own tomb. However, our excavations show these are actually part of a garden pool. The Black Taj remains a beautiful legend. Go to the bottom-right, a royal carriage is waiting to carry you to Delhi!"
          isSpeaking={true}
          options={[
            { id: 1, text: "Fascinating. I will proceed to the carriage." }
          ]}
          onOptionSelect={() => {
            setIsArchaeologistTalked(true);
            setShowArchaeologistDialogue(false);
          }}
          onClose={() => setShowArchaeologistDialogue(false)}
        />
      )}

      {/* --- CAMPAIGN COMPLETE MODAL --- */}
      {showCampaignComplete && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-black rounded-2xl p-8 shadow-[10px_10px_0_0_rgba(0,0,0,1)] max-w-xl w-full flex flex-col items-center text-center gap-5 relative animate-in zoom-in-95 duration-200">
            <span className="text-5xl">👑</span>
            <h2 className="text-2xl font-black text-black tracking-tight">Mughal Dynasty Campaign Mastered!</h2>
            <p className="text-sm font-serif text-gray-800 leading-relaxed">
              From the towering red ramparts of Agra Fort and the celestial marble domes of the Taj Mahal to the imperial Peacock Throne chamber at Red Fort Diwan-i-Khas, you have traversed 17th-century India and restored the lost chronicles of Emperor Shah Jahan!
            </p>
            <div className="bg-amber-100 border-2 border-black rounded-xl p-4 w-full text-xs font-bold text-amber-900 flex justify-around">
              <div>🎯 Clues Uncovered: <span className="text-black font-black">{discoveredClueIds.length}/6</span></div>
              <div>⏱️ Total Time: <span className="text-black font-black">{Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</span></div>
              <div>⭐ Status: <span className="text-emerald-700 font-black">History Restored</span></div>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-amber-400 hover:bg-amber-300 border-3 border-black rounded-xl px-8 py-3 text-sm font-black text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
            >
              Return to Timeline Portal 🚀
            </button>
          </div>
        </div>
      )}

      {/* --- CARRIAGE TRAVEL TRANSITION OVERLAY --- */}
      {isCarriageTravelling && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 pointer-events-auto">
          <div className="max-w-md flex flex-col items-center gap-4">
            <span className="text-5xl animate-bounce">🐎</span>
            <h3 className="text-xl font-serif text-amber-300 tracking-widest uppercase">
              {travelOverlayPhase === 1 ? "Harnessing Royal Steeds..." : travelOverlayPhase === 2 ? "Travelling Grand Trunk Road..." : "Arriving at Shahjahanabad..."}
            </h3>
            <p className="text-xs font-sans text-gray-300 leading-relaxed">
              {travelOverlayPhase === 1 && "Boarding the imperial Mughal carriage equipped with four swift stallions."}
              {travelOverlayPhase === 2 && "Galloping 200 kilometers north along the historic Grand Trunk Road towards Old Delhi."}
              {travelOverlayPhase === 3 && "The monumental Lahori Gate of Lal Qila (Red Fort) rises majestically before you."}
            </p>
            <div className="w-48 bg-gray-800 rounded-full h-2 overflow-hidden mt-2 border border-gray-600">
              <div 
                className="bg-amber-400 h-full transition-all duration-700 rounded-full"
                style={{ width: `${travelOverlayPhase * 33.3}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* --- CLUES INSPECTION MODAL --- */}
      {showCluesModal && (
        <CluesModal
          discoveredIds={discoveredClueIds}
          onClose={() => setShowCluesModal(false)}
        />
      )}

      {/* --- CLUE DISCOVERY POPUP NOTIFICATION --- */}
      {clueNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#fcd34d] border-3 border-black rounded-xl px-5 py-3 shadow-[5px_5px_0_0_rgba(0,0,0,1)] animate-bounce font-black text-sm text-black flex items-center gap-2 pointer-events-none">
          <span>💎</span>
          <span>{clueNotification}</span>
        </div>
      )}

      {/* --- CINEMATIC RETRIBUTION / PUNISHMENT SCREEN (The Fall Style) --- */}
      {punishmentState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black select-none animate-in fade-in duration-300">
          {/* Background Artwork - fully visible with natural lighting */}
          <img 
            src="/guard_punishment_cinematic.jpg" 
            alt="Imperial Guard Punishment"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Balanced cinematic shading: soft vignette that keeps artwork vibrant and text 100% readable */}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/70"></div>

          {/* Centered Content Card matching user 2nd image */}
          <div className="relative z-10 max-w-xl mx-auto px-6 py-12 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            {/* Small Orange Subtitle */}
            <span className="text-[#f97316] font-black text-xs sm:text-sm tracking-[0.35em] uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              {punishmentState.subtitle}
            </span>

            {/* Bold White Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 drop-shadow-[0_4px_16px_rgba(0,0,0,1)]">
              {punishmentState.title}
            </h1>

            {/* Narrative Description with subtle dark backdrop for maximum legibility */}
            <p className="text-[14px] sm:text-[15.5px] text-gray-100 font-sans leading-relaxed mb-8 max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,1)] font-medium bg-black/30 backdrop-blur-[2px] p-3 rounded-xl border border-white/10">
              {punishmentState.description}
            </p>

            {/* Yellow / Gold Rounded CTA Button */}
            <button
              onClick={() => {
                stopNarration();
                setPunishmentState(prev => ({ ...prev, isOpen: false }));
                setScene("gate");
                setPlayerPos({ x: 50.0, y: 88.0 });
              }}
              className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-sm px-8 py-3.5 rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer"
            >
              Return to Gates
            </button>
          </div>
        </div>
      )}

      {/* --- PIETRA DURA MARBLE FLOWER PUZZLE (50s Timer + Punishment) --- */}
      <PietraDuraPuzzleModal
        isOpen={showPietraDuraPuzzle}
        onClose={() => setShowPietraDuraPuzzle(false)}
        onSuccess={() => {
          setIsPietraDuraSolved(true);
          isPietraDuraSolvedRef.current = true;
          if (typeof window !== "undefined") {
            localStorage.setItem("mughal_is_pietra_dura_solved", "true");
          }
          setShowPietraDuraPuzzle(false);
          discoverClue("pietra_dura_seal");
          setShowThroneScroll(true);
          setThroneGuardSpeech("Bahut khoob! I give you as a prize permission to visit the Sheesh Mahal!");
          setTimeout(() => setThroneGuardSpeech(null), 10000);

          // Persist Win in MongoDB Database
          recordGameWinToDatabase({
            era: "mughal",
            gameType: "pietra_dura_flower_art",
            prizeUnlocked: "Sheesh Mahal Corridor Clearance",
            score: 150
          });

          playNarration(
            "You have earned royal clearance with your Pietra Dura marble art! The passage to the Sheesh Mahal is open.",
            {
              audioUrl: "/pietra_dura_solved_narration.wav",
              speaker: "ratan",
              pace: 0.88,
              language_code: "en-IN"
            }
          );

          playCharacterDialogue({
            character: "guard",
            text: "Bahut khoob! I give you as a prize permission to visit the Sheesh Mahal! Proceed through the royal corridor."
          });
        }}
        onTimeout={() => {
          setShowPietraDuraPuzzle(false);
          stopCharacterDialogue();
          setPunishmentState({
            isOpen: true,
            title: "Failed the Court Art Performance",
            subtitle: "DISGRACED BEFORE THE GUARDS",
            description: "Time ran out before you could arrange the sacred Pietra Dura marble floral art. The Emperor's military guards saw through your deception and expelled you outside the palace gates!"
          });
          setScene("gate");
          setPlayerPos({ x: 50.0, y: 88.0 });
        }}
      />

      {/* --- SHEESH MAHAL MIRROR REFLECTION PUZZLE --- */}
      <SheeshMirrorReflectionModal
        isOpen={showSheeshMirrorPuzzle}
        onClose={() => setShowSheeshMirrorPuzzle(false)}
        onSuccess={() => {
          setIsSheeshMirrorSolved(true);
          isSheeshMirrorSolvedRef.current = true;
          if (typeof window !== "undefined") {
            localStorage.setItem("mughal_is_sheesh_mirror_solved", "true");
          }
          setShowSheeshMirrorPuzzle(false);
          discoverClue("sheesh_mirror_shard");
          setShowKhasPermissionModal(true);

          // Persist Win in MongoDB Database
          recordGameWinToDatabase({
            era: "mughal",
            gameType: "sheesh_mahal_reflection",
            prizeUnlocked: "Permission to Khas Mahal",
            score: 250
          });

          playNarration(
            "The starlight reflections in the Sheesh Mahal shine brightly under your mastery! The royal passage to Khas Mahal is clear.",
            {
              audioUrl: "/sheesh_mahal_solved_narration.wav",
              speaker: "ratan",
              pace: 0.88,
              language_code: "en-IN"
            }
          );
        }}
      />

      {/* --- PRIZE UNLOCKED: PERMISSION TO KHAS MAHAL --- */}
      <KhasMahalPermissionModal
        isOpen={showKhasPermissionModal}
        onClose={() => setShowKhasPermissionModal(false)}
        onProceedToKhasMahal={() => {
          setShowKhasPermissionModal(false);
          setScene("brown_passage");
          setPlayerPos({ x: 30.0, y: 86.0 });
        }}
      />

      {/* --- RESTART CONFIRMATION MODAL --- */}
      {showRestartConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#fff9ea] border-4 border-black rounded-2xl p-6 max-w-md w-full shadow-[6px_6px_0_0_rgba(0,0,0,1)] text-center">
            <div className="w-14 h-14 bg-red-100 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-3 text-3xl shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              ⚠️
            </div>
            <h3 className="text-xl font-black text-black mb-2">
              Restart Mughal Odyssey?
            </h3>
            <p className="text-xs text-gray-700 font-medium leading-relaxed mb-6">
              Are you sure you want to start from again? Your current puzzle clearances, unlocked clues, and clearance decrees will be reset.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  soundFx.playButtonClick();
                  setShowRestartConfirmModal(false);
                  handleResetGame();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
              >
                Yes, Start Again
              </button>
              <button
                onClick={() => {
                  soundFx.playClose();
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

      {/* --- CINEMATIC NARRATOR SUBTITLES & AUDIO CONTROLS (Hidden during punishment screen) --- */}
      {!punishmentState.isOpen && <NarratorSubtitle />}
    </div>
  );
}
