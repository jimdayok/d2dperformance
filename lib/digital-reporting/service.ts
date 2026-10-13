import "server-only";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPlatformAdminStatus } from "@/lib/d2d-platform/access";
import {
  contentSchema,
  enrollmentSchema,
  previousMonth,
  type Snapshot,
} from "./model";
import { renderReportPdf } from "./pdf";
import { z } from "zod";

export const commandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("enroll"),
    expected: z.number().int().nonnegative(),
    enrollment: enrollmentSchema,
  }),
  z.object({
    action: z.literal("reconcile"),
    organizationId: z.string().uuid(),
    reportId: z.string().uuid(),
    expected: z.number().int().positive(),
    outcome: z.enum(["accepted", "failed"]),
    providerId: z.string().trim().max(200),
    reason: z.string().trim().min(10).max(1000),
  }),
  z.object({
    action: z.literal("draft"),
    organizationId: z.string().uuid(),
    reportId: z.string().uuid().nullable(),
    expected: z.number().int().nonnegative(),
    kind: z.enum(["audit", "monthly"]),
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/),
    content: contentSchema,
  }),
  z.object({
    action: z.enum(["review", "approve", "send"]),
    organizationId: z.string().uuid(),
    reportId: z.string().uuid(),
    expected: z.number().int().positive(),
  }),
]);
export async function requireReportAdmin() {
  if (!(await getPlatformAdminStatus()))
    throw new Error("Platform administrator permission required.");
}
export function emailReady() {
  return Boolean(
    process.env.RESEND_API_KEY && process.env.DIGITAL_REPORT_FROM_EMAIL,
  );
}
async function command(
  action: string,
  organizationId: string,
  reportId: string | null,
  expected: number,
  payload: unknown = {},
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc("digital_report_command", {
    p_action: action,
    p_org: organizationId,
    p_report: reportId,
    p_expected: expected,
    p_payload: payload,
  });
  if (error) throw new Error(error.message);
  return data;
}
export async function executeReportCommand(raw: unknown) {
  await requireReportAdmin();
  const input = commandSchema.parse(raw);
  if (input.action === "enroll")
    return command(
      "enroll",
      input.enrollment.organizationId,
      null,
      input.expected,
      input.enrollment,
    );
  if (input.action === "reconcile")
    return command(
      "reconcile",
      input.organizationId,
      input.reportId,
      input.expected,
      {
        outcome: input.outcome,
        providerId: input.providerId,
        reason: input.reason,
      },
    );
  if (input.action === "draft") {
    const db = await createSupabaseServerClient();
    const { data: e, error } = await db
      .from("digital_report_enrollments")
      .select("*")
      .eq("organization_id", input.organizationId)
      .single();
    if (error || !e?.enabled)
      throw new Error("Activate this customer's reporting enrollment first.");
    const { data: organization, error: orgError } = await db
      .from("organizations")
      .select("name")
      .eq("id", input.organizationId)
      .single();
    if (orgError || !organization) throw new Error("Customer not found.");
    let baseline: Snapshot["baseline"] = null;
    if (e.baseline_version_id) {
      const { data: b, error: baselineError } = await db
        .from("digital_report_versions")
        .select("report_id,version,snapshot")
        .eq("id", e.baseline_version_id)
        .single();
      if (baselineError || !b) throw new Error("Baseline could not be loaded.");
      baseline = {
        reportId: b.report_id,
        version: b.version,
        period: b.snapshot.period,
        metrics: b.snapshot.metrics,
      };
      if (input.kind === "audit") {
        const original = contentSchema.parse(b.snapshot);
        if (JSON.stringify(original) !== JSON.stringify(input.content))
          throw new Error(
            "The approved audit content is immutable. Use a monthly report to add new evidence.",
          );
      }
    }
    if (input.kind === "monthly" && (!baseline || !e.monthly))
      throw new Error(
        "Monthly reports need an approved audit baseline and monthly enrollment.",
      );
    let previous: Snapshot["previous"] = null;
    const { data: prior, error: priorError } = await db
      .from("digital_reports")
      .select("id,approved_version,period")
      .eq("organization_id", input.organizationId)
      .eq("kind", "monthly")
      .eq("period", previousMonth(input.period))
      .not("approved_version", "is", null)
      .maybeSingle();
    if (priorError) throw new Error(priorError.message);
    if (prior) {
      const { data: v, error: vError } = await db
        .from("digital_report_versions")
        .select("snapshot")
        .eq("report_id", prior.id)
        .eq("version", prior.approved_version)
        .single();
      if (vError) throw new Error(vError.message);
      previous = {
        reportId: prior.id,
        version: prior.approved_version,
        period: prior.period,
        metrics: v!.snapshot.metrics,
      };
    }
    const snapshot: Snapshot = {
      ...input.content,
      organizationName: organization.name,
      organizationId: input.organizationId,
      kind: input.kind,
      period: input.period,
      createdAt: new Date().toISOString(),
      recipients: e.recipients,
      pricing:
        e.audit_pricing === "complimentary"
          ? "Complimentary"
          : `Paid - USD ${Number(e.audit_fee).toFixed(2)}`,
      baseline,
      previous,
      proposalReference: e.proposal_reference,
    };
    const pdf = await renderReportPdf(snapshot, input.expected + 1);
    return command(
      "draft",
      input.organizationId,
      input.reportId,
      input.expected,
      {
        kind: input.kind,
        period: input.period,
        enrollmentRevision: e.revision,
        snapshot,
        pdf: pdf.toString("base64"),
        sha256: createHash("sha256").update(pdf).digest("hex"),
      },
    );
  }
  if (input.action !== "send")
    return command(
      input.action,
      input.organizationId,
      input.reportId,
      input.expected,
    );
  if (!emailReady())
    throw new Error(
      "Report email needs RESEND_API_KEY and DIGITAL_REPORT_FROM_EMAIL.",
    );
  // Initialize the completion client before claiming; missing config must not strand a send.
  const admin = createSupabaseAdminClient();
  const db = await createSupabaseServerClient();
  const { data: v, error: vError } = await db
    .from("digital_report_versions")
    .select("pdf_base64,pdf_sha256,snapshot")
    .eq("report_id", input.reportId)
    .eq("version", input.expected)
    .single();
  if (vError || !v) throw new Error("PDF version not found.");
  const pdf = Buffer.from(v.pdf_base64, "base64");
  if (createHash("sha256").update(pdf).digest("hex") !== v.pdf_sha256)
    throw new Error("PDF integrity check failed. Delivery blocked.");
  const claim = await command(
    "claim_send",
    input.organizationId,
    input.reportId,
    input.expected,
  );
  let status = "uncertain",
    providerId: string | null = null,
    deliveryError: string | null = null;
  try {
    const { data, error } = await new Resend(
      process.env.RESEND_API_KEY,
    ).emails.send(
      {
        from: process.env.DIGITAL_REPORT_FROM_EMAIL!,
        to: claim.recipients,
        subject: `D2D Digital Performance Report | ${v.snapshot.organizationName} | ${v.snapshot.period.slice(0, 7)}`,
        text: `Your D2D Digital Performance Report is attached. This report covers ${v.snapshot.period.slice(0, 7)} and includes the available evidence, baseline comparisons, and next steps.\n\nD2D Marketing`,
        attachments: [
          {
            filename: `D2D-Performance-${v.snapshot.period.slice(0, 7)}-v${input.expected}.pdf`,
            content: pdf,
          },
        ],
      },
      { idempotencyKey: `digital-report-${input.reportId}-v${input.expected}` },
    );
    if (error) {
      status = "failed";
      deliveryError = error.message;
    } else if (data?.id) {
      status = "accepted";
      providerId = data.id;
    } else {
      deliveryError =
        "Provider returned no acceptance identifier. Investigate before any resend.";
    }
  } catch {
    deliveryError =
      "Provider outcome is unknown. Reconcile with Resend before any further delivery.";
  }
  const { error: finishError } = await admin.rpc("digital_report_finish", {
    p_delivery: claim.deliveryId,
    p_status: status,
    p_provider: providerId,
    p_error: deliveryError,
  });
  if (finishError)
    throw new Error(
      "Delivery outcome could not be recorded. The report remains locked; reconcile with Resend before retrying.",
    );
  if (status !== "accepted")
    throw new Error(deliveryError ?? "Delivery was not accepted.");
  return { status: "accepted", providerId };
}
