// Highlights gaps between the player's mastery and a peer/friend baseline.
import type { MasteryRow } from "@/game/learningEngine";

interface Props {
  mine: MasteryRow[];
  peer?: MasteryRow[];
  peerName?: string;
}

export default function SkillGapAnalysis({ mine, peer = [], peerName = "Peer avg" }: Props) {
  const topics = Array.from(new Set([...mine, ...peer].map(m => m.topic)));
  const rows = topics.map(t => {
    const a = mine.find(m => m.topic === t)?.accuracy ?? 0;
    const b = peer.find(m => m.topic === t)?.accuracy ?? 50;
    return { topic: t, a, b, gap: a - b };
  }).sort((x, y) => x.gap - y.gap);

  if (rows.length === 0) {
    return <p className="font-mono text-[11px] text-muted-foreground text-center py-6">Play a few matches to surface skill gaps.</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map(r => {
        const behind = r.gap < -5;
        const ahead = r.gap > 5;
        const color = behind ? "text-red-300 border-red-500/40 bg-red-950/10"
          : ahead ? "text-green-300 border-green-500/40 bg-green-950/10"
          : "text-muted-foreground border-border bg-card/30";
        return (
          <div key={r.topic} className={`flex items-center justify-between border rounded p-2 ${color}`}>
            <span className="font-pixel text-[10px] uppercase">{r.topic}</span>
            <span className="font-mono text-[10px]">
              You {r.a}% · {peerName} {r.b}% · {r.gap >= 0 ? "+" : ""}{r.gap}
            </span>
          </div>
        );
      })}
    </div>
  );
}
