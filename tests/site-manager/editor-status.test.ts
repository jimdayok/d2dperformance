import { describe, expect, it } from "vitest";
import { resolveEditorStatus } from "@/lib/site-manager/editor-status";

describe("editor status", () => {
  it("shows a save error even while unsaved changes remain", () => {
    expect(resolveEditorStatus({
      error: "Someone else saved a newer draft. Refresh before continuing.",
      isDirty: true,
      message: "",
    })).toEqual({
      text: "Someone else saved a newer draft. Refresh before continuing.",
      isError: true,
    });
  });

  it("shows the unsaved state when there is no error", () => {
    expect(resolveEditorStatus({ error: "", isDirty: true, message: "Draft saved." })).toEqual({
      text: "Unsaved changes",
      isError: false,
    });
  });

  it("shows the latest success message after changes are saved", () => {
    expect(resolveEditorStatus({ error: "", isDirty: false, message: "Draft saved." })).toEqual({
      text: "Draft saved.",
      isError: false,
    });
  });
});
