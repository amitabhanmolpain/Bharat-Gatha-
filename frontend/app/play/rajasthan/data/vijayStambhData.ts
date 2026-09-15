"use client";

export interface CarvingHotspotDef {
  id: string;
  glyphId: string;
  name: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  radius: number; // interaction radius percentage
  featureName: string; // Architectural feature description
  motifDescription: string;
  clue: string;
  historicalContext: string;
  fictionalLore: string;
}

export const CANONICAL_JOLLY_INTRO =
  "Mere aaka, some secrets are hiding in these stones… use the Shilpa Drishti and see what the eyes cannot.";

export const CANONICAL_JOLLY_ALL_FOUND =
  "Now we have all nine, mere aaka. The stones gave us the pieces. The order is yours to uncover.";

export const CANONICAL_JOLLY_WRONG_HINT =
  "Something feels out of place, mere aaka. Listen to what the earlier stones were saying.";

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
    id: "hotspot_sutra",
    glyphId: "SUTRA",
    name: "Architect's Compass Motif",
    x: 25.0,
    y: 62.0,
    radius: 10.0,
    featureName: "Upper-Left Carved Sandstone Pillar",
    motifDescription: "Chiseled geometric straightedge, plumb-line, and architect's compass motif.",
    clue: "Wind and flame remain untamed until the architect’s compass brings order to the elements.",
    historicalContext:
      "Historical Fact: Vijay Stambh was designed by Sutradhara Jaita (chief architect) and his sons Napa, Poma, and Puja. Their names are carved into stone on the monument.",
    fictionalLore:
      "Game Legend: In Bharat Gatha's tale, Sutradhara Jaita embedded a central architectural cipher to ensure the true history of Mewar's artisans would never be forgotten.",
  },
  {
    id: "hotspot_akasha",
    glyphId: "AKASHA",
    name: "Celestial Vault Motif",
    x: 50.0,
    y: 56.0,
    radius: 10.0,
    featureName: "Central Ceiling Arch Vault",
    motifDescription: "Faint star constellation chisel lines surrounding a carved Kalasha pinnacle.",
    clue: "The sovereign ruler’s testament concludes where stone dissolves into the infinite sky.",
    historicalContext:
      "Historical Fact: The top storey of Vijay Stambh offers panoramic views of Chittorgarh and is crowned with a celestial Kalasha pinnacle.",
    fictionalLore:
      "Game Legend: The final verse of the hidden testament was carved facing the open sky at the apex of the tower.",
  },
  {
    id: "hotspot_jala",
    glyphId: "JALA",
    name: "Sacred Water Motif",
    x: 40.0,
    y: 70.0,
    radius: 10.0,
    featureName: "Lower Central Sandstone Wall Frieze",
    motifDescription: "Flowing wave line carvings and lotus petals etched into the lower molding.",
    clue: "The foundation stone stands dry until life-giving waters flow across its base.",
    historicalContext:
      "Historical Fact: Vijay Stambh overlooks Gaumukh Kund, the primary natural spring reservoir that sustained Chittorgarh Fort through historical sieges.",
    fictionalLore:
      "Game Legend: The second glyph honors the sacred waters of Gaumukh Kund that fed the fort's defenders.",
  },
  {
    id: "hotspot_kumbha",
    glyphId: "KUMBHA",
    name: "Sovereign Royal Crest",
    x: 75.0,
    y: 62.0,
    radius: 10.0,
    featureName: "Upper-Right Statue Niche & Royal Emblem",
    motifDescription: "Royal Rajput sword relief and victory umbrella (Chhatri) emblem.",
    clue: "Under the watchful eyes of the divine preserver, the victorious ruler claims his mantle.",
    historicalContext:
      "Historical Fact: Maharana Kumbha (ruled 1433–1468 AD) was a great warrior king, scholar, and patron of arts who commissioned Vijay Stambh in 1448 AD.",
    fictionalLore:
      "Game Legend: The royal seal of Maharana Kumbha marks the culmination of Mewar's sovereign lineage.",
  },
  {
    id: "hotspot_bhoomi",
    glyphId: "BHOOMI",
    name: "Foundation Bedrock Motif",
    x: 50.0,
    y: 84.0,
    radius: 10.0,
    featureName: "Center Floor Bedrock Paving Stone",
    motifDescription: "Deep earth roots and Kurma (tortoise) foundation lines chiseled into floor flagstone.",
    clue: "Before any tower can touch the sky, something must first bear its weight upon the bedrock.",
    historicalContext:
      "Historical Fact: Vijay Stambh is anchored directly into the solid rock hill of Chittorgarh Fort, with heavy base moldings carved with Kurma motifs.",
    fictionalLore:
      "Game Legend: The bedrock glyph represents the steadfast resolve of the people of Chittorgarh.",
  },
  {
    id: "hotspot_vayu",
    glyphId: "VAYU",
    name: "Victory Banner Motif",
    x: 65.0,
    y: 72.0,
    radius: 10.0,
    featureName: "Spiral Staircase Stone Balustrade",
    motifDescription: "Swirling wind chisel lines and fluttering crimson banner motifs along the railing.",
    clue: "From the blazing fire rises the wind, carrying royal banners high above the battlements.",
    historicalContext:
      "Historical Fact: The spiral staircase inside Vijay Stambh has 157 steps leading through illuminated stone balconies.",
    fictionalLore:
      "Game Legend: The wind glyph was chiseled into the staircase banister where the breeze from the balconies whistles through.",
  },
  {
    id: "hotspot_sangeet",
    glyphId: "SANGEET",
    name: "Celestial Music Motif",
    x: 18.0,
    y: 74.0,
    radius: 10.0,
    featureName: "Lower-Left Musical Frieze Relief",
    motifDescription: "Sarangi string instrument, cymbals, and musical note carvings.",
    clue: "Once the architect sets the stone, sweet music rings out to celebrate the peace.",
    historicalContext:
      "Historical Fact: Maharana Kumbha authored *Sangita-Raja*, a celebrated treatise on music and dance. Floor reliefs portray court musicians.",
    fictionalLore:
      "Game Legend: This glyph commemorates the royal court musicians who celebrated victory through ragas.",
  },
  {
    id: "hotspot_agni",
    glyphId: "AGNI",
    name: "Sacred Altar Flame Motif",
    x: 32.0,
    y: 78.0,
    radius: 10.0,
    featureName: "Sandstone Wall Adjacent to Left Torch",
    motifDescription: "Yajna sacrificial fire altar flames chiseled into the wall beside the torch sconce.",
    clue: "When water meets the sacred altar, the fires of Sarangpur ignite in response.",
    historicalContext:
      "Historical Fact: Vijay Stambh commemorates Maharana Kumbha's decisive victory over the combined armies of Malwa and Gujarat at Sarangpur in 1437 AD.",
    fictionalLore:
      "Game Legend: The fire glyph represents the sacrificial fervor and martial courage of Sarangpur.",
  },
  {
    id: "hotspot_dharma",
    glyphId: "DHARMA",
    name: "Divine Preservation Motif",
    x: 82.0,
    y: 76.0,
    radius: 10.0,
    featureName: "Right Wall Relief of Lord Vishnu",
    motifDescription: "Sudarshana Chakra and sacred lotus preserver emblem.",
    clue: "Mortal songs fall quiet before the divine preserver who safeguards eternal truth.",
    historicalContext:
      "Historical Fact: Vijay Stambh is dedicated to Lord Vishnu (also known as Vishnu Stambh) and features extensive iconography of Vishnu's avatars.",
    fictionalLore:
      "Game Legend: The divine glyph guards the eternal order and justice of the realm.",
  },
];
