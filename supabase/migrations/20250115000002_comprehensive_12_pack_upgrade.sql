-- Comprehensive 12-pack upgrade migration
-- This migration adds all required tables, policies, and triggers for the complete platform upgrade

-- ============================================================================
-- 1) NOTIFICATIONS SYSTEM
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

create policy notif_select_own on public.notifications for select using (auth.uid() = user_id);
create policy notif_insert_own on public.notifications for insert with check (auth.uid() = user_id);
create policy notif_update_own on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 2) REACTIONS SANITY CHECK
-- ============================================================================

-- Ensure post_reactions table exists with correct structure
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
-- 3) DMs DATA MODEL
-- ============================================================================

create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dm_members (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null,
  user_id uuid not null,
  state text not null default 'active',
  last_read_at timestamptz
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null,
  author_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Foreign key constraints
alter table public.dm_members add constraint if not exists dm_members_dm_id_fkey foreign key (dm_id) references public.dm_conversations(id) on delete cascade;
alter table public.dm_members add constraint if not exists dm_members_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.dm_messages add constraint if not exists dm_messages_dm_id_fkey foreign key (dm_id) references public.dm_conversations(id) on delete cascade;

-- Indexes
create index if not exists dm_members_dm_idx on public.dm_members(dm_id);
create index if not exists dm_members_user_idx on public.dm_members(user_id);
create index if not exists dm_messages_dm_idx on public.dm_messages(dm_id);

-- Enable RLS
alter table public.dm_conversations enable row level security;
alter table public.dm_members enable row level security;
alter table public.dm_messages enable row level security;

-- RLS policies
create policy if not exists dm_conv_select_member on public.dm_conversations for select using (
  exists(select 1 from public.dm_members m where m.dm_id = id and m.user_id = auth.uid())
);

create policy if not exists dm_members_select_self on public.dm_members for select using (auth.uid() = user_id);
create policy if not exists dm_members_write_self on public.dm_members for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists dm_messages_select_member on public.dm_messages for select using (
  exists(select 1 from public.dm_members m where m.dm_id = dm_id and m.user_id = auth.uid())
);

create policy if not exists dm_messages_insert_author on public.dm_messages for insert with check (
  author_id = auth.uid() and exists(select 1 from public.dm_members m where m.dm_id = dm_id and m.user_id = auth.uid())
);

-- ============================================================================
-- 4) PROFILES UNIQUENESS
-- ============================================================================

create unique index if not exists profiles_username_unique on public.profiles(username);

-- ============================================================================
-- 5) HASHTAGS AND MENTIONS
-- ============================================================================

create table if not exists public.hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique,
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.post_hashtags (
  post_id uuid not null,
  hashtag_id uuid not null,
  primary key(post_id, hashtag_id),
  created_at timestamptz not null default now()
);

create table if not exists public.post_mentions (
  post_id uuid not null,
  mentioned_user_id uuid not null,
  primary key(post_id, mentioned_user_id),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.hashtags enable row level security;
alter table public.post_hashtags enable row level security;
alter table public.post_mentions enable row level security;

-- RLS policies
create policy if not exists hashtags_read_all on public.hashtags for select using (true);
create policy if not exists post_hashtags_read_all on public.post_hashtags for select using (true);
create policy if not exists post_mentions_read_all on public.post_mentions for select using (true);
create policy if not exists post_hashtags_write_auth on public.post_hashtags for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy if not exists post_mentions_write_auth on public.post_mentions for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================================
-- 6) POST VISIBILITY AND PRIVACY
-- ============================================================================

alter table public.posts add column if not exists visibility text not null default 'public' check (visibility in ('public','friends','private'));

-- Enable RLS on posts if not already enabled
alter table public.posts enable row level security;

-- Drop existing policies and create new ones
drop policy if exists posts_select_all on public.posts;
drop policy if exists posts_read_rules on public.posts;

create policy if not exists posts_read_rules on public.posts for select using (
  user_id = auth.uid()
  or visibility = 'public'
  or (
    visibility = 'friends'
    and exists(
      select 1 from public.relationships r
      where r.state = 'accepted'
        and (
          (r.user_id = posts.user_id and r.target_user_id = auth.uid())
          or
          (r.target_user_id = posts.user_id and r.user_id = auth.uid())
        )
    )
  )
);

