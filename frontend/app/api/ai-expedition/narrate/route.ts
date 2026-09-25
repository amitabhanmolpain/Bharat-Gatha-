import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { defaultAudioStore, sanitizeCacheKey } from "../../../ai-expedition/services/audioStore";

// Server-level in-flight request deduplication map
const inFlightServerRequests = new Map<string, Promise<{ status: string; audio_url: string; cached: boolean; cache_key: string; speaker: string }>>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawKey = searchParams.get("key");
    if (!rawKey) {
      return NextResponse.json({ error: "Missing audio key parameter" }, { status: 400 });
    }

    const cacheKey = sanitizeCacheKey(rawKey);
    const audioBuffer = await defaultAudioStore.get(cacheKey);

    if (!audioBuffer) {
      return NextResponse.json({ error: "Cached audio file not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache": "HIT"
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid key request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
    }

    // 1. Text sanitization & normalization
    let cleanText = text.trim();
    cleanText = cleanText.replace(/\bE\.?I\.?C\.?\b/gi, "East India Company");
    cleanText = cleanText.replace(/\bB\.?C\.?E\.?\b/gi, "Before Common Era");
    cleanText = cleanText.replace(/\bC\.?E\.?\b/gi, "Common Era");
    cleanText = cleanText.replace(/\bvs\.?\b/gi, "versus");
    cleanText = cleanText.replace(/\bNo\.?\b/gi, "number");
    cleanText = cleanText.replace(/1757/g, "seventeen fifty-seven");

    // Remove markdown formatting
    cleanText = cleanText.replace(/\*\*([^*]+)\*\*/g, "$1");
    cleanText = cleanText.replace(/\*([^*]+)\*/g, "$1");
    cleanText = cleanText.replace(/_([^_]+)_/g, "$1");
    cleanText = cleanText.replace(/`([^`]+)`/g, "$1");

    // Remove UI symbols & emojis
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "");
    cleanText = cleanText.replace(/[📜🔎✨✋💡🎯⚔️👑⚖️]/g, "");

    cleanText = cleanText.replace(/\s+/g, " ").trim();

    if (cleanText.length > 2000) {
      cleanText = cleanText.slice(0, 2000);
    }

    const VALID_SPEAKERS = new Set([
      "aditya", "kabir", "shreya", "kavya", "ratan", "ritu", "ashutosh", "priya", "neha",
      "rahul", "pooja", "rohan", "simran", "amit", "dev", "ishita", "varun", "manan",
      "sumit", "roopa", "aayan", "shubh", "advait", "anand", "tanya", "tarun", "sunny",
      "mani", "gokul", "vijay", "shruti", "suhani", "mohit", "kavitha", "rehan", "soham", "rupali"
    ]);
    const requestedSpeaker: string = typeof body.speaker === "string" ? body.speaker.toLowerCase() : "ratan";
    const speaker = VALID_SPEAKERS.has(requestedSpeaker) ? requestedSpeaker : "ratan";
    const pace = typeof body.pace === "number" ? body.pace : 0.95;
    const languageCode = typeof body.language_code === "string" ? body.language_code : "en-IN";
    const model = typeof body.model === "string" ? body.model : "bulbul:v3";

    // 2. MD5 Cache Key calculation (includes speaker to prevent voice collision)
    const keySource = `${cleanText}_${speaker}_${pace}_${languageCode}_${model}`;
    const rawCacheKey = crypto.createHash("md5").update(keySource).digest("hex");
    const cacheKey = sanitizeCacheKey(rawCacheKey);

    // 3. CHECK AUDIO STORE CACHE (CACHE HIT)
    const cacheExists = await defaultAudioStore.exists(cacheKey);
    if (cacheExists) {
      const audioUrl = defaultAudioStore.getPublicUrl(cacheKey);
      console.log(`[SARVAM TTS CACHE HIT] speaker="${speaker}" key="${cacheKey}" url="${audioUrl}"`);

      if (req.headers.get("accept")?.includes("audio/")) {
        const fileBuffer = await defaultAudioStore.get(cacheKey);
        if (fileBuffer) {
          return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
              "Content-Type": "audio/wav",
              "Content-Length": fileBuffer.length.toString(),
              "X-Cache": "HIT",
              "X-Audio-Url": audioUrl
            }
          });
        }
      }

      return NextResponse.json(
        { status: "success", audio_url: audioUrl, cached: true, cache_key: cacheKey, speaker },
        { headers: { "X-Cache": "HIT" } }
      );
    }

    // 4. CHECK IN-FLIGHT REQUESTS (CONCURRENT DEDUPLICATION) — Safe non-null handling
    const existingServerReq = inFlightServerRequests.get(cacheKey);
    if (existingServerReq) {
      console.log(`[SARVAM TTS IN-FLIGHT DEDUP] Waiting for active synthesis key="${cacheKey}"`);
      const result = await existingServerReq;
      return NextResponse.json(result, { headers: { "X-Cache": "HIT" } });
    }

    // 5. CACHE MISS — SYNTHESIZE VIA SARVAM API
    const apiKey = process.env.SARVAM_API || process.env.SARVAM_API_KEY;
    if (!apiKey) {
      console.error("[SARVAM TTS API Error] SARVAM_API key missing in environment");
      return NextResponse.json({ error: "SARVAM_API key is not configured on server" }, { status: 500 });
    }

    console.log(`[SARVAM TTS CALL] speaker="${speaker}" key="${cacheKey}" textLen=${cleanText.length}`);

    const synthesisPromise = (async () => {
      const response = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "api-subscription-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: [cleanText],
          model,
          speaker,
          target_language_code: languageCode,
          pace
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[SARVAM TTS API Error] HTTP ${response.status}: ${errorData}`);
        throw new Error(`Sarvam API returned HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      if (!data.audios || !Array.isArray(data.audios) || data.audios.length === 0 || !data.audios[0]) {
        throw new Error("Sarvam API returned empty audio response");
      }

      const base64Audio = data.audios[0];
      const audioBuffer = Buffer.from(base64Audio, "base64");

      if (audioBuffer.length < 100) {
        throw new Error("Sarvam API returned invalid or corrupted zero-byte audio payload");
      }

      // Save to production-safe audio store
      const audioUrl = await defaultAudioStore.put(cacheKey, audioBuffer, "audio/wav");
      console.log(`[SARVAM TTS CACHE SAVED] Key="${cacheKey}" Size=${audioBuffer.length} bytes Url="${audioUrl}"`);

      return { status: "success", audio_url: audioUrl, cached: false, cache_key: cacheKey, speaker };
    })();

    inFlightServerRequests.set(cacheKey, synthesisPromise);

    try {
      const result = await synthesisPromise;
      inFlightServerRequests.delete(cacheKey);

      if (req.headers.get("accept")?.includes("audio/")) {
        const fileBuffer = await defaultAudioStore.get(cacheKey);
        if (fileBuffer) {
          return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
              "Content-Type": "audio/wav",
              "Content-Length": fileBuffer.length.toString(),
              "X-Cache": "MISS",
              "X-Audio-Url": result.audio_url
            }
          });
        }
      }

      return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });

    } catch (err: unknown) {
      inFlightServerRequests.delete(cacheKey);
      const message = err instanceof Error ? err.message : "Sarvam TTS generation failed";
      console.error("[SARVAM TTS API Exception]", err);
      return NextResponse.json({ error: message }, { status: 500 });
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("[SARVAM TTS API Route Exception]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
