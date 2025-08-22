-- Fix the search path security issue for the like count functions

DROP FUNCTION IF EXISTS increment_like_count();
DROP FUNCTION IF EXISTS decrement_like_count();

CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts 
  SET like_count = like_count + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts 
  SET like_count = GREATEST(like_count - 1, 0) 
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;