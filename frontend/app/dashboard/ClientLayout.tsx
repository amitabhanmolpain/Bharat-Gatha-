"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeContext";
import { 
  Gamepad2, 
  Compass, 
  Trophy, 
  User, 
  Sun, 
  Moon, 
  LogOut 
} from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#050403] selection:bg-[#91714b]/30' : 'bg-[#fdfbf7] selection:bg-[#c9a776]/30'}`}>
      
      {/* Subtle background glow */}
      <div className={`fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${isDark ? 'from-[#91714b]/10 via-[#050403]/80 to-[#050403]' : 'from-[#c9a776]/20 via-[#fdfbf7]/80 to-[#fdfbf7]'}`}></div>

      {/* Sidebar (Fixed in place, never scrolls) */}
      <aside className={`w-64 md:w-72 h-screen flex-shrink-0 border-r-[1.5px] backdrop-blur-xl flex flex-col z-20 transition-colors duration-500 ${isDark ? 'border-[#3a2d1d] bg-[#0a0806]/80 shadow-[4px_0_24px_rgba(0,0,0,0.6)]' : 'border-[#e3d5c1] bg-white/80 shadow-[4px_0_24px_rgba(0,0,0,0.03)]'}`}>
        <div className={`p-8 border-b-[1.5px] relative transition-colors duration-500 ${isDark ? 'border-[#3a2d1d]' : 'border-[#e3d5c1]'}`}>
          {/* Subtle top glow */}
          <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-[#91714b]/50' : 'via-[#c9a776]/50'}`}></div>
          
          <div className="flex flex-col items-center gap-3.5 text-center">
            {/* Bharat Gatha Emblem */}
            <div className="relative group">
              <img 
                src="/icon.png" 
                alt="Bharat Gatha Seal" 
                className={`w-14 h-14 rounded-full border-2 p-0.5 shadow-lg transition-all duration-300 object-cover ${
                  isDark 
                    ? 'border-[#91714b] shadow-[0_0_18px_rgba(218,165,32,0.35)] bg-black/60' 
                    : 'border-[#c9a776] shadow-[0_0_18px_rgba(180,136,72,0.25)] bg-[#fcf8f2]'
                }`}
              />
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

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {/* Kaal Chakra Link */}
          <Link href="/dashboard" className={`flex items-center gap-4 px-4 py-3.5 rounded-lg font-medium text-[14px] tracking-wide transition-all ${
            pathname === '/dashboard'
              ? isDark 
                ? 'bg-gradient-to-r from-[#91714b]/15 to-transparent border-l-2 border-[#b4986b] rounded-r-lg rounded-l-none text-[#e4c794] shadow-[inset_1px_0_0_rgba(180,152,107,0.5)]'
                : 'bg-gradient-to-r from-[#c9a776]/15 to-transparent border-l-2 border-[#b38848] rounded-r-lg rounded-l-none text-[#8a6835] shadow-[inset_1px_0_0_rgba(179,136,72,0.3)]'
              : isDark
                ? 'text-[#a89985] hover:text-[#e4c794] hover:bg-[#91714b]/5'
                : 'text-[#7a6f5e] hover:text-[#8a6835] hover:bg-[#c9a776]/10'
          }`}>
            <Gamepad2 className={`w-5 h-5 ${pathname === '/dashboard' ? (isDark ? 'text-[#b4986b]' : 'text-[#b38848]') : 'opacity-70'}`} />
            Kaal Chakra
          </Link>

          {/* AI Expedition Link */}
          <Link href="/ai-expedition" className={`flex items-center gap-4 px-4 py-3.5 rounded-lg font-medium text-[14px] tracking-wide transition-all ${
            pathname?.startsWith('/ai-expedition')
              ? isDark
                ? 'bg-gradient-to-r from-[#91714b]/15 to-transparent border-l-2 border-[#b4986b] rounded-r-lg rounded-l-none text-[#e4c794] shadow-[inset_1px_0_0_rgba(180,152,107,0.5)]'
                : 'bg-gradient-to-r from-[#c9a776]/15 to-transparent border-l-2 border-[#b38848] rounded-r-lg rounded-l-none text-[#8a6835] shadow-[inset_1px_0_0_rgba(179,136,72,0.3)]'
              : isDark
                ? 'text-[#a89985] hover:text-[#e4c794] hover:bg-[#91714b]/5'
                : 'text-[#7a6f5e] hover:text-[#8a6835] hover:bg-[#c9a776]/10'
          }`}>
            <Compass className={`w-5 h-5 ${pathname?.startsWith('/ai-expedition') ? (isDark ? 'text-[#b4986b]' : 'text-[#b38848]') : 'opacity-70'}`} />
            AI Expedition
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
            <Trophy className={`w-5 h-5 ${pathname === '/dashboard/leaderboard' ? (isDark ? 'text-[#b4986b]' : 'text-[#b38848]') : 'opacity-70'}`} />
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
            <User className={`w-5 h-5 ${pathname === '/dashboard/profile' ? (isDark ? 'text-[#b4986b]' : 'text-[#b38848]') : 'opacity-70'}`} />
            Profile
          </Link>
        </nav>

        <div className={`p-6 border-t-[1.5px] transition-colors duration-500 flex flex-col gap-3 ${isDark ? 'border-[#3a2d1d]' : 'border-[#e3d5c1]'}`}>
          <button onClick={toggleTheme} className={`flex items-center justify-center gap-3 px-4 py-3 border rounded-lg text-[13px] uppercase tracking-widest font-bold transition-all shadow-inner ${isDark ? 'border-[#3a2d1d] hover:border-[#5a4834] bg-[#0f0c09] hover:bg-[#16120e] text-[#a89985] hover:text-[#c5b59f]' : 'border-[#e3d5c1] hover:border-[#c9a776] bg-white hover:bg-[#fcf8f2] text-[#7a6f5e] hover:text-[#8a6835]'}`}>
            {isDark ? (
              <Sun className="w-4 h-4 opacity-80 text-[#e4c794]" />
            ) : (
              <Moon className="w-4 h-4 opacity-80 text-[#8a6835]" />
            )}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <Link href="/" className={`flex items-center justify-center gap-3 px-4 py-3 border rounded-lg text-[13px] uppercase tracking-widest font-bold transition-all shadow-inner ${isDark ? 'border-[#3a2d1d] hover:border-[#5a4834] bg-[#0f0c09] hover:bg-[#16120e] text-[#a89985] hover:text-[#c5b59f]' : 'border-[#e3d5c1] hover:border-[#c9a776] bg-white hover:bg-[#fcf8f2] text-[#7a6f5e] hover:text-[#8a6835]'}`}>
            <LogOut className="w-4 h-4 opacity-70" />
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main Content (Independent Scrollable Container) */}
      <main className="flex-1 h-screen overflow-y-auto p-8 md:p-12 relative flex flex-col z-10">
         {/* Subtle background texture/pattern */}
         <div className={`fixed inset-0 opacity-[0.03] bg-[size:32px_32px] pointer-events-none transition-colors duration-500 ${isDark ? 'bg-[radial-gradient(circle_at_center,_#91714b_1px,_transparent_1px)]' : 'bg-[radial-gradient(circle_at_center,_#8a6835_1.5px,_transparent_1.5px)]'}`}></div>
         
         <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col pb-16">
            {children}
         </div>
      </main>
    </div>
  );
}
