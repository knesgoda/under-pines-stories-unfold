-- Add optional profile cover and pinned posts
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_cover_url text NULL,
  ADD COLUMN IF NOT EXISTS pinned_post_ids uuid[] NOT NULL DEFAULT '{}';

-- No RLS policy changes required; fields are part of profiles row

