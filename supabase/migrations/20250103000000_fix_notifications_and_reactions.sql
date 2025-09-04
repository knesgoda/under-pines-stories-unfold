-- Fix notifications and reactions tables
-- This migration creates the missing tables and fixes schema issues

-- 1) Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,                 -- e.g. 'mention', 'follow', 'comment', 'post_like', 'post_comment'
  post_id uuid,                       -- optional: link to post
  comment_id uuid,                    -- optional: link to comment
  actor_id uuid,                      -- who triggered the notification
  read_at timestamptz,                -- null = unread
  created_at timestamptz not null default now(),
  meta jsonb default '{}'             -- additional data
);

-- Indexes for fast unread lookups
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Only the owner can see/modify their notifications
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_insert_own"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);

--------------------------------------------------------------------------------

-- 2) Fix post_reactions table (ensure it uses emoji column consistently)
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

-- Policies: users can read all (to see counts), write only their own
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

--------------------------------------------------------------------------------

-- 3) Create counts view for fast UI consumption
create or replace view public.post_reaction_counts as
select
  post_id,
  emoji,
  count(*)::int as count
from public.post_reactions
group by 1,2;

-- Grant access to the view
grant select on public.post_reaction_counts to authenticated;

--------------------------------------------------------------------------------

-- 4) Add foreign key constraints if profiles table exists
do $$
begin
  -- Add FK to profiles if it exists
  if exists (select 1 from information_schema.tables where table_name = 'profiles' and table_schema = 'public') then
    -- Notifications FK
    if not exists (
      select 1 from information_schema.table_constraints 
      where constraint_name = 'notifications_user_fk' 
      and table_name = 'notifications'
    ) then
      alter table public.notifications
        add constraint notifications_user_fk
        foreign key (user_id) references public.profiles(id) on delete cascade;
    end if;

    -- Post reactions FK
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
  end if;
end $$;
