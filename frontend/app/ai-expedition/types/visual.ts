import { SceneArchetype } from "./world";

export interface WorldVisualPalette {
  primaryColor: string;
  accentColor: string;
  lightingMood: string;
  architecturalMotif: string;
  environmentalAtmosphere: string;
}

export interface SceneVisualDefinition {
  sceneId: string;
  archetype: SceneArchetype;
  historicalPeriod: string;
  region: string;
  architectureStyle: string;
  materials: string[];
  lighting: {
    timeOfDay: "dawn" | "morning" | "noon" | "afternoon" | "golden_hour" | "dusk" | "night";
    lightSource: string;
    atmosphere: string;
  };
  palette: WorldVisualPalette;
  composition: {
    viewpoint: "fixed 3/4 perspective 2.5D view";
    foreground: string;
    midground: string;
    background: string;
    landmark: string;
  };
  styleDirectives: {
    pixelArtStyle: string;
    renderingQuality: string;
    negativeConstraints: string[];
  };
  generatedImageUrl?: string;
  isFallback?: boolean;
  isCached?: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  archetype: SceneArchetype;
  visualDef?: SceneVisualDefinition;
  sceneSignature?: string;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  provider: "flux-kontext-dev" | "dalle-3" | "zero_cost_mode" | "mock_fallback" | string;
  model?: string;
  generated: boolean;
  cached: boolean;
  fallback: boolean;
  isFallback?: boolean;
  signature?: string;
  message?: string;
}
