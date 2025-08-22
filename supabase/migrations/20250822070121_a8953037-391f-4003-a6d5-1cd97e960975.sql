-- Final migration to ensure all foreign key relationships exist
-- Add missing foreign key from posts to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_user_id_fkey' 
        AND table_name = 'posts'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.posts 
        ADD CONSTRAINT posts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing foreign key from friendships requester_id to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'friendships_requester_id_fkey' 
        AND table_name = 'friendships'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.friendships 
        ADD CONSTRAINT friendships_requester_id_fkey 
        FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing foreign key from friendships addressee_id to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'friendships_addressee_id_fkey' 
        AND table_name = 'friendships'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.friendships 
        ADD CONSTRAINT friendships_addressee_id_fkey 
        FOREIGN KEY (addressee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing foreign key from group_members user_id to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'group_members_user_id_fkey' 
        AND table_name = 'group_members'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.group_members 
        ADD CONSTRAINT group_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing foreign key from group_members group_id to groups
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'group_members_group_id_fkey' 
        AND table_name = 'group_members'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.group_members 
        ADD CONSTRAINT group_members_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    END IF;
END $$;