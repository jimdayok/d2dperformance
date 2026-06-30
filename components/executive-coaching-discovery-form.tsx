"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AutosaveIndicator } from "@/components/autosave-indicator";
import { QuestionCard } from "@/components/question-card";
import { ReviewPanel } from "@/components/review-panel";
import {
  createInitialExecutiveCoachingAnswers,
  executiveCoachingDiscoverySections,
} from "@/lib/executive-coaching-discovery-data";
import { clearDraft, loadDraft, safeJsonParse, saveDraft } from "@/lib/brand-discovery-storage";
import { isQuestionAnswered } from "@/lib/brand-report";
import type {
  DiscoveryDraft,
  DiscoveryFormValues,
  DiscoverySection,
  DiscoverySubmission,
} from "@/types/brand-discovery";

const storageKey = "d2d-executive-coaching-discovery-v1";

function createEmptyDraft(): DiscoveryDraft {
  const now = new Date().toISOString();

  return {
    started: false,
    currentSectionIndex: 0,
    answers: createInitialExecutiveCoachingAnswers(),
    startedAt: now,
    updatedAt: now,
  };
}

function clampContentIndex(index: number) {
  return Math.min(Math.max(index, 0), executiveCoachingDiscoverySections.length - 1);
}

function getSectionValidationMessage(section: DiscoverySection, answers: DiscoveryFormValues) {
  for (const question of section.questions) {
    if (question.required === false) {
      continue;
    }

    if (!isQuestionAnswered(answers[question.id])) {
      return `Please complete "${question.label}" before continuing.`;
    }
  }

  return null;
}

async function parseJsonSafe<T>(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  return safeJsonParse<T | null>(text, null);
}

