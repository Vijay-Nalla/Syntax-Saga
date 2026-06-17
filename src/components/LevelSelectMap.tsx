import { useEffect, useState } from 'react';
import { getDashboard, DashboardData } from '@/game/saveSystem';
import { Language, LANGUAGES } from '@/game/types';
import { getLevelData } from '@/game/levels';

interface Props {
  language: Language;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

const WORLDS = [
  { name: 'Beginner Plains',    range: [1, 10],  color: 'hsl(200, 100%, 65%)' },
  { name: 'Coding Forest',      range: [11, 20], color: 'hsl(160, 100%, 55%)' },
  { name: 'Underground Caverns',range: [21, 30], color: 'hsl(280, 100%, 65%)' },
  { name: 'Algorithm Temple',   range: [31, 40], color: 'hsl(30, 100%, 60%)' },
  { name: 'Master Kingdom',     range: [41, 50], color: 'hsl(0, 90%, 60%)' },
];

export default function LevelSelectMap({ language, onSelectLevel, onBack }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const langInfo = LANGUAGES.find(l => l.id === language)!;

  useEffect(() => { getDashboard().then(setData); }, []);

  const prog = data?.progressByLang[language];
  const unlockedTo = prog?.unlockedLevel ?? 1;
  const levelMap = new Map<number, { stars: number; best_score: number; best_time_ms: number | null }>();
  data?.levels.filter(l => l.language === language).forEach(l => {
    levelMap.set(l.level, { stars: l.stars, best_score: l.best_score, best_time_ms: l.best_time_ms });
  });

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />
      <div className="relative z-20 max-w-5xl mx-auto p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold" style={{ color: langInfo.color }}>
            {langInfo.name} · LEVEL SELECT
          </h2>
          <button onClick={onBack} className="font-pixel text-[10px] px-3 py-2 border border-border rounded text-muted-foreground hover:text-foreground">
            ← BACK
          </button>
        </div>

        {WORLDS.map(world => (
          <div key={world.name} className="mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <h3 className="font-display text-lg font-bold" style={{ color: world.color }}>{world.name}</h3>
              <span className="font-mono text-[11px] text-muted-foreground">Levels {world.range[0]}–{world.range[1]}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {Array.from({ length: world.range[1] - world.range[0] + 1 }, (_, i) => world.range[0] + i).map(lvl => {
                const ld = getLevelData(lvl);
                const rec = levelMap.get(lvl);
                const completed = (rec?.stars ?? 0) > 0;
                const isUnlocked = lvl <= unlockedTo;
                const isCurrent = lvl === unlockedTo && !completed;
                const stars = rec?.stars ?? 0;
                return (
                  <button
                    key={lvl}
                    disabled={!isUnlocked}
                    onClick={() => onSelectLevel(lvl)}
                    className={`relative text-left p-3 rounded-lg border-2 transition-all
                      ${isUnlocked
                        ? 'hover:scale-[1.03] active:scale-100 cursor-pointer'
                        : 'opacity-40 cursor-not-allowed'}
                      ${completed ? 'border-primary/60 bg-primary/10'
                        : isCurrent ? 'border-destructive/70 bg-destructive/10 shadow-[0_0_18px_rgba(244,63,94,0.3)]'
                        : 'border-border bg-card/50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-pixel text-[10px] text-muted-foreground">LVL {lvl}</span>
                      <span className="text-xs">
                        {!isUnlocked ? '🔒' : completed ? '✓' : '🔓'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] font-bold text-foreground line-clamp-1">{ld.topic}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3].map(s => (
                        <span key={s} className={`text-xs ${s <= stars ? 'opacity-100' : 'opacity-20'}`}>⭐</span>
                      ))}
                    </div>
                    {rec && (
                      <p className="font-mono text-[9px] text-muted-foreground mt-1">
                        Best: {rec.best_score}{rec.best_time_ms ? ` · ${Math.round(rec.best_time_ms / 1000)}s` : ''}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
