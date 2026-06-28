import { CheckCircle2, LoaderCircle } from "lucide-react";

type AutosaveIndicatorProps = {
  hydrated: boolean;
  isSaving: boolean;
  savedAt?: string;
};

export function AutosaveIndicator({
  hydrated,
  isSaving,
  savedAt,
}: AutosaveIndicatorProps) {
  const label = !hydrated
    ? "Loading saved progress..."
    : isSaving
      ? "Saving..."
      : savedAt
        ? `Saved ${new Date(savedAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}`
        : "Autosave is active";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-medium text-[var(--color-muted)]">
      {isSaving ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--color-accent)]" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      )}
      <span>{label}</span>
    </div>
  );
}