export function ExecutiveCoachingDiscoveryForm() {
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<DiscoveryDraft>(() =>
    typeof window === "undefined" ? createEmptyDraft() : loadDraft(storageKey, createEmptyDraft()),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error">("idle");
  const [submitted, setSubmitted] = useState(false);
  const questionTopRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || submitted) {
      return;
    }

    saveDraft(storageKey, draft);
  }, [draft, hydrated, submitted]);

  useEffect(() => {
    if (!hydrated || !draft.started) {
      return;
    }

    questionTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [draft.currentSectionIndex, draft.started, hydrated]);

  const currentSectionIndex = Math.max(0, draft.currentSectionIndex);
  const contentSteps = executiveCoachingDiscoverySections.length;
  const reviewStep = currentSectionIndex === contentSteps;
  const submitStep = currentSectionIndex === contentSteps + 1;
  const currentSection = executiveCoachingDiscoverySections[clampContentIndex(currentSectionIndex)];
  const stepLabel = reviewStep
    ? "Review your answers"
    : submitStep
      ? "Submit Discovery"
      : `Step ${currentSectionIndex + 1} of ${contentSteps}`;
  const completion = reviewStep || submitStep
    ? 100
    : Math.round(((currentSectionIndex + 1) / contentSteps) * 100);

  const currentStage = reviewStep
    ? {
        id: "review",
        title: "Review",
        description: "Take one last pass before you submit your discovery.",
      }
    : submitStep
      ? {
          id: "submit",
          title: "Submit",
          description: "Send your discovery privately to the D2D Performance team.",
        }
      : currentSection;

  const answeredCount = useMemo(
    () => Object.values(draft.answers).filter((value) => isQuestionAnswered(value)).length,
    [draft.answers],
  );

  function markSaving() {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = window.setTimeout(() => {
      setIsSaving(false);
    }, 450);
  }

  function updateDraft(updater: (current: DiscoveryDraft) => DiscoveryDraft) {
    markSaving();
    setDraft((current) => updater(current));
  }

  function updateAnswer(questionId: string, nextValue: DiscoveryFormValues[string]) {
    updateDraft((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [questionId]: nextValue,
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function goToStep(index: number) {
    updateDraft((current) => ({
      ...current,
      currentSectionIndex: index,
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleStart() {
    updateDraft((current) => ({
      ...current,
      started: true,
      currentSectionIndex: 0,
      updatedAt: new Date().toISOString(),
    }));
  }

  function handlePrevious() {
    if (submitStep) {
      goToStep(contentSteps);
      return;
    }

    if (reviewStep) {
      goToStep(contentSteps - 1);
      return;
    }

    goToStep(Math.max(0, currentSectionIndex - 1));
  }

  function handleContinue() {
    if (!draft.started) {
      handleStart();
      return;
    }

    if (reviewStep || submitStep) {
      return;
    }

    const validationMessage = getSectionValidationMessage(currentSection, draft.answers);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    if (currentSectionIndex === contentSteps - 1) {
      goToStep(contentSteps);
      return;
    }

    goToStep(currentSectionIndex + 1);
  }

  async function handleSubmit() {
    setSubmitState("submitting");

    const submittedAt = new Date().toISOString();
    const payload: DiscoverySubmission = {
      startedAt: draft.startedAt,
      updatedAt: draft.updatedAt ?? submittedAt,
      submittedAt,
      answers: draft.answers,
    };

    try {
      const response = await fetch("/api/executive-coaching-discovery/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await parseJsonSafe<{ ok?: boolean; error?: string }>(response);

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.error || "Submission failed. Your progress is still saved.",
        );
      }

      clearDraft(storageKey);
      setDraft((current) => ({
        ...current,
        submittedAt,
        updatedAt: submittedAt,
      }));
      setSubmitted(true);
      setSubmitState("idle");
    } catch (error) {
      setSubmitState("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Submission failed. Your progress is still saved.",
      );
    }
  }

  if (!hydrated) {
    return (
      <section id="executive-coaching-discovery" className="w-full">
        <div className="paper-panel rounded-[1.5rem] p-8">
          <p className="text-sm text-[var(--color-muted)]">Loading your saved progress...</p>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section id="executive-coaching-discovery" className="w-full">
        <div className="paper-panel rounded-[1.6rem] p-8 md:p-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:color-mix(in_oklab,var(--color-accent)_16%,white)] text-[var(--color-accent)]">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-6 max-w-3xl font-display text-balance text-4xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-5xl">
            Thank you. Your executive coaching discovery is in.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            We&apos;ll review it before the conversation so we can show up with context, not canned questions.
          </p>

          <div className="mt-8 space-y-4 border-t border-[var(--color-border)] pt-6">
            {[
              "We review the business context, pressure points, and leadership goals.",
              "We look for patterns around clarity, accountability, and decision load.",
              "We use that context to shape a more useful first conversation.",
            ].map((item) => (
              <div
                key={item}
                className="border-l border-[var(--color-border)] pl-5 text-sm leading-7 text-[var(--color-muted)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!draft.started) {
    return (
      <section id="executive-coaching-discovery" className="w-full">
          <div className="paper-panel rounded-[1.6rem] p-8 md:p-10">
            <p className="eyebrow-label">
              Executive Coaching Discovery
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-balance text-4xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-5xl">
              Let&apos;s start with the real leadership picture.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              We&apos;ll ask about the business, the team, where pressure is showing up, and what success should look like. Your answers help us make the first conversation sharper from the start.
            </p>

            <div className="mt-8 grid gap-6 border-t border-[var(--color-border)] pt-6 md:grid-cols-2">
              {[
                {
                  icon: Clock3,
                  title: "10 to 12 minutes",
                  copy: "Focused sections and lighter prompts keep momentum up.",
                },
                {
                  icon: LockKeyhole,
                  title: "Private + autosaved",
                  copy: "Progress is saved automatically while you work.",
                },
                {
                  icon: BriefcaseBusiness,
                  title: "Built for leaders",
                  copy: "Questions stay practical, strategic, and grounded in reality.",
                },
                {
                  icon: ShieldCheck,
                  title: "Clean review step",
                  copy: "You can check everything before anything gets submitted.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border-l border-[var(--color-border)] pl-5"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)]">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Six short sections. One topic at a time.
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Start Discovery
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
      </section>
    );
  }

  return (
    <section id="executive-coaching-discovery" className="w-full">
      <div className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
        <aside className="order-2 lg:order-1">
          <div className="paper-panel rounded-[1.5rem] p-6 lg:sticky lg:top-24">
            <p className="eyebrow-label">
              What We&apos;re Looking For
            </p>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              Clear patterns, not polished answers.
            </h3>
            <div className="mt-6 space-y-3">
              {[
                "Where leadership load is accumulating",
                "What the team and cadence are making harder than they should",
                "What outcomes would actually make coaching worth it",
              ].map((item) => (
                <div
                  key={item}
                  className="border-l border-[var(--color-border)] pl-4 text-sm leading-7 text-[var(--color-muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div
          ref={questionTopRef}
          className="paper-panel order-1 rounded-[1.55rem] p-6 md:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3">
            <p className="eyebrow-label">
              Executive Coaching Discovery
            </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
                <span>{stepLabel}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
                <span>{answeredCount} responses saved</span>
              </div>
            </div>
            <AutosaveIndicator hydrated={hydrated} isSaving={isSaving} savedAt={draft.updatedAt} />
          </div>

          <div className="mt-6 h-2 rounded-full bg-[var(--color-border-soft)]">
            <div
              className="h-2 rounded-full bg-[var(--color-accent)] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24 }}
              className="mt-8"
            >
              <div className="max-w-3xl">
                {!reviewStep && !submitStep ? (
                <span className="inline-flex border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-surface)_72%,transparent)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  {currentSection.estimatedMinutes} min section
                </span>
                ) : null}
                <h3 className="mt-4 font-display text-balance text-3xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-5xl">
                  {currentStage.title}
                </h3>
                <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
                  {currentStage.description}
                </p>
              </div>

              {!reviewStep && !submitStep ? (
                <div className="mt-8 space-y-5">
                  {currentSection.questions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      value={draft.answers[question.id]}
                      onChange={(nextValue) => updateAnswer(question.id, nextValue)}
                    />
                  ))}
                </div>
              ) : null}

              {reviewStep ? (
                <div className="mt-8">
                  <ReviewPanel
                    answers={draft.answers}
                    sections={executiveCoachingDiscoverySections}
                    onEdit={goToStep}
                  />
                </div>
              ) : null}

              {submitStep ? (
                <div className="mt-8 border-l border-[var(--color-border)] pl-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    Final check
                  </p>
                  <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                    When you submit, your contact details, answers, and timestamps will be sent privately to the D2D Performance team.
                  </p>
                  {submitState === "error" ? (
                    <p className="mt-4 text-sm text-rose-700 dark:text-rose-300">
                      Submission failed. Your progress is still saved.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={submitState === "submitting"}
                  className="inline-flex items-center justify-center border border-[var(--color-border)] px-5 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {submitStep ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitState === "submitting"}
                    className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--button-primary-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitState === "submitting" ? "Submitting..." : "Submit Discovery"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={reviewStep ? () => goToStep(contentSteps + 1) : handleContinue}
                    className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--button-primary-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    {reviewStep ? "Continue to Submit" : "Save & Continue"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
