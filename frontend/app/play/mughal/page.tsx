"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MughalGameScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [scene, setScene] = useState<"gate" | "passage" | "courtyard" | "interior" | "sheesh_passage" | "sheesh_mahal" | "brown_passage" | "khas_mahal" | "taj_gate" | "taj_charbagh" | "taj_exterior" | "taj_mausoleum" | "taj_mehtab_bagh" | "red_fort_lahori">("gate");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 85 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);
  const [showDialogue, setShowDialogue] = useState(false);
  const [showThroneScroll, setShowThroneScroll] = useState(false);
  const [showMirrorModal, setShowMirrorModal] = useState(false);
  const [showKhasModal, setShowKhasModal] = useState(false);
  const [cluesFound, setCluesFound] = useState(0);

  // New Taj Mahal & Red Fort state variables
  const [showCalligraphyPuzzle, setShowCalligraphyPuzzle] = useState(false);
  const [isCalligraphySolved, setIsCalligraphySolved] = useState(false);
  const [calligraphyInput, setCalligraphyInput] = useState("");
  const [calligraphyError, setCalligraphyError] = useState(false);

  const [showSymmetryPuzzle, setShowSymmetryPuzzle] = useState(false);
  const [isSymmetrySolved, setIsSymmetrySolved] = useState(false);
  const [symmetryState, setSymmetryState] = useState([true, false, true, false]);

  const [showMausoleumModal, setShowMausoleumModal] = useState(false);
  const [isMausoleumExplored, setIsMausoleumExplored] = useState(false);

  const [showArchaeologistDialogue, setShowArchaeologistDialogue] = useState(false);
  const [isArchaeologistTalked, setIsArchaeologistTalked] = useState(false);

  const [isCarriageTravelling, setIsCarriageTravelling] = useState(false);
  const [travelOverlayPhase, setTravelOverlayPhase] = useState(0);

  const [showCampaignComplete, setShowCampaignComplete] = useState(false);
  const router = useRouter();

  // Handle URL Endpoints and Save State
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlScene = urlParams.get('scene');
      const saved = localStorage.getItem('mughal_save');
      
      let finalScene = urlScene || 'gate';

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (!urlScene) {
             finalScene = parsed.scene || 'gate';
             if (parsed.playerPos) setPlayerPos(parsed.playerPos);
          }
          if (parsed.cluesFound !== undefined) setCluesFound(parsed.cluesFound);
          if (parsed.isCalligraphySolved !== undefined) setIsCalligraphySolved(parsed.isCalligraphySolved);
          if (parsed.isSymmetrySolved !== undefined) setIsSymmetrySolved(parsed.isSymmetrySolved);
          if (parsed.isMausoleumExplored !== undefined) setIsMausoleumExplored(parsed.isMausoleumExplored);
          if (parsed.isArchaeologistTalked !== undefined) setIsArchaeologistTalked(parsed.isArchaeologistTalked);
        } catch (e) {
          console.error("Failed to load save state", e);
        }
      }
      
      setScene(finalScene as any);
    }
    
    // Simulate loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Sync endpoint URL on scene change
  useEffect(() => {
    if (typeof window !== 'undefined' && scene !== 'gate') {
      window.history.replaceState(null, '', `?scene=${scene}`);
    } else if (typeof window !== 'undefined' && scene === 'gate') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [scene]);

  // Save game progress automatically on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const saveState = {
        scene,
        playerPos,
        cluesFound,
        isCalligraphySolved,
        isSymmetrySolved,
        isMausoleumExplored,
        isArchaeologistTalked
      };
      localStorage.setItem('mughal_save', JSON.stringify(saveState));
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [scene, playerPos, cluesFound, isCalligraphySolved, isSymmetrySolved, isMausoleumExplored, isArchaeologistTalked]);


  // Guard NPC Position (In 'gate' scene)
  const guardPos = { x: 43.5, y: 72.0 };

  // Calculate distance to guard for interaction prompt
  const distToGuard = Math.sqrt(
    Math.pow(playerPos.x - guardPos.x, 2) + Math.pow(playerPos.y - guardPos.y, 2)
  );
  const isNearGuard = scene === "gate" && distToGuard < 9.0;

  // Calculate distance to Royal Throne in interior scene
  const isNearThrone = scene === "interior" && playerPos.y <= 65.0 && playerPos.x >= 44.0 && playerPos.x <= 56.0;

  // Calculate distance to Mirror Fountain in Sheesh Mahal scene
  const isNearMirrorFountain = scene === "sheesh_mahal" && playerPos.y <= 78.0 && playerPos.y >= 63.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;

  // Calculate distance to Khas Mahal Pool / Pavilion
  const isNearKhasFountain = scene === "khas_mahal" && playerPos.y <= 78.0 && playerPos.y >= 64.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0;

  // Archaeologist NPC Position (In 'taj_mehtab_bagh' scene)
  const archaeologistPos = { x: 45.0, y: 72.0 };
  const distToArchaeologist = Math.sqrt(
    Math.pow(playerPos.x - archaeologistPos.x, 2) + Math.pow(playerPos.y - archaeologistPos.y, 2)
  );
  const isNearArchaeologist = scene === "taj_mehtab_bagh" && distToArchaeologist < 9.0;

  // Calligraphy Gate Proximity (In 'taj_gate' scene)
  const isNearCalligraphy = scene === "taj_gate" && playerPos.y <= 65.0 && playerPos.x >= 44.0 && playerPos.x <= 56.0;

  // Symmetry Pool Proximity (In 'taj_charbagh' scene)
  const isNearPool = scene === "taj_charbagh" && playerPos.y <= 58.0 && playerPos.y >= 42.0 && playerPos.x >= 42.0 && playerPos.x <= 58.0;

  // Outside Taj Pishtaq Arch Proximity (In 'taj_exterior' scene)
  const isNearTajPishtaq = scene === "taj_exterior" && playerPos.y <= 75.0 && playerPos.x >= 42.0 && playerPos.x <= 58.0;

  // Cenotaphs Proximity (In 'taj_mausoleum' scene)
  const isNearCenotaphs = scene === "taj_mausoleum" && playerPos.y <= 62.0 && playerPos.y >= 38.0 && playerPos.x >= 38.0 && playerPos.x <= 62.0;

  // Carriage Exit Proximity (In 'taj_mehtab_bagh' scene)
  const isNearCarriage = scene === "taj_mehtab_bagh" && isArchaeologistTalked && playerPos.x >= 80.0 && playerPos.y >= 80.0;

  // Lahori Gate Archway Proximity (In 'red_fort_lahori' scene)
  const isNearLahoriGate = scene === "red_fort_lahori" && playerPos.y <= 58.0 && playerPos.x >= 45.0 && playerPos.x <= 55.0;



  // Smooth continuous 60fps movement game loop
  useEffect(() => {
    if (isLoading || isTransitioning) return;

    const keysHeld = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      keysHeld.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e") {
        if (isNearGuard) {
          setShowDialogue((prev) => {
            if (!prev && cluesFound === 0) setCluesFound(1);
            return !prev;
          });
        }
        if (isNearThrone) {
          setShowThroneScroll((prev) => {
            if (!prev && cluesFound < 2) setCluesFound(2);
            return !prev;
          });
        }
        if (isNearMirrorFountain) {
          setShowMirrorModal((prev) => {
            if (!prev && cluesFound < 3) setCluesFound(3);
            return !prev;
          });
        }
        if (isNearKhasFountain) {
          setShowKhasModal(true);
        }
        if (isNearCalligraphy && !isCalligraphySolved) {
          setShowCalligraphyPuzzle(true);
        }
        if (isNearPool && !isSymmetrySolved) {
          setShowSymmetryPuzzle(true);
        }
        if (isNearTajPishtaq) {
          setIsTransitioning(true);
          setTimeout(() => {
            setScene("taj_mausoleum");
            setPlayerPos({ x: 50.0, y: 86.0 });
            setIsTransitioning(false);
          }, 400);
        }
        if (isNearCenotaphs && !isMausoleumExplored) {
          setShowMausoleumModal(true);
        }
        if (isNearArchaeologist) {
          setShowArchaeologistDialogue((prev) => !prev);
        }
        if (isNearCarriage) {
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
              }, 2500);
            }, 2500);
          }, 2000);
        }
      }
      if (e.key === "Escape") {
        setShowDialogue(false);
        setShowThroneScroll(false);
        setShowMirrorModal(false);
        setShowKhasModal(false);
        setShowCalligraphyPuzzle(false);
        setShowSymmetryPuzzle(false);
        setShowMausoleumModal(false);
        setShowArchaeologistDialogue(false);
        setShowCampaignComplete(false);
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
      const speed = 0.35; // Smooth 60fps movement speed

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
            // Dynamic bridge width along perspective ramp
            const rampProgress = Math.max(0, Math.min(1, (prev.y - 71.5) / (92.0 - 71.5)));
            const minX = 42.0 - rampProgress * 4.0;
            const maxX = 58.0 + rampProgress * 4.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(71.0, Math.min(92.0, prev.y + dy));

            // Check trigger to enter passage through the archway
            if (nextY <= 71.8 && nextX >= 47.0 && nextX <= 53.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("passage");
                setPlayerPos({ x: 33.0, y: 90.0 });
                setIsTransitioning(false);
                if (cluesFound < 1) setCluesFound(1);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "passage") {
            // In Inner Passage Scene: Curving stone ramp ascending towards Elephant Gate
            const t = Math.max(0, Math.min(1, (prev.y - 58.0) / (91.0 - 58.0))); // 0 at top gate, 1 at bottom
            const centerX = 52.0 - (1.0 - Math.pow(1.0 - t, 1.6)) * 19.0;
            const halfWidth = 4.0 + t * 8.0;

            const minX = centerX - halfWidth;
            const maxX = centerX + halfWidth;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(58.0, Math.min(92.0, prev.y + dy));

            // Walk up into the Elephant Gate arch to enter Diwan-i-Aam & Anguri Bagh
            if (nextY <= 59.2 && nextX >= 48.0 && nextX <= 56.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("courtyard");
                setPlayerPos({ x: 18.0, y: 72.0 });
                setIsTransitioning(false);
              }, 400);
            }

            // Walk back down to return to gate
            if (nextY >= 91.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("gate");
                setPlayerPos({ x: 50.0, y: 73.5 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "courtyard") {
            // In Courtyard Scene (Diwan-i-Aam & Anguri Bagh Garden)
            const minX = 8.0;
            const maxX = 92.0;
            const minY = 40.0; // White marble palace terrace
            const maxY = 76.0; // Foreground marble avenue

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk up the marble pavilion stairs on left into Diwan-i-Aam interior
            if (nextX <= 32.0 && nextY <= 43.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("interior");
                setPlayerPos({ x: 50.0, y: 86.0 });
                setIsTransitioning(false);
              }, 400);
            }

            // Walk into the brown palace arcade on right into Brown Hallway
            if (nextX >= 78.0 && nextY <= 54.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("brown_passage");
                setPlayerPos({ x: 30.0, y: 86.0 });
                setIsTransitioning(false);
              }, 400);
            }

            // Walk to bottom-left entrance edge to return to passage ramp
            if (nextX <= 9.0 && nextY >= 68.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("passage");
                setPlayerPos({ x: 51.0, y: 61.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "interior") {
            // In Diwan-i-Aam Interior Scene (Throne Room)
            const minX = 20.0;
            const maxX = 78.0;
            const minY = 62.0; // At foot of imperial throne
            const maxY = 88.0; // Entrance carpet

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk to the right colonnade passage to enter Sheesh Mahal corridor
            if (nextX >= 74.0 && nextY <= 74.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("sheesh_passage");
                setPlayerPos({ x: 50.0, y: 86.0 });
                setIsTransitioning(false);
              }, 400);
            }

            // Walk down to exit back to garden courtyard
            if (nextY >= 87.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("courtyard");
                setPlayerPos({ x: 26.0, y: 46.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "sheesh_passage") {
            // In Sheesh Mahal Royal Corridor Scene
            const minX = 32.0;
            const maxX = 68.0;
            const minY = 58.0; // At golden archway at end of corridor
            const maxY = 88.0; // Entrance from Diwan-i-Aam

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk into the golden archway to enter Sheesh Mahal (Palace of Mirrors)
            if (nextY <= 60.0 && nextX >= 44.0 && nextX <= 56.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("sheesh_mahal");
                setPlayerPos({ x: 50.0, y: 86.0 });
                setIsTransitioning(false);
              }, 400);
            }

            // Walk down to return to Diwan-i-Aam interior
            if (nextY >= 87.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("interior");
                setPlayerPos({ x: 70.0, y: 70.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "sheesh_mahal") {
            // In Sheesh Mahal (Palace of Mirrors) Scene
            const minX = 18.0;
            const maxX = 82.0;
            const minY = 60.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk down to exit back to the corridor
            if (nextY >= 87.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("sheesh_passage");
                setPlayerPos({ x: 50.0, y: 64.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "brown_passage") {
            // In Brown Palace Hallway (Jahangiri Mahal Gallery) Scene
            const minX = 22.0;
            const maxX = 65.0;
            const minY = 60.0; // Archway leading to Khas Mahal
            const maxY = 88.0; // Entrance from Anguri Bagh

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk through the sunlit archway into Khas Mahal
            if (nextY <= 62.0 && nextX >= 34.0 && nextX <= 50.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("khas_mahal");
                setPlayerPos({ x: 50.0, y: 86.0 });
                setIsTransitioning(false);
              }, 400);
            }

            // Walk down to return to Anguri Bagh courtyard
            if (nextY >= 87.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("courtyard");
                setPlayerPos({ x: 78.0, y: 52.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "khas_mahal") {
            // In Khas Mahal Palace (Shah Jahan's Private Palace) Scene
            const minX = 18.0;
            const maxX = 82.0;
            const minY = 64.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk down to exit back to the brown hallway
            if (nextY >= 87.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("brown_passage");
                setPlayerPos({ x: 42.0, y: 65.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_gate") {
            const minX = 20.0;
            const maxX = 80.0;
            const minY = 60.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walking through the archway to Charbagh (requires calligraphy solved)
            if (nextY <= 61.0 && nextX >= 45.0 && nextX <= 55.0) {
              if (isCalligraphySolved) {
                setIsTransitioning(true);
                setTimeout(() => {
                  setScene("taj_charbagh");
                  setPlayerPos({ x: 50.0, y: 88.0 });
                  setIsTransitioning(false);
                }, 400);
              } else {
                return { x: prev.x, y: Math.max(62.0, prev.y) };
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

            // Central water pool obstacle: block moving directly onto it (x in [48.5, 51.5] and y in [48.5, 51.5])
            // Independent axis checking to allow sliding along the edges
            if (nextX >= 48.5 && nextX <= 51.5 && nextY >= 48.5 && nextY <= 51.5) {
              if (prev.x < 48.5 || prev.x > 51.5) {
                nextX = prev.x; // Block horizontal entry
              } else if (prev.y < 48.5 || prev.y > 51.5) {
                nextY = prev.y; // Block vertical entry
              } else {
                // If somehow spawned inside, push them out
                nextY = 51.6;
              }
            }

            // Exiting to Taj Mahal outside exterior terrace (requires symmetry solved)
            if (nextY <= 16.0 && nextX >= 45.0 && nextX <= 55.0) {
              if (isSymmetrySolved) {
                setIsTransitioning(true);
                setTimeout(() => {
                  setScene("taj_exterior");
                  setPlayerPos({ x: 50.0, y: 88.0 });
                  setIsTransitioning(false);
                }, 400);
              } else {
                return { x: prev.x, y: Math.max(17.0, prev.y) };
              }
            }

            // Exiting back to taj_gate
            if (nextY >= 89.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("taj_gate");
                setPlayerPos({ x: 50.0, y: 64.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_exterior") {
            const minX = 15.0;
            const maxX = 88.0;
            const minY = 68.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walking into the central Pishtaq arch entrance to enter the Mausoleum
            if (nextY <= 70.0 && nextX >= 44.0 && nextX <= 56.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("taj_mausoleum");
                setPlayerPos({ x: 50.0, y: 86.0 });
                setIsTransitioning(false);
              }, 400);
            }

            // Walking towards the right to cross the river into Mehtab Bagh (Moonlight Garden)
            if (nextX >= 84.0 && nextY <= 84.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("taj_mehtab_bagh");
                setPlayerPos({ x: 50.0, y: 50.0 });
                setIsTransitioning(false);
              }, 400);
            }

            // Exiting back down to Charbagh gardens
            if (nextY >= 89.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("taj_charbagh");
                setPlayerPos({ x: 50.0, y: 20.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_mausoleum") {
            const minX = 15.0;
            const maxX = 85.0;
            const minY = 42.0;
            const maxY = 88.0;

            let nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            let nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Central jali screen obstacle: block x in [40, 60] and y in [40, 60]
            if (nextX >= 40.0 && nextX <= 60.0 && nextY >= 40.0 && nextY <= 60.0) {
              nextX = prev.x;
              nextY = prev.y;
            }

            // Exiting back to Taj Mahal outside exterior terrace
            if (nextY >= 87.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("taj_exterior");
                setPlayerPos({ x: 50.0, y: 74.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else if (scene === "taj_mehtab_bagh") {
            const minX = 10.0;
            const maxX = 90.0;
            const minY = 46.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walking north on the river pier bridge to return to Taj Mahal exterior
            if (nextY <= 48.0 && nextX >= 44.0 && nextX <= 56.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("taj_exterior");
                setPlayerPos({ x: 80.0, y: 78.0 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else {
            // In red_fort_lahori scene
            const minX = 15.0;
            const maxX = 85.0;
            const minY = 55.0;
            const maxY = 90.0;

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
  }, [isLoading, isTransitioning, scene, isNearGuard, isNearThrone, isNearMirrorFountain, isNearKhasFountain, isNearCalligraphy, isNearPool, isNearCenotaphs, isNearArchaeologist, isNearCarriage, isNearLahoriGate, isCalligraphySolved, isSymmetrySolved, isMausoleumExplored, isArchaeologistTalked, cluesFound]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-[#050403] items-center justify-center flex-col relative overflow-hidden font-sans">
        {/* Subtle background texture for loading screen */}
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

  // Perspective depth scaling (Enlarged for clear prominence and hero presence)
  const depthScale = scene === "gate"
    ? 1.22 + ((playerPos.y - 71.5) / 20.5) * 0.28
    : scene === "passage"
    ? 1.05 + ((playerPos.y - 58.0) / 33.0) * 0.65
    : scene === "courtyard"
    ? 0.90 + ((playerPos.y - 40.0) / 36.0) * 0.50
    : scene === "interior"
    ? 0.95 + ((playerPos.y - 62.0) / 26.0) * 0.45
    : scene === "sheesh_passage"
    ? 0.90 + ((playerPos.y - 58.0) / 30.0) * 0.50
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
    ? 0.95 + ((playerPos.y - 68.0) / 24.0) * 0.45
    : scene === "taj_mausoleum"
    ? 0.95 + ((playerPos.y - 35.0) / 53.0) * 0.45
    : scene === "taj_mehtab_bagh"
    ? 0.95 + ((playerPos.y - 40.0) / 48.0) * 0.45
    : 0.95 + ((playerPos.y - 55.0) / 35.0) * 0.40;

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
    return "/bg-red-fort-lahori.jpg";
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
    if (scene === "taj_gate") return "Entering the Taj Mahal Charbagh Gardens...";
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
    if (scene === "red_fort_lahori") return "Entering the Red Fort...";
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

      {/* Screen Darkening/Vignette Overlay */}
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
            setShowDialogue((prev) => {
              if (!prev && cluesFound === 0) setCluesFound(1);
              return !prev;
            });
          }}
        >
          {/* Guard Proximity Indicator / Speech Bubble */}
          {isNearGuard && !showDialogue && (
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

      {/* Throne Inspection Prompt (Interior Scene) */}
      {scene === "interior" && isNearThrone && !showThroneScroll && (
        <div 
          className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowThroneScroll(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Inspect Imperial Throne Dais
        </div>
      )}

      {/* Mirror Fountain Inspection Prompt (Sheesh Mahal Scene) */}
      {scene === "sheesh_mahal" && isNearMirrorFountain && !showMirrorModal && (
        <div 
          className="absolute top-[62%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowMirrorModal(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Examine Fountain & Mirror Mosaics
        </div>
      )}

      {/* Khas Mahal Pool / River View Prompt (Khas Mahal Scene) */}
      {scene === "khas_mahal" && isNearKhasFountain && !showKhasModal && (
        <div 
          className="absolute top-[62%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowKhasModal(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Gaze Across Yamuna River & Inspect Pavilion
        </div>
      )}

      {/* Navigation Prompts */}
      {scene === "gate" && playerPos.y <= 74.0 && (
        <div className="absolute top-[63%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Walk forward into the archway
        </div>
      )}

      {scene === "passage" && playerPos.y <= 62.0 && (
        <div className="absolute top-[48%] left-[52%] -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Enter Elephant Gate (Hathi Pol)
        </div>
      )}

      {scene === "passage" && playerPos.y >= 88.0 && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Amar Singh Gate
        </div>
      )}

      {scene === "courtyard" && playerPos.x <= 35.0 && playerPos.y <= 48.0 && (
        <div className="absolute top-[34%] left-[24%] -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Walk up the stairs into Diwan-i-Aam
        </div>
      )}

      {scene === "courtyard" && playerPos.x >= 70.0 && playerPos.y <= 58.0 && (
        <div className="absolute top-[34%] right-[10%] bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ► Enter Brown Palace (Jahangiri Mahal)
        </div>
      )}

      {scene === "courtyard" && playerPos.x <= 16.0 && (
        <div className="absolute bottom-[20%] left-6 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ◄ Walk left to return to passage ramp
        </div>
      )}

      {scene === "interior" && playerPos.x >= 70.0 && (
        <div className="absolute top-[50%] right-6 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ► Walk right to Sheesh Mahal corridor
        </div>
      )}

      {scene === "interior" && playerPos.y >= 84.0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to exit to garden courtyard
        </div>
      )}

      {scene === "sheesh_passage" && playerPos.y <= 62.0 && (
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Enter Sheesh Mahal (Palace of Mirrors)
        </div>
      )}

      {scene === "sheesh_passage" && playerPos.y >= 84.0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Diwan-i-Aam
        </div>
      )}

      {scene === "sheesh_mahal" && playerPos.y >= 84.0 && (
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to exit Sheesh Mahal
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

      {scene === "taj_exterior" && playerPos.y <= 76.0 && playerPos.x >= 40.0 && playerPos.x <= 60.0 && (
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Walk into the Central Pishtaq Archway (Enter Mausoleum)
        </div>
      )}

      {scene === "taj_exterior" && playerPos.x >= 75.0 && (
        <div className="absolute top-[52%] right-6 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ► Cross River to Mehtab Bagh (Moonlight Garden)
        </div>
      )}

      {scene === "taj_exterior" && playerPos.y >= 86.0 && (
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Charbagh Gardens
        </div>
      )}

      {/* Taj Exterior Pishtaq Interaction Button */}
      {scene === "taj_exterior" && isNearTajPishtaq && (
        <div 
          className="absolute top-[56%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("taj_mausoleum");
              setPlayerPos({ x: 50.0, y: 86.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Enter Taj Mahal Mausoleum Chamber
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

      {/* --- MAIN GUY PLAYER CHARACTER SPRITE --- */}
      <div 
        className="absolute pointer-events-none flex flex-col items-center z-20"
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transform: `translate(-50%, -96%) scale(${depthScale}) scaleX(${facingLeft ? -1 : 1})`,
        }}
      >
        {/* Character Sprite Image with smooth footstep cadence */}
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
                className="text-gray-500 hover:text-black font-bold text-sm"
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
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
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
                className="text-gray-500 hover:text-black font-bold text-sm"
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
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
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
                className="text-gray-500 hover:text-black font-bold text-sm"
              >
                ✕ Close
              </button>
            </div>
            <div className="text-black font-serif text-[14px] leading-relaxed">
              <p className="mb-2 text-amber-950">
                &ldquo;As you gaze out across the tranquil Yamuna River from the royal pavilion, the shimmering white domes of the Taj Mahal appear across the water. A message left on the carved marble balustrade reads:&rdquo;
              </p>
              <div className="my-3 p-3 bg-amber-100 border-2 border-amber-500 rounded-xl text-amber-950 font-bold text-center text-[15px] shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                &ldquo;Go outside across the river to the Taj Mahal for your next clue!&rdquo;
              </div>
              <p className="text-xs font-sans text-amber-900 font-semibold bg-amber-50 border border-amber-300 p-2 rounded">
                ★ <strong className="text-black">Next Quest Milestone:</strong> Your companion has crossed the Yamuna towards the Taj Mahal!
              </p>
            </div>
            <button 
              onClick={() => {
                setShowKhasModal(false);
                setIsTransitioning(true);
                setTimeout(() => {
                  setScene("taj_gate");
                  setPlayerPos({ x: 50.0, y: 88.0 });
                  setIsTransitioning(false);
                }, 400);
              }}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
            >
              Acknowledge Clue & Continue
            </button>
          </div>
        </div>
      )}

      {/* --- GUARD DIALOGUE MODAL --- */}
      {showDialogue && scene === "gate" && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center pb-24 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-xl p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] max-w-xl w-full mx-4 flex gap-4 items-start relative animate-in fade-in zoom-in-95 duration-150">
            {/* Guard Avatar */}
            <div className="w-16 h-16 bg-amber-100 border-2 border-black rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <img src="/guard.png" alt="Guard Avatar" className="w-24 h-24 object-contain translate-y-3" style={{ imageRendering: "pixelated" }} />
            </div>

            {/* Dialogue Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-800 tracking-wider uppercase">Amar Singh Gate Sentry</span>
                <button 
                  onClick={() => setShowDialogue(false)}
                  className="text-gray-500 hover:text-black font-bold text-xs"
                >
                  ✕ Close (Esc)
                </button>
              </div>
              <p className="text-black font-semibold text-[13px] leading-relaxed mb-3">
                &ldquo;Halt, traveler! Beyond this Amar Singh Gate lies the imperial ramp passage leading to the Elephant Gate (Hathi Pol). Your missing companion was seen ascending the ramp toward the upper court! You may proceed through the arch.&rdquo;
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowDialogue(false)}
                  className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-md px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
                >
                  &ldquo;Thank you, guard. I will proceed.&rdquo;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- UI OVERLAYS (Light Neo-Brutalism) --- */}
      
      {/* Top Left: Quest Panel */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        {/* Main Quest Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-84">
          <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-2">
            Mughal Empire - {
              scene === "gate" ? "Amar Singh Gate" :
              scene === "passage" ? "Inner Ramp Passage" :
              scene === "courtyard" ? "Diwan-i-Aam & Anguri Bagh" :
              scene === "interior" ? "Imperial Throne Hall (Diwan-i-Aam)" :
              scene === "sheesh_passage" ? "Royal Marble Corridor" :
              scene === "sheesh_mahal" ? "Sheesh Mahal (Palace of Mirrors)" :
              scene === "brown_passage" ? "Jahangiri Palace (Brown Hallway)" :
              scene === "khas_mahal" ? "Khas Mahal (Private River Palace)" :
              scene === "taj_gate" ? "Darwaza-i-Rauza (Great Gate)" :
              scene === "taj_charbagh" ? "Charbagh Gardens" :
              scene === "taj_exterior" ? "Taj Mahal Outside Terrace" :
              scene === "taj_mausoleum" ? "Main Taj Mausoleum" :
              scene === "taj_mehtab_bagh" ? "Mehtab Bagh (Moonlight Garden)" :
              "Lahori Gate (Red Fort)"
            }
          </div>
          <div className="text-[14px] font-bold text-black leading-snug">
            {scene === "gate"
              ? cluesFound === 0
                ? "Go talk with the guard."
                : "Walk into the archway to ascend the fort passage."
              : scene === "passage"
              ? "Ascend the royal ramp towards the upper palaces (Hathi Pol)."
              : scene === "courtyard"
              ? "Explore Anguri Bagh. Enter Diwan-i-Aam on the left, or Brown Palace on the right."
              : scene === "interior"
              ? "Inspect the golden throne, then proceed right to the Sheesh Mahal corridor."
              : scene === "sheesh_passage"
              ? "Walk through the arched gallery towards the golden entrance of Sheesh Mahal."
              : scene === "sheesh_mahal"
              ? "Approach and examine the central marble fountain and glittering mirror ceiling."
              : scene === "brown_passage"
              ? "Proceed through the carved red sandstone gallery towards Khas Mahal."
              : scene === "khas_mahal"
              ? "Gaze out at the Yamuna and read the clue, then continue across the river."
              : scene === "taj_gate"
              ? !isCalligraphySolved
                ? "Approach the Great Gate and examine the calligraphy puzzle (press E)."
                : "Walk through the Great Gate archway."
              : scene === "taj_charbagh"
              ? !isSymmetrySolved
                ? "Approach the central lotus pool and examine the symmetry puzzle (press E)."
                : "Walk up the central marble path to the Taj Mahal outside terrace."
              : scene === "taj_exterior"
              ? "Enter the Mausoleum through the central arch, or move to the right to cross the Yamuna to Mehtab Bagh."
              : scene === "taj_mausoleum"
              ? !isMausoleumExplored
                ? "Approach the central jali screen and examine the cenotaphs (press E)."
                : "Exit back out to the marble terrace."
              : scene === "taj_mehtab_bagh"
              ? !isArchaeologistTalked
                ? "Explore Mehtab Bagh and talk to the Caretaker Archaeologist (press E)."
                : "Proceed to the bottom-right carriage to Delhi, or walk up across the pier to return to Taj exterior."
              : "Walk forward into the monumental Lahori Gate of the Red Fort."}
          </div>
        </div>

        {/* Clues Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 w-max shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <div className="flex gap-1">
            <div className={`w-3 h-1 ${cluesFound >= 1 ? "bg-amber-500" : "bg-amber-200"}`}></div>
            <div className={`w-3 h-1 ${cluesFound >= 2 ? "bg-amber-500" : "bg-amber-200"}`}></div>
            <div className={`w-3 h-1 ${cluesFound >= 3 ? "bg-amber-500" : "bg-amber-200"}`}></div>
          </div>
          <span className="text-[12px] font-bold text-black">{cluesFound}/3 clues</span>
        </div>
      </div>

      {/* Top Right: Actions & Minimap */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
        {/* Buttons Row */}
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-white border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          <button className="w-10 h-10 bg-amber-400 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
          </button>
          <button className="w-10 h-10 bg-amber-400 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
          </button>
          <button onClick={() => router.push('/dashboard')} className="h-10 bg-white border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-4">
            <span className="text-[13px] font-bold">Leave world</span>
          </button>
        </div>

        {/* Minimap Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-44 h-36 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          {["gate", "passage", "courtyard", "interior", "sheesh_passage", "sheesh_mahal", "brown_passage", "khas_mahal"].includes(scene) ? (
            <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-amber-50/50 rounded">
               {/* Dynamic Minimap of Agra Fort 8-room complex */}
               <div className={scene === "sheesh_mahal" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div> {/* Sheesh Mahal */}
               <div className={scene === "sheesh_passage" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div> {/* Sheesh Corridor */}
               <div className={scene === "khas_mahal" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div> {/* Khas Mahal */}
               
               <div className={scene === "interior" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div> {/* Diwan-i-Aam Interior */}
               <div className={scene === "courtyard" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div> {/* Courtyard */}
               <div className={scene === "brown_passage" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div> {/* Brown Hallway */}

               <div className="bg-transparent"></div>
               <div className={scene === "passage" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div> {/* Ramp Passage */}
               <div className={scene === "gate" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div> {/* Amar Singh Gate */}
            </div>
          ) : ["taj_gate", "taj_charbagh", "taj_exterior", "taj_mausoleum", "taj_mehtab_bagh"].includes(scene) ? (
            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1 p-1 bg-amber-50/50 rounded">
               {/* Minimap of Taj Mahal complex */}
               <div className={scene === "taj_charbagh" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "taj_exterior" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className={scene === "taj_mausoleum" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               
               <div className={scene === "taj_gate" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
               <div className="bg-transparent"></div>
               <div className={scene === "taj_mehtab_bagh" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            </div>
          ) : (
            <div className="flex-1 flex bg-amber-50/50 rounded p-1 items-center justify-center">
               {/* Red Fort minimap */}
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

      {/* Bottom Right: Stats */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <div className="bg-[#fff9ea] border-2 border-black rounded px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-black"><span className="text-amber-600 mr-1">⚡</span>33 generations</span>
        </div>
        <div className="bg-[#fff9ea] border-2 border-black rounded px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-black"><span className="text-amber-600 mr-1">👁</span>14 screens</span>
        </div>
        <div className="bg-[#fff9ea] border-2 border-black rounded px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-black">
            <span className="text-amber-600 mr-1">🚪</span>
            {(() => {
              const rooms = {
                gate: 1,
                passage: 2,
                courtyard: 3,
                interior: 4,
                sheesh_passage: 5,
                sheesh_mahal: 6,
                brown_passage: 7,
                khas_mahal: 8,
                taj_gate: 9,
                taj_charbagh: 10,
                taj_exterior: 11,
                taj_mausoleum: 12,
                taj_mehtab_bagh: 13,
                red_fort_lahori: 14
              };
              const current = (rooms as any)[scene] || 1;
              return `rooms ${current}/14`;
            })()}
          </span>
        </div>
      </div>

      {/* --- ARCHAEOLOGIST NPC (Only in Mehtab Bagh Scene) --- */}
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
          }}
        >
          {/* Proximity Speech Bubble */}
          {isNearArchaeologist && !showArchaeologistDialogue && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Talk to Caretaker
            </div>
          )}

          {/* Archaeologist Sprite */}
          <img
            src="/npc-archaeologist.png"
            alt="Caretaker Archaeologist NPC"
            className="w-32 h-32 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
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
                }, 2500);
              }, 2500);
            }, 2000);
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Board Carriage to Delhi (Red Fort)
        </div>
      )}

      {/* Calligraphy Inspection Prompt (Taj Gate) */}
      {scene === "taj_gate" && isNearCalligraphy && !showCalligraphyPuzzle && !isCalligraphySolved && (
        <div 
          className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowCalligraphyPuzzle(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Examine Calligraphy Inscription
        </div>
      )}

      {/* Symmetry Puzzle Prompt (Taj Charbagh) */}
      {scene === "taj_charbagh" && isNearPool && !showSymmetryPuzzle && !isSymmetrySolved && (
        <div 
          className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowSymmetryPuzzle(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Examine Lotus Pool & Fountains
        </div>
      )}

      {/* Cenotaph Detail Prompt (Taj Mausoleum) */}
      {scene === "taj_mausoleum" && isNearCenotaphs && !showMausoleumModal && !isMausoleumExplored && (
        <div 
          className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-[12px] font-bold text-black flex items-center gap-2 cursor-pointer z-10 animate-bounce"
          onClick={() => setShowMausoleumModal(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[10px]">E</span>
          Inspect Royal Cenotaphs
        </div>
      )}

      {/* --- CALLIGRAPHY INSCRIPTION PUZZLE MODAL --- */}
      {showCalligraphyPuzzle && scene === "taj_gate" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span>✍️</span> Great Gate Inscription Puzzle
              </span>
              <button 
                onClick={() => {
                  setShowCalligraphyPuzzle(false);
                  setCalligraphyError(false);
                }}
                className="text-gray-500 hover:text-black font-bold text-sm"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="text-black font-serif text-[14.5px] leading-relaxed">
              <p className="mb-3 text-amber-950">
                The massive red sandstone arch of the Darwaza-i-Rauza is inscribed with calligraphy. To unlock the gates, decode the given calligraphy:
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
                className="border-2 border-black rounded-lg px-3 py-2 text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (calligraphyInput.trim().toLowerCase() === "peace") {
                      setIsCalligraphySolved(true);
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
                    setShowCalligraphyPuzzle(false);
                  } else {
                    setCalligraphyError(true);
                  }
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
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
                className="text-gray-500 hover:text-black font-bold text-sm"
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

            {/* Symmetry Toggle Buttons */}
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
                  className={`border-2 border-black rounded-lg py-3 px-2 flex flex-col items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors ${
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
                className="text-gray-500 hover:text-black font-bold text-sm"
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
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
            >
              Understand & Continue
            </button>
          </div>
        </div>
      )}

      {/* --- ARCHAEOLOGIST DIALOGUE MODAL --- */}
      {showArchaeologistDialogue && scene === "taj_mehtab_bagh" && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center pb-24 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-xl p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] max-w-xl w-full mx-4 flex gap-4 items-start relative animate-in fade-in zoom-in-95 duration-150">
            {/* Archaeologist Avatar */}
            <div className="w-16 h-16 bg-amber-100 border-2 border-black rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <img src="/npc-archaeologist.png" alt="Archaeologist Avatar" className="w-24 h-24 object-contain translate-y-3" style={{ imageRendering: "pixelated" }} />
            </div>

            {/* Dialogue Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-800 tracking-wider uppercase">Mehtab Bagh Caretaker</span>
                <button 
                  onClick={() => setShowArchaeologistDialogue(false)}
                  className="text-gray-500 hover:text-black font-bold text-xs"
                >
                  ✕ Close (Esc)
                </button>
              </div>
              <p className="text-black font-semibold text-[13px] leading-relaxed mb-3">
                &ldquo;Greetings! I am the caretaker archaeologist here. You are standing on the ruins of Mehtab Bagh's pond foundations. See these scattered dark stone blocks? They inspired the legend that Shah Jahan wanted to build a 'Black Taj' out of black marble across the river as his own tomb. However, our excavations show these are actually part of a garden pool. The Black Taj remains a beautiful legend. Go to the bottom-right, a royal carriage is waiting to carry you to Delhi!&rdquo;
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setIsArchaeologistTalked(true);
                    setShowArchaeologistDialogue(false);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-md px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
                >
                  &ldquo;Fascinating. I will proceed to the carriage.&rdquo;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carriage Journey Fullscreen Overlay */}
      {isCarriageTravelling && (
        <div className="absolute inset-0 bg-[#0d0a07] z-50 flex items-center justify-center flex-col relative overflow-hidden pointer-events-auto">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-radial-gradient from-amber-900/10 via-black to-black opacity-80"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            {/* Spinning indicator */}
            <div className="w-12 h-12 border-4 border-amber-900/30 border-t-amber-400 rounded-full animate-spin mb-8"></div>
            
            {travelOverlayPhase === 1 && (
              <>
                <h2 className="text-2xl font-serif text-[#e4c794] tracking-widest uppercase mb-3 animate-pulse">
                  Agra Exit
                </h2>
                <p className="text-[#a89985] tracking-wide text-sm font-sans uppercase">
                  Boarding the carriage to Delhi...
                </p>
              </>
            )}
            
            {travelOverlayPhase === 2 && (
              <>
                <h2 className="text-2xl font-serif text-[#e4c794] tracking-widest uppercase mb-3 animate-pulse">
                  Imperial Journey
                </h2>
                <p className="text-[#a89985] tracking-wide text-sm font-sans uppercase">
                  Travelling towards Delhi...
                </p>
              </>
            )}
            
            {travelOverlayPhase === 3 && (
              <>
                <h2 className="text-2xl font-serif text-[#e4c794] tracking-widest uppercase mb-3 animate-pulse">
                  Sunset Over Yamuna
                </h2>
                <p className="text-[#a89985] tracking-wide text-sm font-sans uppercase mb-2">
                  Time passes...
                </p>
                <p className="text-amber-500 tracking-wider text-xs font-sans uppercase">
                  Evening falls...
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- CAMPAIGN COMPLETE MODAL --- */}
      {showCampaignComplete && scene === "red_fort_lahori" && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-2xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span>🏆</span> Mughal Campaign Complete!
              </span>
            </div>

            <div className="text-black font-serif text-[14px] leading-relaxed flex flex-col gap-3">
              <p className="font-bold text-amber-950">
                Congratulations, Historian!
              </p>
              <p>
                You have successfully completed your journey through the Mughal Empire's campaigns. From the defensive ramps of Agra Fort to the symmetrical gardens and sacred tombs of the Taj Mahal, and finally to the imperial Lahori Gate of the Red Fort in Delhi, you have unraveled the rich histories, architectural wonders, and long-standing mysteries of the Mughal dynasty.
              </p>
              <p className="text-xs font-sans text-emerald-800 font-semibold bg-emerald-50 border border-emerald-300 p-2 rounded">
                ✔ Completed 13 scenes of the Mughal Campaign!
              </p>
            </div>

            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg py-2.5 text-xs font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
