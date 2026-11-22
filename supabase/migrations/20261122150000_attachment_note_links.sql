begin;

grant insert on table public.attachment_links to authenticated;
create policy attachment_links_insert_pending_own on public.attachment_links
  for insert to authenticated
  with check (
    owner_id = mihwer_private.current_user_id()
    and note_id is not null
    and num_nonnulls(note_id, task_id, station_id, project_id) = 1
    and exists (
      select 1 from public.attachments a
      where a.owner_id = public.attachment_links.owner_id
        and a.id = attachment_id
        and a.state = 'pending'
        and a.deleted_at is null
    )
  );

commit;
