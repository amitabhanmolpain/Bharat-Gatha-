import React, { useState, useEffect, useRef } from 'react';

export interface Waypoint {
  x: number;
  y: number;
}

interface AnimatedAnimalProps {
  type: 'elephant' | 'horse';
  path: Waypoint[];
  speed: number;
  scaleFactor?: number;
}

export default function AnimatedAnimal({ type, path, speed, scaleFactor = 1.0 }: AnimatedAnimalProps) {
  const [pos, setPos] = useState(path[0]);
  const [facingLeft, setFacingLeft] = useState(false);
  const [frame, setFrame] = useState(1);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const targetIndexRef = useRef(1);
  const posRef = useRef(path[0]);

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = time - lastTimeRef.current;
      const target = path[targetIndexRef.current];
      
      const dx = target.x - posRef.current.x;
      const dy = target.y - posRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 0.5) {
        targetIndexRef.current = (targetIndexRef.current + 1) % path.length;
      } else {
        const moveDist = (speed * deltaTime) / 1000;
        const ratio = Math.min(moveDist / dist, 1.0);
        const newX = posRef.current.x + dx * ratio;
        const newY = posRef.current.y + dy * ratio;
        
        posRef.current = { x: newX, y: newY };
        setPos(posRef.current);
        setFacingLeft(dx < 0);
      }
      
      // Update frame every ~200ms
      setFrame((Math.floor(time / 200) % 4) + 1);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [path, speed]);

  const imgSrc = type === 'elephant' ? '/rajasthan-elephant.png' : '/horse.png';
  const baseScale = type === 'elephant' ? 1.0 : 0.8;
  const depthScale = 0.5 + (pos.y / 100) * 0.5; // simple depth scale
  const finalScaleX = (facingLeft ? -1 : 1) * baseScale * depthScale * scaleFactor;
  const finalScaleY = baseScale * depthScale * scaleFactor;
  
  return (
    <div
      className="absolute z-10 pointer-events-none transition-transform"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -100%) scale(${finalScaleX}, ${finalScaleY})`,
        zIndex: Math.floor(pos.y),
      }}
    >
      <img
        src={imgSrc}
        alt={type}
        className={`w-${type === 'elephant' ? '32' : '24'} h-auto drop-shadow-[0_15px_10px_rgba(0,0,0,0.6)]`}
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
