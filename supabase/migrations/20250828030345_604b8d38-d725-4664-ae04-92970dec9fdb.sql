-- Safety system: blocks, mutes, reports, and admin roles
-- blocks: hide each other's content entirely
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- mutes: hide from my feeds/notifications but they can still see me
CREATE TABLE IF NOT EXISTS mutes (
  muter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (muter_id, muted_id)
);

-- reports: user-generated reports on posts or comments
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id uuid NULL REFERENCES posts(id) ON DELETE SET NULL,
  comment_id uuid NULL REFERENCES comments(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','closed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- simple admin role
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocks
CREATE POLICY blocks_select_self ON blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY blocks_mutate_self ON blocks FOR ALL
  USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

-- RLS Policies for mutes
CREATE POLICY mutes_select_self ON mutes FOR SELECT
  USING (auth.uid() = muter_id);

CREATE POLICY mutes_mutate_self ON mutes FOR ALL
  USING (auth.uid() = muter_id) WITH CHECK (auth.uid() = muter_id);

-- RLS Policies for reports
CREATE POLICY reports_select_own ON reports FOR SELECT 
  USING (auth.uid() = reporter_id);

CREATE POLICY reports_insert_own ON reports FOR INSERT 
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY reports_select_admin ON reports FOR SELECT 
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.is_admin));

CREATE POLICY reports_update_admin ON reports FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.is_admin))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.is_admin));

-- RLS Policies for user_roles
CREATE POLICY roles_self_or_admin ON user_roles FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.is_admin));

-- Update existing functions to include safety filters
CREATE OR REPLACE FUNCTION public.feed_following(p_user uuid, p_before timestamp with time zone DEFAULT now(), p_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, author_id uuid, body text, media jsonb, created_at timestamp with time zone, like_count integer, share_count integer, is_deleted boolean, has_media boolean, status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH authors AS (SELECT author_id FROM feed_author_ids(p_user))
  SELECT p.id, p.author_id, p.body, p.media, p.created_at, p.like_count, p.share_count, p.is_deleted, p.has_media, p.status
  FROM posts p
  JOIN authors a ON a.author_id = p.author_id
  WHERE p.status='published' 
    AND p.is_deleted = false 
    AND p.created_at < p_before
    AND NOT EXISTS (
      SELECT 1 FROM blocks b 
      WHERE (b.blocker_id = p_user AND b.blocked_id = p.author_id)
         OR (b.blocker_id = p.author_id AND b.blocked_id = p_user)
    )
    AND NOT EXISTS (
      SELECT 1 FROM mutes m 
      WHERE m.muter_id = p_user AND m.muted_id = p.author_id
    )
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT p_limit
$$;

-- Update search_people function to include safety filters
CREATE OR REPLACE FUNCTION public.search_people(p_viewer uuid, p_q text, p_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, username text, display_name text, avatar_url text, bio text, is_private boolean, discoverable boolean, relation text, rank numeric)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH us AS (
    SELECT user_id, COALESCE(is_private,false) AS is_private
    FROM user_settings
  ),
  base AS (
    SELECT
      p.id,
      p.username,
      p.display_name,
      p.avatar_url,
      p.bio,
      COALESCE(s.is_private,false) AS is_private,
      p.discoverable,
      CASE
        WHEN p.id = p_viewer THEN 'self'
        WHEN EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = p_viewer AND f.followee_id = p.id)
             AND EXISTS (SELECT 1 FROM follows f2 WHERE f2.follower_id = p.id AND f2.followee_id = p_viewer) THEN 'mutual'
        WHEN EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = p_viewer AND f.followee_id = p.id) THEN 'following'
        WHEN EXISTS (SELECT 1 FROM follow_requests r WHERE r.requester_id = p_viewer AND r.target_id = p.id) THEN 'requested'
        WHEN EXISTS (SELECT 1 FROM follows f3 WHERE f3.follower_id = p.id AND f3.followee_id = p_viewer) THEN 'follows_you'
        ELSE 'none'
      END AS relation,
      ts_rank(p.search_document, plainto_tsquery('simple', p_q)) +
      greatest(similarity(p.username, p_q), similarity(coalesce(p.display_name,''), p_q))::numeric AS rank
    FROM profiles p
    LEFT JOIN us s ON s.user_id = p.id
    WHERE p.discoverable = true
      AND (
        p_q IS NULL OR length(trim(p_q)) = 0
        OR p.search_document @@ plainto_tsquery('simple', p_q)
        OR p.username ILIKE '%'||p_q||'%'
        OR p.display_name ILIKE '%'||p_q||'%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM blocks b 
        WHERE (b.blocker_id = p_viewer AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = p_viewer)
      )
      AND NOT EXISTS (
        SELECT 1 FROM mutes m 
        WHERE m.muter_id = p_viewer AND m.muted_id = p.id
      )
  )
  SELECT * FROM base
  WHERE id <> p_viewer
  ORDER BY rank DESC NULLS LAST, id DESC
  LIMIT p_limit;
