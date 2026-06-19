import type { CoachPayload } from "@/game/learningEngine";

export default function StudyCoachCard({ coach, loading }: { coach: CoachPayload | null; loading: boolean }) {
  if (loading && !coach) {
    return (
      <div className="border-2 border-secondary/50 rounded-lg bg-card/50 p-4">
        <p className="font-pixel text-xs text-secondary text-center animate-pulse">AI COACH ANALYZING YOUR MATCH…</p>
      </div>
    );
  }
  if (!coach) return null;
  return (
    <div className="space-y-3">
      <div className="border-2 border-secondary rounded-lg bg-secondary/10 p-4">
        <p className="font-pixel text-[9px] text-secondary mb-2">🎓 PERSONAL COACH</p>
        <p className="font-mono text-xs text-foreground mb-3">{coach.coachNote}</p>
        <p className="font-pixel text-[8px] text-muted-foreground mb-1">FOCUS NEXT</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {coach.focusAreas.map(f => (
            <span key={f} className="text-[9px] px-2 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/40">{f}</span>
          ))}
        </div>
        <p className="font-pixel text-[8px] text-muted-foreground mb-1">7-DAY ROADMAP</p>
        <ol className="space-y-1">
          {coach.roadmap.map((d, i) => (
            <li key={i} className="font-mono text-[10px] text-foreground">→ {d}</li>
          ))}
        </ol>
        <p className="font-mono text-[10px] text-primary italic mt-3 text-center">{coach.encouragement}</p>
      </div>
    </div>
  );
}
