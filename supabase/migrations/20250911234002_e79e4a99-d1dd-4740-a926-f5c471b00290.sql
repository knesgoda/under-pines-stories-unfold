-- Fix user interaction privacy - restrict public access to likes and reactions
-- Only allow users to see their own interactions and aggregated counts

-- Drop overly permissive policies for post_likes
DROP POLICY IF EXISTS "Users can view all post likes" ON post_likes;

-- Create more restrictive policies for post_likes
CREATE POLICY "Users can view their own likes" 
ON post_likes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Drop overly permissive policies for post_reactions  
DROP POLICY IF EXISTS "Users can view all post reactions" ON post_reactions;

-- Create more restrictive policies for post_reactions
CREATE POLICY "Users can view their own reactions" 
ON post_reactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a secure function to get like counts without exposing individual likes
CREATE OR REPLACE FUNCTION public.get_post_like_count(p_post_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM post_likes
  WHERE post_id = p_post_id;
$$;

-- Create a secure function to check if current user liked a post
CREATE OR REPLACE FUNCTION public.user_liked_post(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM post_likes 
    WHERE post_id = p_post_id AND user_id = auth.uid()
  );
$$;

-- Create a secure function to check if current user reacted to a post
CREATE OR REPLACE FUNCTION public.user_post_reaction(p_post_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT emoji
  FROM post_reactions 
  WHERE post_id = p_post_id AND user_id = auth.uid()
  LIMIT 1;
$$;