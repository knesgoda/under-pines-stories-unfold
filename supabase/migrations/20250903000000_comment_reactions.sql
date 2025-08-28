-- Comment reactions table and triggers

-- Reuse reaction_emoji from post reactions. Create comment reactions.

create table if not exists comment_reactions (
  comment_id uuid not null references comments(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      reaction_emoji not null,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);
create index if not exists idx_comment_reactions_comment on comment_reactions(comment_id);
create index if not exists idx_comment_reactions_emoji   on comment_reactions(emoji);

-- Roll up into comments.like_count so existing UI/sorts still work.
create or replace function refresh_comment_reaction_count(p_comment uuid) returns void
language sql security definer set search_path=public as $$
  update comments c
     set like_count = (select count(*) from comment_reactions r where r.comment_id = c.id)
   where c.id = p_comment;
$$;

create or replace function trg_comment_reactions_upd() returns trigger
language plpgsql security definer as $$
begin
  perform refresh_comment_reaction_count(coalesce(new.comment_id, old.comment_id));
  return coalesce(new, old);
end $$;

drop trigger if exists t_cr_ai on comment_reactions;
drop trigger if exists t_cr_au on comment_reactions;
drop trigger if exists t_cr_ad on comment_reactions;
create trigger t_cr_ai after insert on comment_reactions for each row execute function trg_comment_reactions_upd();
create trigger t_cr_au after update on comment_reactions for each row execute function trg_comment_reactions_upd();
create trigger t_cr_ad after delete on comment_reactions for each row execute function trg_comment_reactions_upd();

-- RLS
alter table comment_reactions enable row level security;
do $$ begin
  create policy if not exists cr_select_all on comment_reactions for select using (true);
  create policy if not exists cr_upsert_own on comment_reactions for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
end $$;

-- Summary RPC for quick UI display
create or replace function comment_reaction_summary(p_comment uuid)
returns table(emoji reaction_emoji, count int)
language sql stable as $$
  select emoji, count(*)::int
  from comment_reactions
  where comment_id = p_comment
  group by emoji
  order by count desc;
$$;
