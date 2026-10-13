begin;
create table public.digital_report_branding (
 organization_id uuid primary key references public.organizations(id) on delete restrict,
 png_base64 text not null check(length(png_base64) between 100 and 470000 and png_base64 ~ '^[A-Za-z0-9+/]+={0,2}$'),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'), filename text not null check(length(filename) between 1 and 150),
 updated_by uuid not null references public.profiles(id), updated_at timestamptz not null default now()
);
alter table public.digital_report_branding enable row level security;
create policy digital_report_branding_admin_read on public.digital_report_branding for select to authenticated using(public.is_platform_admin());
revoke all on public.digital_report_branding from anon,authenticated;
grant select on public.digital_report_branding to authenticated,service_role;
create function public.digital_report_set_logo(p_org uuid,p_expected integer,p_logo jsonb) returns void language plpgsql security definer set search_path=public as $$
declare e digital_report_enrollments; actor uuid := auth.uid(); before_hash text;
begin
 if actor is null or not public.is_platform_admin(actor) then raise exception 'Platform administrator permission required'; end if;
 perform id from organizations where id=p_org and status='active' for update;
 if not found then raise exception 'Active customer not found'; end if;
 select * into e from digital_report_enrollments where organization_id=p_org for update;
 if e.organization_id is null then raise exception 'Save the customer enrollment before adding a logo'; end if;
 if e.revision<>p_expected then raise exception 'Customer settings changed; reload before saving the logo'; end if;
 if exists(select 1 from digital_reports where organization_id=p_org and status in ('sending','uncertain')) then raise exception 'Resolve pending delivery before changing the customer logo'; end if;
 select sha256 into before_hash from digital_report_branding where organization_id=p_org;
 if p_logo is null then delete from digital_report_branding where organization_id=p_org;
 else
  insert into digital_report_branding(organization_id,png_base64,sha256,filename,updated_by)
  values(p_org,p_logo->>'pngBase64',p_logo->>'sha256',p_logo->>'filename',actor)
  on conflict(organization_id) do update set png_base64=excluded.png_base64,sha256=excluded.sha256,filename=excluded.filename,updated_by=actor,updated_at=now();
 end if;
 update digital_report_enrollments set revision=revision+1,updated_at=now() where organization_id=p_org;
 update digital_reports set status='draft',approved_version=null,approved_by=null,approved_at=null,reviewed_by=null where organization_id=p_org and status in ('approved','in_review','failed');
 insert into digital_report_events(organization_id,actor_id,action,detail) values(p_org,actor,case when p_logo is null then 'logo.removed' else 'logo.updated' end,jsonb_build_object('previousSha256',before_hash,'sha256',p_logo->>'sha256','filename',p_logo->>'filename','enrollmentRevision',e.revision+1));
