import { WorldDefinition, GeometryTemplateId, ExpeditionArchetype } from "../types/expedition";
import { SCENE_TEMPLATES } from "../data/sceneTemplates";

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
