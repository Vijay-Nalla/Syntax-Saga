import { useEffect, useState } from 'react';
import { getDashboard, DashboardData } from '@/game/saveSystem';
import { useAuth } from '@/hooks/useAuth';
import SyncStatusBadge from './SyncStatusBadge';
import { LANGUAGES, Language } from '@/game/types';
import { ACHIEVEMENTS } from '@/game/achievements';

interface Props {
  onPlay: () => void;
  onSelectLanguage: () => void;
  onMultiplayer: () => void;
  onSignOut: () => void;
}

export default function PlayerDashboard({ onPlay, onSelectLanguage, onMultiplayer, onSignOut }: Props) {
  const { username: authName, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    getDashboard().then(setData);
  }, []);

  if (!data) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <p className="font-pixel text-xs text-primary">LOADING PROFILE…</p>
    </div>;
  }

  // Find best "continue" target
  const langs = Object.values(data.progressByLang).sort((a, b) => b.currentLevel - a.currentLevel);
  const top = langs[0];
  const topLangInfo = top ? LANGUAGES.find(l => l.id === top.language as Language) : null;

  const totalStars = langs.reduce((s, l) => s + l.totalStars, 0);
  const ach = ACHIEVEMENTS.filter(a => data.achievements.includes(a.id));

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />
      <div className="relative z-20 max-w-3xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold"
              style={{
                backgroundImage: 'linear-gradient(135deg, hsl(200,100%,65%), hsl(0,90%,60%))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
              {authName || data.username}
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {user ? 'Cloud account' : 'Guest profile — sign up to keep progress safe'}
            </p>
          </div>
          <SyncStatusBadge status={data.cloudSync === 'cloud' ? 'cloud' : 'local'} />
        </div>

        {/* Continue card */}
        <div className="border-2 border-primary/40 rounded-lg p-5 bg-card/70 backdrop-blur-md mb-4 shadow-[0_0_25px_rgba(56,189,248,0.15)]">
          <p className="font-pixel text-[10px] text-muted-foreground mb-1">CONTINUE ADVENTURE</p>
          {top && topLangInfo ? (
            <>
              <p className="font-display text-xl font-bold mb-1" style={{ color: topLangInfo.color }}>
                {topLangInfo.name} · Level {top.currentLevel}
              </p>
              <p className="font-mono text-xs text-muted-foreground mb-4">
                {top.totalStars} ⭐ earned · {top.unlockedLevel - 1} levels unlocked
              </p>
              <button onClick={onPlay}
                className="w-full font-pixel text-xs px-4 py-3 rounded border-2 border-primary text-primary bg-primary/10 hover:bg-primary/20 transition-all">
                ▶ CONTINUE
              </button>
            </>
          ) : (
            <>
              <p className="font-mono text-sm text-muted-foreground mb-4">No progress yet — pick a language to start.</p>
              <button onClick={onSelectLanguage}
                className="w-full font-pixel text-xs px-4 py-3 rounded border-2 border-primary text-primary bg-primary/10 hover:bg-primary/20">
                CHOOSE LANGUAGE
              </button>
            </>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total Stars', value: totalStars },
            { label: 'Levels', value: data.stats.levels_completed },
            { label: 'Challenges', value: data.stats.challenges_solved },
            { label: 'MP Wins', value: data.stats.mp_wins },
          ].map(s => (
            <div key={s.label} className="border border-border rounded p-3 bg-card/50 text-center">
              <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Language progress */}
        <div className="border border-border rounded-lg p-4 bg-card/50 mb-4">
          <p className="font-pixel text-[10px] text-muted-foreground mb-3">LANGUAGE PROGRESS</p>
          <div className="space-y-2">
            {LANGUAGES.map(l => {
              const p = data.progressByLang[l.id];
              const pct = p ? Math.round(((p.unlockedLevel - 1) / 50) * 100) : 0;
              return (
                <div key={l.id} className="flex items-center gap-3">
                  <span className="font-pixel text-[10px] w-20" style={{ color: l.color }}>{l.name}</span>
                  <div className="flex-1 h-2 bg-background border border-border rounded overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, backgroundImage: 'linear-gradient(90deg, hsl(200,100%,65%), hsl(0,90%,60%))' }} />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground w-16 text-right">
                    {p ? `Lvl ${p.currentLevel}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="border border-border rounded-lg p-4 bg-card/50 mb-4">
          <p className="font-pixel text-[10px] text-muted-foreground mb-3">ACHIEVEMENTS ({ach.length}/{ACHIEVEMENTS.length})</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {ACHIEVEMENTS.map(a => {
              const got = data.achievements.includes(a.id);
              return (
                <div key={a.id} title={a.description}
                  className={`text-center p-2 rounded border ${got ? 'border-primary/60 bg-primary/10' : 'border-border bg-background/30 opacity-40'}`}>
                  <div className="text-2xl">{a.icon}</div>
                  <p className="font-mono text-[9px] mt-1 leading-tight">{a.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={onSelectLanguage}
            className="flex-1 font-pixel text-[11px] px-4 py-3 rounded border border-border hover:border-primary hover:text-primary">
            CHANGE LANGUAGE / LEVEL
          </button>
          <button onClick={onMultiplayer}
            className="flex-1 font-pixel text-[11px] px-4 py-3 rounded border border-border hover:border-destructive hover:text-destructive">
            MULTIPLAYER
          </button>
          <button onClick={onSignOut}
            className="font-pixel text-[10px] px-4 py-3 rounded border border-border text-muted-foreground hover:text-foreground">
            SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
}
