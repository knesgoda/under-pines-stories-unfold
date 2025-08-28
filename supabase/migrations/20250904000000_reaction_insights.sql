-- Reaction insights functions

-- 1) Emoji usage by a user
create or replace function user_emoji_usage(p_user uuid)
returns table(emoji reaction_emoji, count int)
language sql stable as $$
  select emoji, count(*)::int
  from (
    select emoji from post_reactions where user_id = p_user
    union all
    select emoji from comment_reactions where user_id = p_user
  ) x
  group by emoji
  order by count desc;
$$;

-- 2) Emoji received on a user's content
create or replace function user_emoji_received(p_user uuid)
returns table(emoji reaction_emoji, count int)
language sql stable as $$
  select emoji, count(*)::int
  from (
    select pr.emoji
    from post_reactions pr
    join posts p on p.id = pr.post_id
    where p.author_id = p_user
    union all
    select cr.emoji
    from comment_reactions cr
    join comments c on c.id = cr.comment_id
    where c.author_id = p_user
  ) x
  group by emoji
  order by count desc;
$$;

-- 3) Top reactors to a user's content
create or replace function user_top_reactors(p_user uuid, p_limit int default 12)
returns table(reactor_id uuid, total int)
language sql stable as $$
  with raw as (
    select pr.user_id as reactor_id, count(*)::int as c
    from post_reactions pr
    join posts p on p.id = pr.post_id
    where p.author_id = p_user
    group by pr.user_id
    union all
    select cr.user_id as reactor_id, count(*)::int as c
    from comment_reactions cr
    join comments c on c.id = cr.comment_id
    where c.author_id = p_user
    group by cr.user_id
  ),
  summed as (
    select reactor_id, sum(c)::int as total
    from raw
    group by reactor_id
  )
  select s.reactor_id, s.total
  from summed s
  where not exists (
    select 1 from blocks b
    where (b.blocker_id = p_user and b.blocked_id = s.reactor_id)
       or (b.blocker_id = s.reactor_id and b.blocked_id = p_user)
  )
  order by total desc
  limit p_limit;
$$;

-- 4) Reactors for a specific POST + emoji
create or replace function reactors_by_post_emoji(p_post uuid, p_emoji reaction_emoji, p_limit int default 100)
returns table(user_id uuid, reacted_at timestamptz)
language sql stable as $$
  select user_id, created_at
  from post_reactions
  where post_id = p_post and emoji = p_emoji
  order by created_at desc
  limit p_limit;
$$;

-- 5) Reactors for a specific COMMENT + emoji
create or replace function reactors_by_comment_emoji(p_comment uuid, p_emoji reaction_emoji, p_limit int default 100)
returns table(user_id uuid, reacted_at timestamptz)
language sql stable as $$
  select user_id, created_at
  from comment_reactions
  where comment_id = p_comment and emoji = p_emoji
  order by created_at desc
  limit p_limit;
$$;
