"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "../ThemeContext";
import { CAMPAIGN_REWARDS_DATA, GameRewardItem } from "./gameRewardsData";
import { fetchAllGamesUnlockStatus, GameUnlockStatusMap } from "./gameRewardsService";

export default function GamePrizesSection() {
  const { isDark } = useTheme();
  const [unlockStatus, setUnlockStatus] = useState<GameUnlockStatusMap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadStatus = useCallback(async () => {
    try {
      const status = await fetchAllGamesUnlockStatus();
      setUnlockStatus(status);
    } catch (err) {
      console.warn("Error resolving game prize unlocks:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();

    // Listen for storage updates and window focus to reflect live game completions immediately
    const handleStorageChange = () => {
      loadStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [loadStatus]);

  // Calculate totals
  const allGames = CAMPAIGN_REWARDS_DATA.flatMap((c) => c.games);
  const totalGamesCount = allGames.length;
  const unlockedCount = unlockStatus
    ? allGames.filter((g) => unlockStatus[g.id]).length
    : 0;
  const totalEarnedXp = unlockStatus
    ? allGames
        .filter((g) => unlockStatus[g.id])
        .reduce((sum, g) => sum + g.xpValue, 0)
    : 0;

  return (
    <div className="mt-14 flex flex-col gap-10">
      {/* --- SECTION HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 transition-colors duration-500 border-current/20">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">🏆</span>
            <h3
              className={`text-2xl md:text-3xl font-serif tracking-wide transition-colors duration-500 ${
                isDark ? "text-[#e4c794]" : "text-[#8a6835]"
              }`}
            >
              GAME PRIZES
            </h3>
          </div>
          <p
            className={`mt-2 text-sm md:text-[15px] font-sans transition-colors duration-500 ${
              isDark ? "text-[#c5b59f]/80" : "text-[#7a6f5e]"
            }`}
          >
            Complete games across Bharat Gatha to unlock their rewards.
          </p>
        </div>

        {/* Live Treasury Counter */}
        <div
          className={`flex items-center gap-4 px-5 py-2.5 rounded-xl border backdrop-blur-md transition-all ${
            isDark
              ? "bg-[#140e07]/80 border-[#3a2d1d] text-[#e4c794]"
              : "bg-white/80 border-[#e3d5c1] text-[#8a6835]"
          }`}
        >
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">
              Rewards Unlocked
            </div>
            <div className="text-lg font-serif font-bold">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                `${unlockedCount} / ${totalGamesCount}`
              )}
            </div>
          </div>
          <div className="w-[1px] h-8 bg-current/20"></div>
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">
              Treasury XP
            </div>
            <div className="text-lg font-mono font-bold text-amber-500">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                `+${totalEarnedXp.toLocaleString()} XP`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CAMPAIGN REWARD GROUPS --- */}
      <div className="flex flex-col gap-12">
        {CAMPAIGN_REWARDS_DATA.map((campaign) => {
          const campaignUnlocked = unlockStatus
            ? campaign.games.filter((g) => unlockStatus[g.id]).length
            : 0;

          return (
            <div key={campaign.id} className="flex flex-col gap-5">
              {/* Campaign Header Banner */}
              <div
                className={`p-4 md:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden transition-all duration-500 bg-gradient-to-r ${
                  campaign.bannerColor
                } ${
                  isDark
                    ? "border-[#3a2d1d] bg-[#0c0907]/90"
                    : "border-[#e3d5c1] bg-[#fcf8f2]/90"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border shadow-sm ${
                      isDark
                        ? "bg-[#18110a] border-[#5a432b] text-amber-300"
                        : "bg-white border-[#d8c5ad] text-amber-700"
                    }`}
                  >
                    {campaign.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4
                        className={`text-lg md:text-xl font-serif font-bold tracking-wider uppercase ${
                          isDark ? "text-[#ffdca8]" : "text-[#7a5420]"
                        }`}
                      >
                        {campaign.name}
                      </h4>
                      <span
                        className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          isDark
                            ? "bg-black/40 border-[#5a432b] text-[#c5b59f]"
                            : "bg-white/80 border-[#d8c5ad] text-[#8a6835]"
                        }`}
                      >
                        {campaign.era}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDark ? "text-[#a89985]" : "text-[#7a6f5e]"
                      }`}
                    >
                      {campaign.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                      campaignUnlocked === campaign.games.length && !isLoading
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : isDark
                        ? "bg-[#140e07] border-[#3a2d1d] text-[#c5b59f]"
                        : "bg-white border-[#e3d5c1] text-[#7a6f5e]"
                    }`}
                  >
                    {isLoading ? (
                      "Loading..."
                    ) : (
                      `${campaignUnlocked} / ${campaign.games.length} Unlocked`
                    )}
                  </span>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {campaign.games.map((game) => (
                  <PrizeCard
                    key={game.id}
                    game={game}
                    isUnlocked={Boolean(unlockStatus && unlockStatus[game.id])}
                    isLoading={isLoading}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PrizeCardProps {
  game: GameRewardItem;
  isUnlocked: boolean;
  isLoading: boolean;
  isDark: boolean;
}

function PrizeCard({ game, isUnlocked, isLoading, isDark }: PrizeCardProps) {
  if (isLoading) {
    return (
      <div
        className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[300px] animate-pulse transition-colors ${
          isDark
            ? "bg-[#0f0b08]/50 border-[#241a10]"
            : "bg-white/40 border-[#ece2d3]"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="w-20 h-5 bg-current/10 rounded-md"></div>
          <div className="w-12 h-5 bg-current/10 rounded-md"></div>
        </div>
        <div className="space-y-3 my-4">
          <div className="w-3/4 h-5 bg-current/10 rounded-md"></div>
          <div className="w-1/2 h-3 bg-current/10 rounded-md"></div>
          <div className="w-full h-16 bg-current/5 rounded-xl"></div>
        </div>
        <div className="w-full h-9 bg-current/10 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 ${
        isUnlocked
          ? isDark
            ? "bg-gradient-to-b from-[#1c140c]/90 to-[#0e0a06]/95 border-[#8a6835]/60 shadow-[0_6px_24px_rgba(184,134,11,0.15)] hover:border-[#ffd700]/70 hover:shadow-[0_8px_30px_rgba(218,165,32,0.25)]"
            : "bg-gradient-to-b from-[#fffefc] to-[#fbf6ec] border-[#c9a776] shadow-[0_6px_24px_rgba(145,113,75,0.08)] hover:border-[#a8824b] hover:shadow-[0_8px_30px_rgba(145,113,75,0.16)]"
          : isDark
          ? "bg-[#0d0906]/60 border-[#2b2014]/60 opacity-80 hover:opacity-100 hover:border-[#423120]"
          : "bg-white/50 border-[#e8dfd3] opacity-80 hover:opacity-100 hover:border-[#cfbea7]"
      }`}
    >
      {/* Top Unlocked Glow Accent */}
      {isUnlocked && (
        <div
          className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent opacity-80`}
        ></div>
      )}

      {/* Top Header Row: Status Badge & XP */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          {/* Status Badge */}
          {isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
              <span>🏆</span>
              <span>UNLOCKED</span>
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                isDark
                  ? "bg-[#18110a] text-[#8a7a68] border-[#382b1c]"
                  : "bg-[#f5efe6] text-[#8a7b68] border-[#dfd2c0]"
              }`}
            >
              <span>🔒</span>
              <span>LOCKED</span>
            </span>
          )}

          {/* XP Badge */}
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
              isUnlocked
                ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                : isDark
                ? "text-[#7a6f5e] border-[#2b2014] bg-black/20"
                : "text-[#a89985] border-[#e8dfd3] bg-[#f9f6f0]"
            }`}
          >
            +{game.xpValue} XP
          </span>
        </div>

        {/* Game Name & Location */}
        <div className="mb-3.5">
          <div className="flex items-start gap-2">
            <span className="text-lg select-none group-hover:scale-110 transition-transform">
              {game.icon}
            </span>
            <div>
              <h5
                className={`font-serif font-bold text-[15px] leading-snug transition-colors ${
                  isUnlocked
                    ? isDark
                      ? "text-[#ffe2b3]"
                      : "text-[#6b4715]"
                    : isDark
                    ? "text-[#b0a08b]"
                    : "text-[#665544]"
                }`}
              >
                {game.gameName}
              </h5>
              <div
                className={`text-[11px] mt-0.5 tracking-tight font-medium ${
                  isDark ? "text-[#7a6f5e]" : "text-[#998877]"
                }`}
              >
                {game.location}
              </div>
            </div>
          </div>
        </div>

        {/* Prize Box */}
        <div
          className={`p-3 rounded-xl border transition-all mb-4 ${
            isUnlocked
              ? isDark
                ? "bg-[#241a0e]/60 border-[#5a432b]/60"
                : "bg-[#fdf8ee] border-[#dfcca8]"
              : isDark
              ? "bg-[#120d08]/40 border-[#241a10]"
              : "bg-[#f9f5ed]/60 border-[#ebe2d5]"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-widest ${
                isUnlocked
                  ? "text-amber-500"
                  : isDark
                  ? "text-[#6a5e4e]"
                  : "text-[#a89985]"
              }`}
            >
              PRIZE / REWARD
            </span>
          </div>
          <div
            className={`font-serif font-bold text-[13px] leading-snug ${
              isUnlocked
                ? isDark
                  ? "text-[#ffdca8]"
                  : "text-[#8a5d20]"
                : isDark
                ? "text-[#8a7c6b]"
                : "text-[#776655]"
            }`}
          >
            {game.reward}
          </div>
          <p
            className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
              isUnlocked
                ? isDark
                  ? "text-[#c5b59f]/80"
                  : "text-[#7a6f5e]"
                : isDark
                ? "text-[#5e5344]"
                : "text-[#998877]"
            }`}
          >
            {game.rewardDescription}
          </p>
        </div>
      </div>

      {/* Footer / Requirement / Action Button */}
      <div className="pt-2 border-t border-current/10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isUnlocked
                ? "text-emerald-500"
                : isDark
                ? "text-[#7a6f5e]"
                : "text-[#a89985]"
            }`}
          >
            {isUnlocked ? "✓ COMPLETED" : "🔒 REQUIREMENT"}
          </span>
        </div>

        <p
          className={`text-[11px] leading-tight line-clamp-2 ${
            isUnlocked
              ? isDark
                ? "text-[#a89985]"
                : "text-[#7a6f5e]"
              : isDark
              ? "text-[#80725f]"
              : "text-[#887766]"
          }`}
        >
          {game.unlockCondition}
        </p>

        {/* Action Link to Game */}
        <Link
          href={game.routeUrl}
          className={`mt-2 w-full py-2 px-3 rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isUnlocked
              ? isDark
                ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
                : "bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 border border-amber-600/20"
              : isDark
              ? "bg-[#18110a] hover:bg-[#241a0e] text-[#c5b59f] border border-[#382b1c]"
              : "bg-[#f4efe8] hover:bg-[#eae1d5] text-[#7a6f5e] border border-[#ded4c5]"
          }`}
        >
          <span>{isUnlocked ? "Revisit Game" : "Play Game to Unlock"}</span>
          <span className="text-[10px]">→</span>
        </Link>
      </div>
    </div>
  );
}
