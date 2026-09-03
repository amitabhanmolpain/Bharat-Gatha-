import { WorldDefinition, SceneDefinition, SceneArchetype, Position2D, BoundingBox } from "../types/world";

const ARCHETYPE_BACKGROUNDS: Record<SceneArchetype, string> = {
  gate: "/bg-agra-fort.jpg",
  corridor: "/bg-agra-brown-passage.jpg",
  courtyard: "/bg-chittorgarh-courtyard.jpg",
  palace_interior: "/bg-badal-mahal-interior.jpg",
  throne_hall: "/bg-agra-interior.jpg",
  terrace: "/bg-kumbhalgarh-wall-top.jpg",
  bazaar: "/bg-red-fort-interior.jpg",
  fort_approach: "/bg-chittorgarh-ram-pol.jpg",
  fort_wall: "/bg-chittorgarh-desert-side.jpg",
  merchant_warehouse: "/bg-red-fort-interior.jpg",
  port: "/bg-agra-fort.jpg",
};

function parsePosition(pos: unknown, fallback: Position2D): Position2D {
  if (pos && typeof pos === "object") {
    const p = pos as { x?: unknown; y?: unknown };
    return {
      x: typeof p.x === "number" ? p.x : fallback.x,
      y: typeof p.y === "number" ? p.y : fallback.y,
    };
  }
  return fallback;
}

function parseBounds(bounds: unknown, fallback: BoundingBox): BoundingBox {
  if (bounds && typeof bounds === "object") {
    const b = bounds as { minX?: unknown; maxX?: unknown; minY?: unknown; maxY?: unknown };
    return {
      minX: typeof b.minX === "number" ? b.minX : fallback.minX,
      maxX: typeof b.maxX === "number" ? b.maxX : fallback.maxX,
      minY: typeof b.minY === "number" ? b.minY : fallback.minY,
      maxY: typeof b.maxY === "number" ? b.maxY : fallback.maxY,
    };
  }
  return fallback;
}

