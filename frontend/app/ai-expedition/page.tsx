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
  {
    title: "British Raj Resistance",
    prompt: "I want to explore Rajasthan during British rule.",
    renderIcon: () => <FortIcon className="w-5 h-5 text-amber-400" />,
    era: "19th Century",
    accentColor: "from-amber-600/20 via-orange-950/40 to-black",
    borderColor: "border-amber-500/40"
  },
  {
    title: "1857 First War of Independence",
    prompt: "I want to experience Agra during the 1857 rebellion.",
    renderIcon: () => <CrossedTalwarsIcon className="w-5 h-5 text-red-400" />,
    era: "1857 CE",
    accentColor: "from-red-600/20 via-orange-950/40 to-black",
    borderColor: "border-red-500/40"
  },
  {
    title: "Chittorgarh Fort Siege",
    prompt: "Take me to Chittorgarh Fort during the British Residency period.",
    renderIcon: () => <BhagwaDhwajaIcon className="w-5 h-5 text-orange-400" />,
    era: "1818 CE",
    accentColor: "from-orange-600/20 via-amber-950/40 to-black",
    borderColor: "border-orange-500/40"
  },
  {
    title: "Vijayanagara Golden Age",
    prompt: "Explore the bustling bazaars of Hampi under Emperor Krishnadevaraya.",
    renderIcon: () => <RoyalJewelIcon className="w-5 h-5 text-cyan-300" />,
    era: "1520 CE",
    accentColor: "from-cyan-600/20 via-blue-950/40 to-black",
    borderColor: "border-cyan-500/40"
  },
  {
    title: "Chhatrapati Shivaji's Raigad",
    prompt: "Infiltrate Raigad Fort during the grand coronation of Shivaji Maharaj.",
    renderIcon: () => <MarathaTigerIcon className="w-5 h-5 text-amber-300" />,
    era: "1674 CE",
    accentColor: "from-yellow-600/20 via-amber-950/40 to-black",
    borderColor: "border-yellow-500/40"
  },
  {
    title: "Mauryan Empire at Pataliputra",
    prompt: "Walk the grand palace of Pataliputra during Emperor Ashoka's reign.",
    renderIcon: () => <AshokaChakraIcon className="w-5 h-5 text-indigo-300" />,
    era: "260 BCE",
    accentColor: "from-indigo-600/20 via-purple-950/40 to-black",
    borderColor: "border-indigo-500/40"
  }
];

