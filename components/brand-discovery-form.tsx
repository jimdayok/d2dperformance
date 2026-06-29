"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AutosaveIndicator } from "@/components/autosave-indicator";
import { QuestionCard } from "@/components/question-card";
import { ReviewPanel } from "@/components/review-panel";
import { brandDiscoverySections, createInitialDiscoveryAnswers } from "@/lib/brand-discovery-data";
import { clearDraft, loadDraft, safeJsonParse, saveDraft } from "@/lib/brand-discovery-storage";
import { isQuestionAnswered } from "@/lib/brand-report";
import type {
  DiscoveryDraft,
  DiscoveryFormValues,
  DiscoverySection,
  DiscoverySubmission,
} from "@/types/brand-discovery";

const storageKey = "d2d-brand-discovery-v5";

function createEmptyDraft(): DiscoveryDraft {
  const now = new Date().toISOString();

  return {
    started: false,
    currentSectionIndex: 0,
    answers: createInitialDiscoveryAnswers(),
    startedAt: now,
    updatedAt: now,
  };
}

function clampContentIndex(index: number) {
  return Math.min(Math.max(index, 0), brandDiscoverySections.length - 1);
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

export function BrandDiscoveryForm() {
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
  const contentSteps = brandDiscoverySections.length;
  const reviewStep = currentSectionIndex === contentSteps;
  const submitStep = currentSectionIndex === contentSteps + 1;
  const currentSection = brandDiscoverySections[clampContentIndex(currentSectionIndex)];
  const stepLabel =
    reviewStep ? "Review your answers" : submitStep ? "Submit Brand Discovery" : `Step ${currentSectionIndex + 1} of ${contentSteps}`;
  const completion = reviewStep || submitStep
    ? 100
    : Math.round(((currentSectionIndex + 1) / contentSteps) * 100);

  const currentStage = reviewStep
    ? {
        id: "review",
        title: "Review",
        description: "Review your answers before you submit your Brand Discovery.",
      }
    : submitStep
      ? {
          id: "submit",
          title: "Submit",
          description: "Submit your discovery privately to the D2D team.",
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
      const response = await fetch("/api/brand-discovery/submit", {
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
      <section id="brand-discovery" className="mx-auto max-w-4xl px-6 pb-24 lg:px-8">
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-8">
          <p className="text-sm text-[var(--color-muted)]">Loading your saved progress...</p>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section id="brand-discovery" className="mx-auto max-w-4xl px-6 pb-24 lg:px-8">
        <div className="rounded-[2.25rem] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-12">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:color-mix(in_oklab,var(--color-accent)_18%,white)] text-[var(--color-accent)]">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] md:text-5xl">
            Thank you. Your Brand Discovery has been received.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            We&apos;ll review your answers and begin building your Brand Blueprint.
          </p>

          <div className="mt-8 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
              What happens next
            </p>
            <ol className="mt-4 space-y-4 text-base leading-7 text-[var(--color-muted)]">
              <li>1. We review your story, customer, visual, and positioning inputs.</li>
              <li>2. We identify any gaps or clarification points.</li>
              <li>
                3. We prepare the strategic direction for your brand, website, messaging, and
                marketing foundation.
              </li>
            </ol>
            <p className="mt-5 text-base leading-7 text-[var(--color-muted)]">
              If we need anything else, we&apos;ll contact you directly.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!draft.started) {
    return (
      <section id="brand-discovery" className="mx-auto max-w-4xl px-6 pb-24 lg:px-8">
        <div className="rounded-[2.25rem] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)]">
            Brand Discovery
          </p>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] md:text-5xl">
            A simple guided interview to uncover the brand behind the business.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            This takes about 15 to 20 minutes. Your progress is saved automatically, and your
            answers are submitted privately to the D2D team.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "8 focused sections with one clear topic at a time.",
              "Large, readable inputs and a calmer review process.",
              "Private submission with no visible strategy report on the client side.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 text-sm leading-7 text-[var(--color-muted)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-panel)] px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
                Private submission
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-panel)] px-3 py-2">
                <LockKeyhole className="h-4 w-4 text-[var(--color-accent)]" />
                Progress saved
              </span>
            </div>
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary-bg)] px-5 py-3 text-sm font-semibold text-[var(--button-primary-text)] transition hover:-translate-y-0.5"
            >
              Start Brand Discovery
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="brand-discovery" className="mx-auto max-w-4xl px-6 pb-24 lg:px-8">
      <div ref={questionTopRef} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)]">
              Brand Discovery
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
              <h3 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] md:text-5xl">
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
                <ReviewPanel answers={draft.answers} onEdit={goToStep} />
              </div>
            ) : null}

            {submitStep ? (
              <div className="mt-8 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Final check
                </p>
                <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                  When you submit, your contact details, answers, uploaded file metadata, and
                  timestamps will be sent privately to the D2D team.
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
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {submitStep ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitState === "submitting"}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary-bg)] px-5 py-3 text-sm font-semibold text-[var(--button-primary-text)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitState === "submitting" ? "Submitting..." : "Submit Brand Discovery"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reviewStep ? () => goToStep(contentSteps + 1) : handleContinue}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary-bg)] px-5 py-3 text-sm font-semibold text-[var(--button-primary-text)] transition hover:-translate-y-0.5"
                >
                  {reviewStep ? "Continue to Submit" : "Save & Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
