export type VijayanagaraStage = 1 | 2 | 3 | 4;

export type VijayanagaraSceneType =
  // Stage 1: Anegundi — "Where It All Began" (1336 AD)
  | "anegundi_river_crossing"
  | "anegundi_old_fort"
  | "anegundi_chowka_bara"

  // Stage 2: Hampi Bazaar — "The Missing Merchant's Ledger"
  | "hampi_bazaar_entry"
  | "gem_traders_row"
  | "toymaker_stall"
  | "foreign_traveler_corner"

  // Stage 3: Vittala Temple — "The Golden Age"
  | "stone_chariot_entry"
  | "musical_pillars"
  | "hazara_rama_walls"
  | "musicians_warning"

  // Stage 4: Mahanavami Dibba — "The Fall" (1565 AD)
  | "mahanavami_celebration"
  | "final_ledger_fragment"
  | "talikota_narration"
  | "closing_reflection";

export type JournalCategory =
  | "FOUNDING"
  | "CITY_AND_TRADE"
  | "GOLDEN_AGE"
  | "MEMORY_AND_FALL"
  | "MYSTERY";

export interface JournalEntry {
  id: string;
  title: string;
  category: JournalCategory;
  historicalNote: string;
  gameplayContext: string;
  icon: string;
}

export interface LedgerFragment {
  id: string;
  title: string;
  stageName: string;
  clueText: string;
  significance: string;
  sealIcon: string;
}

export interface VijayanagaraSaveState {
  stage: VijayanagaraStage;
  scene: VijayanagaraSceneType;
  playerPos: { x: number; y: number };

  tutorialCompleted: boolean;

  // Stage 1: Anegundi
  hasMetVidyaranya: boolean;
  chowkaBaraAttempts: number;
  isChowkaBaraComplete: boolean;
  hasVidyaranyaBlessing: boolean;

  // Stage 2: Hampi Bazaar
  hasEncounteredFirstRumor?: boolean;
  hasFirstLedgerFragment: boolean;
  inspectedToys: string[];
  hasJournalToy: boolean;
  talkedToForeignTraveler: boolean;

  // Stage 3: Vittala Temple
  hasSecondLedgerFragment: boolean;
  isMusicalPillarsComplete: boolean;
  hasHazaraRamaDiscovery: boolean;
  hasMusicianWarning: boolean;

  // Stage 4: Mahanavami Dibba
  isFestivalSceneRestored: boolean;
  hasFinalLedgerFragment: boolean;
  isLedgerAssembled: boolean;
  hasTalikotaNarrationViewed: boolean;

  // End Game
  isJournalFullyUnlocked: boolean;
  hasFinalKeepsake: boolean;
  isCampaignComplete: boolean;
  unlockedJournalEntries: string[];
}

export interface SceneMeta {
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
