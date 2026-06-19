import type { MasteryRow } from "@/game/learningEngine";

const TOPICS = ["Python", "Java", "C++", "JavaScript", "SQL", "DBMS", "OS", "CN", "Aptitude", "Variables", "Loops", "Functions", "Arrays", "Strings"];

export default function KnowledgeHeatmap({ mastery }: { mastery: MasteryRow[] }) {
  const map = new Map(mastery.map(m => [m.topic, m]));
  const cell = (t: string) => {
    const m = map.get(t);
    if (!m) return { bg: "bg-muted/20 text-muted-foreground", label: "—" };
    if (m.accuracy >= 75) return { bg: "bg-green-500/30 text-green-200 border-green-500", label: `${m.accuracy}%` };
    if (m.accuracy >= 45) return { bg: "bg-yellow-500/30 text-yellow-200 border-yellow-500", label: `${m.accuracy}%` };
    return { bg: "bg-red-500/30 text-red-200 border-red-500", label: `${m.accuracy}%` };
  };
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {TOPICS.map(t => {
        const c = cell(t);
        return (
          <div key={t} className={`border rounded-lg p-2 text-center ${c.bg}`}>
            <p className="font-pixel text-[8px] mb-1">{t}</p>
            <p className="font-mono text-xs font-bold">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}
