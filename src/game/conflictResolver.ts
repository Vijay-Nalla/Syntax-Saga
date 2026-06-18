// Detects mismatch between local guest save and cloud save when a user logs in
// (or links a guest account). Smart-merge always preserves the highest progress.

import { supabase } from '@/integrations/supabase/client';
import type { DashboardData, LanguageProgress, LevelRecord } from './saveSystem';

const GUEST_DATA_KEY = 'syntaxsaga:guest:data';

export interface SaveSnapshot {
  source: 'local' | 'cloud';
  updatedAt: number;
  progressByLang: Record<string, LanguageProgress>;
  levels: LevelRecord[];
  achievements: string[];
  stats: DashboardData['stats'];
  totalLevel: number;
  totalStars: number;
}

export interface ConflictResult {
  conflict: boolean;
  local: SaveSnapshot;
  cloud: SaveSnapshot;
  canMerge: boolean;
}

function emptySnap(source: 'local' | 'cloud'): SaveSnapshot {
  return {
    source, updatedAt: 0, progressByLang: {}, levels: [], achievements: [],
    stats: { levels_completed: 0, challenges_solved: 0, total_play_time_s: 0, mp_wins: 0 },
    totalLevel: 0, totalStars: 0,
  };
}

function totals(snap: SaveSnapshot) {
  let lvl = 0; let stars = 0;
  Object.values(snap.progressByLang).forEach(p => {
    lvl = Math.max(lvl, p.currentLevel);
    stars += p.totalStars;
  });
  snap.totalLevel = lvl; snap.totalStars = stars;
}

export function getLocalSnapshot(): SaveSnapshot {
  const snap = emptySnap('local');
  try {
    const raw = localStorage.getItem(GUEST_DATA_KEY);
    if (raw) {
      const g = JSON.parse(raw);
      snap.progressByLang = g.progressByLang || {};
      snap.levels = g.levels || [];
      snap.achievements = g.achievements || [];
      snap.stats = g.stats || snap.stats;
    }
  } catch {}
  // Use latest level_results updated_at as proxy
  snap.updatedAt = Date.now();
  totals(snap);
  return snap;
}

export async function getCloudSnapshot(uid: string): Promise<SaveSnapshot> {
  const snap = emptySnap('cloud');
  const [pgR, lvR, achR, stR] = await Promise.all([
    supabase.from('player_progress').select('*').eq('user_id', uid),
    supabase.from('level_results').select('*').eq('user_id', uid),
    supabase.from('achievements_unlocked').select('achievement_id').eq('user_id', uid),
    supabase.from('player_stats').select('*').eq('user_id', uid).maybeSingle(),
  ]);
  (pgR.data || []).forEach((r: any) => {
    snap.progressByLang[r.language] = {
      language: r.language, currentLevel: r.current_level,
      unlockedLevel: r.unlocked_level, totalStars: r.total_stars, coins: r.coins,
    };
    const t = new Date(r.updated_at).getTime();
    if (t > snap.updatedAt) snap.updatedAt = t;
  });
  (lvR.data || []).forEach((r: any) => {
    snap.levels.push({
      language: r.language, level: r.level, stars: r.stars,
      best_score: r.best_score, best_time_ms: r.best_time_ms,
      attempts: r.attempts, wins: r.wins, accuracy: r.accuracy,
    });
    const t = new Date(r.updated_at).getTime();
    if (t > snap.updatedAt) snap.updatedAt = t;
  });
  snap.achievements = (achR.data || []).map((a: any) => a.achievement_id);
  if (stR.data) {
    snap.stats = {
      levels_completed: (stR.data as any).levels_completed ?? 0,
      challenges_solved: (stR.data as any).challenges_solved ?? 0,
      total_play_time_s: (stR.data as any).total_play_time_s ?? 0,
      mp_wins: (stR.data as any).mp_wins ?? 0,
    };
  }
  totals(snap);
  return snap;
}

export async function detectConflict(): Promise<ConflictResult | null> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return null;
  const local = getLocalSnapshot();
  // No local data → nothing to merge/conflict over
  if (local.levels.length === 0 && Object.keys(local.progressByLang).length === 0) return null;
  const cloud = await getCloudSnapshot(uid);
  const conflict = cloud.totalLevel !== local.totalLevel || cloud.totalStars !== local.totalStars
    || cloud.achievements.length !== local.achievements.length;
  if (!conflict) return null;
  return { conflict: true, local, cloud, canMerge: true };
}

