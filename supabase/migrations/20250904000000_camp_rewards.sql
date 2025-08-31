-- Camp Rewards system (gamification)

-- ITEMS (canonical)
create table if not exists game_items (
  slug text primary key,
  name text not null,
  emoji text not null default '',
  rarity text not null default 'common',
  kind text not null default 'ingredient', -- ingredient|crafted|badge
  created_at timestamptz default now()
);

-- INVENTORY
create table if not exists inventories (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_slug text not null references game_items(slug),
  qty int not null default 0 check (qty >= 0),
  updated_at timestamptz default now(),
  primary key (user_id, item_slug)
);

-- EARNING RULES (configurable)
create table if not exists earn_rules (
  action text primary key,           -- 'post' | 'react' | 'share'
  item_slug text not null references game_items(slug),
  qty int not null check (qty > 0),
  per_day_limit int not null default 0,   -- 0 = unlimited/day
  per_target_once boolean not null default true
);

-- CLAIMS (idempotency + daily limits)
create table if not exists game_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_type text,                   -- 'post'|'ember'|'none'
  target_id uuid,
  day date not null default (now()::date),
  created_at timestamptz default now(),
  unique (user_id, action, target_type, target_id)
);
create index if not exists idx_game_claims_user_action_day on game_claims(user_id, action, day);

-- DAILY KIT
create table if not exists daily_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  created_at timestamptz default now(),
  primary key (user_id, day)
);

-- GIFTS (ledger)
create table if not exists game_gifts (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  item_slug text not null references game_items(slug),
  qty int not null check (qty > 0),
  status text not null default 'sent',
  created_at timestamptz default now()
);

-- RECIPES
create table if not exists game_recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  output_slug text not null references game_items(slug),
  output_qty int not null default 1
);
create table if not exists game_recipe_ingredients (
  recipe_id uuid references game_recipes(id) on delete cascade,
  item_slug text references game_items(slug),
  qty int not null,
  primary key (recipe_id, item_slug)
);

-- RLS
alter table inventories enable row level security;
alter table earn_rules enable row level security;
alter table game_items enable row level security;
alter table game_claims enable row level security;
alter table daily_claims enable row level security;
alter table game_gifts enable row level security;
alter table game_recipes enable row level security;
alter table game_recipe_ingredients enable row level security;

do $$ begin
  -- read-only public config
  create policy if not exists items_read on game_items for select using (true);
  create policy if not exists rules_read on earn_rules for select using (true);
  create policy if not exists recipes_read on game_recipes for select using (true);
  create policy if not exists recipes_ing_read on game_recipe_ingredients for select using (true);

  -- per-user data
  create policy if not exists inv_self on inventories for select using (auth.uid() = user_id);
  create policy if not exists inv_self_upd on inventories for update using (auth.uid() = user_id);

  create policy if not exists claims_self on game_claims for select using (auth.uid() = user_id);
  create policy if not exists daily_self on daily_claims for select using (auth.uid() = user_id);

  create policy if not exists gifts_self on game_gifts for select using (from_user=auth.uid() or to_user=auth.uid());
end $$;

-- SEED items & rules (safe upserts)
insert into game_items(slug,name,emoji,rarity,kind) values
  ('bun','Hot Dog Bun','🥖','common','ingredient'),
  ('dog','Hot Dog','🌭','common','ingredient'),
  ('marshmallow','Marshmallow','🟨','common','ingredient'),
  ('chocolate','Chocolate','🍫','uncommon','ingredient'),
  ('graham','Graham Cracker','🍪','common','ingredient'),
  ('stick','Roasting Stick','🪵','common','ingredient'),
  ('smore','S’more','🍫🔥','rare','crafted'),
  ('camp_dog','Camp Hot Dog','🌭🔥','rare','crafted')
on conflict (slug) do nothing;

insert into earn_rules(action,item_slug,qty,per_day_limit,per_target_once) values
  ('post','chocolate',1,5,true),
  ('react','marshmallow',1,20,true),
  ('share','bun',2,10,true)
on conflict (action) do update set item_slug=excluded.item_slug, qty=excluded.qty, per_day_limit=excluded.per_day_limit, per_target_once=excluded.per_target_once;

-- RECIPES
do $$ declare rid uuid; begin
  -- S'more = 2 graham + 1 marshmallow + 1 chocolate
  insert into game_recipes(slug,name,output_slug,output_qty) values('smore','Craft S’more','smore',1)
  on conflict (slug) do nothing;
  select id into rid from game_recipes where slug='smore';
  insert into game_recipe_ingredients(recipe_id,item_slug,qty) values
    (rid,'graham',2),(rid,'marshmallow',1),(rid,'chocolate',1)
  on conflict (recipe_id,item_slug) do nothing;

  -- Camp Hot Dog = 1 bun + 1 dog + 1 stick
  insert into game_recipes(slug,name,output_slug,output_qty) values('camp_dog','Craft Camp Hot Dog','camp_dog',1)
  on conflict (slug) do nothing;
  select id into rid from game_recipes where slug='camp_dog';
  insert into game_recipe_ingredients(recipe_id,item_slug,qty) values
    (rid,'bun',1),(rid,'dog',1),(rid,'stick',1)
  on conflict (recipe_id,item_slug) do nothing;
