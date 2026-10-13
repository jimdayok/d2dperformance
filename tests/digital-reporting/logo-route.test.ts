import { beforeEach, describe, it, expect, vi } from "vitest";
import sharp from "sharp";
const mocks = vi.hoisted(() => ({ db: vi.fn(), admin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.db,
}));
vi.mock("@/lib/digital-reporting/service", () => ({
  requireReportAdmin: mocks.admin,
}));
import { POST, GET } from "@/app/api/digital-reports/logo/route";
let rpc: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  rpc = vi.fn().mockResolvedValue({ error: null });
  mocks.admin.mockResolvedValue(undefined);
  mocks.db.mockResolvedValue({ rpc });
});
const url = "https://webadmin.example.com/api/digital-reports/logo";
async function request(file: Uint8Array) {
  const form = new FormData();
  form.set("organizationId", "20000000-0000-4000-8000-000000000001");
  form.set("expected", "2");
  form.set(
    "logo",
    new Blob([new Uint8Array(file)], { type: "image/png" }),
    "client.png",
  );
  return new Request(url, {
    method: "POST",
    headers: { Origin: "https://webadmin.example.com" },
    body: form,
  });
}
describe("customer logo endpoint", () => {
  it("rejects cross-origin writes", async () => {
    const response = await POST(
      new Request(url, {
        method: "POST",
        headers: { Origin: "https://attacker.example.com" },
      }),
    );
    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated or non-admin requests before parsing an image", async () => {
    mocks.admin.mockRejectedValue(new Error("Administrator required"));
    const response = await POST(await request(new Uint8Array()));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    const preview = await GET(
      new Request(`${url}?organizationId=20000000-0000-4000-8000-000000000001`),
    );
    expect(preview.status).toBe(403);
  });
  it("saves only a validated PNG and the expected enrollment revision", async () => {
    const pixels = await sharp({
      create: { width: 100, height: 50, channels: 4, background: "#234567" },
    })
      .png()
      .toBuffer();
    const response = await POST(await request(pixels));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "digital_report_set_logo",
      expect.objectContaining({
        p_expected: 2,
        p_org: "20000000-0000-4000-8000-000000000001",
        p_logo: expect.objectContaining({
          filename: "client.png",
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
  });
  it("rejects a disguised SVG instead of rendering it", async () => {
    const response = await POST(
      await request(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
    );
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
