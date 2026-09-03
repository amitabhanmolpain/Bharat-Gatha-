import { WorldDefinition, SceneDefinition } from "../types/world";

const preloadedUrls = new Set<string>();

export function preloadConnectedSceneImages(world: WorldDefinition, currentScene: SceneDefinition): void {
  if (typeof window === "undefined" || !currentScene || !currentScene.exits) return;

  currentScene.exits.forEach((exit) => {
    const targetScene = world.scenes[exit.targetSceneId];
    if (targetScene && targetScene.backgroundImageUrl) {
      const url = targetScene.backgroundImageUrl;
      if (!preloadedUrls.has(url)) {
        preloadedUrls.add(url);
        const img = new Image();
        img.src = url;
      }
    }
  });
}
