-- Fix search path for all functions to address security warnings
CREATE OR REPLACE FUNCTION profiles_search_trigger() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
  NEW.search_document :=
    setweight(to_tsvector('simple', coalesce(NEW.username,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.display_name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.bio,'')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.hobbies,'{}'::text[]), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.interests,'{}'::text[]), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.places_lived,'{}'::text[]), ' ')), 'D');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION search_people(
  p_viewer uuid,
  p_q text,
  p_limit int DEFAULT 20
) RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  is_private boolean,
  discoverable boolean,
  relation text,
  rank numeric
) LANGUAGE sql STABLE 
SET search_path = public AS $$
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
  )
  SELECT * FROM base
  WHERE id <> p_viewer
  ORDER BY rank DESC NULLS LAST, id DESC
  LIMIT p_limit;
$$;