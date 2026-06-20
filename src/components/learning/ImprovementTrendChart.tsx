// Rolling accuracy chart over recent answers (groups by day, last 14 days).
import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { AnswerRow } from "@/game/learningEngine";

interface Props { answers: AnswerRow[] }

export default function ImprovementTrendChart({ answers }: Props) {
  const data = useMemo(() => {
    const byDay = new Map<string, { c: number; t: number }>();
    for (const a of answers) {
      const d = (a.created_at || new Date().toISOString()).slice(0, 10);
      const cur = byDay.get(d) || { c: 0, t: 0 };
      cur.t++; if (a.is_correct) cur.c++;
      byDay.set(d, cur);
    }
    return Array.from(byDay.entries())
      .sort(([x], [y]) => x.localeCompare(y))
      .slice(-14)
      .map(([day, v]) => ({ day: day.slice(5), accuracy: Math.round((v.c / v.t) * 100) }));
  }, [answers]);

  if (data.length < 2) {
    return <p className="font-mono text-[11px] text-muted-foreground text-center py-6">Need more sessions to plot a trend.</p>;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
          <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
          <Line type="monotone" dataKey="accuracy" stroke="hsl(200,100%,65%)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
