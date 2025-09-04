-- Hashtags, mentions, and relationships system
-- This migration adds the complete hashtag/mention system and friend relationships

-- ============================================================================
-- 1) HASHTAGS SYSTEM
-- ============================================================================

-- Hashtags table
create table if not exists public.hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique,              -- canonical lowercase tag without '#'
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists hashtags_tag_idx on public.hashtags (tag);
create index if not exists hashtags_uses_count_idx on public.hashtags (uses_count desc);

alter table public.hashtags enable row level security;
create policy if not exists "hashtags_select_all" on public.hashtags
  for select using (true);
create policy if not exists "hashtags_insert_auth" on public.hashtags
  for insert with check (auth.uid() is not null);
create policy if not exists "hashtags_update_auth" on public.hashtags
  for update using (auth.uid() is not null);

-- Post -> Hashtag join
create table if not exists public.post_hashtags (
  post_id uuid not null,
  hashtag_id uuid not null,
  primary key (post_id, hashtag_id),
  created_at timestamptz not null default now()
);

alter table public.post_hashtags enable row level security;
create policy if not exists "post_hashtags_select_all" on public.post_hashtags
  for select using (true);
create policy if not exists "post_hashtags_write_auth" on public.post_hashtags
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create index if not exists post_hashtags_post_idx on public.post_hashtags (post_id);
create index if not exists post_hashtags_hashtag_idx on public.post_hashtags (hashtag_id);

-- ============================================================================
-- 2) MENTIONS SYSTEM
-- ============================================================================

-- Mentions table
create table if not exists public.post_mentions (
  post_id uuid not null,
  mentioned_user_id uuid not null,
  primary key (post_id, mentioned_user_id),
  created_at timestamptz not null default now()
);

alter table public.post_mentions enable row level security;
create policy if not exists "post_mentions_select_all" on public.post_mentions
  for select using (true);
create policy if not exists "post_mentions_write_auth" on public.post_mentions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create index if not exists post_mentions_post_idx on public.post_mentions (post_id);
create index if not exists post_mentions_user_idx on public.post_mentions (mentioned_user_id);

-- ============================================================================
-- 3) FRIEND RELATIONSHIPS SYSTEM
-- ============================================================================

-- Relationships table for friend requests and connections
create table if not exists public.relationships (
  user_id uuid not null,
  target_user_id uuid not null,
  state text not null check (state in ('requested','accepted','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, target_user_id)
);

alter table public.relationships enable row level security;

-- RLS policies for relationships
create policy "relationships_select_participants"
  on public.relationships for select
  using (auth.uid() = user_id or auth.uid() = target_user_id);

create policy "relationships_insert_own"
  on public.relationships for insert
  with check (auth.uid() = user_id);

create policy "relationships_update_participants"
  on public.relationships for update
  using (auth.uid() = user_id or auth.uid() = target_user_id)
  with check (auth.uid() = user_id or auth.uid() = target_user_id);

create policy "relationships_delete_own"
  on public.relationships for delete
  using (auth.uid() = user_id);

-- Indexes for relationships
create index if not exists relationships_user_idx on public.relationships (user_id);
create index if not exists relationships_target_idx on public.relationships (target_user_id);
create index if not exists relationships_state_idx on public.relationships (state);

-- ============================================================================
-- 4) FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints
do $$
begin
  -- Post hashtags FKs
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'post_hashtags_post_fk' 
    and table_name = 'post_hashtags'
  ) then
    alter table public.post_hashtags
      add constraint post_hashtags_post_fk
      foreign key (post_id) references public.posts(id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'post_hashtags_hashtag_fk' 
    and table_name = 'post_hashtags'
  ) then
    alter table public.post_hashtags
      add constraint post_hashtags_hashtag_fk
      foreign key (hashtag_id) references public.hashtags(id) on delete cascade;
  end if;

  -- Post mentions FKs
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'post_mentions_post_fk' 
    and table_name = 'post_mentions'
  ) then
    alter table public.post_mentions
      add constraint post_mentions_post_fk
      foreign key (post_id) references public.posts(id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'post_mentions_user_fk' 
    and table_name = 'post_mentions'
  ) then
    alter table public.post_mentions
      add constraint post_mentions_user_fk
      foreign key (mentioned_user_id) references public.profiles(id) on delete cascade;
  end if;

  -- Relationships FKs
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'relationships_user_fk' 
    and table_name = 'relationships'
  ) then
    alter table public.relationships
      add constraint relationships_user_fk
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'relationships_target_fk' 
    and table_name = 'relationships'
  ) then
    alter table public.relationships
      add constraint relationships_target_fk
      foreign key (target_user_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

-- ============================================================================
-- 5) POST ENTITY PROCESSING TRIGGER
-- ============================================================================

