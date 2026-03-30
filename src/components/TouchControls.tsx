import { useEffect, useState, useCallback, useRef } from 'react';
import { Joystick } from './Joystick';
import { PlayerState } from '@/game/types';

interface TouchControlsProps {
  keysRef: React.MutableRefObject<Set<string>>;
  onPause: () => void;
  onHint?: () => void;
  isNearTerminal?: boolean;
  player?: PlayerState;
  cameraX?: number;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export default function TouchControls({ 
  keysRef, 
  onPause, 
  onHint, 
  isNearTerminal = false,
  player,
  cameraX = 0,
  canvasRef
}: TouchControlsProps) {
  const [isTouch, setIsTouch] = useState(false);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    const updateRect = () => {
      if (canvasRef?.current) {
        setCanvasRect(canvasRef.current.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [canvasRef]);

  const handleMoveJoystick = useCallback((x: number, y: number) => {
    // Left/Right movement
    if (x < -0.3) {
      keysRef.current.add('ArrowLeft');
      keysRef.current.delete('ArrowRight');
    } else if (x > 0.3) {
      keysRef.current.add('ArrowRight');
      keysRef.current.delete('ArrowLeft');
    } else {
      keysRef.current.delete('ArrowLeft');
      keysRef.current.delete('ArrowRight');
    }
  }, [keysRef]);

  const handleActionJoystick = useCallback((x: number, y: number) => {
    // Up -> Jump, Down -> Bend
    if (y < -0.5) {
      keysRef.current.add('ArrowUp');
      keysRef.current.delete('ArrowDown');
    } else if (y > 0.5) {
      keysRef.current.add('ArrowDown');
      keysRef.current.delete('ArrowUp');
    } else {
      keysRef.current.delete('ArrowUp');
      keysRef.current.delete('ArrowDown');
    }
  }, [keysRef]);

  const handleMoveEnd = useCallback(() => {
    keysRef.current.delete('ArrowLeft');
    keysRef.current.delete('ArrowRight');
  }, [keysRef]);

  const handleActionEnd = useCallback(() => {
    keysRef.current.delete('ArrowUp');
    keysRef.current.delete('ArrowDown');
  }, [keysRef]);

  if (!isTouch) return null;

  // Calculate ACT button position
  let actButtonPos = { top: 0, left: 0 };
  if (player && canvasRect) {
    const scaleX = canvasRect.width / 960;
    const scaleY = canvasRect.height / 600;
    const screenX = canvasRect.left + (player.x + player.width / 2 - cameraX) * scaleX;
    const screenY = canvasRect.top + (player.y - 40) * scaleY; // 40px above player head
    actButtonPos = { top: screenY, left: screenX };
  }

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Left Joystick (Movement) */}
      <div className="absolute bottom-5 left-5 pointer-events-auto">
        <Joystick 
          onMove={handleMoveJoystick} 
          onEnd={handleMoveEnd} 
          label="MOVE"
          color="hsl(190, 100%, 50%)" // Neon Cyan
        />
      </div>

      {/* Right Joystick (Actions) */}
      <div className="absolute bottom-5 right-5 pointer-events-auto">
        <Joystick 
          onMove={handleActionJoystick} 
          onEnd={handleActionEnd} 
          label="ACTION"
          color="hsl(280, 100%, 65%)" // Neon Purple
        />
      </div>

      {/* Floating ACT Button */}
      {isNearTerminal && (
        <button
          onTouchStart={(e) => {
            if (e.cancelable) e.preventDefault();
            keysRef.current.add('e');
          }}
          onTouchEnd={(e) => {
             if (e.cancelable) e.preventDefault();
             keysRef.current.delete('e');
           }}
           className="absolute w-20 h-20 -translate-x-1/2 -translate-y-full rounded-full border-2 border-pink-500 bg-pink-500/20 
             flex items-center justify-center font-pixel text-xs text-pink-500 pointer-events-auto
             shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse transition-all active:scale-90"
           style={{ 
             top: actButtonPos.top, 
             left: actButtonPos.left,
             textShadow: '0 0 8px rgba(236,72,153,0.8)'
           }}
         >
           ACT
         </button>
      )}
    </div>
  );
}
