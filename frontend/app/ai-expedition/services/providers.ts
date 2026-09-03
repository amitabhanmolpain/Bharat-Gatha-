import { WorldDefinition, SceneDefinition, SceneArchetype } from "../types/world";
import { MOCK_RAJASTHAN_WORLD, MOCK_AGRA_WORLD } from "./mockData";
import { generateSceneHash, getCachedVisualUrlAsync, setCachedVisualUrl } from "./cache";
import { FluxKontextProvider } from "./imageProviders/fluxKontextProvider";

export { FluxKontextProvider };

export interface LLMProvider {
  generateWorldDefinition(userPrompt: string): Promise<{ world: WorldDefinition; provider: string; isFallback: boolean; message?: string }>;
}

export interface ImageProvider {
  generateSceneImage(world: WorldDefinition, scene: SceneDefinition): Promise<{ imageUrl: string; provider: string; isFallback: boolean; message?: string }>;
}

function getApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export class RealLLMProvider implements LLMProvider {
  async generateWorldDefinition(userPrompt: string): Promise<{ world: WorldDefinition; provider: string; isFallback: boolean; message?: string }> {
    try {
      const apiUrl = getApiUrl("/ai-expedition/api/generate");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.world) {
        return {
          world: data.world,
          provider: data.provider || "gemini-3.6-flash",
          isFallback: data.status === "fallback",
          message: data.message,
        };
      }
      throw new Error(data.message || "No world object returned");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn("RealLLMProvider client error, switching to MockLLMProvider:", errorMsg);
      const mockProvider = new MockLLMProvider();
      const mockRes = await mockProvider.generateWorldDefinition(userPrompt);
      return {
        world: mockRes.world,
        provider: "mock_fallback",
        isFallback: true,
        message: "API connection offline — loaded demonstration expedition.",
      };
    }
  }
}

export class MockLLMProvider implements LLMProvider {
  async generateWorldDefinition(userPrompt: string): Promise<{ world: WorldDefinition; provider: string; isFallback: boolean; message?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const promptLower = userPrompt.toLowerCase();
    let selectedWorld = MOCK_RAJASTHAN_WORLD;

    if (promptLower.includes("agra") || promptLower.includes("mughal") || promptLower.includes("1857") || promptLower.includes("surat")) {
      selectedWorld = MOCK_AGRA_WORLD;
    }

    return {
      world: {
        ...selectedWorld,
        userPrompt,
        createdAt: new Date().toISOString(),
      },
      provider: "mock_fallback",
      isFallback: true,
    };
  }
}

export class RealImageProvider implements ImageProvider {
  async generateSceneImage(world: WorldDefinition, scene: SceneDefinition): Promise<{ imageUrl: string; provider: string; isFallback: boolean; message?: string }> {
    // 1. Check deterministic visual cache (memory + IndexedDB)
    const hashKey = generateSceneHash(
      scene.historicalPeriod || world.historicalEra,
      world.region,
      scene.archetype,
      scene.name
    );

    const cachedUrl = await getCachedVisualUrlAsync(hashKey);
    if (cachedUrl) {
      return {
        imageUrl: cachedUrl,
        provider: "cache",
        isFallback: false,
        message: "AI Expedition • Visual Cache Hit",
      };
    }

    // 2. Fetch from API route
    try {
      const apiUrl = getApiUrl("/ai-expedition/api/image");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ world, scene }),
      });

      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.imageUrl) {
        setCachedVisualUrl(hashKey, data.imageUrl);

        return {
          imageUrl: data.imageUrl,
          provider: data.provider || "flux-kontext-dev",
          isFallback: Boolean(data.fallback || data.isFallback),
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
