"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";

export default function Profile() {
  const { isDark } = useTheme();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("bharat_gatha_token");
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        const res = await fetch("http://localhost:5001/api/users/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (res.ok) {
          setProfileData(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const USER_STATS = profileData ? {
    name: profileData.user.name,
    title: profileData.user.role,
    level: profileData.stats.level,
    xp: profileData.stats.xp.toLocaleString(),
    gamesPlayed: profileData.stats.gamesPlayed,
    winRate: `${profileData.stats.winRate}%`,
    highestScore: profileData.stats.highestScore.toLocaleString(),
    rank: profileData.stats.rank ? `#${profileData.stats.rank} Global` : "Unranked"
  } : {
    name: "Adventurer",
    title: "Traveler",
    level: 1,
    xp: "0",
    gamesPlayed: 0,
    winRate: "0%",
    highestScore: "0",
    rank: "Unranked"
  };

  return (
    <>
      <div className="mb-10 flex flex-col">
        <h2 className={`text-3xl md:text-4xl font-serif tracking-wide drop-shadow-lg transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>
          Traveler Profile
        </h2>
        <div className={`flex items-center gap-3 mt-4 w-full max-w-sm opacity-60 transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`}>
          <div className="h-[1px] bg-gradient-to-r from-current to-transparent flex-1"></div>
          <div className="w-1.5 h-1.5 bg-current rotate-45"></div>
          <div className="h-[1px] bg-gradient-to-l from-current to-transparent flex-1"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className={`col-span-1 flex-col items-center justify-center p-8 backdrop-blur-sm border-[1.5px] rounded-2xl relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0a0806]/60 border-[#3a2d1d] shadow-[0_8px_32px_rgba(0,0,0,0.8)]' : 'bg-white/60 border-[#e3d5c1] shadow-[0_8px_32px_rgba(0,0,0,0.05)]'}`}>
          <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-50 transition-colors duration-500 ${isDark ? 'via-[#91714b]' : 'via-[#c9a776]'}`}></div>
          
          <div className="flex flex-col items-center text-center">
            <div className={`w-32 h-32 rounded-full border-[3px] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(145,113,75,0.2)] transition-colors duration-500 ${isDark ? 'border-[#91714b]/60 bg-[#16120e]' : 'border-[#c9a776]/60 bg-[#fcf8f2]'}`}>
              <svg className={`w-16 h-16 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <h3 className={`text-2xl font-serif tracking-wide mb-1 transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>{USER_STATS.name}</h3>
            <span className={`text-[12px] uppercase tracking-widest font-bold transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`}>{USER_STATS.title}</span>
            
            <div className="mt-8 w-full">
              <div className="flex justify-between items-end mb-2">
                <span className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-[#a89985]' : 'text-[#7a6f5e]'}`}>Level {USER_STATS.level}</span>
                <span className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-[#a89985]' : 'text-[#7a6f5e]'}`}>{USER_STATS.xp} XP</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#16120e] border border-[#3a2d1d]' : 'bg-[#f4efe8] border border-[#e3d5c1]'}`}>
                <div className={`h-full w-[70%] transition-colors duration-500 ${isDark ? 'bg-[#91714b]' : 'bg-[#c9a776]'}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Recent */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Games Played", value: USER_STATS.gamesPlayed },
              { label: "Win Rate", value: USER_STATS.winRate },
              { label: "Highest Score", value: USER_STATS.highestScore },
              { label: "Current Rank", value: USER_STATS.rank }
            ].map((stat, i) => (
              <div key={i} className={`flex flex-col items-center justify-center py-6 px-4 rounded-xl border-[1px] backdrop-blur-sm transition-colors duration-500 ${isDark ? 'bg-[#0a0806]/40 border-[#3a2d1d] hover:border-[#5a4834]' : 'bg-white/40 border-[#e3d5c1] hover:border-[#c9a776]'}`}>
                <span className={`text-2xl font-serif mb-1 transition-colors duration-500 ${isDark ? 'text-[#c5b59f]' : 'text-[#8a6835]'}`}>{stat.value}</span>
                <span className={`text-[10px] uppercase tracking-widest transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#b38848]'}`}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Recent Adventures */}
          <div className={`flex-1 p-8 rounded-xl border-[1.5px] backdrop-blur-sm transition-colors duration-500 ${isDark ? 'bg-[#0a0806]/40 border-[#3a2d1d]' : 'bg-white/40 border-[#e3d5c1]'}`}>
            <h4 className={`text-lg font-serif mb-6 transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>Recent Adventures</h4>
            
            {!profileData?.recentAdventures || profileData.recentAdventures.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <svg className={`w-12 h-12 mb-4 opacity-50 transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                <p className={`text-[13px] max-w-xs transition-colors duration-500 ${isDark ? 'text-[#a89985]' : 'text-[#7a6f5e]'}`}>Your legend is yet to be written. Start a new game to record your first adventure.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {profileData.recentAdventures.map((adv: any, i: number) => (
                  <div key={i} className={`flex justify-between items-center p-4 border rounded-xl ${isDark ? 'bg-[#16120e]/50 border-[#3a2d1d]' : 'bg-white/50 border-[#e3d5c1]'}`}>
                    <div>
                      <div className={`font-bold ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>{adv.adventureName}</div>
                      <div className={`text-xs ${isDark ? 'text-[#a89985]' : 'text-[#7a6f5e]'}`}>{new Date(adv.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className={`font-serif tracking-wide ${isDark ? 'text-[#c5b59f]' : 'text-[#7a6f5e]'}`}>
                      {adv.score.toLocaleString()} Score
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
