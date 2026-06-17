// Unified save layer: Supabase (logged-in) OR localStorage (guest).
// Additive — does NOT modify the engine. Engine continues to use its own
// saveManager.ts; this layer mirrors progress for the account/cloud system.

import { supabase } from '@/integrations/supabase/client';
import { Language } from './types';

const GUEST_ID_KEY = 'syntaxsaga:guestId';
const GUEST_DATA_KEY = 'syntaxsaga:guest:data';

export interface LevelResult {
  language: Language;
  level: number;
  stars: number;
  score: number;
  timeMs: number;
  mistakes: number;
  correctAnswers: number;
}

export interface LanguageProgress {
  language: Language;
  currentLevel: number;
  unlockedLevel: number;
  totalStars: number;
  coins: number;
}

export interface LevelRecord {
  language: Language;
  level: number;
  stars: number;
  best_score: number;
  best_time_ms: number | null;
  attempts: number;
  wins: number;
  accuracy: number;
}

export interface DashboardData {
  progressByLang: Record<string, LanguageProgress>;
  levels: LevelRecord[];
  achievements: string[];
  stats: {
    levels_completed: number;
    challenges_solved: number;
    total_play_time_s: number;
    mp_wins: number;
  };
  username: string;
  cloudSync: 'cloud' | 'local';
  lastSyncAt: number;
}

// ---------- Guest helpers ----------
export function getOrCreateGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = 'Guest_' + Math.floor(10000 + Math.random() * 89999);
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}
export function getGuestId(): string | null { return localStorage.getItem(GUEST_ID_KEY); }
export function clearGuest() {
  localStorage.removeItem(GUEST_ID_KEY);
  localStorage.removeItem(GUEST_DATA_KEY);
}

interface GuestStore {
  progressByLang: Record<string, LanguageProgress>;
  levels: LevelRecord[];
  achievements: string[];
  stats: DashboardData['stats'];
}

function readGuest(): GuestStore {
  try {
    const raw = localStorage.getItem(GUEST_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { progressByLang: {}, levels: [], achievements: [],
    stats: { levels_completed: 0, challenges_solved: 0, total_play_time_s: 0, mp_wins: 0 } };
}
function writeGuest(s: GuestStore) { localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(s)); }

// ---------- Auth helpers ----------
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// ---------- Public API ----------
export async function getDashboard(): Promise<DashboardData> {
  const uid = await getUserId();
  if (!uid) {
    const g = readGuest();
    return {
      ...g,
      username: getOrCreateGuestId(),
      cloudSync: 'local',
      lastSyncAt: Date.now(),
    };
  }
  const [profileR, progressR, levelsR, achR, statsR] = await Promise.all([
    supabase.from('profiles').select('username').eq('user_id', uid).maybeSingle(),
    supabase.from('player_progress').select('*').eq('user_id', uid),
    supabase.from('level_results').select('*').eq('user_id', uid),
    supabase.from('achievements_unlocked').select('achievement_id').eq('user_id', uid),
    supabase.from('player_stats').select('*').eq('user_id', uid).maybeSingle(),
  ]);
  const progressByLang: Record<string, LanguageProgress> = {};
  (progressR.data || []).forEach((r: any) => {
    progressByLang[r.language] = {
      language: r.language, currentLevel: r.current_level,
      unlockedLevel: r.unlocked_level, totalStars: r.total_stars, coins: r.coins,
    };
  });
  return {
    progressByLang,
    levels: (levelsR.data || []) as LevelRecord[],
    achievements: (achR.data || []).map((a: any) => a.achievement_id),
    stats: {
      levels_completed: statsR.data?.levels_completed ?? 0,
      challenges_solved: statsR.data?.challenges_solved ?? 0,
      total_play_time_s: statsR.data?.total_play_time_s ?? 0,
      mp_wins: statsR.data?.mp_wins ?? 0,
    },
    username: profileR.data?.username ?? 'Player',
    cloudSync: 'cloud',
    lastSyncAt: Date.now(),
  };
}

export async function saveLevelResult(r: LevelResult): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    const g = readGuest();
    const existing = g.levels.find(l => l.language === r.language && l.level === r.level);
    const stars = Math.max(existing?.stars ?? 0, r.stars);
    const best_score = Math.max(existing?.best_score ?? 0, r.score);
    const best_time_ms = existing?.best_time_ms == null ? r.timeMs : Math.min(existing.best_time_ms, r.timeMs);
    const attempts = (existing?.attempts ?? 0) + 1;
    const wins = (existing?.wins ?? 0) + (r.stars > 0 ? 1 : 0);
    const accuracy = Math.round((r.correctAnswers / Math.max(1, r.correctAnswers + r.mistakes)) * 100);
    const newRec: LevelRecord = { language: r.language, level: r.level, stars, best_score, best_time_ms, attempts, wins, accuracy };
    g.levels = g.levels.filter(l => !(l.language === r.language && l.level === r.level)).concat(newRec);
    // progress
    const prev = g.progressByLang[r.language] || { language: r.language, currentLevel: 1, unlockedLevel: 1, totalStars: 0, coins: 0 };
    const totalStars = g.levels.filter(l => l.language === r.language).reduce((s, l) => s + l.stars, 0);
    g.progressByLang[r.language] = {
      ...prev,
      currentLevel: Math.max(prev.currentLevel, r.level),
      unlockedLevel: Math.max(prev.unlockedLevel, r.level + 1),
      totalStars,
    };
    g.stats.levels_completed += 1;
    g.stats.challenges_solved += r.correctAnswers;
    writeGuest(g);
    return;
  }
  // Cloud upsert
  const { data: existingRow } = await supabase
    .from('level_results').select('*')
    .eq('user_id', uid).eq('language', r.language).eq('level', r.level).maybeSingle();
  const stars = Math.max((existingRow as any)?.stars ?? 0, r.stars);
  const best_score = Math.max((existingRow as any)?.best_score ?? 0, r.score);
  const best_time_ms = (existingRow as any)?.best_time_ms == null
    ? r.timeMs : Math.min((existingRow as any).best_time_ms, r.timeMs);
  const attempts = ((existingRow as any)?.attempts ?? 0) + 1;
  const wins = ((existingRow as any)?.wins ?? 0) + (r.stars > 0 ? 1 : 0);
  const accuracy = Math.round((r.correctAnswers / Math.max(1, r.correctAnswers + r.mistakes)) * 100);
  await supabase.from('level_results').upsert({
    user_id: uid, language: r.language, level: r.level,
    stars, best_score, best_time_ms, attempts, wins, accuracy,
  }, { onConflict: 'user_id,language,level' });

  // Refresh totals for the language
  const { data: rows } = await supabase
    .from('level_results').select('stars').eq('user_id', uid).eq('language', r.language);
  const totalStars = (rows || []).reduce((s: number, x: any) => s + (x.stars || 0), 0);

  const { data: ppExisting } = await supabase
    .from('player_progress').select('*').eq('user_id', uid).eq('language', r.language).maybeSingle();
  const cur = Math.max((ppExisting as any)?.current_level ?? 1, r.level);
  const unl = Math.max((ppExisting as any)?.unlocked_level ?? 1, r.level + 1);
  await supabase.from('player_progress').upsert({
    user_id: uid, language: r.language, current_level: cur,
    unlocked_level: Math.min(50, unl), total_stars: totalStars,
    coins: (ppExisting as any)?.coins ?? 0,
  }, { onConflict: 'user_id,language' });

  // Stats
  const { data: stats } = await supabase.from('player_stats').select('*').eq('user_id', uid).maybeSingle();
  await supabase.from('player_stats').upsert({
    user_id: uid,
    levels_completed: ((stats as any)?.levels_completed ?? 0) + 1,
    challenges_solved: ((stats as any)?.challenges_solved ?? 0) + r.correctAnswers,
    total_play_time_s: ((stats as any)?.total_play_time_s ?? 0) + Math.round(r.timeMs / 1000),
    mp_wins: (stats as any)?.mp_wins ?? 0,
  }, { onConflict: 'user_id' });
}

