-- Migration: Embers, Tag Follows, Groups, Polls, Insights

-- =============== EMBERS (Ephemeral stories)
create type ember_visibility as enum ('public','followers','close_friends');

create table if not exists embers (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  caption text default '',
  media jsonb not null default '[]'::jsonb,     -- [{key_sm,key_md,key_orig,width,height,duration?}]
  visibility ember_visibility not null default 'followers',
  expires_at timestamptz not null,              -- now() + interval '24 hours'
  created_at timestamptz default now()
);
create index if not exists idx_embers_author_created on embers(author_id, created_at desc);
create index if not exists idx_embers_expires on embers(expires_at);

-- who can see: viewers list (optional metrics) + de-dupe per viewer
create table if not exists ember_views (
  ember_id uuid not null references embers(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz default now(),
  primary key (ember_id, viewer_id)
);

-- close friends list
create table if not exists close_friends (
  owner_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (owner_id, friend_id)
);

-- =============== TAG FOLLOWS
create table if not exists tag_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null references hashtags(tag) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, tag)
);

-- =============== GROUPS
create type group_visibility as enum ('public','private','invite');
create type group_role as enum ('owner','mod','member');
create type group_state as enum ('active','invited','requested');

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- 'trails-club'
  name text not null,
  description text default '',
  visibility group_visibility not null default 'public',
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role group_role not null default 'member',
  state group_state not null default 'active',
  created_at timestamptz default now(),
  primary key (group_id, user_id)
);
create index if not exists idx_group_members_user on group_members(user_id);

-- reuse posts table; add group_id to posts
alter table posts add column if not exists group_id uuid null references groups(id) on delete cascade;
create index if not exists idx_posts_group_created on posts(group_id, created_at desc);

-- =============== POLLS
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  question text not null check (char_length(question) <= 200),
  multi boolean not null default false,
  created_at timestamptz default now()
);
create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  text text not null check (char_length(text) <= 100),
  ord int not null default 0
);
create table if not exists poll_votes (
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (poll_id, user_id)
);
create index if not exists idx_poll_votes_poll on poll_votes(poll_id);

-- =============== CREATOR INSIGHTS
create table if not exists post_impressions (
  post_id uuid not null references posts(id) on delete cascade,
  viewer_id uuid null references auth.users(id) on delete set null,
  seen_on date not null default (now()::date),
  context text not null default 'feed', -- 'feed'|'profile'|'tag'|'group'
  primary key (post_id, viewer_id, seen_on, context)
);

create table if not exists profile_views (
  profile_id uuid not null references auth.users(id) on delete cascade,
  viewer_id uuid null references auth.users(id) on delete set null,
  seen_on date not null default (now()::date),
  primary key (profile_id, viewer_id, seen_on)
);

-- optional materialized daily summary for fast charts
create table if not exists daily_post_metrics (
  day date not null,
  post_id uuid not null references posts(id) on delete cascade,
  impressions int not null default 0,
  primary key (day, post_id)
);

-- =============== RLS
alter table embers enable row level security;
alter table ember_views enable row level security;
alter table close_friends enable row level security;
alter table tag_follows enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table post_impressions enable row level security;
alter table profile_views enable row level security;
alter table daily_post_metrics enable row level security;

do $$ begin
  -- Embers: read rules applied via SQL predicates; writes by author
  create policy if not exists embers_select_all on embers for select using (true);
  create policy if not exists embers_insert_own on embers for insert with check (auth.uid() = author_id);
  create policy if not exists embers_delete_own on embers for delete using (auth.uid() = author_id);

  create policy if not exists ember_views_select_own on ember_views for select using (auth.uid() = viewer_id or exists(select 1 from embers e where e.id=ember_id and e.author_id=auth.uid()));
  create policy if not exists ember_views_upsert_self on ember_views for all using (auth.uid() = viewer_id) with check (auth.uid() = viewer_id);

  create policy if not exists close_friends_self on close_friends for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

  create policy if not exists tag_follows_crud_own on tag_follows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

  create policy if not exists groups_select_public on groups for select using (visibility='public');
  create policy if not exists groups_membership_read on groups for select using (exists(select 1 from group_members gm where gm.group_id=id and gm.user_id=auth.uid()));
  create policy if not exists groups_crud_mod on groups for all using (exists(select 1 from group_members gm where gm.group_id=id and gm.user_id=auth.uid() and gm.role in ('owner','mod')));

  create policy if not exists group_members_select_self on group_members for select using (user_id=auth.uid() or exists(select 1 from group_members gm where gm.group_id=group_id and gm.user_id=auth.uid() and gm.role in ('owner','mod')));
  create policy if not exists group_members_upsert_self on group_members for all using (user_id=auth.uid()) with check (user_id=auth.uid());

  -- Posts in groups: reuse posts policies (already exist); enforce visibility in fetchers.

  create policy if not exists polls_select_all on polls for select using (true);
  create policy if not exists poll_options_select_all on poll_options for select using (true);
  create policy if not exists poll_votes_select_own on poll_votes for select using (user_id=auth.uid());
  create policy if not exists poll_votes_upsert_own on poll_votes for all using (user_id=auth.uid()) with check (user_id=auth.uid());

  create policy if not exists post_impr_upsert on post_impressions for all using (true) with check (true);
  create policy if not exists profile_views_upsert on profile_views for all using (true) with check (true);
  create policy if not exists dpm_select on daily_post_metrics for select using (true);
