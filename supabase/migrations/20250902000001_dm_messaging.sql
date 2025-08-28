-- Direct Messages schema and RPC functions

-- conversations (1:1 for MVP; future: is_group)
create table if not exists dm_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

-- members with per-user state
create type dm_member_state as enum ('active','pending'); -- pending = request awaiting acceptance
create table if not exists dm_members (
  conversation_id uuid references dm_conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  state dm_member_state not null default 'active',
  last_read_at timestamptz default 'epoch',
  created_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- messages
create table if not exists dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references dm_conversations(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) <= 4000),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  is_deleted boolean not null default false
);
create index if not exists idx_dm_messages_conv_created on dm_messages(conversation_id, created_at asc);

-- handy index for member lookups
create index if not exists idx_dm_members_user_created on dm_members(user_id, created_at desc);

-- notifications extension (add 2 new types if not present)
do $$ begin
  if not exists (select 1 from pg_type where typname='notif_type') then
    create type notif_type as enum ('follow','follow_request','follow_accept','post_like','post_comment','comment_reply','dm_message','dm_request');
  elsif not exists (select 1 from pg_enum where enumlabel='dm_message' and enumtypid='notif_type'::regtype) then
    alter type notif_type add value if not exists 'dm_message';
    alter type notif_type add value if not exists 'dm_request';
  end if;
end $$;

-- RLS
alter table dm_conversations enable row level security;
alter table dm_members enable row level security;
alter table dm_messages enable row level security;

-- Only participants can see their conversation rows
do $$ begin
  if not exists (select 1 from pg_policies where tablename='dm_conversations' and policyname='dm_conv_select_participant') then
    create policy dm_conv_select_participant on dm_conversations for select using (
      exists (select 1 from dm_members m where m.conversation_id = id and m.user_id = auth.uid())
    );
  end if;
end $$;

-- Members: user can read/update their own membership row; inserts happen via RPC
do $$ begin
  if not exists (select 1 from pg_policies where tablename='dm_members' and policyname='dm_members_select_own') then
    create policy dm_members_select_own on dm_members for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='dm_members' and policyname='dm_members_update_own') then
    create policy dm_members_update_own on dm_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- Messages: only participants can read; only participant authors can insert/update their messages
do $$ begin
  if not exists (select 1 from pg_policies where tablename='dm_messages' and policyname='dm_messages_select_conv_participant') then
    create policy dm_messages_select_conv_participant on dm_messages for select using (
      exists (select 1 from dm_members m where m.conversation_id = dm_messages.conversation_id and m.user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='dm_messages' and policyname='dm_messages_insert_author_member') then
    create policy dm_messages_insert_author_member on dm_messages for insert with check (
      author_id = auth.uid()
      and exists (select 1 from dm_members m where m.conversation_id = dm_messages.conversation_id and m.user_id = auth.uid() and m.state in ('active','pending'))
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='dm_messages' and policyname='dm_messages_update_own') then
    create policy dm_messages_update_own on dm_messages for update using (author_id = auth.uid()) with check (author_id = auth.uid());
  end if;
end $$;

-- RPC functions

-- Start or fetch a conversation and handle request vs active.
create or replace function dm_start(p_me uuid, p_other uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  conv uuid;
  me_state dm_member_state := 'active';
  other_state dm_member_state := 'active';
  other_private boolean := false;
begin
  if p_me = p_other then
    raise exception 'cannot_dm_self';
  end if;

  -- blocks either direction
  if exists(select 1 from blocks b where (b.blocker_id=p_me and b.blocked_id=p_other) or (b.blocker_id=p_other and b.blocked_id=p_me)) then
    raise exception 'blocked';
  end if;

  -- check privacy (if private and you do NOT follow them → request)
  select coalesce(us.is_private,false) into other_private from user_settings us where us.user_id = p_other;
  if other_private and not exists (select 1 from follows f where f.follower_id = p_me and f.followee_id = p_other) then
    me_state := 'active';
    other_state := 'pending';
  end if;

  -- existing conversation?
  select c.id into conv
  from dm_conversations c
  join dm_members m1 on m1.conversation_id=c.id and m1.user_id=p_me
  join dm_members m2 on m2.conversation_id=c.id and m2.user_id=p_other
  limit 1;

  if conv is null then
    insert into dm_conversations default values returning id into conv;
    insert into dm_members(conversation_id,user_id,state) values (conv,p_me,me_state), (conv,p_other,other_state);
    -- notif if request
    if other_state='pending' then
      perform create_notification(p_other, p_me, 'dm_request', null, null, '{}'::jsonb);
    end if;
  end if;

  return conv;
end;
$$;

grant execute on function dm_start(uuid,uuid) to anon, authenticated;

-- Accept or decline request (target only)
create or replace function dm_set_request(p_me uuid, p_conversation uuid, p_action text) returns void
language plpgsql security definer as $$
begin
  -- only the pending member can act
  if not exists (select 1 from dm_members where conversation_id=p_conversation and user_id=p_me and state='pending') then
    raise exception 'no_pending_request';
  end if;

  if p_action='accept' then
    update dm_members set state='active' where conversation_id=p_conversation and user_id=p_me;
  elsif p_action='decline' then
    delete from dm_members where conversation_id=p_conversation and user_id=p_me;
    -- if other member alone, delete conversation
    delete from dm_conversations c
      where c.id=p_conversation and not exists (select 1 from dm_members m where m.conversation_id=c.id);
  else
    raise exception 'bad_action';
  end if;
end;
$$;

grant execute on function dm_set_request(uuid,uuid,text) to anon, authenticated;

-- Update last_read_at
create or replace function dm_mark_read(p_me uuid, p_conversation uuid) returns void
language sql security definer as $$
  update dm_members set last_read_at=now()
  where conversation_id=p_conversation and user_id=p_me;
$$;

grant execute on function dm_mark_read(uuid,uuid) to anon, authenticated;
