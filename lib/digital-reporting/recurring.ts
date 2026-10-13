import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emptyContent, previousMonth, type Snapshot } from "./model";
import { renderReportPdf } from "./pdf";

/** Monthly automation has draft-only database permission; no delivery module is imported. */
export async function prepareMonthlyDrafts(now = new Date()) {
  const actor = process.env.DIGITAL_REPORT_AUTOMATION_ACTOR_ID;
  if (!actor)
    throw new Error(
      "Monthly preparation requires DIGITAL_REPORT_AUTOMATION_ACTOR_ID.",
    );
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const period = previousMonth(
    `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-01`,
  );
  const db = createSupabaseAdminClient();
  const { data: enrollments, error } = await db
    .from("digital_report_enrollments")
    .select("*")
    .eq("enabled", true)
    .eq("monthly", true)
    .not("baseline_version_id", "is", null)
    .lte("start_month", period);
  if (error) throw new Error(error.message);
  const result: { organizationId: string; status: string; error?: string }[] =
    [];
  for (const e of enrollments ?? []) {
    try {
      const { data: existing, error: existsError } = await db
        .from("digital_reports")
        .select("id")
        .eq("organization_id", e.organization_id)
        .eq("kind", "monthly")
        .eq("period", period)
        .maybeSingle();
      if (existsError) throw new Error(existsError.message);
      if (existing) {
        result.push({ organizationId: e.organization_id, status: "exists" });
        continue;
      }
      const [
        { data: b, error: baselineError },
        { data: org, error: orgError },
      ] = await Promise.all([
        db
          .from("digital_report_versions")
          .select("report_id,version,snapshot")
          .eq("id", e.baseline_version_id)
          .single(),
        db
          .from("organizations")
          .select("name")
          .eq("id", e.organization_id)
          .eq("status", "active")
          .single(),
      ]);
      if (baselineError || orgError || !b || !org)
        throw new Error("Customer or baseline could not be loaded.");
      if (period <= b.snapshot.period) {
        result.push({
          organizationId: e.organization_id,
          status: "before_baseline",
        });
        continue;
      }
      let previous: Snapshot["previous"] = null;
      const { data: p, error: pError } = await db
        .from("digital_reports")
        .select("id,period,approved_version")
        .eq("organization_id", e.organization_id)
        .eq("kind", "monthly")
        .eq("period", previousMonth(period))
        .not("approved_version", "is", null)
        .maybeSingle();
      if (pError) throw new Error(pError.message);
      if (p) {
        const { data: pv, error: pvError } = await db
          .from("digital_report_versions")
          .select("snapshot")
          .eq("report_id", p.id)
          .eq("version", p.approved_version)
          .single();
        if (pvError) throw new Error(pvError.message);
        previous = {
          reportId: p.id,
          version: p.approved_version,
          period: p.period,
          metrics: pv!.snapshot.metrics,
        };
      }
      const snapshot: Snapshot = {
        ...emptyContent(),
        summary:
          "This month's results are waiting to be confirmed. D2D will explain the important changes and next steps after reviewing the information.",
        organizationName: org.name,
        organizationId: e.organization_id,
        kind: "monthly",
        period,
        createdAt: now.toISOString(),
        recipients: e.recipients,
        pricing:
          e.audit_pricing === "complimentary"
            ? "Complimentary"
            : `Paid - USD ${e.audit_fee}`,
        baseline: {
          reportId: b.report_id,
          version: b.version,
          period: b.snapshot.period,
          metrics: b.snapshot.metrics,
        },
        previous,
        proposalReference: e.proposal_reference,
      };
      const pdf = await renderReportPdf(snapshot, 1);
      const { error: saveError } = await db.rpc("digital_report_command", {
        p_action: "draft",
        p_org: e.organization_id,
        p_expected: 0,
        p_payload: {
          automationActor: actor,
          kind: "monthly",
          period,
          enrollmentRevision: e.revision,
          snapshot,
          pdf: pdf.toString("base64"),
          sha256: createHash("sha256").update(pdf).digest("hex"),
        },
      });
      if (saveError) throw new Error(saveError.message);
      result.push({
        organizationId: e.organization_id,
        status: "draft_created",
      });
    } catch (error) {
      result.push({
        organizationId: e.organization_id,
        status: "failed",
        error:
          error instanceof Error ? error.message : "Draft generation failed",
      });
    }
  }
  return { period, results: result };
}