end $$;

-- =============== RPCs

-- Embers feed for a viewer with safety + visibility + expiry
create or replace function embers_for_viewer(p_viewer uuid, p_before timestamptz default now(), p_limit int default 100)
returns table(id uuid, author_id uuid, caption text, media jsonb, created_at timestamptz, expires_at timestamptz)
language sql stable as $$
  with allowed as (
    select e.*
    from embers e
    where e.created_at < p_before
      and e.expires_at > now()
      and not exists (select 1 from blocks b where (b.blocker_id=p_viewer and b.blocked_id=e.author_id) or (b.blocker_id=e.author_id and b.blocked_id=p_viewer))
      and (
        e.visibility='public'
        or (e.visibility='followers' and exists(select 1 from follows f where f.follower_id=p_viewer and f.followee_id=e.author_id))
        or (e.visibility='close_friends' and exists(select 1 from close_friends cf where cf.owner_id=e.author_id and cf.friend_id=p_viewer))
        or e.author_id = p_viewer
      )
  )
  select id, author_id, caption, media, created_at, expires_at
  from allowed
  order by created_at desc
  limit p_limit;
$$;

-- Home feed extended by followed tags
create or replace function feed_with_tags(p_user uuid, p_before timestamptz default now(), p_limit int default 20)
returns table(id uuid, author_id uuid, body text, media jsonb, created_at timestamptz, like_count int, group_id uuid)
language sql stable as $$
  with user_authors as (select followee_id as id from follows where follower_id=p_user union select p_user as id),
  tag_posts as (
    select hp.post_id
    from tag_follows tf join hashtag_posts hp on hp.tag=tf.tag
    where tf.user_id=p_user
  ),
  candidates as (
    select p.* from posts p
    where p.status='published'
      and p.created_at < p_before
      and (
        p.author_id in (select id from user_authors)
        or p.id in (select post_id from tag_posts)
      )
      and (p.group_id is null or exists(
        select 1 from groups g
        left join group_members gm on gm.group_id=g.id and gm.user_id=p_user
        where g.id=p.group_id
          and (g.visibility='public' or gm.state='active')
      ))
      and not exists (select 1 from blocks b where (b.blocker_id=p_user and b.blocked_id=p.author_id) or (b.blocker_id=p.author_id and b.blocked_id=p_user))
      and not exists (select 1 from mutes m where m.muter_id=p_user and m.muted_id=p.author_id)
  )
  select id, author_id, body, media, created_at, like_count, group_id
  from candidates
  order by created_at desc, id desc
  limit p_limit;
$$;

-- Group membership helpers
create or replace function group_can_post(p_user uuid, p_group uuid)
returns boolean language sql stable as $$
  select exists(select 1 from group_members gm where gm.group_id=p_group and gm.user_id=p_user and gm.state='active');
$$;

-- Poll results (counts per option)
create or replace function poll_results(p_poll uuid)
returns table(option_id uuid, text text, ord int, votes int)
language sql stable as $$
  select o.id, o.text, o.ord, coalesce(v.c,0) as votes
  from poll_options o
  left join (select option_id, count(*) c from poll_votes where poll_id=p_poll group by option_id) v on v.option_id=o.id
  where o.poll_id=p_poll
  order by ord asc, text asc;
$$;

-- Insights: get daily metrics for a post window
create or replace function post_insights(p_post uuid, p_days int default 14)
returns table(day date, impressions int, likes int, comments int)
language sql stable as $$
  with days as (select generate_series((now()::date - (p_days - 1))::date, now()::date, '1 day')::date as d),
  imps as (select seen_on as d, count(*) c from post_impressions where post_id=p_post group by 1),
  likes as (select date_trunc('day', created_at)::date d, count(*) c from post_likes where post_id=p_post group by 1),
  comm as (select date_trunc('day', created_at)::date d, count(*) c from comments where post_id=p_post group by 1)
  select d.d as day, coalesce(i.c,0) as impressions, coalesce(l.c,0) as likes, coalesce(c.c,0) as comments
  from days d
  left join imps i on i.d=d.d
  left join likes l on l.d=d.d
  left join comm c on c.d=d.d
  order by day asc;
$$;
