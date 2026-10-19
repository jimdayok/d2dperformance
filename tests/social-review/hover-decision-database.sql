begin;
create function pg_temp.expect_error(command text, pattern text) returns void language plpgsql as $$
begin begin execute command;exception when others then if position(pattern in SQLERRM)=0 then raise exception 'Unexpected rejection: %',SQLERRM;end if;return;end;raise exception 'Expected rejection: %',command;end $$;
select set_config('request.jwt.claim.sub','088d3182-143e-48aa-8c5e-b89e22083339',true);
insert into social_review_posts(id,organization_id,title,status,is_test,created_by,content)
values('44444444-0000-4000-8000-000000000001','187b8d4e-df2e-4b08-bf78-9b815bc94400','Hover review fixture','pending',true,'088d3182-143e-48aa-8c5e-b89e22083339','{"captions":{"facebook":"Review A"},"mediaIds":[],"sampleImage":"/assets/original/services-hero.jpg"}'),
('44444444-0000-4000-8000-000000000002','187b8d4e-df2e-4b08-bf78-9b815bc94400','Untouched fixture','pending',true,'088d3182-143e-48aa-8c5e-b89e22083339','{"captions":{"facebook":"Review B"}}'),
('44444444-0000-4000-8000-000000000003','187b8d4e-df2e-4b08-bf78-9b815bc94400','Real review guard','pending',false,'088d3182-143e-48aa-8c5e-b89e22083339','{"captions":{"facebook":"Real guard"}}');
select transition_social_review('44444444-0000-4000-8000-000000000001',1,'approve','','{}',1);
select pg_temp.expect_error($q$select transition_social_review('44444444-0000-4000-8000-000000000001',1,'request_changes',' ','{}',2)$q$,'Explain the changes');
select transition_social_review('44444444-0000-4000-8000-000000000001',1,'request_changes','Make the headline clearer.','{}',2);
select pg_temp.expect_error($q$select transition_social_review('44444444-0000-4000-8000-000000000001',1,'approve','','{}',1)$q$,'This post changed');
select pg_temp.expect_error($q$select transition_social_review('44444444-0000-4000-8000-000000000003',1,'approve','','{}',1)$q$,'Real post approvals');
insert into social_review_links(organization_id,token_hash,post_ids,expires_at) values('187b8d4e-df2e-4b08-bf78-9b815bc94400',encode(sha256(convert_to(repeat('a',64),'utf8')),'hex'),array['44444444-0000-4000-8000-000000000002'::uuid],now()+interval '1 hour');
select client_social_review(encode(sha256(convert_to(repeat('a',64),'utf8')),'hex'),'44444444-0000-4000-8000-000000000002',1,1,'approve','','{}');
select client_social_review(encode(sha256(convert_to(repeat('a',64),'utf8')),'hex'),'44444444-0000-4000-8000-000000000002',1,2,'request_changes','Client feedback stays with this post.','{}');
select pg_temp.expect_error($q$select client_social_review(encode(sha256(convert_to(repeat('a',64),'utf8')),'hex'),'44444444-0000-4000-8000-000000000001',1,3,'approve','','{}')$q$,'expired or is unavailable');
do $$begin
 if exists(select 1 from social_review_posts where id in ('44444444-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000002') and (status<>'changes_requested' or approved_revision is not null or planned_for is not null or revision<>1 or lock_version<>3)) then raise exception 'Decision affected revision, schedule or approval incorrectly';end if;
 if (select count(*) from social_review_outbox where post_id in ('44444444-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000002') and status='preview_only')<>4 then raise exception 'Missing review notifications';end if;
 if not exists(select 1 from social_review_activity where post_id='44444444-0000-4000-8000-000000000002' and actor_kind='client' and body='Client feedback stays with this post.') then raise exception 'Guest feedback missing';end if;
end $$;
rollback;
