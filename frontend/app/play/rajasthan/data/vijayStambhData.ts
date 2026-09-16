"use client";

export interface CarvingHotspotDef {
  id: string;
  glyphId: string;
  name: string;
  targetOrder: number; // 1 to 9 in sequential hunt
  renderX: number; // percentage (0 - 100) where glyph is camouflaged in room
  renderY: number; // percentage (0 - 100) where glyph is camouflaged in room
  renderSize: number; // pixel width & height (e.g. 36)
  playerX: number; // target player walking position X
  playerY: number; // target player walking position Y
  radius: number; // interaction radius percentage
  featureName: string; // Architectural feature description
  motifDescription: string;
  clue: string;
  historicalContext: string;
  fictionalLore: string;
}

export const CANONICAL_JOLLY_INTRO =
  "Mere aaka, ancient carved glyphs are hidden in these sandstone walls! Find the target glyph with your eyes, then use Shilpa Drishti.";

export const CANONICAL_JOLLY_ALL_FOUND =
  "Now we have all nine, mere aaka! The stones gave us the pieces. Now assemble the Sculptor's Testament!";

export const CANONICAL_JOLLY_WRONG_HINT =
  "Keep searching the architecture, mere aaka. Match the exact symbol shown on your target card!";

export const TARGET_HUNT_SEQUENCE: string[] = [
  "BHOOMI",
  "JALA",
  "AGNI",
  "VAYU",
  "SUTRA",
  "SANGEET",
  "DHARMA",
  "KUMBHA",
  "AKASHA",
];

export const CANONICAL_SOLUTION_SEQUENCE: string[] = [
  "BHOOMI",
  "JALA",
  "AGNI",
  "VAYU",
  "SUTRA",
  "SANGEET",
  "DHARMA",
  "KUMBHA",
  "AKASHA",
];

