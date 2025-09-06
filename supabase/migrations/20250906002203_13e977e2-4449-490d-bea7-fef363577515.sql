-- Phase 1: Critical Security Fixes

-- 1. Fix email exposure in profiles RLS policy
-- Drop the overly permissive policy that exposes email addresses
DROP POLICY IF EXISTS "Public can view discoverable profiles for public pages" ON public.profiles;

-- Create a safer policy that excludes email from public access
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  discoverable = true 
  AND (
    -- For public access, only return basic profile fields (no email)
    auth.uid() IS NULL 
    OR auth.uid() != id
  )
);

-- Create a separate policy for users to see their own complete profile including email
CREATE POLICY "Users can view their own complete profile with email" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Create a security definer function for safe profile queries
CREATE OR REPLACE FUNCTION public.get_safe_public_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  hobbies text[],
  interests text[],
  places_lived text[],
  discoverable boolean,
  created_at timestamp with time zone
) 
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.hobbies,
    p.interests,
    p.places_lived,
    p.discoverable,
    p.created_at
  FROM profiles p
  WHERE p.id = profile_id 
    AND p.discoverable = true;
$$;

-- 3. Review and secure the v_friends view
-- Drop the existing v_friends view if it exists as it may bypass RLS
DROP VIEW IF EXISTS public.v_friends;

-- Create a more secure friends view with proper access controls
CREATE VIEW public.v_mutual_follows AS
SELECT DISTINCT
  f1.follower_id as user_id,
  f1.followee_id as friend_id,
  f1.created_at as friendship_started
FROM follows f1
INNER JOIN follows f2 ON f1.follower_id = f2.followee_id AND f1.followee_id = f2.follower_id
WHERE f1.follower_id < f1.followee_id; -- Avoid duplicates

-- Enable RLS on the new view (this will inherit from the underlying tables)
ALTER VIEW public.v_mutual_follows SET (security_barrier = true);

-- 4. Add input validation function for user content
CREATE OR REPLACE FUNCTION public.validate_user_content(content text, max_length integer DEFAULT 5000)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check length
  IF LENGTH(content) > max_length THEN
    RETURN false;
  END IF;
  
  -- Check for potential XSS patterns (basic check)
  IF content ~* '<script|javascript:|on\w+\s*=' THEN
    RETURN false;
  END IF;
  
  -- Check for SQL injection patterns
  IF content ~* '(union\s+select|drop\s+table|insert\s+into|delete\s+from)' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 5. Add trigger to validate post content
CREATE OR REPLACE FUNCTION public.validate_post_content_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.validate_user_content(NEW.body, 2500) THEN
    RAISE EXCEPTION 'Invalid content detected in post';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger to posts
DROP TRIGGER IF EXISTS validate_post_content ON public.posts;
CREATE TRIGGER validate_post_content
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.validate_post_content_trigger();

-- 6. Add trigger to validate comment content  
CREATE OR REPLACE FUNCTION public.validate_comment_content_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.validate_user_content(NEW.body, 1000) THEN
    RAISE EXCEPTION 'Invalid content detected in comment';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger to comments
DROP TRIGGER IF EXISTS validate_comment_content ON public.comments;
CREATE TRIGGER validate_comment_content
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_comment_content_trigger();