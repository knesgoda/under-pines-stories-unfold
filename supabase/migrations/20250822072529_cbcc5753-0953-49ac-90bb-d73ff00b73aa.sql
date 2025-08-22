-- Fix the search path security issue for the like count functions
-- First drop the triggers, then the functions, then recreate with proper security

DROP TRIGGER IF EXISTS trigger_increment_like_count ON post_likes;
DROP TRIGGER IF EXISTS trigger_decrement_like_count ON post_likes;
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

-- Recreate the triggers
CREATE TRIGGER trigger_increment_like_count
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_like_count();

CREATE TRIGGER trigger_decrement_like_count
  AFTER DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_like_count();