begin;
create function pg_temp.expect_error(command text, pattern text) returns void language plpgsql as $$
begin
 begin execute command; exception when others then
  if position(pattern in SQLERRM)=0 then raise exception 'Unexpected rejection: %',SQLERRM; end if;
  return;
 end;
 raise exception 'Expected rejection: %',command;
end $$;
select set_config('request.jwt.claim.sub','088d3182-143e-48aa-8c5e-b89e22083339',true);
insert into public.social_review_posts(id,organization_id,title,status,is_test,created_by,planned_for,content)
values
('11111111-0000-4000-8000-000000000001','187b8d4e-df2e-4b08-bf78-9b815bc94400','Workflow test A','pending',true,'088d3182-143e-48aa-8c5e-b89e22083339','2099-01-20T16:00:00Z','{"captions":{"facebook":"Test A"},"mediaIds":[],"sampleImage":"/assets/original/services-hero.jpg"}'),
('11111111-0000-4000-8000-000000000002','187b8d4e-df2e-4b08-bf78-9b815bc94400','Workflow test B','pending',true,'088d3182-143e-48aa-8c5e-b89e22083339','2099-01-21T16:00:00Z','{"captions":{"facebook":"Test B"},"mediaIds":[],"sampleImage":"/assets/original/services-hero.jpg"}'),
('11111111-0000-4000-8000-000000000003','187b8d4e-df2e-4b08-bf78-9b815bc94400','Real approval guard verification','pending',false,'088d3182-143e-48aa-8c5e-b89e22083339','2099-01-22T16:00:00Z','{"captions":{"facebook":"Guard verification"},"mediaIds":[]}');
select public.transition_social_review('11111111-0000-4000-8000-000000000001',1,'approve');
select public.transition_social_review('11111111-0000-4000-8000-000000000001',1,'schedule');
do $$begin
 if (select status from social_review_posts where id='11111111-0000-4000-8000-000000000001')<>'scheduled' then raise exception 'A not scheduled'; end if;
 if (select status from social_review_posts where id='11111111-0000-4000-8000-000000000002')<>'pending' then raise exception 'B changed'; end if;
end $$;
select pg_temp.expect_error($cmd$select public.transition_social_review('11111111-0000-4000-8000-000000000003',1,'approve')$cmd$,'Real post');
select pg_temp.expect_error($cmd$select public.transition_social_review('11111111-0000-4000-8000-000000000002',1,'schedule')$cmd$,'Approve the current');
select public.transition_social_review('11111111-0000-4000-8000-000000000002',1,'approve');
select public.transition_social_review('11111111-0000-4000-8000-000000000002',1,'edit','', '{"title":"Updated B","planned_for":"2099-01-21T16:00:00Z","captions":{"facebook":"Revised B"},"brief":"","tags":[]}');
do $$begin
 if (select approved_revision from social_review_posts where id='11111111-0000-4000-8000-000000000002') is not null then raise exception 'Approval survived an edit'; end if;
end $$;
select pg_temp.expect_error($cmd$select public.transition_social_review('11111111-0000-4000-8000-000000000002',1,'submit')$cmd$,'This post changed');
select public.transition_social_review('11111111-0000-4000-8000-000000000002',2,'submit');
select public.transition_social_review('11111111-0000-4000-8000-000000000002',2,'request_changes','Please update the creative');
select public.transition_social_review('11111111-0000-4000-8000-000000000002',2,'comment','A post-specific comment.');
select pg_temp.expect_error($cmd$select public.transition_social_review('11111111-0000-4000-8000-000000000001',1,'edit','', '{"title":"Try to edit a scheduled post"}')$cmd$,'scheduled test post');
select set_config('request.jwt.claim.sub','b7a7deef-0497-4908-8e3b-6c40f0683463',true);
select pg_temp.expect_error($cmd$select public.transition_social_review('11111111-0000-4000-8000-000000000002',2,'approve')$cmd$,'Not authorized');
rollback;
