"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { WorldDefinition, DialogueOption, SceneExit, SceneDefinition, NPCDefinition, PuzzleDefinition, NarratorEvent, QuestDefinition } from "../../types/expedition";
import { SCENE_TEMPLATES, SceneTemplateGeometry } from "../../data/sceneTemplates";
import { ExpeditionStorage } from "../../services/storage";
import { geminiImageProvider } from "../../services/geminiImageProvider";
import { updatePlayerPhysics, isWithinProximity, InputState, PlayerPhysicsState, PLASSEY_CHARACTER_SCALE_MULTIPLIER } from "../../engine/physics";
import { QuestRuntime } from "../../engine/questRuntime";
import { narrationManager, getVoiceForNPC } from "../../services/narrationManager";
import { sfxManager } from "../../services/sfxManager";

import ExpeditionHUD from "../../components/ExpeditionHUD";
import NarratorPanel from "../../components/NarratorPanel";
import DialoguePanel from "../../components/DialoguePanel";
import InteractionPrompt from "../../components/InteractionPrompt";
import HistoricalCodexModal from "../../components/HistoricalCodexModal";
import PuzzleModal from "../../components/PuzzleModal";
import ExpeditionComplete from "../../components/ExpeditionComplete";
import VirtualDPad from "../../components/VirtualDPad";
import ExpeditionError from "../../components/ExpeditionError";

import EvidenceModal from "../../components/EvidenceModal";
import { EvidenceItem } from "../../types/expedition";

