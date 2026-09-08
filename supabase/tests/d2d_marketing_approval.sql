-- Exercise the D2D Social customer workflow against disposable local Supabase.
-- This verifies social-only membership, review gates, immutable approval records,
-- least-privilege writes, revision invalidation, and the staff scheduling claim.
begin;
select plan(1);

insert into auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '61000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'staff@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '61000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'customer@example.test', '', now(), '{}', '{}', now(), now());

update public.profiles set is_platform_admin = true where id = '61000000-0000-0000-0000-000000000001';
insert into public.organizations(id, name, slug)
values ('62000000-0000-0000-0000-000000000001', 'D2D Social Test', 'd2d-social-test');
insert into public.product_entitlements(organization_id, product, launch_url)
values ('62000000-0000-0000-0000-000000000001', 'social', 'https://social.example.test');
insert into public.organization_product_members(organization_id, user_id, product, role)
values ('62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000002', 'social', 'reviewer');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);

do $$
declare
  v_plan_id uuid;
  v_batch_id uuid;
  v_item_id uuid;
  approval_number integer;
begin
  select id into v_plan_id from public.create_marketing_plan_draft(
    '62000000-0000-0000-0000-000000000001',
    'Test plan', current_date, current_date + 30, 'Test summary',
    '{"executiveSummary":"Test","goals":["Trust"],"audiences":["Owners"],"positioning":"Practical","voice":["Clear"],"contentPillars":[{"name":"Proof","purpose":"Trust","frequency":"Weekly"}],"channels":[{"platform":"LinkedIn","cadence":"Weekly","purpose":"Credibility"}],"seasonalPriorities":[],"measures":["Replies"],"responsibilities":[{"owner":"D2D","responsibility":"Draft"}]}'::jsonb
  );
  perform public.submit_marketing_plan_for_review(v_plan_id);

  perform set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000002', true);
  if (select count(*) from public.product_entitlements) <> 1 then
    raise exception 'social-only customer could not see its entitlement';
  end if;
  if not exists (
    select 1
    from public.organizations
    where id = '62000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'social-only customer could not see its organization';
  end if;
  begin
    perform public.admin_set_product_entitlement(
      '62000000-0000-0000-0000-000000000001', 'social', 'suspended', 'https://social.example.test', null
    );
    raise exception 'customer unexpectedly changed its own product entitlement';
  exception when insufficient_privilege then null;
  end;
  perform public.review_marketing_plan(v_plan_id, 'changes_requested', 'Clarify the audience');

  perform set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);
  perform public.revise_marketing_plan(
    v_plan_id, 'Test plan revision', 'Audience clarified',
    '{"executiveSummary":"Test","goals":["Trust"],"audiences":["Established local business owners"],"positioning":"Practical","voice":["Clear"],"contentPillars":[{"name":"Proof","purpose":"Trust","frequency":"Weekly"}],"channels":[{"platform":"LinkedIn","cadence":"Weekly","purpose":"Credibility"}],"seasonalPriorities":[],"measures":["Replies"],"responsibilities":[{"owner":"D2D","responsibility":"Draft"}]}'::jsonb
  );
  perform public.submit_marketing_plan_for_review(v_plan_id);

  perform set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000002', true);
  perform public.review_marketing_plan(v_plan_id, 'approved', 'Agreed');

  perform set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);
  select id into v_batch_id from public.create_social_batch_from_json(
    '62000000-0000-0000-0000-000000000001', v_plan_id, 'Test week', current_date, current_date + 6,
    jsonb_build_array(jsonb_build_object(
      'day', 1,
      'scheduledFor', (now() + interval '1 day')::text,
      'captions', jsonb_build_object('facebook', 'Facebook copy', 'instagram', 'Instagram copy', 'linkedin', 'LinkedIn copy'),
      'visualBrief', 'Use approved brand image',
      'requiredAssets', jsonb_build_array('Transparent logo')
    ))
  );
  perform public.submit_social_batch_for_client_review(v_batch_id);

  perform set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000002', true);
  perform public.review_social_batch(v_batch_id, 'changes_requested', 'Change the image');

  perform set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);
  select id into v_item_id from public.social_content_items where batch_id = v_batch_id order by platform limit 1;
  perform public.revise_social_content_item(
    v_item_id, 'Revised approved caption',
    '[{"url":"https://assets.example.test/approved.png","altText":"Approved image"}]'::jsonb,
    now() + interval '2 days', 'Approved brand image'
  );
  select approval_version into approval_number from public.social_content_batches where id = v_batch_id;
  if approval_number <> 2 then raise exception 'content revision did not invalidate the prior approval version'; end if;
  perform public.revise_social_content_day_media(
    v_batch_id, 1,
    '[{"url":"https://assets.example.test/day-one.png","altText":"Day one approved image"}]'::jsonb
  );
  if (select count(*) from public.social_content_items where batch_id = v_batch_id and jsonb_array_length(media) = 1) <> 3 then
    raise exception 'day-level media was not applied to every platform';
  end if;
  perform public.submit_social_batch_for_client_review(v_batch_id);

  perform set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000002', true);
  perform public.review_social_batch(v_batch_id, 'approved', 'Approved exactly as shown');
  begin
    update public.social_content_items set caption = 'bypass' where id = v_item_id;
    raise exception 'direct content update unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.social_batch_reviews where batch_id = v_batch_id;
    raise exception 'approval record deletion unexpectedly succeeded';
  exception when insufficient_privilege or object_not_in_prerequisite_state then null;
  end;

  begin
    perform public.claim_social_batch_for_scheduling(v_batch_id);
    raise exception 'customer unexpectedly claimed a batch for scheduling';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);
  perform public.claim_social_batch_for_scheduling(v_batch_id);
  perform public.complete_social_batch_scheduling(v_batch_id, true, null);
  if (select status from public.social_content_batches where id = v_batch_id) <> 'scheduled' then
    raise exception 'approved batch was not marked scheduled';
  end if;
end $$;

select pass('D2D marketing approval workflow enforced');
select * from finish();

rollback;
