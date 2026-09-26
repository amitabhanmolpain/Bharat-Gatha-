import React, { useState, useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface PedestrianNPCProps {
  id: string;
  frames: string[];
  path: Point[];
  speed: number;
  scale?: number;
  startDelay?: number;
  loop?: boolean;
}

export default function PedestrianNPC({
  id,
  frames,
  path,
  speed,
  scale = 1,
  startDelay = 0,
  loop = true,
}: PedestrianNPCProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pos, setPos] = useState<Point>(path[0]);
  const [facingLeft, setFacingLeft] = useState(false);
  const [frame, setFrame] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const posRef = useRef(pos);
  const currentIdxRef = useRef(currentIdx);
  const directionRef = useRef(1); // 1 for forward, -1 for backward

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStarted(true);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = time - lastTimeRef.current;
      
      const targetIdx = currentIdxRef.current + directionRef.current;
      
      if (targetIdx >= 0 && targetIdx < path.length) {
        const target = path[targetIdx];
        const dx = target.x - posRef.current.x;
        const dy = target.y - posRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use a generic speed factor
        const moveDist = (speed * deltaTime) / 1000;
        
        if (distance <= moveDist) {
          // Reached target
          posRef.current = target;
          currentIdxRef.current = targetIdx;
        } else {
          // Move towards target
          const ratio = moveDist / distance;
          posRef.current = {
            x: posRef.current.x + dx * ratio,
            y: posRef.current.y + dy * ratio
          };
          
          if (dx < 0) setFacingLeft(true);
          else if (dx > 0) setFacingLeft(false);
        }
      } else {
        if (loop) {
          directionRef.current *= -1; // Reverse path
        }
      }
      
      setPos({ ...posRef.current });
      
      // Update frame based on available frames
      setFrame(Math.floor(time / 200) % frames.length);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isStarted) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isStarted, speed, path, loop, frames]);

  const depthScale = 0.5 + (pos.y / 100) * 0.5;
  const finalScaleX = (facingLeft ? -1 : 1) * depthScale * scale;
  const finalScaleY = depthScale * scale;

  return (
    <div
      id={id}
      className="absolute z-10 pointer-events-none transition-transform"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -100%) scale(${finalScaleX}, ${finalScaleY})`,
        zIndex: Math.floor(pos.y), // Basic depth sorting
      }}
    >
      <img
        src={frames[frame]}
        alt={`NPC ${id}`}
        className="w-24 h-auto drop-shadow-[0_10px_8px_rgba(0,0,0,0.5)]"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
