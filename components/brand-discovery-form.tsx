"use client";

import { FormEvent, useMemo, useState } from "react";
import { discoverySteps } from "@/lib/site-data";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { DiscoveryFormValues } from "@/types/brand-discovery";

const initialValues = Object.fromEntries(
  discoverySteps.flatMap((step) => step.fields.map((field) => [field.id, ""])),
) as DiscoveryFormValues;

export function BrandDiscoveryForm() {
  const { hydrated, value, setValue } = useLocalStorage<DiscoveryFormValues>(
    "d2d-brand-discovery",
    initialValues,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");

  const step = discoverySteps[stepIndex];
  const completion = useMemo(() => {
    const total = discoverySteps.length;
    return Math.round(((stepIndex + 1) / total) * 100);
  }, [stepIndex]);

  function updateField(fieldId: string, fieldValue: string) {
    setValue((current) => ({
      ...current,
      [fieldId]: fieldValue,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (stepIndex < discoverySteps.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    try {
      setStatus("submitting");

      const response = await fetch("/api/brand-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submittedAt: new Date().toISOString(),
          values: value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setStatus("submitted");
      window.localStorage.removeItem("d2d-brand-discovery");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="brand-discovery"
      className="mx-auto mt-18 max-w-7xl px-6 pb-8 lg:px-8"
    >
      <div className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr]">
        <aside className="rounded-[2rem] bg-[var(--color-ink)] p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
            Brand Discovery
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
            Build a complete Brand Blueprint.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/72">
            Progress autosaves in your browser, so leadership teams can move
            through the discovery at a practical pace.
          </p>
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>
                Step {stepIndex + 1} of {discoverySteps.length}
              </span>
              <span>{completion}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[var(--color-sand)] transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {discoverySteps.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                  index === stepIndex
                    ? "bg-white text-[var(--color-ink)]"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
                onClick={() => setStepIndex(index)}
              >
                <span>{item.title}</span>
                <span>{index + 1}</span>
              </button>
            ))}
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-[var(--color-border)] bg-white p-8 shadow-[0_24px_80px_rgba(31,41,51,0.06)]"
        >
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              {step.title}
            </p>
            <h3 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              {step.title}
            </h3>
            <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              {step.helper}
            </p>
          </div>

          <div className="mt-8 grid gap-6">
            {step.fields.map((field) => (
              <label key={field.id} className="grid gap-3">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {field.label}
                </span>
                {field.type === "textarea" ? (
                  <textarea
                    rows={8}
                    value={value[field.id] ?? ""}
                    onChange={(event) => updateField(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-40 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                  />
                ) : (
                  <input
                    type="text"
                    value={value[field.id] ?? ""}
                    onChange={(event) => updateField(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className="h-14 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                  />
                )}
              </label>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <div className="flex items-center gap-4">
              <p className="text-sm text-[var(--color-muted)]">
                {hydrated ? "Autosave is active." : "Loading saved progress..."}
              </p>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-ink-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {stepIndex === discoverySteps.length - 1
                  ? status === "submitting"
                    ? "Submitting..."
                    : "Generate Brand Blueprint"
                  : "Continue"}
              </button>
            </div>
          </div>

          {status === "submitted" ? (
            <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Discovery submitted successfully. The backend hook is ready for
              future wiring.
            </p>
          ) : null}

          {status === "error" ? (
            <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Submission failed. The form data is still saved locally, so you
              can try again without losing progress.
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
