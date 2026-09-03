# BHARAT GATHA — AI HISTORICAL EXPEDITION TECHNICAL DOCUMENTATION

## 1. Executive System Summary

The **AI Historical Expedition** is an isolated, autonomous feature in Bharat Gatha that dynamically generates interactive, educational 2.5D Indian History RPG scenarios from natural language prompts.

Unlike generic procedural RPGs, the AI Expedition operates on a **Historical Educational Framework**:
- Players explore authentic historical locations to discover primary evidence (charters, maps, inscriptions, documents).
- NPCs act as historical figures/eyewitnesses offering period context.
- Quests culminate in interactive historical reflection puzzles testing historical reasoning.
- Visual environments are dynamically rendered using **FLUX.1-Kontext-dev** and **Grok Imagine 2.0** models.

---

## 2. Technology Stack

| Layer | Technology | Function |
|-------|------------|----------|
| **Frontend Framework** | Next.js 16.3 (App Router, React 19, TypeScript) | Page routing, server-rendered API routes, client components |
| **Primary World LLM** | Google Gemini 3.6 Flash (`generativelanguage.googleapis.com`) | Generates structured JSON `WorldDefinition` from user prompts |
| **Primary Visual Model** | FLUX.1 Kontext [dev] (`black-forest-labs/FLUX.1-Kontext-dev`) | Generates 16:9 pixel-art historical background visuals via Hugging Face Inference API |
| **Secondary Visual Backup** | Grok Imagine 2.0 (`grok-imagine-image-2.0`) | High-res fallback visual generator via xAI REST API |
| **Guaranteed Visual Fallback** | Pre-rendered Static Archetype Templates | High-resolution curated static assets matching scene archetypes |
| **Client Storage Engine** | Custom IndexedDB (`ai_expedition_media_db`) + Memory Cache | Stores multi-megabyte base64 JPEG visual payloads without overflowing `localStorage` |
| **Game Engine** | HTML5 Canvas / CSS 2.5D Renderer + HTML5 Web APIs | 60 FPSWASD movement, depth scaling, collision bounds, NPC dialogue system |

---

## 3. End-to-End System Workflow

```
[User natural language prompt]
          │
          ▼
1.  GET /ai-expedition/generate?prompt="..."
          │
          ▼
2.  Google Gemini 3.6 Flash API
    └─ Generates structured WorldDefinition JSON
          │
          ▼
3.  WorldDefinition Validator & Sanitizer (services/validator.ts)
    ├─ Enforces strict JSON schema & geometry bounds
    └─ Strips base64 image strings from localStorage metadata (<5KB)
          │
          ▼
4.  Visual Provider Router (api/image/route.ts)
    ├─ Step 4a: Check IndexedDB / Memory Cache via MD5 Scene Hash Signature
    ├─ Step 4b: FLUX.1-Kontext-dev (Hugging Face Inference)
    ├─ Step 4c: Grok Imagine 2.0 (xAI API) [If FLUX fails or 429]
    └─ Step 4d: Static Archetype Template [If both fail or offline]
          │
          ▼
5.  Media Storage Engine (services/imageStorage.ts)
    └─ Saves image base64 data to IndexedDB (`ai_expedition_media_db`)
          │
          ▼
6.  Isolated Game Engine (components/IsolatedGameEngine.tsx)
    ├─ 60 FPS WASD / Arrow key movement loop
    ├─ Velocity vector normalization Math.hypot(dx, dy)
    ├─ 2.5D Y-axis player depth scaling
    ├─ Deterministic AABB collision boundaries
    ├─ Educational NPC dialogue & primary evidence banners
    ├─ Historical Codex / Knowledge Journal modal
    └─ End-of-quest Historical Reflection puzzle modal
```

---

## 4. Architecture & Key Service Modules

```
frontend/app/ai-expedition/
├── page.tsx                             # Main Portal (Prompt submission & historical expedition hub)
├── generate/page.tsx                    # Multi-stage loading & generation page
├── play/[worldId]/page.tsx              # Fullscreen 2.5D RPG Play page
├── flux-test/page.tsx                   # Diagnostic visual provider test suite
├── api/
│   ├── generate/route.ts                # Gemini LLM world generation endpoint
│   └── image/route.ts                   # Provider Router (FLUX -> Grok -> Static)
├── components/
│   ├── IsolatedGameEngine.tsx           # 60 FPS 2.5D RPG Engine core
│   ├── ExpeditionHUD.tsx                # Objectives tracker, scene location & codex trigger
│   ├── HistoricalCodexModal.tsx         # Interactive journal for evidence, figures & locations
│   └── HistoricalReflectionModal.tsx    # End-of-quest reflection puzzle & XP reward
├── services/
│   ├── prompts.ts                       # Educational LLM system prompt & prompt builder
│   ├── validator.ts                     # Robust JSON parser, geometry repair & fallback generator
│   ├── providers.ts                     # Client-side image provider orchestrator
│   ├── cache.ts                         # Scene signature generator & cache lookup
│   ├── imageStorage.ts                  # IndexedDB + In-Memory Base64 Media Storage
│   ├── storage.ts                       # Lightweight WorldDefinition persistence (<5KB)
│   ├── visualGenerator.ts               # Historical prompt builder for FLUX/Grok
│   └── referenceStyle.ts                # Visual directives & archetype fallback mappings
└── types/
    ├── world.ts                         # WorldDefinition, QuestDefinition & Scene interfaces
    └── visual.ts                        # Provider options & image generation types
```

