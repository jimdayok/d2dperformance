begin;
create table public.digital_report_enrollments (
 organization_id uuid primary key references public.organizations(id) on delete restrict,
 enabled boolean not null default false, monthly boolean not null default false,
 recipients text[] not null check (cardinality(recipients) between 1 and 10),
 audit_pricing text not null check(audit_pricing in ('complimentary','paid')),
 audit_fee numeric not null check(audit_fee >= 0),
 start_month date not null check(extract(day from start_month)=1),
 proposal_reference text not null default '', revision integer not null default 1,
 baseline_version_id uuid, updated_at timestamptz not null default now(),
 check ((audit_pricing='complimentary' and audit_fee=0) or (audit_pricing='paid' and audit_fee>0))
);
create table public.digital_reports (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.digital_report_enrollments(organization_id),
 kind text not null check(kind in ('audit','monthly')), period date not null check(extract(day from period)=1),
 current_version integer not null default 0, approved_version integer,
 enrollment_revision integer not null, status text not null default 'draft' check(status in ('draft','in_review','approved','sending','accepted','failed','uncertain')),
 reviewed_by uuid references public.profiles(id), approved_by uuid references public.profiles(id), approved_at timestamptz,
 created_at timestamptz not null default now(), unique(organization_id,kind,period)
);
create unique index digital_reports_single_audit on public.digital_reports(organization_id) where kind='audit';
create table public.digital_report_versions (
 id uuid primary key default gen_random_uuid(), report_id uuid not null references public.digital_reports(id) on delete restrict,
 version integer not null check(version>0), snapshot jsonb not null, pdf_base64 text not null check(length(pdf_base64) between 100 and 6000000),
 pdf_sha256 text not null check(pdf_sha256 ~ '^[a-f0-9]{64}$'), created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
 unique(report_id,version)
);
alter table public.digital_report_enrollments add constraint digital_report_baseline_fk foreign key(baseline_version_id) references public.digital_report_versions(id);
create table public.digital_report_deliveries (
 id uuid primary key default gen_random_uuid(), report_id uuid not null references public.digital_reports(id), version integer not null,
 recipients text[] not null, actor_id uuid not null references public.profiles(id),
 status text not null default 'sending' check(status in ('sending','accepted','failed','uncertain')),
 provider_id text, error text, created_at timestamptz not null default now(), completed_at timestamptz,
 unique(report_id,version)
);
create table public.digital_report_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), report_id uuid references public.digital_reports(id),
 actor_id uuid not null references public.profiles(id), action text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
-- Only transactional functions may write. Clients see only the exact accepted PDF version.
alter table public.digital_report_enrollments enable row level security;
alter table public.digital_reports enable row level security;
alter table public.digital_report_versions enable row level security;
alter table public.digital_report_deliveries enable row level security;
alter table public.digital_report_events enable row level security;
create policy report_enrollment_admin_read on public.digital_report_enrollments for select to authenticated using(public.is_platform_admin());
create policy report_read on public.digital_reports for select to authenticated using(public.is_platform_admin() or (public.is_organization_member(organization_id) and exists(select 1 from public.digital_report_deliveries d where d.report_id=id and d.status='accepted')));
create policy report_delivery_read on public.digital_report_deliveries for select to authenticated using(public.is_platform_admin() or (status='accepted' and exists(select 1 from public.digital_reports r where r.id=report_id and public.is_organization_member(r.organization_id))));
-- Avoid mutually recursive RLS policies by checking accepted delivery through a narrow definer helper.
create function public.digital_report_is_visible(p_report uuid, p_version integer default null) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from digital_reports r join digital_report_deliveries d on d.report_id=r.id where r.id=p_report and d.status='accepted' and (p_version is null or d.version=p_version) and public.is_organization_member(r.organization_id));
$$;
revoke all on function public.digital_report_is_visible(uuid,integer) from public;
grant execute on function public.digital_report_is_visible(uuid,integer) to authenticated;
drop policy report_read on public.digital_reports;
create policy report_read on public.digital_reports for select to authenticated using(public.is_platform_admin() or public.digital_report_is_visible(id));
drop policy report_delivery_read on public.digital_report_deliveries;
create policy report_delivery_read on public.digital_report_deliveries for select to authenticated using(public.is_platform_admin() or (status='accepted' and public.digital_report_is_visible(report_id,version)));
create policy report_version_read on public.digital_report_versions for select to authenticated using(public.is_platform_admin() or public.digital_report_is_visible(report_id,version));
create policy report_event_admin_read on public.digital_report_events for select to authenticated using(public.is_platform_admin());
revoke all on public.digital_report_enrollments,public.digital_reports,public.digital_report_versions,public.digital_report_deliveries,public.digital_report_events from anon,authenticated;
grant select on public.digital_report_enrollments,public.digital_reports,public.digital_report_versions,public.digital_report_deliveries,public.digital_report_events to authenticated;

