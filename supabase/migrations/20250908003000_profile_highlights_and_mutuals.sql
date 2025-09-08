-- Profile Highlights table
CREATE TABLE IF NOT EXISTS public.profile_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  cover_url text NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_highlights ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read highlights; owners can manage their own
CREATE POLICY IF NOT EXISTS profile_highlights_select_all ON public.profile_highlights FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS profile_highlights_owner_ins ON public.profile_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS profile_highlights_owner_upd ON public.profile_highlights FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS profile_highlights_owner_del ON public.profile_highlights FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profile_highlights_user ON public.profile_highlights(user_id);


