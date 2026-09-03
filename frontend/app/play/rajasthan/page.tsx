"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type RajasthanStage = 1 | 2 | 3 | 4 | 5 | 6;

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
  | "badal_mahal_terrace";

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

  // Modals & Dialogue state
  const [showChachaDialogue, setShowChachaDialogue] = useState(false);
  const [showChauparGame, setShowChauparGame] = useState(false);
  const [chauparScore, setChauparScore] = useState({ player: 0, chacha: 0 });
  const [chauparMessage, setChauparMessage] = useState("Roll the dice to challenge Buzurg Chacha in ancient Chaupar!");
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  const [showVijayStambhModal, setShowVijayStambhModal] = useState(false);
  const [showJauharModal, setShowJauharModal] = useState(false);
  const [cluesFound, setCluesFound] = useState(0);

  const router = useRouter();

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
      setCluesFound(0);
      setShowChachaDialogue(false);
      setShowChauparGame(false);
      setShowVijayStambhModal(false);
      setShowJauharModal(false);
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
          setStage(parseInt(urlStage, 10) as RajasthanStage);
        }
        if (urlScene) {
          setScene(urlScene);
        } else if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.stage) setStage(parsed.stage);
            if (parsed.scene) setScene(parsed.scene);
            if (parsed.playerPos) setPlayerPos(parsed.playerPos);
            if (typeof parsed.cluesFound === "number") setCluesFound(parsed.cluesFound);
          } catch (e) {
            console.error("Failed to load saved state", e);
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save game state to localStorage & sync URL search param whenever scene or playerPos changes
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      try {
        localStorage.setItem(
          "rajasthan_game_state",
          JSON.stringify({ stage, scene, playerPos, cluesFound })
        );
        const newUrl = `${window.location.pathname}?stage=${stage}&scene=${scene}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      } catch (e) {
        console.error("Failed to save game state", e);
      }
    }
  }, [stage, scene, playerPos, cluesFound, isLoading]);

  // Loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // --- PROXIMITY TRIGGERS ---
  // Ram Pol Gate Door (Prompt appears when standing right in front of the wooden door at X: 56..74, Y: 78..94)
  const isNearRamPolDoor =
    scene === "ram_pol" &&
    playerPos.x >= 56.0 &&
    playerPos.x <= 74.0 &&
    playerPos.y >= 78.0 &&
    playerPos.y <= 94.0;

  // Near Buzurg Chacha & Chaupar Table in Inner Courtyard (around X: 15..38, Y: 58..85)
  const isNearChacha =
    scene === "inner_courtyard" &&
    playerPos.x >= 15.0 &&
    playerPos.x <= 38.0 &&
    playerPos.y >= 58.0 &&
    playerPos.y <= 85.0;

  // Near Top of Courtyard Stairs (leads up to Passage Way) (around X: 72..90, Y: 42..56)
  const isNearCourtyardStairsTop =
    scene === "inner_courtyard" &&
    playerPos.x >= 72.0 &&
    playerPos.x <= 90.0 &&
    playerPos.y >= 42.0 &&
    playerPos.y <= 56.0;

  // Near doorway exit threshold in Inner Courtyard (bottom center X: 38..62, Y: 78..94)
  const isNearCourtyardExit =
    scene === "inner_courtyard" &&
    playerPos.x >= 38.0 &&
    playerPos.x <= 62.0 &&
    playerPos.y >= 78.0 &&
    playerPos.y <= 94.0;

  // Courtyard Passage Exit / Door
  const isNearPassageExit =
    scene === "courtyard_passage" && playerPos.y >= 88.0;

  // Vijay Stambh Entrance (standing at tower steps in vijay_stambh scene at X: 32..48, Y: 68..84)
  const isNearVijayStambhDoor =
    scene === "vijay_stambh" &&
    playerPos.x >= 32.0 &&
    playerPos.x <= 48.0 &&
    playerPos.y >= 68.0 &&
    playerPos.y <= 84.0;

  // Standing near the stairs leading back down to Courtyard Passage (X: 38..62, Y: 78..94 in vijay_stambh scene)
  const isNearVijayStambhExit =
    scene === "vijay_stambh" &&
    playerPos.x >= 38.0 &&
    playerPos.x <= 62.0 &&
    playerPos.y >= 78.0 &&
    playerPos.y <= 94.0;

  // Near Right Pathway leading to Passage of Broken Walls -> Jauhar Kund (X: 64..84, Y: 68..84 in vijay_stambh scene)
  const isNearJauharPath =
    scene === "vijay_stambh" &&
    playerPos.x >= 64.0 &&
    playerPos.x <= 84.0 &&
    playerPos.y >= 68.0 &&
    playerPos.y <= 84.0;

  // Near forward archway path in Jauhar Passage leading to Jauhar Kund (Y <= 78.0)
  const isNearJauharKundDoor =
    scene === "jauhar_passage" && playerPos.y <= 78.0;

  // Near bottom entrance doors in Jauhar Passage leading back to Vijay Stambh (Y >= 82.0)
  const isNearPassageBottomDoor =
    scene === "jauhar_passage" && playerPos.y >= 82.0;

  // Near palace pavilion stairs in Jauhar Kund leading back to Broken Walls Passage (X: 32..56, Y <= 64.0)
  const isNearJauharPavilionStairs =
    scene === "jauhar_kund" &&
    playerPos.x >= 32.0 &&
    playerPos.x <= 56.0 &&
    playerPos.y <= 64.0;

  // Near left walkway exit in Jauhar Kund leading to Desert Outskirts (X <= 24.0, Y >= 66.0)
  const isNearJauharDesertExit =
    scene === "jauhar_kund" &&
    playerPos.x <= 24.0 &&
    playerPos.y >= 66.0;

  // Near fortress gate in Desert Outskirts leading back inside (X >= 74.0, Y <= 82.0)
  const isNearDesertPalaceGate =
    scene === "desert_outskirts" &&
    playerPos.x >= 74.0 &&
    playerPos.y <= 82.0;

  // Near Camel Caravan in Desert Outskirts (X: 18..38, Y: 68..88)
  const isNearCamel =
    scene === "desert_outskirts" &&
    playerPos.x >= 18.0 &&
    playerPos.x <= 38.0 &&
    playerPos.y >= 68.0 &&
    playerPos.y <= 88.0;

  // --- STAGE 2 (KUMBHALGARH FORT) PROXIMITY TRIGGERS ---
  // Near Hanuman Pol Entrance Gate (X: 20..36, Y <= 74.0 in kumbhalgarh_gate scene)
  const isNearKumbhalgarhGateDoor =
    scene === "kumbhalgarh_gate" &&
    playerPos.x >= 20.0 &&
    playerPos.x <= 36.0 &&
    playerPos.y <= 74.0;

  // Near Exit door inside Kumbhalgarh Bastion Hall (X <= 26.0, Y >= 78.0)
  const isNearKumbhalgarhInteriorExit =
    scene === "kumbhalgarh_interior_stairs" &&
    playerPos.x <= 26.0 &&
    playerPos.y >= 78.0;

  // Near Top of Bastion Staircase leading to Great Wall ramparts (X >= 66.0, Y <= 62.0)
  const isNearKumbhalgarhStairsTop =
    scene === "kumbhalgarh_interior_stairs" &&
    playerPos.x >= 66.0 &&
    playerPos.y <= 62.0;

  // Near Staircase entrance on the Great Wall top ramparts (bottom foreground: Y >= 84.0)
  const isNearGreatWallStairs =
    scene === "kumbhalgarh_great_wall" &&
    playerPos.y >= 84.0;

  // Near Far End of the Great Wall leading to Zigzag Gates (forward horizon: Y <= 46.0)
  const isNearWallEndZigzag =
    scene === "kumbhalgarh_great_wall" &&
    playerPos.y <= 46.0;

  // Near Lower Gate in Zigzag Gates scene leading back to Great Wall (Y >= 88.0)
  const isNearZigzagLowerExit =
    scene === "kumbhalgarh_zigzag_gates" &&
    playerPos.y >= 88.0;

  // Near Upper Gate in Zigzag Gates (Y <= 60.0)
  const isNearZigzagUpperGate =
    scene === "kumbhalgarh_zigzag_gates" &&
    playerPos.y <= 60.0;

  // Image 1: Near colonnade door in Courtyard → Enter Badal Mahal Interior (Press E)
  const isNearCourtyardColonnadeDoor =
    scene === "badal_mahal_courtyard" &&
    ((playerPos.x >= 22.0 && playerPos.x <= 36.0 && playerPos.y <= 80.0) ||
     (playerPos.x >= 38.0 && playerPos.x <= 62.0 && playerPos.y <= 62.0));

  // Near bottom exit in Courtyard → Return to Zigzag Gates Bridge (Press F)
  const isNearCourtyardExitZigzag =
    scene === "badal_mahal_courtyard" &&
    playerPos.y >= 88.0;

  // Image 2: Near left dark archway in Badal Mahal Interior → Ascend to Rooftop (Press E)
  const isNearBadalMahalInteriorExit =
    scene === "badal_mahal_interior" &&
    playerPos.x <= 36.0 &&
    playerPos.y <= 85.0;

  // Image 3: Near right open door in Badal Mahal Interior → Exit to Courtyard (Press F)
  const isNearBadalMahalTerraceDoor =
    scene === "badal_mahal_interior" &&
    (playerPos.x >= 74.0 || playerPos.y >= 88.0);

  // Near terrace doorway / stairs in Badal Mahal Terrace → Descend to Interior (Press F)
  const isNearBadalMahalTerraceExit =
    scene === "badal_mahal_terrace" &&
    playerPos.y >= 76.0;

  // --- ARCHITECTURE: KEYBOARD & GAME LOOP ---
  const keysHeldRef = useRef(new Set<string>());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const interactionStateRef = useRef<any>({});

  // Centralize state in ref updated on state changes
  useEffect(() => {
    interactionStateRef.current = {
      isLoading,
      isTransitioning,
      stage,
      scene,
      playerPos,
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
      cluesFound,

      // Actions
      setStage,
      setScene,
      setPlayerPos,
      setIsTransitioning,
      setShowChachaDialogue,
      setShowChauparGame,
      setShowVijayStambhModal,
      setShowJauharModal,
      setCluesFound,
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

  // Single Effect for Key Listeners & Continuous Game Loop
  useEffect(() => {
    if (isLoading) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const state = interactionStateRef.current;
      const key = e.key.toLowerCase();
      keysHeldRef.current.add(key);

      // Press [E] for Interactions
      if (key === "e") {
        // Ram Pol Gate -> Enter Inner Courtyard
        if (state.isNearRamPolDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("inner_courtyard");
            state.setPlayerPos({ x: 50.0, y: 84.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Talk / Play Chaupar with Buzurg Chacha in Inner Courtyard
        else if (state.isNearChacha) {
          state.setShowChachaDialogue(true);
        }
        // Enter Vijay Stambh Interior when standing at the tower steps
        else if (state.isNearVijayStambhDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("vijay_stambh_interior");
            state.setPlayerPos({ x: 50.0, y: 88.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Enter Passage of Broken Walls towards Jauhar Kund
        else if (state.isNearJauharPath) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_passage");
            state.setPlayerPos({ x: 50.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Enter Jauhar Kund from Passage of Broken Walls (spawns at pavilion stairs x: 44, y: 59)
        else if (state.scene === "jauhar_passage" || state.isNearJauharKundDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_kund");
            state.setPlayerPos({ x: 44.0, y: 59.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Exit Jauhar Kund outside towards Desert Side
        else if (state.isNearJauharDesertExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("desert_outskirts");
            state.setPlayerPos({ x: 80.0, y: 72.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Enter Palace from Desert Outskirts
        else if (state.isNearDesertPalaceGate) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_kund");
            state.setPlayerPos({ x: 16.0, y: 74.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Board Camel Caravan to Kumbhalgarh Fort (Stage 2)
        else if (state.isNearCamel) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setStage(2);
            state.setScene("kumbhalgarh_gate");
            state.setPlayerPos({ x: 30.0, y: 80.0 });
            state.setIsTransitioning(false);
          }, 1200);
        }
        // Enter Hanuman Pol Gate inside to Bastion Staircase
        else if (state.isNearKumbhalgarhGateDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_interior_stairs");
            state.setPlayerPos({ x: 20.0, y: 86.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Ascend Staircase to Top of Great Wall of India
        else if (state.isNearKumbhalgarhStairsTop) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_great_wall");
            state.setPlayerPos({ x: 50.0, y: 88.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Walk along the Great Wall to the Zigzag Gates
        else if (state.isNearWallEndZigzag) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_zigzag_gates");
            state.setPlayerPos({ x: 58.0, y: 84.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Enter Badal Mahal Courtyard from Upper Zigzag Gate (Press E)
        else if (state.isNearZigzagUpperGate) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_courtyard");
            state.setPlayerPos({ x: 50.0, y: 84.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Image 1: Enter Badal Mahal Interior from Courtyard Colonnade Door (Press E)
        else if (state.isNearCourtyardColonnadeDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_interior");
            state.setPlayerPos({ x: 76.0, y: 80.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Image 2: Ascend to Rooftop/Cloud Terrace from Interior Left Dark Archway (Press E)
        else if (state.isNearBadalMahalInteriorExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_terrace");
            state.setPlayerPos({ x: 50.0, y: 78.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
      }

      // Press [F] for Exiting back to previous areas
      if (key === "f") {
        // Exit Inner Courtyard outside to Ram Pol
        if (state.isNearCourtyardExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("ram_pol");
            state.setPlayerPos({ x: 68.0, y: 84.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Exit Vijay Stambh back to Courtyard Passage
        else if (state.isNearVijayStambhExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("courtyard_passage");
            state.setPlayerPos({ x: 50.0, y: 58.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Exit Vijay Stambh Interior back to Vijay Stambh Plaza
        else if (state.scene === "vijay_stambh_interior") {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("vijay_stambh");
            state.setPlayerPos({ x: 40.0, y: 76.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Exit Jauhar Passage back to Vijay Stambh Plaza
        else if (state.scene === "jauhar_passage") {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("vijay_stambh");
            state.setPlayerPos({ x: 70.0, y: 76.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Exit Jauhar Kund back to Passage of Broken Walls at pavilion stairs
        else if (state.isNearJauharPavilionStairs) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_passage");
            state.setPlayerPos({ x: 50.0, y: 65.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Exit Jauhar Kund outside towards Desert Side on left walkway
        else if (state.isNearJauharDesertExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("desert_outskirts");
            state.setPlayerPos({ x: 80.0, y: 72.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Enter Palace from Desert Outskirts
        else if (state.isNearDesertPalaceGate) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("jauhar_kund");
            state.setPlayerPos({ x: 16.0, y: 74.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Exit Kumbhalgarh Interior Bastion back to Hanuman Pol Gate
        else if (state.isNearKumbhalgarhInteriorExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_gate");
            state.setPlayerPos({ x: 26.0, y: 68.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Descend Great Wall Stairs back down into Kumbhalgarh Bastion Hall
        else if (state.isNearGreatWallStairs) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_interior_stairs");
            state.setPlayerPos({ x: 72.0, y: 56.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Return from Zigzag Gates back to Great Wall Ramparts (Press F)
        else if (state.isNearZigzagLowerExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_great_wall");
            state.setPlayerPos({ x: 50.0, y: 44.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Exit Courtyard back to Zigzag Gates Bridge (Press F)
        else if (state.isNearCourtyardExitZigzag) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("kumbhalgarh_zigzag_gates");
            state.setPlayerPos({ x: 50.0, y: 62.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Image 3: Exit Badal Mahal Interior to Royal Courtyard via Right Door (Press F)
        else if (state.isNearBadalMahalTerraceDoor) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_courtyard");
            state.setPlayerPos({ x: 29.0, y: 78.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
        // Descend from Badal Mahal Terrace back into Royal Interior Chamber (Press F)
        else if (state.isNearBadalMahalTerraceExit) {
          state.setIsTransitioning(true);
          setTimeout(() => {
            state.setScene("badal_mahal_interior");
            state.setPlayerPos({ x: 28.0, y: 76.0 });
            state.setIsTransitioning(false);
          }, 400);
        }
      }

      if (key === "escape") {
        state.setShowChachaDialogue(false);
        state.setShowChauparGame(false);
        state.setShowVijayStambhModal(false);
        state.setShowJauharModal(false);
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
      if (state.isTransitioning) {
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
          // --- SCENE 1: RAM POL ---
          if (state.scene === "ram_pol") {
            const minX = 10.0;
            const maxX = 90.0;
            const minY = 75.0;
            const maxY = 94.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- SCENE 2: INNER COURTYARD (CHAUPAR & STAIRS) ---
          else if (state.scene === "inner_courtyard") {
            const minX = 8.0;
            const maxX = 92.0;
            const minY = 44.0;
            const maxY = 88.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk to top of stairs on right side -> Transition to Passage Way!
            if (nextX >= 76.0 && nextY <= 52.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("courtyard_passage");
                state.setPlayerPos({ x: 50.0, y: 86.0 });
                state.setIsTransitioning(false);
              }, 300);
            }

            // Exit out door at bottom center removed so player never auto-exits by walking backwards!
            return { x: nextX, y: nextY };
          }
          // --- SCENE 3: COURTYARD PASSAGE (NARROW FORTRESS PASSAGE) ---
          else if (state.scene === "courtyard_passage") {
            const minX = 25.0;
            const maxX = 75.0;
            const minY = 50.0;
            const maxY = 92.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk to top of passage -> Transition to Vijay Stambh Area!
            if (nextY <= 54.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("vijay_stambh");
                state.setPlayerPos({ x: 50.0, y: 86.0 });
                state.setIsTransitioning(false);
              }, 300);
            }

            // Walk back down to return to Inner Courtyard at top of stairs
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
          // --- SCENE 4: VIJAY STAMBH AREA ---
          else if (state.scene === "vijay_stambh") {
            const minX = 15.0;
            const maxX = 85.0;
            const minY = 62.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk right through wall path towards Jauhar Kund -> Transition to Jauhar Passage!
            if (nextX >= 80.0 && nextY >= 68.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("jauhar_passage");
                state.setPlayerPos({ x: 20.0, y: 80.0 });
                state.setIsTransitioning(false);
              }, 400);
            }

            // Auto-exit removed so player must press [F] to exit back to Courtyard Passage!
            return { x: nextX, y: nextY };
          }
          // --- SCENE 5: JAUHAR PASSAGE (PASSAGE OF BROKEN WALLS) ---
          else if (state.scene === "jauhar_passage") {
            const minX = 20.0;
            const maxX = 80.0;
            const minY = 56.0;
            const maxY = 92.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk straight into the middle archway in the distance -> Transition to Jauhar Kund!
            if (nextY <= 58.0) {
              state.setIsTransitioning(true);
              setTimeout(() => {
                state.setScene("jauhar_kund");
                state.setPlayerPos({ x: 50.0, y: 88.0 });
                state.setIsTransitioning(false);
              }, 400);
            }

            // Walk back down to the door -> Return to Vijay Stambh area
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
          // --- SCENE 6: JAUHAR KUND (SACRED COURTYARD AT EVENING) ---
          else if (state.scene === "jauhar_kund") {
            const minX = 12.0;
            const maxX = 88.0;
            const minY = 57.0;
            const maxY = 85.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            // Walk left walkway towards the desert gate -> Transition to Desert Outskirts
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
          // --- SCENE 7: DESERT OUTSKIRTS (THAR DESERT DUNES & FORT GATE) ---
          else if (state.scene === "desert_outskirts") {
            const minX = 10.0;
            const maxX = 88.0;
            const minY = 62.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- STAGE 2: KUMBHALGARH FORT (GREAT WALL OF INDIA & HANUMAN POL) ---
          else if (state.scene === "kumbhalgarh_gate") {
            const minX = 15.0;
            const maxX = 85.0;
            const minY = 65.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- STAGE 2: KUMBHALGARH INTERIOR BASTION & STAIRCASE ---
          else if (state.scene === "kumbhalgarh_interior_stairs") {
            const minX = 12.0;
            const maxX = 88.0;
            const minY = 52.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- STAGE 2: THE GREAT WALL OF INDIA (OPEN STRAIGHT WALKWAY) ---
          else if (state.scene === "kumbhalgarh_great_wall") {
            const progress = (prev.y - 38.0) / 52.0; // 0 at top, 1 at bottom
            const halfWidth = 5.0 + Math.max(0, Math.min(1, progress)) * 26.0;
            const minX = Math.max(16.0, 50.0 - halfWidth);
            const maxX = Math.min(84.0, 50.0 + halfWidth);
            const minY = 38.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- STAGE 2: KUMBHALGARH FORT ZIGZAG GATES ---
          else if (state.scene === "kumbhalgarh_zigzag_gates") {
            const minX = 12.0;
            const maxX = 88.0;
            const minY = 52.0;
            const maxY = 98.0; // Allowed to walk backwards

            // Funnel players slightly towards the center ramp as they go up
            const rampProgress = Math.max(0, Math.min(1, (prev.y - minY) / (maxY - minY)));
            const currentMinX = 35.0 + (rampProgress * -23.0); // Widen at bottom
            const currentMaxX = 65.0 + (rampProgress * 23.0);  // Widen at bottom

            const nextX = Math.max(currentMinX, Math.min(currentMaxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- STAGE 2: BADAL MAHAL COURTYARD ---
          else if (state.scene === "badal_mahal_courtyard") {
            const minX = 12.0;
            const maxX = 88.0;
            const minY = 58.0;
            const maxY = 96.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- STAGE 2: BADAL MAHAL INTERIOR (WHITE PLASTER & ELEPHANT FRESCOES) ---
          else if (state.scene === "badal_mahal_interior") {
            const minX = 14.0;
            const maxX = 86.0;
            const minY = 62.0;
            const maxY = 92.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- STAGE 2: BADAL MAHAL CLOUD TERRACE & DOME (PINNACLE OF KUMBHALGARH) ---
          else if (state.scene === "badal_mahal_terrace") {
            const minX = 16.0;
            const maxX = 84.0;
            const minY = 60.0;
            const maxY = 90.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- SCENE 8: VIJAY STAMBH INTERIOR (CARVED SANDSTONE CHAMBER) ---
          else if (state.scene === "vijay_stambh_interior") {
            const minX = 18.0;
            const maxX = 82.0;
            const minY = 74.0;
            const maxY = 94.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(minY, Math.min(maxY, prev.y + dy));

            return { x: nextX, y: nextY };
          }
          // --- OTHER SCENES ---
          else {
            const minX = 15.0;
            const maxX = 85.0;
            const minY = 40.0;
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
  }, [isLoading]);

  // Chaupar Dice Roll Handler
  const handleRollDice = () => {
    if (isDiceRolling) return;
    setIsDiceRolling(true);

    setTimeout(() => {
      const pRoll = Math.floor(Math.random() * 6) + 1;
      const cRoll = Math.floor(Math.random() * 6) + 1;
      setLastRoll(pRoll);

      if (pRoll > cRoll) {
        setChauparScore((prev) => ({ ...prev, player: prev.player + 1 }));
        setChauparMessage(`You rolled ${pRoll}! Buzurg Chacha rolled ${cRoll}. You win this round!`);
      } else if (cRoll > pRoll) {
        setChauparScore((prev) => ({ ...prev, chacha: prev.chacha + 1 }));
        setChauparMessage(`You rolled ${pRoll}. Buzurg Chacha rolled ${cRoll} and takes the point!`);
      } else {
        setChauparMessage(`Both rolled ${pRoll}! It's a tie round.`);
      }

      setIsDiceRolling(false);
    }, 600);
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
      default:
        return "/bg-ram-pol.jpg";
    }
  };

  const getSceneTitle = () => {
    switch (scene) {
      case "ram_pol":
        return "RAM POL - CHITTORGARH FORT ENTRANCE";
      case "inner_courtyard":
        return "INNER COURTYARD & CHAUPAR PAVILION";
      case "courtyard_passage":
        return "FORTRESS UPPER PASSAGEWAY";
      case "vijay_stambh":
        return "VIJAY STAMBH (TOWER OF VICTORY)";
      case "vijay_stambh_interior":
        return "VIJAY STAMBH INTERIOR CHAMBER";
      case "jauhar_passage":
        return "PASSAGE OF BROKEN WALLS";
      case "jauhar_kund":
        return "SACRED JAUHAR KUND - TWILIGHT";
      case "desert_outskirts":
        return "THAR DESERT OUTSKIRTS - CHITTORGARH FORT";
      case "kumbhalgarh_gate":
        return "KUMBHALGARH FORT - HANUMAN POL GATE (STAGE 2)";
      case "kumbhalgarh_interior_stairs":
        return "KUMBHALGARH FORT - BASTION & GRAND STAIRCASE";
      case "kumbhalgarh_great_wall":
        return "THE GREAT WALL OF INDIA - KUMBHALGARH RAMPARTS";
      case "kumbhalgarh_zigzag_gates":
        return "KUMBHALGARH FORT - DEFENSIVE ZIGZAG GATES";
      case "badal_mahal_courtyard":
        return "BADAL MAHAL - ROYAL COURTYARD (PALACE OF THE CLOUDS)";
      case "badal_mahal_interior":
        return "BADAL MAHAL - BIRTHPLACE OF MAHARANA PRATAP (FRESCO CHAMBER)";
      case "badal_mahal_terrace":
        return "BADAL MAHAL - CLOUD TERRACE & DOME (PINNACLE OF KUMBHALGARH)";
      default:
        return "RAJASTHAN - LAND OF KINGS";
    }
  };

  const getSceneInstruction = () => {
    switch (scene) {
      case "ram_pol":
        return "Approach Ram Pol gate and press E to enter the inner courtyard.";
      case "inner_courtyard":
        return "Explore the courtyard. Challenge Buzurg Chacha to Chaupar, or walk up the right stairs to the passage. Walk to the doorway threshold and press F to exit outside.";
      case "courtyard_passage":
        return "Ascend the royal fortress passage to reach the Vijay Stambh (Tower of Victory). Walk back down to return to the courtyard.";
      case "vijay_stambh":
        return "Gaze upon the majestic Vijay Stambh. Press E near the entrance steps to go inside, or walk to the right path towards the Passage of Broken Walls. Press F at the stairs to exit.";
      case "vijay_stambh_interior":
        return "Explore the carved sandstone chamber and spiral stairs of Vijay Stambh. Press F to exit outside to the plaza.";
      case "jauhar_passage":
        return "Traverse the Passage of Broken Walls. Move straight ahead towards the archway to enter Jauhar Kund.";
      case "jauhar_kund":
        return "Stand in reverence at the sacred historic Jauhar Kund during twilight. Walk up to the pavilion stairs and press F to return to the passage, or walk left to exit outside to the desert.";
      case "desert_outskirts":
        return "Gaze upon the golden desert dunes outside the fort ramparts. Walk towards the royal camel caravan and press E to travel to Kumbhalgarh Fort (Stage 2).";
      case "kumbhalgarh_gate":
        return "Approach the grand Hanuman Pol gate and press E to enter the fort bastion.";
      case "kumbhalgarh_interior_stairs":
        return "Explore the carved bastion hall. Climb the grand stone staircase on the right and press E to ascend to the top of the Great Wall of India. Press F at the left door to exit outside.";
      case "kumbhalgarh_great_wall":
        return "Walk along the Great Wall of India. Follow the long wall straight to the far end to reach the fortified Zigzag Gates!";
      case "kumbhalgarh_zigzag_gates":
        return "Walk forward along the bridge path to enter Badal Mahal. Walk backward to return to the Great Wall.";
      case "badal_mahal_courtyard":
        return "You stand in the royal courtyard of Badal Mahal. Walk forward through the back gate to enter the palace interior. Walk backward to exit to the Zigzag Gates.";
      case "badal_mahal_interior":
        return "Admire the 19th-century elephant battle frescoes where Maharana Pratap was born. Walk left to the dark archway to ascend to the Cloud Terrace. Walk back down to return to the courtyard.";
      case "badal_mahal_terrace":
        return "Stand atop the highest peak of Kumbhalgarh Fort above the clouds. Gaze across the vast Aravalli hills where Maharana Pratap once walked. Press F near the stairs to return.";
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

      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/60 pointer-events-none" />

      {/* --- TOP LEFT HUD CARDS (MATCHING MUGHAL GAME EXACTLY) --- */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
        {/* Goal / Instruction Box Card */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-xl p-4 max-w-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            RAJASTHAN - CHITTORGARH FORT
          </span>
          <div className="text-[14px] font-bold text-black leading-snug">
            {getSceneInstruction()}
          </div>
        </div>

        {/* Clues Box Card */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 w-max shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <div className="flex gap-1">
            <div className={`w-3 h-1 ${cluesFound >= 1 ? "bg-amber-500" : "bg-amber-200"}`}></div>
            <div className={`w-3 h-1 ${cluesFound >= 2 ? "bg-amber-500" : "bg-amber-200"}`}></div>
            <div className={`w-3 h-1 ${cluesFound >= 3 ? "bg-amber-500" : "bg-amber-200"}`}></div>
          </div>
          <span className="text-[12px] font-bold text-black">{cluesFound}/3 clues</span>
        </div>
      </div>

      {/* --- TOP RIGHT HUD CARDS (BUTTONS & MINIMAP - MATCHING MUGHAL GAME EXACTLY) --- */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
        {/* Action Buttons Row */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetGame}
            title="Restart to Beginning"
            className="h-10 bg-red-600 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-3 gap-1.5 group cursor-pointer"
          >
            <svg className="w-5 h-5 text-white group-hover:-rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span className="text-[13px] font-bold text-white">Restart</span>
          </button>
          <button className="w-10 h-10 bg-amber-400 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
            </svg>
          </button>
          <button className="w-10 h-10 bg-amber-400 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center cursor-pointer">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
            </svg>
          </button>
          <button onClick={() => router.push('/')} className="h-10 bg-red-600 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-4 cursor-pointer">
            <span className="text-[13px] font-bold text-white">Leave world</span>
          </button>
        </div>

        {/* Minimap Box Card */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-44 h-36 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-amber-50/50 rounded">
            <div className={scene === "ram_pol" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            <div className={scene === "inner_courtyard" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            <div className={scene === "courtyard_passage" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            <div className={scene === "vijay_stambh" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            <div className={scene === "vijay_stambh_interior" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            <div className={scene === "jauhar_passage" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            <div className={scene === "jauhar_kund" ? "bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600" : "bg-amber-100 rounded-sm"}></div>
            <div className="bg-transparent"></div>
            <div className="bg-transparent"></div>
          </div>
        </div>
      </div>

      {/* --- BUZURG CHACHA NPC (PROPERLY PROPORTIONED & STANDING NEAR CHAUPAR TABLE) --- */}
      {scene === "inner_courtyard" && (
        <div
          className="absolute z-10 pointer-events-none flex flex-col items-center"
          style={{
            left: "26%",
            top: "76%",
            transform: "translate(-50%, -96%) scale(1.15)",
          }}
        >
          {/* Name Tag */}
          <div className="bg-amber-900/90 text-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded border border-amber-400/50 shadow-md mb-1 whitespace-nowrap">
            👳 Buzurg Chacha
          </div>

          {/* Elder Sprite / Avatar - Prominent Full Height matching Hero */}
          <img
            src="/rajasthan-guard-v2.png"
            alt="Buzurg Chacha"
            className="w-32 h-32 object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}

      {/* --- DESERT CARAVAN CAMEL NPC (STANDING IN THAR DESERT OUTSKIRTS) --- */}
      {scene === "desert_outskirts" && (
        <div
          className="absolute z-10 pointer-events-none flex flex-col items-center"
          style={{
            left: "28%",
            top: "78%",
            transform: "translate(-50%, -85%)",
          }}
        >
          {/* Name Tag */}
          <div className="bg-[#fff9ea] text-amber-950 text-[11px] font-bold px-2.5 py-0.5 rounded border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] mb-1 whitespace-nowrap">
            🐫 Royal Desert Camel
          </div>

          {/* Camel Sprite Asset */}
          <img
            src="/rajasthan-camel.png"
            alt="Royal Desert Camel"
            className="w-48 h-48 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}

      {/* --- PLAYER SPRITE (EXACT MUGHAL ENGINE FORMAT: CLEAN SPRITE WITH NATURAL WALK ANIMATION) --- */}
      <div
        className="absolute z-20 pointer-events-none flex flex-col items-center"
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transformOrigin: "bottom center",
          transform: `translate(-50%, -96%) scale(${scene === "vijay_stambh" ? 1.035 : scene === "vijay_stambh_interior" ? 1.05 : scene === "jauhar_passage" ? (0.75 + (playerPos.y - 56) * 0.011) : scene === "jauhar_kund" ? (0.90 + (playerPos.y - 57) * 0.009) : scene === "kumbhalgarh_gate" ? (0.85 + (playerPos.y - 65) * 0.012) : scene === "kumbhalgarh_interior_stairs" ? (0.80 + (playerPos.y - 52) * 0.009) : scene === "kumbhalgarh_great_wall" ? (0.46 + (playerPos.y - 36) * 0.013) : scene === "kumbhalgarh_zigzag_gates" ? (0.75 + (playerPos.y - 52) * 0.011) : scene === "badal_mahal_courtyard" ? (1.00 + (playerPos.y - 70) * 0.010) : scene === "badal_mahal_interior" ? (1.45 + (playerPos.y - 80) * 0.008) : scene === "badal_mahal_terrace" ? (1.10 + (playerPos.y - 60) * 0.010) : 1.15}) scaleX(${facingLeft ? -1 : 1})`,
        }}
      >
        {/* Player Avatar Sprite */}
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

      {/* --- INTERACTION PROMPTS (EXACT MUGHAL STYLE: CENTERED CLEAN PROMPTS & HOTSPOTS) --- */}
      {isNearRamPolDoor && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce pointer-events-none">
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Building
        </div>
      )}

      {isNearChacha && !showChachaDialogue && !showChauparGame && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => setShowChachaDialogue(true)}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Play Chaupar with Buzurg Chacha
        </div>
      )}

      {isNearVijayStambhDoor && !showVijayStambhModal && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => setShowVijayStambhModal(true)}
        >
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

      {isNearKumbhalgarhGateDoor && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce pointer-events-none">
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Hanuman Pol Gate
        </div>
      )}

      {isNearKumbhalgarhStairsTop && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce pointer-events-none">
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Ascend Grand Staircase to Top of Great Wall of India
        </div>
      )}

      {isNearWallEndZigzag && (
        <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce pointer-events-none">
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Fort Zigzag Gates
        </div>
      )}

      {/* Zigzag Gates Prompts */}
      {isNearZigzagUpperGate && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("badal_mahal_courtyard");
              setPlayerPos({ x: 50.0, y: 84.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Badal Mahal Courtyard
        </div>
      )}
      {isNearZigzagLowerExit && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("kumbhalgarh_great_wall");
              setPlayerPos({ x: 50.0, y: 44.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span className="bg-black text-amber-400 px-1.5 rounded text-[11px]">F</span>
          Exit to Great Wall Ramparts
        </div>
      )}

      {/* Courtyard Prompts (Image 1 Entrance / F Exit) */}
      {isNearCourtyardColonnadeDoor && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("badal_mahal_interior");
              setPlayerPos({ x: 76.0, y: 80.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Enter Badal Mahal Palace Interior
        </div>
      )}
      {isNearCourtyardExitZigzag && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("kumbhalgarh_zigzag_gates");
              setPlayerPos({ x: 50.0, y: 62.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span className="bg-black text-amber-400 px-1.5 rounded text-[11px]">F</span>
          Exit to Zigzag Gates Bridge
        </div>
      )}

      {/* Image 2: Interior Left Archway -> Rooftop Entrance (E Key) */}
      {isNearBadalMahalInteriorExit && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-[13px] font-bold text-black flex items-center gap-2 z-30 animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("badal_mahal_terrace");
              setPlayerPos({ x: 50.0, y: 78.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span className="bg-amber-400 border border-black rounded px-1.5 text-[11px]">E</span>
          Ascend to Rooftop Cloud Terrace
        </div>
      )}

      {/* Image 3: Interior Right Door -> Courtyard Exit (F Key) */}
      {isNearBadalMahalTerraceDoor && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("badal_mahal_courtyard");
              setPlayerPos({ x: 29.0, y: 78.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span className="bg-black text-amber-400 px-1.5 rounded text-[11px]">F</span>
          Exit to Royal Courtyard
        </div>
      )}

      {/* Rooftop Cloud Terrace Exit (F Key) */}
      {isNearBadalMahalTerraceExit && (
        <div 
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse cursor-pointer pointer-events-auto flex items-center gap-2 whitespace-nowrap"
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setScene("badal_mahal_interior");
              setPlayerPos({ x: 28.0, y: 76.0 });
              setIsTransitioning(false);
            }, 400);
          }}
        >
          <span className="bg-black text-amber-400 px-1.5 rounded text-[11px]">F</span>
          Descend to Interior Chamber
        </div>
      )}

      {/* --- NAVIGATION & RETURN GUIDANCE BANNERS (EXACT MUGHAL ENGINE FORMAT: IMAGE 3) --- */}
      {isNearCourtyardExit && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to exit outside to Ram Pol (Press F)
        </div>
      )}

      {isNearCourtyardStairsTop && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▲</span> Walk up the right stairs to Fortress Passageway
        </div>
      )}

      {isNearVijayStambhExit && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to return to Fortress Passageway (Press F)
        </div>
      )}

      {isNearJauharPath && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>►</span> Walk right to Passage of Broken Walls (Press E)
        </div>
      )}

      {scene === "vijay_stambh_interior" && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to exit outside to Vijay Stambh Plaza (Press F)
        </div>
      )}

      {isNearPassageBottomDoor && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to return to Vijay Stambh Plaza (Press F)
        </div>
      )}

      {isNearJauharKundDoor && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▲</span> Walk forward to enter Sacred Jauhar Kund (Press E)
        </div>
      )}

      {isNearJauharPavilionStairs && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to return to Passage of Broken Walls (Press F)
        </div>
      )}

      {isNearJauharDesertExit && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>◄</span> Walk left to exit outside to Desert Dunes (Press E)
        </div>
      )}

      {isNearDesertPalaceGate && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>►</span> Walk right to enter Palace Jauhar Kund (Press E)
        </div>
      )}

      {isNearKumbhalgarhInteriorExit && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to exit outside to Hanuman Pol (Press F)
        </div>
      )}

      {isNearGreatWallStairs && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to descend stairs into Bastion Chamber (Press F)
        </div>
      )}

      {isNearZigzagLowerExit && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to return to Great Wall Ramparts (Press F)
        </div>
      )}

      {isNearBadalMahalInteriorExit && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to exit outside to Fort Gates (Press F)
        </div>
      )}

      {isNearBadalMahalTerraceExit && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400 text-black border-2 border-black px-4 py-1.5 rounded-full text-[12px] font-extrabold tracking-wider shadow-[3px_3px_0_0_rgba(0,0,0,1)] animate-pulse z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap">
          <span>▼</span> Walk down to descend to Royal Fresco Chamber (Press F)
        </div>
      )}

      {/* --- BUZURG CHACHA DIALOGUE MODAL --- */}
      {showChachaDialogue && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-40 pointer-events-auto">
          <div className="bg-[#fff9ea] border-4 border-amber-900 rounded-2xl p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)] max-w-md w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-3">
              <span className="text-sm font-extrabold text-amber-950 uppercase tracking-widest flex items-center gap-2">
                <span>👳</span> Buzurg Chacha
              </span>
              <button
                onClick={() => setShowChachaDialogue(false)}
                className="text-amber-900 hover:text-black font-bold text-sm bg-amber-200/60 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="text-amber-950 font-serif text-sm leading-relaxed">
              <p className="mb-3 font-semibold">
                &quot;Khamma Ghani, young traveller! Welcome to the royal courtyard of Chittorgarh. I have sat beneath this canopy playing Chaupar for decades.&quot;
              </p>
              <p className="text-amber-900 text-xs italic">
                &quot;Challenge me to a game of Chaupar to test your wisdom and fortune!&quot;
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowChachaDialogue(false);
                  setShowChauparGame(true);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                🎲 Play Chaupar Game
              </button>
              <button
                onClick={() => setShowChachaDialogue(false)}
                className="bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold py-2.5 px-4 rounded-xl border-2 border-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Farewell
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHAUPAR MINI-GAME MODAL --- */}
      {showChauparGame && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-40 pointer-events-auto">
          <div className="bg-[#fef9c3] border-4 border-amber-950 rounded-2xl p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] max-w-lg w-full flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b-2 border-amber-800/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎲</span>
                <h3 className="font-extrabold text-amber-950 uppercase tracking-widest text-sm">
                  Royal Chaupar Game - Chittorgarh
                </h3>
              </div>
              <button
                onClick={() => setShowChauparGame(false)}
                className="text-amber-950 hover:bg-amber-200 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-800 cursor-pointer"
              >
                ✕ Exit Game
              </button>
            </div>

            {/* Scoreboard */}
            <div className="grid grid-cols-2 gap-4 bg-amber-100 border-2 border-amber-800/60 p-3 rounded-xl text-center">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-amber-900 uppercase">You (Player)</span>
                <span className="text-2xl font-extrabold text-amber-950">{chauparScore.player}</span>
              </div>
              <div className="flex flex-col items-center border-l-2 border-amber-800/30">
                <span className="text-xs font-bold text-amber-900 uppercase">Buzurg Chacha</span>
                <span className="text-2xl font-extrabold text-amber-950">{chauparScore.chacha}</span>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-amber-900/10 border border-amber-800/30 p-3 rounded-xl text-center">
              <p className="text-xs font-serif font-bold text-amber-950">{chauparMessage}</p>
            </div>

            {/* Dice Control */}
            <div className="flex flex-col items-center gap-3 my-2">
              <div className="w-16 h-16 bg-amber-900 text-amber-100 rounded-2xl border-4 border-amber-950 flex items-center justify-center text-3xl font-extrabold shadow-inner">
                {isDiceRolling ? "🎲" : lastRoll || "?"}
              </div>

              <button
                onClick={handleRollDice}
                disabled={isDiceRolling}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold py-3 px-6 rounded-xl border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-xs uppercase tracking-widest cursor-pointer"
              >
                {isDiceRolling ? "Rolling Cowrie Shells..." : "Roll Dice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SCENE FADE TRANSITION OVERLAY (EXACT MUGHAL STYLE WITH LABEL) --- */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black animate-in fade-in duration-300 z-50 pointer-events-none flex items-center justify-center">
          <span className="text-amber-300 text-sm font-serif tracking-widest uppercase animate-pulse">
            {getTransitionLabel()}
          </span>
        </div>
      )}

      {/* --- BOTTOM CENTER CONTROLS GUIDE (MATCHING MUGHAL GAME EXACTLY) --- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-600 rounded-full px-6 py-2 shadow-lg flex items-center gap-3">
          <span className="text-white text-[12px] font-bold tracking-wider">WASD / arrows</span>
          <span className="text-gray-400 text-[10px]">- move -</span>
          <span className="text-white text-[12px] font-bold tracking-wider">E</span>
          <span className="text-gray-400 text-[10px]">- enter/inspect</span>
          <span className="text-white text-[12px] font-bold tracking-wider">F</span>
          <span className="text-gray-400 text-[10px]">- exit outside</span>
        </div>
      </div>
    </div>
  );
}
