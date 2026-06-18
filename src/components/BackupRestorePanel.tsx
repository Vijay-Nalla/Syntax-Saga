import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { backupCurrent, getCloudSnapshot, applySnapshot, type SaveSnapshot } from '@/game/conflictResolver';
import { toast } from 'sonner';

interface BackupRow { id: string; source: string; created_at: string; snapshot: SaveSnapshot; }

export default function BackupRestorePanel() {
  const [rows, setRows] = useState<BackupRow[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user.id;
    if (!uid) return;
    const { data } = await supabase.from('save_backups')
      .select('id, source, created_at, snapshot')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(20);
    setRows((data || []) as any);
  };

  useEffect(() => { refresh(); }, []);

  const backupNow = async () => {
    setBusy(true);
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user.id;
    if (uid) {
      const snap = await getCloudSnapshot(uid);
      await backupCurrent('manual', snap);
      toast.success('Backup created');
      await refresh();
    }
    setBusy(false);
  };

  const restore = async (row: BackupRow) => {
    if (!confirm('Restore this backup? Current cloud save will be backed up first.')) return;
    setBusy(true);
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user.id;
    if (uid) {
      const current = await getCloudSnapshot(uid);
      await backupCurrent('pre-restore', current);
      await applySnapshot(row.snapshot);
      toast.success('Backup restored');
      await refresh();
    }
    setBusy(false);
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <p className="font-pixel text-[10px] text-muted-foreground">BACKUPS</p>
        <button disabled={busy} onClick={backupNow}
          className="font-pixel text-[9px] px-2 py-1 rounded border border-primary text-primary hover:bg-primary/10 disabled:opacity-50">
          + BACKUP NOW
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground text-center py-4">No backups yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(r => (
            <li key={r.id} className="flex items-center justify-between border border-border rounded p-2 bg-background/40">
              <div className="min-w-0">
                <p className="font-mono text-xs truncate">{r.source}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <button disabled={busy} onClick={() => restore(r)}
                className="font-pixel text-[9px] px-2 py-1 rounded border border-border hover:border-primary hover:text-primary disabled:opacity-50">
                RESTORE
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
