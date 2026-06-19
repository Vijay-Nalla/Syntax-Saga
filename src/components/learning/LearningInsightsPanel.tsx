// Full learning intelligence panel mounted inside the PostMatchReport.
// Tabs: Performance · Wrong Answers · Recommendations · Coach.
import { useEffect, useMemo, useState } from "react";
import KnowledgeHeatmap from "./KnowledgeHeatmap";
import WrongAnswerReview from "./WrongAnswerReview";
import SmartRecommendations from "./SmartRecommendations";
import StudyCoachCard from "./StudyCoachCard";
import PlayerComparisonBoard from "./PlayerComparisonBoard";
import {
  buildRecommendations, generateCoachFeedback, summarizeAnswers,
  type AnswerRow, type CoachPayload, type MasteryRow,
} from "@/game/learningEngine";

interface Props {
  answers: AnswerRow[];
  mastery: MasteryRow[];
  language?: string;
  meName: string;
  friendName: string;
  mePerf: { topic: string; accuracy: number }[];
  friendPerf: { topic: string; accuracy: number }[];
}

type Tab = "performance" | "wrong" | "recs" | "coach";

export default function LearningInsightsPanel({ answers, mastery, language, meName, friendName, mePerf, friendPerf }: Props) {
  const [tab, setTab] = useState<Tab>("performance");
  const [coach, setCoach] = useState<CoachPayload | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  const summary = useMemo(() => summarizeAnswers(answers), [answers]);
  const recos = useMemo(() => buildRecommendations(summary.weaknesses.length ? summary.weaknesses : mastery.filter(m => m.accuracy < 50).map(m => m.topic)), [summary.weaknesses, mastery]);
  const cmpRows = useMemo(() => {
    const topics = Array.from(new Set([...mePerf, ...friendPerf].map(p => p.topic)));
    return topics.map(t => {
      const a = mePerf.find(p => p.topic === t)?.accuracy ?? 0;
      const b = friendPerf.find(p => p.topic === t)?.accuracy ?? 0;
      return { topic: t, a, b, aWins: a > b };
    });
  }, [mePerf, friendPerf]);
  const accuracy = useMemo(() => {
    const total = answers.length;
    return total ? Math.round((answers.filter(a => a.is_correct).length / total) * 100) : 0;
  }, [answers]);

  useEffect(() => {
    if (tab !== "coach" || coach || coachLoading) return;
    setCoachLoading(true);
    generateCoachFeedback({
      language, accuracy,
      strengths: summary.strengths,
      weaknesses: summary.weaknesses,
      wrongAnswers: summary.wrong,
    }).then(setCoach).finally(() => setCoachLoading(false));
  }, [tab, coach, coachLoading, language, accuracy, summary]);

  return (
    <div className="border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-4">
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["performance", "wrong", "recs", "coach"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-pixel text-[9px] px-3 py-1.5 rounded border transition-all ${
              tab === t ? "border-primary text-primary bg-primary/10 box-glow-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}>
            {t === "performance" ? "PERFORMANCE" : t === "wrong" ? `WRONG (${summary.wrong.length})` : t === "recs" ? "RECOMMENDATIONS" : "AI COACH"}
          </button>
        ))}
      </div>

      {tab === "performance" && (
        <div className="space-y-4">
          <div>
            <p className="font-pixel text-[10px] text-secondary mb-2">YOU vs {friendName.toUpperCase()}</p>
            <PlayerComparisonBoard rows={cmpRows} nameA={meName} nameB={friendName} />
          </div>
          <div>
            <p className="font-pixel text-[10px] text-secondary mb-2">KNOWLEDGE HEATMAP</p>
            <KnowledgeHeatmap mastery={mastery} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-green-500/40 rounded p-2">
              <p className="font-pixel text-[9px] text-green-300 mb-1">STRENGTHS</p>
              <p className="font-mono text-[10px] text-foreground">{summary.strengths.join(", ") || "Keep practising to build a strength!"}</p>
            </div>
            <div className="border border-red-500/40 rounded p-2">
              <p className="font-pixel text-[9px] text-red-300 mb-1">WEAK AREAS</p>
              <p className="font-mono text-[10px] text-foreground">{summary.weaknesses.join(", ") || "No clear weaknesses — flex harder topics."}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "wrong" && <WrongAnswerReview answers={answers} />}
      {tab === "recs" && <SmartRecommendations recos={recos} />}
      {tab === "coach" && <StudyCoachCard coach={coach} loading={coachLoading} />}
    </div>
  );
}
