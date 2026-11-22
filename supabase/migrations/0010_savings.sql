-- Wish-list savings for the Calculator tab. Money in integer cents.

create table public.savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  price_cents integer not null check (price_cents >= 0 and price_cents <= 100_000_000),
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now()
);

create index savings_user_created_idx on public.savings (user_id, created_at desc);

alter table public.savings enable row level security;

create policy savings_own on public.savings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);