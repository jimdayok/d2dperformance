import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ admin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.admin,
}));
import { prepareMonthlyDrafts } from "@/lib/digital-reporting/recurring";
import { GET } from "@/app/api/digital-reports/prepare-monthly/route";
import { emptyContent } from "@/lib/digital-reporting/model";
let rpc: ReturnType<typeof vi.fn>, existing: boolean;
const enrollment = {
  organization_id: "20000000-0000-4000-8000-000000000001",
  enabled: true,
  monthly: true,
  recipients: ["example@example.com"],
  audit_pricing: "complimentary",
  audit_fee: 0,
  start_month: "2025-11-01",
  revision: 1,
  baseline_version_id: "baseline",
  proposal_reference: "QA",
};
beforeEach(() => {
  existing = false;
  rpc = vi.fn().mockResolvedValue({ data: {}, error: null });
  process.env.DIGITAL_REPORT_AUTOMATION_ACTOR_ID =
    "10000000-0000-4000-8000-000000000001";
  process.env.CRON_SECRET = "test-secret";
  mocks.admin.mockReturnValue({
    rpc,
    from: (table: string) => {
      const result = () => ({
        error: null,
        data:
          table === "digital_report_enrollments"
            ? [enrollment]
            : table === "organizations"
              ? { name: "QA customer" }
              : table === "digital_report_versions"
                ? {
                    report_id: "audit",
                    version: 1,
                    snapshot: {
                      period: "2025-11-01",
                      metrics: emptyContent().metrics,
                    },
                  }
                : existing
                  ? { id: "existing" }
                  : null,
      });
      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        single: vi.fn(async () => result()),
        maybeSingle: vi.fn(async () => result()),
        then: (resolve: (x: unknown) => unknown) =>
          Promise.resolve(result()).then(resolve),
      };
      return query;
    },
  });
});
describe("draft-only monthly preparation", () => {
  it("creates the last completed month with explicit missing data and immutable baseline", async () => {
    const result = await prepareMonthlyDrafts(new Date("2026-01-01T16:00:00Z"));
    expect(result.period).toBe("2025-12-01");
    expect(result.results[0].status).toBe("draft_created");
    const payload = rpc.mock.calls[0][1];
    expect(payload.p_action).toBe("draft");
    expect(payload.p_payload.snapshot.baseline.version).toBe(1);
    expect(
      payload.p_payload.snapshot.metrics.every(
        (m: { value: unknown; status: string }) =>
          m.value === null && m.status === "missing",
      ),
    ).toBe(true);
    expect(
      Buffer.from(payload.p_payload.pdf, "base64").subarray(0, 4).toString(),
    ).toBe("%PDF");
  });
  it("does not overwrite already prepared or approved reports", async () => {
    existing = true;
    const result = await prepareMonthlyDrafts(new Date("2026-01-01T16:00:00Z"));
    expect(result.results[0].status).toBe("exists");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("uses the Chicago calendar at UTC month boundaries", async () => {
    const result = await prepareMonthlyDrafts(new Date("2026-01-01T00:00:00Z"));
    expect(result.period).toBe("2025-11-01");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated cron invocations before touching customer data", async () => {
    const response = await GET(
      new Request("https://example.com/api/digital-reports/prepare-monthly"),
    );
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
});
