import { useEffect, useState } from "react";
import { listFriends, sendFriendRequest, respondToRequest, removeFriendship, type FriendView } from "@/game/friends";
import { toast } from "sonner";

export default function FriendsPanel() {
  const [friends, setFriends] = useState<FriendView[]>([]);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => setFriends(await listFriends());
  useEffect(() => { refresh(); }, []);

  const add = async () => {
    if (!target.trim()) return;
    setBusy(true);
    const { error } = await sendFriendRequest(target);
    setBusy(false);
    if (error) toast.error(error);
    else { toast.success("Request sent"); setTarget(""); refresh(); }
  };

  const accepted = friends.filter(f => f.status === "accepted");
  const incoming = friends.filter(f => f.status === "pending" && f.direction === "incoming");
  const outgoing = friends.filter(f => f.status === "pending" && f.direction === "outgoing");

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <p className="font-pixel text-[10px] text-muted-foreground mb-2">ADD FRIEND BY USERNAME</p>
        <div className="flex gap-2">
          <input value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. coder42"
            aria-label="Friend username"
            className="flex-1 px-3 py-2 bg-background border border-border rounded font-mono text-sm focus:border-primary outline-none" />
          <button onClick={add} disabled={busy}
            className="font-pixel text-[10px] px-3 py-2 rounded border-2 border-primary text-primary hover:bg-primary/10 disabled:opacity-50">
            SEND
          </button>
        </div>
      </div>

      {incoming.length > 0 && (
        <Section title={`INCOMING (${incoming.length})`}>
          {incoming.map(f => (
            <Row key={f.id} name={f.username || "Player"} badge="wants to connect">
              <button onClick={async () => { await respondToRequest(f.id, true); toast.success("Accepted"); refresh(); }}
                className="font-pixel text-[9px] px-2 py-1 rounded border border-primary text-primary">ACCEPT</button>
              <button onClick={async () => { await respondToRequest(f.id, false); refresh(); }}
                className="font-pixel text-[9px] px-2 py-1 rounded border border-border text-muted-foreground">DECLINE</button>
            </Row>
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title={`SENT (${outgoing.length})`}>
          {outgoing.map(f => (
            <Row key={f.id} name={f.username || "Player"} badge="pending">
              <button onClick={async () => { await removeFriendship(f.id); refresh(); }}
                className="font-pixel text-[9px] px-2 py-1 rounded border border-border text-muted-foreground">CANCEL</button>
            </Row>
          ))}
        </Section>
      )}

      <Section title={`FRIENDS (${accepted.length})`}>
        {accepted.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground text-center py-4">No friends yet — invite someone above!</p>
        ) : accepted.map(f => (
          <Row key={f.id} name={f.username || "Player"} badge="friend">
            <button onClick={async () => { await removeFriendship(f.id); refresh(); }}
              className="font-pixel text-[9px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-destructive">REMOVE</button>
          </Row>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card/50">
      <p className="font-pixel text-[10px] text-muted-foreground mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ name, badge, children }: { name: string; badge: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded bg-background/40 border border-border/50">
      <div>
        <p className="font-pixel text-[11px] text-foreground">{name}</p>
        <p className="font-mono text-[9px] text-muted-foreground">{badge}</p>
      </div>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}
