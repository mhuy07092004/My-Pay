-- My Pay: schema, RLS, signup trigger, tax-free-threshold RPC.
-- Money is stored as integer cents.

create extension if not exists btree_gist with schema extensions;
create schema if not exists private;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  state text not null default 'NSW',
  created_at timestamptz not null default now()
);

create table public.tax_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  residency text not null default 'resident' check (residency in ('resident', 'foreign')),
  study_loan boolean not null default false,
  annual_offset_cents integer not null default 0 check (annual_offset_cents >= 0),
  medicare_variation text not null default 'none' check (medicare_variation in ('none', 'full', 'half')),
  pay_cycle text not null default 'fortnightly' check (pay_cycle in ('weekly', 'fortnightly')),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------- jobs
-- A "job" is one Rate on the Settings screen = one employer.
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  kind text not null default 'custom' check (kind in ('preset', 'custom')),
  status text not null default '',
  level text not null default '',
  age text not null default '',
  overtime_enabled boolean not null default false,
  claims_tax_free_threshold boolean not null default false,
  weekday_cents integer not null default 0 check (weekday_cents >= 0),
  night1_cents integer not null default 0 check (night1_cents >= 0),
  night2_cents integer not null default 0 check (night2_cents >= 0),
  saturday_cents integer not null default 0 check (saturday_cents >= 0),
  sunday_cents integer not null default 0 check (sunday_cents >= 0),
  public_holiday_cents integer not null default 0 check (public_holiday_cents >= 0),
  ot_first2_cents integer not null default 0 check (ot_first2_cents >= 0),
  ot_after2_cents integer not null default 0 check (ot_after2_cents >= 0),
  ot_sunday_cents integer not null default 0 check (ot_sunday_cents >= 0),
  ot_public_holiday_cents integer not null default 0 check (ot_public_holiday_cents >= 0),
  created_at timestamptz not null default now()
);
create index jobs_user_id_idx on public.jobs (user_id);
-- Any job may claim the tax-free threshold; see 0003_tax_free_threshold_any_job.sql.

-- ------------------------------------------------------------- pay_periods
create table public.pay_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  pay_cycle text not null check (pay_cycle in ('weekly', 'fortnightly')),
  payment_date date not null,
  actual_net_cents integer check (actual_net_cents >= 0),
  created_at timestamptz not null default now(),
  constraint pay_periods_length check (
    (pay_cycle = 'weekly' and end_date - start_date = 6)
    or (pay_cycle = 'fortnightly' and end_date - start_date = 13)
  ),
  constraint pay_periods_no_overlap exclude using gist (
    user_id with =,
    daterange(start_date, end_date, '[]') with &&
  )
);
create index pay_periods_user_start_idx on public.pay_periods (user_id, start_date);

-- ------------------------------------------------------------------ shifts
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_id uuid not null references public.pay_periods (id) on delete cascade,
  work_date date not null,
  part smallint not null check (part in (1, 2)),
  check_in time not null,
  check_out time not null,
  break_minutes integer not null default 0 check (break_minutes between 0 and 1440),
  job_id uuid not null references public.jobs (id) on delete restrict,
  public_holiday boolean not null default false,
  overtime_minutes integer not null default 0 check (overtime_minutes >= 0),
  -- Copy of the job's rates at the time of saving; editing a job never changes saved shifts.
  rate_snapshot jsonb not null,
  note text,
  unique (period_id, work_date, part)
);
create index shifts_user_id_idx on public.shifts (user_id);
create index shifts_job_id_idx on public.shifts (job_id);

-- ------------------------------------------------- rule tables (read-only)
create table public.award_rates (
  id bigint generated always as identity primary key,
  award text not null default 'MA000003',
  status text not null check (status in ('fullTime', 'partTime', 'casual')),
  level smallint not null check (level between 1 and 3),
  -- 15 = under 16, 16..20 exact, 21 = 21 and over
  age smallint not null check (age between 15 and 21),
  weekday_cents integer not null,
  night1_cents integer not null,
  night2_cents integer not null,
  saturday_cents integer not null,
  sunday_cents integer not null,
  public_holiday_cents integer not null,
  ot_first2_cents integer not null,
  ot_after2_cents integer not null,
  ot_sunday_cents integer not null,
  ot_public_holiday_cents integer not null,
  effective_from date not null,
  unique (award, status, level, age, effective_from)
);

create table public.tax_withholding_coefficients (
  id bigint generated always as identity primary key,
  effective_from date not null,
  scale smallint not null check (scale in (1, 2, 3, 5, 6)),
  seq smallint not null,
  -- "x less than lt"; null = "and over"
  lt integer,
  a numeric(8, 4) not null,
  b numeric(10, 4) not null,
  unique (effective_from, scale, seq)
);

create table public.tax_study_loan_coefficients (
  id bigint generated always as identity primary key,
  effective_from date not null,
  tbl text not null check (tbl in ('A', 'B')),
  seq smallint not null,
  lt integer,
  a numeric(8, 4) not null,
  b numeric(10, 4) not null,
  unique (effective_from, tbl, seq)
);

create table public.tax_offset_rates (
  id bigint generated always as identity primary key,
  effective_from date not null,
  cycle text not null check (cycle in ('weekly', 'fortnightly', 'monthly', 'quarterly')),
  rate numeric(6, 4) not null,
  unique (effective_from, cycle)
);

-- --------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.tax_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.pay_periods enable row level security;
alter table public.shifts enable row level security;
alter table public.award_rates enable row level security;
alter table public.tax_withholding_coefficients enable row level security;
alter table public.tax_study_loan_coefficients enable row level security;
alter table public.tax_offset_rates enable row level security;

create policy profiles_own on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy tax_profiles_own on public.tax_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy jobs_own on public.jobs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy pay_periods_own on public.pay_periods for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy shifts_select on public.shifts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy shifts_delete on public.shifts for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy shifts_insert on public.shifts for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.pay_periods p where p.id = period_id and p.user_id = (select auth.uid()))
    and exists (select 1 from public.jobs j where j.id = job_id and j.user_id = (select auth.uid()))
  );
create policy shifts_update on public.shifts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.pay_periods p where p.id = period_id and p.user_id = (select auth.uid()))
    and exists (select 1 from public.jobs j where j.id = job_id and j.user_id = (select auth.uid()))
  );

create policy award_rates_read on public.award_rates for select to authenticated using (true);
create policy tax_withholding_read on public.tax_withholding_coefficients for select to authenticated using (true);
create policy tax_study_loan_read on public.tax_study_loan_coefficients for select to authenticated using (true);
create policy tax_offset_read on public.tax_offset_rates for select to authenticated using (true);

-- ----------------------------------------------------------- signup trigger
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(left(new.raw_user_meta_data ->> 'first_name', 60), ''),
    coalesce(left(new.raw_user_meta_data ->> 'last_name', 60), '')
  );
  insert into public.tax_profiles (user_id) values (new.id);
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ------------------------------------------- claim tax-free threshold (RPC)
-- Sets the flag on this job only. Replaced by 0003, which dropped the
-- "exactly one job" rule.
create or replace function public.set_tax_free_threshold(p_job_id uuid, p_claim boolean default true)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.jobs
    set claims_tax_free_threshold = p_claim
    where id = p_job_id and user_id = (select auth.uid());
  if not found then
    raise exception 'job_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_tax_free_threshold(uuid, boolean) from public, anon;
grant execute on function public.set_tax_free_threshold(uuid, boolean) to authenticated;
