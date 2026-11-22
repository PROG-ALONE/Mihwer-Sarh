begin;

set local search_path = public, extensions;

select extensions.plan(6);

-- Legacy Sarh store objects exist only in the hosted project; each check also passes when they are absent.
select extensions.ok(
  to_regprocedure('public.create_store_profile()') is null
    or not has_function_privilege('anon', 'public.create_store_profile()', 'execute'),
  'anon cannot execute create_store_profile'
);

select extensions.ok(
  to_regprocedure('public.create_store_profile()') is null
    or not has_function_privilege('authenticated', 'public.create_store_profile()', 'execute'),
  'authenticated cannot execute create_store_profile'
);

select extensions.ok(
  to_regprocedure('public.rls_auto_enable()') is null
    or (not has_function_privilege('anon', 'public.rls_auto_enable()', 'execute')
      and not has_function_privilege('authenticated', 'public.rls_auto_enable()', 'execute')),
  'API roles cannot execute rls_auto_enable'
);

select extensions.ok(
  to_regprocedure('public.create_store_profile()') is null
    or exists (
      select 1 from pg_proc
      where oid = to_regprocedure('public.create_store_profile()')
        and proconfig @> array['search_path=""']
    ),
  'create_store_profile runs with an empty search_path'
);

select extensions.ok(
  to_regprocedure('public.create_store_profile()') is null
    or position('to_regclass' in pg_get_functiondef(to_regprocedure('public.create_store_profile()'))) > 0,
  'create_store_profile skips the store insert when public.profiles is absent'
);

select extensions.ok(
  to_regclass('auth.users') is null
    or to_regclass('public.profiles') is not null
    or not exists (
      select 1 from pg_trigger
      where tgrelid = to_regclass('auth.users') and not tgisinternal and tgenabled <> 'D'
        and tgfoid = to_regprocedure('public.create_store_profile()')
        and position('to_regclass' in pg_get_functiondef(tgfoid)) = 0
    ),
  'no enabled auth.users trigger writes to a missing profiles table'
);

select * from extensions.finish();
rollback;
