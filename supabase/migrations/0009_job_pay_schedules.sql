-- Each job has its own pay cycle and payday. Periods belong to one job and are
-- created when a shift is saved. Several jobs may claim the tax-free threshold.

-- --------------------------------------------------------------- job schedule
alter table public.jobs
  add column pay_cycle text,
  add column schedule_start date,
  add column schedule_pay_date date;

update public.jobs j
set
  pay_cycle = sub.pay_cycle,
  schedule_start = sub.start_date,
  schedule_pay_date = sub.end_date
from (
  select distinct on (s.job_id)
    s.job_id,
    p.pay_cycle,
    p.start_date,
    p.end_date
  from public.shifts s
  join public.pay_periods p on p.id = s.period_id
  order by s.job_id, p.start_date desc
) sub
where j.id = sub.job_id;

update public.jobs j
set
  pay_cycle = coalesce(t.pay_cycle, 'fortnightly'),
  schedule_start = current_date - ((extract(dow from current_date)::int + 6) % 7),
  schedule_pay_date = current_date - ((extract(dow from current_date)::int + 6) % 7)
    + case when coalesce(t.pay_cycle, 'fortnightly') = 'weekly' then 6 else 13 end
from public.tax_profiles t
where t.user_id = j.user_id
  and j.schedule_start is null;

update public.jobs
set
  pay_cycle = 'fortnightly',
  schedule_start = current_date - ((extract(dow from current_date)::int + 6) % 7),
  schedule_pay_date = current_date - ((extract(dow from current_date)::int + 6) % 7) + 13
where schedule_start is null;

alter table public.jobs
  alter column pay_cycle set not null,
  alter column schedule_start set not null,
  alter column schedule_pay_date set not null;

alter table public.jobs
  add constraint jobs_pay_cycle_check check (pay_cycle in ('weekly', 'fortnightly')),
  add constraint jobs_schedule_offset_check check (
    schedule_pay_date - (
      schedule_start + case when pay_cycle = 'weekly' then 6 else 13 end
    ) between 0 and 14
  );

-- ------------------------------------------------- many jobs may claim TFT
drop index if exists public.jobs_one_tax_free_threshold_idx;

create or replace function public.set_tax_free_threshold(p_job_id uuid, p_claim boolean default true)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if p_claim and exists (
    select 1 from public.tax_profiles t
    where t.user_id = uid and t.residency = 'foreign'
  ) then
    raise exception 'foreign_resident' using errcode = 'P0001';
  end if;

  update public.jobs
    set claims_tax_free_threshold = p_claim
    where id = p_job_id and user_id = uid and archived_at is null;
  if not found then
    raise exception 'job_not_found' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------- periods belong to a job
alter table public.pay_periods drop constraint pay_periods_no_overlap;

alter table public.pay_periods add column job_id uuid;

with counts as (
  select period_id, job_id, count(*) as n
  from public.shifts
  group by period_id, job_id
),
primary_job as (
  select distinct on (period_id) period_id, job_id
  from counts
  order by period_id, n desc, job_id
)
update public.pay_periods p
set job_id = pj.job_id
from primary_job pj
where pj.period_id = p.id;

update public.pay_periods p
set job_id = (
  select j.id from public.jobs j
  where j.user_id = p.user_id
  order by j.created_at
  limit 1
)
where p.job_id is null and p.actual_net_cents is not null;

delete from public.pay_periods where job_id is null;

insert into public.pay_periods (user_id, job_id, start_date, end_date, pay_cycle, payment_date)
select p.user_id, s.job_id, p.start_date, p.end_date, p.pay_cycle, p.end_date
from public.shifts s
join public.pay_periods p on p.id = s.period_id
where s.job_id <> p.job_id
group by p.user_id, s.job_id, p.start_date, p.end_date, p.pay_cycle;

update public.shifts s
set period_id = np.id
from public.pay_periods op, public.pay_periods np
where s.period_id = op.id
  and s.job_id <> op.job_id
  and np.user_id = op.user_id
  and np.job_id = s.job_id
  and np.start_date = op.start_date
  and np.end_date = op.end_date
  and np.id <> op.id;

alter table public.pay_periods alter column job_id set not null;

alter table public.pay_periods
  add constraint pay_periods_job_owner_fkey foreign key (job_id, user_id)
    references public.jobs (id, user_id),
  add constraint pay_periods_id_job_key unique (id, job_id);

alter table public.pay_periods
  add constraint pay_periods_no_overlap exclude using gist (
    job_id with =,
    daterange(start_date, end_date, '[]') with &&
  );

create index pay_periods_job_start_idx on public.pay_periods (job_id, start_date);

-- One user, one part number per calendar day, across every job.
alter table public.shifts drop constraint shifts_period_id_work_date_part_key;
alter table public.shifts
  add constraint shifts_user_date_part_key unique (user_id, work_date, part);

drop index if exists public.shifts_user_date_part_idx;

alter table public.shifts
  add constraint shifts_period_job_fkey foreign key (period_id, job_id)
    references public.pay_periods (id, job_id) on delete cascade;

