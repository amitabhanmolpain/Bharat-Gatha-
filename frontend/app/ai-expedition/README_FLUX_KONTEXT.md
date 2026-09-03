# FLUX.1 Kontext [dev] Integration — Bharat Gatha AI Historical Expedition

## 1. Overview
This module integrates **FLUX.1 Kontext [dev]** (`black-forest-labs/FLUX.1-Kontext-dev`) into the isolated **Bharat Gatha AI Historical Expedition** visual pipeline.

When an expedition generates a dynamic historical world, the visual generator synthesizes 2.5D RPG environment prompts which are sent to the FLUX image provider to generate high-resolution, period-accurate 16-bit pixel-art RPG scene backdrops.

---

## 2. Model & License Safety
* **Model Identifier:** `black-forest-labs/FLUX.1-Kontext-dev` (12 Billion Parameters)
* **Model License:** **FLUX.1 [dev] Non-Commercial License**
* **Developer Notice:**
  > ⚠️ **IMPORTANT:** FLUX.1 Kontext [dev] is provided under non-commercial terms. It is used here solely for prototype exploration. Any commercial deployment or public production release requires reviewing and complying with applicable licensing terms from Black Forest Labs.

---

## 3. Server Architecture & Security Boundary
* **Server-Side API Route:** `/ai-expedition/api/image/route.ts`
* **Secret Safety:** Credentials (`HF_TOKEN` / `FLUX_API_KEY`) are evaluated strictly server-side in `process.env`.
* **Zero Client Exposure:** `HF_TOKEN` is never sent to the browser, stored in `localStorage`, or bundled into client-side JS.
* **Separation of Visual Layer & Gameplay Physics:** FLUX generated images are used solely for the 2.5D visual background layer (`<img src="..." />`). Player collision, walkable boundaries, NPC spawn locations, and quest triggers remain 100% governed by deterministic scene archetype templates (`gate`, `courtyard`, `terrace`, `corridor`, `palace_interior`, `throne_hall`).

---

## 4. Execution Modes & Setup

### Mode A: Hosted Hugging Face Inference API (Recommended for Cloud / macOS)
1. Obtain an API Token from Hugging Face with access to `black-forest-labs/FLUX.1-Kontext-dev`.
2. Add your token to `frontend/.env.local`:
   ```bash
   HF_TOKEN=hf_**********************************
   ```
3. Restart Next.js dev server: `npm run dev`.

### Mode B: Local PyTorch / CUDA GPU Inference (NVIDIA GPU required)
1. Create an isolated Python environment (outside Git tracking):
   ```bash
   python3 -m venv .venv-flux
   source .venv-flux/bin/activate
   pip install torch diffusers transformers accelerate ftfy sentencepiece
   ```
2. Authenticate with Hugging Face CLI:
   ```bash
   huggingface-cli login
   ```
3. Launch local inference server:
   ```bash
   ENABLE_LOCAL_FLUX=true python3 app/ai-expedition/services/flux_server.py
   ```

### Mode C: Zero-Cost Fallback Mode (Default when GPU / API Keys are absent)
When neither `HF_TOKEN` nor local CUDA GPU infrastructure is detected, the engine gracefully utilizes the zero-cost archetype reference backdrop system (`provider: "flux-kontext-dev"`, `fallback: true`), ensuring zero application crashes.

---

## 5. Caching & Performance
* **Deterministic Visual Hashing (`cache.ts`):** `generateSceneHash` hashes scene historical era, region, archetype, and scene name to cache generated images in browser state.
* **Scene Preloading (`preloader.ts`):** Adjacent scene visual assets are preloaded upon entering a scene to maintain smooth 60 FPS transition performance.

---

## 6. Codebase Safety & File Isolation Audit
All files created or modified for this integration are strictly contained within `frontend/app/ai-expedition/`:
* `frontend/app/ai-expedition/types/visual.ts`
* `frontend/app/ai-expedition/services/imageProviders/fluxKontextProvider.ts`
* `frontend/app/ai-expedition/services/providers.ts`
* `frontend/app/ai-expedition/api/image/route.ts`
* `frontend/app/ai-expedition/README_FLUX_KONTEXT.md`

**Zero files modified outside `frontend/app/ai-expedition/`!**
