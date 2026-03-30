import React, { useState, useEffect, useRef, useCallback } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onEnd }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickSize = 100; // Total diameter
  const handleSize = 50;    // Inner circle diameter
  const maxDistance = joystickSize / 2;

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
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
    setPosition({ x: 0, y: 0 });
    onEnd();
  }, [onEnd]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div 
      ref={containerRef}
      className="relative rounded-full bg-card/30 backdrop-blur-md border-2 border-primary/40 flex items-center justify-center touch-none pointer-events-auto"
      style={{ width: joystickSize, height: joystickSize }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
    >
      <div 
        className="absolute rounded-full bg-primary/60 border-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-transform duration-75"
        style={{ 
          width: handleSize, 
          height: handleSize,
          transform: `translate(${position.x}px, ${position.y}px)`
        }}
      />
    </div>
  );
};
