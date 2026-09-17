import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { validateWorldDefinition } from "../../../ai-expedition/services/validator";
import { resolveDemoWorld } from "../../../ai-expedition/demo/resolver";

const AI_EXPEDITION_TEXT_MODEL = process.env.AI_EXPEDITION_TEXT_MODEL || "gemini-3.6-flash";

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

  if (!prompt || prompt.length < 3 || prompt.length > 500) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PROMPT", message: "Prompt must be between 3 and 500 characters." } },
      { status: 400 }
    );
  }

  // Check if prompt matches predefined SIH Historical Blueprint (e.g. Plassey 1757)
  const lowerPrompt = prompt.toLowerCase();
  const isPlasseyDemo = lowerPrompt.includes("plassey") ||
                        lowerPrompt.includes("trade to territory") ||
                        lowerPrompt.includes("bengal") ||
                        lowerPrompt.includes("1757") ||
                        lowerPrompt.includes("siraj") ||
                        lowerPrompt.includes("clive") ||
                        lowerPrompt.includes("jafar");

  if (isPlasseyDemo) {
    console.log(`Resolving Predefined SIH Historical Blueprint for: "${prompt}"...`);
    const world = resolveDemoWorld(prompt);

    return NextResponse.json({
      success: true,
      world: world,
      modelUsed: "sih-blueprint-engine-plassey-1757"
    });
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

    const systemPrompt = `You are a Senior Historical Game Designer for Bharat Gatha, an authentic 2.5D RPG set in Indian history.
Your task is to transform the user's historical request into a COMPLETE, PLAYABLE RPG WorldDefinition JSON.

STRICT JSON SCHEMA YOU MUST FOLLOW EXACTLY:
{
  "metadata": {
    "id": "exp_unique_id",
    "title": "Historical Title",
    "era": "Era Name",
    "year": "Specific Year or Period",
    "location": "Location Name",
    "summary": "Detailed narrative summary",
    "archetype": "INVESTIGATION"
  },
  "historicalContext": {
    "factualBackground": "Authentic historical background text",
    "keyFigures": ["Person 1", "Person 2"],
    "primarySourcesReferenced": ["Source 1"],
    "historicalMythsDebunked": ["Myth 1 debunked with historical evidence"]
  },
  "visualBible": {
    "artStyle": "Historical 2.5D Pixel RPG",
    "colorPalette": ["Sandstone", "Gold"],
    "architecturalStyle": "Indian Heritage Architecture",
    "lightingAtmosphere": "Warm Sunlit",
    "timeOfDay": "Day",
    "weather": "Clear"
  },
  "narratorOpening": "Dramatic opening text introducing the player to the historical scene.",
  "scenes": [
    {
      "id": "scene_1",
      "name": "Scene Name",
      "templateId": "bazaar",
      "visualDescription": "Detailed visual description",
      "imagePrompt": "Create a historically grounded 2.5D Indian RPG environment of a bazaar in Vijayanagara in 1500, warm golden sunlight, granite stone architecture, silk banners, no cars, no modern objects, no text, 2.5D side perspective",
      "npcs": [{ "npcId": "char_1", "x": 40, "y": 60 }],
      "objects": [{ "id": "obj_1", "name": "Clue Object", "interactionText": "Inspect Ledger", "clueId": "ev_1", "x": 60, "y": 70 }],
      "exits": [{ "id": "ex_1", "targetSceneId": "scene_2", "label": "Inner Courtyard", "triggerArea": { "minX": 85, "maxX": 100, "minY": 40, "maxY": 90 } }]
    }
  ],
  "characters": [
    {
      "id": "char_1",
      "name": "Character Name",
      "role": "Merchant",
      "personality": "Wise and cautious",
      "goal": "Explain local commerce",
      "knowledge": "Knows trade routes",
      "characterImagePrompt": "Create a 2.5D RPG character portrait of an ancient Indian merchant, period traditional tunic and turban, 1500 CE Vijayanagara style, game portrait",
      "dialogueTree": {
        "startNodeId": "n1",
        "nodes": {
          "n1": {
            "id": "n1",
            "speakerName": "Character Name",
            "text": "Welcome traveler.",
            "options": [
              { "id": "o1", "text": "Tell me about the market.", "nextDialogueId": null, "grantsEvidenceId": "ev_1" }
            ]
          }
        }
      }
    }
  ],
  "quests": [
    {
      "id": "q_1",
      "title": "Main Quest Title",
      "description": "Quest description",
      "objectives": [
        { "id": "obj_1", "description": "Talk to the character", "isCompleted": false },
        { "id": "obj_2", "description": "Solve the cipher", "isCompleted": false }
      ]
    }
  ],
  "evidence": [
    {
      "id": "ev_1",
      "title": "Evidence Title",
      "description": "Evidence description",
      "historicalFact": "Authentic historical fact",
      "questRelevance": "Proves key trade route",
      "sourceCitation": "Primary archive"
    }
  ],
  "puzzles": [
    {
      "id": "p_1",
      "title": "Historical Cipher",
      "question": "Which trade unit was standard?",
      "options": ["Option A", "Option B", "Option C"],
      "correctAnswerIndex": 1,
      "hint": "Think about traditional measures",
      "solvedExplanation": "Correct explanation"
    }
  ],
  "learningObjectives": ["Understand trade routes"],
  "expeditionEndingText": "Congratulations on completing the expedition!"
}

STRICT RULES:
1. Every scene MUST select a valid templateId from:
   ["palace_courtyard", "fort_gate", "fort_courtyard", "palace_interior", "throne_room", "corridor", "bazaar", "garden", "village_square", "archive", "temple_complex", "fort_rampart"]
2. Provide a specific, highly detailed 'imagePrompt' for EVERY scene and 'characterImagePrompt' for EVERY character incorporating the VisualBible details (era, location, lighting, 2.5D RPG perspective, no modern objects, no text).
3. DO NOT output any physics coordinates, walkable polygon boundaries, or collision math. The game engine exclusively controls physics.
4. Choose archetype from: ["INVESTIGATION", "HISTORICAL_MYSTERY", "EXPLORATION", "POLITICAL_INTRIGUE", "SURVIVAL", "HISTORICAL_MISSION", "RECONSTRUCTION", "DISCOVERY", "ARTIFACT_HUNT"]
5. Ensure historical facts are authentic and cite primary sources or archaeological evidence where possible.
6. Debunk at least one popular historical misconception in historicalContext.historicalMythsDebunked.
7. Design 2-3 connected scenes, 1-2 NPCs with dialogue trees, 1 main quest with 2 objectives, 1-2 evidence items, and 1 short puzzle (10-30s).
8. Return ONLY strict JSON adhering to the WorldDefinition structure. Do NOT wrap in markdown backticks.`;

    const userMessage = `Create a complete historical RPG expedition for this prompt: "${prompt}"`;

    console.log(`Calling Gemini API using model: ${AI_EXPEDITION_TEXT_MODEL}...`);
    const response = await ai.models.generateContent({
      model: AI_EXPEDITION_TEXT_MODEL,
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "";
    let parsed: Record<string, unknown>;
    try {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      console.error("Failed to parse Gemini JSON output:", responseText);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MALFORMED_AI_JSON",
            message: "Gemini API returned malformed or non-JSON output."
          }
        },
        { status: 422 }
      );
    }

    const validation = validateWorldDefinition(parsed);
    if (!validation.valid || !validation.world) {
      console.error("WorldDefinition validation failed:", validation.error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_WORLD_DEFINITION",
            message: `Generated world definition failed schema validation: ${validation.error}`
          }
        },
        { status: 422 }
      );
    }

    // Enforce dynamic unique ID for every AI-generated world definition
    validation.world.metadata.id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      world: validation.world,
      modelUsed: AI_EXPEDITION_TEXT_MODEL
    });

  } catch (error: unknown) {
    const errObj = error as { message?: string; status?: number };
    console.error(`Gemini Generation Error (${AI_EXPEDITION_TEXT_MODEL}):`, errObj?.message || error);
    const errString = String(errObj?.message || error || "");
    const status = errObj?.status || (errString.includes("429") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("quota") ? 429 : 500);

    if (status === 429 || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("quota")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TEXT_GENERATION_QUOTA_EXCEEDED",
            message: "Historical world generation is currently unavailable due to API quota limits."
          }
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GEMINI_API_FAILED",
          message: "Historical world generation failed."
        }
      },
      { status: status }
    );
  }
}
