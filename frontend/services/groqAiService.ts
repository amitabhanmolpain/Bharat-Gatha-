/**
 * Groq AI & LangChain Genie Agent Ask Question Service for Bharat Gatha.
 *
 * Sends historical inquiries to the backend which dispatches queries through
 * the LangChain Genie Agent (with strict historical guardrails) or Groq 'openai/gpt-oss-120b'.
 */

import { cacheCharacterAudio } from "./characterVoiceService";

export interface GameHistoricalContext {
  current_year?: number | string;
  era?: string;
  location?: string;
  ruler?: string;
  nearby_monuments?: string;
  historical_events?: string;
}

export interface HistoricalAskResult {
  answer: string;
  behavior: "normal" | "glowing" | "shaking";
}

export async function askHistoricalQuestionDetailed(
  question: string,
  context?: GameHistoricalContext,
  character?: string
): Promise<HistoricalAskResult> {
  const trimmed = question.trim();
  if (!trimmed) return { answer: "", behavior: "normal" };

  const backendUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
      : "http://localhost:5001";

  try {
    const char = character || "jolly";
    const response = await fetch(`${backendUrl}/api/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: trimmed,
        character: char,
        context: context || {
          current_year: 1653,
          era: "Mughal Empire",
          location: "Taj Mahal",
          ruler: "Emperor Shah Jahan",
        },
        model: "openai/gpt-oss-120b",
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Ask Question request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "success" || !data.answer) {
      throw new Error(data.message || "No answer received from historical chronicles.");
    }

    if (data.audio_base64 && char) {
      cacheCharacterAudio(char, data.answer, data.audio_base64);
    }

    const behavior: "normal" | "glowing" | "shaking" = 
      data.behavior === "shaking" ? "shaking" : data.behavior === "glowing" ? "glowing" : "normal";

    return {
      answer: data.answer,
      behavior,
    };
  } catch (error: any) {
    console.warn("Groq/LangChain Ask Question notice:", error?.message || error);
    return {
      answer: "Mere aaka! The magical astral scrolls are aligning with this historical era. Please ask me again in just a moment!",
      behavior: "normal"
    };
  }
}

export async function askHistoricalQuestion(
  question: string,
  context?: GameHistoricalContext,
  character?: string
): Promise<string> {
  const res = await askHistoricalQuestionDetailed(question, context, character);
  return res.answer;
}

