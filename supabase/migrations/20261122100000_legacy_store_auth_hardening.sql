-- Legacy Sarh store objects left in the Mihwar project after the confirmed store cleanup.
-- auth.users.sarh_create_store_profile -> public.create_store_profile() inserts into public.profiles,
-- which no longer exists, so every Supabase Auth user insert fails with 42P01.
-- The function keeps its original behaviour whenever public.profiles exists, is skipped otherwise,
-- and neither legacy function remains executable by API roles. Nothing is dropped or disabled.

do $migration$
begin
  if to_regprocedure('public.create_store_profile()') is not null then
    execute $definition$
      create or replace function public.create_store_profile()
      returns trigger
      language plpgsql
      security definer
      set search_path = ''
      as $function$
      declare
        requested_username text;
      begin
        if to_regclass('public.profiles') is null then
          return new;
        end if;
        requested_username := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');
        if requested_username is null or char_length(requested_username) < 2 or char_length(requested_username) > 60 then
          requested_username := 'مستخدم';
        end if;
        insert into public.profiles (id, username)
        values (new.id, requested_username)
        on conflict (id) do nothing;
        return new;
      end;
      $function$
    $definition$;
    revoke all on function public.create_store_profile() from public, anon, authenticated;
  end if;

  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$migration$;
