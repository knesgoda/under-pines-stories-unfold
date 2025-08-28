-- Notifications system

-- enum for types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notif_type') THEN
    CREATE TYPE notif_type AS ENUM (
      'follow','follow_request','follow_accept','post_like','post_comment','comment_reply'
    );
  END IF;
END $$;

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notif_type NOT NULL,
  post_id uuid NULL REFERENCES posts(id) ON DELETE SET NULL,
  comment_id uuid NULL REFERENCES comments(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='notifications' AND policyname='notifs_select_own'
  ) THEN
    CREATE POLICY notifs_select_own ON notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
-- inserts occur via SECURITY DEFINER function

-- helper function with safety checks
CREATE OR REPLACE FUNCTION create_notification(
  p_user uuid,
  p_actor uuid,
  p_type notif_type,
  p_post uuid DEFAULT NULL,
  p_comment uuid DEFAULT NULL,
  p_meta jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- do not notify self
  IF p_user = p_actor THEN
    RETURN;
  END IF;

  -- blocks either direction
  IF EXISTS (
    SELECT 1 FROM blocks b
    WHERE (b.blocker_id = p_user AND b.blocked_id = p_actor)
       OR (b.blocker_id = p_actor AND b.blocked_id = p_user)
  ) THEN
    RETURN;
  END IF;

  -- recipient muted actor
  IF EXISTS (
    SELECT 1 FROM mutes m
    WHERE m.muter_id = p_user AND m.muted_id = p_actor
  ) THEN
    RETURN;
  END IF;

  INSERT INTO notifications(user_id, actor_id, type, post_id, comment_id, meta)
  VALUES (p_user, p_actor, p_type, p_post, p_comment, p_meta);
END;
$$;

GRANT EXECUTE ON FUNCTION create_notification(uuid,uuid,notif_type,uuid,uuid,jsonb) TO anon, authenticated;

-- follow trigger
CREATE OR REPLACE FUNCTION trig_follow_notif() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM create_notification(NEW.followee_id, NEW.follower_id, 'follow', NULL, NULL, '{}'::jsonb);
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_follow_notif ON follows;
CREATE TRIGGER trg_follow_notif
AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION trig_follow_notif();

-- follow request trigger
CREATE OR REPLACE FUNCTION trig_follow_request_notif() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM create_notification(NEW.target_id, NEW.requester_id, 'follow_request', NULL, NULL, '{}'::jsonb);
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_follow_request_notif ON follow_requests;
CREATE TRIGGER trg_follow_request_notif
AFTER INSERT ON follow_requests
FOR EACH ROW EXECUTE FUNCTION trig_follow_request_notif();
