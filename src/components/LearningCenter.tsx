// Aggregated learning hub: heatmap + recent recommendations + opt-in friend insights.
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import KnowledgeHeatmap from "./learning/KnowledgeHeatmap";
import SmartRecommendations from "./learning/SmartRecommendations";
import {
  buildRecommendations, fetchRecentAnswers, fetchTopicMastery, summarizeAnswers,
  type AnswerRow, type MasteryRow,
} from "@/game/learningEngine";

export default function LearningCenter() {
  const { user } = useAuth();
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [shareOn, setShareOn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const [m, a, p] = await Promise.all([
        fetchTopicMastery(user.id),
        fetchRecentAnswers(user.id, 100),
        supabase.from("profiles").select("share_insights").eq("user_id", user.id).maybeSingle(),
      ]);
      setMastery(m); setAnswers(a);
      setShareOn(Boolean((p.data as any)?.share_insights));
      setLoading(false);
    })();
  }, [user]);

  const summary = summarizeAnswers(answers);
  const recos = buildRecommendations(summary.weaknesses);

  if (!user) {
    return <p className="font-mono text-xs text-muted-foreground text-center py-8">Sign in to unlock the learning intelligence centre.</p>;
  }
  if (loading) return <p className="font-pixel text-[10px] text-muted-foreground text-center py-8 animate-pulse">LOADING INSIGHTS…</p>;

  const toggleShare = async () => {
    const v = !shareOn;
    setShareOn(v);
    await supabase.from("profiles").update({ share_insights: v } as any).eq("user_id", user.id);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-pixel text-[10px] text-secondary mb-2">KNOWLEDGE HEATMAP</p>
        <KnowledgeHeatmap mastery={mastery} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-green-500/40 rounded p-3 bg-green-950/10">
          <p className="font-pixel text-[9px] text-green-300 mb-1">STRENGTH AREAS</p>
          <p className="font-mono text-[11px] text-foreground">{summary.strengths.join(", ") || "Play more to build strengths."}</p>
        </div>
        <div className="border border-red-500/40 rounded p-3 bg-red-950/10">
          <p className="font-pixel text-[9px] text-red-300 mb-1">WEAK AREAS</p>
          <p className="font-mono text-[11px] text-foreground">{summary.weaknesses.join(", ") || "No clear weaknesses yet."}</p>
        </div>
      </div>

      <div>
        <p className="font-pixel text-[10px] text-secondary mb-2">RECOMMENDED PATH</p>
        <SmartRecommendations recos={recos} />
      </div>

      <div className="border border-border rounded p-3 bg-card/40 flex items-center justify-between">
        <div>
          <p className="font-pixel text-[10px] text-foreground">SHARE INSIGHTS WITH FRIENDS</p>
          <p className="font-mono text-[10px] text-muted-foreground">Lets friends compare strengths and discover who can mentor whom.</p>
        </div>
        <button onClick={toggleShare}
          className={`font-pixel text-[10px] px-3 py-1.5 border-2 rounded ${shareOn ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
          {shareOn ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
