import { WorldDefinition, GeometryTemplateId, ExpeditionArchetype } from "../types/expedition";
import { SCENE_TEMPLATES } from "../data/sceneTemplates";
import { WorldDefinition as WorldDefinitionV1, SceneDefinition, SceneArchetype, Position2D, BoundingBox } from "../types/world";

const VALID_TEMPLATES: GeometryTemplateId[] = [
  "palace_courtyard",
  "fort_gate",
  "fort_courtyard",
  "palace_interior",
  "throne_room",
  "corridor",
  "bazaar",
  "garden",
  "village_square",
  "archive",
  "temple_complex",
  "fort_rampart"
];

const VALID_ARCHETYPES: ExpeditionArchetype[] = [
  "INVESTIGATION",
  "HISTORICAL_MYSTERY",
  "EXPLORATION",
  "POLITICAL_INTRIGUE",
  "SURVIVAL",
  "HISTORICAL_MISSION",
  "RECONSTRUCTION",
  "DISCOVERY",
  "ARTIFACT_HUNT"
];

export interface ValidationResult {
  valid: boolean;
  world?: WorldDefinition;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateWorldDefinition(raw: any): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { valid: false, error: "WorldDefinition payload must be a valid JSON object." };
  }

  // 1. Validate Metadata
  if (!raw.metadata || typeof raw.metadata !== "object") {
    return { valid: false, error: "Missing required 'metadata' section." };
  }

  const { id, title, era, location, summary, archetype } = raw.metadata;
  if (!id || typeof id !== "string") return { valid: false, error: "Metadata missing 'id'." };
  if (!title || typeof title !== "string") return { valid: false, error: "Metadata missing 'title'." };
  if (!era || typeof era !== "string") return { valid: false, error: "Metadata missing 'era'." };
  if (!location || typeof location !== "string") return { valid: false, error: "Metadata missing 'location'." };
  if (!summary || typeof summary !== "string") return { valid: false, error: "Metadata missing 'summary'." };

  const validArchetype = VALID_ARCHETYPES.includes(archetype) ? archetype : "INVESTIGATION";

  // 2. Validate Scenes
  if (!Array.isArray(raw.scenes) || raw.scenes.length === 0) {
    return { valid: false, error: "WorldDefinition must contain at least one scene in 'scenes' array." };
  }

  for (let i = 0; i < raw.scenes.length; i++) {
    const s = raw.scenes[i];
    if (!s.id || typeof s.id !== "string") return { valid: false, error: `Scene #${i + 1} missing 'id'.` };
    if (!s.name || typeof s.name !== "string") return { valid: false, error: `Scene '${s.id}' missing 'name'.` };
    if (!s.templateId || !VALID_TEMPLATES.includes(s.templateId)) {
      return { valid: false, error: `Scene '${s.id}' has invalid templateId '${s.templateId}'. Must be one of: ${VALID_TEMPLATES.join(", ")}.` };
    }
  }

  // Ensure every scene has a detailed AI image prompt constructed using VisualBible metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validatedScenes = raw.scenes.map((s: any) => {
    const templateId = (s.templateId as GeometryTemplateId) || "fort_gate";
    const template = SCENE_TEMPLATES[templateId] || SCENE_TEMPLATES["fort_gate"];
    const sName = typeof s.name === "string" ? s.name : templateId;
    const sImagePrompt = typeof s.imagePrompt === "string" ? s.imagePrompt : "";
    const constructedPrompt = sImagePrompt || `Create a historically grounded 2.5D Indian RPG environment of ${sName} in ${raw.metadata.location} during ${raw.metadata.era} (${raw.metadata.year}), ${raw.visualBible?.lightingAtmosphere || "warm sunlit"}, ${raw.visualBible?.architecturalStyle || "Indian Heritage Architecture"}, no modern objects, no cars, no text, no UI, 2.5D side/isometric game perspective`;
    const spawnPoint = s.spawnPoint && typeof s.spawnPoint.x === "number" && typeof s.spawnPoint.y === "number" ? s.spawnPoint : template.defaultSpawn;
    return {
      ...s,
      imagePrompt: constructedPrompt,
      spawnPoint,
      npcs: Array.isArray(s.npcs) ? s.npcs : [],
      objects: Array.isArray(s.objects) ? s.objects : [],
      exits: Array.isArray(s.exits) ? s.exits : [],
      narratorEvents: Array.isArray(s.narratorEvents) ? s.narratorEvents : []
    };
  });

  // 3. Validate Characters / NPCs & Character Prompts
  if (!Array.isArray(raw.characters) || raw.characters.length === 0) {
    return { valid: false, error: "WorldDefinition must contain at least one character in 'characters' array." };
  }

  for (let i = 0; i < raw.characters.length; i++) {
    const c = raw.characters[i];
    if (!c.id || typeof c.id !== "string") return { valid: false, error: `Character #${i + 1} missing 'id'.` };
    if (!c.name || typeof c.name !== "string") return { valid: false, error: `Character '${c.id}' missing 'name'.` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validatedCharacters = raw.characters.map((c: any) => {
    const cName = typeof c.name === "string" ? c.name : "Character";
    const cRole = typeof c.role === "string" ? c.role : "historical figure";
    const cPrompt = typeof c.characterImagePrompt === "string" ? c.characterImagePrompt : "";
    return {
      ...c,
      characterImagePrompt: cPrompt || `Create a 2.5D RPG character sprite of ${cName} (${cRole}) during ${raw.metadata.era} in ${raw.metadata.location}, period authentic clothing, transparent background, game character portrait`
    };
  });

  // 4. Validate Quests
  if (!Array.isArray(raw.quests) || raw.quests.length === 0) {
    return { valid: false, error: "WorldDefinition must contain at least one quest in 'quests' array." };
  }

  for (let i = 0; i < raw.quests.length; i++) {
    const q = raw.quests[i];
    if (!q.id || typeof q.id !== "string") return { valid: false, error: `Quest #${i + 1} missing 'id'.` };
    if (!q.title || typeof q.title !== "string") return { valid: false, error: `Quest '${q.id}' missing 'title'.` };
    if (!Array.isArray(q.objectives) || q.objectives.length === 0) {
      return { valid: false, error: `Quest '${q.id}' must contain at least one objective.` };
    }
  }

  // 5. Validate Evidence
  if (!Array.isArray(raw.evidence)) {
    return { valid: false, error: "WorldDefinition missing 'evidence' array." };
  }

  // 6. Validate Puzzles
  if (!Array.isArray(raw.puzzles)) {
    return { valid: false, error: "WorldDefinition missing 'puzzles' array." };
  }

  const validatedWorld: WorldDefinition = {
    metadata: {
      ...raw.metadata,
      archetype: validArchetype,
      difficulty: raw.metadata.difficulty || "Intermediate",
      estimatedPlaytimeMinutes: raw.metadata.estimatedPlaytimeMinutes || 12,
      createdAt: raw.metadata.createdAt || new Date().toISOString()
    },
    historicalContext: {
      factualBackground: raw.historicalContext?.factualBackground || "Authentic historical records from primary sources.",
      keyFigures: Array.isArray(raw.historicalContext?.keyFigures) ? raw.historicalContext.keyFigures : [],
      primarySourcesReferenced: Array.isArray(raw.historicalContext?.primarySourcesReferenced) ? raw.historicalContext.primarySourcesReferenced : [],
      historicalMythsDebunked: Array.isArray(raw.historicalContext?.historicalMythsDebunked) ? raw.historicalContext.historicalMythsDebunked : []
    },
    visualBible: {
      artStyle: raw.visualBible?.artStyle || "Historical 2.5D Pixel RPG",
      colorPalette: Array.isArray(raw.visualBible?.colorPalette) ? raw.visualBible.colorPalette : ["Sandstone", "Gold", "Obsidian"],
      architecturalStyle: raw.visualBible?.architecturalStyle || "Indian Heritage Architecture",
      lightingAtmosphere: raw.visualBible?.lightingAtmosphere || "Warm Golden Sunlit",
      timeOfDay: raw.visualBible?.timeOfDay || "Midday",
      weather: raw.visualBible?.weather || "Clear"
    },
    narratorOpening: raw.narratorOpening || `Welcome to ${raw.metadata.title}. Step into ${raw.metadata.era} and explore.`,
    scenes: validatedScenes,
    characters: validatedCharacters,
    quests: raw.quests,
    evidence: raw.evidence,
    puzzles: raw.puzzles,
    learningObjectives: Array.isArray(raw.learningObjectives) ? raw.learningObjectives : [],
    expeditionEndingText: raw.expeditionEndingText || `You have completed the expedition for ${raw.metadata.title}! You discovered key evidence and gained deep historical insight.`
  };

  return { valid: true, world: validatedWorld };
}

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

export function parseAndValidateWorld(jsonString: string, userPrompt: string): WorldDefinitionV1 {
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
      historicalPurpose: typeof sc.historicalPurpose === "string" ? sc.historicalPurpose : undefined,
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
            historicalFact: typeof c.historicalFact === "string" ? c.historicalFact : undefined,
            learningObjective: typeof c.learningObjective === "string" ? c.learningObjective : undefined,
            category: typeof c.category === "string" ? c.category : "document",
            position: parsePosition(c.position, { x: 60, y: 65 }),
          }))
        : [],
    };
  }

  const slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const rawKinematics = raw.kinematics as Record<string, unknown> | undefined;

  const rawQuestObj = raw.quest as Record<string, unknown> | undefined;
  const isValidQuest =
    rawQuestObj &&
    typeof rawQuestObj === "object" &&
    Array.isArray(rawQuestObj.stages) &&
    rawQuestObj.stages.length > 0;

  const validatedQuest: import("../types/world").QuestDefinition = isValidQuest
    ? (raw.quest as unknown as import("../types/world").QuestDefinition)
    : {
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
      };

  const validatedWorld: WorldDefinitionV1 = {
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
    quest: validatedQuest,
    scenes: repairedScenes,
  };

  return validatedWorld;
}
