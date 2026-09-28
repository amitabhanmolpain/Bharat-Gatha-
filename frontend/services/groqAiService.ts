/**
 * Groq AI & Offline Fallback Ask Question Service for Bharat Gatha.
 *
 * Sends historical inquiries to the backend API when online, and transparently
 * delegates to offline AI services (Jolly Bhai / Guard Sentry) when offline.
 */

import { cacheCharacterAudio } from "./characterVoiceService";
import { networkService } from "./networkService";
import { getOfflineJollyAnswer } from "./offlineJollyBhaiService";
import { getOfflineGuardAnswer } from "./offlineGuardService";

export interface GameHistoricalContext {
  current_year?: number | string;
  era?: string;
  location?: string;
  ruler?: string;
  region?: string;
  campaign?: string;
  nearby_monuments?: string;
  historical_events?: string;
}

export interface HistoricalAskResult {
  answer: string;
  behavior: "normal" | "glowing" | "shaking";
  status?: string;
  punishment?: any;
}

export async function askHistoricalQuestionDetailed(
  question: string,
  context?: GameHistoricalContext,
  character?: string
): Promise<HistoricalAskResult> {
  const trimmed = question.trim();
  if (!trimmed) return { answer: "", behavior: "normal" };

  const char = (character || "jolly").toLowerCase();
  const backendUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
      : "http://localhost:5001";

  // Try Online API if network is available
  if (networkService.isOnline()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { controller.abort() }, 15000);

      const response = await fetch(`${backendUrl}/api/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
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

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.answer) {
          if (data.audio_base64 && char) {
            cacheCharacterAudio(char, data.answer, data.audio_base64);
          }

          const behavior: "normal" | "glowing" | "shaking" =
            data.behavior === "shaking" ? "shaking" : data.behavior === "glowing" ? "glowing" : "normal";

          return {
            answer: data.answer,
            behavior,
            status: data.status,
            punishment: data.punishment,
          };
        }
      }
    } catch (e) {
      console.warn("[Groq AI Notice]: Online request unavailable, switching to local offline AI fallback.", e);
    }
  }

  // Local Offline Service Fallback
  if (char === "guard" || char === "sentry") {
    const offlineGuardRes = getOfflineGuardAnswer(trimmed, context);
    return {
      answer: offlineGuardRes.answer,
      behavior: "normal",
      status: offlineGuardRes.status,
      punishment: offlineGuardRes.punishment,
    };
  }

  const offlineJollyRes = getOfflineJollyAnswer(trimmed, context);
  return {
    answer: offlineJollyRes.answer,
    behavior: offlineJollyRes.behavior,
    status: offlineJollyRes.status,
  };
}

export async function askHistoricalQuestion(
  question: string,
  context?: GameHistoricalContext,
  character?: string
): Promise<string> {
  const res = await askHistoricalQuestionDetailed(question, context, character);
  return res.answer;
}