-- ---------------------------------------------------------------- functions
drop function if exists public.create_period(date, date, jsonb);
drop function if exists public.save_day(uuid, date, jsonb);
drop function if exists private.replace_day(uuid, uuid, date, jsonb);

create or replace function private.period_for(p_user uuid, p_job uuid, p_date date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle text;
  v_start date;
  v_pay date;
  v_span integer;
  v_k integer;
  v_period_start date;
  v_period_end date;
  v_offset integer;
  v_id uuid;
begin
  select pay_cycle, schedule_start, schedule_pay_date
    into v_cycle, v_start, v_pay
  from public.jobs
  where id = p_job and user_id = p_user;
  if not found then
    raise exception 'job_not_found' using errcode = 'P0002';
  end if;
  if v_start is null or v_pay is null or v_cycle is null then
    raise exception 'job_schedule_missing' using errcode = 'P0003';
  end if;

  v_span := case when v_cycle = 'weekly' then 7 else 14 end;
  v_k := floor((p_date - v_start)::numeric / v_span)::integer;
  v_period_start := v_start + v_k * v_span;
  v_period_end := v_period_start + v_span - 1;
  v_offset := v_pay - (v_start + v_span - 1);

  select id into v_id
  from public.pay_periods
  where job_id = p_job and p_date between start_date and end_date;

  if v_id is not null then
    return v_id;
  end if;

  begin
    insert into public.pay_periods (user_id, job_id, start_date, end_date, pay_cycle, payment_date)
    values (p_user, p_job, v_period_start, v_period_end, v_cycle, v_period_end + v_offset)
    returning id into v_id;
  exception when exclusion_violation then
    select id into v_id
    from public.pay_periods
    where job_id = p_job and p_date between start_date and end_date;
  end;
  return v_id;
end;
$$;

revoke all on function private.period_for(uuid, uuid, date) from public, anon, authenticated;

create or replace function public.save_day(p_date date, p_shifts jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  v_shift jsonb;
  v_part smallint := 0;
  v_job public.jobs%rowtype;
  v_in time;
  v_out time;
  v_break integer;
  v_ot integer;
  v_span integer;
  v_note text;
  v_period uuid;
  v_old uuid[];
  v_deleted uuid[];
  v_affected uuid[];
begin
  if uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_shifts is null or jsonb_typeof(p_shifts) <> 'array' or jsonb_array_length(p_shifts) > 2 then
    raise exception 'invalid_shifts' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct period_id), '{}') into v_old
  from public.shifts
  where user_id = uid and work_date = p_date;

  delete from public.shifts
  where user_id = uid and work_date = p_date;

  for v_shift in select value from jsonb_array_elements(p_shifts)
  loop
    v_part := v_part + 1;
    begin
      v_in := (v_shift ->> 'checkIn')::time;
      v_out := (v_shift ->> 'checkOut')::time;
    exception when others then
      raise exception 'invalid_time' using errcode = '22023';
    end;
    if v_in = v_out then
      raise exception 'zero_length_shift' using errcode = '22023';
    end if;

    v_span := (extract(epoch from (v_out - v_in)) / 60)::integer;
    if v_span <= 0 then
      v_span := v_span + 1440;
    end if;
    v_break := coalesce((v_shift ->> 'breakMinutes')::integer, 0);
    v_ot := coalesce((v_shift ->> 'overtimeMinutes')::integer, 0);
    if v_break < 0 or v_break >= v_span or v_ot < 0 or v_ot > 1440 then
      raise exception 'invalid_break' using errcode = '22023';
    end if;

    v_note := v_shift ->> 'note';
    if v_note is not null and char_length(v_note) > 200 then
      raise exception 'invalid_note' using errcode = '22023';
    end if;

    begin
      select * into v_job
        from public.jobs
        where id = (v_shift ->> 'jobId')::uuid and user_id = uid;
    exception when invalid_text_representation then
      raise exception 'job_not_found' using errcode = 'P0002';
    end;
    if not found then
      raise exception 'job_not_found' using errcode = 'P0002';
    end if;

    v_period := private.period_for(uid, v_job.id, p_date);

    insert into public.shifts (
      user_id, period_id, work_date, part, check_in, check_out, break_minutes,
      job_id, public_holiday, overtime_minutes, rate_snapshot, note
    ) values (
      uid,
      v_period,
      p_date,
      v_part,
      v_in,
      v_out,
      v_break,
      v_job.id,
      coalesce((v_shift ->> 'publicHoliday')::boolean, false),
      v_ot,
      jsonb_build_object(
        'weekday', v_job.weekday_cents,
        'night1', v_job.night1_cents,
        'night2', v_job.night2_cents,
        'saturday', v_job.saturday_cents,
        'sunday', v_job.sunday_cents,
        'publicHoliday', v_job.public_holiday_cents,
        'otFirst2', v_job.ot_first2_cents,
        'otAfter2', v_job.ot_after2_cents,
        'otSunday', v_job.ot_sunday_cents,
        'otPublicHoliday', v_job.ot_public_holiday_cents,
        'overtimeEnabled', v_job.overtime_enabled
      ),
      nullif(v_note, '')
    );
  end loop;

  delete from public.pay_periods p
  where p.user_id = uid
    and p.actual_net_cents is null
    and not exists (select 1 from public.shifts s where s.period_id = p.id);

  select coalesce(array_agg(id), '{}') into v_deleted
  from unnest(v_old) as id
  where not exists (select 1 from public.pay_periods p where p.id = id);

  select coalesce(array_agg(distinct period_id), '{}') into v_affected
  from public.shifts
  where user_id = uid and work_date = p_date;

  select coalesce(array_agg(distinct id), '{}') into v_affected
  from (
    select unnest(v_affected) as id
    union
    select unnest(v_old) as id
  ) x
  where exists (select 1 from public.pay_periods p where p.id = x.id);

  return jsonb_build_object('affected', to_jsonb(v_affected), 'deleted', to_jsonb(v_deleted));