export function parseAndValidateWorld(jsonString: string, userPrompt: string): WorldDefinition {
  let cleaned = jsonString.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(cleaned);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Parse error";
    throw new Error(`Invalid JSON output: ${errorMsg}`);
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("Parsed output is not an object");
  }

  if (!raw.title || typeof raw.title !== "string") {
    throw new Error("Missing or invalid 'title'");
  }
  if (!raw.scenes || typeof raw.scenes !== "object") {
    throw new Error("Missing or empty 'scenes' map");
  }

  const rawScenes = raw.scenes as Record<string, Record<string, unknown>>;
  const sceneKeys = Object.keys(rawScenes);
  if (sceneKeys.length === 0) {
    throw new Error("Empty 'scenes' map");
  }

  const initialSceneId =
    typeof raw.initialSceneId === "string" && rawScenes[raw.initialSceneId]
      ? raw.initialSceneId
      : sceneKeys[0];

  const repairedScenes: Record<string, SceneDefinition> = {};
  for (const key of sceneKeys) {
    const sc = rawScenes[key] || {};
    const archetype: SceneArchetype = ARCHETYPE_BACKGROUNDS[sc.archetype as SceneArchetype]
      ? (sc.archetype as SceneArchetype)
      : "courtyard";

    const playerSpawn = parsePosition(sc.playerSpawn, { x: 50, y: 80 });
    const walkableBoundary = parseBounds(sc.walkableBoundary, { minX: 10, maxX: 90, minY: 40, maxY: 85 });

    repairedScenes[key] = {
      id: typeof sc.id === "string" ? sc.id : key,
      name: typeof sc.name === "string" ? sc.name : "Historical Scene",
      archetype,
      historicalPeriod: typeof sc.historicalPeriod === "string" ? sc.historicalPeriod : "Historical Era",
      locationName: typeof sc.locationName === "string" ? sc.locationName : "Historical Site",
      backgroundImageUrl: typeof sc.backgroundImageUrl === "string" ? sc.backgroundImageUrl : ARCHETYPE_BACKGROUNDS[archetype],
      playerSpawn,
      walkableBoundary,
      collisionObstacles: Array.isArray(sc.collisionObstacles)
        ? sc.collisionObstacles.map((o) => parseBounds(o, { minX: 0, maxX: 0, minY: 0, maxY: 0 }))
        : [],
      exits: Array.isArray(sc.exits)
        ? sc.exits.map((ex: Record<string, unknown>, idx: number) => ({
            id: typeof ex.id === "string" ? ex.id : `exit-${idx}`,
            label: typeof ex.label === "string" ? ex.label : "Proceed",
            triggerArea: parseBounds(ex.triggerArea, { minX: 42, maxX: 58, minY: 38, maxY: 44 }),
            targetSceneId: typeof ex.targetSceneId === "string" ? ex.targetSceneId : "complete",
            targetSpawnPos: parsePosition(ex.targetSpawnPos, { x: 50, y: 80 }),
            transitionType: (ex.transitionType === "carriage" || ex.transitionType === "boat") ? ex.transitionType : "walk",
          }))
        : [],
      npcs: Array.isArray(sc.npcs)
        ? sc.npcs.map((npc: Record<string, unknown>, nIdx: number) => ({
            id: typeof npc.id === "string" ? npc.id : `npc-${nIdx}`,
            name: typeof npc.name === "string" ? npc.name : "Resident",
            title: typeof npc.title === "string" ? npc.title : "Scholar",
            role: typeof npc.role === "string" ? npc.role : "Local Guide",
            position: parsePosition(npc.position, { x: 35, y: 60 }),
            spriteUrl: typeof npc.spriteUrl === "string" ? npc.spriteUrl : "/guard.png",
            interactionRadius: typeof npc.interactionRadius === "number" ? npc.interactionRadius : 8.0,
            initialDialogueId: typeof npc.initialDialogueId === "string" ? npc.initialDialogueId : "node-1",
            dialogueTree: npc.dialogueTree && typeof npc.dialogueTree === "object"
              ? (npc.dialogueTree as Record<string, import("../types/world").NPCDialogueNode>)
              : {},
          }))
        : [],
      clues: Array.isArray(sc.clues)
        ? sc.clues.map((c: Record<string, unknown>, cIdx: number) => ({
            id: typeof c.id === "string" ? c.id : `clue-${cIdx}`,
            name: typeof c.name === "string" ? c.name : "Historical Evidence",
            description: typeof c.description === "string" ? c.description : "An authentic primary historical source.",
            position: parsePosition(c.position, { x: 60, y: 65 }),
          }))
        : [],
    };
  }

  const slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const rawKinematics = raw.kinematics as Record<string, unknown> | undefined;

  const validatedWorld: WorldDefinition = {
    worldId: `expedition-ai-${slug}-${Date.now().toString(36)}`,
    title: raw.title,
    summary: typeof raw.summary === "string" ? raw.summary : `A dynamic historical expedition exploring ${userPrompt}.`,
    historicalEra: typeof raw.historicalEra === "string" ? raw.historicalEra : "Historical Period",
    year: typeof raw.year === "number" ? raw.year : 1857,
    region: typeof raw.region === "string" ? raw.region : "India",
    userPrompt,
    createdAt: new Date().toISOString(),
    initialSceneId,
    kinematics: rawKinematics && typeof rawKinematics.baseScale === "number"
      ? {
          baseScale: typeof rawKinematics.baseScale === "number" ? rawKinematics.baseScale : 0.85,
          scaleRange: typeof rawKinematics.scaleRange === "number" ? rawKinematics.scaleRange : 0.3,
          minY: typeof rawKinematics.minY === "number" ? rawKinematics.minY : 40.0,
          maxY: typeof rawKinematics.maxY === "number" ? rawKinematics.maxY : 85.0,
          speed: typeof rawKinematics.speed === "number" ? rawKinematics.speed : 0.35,
        }
      : {
          baseScale: 0.85,
          scaleRange: 0.3,
          minY: 40.0,
          maxY: 85.0,
          speed: 0.35,
        },
    quest: (raw.quest as unknown as import("../types/world").QuestDefinition) || {
      id: "quest-1",
      title: `${raw.title} Quest`,
      type: "historical_mission",
      objective: `Explore the historical scenes and gather evidence for ${userPrompt}.`,
      learningObjective: `Understand the historical significance of ${userPrompt}.`,
      historicalEra: typeof raw.historicalEra === "string" ? raw.historicalEra : "Historical Period",
      year: typeof raw.year === "number" ? raw.year : 1857,
      location: typeof raw.region === "string" ? raw.region : "India",
      cluesRequired: 1,
      rewardXp: 500,
      stages: [
        {
          stageIndex: 0,
          description: "Explore the area and gather historical clues.",
          targetSceneId: initialSceneId,
          completionCondition: { type: "clue_collect", targetId: "clue-0" },
        },
      ],
    },
    scenes: repairedScenes,
  };

  return validatedWorld;
}
