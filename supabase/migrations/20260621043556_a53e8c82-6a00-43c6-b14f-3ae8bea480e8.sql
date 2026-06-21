
-- Tighten INSERT policies: only allow inserting rows for yourself or anonymous null user_id
DROP POLICY IF EXISTS answers_insert_any ON public.match_answers;
CREATE POLICY answers_insert_own ON public.match_answers
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS audit_insert_any ON public.mp_match_audit;
CREATE POLICY audit_insert_own ON public.mp_match_audit
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Fix function search_path warnings
ALTER FUNCTION public.mp_award_points(text, uuid, integer, boolean, integer, integer) SET search_path = public;
ALTER FUNCTION public.mp_validate_score_update() SET search_path = public;
ALTER FUNCTION public.mp_is_member(text, uuid) SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.claim_daily_reward() SET search_path = public;
