-- Add missing foreign key constraints to fix table relationships

-- Add foreign key from posts to profiles
ALTER TABLE public.posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign keys from friendships to profiles
ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_addressee_id_fkey 
FOREIGN KEY (addressee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from comments to profiles
ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from comments to posts
ALTER TABLE public.comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Add foreign key from likes to profiles
ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from likes to posts
ALTER TABLE public.likes 
ADD CONSTRAINT likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Add foreign keys from groups to profiles
ALTER TABLE public.groups 
ADD CONSTRAINT groups_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign keys from group_members
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Add foreign keys from notifications to profiles
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_related_user_id_fkey 
FOREIGN KEY (related_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign keys from messages and conversations
ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE public.conversation_participants 
ADD CONSTRAINT conversation_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversation_participants 
ADD CONSTRAINT conversation_participants_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE public.message_reads 
ADD CONSTRAINT message_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.message_reads 
ADD CONSTRAINT message_reads_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;