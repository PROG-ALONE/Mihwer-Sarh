begin;

set local search_path = public, extensions;
select extensions.plan(8);

insert into public.mihwer_users(id) values
  ('00000000-0000-4000-8000-0000000a1401'),
  ('00000000-0000-4000-8000-0000000a1402');
insert into public.attachments(owner_id, id, object_key, content_type, byte_size, checksum, state)
values (
  '00000000-0000-4000-8000-0000000a1401',
  '00000000-0000-4000-8000-0000000a1411',
  '00000000-0000-4000-8000-0000000a1401/00000000-0000-4000-8000-0000000a1411.txt',
  'text/plain', 1, repeat('0', 64), 'ready'
), (
  '00000000-0000-4000-8000-0000000a1402',
  '00000000-0000-4000-8000-0000000a1412',
  '00000000-0000-4000-8000-0000000a1402/00000000-0000-4000-8000-0000000a1412.txt',
  'text/plain', 1, repeat('0', 64), 'ready'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.attachments', 'INSERT')
  and has_table_privilege('authenticated', 'public.attachments', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.attachments', 'DELETE'),
  'authenticated owners may insert and transition metadata but cannot hard-delete it'
);
select extensions.ok(
  (select relrowsecurity and relforcerowsecurity
   from pg_catalog.pg_class where oid = 'public.attachments'::regclass),
  'attachment metadata remains protected by forced row-level security'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","mihwer_user_id":"00000000-0000-4000-8000-0000000a1401"}', true);

select extensions.is(
  public.start_own_trial() ->> 'status',
  'trial_active',
  'test owner must have a server-started active trial before accessing data'
);
select extensions.is(
  (select count(*)::integer from public.attachments),
  1,
  'owner reads only their own attachment metadata'
);
select extensions.is(
  (select count(*)::integer from public.attachments where id = '00000000-0000-4000-8000-0000000a1412'),
  0,
  'owner cannot read another user attachment metadata'
);
select extensions.lives_ok(
  $$insert into public.attachments(owner_id, id, object_key, content_type, byte_size, checksum)
    values ('00000000-0000-4000-8000-0000000a1401',
      '00000000-0000-4000-8000-0000000a1413',
      '00000000-0000-4000-8000-0000000a1401/00000000-0000-4000-8000-0000000a1413.txt',
      'text/plain', 1, repeat('1', 64))$$,
  'owner may create metadata for their own generated object path'
);
select extensions.throws_ok(
  $$insert into public.attachments(owner_id, id, object_key, content_type, byte_size, checksum)
    values ('00000000-0000-4000-8000-0000000a1402',
      '00000000-0000-4000-8000-0000000a1414',
      '00000000-0000-4000-8000-0000000a1402/00000000-0000-4000-8000-0000000a1414.txt',
      'text/plain', 1, repeat('2', 64))$$,
  '42501', null,
  'owner cannot create metadata for another user'
);
select extensions.lives_ok(
  $$update public.attachments set state = 'deleted', deleted_at = now()
    where id = '00000000-0000-4000-8000-0000000a1411'$$,
  'owner may record a soft-delete transition'
);

rollback;
