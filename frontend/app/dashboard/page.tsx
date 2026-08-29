import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full bg-[#050403] font-sans selection:bg-[#91714b]/30">
      
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#91714b]/10 via-[#050403]/80 to-[#050403] pointer-events-none z-0"></div>

      {/* Sidebar */}
      <aside className="w-64 md:w-72 border-r-[1.5px] border-[#3a2d1d] bg-[#0a0806]/80 backdrop-blur-xl flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.6)]">
        <div className="p-8 border-b-[1.5px] border-[#3a2d1d] relative">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#91714b]/50 to-transparent"></div>
          
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-[#16202c] border border-[#91714b] rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg">
              <div className="absolute inset-0.5 border border-[#91714b]/30 rounded-md pointer-events-none"></div>
              <span className="text-[#e2b975] text-[8px] leading-tight font-extrabold uppercase tracking-widest font-serif">BHARAT<br/>GATHA</span>
            </div>
            <div>
              <h1 className="text-xl font-serif text-[#e4c794] tracking-wide drop-shadow-md">
                BHARAT GATHA
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2 opacity-60">
                <div className="h-[1px] bg-[#91714b] w-4"></div>
                <div className="w-1 h-1 bg-[#91714b] rotate-45"></div>
                <div className="h-[1px] bg-[#91714b] w-4"></div>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {/* Active Link */}
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 bg-gradient-to-r from-[#91714b]/15 to-transparent border-l-2 border-[#b4986b] rounded-r-lg text-[#e4c794] font-medium text-[14px] tracking-wide transition-all shadow-[inset_1px_0_0_rgba(180,152,107,0.5)]">
            <svg className="w-5 h-5 text-[#b4986b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Games
          </Link>

          {/* Inactive Links */}
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-[#a89985] hover:text-[#e4c794] hover:bg-[#91714b]/5 rounded-lg font-medium text-[14px] tracking-wide transition-colors">
            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            Leaderboard
          </Link>

          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-[#a89985] hover:text-[#e4c794] hover:bg-[#91714b]/5 rounded-lg font-medium text-[14px] tracking-wide transition-colors">
            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Profile
          </Link>
        </nav>

        <div className="p-6 border-t-[1.5px] border-[#3a2d1d]">
          <Link href="/" className="flex items-center justify-center gap-3 px-4 py-3 border border-[#3a2d1d] hover:border-[#5a4834] bg-[#0f0c09] hover:bg-[#16120e] rounded-lg text-[#a89985] hover:text-[#c5b59f] text-[13px] uppercase tracking-widest font-bold transition-all shadow-inner">
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 relative overflow-hidden flex flex-col z-10">
         {/* Subtle background texture/pattern */}
         <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_#91714b_1px,_transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
         
         <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col">
            <div className="mb-10 flex flex-col">
              <h2 className="text-3xl md:text-4xl font-serif text-[#e4c794] tracking-wide drop-shadow-lg">
                Games Dashboard
              </h2>
              <div className="flex items-center gap-3 mt-4 w-full max-w-sm">
                <div className="h-[1px] bg-gradient-to-r from-[#91714b] to-transparent flex-1 opacity-60"></div>
                <div className="w-1.5 h-1.5 bg-[#91714b] rotate-45"></div>
                <div className="h-[1px] bg-gradient-to-l from-[#91714b] to-transparent flex-1 opacity-60"></div>
              </div>
            </div>
            
            <div className="flex-1 bg-[#0a0806]/60 backdrop-blur-sm border-[1.5px] border-[#3a2d1d] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] p-8 md:p-16 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#91714b] to-transparent opacity-50"></div>
              
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#91714b] blur-2xl opacity-10 rounded-full group-hover:opacity-20 transition-opacity duration-700"></div>
                <svg className="w-20 h-20 mx-auto text-[#5a4834] relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              
              <h3 className="text-2xl font-serif mb-3 text-[#e4c794] tracking-wide">No active games</h3>
              <p className="text-[#a89985] text-[14px] leading-relaxed mb-10 max-w-md mx-auto">You don't have any ongoing stories. Start a new game to begin your adventure in India.</p>
              
              <button className="flex items-center gap-3 py-3.5 px-8 bg-gradient-to-b from-[#a76a26] to-[#6a3809] hover:from-[#b8762e] hover:to-[#7a420b] border-[1.5px] border-[#482806] rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all font-bold text-[#ffeccc] text-[12px] tracking-[0.1em] uppercase">
                <svg className="w-4 h-4 text-[#ffdda3] opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Start New Game
              </button>
            </div>
         </div>
      </main>
    </div>
  );
}
