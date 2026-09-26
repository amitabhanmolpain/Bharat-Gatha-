import {
  VijayanagaraSaveState,
  VijayanagaraSceneType,
  VijayanagaraStage,
  SceneMeta,
  JournalEntry,
  LedgerFragment,
} from "./types";

export const VIJAYANAGARA_STORAGE_KEY = "vijayanagara_save_v1";

export const INITIAL_VIJAYANAGARA_STATE: VijayanagaraSaveState = {
  stage: 1,
  scene: "anegundi_river_crossing",
  playerPos: { x: 50.0, y: 82.0 },

  tutorialCompleted: false,

  // Stage 1: Anegundi
  hasMetVidyaranya: false,
  chowkaBaraAttempts: 0,
  isChowkaBaraComplete: false,
  hasVidyaranyaBlessing: false,

  // Stage 2: Hampi Bazaar
  hasFirstLedgerFragment: false,
  inspectedToys: [],
  hasJournalToy: false,
  talkedToForeignTraveler: false,

  // Stage 3: Vittala Temple
  hasSecondLedgerFragment: false,
  isMusicalPillarsComplete: false,
  hasHazaraRamaDiscovery: false,
  hasMusicianWarning: false,

  // Stage 4: Mahanavami Dibba
  isFestivalSceneRestored: false,
  hasFinalLedgerFragment: false,
  isLedgerAssembled: false,
  hasTalikotaNarrationViewed: false,

  // End Game
  isJournalFullyUnlocked: false,
  hasFinalKeepsake: false,
  isCampaignComplete: false,
  unlockedJournalEntries: ["anegundi_origin", "vidyaranya_sage"],
};

export const STAGE_METAS: Record<VijayanagaraStage, { title: string; subtitle: string; era: string }> = {
  1: {
    title: "Anegundi — Where It All Began",
    subtitle: "The cradle of an empire across the rocky Tungabhadra",
    era: "1336 AD",
  },
  2: {
    title: "Hampi Bazaar — The Missing Merchant's Ledger",
    subtitle: "Grand marketplace of rubies, silks, and mysterious records",
    era: "c. 1520 AD",
  },
  3: {
    title: "Vittala Temple — The Golden Age",
    subtitle: "Stone chariots, musical mandapas, and royal resonance",
    era: "c. 1540 AD",
  },
  4: {
    title: "Mahanavami Dibba — The Fall",
    subtitle: "Imperial ceremonies, the turning of fortunes, and eternal memory",
    era: "1565 AD",
  },
};

