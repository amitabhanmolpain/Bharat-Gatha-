import React from "react";
import Link from "next/link";

interface ExpeditionErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ExpeditionError({
  title = "EXPEDITION LOST",
  message = "Something went wrong while preparing your historical expedition.",
  onRetry
}: ExpeditionErrorProps) {
  return (
    <div className="min-h-screen bg-[#0a0806] text-[#fff9e6] selection:bg-[#d97706]/30 font-sans relative overflow-hidden flex flex-col justify-between p-6 md:p-12">
      
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#dc2626]/10 via-[#0a0806]/90 to-[#0a0806]" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex justify-between items-center pb-6 border-b border-[#3a2d1d]">
        <Link href="/ai-expedition" className="flex items-center gap-3 group">
          <div className="w-10 h-10 border border-[#dc2626] bg-[#16202c] rounded-lg flex items-center justify-center font-serif text-xs font-bold text-[#ef4444]">
            BG
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#dc2626] block">BHARAT GATHA</span>
            <span className="text-sm font-serif font-bold text-gray-200 group-hover:text-white transition-colors">AI Historical Expedition</span>
          </div>
        </Link>
      </header>

      {/* Main Error Box */}
      <main className="relative z-10 max-w-xl mx-auto w-full py-12 flex-1 flex flex-col justify-center text-center">
        
        {/* Large 404 Badge */}
        <div className="inline-block bg-[#7f1d1d]/40 border-2 border-[#dc2626] rounded-2xl px-6 py-2 mb-6">
          <span className="text-6xl font-extrabold font-mono text-[#ef4444] tracking-widest drop-shadow-md">
            404
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
          {title}
        </h1>

        <div className="bg-[#18120b] border-2 border-[#7f1d1d] rounded-xl p-5 mb-8 shadow-xl text-left">
          <span className="text-xs font-mono font-bold uppercase text-[#ef4444] tracking-wider block mb-1">
            System Notice:
          </span>
          <p className="text-sm text-gray-300 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {onRetry ? (
            <button
              onClick={onRetry}
              className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] border-2 border-black rounded-xl px-6 py-3 font-bold text-sm uppercase tracking-wider text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>Try Again</span>
            </button>
          ) : (
            <Link
              href="/ai-expedition"
              className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] border-2 border-black rounded-xl px-6 py-3 font-bold text-sm uppercase tracking-wider text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>Try Again</span>
            </Link>
          )}

          <Link
            href="/ai-expedition"
            className="w-full sm:w-auto bg-[#1f1912] hover:bg-[#2e2419] border-2 border-[#5a442a] rounded-xl px-6 py-3 font-bold text-sm uppercase tracking-wider text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <span>🏛️</span>
            <span>Return to Expedition Hub</span>
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-gray-600 font-mono py-4 border-t border-[#2a1e12]">
        Bharat Gatha Error Recovery Architecture • Smart India Hackathon
      </footer>

    </div>
  );
}
