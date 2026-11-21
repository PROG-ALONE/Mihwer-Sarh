create or replace function public.start_own_trial()
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
  suspended timestamptz;
begin
  principal := mihwer_private.verified_user_id();
  if principal is null then raise exception using errcode = '42501', message = 'unauthenticated'; end if;
  perform 1 from public.mihwer_users u
  where u.id = principal and u.status = 'active' and u.deleted_at is null
  for update;
  if not found then raise exception using errcode = '42501', message = 'account_suspended'; end if;

  insert into public.user_access(owner_id) values (principal)
  on conflict (owner_id) do nothing;
  select a.suspended_at into suspended from public.user_access a
  where a.owner_id = principal for update;
  if suspended is null then
    update public.user_access a
      set trial_started_at = coalesce(a.trial_started_at, clock_timestamp()),
          updated_at = clock_timestamp()
      where a.owner_id = principal;
  end if;
  return public.get_own_access_status();
end;
$$;

create or replace function public.redeem_activation_code(p_code_hash bytea)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
  suspended timestamptz;
  code_row public.activation_codes%rowtype;
  redeemed_time timestamptz;
  expiry timestamptz;
begin
  principal := mihwer_private.verified_user_id();
  if principal is null then raise exception using errcode = '42501', message = 'unauthenticated'; end if;
  if p_code_hash is null or octet_length(p_code_hash) <> 32 then
    raise exception using errcode = '22023', message = 'invalid_activation_code';
  end if;

  perform 1 from public.mihwer_users u
  where u.id = principal and u.status = 'active' and u.deleted_at is null
  for update;
  if not found then raise exception using errcode = '42501', message = 'account_suspended'; end if;

  insert into public.user_access(owner_id) values (principal)
  on conflict (owner_id) do nothing;
  select a.suspended_at into suspended from public.user_access a
  where a.owner_id = principal for update;
  if suspended is not null then
    raise exception using errcode = '42501', message = 'account_suspended';
  end if;

  select c.* into code_row from public.activation_codes c
  where c.code_hash = p_code_hash for update;
  if not found then raise exception using errcode = '22023', message = 'invalid_activation_code'; end if;
  redeemed_time := clock_timestamp();
  if code_row.disabled_at is not null
      or (code_row.valid_until is not null and code_row.valid_until <= redeemed_time)
      or code_row.use_count >= code_row.max_uses
      or exists (
        select 1 from public.activation_redemptions r
        where r.code_id = code_row.id and r.owner_id = principal
      ) then
    raise exception using errcode = '22023', message = 'invalid_activation_code';
  end if;

  update public.activation_codes set use_count = use_count + 1 where id = code_row.id;
  update public.user_access a
    set activated_until = greatest(coalesce(a.activated_until, redeemed_time), redeemed_time)
      + make_interval(days => code_row.duration_days),
      updated_at = redeemed_time
    where a.owner_id = principal
    returning a.activated_until into expiry;
  insert into public.activation_redemptions(code_id, owner_id, redeemed_at, activation_expires_at)
  values (code_row.id, principal, redeemed_time, expiry);
  return public.get_own_access_status();
end;
$$;

revoke all on function public.start_own_trial() from public, anon;
revoke all on function public.redeem_activation_code(bytea) from public, anon;
grant execute on function public.start_own_trial() to authenticated;
grant execute on function public.redeem_activation_code(bytea) to authenticated;
