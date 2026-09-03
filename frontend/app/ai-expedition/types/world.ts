export interface Position2D {
  x: number; // Percentage coordinate 0-100
  y: number; // Percentage coordinate 0-100
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SceneExit {
  id: string;
  label: string;
  triggerArea: BoundingBox;
  targetSceneId: string;
  targetSpawnPos: Position2D;
  transitionType?: "walk" | "carriage" | "boat";
  requiredCluesCount?: number;
}

export interface NPCDialogueOption {
  id: string;
  text: string;
  nextDialogueId?: string;
  grantsClueId?: string;
  grantsEvidenceId?: string;
  completesObjectiveId?: string;
}

export interface NPCDialogueNode {
  id: string;
  speakerName: string;
  speakerTitle?: string;
  text: string;
  factType: "verified_fact" | "interpretation" | "folklore" | "gameplay_fiction";
  historicalFact?: string;
  options?: NPCDialogueOption[];
}

export interface NPCDefinition {
  id: string;
  name: string;
  title: string;
  role: string;
  isFictionalArchetype?: boolean;
  position: Position2D;
  spriteUrl: string;
  interactionRadius: number;
  dialogueTree: Record<string, NPCDialogueNode>;
  initialDialogueId: string;
}

export interface HistoricalEvidenceItem {
  id: string;
  title: string;
  historicalFact: string;
  context: string;
  location: string;
  sourceContext?: string;
  learningObjective?: string;
  category?: "people" | "architecture" | "military" | "commerce" | "culture" | "document";
  position?: Position2D;
}

export interface HistoricalReflectionQuestion {
  id: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean; explanation: string }[];
  insightUnlocked: string;
}

export type SceneArchetype =
  | "courtyard"
  | "palace_interior"
  | "throne_hall"
  | "terrace"
  | "bazaar"
  | "fort_approach"
  | "fort_wall"
  | "corridor"
  | "gate"
  | "merchant_warehouse"
  | "port";

export interface SceneDefinition {
  id: string;
  name: string;
  archetype: SceneArchetype;
  historicalPeriod: string;
  locationName: string;
  historicalPurpose?: string;
  backgroundImageUrl: string;
  playerSpawn: Position2D;
  walkableBoundary: BoundingBox;
  collisionObstacles: BoundingBox[];
  exits: SceneExit[];
  npcs: NPCDefinition[];
  clues: Array<{
    id: string;
    name: string;
    description: string;
    position: Position2D;
    discovered?: boolean;
    historicalFact?: string;
    learningObjective?: string;
    category?: string;
  }>;
  evidence?: HistoricalEvidenceItem[];
}

export interface QuestStage {
  stageIndex: number;
  description: string;
  targetSceneId: string;
  completionCondition: {
    type: "npc_talk" | "clue_collect" | "reach_exit" | "evidence_investigate";
    targetId: string;
  };
  learningFocus?: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  type: "investigation" | "exploration" | "diplomacy" | "historical_mission";
  objective: string;
  learningObjective?: string;
  historicalEra: string;
  year: number;
  location: string;
  cluesRequired: number;
  stages: QuestStage[];
  rewardXp: number;
  historicalQuestions?: string[];
  keyInsights?: string[];
  reflectionQuestions?: HistoricalReflectionQuestion[];
}

export interface WorldDefinition {
  worldId: string;
  title: string;
  summary: string;
  historicalEra: string;
  year: number;
  region: string;
  userPrompt: string;
  createdAt: string;
  initialSceneId: string;
  quest: QuestDefinition;
  scenes: Record<string, SceneDefinition>;
  evidenceCatalog?: Record<string, HistoricalEvidenceItem>;
  kinematics: {
    baseScale: number;
    scaleRange: number;
    minY: number;
    maxY: number;
    speed: number;
  };
  provider?: string;
  generationMode?: "ai" | "fallback";
}

export interface SavedGameState {
  worldId: string;
  currentSceneId: string;
  playerPos: Position2D;
  discoveredClueIds: string[];
  discoveredEvidenceIds?: string[];
  currentStageIndex: number;
  isCompleted: boolean;
  reflectionCompleted?: boolean;
  unlockedInsights?: string[];
  updatedAt: string;
}