end;
$$;

revoke all on function public.save_day(date, jsonb) from public, anon;
grant execute on function public.save_day(date, jsonb) to authenticated;

create or replace function public.set_job_schedule(
  p_job_id uuid,
  p_cycle text,
  p_start date,
  p_pay_date date
)
returns void
language plpgsql
security definer
set search_path = pg_temp, public
as $$
declare
  uid uuid := (select auth.uid());
  v_span integer;
  v_offset integer;
  v_shift record;
  v_k integer;
  v_period_start date;
  v_period_end date;
  v_period uuid;
  v_actual integer;
begin
  if uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_cycle not in ('weekly', 'fortnightly') then
    raise exception 'invalid_schedule' using errcode = '22023';
  end if;
  v_span := case when p_cycle = 'weekly' then 7 else 14 end;
  v_offset := p_pay_date - (p_start + v_span - 1);
  if v_offset < 0 or v_offset > 14 then
    raise exception 'invalid_schedule' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.jobs where id = p_job_id and user_id = uid and archived_at is null
  ) then
    raise exception 'job_not_found' using errcode = 'P0002';
  end if;

  update public.jobs
  set pay_cycle = p_cycle, schedule_start = p_start, schedule_pay_date = p_pay_date
  where id = p_job_id and user_id = uid;

  create temp table if not exists _schedule_shifts on commit drop as
  select
    s.work_date, s.part, s.check_in, s.check_out, s.break_minutes, s.job_id,
    s.public_holiday, s.overtime_minutes, s.rate_snapshot, s.note, s.user_id
  from public.shifts s
  where false;

  truncate _schedule_shifts;
  insert into _schedule_shifts
  select
    s.work_date, s.part, s.check_in, s.check_out, s.break_minutes, s.job_id,
    s.public_holiday, s.overtime_minutes, s.rate_snapshot, s.note, s.user_id
  from public.shifts s
  where s.job_id = p_job_id and s.user_id = uid;

  create temp table if not exists _schedule_actuals on commit drop as
  select p.start_date, p.end_date, p.actual_net_cents
  from public.pay_periods p
  where false;

  truncate _schedule_actuals;
  insert into _schedule_actuals
  select p.start_date, p.end_date, p.actual_net_cents
  from public.pay_periods p
  where p.job_id = p_job_id and p.user_id = uid and p.actual_net_cents is not null;

  delete from public.shifts where job_id = p_job_id and user_id = uid;
  delete from public.pay_periods where job_id = p_job_id and user_id = uid;

  for v_shift in select * from _schedule_shifts order by work_date, part
  loop
    v_k := floor((v_shift.work_date - p_start)::numeric / v_span)::integer;
    v_period_start := p_start + v_k * v_span;
    v_period_end := v_period_start + v_span - 1;

    select id into v_period
    from public.pay_periods
    where job_id = p_job_id and v_shift.work_date between start_date and end_date;

    if v_period is null then
      select a.actual_net_cents into v_actual
      from _schedule_actuals a
      where a.start_date = v_period_start and a.end_date = v_period_end
      limit 1;

      insert into public.pay_periods (
        user_id, job_id, start_date, end_date, pay_cycle, payment_date, actual_net_cents
      ) values (
        uid, p_job_id, v_period_start, v_period_end, p_cycle,
        v_period_end + v_offset, v_actual
      )
      returning id into v_period;
    end if;

    insert into public.shifts (
      user_id, period_id, work_date, part, check_in, check_out, break_minutes,
      job_id, public_holiday, overtime_minutes, rate_snapshot, note
    ) values (
      uid, v_period, v_shift.work_date, v_shift.part, v_shift.check_in, v_shift.check_out,
      v_shift.break_minutes, p_job_id, v_shift.public_holiday, v_shift.overtime_minutes,
      v_shift.rate_snapshot, v_shift.note
    );
  end loop;
end;
$$;

revoke all on function public.set_job_schedule(uuid, text, date, date) from public, anon;
grant execute on function public.set_job_schedule(uuid, text, date, date) to authenticated;

alter table public.tax_profiles drop column pay_cycle;
