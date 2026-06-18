# Advanced Player Ecosystem Expansion

## Guarantee
Single-player engine, multiplayer engine, level design, coding challenges, controls, renderer, and existing scoring logic are **not modified**. All new systems are additive layers that wrap the existing save/auth pipeline.

---

## 1. Save Conflict Resolver

**New file:** `src/game/conflictResolver.ts`
- On login (or guest-to-account upgrade), fetch cloud snapshot + local snapshot.
- Compare `updated_at`, `unlocked_level`, `total_stars` per language.
- If no mismatch → silent merge.
- If mismatch → emit a conflict event handled by a new modal.

**New component:** `src/components/SaveConflictModal.tsx`
- Side-by-side cards: Cloud vs Local (level, stars, last-updated timestamp).
- Buttons: **Use Cloud**, **Use Local**, **Smart Merge** (when mergeable).
- Smart merge rule: pick `max(unlocked_level)`, `max(total_stars)`, union of achievements, sum of lifetime stats, latest `last_seen`.
- Before applying any choice, write a backup row to `save_backups` (source, version, timestamp, snapshot JSON).

**DB:** `save_backups (id, user_id, source text, snapshot jsonb, created_at)` — RLS scoped to `auth.uid()`.

---

## 2. Offline Auto-Save + Sync Queue

**New file:** `src/game/syncQueue.ts`
- Wraps existing `saveSystem.ts` calls. When `navigator.onLine === false` OR a Supabase call rejects, enqueue an action: `{kind, payload, ts}` in `localStorage["syntax-saga.sync-queue"]`.
- Kinds: `level_result`, `achievement`, `progress`, `stats_delta`.
- A drainer runs on `window.online` event, on app focus, and every 30s while signed in.
- Each action is idempotent (uses upsert keys already in schema).

**New component:** `src/components/CloudStatusBadge.tsx`
- Fixed bottom-right pill: `✓ Synced` / `Syncing…` / `Offline` / `N pending`.
- Subscribes to the queue + `navigator.onLine`.
- Replaces existing `SyncStatusBadge.tsx` (kept as thin re-export for compat).

**Behavior:** Existing `saveLevelResult` etc. keep their current signatures; internally they now go through the queue wrapper. No engine change.

---

## 3. Daily Login Streak + Rewards

**DB additions:**
- Extend `profiles`: add `last_reward_claim date`, `streak_freeze_tokens int default 1`.
- New table `daily_rewards_log (user_id, claim_date, day_in_streak, reward_kind, reward_value)` — composite PK `(user_id, claim_date)`.

**New file:** `src/game/dailyRewards.ts`
- Reward ladder: Day 1 (50c), 2 (100c), 3 (XP boost), 4 (avatar item), 5 (achievement token), 7 (rare), 14 (epic), 30 (legendary). Cycles after 30.
- On login: compute days since `last_login`. `0` = already claimed today; `1` = streak +1; `>1` = consume freeze token if available, else reset to 1.

**New component:** `src/components/DailyRewardModal.tsx`
- Shown once per day after dashboard mount; displays ladder, current day, claim button.
- On claim → atomic RPC `claim_daily_reward()` (security-definer) that updates profile, inserts log row, credits coins to `player_stats`.

---

## 4. Player Profile History + Analytics

**Extend `player_stats`:** add `total_correct int`, `total_wrong int`, `total_coins int`, `longest_session_s int`, `best_accuracy int`.

**New table:** `progress_events (id, user_id, kind, language, level, payload jsonb, created_at)` — append-only timeline. Kinds: `level_completed`, `achievement_unlocked`, `mp_victory`, `language_mastered`, `streak_milestone`. RLS: own rows only.