export default function AIExpeditionPortal() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [savedWorlds, setSavedWorlds] = useState<WorldDefinition[]>([]);
  const [genieSpeech, setGenieSpeech] = useState(
    "Mere Aaka! Speak your wish... Name any era, fort, dynasty, or legend of Bharat, and I shall weave a playable world for you!"
  );
  const [genieSpeechIndex, setGenieSpeechIndex] = useState(0);

  const GENIE_HINTS = [
    "Mere Aaka! Speak your wish... Name any era, fort, dynasty, or legend of Bharat, and I shall weave a playable world for you!",
    "Want to walk the marble corridors of Mughal Agra or the fortified bastions of Kumbhalgarh? Just type it!",
    "Try asking for: 'Explore the diamond markets of Vijayanagara during 1520'!",
    "I can craft quests, dialogues, NPCs, and explorable 2.5D rooms from any moment in Indian history!",
    "Click any of my suggestion scrolls below to instantly load a historical prompt!"
  ];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSavedWorlds(Object.values(getAllSavedWorlds()));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleGenieClick = () => {
    const nextIdx = (genieSpeechIndex + 1) % GENIE_HINTS.length;
    setGenieSpeechIndex(nextIdx);
    setGenieSpeech(GENIE_HINTS[nextIdx]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    router.push(`/ai-expedition/generate?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0705] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f140c] via-[#0d0906] to-[#050403] text-white flex flex-col items-center p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-[#3d2c1c]/80 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#caa068]">
              Bharat Gatha • AI World Engine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fae2b8] via-[#e4c794] to-[#b3894e]">
            AI Historical Expedition Generator
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/ai-expedition/flux-test"
            className="bg-[#241a12] hover:bg-[#38281b] border border-[#523c26] hover:border-[#caa068] text-[#fae2b8] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center gap-2 group"
          >
            <ArtStudioIcon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>FLUX Visual Studio</span>
          </Link>
          <Link
            href="/dashboard"
            className="bg-[#18110b] hover:bg-[#271d14] border border-[#44321f] hover:border-[#caa068] text-[#e4c794] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center gap-1.5"
          >
            <span>←</span> Dashboard
          </Link>
        </div>
      </div>

      {/* Main Creation Card with Genie Companion */}
      <div className="w-full max-w-6xl relative z-10 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Center: Expedition Prompt Generator */}
          <div className="lg:col-span-8 bg-[#140e0a]/90 border-2 border-[#473420] hover:border-[#856138] backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.9),_0_0_40px_rgba(217,119,6,0.08)] transition-all">
            
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-950/60 rounded-xl border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <ScrollParchmentIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-[#fae2b8]">
                    Synthesize a Playable Era
                  </h2>
                  <p className="text-xs text-[#9c8973]">
                    Our AI synthesizes 2.5D RPG world geometry, historical quests, dialogues, and explorable scenes.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 'I want to explore Rajasthan during British rule and help the local rebels.'"
                  rows={4}
                  className="w-full bg-[#080503] border-2 border-[#3d2b1a] group-hover:border-[#6b4c2b] focus:border-[#d4a359] text-[#fae2b8] placeholder-[#73614e] rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-[#d4a359]/20 transition-all resize-none shadow-inner leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 text-[11px] text-[#806d59] font-mono pointer-events-none">
                  {prompt.length} chars
                </div>
              </div>

              {/* Historical Idea Scrolls with Custom Vector Badges */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-[#caa068] uppercase tracking-wider flex items-center gap-1.5">
                    <SparkleLightningIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Historical Idea Scrolls</span>
                  </span>
                  <span className="text-[11px] text-[#806d59]">Click to load</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CURATED_EXPEDITION_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(item.prompt);
                        setGenieSpeech(`Excellent choice, Mere Aaka! ${item.title} (${item.era}) is ready to be synthesized!`);
                      }}
                      className={`text-left bg-gradient-to-br ${item.accentColor} hover:bg-[#2d1e13] border ${item.borderColor} hover:border-[#caa068] p-3 rounded-xl transition-all group flex items-start gap-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`}
                    >
                      <div className="p-2 bg-[#0d0906]/90 rounded-lg border border-[#44301d] group-hover:border-amber-400/60 group-hover:scale-110 transition-all shadow-inner flex items-center justify-center shrink-0">
                        {item.renderIcon()}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#fae2b8] truncate group-hover:text-amber-300 transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#0a0705]/90 rounded text-[#caa068] border border-[#3d2b1a] whitespace-nowrap font-mono">
                            {item.era}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9c8973] truncate group-hover:text-[#fae2b8] transition-colors mt-0.5">
                          {item.prompt}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Submit Button */}
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-[#b38546] via-[#d4a359] to-[#9e7033] hover:from-[#c29250] hover:via-[#e3b266] hover:to-[#ad7d3c] disabled:opacity-40 disabled:pointer-events-none text-black font-extrabold text-sm uppercase tracking-widest py-4 px-6 rounded-xl shadow-[0_8px_25px_rgba(212,163,89,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span className="relative z-10 flex items-center gap-2 text-black font-black">
                  <SparkleLightningIcon className="w-4 h-4 text-black" />
                  <span>Generate Playable World Definition</span>
                  <SparkleLightningIcon className="w-4 h-4 text-black" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </form>
          </div>

          {/* Right: Floating Jolly Bhai the Genie */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            
            {/* Interactive Speech Bubble */}
            <div 
              onClick={handleGenieClick}
              className="relative w-full max-w-sm mb-4 bg-[#fff9ea] text-black border-3 border-black p-4 rounded-2xl shadow-[5px_5px_0_0_rgba(0,0,0,1)] cursor-pointer group hover:scale-102 transition-all select-none animate-in fade-in duration-300"
            >
              <div className="flex items-center justify-between border-b border-black/20 pb-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                  Jolly Bhai • Time-Traveling Genie
                </span>
                <span className="text-[9px] bg-amber-400 border border-black rounded px-1.5 py-0.5 font-bold">
                  Click Me
                </span>
              </div>
              <p className="text-xs font-bold text-gray-900 leading-snug">
                "{genieSpeech}"
              </p>
              {/* Pointer triangle */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-black"></div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#fff9ea]"></div>
            </div>

            {/* Genie Floating Sprite with Blue Smoke Cloud & Glow Aura */}
            <div 
              onClick={handleGenieClick}
              className="relative cursor-pointer group flex flex-col items-center transition-transform hover:scale-105"
            >
              {/* Magic Glow Behind */}
              <div className="absolute -inset-4 bg-cyan-400/20 rounded-full blur-xl group-hover:bg-cyan-400/35 transition-colors animate-pulse"></div>

              {/* Floating Container with Keyframe Float Animation */}
              <div className="relative animate-[bounce_3.5s_ease-in-out_infinite]">
                <img
                  src="/genie_rajasthani_transparent.png"
                  alt="Jolly Bhai Genie"
                  className="w-48 h-48 md:w-56 md:h-56 object-contain filter drop-shadow-[0_10px_20px_rgba(0,180,255,0.4)]"
                  style={{ imageRendering: "pixelated" }}
                />

                {/* Sparkling magical particles */}
                <span className="absolute -top-2 left-4 text-cyan-300 text-xs animate-ping">✦</span>
                <span className="absolute top-1/2 -right-3 text-amber-300 text-sm animate-pulse">✨</span>
                <span className="absolute bottom-8 left-2 text-cyan-200 text-xs animate-bounce">✧</span>
              </div>

              <div className="mt-2 bg-[#18110b] border border-[#523c26] rounded-full px-3 py-1 shadow-md">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#caa068]">
                  Historical Genie Companion
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Saved Expeditions Catalog */}
      {savedWorlds.length > 0 && (
        <div className="w-full max-w-6xl relative z-10">
          <div className="flex items-center justify-between mb-6 border-b border-[#3d2c1c]/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/20 rounded-lg border border-amber-500/40 text-amber-400">
                <FortIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-[#fae2b8]">
                Available Expeditions ({savedWorlds.length})
              </h3>
            </div>
            <span className="text-xs text-[#9c8973]">Generated with Bharat Gatha AI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedWorlds.map((world) => (
              <div
                key={world.worldId}
                className="bg-[#140e0a]/90 border-2 border-[#3d2b1a] hover:border-[#caa068] p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.6)] group hover:-translate-y-1"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] uppercase font-black text-[#caa068] bg-[#24170d] border border-[#523c26] px-2 py-0.5 rounded-md tracking-wider">
                      {world.region || "Bharat"} • {world.year || "Historical"}
                    </span>
                    <span className="text-[11px] font-bold bg-[#1f150e] border border-[#44301d] px-2 py-0.5 rounded text-amber-300">
                      {Object.keys(world.scenes || {}).length} Scenes
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-serif font-bold text-[#fae2b8] group-hover:text-amber-300 transition-colors mb-2 line-clamp-1">
                    {world.title}
                  </h4>
                  
                  <p className="text-xs text-[#9c8973] leading-relaxed mb-6 line-clamp-3">
                    {world.summary}
                  </p>
                </div>

                <Link
                  href={`/ai-expedition/play/${world.worldId}`}
                  className="w-full bg-[#241a12] hover:bg-gradient-to-r hover:from-[#b38546] hover:to-[#d4a359] border border-[#523c26] hover:border-black text-[#fae2b8] hover:text-black font-extrabold text-xs uppercase tracking-widest text-center py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Play Expedition</span>
                  <span>▶</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


>>>>>>> origin/main
