import { useEffect, useState } from 'react';

interface TitleScreenProps {
  onStart: () => void;
}

const STORY_TEXT = "When the world's code was corrupted by infinite loops and broken promises, five programming realms collapsed into chaos. Only one programmer can master every language, defeat the Bug King, and restore balance to the Coding Multiverse.";

export default function TitleScreen({ onStart }: TitleScreenProps) {
  const [showStory, setShowStory] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowStory(true), 800);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!showStory) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(STORY_TEXT.slice(0, i));
      if (i >= STORY_TEXT.length) {
        clearInterval(interval);
        setTimeout(() => setReady(true), 500);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [showStory]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Scanlines overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      {/* Matrix rain effect */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-primary font-mono text-xs"
            style={{
              left: `${(i / 30) * 100}%`,
              animation: `matrixRain ${3 + Math.random() * 4}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            {Array.from({ length: 20 }).map((_, j) => (
              <div key={j}>{String.fromCharCode(0x30A0 + Math.random() * 96)}</div>
            ))}
          </div>
        ))}
      </div>

      <div className="relative z-20 text-center px-8 max-w-3xl">
        {/* Title */}
        <h1 className="font-display text-5xl md:text-7xl font-black text-primary text-glow-green mb-2 glitch-text">
          SYNTAX SAGA
        </h1>
        <p className="font-pixel text-xs md:text-sm text-neon-cyan text-glow-cyan mb-12 tracking-widest">
          THE MULTIVERSE CODING ADVENTURE
        </p>

        {/* Story */}
        {showStory && (
          <div className="border border-border rounded-lg p-6 bg-card/80 backdrop-blur mb-10 min-h-[120px]">
            <p className="font-mono text-sm text-foreground leading-relaxed">
              {typedText}
              {typedText.length < STORY_TEXT.length && <span className="typing-cursor" />}
            </p>
          </div>
        )}

        {/* Start button */}
        {ready && (
          <button
            onClick={onStart}
            className="font-pixel text-sm px-10 py-4 border-2 border-primary text-primary bg-transparent
              hover:bg-primary hover:text-primary-foreground transition-all duration-300
              box-glow-green hover:scale-105 active:scale-95"
            style={{ animation: 'fadeInUp 0.5s ease-out' }}
          >
            PRESS START
          </button>
        )}

        <p className="font-mono text-xs text-muted-foreground mt-6 opacity-60">
          Arrow Keys / WASD to move • Space to jump • E to interact
        </p>
      </div>
    </div>
  );
}
