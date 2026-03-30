import { useEffect, useState, useCallback, useRef } from 'react';
import { Joystick } from './Joystick';
import { PlayerState, ControlMode } from '@/game/types';
import { audioManager } from '@/game/audioManager';

interface TouchControlsProps {
  keysRef: React.MutableRefObject<Set<string>>;
  onPause: () => void;
  onHint?: () => void;
  isNearTerminal?: boolean;
  player?: PlayerState;
  cameraX?: number;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  controlMode?: ControlMode;
}

export default function TouchControls({ 
  keysRef, 
  onPause, 
  onHint, 
  isNearTerminal = false,
  player,
  cameraX = 0,
  canvasRef,
  controlMode = 'joystick'
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

  const handlePress = (key: string) => {
    audioManager.resumeContext();
    keysRef.current.add(key);
  };

  const handleRelease = (key: string) => {
    keysRef.current.delete(key);
  };

  const buttonProps = (key: string) => ({
    onTouchStart: (e: React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      handlePress(key);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      handleRelease(key);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      handleRelease(key);
    },
    style: { touchAction: 'none' } as React.CSSProperties
  });

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

      {/* Action Controls (Right Side) */}
      <div className="absolute bottom-5 right-5 pointer-events-auto flex items-end gap-3 transition-all duration-300">
        {controlMode === 'joystick' ? (
          <Joystick 
            onMove={handleActionJoystick} 
            onEnd={handleActionEnd} 
            label="ACTION"
            color="hsl(280, 100%, 65%)" // Neon Purple
          />
        ) : (
          <div className="flex items-center gap-3 mb-4 mr-2">
            {/* BEND Button */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-pixel text-secondary/70 tracking-widest">BEND</span>
              <button
                {...buttonProps('ArrowDown')}
                className="w-[70px] h-[70px] rounded-xl border-2 border-secondary/60 bg-secondary/10 backdrop-blur-sm
                  flex flex-col items-center justify-center transition-all active:scale-90 active:bg-secondary/30
                  shadow-[0_0_15px_rgba(var(--secondary),0.2)]"
              >
                <span className="text-xl text-secondary mb-1">↓</span>
              </button>
            </div>

            {/* JUMP Button */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-pixel text-primary tracking-widest">JUMP</span>
              <button
                {...buttonProps(' ')}
                className="w-[85px] h-[85px] rounded-xl border-2 border-primary bg-primary/20 backdrop-blur-md
                  flex flex-col items-center justify-center transition-all active:scale-90 active:bg-primary/40
                  shadow-[0_0_20px_rgba(var(--primary),0.4)]"
              >
                <span className="text-2xl text-primary mb-1">↑</span>
              </button>
            </div>
          </div>
        )}
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
