import { PlayerState } from '@/game/types';

interface GameHUDProps {
  player: PlayerState;
  levelNum: number;
  levelTopic: string;
  isUnderground?: boolean;
}

export default function GameHUD({ player, levelNum, levelTopic, isUnderground }: GameHUDProps) {
  const healthPercent = player.health;
  const healthColor = healthPercent > 60 ? 'hsl(var(--neon-green))' : healthPercent > 30 ? 'hsl(var(--neon-yellow))' : 'hsl(var(--destructive))';

  const rank = levelNum <= 10 ? 'Rookie' : levelNum <= 20 ? 'Loop Warrior' : levelNum <= 30 ? 'Function Knight' : levelNum <= 40 ? 'Data Commander' : 'Grandmaster';

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-start justify-between p-3 gap-4">
        {/* Health + Player name */}
        <div className="flex flex-col gap-1 min-w-[180px] ml-20">
          <span className="font-pixel text-[7px] text-foreground truncate max-w-[120px]">
            {player.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[8px] text-destructive">HP</span>
            <div className="flex-1 h-3 bg-muted rounded-sm border border-border overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-sm"
                style={{ width: `${healthPercent}%`, backgroundColor: healthColor, boxShadow: `0 0 8px ${healthColor}` }}
              />
            </div>
            <span className="font-pixel text-[8px] text-foreground">{player.health}</span>
          </div>
        </div>

        {/* Level info */}
        <div className="text-center">
          <div className="font-pixel text-[8px] text-secondary text-glow-cyan">
            LEVEL {levelNum} {isUnderground && <span className="text-neon-orange">⬇ UNDERGROUND</span>}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {levelTopic}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 min-w-[140px]">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[8px] text-neon-yellow">
              ★ {player.xp} XP
            </span>
            <span className="font-pixel text-[8px] text-neon-yellow">
              $ {player.coins}
            </span>
          </div>
          <span className="font-mono text-[9px] text-accent">{rank}</span>
        </div>
      </div>
    </div>
  );
}