export const SCENE_CONFIGS: Record<VijayanagaraSceneType, SceneMeta> = {
  // Stage 1: Anegundi (1336 AD)
  anegundi_river_crossing: {
    title: "Tungabhadra River Crossing",
    era: "1336 AD",
    subtitle: "The northern bank where coracles cross into history",
    backgroundImage: "/bg-vijayanagara-anegundi-river.jpg",
    defaultObjective: "Explore the riverbank and speak with the wise elder across the water.",
    minX: 18.0,
    maxX: 82.0,
    minY: 54.0,
    maxY: 88.0,
  },
  anegundi_old_fort: {
    title: "Anegundi Old Fort Ruins",
    era: "1336 AD",
    subtitle: "Granite bastions guarding the northern gateway and sacred mandapa",
    backgroundImage: "/bg-vijayanagara-anegundi-fort.jpg",
    defaultObjective: "Approach Sage Vidyaranya seated peacefully near the carved stone pavilion.",
    minX: 20.0,
    maxX: 80.0,
    minY: 56.0,
    maxY: 88.0,
  },
  anegundi_chowka_bara: {
    title: "Vidyaranya's Stone Mandapa",
    era: "1336 AD",
    subtitle: "A secluded pavilion engraved with ancient strategy board grids",
    backgroundImage: "/bg-vijayanagara-anegundi-fort.jpg",
    defaultObjective: "Engage in the Chowka Bara match to earn the sage's blessing.",
    minX: 22.0,
    maxX: 78.0,
    minY: 56.0,
    maxY: 86.0,
  },

  // Stage 2: Hampi Bazaar (c. 1520 AD)
  hampi_bazaar_entry: {
    title: "Virupaksha Car Street Entrance",
    era: "c. 1520 AD",
    subtitle: "The vibrant half-mile covered colonnade of global merchants",
    backgroundImage: "/bg-vijayanagara-hampi-bazaar-clean.jpg",
    defaultObjective: "Explore the bustling bazaar and seek rumors of the missing merchant.",
    minX: 10.0,
    maxX: 90.0,
    minY: 36.0,
    maxY: 92.0,
  },
  gem_traders_row: {
    title: "Gem Traders' Row",
    era: "c. 1520 AD",
    subtitle: "Where rubies, diamonds, and pearls were measured in heaping bowls",
    backgroundImage: "/bg-vijayanagara-gem-row.jpg",
    defaultObjective: "Inquire with the master gem assessor about the missing merchant's ledger.",
    minX: 20.0,
    maxX: 80.0,
    minY: 56.0,
    maxY: 88.0,
  },
  toymaker_stall: {
    title: "Kinhal Artisan Toymaker Stall",
    era: "c. 1520 AD",
    subtitle: "Hand-lacquered wooden toys and historical craft figurines",
    backgroundImage: "/bg-vijayanagara-toymaker-clean.jpg",
    defaultObjective: "Inspect Master Kallappa's wooden toys for secret compartments and markings.",
    minX: 10.0,
    maxX: 90.0,
    minY: 82.0,
    maxY: 98.0,
  },
  foreign_traveler_corner: {
    title: "Travelers' Chhappar Pavilion",
    era: "c. 1520 AD",
    subtitle: "Where Portuguese and overseas chroniclers recorded the empire's glory",
    backgroundImage: "/bg-vijayanagara-hampi-bazaar-clean.jpg",
    defaultObjective: "Listen to the Portuguese visitor's impressions of Hampi's wealth.",
    minX: 20.0,
    maxX: 80.0,
    minY: 56.0,
    maxY: 88.0,
  },

  // Stage 3: Vittala Temple (c. 1540 AD)
  stone_chariot_entry: {
    title: "Vittala Temple Stone Chariot",
    era: "c. 1540 AD",
    subtitle: "The monolithic Garuda Shrine Stone Chariot with carved granite wheels",
    backgroundImage: "/bg-vijayanagara-vittala-chariot-clean.jpg",
    defaultObjective: "Approach the iconic Stone Chariot and speak with the royal temple guide.",
    minX: 10.0,
    maxX: 90.0,
    minY: 78.0,
    maxY: 98.0,
  },
  musical_pillars: {
    title: "Ranga Mandapa — Musical Pillars",
    era: "c. 1540 AD",
    subtitle: "56 monolithic acoustic granite pillars producing classical swaras",
    backgroundImage: "/bg-vijayanagara-musical-pillars.jpg",
    defaultObjective: "Resonate the musical pillar sequences to unseal the second ledger fragment.",
    minX: 20.0,
    maxX: 80.0,
    minY: 54.0,
    maxY: 88.0,
  },
  hazara_rama_walls: {
    title: "Hazara Rama Narrative Bas-Reliefs",
    era: "c. 1540 AD",
    subtitle: "Continuous stone wall friezes depicting royal processions and the Ramayana",
    backgroundImage: "/bg-vijayanagara-hazara-rama-clean.jpg",
    defaultObjective: "Inspect the carved stone friezes of elephants, dancers, and epic chronicles.",
    minX: 10.0,
    maxX: 90.0,
    minY: 76.0,
    maxY: 98.0,
  },
  musicians_warning: {
    title: "Temple Sanctuary Arcade",
    era: "c. 1540 AD",
    subtitle: "A secluded gallery echoing with sacred veena melodies and solemn warnings",
    backgroundImage: "/bg-vijayanagara-musical-pillars.jpg",
    defaultObjective: "Listen to the temple musician's warning regarding the final ledger fragment.",
    minX: 22.0,
    maxX: 78.0,
    minY: 56.0,
    maxY: 86.0,
  },

  // Stage 4: Mahanavami Dibba (1565 AD)
  mahanavami_celebration: {
    title: "Mahanavami Platform Complex",
    era: "1565 AD",
    subtitle: "The multi-tiered stone dais where emperors hosted grand Navaratri festivals",
    backgroundImage: "/bg-vijayanagara-mahanavami-festival.jpg",
    defaultObjective: "Ascend the stepped stone plinth and observe the festival layout.",
    minX: 10.0,
    maxX: 90.0,
    minY: 60.0,
    maxY: 100.0,
  },
  final_ledger_fragment: {
    title: "Royal Tier Stone Niche",
    era: "1565 AD",
    subtitle: "A protected carved recess in the upper ceremonial tier",
    backgroundImage: "/bg-vijayanagara-mahanavami-ruins.jpg",
    defaultObjective: "Retrieve the final ledger fragment to assemble the merchant's master record.",
    minX: 22.0,
    maxX: 78.0,
    minY: 56.0,
    maxY: 86.0,
  },
  talikota_narration: {
    title: "The Battle of Talikota Chronicle",
    era: "1565 AD",
    subtitle: "A solemn historical chronicle of the great turning point in southern history",
    backgroundImage: "/bg-vijayanagara-mahanavami-ruins.jpg",
    defaultObjective: "Bear witness to the poignant historical events that reshaped the realm.",
    minX: 20.0,
    maxX: 80.0,
    minY: 56.0,
    maxY: 88.0,
  },
  closing_reflection: {
    title: "Pushkarani Stepped Tank — Sunset Reflection",
    era: "Eternal",
    subtitle: "Stone remains, memory endures, and cultural heritage lives forever",
    backgroundImage: "/bg-vijayanagara-pushkarani.jpg",
    defaultObjective: "Reflect upon the enduring spirit of Vijayanagara and conclude the campaign.",
    minX: 20.0,
    maxX: 80.0,
    minY: 56.0,
    maxY: 88.0,
  },
};