export default function AIExpeditionPlayPage({ params }: { params: Promise<{ worldId: string }> }) {
  const resolvedParams = use(params);
  const worldId = resolvedParams.worldId;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [world, setWorld] = useState<WorldDefinition | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [currentBgUrl, setCurrentBgUrl] = useState<string>("");
  const [playerSpriteUrl] = useState<string>("/player.png");
  const [npcSpriteUrls, setNpcSpriteUrls] = useState<Record<string, string>>({});
  const [activeDialogueNodeId, setActiveDialogueNodeId] = useState<string | undefined>(undefined);

  // Physics & Movement state
  const [playerPhysics, setPlayerPhysics] = useState<PlayerPhysicsState>({
    x: 50,
    y: 78,
    facingLeft: false,
    isWalking: false,
    walkPhase: 0
  });

  const [renderScale, setRenderScale] = useState(1.0);
  const [renderBobY, setRenderBobY] = useState(0);
  const [renderSwayDeg, setRenderSwayDeg] = useState(0);
  const [inputs, setInputs] = useState<InputState>({ left: false, right: false, up: false, down: false });

  // Quest runtime ref
  const questRuntimeRef = useRef<QuestRuntime | null>(null);
  const [activeQuest, setActiveQuest] = useState<QuestDefinition | null>(null);
  const [discoveredEvidenceIds, setDiscoveredEvidenceIds] = useState<string[]>([]);
  const [discoveredEvidenceCount, setDiscoveredEvidenceCount] = useState(0);

  // Modals state
  const [activeNPC, setActiveNPC] = useState<NPCDefinition | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleDefinition | null>(null);
  const [activeNarratorEvent, setActiveNarratorEvent] = useState<NarratorEvent | null>(null);
  const [activeEvidenceItem, setActiveEvidenceItem] = useState<EvidenceItem | null>(null);
  const [showCodex, setShowCodex] = useState(false);
  const [showExpeditionComplete, setShowExpeditionComplete] = useState(false);
  useEffect(() => {
    const loadedWorld = ExpeditionStorage.getWorldById(worldId);
    if (!loadedWorld) {
      setTimeout(() => {
        setErrorMessage(`Expedition '${worldId}' not found. Generated world definition may have expired or not been saved.`);
        setIsLoading(false);
      }, 0);
      return;
    }

    try {
      const savedState = ExpeditionStorage.getGameState(worldId);
      const runtime = new QuestRuntime(loadedWorld, savedState);
      questRuntimeRef.current = runtime;

      const initialSceneId = runtime.getCurrentSceneId();
      const initialPos = runtime.getPlayerPos();

      setTimeout(() => {
        setWorld(loadedWorld);
        setActiveSceneId(initialSceneId);
        setPlayerPhysics((prev) => ({ ...prev, x: initialPos.x, y: initialPos.y }));
        setActiveQuest(runtime.getActiveQuest());
        const discovered = runtime.getDiscoveredEvidence();
        setDiscoveredEvidenceIds(discovered);
        setDiscoveredEvidenceCount(discovered.length);
        setIsLoading(false);
      }, 0);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Unknown engine error";
      console.error("Failed to initialize RPG engine:", err);
      setTimeout(() => {
        setErrorMessage(`Expedition save state corrupted: ${errMessage}`);
        setIsLoading(false);
      }, 0);
    }
  }, [worldId]);

  // Update Background & Character Images with Strict Loading Lifecycle & Asset Resolution
  useEffect(() => {
    if (!world || !activeSceneId) return;

    let isMounted = true;
    const sceneDef = world.scenes.find((s) => s.id === activeSceneId) || world.scenes[0];
    const imagePrompt = sceneDef?.imagePrompt || `Create a 2.5D RPG environment of ${sceneDef?.name || activeSceneId} in ${world.metadata.location} during ${world.metadata.era}`;

    // Load & Validate Background Image
    geminiImageProvider.getSceneImage(worldId, activeSceneId, imagePrompt)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.objectUrl) {
          const rawUrl = res.objectUrl;
          const encodedUrl = encodeURI(rawUrl);

          // Verify Image Loading Lifecycle
          const img = new Image();
          img.onload = () => {
            if (!isMounted) return;
            if (img.naturalWidth > 0) {
              setCurrentBgUrl(encodedUrl);
            } else {
              setErrorMessage(`Failed to load Plassey background asset for scene '${activeSceneId}'. Image width is 0.`);
            }
          };
          img.onerror = () => {
            if (!isMounted) return;
            setErrorMessage(`Failed to load scene background asset from URL '${encodedUrl}'.`);
          };
          img.src = encodedUrl;
        } else {
          setErrorMessage(res.error || "Generated scene asset is missing. Expedition cannot be played without artwork.");
        }
      });


    // Load Scene NPC Character Images
    if (sceneDef?.npcs) {
      sceneDef.npcs.forEach((npcPlacement) => {
        const npcDef = world.characters.find((c) => c.id === npcPlacement.npcId);
        if (npcDef) {
          const charPrompt = npcDef.characterImagePrompt || `Create a 2.5D RPG character sprite of ${npcDef.name} during ${world.metadata.era}`;
          geminiImageProvider.getCharacterImage(worldId, npcDef.id, charPrompt)
            .then((res) => {
              if (!isMounted) return;
              if (res.success && res.objectUrl) {
                setNpcSpriteUrls((prev) => ({ ...prev, [npcDef.id]: encodeURI(res.objectUrl as string) }));
              } else {
                setErrorMessage(res.error || `Generated character asset for '${npcDef.name}' is missing.`);
              }
            });
        }
      });
    }

    // Trigger Scene Enter Narrator Events if available
    if (questRuntimeRef.current && sceneDef?.narratorEvents) {
      const enterEvent = sceneDef.narratorEvents.find(
        (n) => n.triggerType === "SCENE_ENTER" && !questRuntimeRef.current?.isNarratorEventRead(n.id)
      );
      if (enterEvent) {
        setActiveNarratorEvent(enterEvent);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [activeSceneId, world, worldId]);

  // 1. Opening Cinematic Narration on Expedition Start
  useEffect(() => {
    if (!world || isLoading) return;
    const openingText =
      world.narratorOpening ||
      "1757. Bengal. The East India Company's ambitions are beginning to extend far beyond trade. Your journey starts at a military camp on the edge of the coming conflict.";
    narrationManager.narrate(openingText, {
      type: "CRITICAL",
      key: `world_opening_${world.metadata.id}`,
    });
  }, [world, isLoading]);

  // 2. Scene Introduction Narration across all Plassey scenes
  useEffect(() => {
    if (!world || !activeSceneId || isLoading) return;
    const sceneDef = world.scenes.find((s) => s.id === activeSceneId);
    if (!sceneDef) return;

    const SCENE_INTROS: Record<string, string> = {
      scene_1: "You have reached the Company's military camp. Behind its trading operations, a more powerful organization is beginning to emerge.",
      scene_2: "Inside the camp, rumours circulate about loyalties within Bengal's political leadership.",
      scene_3: "Bengal's wealth is visible everywhere in its markets. Cloth, spices and commerce helped make the region enormously valuable.",
      scene_4: "Here, trade gives way to politics. Maps, letters and alliances reveal how the Company's influence extended beyond commerce.",
      scene_5: "The court is where political loyalties become decisive.",
      scene_6: "At Plassey, the consequences of these alliances become visible.",
    };

    const introText =
      sceneDef.visualDescription ||
      SCENE_INTROS[activeSceneId] ||
      `You have entered ${sceneDef.name}. Explore the environment to uncover historical insights.`;

    narrationManager.narrate(introText, {
      type: "SCENE_INTRO",
      key: `scene_intro_${activeSceneId}`,
    });
  }, [activeSceneId, world, isLoading]);

  // 3. Top-Left Objective Narration
  useEffect(() => {
    if (!activeQuest || isLoading) return;
    const currentObj = activeQuest.objectives.find((o) => !o.isCompleted);
    if (!currentObj) return;

    narrationManager.narrate(`Your objective: ${currentObj.description}`, {
      type: "OBJECTIVE",
      key: `objective_${currentObj.id}`,
    });
  }, [activeQuest, isLoading]);


  // Current Scene Definition & Proximity Calculations
  const currentSceneDef = world?.scenes.find((s) => s.id === activeSceneId) || world?.scenes[0];
  const [disarmedExitIds, setDisarmedExitIds] = useState<string[]>([]);
  const isSceneTransitioningRef = useRef<boolean>(false);
  const transitionLockUntilRef = useRef<number>(0);
  const disarmedExitIdsRef = useRef<Set<string>>(new Set());
  const eKeyDownHandledRef = useRef<boolean>(false);

  // Development automatic spawn validation helper
  const validateSpawnPoint = useCallback((scene: SceneDefinition, spawn: { x: number; y: number }) => {
    if (spawn.x < 0 || spawn.x > 100 || spawn.y < 0 || spawn.y > 100) {
      console.warn(`[INVALID SPAWN] scene="${scene.id}" spawn=`, spawn, `reason="out of bounds"`);
    }
    scene.exits.forEach((ex: SceneExit) => {
      const inside =
        spawn.x >= ex.triggerArea.minX &&
        spawn.x <= ex.triggerArea.maxX &&
        spawn.y >= ex.triggerArea.minY &&
        spawn.y <= ex.triggerArea.maxY;
      if (inside) {
        console.warn(`[INVALID SPAWN] scene="${scene.id}" spawn=`, spawn, `reason="inside exit trigger ${ex.id}"`);
      }
    });
  }, []);

  // Dynamic Exit Re-arming State Machine
  useEffect(() => {
    if (!currentSceneDef || disarmedExitIds.length === 0) return;
    const buffer = 8.0;
    const remaining: string[] = [];
    currentSceneDef.exits.forEach((ex) => {
      if (disarmedExitIds.includes(ex.id)) {
        const isOutsideBufferedZone =
          playerPhysics.x < ex.triggerArea.minX - buffer ||
          playerPhysics.x > ex.triggerArea.maxX + buffer ||
          playerPhysics.y < ex.triggerArea.minY - buffer ||
          playerPhysics.y > ex.triggerArea.maxY + buffer;
        if (isOutsideBufferedZone) {
          console.log(`[EXIT REARMED] scene="${activeSceneId}" exit="${ex.id}"`);
        } else {
          remaining.push(ex.id);
        }
      }
    });
    if (remaining.length !== disarmedExitIds.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisarmedExitIds(remaining);
      disarmedExitIdsRef.current = new Set(remaining);
    }
  }, [playerPhysics.x, playerPhysics.y, currentSceneDef, activeSceneId, disarmedExitIds]);

  const getDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
    Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const candidateNPC = currentSceneDef?.npcs.find((n) =>
    isWithinProximity({ x: playerPhysics.x, y: playerPhysics.y }, { x: n.x, y: n.y }, 10.0)
  );
  const distNPC = candidateNPC ? getDist(playerPhysics, candidateNPC) : Infinity;

  const candidateObj = currentSceneDef?.objects.find((o) =>
    isWithinProximity({ x: playerPhysics.x, y: playerPhysics.y }, { x: o.x, y: o.y }, 10.0)
  );
  const distObj = candidateObj ? getDist(playerPhysics, candidateObj) : Infinity;

  // Candidate Exit proximity check — IGNORES DISARMED EXITS
  const candidateExit = currentSceneDef?.exits.find((ex) => {
    if (disarmedExitIds.includes(ex.id)) {
      return false; // Exit is disarmed until player moves away from spawn
    }
    const insideArea =
      playerPhysics.x >= ex.triggerArea.minX &&
      playerPhysics.x <= ex.triggerArea.maxX &&
      playerPhysics.y >= ex.triggerArea.minY &&
      playerPhysics.y <= ex.triggerArea.maxY;
    const centerPos = {
      x: (ex.triggerArea.minX + ex.triggerArea.maxX) / 2,
      y: (ex.triggerArea.minY + ex.triggerArea.maxY) / 2
    };
    const nearCenter = isWithinProximity({ x: playerPhysics.x, y: playerPhysics.y }, centerPos, 10.0);
    return insideArea || nearCenter;
  });
  const distExit = candidateExit
    ? getDist(playerPhysics, {
        x: (candidateExit.triggerArea.minX + candidateExit.triggerArea.maxX) / 2,
        y: (candidateExit.triggerArea.minY + candidateExit.triggerArea.maxY) / 2
      })
    : Infinity;

  // Select nearest active interaction deterministically
  const minDist = Math.min(distNPC, distObj, distExit);
  const nearNPCPlacement = minDist < Infinity && minDist === distNPC ? candidateNPC : null;
  const nearNPCDef = nearNPCPlacement && world ? world.characters.find((c) => c.id === nearNPCPlacement.npcId) : null;
  const nearObjectPlacement = minDist < Infinity && minDist === distObj ? candidateObj : null;
  const nearExit = minDist < Infinity && minDist === distExit ? candidateExit : null;

  // Authoritative Scene Transition Function
  const transitionToScene = useCallback((targetSceneId: string, targetSpawnPoint?: { x: number; y: number }) => {
    if (!world) return;

    if (isSceneTransitioningRef.current) {
      console.log(`[DUPLICATE TRANSITION IGNORED] Target scene: "${targetSceneId}"`);
      return;
    }
    if (performance.now() < transitionLockUntilRef.current) {
      console.log(`[STALE TRANSITION IGNORED] Transition cooldown active for target scene: "${targetSceneId}"`);
      return;
    }
    if (targetSceneId === activeSceneId) {
      return;
    }

    const targetScene = world.scenes.find((s) => s.id === targetSceneId);
    if (!targetScene) return;

    // 1. Lock transition & set cooldown
    isSceneTransitioningRef.current = true;
    transitionLockUntilRef.current = performance.now() + 600;

    const spawnPoint = targetSpawnPoint || targetScene.spawnPoint || { x: 30, y: 80 };

    console.log(`[SCENE TRANSITION START] source="${activeSceneId}" target="${targetSceneId}" spawn=`, spawnPoint);

    // 2. Cancel previous scene narration IMMEDIATELY before transition
    narrationManager.cancelForSceneTransition(targetSceneId);
    sfxManager.playTransition();

    // Prepare scene intro audio for target scene
    const SCENE_INTROS: Record<string, string> = {
      scene_1: "You have reached the Company's military camp. Behind its trading operations, a more powerful organization is beginning to emerge.",
      scene_2: "Inside the camp, rumours circulate about loyalties within Bengal's political leadership.",
      scene_3: "Bengal's wealth is visible everywhere in its markets. Cloth, spices and commerce helped make the region enormously valuable.",
      scene_4: "Here, trade gives way to politics. Maps, letters and alliances reveal how the Company's influence extended beyond commerce.",
      scene_5: "The court is where political loyalties become decisive.",
      scene_6: "At Plassey, the consequences of these alliances become visible.",
    };
    const introText = targetScene.visualDescription || SCENE_INTROS[targetSceneId] || `You have entered ${targetScene.name}. Explore the environment to uncover historical insights.`;
    narrationManager.prepareNarration(`scene_intro_${targetSceneId}`, introText, { type: "SCENE_INTRO", priority: 80, sceneId: targetSceneId }).catch(() => {});

    // 3. Automatic spawn validation
    validateSpawnPoint(targetScene, spawnPoint);

    // 4. Reset movement key states & E edge-trigger flag
    setInputs({ left: false, right: false, up: false, down: false });
    eKeyDownHandledRef.current = true;

    // 5. Disarm exits overlapping or near target spawn point
    disarmedExitIdsRef.current.clear();
    const buffer = 8.0;
    const newlyDisarmed: string[] = [];
    targetScene.exits.forEach((ex) => {
      const insideBufferedArea =
        spawnPoint.x >= ex.triggerArea.minX - buffer &&
        spawnPoint.x <= ex.triggerArea.maxX + buffer &&
        spawnPoint.y >= ex.triggerArea.minY - buffer &&
        spawnPoint.y <= ex.triggerArea.maxY + buffer;
      if (insideBufferedArea) {
        newlyDisarmed.push(ex.id);
        console.log(`[EXIT DISARMED] scene="${targetSceneId}" exit="${ex.id}"`);
      }
    });
    setDisarmedExitIds(newlyDisarmed);
    disarmedExitIdsRef.current = new Set(newlyDisarmed);

    // 6. Update quest runtime & active scene state
    if (questRuntimeRef.current) {
      questRuntimeRef.current.setSceneId(targetSceneId, spawnPoint);
    }
    setActiveSceneId(targetSceneId);
    setPlayerPhysics({
      x: spawnPoint.x,
      y: spawnPoint.y,
      facingLeft: false,
      isWalking: false,
      walkPhase: 0
    });

    console.log(`[SCENE TRANSITION COMPLETE] scene="${targetSceneId}" spawn=`, spawnPoint);

    setTimeout(() => {
      isSceneTransitioningRef.current = false;
    }, 100);
  }, [world, activeSceneId, validateSpawnPoint]);

  const executeSceneTransition = useCallback((exit: SceneExit) => {
    if (disarmedExitIdsRef.current.has(exit.id)) {
      console.log(`[STALE E IGNORED] Exit "${exit.id}" is disarmed.`);
      return;
    }
    transitionToScene(exit.targetSceneId, exit.targetSpawn);
  }, [transitionToScene]);

  // E KEY: TALK / SPEAK WITH NPC ONLY
  const handleTalkKey = useCallback(() => {
    if (!nearNPCDef) return; // E does nothing if not near an NPC!
    narrationManager.unlockAudio(); // Synchronously unlock audio engine on E keydown user gesture
    sfxManager.playDialogueOpen();
    const speaker = getVoiceForNPC(nearNPCDef.id);
    const dialogueTree = nearNPCDef.dialogueTree || [];
    const firstNode = dialogueTree[0];
    const promptText = firstNode ? firstNode.prompt : nearNPCDef.initialDialogue;
    if (promptText) {
      const dialogueKey = `dialogue_${nearNPCDef.id}_init_${promptText.slice(0, 20)}`;
      narrationManager.prepareNarration(dialogueKey, promptText, { type: "DIALOGUE", priority: 50, speaker }).catch(() => {});
    }
    setActiveNPC(nearNPCDef);
    setActiveDialogueNodeId(undefined);
  }, [nearNPCDef]);

  // Proximity Voice Preloading: Preload NPC initial dialogue line as player approaches using NPC speaker
  useEffect(() => {
    if (nearNPCDef) {
      const speaker = getVoiceForNPC(nearNPCDef.id);
      const dialogueTree = nearNPCDef.dialogueTree || [];
      const firstNode = dialogueTree[0];
      const promptText = firstNode ? firstNode.prompt : nearNPCDef.initialDialogue;
      if (promptText) {
        const dialogueKey = `dialogue_${nearNPCDef.id}_init_${promptText.slice(0, 20)}`;
        narrationManager.preloadNext(dialogueKey, promptText, { type: "DIALOGUE", priority: 50, speaker });
      }
    }
  }, [nearNPCDef]);

  // G KEY: OBJECT INTERACT / EXAMINE EVIDENCE / PRIMARY SOURCE / EXIT PORTAL
  const handleObjectKey = useCallback(() => {
    if (nearObjectPlacement) {
      if (nearObjectPlacement.clueId && questRuntimeRef.current && world) {
        const discovered = questRuntimeRef.current.discoverEvidence(nearObjectPlacement.clueId);
        if (discovered) {
          sfxManager.playDiscover();
          const allDiscovered = questRuntimeRef.current.getDiscoveredEvidence();
          setDiscoveredEvidenceIds(allDiscovered);
          setDiscoveredEvidenceCount(allDiscovered.length);
          setActiveQuest(questRuntimeRef.current.getActiveQuest());
        }
        const evItem = world.evidence.find((e) => e.id === nearObjectPlacement.clueId);
        if (evItem) {
          narrationManager.openEvidenceWithAudio(evItem, (item) => {
            setActiveEvidenceItem(item);
          });
          return;
        }
      }
      return;
    }

    if (nearExit) {
      sfxManager.playInteract();
      executeSceneTransition(nearExit);
      return;
    }

    // Check if near puzzle objective
    if (world) {
      const puzzle = world.puzzles.find((p) => !p.isSolved);
      if (puzzle && !activePuzzle) {
        const puzzleKey = `puzzle_question_${puzzle.id}`;
        const fullText = `Historical reasoning challenge. ${puzzle.title}. ${puzzle.historicalContext}. ${puzzle.question}`;
        narrationManager.prepareNarration(puzzleKey, fullText, { type: "PUZZLE", priority: 40 }).catch(() => {});
        setActivePuzzle(puzzle);
      }
    }
  }, [nearObjectPlacement, nearExit, world, activePuzzle, executeSceneTransition]);

  // F KEY: RETURN / GO BACK / EXIT ACTIVE MODAL OR BACK SCENE TRANSITION
  const handleReturnKey = useCallback(() => {
    narrationManager.stopCurrentNarration("f-key-return");
    sfxManager.playInteract();

    const modalActive = Boolean(
      activeNPC || activePuzzle || activeNarratorEvent || activeEvidenceItem || showCodex || showExpeditionComplete
    );

    if (modalActive) {
      setActiveNPC(null);
      setActivePuzzle(null);
      setActiveNarratorEvent(null);
      setActiveEvidenceItem(null);
      setShowCodex(false);
      setShowExpeditionComplete(false);
      return;
    }

    if (nearExit) {
      executeSceneTransition(nearExit);
    }
  }, [activeNPC, activePuzzle, activeNarratorEvent, activeEvidenceItem, showCodex, showExpeditionComplete, nearExit, executeSceneTransition]);

  const isModalOpen = Boolean(
    activeNPC || activePuzzle || activeNarratorEvent || activeEvidenceItem || showCodex || showExpeditionComplete
  );

  const gKeyDownHandledRef = useRef<boolean>(false);
  const fKeyDownHandledRef = useRef<boolean>(false);

  // Keydown / Keyup Event Listeners with Strict E (Talk), G (Object), F (Return) Mapping
  useEffect(() => {
    if (isLoading || !world || errorMessage) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "escape" || key === "f") {
        if (!fKeyDownHandledRef.current) {
          fKeyDownHandledRef.current = true;
          handleReturnKey();
          setInputs({ left: false, right: false, up: false, down: false });
        }
        return;
      }

      if (isModalOpen) {
        setInputs({ left: false, right: false, up: false, down: false });
        return;
      }

      if (key === "a" || key === "arrowleft") setInputs((p) => ({ ...p, left: true }));
      if (key === "d" || key === "arrowright") setInputs((p) => ({ ...p, right: true }));
      if (key === "w" || key === "arrowup") setInputs((p) => ({ ...p, up: true }));
      if (key === "s" || key === "arrowdown") setInputs((p) => ({ ...p, down: true }));

      // E = TALK WITH NPC ONLY
      if (key === "e") {
        if (!eKeyDownHandledRef.current) {
          eKeyDownHandledRef.current = true;
          handleTalkKey();
        }
      }

      // G = INTERACT / EXAMINE OBJECT / EVIDENCE / PORTAL
      if (key === "g") {
        if (!gKeyDownHandledRef.current) {
          gKeyDownHandledRef.current = true;
          handleObjectKey();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "e") eKeyDownHandledRef.current = false;
      if (key === "g") gKeyDownHandledRef.current = false;
      if (key === "f" || key === "escape") fKeyDownHandledRef.current = false;

      if (isModalOpen) return;
      if (key === "a" || key === "arrowleft") setInputs((p) => ({ ...p, left: false }));
      if (key === "d" || key === "arrowright") setInputs((p) => ({ ...p, right: false }));
      if (key === "w" || key === "arrowup") setInputs((p) => ({ ...p, up: false }));
      if (key === "s" || key === "arrowdown") setInputs((p) => ({ ...p, down: false }));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isLoading, world, errorMessage, isModalOpen, handleTalkKey, handleObjectKey, handleReturnKey]);

  // Continuous 60 FPS Physics & Game Loop
  useEffect(() => {
    if (isLoading || !world || errorMessage || isModalOpen) {
      return;
    }

    const sceneDef = world.scenes.find((s) => s.id === activeSceneId) || world.scenes[0];
    const template: SceneTemplateGeometry = SCENE_TEMPLATES[sceneDef.templateId] || SCENE_TEMPLATES["fort_gate"];

    let animFrameId: number;

    const loop = () => {
      setPlayerPhysics((prev) => {
        const computed = updatePlayerPhysics(prev, inputs, template, 1.0);
        setRenderScale(computed.scale);
        setRenderBobY(computed.bobOffsetY);
        setRenderSwayDeg(computed.swayRotationDeg);
        // Footstep SFX — triggered on each walking frame at rate-limited 4/s
        if (computed.isWalking) {
          sfxManager.playFootstep();
        }
        if (questRuntimeRef.current && computed.nextPos) {
          questRuntimeRef.current.setPlayerPos(computed.nextPos);
        }

        // Physical exit collision check: PROXIMITY ONLY updates nearExit state for UI prompts.
        // AUTOMATIC TRANSITION IS REMOVED: Scene transitions require explicit G (Forward) or F (Return) key presses.

        return {
          x: computed.nextPos.x,
          y: computed.nextPos.y,
          facingLeft: computed.facingLeft,
          isWalking: computed.isWalking,
          walkPhase: computed.walkPhase
        };
      });

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameId);
  }, [isLoading, world, errorMessage, activeSceneId, inputs, isModalOpen, executeSceneTransition]);

  if (errorMessage) {
    return <ExpeditionError message={errorMessage} onRetry={() => router.push("/ai-expedition")} />;
  }

  if (isLoading || !world) {
    return (
      <div className="min-h-screen bg-[#0a0806] flex items-center justify-center text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="animate-spin text-xl">⚙️</span>
          <span>Hydrating RPG Game Engine...</span>
        </div>
      </div>
    );
  }

  const handleDialogueOptionSelect = (option: DialogueOption) => {
    if (!questRuntimeRef.current) return;
    narrationManager.stopCurrentNarration("dialogue-option-select");

    if (option.grantsEvidenceId) {
      questRuntimeRef.current.discoverEvidence(option.grantsEvidenceId);
      const allDiscovered = questRuntimeRef.current.getDiscoveredEvidence();
      setDiscoveredEvidenceIds(allDiscovered);
      setDiscoveredEvidenceCount(allDiscovered.length);
    }

    if (option.completesObjectiveId) {
      const res = questRuntimeRef.current.completeObjective(option.completesObjectiveId);
      const updatedQuest = questRuntimeRef.current.getActiveQuest();
      setActiveQuest(updatedQuest);

      if (res.questCompleted) {
        setShowExpeditionComplete(true);
      }

      // Check if objective targets a puzzle
      if (world && updatedQuest) {
        const completedObj = updatedQuest.objectives.find((o) => o.id === option.completesObjectiveId);
        if (completedObj && completedObj.type === "SOLVE_PUZZLE") {
          const puzzle = world.puzzles.find((p) => p.id === completedObj.targetId);
          if (puzzle) {
            setActiveNPC(null);
            setActiveDialogueNodeId(undefined);
            setActivePuzzle(puzzle);
            return;
          }
        }
      }
    }

    if (option.nextDialogueId) {
      setActiveDialogueNodeId(option.nextDialogueId);
    } else {
      setActiveNPC(null);
      setActiveDialogueNodeId(undefined);
    }
  };

  const handlePuzzleSolved = () => {
    if (!activePuzzle || !questRuntimeRef.current) return;
    narrationManager.stopCurrentNarration("puzzle-solved");
    const res = questRuntimeRef.current.solvePuzzle(activePuzzle.id);
    setActivePuzzle(null);
    setActiveQuest(questRuntimeRef.current.getActiveQuest());

    if (res.questCompleted) {
      setShowExpeditionComplete(true);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050403] overflow-hidden select-none">
      
      {/* 1. GAME WORLD LAYER (z-0 isolate - contained stacking context) */}
      <div className="absolute inset-0 z-0 isolate overflow-hidden">
        
        {/* Background Artwork */}
        {currentBgUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-500 z-0"
            style={{ backgroundImage: `url("${currentBgUrl}")` }}
          />
        )}

        {/* Lighting & Vignette Overlay */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none z-10" />

        {/* Exits / Hotspots (Hidden when modal is open) */}
        {!isModalOpen && currentSceneDef?.exits.map((ex) => (
          <InteractionPrompt
            key={ex.id}
            keyLabel="G"
            label={ex.label.startsWith("Walk to") ? ex.label : `Walk to ${ex.label}`}
            onClick={handleObjectKey}
            xPercent={(ex.triggerArea.minX + ex.triggerArea.maxX) / 2}
            yPercent={(ex.triggerArea.minY + ex.triggerArea.maxY) / 2}
          />
        ))}

        {/* NPC Sprites & Interactions */}
        {currentSceneDef?.npcs.map((npcPlacement) => {
          const npcDef = world.characters.find((c) => c.id === npcPlacement.npcId);
          const isNearThisNPC = nearNPCPlacement?.npcId === npcPlacement.npcId;
          const spriteSrc = npcSpriteUrls[npcPlacement.npcId];

          if (!spriteSrc) return null;

          const npcZIndex = Math.floor(npcPlacement.y) + 10;
          const baseNpcScale = 0.70 + (npcPlacement.y / 100) * 0.40;
          const npcScale = baseNpcScale * PLASSEY_CHARACTER_SCALE_MULTIPLIER;

          return (
            <div key={npcPlacement.npcId}>
              {!isModalOpen && isNearThisNPC && (
                <InteractionPrompt
                  keyLabel="E"
                  label={`Talk to ${npcDef?.name}`}
                  onClick={handleTalkKey}
                  xPercent={npcPlacement.x}
                  yPercent={npcPlacement.y - 14}
                />
              )}
              {/* NPC Foot Ground Shadow */}
              <div
                style={{
                  left: `${npcPlacement.x}%`,
                  top: `${npcPlacement.y}%`,
                  transform: `translate(-50%, -50%) scale(${npcScale})`,
                  zIndex: npcZIndex - 1
                }}
                className="absolute w-14 h-3.5 rounded-full bg-black/45 blur-[2px] pointer-events-none"
              />
              <img
                src={spriteSrc}
                alt={npcDef?.name || "NPC"}
                style={{
                  left: `${npcPlacement.x}%`,
                  top: `${npcPlacement.y}%`,
                  transform: `translate(-50%, -100%) scale(${npcScale})`,
                  transformOrigin: "bottom center",
                  zIndex: npcZIndex,
                  imageRendering: "pixelated"
                }}
                className="absolute h-32 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)] pointer-events-auto cursor-pointer select-none transition-transform duration-100"
                onClick={() => {
                  if (isModalOpen || !npcDef) return;
                  sfxManager.playDialogueOpen();
                  setActiveNPC(npcDef);
                  setActiveDialogueNodeId(undefined);
                }}
              />
            </div>
          );
        })}

        {/* Props & Evidence Objects */}
        {currentSceneDef?.objects.map((obj) => {
          const isNearThisObj = nearObjectPlacement?.id === obj.id;
          const matchingEvidence = obj.clueId ? world.evidence.find((e) => e.id === obj.clueId) : null;
          let propSrc = matchingEvidence?.imageAsset;
          if (propSrc && (propSrc.includes("Image") || propSrc.includes(".jpg") || propSrc.includes(".jpeg"))) {
            propSrc = "/ai-expedition/plassey/props/company-trade-ledger.png";
          }
          const objZIndex = Math.floor(obj.y) + 5;
          const objScale = 0.75 + (obj.y / 100) * 0.25;

          return (
            <div key={obj.id}>
              {!isModalOpen && isNearThisObj && (
                <InteractionPrompt
                  keyLabel="G"
                  label={obj.interactionText}
                  onClick={handleObjectKey}
                  xPercent={obj.x}
                  yPercent={obj.y - 8}
                />
              )}

              {propSrc ? (
                <div
                  style={{
                    left: `${obj.x}%`,
                    top: `${obj.y}%`,
                    transform: `translate(-50%, -100%) scale(${objScale})`,
                    transformOrigin: "bottom center",
                    zIndex: objZIndex
                  }}
                  className="absolute pointer-events-auto cursor-pointer group flex flex-col items-center"
                  onClick={() => {
                    if (isModalOpen) return;
                    handleObjectKey();
                  }}
                >
                  <div className="w-5 h-5 mb-1 rounded-full bg-[#f59e0b]/80 border border-[#fff9e6] animate-bounce flex items-center justify-center text-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    ✨
                  </div>
                  <img
                    src={propSrc}
                    alt={obj.name}
                    style={{ imageRendering: "pixelated" }}
                    className="h-14 max-w-[90px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-transform duration-150 group-hover:scale-110"
                  />
                </div>
              ) : (
                <div
                  style={{ left: `${obj.x}%`, top: `${obj.y}%`, zIndex: objZIndex }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f59e0b]/40 border-2 border-[#ffdc5e] animate-pulse cursor-pointer flex items-center justify-center text-xs shadow-md"
                  onClick={() => {
                    if (isModalOpen) return;
                    handleObjectKey();
                  }}
                >
                  🔍
                </div>
              )}
            </div>
          );
        })}

        {/* Hero Player Foot Shadow & Sprite — always visible, uses /player.png as canonical fallback */}
        {(() => {
          const spriteSrc = playerSpriteUrl || "/player.png";
          return (
            <>
              <div
                style={{
                  left: `${playerPhysics.x}%`,
                  top: `${playerPhysics.y}%`,
                  transform: `translate(-50%, -50%) scale(${renderScale})`,
                  zIndex: Math.floor(playerPhysics.y) + 11
                }}
                className="absolute w-16 h-4 rounded-full bg-black/50 blur-[2px] pointer-events-none"
              />
              <img
                src={spriteSrc}
                alt="Protagonist"
                style={{
                  left: `${playerPhysics.x}%`,
                  top: `${playerPhysics.y}%`,
                  transform: `translate(-50%, -100%) scale(${renderScale}) scaleX(${playerPhysics.facingLeft ? -1 : 1}) rotate(${renderSwayDeg}deg) translateY(${renderBobY}px)`,
                  transformOrigin: "bottom center",
                  zIndex: Math.floor(playerPhysics.y) + 12,
                  imageRendering: "pixelated"
                }}
                className="absolute h-32 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.95)] transition-transform duration-75 pointer-events-none select-none"
              />
            </>
          );
        })()}
      </div>

      {/* 2. GAME HUD LAYER (z-100) */}
      <div className="relative z-[100] pointer-events-none">
        <ExpeditionHUD
          metadata={world.metadata}
          activeQuest={activeQuest}
          discoveredCount={discoveredEvidenceCount}
          totalEvidenceCount={world.evidence.length}
          onOpenCodex={() => setShowCodex(true)}
          onRestart={() => {
            ExpeditionStorage.clearGameState(worldId);
            window.location.reload();
          }}
          onBackToGenerator={() => router.push("/ai-expedition")}
        />

        {!isModalOpen && (
          <VirtualDPad
            onInputStateChange={setInputs}
            onTalk={handleTalkKey}
            onObjectInteract={handleObjectKey}
            isNpcNear={Boolean(nearNPCDef)}
            isObjectNear={Boolean(nearObjectPlacement || nearExit)}
            npcLabel={nearNPCDef ? `Talk to ${nearNPCDef.name}` : "Talk"}
            objectLabel={nearObjectPlacement ? "Examine Object" : nearExit ? "Walk to Area" : "Examine"}
          />
        )}
      </div>

      {/* 3. MODAL LAYER (z-1000 - topmost interaction layer) */}
      <div className="relative z-[1000] pointer-events-auto">
        {activeNarratorEvent && (
          <NarratorPanel
            text={activeNarratorEvent.text}
            tone={activeNarratorEvent.tone}
            onDismiss={() => {
              if (questRuntimeRef.current) {
                questRuntimeRef.current.markNarratorEventRead(activeNarratorEvent.id);
              }
              setActiveNarratorEvent(null);
            }}
          />
        )}

        {activeNPC && (
          <DialoguePanel
            npc={activeNPC}
            currentNodeId={activeDialogueNodeId}
            onOptionSelect={handleDialogueOptionSelect}
            onClose={() => {
              setActiveNPC(null);
              setActiveDialogueNodeId(undefined);
            }}
          />
        )}

        {activeEvidenceItem && (
          <EvidenceModal
            evidence={activeEvidenceItem}
            onClose={() => setActiveEvidenceItem(null)}
          />
        )}

        {activePuzzle && (
          <PuzzleModal
            puzzle={activePuzzle}
            onSolve={handlePuzzleSolved}
            onClose={() => setActivePuzzle(null)}
          />
        )}

        {showCodex && (
          <HistoricalCodexModal
            evidenceList={world.evidence.map((ev) => ({
              ...ev,
              isDiscovered: discoveredEvidenceIds.includes(ev.id) || ev.isDiscovered
            }))}
            historicalContext={world.historicalContext}
            learningObjectives={world.learningObjectives}
            onClose={() => setShowCodex(false)}
          />
        )}

        {showExpeditionComplete && (
          <ExpeditionComplete
            world={world}
            discoveredCount={discoveredEvidenceCount}
            onExploreAnother={() => router.push("/ai-expedition")}
          />
        )}
      </div>

    </div>
  );
}
