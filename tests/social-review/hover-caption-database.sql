begin;
create function pg_temp.expect_error(command text, pattern text) returns void language plpgsql as $$
begin begin execute command;exception when others then if position(pattern in SQLERRM)=0 then raise exception 'Unexpected rejection: %',SQLERRM;end if;return;end;raise exception 'Expected rejection: %',command;end $$;
select set_config('request.jwt.claim.sub','088d3182-143e-48aa-8c5e-b89e22083339',true);
insert into social_review_posts(id,organization_id,title,status,is_test,created_by,approved_revision,planned_for,content)
values('33333333-0000-4000-8000-000000000001','187b8d4e-df2e-4b08-bf78-9b815bc94400','Hover caption fixture','scheduled',true,'088d3182-143e-48aa-8c5e-b89e22083339',1,'2099-02-01T16:30:00Z','{"captions":{"facebook":"Original FB","instagram":"Original IG"},"mediaIds":[],"sampleImage":"/assets/original/services-hero.jpg","campaign":"Fixture campaign","contentType":"campaign","productFocus":"Product","brief":"Keep brief","tags":["Keep tag"],"customField":"Keep custom"}'),
('33333333-0000-4000-8000-000000000002','187b8d4e-df2e-4b08-bf78-9b815bc94400','Real schedule guard fixture','scheduled',false,'088d3182-143e-48aa-8c5e-b89e22083339',1,'2099-02-01T16:30:00Z','{"captions":{"facebook":"Real guard"}}');
select edit_social_review_caption('33333333-0000-4000-8000-000000000001',1,1,'facebook','Updated FB');
do $$declare p social_review_posts;begin
 select * into p from social_review_posts where id='33333333-0000-4000-8000-000000000001';
 if p.content->'captions'<> '{"facebook":"Updated FB","instagram":"Original IG"}'::jsonb then raise exception 'Another caption changed';end if;
 if p.status<>'changes_requested' or p.approved_revision is not null or p.revision<>2 or p.lock_version<>2 then raise exception 'Approval/schedule/version rule failed';end if;
 if p.planned_for<>'2099-02-01T16:30:00Z' or p.content->>'campaign'<>'Fixture campaign' or p.content->>'productFocus'<>'Product' or p.content->>'brief'<>'Keep brief' or p.content->>'customField'<>'Keep custom' or p.content->'tags'<>'["Keep tag"]'::jsonb or p.content->>'sampleImage'<>'/assets/original/services-hero.jpg' then raise exception 'Metadata or planned date changed';end if;
 if (select count(*) from social_review_activity where post_id=p.id)<>1 or (select count(*) from social_review_outbox where post_id=p.id and status='preview_only')<>1 then raise exception 'Expected one atomic edit and notification';end if;
end $$;
select pg_temp.expect_error($q$select edit_social_review_caption('33333333-0000-4000-8000-000000000001',1,1,'facebook','Stale')$q$,'This post changed');
select pg_temp.expect_error($q$select edit_social_review_caption('33333333-0000-4000-8000-000000000001',2,2,'linkedin','Missing platform')$q$,'Choose an existing');
select pg_temp.expect_error($q$select edit_social_review_caption('33333333-0000-4000-8000-000000000001',2,2,'facebook',' ')$q$,'Enter a caption');
select pg_temp.expect_error($q$select edit_social_review_caption('33333333-0000-4000-8000-000000000002',1,1,'facebook','Blocked')$q$,'Real schedules');
select set_config('request.jwt.claim.sub','b7a7deef-0497-4908-8e3b-6c40f0683463',true);
select pg_temp.expect_error($q$select edit_social_review_caption('33333333-0000-4000-8000-000000000001',2,2,'facebook','Unauthorized')$q$,'Creator access');
rollback;
