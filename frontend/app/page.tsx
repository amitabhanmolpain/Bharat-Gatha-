"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundFx } from "../services/soundService";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  Loader2,
  LogIn,
  Send
} from "lucide-react";

const backgrounds = [
  "/bg-pixel.jpg",
  "/bg-indus.jpg",
  "/bg-mughal.jpg",
  "/bg-british.jpg",
];

export default function Home() {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Authentication Box Modes: "overview" | "signup" | "signin"
  const [authMode, setAuthMode] = useState<"overview" | "signup" | "signin">("overview");

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback & State
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgrounds.length);
    }, 6000); // Change image every 6 seconds
    return () => clearInterval(interval);
  }, []);

  const handleOpenSignUp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundFx.playButtonClick();
    setErrorMsg("");
    setAuthMode("signup");
  };

  const handleOpenSignIn = () => {
    soundFx.playButtonClick();
    setErrorMsg("");
    setAuthMode("signin");
  };

  const handleBackToOverview = () => {
    soundFx.playButtonClick();
    setErrorMsg("");
    setAuthMode("overview");
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your adventurer name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    soundFx.playClueChime();
    setIsLoading(true);

    setTimeout(() => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "bharat_gatha_user",
            JSON.stringify({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              role: "Royal Historian",
              avatar: "/player.png",
              joinedAt: new Date().toISOString(),
            })
          );
        } catch (err) {
          console.error("Failed to save user session:", err);
        }
      }
      router.push("/dashboard");
    }, 700);
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    soundFx.playButtonClick();
    setIsLoading(true);

    setTimeout(() => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "bharat_gatha_user",
            JSON.stringify({
              name: name.trim() || email.split("@")[0],
              email: email.trim().toLowerCase(),
              role: "Royal Historian",
              avatar: "/player.png",
              joinedAt: new Date().toISOString(),
            })
          );
        } catch (err) {
          console.error("Failed to save user session:", err);
        }
      }
      router.push("/dashboard");
    }, 600);
  };

  const handleGoogleAuth = () => {
    soundFx.playButtonClick();
    setIsLoading(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "bharat_gatha_user",
            JSON.stringify({
              name: "Google Traveler",
              email: email.trim() || "traveler@bharatgatha.com",
              role: "Royal Historian",
              avatar: "/player.png",
              joinedAt: new Date().toISOString(),
            })
          );
        } catch (err) {
          console.error("Failed to save user session:", err);
        }
      }
      router.push("/dashboard");
    }, 500);
  };

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
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/85 via-black/30 to-transparent pointer-events-none"></div>

      {/* Main Panel Box */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {/* Arch decoration container */}
        <div className="w-full bg-[#0a0806]/85 backdrop-blur-md border-[2px] border-[#91714b] rounded-t-[100px] rounded-b-xl shadow-[0_0_50px_rgba(0,0,0,0.85)] p-5 sm:p-7 pt-9 flex flex-col items-center border-t-[3px] relative overflow-hidden transition-all duration-300 max-h-[96vh] overflow-y-auto">
          
          {/* Inner subtle gold glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#91714b]/15 via-transparent to-[#91714b]/5 pointer-events-none"></div>

          {/* ========================================================================= */}
          {/* MODE 1: OVERVIEW / DEFAULT LANDING CARD */}
          {/* ========================================================================= */}
          {authMode === "overview" && (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
              {/* Bharat Gatha Emblem */}
              <div className="relative mb-3.5 z-10 group">
                <img 
                  src="/icon.png" 
                  alt="Bharat Gatha" 
                  className="w-16 h-16 rounded-full border-[2px] border-[#91714b] shadow-[0_0_25px_rgba(218,165,32,0.4)] object-cover p-0.5 bg-[#0a0806] hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Title */}
              <h1 className="text-4xl sm:text-5xl font-serif text-[#e4c794] mb-2 tracking-wide z-10 text-center" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)"}}>
                BHARAT<br/>GATHA
              </h1>
              
              {/* Subtitle with diamonds */}
              <div className="flex items-center gap-3 mb-3.5 w-full max-w-[260px] z-10">
                <div className="h-[1px] bg-gradient-to-r from-transparent to-[#91714b] flex-1 opacity-60"></div>
                <div className="w-1.5 h-1.5 bg-[#91714b] rotate-45"></div>
                <h2 className="text-[9px] font-bold text-[#b4986b] tracking-[0.2em] uppercase whitespace-nowrap">
                  An AI story you play.
                </h2>
                <div className="w-1.5 h-1.5 bg-[#91714b] rotate-45"></div>
                <div className="h-[1px] bg-gradient-to-l from-transparent to-[#91714b] flex-1 opacity-60"></div>
              </div>
              
              {/* Description */}
              <p className="text-[#a89985] text-center text-[12px] leading-relaxed mb-5 px-1 font-serif tracking-wide z-10">
                A fast, image-first game set in India — every scene generated as you play. Step into history. Live the legend.
              </p>

              <div className="w-full space-y-3 z-10">
                {/* Google Quick Button */}
                <button 
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#cfbe9f] hover:bg-[#dfcfae] border-[2px] border-[#8a7556] rounded shadow-inner transition-colors font-bold text-[#2d2215] text-[12px] tracking-[0.1em] uppercase cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* OR separator */}
                <div className="flex items-center justify-center gap-3 py-1 opacity-80">
                  <div className="h-[1px] bg-gradient-to-r from-transparent to-[#746048] flex-1"></div>
                  <div className="w-1 h-1 bg-[#746048] rotate-45"></div>
                  <span className="text-[9px] font-bold text-[#8f795d] tracking-widest uppercase">OR</span>
                  <div className="w-1 h-1 bg-[#746048] rotate-45"></div>
                  <div className="h-[1px] bg-gradient-to-l from-transparent to-[#746048] flex-1"></div>
                </div>

                {/* Email Input */}
                <form onSubmit={handleOpenSignUp} className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-[#8f795d]" />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" 
                      className="w-full pl-9 pr-4 py-3 bg-[#0a0806] border-[1.5px] border-[#5a4834] rounded text-[#c5b59f] placeholder-[#5c4a38] text-[13px] focus:outline-none focus:border-[#b4986b] transition-colors shadow-inner"
                    />
                  </div>

                  {/* Sign Up Button -> Opens Sign Up screen in this box */}
                  <button 
                    type="submit"
                    className="w-full flex items-center justify-between py-3 px-4 bg-gradient-to-b from-[#a76a26] to-[#6a3809] hover:from-[#b8762e] hover:to-[#7a420b] border-[1.5px] border-[#482806] rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all font-bold text-[#ffeccc] text-[12px] tracking-[0.1em] uppercase cursor-pointer active:translate-y-0.5"
                  >
                    <span className="flex-1 text-center pl-4">Sign Up</span>
                    <Send className="w-4 h-4 text-[#ffdda3] opacity-90" />
                  </button>
                </form>

                {/* Sign In Toggle Link */}
                <div className="pt-1 text-center">
                  <span className="text-[11px] text-[#8f795d]">
                    Already have an account?{" "}
                    <button 
                      onClick={handleOpenSignIn}
                      className="text-[#e2b975] font-bold hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </span>
                </div>
              </div>

              <p className="mt-4 text-center text-[9px] text-[#6b5a45] max-w-[250px] z-10">
                By continuing, you agree to our <span className="text-[#987a55] hover:text-[#c5b59f] cursor-pointer transition-colors">Terms of Service</span> and <span className="text-[#987a55] hover:text-[#c5b59f] cursor-pointer transition-colors">Privacy Policy</span>.
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: SIGN UP SCREEN (OPENS DIRECTLY INSIDE THIS BOX) */}
          {/* ========================================================================= */}
          {authMode === "signup" && (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 z-10">
              
              {/* Top Navigation Row */}
              <div className="w-full flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={handleBackToOverview}
                  className="text-[11px] font-bold text-[#b4986b] hover:text-[#e4c794] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="text-[9px] font-mono tracking-widest text-[#8f795d] uppercase">
                  HISTORIAN REGISTRATION
                </span>
              </div>

              {/* Bharat Gatha Emblem */}
              <div className="relative mb-2.5">
                <img 
                  src="/icon.png" 
                  alt="Bharat Gatha" 
                  className="w-14 h-14 rounded-full border-[2px] border-[#91714b] shadow-[0_0_20px_rgba(218,165,32,0.35)] object-cover p-0.5 bg-[#0a0806]"
                />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl font-serif text-[#e4c794] font-black tracking-wide text-center uppercase mb-1">
                Create Account
              </h2>
              <p className="text-[11.5px] text-[#a89985] text-center mb-4 font-serif">
                Join the chronicles and shape India's history
              </p>

              {/* Error Message Box */}
              {errorMsg && (
                <div className="w-full bg-red-950/70 border border-red-500/60 rounded-lg p-2.5 mb-3.5 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-200 text-[11px] font-medium leading-tight">{errorMsg}</p>
                </div>
              )}

              {/* Sign Up Form */}
              <form onSubmit={handleSignUpSubmit} className="w-full space-y-2.5">
                {/* Adventurer Name */}
                <div>
                  <label className="block text-[10px] font-bold text-[#b4986b] uppercase tracking-wider mb-1 text-left">
                    Adventurer / Historian Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8f795d]">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aryan Sharma" 
                      className="w-full pl-9 pr-3 py-2 bg-[#0a0806] border-[1.5px] border-[#5a4834] rounded text-[#c5b59f] placeholder-[#5c4a38] text-[12px] focus:outline-none focus:border-[#b4986b] transition-colors shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-[#b4986b] uppercase tracking-wider mb-1 text-left">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8f795d]">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" 
                      className="w-full pl-9 pr-3 py-2 bg-[#0a0806] border-[1.5px] border-[#5a4834] rounded text-[#c5b59f] placeholder-[#5c4a38] text-[12px] focus:outline-none focus:border-[#b4986b] transition-colors shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-bold text-[#b4986b] uppercase tracking-wider mb-1 text-left">
                    Password (Min. 6 Characters)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8f795d]">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-9 pr-9 py-2 bg-[#0a0806] border-[1.5px] border-[#5a4834] rounded text-[#c5b59f] placeholder-[#5c4a38] text-[12px] focus:outline-none focus:border-[#b4986b] transition-colors shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8f795d] hover:text-[#e4c794] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-bold text-[#b4986b] uppercase tracking-wider mb-1 text-left">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8f795d]">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-9 pr-9 py-2 bg-[#0a0806] border-[1.5px] border-[#5a4834] rounded text-[#c5b59f] placeholder-[#5c4a38] text-[12px] focus:outline-none focus:border-[#b4986b] transition-colors shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8f795d] hover:text-[#e4c794] cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-b from-[#a76a26] to-[#6a3809] hover:from-[#b8762e] hover:to-[#7a420b] border-[1.5px] border-[#482806] rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all font-bold text-[#ffeccc] text-[12px] tracking-[0.1em] uppercase cursor-pointer active:translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#ffeccc]" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Begin Expedition</span>
                      <Sparkles className="w-4 h-4 text-[#ffdda3]" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Google Option */}
              <div className="w-full mt-3">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full py-2 px-3 bg-[#181410] hover:bg-[#251f18] border border-[#5a4834] rounded text-[11px] font-bold text-[#b4986b] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Quick Sign Up with Google</span>
                </button>
              </div>

              {/* Toggle to Sign In */}
              <div className="mt-3.5 text-center">
                <span className="text-[11px] text-[#8f795d]">
                  Already have an account?{" "}
                  <button 
                    type="button"
                    onClick={handleOpenSignIn}
                    className="text-[#e2b975] font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 3: SIGN IN SCREEN (INSIDE THIS EXACT BOX) */}
          {/* ========================================================================= */}
          {authMode === "signin" && (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 z-10">
              
              {/* Top Navigation Row */}
              <div className="w-full flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={handleBackToOverview}
                  className="text-[11px] font-bold text-[#b4986b] hover:text-[#e4c794] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="text-[9px] font-mono tracking-widest text-[#8f795d] uppercase">
                  HISTORIAN PORTAL
                </span>
              </div>

              {/* Bharat Gatha Emblem */}
              <div className="relative mb-2.5">
                <img 
                  src="/icon.png" 
                  alt="Bharat Gatha" 
                  className="w-14 h-14 rounded-full border-[2px] border-[#91714b] shadow-[0_0_20px_rgba(218,165,32,0.35)] object-cover p-0.5 bg-[#0a0806]"
                />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl font-serif text-[#e4c794] font-black tracking-wide text-center uppercase mb-1">
                Sign In
              </h2>
              <p className="text-[11.5px] text-[#a89985] text-center mb-4 font-serif">
                Resume your journey across the eras
              </p>

              {/* Error Message Box */}
              {errorMsg && (
                <div className="w-full bg-red-950/70 border border-red-500/60 rounded-lg p-2.5 mb-3.5 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-200 text-[11px] font-medium leading-tight">{errorMsg}</p>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSignInSubmit} className="w-full space-y-3">
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-[#b4986b] uppercase tracking-wider mb-1 text-left">
                    Registered Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8f795d]">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" 
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0a0806] border-[1.5px] border-[#5a4834] rounded text-[#c5b59f] placeholder-[#5c4a38] text-[12px] focus:outline-none focus:border-[#b4986b] transition-colors shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-bold text-[#b4986b] uppercase tracking-wider mb-1 text-left">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8f795d]">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-9 pr-9 py-2.5 bg-[#0a0806] border-[1.5px] border-[#5a4834] rounded text-[#c5b59f] placeholder-[#5c4a38] text-[12px] focus:outline-none focus:border-[#b4986b] transition-colors shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8f795d] hover:text-[#e4c794] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-b from-[#a76a26] to-[#6a3809] hover:from-[#b8762e] hover:to-[#7a420b] border-[1.5px] border-[#482806] rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all font-bold text-[#ffeccc] text-[12px] tracking-[0.1em] uppercase cursor-pointer active:translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#ffeccc]" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <LogIn className="w-4 h-4 text-[#ffdda3]" />
                    </>
                  )}
                </button>
              </form>

              {/* Google Button */}
              <div className="w-full mt-3">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full py-2 px-3 bg-[#181410] hover:bg-[#251f18] border border-[#5a4834] rounded text-[11px] font-bold text-[#b4986b] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Sign In with Google</span>
                </button>
              </div>

              {/* Toggle to Sign Up */}
              <div className="mt-3.5 text-center">
                <span className="text-[11px] text-[#8f795d]">
                  Don't have an account?{" "}
                  <button 
                    type="button"
                    onClick={handleOpenSignUp}
                    className="text-[#e2b975] font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
