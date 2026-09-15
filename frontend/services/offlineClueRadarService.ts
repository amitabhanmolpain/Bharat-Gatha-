/**
 * Offline Clue Radar Service for Bharat Gatha.
 *
 * Client-side replica of backend game_controller.py CLUE_HOTSPOTS.
 * Guarantees identical proximity shaking behavior for Jolly Bhai when offline.
 */

export interface ClueRadarResult {
  status: string;
  should_shake: boolean;
  mode: "normal" | "shaking";
  clue_id?: string;
  clue_name?: string;
  hint?: string;
  reason: string;
}

export const OFFLINE_CLUE_HOTSPOTS: { [scene: string]: any } = {
  chiefs_house: {
    clue_id: "wedding_ornament",
    name: "Bridal Wedding Ornament",
    description: "Gold bridal ornament tucked inside the carved wall alcove.",
    min_x: 54.0, max_x: 100.0, min_y: 0.0, max_y: 78.0,
  },
  treasury: {
    clue_id: "tax_ledger",
    name: "Diwan Salim Singh's Torn Tax Ledger",
    description: "Crushed parchment ledger on the merchant's calculation table with balance scale.",
    min_x: 34.0, max_x: 74.0, min_y: 0.0, max_y: 76.0,
  },
  well: {
    clue_id: "water_pots",
    name: "Intact Desert Water Pots",
    description: "Clay water vessels and supply caches left intact on the stepwell platform.",
    min_x: 0.0, max_x: 55.0, min_y: 65.0, max_y: 84.0,
  },
  bhangarh_gate: {
    clue_id: "kathputli_fragment",
    name: "Kathputli Sandstone Fragment",
    description: "Carved puppet theater fragment resting near the broken gate ramparts.",
    min_x: 0.0, max_x: 100.0, min_y: 65.0, max_y: 100.0,
  },
  gopinath_temple: {
    clue_id: "paliwal_seal",
    name: "Paliwal Ledger Seal",
    description: "Bronze horse medallion seal near the baoli sanctuary steps.",
    min_x: 0.0, max_x: 100.0, min_y: 0.0, max_y: 80.0,
  },
  palace_ruins: {
    clue_id: "wanderers_verse",
    name: "Wanderer's Verse Antelope Medallion",
    description: "Ancient inscribed verse inside the 7-tiered royal palace ruins.",
    min_x: 0.0, max_x: 100.0, min_y: 0.0, max_y: 80.0,
  },
};

export function evaluateOfflineClueRadar(
  scene: string,
  playerX: number,
  playerY: number,
  collectedClues: string[] = []
): ClueRadarResult {
  const hotspot = OFFLINE_CLUE_HOTSPOTS[scene];
  if (!hotspot) {
    return {
      status: "success",
      should_shake: false,
      mode: "normal",
      reason: "No hidden clue in this location.",
    };
  }

  const clueId = hotspot.clue_id;
  if (collectedClues.includes(clueId)) {
    return {
      status: "success",
      should_shake: false,
      mode: "normal",
      reason: `${hotspot.name} already discovered by player.`,
    };
  }

  const inProximity =
    playerX >= hotspot.min_x &&
    playerX <= hotspot.max_x &&
    playerY >= hotspot.min_y &&
    playerY <= hotspot.max_y;

  if (inProximity) {
    return {
      status: "success",
      should_shake: true,
      mode: "shaking",
      clue_id: clueId,
      clue_name: hotspot.name,
      hint: `💥 Quick, mere aaka! ${hotspot.description}`,
      reason: `Player is in close proximity to undiscovered ${hotspot.name}.`,
    };
  }

  return {
    status: "success",
    should_shake: false,
    mode: "normal",
    clue_id: clueId,
    clue_name: hotspot.name,
    reason: "Player is in the chamber but not near the clue hotspot. Genie remains calm.",
  };
}
