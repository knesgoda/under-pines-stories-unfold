-- Fix post reactions system with proper triggers and views

-- Create or update the post_reaction_counts table (it was a view before)
DROP VIEW IF EXISTS post_reaction_counts;
CREATE TABLE IF NOT EXISTS post_reaction_counts (
    post_id uuid PRIMARY KEY,
    counts jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- Create function to update reaction counts
CREATE OR REPLACE FUNCTION update_post_reaction_counts(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO post_reaction_counts (post_id, counts)
    SELECT 
        p_post_id,
        COALESCE(
            jsonb_object_agg(emoji, count ORDER BY emoji),
            '{}'::jsonb
        ) as counts
    FROM (
        SELECT emoji, COUNT(*)::integer as count
        FROM post_reactions
        WHERE post_id = p_post_id
        GROUP BY emoji
    ) reaction_counts
    ON CONFLICT (post_id) 
    DO UPDATE SET 
        counts = EXCLUDED.counts,
        updated_at = now();
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_post_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_post_reaction_counts(OLD.post_id);
        RETURN OLD;
    ELSE
        PERFORM update_post_reaction_counts(NEW.post_id);
        RETURN NEW;
    END IF;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS post_reactions_update_counts ON post_reactions;
CREATE TRIGGER post_reactions_update_counts
    AFTER INSERT OR UPDATE OR DELETE ON post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_post_reaction_counts();

-- Enable RLS on post_reaction_counts
ALTER TABLE post_reaction_counts ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read reaction counts
DROP POLICY IF EXISTS "Everyone can read reaction counts" ON post_reaction_counts;
CREATE POLICY "Everyone can read reaction counts" 
ON post_reaction_counts 
FOR SELECT 
USING (true);

-- Initialize counts for existing posts (fix the column reference)
INSERT INTO post_reaction_counts (post_id, counts)
SELECT DISTINCT id, '{}'::jsonb
FROM posts
WHERE id NOT IN (SELECT post_id FROM post_reaction_counts WHERE post_id IS NOT NULL)
ON CONFLICT (post_id) DO NOTHING;

-- Update counts for posts that have reactions
SELECT update_post_reaction_counts(post_id) 
FROM (SELECT DISTINCT post_id FROM post_reactions) AS posts_with_reactions;