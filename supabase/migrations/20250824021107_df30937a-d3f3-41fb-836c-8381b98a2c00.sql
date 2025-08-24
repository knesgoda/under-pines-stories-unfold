-- Update profiles table to store email and make username optional
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
ALTER COLUMN username DROP NOT NULL;

-- Update posts table for two-phase media save
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger for updated_at
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create publish_post function for two-phase save
CREATE OR REPLACE FUNCTION public.publish_post(
    p_post_id uuid, 
    p_body text, 
    p_media jsonb DEFAULT '[]'::jsonb
)
RETURNS posts AS $$
DECLARE
    result_post posts;
BEGIN
    UPDATE posts
    SET body = p_body,
        media = COALESCE(p_media, '[]'::jsonb),
        status = 'published',
        updated_at = now()
    WHERE id = p_post_id 
        AND author_id = auth.uid()
        AND status = 'draft';
    
    SELECT * INTO result_post 
    FROM posts 
    WHERE id = p_post_id;
    
    IF result_post IS NULL THEN
        RAISE EXCEPTION 'Post not found or access denied';
    END IF;
    
    RETURN result_post;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create draft post
CREATE OR REPLACE FUNCTION public.create_draft_post()
RETURNS uuid AS $$
DECLARE
    new_post_id uuid;
BEGIN
    INSERT INTO posts (author_id, body, status)
    VALUES (auth.uid(), '', 'draft')
    RETURNING id INTO new_post_id;
    
    RETURN new_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to only show published posts by default
DROP POLICY IF EXISTS "Users can view non-deleted posts" ON posts;
CREATE POLICY "Users can view published posts" 
ON public.posts 
FOR SELECT 
USING (is_deleted = false AND status = 'published');

-- Allow users to see their own draft posts
CREATE POLICY "Users can view their own draft posts" 
ON public.posts 
FOR SELECT 
USING (author_id = auth.uid() AND is_deleted = false);