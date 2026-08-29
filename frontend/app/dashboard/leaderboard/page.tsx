"use client";

import { useTheme } from "../ThemeContext";

const LEADERBOARD_DATA = [
  { rank: 1, name: "Arjun The Great", score: 14250, title: "Emperor" },
  { rank: 2, name: "Shivaji_Fan", score: 12800, title: "General" },
  { rank: 3, name: "ChanakyaMind", score: 11450, title: "Strategist" },
  { rank: 4, name: "Rani_Lakshmi", score: 9800, title: "Warrior" },
  { rank: 5, name: "Ashoka99", score: 8500, title: "Noble" },
  { rank: 6, name: "VascoExplorer", score: 7200, title: "Traveler" },
];

export default function Leaderboard() {
  const { isDark } = useTheme();

  return (
    <>
      <div className="mb-10 flex flex-col">
        <h2 className={`text-3xl md:text-4xl font-serif tracking-wide drop-shadow-lg transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>
          Leaderboard
        </h2>
        <div className={`flex items-center gap-3 mt-4 w-full max-w-sm opacity-60 transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`}>
          <div className="h-[1px] bg-gradient-to-r from-current to-transparent flex-1"></div>
          <div className="w-1.5 h-1.5 bg-current rotate-45"></div>
          <div className="h-[1px] bg-gradient-to-l from-current to-transparent flex-1"></div>
        </div>
      </div>
      
      <div className={`flex-1 backdrop-blur-sm border-[1.5px] rounded-2xl p-6 md:p-10 flex flex-col relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0a0806]/60 border-[#3a2d1d] shadow-[0_8px_32px_rgba(0,0,0,0.8)]' : 'bg-white/60 border-[#e3d5c1] shadow-[0_8px_32px_rgba(0,0,0,0.05)]'}`}>
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-50 transition-colors duration-500 ${isDark ? 'via-[#91714b]' : 'via-[#c9a776]'}`}></div>
        
        <div className="flex justify-between items-end mb-6 px-4">
          <h3 className={`text-xl font-serif tracking-wide transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>Global Rankings</h3>
          <span className={`text-[12px] font-bold tracking-widest uppercase transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`}>Top Players</span>
        </div>

        <div className="flex flex-col gap-3">
          {LEADERBOARD_DATA.map((player) => (
            <div 
              key={player.rank} 
              className={`flex items-center justify-between p-4 border rounded-xl transition-all hover:-translate-y-0.5 ${
                player.rank <= 3 
                  ? isDark 
                    ? 'bg-gradient-to-r from-[#91714b]/10 to-transparent border-[#91714b]/40 shadow-[0_4px_12px_rgba(0,0,0,0.3)]' 
                    : 'bg-gradient-to-r from-[#c9a776]/10 to-transparent border-[#c9a776]/40 shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
                  : isDark 
                    ? 'bg-[#16120e]/50 border-[#3a2d1d] hover:border-[#5a4834]' 
                    : 'bg-white/50 border-[#e3d5c1] hover:border-[#c9a776]'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-8 text-center font-serif text-lg font-bold ${
                  player.rank === 1 ? (isDark ? 'text-[#ffd700]' : 'text-[#d4af37]') :
                  player.rank === 2 ? (isDark ? 'text-[#c0c0c0]' : 'text-[#a8a8a8]') :
                  player.rank === 3 ? (isDark ? 'text-[#cd7f32]' : 'text-[#b87333]') :
                  isDark ? 'text-[#7a6f5e]' : 'text-[#a89985]'
                }`}>
                  #{player.rank}
                </div>
                <div>
                  <div className={`font-bold text-[15px] ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>{player.name}</div>
                  <div className={`text-[12px] uppercase tracking-wider mt-1 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`}>{player.title}</div>
                </div>
              </div>
              <div className={`font-serif text-lg tracking-wide ${isDark ? 'text-[#c5b59f]' : 'text-[#7a6f5e]'}`}>
                {player.score.toLocaleString()} <span className={`text-[12px] font-sans uppercase tracking-widest ml-1 ${isDark ? 'text-[#5a4834]' : 'text-[#d6c5b3]'}`}>XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
