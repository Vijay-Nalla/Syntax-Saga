// Aggregated opt-in peer insights: average accuracy per topic across share_insights=true players.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SkillGapAnalysis from "./SkillGapAnalysis";
import type { MasteryRow } from "@/game/learningEngine";

export default function FriendLearningInsights({ mine }: { mine: MasteryRow[] }) {
  const [peer, setPeer] = useState<MasteryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: shared } = await supabase.from("profiles").select("user_id").eq("share_insights", true).limit(200);
        const ids = (shared || []).map((s: any) => s.user_id);
        if (!ids.length) { setLoading(false); return; }
        const { data } = await supabase.from("topic_mastery").select("topic, accuracy").in("user_id", ids);
        const agg = new Map<string, { sum: number; n: number }>();
        for (const r of (data || []) as any[]) {
          const cur = agg.get(r.topic) || { sum: 0, n: 0 };
          cur.sum += r.accuracy; cur.n++;
          agg.set(r.topic, cur);
        }
        setPeer(Array.from(agg.entries()).map(([topic, v]) => ({
          topic, accuracy: Math.round(v.sum / v.n), correct: 0, wrong: 0, mastery_level: "avg" as const,
        })));
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <p className="font-pixel text-[10px] text-muted-foreground text-center py-4 animate-pulse">LOADING PEER INSIGHTS…</p>;
  if (!peer.length) return <p className="font-mono text-[11px] text-muted-foreground text-center py-4">No opted-in peers yet. Toggle sharing to compare with friends.</p>;

  return <SkillGapAnalysis mine={mine} peer={peer} peerName="Peers" />;
}
