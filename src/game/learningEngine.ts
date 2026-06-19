// Learning engine: derives strengths, weaknesses, comparisons, and recommendations
// from match_answers and topic_mastery rows. All multiplayer/single-player engine
// internals stay untouched — this module is purely additive analytics.

import { supabase } from "@/integrations/supabase/client";

export interface AnswerRow {
  id?: string;
  user_id?: string | null;
  room_code?: string | null;
  topic: string;
  subtopic?: string | null;
  difficulty?: string | null;
  language?: string | null;
  question_text?: string | null;
  user_answer?: string | null;
  correct_answer?: string | null;
  is_correct: boolean;
  time_ms?: number;
  explanation?: string | null;
  created_at?: string;
}

export interface MasteryRow {
  topic: string;
  correct: number;
  wrong: number;
  accuracy: number;
  mastery_level: "weak" | "avg" | "strong";
  last_played?: string;
}

export interface CoachPayload {
  coachNote: string;
  roadmap: string[];
  focusAreas: string[];
  encouragement: string;
}

const DEFAULT_RESOURCES = (topic: string) => [
  { kind: "video", title: `${topic} crash course`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " tutorial")}` },
  { kind: "notes", title: `${topic} reference notes`, url: `https://www.geeksforgeeks.org/?s=${encodeURIComponent(topic)}` },
  { kind: "practice", title: `Practice ${topic}`, url: `https://leetcode.com/problemset/?search=${encodeURIComponent(topic)}` },
  { kind: "mock_test", title: `${topic} mock test`, url: `https://www.hackerrank.com/domains/tutorials?filters%5Bsubdomains%5D%5B%5D=${encodeURIComponent(topic.toLowerCase())}` },
];

export function classifyMastery(accuracy: number): "weak" | "avg" | "strong" {
  if (accuracy >= 75) return "strong";
  if (accuracy >= 45) return "avg";
  return "weak";
}

/** Persist a per-question answer row. Falls back silently if offline. */
export async function logMatchAnswer(row: AnswerRow): Promise<void> {
  try {
    await supabase.from("match_answers").insert([row as any]);
  } catch { /* swallow; sync queue handles offline */ }
}

/** Persist the full match audit. */
export async function logMatchAudit(audit: {
  room_code: string;
  user_id?: string | null;
  players: any[];
  topics: string[];
  difficulty?: string;
  language?: string;
  winner?: string;
  xp_awarded?: Record<string, number>;
  questions_count?: number;
  connection_issues?: any[];
}): Promise<void> {
  try {
    await supabase.from("mp_match_audit").insert([audit as any]);
  } catch { /* ignore */ }
}

