import React, { useState, useEffect, useRef } from 'react';

interface PatrollingGuardProps {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  angleOffset: number;
}

export default function PatrollingGuard({
  centerX,
  centerY,
  radiusX,
  radiusY,
  speed,
  angleOffset,
}: PatrollingGuardProps) {
  const [pos, setPos] = useState({ x: centerX + radiusX * Math.cos(angleOffset), y: centerY + radiusY * Math.sin(angleOffset) });
  const [facingLeft, setFacingLeft] = useState(false);
  const [frame, setFrame] = useState(1);
  
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const angleRef = useRef(angleOffset);
  const prevXRef = useRef(pos.x);

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = time - lastTimeRef.current;
      
      // Speed is angle change per second.
      // angle += speed * (deltaTime / 1000)
      angleRef.current += (speed * deltaTime) / 1000;
      
      const newX = centerX + radiusX * Math.cos(angleRef.current);
      const newY = centerY + radiusY * Math.sin(angleRef.current);
      
      setPos({ x: newX, y: newY });
      setFacingLeft(newX < prevXRef.current);
      prevXRef.current = newX;
      
      // Update frame every ~200ms
      setFrame((Math.floor(time / 200) % 3) + 1);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [centerX, centerY, radiusX, radiusY, speed]);

  const depthScale = 0.5 + (pos.y / 100) * 0.5; // simple depth scale
  const finalScaleX = (facingLeft ? -0.7 : 0.7) * depthScale;
  const finalScaleY = 0.7 * depthScale;

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
        src={`/guard_anim_${frame}.png`}
        alt="Patrolling Guard"
        className="w-16 h-auto drop-shadow-[0_10px_8px_rgba(0,0,0,0.5)]"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
