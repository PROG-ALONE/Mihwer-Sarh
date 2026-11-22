begin;

alter table public.attachments
  drop constraint if exists attachments_state_check;
alter table public.attachments
  add constraint attachments_state_check
  check (state in ('pending', 'ready', 'deleting', 'failed', 'deleted'));

grant insert, update on table public.attachments to authenticated;

create policy attachments_insert_own on public.attachments
  for insert to authenticated
  with check (owner_id = mihwer_private.current_user_id());
create policy attachments_update_own on public.attachments
  for update to authenticated
  using (owner_id = mihwer_private.current_user_id())
  with check (owner_id = mihwer_private.current_user_id());

commit;
