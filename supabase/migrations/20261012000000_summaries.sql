-- Saved summaries, private to each user.
create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 255),
  title text not null check (char_length(title) between 1 and 200),
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create index summaries_user_created_idx on public.summaries (user_id, created_at desc);

alter table public.summaries enable row level security;

create policy "Users can read their own summaries"
  on public.summaries for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own summaries"
  on public.summaries for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can rename their own summaries"
  on public.summaries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own summaries"
  on public.summaries for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.summaries to authenticated;

-- One row per summary generated, for the daily limit. Users can add and read
-- rows but not remove them, so deleting a saved summary doesn't hand back a
-- slot.
create table public.summary_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index summary_usage_user_created_idx on public.summary_usage (user_id, created_at desc);

alter table public.summary_usage enable row level security;

create policy "Users can read their own usage"
  on public.summary_usage for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can record their own usage"
  on public.summary_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.summary_usage to authenticated;
