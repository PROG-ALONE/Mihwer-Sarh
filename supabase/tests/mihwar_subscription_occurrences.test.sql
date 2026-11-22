begin;

set local search_path = public, extensions;
select extensions.plan(10);

insert into public.mihwer_users(id) values
  ('00000000-0000-4000-8000-0000000a1301'),
  ('00000000-0000-4000-8000-0000000a1302');
insert into public.subscriptions(owner_id, id, name, amount, currency, cadence, next_due_date)
values
  ('00000000-0000-4000-8000-0000000a1301', '00000000-0000-4000-8000-0000000a1311', 'Monthly', 10, 'SAR', 'monthly', '2026-11-22'),
  ('00000000-0000-4000-8000-0000000a1302', '00000000-0000-4000-8000-0000000a1312', 'Other user', 20, 'SAR', 'weekly', '2026-11-27');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-0000000a1301"}', true);
select public.start_own_trial();

create temp table first_occurrence on commit drop as
select (public.create_own_subscription_occurrence('00000000-0000-4000-8000-0000000a1311')).*;
create temp table repeated_occurrence on commit drop as
select (public.create_own_subscription_occurrence('00000000-0000-4000-8000-0000000a1311')).*;

select extensions.is((select count(*)::integer from public.subscription_occurrences where subscription_id = '00000000-0000-4000-8000-0000000a1311'), 1,
  'repeated generation creates exactly one occurrence');
select extensions.is((select id from repeated_occurrence), (select id from first_occurrence),
  'repeated generation returns the existing occurrence');
select extensions.is((select period_start from first_occurrence), '2026-11-01'::date,
  'monthly recurrence uses the calendar month as its period key');
select extensions.throws_ok(
  $$select public.create_own_subscription_occurrence('00000000-0000-4000-8000-0000000a1312')$$,
  'P0002', 'subscription_not_found', 'a user cannot generate an occurrence for another user');

create temp table transitioned on commit drop as
with transition_result as materialized (
  select public.transition_own_subscription_occurrence(
    (select id from first_occurrence), 1, 'paid'
  ) as occurrence
)
select (transition_result.occurrence).* from transition_result;
select extensions.is((select status from transitioned), 'paid', 'the source occurrence status changes');
select extensions.is(
  (select next_due_date from public.subscriptions where id = '00000000-0000-4000-8000-0000000a1311'),
  '2026-12-22'::date, 'a completed monthly occurrence advances the source recurrence');
select extensions.is((select version from transitioned), 2, 'the occurrence version increments');
select extensions.throws_ok(
  $$select public.transition_own_subscription_occurrence((select id from first_occurrence), 1, 'skipped')$$,
  '40001', 'version_conflict', 'stale occurrence updates are rejected');
select extensions.is((select count(*)::integer from public.financial_transactions), 0,
  'recurrence does not create financial transactions');
select extensions.ok(
  has_function_privilege('authenticated', 'public.create_own_subscription_occurrence(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.create_own_subscription_occurrence(uuid)', 'EXECUTE'),
  'only authenticated requests may execute the occurrence generator');

rollback;
