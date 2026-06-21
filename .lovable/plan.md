# Final System-Wide Validation, QA & Google Sign-In Restoration

This is a large, multi-part request. I'll deliver it in **two phases** so you can review before I touch large amounts of code.

## Phase 1 — Audit + Critical Fixes (this turn, on approval)

### A. Project-wide Audit Report
A written launch-readiness report covering: frontend, backend, DB schema, auth, multiplayer, XP/rewards, achievements, leaderboards, learning analytics, AI coach, sync queue, security (RLS + GRANTs), UI/responsiveness, performance. Each system rated Working / Issue (Critical/High/Medium/Low) with exact file references and recommended fix.

I will run:
- `security--run_security_scan` for RLS/data-exposure findings
- `supabase--linter` for DB warnings
- `supabase--read_query` to spot-check policies on `mp_room_players`, `match_answers`, `topic_mastery`, `profiles`, `learning_recommendations`
- Code grep for client-side XP/score writes, hardcoded colors, unguarded `dangerouslySetInnerHTML`, missing `aria-label`s on icon buttons

### B. Restore Google Sign-In (highest-priority concrete fix)
Recover the previously-removed Google flow using **Lovable Cloud managed Google OAuth** (no new architecture, no new secrets):

1. Run `supabase--configure_social_auth` for Google so the provider is enabled and the generated `src/integrations/lovable/` module is regenerated.
2. Re-add a "Continue with Google" button to `AuthLogin.tsx` and `AuthSignup.tsx` calling `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
3. In `useAuth.ts` + `handle_new_user()` trigger: confirm profile auto-creation handles `provider=google` users (username from `raw_user_meta_data.full_name` fallback to email prefix) — trigger already does this; only add a guard for empty username collisions.
4. Add `migrateGuestToAccount()` call on first Google sign-in so guest progress isn't lost.
5. Account linking UI: small "Link Google" button in `PlayerDashboard` Profile tab using `supabase.auth.linkIdentity({ provider: 'google' })`, and "Unlink" using `supabase.auth.unlinkIdentity()` (guarded: refuse if it's the only identity).

### C. Critical fixes surfaced by the audit (only ones I'm confident about up-front)
- **Score/XP server-side validation**: `mp_award_points` already clamps deltas — confirm RLS on `mp_room_players` UPDATE only allows the player's own row via `session_token`, and that direct client UPDATEs are blocked (force all writes through the RPC). If client UPDATE policy exists, tighten it in a migration.
- **`match_answers` & `topic_mastery` integrity**: add a policy preventing users from inserting rows for other `user_id`s if not already enforced.
- **`learning-coach` edge function**: add JWT verification (currently may be public) and rate-limit by user_id in-memory.
- **Accessibility quick-wins**: add `aria-label` to icon-only buttons in `GameHUD`, `PauseMenu`, `TouchControls`, `Joystick`; replace any `h-screen` with `h-dvh` on full-height layouts.
- **Performance**: lazy-load `LearningCenter`, `PostMatchReport`, `PlayerDashboard` heavy tabs with `React.lazy` to cut initial bundle.

## Phase 2 — Deep gameplay/learning improvements (separate turn)

Only after Phase 1 is approved and merged:
- Question-bank quality pass (duplicate detection script, explanation completeness check)
- Matchmaking skill-rating (Elo-lite) on `player_stats`
- Stress-test simulation script for multiplayer rooms
- Friend system + notifications (new tables — large migration)
- Admin dashboard (new route, role-gated via `has_role`)

## Out of scope (per your standing rules)
- No changes to single-player engine, multiplayer engine, level design, coding challenges, controls, or renderer files (`src/game/useGameEngine.ts`, `useMultiplayer.ts`, `renderer.ts`, `levels.ts`, `questions.ts`, `multiplayerClient.ts` gameplay logic).
- No feature removals.

## Deliverables this turn (after approval)
1. `AUDIT_REPORT.md` at project root with full findings + readiness scores.
2. Google Sign-In fully restored end-to-end (login, signup, linking, guest migration).
3. One migration tightening RLS on `mp_room_players`, `match_answers`, `topic_mastery` if gaps are found.
4. Edge-function hardening for `learning-coach` (verify_jwt).
5. A11y + lazy-loading quick wins.

**Approve to proceed**, or tell me to narrow scope (e.g. "just restore Google sign-in first").