**New components:**
- `src/components/ProfileDashboard.tsx` (replaces existing `PlayerDashboard.tsx`'s analytics tab; the existing dashboard keeps its current shell, gains tabs: **Overview / Languages / History / Graphs**).
- `src/components/LanguageAnalytics.tsx` — per-language cards (level, %, stars, accuracy, time, challenges).
- `src/components/ProgressTimeline.tsx` — vertical event list from `progress_events`.
- `src/components/PerformanceGraphs.tsx` — uses `recharts` (already a shadcn dep) for accuracy trend, stars/week, login activity heatmap.

Hooks into existing completion callbacks emit `progress_events` rows via the sync queue — no engine edits.

---

## 5. Multiplayer Security Hardening

The current `mp_*` tables intentionally allow anonymous room-code play. Harden without breaking guests:

**Migration changes:**
- Add `session_token uuid default gen_random_uuid()`, `expires_at timestamptz default now()+interval '4 hours'` to `mp_rooms`.
- Add `session_token uuid`, `device_id text`, `last_activity timestamptz` to `mp_room_players`.
- Replace `USING (true)` policies with **token-scoped policies**: a player can only `SELECT/UPDATE` their own row (`session_token` match) or rows in the same `room_code` they're a member of. Enforced via SQL security-definer helpers `mp_is_member(code, token)` / `mp_is_host(code, token)`.
- Trigger `mp_validate_score()` clamps `score`, `challenges_won`, `correct_answers` deltas per update (no >+1 challenge per call, no score regressions, server timestamps `last_activity`).
- Trigger on `mp_challenge_locks`: only the lock owner (matching `owner_id` + valid session) may mark `solved_correctly`.
- Auto-expire: cron-less cleanup via a `before insert` trigger that deletes rooms past `expires_at`.

**Client side (`multiplayerClient.ts`):** add `session_token` to every request; persist in `sessionStorage`. No UX change for the player — token is generated on join.

**Cheat-protection RPCs:** `mp_award_points(room_code, token, delta)` validates membership + bounds before incrementing. Replaces direct table updates from the client.

---

## 6. Backup & Restore

- `save_backups` table (above) holds full snapshots on: conflict-resolve, account creation, before destructive merge, manual "Backup now" button on profile.
- New `BackupRestorePanel.tsx` in profile settings lists backups (date, source) with **Restore** button → confirms, writes a new backup of current state, then restores.

---

## Files

**New**
- `src/game/conflictResolver.ts`, `syncQueue.ts`, `dailyRewards.ts`, `analytics.ts`
- `src/components/SaveConflictModal.tsx`, `CloudStatusBadge.tsx`, `DailyRewardModal.tsx`, `ProfileDashboard.tsx`, `LanguageAnalytics.tsx`, `ProgressTimeline.tsx`, `PerformanceGraphs.tsx`, `BackupRestorePanel.tsx`
- 1 migration: schema additions + RLS rewrite for `mp_*` + helper functions + RPCs

**Edited (additive only)**
- `src/game/saveSystem.ts` — route writes through `syncQueue`
- `src/game/multiplayerClient.ts` — attach `session_token`, call `mp_award_points` RPC
- `src/components/PlayerDashboard.tsx` — mount new tabs + modals
- `src/pages/Index.tsx` — mount `CloudStatusBadge` + conflict/daily-reward modals at root
- `src/components/SyncStatusBadge.tsx` — re-export shim

**Untouched**
- `useGameEngine.ts`, `renderer.ts`, `levels.ts`, `questions.ts`, `CodingChallenge.tsx`, `GameHUD.tsx`, `MultiplayerLobby.tsx` (no UX change), `TouchControls.tsx`, `TitleScreen.tsx`

---

## Order of execution
1. Run migration (schema + RLS + RPCs + triggers).
2. Build `syncQueue` + wrap `saveSystem`.
3. Build `conflictResolver` + modal.
4. Build daily rewards (table, RPC, modal, hook).
5. Build profile dashboard tabs + analytics components.
6. Harden multiplayer client to use tokens + RPCs.
7. Wire `CloudStatusBadge` and modals into `Index.tsx`.
8. Smoke-test offline play → reconnect → sync.
