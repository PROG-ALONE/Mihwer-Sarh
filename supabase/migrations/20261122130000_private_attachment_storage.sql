begin;

do $$
begin
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception 'supabase_storage_schema_required';
  end if;
end;
$$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'mihwer-private',
  'mihwer-private',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']::text[]
)
on conflict (id) do nothing;

do $$
declare
  bucket storage.buckets%rowtype;
begin
  select * into bucket from storage.buckets where id = 'mihwer-private';
  if not found
    or bucket.name <> 'mihwer-private'
    or bucket.public is distinct from false
    or bucket.file_size_limit is distinct from 20971520
    or bucket.allowed_mime_types is distinct from
      array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']::text[] then
    raise exception 'mihwer_private_bucket_configuration_conflict';
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from pg_catalog.pg_policies where schemaname = 'storage' and policyname like 'mihwer_private_%') then
    raise exception 'mihwer_storage_policy_name_conflict';
  end if;
  execute $policy$
    create policy mihwer_private_object_select on storage.objects
      for select to authenticated
      using (
        bucket_id = 'mihwer-private'
        and (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
  $policy$;
  execute $policy$
    create policy mihwer_private_object_insert on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'mihwer-private'
        and (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
  $policy$;
  execute $policy$
    create policy mihwer_private_object_update on storage.objects
      for update to authenticated
      using (
        bucket_id = 'mihwer-private'
        and (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
      with check (
        bucket_id = 'mihwer-private'
        and (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
  $policy$;
  execute $policy$
    create policy mihwer_private_object_delete on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'mihwer-private'
        and (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
  $policy$;
  execute $policy$
    create policy mihwer_private_guard_select on storage.objects
      as restrictive for select to public
      using (
        bucket_id <> 'mihwer-private'
        or (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
  $policy$;
  execute $policy$
    create policy mihwer_private_guard_insert on storage.objects
      as restrictive for insert to public
      with check (
        bucket_id <> 'mihwer-private'
        or (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
  $policy$;
  execute $policy$
    create policy mihwer_private_guard_update on storage.objects
      as restrictive for update to public
      using (
        bucket_id <> 'mihwer-private'
        or (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
      with check (
        bucket_id <> 'mihwer-private'
        or (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
  $policy$;
  execute $policy$
    create policy mihwer_private_guard_delete on storage.objects
      as restrictive for delete to public
      using (
        bucket_id <> 'mihwer-private'
        or (storage.foldername(name))[1] = mihwer_private.current_user_id()::text
      )
  $policy$;
end;
$$;

commit;
