-- Fix security issues from previous migration
-- Update functions to set proper search_path

CREATE OR REPLACE FUNCTION suggestions_for_user(p_user uuid, p_limit int DEFAULT 20)
RETURNS TABLE (id uuid, username text, display_name text, avatar_url text, followers int) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
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

-- Update metrics function to have proper search_path
CREATE OR REPLACE FUNCTION metrics_snapshot(p_days int DEFAULT 14)
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
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