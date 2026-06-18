// Append-only progress event emitter.
// Cloud: inserts into progress_events. Offline/guest: enqueued or stored locally.

import { supabase } from '@/integrations/supabase/client';
import { enqueue } from './syncQueue';

const LOCAL_EVENTS_KEY = 'syntaxsaga:events';
const MAX_LOCAL_EVENTS = 200;

export type EventKind =
  | 'level_completed'
  | 'achievement_unlocked'
  | 'mp_victory'
  | 'language_mastered'
  | 'streak_milestone'
  | 'login';

export interface ProgressEvent {
  id?: string;
  user_id?: string;
  kind: EventKind;
  language?: string | null;
  level?: number | null;
  payload?: Record<string, any>;
  created_at?: string;
}

async function getUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function pushLocal(e: ProgressEvent) {
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    const arr: ProgressEvent[] = raw ? JSON.parse(raw) : [];
    arr.unshift({ ...e, created_at: new Date().toISOString() });
    if (arr.length > MAX_LOCAL_EVENTS) arr.length = MAX_LOCAL_EVENTS;
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(arr));
  } catch {}
}

export async function emitEvent(e: ProgressEvent): Promise<void> {
  pushLocal(e);
  const uid = await getUid();
  if (!uid) return;
  const row = {
    user_id: uid, kind: e.kind, language: e.language ?? null,
    level: e.level ?? null, payload: e.payload ?? {},
  };
  try {
    const { error } = await supabase.from('progress_events').insert(row);
    if (error) throw error;
  } catch {
    enqueue({ kind: 'event', payload: row });
  }
}

export async function getRecentEvents(limit = 30): Promise<ProgressEvent[]> {
  const uid = await getUid();
  if (uid) {
    const { data } = await supabase.from('progress_events')
      .select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(limit);
    if (data && data.length) return data as ProgressEvent[];
  }
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as ProgressEvent[]).slice(0, limit);
  } catch { return []; }
}
