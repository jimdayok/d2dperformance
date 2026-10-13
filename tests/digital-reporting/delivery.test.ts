import { beforeEach, describe, it, expect, vi } from "vitest";
import { createHash } from "node:crypto";
const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  server: vi.fn(),
  isAdmin: vi.fn(),
  send: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.admin,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.server,
}));
vi.mock("@/lib/d2d-platform/access", () => ({
  getPlatformAdminStatus: mocks.isAdmin,
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
import { executeReportCommand, emailReady } from "@/lib/digital-reporting/service";
import { POST } from "@/app/api/digital-reports/route";
const organizationId = "20000000-0000-4000-8000-000000000001",
  reportId = "30000000-0000-4000-8000-000000000001";
const pdf = Buffer.from("%PDF approved immutable bytes");
const version = {
  pdf_base64: pdf.toString("base64"),
  pdf_sha256: createHash("sha256").update(pdf).digest("hex"),
  snapshot: { organizationName: "QA account", period: "2026-09-01" },
};
let rpc: ReturnType<typeof vi.fn>, finish: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "TEST-ONLY";
  process.env.DIGITAL_REPORT_FROM_EMAIL = "qa@example.com";
  mocks.isAdmin.mockResolvedValue(true);
  mocks.send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
  rpc = vi
    .fn()
    .mockResolvedValue({
      data: { deliveryId: "delivery-id", recipients: ["customer@example.com"] },
      error: null,
    });
  finish = vi.fn().mockResolvedValue({ error: null });
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: version, error: null }),
  };
  mocks.server.mockResolvedValue({ from: () => chain, rpc });
  mocks.admin.mockReturnValue({ rpc: finish });
});
describe("manual report delivery", () => {
  it("reuses the existing D2D sender while preserving manual delivery", async () => {
    delete process.env.DIGITAL_REPORT_FROM_EMAIL;
    process.env.CONTACT_FORM_FROM_EMAIL = "D2D <reports@example.com>";
    expect(emailReady()).toBe(true);
    await executeReportCommand({ action: "send", organizationId, reportId, expected: 1 });
    expect(mocks.send.mock.calls[0][0].from).toBe("D2D <reports@example.com>");
    delete process.env.CONTACT_FORM_FROM_EMAIL;
  });

  it("approval only records approval and never calls email", async () => {
    await executeReportCommand({
      action: "approve",
      organizationId,
      reportId,
      expected: 1,
    });
    expect(rpc).toHaveBeenCalledWith(
      "digital_report_command",
      expect.objectContaining({ p_action: "approve" }),
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("non-admins cannot send", async () => {
    mocks.isAdmin.mockResolvedValue(false);
    await expect(
      executeReportCommand({
        action: "send",
        organizationId,
        reportId,
        expected: 1,
      }),
    ).rejects.toThrow("administrator");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("missing email configuration never claims delivery", async () => {
    delete process.env.DIGITAL_REPORT_FROM_EMAIL;
    await expect(
      executeReportCommand({
        action: "send",
        organizationId,
        reportId,
        expected: 1,
      }),
    ).rejects.toThrow("email needs");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("sends exact PDF bytes to the transactionally approved recipients", async () => {
    await executeReportCommand({
      action: "send",
      organizationId,
      reportId,
      expected: 1,
    });
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["customer@example.com"],
        attachments: [
          { filename: "D2D-Performance-2026-09-v1.pdf", content: pdf },
        ],
      }),
      { idempotencyKey: `digital-report-${reportId}-v1` },
    );
    expect(finish).toHaveBeenCalledWith(
      "digital_report_finish",
      expect.objectContaining({
        p_status: "accepted",
        p_provider: "provider-id",
      }),
    );
  });
  it("blocked or stale claims cannot contact the email provider", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Exact PDF must be approved" },
    });
    await expect(
      executeReportCommand({
        action: "send",
        organizationId,
        reportId,
        expected: 1,
      }),
    ).rejects.toThrow("approved");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("records timeout as uncertain, with no automatic retry", async () => {
    mocks.send.mockRejectedValue(new Error("timeout"));
    await expect(
      executeReportCommand({
        action: "send",
        organizationId,
        reportId,
        expected: 1,
      }),
    ).rejects.toThrow("unknown");
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledWith(
      "digital_report_finish",
      expect.objectContaining({ p_status: "uncertain" }),
    );
  });
  it("records provider rejection as failed", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: { message: "Sender rejected" },
    });
    await expect(
      executeReportCommand({
        action: "send",
        organizationId,
        reportId,
        expected: 1,
      }),
    ).rejects.toThrow("Sender rejected");
    expect(finish).toHaveBeenCalledWith(
      "digital_report_finish",
      expect.objectContaining({ p_status: "failed" }),
    );
  });
  it("rejects cross-origin mutations", async () => {
    const response = await POST(
      new Request("https://webadmin.example.com/api/digital-reports", {
        method: "POST",
        headers: { Origin: "https://attacker.example.com" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
});
