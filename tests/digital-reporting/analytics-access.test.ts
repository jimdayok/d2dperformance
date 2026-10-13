import { beforeEach, describe, expect, it, vi } from "vitest";
const access = vi.hoisted(() => ({ user: vi.fn(), admin: vi.fn(), sites: vi.fn() }));
vi.mock("@/lib/site-manager/access", () => ({ getCurrentUser: access.user, getAccessibleSites: access.sites }));
vi.mock("@/lib/d2d-platform/access", () => ({ getPlatformAdminStatus: access.admin }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("@/components/site-manager/portal-shell", () => ({ PortalShell: () => null }));
import AnalyticsPage from "@/app/(portal)/portal/(authenticated)/admin/analytics/page";
describe("D2D Analytics administration access", () => {
  beforeEach(() => { vi.clearAllMocks(); access.sites.mockResolvedValue([]); });
  it("requires sign-in before loading administrative information", async () => {
    access.user.mockResolvedValue(null);
    await expect(AnalyticsPage()).rejects.toThrow("redirect:/portal/login");
    expect(access.admin).not.toHaveBeenCalled();
    expect(access.sites).not.toHaveBeenCalled();
  });
  it("denies signed-in customers who are not platform administrators", async () => {
    access.user.mockResolvedValue({ email: "customer@example.com" }); access.admin.mockResolvedValue(false);
    await expect(AnalyticsPage()).rejects.toThrow("redirect:/portal/dashboard");
    expect(access.sites).not.toHaveBeenCalled();
  });
  it("opens the reporting directory for platform administrators", async () => {
    access.user.mockResolvedValue({ email: "admin@example.com" }); access.admin.mockResolvedValue(true);
    const page = await AnalyticsPage();
    expect(page.props.children).toBeTruthy();
    expect(access.sites).toHaveBeenCalledOnce();
  });
});
