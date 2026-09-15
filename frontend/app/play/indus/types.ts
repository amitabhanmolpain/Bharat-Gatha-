export type IndusStage = 1 | 2 | 3 | 4;

export type IndusSceneType =
  // Stage 1: Lower Town & Granary Avenue (c. 2500 BCE)
  | "lower_town_gate"
  | "residential_grid"
  | "house_courtyard"
  | "house_interior"
  | "house_second_floor"
  | "granary_avenue"

  // Stage 2: The Great Bath & Hydraulic Engineering (Mohenjo-daro)
  | "great_bath_citadel"
  | "drainage_culvert"
  | "caravan_road"

  // Stage 3: Artisan Quarter & Steatite Seal Workshop
  | "steatite_seal_workshop"
  | "harappa_residential_street"
  | "carnelian_bead_quarter"

  // Stage 4: The Citadel Sanctuary & The Priest-King
  | "priest_king_citadel"
  | "closing_reflection";

export type IndusJournalCategory =
  | "URBAN_PLANNING"
  | "HYDRAULIC_ENGINEERING"
  | "GLYPTIC_ART_AND_SEALS"
  | "METALLURGY_AND_BRONZE"
  | "COMMERCE_AND_DECLINE";

export interface IndusJournalEntry {
  id: string;
  title: string;
  category: IndusJournalCategory;
  historicalNote: string;
  gameplayContext: string;
  icon: string;
}

export interface IndusRelic {
  id: string;
  name: string;
  stageName: string;
  description: string;
  significance: string;
  icon: string;
}

export interface IndusSaveState {
  stage: IndusStage;
  scene: IndusSceneType;
  playerPos: { x: number; y: number };

  tutorialCompleted: boolean;

  // Stage 1: Lower Town & Granary
  hasMetCityOverseer: boolean;
  hasInspectedBrickRatio: boolean;
  hasFirstRelicChertWeight: boolean;

  // Stage 2: Great Bath
  isDrainagePuzzleSolved: boolean;
  hasInspectedBitumenLining: boolean;
  hasGreatBathPurificationBlessing: boolean;

  // Stage 3: Steatite Seal Workshop
  isSealPuzzleSolved: boolean;
  hasUnicornSeal: boolean;
  hasPashupatiSeal: boolean;

  // Stage 4: Priest-King's Sanctuary
  hasMetPriestKing: boolean;
  hasBronzeDancingGirl: boolean;
  isCampaignComplete: boolean;

  unlockedJournalEntries: string[];
}

export interface IndusSceneMeta {
  title: string;
  era: string;
  subtitle: string;
  backgroundImage: string;
  defaultObjective: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
