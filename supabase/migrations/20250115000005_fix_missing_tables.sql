-- Fix missing tables that are causing 404 errors
-- This migration ensures all required tables exist with proper structure

-- ============================================================================
-- 1) NOTIFICATIONS TABLE
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  post_id uuid,
  comment_id uuid,
  actor_id uuid,
  meta jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx on public.notifications (user_id, read_at);
alter table public.notifications enable row level security;

create policy if not exists notif_select_own on public.notifications for select using (auth.uid() = user_id);
create policy if not exists notif_insert_own on public.notifications for insert with check (auth.uid() = user_id);
create policy if not exists notif_update_own on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 2) POST REACTIONS TABLE
-- ============================================================================

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  user_id uuid not null,
  emoji text not null,
  created_at timestamptz not null default now()
);

-- Create unique index for one reaction per user per post
create unique index if not exists post_reactions_unique_user_post on public.post_reactions (post_id, user_id);

-- Enable RLS
alter table public.post_reactions enable row level security;

-- RLS policies
create policy if not exists reactions_select_all on public.post_reactions for select using (true);
create policy if not exists reactions_insert_own on public.post_reactions for insert with check (auth.uid() = user_id);
create policy if not exists reactions_update_own on public.post_reactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists reactions_delete_own on public.post_reactions for delete using (auth.uid() = user_id);

-- ============================================================================
-- 3) RELATIONSHIPS TABLE (for friend requests)
-- ============================================================================

create table if not exists public.relationships (
  user_id uuid not null,
  target_user_id uuid not null,
  state text not null check (state in ('requested','accepted','blocked')),
  created_at timestamptz not null default now(),
  primary key (user_id, target_user_id)
);

alter table public.relationships enable row level security;

create policy if not exists rel_read_participants on public.relationships for select using (
  auth.uid() in (user_id, target_user_id)
);

create policy if not exists rel_write_requester on public.relationships for insert with check (user_id = auth.uid());

create policy if not exists rel_update_participants on public.relationships for update using (
  auth.uid() in (user_id, target_user_id)
) with check (auth.uid() in (user_id, target_user_id));

-- ============================================================================
-- 4) INDEXES FOR PERFORMANCE
-- ============================================================================

create index if not exists relationships_state_idx on public.relationships(state);
create index if not exists relationships_target_idx on public.relationships(target_user_id, state);
create index if not exists notifications_type_created_idx on public.notifications(type, created_at desc);
create index if not exists post_reactions_post_idx on public.post_reactions(post_id);
create index if not exists post_reactions_user_idx on public.post_reactions(user_id);
