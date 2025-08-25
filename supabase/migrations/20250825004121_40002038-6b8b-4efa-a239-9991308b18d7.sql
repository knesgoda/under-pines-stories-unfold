-- Following Feed + Friend Requests Schema

-- user_settings: privacy toggle
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- follows (approved relationships) - note: this table already exists, let's check if we need to modify it
DO $$ 
BEGIN
  -- Check if follows table has the correct structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'follows' 
    AND column_name = 'follower_id'
  ) THEN
    -- Drop existing follows table if it has wrong structure
    DROP TABLE IF EXISTS follows CASCADE;
    
    CREATE TABLE follows (
      follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      followee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      PRIMARY KEY (follower_id, followee_id)
    );
  END IF;
END $$;

-- follow requests (pending approvals for private accounts)
CREATE TABLE IF NOT EXISTS follow_requests (
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (requester_id, target_id)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_followreq_target ON follow_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);

-- friends view (mutual follows)
CREATE OR REPLACE VIEW v_friends AS
SELECT f1.follower_id AS user_id, f1.followee_id AS friend_id
FROM follows f1
JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.followee_id = f1.follower_id;

-- Enable RLS on new tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS sel_settings_all ON user_settings;
DROP POLICY IF EXISTS upsert_own_settings ON user_settings;
DROP POLICY IF EXISTS sel_follows_all ON follows;
DROP POLICY IF EXISTS ins_own_follow ON follows;
DROP POLICY IF EXISTS del_own_follow ON follows;
DROP POLICY IF EXISTS sel_inbox_outbox ON follow_requests;
DROP POLICY IF EXISTS ins_own_req ON follow_requests;
DROP POLICY IF EXISTS del_cancel_or_target_decline ON follow_requests;

-- user_settings policies
CREATE POLICY sel_settings_all ON user_settings FOR SELECT USING (true);
CREATE POLICY upsert_own_settings ON user_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- follows policies: read all; write own
CREATE POLICY sel_follows_all ON follows FOR SELECT USING (true);
CREATE POLICY ins_own_follow ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY del_own_follow ON follows FOR DELETE USING (auth.uid() = follower_id);

-- follow_requests policies: requester can create/cancel; target can read/accept/decline
CREATE POLICY sel_inbox_outbox ON follow_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY ins_own_req ON follow_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY del_cancel_or_target_decline ON follow_requests FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- SQL helpers
-- authors current user should see (self + followed)
CREATE OR REPLACE FUNCTION feed_author_ids(p_user uuid)
RETURNS TABLE(author_id uuid) 
LANGUAGE sql STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT followee_id FROM follows WHERE follower_id = p_user
  UNION
  SELECT p_user
$$;

-- feed function with cursor
CREATE OR REPLACE FUNCTION feed_following(
  p_user uuid,
  p_before timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
) 
RETURNS TABLE (
  id uuid, 
  author_id uuid, 
  body text, 
  media jsonb, 
  created_at timestamptz, 
  like_count int,
  share_count int,
  is_deleted boolean,
  has_media boolean,
  status text
)
LANGUAGE sql STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  WITH authors AS (SELECT author_id FROM feed_author_ids(p_user))
  SELECT p.id, p.author_id, p.body, p.media, p.created_at, p.like_count, p.share_count, p.is_deleted, p.has_media, p.status
  FROM posts p
  JOIN authors a ON a.author_id = p.author_id
  WHERE p.status='published' AND p.is_deleted = false AND p.created_at < p_before
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT p_limit
$$;