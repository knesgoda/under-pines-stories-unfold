-- Create tables for Floating Embers feature
-- Embers represent ephemeral content that lasts 24 hours

CREATE TABLE public.embers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid NOT NULL,
  content_ref text NOT NULL,
  content_type text NOT NULL DEFAULT 'post',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  status text NOT NULL DEFAULT 'active',
  visibility text NOT NULL DEFAULT 'public',
  meta jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.ember_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ember_id uuid NOT NULL REFERENCES embers(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ember_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.embers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ember_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for embers
CREATE POLICY "Users can view active public embers"
ON public.embers
FOR SELECT
USING (
  status = 'active' 
  AND now() < expires_at 
  AND (
    visibility = 'public' 
    OR (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() AND followee_id = author_id
    ))
    OR author_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own embers"
ON public.embers
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own embers"
ON public.embers
FOR UPDATE
USING (auth.uid() = author_id);

-- RLS policies for ember_views
CREATE POLICY "Users can view their own ember views"
ON public.ember_views
FOR SELECT
USING (auth.uid() = viewer_id);

CREATE POLICY "Users can create their own ember views"
ON public.ember_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Indexes for performance
CREATE INDEX idx_embers_status_expires ON public.embers(status, expires_at);
CREATE INDEX idx_embers_author_created ON public.embers(author_id, created_at DESC);
CREATE INDEX idx_ember_views_ember_viewer ON public.ember_views(ember_id, viewer_id);

-- Function to create ember from post
CREATE OR REPLACE FUNCTION public.create_ember_from_post(p_post_id uuid, p_visibility text DEFAULT 'public')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  post_record posts;
  ember_id uuid;
BEGIN
  -- Get the post
  SELECT * INTO post_record
  FROM posts
  WHERE id = p_post_id AND author_id = auth.uid() AND status = 'published';
  
  IF post_record IS NULL THEN
    RAISE EXCEPTION 'Post not found or access denied';
  END IF;
  
  -- Create the ember
  INSERT INTO embers (author_id, content_ref, content_type, visibility)
  VALUES (post_record.author_id, p_post_id::text, 'post', p_visibility)
  RETURNING id INTO ember_id;
  
  RETURN ember_id;
END;
$$;

-- Function to mark ember as viewed
CREATE OR REPLACE FUNCTION public.mark_ember_viewed(p_ember_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert view record (will be ignored if already exists due to UNIQUE constraint)
  INSERT INTO ember_views (ember_id, viewer_id)
  VALUES (p_ember_id, auth.uid())
  ON CONFLICT (ember_id, viewer_id) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Function to get user's active embers with view status
CREATE OR REPLACE FUNCTION public.get_user_embers(p_limit integer DEFAULT 20)
RETURNS TABLE(
  id uuid,
  author_id uuid,
  content_ref text,
  content_type text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  visibility text,
  meta jsonb,
  is_viewed boolean,
  author_username text,
  author_display_name text,
  author_avatar_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    e.id,
    e.author_id,
    e.content_ref,
    e.content_type,
    e.created_at,
    e.expires_at,
    e.visibility,
    e.meta,
    (ev.id IS NOT NULL) as is_viewed,
    p.username as author_username,
    p.display_name as author_display_name,
    p.avatar_url as author_avatar_url
  FROM embers e
  JOIN profiles p ON p.id = e.author_id
  LEFT JOIN ember_views ev ON ev.ember_id = e.id AND ev.viewer_id = auth.uid()
  WHERE e.status = 'active' 
    AND now() < e.expires_at
    AND (
      e.visibility = 'public' 
      OR (e.visibility = 'followers' AND EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() AND followee_id = e.author_id
      ))
      OR e.author_id = auth.uid()
    )
  ORDER BY e.created_at DESC
  LIMIT p_limit;
$$;

-- Trigger to create ember when post is published
CREATE OR REPLACE FUNCTION public.trigger_create_ember_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only create ember for newly published posts
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    -- Create ember with same visibility as post (simplified logic)
    INSERT INTO embers (author_id, content_ref, content_type, visibility)
    VALUES (NEW.author_id, NEW.id::text, 'post', 'public');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS create_ember_on_post ON posts;
CREATE TRIGGER create_ember_on_post
  AFTER INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_ember_on_post();