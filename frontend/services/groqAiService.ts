/**
 * Groq AI & LangChain Genie Agent Ask Question Service for Bharat Gatha.
 *
 * Sends historical inquiries to the backend which dispatches queries through
 * the LangChain Genie Agent (with strict historical guardrails) or Groq 'openai/gpt-oss-120b'.
 */

export interface GameHistoricalContext {
  current_year?: number | string;
  era?: string;
  location?: string;
  ruler?: string;
  nearby_monuments?: string;
  historical_events?: string;
}

export async function askHistoricalQuestion(
  question: string,
  context?: GameHistoricalContext,
  character?: string
): Promise<string> {
  const trimmed = question.trim();
  if (!trimmed) return "";

  const backendUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
      : "http://localhost:5001";

  try {
    const response = await fetch(`${backendUrl}/api/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: trimmed,
        character: character || "jolly",
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

    return data.answer;
  } catch (error: any) {
    console.error("Groq/LangChain Ask Question error:", error);
    throw error;
  }
}
