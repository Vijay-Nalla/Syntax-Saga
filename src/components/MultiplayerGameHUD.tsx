import { PlayerState, Language } from '@/game/types';
import { LANGUAGES } from '@/game/types';

interface MultiplayerGameHUDProps {
  player1: {
    name: string;
    score: number;
    coins: number;
    x: number;
  };
  player2: {
    name: string;
    score: number;
    coins: number;
    x: number;
  };
  levelNum: number;
  levelTopic: string;
  isUnderground: boolean;
  timeElapsed: number;
}

export default function MultiplayerGameHUD({
  player1,
  player2,
  levelNum,
  levelTopic,
  isUnderground,
  timeElapsed
}: MultiplayerGameHUDProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getLeadText = () => {
    const diff = Math.abs(player1.x - player2.x);
    if (diff < 5) return 'Neck and Neck';
    if (player1.x > player2.x) return `You Lead by ${Math.floor(diff)}m`;
    return `Friend Ahead by ${Math.floor(diff)}m`;
  };

  return (
    <div className="absolute inset-x-0 top-0 z-30 pointer-events-none p-2 sm:p-3">
      {/* Top HUD Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Level Info */}
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded p-2 sm:p-3">
          <p className="font-pixel text-[8px] sm:text-[9px] text-muted-foreground">LEVEL {levelNum}</p>
          <p className="font-mono text-[10px] text-foreground">{levelTopic}</p>
        </div>

        {/* Live Scores */}
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded p-2 sm:p-3 flex flex-col items-center gap-1">
          <p className="font-pixel text-[8px] text-muted-foreground">LIVE SCOREBOARD</p>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="font-pixel text-[8px] text-primary">YOU</p>
              <p className="font-display text-lg text-primary text-glow-primary">{player1.score}</p>
              <p className="font-pixel text-[8px] text-muted-foreground">{player1.coins} coins</p>
            </div>
            <div className="text-center">
              <p className="font-pixel text-[8px] text-secondary">FRIEND</p>
              <p className="font-display text-lg text-secondary text-glow-cyan">{player2.score}</p>
              <p className="font-pixel text-[8px] text-muted-foreground">{player2.coins} coins</p>
            </div>
          </div>
        </div>

        {/* Time and Lead */}
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded p-2 sm:p-3 text-right">
          <p className="font-pixel text-[8px] sm:text-[9px] text-muted-foreground">TIME</p>
          <p className="font-mono text-[10px] text-foreground">{formatTime(timeElapsed)}</p>
          <p className="font-pixel text-[8px] text-secondary mt-1">{getLeadText()}</p>
        </div>
      </div>
    </div>
  );
}
