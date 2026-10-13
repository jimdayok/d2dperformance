import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`
 create schema auth;
 create role anon; create role authenticated; create role service_role;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function auth.role() returns text language sql as $$select coalesce(nullif(current_setting('test.role',true),''),'authenticated')$$;
 create table profiles(id uuid primary key,is_platform_admin boolean);
 create table organizations(id uuid primary key,name text,status text);
 create table organization_members(organization_id uuid,user_id uuid);
 create function public.is_platform_admin(check_user uuid default auth.uid()) returns boolean language sql security definer as $$select coalesce((select is_platform_admin from profiles where id=check_user),false)$$;
 create function public.is_organization_member(org uuid) returns boolean language sql security definer as $$select exists(select 1 from organization_members where organization_id=org and user_id=auth.uid()) or public.is_platform_admin()$$;
 grant usage on schema auth to authenticated,service_role;
 insert into profiles values('10000000-0000-4000-8000-000000000001',true),('10000000-0000-4000-8000-000000000002',false),('10000000-0000-4000-8000-000000000003',false);
 insert into organizations values('20000000-0000-4000-8000-000000000001','QA customer','active');
 insert into organization_members values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
`);
await db.exec(
  readFileSync(
    "supabase/migrations/202610130001_digital_performance_reports.sql",
    "utf8",
  ),
);
const admin = "10000000-0000-4000-8000-000000000001",
  client = "10000000-0000-4000-8000-000000000002",
  outsider = "10000000-0000-4000-8000-000000000003",
  org = "20000000-0000-4000-8000-000000000001";
async function identity(uid, role = "authenticated") {
  await db.query(
    `select set_config('test.uid',$1,false),set_config('test.role',$2,false)`,
    [uid, role],
  );
}
async function cmd(action, report = null, expected = 0, payload = {}) {
  const { rows } = await db.query(
    "select digital_report_command($1,$2,$3,$4,$5) as result",
    [action, org, report, expected, JSON.stringify(payload)],
  );
  return rows[0].result;
}
async function fails(fn, phrase) {
  await assert.rejects(fn, (err) => err.message.includes(phrase));
}
await identity(client);
await fails(() => cmd("enroll"), "administrator");
await identity(admin);
const enrollment = {
  enabled: true,
  monthly: true,
  recipients: ["qa@example.com"],
  auditPricing: "complimentary",
  auditFee: 0,
  startMonth: "2026-09-01",
  proposalReference: "QA-ONLY",
};
await cmd("enroll", null, 0, enrollment);
await fails(() => cmd("enroll", null, 0, enrollment), "changed");
const snap = {
  organizationName: "QA customer",
  organizationId: org,
  kind: "audit",
  period: "2026-09-01",
  createdAt: "2026-10-12T00:00:00Z",
  recipients: enrollment.recipients,
  pricing: "Complimentary",
  metrics: [],
  summary: "Evidence summary",
  workCompleted: "",
  nextSteps: "",
  limitations: "Unavailable",
  baseline: null,
  previous: null,
  proposalReference: "QA-ONLY",
};
function draftPayload(
  snapshot = snap,
  kind = "audit",
  period = "2026-09-01",
  enrollmentRevision = 1,
) {
  return {
    kind,
    period,
    enrollmentRevision,
    snapshot,
    pdf: Buffer.from("%PDF " + "a".repeat(200)).toString("base64"),
    sha256: "a".repeat(64),
  };
}
const audit = await cmd("draft", null, 0, draftPayload());
await fails(() => cmd("claim_send", audit.id, 1), "approved");
await fails(() => cmd("approve", audit.id, 1), "Review");
await cmd("review", audit.id, 1);
await cmd("approve", audit.id, 1);
let e = (await db.query("select * from digital_report_enrollments")).rows[0];
const baseline = e.baseline_version_id;
assert.ok(baseline);
const prematureMonthly = {
  ...snap,
  kind: "monthly",
  period: "2026-12-01",
  baseline: {
    reportId: audit.id,
    version: 1,
    period: snap.period,
    metrics: [],
  },
};
const premature = await cmd(
  "draft",
  null,
  0,
  draftPayload(prematureMonthly, "monthly", "2026-12-01", 1),
);
await cmd("review", premature.id, 1);
await cmd("approve", premature.id, 1);
await fails(() => cmd("claim_send", premature.id, 1), "initial audit");
await fails(
  () =>
    db.query("update digital_report_enrollments set baseline_version_id=null"),
  "immutable",
);

