/**
 * Offline Mughal Guard Sentry AI Service for Bharat Gatha.
 *
 * Implements deterministic sentry dialogues, 28-word limit, vulgarity filtering,
 * and punishment states matching backend guard_agent.py.
 */

export interface OfflineGuardResponse {
  answer: string;
  behavior?: string;
  character: string;
  character_name: string;
  status: string;
  punishment?: {
    title: string;
    subtitle: string;
    description: string;
  };
}

const VULGAR_WORDS = [
  "fuck", "shit", "bitch", "bastard", "asshole", "idiot", "stupid", "dumb",
  "crap", "dick", "pussy", "cunt", "damn", "slut", "whore", "fucker", "fucking",
  "madarchod", "bhenchod", "harami", "kutta", "chutiya", "saala", "bhosdike",
  "gaandu", "lodu", "kamina", "bewakoof", "ullu", "kamini", "mc", "bc"
];

export function getOfflineGuardAnswer(
  question: string,
  context?: { location?: string; ruler?: string }
): OfflineGuardResponse {
  const cleanQ = (question || "").trim().toLowerCase();

  // 1. Vulgarity & Abusive Language Filter
  const words = cleanQ.replace(/[,.!]/g, " ").split(/\s+/);
  if (words.some((w) => VULGAR_WORDS.includes(w)) || VULGAR_WORDS.some((v) => cleanQ.includes(v))) {
    return {
      status: "punish",
      character: "guard",
      character_name: "Amar Singh Gate Sentry",
      answer: "Insolent fool! Your tongue speaks treason in Emperor Shah Jahan's court! Throw this intruder in the dungeon!",
      punishment: {
        title: "SEIZED BY IMPERIAL GUARDS!",
        subtitle: "Insolent Intruder Punished",
        description: "You used disrespectful language at the royal gates of Agra Fort. The imperial sentries have bound you and dragged you to the dungeons!",
      },
    };
  }

  // 2. Off-topic Modern Query Rebuke
  if (
    cleanQ.includes("computer") ||
    cleanQ.includes("code") ||
    cleanQ.includes("python") ||
    cleanQ.includes("javascript") ||
    cleanQ.includes("internet")
  ) {
    return {
      status: "success",
      character: "guard",
      character_name: "Amar Singh Gate Sentry",
      answer: "Insolent intruder! Do not test my patience with foreign nonsense, or I will throw you in the dungeon!",
    };
  }

  // 3. Sentry Defenses & Ramparts Inquiries
  if (cleanQ.includes("gate") || cleanQ.includes("enter") || cleanQ.includes("pass")) {
    return {
      status: "success",
      character: "guard",
      character_name: "Amar Singh Gate Sentry",
      answer: "Halt! None may pass Amar Singh Gate without royal imperial decree. State your business before the citadel guards!",
    };
  }

  if (cleanQ.includes("shah jahan") || cleanQ.includes("emperor") || cleanQ.includes("court")) {
    return {
      status: "success",
      character: "guard",
      character_name: "Amar Singh Gate Sentry",
      answer: "His Imperial Majesty Emperor Shah Jahan rules from the Peacock Throne. Watch your step inside the Diwan-i-Aam!",
    };
  }

  // Default Commanding Sentry Response (Exactly 2 sentences)
  return {
    status: "success",
    character: "guard",
    character_name: "Amar Singh Gate Sentry",
    answer: "Keep your eyes forward and move carefully along the ramparts! Intruders seeking trouble will answer to my blade.",
  };
}
