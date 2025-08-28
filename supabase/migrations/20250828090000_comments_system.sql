-- Comments and threaded replies schema

-- comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid null references comments(id) on delete cascade,
  body text not null check (char_length(body) <= 1000),
  like_count int not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

-- comment likes table
create table if not exists comment_likes (
  comment_id uuid not null references comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- add comment counter to posts
alter table posts add column if not exists comment_count int not null default 0;

-- indexes for efficient pagination
create index if not exists idx_comments_post_parent_created on comments(post_id, parent_id, created_at desc);
create index if not exists idx_comments_post_created on comments(post_id, created_at desc);
create index if not exists idx_comments_parent_created on comments(parent_id, created_at asc);

-- enable RLS
alter table comments enable row level security;
alter table comment_likes enable row level security;

-- RLS policies
create policy if not exists comments_select_all on comments for select using (true);
create policy if not exists comments_insert_own on comments for insert with check (auth.uid() = author_id);
create policy if not exists comments_update_own on comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy if not exists comments_delete_own on comments for delete using (auth.uid() = author_id);

create policy if not exists comment_likes_select on comment_likes for select using (true);
create policy if not exists comment_likes_mutate_own on comment_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- triggers to maintain posts.comment_count
create or replace function trg_comment_insert() returns trigger language plpgsql as $$
begin
  update posts set comment_count = comment_count + 1 where id = new.post_id;
  return new;
end $$;

create or replace function trg_comment_delete() returns trigger language plpgsql as $$
begin
  update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  return old;
end $$;

drop trigger if exists comments_after_insert on comments;
create trigger comments_after_insert after insert on comments for each row execute function trg_comment_insert();

drop trigger if exists comments_after_delete on comments;
create trigger comments_after_delete after delete on comments for each row execute function trg_comment_delete();

-- RPC function to fetch top-level comments with preview replies
create or replace function get_post_comments(
  p_viewer uuid,
  p_post uuid,
  p_before timestamptz default now(),
  p_limit int default 20,
  p_preview_replies int default 2
) returns table(
  id uuid, post_id uuid, author_id uuid, parent_id uuid,
  body text, like_count int, is_deleted boolean, created_at timestamptz,
  preview_replies jsonb
) language sql stable as $$
  with top as (
    select c.*
    from comments c
    where c.post_id = p_post
      and c.parent_id is null
      and c.created_at < p_before
      and not exists (
        select 1 from blocks b where (b.blocker_id = p_viewer and b.blocked_id = c.author_id)
                               or (b.blocker_id = c.author_id and b.blocked_id = p_viewer)
      )
      and not exists (
        select 1 from mutes m where m.muter_id = p_viewer and m.muted_id = c.author_id
      )
    order by c.created_at desc, c.id desc
    limit p_limit
  )
  select
    t.id, t.post_id, t.author_id, t.parent_id,
    t.body, t.like_count, t.is_deleted, t.created_at,
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id,
        'post_id', r.post_id,
        'author_id', r.author_id,
        'parent_id', r.parent_id,
        'body', r.body,
        'like_count', r.like_count,
        'is_deleted', r.is_deleted,
        'created_at', r.created_at
      ) order by r.created_at asc), '[]'::jsonb)
      from (
        select r.*
        from comments r
        where r.parent_id = t.id
          and not exists (
            select 1 from blocks b where (b.blocker_id = p_viewer and b.blocked_id = r.author_id)
                                   or (b.blocker_id = r.author_id and b.blocked_id = p_viewer)
          )
          and not exists (
            select 1 from mutes m where m.muter_id = p_viewer and m.muted_id = r.author_id
          )
        order by r.created_at asc
        limit p_preview_replies
      ) r
    ) as preview_replies
  from top t;
$$;

-- RPC function to fetch replies for a comment
create or replace function get_comment_replies(
  p_viewer uuid,
  p_parent uuid,
  p_after timestamptz default 'epoch'::timestamptz,
  p_limit int default 20
) returns table(
  id uuid, post_id uuid, author_id uuid, parent_id uuid,
  body text, like_count int, is_deleted boolean, created_at timestamptz
) language sql stable as $$
  select c.*
  from comments c
  where c.parent_id = p_parent
    and c.created_at > p_after
    and not exists (
      select 1 from blocks b where (b.blocker_id = p_viewer and b.blocked_id = c.author_id)
                             or (b.blocker_id = c.author_id and b.blocked_id = p_viewer)
    )
    and not exists (
      select 1 from mutes m where m.muter_id = p_viewer and m.muted_id = c.author_id
    )
  order by c.created_at asc, c.id asc
  limit p_limit;
$$;

-- RPC to toggle like on a comment and return new like count and like status
create or replace function toggle_comment_like(p_comment uuid)
returns table(like_count int, did_like boolean)
language plpgsql as $$
declare
  v_user uuid := auth.uid();
begin
  if exists(select 1 from comment_likes where comment_id = p_comment and user_id = v_user) then
    delete from comment_likes where comment_id = p_comment and user_id = v_user;
    update comments set like_count = greatest(like_count - 1, 0) where id = p_comment returning like_count into like_count;
    did_like := false;
  else
    insert into comment_likes(comment_id, user_id) values (p_comment, v_user);
    update comments set like_count = like_count + 1 where id = p_comment returning like_count into like_count;
    did_like := true;
  end if;
  return next;
end;
$$;
