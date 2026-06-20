// Day-by-day study plan derived from weak topics.
interface Props {
  weakTopics: string[];
  days?: number;
}

const PHASES = ["Concepts", "Examples", "Easy practice", "Medium practice", "Timed mock"];

export default function LearningRoadmap({ weakTopics, days = 7 }: Props) {
  const topics = (weakTopics.length ? weakTopics : ["Variables", "Loops", "Functions", "Arrays"]).slice(0, days);
  const plan = Array.from({ length: days }).map((_, i) => ({
    day: i + 1,
    topic: topics[i % topics.length],
    phase: PHASES[i % PHASES.length],
  }));

  return (
    <ol className="space-y-2">
      {plan.map(d => (
        <li key={d.day} className="flex items-center gap-3 border border-border rounded p-2 bg-card/40">
          <div className="w-10 h-10 rounded border-2 border-primary text-primary font-pixel text-[10px] flex items-center justify-center bg-primary/10">
            D{d.day}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-pixel text-[10px] text-foreground truncate">{d.topic}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{d.phase}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
