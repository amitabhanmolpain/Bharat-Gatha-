import { ExpeditionBlueprint } from "./types";
import { PLASSEY_1757_BLUEPRINT } from "./blueprints/plassey1757";

export const DEMO_BLUEPRINTS: ExpeditionBlueprint[] = [
  PLASSEY_1757_BLUEPRINT
];

export function findBlueprintForPrompt(userPrompt: string): ExpeditionBlueprint {
  const query = userPrompt.toLowerCase().trim();

  for (const bp of DEMO_BLUEPRINTS) {
    for (const kw of bp.keywords) {
      if (query.includes(kw)) {
        return bp;
      }
    }
  }

  // Default to Plassey 1757 blueprint for SIH demo matching
  return PLASSEY_1757_BLUEPRINT;
}
