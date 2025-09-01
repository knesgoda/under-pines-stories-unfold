-- Create post_reaction_counts view for better performance
CREATE OR REPLACE VIEW post_reaction_counts AS
SELECT 
  post_id,
  json_object_agg(emoji, count) as counts
FROM (
  SELECT 
    post_id,
    emoji,
    count(*) as count
  FROM post_reactions
  GROUP BY post_id, emoji
) grouped
GROUP BY post_id;

-- Create upsert_post_reaction function
CREATE OR REPLACE FUNCTION upsert_post_reaction(p_post_id uuid, p_reaction text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reaction_emoji text;
BEGIN
  -- Map reaction type to emoji
  reaction_emoji := CASE p_reaction
    WHEN 'thumbs_up' THEN '👍'
    WHEN 'laugh' THEN '😂'
    WHEN 'angry' THEN '😡'
    WHEN 'sad' THEN '😢'
    WHEN 'rage' THEN '🤬'
    WHEN 'eyeroll' THEN '🙄'
    ELSE NULL
  END;
  
  IF reaction_emoji IS NULL THEN
    RAISE EXCEPTION 'Invalid reaction type: %', p_reaction;
  END IF;

  -- Remove any existing reaction from this user for this post
  DELETE FROM post_reactions 
  WHERE post_id = p_post_id AND user_id = auth.uid();
  
  -- Insert the new reaction
  INSERT INTO post_reactions (post_id, user_id, emoji)
  VALUES (p_post_id, auth.uid(), reaction_emoji);
END;
$$;

-- Create clear_post_reaction function
CREATE OR REPLACE FUNCTION clear_post_reaction(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM post_reactions 
  WHERE post_id = p_post_id AND user_id = auth.uid();
END;
$$;