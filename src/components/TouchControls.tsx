import { useEffect, useState, useCallback } from 'react';
import { Joystick } from './Joystick';

interface TouchControlsProps {
  keysRef: React.MutableRefObject<Set<string>>;
  onPause: () => void;
  onHint?: () => void;
}

export default function TouchControls({ keysRef, onPause, onHint }: TouchControlsProps) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    // Left/Right
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

    // Down/Crouch
    if (y > 0.5) {
      keysRef.current.add('ArrowDown');
    } else {
      keysRef.current.delete('ArrowDown');
    }
  }, [keysRef]);

  const handleJoystickEnd = useCallback(() => {
    keysRef.current.delete('ArrowLeft');
    keysRef.current.delete('ArrowRight');
    keysRef.current.delete('ArrowDown');
  }, [keysRef]);

  if (!isTouch) return null;

  const press = (key: string) => keysRef.current.add(key);
  const release = (key: string) => keysRef.current.delete(key);

  const touchProps = (key: string) => ({
    onTouchStart: (e: React.TouchEvent) => { 
      if (e.cancelable) e.preventDefault(); 
      press(key); 
    },
    onTouchEnd: (e: React.TouchEvent) => { 
      if (e.cancelable) e.preventDefault(); 
      release(key); 
    },
    onTouchCancel: (e: React.TouchEvent) => { 
      if (e.cancelable) e.preventDefault(); 
      release(key); 
    },
    style: { touchAction: 'none' } as React.CSSProperties
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Joystick — bottom left */}
      <div className="absolute bottom-12 left-12 pointer-events-auto">
        <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />
      </div>

      {/* Action buttons cluster — bottom right (Diamond layout with better spacing) */}
      <div className="absolute bottom-40 right-40 pointer-events-auto">
        {/* Jump Button (Top) */}
        <button
          {...touchProps(' ')}
          className="absolute w-20 h-20 rounded-full border-2 border-primary/80 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[12px] text-primary active:bg-primary/30 active:scale-95 transition-all
            shadow-[0_0_20px_hsla(var(--primary)/0.4)]"
          style={{ transform: 'translate(-10px, -100px)', touchAction: 'none' }}
        >
          JUMP
        </button>

        {/* Interact/ACT Button (Right) */}
        <button
          {...touchProps('e')}
          className="absolute w-16 h-16 rounded-full border-2 border-accent/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[9px] text-accent active:bg-accent/30 active:scale-95 transition-all"
          style={{ transform: 'translate(80px, -10px)', touchAction: 'none' }}
        >
          ACT
        </button>

        {/* Bend/Crouch Button (Bottom) */}
        <button
          {...touchProps('ArrowDown')}
          className="absolute w-16 h-16 rounded-full border-2 border-secondary/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[9px] text-secondary active:bg-secondary/30 active:scale-95 transition-all"
          style={{ transform: 'translate(-10px, 70px)', touchAction: 'none' }}
        >
          BEND
        </button>

        {/* Hint Button (Left) */}
        <button
          onClick={(e) => { e.preventDefault(); onHint?.(); }}
          className="absolute w-14 h-14 rounded-full border-2 border-neon-yellow/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[8px] text-neon-yellow active:bg-neon-yellow/30 active:scale-95 transition-all"
          style={{ transform: 'translate(-90px, -10px)', touchAction: 'none' }}
        >
          HINT
        </button>
      </div>
    </div>
  );
}
