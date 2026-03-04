import { useEffect, useState } from 'react';

interface TouchControlsProps {
  keysRef: React.MutableRefObject<Set<string>>;
  onPause: () => void;
}

export default function TouchControls({ keysRef, onPause }: TouchControlsProps) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouch) return null;

  const press = (key: string) => keysRef.current.add(key);
  const release = (key: string) => keysRef.current.delete(key);

  const touchProps = (key: string) => ({
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); press(key); },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); release(key); },
    onTouchCancel: (e: React.TouchEvent) => { e.preventDefault(); release(key); },
  });

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none" style={{ touchAction: 'none' }}>
      {/* D-Pad — bottom left */}
      <div className="absolute bottom-6 left-4 pointer-events-auto flex items-center gap-2">
        <button
          {...touchProps('ArrowLeft')}
          className="w-14 h-14 rounded-full border-2 border-primary/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center text-primary text-xl active:bg-primary/30 active:scale-95 transition-all"
        >
          ◀
        </button>
        <button
          {...touchProps('ArrowDown')}
          className="w-12 h-12 rounded-full border-2 border-secondary/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center text-secondary text-lg active:bg-secondary/30 active:scale-95 transition-all"
        >
          ▼
        </button>
        <button
          {...touchProps('ArrowRight')}
          className="w-14 h-14 rounded-full border-2 border-primary/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center text-primary text-xl active:bg-primary/30 active:scale-95 transition-all"
        >
          ▶
        </button>
      </div>

      {/* Action buttons — bottom right */}
      <div className="absolute bottom-6 right-4 pointer-events-auto flex items-end gap-3">
        <button
          {...touchProps('e')}
          className="w-12 h-12 rounded-full border-2 border-accent/60 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[9px] text-accent active:bg-accent/30 active:scale-95 transition-all"
        >
          ACT
        </button>
        <button
          {...touchProps(' ')}
          className="w-16 h-16 rounded-full border-2 border-primary/80 bg-card/40 backdrop-blur-sm
            flex items-center justify-center font-pixel text-[10px] text-primary active:bg-primary/30 active:scale-95 transition-all
            shadow-[0_0_15px_hsla(var(--primary)/0.3)]"
        >
          JUMP
        </button>
      </div>
    </div>
  );
}
