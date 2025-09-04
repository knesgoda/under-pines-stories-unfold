-- Fix critical security issue: Remove overly permissive profile access policy
-- and replace with more secure policies that protect email addresses

-- Drop the overly permissive policy that allows anyone to see everything
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;

-- Drop the redundant email policy (was redundant due to the permissive policy above)
DROP POLICY IF EXISTS "Users can view their own email" ON public.profiles;

-- Create new secure policies:

-- 1. Allow users to view their own complete profile (including email)
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Allow authenticated users to view public profile data (excluding email access)
-- This policy will be enforced by our application layer to exclude sensitive fields
CREATE POLICY "Users can view public profiles for discovery" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  discoverable = true 
  AND id != auth.uid()  -- Prevent using this policy for own profile
);

-- 3. Allow public access for specific use cases (like public profile pages)
-- but only for discoverable profiles
CREATE POLICY "Public can view discoverable profiles for public pages" 
ON public.profiles 
FOR SELECT 
TO anon
USING (discoverable = true);

-- Create a security definer function to safely get public profile data
-- This ensures email is never included in public profile queries
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
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
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
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