import { WorldDefinition, SceneDefinition, SceneArchetype } from "../types/world";
import { MOCK_RAJASTHAN_WORLD, MOCK_AGRA_WORLD } from "./mockData";
import { generateSceneHash, getCachedVisualUrlAsync, setCachedVisualUrl } from "./cache";

export interface LLMProvider {
  generateWorldDefinition(prompt: string): Promise<{ world: WorldDefinition; isFallback: boolean }>;
}

export interface ImageProvider {
  generateSceneImage(world: WorldDefinition, scene: SceneDefinition): Promise<{ imageUrl: string; provider: string; isFallback: boolean; message?: string }>;
}

export class MockLLMProvider implements LLMProvider {
  async generateWorldDefinition(prompt: string): Promise<{ world: WorldDefinition; isFallback: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const isAgra = prompt.toLowerCase().includes("agra") || prompt.toLowerCase().includes("mughal") || prompt.toLowerCase().includes("fort");
    const baseWorld = isAgra ? MOCK_AGRA_WORLD : MOCK_RAJASTHAN_WORLD;
    const clonedWorld: WorldDefinition = JSON.parse(JSON.stringify(baseWorld));
    clonedWorld.worldId = `expedition-mock-${Date.now().toString(36)}`;
    clonedWorld.userPrompt = prompt;
    clonedWorld.createdAt = new Date().toISOString();
    return {
      world: clonedWorld,
      isFallback: true,
    };
  }
}

export class RealLLMProvider implements LLMProvider {
  async generateWorldDefinition(prompt: string): Promise<{ world: WorldDefinition; isFallback: boolean }> {
    try {
      const res = await fetch("/ai-expedition/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error ${res.status}`);
      }

      const data = await res.json();
      if (data.world) {
        return {
          world: data.world,
          isFallback: data.generationMode === "fallback",
        };
      }
      throw new Error("No world definition returned from API");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn("RealLLMProvider failed, using fallback:", errorMsg);
      const mockProvider = new MockLLMProvider();
      return mockProvider.generateWorldDefinition(prompt);
    }
  }
}

export class RealImageProvider implements ImageProvider {
  async generateSceneImage(world: WorldDefinition, scene: SceneDefinition): Promise<{ imageUrl: string; provider: string; isFallback: boolean; message?: string }> {
    const sceneObj = scene as SceneDefinition & { visualCacheKey?: string };
    const hashKey =
      sceneObj.visualCacheKey ||
      generateSceneHash(
        scene.historicalPeriod || world.historicalEra,
        world.region,
        scene.archetype,
        scene.name
      );

    // 1. Check in-memory & IndexedDB media cache first
    try {
      const cachedUrl = await getCachedVisualUrlAsync(hashKey);
      if (cachedUrl) {
        return {
          imageUrl: cachedUrl,
          provider: "cache",
          isFallback: false,
          message: "Loaded from visual cache • FLUX.1 Kontext [dev]",
        };
      }
    } catch (err) {
      console.warn("Visual cache check warning:", err);
    }

    // 2. Request generation from server API
    try {
      const res = await fetch("/ai-expedition/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ world, scene }),
      });

      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.imageUrl) {
        const isFallbackImage = Boolean(data.fallback || data.isFallback) || data.generated === false;
        if (!isFallbackImage) {
          setCachedVisualUrl(hashKey, data.imageUrl);
        }

        return {
          imageUrl: data.imageUrl,
          provider: data.provider || "flux-kontext-dev",
          isFallback: isFallbackImage,
          message: data.message || "AI Expedition • FLUX.1 Kontext [dev]",
        };
      }
      throw new Error(data.message || "No image URL returned");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn("RealImageProvider client error, using fallback:", errorMsg);
      const mockProvider = new MockImageProvider();
      return mockProvider.generateSceneImage(world, scene);
    }
  }
}

export class MockImageProvider implements ImageProvider {
  async generateSceneImage(world: WorldDefinition, scene: SceneDefinition): Promise<{ imageUrl: string; provider: string; isFallback: boolean; message?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const archetype: SceneArchetype = scene.archetype || "courtyard";
    let fallbackUrl = scene.backgroundImageUrl || "/bg-chittorgarh-courtyard.jpg";

    switch (archetype) {
      case "gate":
        fallbackUrl = "/bg-agra-fort.jpg";
        break;
      case "corridor":
        fallbackUrl = "/bg-agra-brown-passage.jpg";
        break;
      case "courtyard":
        fallbackUrl = "/bg-chittorgarh-courtyard.jpg";
        break;
      case "palace_interior":
        fallbackUrl = "/bg-badal-mahal-interior.jpg";
        break;
      case "throne_hall":
        fallbackUrl = "/bg-agra-interior.jpg";
        break;
      case "terrace":
        fallbackUrl = "/bg-kumbhalgarh-wall-top.jpg";
        break;
      default:
        fallbackUrl = "/bg-chittorgarh-courtyard.jpg";
        break;
    }

    return {
      imageUrl: fallbackUrl,
      provider: "zero_cost_mode",
      isFallback: true,
      message: "AI Expedition • FLUX.1 Kontext Fallback",
    };
  }
}

export const defaultLLMProvider = new RealLLMProvider();
export const defaultImageProvider = new RealImageProvider();
