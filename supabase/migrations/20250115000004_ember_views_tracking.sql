-- Seen tracking for Embers Stories
create table if not exists public.ember_views (
  ember_id uuid not null references public.embers(id) on delete cascade,
  user_id  uuid not null,
  seen_at  timestamptz not null default now(),
  primary key (ember_id, user_id)
);

alter table public.ember_views enable row level security;

-- Users can only read/write their own "seen"
create policy if not exists ember_views_self_read
  on public.ember_views for select using (auth.uid() = user_id);

create policy if not exists ember_views_self_write
  on public.ember_views for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helpful index
create index if not exists ember_views_user_seen_idx on public.ember_views(user_id, seen_at);

-- Optional: allow 🔥 in reactions
alter table public.ember_reactions
  drop constraint if exists ember_reactions_emoji_check;

alter table public.ember_reactions
  add constraint ember_reactions_emoji_check
  check (emoji in ('👍','😂','😡','😢','🙄','🔥'));
