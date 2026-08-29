"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <div className={`flex min-h-screen w-full font-sans transition-colors duration-500 ${isDark ? 'bg-[#050403] selection:bg-[#91714b]/30' : 'bg-[#fdfbf7] selection:bg-[#c9a776]/30'}`}>
      
      {/* Subtle background glow */}
      <div className={`absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${isDark ? 'from-[#91714b]/10 via-[#050403]/80 to-[#050403]' : 'from-[#c9a776]/20 via-[#fdfbf7]/80 to-[#fdfbf7]'}`}></div>

      {/* Sidebar */}
      <aside className={`w-64 md:w-72 border-r-[1.5px] backdrop-blur-xl flex flex-col z-20 transition-colors duration-500 ${isDark ? 'border-[#3a2d1d] bg-[#0a0806]/80 shadow-[4px_0_24px_rgba(0,0,0,0.6)]' : 'border-[#e3d5c1] bg-white/80 shadow-[4px_0_24px_rgba(0,0,0,0.03)]'}`}>
        <div className={`p-8 border-b-[1.5px] relative transition-colors duration-500 ${isDark ? 'border-[#3a2d1d]' : 'border-[#e3d5c1]'}`}>
          {/* Subtle top glow */}
          <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-[#91714b]/50' : 'via-[#c9a776]/50'}`}></div>
          
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`w-14 h-14 border rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg transition-colors duration-500 ${isDark ? 'bg-[#16202c] border-[#91714b]' : 'bg-[#fcf8f2] border-[#c9a776]'}`}>
              <div className={`absolute inset-0.5 border rounded-md pointer-events-none ${isDark ? 'border-[#91714b]/30' : 'border-[#c9a776]/30'}`}></div>
              <span className={`text-[8px] leading-tight font-extrabold uppercase tracking-widest font-serif transition-colors duration-500 ${isDark ? 'text-[#e2b975]' : 'text-[#b38848]'}`}>BHARAT<br/>GATHA</span>
            </div>
            <div>
              <h1 className={`text-xl font-serif tracking-wide drop-shadow-md transition-colors duration-500 ${isDark ? 'text-[#e4c794]' : 'text-[#8a6835]'}`}>
                BHARAT GATHA
              </h1>
              <div className={`flex items-center justify-center gap-2 mt-2 opacity-60 transition-colors duration-500 ${isDark ? 'text-[#91714b]' : 'text-[#c9a776]'}`}>
                <div className="h-[1px] bg-current w-4"></div>
                <div className="w-1 h-1 bg-current rotate-45"></div>
                <div className="h-[1px] bg-current w-4"></div>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {/* Games Link */}
          <Link href="/dashboard" className={`flex items-center gap-4 px-4 py-3.5 rounded-lg font-medium text-[14px] tracking-wide transition-all ${
            pathname === '/dashboard'
              ? isDark 
                ? 'bg-gradient-to-r from-[#91714b]/15 to-transparent border-l-2 border-[#b4986b] rounded-r-lg rounded-l-none text-[#e4c794] shadow-[inset_1px_0_0_rgba(180,152,107,0.5)]'
                : 'bg-gradient-to-r from-[#c9a776]/15 to-transparent border-l-2 border-[#b38848] rounded-r-lg rounded-l-none text-[#8a6835] shadow-[inset_1px_0_0_rgba(179,136,72,0.3)]'
              : isDark
                ? 'text-[#a89985] hover:text-[#e4c794] hover:bg-[#91714b]/5'
                : 'text-[#7a6f5e] hover:text-[#8a6835] hover:bg-[#c9a776]/10'
          }`}>
            <svg className={`w-5 h-5 ${pathname === '/dashboard' ? (isDark ? 'text-[#b4986b]' : 'text-[#b38848]') : 'opacity-70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Games
          </Link>

          {/* Leaderboard Link */}
          <Link href="/dashboard/leaderboard" className={`flex items-center gap-4 px-4 py-3.5 rounded-lg font-medium text-[14px] tracking-wide transition-all ${
            pathname === '/dashboard/leaderboard'
              ? isDark 
                ? 'bg-gradient-to-r from-[#91714b]/15 to-transparent border-l-2 border-[#b4986b] rounded-r-lg rounded-l-none text-[#e4c794] shadow-[inset_1px_0_0_rgba(180,152,107,0.5)]'
                : 'bg-gradient-to-r from-[#c9a776]/15 to-transparent border-l-2 border-[#b38848] rounded-r-lg rounded-l-none text-[#8a6835] shadow-[inset_1px_0_0_rgba(179,136,72,0.3)]'
              : isDark
                ? 'text-[#a89985] hover:text-[#e4c794] hover:bg-[#91714b]/5'
                : 'text-[#7a6f5e] hover:text-[#8a6835] hover:bg-[#c9a776]/10'
          }`}>
            <svg className={`w-5 h-5 ${pathname === '/dashboard/leaderboard' ? (isDark ? 'text-[#b4986b]' : 'text-[#b38848]') : 'opacity-70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            Leaderboard
          </Link>

          {/* Profile Link */}
          <Link href="/dashboard/profile" className={`flex items-center gap-4 px-4 py-3.5 rounded-lg font-medium text-[14px] tracking-wide transition-all ${
            pathname === '/dashboard/profile'
              ? isDark 
                ? 'bg-gradient-to-r from-[#91714b]/15 to-transparent border-l-2 border-[#b4986b] rounded-r-lg rounded-l-none text-[#e4c794] shadow-[inset_1px_0_0_rgba(180,152,107,0.5)]'
                : 'bg-gradient-to-r from-[#c9a776]/15 to-transparent border-l-2 border-[#b38848] rounded-r-lg rounded-l-none text-[#8a6835] shadow-[inset_1px_0_0_rgba(179,136,72,0.3)]'
              : isDark
                ? 'text-[#a89985] hover:text-[#e4c794] hover:bg-[#91714b]/5'
                : 'text-[#7a6f5e] hover:text-[#8a6835] hover:bg-[#c9a776]/10'
          }`}>
            <svg className={`w-5 h-5 ${pathname === '/dashboard/profile' ? (isDark ? 'text-[#b4986b]' : 'text-[#b38848]') : 'opacity-70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Profile
          </Link>
        </nav>

        <div className={`p-6 border-t-[1.5px] transition-colors duration-500 flex flex-col gap-3 ${isDark ? 'border-[#3a2d1d]' : 'border-[#e3d5c1]'}`}>
          <button onClick={toggleTheme} className={`flex items-center justify-center gap-3 px-4 py-3 border rounded-lg text-[13px] uppercase tracking-widest font-bold transition-all shadow-inner ${isDark ? 'border-[#3a2d1d] hover:border-[#5a4834] bg-[#0f0c09] hover:bg-[#16120e] text-[#a89985] hover:text-[#c5b59f]' : 'border-[#e3d5c1] hover:border-[#c9a776] bg-white hover:bg-[#fcf8f2] text-[#7a6f5e] hover:text-[#8a6835]'}`}>
            {isDark ? (
               <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            ) : (
               <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            )}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <Link href="/" className={`flex items-center justify-center gap-3 px-4 py-3 border rounded-lg text-[13px] uppercase tracking-widest font-bold transition-all shadow-inner ${isDark ? 'border-[#3a2d1d] hover:border-[#5a4834] bg-[#0f0c09] hover:bg-[#16120e] text-[#a89985] hover:text-[#c5b59f]' : 'border-[#e3d5c1] hover:border-[#c9a776] bg-white hover:bg-[#fcf8f2] text-[#7a6f5e] hover:text-[#8a6835]'}`}>
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 relative overflow-hidden flex flex-col z-10">
         {/* Subtle background texture/pattern */}
         <div className={`absolute inset-0 opacity-[0.03] bg-[size:32px_32px] pointer-events-none transition-colors duration-500 ${isDark ? 'bg-[radial-gradient(circle_at_center,_#91714b_1px,_transparent_1px)]' : 'bg-[radial-gradient(circle_at_center,_#8a6835_1.5px,_transparent_1.5px)]'}`}></div>
         
         <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col">
            {children}
         </div>
      </main>
    </div>
  );
}
