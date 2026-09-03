"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DialoguePanel from "../../components/DialoguePanel";
import { WorldDefinition, Position2D, NPCDefinition, NPCDialogueNode, SceneDefinition } from "../types/world";
import ExpeditionHUD from "./ExpeditionHUD";
import HistoricalCodexModal from "./HistoricalCodexModal";
import HistoricalReflectionModal from "./HistoricalReflectionModal";
import { saveGameState, getGameState } from "../services/storage";
import { defaultImageProvider } from "../services/providers";
import { preloadConnectedSceneImages } from "../services/preloader";
import { generateSceneHash } from "../services/cache";
import { getImagePayload } from "../services/imageStorage";

interface IsolatedGameEngineProps {
  world: WorldDefinition;
}

export default function IsolatedGameEngine({ world }: IsolatedGameEngineProps) {
  const router = useRouter();

  // Deterministic initial state for SSR / initial client render
  const initialScene = world.scenes[world.initialSceneId] || Object.values(world.scenes)[0];
  const [currentSceneId, setCurrentSceneId] = useState<string>(initialScene?.id || world.initialSceneId);
  const [playerPos, setPlayerPos] = useState<Position2D>(
    initialScene?.playerSpawn || { x: 50, y: 80 }
  );
  const [facingLeft, setFacingLeft] = useState<boolean>(false);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [walkPhase, setWalkPhase] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Background visual image state
  const [sceneBgImage, setSceneBgImage] = useState<string>(
    initialScene?.backgroundImageUrl || "/bg-chittorgarh-courtyard.jpg"
  );
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);
  const [showCodex, setShowCodex] = useState<boolean>(false);
  const [evidenceNotice, setEvidenceNotice] = useState<{ title: string; fact: string } | null>(null);

  const [visualMeta, setVisualMeta] = useState<{
    provider?: string;
    model?: string;
    generated?: boolean;
    cached?: boolean;
    fallback?: boolean;
    signature?: string;
  } | null>(null);

  // Quest & Discovery tracking
  const [discoveredClues, setDiscoveredClues] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Active NPC Dialogue state
  const [activeNPC, setActiveNPC] = useState<NPCDefinition | null>(null);
  const [activeDialogueNode, setActiveDialogueNode] = useState<NPCDialogueNode | null>(null);

  // Load saved state safely after hydration
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const savedState = getGameState(world.worldId);
      if (savedState) {
        if (savedState.currentSceneId && world.scenes[savedState.currentSceneId]) {
          setCurrentSceneId(savedState.currentSceneId);
        }
        if (savedState.playerPos) {
          setPlayerPos(savedState.playerPos);
        }
        if (Array.isArray(savedState.discoveredClueIds)) {
          setDiscoveredClues(savedState.discoveredClueIds);
        }
        if (typeof savedState.currentStageIndex === "number") {
          setCurrentStageIndex(savedState.currentStageIndex);
        }
        if (typeof savedState.isCompleted === "boolean") {
          setIsCompleted(savedState.isCompleted);
        }
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [world.worldId, world.scenes]);

  const currentScene = world.scenes[currentSceneId] || initialScene;

  // Fetch or resolve background image when current scene changes
  useEffect(() => {
    let isCancelled = false;

    const loadSceneImage = async () => {
      const sceneObj = currentScene as SceneDefinition & { visualCacheKey?: string };
      const hashKey =
        sceneObj.visualCacheKey ||
        generateSceneHash(
          currentScene.historicalPeriod || world.historicalEra,
          world.region,
          currentScene.archetype,
          currentScene.name
        );

      // 1. Check in-memory/IndexedDB image storage first for 0-latency instant load
      const storedPayload = await getImagePayload(hashKey);
      if (!isCancelled && storedPayload) {
        setSceneBgImage(storedPayload);
        setVisualMeta({
          provider: "huggingface-inference-providers",
          model: "black-forest-labs/FLUX.1-Kontext-dev",
          generated: true,
          cached: true,
          fallback: false,
          signature: hashKey,
        });
        return;
      }

      // 2. If currentScene.backgroundImageUrl exists and is non-empty, use it
      if (currentScene.backgroundImageUrl) {
        setSceneBgImage(currentScene.backgroundImageUrl);
      }

      // 3. Otherwise request scene visual generation
      try {
        const imgResult = await defaultImageProvider.generateSceneImage(world, currentScene);
        if (!isCancelled && imgResult.imageUrl) {
          setSceneBgImage(imgResult.imageUrl);
          setVisualMeta({
            provider: imgResult.provider,
            model: "black-forest-labs/FLUX.1-Kontext-dev",
            generated: imgResult.provider === "huggingface-inference-providers" && !imgResult.isFallback,
            cached: imgResult.provider === "cache",
            fallback: imgResult.isFallback,
            signature: hashKey,
          });
          if (imgResult.message) {
            setImageNotice(imgResult.message);
          }
        }
      } catch (err) {
        console.warn("Scene visual load error, keeping active background:", err);
      }
    };

    loadSceneImage();
    preloadConnectedSceneImages(world, currentScene);

    return () => {
      isCancelled = true;
    };
  }, [currentSceneId, world, currentScene]);

  // Persist game state on state changes
  useEffect(() => {
    saveGameState({
      worldId: world.worldId,
      currentSceneId,
      playerPos,
      discoveredClueIds: discoveredClues,
      currentStageIndex,
      isCompleted,
      updatedAt: new Date().toISOString(),
    });
  }, [world.worldId, currentSceneId, playerPos, discoveredClues, currentStageIndex, isCompleted]);

  // Proximity calculations
  const nearbyNPC = currentScene.npcs.find((npc) => {
    const dx = playerPos.x - npc.position.x;
    const dy = playerPos.y - npc.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= npc.interactionRadius;
  });

  const nearbyClue = currentScene.clues.find((clue) => {
    if (discoveredClues.includes(clue.id)) return false;
    const dx = playerPos.x - clue.position.x;
    const dy = playerPos.y - clue.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= 7.0;
  });

  // Calculate 2.5D depth scale factor
  const { baseScale, scaleRange, minY, maxY, speed } = world.kinematics;
  const clampedY = Math.max(minY, Math.min(maxY, playerPos.y));
  const scaleRatio = (clampedY - minY) / (maxY - minY || 1);
  const currentScale = baseScale + scaleRatio * scaleRange;

  // Smooth 60 FPS Game Loop & Input System
  useEffect(() => {
    if (isTransitioning || activeNPC || isCompleted || showCodex) return;

    const keysHeld = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysHeld.add(key);

      if (key === "e") {
        if (nearbyNPC) {
          setActiveNPC(nearbyNPC);
          const initialNode = nearbyNPC.dialogueTree[nearbyNPC.initialDialogueId];
          setActiveDialogueNode(initialNode || null);
        } else if (nearbyClue) {
          if (!discoveredClues.includes(nearbyClue.id)) {
            setDiscoveredClues((prev) => [...prev, nearbyClue.id]);
          }

          setEvidenceNotice({
            title: nearbyClue.name,
            fact: nearbyClue.historicalFact || nearbyClue.description,
          });

          setTimeout(() => {
            setEvidenceNotice(null);
          }, 4500);

          const currentStage = world.quest.stages[currentStageIndex];
          if (
            currentStage &&
            (currentStage.completionCondition.type === "clue_collect" ||
              currentStage.completionCondition.type === "evidence_investigate") &&
            currentStage.completionCondition.targetId === nearbyClue.id
          ) {
            if (currentStageIndex + 1 < world.quest.stages.length) {
              setCurrentStageIndex((prev) => prev + 1);
            }
          }
        }
      }

      if (key === "escape") {
        setActiveNPC(null);
        setActiveDialogueNode(null);
        setShowCodex(false);
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
      let rawDx = 0;
      let rawDy = 0;

      if (keysHeld.has("arrowleft") || keysHeld.has("a")) rawDx -= 1;
      if (keysHeld.has("arrowright") || keysHeld.has("d")) rawDx += 1;
      if (keysHeld.has("arrowup") || keysHeld.has("w")) rawDy -= 1;
      if (keysHeld.has("arrowdown") || keysHeld.has("s")) rawDy += 1;

      let dx = 0;
      let dy = 0;

      if (rawDx !== 0 && rawDy !== 0) {
        // Normalize velocity vector so diagonal WASD movement doesn't move sqrt(2) times faster
        const normFactor = Math.hypot(rawDx, rawDy);
        dx = (rawDx / normFactor) * speed;
        dy = (rawDy / normFactor) * speed * 0.85;
      } else {
        dx = rawDx * speed;
        dy = rawDy * speed * 0.85;
      }

      const moving = dx !== 0 || dy !== 0;
      setIsWalking(moving);

      if (dx < 0) setFacingLeft(true);
      if (dx > 0) setFacingLeft(false);

      if (moving) {
        localWalkTimer += 0.25;
        setWalkPhase(localWalkTimer);

        setPlayerPos((prev) => {
          let nextX = prev.x + dx;
          let nextY = prev.y + dy;

          const bounds = currentScene.walkableBoundary;
          nextX = Math.max(bounds.minX, Math.min(bounds.maxX, nextX));
          nextY = Math.max(bounds.minY, Math.min(bounds.maxY, nextY));

          for (const obs of currentScene.collisionObstacles) {
            if (
              nextX >= obs.minX &&
              nextX <= obs.maxX &&
              nextY >= obs.minY &&
              nextY <= obs.maxY
            ) {
              nextX = prev.x;
              nextY = prev.y;
            }
          }

          for (const exit of currentScene.exits) {
            const trig = exit.triggerArea;
            if (
              nextX >= trig.minX &&
              nextX <= trig.maxX &&
              nextY >= trig.minY &&
              nextY <= trig.maxY
            ) {
              if (exit.targetSceneId === "complete") {
                setIsCompleted(true);
              } else if (world.scenes[exit.targetSceneId]) {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentSceneId(exit.targetSceneId);
                  setPlayerPos(exit.targetSpawnPos);
                  setIsTransitioning(false);

                  const currentStage = world.quest.stages[currentStageIndex];
                  if (
                    currentStage &&
                    currentStage.completionCondition.type === "reach_exit" &&
                    currentStage.completionCondition.targetId === exit.id
                  ) {
                    if (currentStageIndex + 1 < world.quest.stages.length) {
                      setCurrentStageIndex((prev) => prev + 1);
                    }
                  }
                }, 400);
              }
            }
          }

          return { x: nextX, y: nextY };
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
  }, [currentScene, isTransitioning, activeNPC, isCompleted, showCodex, speed, nearbyNPC, nearbyClue, currentStageIndex, world.quest.stages, discoveredClues]);

  const handleOptionSelect = (option: { id: number | string; text: string }) => {
    if (!activeNPC) return;

    const matchedOption = activeDialogueNode?.options?.find(
      (opt) => String(opt.id) === String(option.id)
    );

    if (!matchedOption) {
      setActiveNPC(null);
      setActiveDialogueNode(null);
      return;
    }

    if (matchedOption.completesObjectiveId) {
      const currentStage = world.quest.stages[currentStageIndex];
      if (
        currentStage &&
        currentStage.completionCondition.type === "npc_talk" &&
        currentStage.completionCondition.targetId === matchedOption.completesObjectiveId
      ) {
        if (currentStageIndex + 1 < world.quest.stages.length) {
          setCurrentStageIndex((prev) => prev + 1);
        }
      }
    }

    if (matchedOption.nextDialogueId && activeNPC.dialogueTree[matchedOption.nextDialogueId]) {
      setActiveDialogueNode(activeNPC.dialogueTree[matchedOption.nextDialogueId]);
    } else {
      setActiveNPC(null);
      setActiveDialogueNode(null);
    }
  };

  const footstepBobbing = isWalking ? Math.sin(walkPhase) * 1.8 : 0;
  const rotationalSway = isWalking ? Math.sin(walkPhase * 0.5) * 1.5 : 0;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans">
      {/* 2.5D Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img
          src={sceneBgImage}
          alt={currentScene.name}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* Transition Overlay */}
      <div
        className={`absolute inset-0 bg-black z-40 transition-opacity duration-400 pointer-events-none ${
          isTransitioning ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Non-blocking Discovered Evidence Banner */}
      {evidenceNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#fff9e6] border-3 border-black text-black px-5 py-3 rounded-xl max-w-lg shadow-[6px_6px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#8a6835] mb-1">
            <span>📜</span> Historical Evidence Discovered!
          </div>
          <h4 className="font-bold text-sm leading-tight text-black mb-1">{evidenceNotice.title}</h4>
          <p className="text-xs text-gray-800 font-medium leading-snug">{evidenceNotice.fact}</p>
        </div>
      )}

      {/* Technical Details Drawer */}
      <div className="absolute top-4 right-20 z-30 flex flex-col items-end">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="bg-[#16120e]/80 hover:bg-[#251d16] border border-[#483824] text-[#e4c794] px-2.5 py-1 rounded-md text-[10px] font-bold backdrop-blur-md shadow-md"
        >
          ⚙️ Technical Details
        </button>
        {showTechDetails && visualMeta && (
          <div className="mt-1 bg-[#16120e]/90 border border-[#3a2d1d] text-[10px] font-mono text-[#a89985] p-3 rounded-lg backdrop-blur-md shadow-xl text-left space-y-0.5 max-w-xs">
            <p><span className="text-[#91714b]">Provider:</span> {visualMeta.provider}</p>
            <p><span className="text-[#91714b]">Model:</span> {visualMeta.model}</p>
            <p><span className="text-[#91714b]">Generated:</span> {String(visualMeta.generated)}</p>
            <p><span className="text-[#91714b]">Cached:</span> {String(visualMeta.cached)}</p>
            <p><span className="text-[#91714b]">Fallback:</span> {String(visualMeta.fallback)}</p>
            <p><span className="text-[#91714b]">Signature:</span> {visualMeta.signature}</p>
          </div>
        )}
      </div>

      {/* Non-blocking Provider Status Notice */}
      {(imageNotice || world.provider === "mock_fallback") && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-amber-950/80 border border-amber-700/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] text-amber-200 pointer-events-none flex items-center gap-2 shadow-lg">
          <span>📜</span>
          <span>
            {world.provider === "mock_fallback"
              ? "Prepared Historical Expedition • Demo Scenario"
              : imageNotice}
          </span>
        </div>
      )}

      {/* Clue / Evidence Visual Markers */}
      {currentScene.clues.map((clue) => {
        if (discoveredClues.includes(clue.id)) return null;
        return (
          <div
            key={clue.id}
            className="absolute z-10 flex flex-col items-center animate-bounce -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${clue.position.x}%`, top: `${clue.position.y}%` }}
          >
            <div className="bg-[#ffdc5e] border-2 border-black px-2 py-0.5 rounded text-[11px] font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-black">
              📜 Evidence
            </div>
          </div>
        );
      })}

      {/* NPC Sprites & Markers */}
      {currentScene.npcs.map((npc) => (
        <div
          key={npc.id}
          className="absolute z-10 flex flex-col items-center -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ left: `${npc.position.x}%`, top: `${npc.position.y}%` }}
        >
          <div className="bg-[#fff9e6] border-2 border-black px-2 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-black mb-1">
            {npc.name}
          </div>
          <img
            src={npc.spriteUrl}
            alt={npc.name}
            className="h-24 w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
          />
        </div>
      ))}

      {/* Hero Player Sprite */}
      <div
        className="absolute z-20 -translate-x-1/2 -translate-y-full transition-transform duration-75"
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transform: `translate(-50%, -100%) scale(${currentScale}) rotate(${rotationalSway}deg) translateY(${footstepBobbing}px)`,
        }}
      >
        <img
          src="/player.png"
          alt="Player"
          className={`h-28 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] ${
            facingLeft ? "scale-x-[-1]" : ""
          }`}
        />
      </div>

      {/* Interaction Prompts */}
      {nearbyNPC && !activeNPC && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full animate-pulse"
          style={{ left: `${nearbyNPC.position.x}%`, top: `${nearbyNPC.position.y - 12}%` }}
        >
          <button className="bg-[#ffdc5e] border-3 border-black text-black font-bold px-3 py-1 rounded-md text-xs shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            [E] Talk to {nearbyNPC.name}
          </button>
        </div>
      )}

      {nearbyClue && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full animate-pulse"
          style={{ left: `${nearbyClue.position.x}%`, top: `${nearbyClue.position.y - 8}%` }}
        >
          <button className="bg-[#ffdc5e] border-3 border-black text-black font-bold px-3 py-1 rounded-md text-xs shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            [E] Inspect {nearbyClue.name}
          </button>
        </div>
      )}

      {/* Isolated HUD */}
      <ExpeditionHUD
        world={world}
        currentSceneName={currentScene.name}
        cluesCount={discoveredClues.length}
        currentStageIndex={currentStageIndex}
        onOpenCodex={() => setShowCodex(true)}
        onLeave={() => router.push("/ai-expedition")}
      />

      {/* Historical Codex & Knowledge Journal Modal */}
      {showCodex && (
        <HistoricalCodexModal
          world={world}
          currentScene={currentScene}
          discoveredClueIds={discoveredClues}
          onClose={() => setShowCodex(false)}
        />
      )}

      {/* Dialogue Panel Overlay */}
      {activeNPC && activeDialogueNode && (
        <DialoguePanel
          characterName={activeDialogueNode.speakerName}
          characterTitle={activeDialogueNode.speakerTitle}
          dialogueText={activeDialogueNode.text}
          options={activeDialogueNode.options || []}
          onOptionSelect={handleOptionSelect}
          onClose={() => {
            setActiveNPC(null);
            setActiveDialogueNode(null);
          }}
        />
      )}

      {/* Educational Historical Reflection & Quest Completion Modal */}
      {isCompleted && (
        <HistoricalReflectionModal
          world={world}
          onComplete={() => router.push("/ai-expedition")}
        />
      )}
    </div>
  );
}
