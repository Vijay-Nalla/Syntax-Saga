import { PlayerState } from '@/game/types';
import { addLeaderboardEntry } from '@/game/leaderboard';
import { useEffect, useRef } from 'react';

interface GameOverScreenProps {
  player: PlayerState;
  onRestart: () => void;
  type: 'game-over' | 'level-complete';
  onNextLevel?: () => void;
  onViewLeaderboard?: () => void;
  playTime: number;
}

export default function GameOverScreen({ player, onRestart, type, onNextLevel, onViewLeaderboard, playTime }: GameOverScreenProps) {
  const isWin = type === 'level-complete';
  const savedRef = useRef(false);

  // Save to leaderboard on game-over
  useEffect(() => {
    if (type === 'game-over' && !savedRef.current) {
      savedRef.current = true;
      addLeaderboardEntry({
        name: player.name,
        coins: player.coins,
        levelsCompleted: player.level - 1,
        timeTaken: playTime,
        language: player.language,
      });
    }
  }, [type, player, playTime]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative z-10 text-center max-w-md mx-4" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h2 className={`font-display text-4xl md:text-5xl font-black mb-4 ${isWin ? 'text-primary text-glow-green' : 'text-destructive'}`}>
          {isWin ? 'LEVEL CLEARED!' : 'SYSTEM CRASH'}
        </h2>

        <p className={`font-pixel text-[10px] mb-8 ${isWin ? 'text-secondary text-glow-cyan' : 'text-destructive'}`}>
          {isWin ? 'Corruption removed. Moving to next sector...' : 'Your process has been terminated.'}
        </p>

        <div className="border border-border rounded-lg p-4 bg-card mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="font-pixel text-[8px] text-muted-foreground mb-1">XP</div>
              <div className="font-display text-lg text-neon-yellow">{player.xp}</div>
            </div>
            <div>
              <div className="font-pixel text-[8px] text-muted-foreground mb-1">COINS</div>
              <div className="font-display text-lg text-neon-yellow">{player.coins}</div>
            </div>
            <div>
              <div className="font-pixel text-[8px] text-muted-foreground mb-1">LEVEL</div>
              <div className="font-display text-lg text-secondary">{player.level}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <div className="flex gap-4 justify-center">
            {isWin && onNextLevel && (
              <button
                onClick={onNextLevel}
                className="font-pixel text-[10px] px-8 py-3 border-2 border-primary text-primary
                  hover:bg-primary hover:text-primary-foreground transition-all box-glow-green"
              >
                NEXT LEVEL
              </button>
            )}
            <button
              onClick={onRestart}
              className="font-pixel text-[10px] px-8 py-3 border-2 border-secondary text-secondary
                hover:bg-secondary hover:text-secondary-foreground transition-all"
            >
              {isWin ? 'RESTART' : 'TRY AGAIN'}
            </button>
          </div>
          {type === 'game-over' && onViewLeaderboard && (
            <button
              onClick={onViewLeaderboard}
              className="font-pixel text-[8px] px-6 py-2 border border-border text-muted-foreground
                hover:border-secondary hover:text-secondary transition-all mt-2"
            >
              VIEW LEADERBOARD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