---

## 5. Multi-Tier Image Provider Architecture

To guarantee 100% availability regardless of external AI quota states:

1. **FLUX.1 Kontext [dev] (Primary Live Provider):**
   - Transports requests over `@huggingface/inference` (`InferenceClient`).
   - Authenticated server-side via `HF_TOKEN`.
   - Generates authentic 16:9 pixel-art game background imagery.

2. **Grok Imagine 2.0 (Backup Live Provider):**
   - Activated automatically if FLUX encounters HTTP 429, timeout, or invalid response.
   - Authenticated server-side via `XAI_API_KEY`.

3. **Static Archetype Fallback (Offline Guarantee):**
   - If both live providers are unconfigured or offline, the router immediately maps the scene's archetype (`gate`, `courtyard`, `terrace`, `bazaar`, `palace_interior`, `throne_hall`, `corridor`, `merchant_warehouse`, `port`) to high-res handcrafted static assets.

---

## 6. Storage & Memory Architecture (Zero LocalStorage Quota Error)

Standard browser `localStorage` limits per domain are ~5MB. Storing 2-3 FLUX/Grok base64 JPEG images (~1MB each) in `localStorage` caused `QuotaExceededError`.

**Solution Implemented in `services/imageStorage.ts` & `services/storage.ts`:**
- **`storage.ts` (World Definition Store):** Sanitizes `WorldDefinition` before saving to `localStorage`. `backgroundImageUrl` fields containing base64 strings are extracted, replaced with lightweight hash signatures (`visualCacheKey`), reducing `localStorage` overhead per world to **< 5 KB**.
- **`imageStorage.ts` (Media Store):** Asynchronously persists multi-megabyte base64 JPEG strings in an **IndexedDB database (`ai_expedition_media_db`)** backed by an in-memory `Map<string, string>` cache.
- **Result:** Same-session navigation, page reloads, and browser restarts load images instantly with 0 storage errors.

---

## 7. Gameplay Mechanics & Historical Learning Quest System

1. **Normalized 2.5D Movement:**
   - Smooth 60 FPS WASD / Arrow key movement.
   - Velocity vector normalization (`Math.hypot(dx, dy)`) ensures diagonal movement (`W+D`) moves at identical speed to cardinal movement (`W`).
   - Y-axis depth scaling adjusts player sprite size smoothly between `minY` and `maxY`.

2. **Deterministic AABB Collision:**
   - Scene boundaries (`walkableBoundary`) and obstacle bounding boxes (`collisionObstacles`) restrict player movement strictly within valid walkable geometry.

3. **Historical Evidence & Dialogue System:**
   - Approaching an NPC within range (`interactionRadius`) displays `[E] Talk`. Dialogue offers educational period context.
   - Inspecting evidence markers displays a non-blocking banner detailing verified primary source facts.

4. **Historical Codex & Reflection Modal:**
   - **Historical Codex (HUD Button):** Displays discovered evidence, figures, insights, and location details in a clean tabbed modal.
   - **Historical Reflection Modal:** Triggered on stage completion. Presents 3-5 discovered insights and an interactive reasoning puzzle. Correct answers unlock `HISTORICAL INSIGHT UNLOCKED`.

---

## 8. API Specifications & Endpoints

### `POST /ai-expedition/api/generate`
- **Payload:** `{ "prompt": "surat port 17th century Mughal period" }`
- **Response:**
  ```json
  {
    "status": "success",
    "provider": "gemini-3.6-flash",
    "generationMode": "ai",
    "world": { "worldId": "...", "title": "...", "scenes": { ... } }
  }
  ```

### `POST /ai-expedition/api/image`
- **Payload:** `{ "world": { ... }, "scene": { ... }, "forceProvider": "flux" }`
- **Response:**
  ```json
  {
    "status": "success",
    "imageUrl": "data:image/jpeg;base64,...",
    "provider": "huggingface-inference-providers",
    "model": "black-forest-labs/FLUX.1-Kontext-dev",
    "generated": true,
    "cached": false,
    "fallback": false,
    "signature": "hash-sig-123"
  }
  ```

---

## 9. Security & Credentials Isolation

- `GEMINI_API_KEY`, `XAI_API_KEY`, and `HF_TOKEN` are accessed strictly on the Next.js server side.
- No API keys are exposed to the browser or embedded in client JS bundles.
- `frontend/.env.local` is verified ignored by Git (`git check-ignore frontend/.env.local`).
