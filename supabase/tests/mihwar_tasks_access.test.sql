begin;

set local search_path = public, extensions;

select extensions.plan(50);

insert into public.mihwer_users(id) values
  ('00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000000102');
insert into public.journeys(id, owner_id, title, time_zone) values
  ('00000000-0000-4000-8000-000000000111', '00000000-0000-4000-8000-000000000101', 'Journey A', 'UTC'),
  ('00000000-0000-4000-8000-000000000112', '00000000-0000-4000-8000-000000000102', 'Journey B', 'UTC');
insert into public.tasks(id, owner_id, journey_id, title, start_date) values
  ('00000000-0000-4000-8000-000000000122', '00000000-0000-4000-8000-000000000102',
   '00000000-0000-4000-8000-000000000112', 'Task B', current_date);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000101"}',
  true
);

select extensions.is(
  public.get_own_access_status() ->> 'status',
  'trial_not_started',
  'access remains closed until the user starts a trial'
);
select extensions.throws_ok(
  $$insert into public.tasks(owner_id, journey_id, title, start_date)
    values ('00000000-0000-4000-8000-000000000101',
      '00000000-0000-4000-8000-000000000111', 'Before trial', current_date)$$,
  '42501', null,
  'task writes are denied before the trial starts'
);
select extensions.is(
  public.start_own_trial() ->> 'status',
  'trial_active',
  'starting the trial enables access'
);
select extensions.is(
  (public.get_own_access_status() ->> 'trial_expires_at')::timestamptz
    - (public.get_own_access_status() ->> 'trial_started_at')::timestamptz,
  interval '72 hours',
  'trial duration is exactly 72 server hours'
);
select extensions.lives_ok(
  $$insert into public.tasks(id, owner_id, journey_id, title, start_date)
    values ('00000000-0000-4000-8000-000000000121', '00000000-0000-4000-8000-000000000101',
      '00000000-0000-4000-8000-000000000111', 'Task A', current_date)$$,
  'an active user can create a task'
);
select extensions.is(
  (select title from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  'Task A',
  'the owner can read the original task'
);
select extensions.is(
  (select version from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  1,
  'a new task starts at version one'
);
select extensions.lives_ok(
  $$update public.tasks set title = 'Updated task'
    where id = '00000000-0000-4000-8000-000000000121'$$,
  'the owner can edit the task'
);
select extensions.is(
  (select title from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  'Updated task',
  'the edited title is persisted'
);
select extensions.is(
  (select version from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  2,
  'editing advances the task version'
);
select extensions.lives_ok(
  $$update public.tasks set status = 'completed'
    where id = '00000000-0000-4000-8000-000000000121'$$,
  'the owner can complete the task'
);
select extensions.is(
  (select status from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  'completed',
  'completion is stored on the original task'
);
select extensions.is(
  (select version from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  3,
  'completion advances the task version'
);
select extensions.is(
  (select count(*)::integer from public.audit_events
    where entity_type = 'tasks' and entity_id = '00000000-0000-4000-8000-000000000121'),
  3,
  'task creation and updates are audited'
);
select extensions.throws_ok(
  $$update public.tasks set owner_id = '00000000-0000-4000-8000-000000000102'
    where id = '00000000-0000-4000-8000-000000000121'$$,
  '42501', null,
  'a task cannot be transferred to another owner'
);
select extensions.throws_ok(
  $$insert into public.tasks(owner_id, journey_id, title, start_date)
    values ('00000000-0000-4000-8000-000000000101',
      '00000000-0000-4000-8000-000000000112', 'Wrong journey', current_date)$$,
  '23503', null,
  'a task cannot reference another owner journey'
);
select extensions.throws_ok(
  $$update public.tasks set status = 'unknown'
    where id = '00000000-0000-4000-8000-000000000121'$$,
  '23514', null,
  'task status constraints are enforced'
);
select extensions.throws_ok(
  $$update public.tasks set due_date = start_date - 1
    where id = '00000000-0000-4000-8000-000000000121'$$,
  '23514', null,
  'task date constraints are enforced'
);
select extensions.throws_ok(
  $$select * from public.user_access$$,
  '42501', null,
  'the client cannot read trial records directly'
);
select extensions.throws_ok(
  $$update public.user_access set trial_started_at = now()
    where owner_id = '00000000-0000-4000-8000-000000000101'$$,
  '42501', null,
  'the client cannot change the server trial start time'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000101","user_id":"00000000-0000-4000-8000-000000000102"}',
  true
);
select extensions.is(
  (select count(*)::integer from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  1,
  'an unrelated client user_id does not override the verified claim'
);
select extensions.is(
  (select count(*)::integer from public.tasks where id = '00000000-0000-4000-8000-000000000122'),
  0,
  'the unrelated client user_id does not expose another user task'
);

select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select extensions.is(
  (select count(*)::integer from public.tasks),
  0,
  'an absent principal cannot read tasks'
);
select extensions.throws_ok(
  $$select public.start_own_trial()$$,
  '42501', null,
  'an absent principal cannot start a trial'
);
select set_config('request.jwt.claims', '{"role":"authenticated","mihwer_user_id":"not-a-uuid"}', true);
select extensions.is(
  (select count(*)::integer from public.tasks),
  0,
  'a malformed principal cannot read tasks'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000102"}',
  true
);
select extensions.is(
  public.start_own_trial() ->> 'status',
  'trial_active',
  'a second user can start their own trial'
);
select extensions.is(
  (select count(*)::integer from public.tasks where id = '00000000-0000-4000-8000-000000000122'),
  1,
  'the second user can read their own task'
);
select extensions.is(
  (select count(*)::integer from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  0,
  'the second user cannot read the first user task'
);
with affected as (
  update public.tasks set title = 'Cross-owner edit'
  where id = '00000000-0000-4000-8000-000000000121'
  returning id
)
select extensions.is(
  (select count(*)::integer from affected),
  0,
  'the second user cannot update the first user task'
);
select extensions.throws_ok(
  $$insert into public.tasks(owner_id, journey_id, title, start_date)
    values ('00000000-0000-4000-8000-000000000101',
      '00000000-0000-4000-8000-000000000111', 'Forged owner', current_date)$$,
  '42501', null,
  'the second user cannot create a task for the first owner'
);

reset role;
update public.user_access
set trial_started_at = statement_timestamp() - interval '72 hours'
where owner_id = '00000000-0000-4000-8000-000000000101';
insert into public.activation_codes(id, code_hash, duration_days, valid_until, max_uses, created_by) values
  ('00000000-0000-4000-8000-000000000131', decode(repeat('ab', 32), 'hex'), 2,
    statement_timestamp() + interval '1 day', 1, '00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000000132', decode(repeat('cd', 32), 'hex'), 2,
    statement_timestamp() - interval '1 day', 1, '00000000-0000-4000-8000-000000000101');
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000101"}',
  true
);
select extensions.is(
  public.get_own_access_status() ->> 'status',
  'trial_expired',
  'the trial expires at the 72-hour boundary'
);
select extensions.is(
  (select count(*)::integer from public.tasks),
  0,
  'expired access hides previously saved tasks'
);
select extensions.is(
  public.start_own_trial() ->> 'status',
  'trial_expired',
  'starting a trial again does not restart an expired trial'
);
select extensions.throws_ok(
  $$select public.redeem_activation_code(decode(repeat('cd', 32), 'hex'))$$,
  '22023', null,
  'an expired activation code is rejected'
);
select extensions.is(
  public.redeem_activation_code(decode(repeat('ab', 32), 'hex')) ->> 'status',
  'activated',
  'a valid activation restores access after the trial'
);
select extensions.is(
  (select status from public.tasks where id = '00000000-0000-4000-8000-000000000121'),
  'completed',
  'activation restores access to the unchanged completed task'
);
select extensions.throws_ok(
  $$select public.redeem_activation_code(decode(repeat('ab', 32), 'hex'))$$,
  '22023', null,
  'a single-use activation cannot be redeemed twice'
);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000102"}',
  true
);
select extensions.throws_ok(
  $$select public.redeem_activation_code(decode(repeat('ab', 32), 'hex'))$$,
  '22023', null,
  'another user cannot exceed the activation use limit'
);
reset role;
select extensions.is(
  (select use_count from public.activation_codes where id = '00000000-0000-4000-8000-000000000131'),
  1,
  'the activation use counter remains within its limit'
);
select extensions.is(
  (select count(*)::integer from public.activation_redemptions
    where code_id = '00000000-0000-4000-8000-000000000131'),
  1,
  'only one activation redemption is recorded'
);
update public.user_access
set suspended_at = statement_timestamp()
where owner_id = '00000000-0000-4000-8000-000000000101';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000101"}',
  true
);
select extensions.is(
  public.get_own_access_status() ->> 'status',
  'suspended',
  'suspension takes precedence over an active code'
);
select extensions.is(
  (select count(*)::integer from public.tasks),
  0,
  'suspension hides protected tasks without deleting them'
);
select extensions.is(
  public.start_own_trial() ->> 'status',
  'suspended',
  'restarting a trial does not bypass suspension'
);

reset role;
insert into public.activation_codes(id, code_hash, duration_days, max_uses, created_by)
values (
  '00000000-0000-4000-8000-000000000133', decode(repeat('ef', 32), 'hex'), 2, 1,
  '00000000-0000-4000-8000-000000000101'
);
set local role authenticated;
select extensions.throws_ok(
  $$select public.redeem_activation_code(decode(repeat('ef', 32), 'hex'))$$,
  '42501', null,
  'a suspended account cannot redeem an activation code'
);
reset role;
select extensions.is(
  (select use_count from public.activation_codes where id = '00000000-0000-4000-8000-000000000133'),
  0,
  'a suspended redemption does not consume a code use'
);
select extensions.is(
  (select count(*)::integer from public.activation_redemptions
    where code_id = '00000000-0000-4000-8000-000000000133'),
  0,
  'a suspended redemption does not create a redemption record'
);
update public.user_access set suspended_at = null
where owner_id = '00000000-0000-4000-8000-000000000101';
set local role authenticated;
select extensions.is(
  public.redeem_activation_code(decode(repeat('ef', 32), 'hex')) ->> 'status',
  'activated',
  'the same code remains usable after suspension is lifted'
);

reset role;
insert into public.mihwer_users(id) values ('00000000-0000-4000-8000-000000000103');
insert into public.user_access(owner_id, suspended_at)
values ('00000000-0000-4000-8000-000000000103', statement_timestamp());
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000103"}',
  true
);
select extensions.is(
  public.start_own_trial() ->> 'status',
  'suspended',
  'a suspended account cannot start its trial'
);
reset role;
select extensions.is(
  (select trial_started_at from public.user_access
    where owner_id = '00000000-0000-4000-8000-000000000103'),
  null::timestamptz,
  'suspension does not consume an unused trial'
);
update public.user_access set suspended_at = null
where owner_id = '00000000-0000-4000-8000-000000000103';
set local role authenticated;
select extensions.is(
  public.start_own_trial() ->> 'status',
  'trial_active',
  'an unused trial can start after suspension is lifted'
);

select * from extensions.finish();
rollback;
