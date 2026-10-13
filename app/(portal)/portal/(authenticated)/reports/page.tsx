import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlatformAdminStatus } from "@/lib/d2d-platform/access";
import { getCurrentUser, getAccessibleSites } from "@/lib/site-manager/access";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { ReportingWorkspace } from "@/components/digital-reporting/workspace";
import { emailReady } from "@/lib/digital-reporting/service";
export const metadata = {
  title: "Digital Performance Reports | D2D Marketing",
  robots: { index: false, follow: false },
};
export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  const [isAdmin, sites, db] = await Promise.all([
    getPlatformAdminStatus(),
    getAccessibleSites(),
    createSupabaseServerClient(),
  ]);
  const [reportResult, versionResult, deliveryResult] = await Promise.all([
    db
      .from("digital_reports")
      .select(
        "id,organization_id,kind,period,current_version,status,approved_version,enrollment_revision",
      )
      .order("period", { ascending: false }),
    db
      .from("digital_report_versions")
      .select("report_id,version,snapshot")
      .order("version", { ascending: false }),
    db
      .from("digital_report_deliveries")
      .select("report_id,version,status,provider_id,error,created_at")
      .order("created_at", { ascending: false }),
  ]);
  const error =
    reportResult.error ?? versionResult.error ?? deliveryResult.error;
  let body;
  if (error) {
    body = (
      <div>
        <h1 className="font-display text-3xl">Digital Performance Reporting</h1>
        <p className="mt-4">
          Reporting setup is not complete. An administrator must apply the
          reporting database migration before this workspace is available.
        </p>
      </div>
    );
  } else if (isAdmin) {
    const [orgs, enrollments, events, branding] = await Promise.all([
      db
        .from("organizations")
        .select("id,name")
        .eq("status", "active")
        .order("name"),
      db.from("digital_report_enrollments").select("*"),
      db
        .from("digital_report_events")
        .select(
          "action,created_at,report_id,actor:profiles(display_name,email)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      db.from("digital_report_branding").select("organization_id,filename"),
    ]);
    if (orgs.error || enrollments.error || events.error)
      throw new Error("Reporting customer data could not be loaded.");
    if (branding.error)
      throw new Error(
        "Apply the customer logo migration to enable report personalization.",
      );
    body = (
      <ReportingWorkspace
        organizations={orgs.data ?? []}
        enrollments={(enrollments.data ?? []).map((e) => ({
          ...e,
          logoFilename:
            branding.data?.find((b) => b.organization_id === e.organization_id)
              ?.filename ?? null,
        }))}
        reports={reportResult.data ?? []}
        versions={versionResult.data ?? []}
        deliveries={deliveryResult.data ?? []}
        events={(events.data ?? []).map((event) => ({
          ...event,
          actorName:
            (
              (Array.isArray(event.actor)
                ? event.actor[0]
                : event.actor) as unknown as {
                display_name?: string;
                email?: string;
              } | null
            )?.display_name ||
            (
              (Array.isArray(event.actor)
                ? event.actor[0]
                : event.actor) as unknown as { email?: string } | null
            )?.email ||
            "Administrator",
        }))}
        emailConfigured={emailReady()}
      />
    );
  } else {
    body = (
      <div>
        <h1 className="font-display text-3xl">
          Your Digital Performance Reports
        </h1>
        <p className="mt-3 text-stone-600">
          Reports released by D2D Marketing appear here.
        </p>
        {deliveryResult.data?.length ? (
          deliveryResult.data.map((d) => {
            const report = reportResult.data?.find((r) => r.id === d.report_id);
            return (
              <article
                key={`${d.report_id}-${d.version}`}
                className="mt-5 rounded border bg-white p-5"
              >
                <h2 className="font-semibold">
                  {report?.kind === "audit"
                    ? "Initial audit"
                    : "Monthly performance"}{" "}
                  · {report?.period.slice(0, 7)}
                </h2>
                <a
                  className="mt-3 inline-block underline"
                  href={`/api/digital-reports/${d.report_id}/pdf?version=${d.version}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View PDF · version {d.version}
                </a>
              </article>
            );
          })
        ) : (
          <p className="mt-6">No reports have been released yet.</p>
        )}
      </div>
    );
  }
  return (
    <PortalShell
      definition={null}
      access={sites[0]?.access ?? null}
      displayName={user.email ?? "Account"}
      siteCount={sites.length}
    >
      {body}
    </PortalShell>
  );
}
