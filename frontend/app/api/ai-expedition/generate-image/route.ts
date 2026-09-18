import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

export async function POST(req: Request) {
  let prompt = "";
  try {
    const body = await req.json();
    prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_REQUEST_BODY", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  if (!prompt || prompt.length < 3 || prompt.length > 1000) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PROMPT", message: "Image prompt must be between 3 and 1000 characters." } },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from server environment.");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_API_KEY",
          message: "GEMINI_API_KEY is not configured in server environment. Please set GEMINI_API_KEY in .env.local."
        }
      },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    console.log(`Calling Gemini Image Generation Model (${GEMINI_IMAGE_MODEL})... Prompt snippet: "${prompt.substring(0, 60)}..."`);
    
    // Call Gemini Image Model
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ]
    });

    // Extract image binary / inlineData from response candidates
    let imageBase64 = "";
    let mimeType = "image/png";

    if (response.candidates && response.candidates.length > 0) {
      for (const candidate of response.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              imageBase64 = part.inlineData.data;
              mimeType = part.inlineData.mimeType || "image/png";
              break;
            }
          }
        }
        if (imageBase64) break;
      }
    }

    if (!imageBase64) {
      console.error(`Gemini model ${GEMINI_IMAGE_MODEL} did not return binary image data.`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_IMAGE_DATA_RETURNED",
            message: "AI image generation is unavailable for this project."
          }
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      base64: imageBase64,
      mimeType,
      modelUsed: GEMINI_IMAGE_MODEL
    });

  } catch (error: unknown) {
    const errObj = error as { message?: string; status?: number };
    console.error(`Gemini Image Generation Error (${GEMINI_IMAGE_MODEL}):`, errObj?.message || error);
    
    const errString = String(errObj?.message || error || "");
    const status = errObj?.status || (errString.includes("429") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("quota") ? 429 : 500);

    if (status === 429 || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("quota")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "IMAGE_GENERATION_QUOTA_EXCEEDED",
            message: "AI image generation is currently unavailable due to API quota limits."
          }
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "IMAGE_GENERATION_FAILED",
          message: "AI image generation failed."
        }
      },
      { status: status }
    );
  }
}
