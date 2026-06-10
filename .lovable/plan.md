## Goal

Add a fully working online Multiplayer mode on top of the current game. Single Player stays byte-for-byte identical — same controls, same levels, same challenges, same scoring, same renderer.

The existing `MultiplayerLobby` and `useMultiplayer` are mock/local only. We'll replace the mock layer with a real backend using **Lovable Cloud** (Supabase Realtime + Postgres) — no separate server to host.

## Architecture

```
Lovable Cloud (Supabase)
├── Postgres tables: rooms, room_players, challenge_locks, match_results
└── Realtime channel per room: room:{CODE}
    ├── presence       → who's in the room, ready state, online/disconnected
    ├── broadcast:pos  → 20 Hz player position/velocity/facing
    ├── broadcast:evt  → join, ready, start, language, coin, finish
    └── postgres_changes on challenge_locks → ownership claims (atomic via unique constraint)
```

One shared session per room code. No duplicate game instances — both clients render the same world; each is authoritative over its own avatar; the DB is authoritative over challenge ownership and final scores.

## Data model (new tables, all in `public`, with GRANTs + RLS)

- `rooms(code pk, host_id, language, status: waiting|playing|finished, created_at)`
- `room_players(room_code fk, user_id, name, ready bool, score int, challenges_won int, joined_at, last_seen)` — PK (room_code, user_id)
- `challenge_locks(room_code, level, challenge_id, owner_id, status: locked|completed, solved_correctly bool, created_at)` — UNIQUE(room_code, level, challenge_id) so the first INSERT wins ownership
- `match_results(id, room_code, user_id, name, correct, wrong, accuracy, topic_stats jsonb, challenges_won, bonus_points, total_score, created_at)`

RLS: anyone with the room code can read/write rows for that room (anonymous auth via Supabase anon session — no signup required). Locks: INSERT allowed; UPDATE only by owner.

## Frontend changes (additive)

### New files
- `src/game/multiplayerClient.ts` — Supabase channel wrapper: `joinRoom`, `leaveRoom`, `setReady`, `startMatch`, `sendPosition`, `claimChallenge`, `completeChallenge`, `submitResults`, plus subscriptions.
- `src/components/MultiplayerLobby.tsx` — **rewrite** to use real client: Create Room (generates code, inserts row), Join Room (by code OR `?join=CODE` URL param), Copy Code / Copy Invite Link / Share on WhatsApp / native Share, presence list with Ready toggle, host-only Start (disabled until 2/2 and both Ready), host-only Language picker.
- `src/components/RemotePlayer.tsx` (logical — actually drawn inside renderer hook) — interpolated remote avatar with name tag, score, online dot.

### Modified files (additive only, single-player path untouched)
- `src/game/useGameEngine.ts` — accept optional `multiplayer` handle. When present:
  - broadcast local player position each frame (throttled to 20 Hz)
  - apply received remote position into a `remotePlayerRef` consumed by the renderer
  - intercept terminal interaction: call `claimChallenge(level, challengeId)`; only open `CodingChallenge` if the insert succeeded; otherwise show transient "CHALLENGE OCCUPIED — {name} got there first" toast
  - on correct answer: +100 base; if we were the first claimant (always true here since lock is required), add +50 first-access bonus; write score to `room_players` and mark `challenge_locks.completed`
  - on level finish: submit `match_results` and transition to post-match report
- `src/game/renderer.ts` — accept optional remote-player state and draw a second avatar (different hue) with floating name + score.
- `src/pages/Index.tsx` — route `?join=CODE` straight into name entry → multiplayer lobby join flow; pass real multiplayer handle into engine for `multiplayer-playing` screen; gate match start on `room.status === 'playing'`.
- `src/components/PostMatchReport.tsx` — already exists; wire it to real `match_results` rows (both players, head-to-head topic comparison, achievements derived from stats).
- `src/components/GameModeSelect.tsx` — already exists, no change.

### Disconnect handling
- Presence `leave` event → mark `room_players.last_seen`, broadcast `player_disconnected`, show "Player Disconnected — Waiting 30s" overlay, pause local sim. On rejoin within 30s → resume. Otherwise → end match safely with current scores.

## Single-Player guarantee

Single Player path (`game-mode-select` → `language-select` → `playing`) never touches the multiplayer client. The engine receives `multiplayer: undefined` and behaves exactly as today. Zero edits to `levels.ts`, `questions.ts`, scoring math, controls, or challenge UI logic.

## Out of scope / explicit non-goals

- No auth UI — uses Supabase anonymous sessions silently.
- No matchmaking / public rooms — invite-code only.
- Custom domain in invite links uses `window.location.origin` (works for preview + published + custom domain automatically).

## Steps

1. Enable Lovable Cloud.
2. Migration: create the 4 tables + GRANTs + RLS + realtime publication.
3. Build `multiplayerClient.ts`.
4. Rewrite `MultiplayerLobby.tsx` against the real client (code, invite link, WhatsApp share, ready/start gating, host-only language).
5. Extend `useGameEngine.ts` with optional multiplayer hook integration (position sync, lock-based challenge ownership, score sync).
6. Extend `renderer.ts` to draw remote player.
7. Handle `?join=CODE` deep link in `Index.tsx`.
8. Wire real `PostMatchReport` from `match_results`.
9. Disconnect / reconnect overlay.
10. Manual test: open two browser windows, create + join, race for a terminal, verify lock + bonus, finish level, see report.
