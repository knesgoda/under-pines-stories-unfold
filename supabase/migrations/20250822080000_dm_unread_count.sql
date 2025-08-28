-- Add an RPC that returns total unread DM messages for the current user.
-- Counts messages authored by others where created_at > member.last_read_at.
create or replace function dm_unread_count(p_me uuid)
returns integer
language sql
stable
as $$
  with my_threads as (
    select conversation_id, last_read_at
    from dm_members
    where user_id = p_me
  ), unread as (
    select count(*) as c
    from dm_messages m
    join my_threads t on t.conversation_id = m.conversation_id
    where m.author_id <> p_me and m.created_at > t.last_read_at
  )
  select coalesce((select c from unread), 0);
$$;
