"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const backgrounds = [
  "/bg-pixel.jpg",
  "/bg-indus.jpg",
  "/bg-mughal.jpg",
  "/bg-british.jpg",
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgrounds.length);
    }, 6000); // Change image every 6 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center md:justify-start px-4 sm:px-8 md:pl-16 lg:pl-24 py-6 overflow-hidden bg-black font-sans">
      {/* Background Images Slideshow */}
      {backgrounds.map((bg, index) => (
        <div 
          key={bg}
          className={`absolute inset-0 z-0 bg-cover bg-[center_top] bg-no-repeat transition-opacity duration-[2000ms] ease-in-out ${index === currentImageIndex ? 'opacity-90' : 'opacity-0'}`}
          style={{ backgroundImage: `url('${bg}')` }}
        ></div>
      ))}
      
      {/* Vignette effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent pointer-events-none"></div>

      {/* Main Panel */}
      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center">
        {/* Arch decoration container */}
        <div className="w-full bg-[#0a0806]/80 backdrop-blur-md border-[2px] border-[#91714b] rounded-t-[100px] rounded-b-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-6 sm:p-8 pt-10 flex flex-col items-center border-t-[3px] relative overflow-hidden">
          
          {/* Inner subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#91714b]/10 to-transparent pointer-events-none"></div>

          {/* Logo Box */}
          <div className="w-14 h-14 mb-4 bg-[#16202c] border border-[#91714b] rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg z-10">
             <div className="absolute inset-0.5 border border-[#91714b]/30 rounded-md pointer-events-none"></div>
             <span className="text-[#e2b975] text-[8px] text-center leading-tight font-extrabold uppercase tracking-widest font-serif">BHARAT<br/>GATHA</span>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-serif text-[#e4c794] mb-2 tracking-wide z-10 text-center" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)"}}>
            BHARAT<br/>GATHA
          </h1>
          
          {/* Subtitle with diamonds */}
          <div className="flex items-center gap-3 mb-4 w-full max-w-[260px] z-10">
            <div className="h-[1px] bg-gradient-to-r from-transparent to-[#91714b] flex-1 opacity-60"></div>
            <div className="w-1.5 h-1.5 bg-[#91714b] rotate-45"></div>
            <h2 className="text-[9px] font-bold text-[#b4986b] tracking-[0.2em] uppercase whitespace-nowrap">
              An AI story you play.
            </h2>
            <div className="w-1.5 h-1.5 bg-[#91714b] rotate-45"></div>
            <div className="h-[1px] bg-gradient-to-l from-transparent to-[#91714b] flex-1 opacity-60"></div>
          </div>
          
          {/* Description */}
          <p className="text-[#a89985] text-center text-[12px] leading-relaxed mb-6 px-1 font-serif tracking-wide z-10">
            A fast, image-first game set in India — every scene generated as you play. Step into history. Live the legend.
          </p>

          <div className="w-full space-y-3 z-10">
            {/* Google Button */}
            <Link href="/dashboard" className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#cfbe9f] hover:bg-[#dfcfae] border-[2px] border-[#8a7556] rounded shadow-inner transition-colors font-bold text-[#2d2215] text-[12px] tracking-[0.1em] uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </Link>

            {/* OR separator */}
            <div className="flex items-center justify-center gap-3 py-1 opacity-80">
              <div className="h-[1px] bg-gradient-to-r from-transparent to-[#746048] flex-1"></div>
              <div className="w-1 h-1 bg-[#746048] rotate-45"></div>
              <span className="text-[9px] font-bold text-[#8f795d] tracking-widest uppercase">OR</span>
              <div className="w-1 h-1 bg-[#746048] rotate-45"></div>
              <div className="h-[1px] bg-gradient-to-l from-transparent to-[#746048] flex-1"></div>
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#746048]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <input 
                type="email" 
                placeholder="you@example.com" 
                className="w-full pl-9 pr-4 py-3 bg-[#0a0806] border-[1.5px] border-[#5a4834] rounded text-[#c5b59f] placeholder-[#5c4a38] text-[13px] focus:outline-none focus:border-[#b4986b] transition-colors shadow-inner"
              />
            </div>

            {/* Magic Link Button */}
            <Link href="/dashboard" className="w-full flex items-center justify-between py-3 px-4 bg-gradient-to-b from-[#a76a26] to-[#6a3809] hover:from-[#b8762e] hover:to-[#7a420b] border-[1.5px] border-[#482806] rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all font-bold text-[#ffeccc] text-[12px] tracking-[0.1em] uppercase">
              <span className="flex-1 text-center pl-4">Send Magic Link</span>
              <svg className="w-4 h-4 text-[#ffdda3] opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"></path></svg>
            </Link>
          </div>

          <p className="mt-5 text-center text-[9px] text-[#6b5a45] max-w-[250px] z-10">
            By continuing, you agree to our <span className="text-[#987a55] hover:text-[#c5b59f] cursor-pointer transition-colors">Terms of Service</span> and <span className="text-[#987a55] hover:text-[#c5b59f] cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
