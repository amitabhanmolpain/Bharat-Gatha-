/* eslint-disable security/detect-object-injection */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { playNarration, stopNarration } from "../../../../services/narratorService";

interface TempleWallInspectionControllerProps {
  isActive: boolean;
  onComplete: () => void;
  setCameraTransform: (transform: string) => void;
}

const SCRIPT_STEPS = [
  {
    id: 1,
    text: "Observe the magnificent continuous narrative of the Hazara Rama temple walls, carved in the mid 16th century.",
    duration: 6500,
    transform: "scale(1.1) translate(0%, 0%)",
    highlightArea: null,
  },
  {
    id: 2,
    text: "Unlike other shrines, this royal temple’s outer perimeter serves as a vast public canvas.",
    duration: 5500,
    transform: "scale(1.2) translate(5%, 0%)",
    highlightArea: null,
  },
  {
    id: 3,
    text: "Notice the marching elephants at the base, symbolizing the foundation of the empire's military might.",
    duration: 6500,
    transform: "scale(1.3) translate(-10%, -20%)", // Zoom into bottom left/right
    highlightArea: "bottom-band",
  },
  {
    id: 4,
    text: "Above them, galloping horses led by foreign traders reflect the kingdom’s immense global wealth.",
    duration: 6500,
    transform: "scale(1.3) translate(0%, 5%)", // Zoom into middle band
    highlightArea: "middle-band",
  },
  {
    id: 5,
    text: "Look closely at the top bands — dancers, musicians, and soldiers in procession celebrate the glorious Mahanavami festival.",
    duration: 8000,
    transform: "scale(1.3) translate(10%, 25%)", // Zoom into top band
    highlightArea: "top-band",
  },
  {
    id: 6,
    text: "Every stone here was intricately chiseled by master artisans, transforming hard granite into an eternal epic.",
    duration: 7000,
    transform: "scale(1.05) translate(0%, 0%)",
    highlightArea: null,
  }
];

export default function TempleWallInspectionController({ isActive, onComplete, setCameraTransform }: TempleWallInspectionControllerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const onCompleteRef = useRef(onComplete);
  const setCameraTransformRef = useRef(setCameraTransform);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    setCameraTransformRef.current = setCameraTransform;
  }, [onComplete, setCameraTransform]);

  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(-1);
      setCameraTransformRef.current("scale(1) translate(0,0)");
      return;
    }

    let isCancelled = false;
    let stepTimer: NodeJS.Timeout;

    const runSequence = async () => {
      for (let i = 0; i < SCRIPT_STEPS.length; i++) {
        if (isCancelled) break;
        
        setCurrentStepIndex(i);
        const step = SCRIPT_STEPS[i as number];
        
        setCameraTransformRef.current(step.transform);
        
        void playNarration(step.text, { speaker: "ratan", pace: 0.88, language_code: "en-IN" });

        await new Promise(resolve => {
          stepTimer = setTimeout(resolve, step.duration);
        });
      }

      if (isCancelled) return;
      
      // Wait a second before closing
      await new Promise(resolve => {
        stepTimer = setTimeout(resolve, 1000);
      });
      
      if (!isCancelled) {
        onCompleteRef.current();
      }
    };

    void runSequence();

    return () => {
      isCancelled = true;
      clearTimeout(stepTimer);
      stopNarration();
    };
  }, [isActive]);

  if (!isActive || currentStepIndex === -1) return null;

  const currentStep = SCRIPT_STEPS[currentStepIndex];

  return (
    <div className="absolute inset-0 pointer-events-none z-40 transition-all duration-1000" style={{ zIndex: 9999 }}>
      {/* Soft Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] transition-opacity duration-1000" />
      
      {/* Letterbox borders for cinematic feel */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-black/90 transition-all duration-1000 transform translate-y-0" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/90 transition-all duration-1000 transform translate-y-0 flex items-center justify-center">
        {/* Subtitle */}
        <p className="text-xl font-serif text-[#eedfc8] text-center px-8 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)] animate-fadeIn">
          {currentStep.text}
        </p>
      </div>

      {/* Focus Masks based on highlightArea */}
      {currentStep.highlightArea === 'bottom-band' && (
        <div className="absolute inset-0 bg-black/40">
          <div className="absolute bottom-[20%] left-[10%] right-[10%] h-[20%] border-2 border-[#d4a359]/60 shadow-[0_0_30px_rgba(212,163,89,0.3)] bg-transparent rounded-lg animate-pulse" />
        </div>
      )}

      {currentStep.highlightArea === 'middle-band' && (
        <div className="absolute inset-0 bg-black/40">
          <div className="absolute bottom-[40%] left-[10%] right-[10%] h-[20%] border-2 border-[#d4a359]/60 shadow-[0_0_30px_rgba(212,163,89,0.3)] bg-transparent rounded-lg animate-pulse" />
        </div>
      )}

      {currentStep.highlightArea === 'top-band' && (
        <div className="absolute inset-0 bg-black/40">
          <div className="absolute top-[20%] left-[10%] right-[10%] h-[35%] border-2 border-[#d4a359]/60 shadow-[0_0_30px_rgba(212,163,89,0.3)] bg-transparent rounded-lg animate-pulse" />
        </div>
      )}
      
      {/* Skip Button */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button 
          onClick={() => {
            stopNarration();
            onComplete();
          }}
          className="px-4 py-2 bg-[#2b2520]/80 border border-[#5a4d3f] text-[#a89985] text-xs uppercase tracking-widest rounded hover:bg-[#3d3329] hover:text-[#f6ede0] transition-colors"
        >
          Skip Scene
        </button>
      </div>
    </div>
  );
}
