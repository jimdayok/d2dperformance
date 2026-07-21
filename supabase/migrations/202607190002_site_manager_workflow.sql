begin;

create or replace function public.restore_content_version(version_id uuid, expected_revision integer)
returns public.content_entries
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  selected_version public.content_versions;
  current_entry public.content_entries;
  restored_entry public.content_entries;
begin
  select * into selected_version from public.content_versions where id = version_id;
  if not found then raise exception 'version not found' using errcode = 'P0002'; end if;
  select * into current_entry from public.content_entries where id = selected_version.content_entry_id and deleted_at is null for update;
  if not found then raise exception 'content entry not found' using errcode = 'P0002'; end if;
  if not public.can_publish_site(current_entry.site_id) then raise exception 'not authorized to restore' using errcode = '42501'; end if;
  if current_entry.draft_revision <> expected_revision then raise exception 'draft revision conflict' using errcode = '40001'; end if;

  update public.content_entries set draft_data = selected_version.data, draft_revision = draft_revision + 1,
    workflow_status = 'draft', updated_by = auth.uid()
  where id = current_entry.id returning * into restored_entry;
  insert into public.content_versions(content_entry_id, revision, data, action, created_by)
  values (restored_entry.id, restored_entry.draft_revision, restored_entry.draft_data, 'restored', auth.uid());
  return restored_entry;
end;
$$;

create or replace function public.request_content_changes(entry_id uuid, note_text text)
returns public.content_entries
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare changed public.content_entries;
begin
  if length(trim(note_text)) < 1 or length(note_text) > 5000 then raise exception 'review note is required' using errcode = '22023'; end if;
  if not exists (select 1 from public.content_entries e where e.id = entry_id and e.workflow_status = 'in_review' and public.can_publish_site(e.site_id)) then raise exception 'not authorized' using errcode = '42501'; end if;
  update public.content_entries set workflow_status = 'changes_requested', updated_by = auth.uid() where id = entry_id returning * into changed;
  insert into public.review_notes(content_entry_id, author_id, note) values (entry_id, auth.uid(), note_text);
  insert into public.content_versions(content_entry_id, revision, data, action, created_by) values (entry_id, changed.draft_revision, changed.draft_data, 'changes_requested', auth.uid());
  return changed;
end;
$$;

revoke all on function public.restore_content_version(uuid, integer) from public;
revoke all on function public.request_content_changes(uuid, text) from public;
grant execute on function public.restore_content_version(uuid, integer) to authenticated;
grant execute on function public.request_content_changes(uuid, text) to authenticated;

commit;
