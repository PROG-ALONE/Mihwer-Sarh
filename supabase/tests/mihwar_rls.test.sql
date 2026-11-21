begin;

select extensions.plan(30);

select extensions.is(
  (select count(*)::integer from pg_catalog.pg_class c
   join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relname in (
     'mihwer_users','sarh_identity_links','user_preferences','journeys','locations','paths','stations',
     'projects','goals','tasks','task_occurrences','task_subtasks','habits','habit_revisions','habit_records',
     'project_milestones','goal_project_links','goal_task_links','goal_habit_links','calendar_events',
     'daily_reflections','prayer_records','study_courses','study_lessons','study_sessions','activity_sessions',
     'sleep_records','meal_logs','notes','note_goal_links','note_task_links','note_project_links','attachments',
     'attachment_links','shopping_lists','shopping_items','subscriptions','subscription_occurrences',
     'financial_accounts','finance_categories','budgets','budget_category_limits','financial_transactions',
     'reminder_rules','notification_outbox','audit_events','idempotency_keys'
   )),
  47,
  'all 47 Mihwar tables exist'
);

select extensions.is(
  (select count(*)::integer from pg_catalog.pg_class c
   join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relname in (
     'mihwer_users','sarh_identity_links','user_preferences','journeys','locations','paths','stations',
     'projects','goals','tasks','task_occurrences','task_subtasks','habits','habit_revisions','habit_records',
     'project_milestones','goal_project_links','goal_task_links','goal_habit_links','calendar_events',
     'daily_reflections','prayer_records','study_courses','study_lessons','study_sessions','activity_sessions',
     'sleep_records','meal_logs','notes','note_goal_links','note_task_links','note_project_links','attachments',
     'attachment_links','shopping_lists','shopping_items','subscriptions','subscription_occurrences',
     'financial_accounts','finance_categories','budgets','budget_category_limits','financial_transactions',
     'reminder_rules','notification_outbox','audit_events','idempotency_keys'
   ) and c.relrowsecurity and c.relforcerowsecurity),
  47,
  'RLS is enabled and forced on all 47 tables'
);

select extensions.is(
  (select count(*)::integer from pg_catalog.pg_class c
   join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and c.relname in ('user_access', 'activation_codes', 'activation_redemptions')),
  3,
  'trial and activation tables exist'
);
select extensions.is(
  (select count(*)::integer from pg_catalog.pg_class c
   join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and c.relname in ('user_access', 'activation_codes', 'activation_redemptions')
     and c.relrowsecurity and c.relforcerowsecurity),
  3,
  'trial and activation tables enforce RLS'
);

