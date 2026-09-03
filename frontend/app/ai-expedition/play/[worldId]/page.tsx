"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWorldById } from "../../services/storage";
import { WorldDefinition } from "../../types/world";
import IsolatedGameEngine from "../../components/IsolatedGameEngine";

export default function AIExpeditionPlayPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params?.worldId as string;

  const [isHydrated, setIsHydrated] = useState(false);
  const [world, setWorld] = useState<WorldDefinition | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsHydrated(true);
      if (worldId) {
        const loadedWorld = getWorldById(worldId);
        setWorld(loadedWorld);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [worldId]);

  if (!isHydrated) {
    return (
      <div className="w-full h-screen bg-black text-white flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="text-2xl mb-2 animate-bounce">🏛️</div>
          <p className="text-sm font-bold text-[#e4c794]">Loading Expedition Engine...</p>
        </div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="w-full h-screen bg-[#0a0806] text-white flex items-center justify-center p-6 font-sans">
        <div className="bg-[#16120e] border border-[#3a2d1d] p-8 rounded-2xl max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Expedition Not Found</h2>
          <p className="text-xs text-[#a89985] mb-6">
            The requested AI expedition world definition could not be found or loaded.
          </p>
          <button
            onClick={() => router.push("/ai-expedition")}
            className="w-full bg-[#91714b] text-black font-bold py-3 rounded-lg text-xs uppercase"
          >
            Return to AI Expedition Portal
          </button>
        </div>
      </div>
    );
  }

  return <IsolatedGameEngine world={world} />;
}
