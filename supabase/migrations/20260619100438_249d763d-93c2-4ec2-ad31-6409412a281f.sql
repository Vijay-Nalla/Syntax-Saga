
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS share_insights boolean NOT NULL DEFAULT false;

CREATE TABLE public.mp_match_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  user_id uuid,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  topics text[] NOT NULL DEFAULT '{}',
  difficulty text,
  language text,
  winner text,
  xp_awarded jsonb DEFAULT '{}'::jsonb,
  connection_issues jsonb DEFAULT '[]'::jsonb,
  questions_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mp_match_audit TO authenticated;
GRANT SELECT, INSERT ON public.mp_match_audit TO anon;
GRANT ALL ON public.mp_match_audit TO service_role;
ALTER TABLE public.mp_match_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_owner_read" ON public.mp_match_audit FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "audit_insert_any" ON public.mp_match_audit FOR INSERT WITH CHECK (true);

CREATE TABLE public.match_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  room_code text,
  question_id text,
  topic text NOT NULL,
  subtopic text,
  difficulty text,
  language text,
  question_text text,
  user_answer text,
  correct_answer text,
  is_correct boolean NOT NULL DEFAULT false,
  time_ms int DEFAULT 0,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_answers TO authenticated;
GRANT SELECT, INSERT ON public.match_answers TO anon;
GRANT ALL ON public.match_answers TO service_role;
ALTER TABLE public.match_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers_owner_read" ON public.match_answers FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "answers_insert_any" ON public.match_answers FOR INSERT WITH CHECK (true);

CREATE TABLE public.topic_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  correct int NOT NULL DEFAULT 0,
  wrong int NOT NULL DEFAULT 0,
  accuracy int NOT NULL DEFAULT 0,
  mastery_level text NOT NULL DEFAULT 'weak',
  last_played timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_mastery TO authenticated;
GRANT ALL ON public.topic_mastery TO service_role;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mastery_owner_all" ON public.topic_mastery FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "mastery_friend_view" ON public.topic_mastery FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = topic_mastery.user_id AND COALESCE(p.share_insights, false) = true)
);

CREATE TABLE public.learning_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  est_days int DEFAULT 5,
  confidence_gain int DEFAULT 20,
  coach_note text,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_recommendations TO authenticated;
GRANT ALL ON public.learning_recommendations TO service_role;
ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reco_owner_all" ON public.learning_recommendations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_match_answers_user ON public.match_answers(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.mp_match_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mastery_user ON public.topic_mastery(user_id);
