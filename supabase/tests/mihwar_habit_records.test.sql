begin;

set local search_path = public, extensions;
set local timezone = 'UTC';
select extensions.plan(35);

insert into public.mihwer_users(id) values
  ('00000000-0000-4000-8000-000000000301'),
  ('00000000-0000-4000-8000-000000000302');
insert into public.user_access(owner_id, activated_until) values
  ('00000000-0000-4000-8000-000000000301', clock_timestamp() + interval '30 days'),
  ('00000000-0000-4000-8000-000000000302', clock_timestamp() + interval '30 days');
insert into public.journeys(id, owner_id, title, time_zone) values
  ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000301', 'Habit journey A', 'UTC'),
  ('00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000000302', 'Habit journey B', 'Pacific/Kiritimati');
insert into public.habits(id, owner_id, journey_id, name, start_date, frequency, days, status) values
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000301',
   '00000000-0000-4000-8000-000000000311', 'Daily', current_date - 60, 'daily', array[0,1,2,3,4,5,6]::smallint[], 'active'),
  ('00000000-0000-4000-8000-000000000322', '00000000-0000-4000-8000-000000000301',
   '00000000-0000-4000-8000-000000000311', 'Revised', current_date - 60, 'weekly',
   array[extract(dow from current_date - 3)::smallint], 'active'),
  ('00000000-0000-4000-8000-000000000323', '00000000-0000-4000-8000-000000000301',
   '00000000-0000-4000-8000-000000000311', 'Archived', current_date - 60, 'daily',
   array[0,1,2,3,4,5,6]::smallint[], 'archived'),
  ('00000000-0000-4000-8000-000000000324', '00000000-0000-4000-8000-000000000302',
   '00000000-0000-4000-8000-000000000312', 'Other user', current_date - 60, 'daily',
   array[0,1,2,3,4,5,6]::smallint[], 'active');
insert into public.habit_revisions(owner_id, habit_id, effective_date, frequency, days, target, unit) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000322',
   current_date - 2, 'custom', array[extract(dow from current_date - 1)::smallint], 1, 'times'),
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000322',
   current_date + 5, 'weekly', array[extract(dow from current_date)::smallint], 1, 'times');

select extensions.ok(not has_table_privilege('authenticated', 'public.habit_records', 'INSERT'),
  'authenticated callers cannot insert habit records directly');
select extensions.ok(not has_table_privilege('authenticated', 'public.habit_records', 'UPDATE'),
  'authenticated callers cannot update habit records directly');
select extensions.ok(not has_table_privilege('authenticated', 'public.habit_records', 'DELETE'),
  'authenticated callers cannot hard-delete habit records directly');
select extensions.ok(not has_function_privilege('anon', 'public.create_habit_record(uuid,date,text,numeric)', 'EXECUTE'),
  'anonymous callers cannot create records through the RPC');
select extensions.ok(has_function_privilege('authenticated', 'public.create_habit_record(uuid,date,text,numeric)', 'EXECUTE'),
  'authenticated callers can request a validated creation');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000301"}', true);
select extensions.throws_ok(
  $$insert into public.habit_records(owner_id, habit_id, local_date, status)
    values ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000321', current_date - 1, 'completed')$$,
  '42501', null, 'direct inserts are denied even with a matching owner');
select extensions.is(
  (select status from public.create_habit_record(
    '00000000-0000-4000-8000-000000000321', current_date - 1, 'partial', 0.5)),
  'partial', 'a valid daily record is created');
