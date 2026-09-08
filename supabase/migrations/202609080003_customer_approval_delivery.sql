begin;

create or replace function public.create_manual_social_batch(
  check_organization uuid,
  check_marketing_plan uuid,
  check_title text,
  check_scheduled_for timestamptz,
  check_captions jsonb,
  check_media jsonb
)
returns public.social_content_batches
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.social_content_batches;
  platform_name text;
  platform_caption text;
  inserted_item public.social_content_items;
  item_count integer := 0;
begin
  if not public.has_product_role(check_organization, 'social', array['manager', 'creator'], auth.uid()) then
    raise exception 'not authorized to create social content' using errcode = '42501';
  end if;
  if coalesce(length(trim(check_title)), 0) = 0 or length(check_title) > 180 then
    raise exception 'batch title is required and must not exceed 180 characters' using errcode = '22023';
  end if;
  if check_scheduled_for <= now() then raise exception 'publish time must be in the future' using errcode = '22023'; end if;
  if jsonb_typeof(check_captions) <> 'object' then raise exception 'captions must be an object' using errcode = '22023'; end if;
  if jsonb_typeof(check_media) <> 'array' then raise exception 'media must be an array' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.marketing_plans p
    where p.id = check_marketing_plan and p.organization_id = check_organization
      and p.status = 'approved' and p.approved_revision = p.current_revision
  ) then
    raise exception 'an approved current marketing plan is required' using errcode = '55000';
  end if;

  insert into public.social_content_batches(
    organization_id, marketing_plan_id, title, period_start, period_end, status, created_by
  ) values (
    check_organization, check_marketing_plan, check_title,
    (check_scheduled_for at time zone 'America/Chicago')::date,
    (check_scheduled_for at time zone 'America/Chicago')::date,
    'internal_review', auth.uid()
  ) returning * into target;

  foreach platform_name in array array['facebook', 'instagram', 'linkedin']
  loop
    platform_caption := nullif(trim(check_captions ->> platform_name), '');
    if platform_caption is not null then
      if length(platform_caption) > 10000 then raise exception 'caption is too long' using errcode = '22023'; end if;
      insert into public.social_content_items(
        batch_id, content_day, platform, caption, media, scheduled_for, creative_brief, required_assets, created_by
      ) values (
        target.id, 1, platform_name, platform_caption, check_media, check_scheduled_for,
        'Customer-approved production post', '[]'::jsonb, auth.uid()
      ) returning * into inserted_item;
      insert into public.social_content_item_versions(
        social_content_item_id, revision, caption, media, scheduled_for, created_by
      ) values (
        inserted_item.id, inserted_item.current_revision, inserted_item.caption,
        inserted_item.media, inserted_item.scheduled_for, auth.uid()
      );
      item_count := item_count + 1;
    end if;
  end loop;
  if item_count = 0 then raise exception 'at least one platform caption is required' using errcode = '22023'; end if;

  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (target.organization_id, auth.uid(), 'social_batch.created', 'social_content_batch', target.id::text,
    jsonb_build_object('source', 'manual_composer', 'platform_count', item_count));
  return target;
end;
$$;

revoke all on function public.create_manual_social_batch(uuid, uuid, text, timestamptz, jsonb, jsonb) from public;
grant execute on function public.create_manual_social_batch(uuid, uuid, text, timestamptz, jsonb, jsonb) to authenticated;

commit;
