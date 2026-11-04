-- Any number of jobs may claim the tax-free threshold. Each job that claims it
-- is taxed with the tax-free brackets; the others use the higher brackets.

drop index if exists public.jobs_one_tax_free_threshold_idx;

-- Now only sets the flag on the one job. The earlier version cleared it on
-- every other job so that exactly one could hold it.
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
