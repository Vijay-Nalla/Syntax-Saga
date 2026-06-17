
-- Profiles
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  avatar text,
  recovery_email text,
  login_streak integer NOT NULL DEFAULT 0,
  last_login timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Player progress per language
CREATE TABLE public.player_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL,
  current_level integer NOT NULL DEFAULT 1,
  unlocked_level integer NOT NULL DEFAULT 1,
  total_stars integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, language)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_progress TO authenticated;
GRANT ALL ON public.player_progress TO service_role;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pp_own_all" ON public.player_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Per-level results
CREATE TABLE public.level_results (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL,
  level integer NOT NULL,
  stars integer NOT NULL DEFAULT 0,
  best_score integer NOT NULL DEFAULT 0,
  best_time_ms integer,
  attempts integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  accuracy integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, language, level)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_results TO authenticated;
GRANT ALL ON public.level_results TO service_role;
ALTER TABLE public.level_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lr_own_all" ON public.level_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Achievements unlocked
CREATE TABLE public.achievements_unlocked (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements_unlocked TO authenticated;
GRANT ALL ON public.achievements_unlocked TO service_role;
ALTER TABLE public.achievements_unlocked ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach_own_all" ON public.achievements_unlocked FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Aggregate stats
CREATE TABLE public.player_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_play_time_s integer NOT NULL DEFAULT 0,
  levels_completed integer NOT NULL DEFAULT 0,
  challenges_solved integer NOT NULL DEFAULT 0,
  mp_wins integer NOT NULL DEFAULT 0,
  fastest_time_ms integer,
  languages_played jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_stats TO authenticated;
GRANT ALL ON public.player_stats TO service_role;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_own_all" ON public.player_stats FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_pp_updated BEFORE UPDATE ON public.player_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_lr_updated BEFORE UPDATE ON public.level_results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ps_updated BEFORE UPDATE ON public.player_stats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + stats row on signup; username comes from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uname text;
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (user_id, username) VALUES (NEW.id, uname)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.player_stats (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