create policy if not exists posts_insert_self on public.posts for insert with check (user_id = auth.uid());
create policy if not exists posts_update_self on public.posts for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- 7) RELATIONSHIPS FOR FRIENDS
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
-- 8) SAFETY: REPORT, MUTE, BLOCK
-- ============================================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  post_id uuid,
  reported_user_id uuid,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mutes (
  user_id uuid not null,
  muted_user_id uuid not null,
  primary key(user_id, muted_user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  user_id uuid not null,
  blocked_user_id uuid not null,
  primary key(user_id, blocked_user_id),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;
alter table public.mutes enable row level security;
alter table public.blocks enable row level security;

create policy if not exists reports_self on public.reports for all using (reporter_id = auth.uid()) with check (reporter_id = auth.uid());
create policy if not exists mutes_self on public.mutes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists blocks_self on public.blocks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- 9) URL PREVIEW CACHE
-- ============================================================================

create table if not exists public.url_cache (
  url text primary key,
  title text,
  description text,
  image text,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.url_cache enable row level security;

create policy if not exists url_cache_read_all on public.url_cache for select using (true);
create policy if not exists url_cache_write_service on public.url_cache for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ============================================================================
-- 10) TRENDING
-- ============================================================================

create or replace view public.trending_hashtags as
select h.tag,
       count(ph.post_id)::int as recent_uses,
       max(p.created_at) as last_used_at
from public.hashtags h
join public.post_hashtags ph on ph.hashtag_id = h.id
join public.posts p on p.id = ph.post_id
where p.created_at > now() - interval '24 hours'
group by h.tag
order by recent_uses desc, last_used_at desc;

-- ============================================================================
-- 11) PARSER TRIGGER
-- ============================================================================

-- Create or replace the process_post_entities function
create or replace function public.process_post_entities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t text := coalesce(new.body, '');
  raw_tag text;
  canon_tag text;
  h_id uuid;
  raw_name text;
  canon_name text;
  u_id uuid;
begin
  -- If updating text, clear existing links first
  if tg_op = 'UPDATE' then
    delete from public.post_hashtags where post_id = new.id;
    delete from public.post_mentions where post_id = new.id;
  end if;

  -- Hashtags: match #word, strip non-word tails, lower-case
  for raw_tag in select m[1] from regexp_matches(t, '#([[:alnum:]_]{2,64})', 'g') as m
  loop
    canon_tag := lower(regexp_replace(raw_tag, '[^a-zA-Z0-9_]+', '', 'g'));
    if length(canon_tag) >= 2 then
      insert into public.hashtags(tag) values (canon_tag) on conflict (tag) do nothing;
      select id into h_id from public.hashtags where tag = canon_tag;
      insert into public.post_hashtags(post_id, hashtag_id) values (new.id, h_id) on conflict do nothing;
      update public.hashtags set uses_count = uses_count + 1 where id = h_id;
    end if;
  end loop;

  -- Mentions: @username
  for raw_name in select m[1] from regexp_matches(t, '@([[:alnum:]_]{2,32})', 'g') as m
  loop
    canon_name := lower(regexp_replace(raw_name, '[^a-zA-Z0-9_]+', '', 'g'));
    select id into u_id from public.profiles where lower(username) = canon_name limit 1;
    if u_id is not null then
      insert into public.post_mentions(post_id, mentioned_user_id) values (new.id, u_id) on conflict do nothing;
      -- notify mentioned user
      insert into public.notifications(user_id, type, post_id, actor_id, meta)
      values (
        u_id,
        'mention',
        new.id,
        new.user_id,
        jsonb_build_object('by_username', (select username from public.profiles where id = new.user_id))
      ) on conflict do nothing;
    end if;
  end loop;

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists trg_process_post_entities on public.posts;

-- Create the trigger
create trigger trg_process_post_entities
  after insert or update of body on public.posts
  for each row
  execute function public.process_post_entities();

-- ============================================================================
-- 12) ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for better query performance
create index if not exists posts_visibility_created_idx on public.posts(visibility, created_at desc);
create index if not exists posts_user_created_idx on public.posts(user_id, created_at desc);
create index if not exists relationships_state_idx on public.relationships(state);
create index if not exists relationships_target_idx on public.relationships(target_user_id, state);
create index if not exists notifications_type_created_idx on public.notifications(type, created_at desc);
create index if not exists dm_messages_created_idx on public.dm_messages(dm_id, created_at desc);
create index if not exists hashtags_uses_count_idx on public.hashtags(uses_count desc);
create index if not exists post_hashtags_hashtag_created_idx on public.post_hashtags(hashtag_id, created_at desc);
