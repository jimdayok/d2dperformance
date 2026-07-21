import { describe, expect, it } from "vitest";
import { canEdit, canManageUsers, canPublish } from "@/lib/site-manager/permissions";
import type { SiteRole, UserAccess } from "@/lib/site-manager/types";

const access = (role: SiteRole | null, mode: UserAccess["publishingMode"] = "approval_required", admin = false): UserAccess => ({ userId: "user", siteId: "site", organizationId: "org", role, publishingMode: mode, isPlatformAdmin: admin });

describe("site manager permissions", () => {
  it("keeps viewers read-only", () => { expect(canEdit(access("viewer"))).toBe(false); expect(canPublish(access("viewer"))).toBe(false); });
  it("allows editors to draft but not publish", () => { expect(canEdit(access("editor"))).toBe(true); expect(canPublish(access("editor"))).toBe(false); });
  it("allows publishers on approval-required sites", () => expect(canPublish(access("publisher"))).toBe(true));
  it("allows site admins to publish only in client-can-publish mode", () => { expect(canPublish(access("site_admin"))).toBe(false); expect(canPublish(access("site_admin", "client_can_publish"))).toBe(true); });
  it("allows platform admins across roles", () => { expect(canPublish(access(null, "approval_required", true))).toBe(true); expect(canManageUsers(access(null, "approval_required", true))).toBe(true); });
});
