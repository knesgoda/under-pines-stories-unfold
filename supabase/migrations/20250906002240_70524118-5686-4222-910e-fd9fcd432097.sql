-- Fix Security Linter Issues

-- 1. Fix Security Definer View issue by removing SECURITY DEFINER property
DROP VIEW IF EXISTS public.v_mutual_follows;

-- Create a regular view without security definer (will use caller's permissions)
CREATE VIEW public.v_mutual_follows AS
SELECT DISTINCT
  f1.follower_id as user_id,
  f1.followee_id as friend_id,
  f1.created_at as friendship_started
FROM follows f1
INNER JOIN follows f2 ON f1.follower_id = f2.followee_id AND f1.followee_id = f2.follower_id
WHERE f1.follower_id < f1.followee_id; -- Avoid duplicates

-- 2. Move pg_trgm extension out of public schema if it exists there
-- First check if extension exists in public schema and move it
DO $$
BEGIN
  -- Move pg_trgm extension from public to extensions schema if it exists
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_trgm' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    -- Move the extension
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END
$$;

-- 3. Configure shorter OTP expiry (this needs to be done via Supabase dashboard)
-- Note: OTP expiry is configured in Supabase Auth settings, not in SQL

-- 4. Enable leaked password protection (this needs to be done via Supabase dashboard)  
-- Note: Leaked password protection is configured in Supabase Auth settings, not in SQL