import { WorldDefinition } from "../types/expedition";

export interface ExpeditionBlueprint {
  id: string;
  keywords: string[];
  title: string;
  era: string;
  year: string;
  location: string;
  world: WorldDefinition;
}
