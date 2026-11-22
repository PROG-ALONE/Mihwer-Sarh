begin;

create or replace function public.create_own_subscription_occurrence(p_subscription_id uuid)
returns public.subscription_occurrences
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
  subscription public.subscriptions%rowtype;
  occurrence public.subscription_occurrences%rowtype;
  period date;
begin
  principal := mihwer_private.current_user_id();
  if principal is null then
    raise exception using errcode = '42501', message = 'unauthenticated';
  end if;

  select * into subscription
  from public.subscriptions
  where owner_id = principal
    and id = p_subscription_id
    and status = 'active'
    and deleted_at is null
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'subscription_not_found';
  end if;

  period := case subscription.cadence
    when 'weekly' then subscription.next_due_date - (extract(isodow from subscription.next_due_date)::integer - 1)
    when 'monthly' then date_trunc('month', subscription.next_due_date)::date
    when 'quarterly' then date_trunc('quarter', subscription.next_due_date)::date
    when 'yearly' then date_trunc('year', subscription.next_due_date)::date
  end;

  insert into public.subscription_occurrences(owner_id, subscription_id, period_start, due_date)
  values (principal, subscription.id, period, subscription.next_due_date)
  on conflict (owner_id, subscription_id, period_start) do nothing
  returning * into occurrence;

  if not found then
    select * into occurrence
    from public.subscription_occurrences
    where owner_id = principal
      and subscription_id = p_subscription_id
      and period_start = period;
  end if;
  return occurrence;
end;
$$;

create or replace function public.transition_own_subscription_occurrence(
  p_occurrence_id uuid,
  p_expected_version integer,
  p_status text
)
returns public.subscription_occurrences
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
  occurrence public.subscription_occurrences%rowtype;
  subscription public.subscriptions%rowtype;
  next_due date;
  previous_status text;
begin
  principal := mihwer_private.current_user_id();
  if principal is null then
    raise exception using errcode = '42501', message = 'unauthenticated';
  end if;
  if p_expected_version is null or p_expected_version < 1
    or p_status is null or p_status not in ('due', 'paid', 'skipped', 'cancelled') then
    raise exception using errcode = '22023', message = 'invalid_occurrence_status';
  end if;

  select * into occurrence
  from public.subscription_occurrences
  where owner_id = principal and id = p_occurrence_id
  for update;
  if not found or occurrence.version <> p_expected_version then
    raise exception using errcode = '40001', message = 'version_conflict';
  end if;
  previous_status := occurrence.status;

  select * into subscription
  from public.subscriptions
  where owner_id = principal and id = occurrence.subscription_id
  for update;
  if not found then
    raise exception using errcode = '40001', message = 'version_conflict';
  end if;

  update public.subscription_occurrences
  set status = p_status,
      version = version + 1,
      updated_at = statement_timestamp()
  where owner_id = principal and id = p_occurrence_id
  returning * into occurrence;

  if previous_status = 'due'
    and occurrence.status in ('paid', 'skipped')
    and subscription.status = 'active'
    and subscription.next_due_date = occurrence.due_date then
    next_due := case subscription.cadence
      when 'weekly' then occurrence.due_date + 7
      when 'monthly' then (occurrence.due_date + interval '1 month')::date
      when 'quarterly' then (occurrence.due_date + interval '3 months')::date
      when 'yearly' then (occurrence.due_date + interval '1 year')::date
    end;
    update public.subscriptions
    set next_due_date = next_due
    where owner_id = principal and id = subscription.id;
  end if;
  return occurrence;
end;
$$;

revoke all on function public.create_own_subscription_occurrence(uuid) from public, anon;
revoke all on function public.transition_own_subscription_occurrence(uuid, integer, text) from public, anon;
grant execute on function public.create_own_subscription_occurrence(uuid) to authenticated;
grant execute on function public.transition_own_subscription_occurrence(uuid, integer, text) to authenticated;

commit;
