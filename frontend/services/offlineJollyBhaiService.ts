/**
 * Offline Jolly Bhai (Genie Companion) AI Service for Bharat Gatha.
 *
 * Provides historical knowledge retrieval, spoiler guardrails, and Jolly Bhai persona responses
 * entirely offline without requiring external Groq API calls.
 */

import indusData from "../data/offline/indus.json";
import rajputanaData from "../data/offline/rajputana.json";
import mughalData from "../data/offline/mughal.json";
import vijayanagaraData from "../data/offline/vijayanagara.json";

export interface OfflineJollyResponse {
  answer: string;
  behavior: "normal" | "glowing" | "shaking";
  character: string;
  character_name: string;
  audio_url?: string;
  audio_base64?: string;
  status: string;
}

const ERA_DATA_MAP: { [key: string]: any } = {
  indus: indusData,
  rajputana: rajputanaData,
  rajasthan: rajputanaData,
  mughal: mughalData,
  vijayanagara: vijayanagaraData,
  vijaynagar: vijayanagaraData,
};

const SPOILER_PHRASES = [
  "why did the villagers leave",
  "why did they leave",
  "why abandoned",
  "who cursed kuldhara",
  "why kuldhara abandoned",
  "secret of kuldhara",
  "why did villagers go away",
  "reason for leaving",
];

export function getOfflineJollyAnswer(
  question: string,
  context?: { era?: string; region?: string; campaign?: string; location?: string }
): OfflineJollyResponse {
  const cleanQ = (question || "").trim().toLowerCase();
  const regionKey = (context?.region || context?.campaign || context?.era || "mughal").toLowerCase();

  let eraKey = "mughal";
  if (regionKey.includes("rajput") || regionKey.includes("rajasthan") || regionKey.includes("chittor")) {
    eraKey = "rajputana";
  } else if (regionKey.includes("vijayanagara") || regionKey.includes("hampi")) {
    eraKey = "vijayanagara";
  } else if (regionKey.includes("indus") || regionKey.includes("mohenjo")) {
    eraKey = "indus";
  }

  const eraData = ERA_DATA_MAP[eraKey] || mughalData;

  // 1. Kuldhara Spoiler Protection Check
  if (eraKey === "rajputana" && SPOILER_PHRASES.some((sp) => cleanQ.includes(sp))) {
    return {
      status: "success",
      answer: "That you have to find out, my aaka! Search the silent ruins, inspect the three clues, and uncover the mystery yourself.",
      behavior: "normal",
      character: "jolly",
      character_name: "Jolly Bhai",
    };
  }

  // 2. Keyword & Intent Matching
  const keywords = eraData.keywords || {};
  let matchedKeyword: string | null = null;
  let matchedFact: string | null = null;

  for (const kw of Object.keys(keywords)) {
    if (cleanQ.includes(kw.toLowerCase())) {
      matchedKeyword = kw;
      matchedFact = keywords[kw];
      break;
    }
  }

  if (matchedFact) {
    return {
      status: "success",
      answer: `✨ Mere aaka! ${matchedFact}`,
      behavior: "glowing",
      character: "jolly",
      character_name: "Jolly Bhai",
    };
  }

  // 3. General Historical Fallback (In-Character)
  const defaultLore = eraData.general_lore || "Mere aaka! Explore the magnificent monuments around you to uncover ancient secrets!";
  return {
    status: "success",
    answer: `${defaultLore} Feel free to inspect any historic relic or ask me about the monuments!`,
    behavior: "normal",
    character: "jolly",
    character_name: "Jolly Bhai",
  };
}
