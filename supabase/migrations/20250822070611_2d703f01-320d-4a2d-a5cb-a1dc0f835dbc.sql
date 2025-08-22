-- Complete fresh start: Drop existing tables and create new schema per specification

-- Drop existing tables that don't match the spec
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.message_reads CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS public.friendship_status CASCADE;
DROP TYPE IF EXISTS public.group_type CASCADE;
DROP TYPE IF EXISTS public.member_role CASCADE;
DROP TYPE IF EXISTS public.notification_priority CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;

-- Recreate profiles table to match exact spec
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    display_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now()
);

-- Create posts table per spec
DROP TABLE IF EXISTS public.posts CASCADE;
CREATE TABLE public.posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body text NOT NULL,
    created_at timestamptz DEFAULT now(),
    like_count int DEFAULT 0,
    share_count int DEFAULT 0,
    is_deleted boolean DEFAULT false
);

-- Create post_likes table per spec
CREATE TABLE public.post_likes (
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- Create comments table per spec
CREATE TABLE public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body text NOT NULL,
    created_at timestamptz DEFAULT now(),
    is_deleted boolean DEFAULT false
);

-- Create follows table per spec
CREATE TABLE public.follows (
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    followee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id)
);

-- Create beta_testers table per spec
CREATE TABLE public.beta_testers (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text,
    invited_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- RLS Policies per exact specification

-- Profiles: users can select all, update only their row
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update only their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts: insert only if auth.uid() = author_id, select all where is_deleted = false, update/delete only if author_id = auth.uid()
CREATE POLICY "Users can view non-deleted posts" ON public.posts
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create posts as themselves" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = author_id);

-- Post_likes: insert/select/delete only for auth.uid()
CREATE POLICY "Users can view all post likes" ON public.post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON public.post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Comments: insert only if auth.uid() = author_id, select all where is_deleted = false, update/delete only by author
CREATE POLICY "Users can view non-deleted comments" ON public.comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments as themselves" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- Follows: insert/select/delete only where follower_id = auth.uid()
CREATE POLICY "Users can view their own follows" ON public.follows
    FOR SELECT USING (auth.uid() = follower_id);

CREATE POLICY "Users can create their own follows" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Beta_testers: select only if auth.uid() is in beta_testers OR role = admin
CREATE POLICY "Beta testers can view beta list" ON public.beta_testers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.beta_testers WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND username = 'admin')
    );

-- Update the handle_new_user function to match new profiles schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_followee_id ON public.follows(followee_id);