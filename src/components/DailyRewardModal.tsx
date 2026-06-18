import { useEffect, useState } from 'react';
import { claimReward, getRewardState, buildLadder, type RewardState } from '@/game/dailyRewards';
import { toast } from 'sonner';

interface Props { onClose?: () => void; }

const SEEN_KEY = 'syntaxsaga:dailyReward:seenOn';

export default function DailyRewardModal({ onClose }: Props) {
  const [state, setState] = useState<RewardState | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen === today) return;
    getRewardState().then(s => {
      if (cancelled || !s) return;
      if (s.available) { setState(s); setOpen(true); }
      else { localStorage.setItem(SEEN_KEY, today); }
    });
    return () => { cancelled = true; };
  }, []);

  if (!open || !state) return null;

  const close = () => {
    localStorage.setItem(SEEN_KEY, new Date().toISOString().slice(0, 10));
    setOpen(false);
    onClose?.();
  };

  const onClaim = async () => {
    setBusy(true);
    const r = await claimReward();
    setBusy(false);
    if (r.claimed) {
      toast.success(`Day ${r.day} reward: +${r.reward_value} ${r.reward_kind}`);
    } else if (r.reason) {
      toast.info('Already claimed today');
    }
    close();
  };

  const ladder = buildLadder(state.nextDay);

  return (
    <div className="fixed inset-0 z-[75] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full border-2 border-primary/50 rounded-lg bg-card p-5 shadow-[0_0_40px_rgba(56,189,248,0.25)]">
        <div className="text-center mb-4">
          <p className="font-pixel text-[10px] text-muted-foreground">DAILY LOGIN REWARD</p>
          <h2 className="font-display text-2xl font-bold mt-1"
            style={{
              backgroundImage: 'linear-gradient(135deg, hsl(200,100%,65%), hsl(0,90%,60%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
            Day {state.nextDay}
          </h2>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Current Streak: {state.streak} {state.streak ? '🔥' : ''}
            {state.freezeTokens > 0 && <span className="ml-2">❄ {state.freezeTokens} freeze</span>}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {ladder.map((e, i) => (
            <div key={e.day}
              className={`text-center p-2 rounded border ${i === 0 ? 'border-primary bg-primary/20' : 'border-border bg-background/40 opacity-60'}`}>
              <p className="font-pixel text-[8px] text-muted-foreground">D{e.day}</p>
              <p className="text-base mt-1">{e.label.split(' ')[0]}</p>
              <p className="font-mono text-[8px] mt-1">{e.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button disabled={busy} onClick={onClaim}
            className="flex-1 font-pixel text-xs px-4 py-3 rounded border-2 border-primary text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50">
            CLAIM
          </button>
          <button onClick={close}
            className="font-pixel text-[10px] px-3 py-3 rounded border border-border text-muted-foreground hover:text-foreground">
            LATER
          </button>
        </div>
      </div>
    </div>
  );
}
