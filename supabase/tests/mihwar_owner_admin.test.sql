begin;

set local search_path = public, extensions;

select extensions.plan(30);

insert into public.mihwer_users(id) values
  ('00000000-0000-4000-8000-0000000a0201'),
  ('00000000-0000-4000-8000-0000000a0202'),
  ('00000000-0000-4000-8000-0000000a0203');

select extensions.lives_ok(
  $$select mihwer_private.bootstrap_owner('00000000-0000-4000-8000-0000000a0201', 'pgtap operator')$$,
  'the database operator can bootstrap the first owner'
);
select extensions.throws_ok(
  $$select mihwer_private.bootstrap_owner('00000000-0000-4000-8000-0000000a0202', 'second')$$,
  '42501', 'owner_already_bootstrapped',
  'a second active owner cannot be bootstrapped'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-0000000a0202"}', true);

select extensions.is((public.get_own_owner_status() ->> 'is_owner')::boolean, false, 'a regular user is not an owner');
select extensions.throws_ok($$select public.admin_issue_activation_code(30, 1, null)$$, '42501', 'owner_required',
  'a regular user cannot issue activation codes');
select extensions.throws_ok($$select * from public.admin_list_activation_codes()$$, '42501', 'owner_required',
  'a regular user cannot list activation codes');
select extensions.throws_ok($$select public.admin_grant_access('00000000-0000-4000-8000-0000000a0202', 365)$$, '42501', 'owner_required',
  'a regular user cannot grant access to self');
select extensions.throws_ok($$select * from public.admin_list_audit_events()$$, '42501', 'owner_required',
  'a regular user cannot read the admin audit log');
select extensions.throws_ok($$select mihwer_private.bootstrap_owner('00000000-0000-4000-8000-0000000a0202', 'self')$$, '42501', null,
  'the API role cannot call the operator bootstrap');
select extensions.throws_ok($$insert into mihwer_private.owner_grants(owner_id, granted_by) values ('00000000-0000-4000-8000-0000000a0202', 'x')$$,
  '42501', null, 'the API role cannot write owner grants');
select extensions.throws_ok($$select count(*) from public.activation_codes$$, '42501', null,
  'the API role cannot read activation code hashes directly');
select extensions.throws_ok($$select count(*) from public.discount_codes$$, '42501', null,
  'the API role cannot read discount codes directly');

select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select extensions.throws_ok($$select public.get_own_owner_status()$$, '42501', 'unauthenticated',
  'owner status requires a verified identity');

select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-0000000a0201"}', true);
select extensions.is((public.get_own_owner_status() ->> 'is_owner')::boolean, true, 'the bootstrapped owner is recognised');

create temp table issued on commit drop as select public.admin_issue_activation_code(30, 2, statement_timestamp() + interval '7 days') as r;
select extensions.matches((select r ->> 'code' from issued), '^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$', 'issued codes use the redeemable alphabet');
select extensions.is((select status from public.admin_list_activation_codes() where id = (select (r ->> 'id')::uuid from issued)), 'active',
  'the owner sees the new code as active');

reset role;
select extensions.is(
  (select code_hash from public.activation_codes where id = (select (r ->> 'id')::uuid from issued)),
  sha256(convert_to(replace((select r ->> 'code' from issued), '-', ''), 'UTF8')),
  'only the SHA-256 fingerprint of the code is stored'
);
select extensions.is(
  (select count(*)::integer from public.activation_codes c where position(convert_to(replace((select r ->> 'code' from issued), '-', ''), 'UTF8') in c.code_hash) > 0),
  0, 'the plaintext code is not stored'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-0000000a0202"}', true);
select extensions.is(
  public.redeem_activation_code(sha256(convert_to(replace((select r ->> 'code' from issued), '-', ''), 'UTF8'))) ->> 'status',
  'activated', 'a user redeems the owner-issued code'
);

select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-0000000a0201"}', true);
select extensions.is((select count(*)::integer from public.admin_list_redemptions((select (r ->> 'id')::uuid from issued))), 1,
  'the owner sees the redemption log');
select extensions.lives_ok($$select public.admin_disable_activation_code((select (r ->> 'id')::uuid from issued))$$,
  'the owner disables a code');

select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-0000000a0203"}', true);
select extensions.throws_ok(
  $$select public.redeem_activation_code(sha256(convert_to(replace((select r ->> 'code' from issued), '-', ''), 'UTF8')))$$,
  '22023', 'invalid_activation_code', 'a disabled code cannot be redeemed'
);

select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-0000000a0201"}', true);
select extensions.ok((public.admin_grant_access('00000000-0000-4000-8000-0000000a0203', 10) ->> 'activated_until')::timestamptz
  > statement_timestamp() + interval '9 days', 'the owner grants a specific user an activation period');
select extensions.is((public.admin_set_suspension('00000000-0000-4000-8000-0000000a0203', true) ->> 'suspended')::boolean, true,
  'the owner suspends a user');
select extensions.is((select status from public.admin_access_overview() where owner_id = '00000000-0000-4000-8000-0000000a0203'), 'suspended',
  'the access overview reports the suspension');
select extensions.throws_ok($$select public.admin_set_suspension('00000000-0000-4000-8000-0000000a0201', true)$$, '22023', 'cannot_suspend_self',
  'the owner cannot lock themselves out');

select extensions.matches(
  public.admin_issue_discount_code('Launch', 'percent', 20, null, null, statement_timestamp() + interval '30 days', 100, 1) ->> 'code',
  '^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$', 'the owner issues a percentage discount code');
select extensions.throws_ok($$select public.admin_issue_discount_code('Bad', 'percent', 150, null, null, null, 10, 1)$$, '23514', null,
  'a percentage discount above 100 is rejected');
select extensions.throws_ok($$select public.admin_issue_discount_code('Bad', 'fixed', 10, null, null, null, 10, 1)$$, '23514', null,
  'a fixed discount requires a currency');
select extensions.is((select count(*)::integer from public.admin_list_discount_codes() where status = 'active'), 1,
  'the owner lists active discount codes');

select extensions.ok(
  (select array_agg(action order by id) from public.admin_list_audit_events(200))
    @> array['owner_bootstrapped', 'activation_code_issued', 'activation_code_disabled', 'access_granted', 'access_suspended', 'discount_code_issued'],
  'every administrative action is recorded in the admin audit log'
);

select * from extensions.finish();
rollback;