export async function unlockAchievement(id: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    const g = readGuest();
    if (!g.achievements.includes(id)) { g.achievements.push(id); writeGuest(g); }
    return;
  }
  await supabase.from('achievements_unlocked').upsert({ user_id: uid, achievement_id: id }, { onConflict: 'user_id,achievement_id' });
}

// ---------- Guest → Account migration ----------
export async function migrateGuestToAccount(): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;
  const g = readGuest();
  if (!g.levels.length && !Object.keys(g.progressByLang).length) { clearGuest(); return; }

  // Upsert levels
  if (g.levels.length) {
    const rows = g.levels.map(l => ({ user_id: uid, ...l }));
    await supabase.from('level_results').upsert(rows as any, { onConflict: 'user_id,language,level' });
  }
  // Upsert progress
  const progressRows = Object.values(g.progressByLang).map(p => ({
    user_id: uid, language: p.language, current_level: p.currentLevel,
    unlocked_level: p.unlockedLevel, total_stars: p.totalStars, coins: p.coins,
  }));
  if (progressRows.length) {
    await supabase.from('player_progress').upsert(progressRows as any, { onConflict: 'user_id,language' });
  }
  // Achievements
  if (g.achievements.length) {
    await supabase.from('achievements_unlocked').upsert(
      g.achievements.map(a => ({ user_id: uid, achievement_id: a })) as any,
      { onConflict: 'user_id,achievement_id' }
    );
  }
  // Stats
  await supabase.from('player_stats').upsert({
    user_id: uid,
    levels_completed: g.stats.levels_completed,
    challenges_solved: g.stats.challenges_solved,
    total_play_time_s: g.stats.total_play_time_s,
    mp_wins: g.stats.mp_wins,
  }, { onConflict: 'user_id' });

  clearGuest();
}

// Username availability check
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('username').eq('username', username).maybeSingle();
  return !data;
}

export function usernameSyntheticEmail(username: string): string {
  return `${username.toLowerCase()}@syntaxsaga.local`;
}
