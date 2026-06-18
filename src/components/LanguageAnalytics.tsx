import { LANGUAGES } from '@/game/types';
import type { DashboardData } from '@/game/saveSystem';

export default function LanguageAnalytics({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-2">
      {LANGUAGES.map(l => {
        const p = data.progressByLang[l.id];
        const levels = data.levels.filter(x => x.language === l.id);
        const totalAcc = levels.length ? Math.round(levels.reduce((s, r) => s + r.accuracy, 0) / levels.length) : 0;
        const chSolved = levels.reduce((s, r) => s + r.wins, 0);
        const pct = p ? Math.round(((p.unlockedLevel - 1) / 50) * 100) : 0;
        return (
          <div key={l.id} className="border border-border rounded p-3 bg-card/50">
            <div className="flex justify-between items-center mb-2">
              <span className="font-pixel text-[11px]" style={{ color: l.color }}>{l.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{pct}% complete</span>
            </div>
            <div className="h-2 bg-background border border-border rounded overflow-hidden mb-2">
              <div className="h-full" style={{ width: `${pct}%`, backgroundImage: 'linear-gradient(90deg, hsl(200,100%,65%), hsl(0,90%,60%))' }} />
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div><p className="font-display text-sm font-bold">{p?.currentLevel ?? 0}</p><p className="font-mono text-[8px] text-muted-foreground uppercase">Level</p></div>
              <div><p className="font-display text-sm font-bold">{p?.totalStars ?? 0}</p><p className="font-mono text-[8px] text-muted-foreground uppercase">Stars</p></div>
              <div><p className="font-display text-sm font-bold">{totalAcc}%</p><p className="font-mono text-[8px] text-muted-foreground uppercase">Accuracy</p></div>
              <div><p className="font-display text-sm font-bold">{chSolved}</p><p className="font-mono text-[8px] text-muted-foreground uppercase">Solved</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