/** Recompute topic_mastery rollups for a user using their recent answers. */
export async function updateTopicMastery(userId: string, answers: AnswerRow[]): Promise<void> {
  if (!userId || !answers.length) return;
  const byTopic = new Map<string, { c: number; w: number }>();
  for (const a of answers) {
    const t = a.topic || "General";
    const cur = byTopic.get(t) || { c: 0, w: 0 };
    if (a.is_correct) cur.c++; else cur.w++;
    byTopic.set(t, cur);
  }
  const rows = Array.from(byTopic.entries()).map(([topic, v]) => {
    const total = v.c + v.w;
    const acc = total > 0 ? Math.round((v.c / total) * 100) : 0;
    return {
      user_id: userId, topic, correct: v.c, wrong: v.w, accuracy: acc,
      mastery_level: classifyMastery(acc), last_played: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
  try {
    await supabase.from("topic_mastery").upsert(rows, { onConflict: "user_id,topic" });
  } catch { /* ignore */ }
}

export async function fetchTopicMastery(userId: string): Promise<MasteryRow[]> {
  if (!userId) return [];
  try {
    const { data } = await supabase.from("topic_mastery").select("topic, correct, wrong, accuracy, mastery_level, last_played").eq("user_id", userId);
    return (data || []) as MasteryRow[];
  } catch { return []; }
}

export async function fetchRecentAnswers(userId: string, limit = 50): Promise<AnswerRow[]> {
  if (!userId) return [];
  try {
    const { data } = await supabase.from("match_answers").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
    return (data || []) as AnswerRow[];
  } catch { return []; }
}

export function summarizeAnswers(answers: AnswerRow[]) {
  const byTopic = new Map<string, { c: number; w: number; ms: number; n: number }>();
  for (const a of answers) {
    const t = a.topic || "General";
    const cur = byTopic.get(t) || { c: 0, w: 0, ms: 0, n: 0 };
    if (a.is_correct) cur.c++; else cur.w++;
    cur.ms += a.time_ms || 0; cur.n++;
    byTopic.set(t, cur);
  }
  const perf = Array.from(byTopic.entries()).map(([topic, v]) => ({
    topic, accuracy: v.c + v.w > 0 ? Math.round((v.c / (v.c + v.w)) * 100) : 0,
    correct: v.c, wrong: v.w, avgMs: v.n > 0 ? Math.round(v.ms / v.n) : 0,
  })).sort((a, b) => b.accuracy - a.accuracy);
  const strengths = perf.filter(p => p.accuracy >= 75).map(p => p.topic);
  const weaknesses = perf.filter(p => p.accuracy < 50).map(p => p.topic);
  const wrong = answers.filter(a => !a.is_correct);
  return { perf, strengths, weaknesses, wrong };
}

export function buildRecommendations(weakTopics: string[]) {
  return weakTopics.slice(0, 5).map(topic => ({
    topic,
    est_days: 5 + Math.floor(Math.random() * 5),
    confidence_gain: 20 + Math.floor(Math.random() * 15),
    resources: DEFAULT_RESOURCES(topic),
    learning_order: ["Concepts", "Examples", "Easy Practice", "Medium Practice", "Mock Test"],
  }));
}

/** Call the edge function for AI-powered coach feedback. Falls back to a deterministic stub. */
export async function generateCoachFeedback(args: {
  language?: string;
  strengths: string[];
  weaknesses: string[];
  wrongAnswers: AnswerRow[];
  accuracy: number;
}): Promise<CoachPayload> {
  try {
    const { data, error } = await supabase.functions.invoke("learning-coach", { body: args });
    if (!error && data && typeof data === "object" && !(data as any).error) {
      const d = data as Partial<CoachPayload>;
      return {
        coachNote: d.coachNote || "",
        roadmap: d.roadmap || [],
        focusAreas: d.focusAreas || args.weaknesses.slice(0, 3),
        encouragement: d.encouragement || "Keep going — every match makes you sharper!",
      };
    }
  } catch { /* fall through */ }
  // Fallback
  return {
    coachNote: args.weaknesses.length
      ? `You're solid in ${args.strengths.slice(0, 2).join(" and ") || "fundamentals"} but struggling with ${args.weaknesses[0]}. Focus there next.`
      : `Strong all-round performance — keep stretching to harder difficulty!`,
    roadmap: (args.weaknesses.length ? args.weaknesses : ["Variables", "Loops", "Functions", "Arrays", "Strings"]).slice(0, 5)
      .map((t, i) => `Day ${i + 1}: Drill ${t}`),
    focusAreas: args.weaknesses.slice(0, 3),
    encouragement: args.accuracy >= 70 ? "Excellent accuracy — you're playoff material." : "Every mistake is a future correct answer.",
  };
}

/** Compare two players' per-topic accuracy. */
export function comparePerformance(
  a: { name: string; perf: { topic: string; accuracy: number }[] },
  b: { name: string; perf: { topic: string; accuracy: number }[] },
) {
  const topics = Array.from(new Set([...a.perf, ...b.perf].map(p => p.topic)));
  return topics.map(t => {
    const aa = a.perf.find(p => p.topic === t)?.accuracy ?? 0;
    const bb = b.perf.find(p => p.topic === t)?.accuracy ?? 0;
    return { topic: t, a: aa, b: bb, aWins: aa > bb, gap: Math.abs(aa - bb) };
  });
}
