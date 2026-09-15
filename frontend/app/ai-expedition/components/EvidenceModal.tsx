import React from "react";
import { EvidenceItem } from "../types/expedition";

interface EvidenceModalProps {
  evidence: EvidenceItem;
  onClose: () => void;
}

export default function EvidenceModal({ evidence, onClose }: EvidenceModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200">
      <div className="bg-[#fff9e6] border-4 border-black rounded-xl p-6 max-w-lg w-full shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-3 pb-2 border-b-2 border-black/20">
          <div>
            <span className="bg-[#f59e0b] text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-black tracking-wider">
              📜 Primary Source Evidence
            </span>
            <h3 className="text-xl font-serif font-bold text-black mt-1 leading-tight">
              {evidence.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 border-2 border-black rounded-lg px-2.5 py-1 text-xs font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
          >
            ✕ Esc
          </button>
        </div>

        {/* Clean Pixel-Art Prop Container */}
        {evidence.imageAsset && (
          <div className="my-3 rounded-lg border-2 border-black/20 p-4 bg-[#fef3c7]/60 flex items-center justify-center min-h-[120px]">
            <img
              src={evidence.imageAsset}
              alt={evidence.title}
              style={{ imageRendering: "pixelated" }}
              className="h-28 max-w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]"
            />
          </div>
        )}

        {/* Evidence Description */}
        <p className="text-sm font-medium text-gray-800 mb-4 leading-relaxed">
          {evidence.description}
        </p>

        {/* Historical Fact & Citation Box */}
        <div className="bg-[#fef3c7] border-2 border-black/20 rounded-lg p-3 text-xs mb-5">
          <span className="font-bold text-[#b45309] block mb-1">Historical Significance:</span>
          <p className="text-gray-900 font-medium leading-normal">{evidence.historicalFact}</p>
          {evidence.sourceCitation && (
            <p className="text-[10px] text-gray-600 font-mono mt-2 pt-1 border-t border-black/10">
              Source: {evidence.sourceCitation}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-sm border-3 border-black rounded-lg px-5 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all"
          >
            Continue Expedition ➔
          </button>
        </div>

      </div>
    </div>
  );
}
