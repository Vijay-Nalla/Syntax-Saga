import { useEffect, useState, lazy, Suspense } from 'react';
import { getDashboard, DashboardData } from '@/game/saveSystem';
import { useAuth } from '@/hooks/useAuth';
import CloudStatusBadge from './CloudStatusBadge';
import { LANGUAGES, Language } from '@/game/types';
import { ACHIEVEMENTS } from '@/game/achievements';

// Lazy-load heavy tab content to keep initial bundle small.
const LanguageAnalytics = lazy(() => import('./LanguageAnalytics'));
const ProgressTimeline = lazy(() => import('./ProgressTimeline'));
const PerformanceGraphs = lazy(() => import('./PerformanceGraphs'));
const BackupRestorePanel = lazy(() => import('./BackupRestorePanel'));
const SyncDashboard = lazy(() => import('./SyncDashboard'));
const RewardHistoryPanel = lazy(() => import('./RewardHistoryPanel'));
const LearningCenter = lazy(() => import('./LearningCenter'));
const FriendsPanel = lazy(() => import('./FriendsPanel'));
const DailyRewardModal = lazy(() => import('./DailyRewardModal'));
const SaveConflictModal = lazy(() => import('./SaveConflictModal'));

const TabFallback = () => <div className="font-pixel text-[10px] text-muted-foreground p-4">Loading…</div>;

interface Props {
  onPlay: () => void;
  onSelectLanguage: () => void;
  onMultiplayer: () => void;
  onSignOut: () => void;
}

type Tab = 'overview' | 'languages' | 'history' | 'graphs' | 'backups' | 'sync' | 'rewards' | 'learning' | 'friends';


export default function PlayerDashboard({ onPlay, onSelectLanguage, onMultiplayer, onSignOut }: Props) {
  const { username: authName, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    getDashboard().then(setData);
  }, []);

  if (!data) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <p className="font-pixel text-xs text-primary">LOADING PROFILE…</p>
    </div>;
  }

  const langs = Object.values(data.progressByLang).sort((a, b) => b.currentLevel - a.currentLevel);
  const top = langs[0];
  const topLangInfo = top ? LANGUAGES.find(l => l.id === top.language as Language) : null;
  const totalStars = langs.reduce((s, l) => s + l.totalStars, 0);
  const ach = ACHIEVEMENTS.filter(a => data.achievements.includes(a.id));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'learning', label: 'LEARNING' },
    { id: 'languages', label: 'LANGUAGES' },
    { id: 'history', label: 'HISTORY' },
    { id: 'graphs', label: 'GRAPHS' },
    { id: 'sync', label: 'SYNC' },
    { id: 'rewards', label: 'REWARDS' },
    ...(user ? [{ id: 'friends' as Tab, label: 'FRIENDS' }] : []),
    ...(user ? [{ id: 'backups' as Tab, label: 'BACKUPS' }] : []),
  ];


  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />
      <div className="relative z-20 max-w-3xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
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
          <CloudStatusBadge variant="inline" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`font-pixel text-[10px] px-3 py-2 rounded border whitespace-nowrap ${
                tab === t.id ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
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
          </>
        )}

        <Suspense fallback={<TabFallback />}>
          {tab === 'languages' && <LanguageAnalytics data={data} />}
          {tab === 'history' && (
            <div className="border border-border rounded-lg p-4 bg-card/50">
              <p className="font-pixel text-[10px] text-muted-foreground mb-3">PROGRESS TIMELINE</p>
              <ProgressTimeline />
            </div>
          )}
          {tab === 'graphs' && <PerformanceGraphs data={data} />}
          {tab === 'backups' && <BackupRestorePanel />}
          {tab === 'sync' && <SyncDashboard />}
          {tab === 'rewards' && <RewardHistoryPanel />}
          {tab === 'learning' && <LearningCenter />}
          {tab === 'friends' && <FriendsPanel />}
        </Suspense>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
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
            {user ? 'SIGN OUT' : 'EXIT GUEST'}
          </button>
        </div>
      </div>

      {/* Account-only modals */}
      <Suspense fallback={null}>
        {user && <SaveConflictModal />}
        {user && <DailyRewardModal />}
      </Suspense>
    </div>
  );
}