-- Function to process hashtags and mentions in post content
create or replace function public.process_post_entities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t text := coalesce(new.content, '');
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
  for raw_tag in
    select m[1] from regexp_matches(t, '#([[:alnum:]_]{2,64})', 'g') as m
  loop
    canon_tag := lower(regexp_replace(raw_tag, '[^a-zA-Z0-9_]+', '', 'g'));
    if length(canon_tag) >= 2 then
      insert into public.hashtags(tag)
      values (canon_tag)
      on conflict (tag) do nothing;

      select id into h_id from public.hashtags where tag = canon_tag;
      insert into public.post_hashtags(post_id, hashtag_id)
      values (new.id, h_id)
      on conflict do nothing;

      update public.hashtags set uses_count = uses_count + 1 where id = h_id;
    end if;
  end loop;

  -- Mentions: @username
  for raw_name in
    select m[1] from regexp_matches(t, '@([[:alnum:]_]{2,32})', 'g') as m
  loop
    canon_name := lower(regexp_replace(raw_name, '[^a-zA-Z0-9_]+', '', 'g'));
    select id into u_id from public.profiles where lower(username) = canon_name limit 1;
    if u_id is not null then
      insert into public.post_mentions(post_id, mentioned_user_id)
      values (new.id, u_id)
      on conflict do nothing;

      -- notify mentioned user (only if not self-mention)
      if u_id != new.user_id then
        insert into public.notifications(user_id, type, post_id, actor_id, meta)
        values (
          u_id,
          'mention',
          new.id,
          new.user_id,
          jsonb_build_object('by_username', (select username from public.profiles where id = new.user_id))
        )
        on conflict do nothing;
      end if;
    end if;
  end loop;

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists trg_process_post_entities on public.posts;

-- Create trigger on posts table
create trigger trg_process_post_entities
after insert or update of content
on public.posts
for each row execute function public.process_post_entities();

-- ============================================================================
-- 6) FULL TEXT SEARCH SETUP
-- ============================================================================

-- Add FTS index on posts content if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_indexes 
    where indexname = 'posts_content_fts_idx'
  ) then
    create index posts_content_fts_idx on public.posts 
    using gin(to_tsvector('english', content));
  end if;
end $$;

-- ============================================================================
-- 7) HELPFUL VIEWS
-- ============================================================================

-- View for hashtag usage stats
create or replace view public.hashtag_stats as
select 
  h.id,
  h.tag,
  h.uses_count,
  h.created_at,
  count(ph.post_id) as recent_posts_count
from public.hashtags h
left join public.post_hashtags ph on h.id = ph.hashtag_id
left join public.posts p on ph.post_id = p.id and p.created_at > now() - interval '7 days'
group by h.id, h.tag, h.uses_count, h.created_at
order by h.uses_count desc;

grant select on public.hashtag_stats to authenticated;

-- View for user relationship status
create or replace view public.user_relationships as
select 
  r.user_id,
  r.target_user_id,
  r.state,
  r.created_at,
  r.updated_at,
  p1.username as user_username,
  p2.username as target_username
from public.relationships r
left join public.profiles p1 on r.user_id = p1.id
left join public.profiles p2 on r.target_user_id = p2.id;

grant select on public.user_relationships to authenticated;
