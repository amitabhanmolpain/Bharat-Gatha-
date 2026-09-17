export type ExpeditionArchetype = 
  | "INVESTIGATION"
  | "HISTORICAL_MYSTERY"
  | "EXPLORATION"
  | "POLITICAL_INTRIGUE"
  | "SURVIVAL"
  | "HISTORICAL_MISSION"
  | "RECONSTRUCTION"
  | "DISCOVERY"
  | "ARTIFACT_HUNT";

export type GeometryTemplateId =
  | "palace_courtyard"
  | "fort_gate"
  | "fort_courtyard"
  | "palace_interior"
  | "throne_room"
  | "corridor"
  | "bazaar"
  | "garden"
  | "village_square"
  | "archive"
  | "temple_complex"
  | "fort_rampart";

export interface WorldMetadata {
  id: string;
  title: string;
  era: string;
  year: string;
  location: string;
  summary: string;
  archetype: ExpeditionArchetype;
  difficulty: "Beginner" | "Intermediate" | "Scholar";
  estimatedPlaytimeMinutes: number;
  createdAt: string;
  isFallback?: boolean;
  fallbackReason?: string;
}

export type ExpeditionMetadata = WorldMetadata;

export interface HistoricalContext {
  factualBackground: string;
  keyFigures: string[];
  primarySourcesReferenced: string[];
  historicalMythsDebunked: string[];
}

export interface VisualBible {
  artStyle: string;
  colorPalette: string[];
  architecturalStyle: string;
  lightingAtmosphere: string;
  timeOfDay: string;
  weather: string;
}

export interface SceneNPCPlacement {
  npcId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface SceneObjectPlacement {
  id: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  interactionText: string;
  clueId?: string;
}

export interface SceneExit {
  id: string;
  targetSceneId: string;
  label: string;
  triggerArea: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  targetSpawn?: { x: number; y: number };
  requiredObjectiveId?: string;
  keyRequired?: string;
}

export interface NarratorEvent {
  id: string;
  triggerType: "SCENE_ENTER" | "EVIDENCE_DISCOVERED" | "QUEST_COMPLETE" | "PUZZLE_SOLVED";
  triggerTargetId?: string;
  text: string;
  tone?: "dramatic" | "informative" | "mysterious";
  isRead?: boolean;
}

export interface SceneDefinition {
  id: string;
  name: string;
  templateId: GeometryTemplateId;
  visualDescription: string;
  imagePrompt?: string;
  backgroundAsset?: string;
  spawnPoint: { x: number; y: number };
  npcs: SceneNPCPlacement[];
  objects: SceneObjectPlacement[];
  exits: SceneExit[];
  narratorEvents: NarratorEvent[];
}

export interface DialogueOption {
  id: string;
  text: string;
  nextDialogueId?: string;
  grantsEvidenceId?: string;
  completesObjectiveId?: string;
}

export interface DialogueNode {
  id: string;
  prompt: string;
  options: DialogueOption[];
}

export interface NPCDefinition {
  id: string;
  name: string;
  title: string;
  historicalRole: string;
  personality: string;
  spriteType: "guard" | "archaeologist" | "scholar" | "merchant" | "noble" | "citizen";
  characterImagePrompt?: string;
  spriteAsset?: string;
  portraitAsset?: string;
  initialDialogue: string;
  dialogueTree?: DialogueNode[];
  historicalFacts: string[];
}

export type ObjectiveType =
  | "TALK_TO_NPC"
  | "INSPECT_OBJECT"
  | "DISCOVER_EVIDENCE"
  | "REACH_LOCATION"
  | "SOLVE_PUZZLE"
  | "MAKE_DECISION";

export interface QuestObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  targetId: string; // NPC id, object id, clue id, scene id, puzzle id
  isCompleted: boolean;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewardXP: number;
  puzzleId?: string;
  historicalInsight: string;
  isCompleted: boolean;
}

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  historicalFact: string;
  sourceCitation?: string;
  learningObjectiveId?: string;
  iconType: "document" | "map" | "artifact" | "inscription" | "weapon" | "letter";
  imageAsset?: string;
  isDiscovered: boolean;
}

export interface PuzzleOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface PuzzleDefinition {
  id: string;
  title: string;
  question: string;
  historicalContext: string;
  options: PuzzleOption[];
  hint: string;
  historicalInsightUnlocked: string;
  isSolved: boolean;
}

export interface LearningObjective {
  id: string;
  factTitle: string;
  historicalFact: string;
  citation?: string;
}

export interface WorldDefinition {
  metadata: WorldMetadata;
  historicalContext: HistoricalContext;
  visualBible: VisualBible;
  narratorOpening: string;
  scenes: SceneDefinition[];
  characters: NPCDefinition[];
  quests: QuestDefinition[];
  evidence: EvidenceItem[];
  puzzles: PuzzleDefinition[];
  learningObjectives: LearningObjective[];
  expeditionEndingText: string;
}

export interface SavedGameState {
  worldId: string;
  currentSceneId: string;
  playerPos: { x: number; y: number };
  activeQuestId?: string;
  completedObjectiveIds?: string[];
  discoveredEvidenceIds?: string[];
  solvedPuzzleIds?: string[];
  readNarratorEventIds?: string[];
  updatedAt: string;
  discoveredClueIds?: string[];
  currentStageIndex?: number;
  isCompleted?: boolean;
}