end $$;

-- HELPERS (security definer)
create or replace function _inv_add(p_user uuid, p_item text, p_qty int)
returns int
language sql
security definer
set search_path = public
as $$
  insert into inventories(user_id, item_slug, qty)
  values (p_user, p_item, greatest(p_qty,0))
  on conflict (user_id, item_slug)
  do update set qty = inventories.qty + excluded.qty, updated_at = now()
  returning qty;
$$;

-- Award from rules with limits & idempotency
create or replace function game_award_action(
  p_user uuid, p_action text, p_target_type text, p_target uuid
) returns table(item_slug text, qty int)
language plpgsql
security definer
set search_path = public
as $$
declare r earn_rules%rowtype; today date := now()::date; current int;
begin
  select * into r from earn_rules where action = p_action;
  if not found then return; end if;

  -- per-target idempotency
  if r.per_target_once and p_target is not null then
    if exists(select 1 from game_claims where user_id=p_user and action=p_action and target_type=p_target_type and target_id=p_target) then
      return;
    end if;
  end if;

  -- daily limit
  if r.per_day_limit > 0 then
    select count(*) into current from game_claims
      where user_id=p_user and action=p_action and day=today;
    if current >= r.per_day_limit then
      return;
    end if;
  end if;

  -- record claim
  insert into game_claims(user_id, action, target_type, target_id, day)
  values (p_user, p_action, p_target_type, p_target, today)
  on conflict do nothing;

  -- add inventory
  perform _inv_add(p_user, r.item_slug, r.qty);

  return query select r.item_slug::text, r.qty::int;
end $$;

-- Daily camp kit: 3 random picks from a biased pool
create or replace function game_claim_daily(p_user uuid)
returns table(item_slug text, qty int)
language plpgsql
security definer
set search_path = public
as $$
declare today date := now()::date;
begin
  if exists(select 1 from daily_claims where user_id=p_user and day=today) then
    return; -- already claimed
  end if;

  insert into daily_claims(user_id, day) values(p_user, today);

  -- biased pool (more graham/bun/stick, some chocolate)
  return query
  with pool as (
    select unnest(array['graham','graham','graham','bun','bun','stick','marshmallow','marshmallow','chocolate']) as slug
  ),
  picks as (
    select slug from pool order by random() limit 3
  )
  select slug, 1 from picks;

  -- also apply to inventory
  perform (
    with pool as (select unnest(array['graham','graham','graham','bun','bun','stick','marshmallow','marshmallow','chocolate']) slug),
         picks as (select slug from pool order by random() limit 3)
    select sum(_inv_add(p_user, slug, 1)) from picks
  );
end $$;

-- Gift: move items atomically
create or replace function game_gift(p_from uuid, p_to uuid, p_item text, p_qty int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare have int;
begin
  if p_qty <= 0 or p_from = p_to then return false; end if;

  select qty into have from inventories where user_id=p_from and item_slug=p_item for update;
  if have is null or have < p_qty then return false; end if;

  update inventories set qty = qty - p_qty, updated_at=now()
    where user_id=p_from and item_slug=p_item;

  perform _inv_add(p_to, p_item, p_qty);

  insert into game_gifts(from_user,to_user,item_slug,qty) values(p_from,p_to,p_item,p_qty);
  return true;
end $$;

-- Craft: consume ingredients per recipe, produce output
create or replace function game_craft(p_user uuid, p_recipe_slug text, p_times int default 1)
returns table(output_slug text, crafted int)
language plpgsql
security definer
set search_path = public
as $$
declare rid uuid; out_slug text; out_qty int; needed record; i int := 0;
begin
  if p_times <= 0 then return; end if;
  select id, output_slug, output_qty into rid, out_slug, out_qty from game_recipes where slug=p_recipe_slug;
  if rid is null then return; end if;

  -- compute max craftable by inventory
  with req as (select item_slug, qty*p_times as need from game_recipe_ingredients where recipe_id=rid),
       have as (select item_slug, qty from inventories where user_id=p_user),
       can as (
         select r.item_slug, coalesce(h.qty,0) as have, r.need
         from req r left join have h on h.item_slug = r.item_slug
       )
  select min(case when have>0 then floor(have::numeric/need::numeric) else 0 end)::int into i
  from can where need>0;
  if i is null or i < 1 then return; end if;

  -- consume ingredients
  for needed in select item_slug, qty*i as take from game_recipe_ingredients where recipe_id=rid loop
    update inventories set qty = qty - needed.take, updated_at=now()
      where user_id=p_user and item_slug=needed.item_slug and qty >= needed.take;
  end loop;

  -- add outputs
  perform _inv_add(p_user, out_slug, out_qty*i);

  return query select out_slug, out_qty*i;
end $$;
