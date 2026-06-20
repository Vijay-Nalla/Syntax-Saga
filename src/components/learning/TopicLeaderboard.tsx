// Best players per topic, sourced from topic_mastery joined with profile usernames.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Row { topic: string; user_id: string; accuracy: number; correct: number; username?: string }

export default function TopicLeaderboard({ topicFilter }: { topicFilter?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let q = supabase.from("topic_mastery")
          .select("topic, user_id, accuracy, correct")
          .gte("correct", 3)
          .order("accuracy", { ascending: false })
          .limit(50);
        if (topicFilter) q = q.eq("topic", topicFilter);
        const { data } = await q;
        const list = (data || []) as Row[];
        const ids = Array.from(new Set(list.map(r => r.user_id)));
        if (ids.length) {
          const { data: profs } = await supabase.from("profiles").select("user_id, username").in("user_id", ids);
          const map = new Map((profs || []).map((p: any) => [p.user_id, p.username]));
          list.forEach(r => { r.username = map.get(r.user_id) || "Player"; });
        }
        setRows(list);
      } finally { setLoading(false); }
    })();
  }, [topicFilter]);

  if (loading) return <p className="font-pixel text-[10px] text-muted-foreground text-center py-6 animate-pulse">LOADING LEADERBOARD…</p>;
  if (!rows.length) return <p className="font-mono text-[11px] text-muted-foreground text-center py-6">No leaderboard data yet — be the first!</p>;

  // Take top 3 per topic
  const byTopic = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byTopic.get(r.topic) || [];
    if (arr.length < 3) arr.push(r);
    byTopic.set(r.topic, arr);
  }

  return (
    <div className="space-y-3">
      {Array.from(byTopic.entries()).map(([topic, list]) => (
        <div key={topic} className="border border-border rounded p-3 bg-card/40">
          <p className="font-pixel text-[10px] text-secondary mb-2">{topic.toUpperCase()}</p>
          <ol className="space-y-1">
            {list.map((r, i) => (
              <li key={r.user_id} className="flex justify-between font-mono text-[11px]">
                <span className="text-foreground">{i + 1}. {r.username}</span>
                <span className="text-primary">{r.accuracy}%</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
