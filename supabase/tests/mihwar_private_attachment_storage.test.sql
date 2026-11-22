begin;

set local search_path = public, extensions;
select extensions.plan(11);

select extensions.is(
  (select public from storage.buckets where id = 'mihwer-private'),
  false,
  'private attachment bucket is not public'
);
select extensions.is(
  (select file_size_limit from storage.buckets where id = 'mihwer-private'),
  20971520::bigint,
  'private bucket caps files at 20 MiB'
);
select extensions.is(
  (select array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'mihwer-private'),
  'image/jpeg,image/png,image/webp,application/pdf,text/plain',
  'private bucket accepts only the configured non-executable file types'
);
select extensions.is(
  (select count(*)::integer from pg_catalog.pg_policies
   where schemaname = 'storage' and policyname like 'mihwer_private_object_%'),
  4,
  'private bucket has separate select, insert, update and delete policies'
);
select extensions.ok(
  (select bool_and(roles = array['authenticated']::name[])
   from pg_catalog.pg_policies
   where schemaname = 'storage' and policyname like 'mihwer_private_object_%'),
  'storage policies exclude anon and public roles'
);
select extensions.ok(
  (select bool_and(coalesce(qual, '') like '%mihwer_private.current_user_id()%'
      or coalesce(with_check, '') like '%mihwer_private.current_user_id()%')
   from pg_catalog.pg_policies
   where schemaname = 'storage' and policyname like 'mihwer_private_object_%'),
  'storage policies derive ownership from the trusted Mihwer principal'
);
select extensions.ok(
  (select bool_and(
      coalesce(qual, '') like '%mihwer-private%'
      or coalesce(with_check, '') like '%mihwer-private%'
    )
   from pg_catalog.pg_policies
   where schemaname = 'storage' and policyname like 'mihwer_private_object_%'),
  'storage policies are limited to the Mihwer private bucket'
);
select extensions.is(
  (select count(*)::integer from pg_catalog.pg_policies
   where schemaname = 'storage' and policyname like 'mihwer_private_guard_%'),
  4,
  'restrictive guards cover select, insert, update and delete'
);
select extensions.ok(
  (select bool_and(
      permissive = 'RESTRICTIVE'
      and roles = array['public']::name[]
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%storage.foldername(name)%'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%mihwer-private%'
    )
   from pg_catalog.pg_policies
   where schemaname = 'storage' and policyname like 'mihwer_private_guard_%'),
  'restrictive guards constrain broader existing policies for every role'
);
select extensions.ok(
  (select qual like '%storage.foldername(name)%'
   from pg_catalog.pg_policies where policyname = 'mihwer_private_object_select'),
  'reads require the first object folder to match the verified owner'
);
select extensions.ok(
  (select with_check like '%storage.foldername(name)%'
   from pg_catalog.pg_policies where policyname = 'mihwer_private_object_insert'),
  'uploads require the first object folder to match the verified owner'
);

rollback;
