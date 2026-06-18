// Daily login reward + streak helpers.

import { supabase } from '@/integrations/supabase/client';

export interface RewardClaim {
  claimed: boolean;
  day?: number;
  streak?: number;
  reward_kind?: string;
  reward_value?: number;
  reason?: string;
}

export interface RewardState {
  available: boolean;
  streak: number;
  freezeTokens: number;
  lastClaim: string | null;
  nextDay: number;
}

export async function getRewardState(): Promise<RewardState | null> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return null;
  const { data } = await supabase.from('profiles')
    .select('login_streak, last_reward_claim, streak_freeze_tokens')
    .eq('user_id', uid).maybeSingle();
  if (!data) return null;
  const today = new Date().toISOString().slice(0, 10);
  const last = (data as any).last_reward_claim;
  const streak = (data as any).login_streak || 0;
  const freeze = (data as any).streak_freeze_tokens || 0;
  let nextDay = streak + 1;
  if (!last) nextDay = 1;
  else {
    const diff = Math.floor((Date.parse(today) - Date.parse(last)) / 86400000);
    if (diff === 0) nextDay = streak;
    else if (diff === 1) nextDay = streak + 1;
    else if (diff === 2 && freeze > 0) nextDay = streak + 1;
    else nextDay = 1;
  }
  return {
    available: last !== today,
    streak,
    freezeTokens: freeze,
    lastClaim: last,
    nextDay,
  };
}

export async function claimReward(): Promise<RewardClaim> {
  const { data, error } = await supabase.rpc('claim_daily_reward');
  if (error) return { claimed: false, reason: error.message };
  return data as RewardClaim;
}

export interface LadderEntry { day: number; kind: string; value: number; label: string; }

export function buildLadder(currentDay: number): LadderEntry[] {
  const entries: LadderEntry[] = [];
  for (let i = 0; i < 7; i++) {
    const day = currentDay + i;
    const k = rewardKindFor(day);
    entries.push({ day, kind: k.kind, value: k.value, label: k.label });
  }
  return entries;
}

function rewardKindFor(day: number): { kind: string; value: number; label: string } {
  if (day % 30 === 0) return { kind: 'legendary', value: 2000, label: '✨ Legendary · 2000c' };
  if (day % 14 === 0) return { kind: 'epic', value: 1000, label: '💎 Epic · 1000c' };
  if (day % 7 === 0) return { kind: 'rare', value: 500, label: '🔥 Rare · 500c' };
  if (day % 5 === 0) return { kind: 'achievement_token', value: 200, label: '🏅 Token · 200c' };
  if (day % 4 === 0) return { kind: 'avatar_item', value: 150, label: '🎨 Avatar · 150c' };
  if (day % 3 === 0) return { kind: 'xp_boost', value: 100, label: '⚡ XP Boost · 100c' };
  if (day % 2 === 0) return { kind: 'coins', value: 100, label: '🪙 100 Coins' };
  return { kind: 'coins', value: 50, label: '🪙 50 Coins' };
}
