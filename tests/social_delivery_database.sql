begin;
insert into organizations values('209800de-4a2e-41cd-99a7-53bdf5fff3d1','D2D');
insert into social_review_runtime values(true,true);
insert into social_delivery_routes values('209800de-4a2e-41cd-99a7-53bdf5fff3d1','facebook','fb',now()-interval '1 hour');
insert into social_review_posts values('10000000-0000-4000-8000-000000000001','209800de-4a2e-41cd-99a7-53bdf5fff3d1','Post','Campaign','approved',1,1,1,now()-interval '1 minute',false,'{"captions":{"facebook":"Approved caption"},"legacyMedia":[{"url":"https://example.test/a.jpg"}]}',null,null,null,now());
do $$
declare j jsonb; n integer;
begin
 j=claim_social_delivery();if j is null then raise exception 'Approved due post not claimed';end if;
 if claim_social_delivery() is not null then raise exception 'Duplicate claim';end if;
 update social_review_posts set content='{"captions":{"facebook":"Changed"}}',revision=2,approved_revision=null where id='10000000-0000-4000-8000-000000000001';
 if begin_social_dispatch((j->>'id')::uuid,'engine1') then raise exception 'Changed approval dispatched';end if;
 update social_review_posts set status='approved',approved_revision=2 where id='10000000-0000-4000-8000-000000000001';
 j=claim_social_delivery();if j is null then raise exception 'Reapproval not claimed';end if;
 if not begin_social_dispatch((j->>'id')::uuid,'engine2') then raise exception 'Valid approved revision not dispatched';end if;
 begin
  update social_review_posts set planned_for=now()+interval '1 day' where id='10000000-0000-4000-8000-000000000001';
  raise exception 'Dispatch edit allowed';
 exception when raise_exception then
  if sqlerrm='Dispatch edit allowed' then raise;end if;
 end;
end $$;
insert into social_review_posts values('10000000-0000-4000-8000-000000000002','209800de-4a2e-41cd-99a7-53bdf5fff3d1','Future','Campaign','pending',1,1,null,now()+interval '1 hour',false,'{"captions":{"facebook":"Caption"}}',null,null,null,now());
select apply_social_review_v2('10000000-0000-4000-8000-000000000002',1,1,'approve','','{}',null,'Customer','client');
do $$begin
 if (select status from social_review_posts where id='10000000-0000-4000-8000-000000000002')<>'scheduled' then raise exception 'Approval did not schedule';end if;
 if claim_social_delivery() is not null then raise exception 'Future post dispatched early';end if;
end $$;
-- Samples, stale approvals, unmapped customers and old overdue posts must remain held.
insert into social_review_posts
select '10000000-0000-4000-8000-000000000003',organization_id,'Sample',project,'approved',1,1,1,now()-interval '1 minute',true,content,null,null,null,now() from social_review_posts limit 1;
insert into social_review_posts
select '10000000-0000-4000-8000-000000000004',organization_id,'Stale',project,'approved',2,1,1,now()-interval '1 minute',false,content,null,null,null,now() from social_review_posts limit 1;
insert into social_review_posts
select '10000000-0000-4000-8000-000000000005',organization_id,'Overdue',project,'approved',1,1,1,now()-interval '1 day',false,content,null,null,null,now() from social_review_posts limit 1;
do $$begin if claim_social_delivery() is not null then raise exception 'Held post dispatched';end if;end $$;
rollback;

