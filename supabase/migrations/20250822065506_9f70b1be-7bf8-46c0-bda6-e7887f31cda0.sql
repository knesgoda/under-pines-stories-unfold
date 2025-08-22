-- Add missing foreign key constraints (only if they don't exist)

-- Check and add foreign key from comments to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_user_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE public.comments 
        ADD CONSTRAINT comments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check and add foreign key from comments to posts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_post_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE public.comments 
        ADD CONSTRAINT comments_post_id_fkey 
        FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check and add foreign key from likes to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_user_id_fkey' 
        AND table_name = 'likes'
    ) THEN
        ALTER TABLE public.likes 
        ADD CONSTRAINT likes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check and add foreign key from likes to posts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_post_id_fkey' 
        AND table_name = 'likes'
    ) THEN
        ALTER TABLE public.likes 
        ADD CONSTRAINT likes_post_id_fkey 
        FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check and add foreign key from groups to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_owner_id_fkey' 
        AND table_name = 'groups'
    ) THEN
        ALTER TABLE public.groups 
        ADD CONSTRAINT groups_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;