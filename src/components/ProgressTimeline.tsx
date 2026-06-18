import { useEffect, useState } from 'react';
import { getRecentEvents, type ProgressEvent } from '@/game/analytics';

const ICONS: Record<string, string> = {
  level_completed: '🏁',
  achievement_unlocked: '🏆',
  mp_victory: '⚔',
  language_mastered: '👑',
  streak_milestone: '🔥',
  login: '👋',
};

function ago(iso?: string): string {
  if (!iso) return '';
  const d = Date.now() - Date.parse(iso);
  const m = Math.floor(d / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function describe(e: ProgressEvent): string {
  switch (e.kind) {
    case 'level_completed': return `Level ${e.level} completed${e.language ? ' · ' + e.language : ''}`;
    case 'achievement_unlocked': return `Achievement: ${e.payload?.title || e.payload?.id || 'unlocked'}`;
    case 'mp_victory': return `Multiplayer victory${e.payload?.opponent ? ' vs ' + e.payload.opponent : ''}`;
    case 'language_mastered': return `${e.language} mastered`;
    case 'streak_milestone': return `Day ${e.payload?.day} streak · ${e.payload?.reward_kind}`;
    case 'login': return 'Logged in';
    default: return e.kind;
  }
}

export default function ProgressTimeline() {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  useEffect(() => { getRecentEvents(40).then(setEvents); }, []);

  if (!events.length) {
    return <p className="font-mono text-xs text-muted-foreground text-center py-6">No progress events yet — play a level to start your timeline.</p>;
  }

  return (
    <ol className="space-y-2">
      {events.map((e, i) => (
        <li key={(e.id || '') + i} className="flex items-start gap-3 border-l-2 border-primary/40 pl-3 py-1">
          <span className="text-lg leading-none">{ICONS[e.kind] || '•'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-foreground truncate">{describe(e)}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{ago(e.created_at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