end $$;
revoke all on function public.digital_report_set_logo(uuid,integer,jsonb) from public,anon;
grant execute on function public.digital_report_set_logo(uuid,integer,jsonb) to authenticated;
-- Branding can be reissued while preserving the original approved audit content.
create or replace function public.digital_report_command(p_action text,p_org uuid,p_report uuid default null,p_expected integer default 0,p_payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public as $$
declare e digital_report_enrollments; r digital_reports; v digital_report_versions; d digital_report_deliveries; actor uuid := auth.uid(); result jsonb; recipient text;
begin
 if auth.role()='service_role' and p_action<>'draft' then raise exception 'Automation may only create drafts'; end if;
 if auth.role()='service_role' and p_action='draft' then actor:=(p_payload->>'automationActor')::uuid; end if;
 if actor is null or not public.is_platform_admin(actor) then raise exception 'Platform administrator permission required'; end if;
 -- Serialize initial enrollment creation and every operation for the customer.
 perform id from organizations where id=p_org and status='active' for update;
 if not found then raise exception 'Active customer not found'; end if;
 select * into e from digital_report_enrollments where organization_id=p_org for update;
 if p_action='enroll' then
  if coalesce(e.revision,0)<>p_expected then raise exception 'Enrollment changed; reload before saving'; end if;
  if exists(select 1 from digital_reports where organization_id=p_org and status in ('sending','uncertain')) then raise exception 'Resolve pending delivery before changing recipients'; end if;
  for recipient in select jsonb_array_elements_text(p_payload->'recipients') loop
   if recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid recipient'; end if;
  end loop;
  insert into digital_report_enrollments(organization_id,enabled,monthly,recipients,audit_pricing,audit_fee,start_month,proposal_reference)
  values(p_org,(p_payload->>'enabled')::boolean,(p_payload->>'monthly')::boolean,array(select jsonb_array_elements_text(p_payload->'recipients')),p_payload->>'auditPricing',(p_payload->>'auditFee')::numeric,(p_payload->>'startMonth')::date,p_payload->>'proposalReference')
  on conflict(organization_id) do update set enabled=excluded.enabled,monthly=excluded.monthly,recipients=excluded.recipients,audit_pricing=excluded.audit_pricing,audit_fee=excluded.audit_fee,start_month=excluded.start_month,proposal_reference=excluded.proposal_reference,revision=digital_report_enrollments.revision+1,updated_at=now();
  update digital_reports set status='draft',approved_version=null,approved_by=null,approved_at=null,reviewed_by=null where organization_id=p_org and status in ('approved','in_review','failed');
  result:=jsonb_build_object('status','saved');
 else
  if e.organization_id is null or not e.enabled then raise exception 'Reporting enrollment is not active'; end if;
  if p_report is not null then select * into r from digital_reports where id=p_report and organization_id=p_org for update; if not found then raise exception 'Report not found'; end if; end if;
  if p_action='draft' then
   if (p_payload->>'enrollmentRevision')::integer <> e.revision then raise exception 'Enrollment changed; regenerate PDF'; end if;
   if p_payload->>'kind'='monthly' and (not e.monthly or e.baseline_version_id is null or (p_payload->>'period')::date<e.start_month) then raise exception 'Monthly reporting requires enrollment and an approved baseline'; end if;
   if p_payload->>'kind'='audit' and e.baseline_version_id is not null then
    if (select snapshot - array['createdAt','recipients','pricing','baseline','previous','proposalReference','clientLogo'] from digital_report_versions where id=e.baseline_version_id)
       is distinct from ((p_payload->'snapshot') - array['createdAt','recipients','pricing','baseline','previous','proposalReference','clientLogo']) then raise exception 'The established audit baseline is immutable'; end if;
   end if;
   if p_payload->>'kind'='monthly' then
    if not exists(select 1 from digital_report_versions b where b.id=e.baseline_version_id and b.report_id::text=p_payload->'snapshot'->'baseline'->>'reportId' and b.version=(p_payload->'snapshot'->'baseline'->>'version')::integer and b.snapshot->'metrics'=p_payload->'snapshot'->'baseline'->'metrics') then raise exception 'Baseline snapshot mismatch'; end if;
    if (p_payload->>'period')::date <= (select (snapshot->>'period')::date from digital_report_versions where id=e.baseline_version_id) then raise exception 'Monthly report must follow the audit period'; end if;
   end if;
   if r.id is null then
    insert into digital_reports(organization_id,kind,period,enrollment_revision) values(p_org,p_payload->>'kind',(p_payload->>'period')::date,e.revision) returning * into r;
   end if;
   if r.current_version<>p_expected or r.status in ('sending','uncertain') then raise exception 'Report changed or delivery is locked'; end if;
   if r.kind<>p_payload->>'kind' or r.period<>(p_payload->>'period')::date then raise exception 'Report identity cannot change'; end if;
   insert into digital_report_versions(report_id,version,snapshot,pdf_base64,pdf_sha256,created_by) values(r.id,r.current_version+1,p_payload->'snapshot',p_payload->>'pdf',p_payload->>'sha256',actor) returning * into v;
   update digital_reports set current_version=v.version,enrollment_revision=e.revision,status='draft',reviewed_by=null,approved_version=null,approved_by=null,approved_at=null where id=r.id;
   result:=jsonb_build_object('id',r.id,'version',v.version,'status','draft');
  else
   if r.id is null or r.current_version<>p_expected or r.enrollment_revision<>e.revision then raise exception 'Report or enrollment changed; regenerate and review'; end if;
   select * into v from digital_report_versions where report_id=r.id and version=r.current_version;
   if v.id is null then raise exception 'PDF draft required'; end if;
   if p_action='review' then
    if r.status<>'draft' then raise exception 'Only a draft can enter review'; end if;
    update digital_reports set status='in_review',reviewed_by=actor where id=r.id;
   elsif p_action='approve' then
    if r.status<>'in_review' then raise exception 'Review the PDF before approval'; end if;
    update digital_reports set status='approved',approved_version=r.current_version,approved_by=actor,approved_at=now() where id=r.id;
    if r.kind='audit' then
     if e.baseline_version_id is null then update digital_report_enrollments set baseline_version_id=v.id where organization_id=p_org; end if;
    end if;
   elsif p_action='reconcile' then
    if r.status not in ('sending','uncertain') or p_payload->>'outcome' not in ('accepted','failed') or length(coalesce(p_payload->>'reason',''))<10 then raise exception 'Pending delivery and documented provider reconciliation required'; end if;
    if p_payload->>'outcome'='accepted' and length(coalesce(p_payload->>'providerId',''))=0 then raise exception 'Provider acceptance identifier required'; end if;
    select * into d from digital_report_deliveries where report_id=r.id and version=r.current_version for update;
    if d.id is null then raise exception 'Delivery attempt not found'; end if;
    if r.status='sending' and d.created_at > now()-interval '15 minutes' then raise exception 'Delivery may still be in progress; wait before reconciling'; end if;
    update digital_report_deliveries set status=p_payload->>'outcome',provider_id=nullif(p_payload->>'providerId',''),error=p_payload->>'reason',completed_at=now() where id=d.id;
    update digital_reports set status=p_payload->>'outcome' where id=r.id;
    result:=jsonb_build_object('id',r.id,'status',p_payload->>'outcome','reason',p_payload->>'reason','providerId',p_payload->>'providerId');
   elsif p_action='claim_send' then
    if r.status<>'approved' or r.approved_version<>r.current_version then raise exception 'Exact PDF must be approved before manual send'; end if;
    if r.kind='monthly' and not exists(select 1 from digital_reports a join digital_report_deliveries ad on ad.report_id=a.id where a.organization_id=p_org and a.kind='audit' and ad.status='accepted' and ad.recipients @> e.recipients) then raise exception 'Send the initial audit to these recipients before releasing monthly reports'; end if;
    if array(select jsonb_array_elements_text(v.snapshot->'recipients'))<>e.recipients then raise exception 'Recipients changed; regenerate'; end if;
    insert into digital_report_deliveries(report_id,version,recipients,actor_id) values(r.id,r.current_version,e.recipients,actor) returning * into d;
    update digital_reports set status='sending' where id=r.id;
    result:=jsonb_build_object('deliveryId',d.id,'version',v.version,'recipients',d.recipients);
   else raise exception 'Unknown action'; end if;
   result:=coalesce(result,jsonb_build_object('id',r.id,'status',p_action));
  end if;
 end if;
 insert into digital_report_events(organization_id,report_id,actor_id,action,detail) values(p_org,r.id,actor,p_action,jsonb_build_object('version',coalesce(v.version,r.current_version),'result',result,'source',case when auth.role()='service_role' then 'monthly_preparation' else 'administrator' end,'enrollment_before',case when p_action='enroll' then to_jsonb(e) else null end,'enrollment_after',case when p_action='enroll' then p_payload else null end));
 return result;
end $$;

commit;
