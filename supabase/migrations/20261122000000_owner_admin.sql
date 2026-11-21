-- Owner administration: owner grants, activation-code issuance, discount-code management, admin audit.
-- Owner rights are never granted through the API: bootstrap_owner is executable only by the database operator.

create table mihwer_private.owner_grants (
  owner_id uuid primary key references public.mihwer_users(id) on delete restrict,
  granted_at timestamptz not null default now(),
  granted_by text not null check (length(granted_by) between 1 and 120),
  revoked_at timestamptz
);
create unique index owner_grants_single_active on mihwer_private.owner_grants ((true)) where revoked_at is null;
revoke all on table mihwer_private.owner_grants from public, anon, authenticated;

create table public.admin_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.mihwer_users(id) on delete restrict,
  action text not null check (action ~ '^[a-z_]{3,60}$'),
  target_type text not null check (target_type in ('activation_code', 'discount_code', 'user_access', 'owner_grant')),
  target_id uuid,
  safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata) = 'object'),
  occurred_at timestamptz not null default now()
);
create index admin_audit_events_time on public.admin_audit_events(occurred_at desc);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash bytea not null unique check (octet_length(code_hash) = 32),
  label text not null check (length(label) between 1 and 80),
  discount_kind text not null check (discount_kind in ('percent', 'fixed')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer not null check (max_uses between 1 and 1000000),
  per_user_limit integer not null default 1 check (per_user_limit between 1 and 1000),
  use_count integer not null default 0 check (use_count between 0 and max_uses),
  disabled_at timestamptz,
  created_by uuid not null references public.mihwer_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (discount_kind <> 'percent' or (amount <= 100 and currency is null)),
  check (discount_kind <> 'fixed' or currency is not null),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index discount_codes_created_time on public.discount_codes(created_at desc);

-- Usage rows are written only by a future payment flow; no payment provider exists yet.
create table public.discount_code_uses (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.discount_codes(id) on delete restrict,
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  used_at timestamptz not null default now(),
  payment_reference text check (payment_reference is null or length(payment_reference) between 1 and 120)
);
create index discount_code_uses_code_time on public.discount_code_uses(code_id, used_at desc);

alter table public.admin_audit_events enable row level security;
alter table public.admin_audit_events force row level security;
alter table public.discount_codes enable row level security;
alter table public.discount_codes force row level security;
alter table public.discount_code_uses enable row level security;
alter table public.discount_code_uses force row level security;
revoke all on table public.admin_audit_events, public.discount_codes, public.discount_code_uses
  from public, anon, authenticated;

create or replace function mihwer_private.require_owner()
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
  if principal is null then raise exception using errcode = '42501', message = 'unauthenticated'; end if;
  if not exists (
    select 1 from mihwer_private.owner_grants g
    join public.mihwer_users u on u.id = g.owner_id
    where g.owner_id = principal and g.revoked_at is null and u.status = 'active' and u.deleted_at is null
  ) then
    raise exception using errcode = '42501', message = 'owner_required';
  end if;
  return principal;
end;
$$;
revoke all on function mihwer_private.require_owner() from public, anon, authenticated;

create or replace function mihwer_private.admin_audit(p_actor uuid, p_action text, p_target_type text, p_target uuid, p_metadata jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_audit_events(actor_id, action, target_type, target_id, safe_metadata)
  values (p_actor, p_action, p_target_type, p_target, coalesce(p_metadata, '{}'::jsonb));
$$;
revoke all on function mihwer_private.admin_audit(uuid, text, text, uuid, jsonb) from public, anon, authenticated;

-- 20 characters from a 32-symbol alphabet (100 bits) drawn from two strong-random UUIDs,
-- skipping the version and variant bytes.
create or replace function mihwer_private.random_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  source bytea := uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid());
  result text := '';
  position integer;
begin
  for position in 0..31 loop
    continue when position % 16 in (6, 8);
    result := result || substr(alphabet, (get_byte(source, position) & 31) + 1, 1);
    exit when length(result) = 20;
  end loop;
  return result;
end;
$$;
revoke all on function mihwer_private.random_code() from public, anon, authenticated;

create or replace function mihwer_private.code_hash(p_code text)
returns bytea
language sql
immutable
set search_path = ''
as $$
  select sha256(convert_to(upper(regexp_replace(p_code, '[\s-]', '', 'g')), 'UTF8'));
$$;
revoke all on function mihwer_private.code_hash(text) from public, anon, authenticated;

-- Operator-only bootstrap. Not granted to any API role; run from the SQL editor or CLI.
create or replace function mihwer_private.bootstrap_owner(p_owner uuid, p_granted_by text)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if exists (select 1 from mihwer_private.owner_grants where revoked_at is null) then
    raise exception using errcode = '42501', message = 'owner_already_bootstrapped';
  end if;
  if not exists (select 1 from public.mihwer_users u where u.id = p_owner and u.status = 'active' and u.deleted_at is null) then
    raise exception using errcode = '22023', message = 'owner_user_not_found';
  end if;
  insert into mihwer_private.owner_grants(owner_id, granted_by) values (p_owner, p_granted_by)
  on conflict (owner_id) do update set revoked_at = null, granted_at = now(), granted_by = excluded.granted_by;
  perform mihwer_private.admin_audit(p_owner, 'owner_bootstrapped', 'owner_grant', p_owner, jsonb_build_object('granted_by', p_granted_by));
end;
$$;
revoke all on function mihwer_private.bootstrap_owner(uuid, text) from public, anon, authenticated;

create or replace function public.get_own_owner_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid := mihwer_private.verified_user_id();
begin
  if principal is null then raise exception using errcode = '42501', message = 'unauthenticated'; end if;
  return jsonb_build_object('is_owner', exists (
    select 1 from mihwer_private.owner_grants g
    where g.owner_id = principal and g.revoked_at is null));
end;
$$;

create or replace function public.admin_issue_activation_code(p_duration_days integer, p_max_uses integer, p_valid_until timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  actor uuid := mihwer_private.require_owner();
  code text := mihwer_private.random_code();
  new_id uuid;
begin
  if p_valid_until is not null and p_valid_until <= statement_timestamp() then
    raise exception using errcode = '22023', message = 'valid_until_in_past';
  end if;
  insert into public.activation_codes(code_hash, duration_days, max_uses, valid_until, created_by)
  values (mihwer_private.code_hash(code), p_duration_days, p_max_uses, p_valid_until, actor)
  returning id into new_id;
  perform mihwer_private.admin_audit(actor, 'activation_code_issued', 'activation_code', new_id,
    jsonb_build_object('duration_days', p_duration_days, 'max_uses', p_max_uses, 'valid_until', p_valid_until));
  return jsonb_build_object('id', new_id, 'code', substr(code, 1, 5) || '-' || substr(code, 6, 5) || '-' || substr(code, 11, 5) || '-' || substr(code, 16, 5));
end;
$$;

create or replace function public.admin_disable_activation_code(p_code_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  actor uuid := mihwer_private.require_owner();
begin
  update public.activation_codes set disabled_at = coalesce(disabled_at, statement_timestamp()) where id = p_code_id;
  if not found then raise exception using errcode = '22023', message = 'activation_code_not_found'; end if;
  perform mihwer_private.admin_audit(actor, 'activation_code_disabled', 'activation_code', p_code_id, '{}'::jsonb);
  return jsonb_build_object('id', p_code_id, 'disabled', true);
end;
$$;

create or replace function public.admin_list_activation_codes(p_status text default 'all', p_limit integer default 50)
returns table (id uuid, duration_days integer, valid_until timestamptz, max_uses integer, use_count integer,
  disabled_at timestamptz, created_at timestamptz, status text)
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
begin
  perform mihwer_private.require_owner();
  return query
    select c.id, c.duration_days, c.valid_until, c.max_uses, c.use_count, c.disabled_at, c.created_at,
      case when c.disabled_at is not null then 'disabled'
        when c.valid_until is not null and c.valid_until <= statement_timestamp() then 'expired'
        when c.use_count >= c.max_uses then 'exhausted' else 'active' end
    from public.activation_codes c
    where p_status = 'all' or p_status = case when c.disabled_at is not null then 'disabled'
        when c.valid_until is not null and c.valid_until <= statement_timestamp() then 'expired'
        when c.use_count >= c.max_uses then 'exhausted' else 'active' end
    order by c.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

create or replace function public.admin_list_redemptions(p_code_id uuid default null, p_limit integer default 50)
returns table (code_id uuid, owner_id uuid, redeemed_at timestamptz, activation_expires_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
begin
  perform mihwer_private.require_owner();
  return query
    select r.code_id, r.owner_id, r.redeemed_at, r.activation_expires_at
    from public.activation_redemptions r
    where p_code_id is null or r.code_id = p_code_id
    order by r.redeemed_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

create or replace function public.admin_grant_access(p_owner uuid, p_days integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  actor uuid := mihwer_private.require_owner();
  expiry timestamptz;
begin
  if p_days is null or p_days not between 1 and 3650 then raise exception using errcode = '22023', message = 'invalid_duration'; end if;
  if not exists (select 1 from public.mihwer_users u where u.id = p_owner and u.deleted_at is null) then
    raise exception using errcode = '22023', message = 'user_not_found';
  end if;
  insert into public.user_access(owner_id) values (p_owner) on conflict (owner_id) do nothing;
  update public.user_access a
    set activated_until = greatest(coalesce(a.activated_until, statement_timestamp()), statement_timestamp()) + make_interval(days => p_days),
      updated_at = statement_timestamp()
    where a.owner_id = p_owner
    returning a.activated_until into expiry;
  perform mihwer_private.admin_audit(actor, 'access_granted', 'user_access', p_owner, jsonb_build_object('days', p_days));
  return jsonb_build_object('owner_id', p_owner, 'activated_until', expiry);
end;
$$;

create or replace function public.admin_set_suspension(p_owner uuid, p_suspended boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  actor uuid := mihwer_private.require_owner();
begin
  if p_owner = actor then raise exception using errcode = '22023', message = 'cannot_suspend_self'; end if;
  if not exists (select 1 from public.mihwer_users u where u.id = p_owner and u.deleted_at is null) then
    raise exception using errcode = '22023', message = 'user_not_found';
  end if;
  insert into public.user_access(owner_id) values (p_owner) on conflict (owner_id) do nothing;
  update public.user_access
    set suspended_at = case when p_suspended then coalesce(suspended_at, statement_timestamp()) else null end,
      updated_at = statement_timestamp()
    where owner_id = p_owner;
  perform mihwer_private.admin_audit(actor, case when p_suspended then 'access_suspended' else 'access_restored' end,
    'user_access', p_owner, '{}'::jsonb);
  return jsonb_build_object('owner_id', p_owner, 'suspended', p_suspended);
end;
$$;

create or replace function public.admin_access_overview(p_limit integer default 50)
returns table (owner_id uuid, status text, trial_started_at timestamptz, activated_until timestamptz, suspended_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
begin
  perform mihwer_private.require_owner();
  return query
    select u.id, mihwer_private.access_status(u.id), a.trial_started_at, a.activated_until, a.suspended_at
    from public.mihwer_users u
    left join public.user_access a on a.owner_id = u.id
    where u.deleted_at is null
    order by coalesce(a.updated_at, u.created_at) desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

create or replace function public.admin_issue_discount_code(p_label text, p_kind text, p_amount numeric, p_currency text,
  p_starts_at timestamptz, p_ends_at timestamptz, p_max_uses integer, p_per_user_limit integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  actor uuid := mihwer_private.require_owner();
  code text := mihwer_private.random_code();
  new_id uuid;
begin
  insert into public.discount_codes(code_hash, label, discount_kind, amount, currency, starts_at, ends_at, max_uses, per_user_limit, created_by)
  values (mihwer_private.code_hash(code), p_label, p_kind, p_amount, p_currency, p_starts_at, p_ends_at, p_max_uses, coalesce(p_per_user_limit, 1), actor)
  returning id into new_id;
  perform mihwer_private.admin_audit(actor, 'discount_code_issued', 'discount_code', new_id,
    jsonb_build_object('kind', p_kind, 'amount', p_amount, 'max_uses', p_max_uses));
  return jsonb_build_object('id', new_id, 'code', substr(code, 1, 5) || '-' || substr(code, 6, 5) || '-' || substr(code, 11, 5) || '-' || substr(code, 16, 5));
end;
$$;

create or replace function public.admin_disable_discount_code(p_code_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  actor uuid := mihwer_private.require_owner();
begin
  update public.discount_codes set disabled_at = coalesce(disabled_at, statement_timestamp()) where id = p_code_id;
  if not found then raise exception using errcode = '22023', message = 'discount_code_not_found'; end if;
  perform mihwer_private.admin_audit(actor, 'discount_code_disabled', 'discount_code', p_code_id, '{}'::jsonb);
  return jsonb_build_object('id', p_code_id, 'disabled', true);
end;
$$;

create or replace function public.admin_list_discount_codes(p_limit integer default 50)
returns table (id uuid, label text, discount_kind text, amount numeric, currency text, starts_at timestamptz, ends_at timestamptz,
  max_uses integer, per_user_limit integer, use_count integer, disabled_at timestamptz, created_at timestamptz, status text)
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
begin
  perform mihwer_private.require_owner();
  return query
    select d.id, d.label, d.discount_kind, d.amount, d.currency, d.starts_at, d.ends_at, d.max_uses, d.per_user_limit, d.use_count,
      d.disabled_at, d.created_at,
      case when d.disabled_at is not null then 'disabled'
        when d.ends_at is not null and d.ends_at <= statement_timestamp() then 'expired'
        when d.starts_at is not null and d.starts_at > statement_timestamp() then 'scheduled'
        when d.use_count >= d.max_uses then 'exhausted' else 'active' end
    from public.discount_codes d
    order by d.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

create or replace function public.admin_list_audit_events(p_limit integer default 50)
returns table (id bigint, actor_id uuid, action text, target_type text, target_id uuid, safe_metadata jsonb, occurred_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
begin
  perform mihwer_private.require_owner();
  return query
    select e.id, e.actor_id, e.action, e.target_type, e.target_id, e.safe_metadata, e.occurred_at
    from public.admin_audit_events e
    order by e.occurred_at desc, e.id desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

do $grants$
declare
  fn text;
begin
  foreach fn in array array[
    'public.get_own_owner_status()',
    'public.admin_issue_activation_code(integer, integer, timestamptz)',
    'public.admin_disable_activation_code(uuid)',
    'public.admin_list_activation_codes(text, integer)',
    'public.admin_list_redemptions(uuid, integer)',
    'public.admin_grant_access(uuid, integer)',
    'public.admin_set_suspension(uuid, boolean)',
    'public.admin_access_overview(integer)',
    'public.admin_issue_discount_code(text, text, numeric, text, timestamptz, timestamptz, integer, integer)',
    'public.admin_disable_discount_code(uuid)',
    'public.admin_list_discount_codes(integer)',
    'public.admin_list_audit_events(integer)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$grants$;
