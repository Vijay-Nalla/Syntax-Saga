// Admin dashboard — role-gated via has_role(auth.uid(),'admin').
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function Admin() {
  const { user, ready } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{ users: number; matches: number; answers: number } | null>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { setIsAdmin(false); return; }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      const admin = !!data;
      setIsAdmin(admin);
      if (admin) {
        const [u, m, a, audits] = await Promise.all([
          supabase.from("profiles").select("user_id", { count: "exact", head: true }),
          supabase.from("mp_match_audit").select("id", { count: "exact", head: true }),
          supabase.from("match_answers").select("id", { count: "exact", head: true }),
          supabase.from("mp_match_audit").select("room_code, winner, created_at, questions_count").order("created_at", { ascending: false }).limit(20),
        ]);
        setStats({ users: u.count || 0, matches: m.count || 0, answers: a.count || 0 });
        setRecentAudits(audits.data || []);
      }
    })();
  }, [ready, user]);

  if (!ready || isAdmin === null) {
    return <Centered text="LOADING…" />;
  }
  if (!user || !isAdmin) {
    return <Centered text="ACCESS DENIED — admin only" link />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">ADMIN DASHBOARD</h1>
          <Link to="/" className="font-pixel text-[10px] px-3 py-2 rounded border border-border hover:text-primary">← BACK TO GAME</Link>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Players" value={stats?.users ?? 0} />
          <Stat label="Matches" value={stats?.matches ?? 0} />
          <Stat label="Answers" value={stats?.answers ?? 0} />
        </div>

        <section className="border border-border rounded-lg p-4 bg-card/50">
          <h2 className="font-pixel text-xs text-secondary mb-3">RECENT MATCHES</h2>
          <table className="w-full text-left">
            <thead className="font-pixel text-[9px] text-muted-foreground">
              <tr><th className="py-1">Room</th><th>Winner</th><th>Qs</th><th>At</th></tr>
            </thead>
            <tbody>
              {recentAudits.map(a => (
                <tr key={a.room_code + a.created_at} className="font-mono text-[11px] border-t border-border/40">
                  <td className="py-1">{a.room_code}</td>
                  <td>{a.winner || "—"}</td>
                  <td>{a.questions_count || 0}</td>
                  <td className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {recentAudits.length === 0 && (
                <tr><td colSpan={4} className="font-mono text-xs text-muted-foreground py-3 text-center">No matches recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded p-3 bg-card/50 text-center">
      <p className="font-display text-2xl font-bold text-primary">{value.toLocaleString()}</p>
      <p className="font-mono text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
function Centered({ text, link }: { text: string; link?: boolean }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background gap-3">
      <p className="font-pixel text-xs text-muted-foreground">{text}</p>
      {link && <Link to="/" className="font-pixel text-[10px] text-primary underline">Back to game</Link>}
    </div>
  );
}
