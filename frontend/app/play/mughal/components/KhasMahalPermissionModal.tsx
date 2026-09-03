"use client";

import React from "react";
import { soundFx } from "../../../../services/soundService";

interface KhasMahalPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToKhasMahal?: () => void;
}

export default function KhasMahalPermissionModal({
  isOpen,
  onClose,
  onProceedToKhasMahal,
}: KhasMahalPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#fff9ea] border-4 border-[#d4af37] rounded-2xl max-w-xl w-full p-6 shadow-[0_0_50px_rgba(212,175,55,0.4)] relative flex flex-col items-center text-center">
        
        {/* Top Trophy & Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] mb-3 animate-bounce">
          <span>🏆</span> Imperial Prize Unlocked
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-1">
          Permission to Khas Mahal
        </h2>
        <p className="text-xs font-bold text-amber-900 mb-4 uppercase tracking-wider">
          Royal Imperial Farman &bull; Year 1653
        </p>

        {/* Transparent Parchment Decree Image with Royal Red Wax Seal */}
        <div className="relative my-2 w-full max-w-md flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]">
          <img
            src="/khas_mahal_permission_decree.png"
            alt="Permission to Khas Mahal Royal Decree"
            className="w-full h-auto max-h-64 object-contain transition-transform hover:scale-105 duration-300"
          />
        </div>

        {/* Narrative Box */}
        <div className="mt-3 bg-amber-100/90 border-2 border-amber-800/30 rounded-xl p-3 text-xs text-amber-950 font-medium leading-relaxed max-w-md">
          <span className="font-extrabold text-amber-900 block mb-1">👑 Emperor&apos;s Royal Farman:</span>
          By order of Emperor Shah Jahan, your mastery of the Sheesh Mahal optical mysteries grants you full imperial clearance to enter the private <strong>Khas Mahal</strong> and explore the sacred fountains of Anguri Bagh.
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-3 w-full max-w-sm">
          {onProceedToKhasMahal && (
            <button
              onClick={() => {
                soundFx.playButtonClick();
                onProceedToKhasMahal();
              }}
              className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-xs py-3 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
            >
              🚪 Enter Khas Mahal Palace
            </button>
          )}
          <button
            onClick={() => {
              soundFx.playClose();
              onClose();
            }}
            className="bg-white hover:bg-gray-100 text-black font-bold text-xs py-3 px-5 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
