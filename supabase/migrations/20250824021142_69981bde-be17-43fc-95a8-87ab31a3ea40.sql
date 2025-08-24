-- Fix security warnings by setting proper search_path for functions
DROP FUNCTION IF EXISTS public.publish_post(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.create_draft_post();

-- Create publish_post function with proper security
CREATE OR REPLACE FUNCTION public.publish_post(
    p_post_id uuid, 
    p_body text, 
    p_media jsonb DEFAULT '[]'::jsonb
)
RETURNS posts 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create function to create draft post with proper security
CREATE OR REPLACE FUNCTION public.create_draft_post()
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_post_id uuid;
BEGIN
    INSERT INTO posts (author_id, body, status)
    VALUES (auth.uid(), '', 'draft')
    RETURNING id INTO new_post_id;
    
    RETURN new_post_id;
END;
$$;