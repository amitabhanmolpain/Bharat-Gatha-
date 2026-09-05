"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeContext";

interface CampaignMeta {
  id: "mughal" | "rajasthan" | "vijayanagara";
  region: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  image: string;
  href: string;
  features: string[];
}

export default function GamesDashboard() {
  const { isDark } = useTheme();

  const [campaignProgress, setCampaignProgress] = useState<Record<string, { statusText: string; isComplete: boolean }>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const progress: Record<string, { statusText: string; isComplete: boolean }> = {};

      // Check Mughal Progress
      try {
        const mughalSave = localStorage.getItem("mughal_save");
        if (mughalSave) {
          const parsed = JSON.parse(mughalSave);
          if (parsed.scene === "red_fort_interior") {
            progress.mughal = { statusText: "✓ Imperial Chronicle Complete", isComplete: true };
          } else {
            progress.mughal = { statusText: "In Progress", isComplete: false };
          }
        }
      } catch {
        // Safe fallback
      }

      // Check Rajasthan Progress
      try {
        const rajSave = localStorage.getItem("rajasthan_game_state") || localStorage.getItem("rajasthan_save_v6");
        if (rajSave) {
          const parsed = JSON.parse(rajSave);
          if (parsed.isCampaignComplete) {
            progress.rajasthan = { statusText: "✓ Imperial Rajputana Complete (4/4)", isComplete: true };
          } else if (parsed.stage) {
            progress.rajasthan = { statusText: `Stage ${parsed.stage}/4 Active`, isComplete: false };
          }
        }
      } catch {
        // Safe fallback
      }

      // Check Vijayanagara Progress
      try {
        const vijaySave = localStorage.getItem("vijayanagara_save_v1");
        if (vijaySave) {
          const parsed = JSON.parse(vijaySave);
          if (parsed.isCampaignComplete) {
            progress.vijayanagara = { statusText: "✓ Legacy Preserved (Complete)", isComplete: true };
          } else if (parsed.stage) {
            progress.vijayanagara = { statusText: `Stage ${parsed.stage}/4 Active`, isComplete: false };
          }
        }
      } catch {
        // Safe fallback
      }

      setCampaignProgress(progress);
    }
  }, []);

  const campaigns: CampaignMeta[] = [
    {
      id: "mughal",
      region: "Agra · Taj Mahal · Delhi",
      title: "Takht Ka Rahasya",
      subtitle: "Mughal Empire Chronicle",
      tagline: "Power · Loyalty · Secrets",
      description:
        "Beyond empires lie untold truths. Step into the majestic courts of Agra Fort and the Taj Mahal to uncover palace secrets, sentry warnings, and imperial conspiracies.",
      image: "/poster-takht-ka-rahasya.jpg",
      href: "/play/mughal",
      features: ["Agra Fort", "Amar Singh Gate", "Taj Mahal", "Red Fort"],
    },
    {
      id: "rajasthan",
      region: "Mehrangarh · Bhangarh · Kuldhara",
      title: "Marubhoomi Ka Rahasya",
      subtitle: "Rajasthan Heritage Odyssey",
      tagline: "Virasat · Kahaniyan · Rahasya",
      description:
        "An adventure through India's living history. Unravel ghost towns in Kuldhara, royal sacrifices in Chittorgarh, and ancient curses in Bhangarh.",
      image: "/poster-marubhoomi-ka-rahasya.jpg",
      href: "/play/rajasthan",
      features: ["Chittorgarh Fort", "Bhangarh Ruins", "Kuldhara Village", "Desert Chaupar"],
    },
    {
      id: "vijayanagara",
      region: "Hampi · Vitthala · Tungabhadra",
      title: "Rise of a Legend: Vijayanagara",
      subtitle: "Vijayanagara Empire",
      tagline: "The City That Dreamed Eternal",
      description:
        "Stone. Splendor. Stories. Walk through a civilization that still lives in legends. Explore musical mandapas, stone chariots, and the lost ledger of Vittala.",
      image: "/poster-rise-of-vijayanagara.jpg",
      href: "/play/vijayanagara",
      features: ["Virupaksha Temple", "Stone Chariot", "Musical Pillars", "Anegundi River"],
    },
  ];

  return (
    <>
      <div className="mb-10 flex flex-col">
        <h2
          className={`text-3xl md:text-4xl font-serif tracking-wide drop-shadow-lg transition-colors duration-500 ${
            isDark ? "text-[#e4c794]" : "text-[#8a6835]"
          }`}
        >
          Games Dashboard
        </h2>
        <div
          className={`flex items-center gap-3 mt-4 w-full max-w-sm opacity-60 transition-colors duration-500 ${
            isDark ? "text-[#91714b]" : "text-[#c9a776]"
          }`}
        >
          <div className="h-[1px] bg-gradient-to-r from-current to-transparent flex-1"></div>
          <div className="w-1.5 h-1.5 bg-current rotate-45"></div>
          <div className="h-[1px] bg-gradient-to-l from-current to-transparent flex-1"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {campaigns.map((campaign) => {
          const prog = campaignProgress[campaign.id];

          return (
            <div
              key={campaign.id}
              className={`group flex flex-col p-5 backdrop-blur-md border-[1.5px] rounded-2xl relative overflow-hidden transition-all duration-500 hover:-translate-y-1.5 ${
                isDark
                  ? "bg-[#0a0806]/75 border-[#3a2d1d] hover:border-[#b4986b]/70 shadow-[0_12px_40px_rgba(0,0,0,0.85)]"
                  : "bg-white/80 border-[#e3d5c1] hover:border-[#c9a776] shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
              }`}
            >
              {/* Top Accent Line */}
              <div
                className={`absolute top-0 left-0 w-full h-[3px] opacity-80 transition-colors duration-500 z-20 ${
                  isDark
                    ? "bg-gradient-to-r from-transparent via-[#b4986b] to-transparent"
                    : "bg-gradient-to-r from-transparent via-[#c9a776] to-transparent"
                }`}
              ></div>

              {/* Cinematic Poster Header */}
              <Link
                href={campaign.href}
                className="w-full h-80 mb-5 rounded-xl overflow-hidden relative z-10 shadow-2xl block group-hover:shadow-[0_0_25px_rgba(180,152,107,0.3)] transition-all duration-500 border border-[#483824]/40"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                <img
                  src={campaign.image}
                  alt={campaign.title}
                  className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-700"
                />

                {/* Poster Subtitle / Tagline Banner */}
                <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/80 backdrop-blur-md border border-[#91714b]/60 text-[#e4c794] shadow-md">
                    {campaign.tagline}
                  </span>
                  {prog && (
                    <span className="text-[9px] font-mono uppercase px-2 py-1 rounded bg-[#b4986b]/90 text-black font-bold shadow-md">
                      {prog.statusText}
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex flex-col flex-1 text-left w-full z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[11px] uppercase tracking-widest font-bold transition-colors duration-500 ${
                      isDark ? "text-[#b4986b]" : "text-[#8a6835]"
                    }`}
                  >
                    {campaign.subtitle}
                  </span>
                </div>

                <h3
                  className={`text-2xl font-serif font-bold mb-2 tracking-wide transition-colors duration-500 ${
                    isDark ? "text-[#ffeccc]" : "text-[#5e431e]"
                  }`}
                >
                  {campaign.title}
                </h3>

                <p
                  className={`text-[11px] font-medium tracking-wider uppercase mb-3 transition-colors duration-500 ${
                    isDark ? "text-[#8a765d]" : "text-[#9a8569]"
                  }`}
                >
                  {campaign.region}
                </p>

                <p
                  className={`text-[13px] leading-relaxed mb-5 flex-1 transition-colors duration-500 ${
                    isDark ? "text-[#c2b29d]" : "text-[#675c4c]"
                  }`}
                >
                  {campaign.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {campaign.features.map((feat) => (
                    <span
                      key={feat}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                        isDark
                          ? "bg-[#14100b] border-[#382b1c] text-[#a89985]"
                          : "bg-[#fcf8f2] border-[#e8dac8] text-[#80705a]"
                      }`}
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>


              <Link
                href={campaign.href}
                className={`w-full mt-auto flex items-center justify-center gap-2 py-3 px-6 border-[1.5px] rounded-lg shadow-md transition-all font-bold text-[11px] tracking-[0.1em] uppercase z-10 ${
                  isDark
                    ? "bg-[#16120e] hover:bg-[#1a1510] border-[#483824] hover:border-[#91714b] text-[#e4c794]"
                    : "bg-[#fcf8f2] hover:bg-[#f5ebd9] border-[#e3d5c1] hover:border-[#c9a776] text-[#8a6835]"
                }`}
              >
                <svg
                  className="w-4 h-4 opacity-80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {prog?.isComplete ? "Revisit Story" : prog ? "Resume Story" : "Play Story"}
              </Link>

              {/* Decorative background blur */}
              <div
                className={`absolute inset-0 blur-3xl rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none ${
                  isDark ? "bg-[#91714b]" : "bg-[#c9a776]"
                }`}
              ></div>
            </div>
          );
        })}
      </div>
    </>
  );
}

