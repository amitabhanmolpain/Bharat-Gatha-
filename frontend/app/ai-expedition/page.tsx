"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WorldDefinition } from "./types/expedition";
import { ExpeditionStorage } from "./services/storage";
import { geminiImageProvider } from "./services/geminiImageProvider";
import ExpeditionError from "./components/ExpeditionError";
import { narrationManager } from "./services/narrationManager";

const SAMPLE_PROMPTS = [
  "From Trade to Territory — Battle of Plassey",
  "I want to investigate Delhi during the Revolt of 1857.",
  "I want to explore Vijayanagara in 1500.",
  "I want to experience the construction of the Taj Mahal.",
  "I want to explore Rajasthan during British rule."
];

export default function AIExpeditionGeneratorPage() {
  const [promptInput, setPromptInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [recentWorlds, setRecentWorlds] = useState<WorldDefinition[]>([]);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      setRecentWorlds(ExpeditionStorage.getRecentWorlds());
    }, 0);
  }, []);

  const handleGenerate = async (queryToUse?: string) => {
    narrationManager.unlockAudio();
    const finalPrompt = (queryToUse || promptInput).trim();
    if (!finalPrompt || finalPrompt.length < 3 || finalPrompt.length > 500) {
      setErrorMessage("Prompt must be between 3 and 500 characters.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setGenerationStage(1); // 1. UNDERSTANDING HISTORY (GEMINI TEXT)

    try {
      // Step 1: Call Gemini Text API Model (gemini-3.6-flash)
      const res = await fetch("/api/ai-expedition/generate-world", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt })
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.world) {
        const errorMsg = data?.error?.message || "Historical world generation failed.";
        setIsGenerating(false);
        setGenerationStage(0);
        router.push(`/ai-expedition/error?message=${encodeURIComponent(errorMsg)}`);
        return;
      }

      const world = data.world;
      const worldId = world.metadata.id;

      setGenerationStage(2); // 2. CREATING HISTORICAL WORLD

      // Step 2: Call Gemini Nano Banana 2 (gemini-3.1-flash-image) for EVERY required scene
      setGenerationStage(3); // 3. GENERATING SCENE ARTWORK
      for (let i = 0; i < world.scenes.length; i++) {
        const scene = world.scenes[i];
        const sceneRes = await geminiImageProvider.getSceneImage(worldId, scene.id, scene.imagePrompt);
        if (!sceneRes.success || !sceneRes.objectUrl) {
          const errorMsg = sceneRes.error || "AI image generation is unavailable for this project.";
          setIsGenerating(false);
          setGenerationStage(0);
          router.push(`/ai-expedition/error?message=${encodeURIComponent(errorMsg)}`);
          return;
        }
        scene.backgroundAsset = sceneRes.objectUrl;
      }

      // Step 3: Call Gemini Nano Banana 2 for player character visual and NPC character visuals
      setGenerationStage(4); // 4. GENERATING CHARACTERS
      const playerPrompt = `Create a 2.5D RPG protagonist character sprite of a historical investigator during ${world.metadata.era} in ${world.metadata.location}, ${world.visualBible?.artStyle || "2.5D RPG style"}, transparent background, game character portrait`;
      const playerRes = await geminiImageProvider.getCharacterImage(worldId, "player", playerPrompt);
      if (!playerRes.success) {
        const errorMsg = playerRes.error || "Generated player asset is missing.";
        setIsGenerating(false);
        setGenerationStage(0);
        router.push(`/ai-expedition/error?message=${encodeURIComponent(errorMsg)}`);
        return;
      }

      for (let i = 0; i < world.characters.length; i++) {
        const char = world.characters[i];
        const charRes = await geminiImageProvider.getCharacterImage(worldId, char.id, char.characterImagePrompt);
        if (!charRes.success) {
          const errorMsg = charRes.error || "Generated character asset is missing.";
          setIsGenerating(false);
          setGenerationStage(0);
          router.push(`/ai-expedition/error?message=${encodeURIComponent(errorMsg)}`);
          return;
        }
      }

      setGenerationStage(5); // 5. STORING ASSETS IN INDEXEDDB
      ExpeditionStorage.saveRecentWorld(world);

      setGenerationStage(6); // 6. PREPARING EXPEDITION
      setTimeout(() => {
        router.push(`/ai-expedition/play/${worldId}`);
      }, 400);
    } catch (err: unknown) {
      console.error("Generator Error:", err);
      const errorMsg = err instanceof Error ? err.message : "Historical world generation failed.";
      setIsGenerating(false);
      setGenerationStage(0);
      router.push(`/ai-expedition/error?message=${encodeURIComponent(errorMsg)}`);
    }
  };

  if (errorMessage && errorMessage.includes("LOST")) {
    return <ExpeditionError message={errorMessage} onRetry={() => setErrorMessage("")} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#fff9e6] selection:bg-[#d97706]/30 font-sans relative overflow-hidden flex flex-col justify-between p-6 md:p-12">
      
      {/* Background Decorative Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#d97706]/15 via-[#0a0806]/80 to-[#0a0806]" />

      {/* Top Header Navigation */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex justify-between items-center pb-6 border-b border-[#3a2d1d]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 border border-[#b45309] bg-[#16202c] rounded-lg flex items-center justify-center font-serif text-xs font-bold text-[#f59e0b]">
            BG
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#d97706] block">BHARAT GATHA</span>
            <span className="text-sm font-serif font-bold text-gray-200 group-hover:text-white transition-colors">AI Historical Expedition</span>
          </div>
        </Link>

        <Link
          href="/dashboard"
          className="bg-[#1f1912] hover:bg-[#2e2419] border border-[#5a442a] text-xs font-bold px-3.5 py-2 rounded-lg text-gray-300 transition-all flex items-center gap-1.5"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-3xl mx-auto w-full py-8 flex-1 flex flex-col justify-center">
        
        {/* Title Badge & Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#d97706]/20 border border-[#d97706]/50 rounded-full px-4 py-1 text-xs font-mono font-bold text-[#f59e0b] uppercase tracking-wider mb-4">
            <span>✨</span> Next-Gen AI Expedition Engine
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white drop-shadow-md leading-tight mb-3">
            Where in Indian History do you want to go?
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto font-medium">
            Type any historical era, event, or moment. Gemini designs the RPG world, quests, and dialogue while the 60 FPS deterministic engine controls gameplay.
          </p>
        </div>

        {/* Input Box Card */}
        <div className="bg-[#14100b] border-2 border-[#5a442a] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md mb-8">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. I want to investigate Delhi during the Revolt of 1857..."
            rows={3}
            className="w-full bg-[#0a0806] border border-[#3a2d1d] rounded-xl p-4 text-base font-medium text-white placeholder-gray-500 focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] resize-none transition-all"
          />

          {errorMessage && (
            <p className="text-xs font-bold text-red-400 mt-2 bg-red-950/40 border border-red-800/50 rounded-lg p-2.5">
              ⚠️ {errorMessage}
            </p>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-[#2a1e12]">
            <span className="text-xs text-gray-500 font-mono">
              Free-Tier Engine • Gemini 3.6 Flash
            </span>

            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !promptInput.trim()}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-2 shadow-lg ${
                isGenerating || !promptInput.trim()
                  ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-[#d97706] hover:bg-[#b45309] border-black text-white active:scale-98 shadow-[#d97706]/20"
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin text-lg">⚙️</span>
                  <span>Generating Expedition...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Generate Expedition</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Status Steps overlay */}
        {isGenerating && (
          <div className="bg-[#1c160e] border border-[#d97706]/40 rounded-xl p-4 mb-8 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#f59e0b]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping" />
              <span>Generation Pipeline Progress:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-medium">
              <div className={`p-2 rounded border ${generationStage >= 1 ? "bg-[#d97706]/20 border-[#d97706] text-white" : "bg-[#0a0806] border-gray-800 text-gray-600"}`}>
                1. Contacting Gemini API
              </div>
              <div className={`p-2 rounded border ${generationStage >= 2 ? "bg-[#d97706]/20 border-[#d97706] text-white" : "bg-[#0a0806] border-gray-800 text-gray-600"}`}>
                2. Generating Quests & World
              </div>
              <div className={`p-2 rounded border ${generationStage >= 3 ? "bg-[#d97706]/20 border-[#d97706] text-white" : "bg-[#0a0806] border-gray-800 text-gray-600"}`}>
                3. Launching RPG Engine
              </div>
            </div>
          </div>
        )}

        {/* Sample Prompt Chips */}
        <div className="mb-8">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#d97706] mb-3">
            Or choose a historical prompt:
          </h3>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPromptInput(sample);
                  handleGenerate(sample);
                }}
                disabled={isGenerating}
                className="bg-[#1a140d] hover:bg-[#2c2013] border border-[#3a2d1d] hover:border-[#d97706]/50 rounded-lg px-3.5 py-2 text-xs text-gray-300 hover:text-white font-medium transition-all text-left"
              >
                💡 {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Expeditions list */}
        {recentWorlds.length > 0 && (
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#d97706] mb-3">
              Recent Expeditions:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentWorlds.map((world) => (
                <Link
                  key={world.metadata.id}
                  href={`/ai-expedition/play/${world.metadata.id}`}
                  className="bg-[#14100b] hover:bg-[#1f1912] border border-[#3a2d1d] hover:border-[#d97706] rounded-xl p-4 transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#d97706] bg-[#d97706]/10 px-1.5 py-0.5 rounded border border-[#d97706]/30">
                      {world.metadata.era} ({world.metadata.year})
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-white transition-colors">Play ➔</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-white group-hover:text-[#f59e0b] transition-colors truncate">
                    {world.metadata.title}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1 font-medium">
                    {world.metadata.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-gray-600 font-mono py-4 border-t border-[#2a1e12]">
        Bharat Gatha AI Historical Expedition Engine • Smart India Hackathon Architecture
      </footer>

    </div>
  );
}
