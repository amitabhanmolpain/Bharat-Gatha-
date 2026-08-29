"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MughalGameScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate a loading time to show the immersive loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="w-full h-screen relative overflow-hidden font-sans select-none bg-black">
      
      {/* Game Background (Agra Fort RPG) */}
      <img 
        src="/bg-agra-fort.jpg" 
        alt="Agra Fort Game World" 
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Screen Darkening/Vignette Overlay (subtle to match reference aesthetic) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none"></div>

      {/* --- UI OVERLAYS (Light Neo-Brutalism) --- */}
      
      {/* Top Left: Quest Panel */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        {/* Main Quest Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-80">
          <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-2">
            Mughal Empire - The Agra Fort..
          </div>
          <div className="text-[14px] font-bold text-black leading-snug">
            Find the true identity and secret location of your missing friend.
          </div>
        </div>

        {/* Clues Box */}
        <div className="bg-[#fff9ea] border-2 border-black rounded-lg px-4 py-2 w-max shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <div className="flex gap-1">
            <div className="w-3 h-1 bg-amber-400"></div>
            <div className="w-3 h-1 bg-amber-200"></div>
            <div className="w-3 h-1 bg-amber-200"></div>
          </div>
          <span className="text-[12px] font-bold text-black">0/3 clues</span>
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
