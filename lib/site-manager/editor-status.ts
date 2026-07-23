type EditorStatusInput = {
  error: string;
  isDirty: boolean;
  message: string;
};

export function resolveEditorStatus({ error, isDirty, message }: EditorStatusInput) {
  if (error) return { text: error, isError: true };
  if (isDirty) return { text: "Unsaved changes", isError: false };
  return { text: message || "All changes saved", isError: false };
}
