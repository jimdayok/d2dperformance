begin;
create function pg_temp.expect_error(command text, pattern text) returns void language plpgsql as $$
begin begin execute command;exception when others then if position(pattern in SQLERRM)=0 then raise exception 'Unexpected rejection: %',SQLERRM;end if;return;end;raise exception 'Expected rejection: %',command;end $$;
select set_config('request.jwt.claim.sub','088d3182-143e-48aa-8c5e-b89e22083339',true);
insert into social_review_posts(id,organization_id,title,status,is_test,created_by,content)
values('22222222-0000-4000-8000-000000000001','187b8d4e-df2e-4b08-bf78-9b815bc94400','V2 test A','pending',true,'088d3182-143e-48aa-8c5e-b89e22083339','{"captions":{"facebook":"A"},"mediaIds":[],"sampleImage":"/assets/original/services-hero.jpg"}'),
('22222222-0000-4000-8000-000000000002','187b8d4e-df2e-4b08-bf78-9b815bc94400','V2 test B','pending',true,'088d3182-143e-48aa-8c5e-b89e22083339','{"captions":{"facebook":"B"},"mediaIds":[],"sampleImage":"/assets/original/services-hero.jpg"}');
select transition_social_review('22222222-0000-4000-8000-000000000001',1,'approve','', '{}',1);
select transition_social_review('22222222-0000-4000-8000-000000000001',1,'schedule','', '{"planned_for":"2099-02-01T16:30:00Z"}',2);
select transition_social_review('22222222-0000-4000-8000-000000000001',1,'reschedule','', '{"planned_for":"2099-02-02T16:30:00Z"}',3);
do $$begin
 if (select approved_revision from social_review_posts where id='22222222-0000-4000-8000-000000000001')<>1 then raise exception 'Rescheduling invalidated content approval';end if;
 if (select status from social_review_posts where id='22222222-0000-4000-8000-000000000002')<>'pending' then raise exception 'Neighbor changed';end if;
 if not exists(select 1 from social_review_outbox where post_id='22222222-0000-4000-8000-000000000001' and status='preview_only' and sender='D2D Marketing <socialpages@d2dmktg.com>' and staff_recipients @> array['jim@d2dmktg.com','andrea@d2dmktg.com']) then raise exception 'Missing atomic D2D notification';end if;
end $$;
select pg_temp.expect_error($q$select transition_social_review('22222222-0000-4000-8000-000000000001',1,'reschedule','', '{"planned_for":"2099-02-03T16:30:00Z"}',3)$q$,'This post changed');
select transition_social_review('22222222-0000-4000-8000-000000000002',1,'invite','', '{}',1);
do $$declare token text;other text;post_a uuid='22222222-0000-4000-8000-000000000001';post_b uuid='22222222-0000-4000-8000-000000000002';begin
 select split_part(payload->>'review_path','/review/social/',2) into token from social_review_outbox where post_id=post_b and event='approval_requested';
 if length(token)<>64 then raise exception 'Unusable private token';end if;
 perform client_social_review(encode(sha256(convert_to(token,'utf8')),'hex'),post_b,1,1,'comment','A scoped client comment.','{}');
 perform pg_temp.expect_error(format('select client_social_review(%L,%L,1,4,%L)',encode(sha256(convert_to(token,'utf8')),'hex'),post_a,'approve'),'expired or is unavailable');
 perform pg_temp.expect_error(format('select client_social_review(%L,%L,1,1,%L)',encode(sha256(convert_to(token,'utf8')),'hex'),post_b,'schedule'),'D2D team');
 perform client_social_review(encode(sha256(convert_to(token,'utf8')),'hex'),post_b,1,1,'approve','','{}');
 if (select status from social_review_posts where id=post_b)<>'approved' then raise exception 'Guest approval failed';end if;
 perform client_social_review(encode(sha256(convert_to(token,'utf8')),'hex'),post_b,1,2,'edit','', '{"title":"Guest edited test","captions":{"facebook":"Updated"}}');
 if (select approved_revision from social_review_posts where id=post_b) is not null then raise exception 'Guest edit retained approval';end if;
 update social_review_links set revoked_at=now() where token_hash=encode(sha256(convert_to(token,'utf8')),'hex');
 perform pg_temp.expect_error(format('select client_social_review(%L,%L,1,1,%L)',encode(sha256(convert_to(token,'utf8')),'hex'),post_b,'approve'),'expired or is unavailable');
end $$;
select pg_temp.expect_error($q$select transition_social_review('22222222-0000-4000-8000-000000000002',2,'move','', '{"target_status":"approved"}',3)$q$,'review or scheduling prompt');
rollback;
