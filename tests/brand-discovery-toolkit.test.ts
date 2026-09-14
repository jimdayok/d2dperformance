import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Brand Discovery toolkit placement", () => {
  it("houses Brand Discovery with the D2D Performance tools", () => {
    const tools = readFileSync("sections/home/operational-tools.tsx", "utf8");
    const navigation = readFileSync("components/refined-nav.tsx", "utf8");

    expect(tools).toContain('name: "D2D Brand Discovery"');
    expect(tools).toContain('href: "/brand-development#brand-discovery"');
    expect(navigation).toContain('label: "Brand Discovery"');
  });

  it("scrolls the form only after an intentional form action", () => {
    const form = readFileSync("components/brand-discovery-form.tsx", "utf8");

    expect(form).toContain("function scrollToQuestionTop()");
    expect(form).not.toMatch(
      /useEffect\(\(\) => \{\s*if \(!hydrated \|\| !draft\.started\)[\s\S]*?scrollIntoView/,
    );
  });
});
