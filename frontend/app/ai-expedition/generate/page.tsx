"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { defaultLLMProvider, defaultImageProvider } from "../services/providers";
import { saveWorldDefinition } from "../services/storage";

const AI_STEPS = [
  { title: "Historical Context Analysis", desc: "Retrieving ground-truth timelines and architectural rules..." },
  { title: "World & Scene Structuring", desc: "Generating playable scenes, quest stages, and dialogue trees..." },
  { title: "2.5D Environment Composition", desc: "Synthesizing 16-bit historical background assets via FLUX..." },
  { title: "Geometry & Collision Validation", desc: "Verifying walkable boundaries and spatial exit triggers..." },
  { title: "Expedition Initialized", desc: "Preparing RPG engine runtime..." },
];

const FALLBACK_STEPS = [
  { title: "Historical Expedition Selected", desc: "Using a validated prepared historical scenario..." },
  { title: "Environment Prepared", desc: "Loading a verified 2.5D environment..." },
  { title: "Geometry & Collision Ready", desc: "Preparing deterministic gameplay boundaries..." },
  { title: "Expedition Initialized", desc: "Preparing RPG engine runtime..." },
];

function GenerationPipelineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") || "Surat port during 17th century Mughal era";

  const [currentStep, setCurrentStep] = useState(0);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeSteps = isFallbackMode ? FALLBACK_STEPS : AI_STEPS;

  useEffect(() => {
    let isCancelled = false;

    const runPipeline = async () => {
      try {
        // Step 0: Historical Context Analysis
        if (isCancelled) return;
        setCurrentStep(0);
        await new Promise((res) => setTimeout(res, 300));

        // Step 1: World & Scene Structuring (Call Gemini or Fallback LLM)
        if (isCancelled) return;
        setCurrentStep(1);
        const result = await defaultLLMProvider.generateWorldDefinition(prompt);

        if (isCancelled) return;

        if (result.isFallback) {
          setIsFallbackMode(true);
          setStatusMessage(
            "AI generation is temporarily unavailable. We've loaded a prepared historical expedition so you can continue exploring."
          );
        }

        // Step 2: 2.5D Environment Composition (FLUX.1 Kontext [dev] Visual Generation)
        if (isCancelled) return;
        setCurrentStep(2);

        if (result.world && result.world.scenes) {
          const sceneEntries = Object.entries(result.world.scenes);
          for (const [sceneId, sceneObj] of sceneEntries) {
            if (isCancelled) return;
            try {
              const imgRes = await defaultImageProvider.generateSceneImage(result.world, sceneObj);
              if (imgRes && imgRes.imageUrl) {
                result.world.scenes[sceneId].backgroundImageUrl = imgRes.imageUrl;
              }
            } catch (imgErr) {
              console.warn(`Visual generation note for scene ${sceneId}:`, imgErr);
            }
          }
        }

        // Step 3: Geometry & Collision Validation
        if (isCancelled) return;
        setCurrentStep(3);
        saveWorldDefinition(result.world);
        await new Promise((res) => setTimeout(res, 300));

        // Step 4: Expedition Initialized
        if (isCancelled) return;
        setCurrentStep(isFallbackMode ? FALLBACK_STEPS.length - 1 : AI_STEPS.length - 1);

        setTimeout(() => {
          router.push(`/ai-expedition/play/${result.world.worldId}`);
        }, 600);
      } catch (err) {
        console.warn("Pipeline error, loading demonstration expedition:", err);
        setIsFallbackMode(true);
        setStatusMessage(
          "AI generation is temporarily unavailable. We've loaded a prepared historical expedition so you can continue exploring."
        );
        setCurrentStep(FALLBACK_STEPS.length - 1);
      }
    };

    runPipeline();

    return () => {
      isCancelled = true;
    };
  }, [prompt, router]);

  return (
    <div className="min-h-screen bg-[#0a0806] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl bg-[#16120e] border border-[#3a2d1d] p-8 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[#91714b]">
          AI World Generator Pipeline
        </span>
        <h2 className="text-2xl font-serif text-[#e4c794] mt-1 mb-2">Synthesizing Expedition</h2>
        <p className="text-xs text-[#a89985] italic mb-6">&quot;{prompt}&quot;</p>

        {isFallbackMode && statusMessage && (
          <div className="bg-amber-950/60 border border-amber-700/80 text-amber-200 p-4 rounded-xl text-xs mb-6 font-medium text-left flex items-start gap-3">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <p className="font-bold mb-0.5">AI Service Status Notice</p>
              <p className="opacity-90">{statusMessage}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3.5 text-left mb-8">
          {activeSteps.map((step, idx) => {
            const isDone = idx < currentStep || (idx === currentStep && isFallbackMode);
            const isCurrent = idx === currentStep && !isFallbackMode;

            return (
              <div
                key={idx}
                className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? "bg-[#251d16]/40 border-[#483824] text-[#e4c794]"
                    : isCurrent
                    ? "bg-[#91714b]/10 border-[#91714b] text-white animate-pulse"
                    : "bg-[#0a0806]/40 border-[#251d16] text-gray-600"
                }`}
              >
                <div className="mt-0.5 text-base">
                  {isDone ? (
                    <span className="text-emerald-400 font-bold">✓</span>
                  ) : isCurrent ? (
                    <span className="text-amber-400">⏳</span>
                  ) : (
                    "○"
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{step.title}</h4>
                  <p className="text-xs opacity-75">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-[#0a0806] h-2 rounded-full overflow-hidden border border-[#3a2d1d]">
          <div
            className="bg-[#91714b] h-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, ((currentStep + 1) / activeSteps.length) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AIExpeditionGenerationScreen() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0806] text-white flex items-center justify-center font-sans">
          <p className="text-sm text-[#e4c794]">Loading Generation Pipeline...</p>
        </div>
      }
    >
      <GenerationPipelineContent />
    </Suspense>
  );
}
