import { audioManager } from '@/game/audioManager';

interface GameModeSelectProps {
  playerName: string;
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
  onBack: () => void;
}

export default function GameModeSelect({
  playerName,
  onSinglePlayer,
  onMultiplayer,
  onBack
}: GameModeSelectProps) {

  const handleSinglePlayer = () => {
    audioManager.resumeContext();
    onSinglePlayer();
  };

  const handleMultiplayer = () => {
    audioManager.resumeContext();
    onMultiplayer();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-black text-primary text-glow-primary mb-4"
            style={{
              background: 'linear-gradient(135deg, hsl(200, 90%, 70%), hsl(350, 80%, 65%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WELCOME, {playerName.toUpperCase()}
          </h2>
          <p className="font-pixel text-sm text-muted-foreground">Choose Your Adventure</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleSinglePlayer}
            className="flex flex-col items-start p-6 border-2 border-primary bg-card/80 backdrop-blur-sm
              hover:bg-primary/10 hover:scale-[1.02] transition-all duration-300 rounded-lg box-glow-primary"
          >
            <div className="text-4xl mb-3">🎮</div>
            <h3 className="font-pixel text-lg text-primary text-glow-primary mb-2">SINGLE PLAYER</h3>
            <p className="font-mono text-xs text-muted-foreground">Continue your solo coding journey.</p>
          </button>

          <button
            onClick={handleMultiplayer}
            className="flex flex-col items-start p-6 border-2 border-secondary bg-card/80 backdrop-blur-sm
              hover:bg-secondary/10 hover:scale-[1.02] transition-all duration-300 rounded-lg box-glow-primary"
          >
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-pixel text-lg text-secondary text-glow-cyan mb-2">PLAY WITH FRIENDS</h3>
            <p className="font-mono text-xs text-muted-foreground">Compete and learn together online.</p>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 font-pixel text-[10px] text-muted-foreground hover:text-foreground transition-all"
        >
          ← BACK
        </button>
      </div>
    </div>
  );
}
