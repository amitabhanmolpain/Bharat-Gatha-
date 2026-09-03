"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SceneDefinition, WorldDefinition } from "../types/world";

interface ImageResultState {
  imageUrl: string;
  provider: string;
  model?: string;
  generated?: boolean;
  cached?: boolean;
  fallback?: boolean;
  isFallback?: boolean;
  signature?: string;
  message?: string;
  byteSize?: number;
}

export default function FluxLiveTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTestName, setActiveTestName] = useState<string>("");
  const [sceneAResult, setSceneAResult] = useState<ImageResultState | null>(null);
  const [sceneBResult, setSceneBResult] = useState<ImageResultState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Preset Historical Scenes (Constructed locally to avoid consuming Gemini free-tier quota)
  const dummyWorldA: WorldDefinition = {
    worldId: "expedition-surat-warehouse",
    title: "Surat — Mughal Port Warehouse",
    summary: "Investigation of Surat port merchant warehouses during late 17th century.",
    historicalEra: "Late 17th Century Mughal Era",
    year: 1680,
    region: "Surat",
    userPrompt: "Surat port merchant warehouse",
    createdAt: new Date().toISOString(),
    initialSceneId: "scene-a",
    quest: {
      id: "q1",
      title: "Surat Customs Ledger",
      type: "investigation",
      objective: "Locate hidden merchant trading ledger",
      historicalEra: "Mughal",
      year: 1680,
      location: "Surat Port",
      cluesRequired: 1,
      stages: [],
      rewardXp: 500,
    },
    scenes: {},
    kinematics: { baseScale: 0.85, scaleRange: 0.3, minY: 40, maxY: 85, speed: 0.35 },
  };

  const sceneA: SceneDefinition = {
    id: "scene-a",
    name: "Surat Port Merchant Warehouse District",
    archetype: "courtyard",
    historicalPeriod: "Late 17th-century Mughal Surat port warehouse district",
    locationName: "Old Surat Port Docklands",
    backgroundImageUrl: "/bg-chittorgarh-courtyard.jpg",
    playerSpawn: { x: 50, y: 80 },
    walkableBoundary: { minX: 10, maxX: 90, minY: 40, maxY: 90 },
    collisionObstacles: [],
    exits: [],
    npcs: [],
    clues: [],
  };

  const dummyWorldB: WorldDefinition = {
    ...dummyWorldA,
    worldId: "expedition-surat-customs",
    title: "Surat — Mughal Riverside Customs",
  };

  const sceneB: SceneDefinition = {
    id: "scene-b",
    name: "Surat Riverside Customs House & Docks",
    archetype: "terrace",
    historicalPeriod: "Late 17th-century Mughal Surat customs house along Tapi river",
    locationName: "Tapi River Customs Post",
    backgroundImageUrl: "/bg-kumbhalgarh-wall-top.jpg",
    playerSpawn: { x: 50, y: 80 },
    walkableBoundary: { minX: 10, maxX: 90, minY: 40, maxY: 90 },
    collisionObstacles: [],
    exits: [],
    npcs: [],
    clues: [],
  };

  const executeSceneGeneration = async (
    targetScene: "sceneA" | "sceneB",
    testLabel: string,
    forceProvider?: string
  ) => {
    setIsLoading(true);
    setActiveTestName(testLabel);
    setErrorMessage(null);

    const worldObj = targetScene === "sceneA" ? dummyWorldA : dummyWorldB;
    const sceneObj = targetScene === "sceneA" ? sceneA : sceneB;

    try {
      const apiRes = await fetch("/ai-expedition/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ world: worldObj, scene: sceneObj, forceProvider }),
      });

      if (!apiRes.ok) {
        throw new Error(`API returned HTTP ${apiRes.status}`);
      }

      const res = await apiRes.json();

      const byteSize = res.imageUrl && res.imageUrl.startsWith("data:")
        ? Math.round((res.imageUrl.length * 3) / 4)
        : undefined;

      const statePayload: ImageResultState = {
        imageUrl: res.imageUrl,
        provider: res.provider,
        model: res.model || "black-forest-labs/FLUX.1-Kontext-dev",
        generated: res.generated,
        cached: res.cached,
        fallback: res.fallback,
        isFallback: res.isFallback,
        message: res.message,
        byteSize,
      };

      if (targetScene === "sceneA") {
        setSceneAResult(statePayload);
      } else {
        setSceneBResult(statePayload);
      }
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Image generation failed: ${errStr}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0806] text-white flex flex-col items-center p-6 font-sans">
      {/* Header Bar */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 border-b border-[#3a2d1d] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#91714b]">
            AI Expedition • Visual Pipeline Verification
          </span>
          <h1 className="text-3xl font-serif text-[#e4c794] mt-1">
            FLUX & Grok Imagine Live Visual Test
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/ai-expedition"
            className="bg-[#16120e] hover:bg-[#251d16] border border-[#483824] hover:border-[#91714b] text-[#e4c794] font-bold text-xs px-4 py-2.5 rounded-lg transition-all"
          >
            ← AI Expedition Portal
          </Link>
        </div>
      </div>

      {/* Control Buttons Panel */}
      <div className="w-full max-w-5xl bg-[#16120e] border border-[#3a2d1d] p-6 rounded-2xl mb-8 shadow-xl">
        <h2 className="text-lg font-serif text-[#e4c794] mb-2">Live Inference Controls</h2>
        <p className="text-xs text-[#a89985] mb-6">
          Test real FLUX.1 Kontext [dev] & Grok Imagine image providers, deterministic visual caching, and static archetype fallback.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => executeSceneGeneration("sceneA", "Test 1 — Scene A (FLUX Primary)")}
            disabled={isLoading}
            className="bg-[#91714b] hover:bg-[#a68257] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider py-3.5 px-3 rounded-xl transition-all shadow-md"
          >
            1. Generate Scene A (FLUX) 🎨
          </button>

          <button
            onClick={() => executeSceneGeneration("sceneA", "Test 2 — Scene A (Cache Test)")}
            disabled={isLoading || !sceneAResult}
            className="bg-[#251d16] hover:bg-[#3a2d1d] disabled:opacity-40 border border-[#483824] hover:border-[#91714b] text-[#e4c794] font-bold text-xs uppercase tracking-wider py-3.5 px-3 rounded-xl transition-all"
          >
            2. Request Scene A (Cache) ⚡
          </button>

          <button
            onClick={() => executeSceneGeneration("sceneB", "Test 3 — Scene B (FLUX Unique)")}
            disabled={isLoading}
            className="bg-[#91714b] hover:bg-[#a68257] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider py-3.5 px-3 rounded-xl transition-all shadow-md"
          >
            3. Generate Scene B (FLUX) 🏛️
          </button>

          <button
            onClick={() => executeSceneGeneration("sceneB", "Test 4 — Scene B (Cache Test)")}
            disabled={isLoading || !sceneBResult}
            className="bg-[#251d16] hover:bg-[#3a2d1d] disabled:opacity-40 border border-[#483824] hover:border-[#91714b] text-[#e4c794] font-bold text-xs uppercase tracking-wider py-3.5 px-3 rounded-xl transition-all"
          >
            4. Request Scene B (Cache) ⚡
          </button>

          <button
            onClick={() => executeSceneGeneration("sceneA", "Test 5 — Grok Imagine Provider", "grok")}
            disabled={isLoading}
            className="bg-[#3a2d1d] hover:bg-[#483824] disabled:opacity-40 border border-[#91714b] text-[#e4c794] font-bold text-xs uppercase tracking-wider py-3.5 px-3 rounded-xl transition-all"
          >
            5. Test Grok Imagine 🤖
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-6 bg-amber-950/60 border border-amber-700/80 text-amber-200 p-4 rounded-xl text-xs flex items-center gap-3 animate-pulse">
            <span className="text-base">⏳</span>
            <div>
              <p className="font-bold">{activeTestName}</p>
              <p className="opacity-90">GENERATING HISTORICAL ENVIRONMENT... Synthesizing 2.5D background via AI provider router...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-6 bg-red-950/70 border border-red-800 text-red-300 p-4 rounded-xl text-xs flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Visual Renderings Display Section */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Scene A Card */}
        <div className="bg-[#16120e] border border-[#3a2d1d] p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#91714b] uppercase tracking-wider">
                Scene A • Merchant Warehouse
              </span>
              {sceneAResult && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                    sceneAResult.cached
                      ? "bg-blue-950/80 border-blue-600 text-blue-300"
                      : sceneAResult.provider === "grok"
                      ? "bg-amber-950/80 border-amber-600 text-amber-300"
                      : sceneAResult.generated
                      ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                      : "bg-gray-900 border-gray-700 text-gray-400"
                  }`}
                >
                  {sceneAResult.cached
                    ? "✓ CACHE HIT"
                    : sceneAResult.provider === "grok"
                    ? "✓ GROK IMAGINE GENERATED"
                    : sceneAResult.generated
                    ? "✓ REAL FLUX IMAGE GENERATED"
                    : "⚠️ STATIC ARCHETYPE BACKDROP"}
                </span>
              )}
            </div>

            <h3 className="text-lg font-serif text-[#e4c794] mb-3">
              Surat Port Merchant Warehouse District
            </h3>

            {sceneAResult ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#483824] bg-black mb-4 shadow-lg">
                <img
                  src={sceneAResult.imageUrl}
                  alt="Scene A Historical Environment"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl border border-dashed border-[#483824] bg-[#0a0806]/60 flex items-center justify-center text-xs text-gray-500 mb-4">
                Click &quot;1. Generate Scene A (FLUX)&quot; to view image
              </div>
            )}
          </div>

          {sceneAResult && (
            <div className="text-[11px] text-[#a89985] bg-[#0a0806] p-3 rounded-lg border border-[#251d16] space-y-1 font-mono">
              <p><span className="text-gray-400">Provider:</span> {sceneAResult.provider}</p>
              <p><span className="text-gray-400">Model:</span> {sceneAResult.model}</p>
              <p>
                <span className="text-gray-400">Status:</span>{" "}
                {sceneAResult.cached ? "Cached (0s provider latency)" : sceneAResult.generated ? "Generated" : "Fallback"}
              </p>
              {sceneAResult.message && (
                <p className="text-amber-300 opacity-90"><span className="text-gray-400">Message:</span> {sceneAResult.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Scene B Card */}
        <div className="bg-[#16120e] border border-[#3a2d1d] p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#91714b] uppercase tracking-wider">
                Scene B • Riverside Customs
              </span>
              {sceneBResult && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                    sceneBResult.cached
                      ? "bg-blue-950/80 border-blue-600 text-blue-300"
                      : sceneBResult.provider === "grok"
                      ? "bg-amber-950/80 border-amber-600 text-amber-300"
                      : sceneBResult.generated
                      ? "bg-purple-950/80 border-purple-600 text-purple-300"
                      : "bg-gray-900 border-gray-700 text-gray-400"
                  }`}
                >
                  {sceneBResult.cached
                    ? "✓ CACHE HIT"
                    : sceneBResult.provider === "grok"
                    ? "✓ GROK IMAGINE GENERATED"
                    : sceneBResult.generated
                    ? "✓ SECOND UNIQUE FLUX IMAGE GENERATED"
                    : "⚠️ STATIC ARCHETYPE BACKDROP"}
                </span>
              )}
            </div>

            <h3 className="text-lg font-serif text-[#e4c794] mb-3">
              Surat Riverside Customs House & Docks
            </h3>

            {sceneBResult ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#483824] bg-black mb-4 shadow-lg">
                <img
                  src={sceneBResult.imageUrl}
                  alt="Scene B Historical Environment"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl border border-dashed border-[#483824] bg-[#0a0806]/60 flex items-center justify-center text-xs text-gray-500 mb-4">
                Click &quot;3. Generate Scene B (FLUX)&quot; to view image
              </div>
            )}
          </div>

          {sceneBResult && (
            <div className="text-[11px] text-[#a89985] bg-[#0a0806] p-3 rounded-lg border border-[#251d16] space-y-1 font-mono">
              <p><span className="text-gray-400">Provider:</span> {sceneBResult.provider}</p>
              <p><span className="text-gray-400">Model:</span> {sceneBResult.model}</p>
              <p>
                <span className="text-gray-400">Status:</span>{" "}
                {sceneBResult.cached ? "Cached (0s provider latency)" : sceneBResult.generated ? "Generated" : "Fallback"}
              </p>
              {sceneBResult.message && (
                <p className="text-amber-300 opacity-90"><span className="text-gray-400">Message:</span> {sceneBResult.message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Technical Verification Collapsible Panel */}
      <div className="w-full max-w-5xl bg-[#16120e] border border-[#3a2d1d] rounded-2xl p-6">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex justify-between items-center text-left text-sm font-serif text-[#e4c794] focus:outline-none"
        >
          <span>🛠️ Technical Verification Audit Log</span>
          <span>{showTechnicalDetails ? "▲ Hide Details" : "▼ Show Details"}</span>
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 pt-4 border-t border-[#3a2d1d] text-xs font-mono text-[#a89985] space-y-2">
            <p><span className="text-[#91714b]">Image Provider Router:</span> FLUX (Primary) → Grok Imagine (Backup AI) → Static Archetype (Fallback)</p>
            <p><span className="text-[#91714b]">Grok Model Identifier:</span> grok-imagine-image-2.0</p>
            <p><span className="text-[#91714b]">FLUX Model Identifier:</span> black-forest-labs/FLUX.1-Kontext-dev</p>
            <p><span className="text-[#91714b]">Server Secret Isolation:</span> GEMINI_API_KEY, XAI_API_KEY & HF_TOKEN accessed strictly inside Next.js server API routes</p>
            {sceneAResult && (
              <p><span className="text-[#91714b]">Scene A Metadata:</span> provider={sceneAResult.provider}, model={sceneAResult.model}, generated={String(sceneAResult.generated)}, cached={String(sceneAResult.cached)}, fallback={String(sceneAResult.fallback)}</p>
            )}
            {sceneBResult && (
              <p><span className="text-[#91714b]">Scene B Metadata:</span> provider={sceneBResult.provider}, model={sceneBResult.model}, generated={String(sceneBResult.generated)}, cached={String(sceneBResult.cached)}, fallback={String(sceneBResult.fallback)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
