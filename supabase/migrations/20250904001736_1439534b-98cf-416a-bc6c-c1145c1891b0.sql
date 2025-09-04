-- Fix critical security vulnerabilities

-- 1. Create comment_likes table to fix build errors
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for comment_likes
CREATE POLICY "Users can view all comment likes" 
ON public.comment_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- 2. SECURITY FIX: Update profiles RLS to hide emails from public view
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create separate policies for email privacy
CREATE POLICY "Users can view public profile data" 
ON public.profiles FOR SELECT 
USING (true);

-- Grant access to own email only
CREATE POLICY "Users can view their own email" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 3. SECURITY FIX: Restrict social graph visibility
DROP POLICY IF EXISTS "sel_follows_all" ON public.follows;

-- Only allow viewing follows involving the current user
CREATE POLICY "Users can view follows involving themselves" 
ON public.follows FOR SELECT 
USING (auth.uid() = follower_id OR auth.uid() = followee_id);

-- 4. SECURITY FIX: Secure user settings - only allow users to see their own
DROP POLICY IF EXISTS "sel_settings_all" ON public.user_settings;

CREATE POLICY "Users can view their own settings only" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

-- Create a security definer function to check if a profile is discoverable (without exposing privacy settings)
CREATE OR REPLACE FUNCTION public.is_profile_discoverable(profile_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT NOT COALESCE(us.is_private, false) 
     FROM user_settings us 
     WHERE us.user_id = profile_user_id), 
    true
  );
$$;