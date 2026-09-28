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
  const [isStarted, setIsStarted] = useState(false);
  
  const requestRef = useRef<number>(0);
  const propsRef = useRef({ speed, path, loop, circular, frames, animSpeed, scale });
  useEffect(() => { propsRef.current = { speed, path, loop, circular, frames, animSpeed, scale }; }, [speed, path, loop, circular, frames, animSpeed, scale]);
  
  const lastTimeRef = useRef<number>(0);
  const posRef = useRef(path[0] || { x: 0, y: 0 });
  const currentIdxRef = useRef(0);
  const directionRef = useRef(1); // 1 for forward, -1 for backward
  const facingLeftRef = useRef(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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
          
          if (dx < -0.01) facingLeftRef.current = true;
          else if (dx > 0.01) facingLeftRef.current = false;
        }
      } else {
        if (propsRef.current.loop) {
          directionRef.current *= -1; // Reverse path
        }
      }
      
      const newFrame = Math.floor(time / propsRef.current.animSpeed) % propsRef.current.frames.length;
      
      // Update DOM directly instead of triggering React state re-renders (Codacy High Risk Fix)
      if (containerRef.current) {
        const depthScale = 0.5 + (posRef.current.y / 100) * 0.5;
        const finalScaleX = (facingLeftRef.current ? -1 : 1) * depthScale * propsRef.current.scale;
        const finalScaleY = depthScale * propsRef.current.scale;
        
        containerRef.current.style.left = `${posRef.current.x}%`;
        containerRef.current.style.top = `${posRef.current.y}%`;
        containerRef.current.style.transform = `translate(-50%, -100%) scale(${finalScaleX}, ${finalScaleY})`;
        containerRef.current.style.zIndex = Math.floor(posRef.current.y).toString();
      }
      
      if (imgRef.current) {
        imgRef.current.src = propsRef.current.frames[newFrame];
      }
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
  }, [isStarted]);

  // Initial scales for initial render
  const initialDepthScale = 0.5 + (posRef.current.y / 100) * 0.5;
  const initialFinalScaleX = (facingLeftRef.current ? -1 : 1) * initialDepthScale * scale;
  const initialFinalScaleY = initialDepthScale * scale;

  return (
    <div
      id={id}
      ref={containerRef}
      className="absolute z-10 pointer-events-none transition-transform"
      style={{
        left: `${posRef.current.x}%`,
        top: `${posRef.current.y}%`,
        transform: `translate(-50%, -100%) scale(${initialFinalScaleX}, ${initialFinalScaleY})`,
        zIndex: Math.floor(posRef.current.y), // Basic depth sorting
      }}
    >
      <img
        ref={imgRef}
        src={frames[0]}
        alt={`NPC ${id}`}
        className="w-24 h-auto drop-shadow-[0_10px_8px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
