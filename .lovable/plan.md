# Plan: Black-Screen Fix + Learning Intelligence Center

## Guarantees (Non-Negotiable)

- Existing single-player engine, multiplayer engine, level design, coding questions, controls, and renderer are **NOT modified**.
- Existing sync queue, daily rewards, save system, and conflict resolver from prior expansions stay intact — this plan **extends** them, never replaces.

---

## Part 1 — Critical Fix: Black Screen Recovery

**Root cause investigation first.** I will inspect `useGameEngine.ts`, `renderer.ts`, `Index.tsx`, and the multiplayer client to identify why some sessions render black. Most likely causes: a thrown error in the `useEffect` mounting the canvas, a missing canvas ref on remount, or an unhandled rejection in `multiplayerClient.ts` during room join that leaves the scene in `loading` forever.

**Recovery layer (additive, not a rewrite):**

- New `src/game/sceneGuard.ts`: wraps engine boot with try/catch + heartbeat (checks canvas has rendered a frame within 4s). On failure → emits `scene:failed` with reason code.
- New `src/components/GameRecoveryOverlay.tsx`: full-screen overlay shown when `scene:failed` fires. Displays:
  - "Recovering Game Session…" with animated progress
  - Diagnostics list (asset load, websocket, scene init, last error)
  - Buttons: **Retry**, **Restore Last Save**, **Return to Menu**
  - Auto-retry once after 2s before showing manual buttons.
- Wire into `Index.tsx` around the game canvas. No engine code changes — guard sits outside.

---

## Part 2 — Offline Sync Queue Dashboard (extends existing queue)

The sync queue already exists. I'll add visibility + the missing categories:

- Extend `syncQueue.ts` action kinds to include: `xp_reward`, `match_history`, `reward_claim`, `profile_change`, `stats_update` (achievements already covered).
- New `src/components/SyncDashboard.tsx`: live counts (Pending, Queued Rewards, Unsynced Matches), per-action list, manual "Sync Now" button. Mount as a tab inside existing `PlayerDashboard`.
- Conflict resolver already implemented — just surface its "manual review required" state through a toast.

---

## Part 3 — Match Audit Logs

New table `mp_match_audit` (room_code, players jsonb, topics text[], difficulty, questions jsonb, answers jsonb, winner, xp_awarded jsonb, connection_issues jsonb, created_at). RLS: players in the match can read their own row; service_role full.

`multiplayerClient.ts` (additive — no behavioural change to existing flow): after match ends, write one audit row with the buffered question/answer log it already tracks locally.

---

## Part 4 — Reward Claim History

Uses existing `daily_rewards_log` + a new `reward_history` view that unions daily/weekly/event/streak/referral sources. New `src/components/RewardHistoryPanel.tsx` with date/source/amount filtering. Mount as tab in `PlayerDashboard`.

---

## Part 5 — Learning Intelligence Center (the core feature)

New tables:
- `match_answers` (match_id, user_id, question_id, topic, subtopic, difficulty, user_answer, correct_answer, is_correct, time_ms, explanation)
- `topic_mastery` (user_id, topic, correct, wrong, accuracy, last_played, mastery_level enum: weak/avg/strong)
- `learning_recommendations` (user_id, topic, resources jsonb, est_days, generated_at)

New module `src/game/learningEngine.ts`:
- `summarizeMatch(matchId)` → strengths, weaknesses, knowledge gaps
- `compareWithOpponent(matchId)` → per-topic % both sides
- `generateRecommendations(userId)` → uses Lovable AI (`google/gemini-3-flash-preview`) via a new edge function `learning-coach` for the AI study coach text + roadmap. Falls back to rule-based suggestions if AI unavailable.
- `updateTopicMastery(userId, answers)` → recomputes mastery rollups.

New edge function `supabase/functions/learning-coach/index.ts`:
- Input: match summary + user history
- Output: personalized coach feedback, weak-area explanations, study plan
- Uses Lovable AI Gateway (`LOVABLE_API_KEY` already provisioned).

New components (all under `src/components/learning/`):
- `PostMatchReport.tsx` — replaces the bare Winner/Loser screen as a wrapper (existing screen still rendered inside as a header). Tabs: Performance, Comparison, Wrong Answers, Recommendations, Coach.
- `PlayerComparisonBoard.tsx` — side-by-side per-topic % bars
- `SkillGapAnalysis.tsx` — your weak vs friend's weak areas
- `WrongAnswerReview.tsx` — per-question deep dive cards with explanation, concept, expected thinking
- `SmartRecommendations.tsx` — videos/notes/practice/mock test cards with estimated improvement time
- `StudyCoachCard.tsx` — AI-generated narrative feedback
- `KnowledgeHeatmap.tsx` — grid of topics × color scale
- `ImprovementTrendChart.tsx` — recharts line graph (last match / week / month / lifetime)
- `LearningRoadmap.tsx` — day-by-day plan
- `TopicLeaderboard.tsx` — best-per-topic rankings (queries `topic_mastery` ordered by accuracy)
- `FriendLearningInsights.tsx` — opt-in friend comparison (gated by `profiles.share_insights` bool)

Dashboard integration: new "Learning" tab in `PlayerDashboard` containing heatmap, trends, roadmap, topic leaderboard, friend insights.

---

## Part 6 — UI Polish

All new screens use existing cyberpunk tokens (cyan/magenta neon, scanlines, glass cards). Animated rings via Tailwind keyframes already in config. Recharts for graphs. Framer-motion only for the post-match report reveal sequence.

---

## Migration Order

1. Migration: `mp_match_audit`, `match_answers`, `topic_mastery`, `learning_recommendations`, `profiles.share_insights` column.
2. Edge function: `learning-coach`.
3. Engine guard + recovery overlay (fix the black screen first so users can actually reach the new features).
4. Sync queue extension + dashboard.
5. Match audit write hook in multiplayer client.
6. Learning engine + post-match report components.
7. Dashboard tabs (Sync, Rewards, Learning).
8. Smoke test: guest → play → disconnect → reconnect → finish match → verify post-match report renders.

## Files

**New (~22):** `sceneGuard.ts`, `GameRecoveryOverlay.tsx`, `SyncDashboard.tsx`, `RewardHistoryPanel.tsx`, `learningEngine.ts`, 11 learning components, edge function, 1 migration.

**Edited (~5):** `syncQueue.ts` (new kinds), `multiplayerClient.ts` (audit write hook), `PlayerDashboard.tsx` (new tabs), `Index.tsx` (wrap game with recovery overlay), `types.ts` (auto-regen after migration).

**Untouched:** all engine files (`renderer.ts`, `useGameEngine.ts` internals), level/question data, controls, single-player flow.
