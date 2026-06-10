
-- Multiplayer tables for Syntax Saga
CREATE TABLE public.mp_rooms (
  code TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  level INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_rooms TO anon, authenticated;
GRANT ALL ON public.mp_rooms TO service_role;
ALTER TABLE public.mp_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_all" ON public.mp_rooms FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.mp_room_players (
  room_code TEXT NOT NULL REFERENCES public.mp_rooms(code) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ready BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  challenges_won INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  finished BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_code, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_room_players TO anon, authenticated;
GRANT ALL ON public.mp_room_players TO service_role;
ALTER TABLE public.mp_room_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_all" ON public.mp_room_players FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.mp_challenge_locks (
  id BIGSERIAL PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES public.mp_rooms(code) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  challenge_id INTEGER NOT NULL,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',
  solved_correctly BOOLEAN,
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_code, level, challenge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_challenge_locks TO anon, authenticated;
GRANT ALL ON public.mp_challenge_locks TO service_role;
ALTER TABLE public.mp_challenge_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locks_all" ON public.mp_challenge_locks FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mp_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mp_room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mp_challenge_locks;
