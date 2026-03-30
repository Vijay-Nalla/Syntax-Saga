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
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); press(key); },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); release(key); },
    onTouchCancel: (e: React.TouchEvent) => { e.preventDefault(); release(key); },
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Joystick — bottom left */}
      <div className="absolute bottom-12 left-8 pointer-events-auto">
        <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />
      </div>

      {/* Action buttons cluster — bottom right (Diamond/Arc layout to prevent collision) */}
      <div className="absolute bottom-32 right-32 pointer-events-auto">
        {/* Jump Button (Main - Top) */}
        <button
          {...touchProps(' ')}
          className="absolute -top-4 -left-4 w-20 h-20 rounded-full border-2 border-primary/80 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[12px] text-primary active:bg-primary/30 active:scale-95 transition-all
            shadow-[0_0_20px_hsla(var(--primary)/0.4)]"
          style={{ transform: 'translate(40px, -40px)' }}
        >
          JUMP
        </button>

        {/* Interact/ACT Button (Right) */}
        <button
          {...touchProps('e')}
          className="absolute -top-2 -left-2 w-16 h-16 rounded-full border-2 border-accent/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[9px] text-accent active:bg-accent/30 active:scale-95 transition-all"
          style={{ transform: 'translate(100px, 30px)' }}
        >
          ACT
        </button>

        {/* Bend/Crouch Button (Bottom) */}
        <button
          {...touchProps('ArrowDown')}
          className="absolute -top-2 -left-2 w-16 h-16 rounded-full border-2 border-secondary/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[9px] text-secondary active:bg-secondary/30 active:scale-95 transition-all"
          style={{ transform: 'translate(20px, 90px)' }}
        >
          BEND
        </button>

        {/* Hint Button (Left) */}
        <button
          onClick={(e) => { e.preventDefault(); onHint?.(); }}
          className="absolute -top-2 -left-2 w-14 h-14 rounded-full border-2 border-neon-yellow/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[8px] text-neon-yellow active:bg-neon-yellow/30 active:scale-95 transition-all"
          style={{ transform: 'translate(-50px, 30px)' }}
        >
          HINT
        </button>
      </div>
    </div>
  );
}
