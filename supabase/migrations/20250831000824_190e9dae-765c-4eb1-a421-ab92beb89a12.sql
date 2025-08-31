-- Create post reactions table to replace the simple likes system
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id) -- One reaction per user per post
);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all post reactions"
ON public.post_reactions
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reactions"
ON public.post_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.post_reactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.post_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON public.post_reactions(user_id);

-- Create function to get reaction summary for a post
CREATE OR REPLACE FUNCTION public.get_post_reaction_summary(p_post_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
SET search_path = 'public'
AS $$
DECLARE
  summary JSON;
BEGIN
  SELECT json_agg(json_build_object('emoji', emoji, 'count', count))
  INTO summary
  FROM (
    SELECT emoji, COUNT(*) as count
    FROM post_reactions
    WHERE post_id = p_post_id
    GROUP BY emoji
    ORDER BY count DESC
  ) r;
  
  RETURN COALESCE(summary, '[]'::json);
END;
$$;