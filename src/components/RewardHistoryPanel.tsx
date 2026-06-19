import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Row { id: string; claim_date: string; day_in_streak: number; reward_kind: string; reward_value: number; }

export default function RewardHistoryPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("daily_rewards_log").select("*").order("claim_date", { ascending: false }).limit(200);
        setRows((data || []) as Row[]);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter(r => !filter || r.reward_kind.toLowerCase().includes(filter.toLowerCase()) || r.claim_date.includes(filter));

  return (
    <div className="space-y-3">
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search by date or reward type…"
        className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground" />
      {loading ? (
        <p className="font-pixel text-[10px] text-muted-foreground text-center py-6 animate-pulse">LOADING REWARD HISTORY…</p>
      ) : !filtered.length ? (
        <p className="font-mono text-xs text-muted-foreground text-center py-6">No rewards claimed yet.</p>
      ) : (
        <div className="border border-border rounded max-h-[50vh] overflow-y-auto">
          <table className="w-full text-[11px] font-mono">
            <thead className="bg-muted/30 sticky top-0">
              <tr><th className="text-left p-2">DATE</th><th className="text-left p-2">SOURCE</th><th className="text-left p-2">REWARD</th><th className="text-right p-2">AMOUNT</th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="p-2 text-muted-foreground">{r.claim_date}</td>
                  <td className="p-2 text-secondary">Daily · Day {r.day_in_streak}</td>
                  <td className="p-2 text-foreground">{r.reward_kind}</td>
                  <td className="p-2 text-right text-primary font-bold">+{r.reward_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
