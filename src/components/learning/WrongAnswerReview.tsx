import type { AnswerRow } from "@/game/learningEngine";

export default function WrongAnswerReview({ answers }: { answers: AnswerRow[] }) {
  const wrong = answers.filter(a => !a.is_correct);
  if (!wrong.length) {
    return <p className="font-mono text-xs text-muted-foreground text-center py-6">No wrong answers in this match — flawless run!</p>;
  }
  return (
    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
      {wrong.map((w, i) => (
        <div key={w.id || i} className="border border-red-500/40 bg-red-950/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel text-[9px] text-red-300">{w.topic}{w.subtopic ? ` · ${w.subtopic}` : ""}</span>
            <span className="font-pixel text-[8px] text-muted-foreground">{w.difficulty || ""}</span>
          </div>
          <p className="font-mono text-xs text-foreground mb-2">{w.question_text || "Question"}</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="border border-red-500/40 rounded p-2"><span className="text-red-300">Your answer:</span> <span className="text-foreground">{w.user_answer || "—"}</span></div>
            <div className="border border-green-500/40 rounded p-2"><span className="text-green-300">Correct:</span> <span className="text-foreground">{w.correct_answer || "—"}</span></div>
          </div>
          {w.explanation && (
            <p className="font-mono text-[10px] text-muted-foreground mt-2 italic">💡 {w.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}
