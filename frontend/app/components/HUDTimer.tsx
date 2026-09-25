import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';

interface HUDTimerProps {
  className?: string;
}

export default function HUDTimer({ className = '' }: HUDTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isTimerVisible = useAppSelector((state) => state.settings.isTimerVisible);

  useEffect(() => {
    // Only run the timer if it's visible to save background processing,
    // or keep it running if the game requires it for scoring.
    // For now, we'll keep it running.
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isTimerVisible) return null;

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className={`fixed top-4 right-4 bg-black/50 text-white px-3 py-1 rounded font-mono text-sm border border-white/20 z-50 ${className}`}>
      ⏱ {timeString}
    </div>
  );
}
