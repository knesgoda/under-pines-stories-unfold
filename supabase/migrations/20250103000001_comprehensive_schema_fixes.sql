-- Comprehensive schema fixes for all PostgREST errors
-- This migration fixes 404, 400, and 406 errors by creating missing tables and relationships

-- ============================================================================
-- 1) NOTIFICATIONS TABLE (fixes 404 errors)
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                -- recipient
  type text not null,                   -- 'mention', 'follow', 'comment', 'post_like', 'post_comment', etc.
  post_id uuid,                         -- optional: link to post
  comment_id uuid,                      -- optional: link to comment
  actor_id uuid,                        -- who triggered it
  meta jsonb not null default '{}',     -- any extra data
  read_at timestamptz,                  -- null = unread
  created_at timestamptz not null default now()
);

-- Speed up unread lookups
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- RLS: user can see and change only their own notifications
create policy "notif_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notif_insert_own"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "notif_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notif_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 2) PROFILES TABLE ENHANCEMENTS (fixes 406 errors)
-- ============================================================================

-- Ensure profiles table exists with all expected columns
create table if not exists public.profiles (
  id uuid primary key,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  hobbies text[],
  interests text[],
  places_lived text[],
  discoverable boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Make username unique to avoid 406 errors when using .single()
create unique index if not exists profiles_username_unique
  on public.profiles (username);

-- Add missing columns if they don't exist
do $$
begin
  -- Add hobbies column if missing
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'hobbies') then
    alter table public.profiles add column hobbies text[];
  end if;
  
  -- Add interests column if missing
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'interests') then
    alter table public.profiles add column interests text[];
  end if;
  
  -- Add places_lived column if missing
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'places_lived') then
    alter table public.profiles add column places_lived text[];
  end if;
  
  -- Add discoverable column if missing
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'discoverable') then
    alter table public.profiles add column discoverable boolean default true;
  end if;
end $$;

-- ============================================================================
-- 3) DM TABLES AND RELATIONSHIPS (fixes 400 errors on DM queries)
-- ============================================================================

-- DM Conversations table
create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  updated_at timestamptz default now()
);

-- DM Members table
create table if not exists public.dm_members (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null,
  user_id uuid not null,
  state text default 'active',
  last_read_at timestamptz
);

-- DM Messages table
create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null,
  sender_id uuid not null,
  content text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Foreign keys required by PostgREST joins
alter table public.dm_members
  add constraint if not exists dm_members_dm_id_fkey
  foreign key (dm_id) references public.dm_conversations(id)
  on delete cascade;

alter table public.dm_members
  add constraint if not exists dm_members_user_id_fkey
  foreign key (user_id) references public.profiles(id)
  on delete cascade;

alter table public.dm_messages
  add constraint if not exists dm_messages_dm_id_fkey
  foreign key (dm_id) references public.dm_conversations(id)
  on delete cascade;

alter table public.dm_messages
  add constraint if not exists dm_messages_sender_fkey
  foreign key (sender_id) references public.profiles(id)
  on delete cascade;

-- Helpful indexes
create index if not exists dm_members_dm_idx on public.dm_members (dm_id);
create index if not exists dm_members_user_idx on public.dm_members (user_id);
create index if not exists dm_messages_dm_idx on public.dm_messages (dm_id);
create index if not exists dm_messages_sender_idx on public.dm_messages (sender_id);

-- RLS for DM tables
alter table public.dm_conversations enable row level security;
alter table public.dm_members enable row level security;
alter table public.dm_messages enable row level security;

-- DM RLS policies
create policy "dm_members_select_by_participant"
  on public.dm_members for select
  using (auth.uid() = user_id);

create policy "dm_members_insert_own"
  on public.dm_members for insert
  with check (auth.uid() = user_id);

create policy "dm_members_update_own"
  on public.dm_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "dm_messages_select_by_participant"
  on public.dm_messages for select
  using (
    exists (
      select 1 from public.dm_members 
      where dm_id = public.dm_messages.dm_id 
      and user_id = auth.uid()
    )
  );

create policy "dm_messages_insert_own"
  on public.dm_messages for insert
  with check (auth.uid() = sender_id);

-- ============================================================================
-- 4) POST_REACTIONS TABLE (fixes reaction queries)
-- ============================================================================

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  user_id uuid not null,
  emoji text not null check (emoji in ('👍','😂','😡','😢','🤬','🙄')),
  created_at timestamptz not null default now()
);

-- One reaction per user per post (upsert-safe)
create unique index if not exists post_reactions_unique_user_post
  on public.post_reactions (post_id, user_id);

-- Helpful query paths
create index if not exists post_reactions_post_idx on public.post_reactions (post_id);
create index if not exists post_reactions_user_idx on public.post_reactions (user_id);

alter table public.post_reactions enable row level security;

-- Reactions RLS policies
create policy "reactions_select_all"
  on public.post_reactions for select
  using (true);

create policy "reactions_insert_own"
  on public.post_reactions for insert
  with check (auth.uid() = user_id);

create policy "reactions_update_own"
  on public.post_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reactions_delete_own"
  on public.post_reactions for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 5) FOREIGN KEY CONSTRAINTS (ensure all relationships work)
-- ============================================================================

-- Add foreign key constraints if they don't exist
do $$
begin
  -- Notifications FK to profiles
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'notifications_user_fk' 
    and table_name = 'notifications'
  ) then
    alter table public.notifications
      add constraint notifications_user_fk
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  -- Post reactions FK to profiles
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'post_reactions_user_fk' 
    and table_name = 'post_reactions'
  ) then
    alter table public.post_reactions
      add constraint post_reactions_user_fk
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  -- Post reactions FK to posts
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'post_reactions_post_fk' 
    and table_name = 'post_reactions'
  ) then
    alter table public.post_reactions
      add constraint post_reactions_post_fk
      foreign key (post_id) references public.posts(id) on delete cascade;
  end if;
end $$;

-- ============================================================================
-- 6) HELPFUL VIEWS FOR PERFORMANCE
-- ============================================================================

-- Post reaction counts view
create or replace view public.post_reaction_counts as
select
  post_id,
  emoji,
  count(*)::int as count
from public.post_reactions
group by 1,2;

-- Grant access to the view
grant select on public.post_reaction_counts to authenticated;

-- ============================================================================
-- 7) ENABLE RLS ON EXISTING TABLES
-- ============================================================================

-- Ensure RLS is enabled on key tables
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- Basic RLS policies for profiles (if they don't exist)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'profiles' 
    and policyname = 'profiles_select_all'
  ) then
    create policy "profiles_select_all"
      on public.profiles for select
      using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'profiles' 
    and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;
