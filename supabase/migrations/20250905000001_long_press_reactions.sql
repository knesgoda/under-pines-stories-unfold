-- 1. Enum for reaction types
create type if not exists reaction_type as enum ('thumbs_up','laugh','angry','sad','rage','eyeroll');

-- 2. Ensure columns exist and use enum
alter table public.post_reactions add column if not exists reaction reaction_type;
update public.post_reactions set reaction = case emoji
  when '👍' then 'thumbs_up'
  when '😂' then 'laugh'
  when '😡' then 'angry'
  when '😢' then 'sad'
  when '🤬' then 'rage'
  when '🙄' then 'eyeroll'
  else 'thumbs_up'
end where reaction is null;
alter table public.post_reactions alter column reaction set not null;
alter table public.post_reactions drop column if exists emoji;

alter table public.post_reactions add column if not exists updated_at timestamptz not null default now();

-- 3. Each user can have at most one reaction per post
create unique index if not exists post_reactions_unique_user_post on public.post_reactions (post_id, user_id);

-- 4. Helpful indexes
create index if not exists post_reactions_post_id_idx on public.post_reactions (post_id);
create index if not exists post_reactions_user_id_idx on public.post_reactions (user_id);
create index if not exists post_reactions_reaction_idx on public.post_reactions (reaction);

-- 5. Trigger to maintain updated_at
create or replace function public.touch_post_reactions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

create trigger if not exists trg_touch_post_reactions_updated_at
before update on public.post_reactions
for each row
execute function public.touch_post_reactions_updated_at();

-- 6. Summary view for fast counts per post
create or replace view public.post_reaction_counts as
select
  pr.post_id,
  count(*)::bigint as total,
  count(*) filter (where reaction = 'thumbs_up')::bigint as thumbs_up,
  count(*) filter (where reaction = 'laugh')::bigint as laugh,
  count(*) filter (where reaction = 'angry')::bigint as angry,
  count(*) filter (where reaction = 'sad')::bigint as sad,
  count(*) filter (where reaction = 'rage')::bigint as rage,
  count(*) filter (where reaction = 'eyeroll')::bigint as eyeroll
from public.post_reactions pr
group by pr.post_id;

-- 7. RPC upsert for a reaction
create or replace function public.upsert_post_reaction(p_post_id uuid, p_reaction reaction_type)
returns table (id uuid, post_id uuid, user_id uuid, reaction reaction_type, created_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
as $$
declare
  v_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.post_reactions (post_id, user_id, reaction)
  values (p_post_id, v_user, p_reaction)
  on conflict (post_id, user_id)
  do update set reaction = excluded.reaction, updated_at = now()
  returning id, post_id, user_id, reaction, created_at, updated_at
  into id, post_id, user_id, reaction, created_at, updated_at;

  return next;
end
$$;

-- 8. RPC to clear my reaction on a post
create or replace function public.clear_post_reaction(p_post_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  delete from public.post_reactions
  where post_id = p_post_id and user_id = v_user;
end
$$;

-- 9. RLS policies
alter table public.post_reactions enable row level security;

drop policy if exists "Users can view all post reactions" on public.post_reactions;
drop policy if exists "Users can create their own reactions" on public.post_reactions;
drop policy if exists "Users can update their own reactions" on public.post_reactions;
drop policy if exists "Users can delete their own reactions" on public.post_reactions;

create policy post_reactions_read_all on public.post_reactions
for select to authenticated using (true);

create policy post_reactions_insert_self on public.post_reactions
for insert to authenticated with check (auth.uid() = user_id);

create policy post_reactions_update_self on public.post_reactions
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy post_reactions_delete_self on public.post_reactions
for delete to authenticated using (auth.uid() = user_id);
