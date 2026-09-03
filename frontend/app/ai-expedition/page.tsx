"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllSavedWorlds } from "./services/storage";
import { WorldDefinition } from "./types/world";

export default function AIExpeditionPortal() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [savedWorlds, setSavedWorlds] = useState<WorldDefinition[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSavedWorlds(Object.values(getAllSavedWorlds()));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    router.push(`/ai-expedition/generate?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const samplePrompts = [
    "I want to explore Rajasthan during British rule.",
    "I want to experience Agra during 1857.",
    "Take me to Chittorgarh Fort during the British Residency period.",
  ];

  return (
    <div className="min-h-screen bg-[#0a0806] text-white flex flex-col items-center p-6 relative overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-12 border-b border-[#3a2d1d] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#91714b]">
            Bharat Gatha • Experimental Feature
          </span>
          <h1 className="text-3xl md:text-4xl font-serif text-[#e4c794] mt-1">
            AI Historical Expedition Generator
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/ai-expedition/flux-test"
            className="bg-[#251d16] hover:bg-[#3a2d1d] border border-[#483824] hover:border-[#91714b] text-[#e4c794] font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <span>🎨</span> FLUX Live Visual Test
          </Link>
          <Link
            href="/dashboard"
            className="bg-[#16120e] hover:bg-[#251d16] border border-[#483824] hover:border-[#91714b] text-[#e4c794] font-bold text-xs px-4 py-2.5 rounded-lg transition-all"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Input Form Section */}
      <div className="w-full max-w-3xl bg-[#16120e]/80 border border-[#3a2d1d] backdrop-blur-md p-8 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] mb-12">
        <h2 className="text-xl font-serif text-[#e4c794] mb-2">Create Your Historical Expedition</h2>
        <p className="text-sm text-[#a89985] mb-6 leading-relaxed">
          Type any historical era, location, or scenario. Our AI system synthesizes a playable 2.5D RPG world definition with historical quests, NPCs, and explorable environments.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'I want to explore Rajasthan during British rule.'"
              rows={3}
              className="w-full bg-[#0a0806] border-2 border-[#483824] focus:border-[#91714b] text-white placeholder-gray-500 rounded-xl p-4 text-base focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-xs text-[#91714b] font-bold self-center">Try prompt:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p)}
                className="text-xs bg-[#251d16] hover:bg-[#3a2d1d] text-[#e4c794] border border-[#483824] px-3 py-1.5 rounded-lg transition-all text-left"
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!prompt.trim()}
            className="w-full bg-[#91714b] hover:bg-[#a68257] disabled:opacity-50 text-black font-bold text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all"
          >
            Generate Playable Expedition ⚡
          </button>
        </form>
      </div>

      {/* Saved Expeditions Catalog */}
      {savedWorlds.length > 0 && (
        <div className="w-full max-w-5xl">
          <h3 className="text-lg font-serif text-[#e4c794] mb-4">Available Expeditions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedWorlds.map((world) => (
              <div
                key={world.worldId}
                className="bg-[#16120e]/60 border border-[#3a2d1d] p-6 rounded-xl flex flex-col justify-between hover:border-[#91714b] transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] uppercase font-bold text-[#91714b] tracking-wider">
                      {world.region} • {world.year}
                    </span>
                    <span className="text-xs bg-[#251d16] border border-[#483824] px-2 py-0.5 rounded text-[#e4c794]">
                      {Object.keys(world.scenes).length} Scenes
                    </span>
                  </div>
                  <h4 className="text-xl font-serif text-[#e4c794] mb-2">{world.title}</h4>
                  <p className="text-xs text-[#a89985] leading-relaxed mb-4">{world.summary}</p>
                </div>

                <Link
                  href={`/ai-expedition/play/${world.worldId}`}
                  className="w-full bg-[#251d16] hover:bg-[#3a2d1d] border border-[#483824] hover:border-[#91714b] text-[#e4c794] font-bold text-xs uppercase tracking-widest text-center py-3 rounded-lg transition-all"
                >
                  Play Expedition ▶
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
