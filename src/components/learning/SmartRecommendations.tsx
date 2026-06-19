interface Reco {
  topic: string;
  est_days: number;
  confidence_gain: number;
  resources: { kind: string; title: string; url: string }[];
  learning_order: string[];
}

export default function SmartRecommendations({ recos }: { recos: Reco[] }) {
  if (!recos.length) return <p className="font-mono text-xs text-muted-foreground text-center py-6">No weak topics — keep playing harder difficulty!</p>;
  return (
    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
      {recos.map(r => (
        <div key={r.topic} className="border border-secondary/50 bg-secondary/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-pixel text-xs text-secondary">{r.topic}</p>
            <span className="font-mono text-[10px] text-muted-foreground">~{r.est_days}d · +{r.confidence_gain}% confidence</span>
          </div>
          <p className="font-pixel text-[8px] text-muted-foreground mb-1">LEARNING ORDER</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {r.learning_order.map((s, i) => (
              <span key={i} className="text-[9px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/40">{i + 1}. {s}</span>
            ))}
          </div>
          <p className="font-pixel text-[8px] text-muted-foreground mb-1">RESOURCES</p>
          <div className="grid grid-cols-2 gap-1">
            {r.resources.map(res => (
              <a key={res.url} href={res.url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-mono text-foreground hover:text-primary underline-offset-2 hover:underline">
                {res.kind === "video" ? "▶" : res.kind === "notes" ? "📖" : res.kind === "practice" ? "💪" : "🎯"} {res.title}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
