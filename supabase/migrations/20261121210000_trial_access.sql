create table public.user_access (
  owner_id uuid primary key references public.mihwer_users(id) on delete restrict,
  trial_started_at timestamptz,
  activated_until timestamptz,
  suspended_at timestamptz,
  updated_at timestamptz not null default now(),
  check (activated_until is null or activated_until > 'epoch'::timestamptz)
);

create table public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash bytea not null unique check (octet_length(code_hash) = 32),
  duration_days integer not null check (duration_days between 1 and 3650),
  valid_until timestamptz,
  max_uses integer not null check (max_uses between 1 and 1000000),
  use_count integer not null default 0 check (use_count between 0 and max_uses),
  disabled_at timestamptz,
  created_by uuid not null references public.mihwer_users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.activation_redemptions (
  code_id uuid not null references public.activation_codes(id) on delete restrict,
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  redeemed_at timestamptz not null default now(),
  activation_expires_at timestamptz not null,
  primary key (code_id, owner_id)
);

create index activation_redemptions_owner_time on public.activation_redemptions(owner_id, redeemed_at desc);
create index activation_codes_created_time on public.activation_codes(created_at desc);

alter table public.user_access enable row level security;
alter table public.user_access force row level security;
alter table public.activation_codes enable row level security;
alter table public.activation_codes force row level security;
alter table public.activation_redemptions enable row level security;
alter table public.activation_redemptions force row level security;
revoke all on table public.user_access, public.activation_codes, public.activation_redemptions
  from public, anon, authenticated;

create or replace function mihwer_private.verified_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
declare
  claim text;
  principal uuid;
begin
  claim := auth.jwt() ->> 'mihwer_user_id';
  if claim is null or claim = '' then
    return null;
  end if;
  principal := claim::uuid;
  if not exists (
    select 1 from public.mihwer_users u
    where u.id = principal and u.deleted_at is null
  ) then
    return null;
  end if;
  return principal;
exception
  when invalid_text_representation then
    return null;
end;
$$;
revoke all on function mihwer_private.verified_user_id() from public, anon, authenticated;

create or replace function mihwer_private.access_status(principal uuid)
returns text
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select case
    when u.status <> 'active' or a.suspended_at is not null then 'suspended'
    when a.activated_until > statement_timestamp() then 'activated'
    when a.trial_started_at is null then 'trial_not_started'
    when a.trial_started_at + interval '72 hours' > statement_timestamp() then 'trial_active'
    else 'trial_expired'
  end
  from public.mihwer_users u
  left join public.user_access a on a.owner_id = u.id
  where u.id = principal and u.deleted_at is null
$$;
revoke all on function mihwer_private.access_status(uuid) from public, anon, authenticated;

create or replace function mihwer_private.current_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
begin
  principal := mihwer_private.verified_user_id();
  if principal is null then return null; end if;
  if mihwer_private.access_status(principal) not in ('trial_active', 'activated') then
    return null;
  end if;
  return principal;
end;
$$;
revoke all on function mihwer_private.current_user_id() from public, anon;
grant execute on function mihwer_private.current_user_id() to authenticated;

create or replace function public.get_own_access_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
  state text;
  trial_start timestamptz;
  activation_end timestamptz;
begin
  principal := mihwer_private.verified_user_id();
  if principal is null then raise exception using errcode = '42501', message = 'unauthenticated'; end if;
  state := mihwer_private.access_status(principal);
  select a.trial_started_at, a.activated_until into trial_start, activation_end
  from public.user_access a where a.owner_id = principal;
  return jsonb_build_object(
    'status', state,
    'trial_started_at', trial_start,
    'trial_expires_at', case when trial_start is null then null else trial_start + interval '72 hours' end,
    'activated_until', activation_end
  );
end;
$$;

create or replace function public.start_own_trial()
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
begin
  principal := mihwer_private.verified_user_id();
  if principal is null then raise exception using errcode = '42501', message = 'unauthenticated'; end if;
  if not exists (select 1 from public.mihwer_users u where u.id = principal and u.status = 'active' and u.deleted_at is null) then
    raise exception using errcode = '42501', message = 'account_suspended';
  end if;
  insert into public.user_access(owner_id, trial_started_at)
  values (principal, statement_timestamp())
  on conflict (owner_id) do update
    set trial_started_at = coalesce(public.user_access.trial_started_at, excluded.trial_started_at),
        updated_at = statement_timestamp();
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
  code_row public.activation_codes%rowtype;
  expiry timestamptz;
begin
  principal := mihwer_private.verified_user_id();
  if principal is null then raise exception using errcode = '42501', message = 'unauthenticated'; end if;
  if octet_length(p_code_hash) <> 32 then raise exception using errcode = '22023', message = 'invalid_activation_code'; end if;
  if not exists (select 1 from public.mihwer_users u where u.id = principal and u.status = 'active' and u.deleted_at is null) then
    raise exception using errcode = '42501', message = 'account_suspended';
  end if;
  update public.activation_codes c
    set use_count = c.use_count + 1
    where c.code_hash = p_code_hash
      and c.disabled_at is null
      and (c.valid_until is null or c.valid_until > statement_timestamp())
      and c.use_count < c.max_uses
      and not exists (
        select 1 from public.activation_redemptions r
        where r.code_id = c.id and r.owner_id = principal
      )
    returning c.* into code_row;
  if not found then raise exception using errcode = '22023', message = 'invalid_activation_code'; end if;

  insert into public.user_access(owner_id)
  values (principal)
  on conflict (owner_id) do nothing;
  update public.user_access a
    set activated_until = greatest(coalesce(a.activated_until, statement_timestamp()), statement_timestamp())
      + make_interval(days => code_row.duration_days),
      updated_at = statement_timestamp()
    where a.owner_id = principal
    returning a.activated_until into expiry;
  insert into public.activation_redemptions(code_id, owner_id, activation_expires_at)
  values (code_row.id, principal, expiry);
  return public.get_own_access_status();
end;
$$;

revoke all on function public.get_own_access_status() from public, anon;
revoke all on function public.start_own_trial() from public, anon;
revoke all on function public.redeem_activation_code(bytea) from public, anon;
grant execute on function public.get_own_access_status() to authenticated;
grant execute on function public.start_own_trial() to authenticated;
grant execute on function public.redeem_activation_code(bytea) to authenticated;

comment on table public.user_access is
  'Server-timestamped access state. Trial starts once and lasts exactly 72 hours; data is retained after expiry.';
comment on table public.activation_codes is
  'Contains only SHA-256 hashes of high-entropy activation codes; raw codes are never persisted.';
