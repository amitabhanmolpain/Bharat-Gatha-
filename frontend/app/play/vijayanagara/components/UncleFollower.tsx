"use client";

import React, { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface UncleFollowerProps {
  playerPos: Point;
  playerFacingLeft: boolean;
  isVisible: boolean;
  onClick: () => void;
}

export default function UncleFollower({ playerPos, playerFacingLeft, isVisible, onClick }: UncleFollowerProps) {
  // Initialize directly at player position so uncle starts on the ground, not at (50,50)
  const [followPos, setFollowPos] = useState<Point>({ x: playerPos.x, y: playerPos.y });
  const [facingLeft, setFacingLeft] = useState(false);
  const posHistoryRef = useRef<{ x: number; y: number; facingLeft: boolean }[]>([]);

  useEffect(() => {
    // Only update history when visible to save memory/cycles
    if (!isVisible) return;
    
    posHistoryRef.current.push({ x: playerPos.x, y: playerPos.y, facingLeft: playerFacingLeft });
    if (posHistoryRef.current.length > 15) {
      posHistoryRef.current.shift();
    }
    
    if (posHistoryRef.current.length > 10) {
      // Enough history: follow with delay (trailing effect)
      const pastPos = posHistoryRef.current[0];
      setFollowPos({ x: pastPos.x, y: pastPos.y });
      setFacingLeft(pastPos.facingLeft);
    } else {
      // Not enough history yet: stay right beside the player on the ground
      setFollowPos({ x: playerPos.x, y: playerPos.y });
      setFacingLeft(playerFacingLeft);
    }
  }, [playerPos.x, playerPos.y, playerFacingLeft, isVisible]);

  if (!isVisible) return null;

  const uncleFollowX = facingLeft ? followPos.x + 5 : followPos.x - 5;
  const uncleFollowY = followPos.y;

  return (
    <div
      className="absolute z-10 pointer-events-auto cursor-pointer group transition-transform duration-300 ease-out"
      onClick={onClick}
      style={{
        left: `${uncleFollowX}%`,
        top: `${uncleFollowY}%`,
        transform: `translate(-50%, -90%) ${facingLeft ? "scaleX(-1)" : ""}`,
      }}
      title="Uncle (Click to speak)"
    >
      <div className="relative">
        <img
          src="/uncle_companion.png"
          alt="Uncle Companion"
          className="w-28 h-48 object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.7)] group-hover:drop-shadow-[0_0_15px_rgba(212,163,89,0.8)] transition-all duration-300"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="absolute -top-3 right-0 bg-[#1a1714]/80 px-2 py-0.5 rounded border border-[#d4a359] text-[#f6ede0] text-[10px] font-serif opacity-0 group-hover:opacity-100 transition-opacity">
          Chat
        </div>
      </div>
    </div>
  );
}
