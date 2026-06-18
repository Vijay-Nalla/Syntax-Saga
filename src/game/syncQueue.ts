// Offline-tolerant sync queue.
// When network/Supabase fails, actions are persisted to localStorage and drained
// on `online` event, focus, and a 30s timer.

import { supabase } from '@/integrations/supabase/client';

const QUEUE_KEY = 'syntaxsaga:sync-queue';

export type QueuedAction =
  | { kind: 'level_result'; ts: number; payload: any }
  | { kind: 'achievement'; ts: number; payload: { user_id: string; achievement_id: string } }
  | { kind: 'progress'; ts: number; payload: any }
  | { kind: 'stats'; ts: number; payload: any }
  | { kind: 'event'; ts: number; payload: any };

export type CloudStatus = 'synced' | 'syncing' | 'offline' | 'pending';

type StatusListener = (s: { status: CloudStatus; pending: number; lastSyncAt: number | null }) => void;

const listeners = new Set<StatusListener>();
let lastSyncAt: number | null = null;
let busy = false;

function readQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}
function writeQueue(q: QueuedAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function pendingCount(): number { return readQueue().length; }
export function isOnline(): boolean { return typeof navigator !== 'undefined' ? navigator.onLine : true; }

function emit() {
  const pending = pendingCount();
  const status: CloudStatus = !isOnline() ? 'offline'
    : busy ? 'syncing'
    : pending > 0 ? 'pending'
    : 'synced';
  listeners.forEach(l => l({ status, pending, lastSyncAt }));
}

export function subscribeStatus(l: StatusListener): () => void {
  listeners.add(l); emit();
  return () => { listeners.delete(l); };
}

export function enqueue(action: Omit<QueuedAction, 'ts'>) {
  const q = readQueue();
  q.push({ ...action, ts: Date.now() } as QueuedAction);
  writeQueue(q);
  emit();
  // try draining immediately (cheap if offline)
  setTimeout(() => { drain().catch(() => {}); }, 50);
}

async function executeAction(a: QueuedAction): Promise<boolean> {
  try {
    if (a.kind === 'level_result') {
      const { error } = await supabase.from('level_results').upsert(a.payload, { onConflict: 'user_id,language,level' });
      if (error) throw error;
    } else if (a.kind === 'achievement') {
      const { error } = await supabase.from('achievements_unlocked').upsert(a.payload, { onConflict: 'user_id,achievement_id' });
      if (error) throw error;
    } else if (a.kind === 'progress') {
      const { error } = await supabase.from('player_progress').upsert(a.payload, { onConflict: 'user_id,language' });
      if (error) throw error;
    } else if (a.kind === 'stats') {
      const { error } = await supabase.from('player_stats').upsert(a.payload, { onConflict: 'user_id' });
      if (error) throw error;
    } else if (a.kind === 'event') {
      const { error } = await supabase.from('progress_events').insert(a.payload);
      if (error) throw error;
    }
    return true;
  } catch {
    return false;
  }
}

export async function drain(): Promise<void> {
  if (busy) return;
  if (!isOnline()) { emit(); return; }
  const q = readQueue();
  if (q.length === 0) { emit(); return; }
  busy = true; emit();
  const remaining: QueuedAction[] = [];
  for (const a of q) {
    const ok = await executeAction(a);
    if (!ok) remaining.push(a);
  }
  writeQueue(remaining);
  busy = false;
  if (remaining.length === 0) lastSyncAt = Date.now();
  emit();
}

// Auto-drain hooks
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { drain().catch(() => {}); });
  window.addEventListener('focus', () => { drain().catch(() => {}); });
  window.addEventListener('offline', () => { emit(); });
  setInterval(() => { drain().catch(() => {}); }, 30000);
}
