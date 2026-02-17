import { getLeaderboard } from '@/game/leaderboard';

interface LeaderboardScreenProps {
  onBack: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

export default function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const entries = getLeaderboard();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="absolute inset-0 scanlines pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg mx-4 border-2 border-secondary rounded-lg bg-card p-6 box-glow-cyan"
        style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        <h2 className="font-display text-2xl font-black text-secondary text-glow-cyan text-center mb-6">
          LEADERBOARD
        </h2>

        {entries.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground text-center py-8">
            No scores yet. Be the first to hack the system!
          </p>
        ) : (
          <div className="space-y-1 mb-4">
            {/* Header */}
            <div className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem_4rem] gap-2 font-pixel text-[7px] text-muted-foreground px-2 pb-2 border-b border-border">
              <span>#</span><span>NAME</span><span>LVL</span><span>COIN</span><span>TIME</span><span>SCORE</span>
            </div>
            {entries.map((e, i) => (
              <div key={i}
                className={`grid grid-cols-[2rem_1fr_3rem_3rem_4rem_4rem] gap-2 font-mono text-xs px-2 py-2 rounded
                  ${i === 0 ? 'bg-primary/10 text-primary' : i === 1 ? 'bg-secondary/10 text-secondary' : i === 2 ? 'bg-neon-yellow/10 text-neon-yellow' : 'text-foreground'}`}>
                <span className="font-pixel text-[8px]">{i + 1}</span>
                <span className="truncate">{e.name}</span>
                <span>{e.levelsCompleted}</span>
                <span>{e.coins}</span>
                <span className="text-[10px]">{formatTime(e.timeTaken)}</span>
                <span className="font-pixel text-[8px]">{e.score}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full font-pixel text-[10px] px-8 py-3 border-2 border-border text-muted-foreground
            hover:border-foreground hover:text-foreground transition-all mt-2"
        >
          ← BACK
        </button>
      </div>
    </div>
  );
}
