// Elo-lite skill rating for matchmaking. K = 32.
import { supabase } from "@/integrations/supabase/client";

const K = 32;

export function expectedScore(rA: number, rB: number): number {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

export function newRating(current: number, expected: number, actual: 0 | 0.5 | 1): number {
  return Math.round(current + K * (actual - expected));
}

/** Apply a 1v1 result. `won` true if `userId` beat `opponentRating`. */
export async function applyMatchResult(userId: string, opponentRating: number, won: boolean): Promise<{ rating: number } | null> {
  if (!userId) return null;
  const { data: row } = await supabase.from("player_stats")
    .select("skill_rating, matches_played, matches_won")
    .eq("user_id", userId).maybeSingle();
  const current = (row as any)?.skill_rating ?? 1000;
  const played = (row as any)?.matches_played ?? 0;
  const wins = (row as any)?.matches_won ?? 0;
  const exp = expectedScore(current, opponentRating);
  const next = newRating(current, exp, won ? 1 : 0);
  await supabase.from("player_stats").upsert({
    user_id: userId,
    skill_rating: next,
    matches_played: played + 1,
    matches_won: wins + (won ? 1 : 0),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  return { rating: next };
}

export async function getSkillRating(userId: string): Promise<number> {
  if (!userId) return 1000;
  const { data } = await supabase.from("player_stats").select("skill_rating").eq("user_id", userId).maybeSingle();
  return (data as any)?.skill_rating ?? 1000;
}
