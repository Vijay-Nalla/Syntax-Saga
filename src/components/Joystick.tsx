import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioManager } from '@/game/audioManager';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
  label?: string;
  color?: string;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onEnd, label, color = 'var(--primary)' }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickSize = 120; // Increased size as requested
  const handleSize = 60;    // Proportional handle size
  const maxDistance = joystickSize / 2;

  const handleStart = (clientX: number, clientY: number, identifier: number) => {
    setIsDragging(true);
    touchIdRef.current = identifier;
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const limitedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);

    const x = Math.cos(angle) * limitedDistance;
    const y = Math.sin(angle) * limitedDistance;

    setPosition({ x, y });
    
    // Normalize values to -1 to 1
    onMove(x / maxDistance, y / maxDistance);
  }, [isDragging, maxDistance, onMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    touchIdRef.current = null;
    setPosition({ x: 0, y: 0 });
    onEnd();
  }, [onEnd]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && touchIdRef.current !== null) {
        // Find the specific touch that started the joystick movement
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchIdRef.current) {
            handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
            break;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isDragging && touchIdRef.current !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchIdRef.current) {
            handleEnd();
            break;
          }
        }
      }
    };

    if (isDragging) {
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
    }

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="flex flex-col items-center gap-2 pointer-events-none select-none">
      {label && (
        <span className="text-[10px] font-pixel text-primary animate-pulse tracking-widest" 
              style={{ color, textShadow: `0 0 8px ${color}` }}>
          {label}
        </span>
      )}
      <div 
        ref={containerRef}
        className="relative rounded-full bg-card/20 backdrop-blur-sm border-2 flex items-center justify-center touch-none pointer-events-auto transition-shadow duration-300"
        style={{ 
          width: joystickSize, 
          height: joystickSize, 
          touchAction: 'none',
          borderColor: color,
          boxShadow: isDragging ? `0 0 20px ${color}66` : `0 0 10px ${color}33`
        }}
        onTouchStart={(e) => {
          audioManager.resumeContext();
          const touch = e.changedTouches[0];
          handleStart(touch.clientX, touch.clientY, touch.identifier);
        }}
      >
        <div 
          className="absolute rounded-full border-2 transition-transform duration-75 pointer-events-none"
          style={{ 
            width: handleSize, 
            height: handleSize,
            backgroundColor: `${color}99`,
            borderColor: color,
            boxShadow: `0 0 15px ${color}`,
            transform: `translate(${position.x}px, ${position.y}px)`
          }}
        />
      </div>
    </div>
  );
};
