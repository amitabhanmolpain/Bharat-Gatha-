import { SceneArchetype } from "../types/world";

export const CORE_STYLE_ANCHOR =
  "16-bit detailed pixel-art historical RPG environment, fixed 3/4 perspective 2.5D, Indian historical architecture, wide 16:9 game-background composition, clear traversable foreground space, strong foreground/midground/background depth, rich coherent palette";

export const NEGATIVE_CONSTRAINTS = [
  "no characters",
  "no people",
  "no text",
  "no labels",
  "no UI elements",
  "no HUD",
  "no modern objects",
  "no modern buildings",
  "no cars",
  "no watermarks",
  "no signatures",
  "no photorealism",
  "no flat 2D illustration",
  "no anime",
];

export const ARCHETYPE_VISUAL_DIRECTIVES: Record<SceneArchetype, string> = {
  gate: "Monumental stone fort entrance archway, wooden reinforced gates, stone paved ramp in foreground, imposing defensive walls and towers in background, strong depth perspective.",
  corridor: "Narrow vaulted stone gallery, carved arched arcade along corridor, patterned sandstone floor tiles, torches along stone pillars, perspective view leading to distant arch.",
  courtyard: "Expansive open palace courtyard plaza, central marble pathway, symmetrical fountains or garden beds, surrounded by royal carved pavilions and balconies.",
  palace_interior: "Intricate royal palace interior hall, carved red sandstone or marble columns, ornamental jali screens, decorative archways, carpets on stone floor.",
  throne_hall: "Grand imperial audience hall, raised carved throne dais at far center, colonnaded side arcades, rich ceremonial carpets leading to throne.",
  terrace: "Elevated stone fort rampart terrace, open stone balustrade overlooking scenic valley landscape, stone chhatris (domed pavilions) on terrace corner.",
  bazaar: "Vaulted stone market arcade street, open arched shopfront alcoves, wooden merchandise counters, hanging textiles, stone paved alley.",
  fort_approach: "Winding stone defensive ramp ascending to fort gate, colossal stone rampart walls towering overhead, rocky terrain at base.",
  fort_wall: "Massive battlement wall stretching across landscape, stone watchtowers, crenellated parapets, vast panoramic horizon below.",
  merchant_warehouse: "Historic timber and brick merchant warehouse district, wooden cargo crates, textile rolls, carved Gujarati lintels, paved riverside quay.",
  port: "Mughal-era riverfront port and customs docklands, wooden masted riverboats moored along stone quay, customs house in background.",
};

export const ARCHETYPE_REFERENCE_IMAGES: Record<SceneArchetype, string> = {
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

export function getArchetypeReferenceImage(archetype: SceneArchetype): string {
  return ARCHETYPE_REFERENCE_IMAGES[archetype] || "/bg-chittorgarh-courtyard.jpg";
}

export const DEFAULT_PALETTES: Record<string, { primaryColor: string; accentColor: string; lightingMood: string; architecturalMotif: string; environmentalAtmosphere: string }> = {
  rajasthan: {
    primaryColor: "golden yellow sandstone",
    accentColor: "terracotta red and royal indigo",
    lightingMood: "warm afternoon golden hour light",
    architecturalMotif: "Mewar fort architecture with carved chhatris and brackets",
    environmentalAtmosphere: "clear desert air with warm sunlight",
  },
  mughal: {
    primaryColor: "red sandstone and white marble",
    accentColor: "emerald green and gold filigree",
    lightingMood: "bright morning sunlight with soft shadows",
    architecturalMotif: "Mughal imperial archways, marble jali screens, and cusped arches",
    environmentalAtmosphere: "majestic riverfront royal palace atmosphere",
  },
  default: {
    primaryColor: "hewn ancient stone",
    accentColor: "weathered bronze and ochre",
    lightingMood: "dramatic natural daylight with soft ambient glow",
    architecturalMotif: "classic Indian historical stone architecture",
    environmentalAtmosphere: "rich historic atmosphere",
  },
};
