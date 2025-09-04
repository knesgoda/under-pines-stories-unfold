-- Add comment_count column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS comment_count int DEFAULT 0;

-- Populate comment_count for existing posts
UPDATE public.posts 
SET comment_count = (
    SELECT COUNT(*) 
    FROM public.comments 
    WHERE comments.post_id = posts.id 
    AND comments.is_deleted = false
);

-- Create function to update comment count when comments are added/deleted
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET comment_count = GREATEST(comment_count - 1, 0) 
        WHERE id = OLD.post_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle soft delete/undelete
        IF OLD.is_deleted != NEW.is_deleted THEN
            IF NEW.is_deleted = true THEN
                -- Comment was deleted
                UPDATE public.posts 
                SET comment_count = GREATEST(comment_count - 1, 0) 
                WHERE id = NEW.post_id;
            ELSE
                -- Comment was undeleted
                UPDATE public.posts 
                SET comment_count = comment_count + 1 
                WHERE id = NEW.post_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update comment count
DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON public.comments;
CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_post_comment_count();
