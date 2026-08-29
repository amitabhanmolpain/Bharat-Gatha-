"use client";

import { useTheme } from "./ThemeContext";

export default function GamesDashboard() {
  const { isDark } = useTheme();

  return (
    <>
      <div className="mb-10 flex flex-col">
        <h2 className={`text-3xl md:text-4xl font-serif tracking-wide drop-shadow-lg transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>
          Games Dashboard
        </h2>
        <div className={`flex items-center gap-3 mt-4 w-full max-w-sm opacity-60 transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`}>
          <div className="h-[1px] bg-gradient-to-r from-current to-transparent flex-1"></div>
          <div className="w-1.5 h-1.5 bg-current rotate-45"></div>
          <div className="h-[1px] bg-gradient-to-l from-current to-transparent flex-1"></div>
        </div>
      </div>
      
      <div className={`flex-1 backdrop-blur-sm border-[1.5px] rounded-2xl p-8 md:p-16 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-colors duration-500 ${isDark ? 'bg-[#0a0806]/60 border-[#3a2d1d] shadow-[0_8px_32px_rgba(0,0,0,0.8)]' : 'bg-white/60 border-[#e3d5c1] shadow-[0_8px_32px_rgba(0,0,0,0.05)]'}`}>
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-50 transition-colors duration-500 ${isDark ? 'via-[#91714b]' : 'via-[#c9a776]'}`}></div>
        
        <div className="relative mb-8">
          <div className={`absolute inset-0 blur-2xl rounded-full group-hover:opacity-20 transition-opacity duration-700 ${isDark ? 'bg-[#91714b] opacity-10' : 'bg-[#c9a776] opacity-15'}`}></div>
          <svg className={`w-20 h-20 mx-auto relative z-10 drop-shadow-md transition-colors duration-500 ${isDark ? 'text-[#5a4834]' : 'text-[#d6c5b3]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        
        <h3 className={`text-2xl font-serif mb-3 tracking-wide transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>No active games</h3>
        <p className={`text-[14px] leading-relaxed mb-10 max-w-md mx-auto transition-colors duration-500 ${isDark ? 'text-[#a89985]' : 'text-[#7a6f5e]'}`}>You don't have any ongoing stories. Start a new game to begin your adventure in India.</p>
        
        <button className={`flex items-center gap-3 py-3.5 px-8 border-[1.5px] rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all font-bold text-[12px] tracking-[0.1em] uppercase ${isDark ? 'bg-gradient-to-b from-[#a76a26] to-[#6a3809] hover:from-[#b8762e] hover:to-[#7a420b] border-[#482806] text-[#ffeccc]' : 'bg-gradient-to-b from-[#c28f52] to-[#996225] hover:from-[#cc9c63] hover:to-[#a86e2b] border-[#8a551c] text-white'}`}>
          <svg className="w-4 h-4 text-[#ffdda3] opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Start New Game
        </button>
      </div>
    </>
  );
}
