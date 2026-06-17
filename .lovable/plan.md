## Plan: Accounts, Cloud Save, Guest Mode, Level Select & Progression

### Guarantee (read first)
- Single-player gameplay, multiplayer gameplay, levels, controls, coding challenges, scoring logic: **untouched**.
- All new systems wrap *around* the existing engine. The engine itself receives only one new optional input: a `startLevel` number (already supported via existing level state) and an `onLevelComplete` callback hook for the save layer (already emitted). No edits to `levels.ts`, `questions.ts`, `useGameEngine.ts` gameplay code, or `renderer.ts`.

---

### 1. Auth & Accounts (Lovable Cloud)
- Enable email/password auth (username stored in `profiles.username`, login by username → resolve to synthetic email `username@syntaxsaga.local` to satisfy Supabase email auth without email collection).
- Optional real recovery email field for "Forgot password".
- **Guest mode**: no auth call; generates `Guest_XXXXX` id stored in `localStorage`. All progress saved locally.
- **Welcome screen** with 3 buttons: Login / Create Account / Play as Guest.
- Live validation (username availability via DB query; password strength regex client-side).

### 2. Database (new tables, all RLS to `auth.uid()`)
- `profiles` (user_id PK, username UNIQUE, avatar, recovery_email, created_at, last_login, login_streak)
- `player_progress` (user_id, language, current_level, unlocked_level, total_stars, coins, updated_at) — composite PK (user_id, language)
- `level_results` (user_id, language, level, stars, best_score, best_time_ms, attempts, wins, accuracy, updated_at) — composite PK
- `achievements_unlocked` (user_id, achievement_id, unlocked_at)
- `player_stats` (user_id PK, total_play_time_s, levels_completed, challenges_solved, mp_wins, fastest_time_ms, languages_played jsonb)

All tables: GRANT to authenticated + service_role, RLS `auth.uid() = user_id`.

### 3. Save layer (`src/game/saveSystem.ts` — new)
- Unified API: `loadProgress(language)`, `saveLevelResult(...)`, `unlockNext(...)`, `getDashboard()`.
- Dual backend: if logged in → Supabase; if guest → localStorage under `syntaxsaga:guest:<id>`.
- Auto-save hooks fired after level completion, challenge completion, achievement unlock (called from existing completion callbacks already in `useGameEngine` / `Index.tsx` — non-invasive observers).
- Offline queue: writes that fail are queued in localStorage and flushed on reconnect.
- Sync status indicator (Synced / Syncing / Offline).

### 4. Guest → Account migration
- On signup while in guest mode: read all `localStorage` guest data, upsert into Supabase tables for the new `user_id`, then clear guest keys.
- Save-conflict modal when cloud + local both exist on login: "Use Cloud (Lvl X) / Use Local (Lvl Y)".

### 5. New screens (additive, do NOT replace existing TitleScreen flow — inserted *before* it)
- `WelcomeScreen.tsx` — logo + 3 buttons.
- `AuthLogin.tsx`, `AuthSignup.tsx`, `ForgotPassword.tsx`.
- `PlayerDashboard.tsx` — profile card, continue button, cloud status, streak, recent activity.
- `LanguageHub.tsx` — already exists as LanguageSelect; **wrap** it to show per-language progress badges (Level X / 50, total stars). Original component preserved; new badges layered on top via prop.
- `LevelSelectMap.tsx` — world map with 5 worlds × 10 levels = 50 cards. Shows ✓ / 🔓 / 🔒, stars, best score, time.
- `AchievementsPanel.tsx` — list + popups.

### 6. Star system (computed, NOT changing scoring)
- Stars derived from existing score/time/mistakes that the engine already emits on level complete:
  - 3★: correct + fast + 0 mistakes
  - 2★: correct + moderate + ≤2 mistakes
  - 1★: correct otherwise
- Saved to `level_results.stars` (max kept).

### 7. Level unlocking
- `unlocked_level` starts at 1; bumped to `max(unlocked_level, completed_level + 1)` on each completion.
- Level select cards beyond `unlocked_level` are locked (visual only). Engine still accepts any level if called, but UI prevents it.

### 8. Underground level audit
- Run a static audit script over `levels.ts` for underground worlds (worlds 3 = Underground Caverns by our mapping, levels 21–30): check every platform is reachable (jump arc), every challenge trigger has a platform under it, exit pipe exists and is in free space, no platforms above entry/exit pipes (per earlier rule), checkpoints present.
- Report findings; fix only data-level placement issues in `levels.ts` if any are detected. **No engine changes.** If no issues, no edits.

### 9. UI polish
- Glassmorphism cards (existing token palette: blue/red gradient, no green).
- Framer-motion for level unlock, star burst, achievement toast.
- Continue-from-last-level CTA on dashboard.
- Cross-device sync just works because cloud is source of truth for logged-in users.

---

### Files

**New**
- `src/components/WelcomeScreen.tsx`
- `src/components/AuthLogin.tsx`, `AuthSignup.tsx`, `ForgotPassword.tsx`
- `src/components/PlayerDashboard.tsx`
- `src/components/LevelSelectMap.tsx`
- `src/components/AchievementsPanel.tsx`
- `src/components/SyncStatusBadge.tsx`
- `src/game/saveSystem.ts`
- `src/game/achievements.ts`
- `src/game/starCalc.ts`
- `src/hooks/useAuth.ts`
- `src/hooks/usePlayerProgress.ts`
- Migration: profiles, player_progress, level_results, achievements_unlocked, player_stats + RLS + GRANTs + updated_at triggers.

**Modified (additive only)**
- `src/pages/Index.tsx` — new screen states: `welcome`, `auth-login`, `auth-signup`, `dashboard`, `level-select`. Inserted *before* existing flow. Existing screens unchanged in behavior.
- `src/components/LanguageSelect.tsx` — accept optional `progressByLanguage` prop to render badges (default undefined = current look).
- Hook into existing level-complete event in `Index.tsx` to call `saveSystem.saveLevelResult`.

**Untouched**
- `src/game/useGameEngine.ts`, `src/game/renderer.ts`, `src/game/levels.ts` (unless audit finds issues), `src/game/questions.ts`, `src/components/CodingChallenge.tsx`, `src/components/GameHUD.tsx`, `src/components/MultiplayerLobby.tsx`, `src/game/multiplayerClient.ts`.

### Steps
1. Migration: 5 tables + RLS + GRANTs.
2. `useAuth` + welcome / login / signup / forgot screens.
3. `saveSystem` (cloud + guest local + offline queue + migration on signup).
4. Dashboard + Continue button.
5. Level select map + star calc + unlock logic.
6. Achievements + toasts.
7. Wire into existing Index.tsx flow without altering screens already in use.
8. Underground audit script → report → optional data-only fixes.
9. Manual test: guest play → close → reopen → resume; guest → signup → progress kept; login from "other device" sim (different browser) → same progress.
