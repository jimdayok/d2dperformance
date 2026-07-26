import { describe, expect, it } from "vitest";
import {
  getInstagramAccounts,
  isSafeInstagramHandle,
} from "../lib/d2dmktg/instagram";

describe("Instagram showcase configuration", () => {
  it("includes the initial assigned accounts", () => {
    expect(getInstagramAccounts(undefined).map((account) => account.handle)).toEqual([
      "day2daymarketing",
      "artisanlabntwk",
      "gatheronthesquare",
    ]);
  });

  it("normalizes configured handles and removes duplicates", () => {
    expect(
      getInstagramAccounts(
        "@day2daymarketing, artisanlabntwk, @day2daymarketing",
      ).map((account) => account.handle),
    ).toEqual(["day2daymarketing", "artisanlabntwk"]);
  });

  it("rejects handles that cannot be safely interpolated into Graph fields", () => {
    expect(isSafeInstagramHandle("gatheronthesquare")).toBe(true);
    expect(isSafeInstagramHandle("not-valid}")).toBe(false);
  });
});
