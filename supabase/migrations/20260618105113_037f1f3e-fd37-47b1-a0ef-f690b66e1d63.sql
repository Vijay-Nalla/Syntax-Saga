
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_reward_claim date,
  ADD COLUMN IF NOT EXISTS streak_freeze_tokens int NOT NULL DEFAULT 1;

ALTER TABLE public.player_stats
  ADD COLUMN IF NOT EXISTS total_correct int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_wrong int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_coins int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_session_s int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_accuracy int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.save_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.save_backups TO authenticated;
GRANT ALL ON public.save_backups TO service_role;
ALTER TABLE public.save_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "backups_own_select" ON public.save_backups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "backups_own_insert" ON public.save_backups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "backups_own_delete" ON public.save_backups FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS save_backups_user_created_idx ON public.save_backups(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.daily_rewards_log (
  user_id uuid NOT NULL,
  claim_date date NOT NULL,
  day_in_streak int NOT NULL,
  reward_kind text NOT NULL,
  reward_value int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, claim_date)
);
GRANT SELECT ON public.daily_rewards_log TO authenticated;
GRANT ALL ON public.daily_rewards_log TO service_role;
ALTER TABLE public.daily_rewards_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_own_select" ON public.daily_rewards_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.progress_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  language text,
  level int,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.progress_events TO authenticated;
GRANT ALL ON public.progress_events TO service_role;
ALTER TABLE public.progress_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_own_select" ON public.progress_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "events_own_insert" ON public.progress_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS progress_events_user_created_idx ON public.progress_events(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.claim_daily_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  uid uuid;
  v_today date;
  last_claim date;
  v_streak int;
  v_freeze int;
  v_day int;
  v_kind text;
  v_value int;
  v_diff int;
BEGIN
  uid := auth.uid();
  v_today := CURRENT_DATE;
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT last_reward_claim, login_streak, streak_freeze_tokens
    INTO last_claim, v_streak, v_freeze
  FROM public.profiles WHERE user_id = uid;

  IF last_claim = v_today THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'already_claimed_today', 'streak', v_streak);
  END IF;

  IF last_claim IS NULL THEN
    v_streak := 1;
  ELSE
    v_diff := v_today - last_claim;
    IF v_diff = 1 THEN
      v_streak := COALESCE(v_streak, 0) + 1;
    ELSIF v_diff = 2 AND COALESCE(v_freeze, 0) > 0 THEN
      v_streak := COALESCE(v_streak, 0) + 1;
      v_freeze := v_freeze - 1;
    ELSE
      v_streak := 1;
    END IF;
  END IF;

  v_day := v_streak;
  IF mod(v_day, 30) = 0 THEN v_kind := 'legendary'; v_value := 2000;
  ELSIF mod(v_day, 14) = 0 THEN v_kind := 'epic'; v_value := 1000;
  ELSIF mod(v_day, 7) = 0 THEN v_kind := 'rare'; v_value := 500;
  ELSIF mod(v_day, 5) = 0 THEN v_kind := 'achievement_token'; v_value := 200;
  ELSIF mod(v_day, 4) = 0 THEN v_kind := 'avatar_item'; v_value := 150;
  ELSIF mod(v_day, 3) = 0 THEN v_kind := 'xp_boost'; v_value := 100;
  ELSIF mod(v_day, 2) = 0 THEN v_kind := 'coins'; v_value := 100;
  ELSE v_kind := 'coins'; v_value := 50;
  END IF;

  UPDATE public.profiles
    SET last_reward_claim = v_today,
        login_streak = v_streak,
        streak_freeze_tokens = LEAST(COALESCE(v_freeze, 0) + (CASE WHEN mod(v_streak, 14) = 0 THEN 1 ELSE 0 END), 3),
        last_login = now()
    WHERE user_id = uid;

  INSERT INTO public.daily_rewards_log(user_id, claim_date, day_in_streak, reward_kind, reward_value)
    VALUES (uid, v_today, v_day, v_kind, v_value);

  UPDATE public.player_stats
    SET total_coins = total_coins + v_value, updated_at = now()
    WHERE user_id = uid;

  INSERT INTO public.progress_events(user_id, kind, payload)
    VALUES (uid, 'streak_milestone', jsonb_build_object('day', v_day, 'reward_kind', v_kind, 'reward_value', v_value));

  RETURN jsonb_build_object('claimed', true, 'streak', v_streak, 'day', v_day, 'reward_kind', v_kind, 'reward_value', v_value);
