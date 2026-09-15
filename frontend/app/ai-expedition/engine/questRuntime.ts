import { WorldDefinition, QuestDefinition, SavedGameState } from "../types/expedition";
import { ExpeditionStorage } from "../services/storage";

export class QuestRuntime {
  private world: WorldDefinition;
  private currentSceneId: string;
  private playerPos: { x: number; y: number };
  private activeQuestId: string;
  private completedObjectiveIds: Set<string>;
  private discoveredEvidenceIds: Set<string>;
  private solvedPuzzleIds: Set<string>;
  private readNarratorEventIds: Set<string>;

  constructor(world: WorldDefinition, savedState?: SavedGameState | null) {
    this.world = world;
    this.currentSceneId = savedState?.currentSceneId || world.scenes[0]?.id || "scene_1";
    this.playerPos = savedState?.playerPos || world.scenes[0]?.spawnPoint || { x: 50, y: 85 };
    this.activeQuestId = savedState?.activeQuestId || world.quests[0]?.id || "quest_1";
    this.completedObjectiveIds = new Set(savedState?.completedObjectiveIds || []);
    this.discoveredEvidenceIds = new Set(savedState?.discoveredEvidenceIds || []);
    this.solvedPuzzleIds = new Set(savedState?.solvedPuzzleIds || []);
    this.readNarratorEventIds = new Set(savedState?.readNarratorEventIds || []);

    // Hydrate initially discovered evidence from world definition defaults
    world.evidence.forEach((ev) => {
      if (ev.isDiscovered) this.discoveredEvidenceIds.add(ev.id);
    });
  }

  getCurrentSceneId(): string {
    return this.currentSceneId;
  }

  setSceneId(sceneId: string, spawnPoint?: { x: number; y: number }): void {
    this.currentSceneId = sceneId;
    if (spawnPoint) {
      this.playerPos = spawnPoint;
    }
    this.persist();
  }

  getPlayerPos(): { x: number; y: number } {
    return this.playerPos;
  }

  setPlayerPos(pos: { x: number; y: number }): void {
    this.playerPos = pos;
  }

  getActiveQuest(): QuestDefinition | null {
    return this.world.quests.find((q) => q.id === this.activeQuestId) || this.world.quests[0] || null;
  }

  isObjectiveCompleted(objectiveId: string): boolean {
    return this.completedObjectiveIds.has(objectiveId);
  }

  completeObjective(objectiveId: string): { questCompleted: boolean; historicalInsight?: string } {
    this.completedObjectiveIds.add(objectiveId);
    this.persist();

    const quest = this.getActiveQuest();
    if (!quest) return { questCompleted: false };

    const allDone = quest.objectives.every((obj) => this.completedObjectiveIds.has(obj.id));
    if (allDone && !quest.isCompleted) {
      quest.isCompleted = true;
      return { questCompleted: true, historicalInsight: quest.historicalInsight };
    }

    return { questCompleted: false };
  }

  discoverEvidence(evidenceId: string): boolean {
    if (this.discoveredEvidenceIds.has(evidenceId)) return false;
    this.discoveredEvidenceIds.add(evidenceId);

    const ev = this.world.evidence.find((e) => e.id === evidenceId);
    if (ev) ev.isDiscovered = true;

    // Check if any objective requires this evidence
    const quest = this.getActiveQuest();
    if (quest) {
      quest.objectives.forEach((obj) => {
        if (obj.type === "DISCOVER_EVIDENCE" && obj.targetId === evidenceId) {
          this.completeObjective(obj.id);
        }
      });
    }

    this.persist();
    return true;
  }

  getDiscoveredEvidence(): string[] {
    return Array.from(this.discoveredEvidenceIds);
  }

  isEvidenceDiscovered(evidenceId: string): boolean {
    return this.discoveredEvidenceIds.has(evidenceId);
  }

  solvePuzzle(puzzleId: string): { puzzleUnlockedInsight: string; questCompleted: boolean; historicalInsight?: string } {
    this.solvedPuzzleIds.add(puzzleId);
    const puzzle = this.world.puzzles.find((p) => p.id === puzzleId);
    if (puzzle) puzzle.isSolved = true;

    // Check if any objective requires solving this puzzle
    let questResult: { questCompleted: boolean; historicalInsight?: string } = { questCompleted: false };
    const quest = this.getActiveQuest();
    if (quest) {
      quest.objectives.forEach((obj) => {
        if (obj.type === "SOLVE_PUZZLE" && obj.targetId === puzzleId) {
          questResult = this.completeObjective(obj.id);
        }
      });
    }

    this.persist();
    return {
      puzzleUnlockedInsight: puzzle?.historicalInsightUnlocked || "Historical puzzle decoded successfully!",
      questCompleted: questResult.questCompleted,
      historicalInsight: questResult.historicalInsight
    };
  }

  isPuzzleSolved(puzzleId: string): boolean {
    return this.solvedPuzzleIds.has(puzzleId);
  }

  markNarratorEventRead(eventId: string): void {
    this.readNarratorEventIds.add(eventId);
    this.persist();
  }

  isNarratorEventRead(eventId: string): boolean {
    return this.readNarratorEventIds.has(eventId);
  }

  getSavedState(): SavedGameState {
    return {
      worldId: this.world.metadata.id,
      currentSceneId: this.currentSceneId,
      playerPos: this.playerPos,
      activeQuestId: this.activeQuestId,
      completedObjectiveIds: Array.from(this.completedObjectiveIds),
      discoveredEvidenceIds: Array.from(this.discoveredEvidenceIds),
      solvedPuzzleIds: Array.from(this.solvedPuzzleIds),
      readNarratorEventIds: Array.from(this.readNarratorEventIds),
      updatedAt: new Date().toISOString()
    };
  }

  persist(): void {
    ExpeditionStorage.saveGameState(this.getSavedState());
  }
}
