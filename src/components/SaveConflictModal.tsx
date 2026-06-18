import { useEffect, useState } from 'react';
import { detectConflict, smartMerge, backupCurrent, applySnapshot, clearLocalGuestData, type ConflictResult, type SaveSnapshot, getLocalSnapshot, getCloudSnapshot } from '@/game/conflictResolver';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props { onResolved?: () => void; }

function formatAge(t: number): string {
  if (!t) return '—';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

export default function SaveConflictModal({ onResolved }: Props) {
  const [c, setC] = useState<ConflictResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    detectConflict().then(r => { if (r) setC(r); });
  }, []);

  if (!c) return null;

  const close = () => { setC(null); onResolved?.(); };

  const useCloud = async () => {
    setBusy(true);
    await backupCurrent('pre-use-cloud', c.local);
    clearLocalGuestData();
    toast.success('Restored cloud save');
    setBusy(false); close();
  };
  const useLocal = async () => {
    setBusy(true);
    await backupCurrent('pre-use-local', c.cloud);
    await applySnapshot(c.local);
    clearLocalGuestData();
    toast.success('Local save uploaded to cloud');
    setBusy(false); close();
  };
  const merge = async () => {
    setBusy(true);
    await backupCurrent('pre-merge', c.cloud);
    const merged = smartMerge(c.local, c.cloud);
    await applySnapshot(merged);
    clearLocalGuestData();
    toast.success('Saves merged — highest progress kept');
    setBusy(false); close();
  };

  const Card = ({ snap, title }: { snap: SaveSnapshot; title: string }) => (
    <div className="border border-border rounded p-3 bg-card/70 flex-1">
      <p className="font-pixel text-[10px] text-muted-foreground mb-2">{title}</p>
      <p className="font-display text-2xl font-bold">Lvl {snap.totalLevel}</p>
      <p className="font-mono text-xs text-muted-foreground mb-1">{snap.totalStars} ⭐</p>
      <p className="font-mono text-[10px] text-muted-foreground">Achievements: {snap.achievements.length}</p>
      <p className="font-mono text-[10px] text-muted-foreground mt-2">Updated: {formatAge(snap.updatedAt)}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[80] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full border-2 border-primary/50 rounded-lg bg-card p-5 shadow-[0_0_40px_rgba(56,189,248,0.25)]">
        <h2 className="font-display text-xl font-bold mb-1">Save Conflict Detected</h2>
        <p className="font-mono text-xs text-muted-foreground mb-4">Two different saves found. Choose how to continue — a backup will be kept either way.</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Card snap={c.cloud} title="CLOUD SAVE" />
          <Card snap={c.local} title="LOCAL SAVE" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button disabled={busy} onClick={useCloud}
            className="font-pixel text-[10px] px-3 py-2 rounded border border-border hover:border-primary hover:text-primary disabled:opacity-50">
            USE CLOUD
          </button>
          <button disabled={busy} onClick={useLocal}
            className="font-pixel text-[10px] px-3 py-2 rounded border border-border hover:border-primary hover:text-primary disabled:opacity-50">
            USE LOCAL
          </button>
          <button disabled={busy} onClick={merge}
            className="font-pixel text-[10px] px-3 py-2 rounded border-2 border-primary text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50">
            SMART MERGE
          </button>
        </div>
      </div>
    </div>
  );
}
