-- Backfill profile rows, enforce shift ownership with composite FKs, align indexes with queries.

insert into public.profiles (id)
select u.id from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.tax_profiles (user_id)
select u.id from auth.users u
where not exists (select 1 from public.tax_profiles t where t.user_id = u.id);

alter table public.pay_periods add constraint pay_periods_id_user_key unique (id, user_id);
alter table public.jobs add constraint jobs_id_user_key unique (id, user_id);

alter table public.shifts
  drop constraint shifts_period_id_fkey,
  drop constraint shifts_job_id_fkey;

alter table public.shifts
  add constraint shifts_period_owner_fkey foreign key (period_id, user_id)
    references public.pay_periods (id, user_id) on delete cascade,
  add constraint shifts_job_owner_fkey foreign key (job_id, user_id)
    references public.jobs (id, user_id) on delete restrict;

drop index public.shifts_user_id_idx;
create index shifts_user_date_part_idx on public.shifts (user_id, work_date, part);

drop index public.jobs_user_id_idx;
create index jobs_user_created_idx on public.jobs (user_id, created_at);
