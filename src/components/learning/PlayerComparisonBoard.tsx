interface Row { topic: string; a: number; b: number; aWins: boolean; }

export default function PlayerComparisonBoard({ rows, nameA, nameB }: { rows: Row[]; nameA: string; nameB: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between font-pixel text-[10px] mb-2">
        <span className="text-primary">{nameA}</span>
        <span className="text-secondary">{nameB}</span>
      </div>
      {rows.map(r => (
        <div key={r.topic}>
          <div className="flex justify-between font-mono text-[10px] mb-1">
            <span className={r.aWins ? "text-primary font-bold" : "text-muted-foreground"}>{r.a}%</span>
            <span className="text-muted-foreground">{r.topic}</span>
            <span className={!r.aWins ? "text-secondary font-bold" : "text-muted-foreground"}>{r.b}%</span>
          </div>
          <div className="flex h-2 bg-muted/30 rounded overflow-hidden">
            <div className="bg-primary/70 transition-all" style={{ width: `${r.a / 2}%` }} />
            <div className="bg-muted/40" style={{ width: `${100 - (r.a + r.b) / 2}%` }} />
            <div className="bg-secondary/70 transition-all" style={{ width: `${r.b / 2}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
