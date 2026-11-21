create or replace function mihwer_private.validate_habit_record_day(
  principal uuid,
  habit_id uuid,
  record_date date
)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  habit public.habits%rowtype;
  journey_zone text;
  selected_frequency text;
  selected_days smallint[];
begin
  if principal is null then
    raise exception using errcode = '42501', message = 'access_required';
  end if;
  if habit_id is null or record_date is null then
    raise exception using errcode = '22023', message = 'invalid_habit_record';
  end if;

  select h.* into habit from public.habits h
  where h.id = habit_id and h.owner_id = principal
  for update;
  if not found or habit.status <> 'active' or habit.deleted_at is not null then
    raise exception using errcode = '22023', message = 'invalid_habit_record';
  end if;
  select j.time_zone into journey_zone from public.journeys j
  where j.id = habit.journey_id and j.owner_id = principal
    and j.status = 'active' and j.deleted_at is null;
  if not found or record_date > (clock_timestamp() at time zone journey_zone)::date
      or record_date < habit.start_date
      or (habit.end_date is not null and record_date > habit.end_date) then
    raise exception using errcode = '22023', message = 'invalid_habit_record';
  end if;

  select r.frequency, r.days into selected_frequency, selected_days
  from public.habit_revisions r
  where r.owner_id = principal and r.habit_id = habit.id and r.effective_date <= record_date
  order by r.effective_date desc limit 1;
  if not found then
    selected_frequency := habit.frequency;
    selected_days := habit.days;
  end if;
  if selected_frequency <> 'daily'
      and not (extract(dow from record_date)::smallint = any(selected_days)) then
    raise exception using errcode = '22023', message = 'invalid_habit_record';
  end if;
end;
$$;
revoke all on function mihwer_private.validate_habit_record_day(uuid, uuid, date) from public, anon, authenticated;

create or replace function public.create_habit_record(
  p_habit_id uuid,
  p_local_date date,
  p_status text,
  p_amount numeric default null
)
returns setof public.habit_records
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
begin
  principal := mihwer_private.current_user_id();
  perform mihwer_private.validate_habit_record_day(principal, p_habit_id, p_local_date);
  if p_status is null or p_status not in ('completed', 'partial', 'skipped')
      or (p_amount is not null and (p_amount < 0 or p_amount = 'NaN'::numeric)) then
    raise exception using errcode = '22023', message = 'invalid_habit_record';
  end if;
  return query
    insert into public.habit_records(owner_id, habit_id, local_date, status, amount)
    values (principal, p_habit_id, p_local_date, p_status, p_amount)
    returning *;
end;
$$;

create or replace function public.update_habit_record(
  p_record_id uuid,
  p_expected_version integer,
  p_set_status boolean,
  p_status text,
  p_set_amount boolean,
  p_amount numeric
)
returns setof public.habit_records
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
  target_habit_id uuid;
  target_date date;
  saved public.habit_records%rowtype;
begin
  principal := mihwer_private.current_user_id();
  if principal is null then
    raise exception using errcode = '42501', message = 'access_required';
  end if;
  if p_record_id is null or p_expected_version is null or p_expected_version < 1
      or p_set_status is null or p_set_amount is null
      or not (p_set_status or p_set_amount)
      or (p_set_status and (p_status is null or p_status not in ('completed', 'partial', 'skipped')))
      or (p_set_amount and p_amount is not null and (p_amount < 0 or p_amount = 'NaN'::numeric)) then
    raise exception using errcode = '22023', message = 'invalid_habit_record';
  end if;

  select r.habit_id, r.local_date into target_habit_id, target_date
  from public.habit_records r where r.id = p_record_id and r.owner_id = principal;
  if not found then
    raise exception using errcode = '40001', message = 'version_conflict';
  end if;
  perform mihwer_private.validate_habit_record_day(principal, target_habit_id, target_date);
  update public.habit_records r
    set status = case when p_set_status then p_status else r.status end,
        amount = case when p_set_amount then p_amount else r.amount end
    where r.id = p_record_id and r.owner_id = principal
      and r.habit_id = target_habit_id and r.local_date = target_date
      and r.version = p_expected_version
    returning r.* into saved;
  if not found then
    raise exception using errcode = '40001', message = 'version_conflict';
  end if;
  return next saved;
end;
$$;

revoke insert, update, delete on table public.habit_records from authenticated;
revoke all on function public.create_habit_record(uuid, date, text, numeric) from public, anon;
revoke all on function public.update_habit_record(uuid, integer, boolean, text, boolean, numeric) from public, anon;
grant execute on function public.create_habit_record(uuid, date, text, numeric) to authenticated;
grant execute on function public.update_habit_record(uuid, integer, boolean, text, boolean, numeric) to authenticated;
