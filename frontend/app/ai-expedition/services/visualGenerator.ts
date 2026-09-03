import { WorldDefinition, SceneDefinition } from "../types/world";
import { SceneVisualDefinition } from "../types/visual";
import { CORE_STYLE_ANCHOR, ARCHETYPE_VISUAL_DIRECTIVES, DEFAULT_PALETTES, NEGATIVE_CONSTRAINTS } from "./referenceStyle";

export function generateSceneVisualDefinition(
  world: WorldDefinition,
  scene: SceneDefinition
): SceneVisualDefinition {
  const regionLower = world.region.toLowerCase();
  const paletteTemplate = regionLower.includes("rajasthan") || regionLower.includes("mewar")
    ? DEFAULT_PALETTES.rajasthan
    : regionLower.includes("agra") || regionLower.includes("delhi") || regionLower.includes("mughal")
    ? DEFAULT_PALETTES.mughal
    : DEFAULT_PALETTES.default;

  return {
    sceneId: scene.id,
    archetype: scene.archetype,
    historicalPeriod: scene.historicalPeriod || world.historicalEra,
    region: world.region,
    architectureStyle: paletteTemplate.architecturalMotif,
    materials: [paletteTemplate.primaryColor, "hewn stone", "carved marble"],
    lighting: {
      timeOfDay: "afternoon",
      lightSource: "natural sunlight",
      atmosphere: paletteTemplate.lightingMood,
    },
    palette: paletteTemplate,
    composition: {
      viewpoint: "fixed 3/4 perspective 2.5D view",
      foreground: "open clear traversable stone pathway",
      midground: scene.name,
      background: "architectural landmarks and skyline",
      landmark: scene.locationName || scene.name,
    },
    styleDirectives: {
      pixelArtStyle: CORE_STYLE_ANCHOR,
      renderingQuality: "high-detail 16-bit architectural game background",
      negativeConstraints: NEGATIVE_CONSTRAINTS,
    },
    isCached: false,
  };
}

export function buildVisualPrompt(
  world: WorldDefinition,
  scene: SceneDefinition,
  visualDef?: SceneVisualDefinition
): string {
  const vDef = visualDef || generateSceneVisualDefinition(world, scene);
  const archetypeDirective = ARCHETYPE_VISUAL_DIRECTIVES[scene.archetype] || ARCHETYPE_VISUAL_DIRECTIVES.courtyard;

  const promptParts = [
    CORE_STYLE_ANCHOR,
    `Historical Setting: ${vDef.historicalPeriod}, ${vDef.region}.`,
    `Location: ${vDef.composition.landmark} (${scene.name}).`,
    `Architecture & Palette: ${vDef.architectureStyle}, constructed with ${vDef.materials.join(", ")}, accents of ${vDef.palette.accentColor}.`,
    `Atmosphere & Lighting: ${vDef.lighting.atmosphere}, ${vDef.lighting.lightSource}.`,
    `Composition: ${archetypeDirective}`,
    `Foreground Traversal: ${vDef.composition.foreground}.`,
    `Negative Constraints: Do NOT include ${NEGATIVE_CONSTRAINTS.join(", ")}.`,
  ];

  return promptParts.join(" ");
}
