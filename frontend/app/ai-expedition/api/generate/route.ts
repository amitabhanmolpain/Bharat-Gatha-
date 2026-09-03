import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildPrompt } from "../../services/prompts";
import { parseAndValidateWorld } from "../../services/validator";
import { MockLLMProvider } from "../../services/providers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { status: "error", message: "Invalid or empty prompt provided." },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const mockProvider = new MockLLMProvider();

    let geminiQuotaExceeded = false;
    let geminiFailureType = "provider_error";
    let geminiAttempted = false;

    // 1. Primary Strategy: Google Gemini API (gemini-3.6-flash)
    if (geminiKey) {
      geminiAttempted = true;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${SYSTEM_PROMPT}\n\n${buildPrompt(prompt)}` }],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const rawMsg = String(errData.error?.message || "");

            if (res.status === 429 || rawMsg.includes("429") || rawMsg.includes("quota") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
              geminiQuotaExceeded = true;
              geminiFailureType = "quota_exceeded";
              console.warn("[Gemini API] Quota limit reached (HTTP 429). Switching to backup provider.");
              break;
            }

            if (res.status === 401 || res.status === 403) {
              geminiFailureType = "authentication_error";
              console.warn("[Gemini API] Authentication error (HTTP", res.status, ")");
              break;
            }

            if (res.status === 404) {
              geminiFailureType = "model_unavailable";
              console.warn("[Gemini API] Model endpoint unavailable (HTTP 404)");
              break;
            }

            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!content) throw new Error("Empty response content");

          const validatedWorld = parseAndValidateWorld(content, prompt);
          return NextResponse.json({
            status: "success",
            world: validatedWorld,
            provider: "gemini-3.6-flash",
            generationMode: "ai",
          });
        } catch (err) {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          console.warn(`Gemini API attempt ${attempt} failed:`, errorObj.message);

          if (geminiQuotaExceeded) break;
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }
    }

    // 2. Secondary Strategy: OpenAI API (gpt-4o-mini) with 25-second timeout
    if (openaiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: buildPrompt(prompt) },
            ],
            temperature: 0.7,
            max_tokens: 2500,
          }),
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const validatedWorld = parseAndValidateWorld(content, prompt);
            return NextResponse.json({
              status: "success",
              world: validatedWorld,
              provider: "openai-gpt-4o-mini",
              generationMode: "ai",
            });
          }
        }
      } catch (err) {
        console.error("OpenAI Generation failed:", err instanceof Error ? err.message : String(err));
      }
    }

    // 3. Offline / Unconfigured Fallback
    const fallbackResult = await mockProvider.generateWorldDefinition(prompt);
    const friendlyMessage = geminiAttempted
      ? geminiQuotaExceeded
        ? "AI generation is temporarily unavailable. We've loaded a prepared historical expedition so you can continue exploring."
        : "AI service connection offline. Loaded a prepared historical expedition."
      : "AI generation key not configured. Loaded a prepared historical expedition.";

    return NextResponse.json({
      status: "fallback",
      world: fallbackResult.world,
      provider: "mock_fallback",
      generationMode: "fallback",
      errorType: geminiAttempted ? geminiFailureType : "key_not_configured",
      message: friendlyMessage,
    });
  } catch (globalErr) {
    console.error("Server API handler error:", globalErr);
    return NextResponse.json(
      { status: "error", message: "Server error handling generation request." },
      { status: 500 }
    );
  }
}
