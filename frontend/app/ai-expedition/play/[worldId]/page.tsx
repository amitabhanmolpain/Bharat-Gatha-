"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { WorldDefinition, DialogueOption, SceneExit, NPCDefinition, PuzzleDefinition, NarratorEvent, QuestDefinition } from "../../types/expedition";
import { SCENE_TEMPLATES, SceneTemplateGeometry } from "../../data/sceneTemplates";
import { ExpeditionStorage } from "../../services/storage";
import { geminiImageProvider } from "../../services/geminiImageProvider";
import { updatePlayerPhysics, isWithinProximity, InputState, PlayerPhysicsState, PLASSEY_CHARACTER_SCALE_MULTIPLIER } from "../../engine/physics";
import { QuestRuntime } from "../../engine/questRuntime";

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
  const [playerSpriteUrl, setPlayerSpriteUrl] = useState<string>("");
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

    // Load Hero Player Character Image
    const playerPrompt = `Create a 2.5D RPG protagonist sprite during ${world.metadata.era} in ${world.metadata.location}`;
    geminiImageProvider.getCharacterImage(worldId, "player", playerPrompt)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.objectUrl) {
          setPlayerSpriteUrl(encodeURI(res.objectUrl));
        } else {
          setErrorMessage(res.error || "Generated player character asset is missing.");
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

  // Current Scene Definition & Proximity Calculations
  const currentSceneDef = world?.scenes.find((s) => s.id === activeSceneId) || world?.scenes[0];

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

  const candidateExit = currentSceneDef?.exits.find((ex) => {
    const insideArea =
      playerPhysics.x >= ex.triggerArea.minX &&
      playerPhysics.x <= ex.triggerArea.maxX &&
      playerPhysics.y >= ex.triggerArea.minY &&
      playerPhysics.y <= ex.triggerArea.maxY;
    const centerPos = {
      x: (ex.triggerArea.minX + ex.triggerArea.maxX) / 2,
      y: (ex.triggerArea.minY + ex.triggerArea.maxY) / 2
    };
    const nearCenter = isWithinProximity({ x: playerPhysics.x, y: playerPhysics.y }, centerPos, 18.0);
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

  const lastTransitionTimeRef = useRef<number>(0);

  // Authoritative Scene Transition Function
  const transitionToScene = useCallback((targetSceneId: string, targetSpawnPoint?: { x: number; y: number }) => {
    if (!world) return;
    const targetScene = world.scenes.find((s) => s.id === targetSceneId);
    if (!targetScene) return;

    const spawnPoint = targetSpawnPoint || targetScene.spawnPoint || { x: 20, y: 78 };

    if (questRuntimeRef.current) {
      questRuntimeRef.current.setSceneId(targetSceneId, spawnPoint);
    }
    setActiveSceneId(targetSceneId);
    setPlayerPhysics((prev) => ({
      ...prev,
      x: spawnPoint.x,
      y: spawnPoint.y,
      isWalking: false
    }));
    lastTransitionTimeRef.current = Date.now();
  }, [world]);

  const executeSceneTransition = useCallback((exit: SceneExit) => {
    transitionToScene(exit.targetSceneId, exit.targetSpawn);
  }, [transitionToScene]);

  // Interaction Key Handler
  const handleInteractKey = useCallback(() => {
    if (nearNPCDef) {
      setActiveNPC(nearNPCDef);
      setActiveDialogueNodeId(undefined);
      return;
    }

    if (nearObjectPlacement) {
      if (nearObjectPlacement.clueId && questRuntimeRef.current && world) {
        const discovered = questRuntimeRef.current.discoverEvidence(nearObjectPlacement.clueId);
        if (discovered) {
          const allDiscovered = questRuntimeRef.current.getDiscoveredEvidence();
          setDiscoveredEvidenceIds(allDiscovered);
          setDiscoveredEvidenceCount(allDiscovered.length);
          setActiveQuest(questRuntimeRef.current.getActiveQuest());
        }
        const evItem = world.evidence.find((e) => e.id === nearObjectPlacement.clueId);
        if (evItem) {
          setActiveEvidenceItem(evItem);
          return;
        }
      }
      return;
    }

    if (nearExit) {
      executeSceneTransition(nearExit);
      return;
    }

    // Check if near puzzle objective
    if (world) {
      const puzzle = world.puzzles.find((p) => !p.isSolved);
      if (puzzle && !activePuzzle) {
        setActivePuzzle(puzzle);
      }
    }
  }, [nearNPCDef, nearObjectPlacement, nearExit, world, activePuzzle, executeSceneTransition]);

  const isModalOpen = Boolean(
    activeNPC || activePuzzle || activeNarratorEvent || activeEvidenceItem || showCodex || showExpeditionComplete
  );

  // Keydown / Keyup Event Listeners
  useEffect(() => {
    if (isLoading || !world || errorMessage) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "escape") {
        setActiveNPC(null);
        setActivePuzzle(null);
        setActiveNarratorEvent(null);
        setShowCodex(false);
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

      if (key === "e") {
        handleInteractKey();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      const key = e.key.toLowerCase();
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
  }, [isLoading, world, errorMessage, isModalOpen, handleInteractKey]);

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

        if (questRuntimeRef.current && computed.nextPos) {
          questRuntimeRef.current.setPlayerPos(computed.nextPos);
        }

        // Physical exit collision check: trigger transition when walking into exit zone
        const currentExits = sceneDef?.exits || [];
        const triggeredExit = currentExits.find((ex) => {
          return (
            computed.nextPos.x >= ex.triggerArea.minX &&
            computed.nextPos.x <= ex.triggerArea.maxX &&
            computed.nextPos.y >= ex.triggerArea.minY &&
            computed.nextPos.y <= ex.triggerArea.maxY
          );
        });

        if (triggeredExit && Date.now() - lastTransitionTimeRef.current > 1000) {
          lastTransitionTimeRef.current = Date.now();
          setTimeout(() => {
            executeSceneTransition(triggeredExit);
          }, 0);
        }

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
            label={ex.label.startsWith("Walk to") ? ex.label : `Walk to ${ex.label}`}
            onClick={handleInteractKey}
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
                  label={`Talk to ${npcDef?.name}`}
                  onClick={handleInteractKey}
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
                  label={obj.interactionText}
                  onClick={handleInteractKey}
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
                    handleInteractKey();
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
                    handleInteractKey();
                  }}
                >
                  🔍
                </div>
              )}
            </div>
          );
        })}

        {/* Hero Player Foot Shadow & Sprite */}
        {playerSpriteUrl && (
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
              src={playerSpriteUrl}
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
        )}
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
            onInteract={handleInteractKey}
            isInteractNear={Boolean(nearNPCDef || nearObjectPlacement || nearExit)}
            interactLabel={nearNPCDef ? `Talk to ${nearNPCDef.name}` : nearExit ? "Enter Portal" : "Inspect"}
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
