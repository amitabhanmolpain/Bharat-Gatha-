"use client";

import Link from "next/link";
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {[
          { region: "Agra/Delhi", title: "Great Mughal Empire", description: "Step into the grand courts of Agra and shape the destiny of an empire. Intrigues, alliances, and conquests await.", image: "/bg-mughal.jpg", href: "/play/mughal" },
          { region: "Rajasthan", title: "Great Rajputana", description: "Defend your honor in the desert forts of Rajasthan. A tale of valor, sacrifice, and legendary warriors.", image: "/bg-rajputana.jpg", href: "/play/rajasthan" },
          { region: "Karnataka", title: "Great Vijayanagara", description: "Explore the wealthy and culturally rich capital of the southern peninsula. Navigate trade, art, and warfare.", image: "/bg-vijayanagara.jpg" }
        ].map((campaign, idx) => (
          <div key={idx} className={`group flex flex-col p-6 backdrop-blur-sm border-[1.5px] rounded-2xl relative overflow-hidden transition-all duration-500 hover:-translate-y-1 ${isDark ? 'bg-[#0a0806]/60 border-[#3a2d1d] hover:border-[#5a4834] shadow-[0_8px_32px_rgba(0,0,0,0.8)]' : 'bg-white/60 border-[#e3d5c1] hover:border-[#c9a776] shadow-[0_8px_32px_rgba(0,0,0,0.05)]'}`}>

            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 w-full h-[3px] opacity-70 transition-colors duration-500 z-20 ${isDark ? 'bg-gradient-to-r from-transparent via-[#91714b] to-transparent' : 'bg-gradient-to-r from-transparent via-[#c9a776] to-transparent'}`}></div>

            {/* Image Header */}
            <div className="w-full h-36 mb-5 rounded-lg overflow-hidden relative z-10 shadow-inner">
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500 z-10"></div>
              <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            </div>

            <div className="flex flex-col flex-1 text-left w-full z-10">
              <div className={`text-[11px] uppercase tracking-widest font-bold mb-2 transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`}>{campaign.region}</div>
              <h3 className={`text-xl font-serif mb-3 tracking-wide transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>{campaign.title}</h3>
              <p className={`text-[13px] leading-relaxed mb-6 flex-1 transition-colors duration-500 ${isDark ? 'text-[#a89985]' : 'text-[#7a6f5e]'}`}>{campaign.description}</p>
            </div>

            {campaign.href ? (
              <Link href={campaign.href} className={`w-full mt-auto flex items-center justify-center gap-2 py-3 px-6 border-[1.5px] rounded-lg shadow-md transition-all font-bold text-[11px] tracking-[0.1em] uppercase z-10 ${isDark ? 'bg-[#16120e] hover:bg-[#1a1510] border-[#483824] hover:border-[#91714b] text-[#e4c794]' : 'bg-[#fcf8f2] hover:bg-[#f5ebd9] border-[#e3d5c1] hover:border-[#c9a776] text-[#8a6835]'}`}>
                <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Play Story
              </Link>
            ) : (
              <button className={`w-full mt-auto flex items-center justify-center gap-2 py-3 px-6 border-[1.5px] rounded-lg shadow-md transition-all font-bold text-[11px] tracking-[0.1em] uppercase z-10 ${isDark ? 'bg-[#16120e] hover:bg-[#1a1510] border-[#483824] hover:border-[#5a4834] text-[#a89985] cursor-not-allowed' : 'bg-[#fcf8f2] border-[#e3d5c1] text-[#a89985] cursor-not-allowed'}`} disabled>
                Coming Soon
              </button>
            )}

            {/* Decorative background blur */}
            <div className={`absolute inset-0 blur-3xl rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none ${isDark ? 'bg-[#91714b]' : 'bg-[#c9a776]'}`}></div>
          </div>
        ))}
      </div>
    </>
  );
}