select extensions.is(
  (select count(*)::integer from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
  1, 'creation persists exactly one original record');
select extensions.is(
  (select version from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
  1, 'a new habit record starts at version one');
select extensions.is(
  (select count(*)::integer from public.audit_events
    where entity_type = 'habit_records' and action = 'insert'
      and entity_id = (select id from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321')
      and actor_id = '00000000-0000-4000-8000-000000000301'),
  1, 'habit creation records its verified actor in the audit log');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000321', current_date - 1, 'completed', null)$$,
  '23505', null, 'a second record for the same habit and date is rejected');
select extensions.is(
  (select version from public.update_habit_record(
    (select id from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
    1, true, 'completed', false, null)),
  2, 'a versioned status update succeeds and increments the version');
select extensions.is(
  (select amount from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
  0.5::numeric, 'changing status preserves the amount when it is omitted');
select extensions.is(
  (select count(*)::integer from public.audit_events
    where entity_type = 'habit_records' and action = 'update'
      and entity_id = (select id from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321')
      and actor_id = '00000000-0000-4000-8000-000000000301'),
  1, 'habit updates record their verified actor in the audit log');
select extensions.throws_ok(
  $$select * from public.update_habit_record(
      (select id from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
      1, true, 'skipped', false, null)$$,
  '40001', null, 'a stale version cannot overwrite a habit record');
select extensions.is(
  (select status from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
  'completed', 'the record remains unchanged after a version conflict');
select extensions.throws_ok(
  $$update public.habit_records set local_date = current_date where habit_id = '00000000-0000-4000-8000-000000000321'$$,
  '42501', null, 'direct updates cannot move a record to another date');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000324', current_date - 1, 'completed', null)$$,
  '22023', null, 'a user cannot create a record for another user habit');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000321', current_date + 1, 'completed', null)$$,
  '22023', null, 'a future date is rejected using the journey time zone');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000321', current_date - 61, 'completed', null)$$,
  '22023', null, 'a date before the habit start is rejected');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000323', current_date - 1, 'completed', null)$$,
  '22023', null, 'an archived habit cannot receive a record');
select extensions.lives_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000322', current_date - 1, 'completed', null)$$,
  'the revision effective on the date permits its scheduled weekday');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000322', current_date - 2, 'completed', null)$$,
  '22023', null, 'the effective revision rejects an unscheduled weekday');
select extensions.lives_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000322', current_date - 3, 'completed', null)$$,
  'the earlier date uses the original schedule instead of a later revision');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000321', current_date - 2, 'unknown', null)$$,
  '22023', null, 'unknown progress states are rejected');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000321', current_date - 2, 'partial', -1)$$,
  '22023', null, 'negative progress amounts are rejected');
select extensions.is(
  (select amount from public.update_habit_record(
    (select id from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
    2, false, null, true, null)),
  null::numeric, 'an explicitly supplied null amount clears the previous amount');
select extensions.throws_ok(
  $$select * from public.update_habit_record(
      (select id from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
      3, false, null, false, null)$$,
  '22023', null, 'an empty update is rejected');
select set_config('mihwer_test.record_id',
  (select id::text from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'), true);

reset role;
update public.user_access set suspended_at = clock_timestamp()
where owner_id = '00000000-0000-4000-8000-000000000301';
set local role authenticated;
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000321', current_date - 2, 'completed', null)$$,
  '42501', null, 'a suspended user cannot create habit records');
reset role;
update public.user_access set suspended_at = null
where owner_id = '00000000-0000-4000-8000-000000000301';
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000302"}', true);
select extensions.is(
  (select count(*)::integer from public.habit_records where habit_id = '00000000-0000-4000-8000-000000000321'),
  0, 'another user cannot read the original record');
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000321', current_date - 2, 'completed', null)$$,
  '22023', null, 'another user cannot write to the original habit');
select extensions.throws_ok(
  $$select * from public.update_habit_record(
      current_setting('mihwer_test.record_id')::uuid, 3, true, 'skipped', false, null)$$,
  '40001', null, 'another user cannot update the original record');
select extensions.lives_ok(
  $$select * from public.create_habit_record(
      '00000000-0000-4000-8000-000000000324',
      (clock_timestamp() at time zone 'Pacific/Kiritimati')::date, 'completed', null)$$,
  'the current date is taken from the journey time zone');
select extensions.throws_ok(
  $$select * from public.create_habit_record(
      '00000000-0000-4000-8000-000000000324',
      (clock_timestamp() at time zone 'Pacific/Kiritimati')::date + 1, 'completed', null)$$,
  '22023', null, 'tomorrow in the journey time zone is rejected');
select set_config('request.jwt.claims', '{}', true);
select extensions.throws_ok(
  $$select * from public.create_habit_record('00000000-0000-4000-8000-000000000324', current_date - 1, 'completed', null)$$,
  '42501', null, 'a caller without a verified principal cannot create a record');

select * from extensions.finish();
rollback;
