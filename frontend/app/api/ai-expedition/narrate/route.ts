import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
    }

    const apiKey = process.env.SARVAM_API;
    if (!apiKey) {
      console.error("[SARVAM TTS API Error] SARVAM_API environment variable is missing on server");
      return NextResponse.json({ error: "SARVAM_API key is not configured on server" }, { status: 500 });
    }

    // Server-side text sanitization & normalization
    let cleanText = text;
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

    // Limit text length to 2000 characters to stay within Sarvam REST API limit
    if (cleanText.length > 2000) {
      cleanText = cleanText.slice(0, 2000);
    }

    // Request Sarvam AI Bulbul v3 Text-to-Speech API
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: [cleanText],
        model: "bulbul:v3",
        speaker: "ratan",
        target_language_code: "en-IN",
        pace: 0.95
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[SARVAM TTS API Error] HTTP ${response.status}: ${errorData}`);
      return NextResponse.json(
        { error: `Sarvam API returned HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.audios || !Array.isArray(data.audios) || data.audios.length === 0 || !data.audios[0]) {
      console.error("[SARVAM TTS API Error] Response did not contain valid audio array:", data);
      return NextResponse.json({ error: "Sarvam API returned empty audio response" }, { status: 502 });
    }

    const base64Audio = data.audios[0];
    const audioBuffer = Buffer.from(base64Audio, "base64");

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400"
      }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("[SARVAM TTS API Route Exception]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
