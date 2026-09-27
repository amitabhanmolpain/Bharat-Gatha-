/* eslint-disable security/detect-object-injection */
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
  circular?: boolean;
  animSpeed?: number;
}

export default function PedestrianNPC({
  id,
  frames,
  path,
  speed,
  scale = 1,
  startDelay = 0,
  loop = true,
  circular = false,
  animSpeed = 200,
}: PedestrianNPCProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pos, setPos] = useState<Point>(path[0]);
  const [facingLeft, setFacingLeft] = useState(false);
  const [frame, setFrame] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  const requestRef = useRef<number>(0);
  const propsRef = useRef({ speed, path, loop, circular, frames, animSpeed });
  useEffect(() => { propsRef.current = { speed, path, loop, circular, frames, animSpeed }; }, [speed, path, loop, circular, frames, animSpeed]);
  const lastTimeRef = useRef<number>(0);
  const posRef = useRef(pos);
  const currentIdxRef = useRef(currentIdx);
  const directionRef = useRef(1); // 1 for forward, -1 for backward

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStarted(true);
    }, startDelay);
    return () => {
      clearTimeout(timer);
    };
  }, [startDelay]);

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = time - lastTimeRef.current;
      
      let targetIdx = currentIdxRef.current + directionRef.current;
      
      if (propsRef.current.circular) {
        if (targetIdx >= propsRef.current.path.length) {
          targetIdx = 0;
        } else if (targetIdx < 0) {
          targetIdx = propsRef.current.path.length - 1;
        }
      }
      
      if (targetIdx >= 0 && targetIdx < propsRef.current.path.length) {
        const target = propsRef.current.path[targetIdx];
        const dx = target.x - posRef.current.x;
        const dy = target.y - posRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use a generic speed factor
        const moveDist = (propsRef.current.speed * deltaTime) / 1000;
        
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
          
          if (dx < -0.01) setFacingLeft(true);
          else if (dx > 0.01) setFacingLeft(false);
        }
      } else {
        if (propsRef.current.loop) {
          directionRef.current *= -1; // Reverse path
        }
      }
      
      setPos({ ...posRef.current });
      
      // Update frame based on available frames and animSpeed
      setFrame(Math.floor(time / propsRef.current.animSpeed) % propsRef.current.frames.length);
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
  }, [isStarted]); // Removed path, frames, speed, loop dependencies to avoid restarts. We use refs inside animate.

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
        src={propsRef.current.frames[frame]}
        alt={`NPC ${id}`}
        className="w-24 h-auto drop-shadow-[0_10px_8px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