export const JOURNAL_DATABASE: JournalEntry[] = [
  // Category 1: FOUNDING
  {
    id: "anegundi_origin",
    title: "The Anegundi Cradle (1336 AD)",
    category: "FOUNDING",
    historicalNote:
      "Before the grand city of Vijayanagara arose on the south bank of the Tungabhadra, the early rulers Harihara I and Bukka Raya I established their fortified base at Anegundi amidst the rugged granite hills.",
    gameplayContext: "Discovered upon stepping onto the ancient northern river crossing.",
    icon: "river",
  },
  {
    id: "vidyaranya_sage",
    title: "Sage Vidyaranya & Sringeri Guidance",
    category: "FOUNDING",
    historicalNote:
      "Tradition attributes the spiritual and geopolitical foundation of the empire to the sage Vidyaranya of the Sringeri Sharada Peetham, who envisioned a prosperous kingdom capable of protecting and revitalizing southern Indian arts and civilization.",
    gameplayContext: "Recorded from the stone inscription at the Anegundi mandapa.",
    icon: "sage",
  },
  {
    id: "harihara_bukka_founding",
    title: "Harihara I & Bukka Raya I",
    category: "FOUNDING",
    historicalNote:
      "Brothers and commanders of the Sangama dynasty, Harihara I and Bukka Raya I unified the southern plateau in 1336 AD, transforming small defensive outposts into a resilient empire.",
    gameplayContext: "Discovered during discussion with Sage Vidyaranya at Anegundi.",
    icon: "crown",
  },
  {
    id: "chowka_bara_game",
    title: "Chowka Bara — Traditional Board Strategy",
    category: "FOUNDING",
    historicalNote:
      "One of the oldest known strategic race games of Karnataka, played on a 5x5 cloth or stone-etched grid using cowrie shells (Kavade). Used by military tacticians to teach spatial foresight.",
    gameplayContext: "Unlocked by completing the Chowka Bara match with Sage Vidyaranya.",
    icon: "dice",
  },
  {
    id: "tungabhadra_defenses",
    title: "Tungabhadra Granite Fortifications",
    category: "FOUNDING",
    historicalNote:
      "The rapid river, jagged granite boulders, and natural moat formed an impenetrable defensive barrier that shielded the nascent empire during its early consolidation.",
    gameplayContext: "Noted while observing the ancient stone bastion architecture.",
    icon: "shield",
  },

  // Category 2: CITY AND TRADE
  {
    id: "hampi_bazaar_trade",
    title: "The Hampi Bazaar & Global Commerce",
    category: "CITY_AND_TRADE",
    historicalNote:
      "At its peak in the early 16th century, Hampi Bazaar stretched for nearly a kilometer in front of Virupaksha Temple. Portuguese chronicler Domingo Paes called Vijayanagara 'the best provided city in the world'.",
    gameplayContext: "Recorded upon entering the bustling covered merchant colonnade.",
    icon: "hub",
  },
  {
    id: "gem_markets",
    title: "Ruby & Diamond Trade of Vijayanagara",
    category: "CITY_AND_TRADE",
    historicalNote:
      "Foreign visitors marvelled that diamonds from the Kollur mines, Ceylon rubies, and Gulf pearls were sold openly by dry measure on streets lined with stone arcades.",
    gameplayContext: "Discovered in the gem assessor's quarter.",
    icon: "gem",
  },
  {
    id: "kinhal_toys",
    title: "Kinhal Craft & Lacquered Woodcraft",
    category: "CITY_AND_TRADE",
    historicalNote:
      "The master artisans of Kinhal and surrounding towns received royal patronage to create vibrant wooden toys, temple chariots, and ornate painted screens using natural mineral dyes.",
    gameplayContext: "Unlocked by inspecting the handcrafted toy stall.",
    icon: "artisan",
  },
  {
    id: "foreign_chronicles_paes",
    title: "Overseas Chronicles & European Visitors",
    category: "CITY_AND_TRADE",
    historicalNote:
      "Visitors from Portugal, Venice, and Persia documented Vijayanagara's cosmopolitan splendor. Travelers recorded seeing citizens adorned with gems and vast bazaars trading Arabian horses.",
    gameplayContext: "Discovered by conversing with the Overseas Traveler at the Chhappar Pavilion.",
    icon: "ledger",
  },

  // Category 3: GOLDEN AGE
  {
    id: "krishnadevaraya_era",
    title: "Emperor Krishnadevaraya (1509–1529 AD)",
    category: "GOLDEN_AGE",
    historicalNote:
      "A scholar, warrior, and patron of literature, Krishnadevaraya's reign marked the cultural zenith of Vijayanagara, composing the Telugu epic poem Amuktamalyada.",
    gameplayContext: "Inscribed upon the royal Vittala Temple inscription stone.",
    icon: "crown",
  },
  {
    id: "stone_chariot_garuda",
    title: "The Monolithic Stone Chariot",
    category: "GOLDEN_AGE",
    historicalNote:
      "Built as a dedicated shrine to Garuda within the Vittala complex, this architectural masterpiece was carved from individual granite blocks so seamlessly that it appears sculpted from a single colossal stone.",
    gameplayContext: "Discovered near the entrance courtyard of Vittala Temple.",
    icon: "wheel",
  },
  {
    id: "musical_pillars_acoustics",
    title: "The 56 Sa-Re-Ga-Ma Musical Pillars",
    category: "GOLDEN_AGE",
    historicalNote:
      "The pillars of the Ranga Mandapa are crafted from resonance-rich resonant granite. Tapping the slender clustered pillars produces distinct musical swaras (notes) and percussion rhythms.",
    gameplayContext: "Unlocked during the acoustic harmony calibration.",
    icon: "music",
  },
  {
    id: "hazara_rama_friezes",
    title: "Hazara Rama Narrative Bas-Reliefs",
    category: "GOLDEN_AGE",
    historicalNote:
      "Serving as the private temple of the Vijayanagara kings, its outer enclosure walls present continuous stone narrative bas-reliefs illustrating royal cavalry, dancing troops, and the entire Ramayana.",
    gameplayContext: "Discovered by inspecting the carved stone friezes.",
    icon: "archery",
  },

  // Category 4: MEMORY AND FALL
  {
    id: "mahanavami_dibba_platform",
    title: "The Multi-Tiered Mahanavami Dibba",
    category: "MEMORY_AND_FALL",
    historicalNote:
      "Standing 8 meters high with intricate stone reliefs of royal hunts, foreign envoys, and dancers, this platform was the epicenter of the 9-day grand Navaratri festival.",
    gameplayContext: "Recorded at the base of the imperial celebration dais.",
    icon: "tent",
  },
  {
    id: "battle_of_talikota",
    title: "The Battle of Talikota (1565 AD)",
    category: "MEMORY_AND_FALL",
    historicalNote:
      "In January 1565, the combined armies of the Deccan Sultanates defeated the Vijayanagara forces at Talikota (Rakshasi-Tangadi), leading to the abandonment of the imperial capital.",
    gameplayContext: "Witnessed during the historical narration sequence.",
    icon: "swords",
  },
  {
    id: "living_heritage_endures",
    title: "Living Memory & Surviving Culture",
    category: "MEMORY_AND_FALL",
    historicalNote:
      "Though the stone halls were deserted, the music, dance, textile crafts, architectural traditions, and community memories of Vijayanagara live on across South India to this day.",
    gameplayContext: "Reflected upon during the final sunset sequence.",
    icon: "sunset",
  },

  // Category 5: MYSTERY (The Missing Merchant's Ledger)
  {
    id: "ledger_fragment_1",
    title: "Ledger Fragment I — The Scribe's Seal",
    category: "MYSTERY",
    historicalNote:
      "A torn palm-leaf parchment bearing the official wax crest of the Chief Guild Merchant (Pattanaswami), recording an emergency diversion of state granaries.",
    gameplayContext: "Discovered within the hidden corner of Hampi Bazaar.",
    icon: "ledger",
  },
  {
    id: "ledger_fragment_2",
    title: "Ledger Fragment II — The Acoustic Hollow",
    category: "MYSTERY",
    historicalNote:
      "Recovered from the resonant chamber behind the central musical pillar, confirming that precious manuscripts and artisan trade secrets were quietly relocated southwards.",
    gameplayContext: "Found following the musical pillars harmony resonance.",
    icon: "music",
  },
  {
    id: "ledger_fragment_3",
    title: "Ledger Fragment III — The Royal Secret Order",
    category: "MYSTERY",
    historicalNote:
      "The final missing page bearing the seal of the royal treasury: the missing merchant was acting under secret imperial decree to safeguard knowledge, heritage, and guild records before the fateful siege.",
    gameplayContext: "Unveiled from the underground Pushkarani vault.",
    icon: "key",
  },
];

