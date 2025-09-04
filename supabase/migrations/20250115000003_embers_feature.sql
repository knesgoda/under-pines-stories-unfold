-- Embers Feature Migration
-- Short-form posts that fade over time with emoji reactions

-- 0) prerequisites
create extension if not exists pgcrypto;

-- 1) Embers
create table if not exists public.embers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null check (length(content) <= 280),
  image_url text,                 -- optional tiny image
  visibility text not null default 'public' check (visibility in ('public','friends','private')),
  ttl_hours int not null default 48,
  created_at timestamptz not null default now(),
  expires_at timestamptz generated always as (created_at + make_interval(hours => ttl_hours)) stored
);

create index if not exists embers_user_created_idx on public.embers(user_id, created_at desc);
create index if not exists embers_expires_idx on public.embers(expires_at);

alter table public.embers enable row level security;

-- RLS: show own, public, and friends (if relationships table exists)
create policy if not exists embers_read_rules on public.embers
for select using (
  auth.uid() = user_id
  or visibility = 'public'
  or (
    visibility = 'friends'
    and exists (
      select 1 from public.relationships r
      where r.state = 'accepted'
        and (
          (r.user_id = public.embers.user_id and r.target_user_id = auth.uid())
          or
          (r.target_user_id = public.embers.user_id and r.user_id = auth.uid())
        )
    )
  )
);

create policy if not exists embers_insert_self on public.embers
for insert with check (auth.uid() = user_id);

create policy if not exists embers_update_self on public.embers
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists embers_delete_self on public.embers
for delete using (auth.uid() = user_id);

-- 2) Ember reactions
create table if not exists public.ember_reactions (
  id uuid primary key default gen_random_uuid(),
  ember_id uuid not null references public.embers(id) on delete cascade,
  user_id uuid not null,
  emoji text not null check (emoji in ('👍','😂','😡','😢','🤬','🙄')),
  created_at timestamptz not null default now()
);
create unique index if not exists ember_reactions_unique on public.ember_reactions(ember_id, user_id);
create index if not exists ember_reactions_ember_idx on public.ember_reactions(ember_id);

alter table public.ember_reactions enable row level security;
create policy if not exists ember_reactions_select_all on public.ember_reactions for select using (true);
create policy if not exists ember_reactions_insert_self on public.ember_reactions for insert with check (auth.uid() = user_id);
create policy if not exists ember_reactions_update_self on public.ember_reactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists ember_reactions_delete_self on public.ember_reactions for delete using (auth.uid() = user_id);

-- 3) (Optional) counts view
create or replace view public.ember_reaction_counts as
select ember_id, emoji, count(*)::int as count
from public.ember_reactions
group by 1,2;

-- 4) Mentions + hashtags for embers
create table if not exists public.ember_mentions (
  ember_id uuid not null references public.embers(id) on delete cascade,
  mentioned_user_id uuid not null,
  primary key (ember_id, mentioned_user_id),
  created_at timestamptz not null default now()
);
alter table public.ember_mentions enable row level security;
create policy if not exists ember_mentions_read_all on public.ember_mentions for select using (true);
create policy if not exists ember_mentions_write_auth on public.ember_mentions for all using (auth.uid() is not null) with check (auth.uid() is not null);

create table if not exists public.ember_hashtags (
  ember_id uuid not null references public.embers(id) on delete cascade,
  hashtag_id uuid not null references public.hashtags(id) on delete cascade,
  primary key (ember_id, hashtag_id),
  created_at timestamptz not null default now()
);
alter table public.ember_hashtags enable row level security;
create policy if not exists ember_hashtags_read_all on public.ember_hashtags for select using (true);
create policy if not exists ember_hashtags_write_auth on public.ember_hashtags for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- 5) Trigger: parse @mentions and #tags for embers + notifications
-- assumes public.notifications, public.hashtags from earlier work
create or replace function public.process_ember_entities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t text := coalesce(new.content, '');
  raw_tag text; canon_tag text; h_id uuid;
  raw_name text; canon_name text; u_id uuid;
begin
  if tg_op = 'UPDATE' then
    delete from public.ember_mentions where ember_id = new.id;
    delete from public.ember_hashtags where ember_id = new.id;
  end if;

  -- hashtags
  for raw_tag in select m[1] from regexp_matches(t, '#([[:alnum:]_]{2,64})', 'g') as m loop
    canon_tag := lower(regexp_replace(raw_tag, '[^a-zA-Z0-9_]+', '', 'g'));
    if length(canon_tag) >= 2 then
      insert into public.hashtags(tag) values (canon_tag)
      on conflict (tag) do nothing;
      select id into h_id from public.hashtags where tag = canon_tag;
      insert into public.ember_hashtags(ember_id, hashtag_id) values (new.id, h_id)
      on conflict do nothing;
      update public.hashtags set uses_count = uses_count + 1 where id = h_id;
    end if;
  end loop;

  -- mentions
  for raw_name in select m[1] from regexp_matches(t, '@([[:alnum:]_]{2,32})', 'g') as m loop
    canon_name := lower(regexp_replace(raw_name, '[^a-zA-Z0-9_]+', '', 'g'));
    select id into u_id from public.profiles where lower(username) = canon_name limit 1;
    if u_id is not null then
      insert into public.ember_mentions(ember_id, mentioned_user_id) values (new.id, u_id)
      on conflict do nothing;
      insert into public.notifications(user_id, type, actor_id, post_id, meta)
      values (u_id, 'ember_mention', new.user_id, null, jsonb_build_object('ember_id', new.id))
      on conflict do nothing;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_process_ember_entities on public.embers;
create trigger trg_process_ember_entities
after insert or update of content on public.embers
for each row execute function public.process_ember_entities();
