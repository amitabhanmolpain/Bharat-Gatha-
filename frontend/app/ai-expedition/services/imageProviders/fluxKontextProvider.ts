/**
 * FLUX.1 Kontext [dev] Image Provider — Bharat Gatha AI Historical Expedition
 *
 * MODEL: black-forest-labs/FLUX.1-Kontext-dev / black-forest-labs/FLUX.1-dev / black-forest-labs/FLUX.1-schnell
 * TRANSPORT: Hugging Face Inference Providers SDK (@huggingface/inference)
 * LICENSE NOTICE: FLUX.1 [dev] Non-Commercial License.
 * IMPORTANT: This model is distributed under non-commercial terms.
 * Review licensing prior to any commercial deployment.
 *
 * SAFETY GUARANTEE:
 * 1. Server-side only (HF_TOKEN is never exposed to browser bundles).
 * 2. Visual layer only (Gameplay geometry, collision, NPCs, and quest logic remain governed strictly by template geometry).
 * 3. Additive & Isolated (0 changes outside frontend/app/ai-expedition/).
 */

import { HfInference } from "@huggingface/inference";
import { ImageGenerationRequest, ImageGenerationResponse } from "../../types/visual";
import { getArchetypeReferenceImage } from "../referenceStyle";

export interface ImageProvider {
  generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}

interface ImageBlobLike {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export class FluxKontextProvider implements ImageProvider {
  private readonly targetModel = "black-forest-labs/FLUX.1-Kontext-dev";

  public async generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const { prompt, archetype, sceneSignature } = req;
    const hfToken = process.env.HF_TOKEN || process.env.FLUX_API_KEY;

    if (hfToken) {
      const hf = new HfInference(hfToken);

      const modelsToTry: Array<{ model: string; provider: "auto" | "replicate" }> = [
        { model: "black-forest-labs/FLUX.1-Kontext-dev", provider: "auto" },
        { model: "black-forest-labs/FLUX.1-dev", provider: "replicate" },
        { model: "black-forest-labs/FLUX.1-schnell", provider: "auto" },
      ];

      for (const item of modelsToTry) {
        try {
          const result = await hf.textToImage({
            model: item.model,
            provider: item.provider,
            inputs: prompt,
          });

          if (result && typeof (result as unknown as ImageBlobLike).arrayBuffer === "function") {
            const buffer = Buffer.from(await (result as unknown as ImageBlobLike).arrayBuffer());
            const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

            return {
              imageUrl: base64Image,
              provider: "huggingface-inference-providers",
              model: item.model,
              generated: true,
              cached: false,
              fallback: false,
              isFallback: false,
              signature: sceneSignature,
              message: `Generated via Hugging Face Inference Providers (${item.model}).`,
            };
          }
        } catch (err) {
          const errMessage = err instanceof Error ? err.message : String(err);
          console.warn(`HF Inference Provider (${item.model}) failed:`, errMessage);
        }
      }
    }

    const fallbackImage = getArchetypeReferenceImage(archetype);
    const reasonMessage = !hfToken
      ? "HF_TOKEN not configured — loaded historical archetype backdrop."
      : "HF Inference Providers quota/availability notice — loaded historical archetype backdrop.";

    return {
      imageUrl: fallbackImage,
      provider: "huggingface-inference-providers",
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