export const LEDGER_FRAGMENTS: LedgerFragment[] = [
  {
    id: "frag_1",
    title: "Guildmaster's Seal of Hampi Bazaar",
    stageName: "Stage 2: Hampi Bazaar",
    clueText: "Emergency accounts documenting the quiet movement of royal reserves away from border granaries.",
    significance: "First evidence that the merchant did not flee in greed, but was executing an organized directive.",
    sealIcon: "ledger",
  },
  {
    id: "frag_2",
    title: "Acoustic Chamber Manifest of Vittala",
    stageName: "Stage 3: Vittala Temple",
    clueText: "Guild records documenting the preservation of master architectural blueprints and artisan lineage books.",
    significance: "Proves that the cultural knowledge and craftsmanship secrets were prioritized for preservation.",
    sealIcon: "music",
  },
  {
    id: "frag_3",
    title: "Imperial Decree of Mahanavami Dibba",
    stageName: "Stage 4: Mahanavami Dibba",
    clueText: "The final seal confirming that the wealth was moved to protect the people, artisans, and historical archives.",
    significance: "Solves the mystery: Empires may fall, but their knowledge, memory, and heritage survive forever.",
    sealIcon: "crown",
  },
];

export const VIJAYANAGARA_THEME = {
  graniteDark: "#1a1816",
  graniteMedium: "#2b2825",
  graniteBorder: "#4a443d",
  stoneParchment: "#f6ede0",
  terracotta: "#c86446",
  templeGold: "#d4a359",
  templeBronze: "#966f33",
  tungabhadraBlue: "#1b4d52",
  turmericYellow: "#eab308",
  deepIndigo: "#1e293b",
};