$$;

-- Create suggestions function
CREATE OR REPLACE FUNCTION suggestions_for_user(p_user uuid, p_limit int DEFAULT 20)
RETURNS TABLE (id uuid, username text, display_name text, avatar_url text, followers int) 
LANGUAGE sql 
STABLE 
AS $$
  WITH blocked AS (
    SELECT blocked_id AS uid FROM blocks WHERE blocker_id = p_user
    UNION
    SELECT blocker_id AS uid FROM blocks WHERE blocked_id = p_user
  ),
  muted AS (SELECT muted_id AS uid FROM mutes WHERE muter_id = p_user),
  already AS (SELECT followee_id AS uid FROM follows WHERE follower_id = p_user)
  SELECT pr.id, pr.username, pr.display_name, pr.avatar_url,
         (SELECT count(*) FROM follows f WHERE f.followee_id = pr.id)::int AS followers
  FROM profiles pr
  LEFT JOIN user_settings us ON us.user_id = pr.id
  WHERE pr.discoverable = true
    AND COALESCE(us.is_private,false) IN (true,false)
    AND pr.id <> p_user
    AND pr.id NOT IN (SELECT uid FROM already)
    AND pr.id NOT IN (SELECT uid FROM blocked)
    AND pr.id NOT IN (SELECT uid FROM muted)
  ORDER BY followers DESC NULLS LAST, pr.created_at DESC
  LIMIT p_limit;
$$;

-- Create metrics function for admin dashboard
CREATE OR REPLACE FUNCTION metrics_snapshot(p_days int DEFAULT 14)
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  uid uuid := auth.uid();
  is_admin boolean := EXISTS (SELECT 1 FROM user_roles WHERE user_id = uid AND is_admin);
  result json;
BEGIN
  IF NOT is_admin THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  WITH days AS (
    SELECT generate_series((now()::date - (p_days - 1))::date, now()::date, '1 day')::date AS d
  ),
  signups AS (
    SELECT date_trunc('day', created_at)::date d, count(*) c FROM profiles
    WHERE created_at >= (now()::date - (p_days - 1)) GROUP BY 1
  ),
  dau AS (
    SELECT date_trunc('day', ts)::date d, count(distinct user_id) c
    FROM (
      SELECT author_id AS user_id, created_at AS ts FROM posts
      UNION ALL SELECT user_id, created_at FROM post_likes
      UNION ALL SELECT author_id, created_at FROM comments
      UNION ALL SELECT follower_id, created_at FROM follows
    ) x
    WHERE ts >= (now()::date - (p_days - 1))
    GROUP BY 1
  ),
  follows_day AS (
    SELECT date_trunc('day', created_at)::date d, count(*) c FROM follows
    WHERE created_at >= (now()::date - (p_days - 1)) GROUP BY 1
  ),
  posts_per_user AS (
    SELECT width_bucket(cnt, 0, 20, 5) AS bucket, count(*) AS users
    FROM (SELECT author_id, count(*) cnt FROM posts GROUP BY 1) t
    GROUP BY 1 ORDER BY 1
  ),
  open_reports AS (
    SELECT count(*) c FROM reports WHERE status='open'
  )
  SELECT json_build_object(
    'signups', (SELECT json_agg(json_build_object('d', d, 'c', coalesce(s.c,0)) ORDER BY d) FROM (SELECT d FROM days) d LEFT JOIN signups s USING(d)),
    'dau',     (SELECT json_agg(json_build_object('d', d, 'c', coalesce(a.c,0)) ORDER BY d) FROM (SELECT d FROM days) d LEFT JOIN dau a USING(d)),
    'follows', (SELECT json_agg(json_build_object('d', d, 'c', coalesce(f.c,0)) ORDER BY d) FROM (SELECT d FROM days) d LEFT JOIN follows_day f USING(d)),
    'ppu',     (SELECT json_agg(json_build_object('bucket', bucket, 'users', users)) FROM posts_per_user),
    'open_reports', (SELECT c FROM open_reports)
  ) INTO result;

  RETURN result;
END;
$$;