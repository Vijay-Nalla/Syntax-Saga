// Sync queue visibility dashboard. Reads from localStorage; non-destructive.
import { useEffect, useState } from "react";

const QUEUE_KEY = "syntax-saga.sync-queue";

interface QueuedAction { kind?: string; ts?: number; payload?: any }

function readQueue(): QueuedAction[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}

export default function SyncDashboard() {
  const [queue, setQueue] = useState<QueuedAction[]>(readQueue());
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const t = setInterval(() => setQueue(readQueue()), 2000);
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => { clearInterval(t); window.removeEventListener("online", onOn); window.removeEventListener("offline", onOff); };
  }, []);

  const rewards = queue.filter(a => a.kind === "reward_claim" || a.kind === "xp_reward").length;
  const matches = queue.filter(a => a.kind === "match_history" || a.kind === "level_result").length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Pending Syncs" value={queue.length} color="primary" />
        <Stat label="Queued Rewards" value={rewards} color="secondary" />
        <Stat label="Unsynced Matches" value={matches} color="primary" />
      </div>
      <div className="flex items-center justify-between border border-border rounded p-2">
        <span className="font-pixel text-[10px] text-muted-foreground">CONNECTION</span>
        <span className={`font-pixel text-[10px] ${online ? "text-green-400" : "text-red-400"}`}>{online ? "● ONLINE" : "● OFFLINE"}</span>
      </div>
      {queue.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground text-center py-4">All caught up — nothing pending.</p>
      ) : (
        <div className="max-h-64 overflow-y-auto border border-border rounded">
          {queue.slice(0, 50).map((a, i) => (
            <div key={i} className="flex justify-between border-b border-border/40 last:border-0 px-2 py-1">
              <span className="font-mono text-[10px] text-foreground">{a.kind || "action"}</span>
              <span className="font-mono text-[9px] text-muted-foreground">{a.ts ? new Date(a.ts).toLocaleTimeString() : ""}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => window.dispatchEvent(new Event("online"))}
        className="w-full font-pixel text-[10px] px-3 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all">
        SYNC NOW
      </button>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: "primary" | "secondary" }) {
  return (
    <div className={`border-2 border-${color} rounded p-2 text-center bg-card/60`}>
      <p className="font-pixel text-[8px] text-muted-foreground">{label}</p>
      <p className={`font-display text-2xl text-${color} text-glow-${color === "primary" ? "primary" : "cyan"}`}>{value}</p>
    </div>
  );
}
