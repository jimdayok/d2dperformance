"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  contentSchema,
  emptyContent,
  metricDefinitions,
  previousMonth,
  type ReportContent,
} from "@/lib/digital-reporting/model";
export type Enrollment = {
  organization_id: string;
  enabled: boolean;
  monthly: boolean;
  recipients: string[];
  audit_pricing: string;
  audit_fee: number;
  start_month: string;
  proposal_reference: string;
  revision: number;
  baseline_version_id: string | null;
};
export type Report = {
  id: string;
  organization_id: string;
  kind: "audit" | "monthly";
  period: string;
  current_version: number;
  status: string;
  approved_version: number | null;
  enrollment_revision: number;
};
export type Version = {
  report_id: string;
  version: number;
  snapshot: ReportContent;
};
export type Delivery = {
  report_id: string;
  version: number;
  status: string;
  provider_id: string | null;
  error: string | null;
  created_at: string;
};
const field =
  "w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900";
const button =
  "rounded bg-[#17201d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40";
export function ReportingWorkspace({
  organizations,
  enrollments,
  reports,
  versions,
  deliveries,
  events,
  emailConfigured,
}: {
  organizations: { id: string; name: string }[];
  enrollments: Enrollment[];
  reports: Report[];
  versions: Version[];
  deliveries: Delivery[];
  events: {
    action: string;
    created_at: string;
    report_id: string | null;
    actorName: string;
  }[];
  emailConfigured: boolean;
}) {
  const router = useRouter();
  const [org, setOrg] = useState(organizations[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [content, setContent] = useState<ReportContent>(emptyContent());
  const [kind, setKind] = useState<"audit" | "monthly">("audit");
  const [period, setPeriod] = useState(() => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date());
    return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-01`;
  });
  const e = enrollments.find((e) => e.organization_id === org);
  const orgReports = reports.filter((r) => r.organization_id === org);
  async function act(payload: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/digital-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(
        result.status === "accepted"
          ? "Email provider accepted the approved PDF. Inbox delivery has not been confirmed."
          : "Saved. Approval never sends a report.",
      );
      router.refresh();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  function updateText(
    key: "summary" | "workCompleted" | "nextSteps" | "limitations",
    value: string,
  ) {
    setContent({ ...content, [key]: value });
  }
  function edit(r: Report) {
    const v = versions.find(
      (v) => v.report_id === r.id && v.version === r.current_version,
    );
    setEditing(r);
    setKind(r.kind);
    setPeriod(r.period);
    setContent(v ? contentSchema.parse(v.snapshot) : emptyContent());
  }
  const monthParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const currentMonth = `${monthParts.find((p) => p.type === "year")!.value}-${monthParts.find((p) => p.type === "month")!.value}-01`;
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#9a5f34]">
          D2D Marketing
        </p>
        <h1 className="mt-2 font-display text-4xl">
          Digital Performance Reporting
        </h1>
        <p className="mt-3 text-stone-600">
          Generate PDF → Preview → Review → Approve → Send Report. Every
          delivery requires an explicit click.
        </p>
      </header>
      <p role="status" className="text-sm text-[#9a5f34]">
        {message ||
          (emailConfigured
            ? "Report email is configured."
            : "Email setup required before delivery. Drafts and approval remain available.")}
      </p>
      <label className="block">
        Customer
        <select
          className={field}
          value={org}
          onChange={(event) => {
            setOrg(event.target.value);
            setEditing(null);
            setContent(emptyContent());
          }}
        >
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <section className="rounded border border-stone-200 bg-white p-5">
        <h2 className="font-display text-2xl">Customer enrollment</h2>
        <form
          key={`${org}-${e?.revision ?? 0}`}
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            await act({
              action: "enroll",
              expected: e?.revision ?? 0,
              enrollment: {
                organizationId: org,
                enabled: data.get("enabled") === "on",
                monthly: data.get("monthly") === "on",
                recipients: String(data.get("recipients"))
                  .split(/[,;\n]/)
                  .map((s) => s.trim())
                  .filter(Boolean),
                auditPricing: data.get("pricing"),
                auditFee: Number(data.get("fee")),
                startMonth: `${data.get("start")}-01`,
                proposalReference: String(data.get("proposal")),
              },
            });
          }}
        >
          <label>
            <input type="checkbox" name="enabled" defaultChecked={e?.enabled} />{" "}
            Reporting enabled
          </label>
          <label>
            <input type="checkbox" name="monthly" defaultChecked={e?.monthly} />{" "}
            Monthly reporting enrolled
          </label>
          <label>
            Recipient emails (comma separated)
            <input
              className={field}
              name="recipients"
              required
              defaultValue={e?.recipients.join(", ")}
            />
          </label>
          <label>
            Monthly start
            <input
              className={field}
              type="month"
              name="start"
              required
              defaultValue={
                e?.start_month.slice(0, 7) ?? currentMonth.slice(0, 7)
              }
            />
          </label>
          <label>
            Audit arrangement
            <select
              className={field}
              name="pricing"
              defaultValue={e?.audit_pricing ?? "complimentary"}
            >
              <option value="complimentary">Complimentary</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label>
            Agreed audit fee (USD)
            <input
              className={field}
              type="number"
              name="fee"
              min="0"
              step="0.01"
              defaultValue={e?.audit_fee ?? 0}
            />
          </label>
          <label className="sm:col-span-2">
            Quote Studio proposal reference
            <input
              className={field}
              name="proposal"
              maxLength={500}
              defaultValue={e?.proposal_reference ?? ""}
            />
          </label>
          <p className="text-sm text-stone-600">
            {e?.baseline_version_id
              ? "Approved audit baseline established and preserved."
              : "An approved initial audit is required before monthly reporting."}{" "}
            Enrollment changes invalidate pending approvals.
          </p>
          <button className={button} disabled={busy || !org}>
            Save enrollment
          </button>
        </form>
      </section>
      <section className="rounded border border-stone-200 bg-white p-5">
        <h2 className="font-display text-2xl">Reports & delivery history</h2>
        <p className="mt-2 text-sm text-stone-600">
          Monthly preparation creates drafts only. Reports are due after the
          reporting month ends. The initial audit must be sent to the enrolled
          recipients before a monthly report can be released.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className={button}
            disabled={busy || !e?.enabled || Boolean(e?.baseline_version_id)}
            onClick={() => {
              setEditing(null);
              setKind("audit");
              setPeriod(currentMonth);
              setContent(emptyContent());
            }}
          >
            Prepare initial audit
          </button>
          <button
            className={button}
            disabled={
              busy || !e?.enabled || !e?.monthly || !e.baseline_version_id
            }
            onClick={() => {
              setEditing(null);
              setKind("monthly");
              setPeriod(previousMonth(currentMonth));
              setContent(emptyContent());
            }}
          >
            Prepare monthly draft
          </button>
        </div>
        {orgReports.length === 0 ? (
          <p className="mt-4 text-sm">No reports yet.</p>
        ) : null}
        {orgReports.map((r) => (
          <article key={r.id} className="mt-5 border-t border-stone-200 pt-4">
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="font-semibold">
                {r.kind === "audit" ? "Initial audit" : "Monthly report"} ·{" "}
                {r.period.slice(0, 7)} · v{r.current_version} · {r.status}
              </h3>
              <div className="flex flex-wrap gap-2">
                <a
                  className="rounded border px-3 py-2 text-sm"
                  target="_blank"
                  rel="noreferrer"
                  href={`/api/digital-reports/${r.id}/pdf?version=${r.current_version}`}
                >
                  Preview PDF
                </a>
                <button
                  className={button}
                  disabled={busy || ["sending", "uncertain"].includes(r.status)}
                  onClick={() => edit(r)}
                >
                  Revise draft
                </button>
                <button
                  className={button}
                  disabled={
                    busy ||
                    r.status !== "draft" ||
                    r.enrollment_revision !== e?.revision
                  }
                  onClick={() =>
                    act({
                      action: "review",
                      organizationId: org,
                      reportId: r.id,
                      expected: r.current_version,
                    })
                  }
                >
                  Mark reviewed
                </button>
                <button
                  className={button}
                  disabled={busy || r.status !== "in_review"}
                  onClick={() =>
                    act({
                      action: "approve",
                      organizationId: org,
                      reportId: r.id,
                      expected: r.current_version,
                    })
                  }
                >
                  Approve PDF
                </button>
                <button
                  className="rounded bg-[#9a5f34] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  disabled={busy || !emailConfigured || r.status !== "approved"}
                  onClick={() =>
                    act({
                      action: "send",
                      organizationId: org,
                      reportId: r.id,
                      expected: r.current_version,
                    })
                  }
                >
                  Send Report
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm">
              Versions:{" "}
              {versions
                .filter((v) => v.report_id === r.id)
                .map((v) => (
                  <a
                    className="mr-3 underline"
                    key={v.version}
                    target="_blank"
                    rel="noreferrer"
                    href={`/api/digital-reports/${r.id}/pdf?version=${v.version}`}
                  >
                    PDF v{v.version}
                  </a>
                ))}
            </p>
            {deliveries
              .filter((d) => d.report_id === r.id)
              .map((d) => (
                <p key={`${d.report_id}-${d.version}`} className="mt-2 text-sm">
                  v{d.version} · {d.status} · {d.created_at}{" "}
                  {d.provider_id ? `· Provider ID ${d.provider_id}` : ""}{" "}
                  {d.error ? `· ${d.error}` : ""}
                </p>
              ))}
            {["sending", "uncertain"].includes(r.status) ? (
              <form
                className="mt-4 grid gap-3 rounded border border-amber-200 bg-amber-50 p-4 sm:grid-cols-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  await act({
                    action: "reconcile",
                    organizationId: org,
                    reportId: r.id,
                    expected: r.current_version,
                    outcome: data.get("outcome"),
                    providerId: data.get("providerId"),
                    reason: data.get("reason"),
                  });
                }}
              >
                <p className="text-sm sm:col-span-2">
                  Check the exact attempt in Resend before recording its
                  outcome. This action records evidence and sends no email.
                </p>
                <label>
                  Verified provider outcome
                  <select className={field} name="outcome">
                    <option value="accepted">Provider accepted</option>
                    <option value="failed">Provider confirmed rejection</option>
                  </select>
                </label>
                <label>
                  Provider acceptance ID
                  <input className={field} name="providerId" />
                </label>
                <label className="sm:col-span-2">
                  Provider reconciliation evidence
                  <textarea
                    className={field}
                    name="reason"
                    required
                    minLength={10}
                    maxLength={1000}
                  />
                </label>
                <button className={button} disabled={busy}>
                  Record delivery reconciliation
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </section>
      <section className="rounded border border-stone-200 bg-white p-5">
        <h2 className="font-display text-2xl">
          {editing
            ? `Revise v${editing.current_version} as a new PDF version`
            : "Create a PDF draft"}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Supply evidence for this customer and reporting period. Match source
          and method across periods. Approved audit content is immutable.
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            let target = editing;
            if (!target)
              target =
                orgReports.find(
                  (r) =>
                    r.kind === kind &&
                    (kind === "audit" || r.period === period),
                ) ?? null;
            const saved = await act({
              action: "draft",
              organizationId: org,
              reportId: target?.id ?? null,
              expected: target?.current_version ?? 0,
              kind,
              period,
              content,
            });
            if (saved) setEditing(null);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Report type
              <select
                className={field}
                value={kind}
                disabled={Boolean(editing)}
                onChange={(event) =>
                  setKind(event.target.value as "audit" | "monthly")
                }
              >
                <option value="audit">Initial audit</option>
                <option value="monthly">Monthly report</option>
              </select>
            </label>
            <label>
              Reporting month
              <input
                className={field}
                type="month"
                required
                value={period.slice(0, 7)}
                disabled={Boolean(editing)}
                onChange={(event) => setPeriod(`${event.target.value}-01`)}
              />
            </label>
          </div>
          {(
            [
              ["summary", "Executive assessment"],
              ["workCompleted", "Work completed"],
              ["nextSteps", "Next month's priorities"],
              ["limitations", "Data limitations"],
            ] as const
          ).map(([key, label]) => (
            <label className="block" key={key}>
              {label}
              <textarea
                className={field}
                rows={3}
                required={key === "summary" || key === "limitations"}
                maxLength={key === "summary" ? 4000 : 6000}
                value={content[key]}
                onChange={(event) => updateText(key, event.target.value)}
              />
            </label>
          ))}
          {metricDefinitions.map(([key, category, label, unit]) => {
            const metric = content.metrics.find((m) => m.key === key)!;
            function update(patch: Partial<typeof metric>) {
              setContent({
                ...content,
                metrics: content.metrics.map((m) =>
                  m.key === key ? { ...m, ...patch } : m,
                ),
              });
            }
            return (
              <details key={key} className="rounded border p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  {category} · {label} · {metric.status}
                  {metric.value !== null ? ` (${metric.value} ${unit})` : ""}
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label>
                    Status
                    <select
                      className={field}
                      value={metric.status}
                      onChange={(event) =>
                        update({
                          status: event.target.value as typeof metric.status,
                          value: null,
                        })
                      }
                    >
                      <option value="missing">Unavailable</option>
                      <option value="verified">Verified with evidence</option>
                      <option value="not_applicable">Not applicable</option>
                    </select>
                  </label>
                  <label>
                    Value ({unit})
                    <input
                      className={field}
                      type="number"
                      min="0"
                      step="any"
                      disabled={metric.status !== "verified"}
                      value={metric.value ?? ""}
                      onChange={(event) =>
                        update({
                          value:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Source / property
                    <input
                      className={field}
                      value={metric.source}
                      onChange={(event) =>
                        update({ source: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Collection timestamp (UTC ISO)
                    <input
                      className={field}
                      placeholder="2026-10-12T12:00:00Z"
                      value={metric.measuredAt ?? ""}
                      onChange={(event) =>
                        update({ measuredAt: event.target.value || null })
                      }
                    />
                  </label>
                  <label>
                    Method, filters, timezone / prompt panel
                    <input
                      className={field}
                      value={metric.method}
                      onChange={(event) =>
                        update({ method: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Evidence reference
                    <input
                      className={field}
                      value={metric.evidence}
                      onChange={(event) =>
                        update({ evidence: event.target.value })
                      }
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Missing-data reason
                    <input
                      className={field}
                      value={metric.reason}
                      onChange={(event) =>
                        update({ reason: event.target.value })
                      }
                    />
                  </label>
                </div>
              </details>
            );
          })}
          <button className={button} disabled={busy || !e?.enabled}>
            Generate versioned PDF draft
          </button>
        </form>
      </section>
      <section>
        <h2 className="font-display text-2xl">Audit trail</h2>
        {events.map((event, index) => (
          <p key={index} className="mt-2 text-sm">
            {event.created_at} · {event.action} · {event.actorName} ·{" "}
            {event.report_id ?? "Enrollment"}
          </p>
        ))}
      </section>
    </div>
  );
}
