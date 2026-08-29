import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full bg-[#fef5d4] font-sans">
      {/* Sidebar */}
      <aside className="w-64 md:w-72 border-r-[3px] border-black bg-white flex flex-col z-20">
        <div className="p-6 border-b-[3px] border-black bg-[#fef5d4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a2332] rounded-lg flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-white text-[8px] text-center leading-tight font-extrabold uppercase tracking-tighter">BHARAT<br/>GATHA</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-black">
              BHARAT GATHA
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-5">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3 bg-[#f5d061] border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-lg transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Games
          </Link>

          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3 bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-lg transition-all hover:bg-gray-50 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            Leaderboard
          </Link>

          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3 bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-lg transition-all hover:bg-gray-50 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Profile
          </Link>
        </nav>

        <div className="p-6 border-t-[3px] border-black">
          <Link href="/" className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black text-[15px] transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 relative overflow-hidden flex flex-col">
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,_#000_1.5px,_transparent_1.5px)] bg-[size:24px_24px] pointer-events-none"></div>
         
         <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col">
            <div className="mb-10">
              <h2 className="text-4xl font-extrabold text-black inline-block">
                Games Dashboard
                <div className="h-1.5 bg-black mt-2 w-full rounded-full"></div>
              </h2>
            </div>
            
            <div className="flex-1 bg-white border-[3px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-16 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-4 bg-[#f5d061] border-b-[3px] border-black"></div>
              
              <svg className="w-24 h-24 mx-auto text-gray-200 mb-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              
              <h3 className="text-3xl font-extrabold mb-4 text-black">No active games</h3>
              <p className="text-gray-600 font-bold text-lg mb-10 max-w-md mx-auto">You don't have any ongoing stories. Start a new game to begin your adventure in India.</p>
              
              <button className="inline-flex items-center gap-3 py-4 px-8 bg-[#1a2332] text-white border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                Start New Game
              </button>
            </div>
         </div>
      </main>
    </div>
  );
}