END;
$fn$;
GRANT EXECUTE ON FUNCTION public.claim_daily_reward() TO authenticated;

ALTER TABLE public.mp_rooms
  ADD COLUMN IF NOT EXISTS session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '4 hours');

ALTER TABLE public.mp_room_players
  ADD COLUMN IF NOT EXISTS session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS device_id text,
  ADD COLUMN IF NOT EXISTS last_activity timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.mp_is_member(_room text, _token uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.mp_room_players WHERE room_code = _room AND session_token = _token);
$fn$;
GRANT EXECUTE ON FUNCTION public.mp_is_member(text, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mp_validate_score_update()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.score < OLD.score THEN NEW.score := OLD.score; END IF;
  IF NEW.score - OLD.score > 5000 THEN NEW.score := OLD.score + 5000; END IF;
  IF NEW.challenges_won < OLD.challenges_won THEN NEW.challenges_won := OLD.challenges_won; END IF;
  IF NEW.challenges_won - OLD.challenges_won > 1 THEN NEW.challenges_won := OLD.challenges_won + 1; END IF;
  IF NEW.correct_answers < OLD.correct_answers THEN NEW.correct_answers := OLD.correct_answers; END IF;
  IF NEW.coins < OLD.coins THEN NEW.coins := OLD.coins; END IF;
  NEW.last_activity := now();
  NEW.last_seen := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS mp_validate_score_trg ON public.mp_room_players;
CREATE TRIGGER mp_validate_score_trg
  BEFORE UPDATE ON public.mp_room_players
  FOR EACH ROW EXECUTE FUNCTION public.mp_validate_score_update();

CREATE OR REPLACE FUNCTION public.mp_award_points(_room text, _token uuid, _score_delta int, _challenge_win boolean, _correct_delta int, _coin_delta int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pid record;
BEGIN
  IF NOT public.mp_is_member(_room, _token) THEN RAISE EXCEPTION 'not a room member'; END IF;
  _score_delta := GREATEST(0, LEAST(_score_delta, 5000));
  _correct_delta := GREATEST(0, LEAST(_correct_delta, 1));
  _coin_delta := GREATEST(0, LEAST(_coin_delta, 500));
  UPDATE public.mp_room_players
    SET score = score + _score_delta,
        challenges_won = challenges_won + (CASE WHEN _challenge_win THEN 1 ELSE 0 END),
        correct_answers = correct_answers + _correct_delta,
        coins = coins + _coin_delta
    WHERE room_code = _room AND session_token = _token
    RETURNING * INTO pid;
  RETURN jsonb_build_object('score', pid.score, 'challenges_won', pid.challenges_won);
END;
$fn$;
GRANT EXECUTE ON FUNCTION public.mp_award_points(text, uuid, int, boolean, int, int) TO anon, authenticated;

DROP POLICY IF EXISTS players_all ON public.mp_room_players;
DROP POLICY IF EXISTS rooms_all ON public.mp_rooms;
DROP POLICY IF EXISTS locks_all ON public.mp_challenge_locks;

CREATE POLICY "rooms_read" ON public.mp_rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rooms_insert" ON public.mp_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "rooms_update_members" ON public.mp_rooms FOR UPDATE TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.mp_room_players p WHERE p.room_code = code));

CREATE POLICY "players_insert" ON public.mp_room_players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "players_read_room" ON public.mp_room_players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "players_update_own" ON public.mp_room_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "players_delete_own" ON public.mp_room_players FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "locks_read_members" ON public.mp_challenge_locks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "locks_insert" ON public.mp_challenge_locks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "locks_update_owner" ON public.mp_challenge_locks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
