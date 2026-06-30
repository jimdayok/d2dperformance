"use client";

import { ArrowDown, ArrowUp, GripVertical, Mic, Video } from "lucide-react";
import { HelpPanel } from "@/components/help-panel";
import { UploadDropzone } from "@/components/upload-dropzone";
import type {
  DiscoveryAnswer,
  DiscoveryQuestion,
  DiscoveryUploadMetadata,
} from "@/types/brand-discovery";

type QuestionCardProps = {
  question: DiscoveryQuestion;
  value: DiscoveryAnswer;
  onChange: (value: DiscoveryAnswer, options?: { files?: File[] }) => void;
};

function CardShell({
  label,
  description,
  required = true,
  children,
}: {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-lg font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
            {label}
          </h4>
          <span className="rounded-full bg-[var(--color-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {required ? "Required" : "Optional"}
          </span>
        </div>
        {description ? (
          <p className="text-sm leading-7 text-[var(--color-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const helpContent =
    question.helpTitle || question.helpBody || question.helpExamples?.length || question.brandExamples?.length;
  const hasDetailedCheckboxOptions = question.type === "checkboxes"
    && question.options?.some((option) => option.description);

  return (
    <CardShell
      label={question.label}
      description={question.description}
      required={question.required !== false}
    >
      <div className="space-y-4">
        {question.type === "short-text" || question.type === "website" ? (
          <input
            type={question.inputType ?? (question.type === "website" ? "url" : "text")}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={question.placeholder}
            className="h-14 w-full rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
          />
        ) : null}

        {question.type === "paragraph" ? (
          <textarea
            rows={question.rows ?? 5}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={question.placeholder}
            className="min-h-40 w-full rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
          />
        ) : null}

        {question.type === "multiple-choice" ? (
          <div className="grid gap-3">
            {question.options?.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${
                  value === option.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/10"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40"
                }`}
              >
                <p className="font-medium text-[var(--color-ink)]">{option.label}</p>
                {option.description ? (
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    {option.description}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {question.type === "checkboxes" ? (
          <div
            className={
              hasDetailedCheckboxOptions
                ? "grid gap-3 sm:grid-cols-2"
                : "flex flex-wrap gap-3"
            }
          >
            {question.options?.map((option) => {
              const selectedValues =
                Array.isArray(value) && value.every((item) => typeof item === "string")
                  ? (value as string[])
                  : [];
              const selected = selectedValues.includes(option.value);
              const nextValue = selected
                ? selectedValues.filter((item) => item !== option.value)
                : [...selectedValues, option.value];

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(nextValue)}
                  className={`text-left transition ${
                    selected
                      ? hasDetailedCheckboxOptions
                        ? "rounded-[1.25rem] border border-[var(--color-accent)] bg-[color:color-mix(in_oklab,var(--color-accent)_12%,white)] px-4 py-4 text-[var(--color-ink)] shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                        : "rounded-full border border-[var(--color-accent)] bg-[color:color-mix(in_oklab,var(--color-accent)_12%,white)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]"
                      : hasDetailedCheckboxOptions
                        ? "rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-[var(--color-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-ink)]"
                        : "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-ink)]"
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  {option.description ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                      {option.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {question.type === "slider" ? (
          <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-muted)]">Low</span>
              <span className="text-2xl font-semibold text-[var(--color-ink)]">
                {typeof value === "number" ? value : question.min}
              </span>
              <span className="text-sm text-[var(--color-muted)]">High</span>
            </div>
            <input
              type="range"
              min={question.min}
              max={question.max}
              step={question.step}
              value={typeof value === "number" ? value : question.min}
              onChange={(event) => onChange(Number(event.target.value))}
              className="mt-4 w-full accent-[var(--color-accent)]"
            />
          </div>
        ) : null}

        {question.type === "ranking" || question.type === "priority-order" ? (
          <div className="space-y-3">
            {(Array.isArray(value) ? (value as string[]) : []).map((item, index, list) => {
              const option = question.options?.find((entry) => entry.value === item);
              if (!option) {
                return null;
              }

              function move(direction: -1 | 1) {
                const nextIndex = index + direction;
                if (nextIndex < 0 || nextIndex >= list.length) {
                  return;
                }

                const nextList = [...list];
                [nextList[index], nextList[nextIndex]] = [
                  nextList[nextIndex],
                  nextList[index],
                ];
                onChange(nextList);
              }

              return (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4"
                >
                  <GripVertical className="h-4 w-4 text-[var(--color-muted)]" />
                  <div className="flex-1">
                    <p className="font-medium text-[var(--color-ink)]">{option.label}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => move(-1)}
                      className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-muted)]"
                      aria-label={`Move ${option.label} up`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(1)}
                      className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-muted)]"
                      aria-label={`Move ${option.label} down`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {question.type === "color" ? (
          <div className="flex items-center gap-4 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
            <input
              type="color"
              value={typeof value === "string" ? value : "#1a6ac9"}
              onChange={(event) => onChange(event.target.value)}
              className="h-12 w-12 rounded-xl border-0 bg-transparent"
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">Directional brand color</p>
              <p className="text-sm text-[var(--color-muted)]">
                {typeof value === "string" ? value : "#1a6ac9"}
              </p>
            </div>
          </div>
        ) : null}

        {question.type === "upload" ? (
          <UploadDropzone
            label={question.label}
            accept={question.accept}
            multiple={question.multiple}
            files={
              Array.isArray(value)
                ? (value as DiscoveryUploadMetadata[])
                : []
            }
            onChange={(files, rawFiles) => onChange(files, { files: rawFiles })}
          />
        ) : null}

        {question.type === "voice-placeholder" ? (
          <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-5 text-sm text-[var(--color-muted)]">
            <div className="flex items-center gap-3">
              <Mic className="h-4 w-4 text-[var(--color-accent)]" />
              <span>Voice recording will be connected in a future release.</span>
            </div>
          </div>
        ) : null}

        {question.type === "video-placeholder" ? (
          <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-5 text-sm text-[var(--color-muted)]">
            <div className="flex items-center gap-3">
              <Video className="h-4 w-4 text-[var(--color-accent)]" />
              <span>Video uploads will be connected in a future release.</span>
            </div>
          </div>
        ) : null}

        {helpContent ? (
          <HelpPanel
            title={question.helpTitle ?? "Need help?"}
            body={question.helpBody}
            examples={question.helpExamples}
            brandExamples={question.brandExamples}
          />
        ) : null}
      </div>
    </CardShell>
  );
}
