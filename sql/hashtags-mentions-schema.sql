-- Enable if not already
create extension if not exists pgcrypto;

-- Profiles assumed to exist: public.profiles(id uuid primary key, username text, ...)

-- 1) Hashtags
create table if not exists public.hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique,              -- canonical lowercase tag without '#'
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists hashtags_tag_idx on public.hashtags (tag);

alter table public.hashtags enable row level security;
create policy if not exists "hashtags_select_all" on public.hashtags
  for select using (true);
create policy if not exists "hashtags_insert_auth" on public.hashtags
  for insert with check (auth.uid() is not null);
create policy if not exists "hashtags_update_auth" on public.hashtags
  for update using (auth.uid() is not null);

-- 2) Post -> Hashtag join
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

-- 3) Mentions
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

-- 4) Notifications table (if you do not have it yet)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,             -- recipient
  type text not null,                -- 'mention' etc.
  post_id uuid,
  comment_id uuid,
  actor_id uuid,                     -- who triggered it
  meta jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at);
alter table public.notifications enable row level security;
create policy if not exists "notif_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy if not exists "notif_insert_own" on public.notifications for insert with check (auth.uid() = user_id);
create policy if not exists "notif_update_own" on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) Parser-trigger for posts.content
-- Replace public.posts and column names if needed.
-- Assumes posts(id uuid pk, user_id uuid, content text)

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

      -- notify mentioned user
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
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_process_post_entities on public.posts;

create trigger trg_process_post_entities
after insert or update of content
on public.posts
for each row execute function public.process_post_entities();
