import { ImageGenerationRequest, ImageGenerationResponse } from "../../types/visual";

export class DalleImageProvider {
  async generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured on server.");
    }

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: req.prompt,
        n: 1,
        size: "1792x1024", // 16:9 widescreen ratio
        quality: "standard",
        response_format: "url",
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`OpenAI Image API returned status ${res.status}: ${errData.error?.message || "Unknown error"}`);
    }

    const data = await res.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("Received empty image URL from DALL-E API.");
    }

    return {
      imageUrl,
      provider: "dall-e-3",
      model: "dall-e-3",
      generated: true,
      cached: false,
      fallback: false,
      isFallback: false,
    };
  }
}
