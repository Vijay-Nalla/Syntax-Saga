import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { DashboardData } from '@/game/saveSystem';
import { getRecentEvents, type ProgressEvent } from '@/game/analytics';

export default function PerformanceGraphs({ data }: { data: DashboardData }) {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  useEffect(() => { getRecentEvents(100).then(setEvents); }, []);

  const accuracyByLevel = useMemo(() =>
    [...data.levels].sort((a, b) => a.level - b.level).slice(-15)
      .map(l => ({ name: `L${l.level}`, accuracy: l.accuracy })),
    [data]);

  const starsByLang = useMemo(() =>
    Object.values(data.progressByLang).map(p => ({ name: p.language, stars: p.totalStars })),
    [data]);

  const loginActivity = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach(e => {
      const d = (e.created_at || '').slice(0, 10);
      if (!d) return;
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries()).sort().slice(-14).map(([date, count]) => ({ name: date.slice(5), count }));
  }, [events]);

  const tickProps = { style: { fontSize: 10, fontFamily: 'monospace' } as any };

  const Box = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border border-border rounded-lg p-3 bg-card/50">
      <p className="font-pixel text-[10px] text-muted-foreground mb-2">{title}</p>
      <div className="h-40">{children}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Box title="ACCURACY TREND">
        {accuracyByLevel.length ? (
          <ResponsiveContainer>
            <LineChart data={accuracyByLevel}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={tickProps} />
              <YAxis domain={[0, 100]} tick={tickProps} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Line type="monotone" dataKey="accuracy" stroke="hsl(200,100%,65%)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Box>
      <Box title="STARS BY LANGUAGE">
        {starsByLang.length ? (
          <ResponsiveContainer>
            <BarChart data={starsByLang}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={tickProps} />
              <YAxis tick={tickProps} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Bar dataKey="stars" fill="hsl(0,90%,60%)" />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Box>
      <Box title="LEVELS COMPLETED">
        <div className="flex items-center justify-center h-full">
          <p className="font-display text-5xl font-bold"
            style={{ backgroundImage: 'linear-gradient(135deg, hsl(200,100%,65%), hsl(0,90%,60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {data.stats.levels_completed}
          </p>
        </div>
      </Box>
      <Box title="ACTIVITY (last 14d)">
        {loginActivity.length ? (
          <ResponsiveContainer>
            <BarChart data={loginActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={tickProps} />
              <YAxis tick={tickProps} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(200,100%,65%)" />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Box>
    </div>
  );
}

function Empty() {
  return <div className="flex items-center justify-center h-full">
    <p className="font-mono text-xs text-muted-foreground">No data yet</p>
  </div>;
}
