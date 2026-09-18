import { WorldDefinition } from "../types/expedition";
import { findBlueprintForPrompt } from "./registry";
import { validateWorldDefinition } from "../services/validator";

export function resolveDemoWorld(prompt: string): WorldDefinition {
  const blueprint = findBlueprintForPrompt(prompt);
  
  // Deep clone blueprint world definition
  const rawWorld = JSON.parse(JSON.stringify(blueprint.world));
  
  // Assign dynamic unique expedition ID for this run
  const dynamicId = `exp_plassey_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  rawWorld.metadata.id = dynamicId;
  rawWorld.metadata.createdAt = new Date().toISOString();

  const validation = validateWorldDefinition(rawWorld);
  if (validation.valid && validation.world) {
    return validation.world;
  }

  return rawWorld as WorldDefinition;
}