insert into public.mihwer_users(id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into public.user_preferences(owner_id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into public.journeys(id, owner_id, title, time_zone) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Journey A', 'Asia/Riyadh'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000002', 'Journey B', 'Europe/London');

set local role authenticated;
select set_config('request.jwt.claims', '{}', true);

select extensions.is(
  (select count(*)::integer from public.journeys),
  0,
  'request without a verified principal sees no user data'
);
select extensions.throws_ok(
  $$insert into public.journeys(owner_id, title, time_zone)
    values ('00000000-0000-4000-8000-000000000001', 'No identity', 'Asia/Riyadh')$$,
  '42501',
  null,
  'request without a verified principal cannot write'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000001"}',
  true
);
select extensions.is(
  public.get_own_access_status() ->> 'status',
  'trial_not_started',
  'an eligible account begins without a trial until explicit activation'
);
select extensions.is(
  public.start_own_trial() ->> 'status',
  'trial_active',
  'the trial starts using server time and becomes active'
);
select extensions.throws_ok(
  $$select * from public.user_access$$,
  '42501',
  null,
  'clients cannot read internal trial access records'
);
select extensions.is(
  (select count(*)::integer from public.mihwer_users),
  1,
  'user A can resolve only the active profile matching the verified claim'
);
select extensions.is(
  (select count(*)::integer from public.journeys),
  1,
  'user A reads their own journey'
);
select extensions.is(
  (select count(*)::integer from public.journeys where title = 'Journey B'),
  0,
  'user A cannot read user B data'
);
select extensions.throws_ok(
  $$insert into public.journeys(owner_id, title, time_zone)
    values ('00000000-0000-4000-8000-000000000002', 'Spoofed owner', 'Asia/Riyadh')$$,
  '42501',
  null,
  'user A cannot write with user B owner id'
);
select extensions.throws_ok(
  $$insert into public.tasks(owner_id, journey_id, title, start_date)
    values ('00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000012', 'Cross-tenant task', current_date)$$,
  '23503',
  null,
  'composite foreign keys reject a parent owned by another user'
);
select extensions.throws_ok(
  $$select * from public.sarh_identity_links$$,
  '42501',
  null,
  'clients cannot read private Sarh identity links'
);
select extensions.throws_ok(
  $$select * from public.idempotency_keys$$,
  '42501',
  null,
  'clients cannot read private idempotency records'
);
select extensions.is(
  (with updated as (
    update public.journeys set title = 'Unauthorized change'
    where title = 'Journey B' returning id
  ) select count(*)::integer from updated),
  0,
  'user A cannot update user B rows by guessing an identifier'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000002"}',
  true
);
select public.start_own_trial();
select extensions.is(
  (select count(*)::integer from public.journeys),
  1,
  'user B reads their own journey'
);
select extensions.is(
  (select count(*)::integer from public.journeys where title = 'Journey A'),
  0,
  'user B cannot read user A data'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000001"}',
  true
);
select extensions.throws_ok(
  $$insert into public.prayer_records(owner_id, journey_id, local_date, time_zone, prayer_key)
    values ('00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000011', current_date, 'Asia/Riyadh', 'fajr')$$,
  '42501',
  null,
  'prayer records require explicit consent'
);
update public.user_preferences
set prayer_recording_consent_at = now()
where owner_id = '00000000-0000-4000-8000-000000000001';
select extensions.lives_ok(
  $$insert into public.prayer_records(owner_id, journey_id, local_date, time_zone, prayer_key)
    values ('00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000011', current_date, 'Asia/Riyadh', 'fajr')$$,
  'prayer record can be saved after consent'
);
update public.user_preferences
set prayer_recording_consent_at = null
where owner_id = '00000000-0000-4000-8000-000000000001';
select extensions.is(
  (select count(*)::integer from public.prayer_records),
  0,
  'revoked prayer consent hides sensitive rows'
);
select extensions.is(
  (select public.delete_own_prayer_records()),
  1,
  'owner may delete prayer records after revoking consent'
);

select extensions.throws_ok(
  $$insert into public.meal_logs(owner_id, journey_id, occurred_at, time_zone, meal_type, description)
    values ('00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000011', now(), 'Asia/Riyadh', 'lunch', 'Private test')$$,
  '42501',
  null,
  'health data requires explicit consent'
);
update public.user_preferences
set health_data_consent_at = now()
where owner_id = '00000000-0000-4000-8000-000000000001';
select extensions.lives_ok(
  $$insert into public.meal_logs(owner_id, journey_id, occurred_at, time_zone, meal_type, description)
    values ('00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000011', now(), 'Asia/Riyadh', 'lunch', 'Private test')$$,
  'health data can be saved after consent'
);
update public.user_preferences
set health_data_consent_at = null
where owner_id = '00000000-0000-4000-8000-000000000001';
select extensions.is(
  (select count(*)::integer from public.meal_logs),
  0,
  'revoked health consent hides sensitive rows'
);
select extensions.is(
  (select public.delete_own_health_records()),
  1,
  'owner may delete health records after revoking consent'
);

reset role;
update public.mihwer_users
set status = 'disabled'
where id = '00000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000002"}',
  true
);
select extensions.is(
  (select count(*)::integer from public.journeys),
  0,
  'disabled principals cannot use an otherwise valid identity claim'
);

reset role;
update public.user_access
set trial_started_at = statement_timestamp() - interval '73 hours',
    activated_until = null
where owner_id = '00000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-000000000001"}',
  true
);
select extensions.is(
  public.get_own_access_status() ->> 'status',
  'trial_expired',
  'trial expiry is computed from server time after exactly 72 hours'
);
select extensions.is(
  (select count(*)::integer from public.journeys),
  0,
  'expired trials cannot access protected user data'
);

select * from extensions.finish();
rollback;
