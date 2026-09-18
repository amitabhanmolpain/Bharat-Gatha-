"use client";

import { offlinePersistenceService } from "../../../services/offlinePersistenceService";
import { networkService } from "../../../services/networkService";

export interface GameUnlockStatusMap {
  [gameId: string]: boolean;
}

/**
 * Checks and computes the real unlock status for all games across all campaigns
 * by cross-referencing IndexedDB offline storage, campaign local states, and online wins.
 */
export async function fetchAllGamesUnlockStatus(): Promise<GameUnlockStatusMap> {
  const statusMap: GameUnlockStatusMap = {
    // Rajputana
    chaupar: false,
    vijay_stambh_carvings: false,
    badal_mahal_lamps: false,
    kuldhara_deduction: false,
    bhangarh_curse_truth: false,

    // Mughal
    pietra_dura_flower_art: false,
    sheesh_mahal_reflection: false,
    mughal_campaign: false,

    // Vijayanagara
    chowka_bara_anegundi: false,
    toy_inspection_hampi: false,
    musical_pillars_vittala: false,
    festival_reconstruction_dibba: false,

    // Indus Valley
    great_bath_drainage: false,
    steatite_seal_decryption: false,
    priest_king_blessing: false,

    // AI Expedition
    exp_plassey_1757: false,
  };

  if (typeof window === "undefined") {
    return statusMap;
  }

  const storedUserId = localStorage.getItem("user_id") || "default_traveller";

  // 1. Fetch from Local IndexedDB for all known eras
  const eras = ["rajputana", "rajasthan", "mughal", "vijayanagara", "indus", "ai_expedition"];
  const allSolvedFromIndexedDB = new Set<string>();

  try {
    for (const era of eras) {
      const localWins = await offlinePersistenceService.getSolvedPuzzlesLocally(storedUserId, era);
      localWins.forEach((w) => allSolvedFromIndexedDB.add(w));
    }
  } catch (err) {
    console.warn("Could not query IndexedDB local wins:", err);
  }

  // 2. Fetch from Online Database if connected
  if (networkService.isOnline()) {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:5001";

      for (const era of ["mughal", "rajputana", "rajasthan", "indus", "vijayanagara"]) {
        const res = await fetch(`${backendUrl}/api/game/wins?user_id=${storedUserId}&era=${era}`);
        if (res.ok) {
          const data = await res.json();
          if (data.wins && Array.isArray(data.wins)) {
            data.wins.forEach((w: any) => {
              if (w.game_type) allSolvedFromIndexedDB.add(w.game_type);
            });
          }
        }
      }
    } catch {
      // Offline fallback is natural and expected
    }
  }

  // 3. Evaluate RAJPUTANA Games
  try {
    const rawRaj = localStorage.getItem("rajasthan_game_state");
    const rajState = rawRaj ? JSON.parse(rawRaj) : null;
    const stage = rajState?.stage || 1;

    // Chaupar
    statusMap.chaupar =
      allSolvedFromIndexedDB.has("chaupar") ||
      stage > 1 ||
      (rajState?.cluesFound && rajState.cluesFound > 0) ||
      rajState?.hasPillar83Inspected ||
      false;

    // Vijay Stambh
    statusMap.vijay_stambh_carvings =
      allSolvedFromIndexedDB.has("vijay_stambh_carvings") ||
      Boolean(rajState?.hasPillar83Inspected) ||
      stage > 1 ||
      false;

    // Badal Mahal Lamps
    statusMap.badal_mahal_lamps =
      allSolvedFromIndexedDB.has("badal_mahal_lamps") ||
      stage > 2 ||
      false;

    // Kuldhara Deduction
    statusMap.kuldhara_deduction =
      allSolvedFromIndexedDB.has("kuldhara_deduction") ||
      (Boolean(rajState?.hasWeddingOrnament) &&
        Boolean(rajState?.hasTaxLedger) &&
        Boolean(rajState?.hasWaterPotsSupplies)) ||
      stage > 3 ||
      false;

    // Bhangarh Curse Truth
    statusMap.bhangarh_curse_truth =
      allSolvedFromIndexedDB.has("bhangarh_curse_truth") ||
      Boolean(rajState?.isCampaignComplete) ||
      (Boolean(rajState?.hasBhangarhChronicleClue) &&
        Boolean(rajState?.hasTempleArchitectureClue) &&
        Boolean(rajState?.hasFamineRecordClue) &&
        Boolean(rajState?.hasFolkloreDistinctionClue)) ||
      false;
  } catch (e) {
    console.warn("Error parsing Rajasthan progress:", e);
  }

  // 4. Evaluate MUGHAL Games
  try {
    statusMap.pietra_dura_flower_art =
      allSolvedFromIndexedDB.has("pietra_dura_flower_art") ||
      allSolvedFromIndexedDB.has("pietra_dura") ||
      localStorage.getItem("mughal_is_pietra_dura_solved") === "true";

    statusMap.sheesh_mahal_reflection =
      allSolvedFromIndexedDB.has("sheesh_mahal_reflection") ||
      allSolvedFromIndexedDB.has("sheesh_mirror") ||
      localStorage.getItem("mughal_is_sheesh_mirror_solved") === "true";

    statusMap.mughal_campaign =
      allSolvedFromIndexedDB.has("mughal_campaign") ||
      localStorage.getItem("mughal_campaign_cleared") === "true" ||
      localStorage.getItem("mughal_companion_rescued") === "true";
  } catch (e) {
    console.warn("Error parsing Mughal progress:", e);
  }

  // 5. Evaluate VIJAYANAGARA Games
  try {
    const rawVij = localStorage.getItem("vijayanagara_save_v1");
    const vijState = rawVij ? JSON.parse(rawVij) : null;
    const vijStage = vijState?.stage || 1;

    statusMap.chowka_bara_anegundi =
      allSolvedFromIndexedDB.has("chowka_bara_anegundi") ||
      allSolvedFromIndexedDB.has("chowka_bara") ||
      Boolean(vijState?.isChowkaBaraComplete) ||
      Boolean(vijState?.hasVidyaranyaBlessing) ||
      vijStage > 1 ||
      false;

    statusMap.toy_inspection_hampi =
      allSolvedFromIndexedDB.has("toy_inspection_hampi") ||
      Boolean(vijState?.hasJournalToy) ||
      Boolean(vijState?.hasFirstLedgerFragment) ||
      vijStage > 2 ||
      false;

    statusMap.musical_pillars_vittala =
      allSolvedFromIndexedDB.has("musical_pillars_vittala") ||
      Boolean(vijState?.isMusicalPillarsComplete) ||
      Boolean(vijState?.hasSecondLedgerFragment) ||
      vijStage > 3 ||
      false;

    statusMap.festival_reconstruction_dibba =
      allSolvedFromIndexedDB.has("festival_reconstruction_dibba") ||
      Boolean(vijState?.isFestivalSceneRestored) ||
      Boolean(vijState?.isLedgerAssembled) ||
      Boolean(vijState?.isCampaignComplete) ||
      false;
  } catch (e) {
    console.warn("Error parsing Vijayanagara progress:", e);
  }

  // 6. Evaluate INDUS VALLEY Games
  try {
    const rawIndus = localStorage.getItem("indus_save_v1");
    const indusState = rawIndus ? JSON.parse(rawIndus) : null;
    const indusStage = indusState?.stage || 1;

    statusMap.great_bath_drainage =
      allSolvedFromIndexedDB.has("great_bath_drainage") ||
      Boolean(indusState?.isDrainagePuzzleSolved) ||
      Boolean(indusState?.hasInspectedBitumenLining) ||
      Boolean(indusState?.hasGreatBathPurificationBlessing) ||
      indusStage > 2 ||
      false;

    statusMap.steatite_seal_decryption =
      allSolvedFromIndexedDB.has("steatite_seal_decryption") ||
      Boolean(indusState?.isSealPuzzleSolved) ||
      Boolean(indusState?.hasUnicornSeal) ||
      Boolean(indusState?.hasPashupatiSeal) ||
      indusStage > 3 ||
      false;

    statusMap.priest_king_blessing =
      allSolvedFromIndexedDB.has("priest_king_blessing") ||
      Boolean(indusState?.hasBronzeDancingGirl) ||
      Boolean(indusState?.hasMetPriestKing) ||
      Boolean(indusState?.isCampaignComplete) ||
      false;
  } catch (e) {
    console.warn("Error parsing Indus Valley progress:", e);
  }

  // 7. Evaluate AI EXPEDITION Games
  try {
    const rawPlassey1 = localStorage.getItem("ai_expedition_save_plassey_1757");
    const rawPlassey2 = localStorage.getItem("ai_expedition_save_exp_plassey_1757");
    const plasseyState = (rawPlassey1 ? JSON.parse(rawPlassey1) : null) || (rawPlassey2 ? JSON.parse(rawPlassey2) : null);

    statusMap.exp_plassey_1757 =
      allSolvedFromIndexedDB.has("exp_plassey_1757") ||
      Boolean(plasseyState?.isComplete) ||
      localStorage.getItem("ai_expedition_save_plassey_1757_completed") === "true" ||
      false;
  } catch (e) {
    console.warn("Error parsing AI Expedition progress:", e);
  }

  return statusMap;
}