create function public.digital_report_command(p_action text,p_org uuid,p_report uuid default null,p_expected integer default 0,p_payload jsonb default '{}') returns jsonb
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
    if (select snapshot - array['createdAt','recipients','pricing','baseline','previous','proposalReference'] from digital_report_versions where id=e.baseline_version_id)
       is distinct from ((p_payload->'snapshot') - array['createdAt','recipients','pricing','baseline','previous','proposalReference']) then raise exception 'The established audit baseline is immutable'; end if;
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
revoke all on function public.digital_report_command(text,uuid,uuid,integer,jsonb) from public;
grant execute on function public.digital_report_command(text,uuid,uuid,integer,jsonb) to authenticated,service_role;
-- Completion is server-only; provider acceptance is deliberately distinct from inbox delivery.
create function public.digital_report_finish(p_delivery uuid,p_status text,p_provider text default null,p_error text default null) returns void
language plpgsql security definer set search_path=public as $$
declare d digital_report_deliveries; r digital_reports;
begin
 if p_status not in ('accepted','failed','uncertain') then raise exception 'Invalid completion state'; end if;
 select * into d from digital_report_deliveries where id=p_delivery;
 if not found or d.status<>'sending' then raise exception 'Delivery is not pending'; end if;
 select * into r from digital_reports where id=d.report_id for update;
 select * into d from digital_report_deliveries where id=p_delivery for update;
 if d.status<>'sending' then raise exception 'Delivery was already reconciled'; end if;
 update digital_report_deliveries set status=p_status,provider_id=p_provider,error=left(p_error,1000),completed_at=now() where id=d.id;
 update digital_reports set status=p_status where id=r.id;
 insert into digital_report_events(organization_id,report_id,actor_id,action,detail) values(r.organization_id,r.id,d.actor_id,'delivery.'||p_status,jsonb_build_object('deliveryId',d.id,'providerId',p_provider,'error',left(p_error,1000)));
end $$;
revoke all on function public.digital_report_finish(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.digital_report_finish(uuid,text,text,text) to service_role;
create function public.digital_report_immutable_history() returns trigger language plpgsql as $$
begin raise exception 'Report versions and audit events are append-only'; end $$;
create trigger digital_report_versions_immutable before update or delete on public.digital_report_versions for each row execute function public.digital_report_immutable_history();
create trigger digital_report_events_immutable before update or delete on public.digital_report_events for each row execute function public.digital_report_immutable_history();
create function public.digital_report_preserve_baseline() returns trigger language plpgsql as $$
begin
 if old.baseline_version_id is not null and new.baseline_version_id is distinct from old.baseline_version_id then raise exception 'Established baseline pointer is immutable'; end if;
 return new;
end $$;
create trigger digital_report_baseline_preserved before update on public.digital_report_enrollments for each row execute function public.digital_report_preserve_baseline();
commit;
