import { describe, expect, it } from "vitest";
import { getSiteDefinition, listSiteDefinitions } from "@/lib/site-manager/registry";
import { acadiaHeroSchema } from "@/lib/site-manager/sites/acadia-eye/validation";
import { phoenixGatewaySchema } from "@/lib/site-manager/sites/phoenix-builds/validation";

describe("customer site definitions", () => {
  it("registers Alford, Acadia Eye, and Phoenix Builds", () => {
    expect(listSiteDefinitions().map((site) => site.key).sort()).toEqual(["acadia-eye", "alford-custom-homes", "phoenix-builds"]);
  });

  it("keeps preview paths explicitly scoped", () => {
    expect(getSiteDefinition("acadia-eye")?.allowedPreviewPaths).toContain("/services");
    expect(getSiteDefinition("phoenix-builds")?.allowedPreviewPaths).toContain("/commercial");
    expect(getSiteDefinition("phoenix-builds")?.allowedPreviewPaths).not.toContain("/commercial/projects");
  });

  it("rejects unsafe or incomplete editable content", () => {
    expect(acadiaHeroSchema.safeParse({ heading: "Incomplete" }).success).toBe(false);
    expect(phoenixGatewaySchema.safeParse({ commercialHeading: "Incomplete" }).success).toBe(false);
  });
});
