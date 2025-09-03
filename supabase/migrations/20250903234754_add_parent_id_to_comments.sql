-- Add parent_id column to comments table for threaded replies
-- This column was missing from the current schema but is needed by the frontend

-- Add parent_id column if it doesn't exist
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- Add like_count column if it doesn't exist (needed for comment reactions)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS like_count int NOT NULL DEFAULT 0;

-- Add is_deleted column if it doesn't exist (needed for soft deletes)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Create index for efficient parent_id queries
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Create index for efficient post_id + parent_id queries
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON public.comments(post_id, parent_id);

-- Update RLS policies to handle parent_id
DROP POLICY IF EXISTS comments_insert_own ON public.comments;
CREATE POLICY comments_insert_own ON public.comments 
    FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS comments_update_own ON public.comments;
CREATE POLICY comments_update_own ON public.comments 
    FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS comments_delete_own ON public.comments;
CREATE POLICY comments_delete_own ON public.comments 
    FOR DELETE USING (auth.uid() = author_id);

-- Ensure RLS is enabled
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
