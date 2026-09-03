import { NextRequest, NextResponse } from "next/server";
import { SceneArchetype } from "../../types/world";
import { buildVisualPrompt } from "../../services/visualGenerator";
import { FluxKontextProvider } from "../../services/imageProviders/fluxKontextProvider";
import { GrokImageProvider } from "../../services/imageProviders/grokProvider";
import { generateSceneHash } from "../../services/cache";

const ARCHETYPE_FALLBACKS: Record<SceneArchetype, string> = {
  gate: "/bg-agra-fort.jpg",
  corridor: "/bg-agra-brown-passage.jpg",
  courtyard: "/bg-chittorgarh-courtyard.jpg",
  palace_interior: "/bg-badal-mahal-interior.jpg",
  throne_hall: "/bg-agra-interior.jpg",
  terrace: "/bg-kumbhalgarh-wall-top.jpg",
  bazaar: "/bg-red-fort-interior.jpg",
  fort_approach: "/bg-chittorgarh-ram-pol.jpg",
  fort_wall: "/bg-chittorgarh-desert-side.jpg",
  merchant_warehouse: "/bg-red-fort-interior.jpg",
  port: "/bg-agra-fort.jpg",
};

// In-memory sliding-window rate-limiting store (max 15 requests per 1-minute window per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check (by IP / client header)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { status: "error", message: "Rate limit exceeded. Please wait a moment before requesting another visual." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { world, scene, forceProvider } = body;

    // 2. Request Body Validation
    if (
      !world ||
      typeof world.region !== "string" ||
      typeof world.historicalEra !== "string" ||
      !scene ||
      typeof scene.name !== "string" ||
      !scene.archetype
    ) {
      return NextResponse.json(
        { status: "error", message: "Invalid world or scene object provided." },
        { status: 400 }
      );
    }

    const archetype: SceneArchetype = ARCHETYPE_FALLBACKS[scene.archetype as SceneArchetype]
      ? (scene.archetype as SceneArchetype)
      : "courtyard";
    const defaultFallbackUrl = scene.backgroundImageUrl || ARCHETYPE_FALLBACKS[archetype];

    // Compute visual signature for deterministic caching
    const sceneSignature = generateSceneHash(
      scene.historicalPeriod || world.historicalEra,
      world.region,
      archetype,
      scene.name
    );

    const prompt = buildVisualPrompt(world, scene);

    const hfToken = process.env.HF_TOKEN || process.env.FLUX_API_KEY;
    const xaiKey = process.env.XAI_API_KEY;
    const isProd = process.env.NODE_ENV === "production";

    // Direct provider override (for local diagnostic test page only)
    if (!isProd && forceProvider === "grok" && xaiKey) {
      const grokProvider = new GrokImageProvider();
      const res = await grokProvider.generateImage({ prompt, archetype, sceneSignature });
      return NextResponse.json({
        status: "success",
        imageUrl: res.imageUrl,
        provider: res.provider,
        model: res.model,
        generated: res.generated,
        cached: res.cached,
        fallback: res.fallback,
        isFallback: res.isFallback,
        signature: sceneSignature,
        message: res.message,
      });
    }

    // Strategy 1: FLUX.1 Kontext [dev] Provider (Primary Live Visual Provider)
    if (hfToken) {
      try {
        const fluxProvider = new FluxKontextProvider();
        const result = await fluxProvider.generateImage({
          prompt,
          archetype,
          sceneSignature,
        });

        if (result.generated) {
          return NextResponse.json({
            status: "success",
            imageUrl: result.imageUrl,
            provider: result.provider,
            model: result.model,
            generated: true,
            cached: false,
            fallback: false,
            isFallback: false,
            signature: sceneSignature,
            message: result.message,
          });
        }
      } catch (fluxErr) {
        console.warn("FLUX.1 Kontext [dev] generation failed, trying Grok fallback:", fluxErr);
      }
    }

    // Strategy 2: Grok Imagine Provider (Secondary Backup AI Image Provider)
    if (xaiKey) {
      try {
        const grokProvider = new GrokImageProvider();
        const result = await grokProvider.generateImage({
          prompt,
          archetype,
          sceneSignature,
        });

        if (result.generated) {
          return NextResponse.json({
            status: "success",
            imageUrl: result.imageUrl,
            provider: "grok",
            model: result.model || "grok-imagine-image-2.0",
            generated: true,
            cached: false,
            fallback: true,
            isFallback: true,
            signature: sceneSignature,
            message: "Environment generated with backup image provider (Grok Imagine).",
          });
        }
      } catch (grokErr) {
        console.warn("Grok Imagine generation failed, using static archetype fallback:", grokErr);
      }
    }

    // Strategy 3: Guaranteed Static Archetype Fallback
    return NextResponse.json({
      status: "success",
      imageUrl: defaultFallbackUrl,
      provider: "static",
      model: "archetype-static-template",
      generated: false,
      cached: false,
      fallback: true,
      isFallback: true,
      signature: sceneSignature,
      message: "Live image generation is temporarily unavailable. Using a historical environment template.",
    });
  } catch (globalErr) {
    console.error("Server image API route error:", globalErr);
    return NextResponse.json(
      { status: "error", message: "Server error processing image request." },
      { status: 500 }
    );
  }
}
