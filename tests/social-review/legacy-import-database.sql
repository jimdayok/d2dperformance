-- Run only in the isolated validation database. Every fixture is rolled back.
begin;
do $$begin if current_database()<>'social_release_validation_20261018' then raise exception 'Isolated database required';end if;end $$;
create function pg_temp.expect_error(command text,pattern text) returns void language plpgsql as $$begin begin execute command;exception when others then if position(pattern in SQLERRM)=0 then raise exception 'Unexpected rejection: %',SQLERRM;end if;return;end;raise exception 'Expected rejection';end $$;
select set_config('request.jwt.claim.sub','088d3182-143e-48aa-8c5e-b89e22083339',true);
update public.social_review_runtime set production_enabled=true;
insert into public.organizations(id,name,slug) values('99999999-0000-4000-8000-000000000099','Other import scope','other-import-scope');
insert into public.social_content_batches(id,organization_id,title,period_start,period_end,status,created_by) values
('99999999-0000-4000-8000-000000000001','187b8d4e-df2e-4b08-bf78-9b815bc94400','Campaign with existing reviews','2099-11-01','2099-11-30','client_review','088d3182-143e-48aa-8c5e-b89e22083339'),
('99999999-0000-4000-8000-000000000002','187b8d4e-df2e-4b08-bf78-9b815bc94400','Existing scheduled campaign','2099-11-01','2099-11-30','scheduled','088d3182-143e-48aa-8c5e-b89e22083339'),
('99999999-0000-4000-8000-000000000003','187b8d4e-df2e-4b08-bf78-9b815bc94400','Earlier failed delivery','2099-11-01','2099-11-30','failed','088d3182-143e-48aa-8c5e-b89e22083339'),
('99999999-0000-4000-8000-000000000004','99999999-0000-4000-8000-000000000099','Other client','2099-11-01','2099-11-30','client_review','088d3182-143e-48aa-8c5e-b89e22083339');
insert into public.social_content_items(id,batch_id,content_day,platform,caption,media,scheduled_for,current_revision,approved_revision,shoutrrr_post_id,created_by) values
('99999999-0000-4000-8000-000000000011','99999999-0000-4000-8000-000000000001',1,'facebook','Original pending caption','[{"url":"https://example.test/a.jpg","altText":"Original artwork"}]','2099-11-01T06:30:00Z',3,null,'existing-draft','088d3182-143e-48aa-8c5e-b89e22083339'),
('99999999-0000-4000-8000-000000000012','99999999-0000-4000-8000-000000000001',1,'instagram','Already approved caption','[{"url":"https://example.test/b.mp4"}]','2099-11-01T07:30:00Z',4,4,null,'088d3182-143e-48aa-8c5e-b89e22083339'),
('99999999-0000-4000-8000-000000000013','99999999-0000-4000-8000-000000000002',1,'facebook','Scheduled exact caption','[{"url":"https://example.test/c.jpg"}]','2099-11-02T16:30:00Z',2,2,'existing-schedule','088d3182-143e-48aa-8c5e-b89e22083339'),
('99999999-0000-4000-8000-000000000014','99999999-0000-4000-8000-000000000003',1,'linkedin','Earlier approved failure','[{"url":"https://example.test/d.jpg"}]','2099-11-03T16:30:00Z',5,5,null,'088d3182-143e-48aa-8c5e-b89e22083339'),
('99999999-0000-4000-8000-000000000015','99999999-0000-4000-8000-000000000004',1,'facebook','Other organization','[]','2099-11-04T16:30:00Z',1,null,null,'088d3182-143e-48aa-8c5e-b89e22083339');
do $$declare result jsonb;before_items jsonb;before_batches jsonb;begin
 select jsonb_agg(to_jsonb(i) order by id) into before_items from public.social_content_items i;
 select jsonb_agg(to_jsonb(b) order by id) into before_batches from public.social_content_batches b;
 result=public.import_legacy_social_reviews('187b8d4e-df2e-4b08-bf78-9b815bc94400');
 if result->>'added'<>'4' or result->>'linked_count'<>'4' then raise exception 'Wrong import count: %',result;end if;
 if exists(select 1 from public.social_review_posts where organization_id='99999999-0000-4000-8000-000000000099') then raise exception 'Cross organization import';end if;
 if exists(select 1 from public.social_review_posts r join public.social_content_items i on i.id=r.source_legacy_item_id where r.id<>i.id or r.revision<>i.current_revision or r.approved_revision is distinct from i.approved_revision or r.planned_for<>i.scheduled_for or r.content->'legacyMedia'<>i.media or r.content->'captions'->>i.platform<>i.caption or r.legacy_provider_post_id is distinct from i.shoutrrr_post_id) then raise exception 'Original post mapping changed';end if;
 if (select status from public.social_review_posts where id='99999999-0000-4000-8000-000000000011')<>'pending' or (select status from public.social_review_posts where id='99999999-0000-4000-8000-000000000012')<>'approved' or (select status from public.social_review_posts where id='99999999-0000-4000-8000-000000000013')<>'scheduled' or (select status from public.social_review_posts where id='99999999-0000-4000-8000-000000000014')<>'approved' then raise exception 'Incorrect approval mapping';end if;
 if before_items<>(select jsonb_agg(to_jsonb(i) order by id) from public.social_content_items i) or before_batches<>(select jsonb_agg(to_jsonb(b) order by id) from public.social_content_batches b) then raise exception 'Legacy data changed during import';end if;
 if exists(select 1 from public.social_review_activity) or exists(select 1 from public.social_review_outbox) then raise exception 'Import created review actions or email';end if;
 -- Repeated imports neither add rows nor overwrite subsequent edits.
 update public.social_review_posts set title='Edited in new board' where id='99999999-0000-4000-8000-000000000011';
 result=public.import_legacy_social_reviews('187b8d4e-df2e-4b08-bf78-9b815bc94400');
 if result->>'added'<>'0' or (select title from public.social_review_posts where id='99999999-0000-4000-8000-000000000011')<>'Edited in new board' then raise exception 'Repeat import duplicated or overwrote';end if;
 if (select count(*) from public.social_review_legacy_snapshots)<>4 then raise exception 'Backup duplicated';end if;
 perform pg_temp.expect_error($q$update public.social_review_posts set planned_for=planned_for+interval '1 day' where id='99999999-0000-4000-8000-000000000013'$q$,'publishing schedule is preserved');
 perform pg_temp.expect_error($q$select public.edit_social_review_caption('99999999-0000-4000-8000-000000000013',2,1,'facebook','Unsafe change')$q$,'publishing schedule is preserved');
 perform pg_temp.expect_error($q$update public.social_review_posts set legacy_provider_post_id='replacement' where id='99999999-0000-4000-8000-000000000011'$q$,'publishing identity must be preserved');
 perform pg_temp.expect_error($q$select public.approve_social_item('99999999-0000-4000-8000-000000000011',3)$q$,'managed in the new social board');
 perform pg_temp.expect_error($q$update public.social_content_items set approved_revision=current_revision where id='99999999-0000-4000-8000-000000000011'$q$,'managed in the new social board');
 perform pg_temp.expect_error($q$update public.social_content_batches set status='approved' where id='99999999-0000-4000-8000-000000000001'$q$,'cannot start another publishing job');
 -- Draft creative remains editable and can be submitted using its retained media, without approving anything.
 perform public.edit_social_review_caption('99999999-0000-4000-8000-000000000011',3,1,'facebook','Revised isolated caption');
 perform public.transition_social_review('99999999-0000-4000-8000-000000000011',4,'submit','','{}',2);
 if not exists(select 1 from public.social_review_posts where id='99999999-0000-4000-8000-000000000011' and status='pending' and approved_revision is null) then raise exception 'Imported draft cannot be reviewed';end if;
 perform public.transition_social_review('99999999-0000-4000-8000-000000000011',4,'edit','',jsonb_build_object('title','Replacement creative','captions',jsonb_build_object('facebook','New creative caption'),'mediaIds','[]'::jsonb),3);
 if exists(select 1 from public.social_review_posts where id='99999999-0000-4000-8000-000000000011' and content ? 'legacyMedia') then raise exception 'Replacing creative revived original artwork';end if;
end $$;
-- No unprivileged import capability is introduced.
do $$begin if has_function_privilege('anon','public.import_legacy_social_reviews(uuid)','execute') or has_function_privilege('authenticated','public.import_legacy_social_reviews(uuid)','execute') then raise exception 'Import permission too broad';end if;end $$;
rollback;
