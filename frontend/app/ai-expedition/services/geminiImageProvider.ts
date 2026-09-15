import { mediaStorage } from "./mediaStorage";

export interface ImageResult {
  success: boolean;
  objectUrl?: string;
  error?: string;
}

export interface ImageProvider {
  getSceneImage(worldId: string, sceneId: string, imagePrompt: string): Promise<ImageResult>;
  getCharacterImage(worldId: string, characterId: string, characterPrompt: string): Promise<ImageResult>;
}

const STATIC_SCENE_MAP: Record<string, string> = {
  scene_company_camp: "/ai-expedition/plassey/backgrounds/scene-1-company-camp.png",
  scene_1: "/ai-expedition/plassey/backgrounds/scene-1-company-camp.png",
  scene_camp_rumours: "/ai-expedition/plassey/backgrounds/scene-2-military-camp.png",
  scene_2: "/ai-expedition/plassey/backgrounds/scene-2-military-camp.png",
  scene_bengal_bazaar: "/ai-expedition/plassey/backgrounds/scene-3-bengal-bazaar.png",
  scene_3: "/ai-expedition/plassey/backgrounds/scene-3-bengal-bazaar.png",
  scene_political_investigation: "/ai-expedition/plassey/backgrounds/scene-4-administrative-chamber.png",
  scene_4: "/ai-expedition/plassey/backgrounds/scene-4-administrative-chamber.png",
  scene_court_investigation: "/ai-expedition/plassey/backgrounds/scene-5-royal-court.png",
  scene_5: "/ai-expedition/plassey/backgrounds/scene-5-royal-court.png",
  scene_aftermath: "/ai-expedition/plassey/backgrounds/scene-6-battlefield-aftermath.png",
  scene_6: "/ai-expedition/plassey/backgrounds/scene-6-battlefield-aftermath.png",
};

const STATIC_CHARACTER_MAP: Record<string, string> = {
  player: "/ai-expedition/plassey/characters/player-bengal-messenger.png",
  char_clive: "/ai-expedition/plassey/characters/robert-clive.png",
  char_siraj: "/ai-expedition/plassey/characters/siraj-ud-daulah.png",
  char_jafar: "/ai-expedition/plassey/characters/mir-jafar.png",
  char_company_guard: "/ai-expedition/plassey/characters/company-guard.png",
  char_company_soldier: "/ai-expedition/plassey/characters/company-soldier.png",
  char_camp_clerk: "/ai-expedition/plassey/characters/camp-clerk.png",
  char_bengal_merchant: "/ai-expedition/plassey/characters/bengal-merchant.png",
  char_silk_merchant: "/ai-expedition/plassey/characters/bengal-merchant.png",
  char_political_observer: "/ai-expedition/plassey/characters/court-official.png",
  char_artisan: "/ai-expedition/plassey/characters/artisan.png",
  char_traveller: "/ai-expedition/plassey/characters/player-bengal-messenger.png",
  char_resident: "/ai-expedition/plassey/characters/artisan.png",
  char_court_official: "/ai-expedition/plassey/characters/court-official.png",
  char_narrator_observer: "/ai-expedition/plassey/characters/court-official.png",
};

export class GeminiImageProvider implements ImageProvider {
  async getSceneImage(worldId: string, sceneId: string, _imagePrompt: string): Promise<ImageResult> {
    void _imagePrompt;
    if (STATIC_SCENE_MAP[sceneId]) {
      return { success: true, objectUrl: STATIC_SCENE_MAP[sceneId] };
    }

    const s = sceneId.toLowerCase();
    if (s.includes("rumour") || s.includes("military") || s.includes("scene_2") || s.includes("scene2")) {
      return { success: true, objectUrl: "/ai-expedition/plassey/backgrounds/scene-2-military-camp.png" };
    }
    if (s.includes("bazaar") || s.includes("market") || s.includes("scene_3") || s.includes("scene3")) {
      return { success: true, objectUrl: "/ai-expedition/plassey/backgrounds/scene-3-bengal-bazaar.png" };
    }
    if (s.includes("political") || s.includes("chamber") || s.includes("scene_4") || s.includes("scene4")) {
      return { success: true, objectUrl: "/ai-expedition/plassey/backgrounds/scene-4-administrative-chamber.png" };
    }
    if (s.includes("court") || s.includes("throne") || s.includes("scene_5") || s.includes("scene5")) {
      return { success: true, objectUrl: "/ai-expedition/plassey/backgrounds/scene-5-royal-court.png" };
    }
    if (s.includes("aftermath") || s.includes("battlefield") || s.includes("scene_6") || s.includes("scene6")) {
      return { success: true, objectUrl: "/ai-expedition/plassey/backgrounds/scene-6-battlefield-aftermath.png" };
    }

    const assetId = `scene_${sceneId}`;
    const cachedUrl = await mediaStorage.getImageObjectUrl(worldId, assetId);
    if (cachedUrl) {
      return { success: true, objectUrl: cachedUrl };
    }

    return { success: true, objectUrl: "/ai-expedition/plassey/backgrounds/scene-1-company-camp.png" };
  }

  async getCharacterImage(worldId: string, characterId: string, _characterPrompt: string): Promise<ImageResult> {
    void _characterPrompt;
    if (STATIC_CHARACTER_MAP[characterId]) {
      return { success: true, objectUrl: STATIC_CHARACTER_MAP[characterId] };
    }

    const assetId = `char_${characterId}`;
    const cachedUrl = await mediaStorage.getImageObjectUrl(worldId, assetId);
    if (cachedUrl) {
      return { success: true, objectUrl: cachedUrl };
    }

    return { success: true, objectUrl: "/ai-expedition/plassey/characters/player-bengal-messenger.png" };
  }
}

// The ONLY active ImageProvider for AI Expedition
export const geminiImageProvider = new GeminiImageProvider();
