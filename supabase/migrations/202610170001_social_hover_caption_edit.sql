-- Caption-only edits preserve other platforms and metadata under a single row lock.
create function public.edit_social_review_caption(check_post uuid,check_revision integer,check_version integer,check_platform text,check_caption text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.social_review_posts; patch jsonb;
begin
 select * into p from public.social_review_posts where id=check_post for update;
 if p.id is null or not public.has_product_role(p.organization_id,'social',array['manager','creator'],auth.uid()) then raise exception 'Creator access required' using errcode='42501';end if;
 if check_revision is null or check_version is null or p.revision<>check_revision or p.lock_version<>check_version then raise exception 'This post changed. Refresh and review the latest version.';end if;
 if check_platform is null or check_platform not in ('facebook','instagram','linkedin','tiktok','threads','x') or not coalesce(p.content->'captions','{}'::jsonb) ? check_platform then raise exception 'Choose an existing platform caption';end if;
 if check_caption is null or length(trim(check_caption)) not between 1 and 10000 then raise exception 'Enter a caption between 1 and 10000 characters';end if;
 if p.status='scheduled' and not p.is_test then raise exception 'Real schedules cannot be changed in private staging';end if;
 patch=jsonb_build_object('title',p.title,'captions',(p.content->'captions')||jsonb_build_object(check_platform,trim(check_caption)),'brief',coalesce(p.content->>'brief',''),'tags',coalesce(p.content->'tags','[]'::jsonb),'campaign',coalesce(p.content->>'campaign',''),'contentType',coalesce(p.content->>'contentType','evergreen'),'productFocus',coalesce(p.content->>'productFocus',''));
 -- Only the final edit creates the revision, activity and preview notification.
 -- This intermediate state is never committed independently of the edit.
 if p.status='scheduled' then update public.social_review_posts set status='pending',approved_revision=null where id=p.id;end if;
 return public.transition_social_review(p.id,check_revision,'edit','',patch,check_version);
end $$;
revoke all on function public.edit_social_review_caption(uuid,integer,integer,text,text) from public,anon;
grant execute on function public.edit_social_review_caption(uuid,integer,integer,text,text) to authenticated;