assert.equal(
  (await db.query("select count(*)::int n from digital_report_deliveries"))
    .rows[0].n,
  0,
  "Approval never sends",
);
await fails(
  () =>
    cmd(
      "draft",
      audit.id,
      1,
      draftPayload({ ...snap, summary: "Changed baseline" }),
    ),
  "immutable",
);
await fails(
  () =>
    db.query("update digital_report_versions set pdf_sha256=$1", [
      "b".repeat(64),
    ]),
  "append-only",
);
await identity(client);
await db.exec("set role authenticated");
assert.equal(
  (await db.query("select * from digital_report_versions")).rows.length,
  0,
  "Customer cannot see drafts",
);
await db.exec("reset role");
await identity(admin);
await cmd("enroll", null, 1, {
  ...enrollment,
  recipients: ["changed@example.com"],
});
await fails(() => cmd("claim_send", audit.id, 1), "changed");
// Same immutable audit content, newly versioned recipients. Original baseline version stays fixed.
const refreshed = {
  ...snap,
  recipients: ["changed@example.com"],
  createdAt: "2026-10-13T00:00:00Z",
  baseline: {
    reportId: audit.id,
    version: 1,
    period: snap.period,
    metrics: [],
  },
};
await cmd(
  "draft",
  audit.id,
  1,
  draftPayload(refreshed, "audit", "2026-09-01", 2),
);
await cmd("review", audit.id, 2);
await cmd("approve", audit.id, 2);
assert.equal(
  (await db.query("select baseline_version_id from digital_report_enrollments"))
    .rows[0].baseline_version_id,
  baseline,
);
const claim = await cmd("claim_send", audit.id, 2);
await fails(() => cmd("claim_send", audit.id, 2), "approved");
await fails(() => cmd("enroll", null, 2, enrollment), "pending");
await db.query("select digital_report_finish($1,$2,$3,$4)", [
  claim.deliveryId,
  "accepted",
  "provider-qa",
  null,
]);
await identity(client);
await db.exec("set role authenticated");
assert.equal(
  (await db.query("select * from digital_report_versions")).rows.length,
  1,
  "Only sent exact version is visible",
);
assert.equal(
  (await db.query("select version from digital_report_versions")).rows[0]
    .version,
  2,
);
await db.exec("reset role");
await identity(outsider);
await db.exec("set role authenticated");
assert.equal(
  (await db.query("select * from digital_report_versions")).rows.length,
  0,
  "Cross-tenant denial",
);
await db.exec("reset role");
await identity(admin);
const monthly = {
  ...snap,
  kind: "monthly",
  period: "2026-10-01",
  recipients: ["changed@example.com"],
  baseline: {
    reportId: audit.id,
    version: 1,
    period: snap.period,
    metrics: [],
  },
};
const m = await cmd(
  "draft",
  null,
  0,
  draftPayload(monthly, "monthly", "2026-10-01", 2),
);
await cmd("review", m.id, 1);
await cmd("approve", m.id, 1);
await cmd(
  "draft",
  m.id,
  1,
  draftPayload(
    { ...monthly, summary: "New revision" },
    "monthly",
    "2026-10-01",
    2,
  ),
);
await fails(() => cmd("claim_send", m.id, 2), "approved");
await fails(() => cmd("review", m.id, 1), "changed");
await cmd("review", m.id, 2);
await cmd("approve", m.id, 2);
const mClaim = await cmd("claim_send", m.id, 2);
await fails(
  () =>
    cmd("reconcile", m.id, 2, {
      outcome: "failed",
      reason: "Confirmed rejection in provider records",
      providerId: "",
    }),
  "still be in progress",
);
await db.query("select digital_report_finish($1,$2,$3,$4)", [
  mClaim.deliveryId,
  "uncertain",
  null,
  "Unknown outcome",
]);
await fails(() => cmd("enroll", null, 2, enrollment), "pending");
await cmd("reconcile", m.id, 2, {
  outcome: "accepted",
  reason: "Verified acceptance in provider record provider-monthly",
  providerId: "provider-monthly",
});
assert.equal(
  (await db.query("select status from digital_reports where id=$1", [m.id]))
    .rows[0].status,
  "accepted",
);
await identity("", "service_role");
await fails(() => cmd("claim_send", m.id, 2), "only create drafts");
await cmd("draft", null, 0, {
  ...draftPayload(
    { ...monthly, period: "2026-11-01" },
    "monthly",
    "2026-11-01",
    2,
  ),
  automationActor: admin,
});
console.log(
  "PASS: database migration, admin authorization, evidence history immutability, baseline preservation, stale enrollment/version rejection, review/approval separation, no approval auto-send, double-send lock, recipient invalidation, exact-version client access, cross-tenant isolation, draft-only automation.",
);
await identity(admin);
await db.exec("set role authenticated");
await fails(
  () =>
    db.query("select digital_report_finish($1,$2,$3,$4)", [
      claim.deliveryId,
      "accepted",
      "unauthorized",
      null,
    ]),
  "permission denied",
);
await fails(
  () => db.query("delete from digital_report_versions"),
  "permission denied",
);
await db.exec("reset role");
await db.close();