export const CARVING_HOTSPOTS: CarvingHotspotDef[] = [
  {
    id: "hotspot_bhoomi",
    glyphId: "BHOOMI",
    name: "Bhoomi (Foundation Bedrock)",
    targetOrder: 1,
    renderX: 52.0,
    renderY: 89.0,
    renderSize: 40,
    playerX: 52.0,
    playerY: 86.0,
    radius: 12.0,
    featureName: "Center Floor Bedrock Flagstone",
    motifDescription: "Deep earth strata and Kurma foundation lines chiseled into the central floor slab.",
    clue: "Before any tower can touch the sky, something must first bear its weight upon the bedrock.",
    historicalContext:
      "Historical Fact: Vijay Stambh is anchored directly into the solid hill bedrock of Chittorgarh Fort, with base moldings honoring Kurma (the cosmic tortoise).",
    fictionalLore:
      "Game Legend: The bedrock glyph represents the steadfast resolve of Chittorgarh's defenders.",
  },
  {
    id: "hotspot_jala",
    glyphId: "JALA",
    name: "Jala (Sacred Waters)",
    targetOrder: 2,
    renderX: 36.5,
    renderY: 73.5,
    renderSize: 36,
    playerX: 36.5,
    playerY: 78.0,
    radius: 11.0,
    featureName: "Lower Central Sandstone Wall Frieze",
    motifDescription: "Flowing wave line carvings and sacred 8-petaled lotus ripples etched into the lower molding.",
    clue: "The foundation stone stands dry until life-giving waters flow across its base.",
    historicalContext:
      "Historical Fact: Vijay Stambh overlooks Gaumukh Kund, the primary spring reservoir that sustained Chittorgarh Fort through historical sieges.",
    fictionalLore:
      "Game Legend: The water glyph honors the sacred waters of Gaumukh Kund that nourished the fort.",
  },
  {
    id: "hotspot_agni",
    glyphId: "AGNI",
    name: "Agni (Sacred Altar Flame)",
    targetOrder: 3,
    renderX: 18.5,
    renderY: 61.5,
    renderSize: 36,
    playerX: 22.0,
    playerY: 74.0,
    radius: 12.0,
    featureName: "Sandstone Wall Beside Left Torch Sconce",
    motifDescription: "Yajna sacrificial fire altar flames chiseled into the wall beside the torch sconce.",
    clue: "When water meets the sacred altar, the fires of Sarangpur ignite in response.",
    historicalContext:
      "Historical Fact: Vijay Stambh commemorates Maharana Kumbha's decisive victory over the combined armies of Malwa and Gujarat at Sarangpur in 1437 AD.",
    fictionalLore:
      "Game Legend: The fire glyph represents the sacrificial fervor and martial courage of Sarangpur.",
  },
  {
    id: "hotspot_vayu",
    glyphId: "VAYU",
    name: "Vayu (Victory Wind & Banner)",
    targetOrder: 4,
    renderX: 70.0,
    renderY: 78.5,
    renderSize: 38,
    playerX: 68.0,
    playerY: 80.0,
    radius: 11.0,
    featureName: "Spiral Staircase Stone Balustrade",
    motifDescription: "Swirling wind chisel lines and fluttering crimson banner motifs along the railing.",
    clue: "From the blazing fire rises the wind, carrying royal banners high above the battlements.",
    historicalContext:
      "Historical Fact: The spiral staircase inside Vijay Stambh has 157 steps leading through illuminated stone balconies.",
    fictionalLore:
      "Game Legend: The wind glyph was chiseled into the staircase banister where the breeze whistles through.",
  },
  {
    id: "hotspot_sutra",
    glyphId: "SUTRA",
    name: "Sutra (Architect's Compass)",
    targetOrder: 5,
    renderX: 15.5,
    renderY: 35.0,
    renderSize: 40,
    playerX: 18.0,
    playerY: 68.0,
    radius: 13.0,
    featureName: "Upper-Left Carved Sandstone Pillar Capital",
    motifDescription: "Chiseled geometric straightedge, plumb-line, and architect's compass mandala.",
    clue: "Wind and flame remain untamed until the architect’s compass brings order to the elements.",
    historicalContext:
      "Historical Fact: Vijay Stambh was designed by Sutradhara Jaita (chief architect) and his sons Napa, Poma, and Puja. Their names are carved into the monument.",
    fictionalLore:
      "Game Legend: Sutradhara Jaita embedded an architectural cipher so the true history of Mewar's artisans would live forever.",
  },
  {
    id: "hotspot_sangeet",
    glyphId: "SANGEET",
    name: "Sangeet (Celestial Music)",
    targetOrder: 6,
    renderX: 9.5,
    renderY: 76.0,
    renderSize: 36,
    playerX: 14.0,
    playerY: 80.0,
    radius: 11.0,
    featureName: "Lower-Left Musician & Dancer Frieze",
    motifDescription: "Sarangi string instrument, cymbals, and musical swara resonance carvings.",
    clue: "Once the architect sets the stone, sweet music rings out to celebrate the peace.",
    historicalContext:
      "Historical Fact: Maharana Kumbha authored *Sangita-Raja*, a celebrated treatise on music and dance. Reliefs portray court musicians.",
    fictionalLore:
      "Game Legend: This glyph commemorates the royal court musicians who celebrated victory through ragas.",
  },
  {
    id: "hotspot_dharma",
    glyphId: "DHARMA",
    name: "Dharma (Divine Preservation)",
    targetOrder: 7,
    renderX: 89.5,
    renderY: 74.0,
    renderSize: 38,
    playerX: 86.0,
    playerY: 78.0,
    radius: 12.0,
    featureName: "Right Wall Relief of Lord Vishnu",
    motifDescription: "Sudarshana Chakra 12-spoked solar wheel and sacred preservation emblem.",
    clue: "Mortal songs fall quiet before the divine preserver who safeguards eternal truth.",
    historicalContext:
      "Historical Fact: Vijay Stambh is dedicated to Lord Vishnu and features extensive iconography of Vishnu's avatars.",
    fictionalLore:
      "Game Legend: The divine glyph guards the eternal order and justice of the realm.",
  },
  {
    id: "hotspot_kumbha",
    glyphId: "KUMBHA",
    name: "Kumbha (Sovereign Royal Crest)",
    targetOrder: 8,
    renderX: 50.0,
    renderY: 52.0,
    renderSize: 42,
    playerX: 50.0,
    playerY: 70.0,
    radius: 12.0,
    featureName: "Central Archway Ornamental Lintel Crest",
    motifDescription: "Royal Rajput crossed talwar swords and victory umbrella (Chhatri) emblem.",
    clue: "Under the watchful eyes of the divine preserver, the victorious ruler claims his mantle.",
    historicalContext:
      "Historical Fact: Maharana Kumbha (ruled 1433–1468 AD) was a great warrior king, scholar, and patron of arts who commissioned Vijay Stambh in 1448 AD.",
    fictionalLore:
      "Game Legend: The royal seal of Maharana Kumbha marks the culmination of Mewar's sovereign lineage.",
  },
  {
    id: "hotspot_akasha",
    glyphId: "AKASHA",
    name: "Akasha (Celestial Sky Vault)",
    targetOrder: 9,
    renderX: 40.5,
    renderY: 19.5,
    renderSize: 42,
    playerX: 40.0,
    playerY: 56.0,
    radius: 14.0,
    featureName: "Upper Ceiling Dome Arch Vault",
    motifDescription: "Celestial 8-pointed star constellation lines crowned above the spiral stairwell.",
    clue: "The sovereign ruler’s testament concludes where stone dissolves into the infinite sky.",
    historicalContext:
      "Historical Fact: The top storey of Vijay Stambh offers panoramic views of Chittorgarh and is crowned with a celestial Kalasha pinnacle.",
    fictionalLore:
      "Game Legend: The final verse of the hidden testament was carved facing the open sky at the apex of the tower.",
  },
];
