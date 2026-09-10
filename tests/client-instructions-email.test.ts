import { describe, expect, it } from "vitest";
import { buildClientInstructionsEmail } from "@/lib/d2d-platform/client-instructions-email-template";

const message = buildClientInstructionsEmail({
  displayName: "Mike Smith",
  email: "mike@example.com",
  organizationName: "Mike's <Square>",
  loginUrl: "https://webadmin.d2dmktg.com/portal/login",
  supportEmail: "andrea@d2dmktg.com",
  services: [{
    product: "social",
    label: "D2D Social",
    description: "Marketing plans, promotions, social content, and approvals.",
    role: "reviewer",
  }],
});

describe("client login instructions email", () => {
  it("includes the secure sign-in route, recipient identity, and assigned services", () => {
    expect(message.subject).toBe("Your D2D Account for Mike's <Square>");
    expect(message.text).toContain("https://webadmin.d2dmktg.com/portal/login");
    expect(message.text).toContain("mike@example.com");
    expect(message.text).toContain("D2D Social (Reviewer)");
    expect(message.html).toContain("Open D2D Account");
    expect(message.html).toContain("Your services");
  });

  it("escapes customer-controlled content in the HTML message", () => {
    expect(message.html).toContain("Mike&#039;s &lt;Square&gt;");
    expect(message.html).not.toContain("Mike's <Square>");
  });
});
