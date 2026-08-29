"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MughalGameScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [scene, setScene] = useState<"gate" | "passage">("gate");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 85 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);
  const [showDialogue, setShowDialogue] = useState(false);
  const [cluesFound, setCluesFound] = useState(0);
  const router = useRouter();

  // Guard NPC Position (In 'gate' scene)
  const guardPos = { x: 43.5, y: 72.0 };

  // Calculate distance to guard for interaction prompt
  const distToGuard = Math.sqrt(
    Math.pow(playerPos.x - guardPos.x, 2) + Math.pow(playerPos.y - guardPos.y, 2)
  );
  const isNearGuard = scene === "gate" && distToGuard < 9.0;

  useEffect(() => {
    // Simulate loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Smooth continuous 60fps movement game loop
  useEffect(() => {
    if (isLoading || isTransitioning) return;

    const keysHeld = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      keysHeld.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" && isNearGuard) {
        setShowDialogue((prev) => {
          if (!prev && cluesFound === 0) setCluesFound(1);
          return !prev;
        });
      }
      if (e.key === "Escape") {
        setShowDialogue(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let animationFrameId: number;
    let localWalkTimer = 0;

    const gameLoop = () => {
      let dx = 0;
      let dy = 0;
      const speed = 0.35; // Smooth 60fps movement speed

      if (keysHeld.has("arrowleft") || keysHeld.has("a")) dx -= speed;
      if (keysHeld.has("arrowright") || keysHeld.has("d")) dx += speed;
      if (keysHeld.has("arrowup") || keysHeld.has("w")) dy -= speed * 0.85;
      if (keysHeld.has("arrowdown") || keysHeld.has("s")) dy += speed * 0.85;

      const moving = dx !== 0 || dy !== 0;
      setIsWalking(moving);

      if (dx < 0) setFacingLeft(true);
      if (dx > 0) setFacingLeft(false);

      if (moving) {
        localWalkTimer += 0.25;
        setWalkPhase(localWalkTimer);

        setPlayerPos((prev) => {
          if (scene === "gate") {
            // Dynamic bridge width along perspective ramp
            const rampProgress = Math.max(0, Math.min(1, (prev.y - 71.5) / (92.0 - 71.5)));
            const minX = 42.0 - rampProgress * 4.0;
            const maxX = 58.0 + rampProgress * 4.0;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(71.0, Math.min(92.0, prev.y + dy));

            // Check trigger to enter passage through the archway
            if (nextY <= 71.8 && nextX >= 47.0 && nextX <= 53.0) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("passage");
                setPlayerPos({ x: 33.0, y: 90.0 });
                setIsTransitioning(false);
                if (cluesFound < 2) setCluesFound(2);
              }, 400);
            }

            return { x: nextX, y: nextY };
          } else {
            // In Inner Passage Scene: Curving stone ramp ascending towards Elephant Gate
            const t = Math.max(0, Math.min(1, (prev.y - 58.0) / (91.0 - 58.0))); // 0 at top gate, 1 at bottom
            const centerX = 52.0 - (1.0 - Math.pow(1.0 - t, 1.6)) * 19.0;
            const halfWidth = 4.0 + t * 8.0;

            const minX = centerX - halfWidth;
            const maxX = centerX + halfWidth;

            const nextX = Math.max(minX, Math.min(maxX, prev.x + dx));
            const nextY = Math.max(58.0, Math.min(92.0, prev.y + dy));

            // Walk back down to return to gate
            if (nextY >= 91.5) {
              setIsTransitioning(true);
              setTimeout(() => {
                setScene("gate");
                setPlayerPos({ x: 50.0, y: 73.5 });
                setIsTransitioning(false);
              }, 400);
            }

            return { x: nextX, y: nextY };
          }
        });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLoading, isTransitioning, scene, isNearGuard, cluesFound]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-[#050403] items-center justify-center flex-col relative overflow-hidden font-sans">
        {/* Subtle background texture for loading screen */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#91714b]/20 via-[#050403] to-[#050403]"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#91714b]/30 border-t-[#e4c794] rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(145,113,75,0.4)]"></div>
          
          <h1 className="text-3xl font-serif text-[#e4c794] tracking-[0.2em] uppercase mb-3 drop-shadow-md">
            Mughal Empire
          </h1>
          <p className="text-[13px] text-[#a89985] tracking-widest uppercase">Traveling to Agra Fort...</p>
        </div>
      </div>
    );
  }

  // Perspective depth scaling (Enlarged for clear prominence and hero presence)
  const depthScale = scene === "gate"
    ? 1.22 + ((playerPos.y - 71.5) / 20.5) * 0.28
    : 1.05 + ((playerPos.y - 58.0) / 33.0) * 0.65;

  const walkBob = isWalking ? Math.sin(walkPhase) * 1.8 : 0;
  const walkSway = isWalking ? Math.sin(walkPhase * 0.5) * 1.5 : 0;

  return (
    <div className="w-full h-screen relative overflow-hidden font-sans select-none bg-black">
      
      {/* Game Background (Agra Fort Gate or Inner Passage) */}
      <img 
        src={scene === "gate" ? "/bg-agra-fort.jpg" : "/bg-agra-passage.jpg"} 
        alt="Agra Fort Game World" 
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300"
      />

      {/* Screen Darkening/Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none"></div>

      {/* Fade Transition Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black animate-in fade-in duration-300 z-40 pointer-events-none flex items-center justify-center">
          <span className="text-amber-300 text-sm font-serif tracking-widest uppercase">
            {scene === "gate" ? "Entering Inner Ramp Passage..." : "Returning to Outer Gate..."}
          </span>
        </div>
      )}

      {/* --- MUGHAL ROYAL GUARD NPC (Only in Gate Scene) --- */}
      {scene === "gate" && (
        <div
          className="absolute pointer-events-auto cursor-pointer z-10 flex flex-col items-center"
          style={{
            left: `${guardPos.x}%`,
            top: `${guardPos.y}%`,
            transform: `translate(-50%, -96%) scale(1.15)`,
          }}
          onClick={() => {
            setShowDialogue((prev) => {
              if (!prev && cluesFound === 0) setCluesFound(1);
              return !prev;
            });
          }}
        >
          {/* Guard Proximity Indicator / Speech Bubble */}
          {isNearGuard && !showDialogue && (
            <div className="animate-bounce mb-2 bg-[#fff9ea] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="bg-amber-400 border border-black rounded px-1 text-[9px]">E</span>
              Talk to Royal Guard
            </div>
          )}

          {/* Guard Sprite */}
          <img
            src="/guard.png"
            alt="Mughal Guard NPC"
            className="w-32 h-32 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}

      {/* Gate Entrance Prompt when player approaches arch in gate scene */}
      {scene === "gate" && playerPos.y <= 74.0 && (
        <div className="absolute top-[63%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▲ Walk forward into the archway
        </div>
      )}

      {/* Passage Exit Prompt when near bottom in passage scene */}
      {scene === "passage" && playerPos.y >= 88.0 && (
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 bg-amber-400/90 backdrop-blur-xs text-black border border-black px-3 py-1 rounded-full text-[11px] font-bold tracking-wider animate-pulse z-10 pointer-events-none">
          ▼ Walk down to return to Amar Singh Gate
        </div>
      )}

      {/* --- MAIN GUY PLAYER CHARACTER SPRITE --- */}
      <div 
        className="absolute pointer-events-none flex flex-col items-center z-20"
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transform: `translate(-50%, -96%) scale(${depthScale}) scaleX(${facingLeft ? -1 : 1})`,
        }}
      >
        {/* Character Sprite Image with smooth footstep cadence */}
        <img 
          src="/player.png" 
          alt="Main Hero" 
          className="w-36 h-36 object-contain"
          style={{
            imageRendering: "pixelated",
            transform: `translateY(${walkBob}px) rotate(${walkSway}deg)`,
            transition: isWalking ? "none" : "transform 0.15s ease-out",
          }}
        />
      </div>

      {/* --- GUARD DIALOGUE MODAL --- */}
      {showDialogue && scene === "gate" && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center pb-24 z-30 pointer-events-auto">
          <div className="bg-[#fff9ea] border-3 border-black rounded-xl p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] max-w-xl w-full mx-4 flex gap-4 items-start relative animate-in fade-in zoom-in-95 duration-150">
            {/* Guard Avatar */}
            <div className="w-16 h-16 bg-amber-100 border-2 border-black rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <img src="/guard.png" alt="Guard Avatar" className="w-24 h-24 object-contain translate-y-3" style={{ imageRendering: "pixelated" }} />
            </div>

            {/* Dialogue Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-800 tracking-wider uppercase">Amar Singh Gate Sentry</span>
                <button 
                  onClick={() => setShowDialogue(false)}
                  className="text-gray-500 hover:text-black font-bold text-xs"
                >
                  ✕ Close (Esc)
                </button>
              </div>
              <p className="text-black font-semibold text-[13px] leading-relaxed mb-3">
                &ldquo;Halt, traveler! Beyond this Amar Singh Gate lies the imperial ramp passage leading to the Elephant Gate (Hathi Pol). Your missing companion was seen ascending the ramp toward the upper court! You may proceed through the arch.&rdquo;
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowDialogue(false)}
                  className="bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-md px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
                >
                  &ldquo;Thank you, guard. I will proceed.&rdquo;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- UI OVERLAYS (Light Neo-Brutalism) --- */}
      
      {/* Top Left: Quest Panel */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        {/* Main Quest Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-80">
          <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-2">
            Mughal Empire - {scene === "gate" ? "Amar Singh Gate" : "Inner Ramp Passage"}
          </div>
          <div className="text-[15px] font-bold text-black leading-snug">
            {scene === "gate"
              ? cluesFound === 0
                ? "Go talk with the guard."
                : "Walk into the archway to ascend the fort passage."
              : "Ascend the royal ramp towards the upper palaces (Hathi Pol)."}
          </div>
        </div>

        {/* Clues Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 w-max shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <div className="flex gap-1">
            <div className={`w-3 h-1 ${cluesFound >= 1 ? "bg-amber-500" : "bg-amber-200"}`}></div>
            <div className={`w-3 h-1 ${cluesFound >= 2 ? "bg-amber-500" : "bg-amber-200"}`}></div>
            <div className={`w-3 h-1 ${cluesFound >= 3 ? "bg-amber-500" : "bg-amber-200"}`}></div>
          </div>
          <span className="text-[12px] font-bold text-black">{cluesFound}/3 clues</span>
        </div>
      </div>

      {/* Top Right: Actions & Minimap */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
        {/* Buttons Row */}
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-white border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          <button className="w-10 h-10 bg-amber-400 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
          </button>
          <button className="w-10 h-10 bg-amber-400 border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.898a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
          </button>
          <button onClick={() => router.push('/dashboard')} className="h-10 bg-white border-2 border-black rounded shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center px-4">
            <span className="text-[13px] font-bold">Leave world</span>
          </button>
        </div>

        {/* Minimap Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-3 w-40 h-32 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-1 p-1 bg-amber-50/50 rounded">
             {/* Dummy map grid cells */}
             <div className="bg-transparent"></div>
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-transparent"></div>
             
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-amber-200 rounded-sm"></div>
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-transparent"></div>

             <div className="bg-transparent"></div>
             <div className="bg-amber-400 rounded-sm shadow-[0_0_5px_rgba(251,191,36,0.8)] border border-amber-600"></div> {/* Current player location */}
             <div className="bg-amber-100 rounded-sm"></div>
             <div className="bg-transparent"></div>
          </div>
        </div>
      </div>

      {/* Bottom Center: Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-600 rounded-full px-6 py-2 shadow-lg flex items-center gap-3">
          <span className="text-white text-[12px] font-bold tracking-wider">WASD / arrows</span>
          <span className="text-gray-400 text-[10px]">- move -</span>
          <span className="text-white text-[12px] font-bold tracking-wider">E</span>
          <span className="text-gray-400 text-[10px]">- enter/talk</span>
        </div>
      </div>

      {/* Bottom Right: Stats */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <div className="bg-[#fff9ea] border-2 border-black rounded px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-black"><span className="text-amber-600 mr-1">⚡</span>33 generations</span>
        </div>
        <div className="bg-[#fff9ea] border-2 border-black rounded px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-black"><span className="text-amber-600 mr-1">👁</span>7 screens</span>
        </div>
        <div className="bg-[#fff9ea] border-2 border-black rounded px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
          <span className="text-[11px] font-bold text-black"><span className="text-amber-600 mr-1">🚪</span>rooms 3/3</span>
        </div>
      </div>

    </div>
  );
}
