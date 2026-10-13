create or replace function public.approve_social_item(check_item uuid,check_revision integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare item public.social_content_items; parent public.social_content_batches; parent_id uuid;
begin
 select batch_id into parent_id from public.social_content_items where id=check_item;
 select * into parent from public.social_content_batches where id=parent_id for update;
 if parent.id is null then raise exception 'Post not found'; end if;
 if not public.has_product_role(parent.organization_id,'social',array['manager','reviewer'],auth.uid()) then raise exception 'Not authorized to approve this post' using errcode='42501'; end if;
 if parent.status<>'client_review' then raise exception 'This campaign is not awaiting approval'; end if;
 select * into item from public.social_content_items where id=check_item for update;
 if item.current_revision is distinct from check_revision then raise exception 'This post changed. Refresh and review the current version.'; end if;
 if item.approved_revision is distinct from item.current_revision then
  update public.social_content_items set approved_revision=current_revision where id=item.id;
  insert into public.platform_audit_events(organization_id,actor_id,action,subject_type,subject_id,detail)
  values(parent.organization_id,auth.uid(),'social_item.approved','social_content_item',item.id::text,jsonb_build_object('revision',item.current_revision,'platform',item.platform));
 end if;
 if not exists(select 1 from public.social_content_items where batch_id=parent.id and approved_revision is distinct from current_revision) then
  parent:=public.review_social_batch(parent.id,'approved','Each platform post was approved individually.');
 end if;
 return jsonb_build_object('batchId',parent.id,'status',parent.status);
end $$;
revoke all on function public.approve_social_item(uuid,integer) from public,anon;
grant execute on function public.approve_social_item(uuid,integer) to authenticated;
