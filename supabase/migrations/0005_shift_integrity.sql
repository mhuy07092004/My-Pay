-- Shift times cannot overlap for one user, and day/period writes go through
-- one transaction. Direct PostgREST inserts are closed off.

alter table public.shifts
  add column starts_at timestamp generated always as (work_date + check_in) stored,
  add column ends_at timestamp generated always as (
    work_date + check_out
    + case when check_out < check_in then interval '1 day' else interval '0' end
  ) stored;

alter table public.shifts
  add constraint shifts_no_overlap exclude using gist (
    user_id with =,
    tsrange(starts_at, ends_at, '[)') with &&
  );

-- ---------------------------------------------------------------- writes
create or replace function private.replace_day(
  p_user uuid,
  p_period_id uuid,
  p_date date,
  p_shifts jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shift jsonb;
  v_part smallint := 0;
  v_job public.jobs%rowtype;
  v_in time;
  v_out time;
  v_break integer;
  v_ot integer;
  v_span integer;
  v_note text;
begin
  if p_user is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_shifts is null or jsonb_typeof(p_shifts) <> 'array' or jsonb_array_length(p_shifts) > 2 then
    raise exception 'invalid_shifts' using errcode = '22023';
  end if;

  perform 1
    from public.pay_periods
    where id = p_period_id and user_id = p_user
    for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.pay_periods
    where id = p_period_id and p_date between start_date and end_date
  ) then
    raise exception 'date_outside_period' using errcode = '22023';
  end if;

  delete from public.shifts
    where period_id = p_period_id and work_date = p_date;

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
        where id = (v_shift ->> 'jobId')::uuid and user_id = p_user;
    exception when invalid_text_representation then
      raise exception 'job_not_found' using errcode = 'P0002';
    end;
    if not found then
      raise exception 'job_not_found' using errcode = 'P0002';
    end if;

    insert into public.shifts (
      user_id, period_id, work_date, part, check_in, check_out, break_minutes,
      job_id, public_holiday, overtime_minutes, rate_snapshot, note
    ) values (
      p_user,
      p_period_id,
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
end;
$$;

revoke all on function private.replace_day(uuid, uuid, date, jsonb) from public, anon, authenticated;

create or replace function public.create_period(p_start date, p_end date, p_days jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  cycle text;
  period_id uuid;
  day jsonb;
begin
  if uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select pay_cycle into cycle from public.tax_profiles where user_id = uid;
  if cycle is null or cycle not in ('weekly', 'fortnightly') then
    cycle := 'fortnightly';
  end if;
  if not (
    (cycle = 'weekly' and (p_end - p_start) = 6)
    or (cycle = 'fortnightly' and (p_end - p_start) = 13)
  ) then
    raise exception 'invalid_period_length' using errcode = '22023';
  end if;
  if p_days is not null and jsonb_typeof(p_days) <> 'array' then
    raise exception 'invalid_days' using errcode = '22023';
  end if;

  insert into public.pay_periods (user_id, start_date, end_date, pay_cycle, payment_date)
  values (uid, p_start, p_end, cycle, p_end)
  returning id into period_id;

  for day in select value from jsonb_array_elements(coalesce(p_days, jsonb_build_array()))
  loop
    perform private.replace_day(
      uid,
      period_id,
      (day ->> 'date')::date,
      coalesce(day -> 'shifts', jsonb_build_array())
    );
  end loop;

  return period_id;
end;
$$;

create or replace function public.save_day(p_period_id uuid, p_date date, p_shifts jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.replace_day(
    (select auth.uid()),
    p_period_id,
    p_date,
    coalesce(p_shifts, jsonb_build_array())
  );
end;
$$;

revoke all on function public.create_period(date, date, jsonb) from public, anon;
revoke all on function public.save_day(uuid, date, jsonb) from public, anon;
grant execute on function public.create_period(date, date, jsonb) to authenticated;
grant execute on function public.save_day(uuid, date, jsonb) to authenticated;

revoke insert, update, delete, truncate on table public.shifts from public, anon, authenticated;
revoke insert, truncate on table public.pay_periods from public, anon, authenticated;

drop policy if exists shifts_insert on public.shifts;
drop policy if exists shifts_update on public.shifts;
drop policy if exists shifts_delete on public.shifts;
