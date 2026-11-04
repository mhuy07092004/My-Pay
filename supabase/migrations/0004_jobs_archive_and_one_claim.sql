-- One active job may claim the tax-free threshold. Archived jobs stay so old
-- shifts keep their rate history, and they cannot hold the claim.

alter table public.jobs
  add column archived_at timestamptz;

create unique index jobs_one_tax_free_threshold_idx
  on public.jobs (user_id)
  where claims_tax_free_threshold and archived_at is null;

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

  if p_claim then
    update public.jobs
      set claims_tax_free_threshold = false
      where user_id = uid
        and id <> p_job_id
        and archived_at is null
        and claims_tax_free_threshold;
  end if;

  update public.jobs
    set claims_tax_free_threshold = p_claim
    where id = p_job_id and user_id = uid and archived_at is null;
  if not found then
    raise exception 'job_not_found' using errcode = 'P0002';
  end if;
end;
$$;
