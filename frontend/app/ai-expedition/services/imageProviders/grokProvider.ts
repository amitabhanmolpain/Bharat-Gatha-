/**
 * Grok Imagine Image Provider — Bharat Gatha AI Historical Expedition
 *
 * MODEL: grok-imagine-image-2.0
 * ENDPOINT: https://api.x.ai/v1/images/generations
 * TRANSPORT: xAI REST API (server-side only)
 *
 * SAFETY GUARANTEE:
 * 1. Server-side only (XAI_API_KEY is never exposed to browser bundles).
 * 2. Visual layer only (Gameplay geometry, collision, NPCs, and quest logic remain governed strictly by template geometry).
 * 3. Additive & Isolated (0 changes outside frontend/app/ai-expedition/).
 */

import { ImageGenerationRequest, ImageGenerationResponse } from "../../types/visual";
import { getArchetypeReferenceImage } from "../referenceStyle";
import { ImageProvider } from "./fluxKontextProvider";

export class GrokImageProvider implements ImageProvider {
  private readonly targetModel = "grok-imagine-image-2.0";

  public async generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const { prompt, archetype, sceneSignature } = req;
    const xaiKey = process.env.XAI_API_KEY;

    if (xaiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const res = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xaiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.targetModel,
            prompt,
            n: 1,
            response_format: "b64_json",
          }),
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const imageObj = data.data?.[0];
          let imageUrl = "";

          if (imageObj?.b64_json) {
            imageUrl = `data:image/jpeg;base64,${imageObj.b64_json}`;
          } else if (imageObj?.url) {
            imageUrl = imageObj.url;
          }

          if (imageUrl) {
            return {
              imageUrl,
              provider: "grok",
              model: this.targetModel,
              generated: true,
              cached: false,
              fallback: true,
              isFallback: true,
              signature: sceneSignature,
              message: `Generated via Grok Imagine (${this.targetModel}).`,
            };
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn(`Grok Imagine API returned status ${res.status}:`, errData.error || errData);
        }
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.warn("Grok Imagine Provider generation failed:", errMessage);
      }
    }

    const fallbackImage = getArchetypeReferenceImage(archetype);
    const reasonMessage = !xaiKey
      ? "XAI_API_KEY not configured — loaded historical archetype backdrop."
      : "Grok Imagine API error/availability notice — loaded historical archetype backdrop.";

    return {
      imageUrl: fallbackImage,
      provider: "grok",
      model: this.targetModel,
      generated: false,
      cached: false,
      fallback: true,
      isFallback: true,
      signature: sceneSignature,
      message: reasonMessage,
    };
  }
}