export function smartMerge(a: SaveSnapshot, b: SaveSnapshot): SaveSnapshot {
  const merged: SaveSnapshot = emptySnap('cloud');
  // progressByLang
  const langs = new Set([...Object.keys(a.progressByLang), ...Object.keys(b.progressByLang)]);
  langs.forEach(lang => {
    const pa = a.progressByLang[lang]; const pb = b.progressByLang[lang];
    merged.progressByLang[lang] = {
      language: (pa?.language || pb?.language) as any,
      currentLevel: Math.max(pa?.currentLevel || 1, pb?.currentLevel || 1),
      unlockedLevel: Math.max(pa?.unlockedLevel || 1, pb?.unlockedLevel || 1),
      totalStars: Math.max(pa?.totalStars || 0, pb?.totalStars || 0),
      coins: Math.max(pa?.coins || 0, pb?.coins || 0),
    };
  });
  // levels
  const lkey = (l: LevelRecord) => `${l.language}:${l.level}`;
  const lmap = new Map<string, LevelRecord>();
  [...a.levels, ...b.levels].forEach(l => {
    const k = lkey(l); const cur = lmap.get(k);
    if (!cur) { lmap.set(k, l); return; }
    lmap.set(k, {
      ...cur,
      stars: Math.max(cur.stars, l.stars),
      best_score: Math.max(cur.best_score, l.best_score),
      best_time_ms: cur.best_time_ms == null ? l.best_time_ms
        : l.best_time_ms == null ? cur.best_time_ms
        : Math.min(cur.best_time_ms, l.best_time_ms),
      attempts: cur.attempts + l.attempts,
      wins: cur.wins + l.wins,
      accuracy: Math.max(cur.accuracy, l.accuracy),
    });
  });
  merged.levels = [...lmap.values()];
  merged.achievements = Array.from(new Set([...a.achievements, ...b.achievements]));
  merged.stats = {
    levels_completed: Math.max(a.stats.levels_completed, b.stats.levels_completed),
    challenges_solved: Math.max(a.stats.challenges_solved, b.stats.challenges_solved),
    total_play_time_s: Math.max(a.stats.total_play_time_s, b.stats.total_play_time_s),
    mp_wins: Math.max(a.stats.mp_wins, b.stats.mp_wins),
  };
  merged.updatedAt = Date.now();
  totals(merged);
  return merged;
}

// Backup + apply
export async function backupCurrent(source: string, snapshot: SaveSnapshot): Promise<void> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return;
  try {
    await supabase.from('save_backups').insert({ user_id: uid, source, snapshot: snapshot as any });
  } catch {}
}

export async function applySnapshot(snap: SaveSnapshot): Promise<void> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return;
  // Wipe & rewrite progress / level_results
  const progressRows = Object.values(snap.progressByLang).map(p => ({
    user_id: uid, language: p.language, current_level: p.currentLevel,
    unlocked_level: p.unlockedLevel, total_stars: p.totalStars, coins: p.coins,
  }));
  if (progressRows.length) {
    await supabase.from('player_progress').upsert(progressRows as any, { onConflict: 'user_id,language' });
  }
  if (snap.levels.length) {
    const rows = snap.levels.map(l => ({ user_id: uid, ...l }));
    await supabase.from('level_results').upsert(rows as any, { onConflict: 'user_id,language,level' });
  }
  if (snap.achievements.length) {
    await supabase.from('achievements_unlocked').upsert(
      snap.achievements.map(a => ({ user_id: uid, achievement_id: a })) as any,
      { onConflict: 'user_id,achievement_id' });
  }
  await supabase.from('player_stats').upsert({
    user_id: uid,
    levels_completed: snap.stats.levels_completed,
    challenges_solved: snap.stats.challenges_solved,
    total_play_time_s: snap.stats.total_play_time_s,
    mp_wins: snap.stats.mp_wins,
  }, { onConflict: 'user_id' });
}

export function clearLocalGuestData() {
  localStorage.removeItem(GUEST_DATA_KEY);
}
