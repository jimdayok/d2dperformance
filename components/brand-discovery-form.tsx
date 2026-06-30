"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
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

const storageKey = "d2d-brand-discovery-v6";

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
  const [progressState, setProgressState] = useState<"idle" | "sending">("idle");
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
  const currentSection = brandDiscoverySections[clampContentIndex(currentSectionIndex)];
  const stepLabel = reviewStep
    ? "Review your answers"
    : `Step ${currentSectionIndex + 1} of ${contentSteps}`;
  const completion = reviewStep
    ? 100
    : Math.round(((currentSectionIndex + 1) / contentSteps) * 100);

  const currentStage = reviewStep
    ? {
        id: "review",
        title: "Review and Submit",
        description: "Take one last pass, then submit the full discovery.",
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

  function handleStartOver() {
    const confirmed = typeof window === "undefined"
      ? true
      : window.confirm("Start over and clear all saved Brand Discovery answers?");

    if (!confirmed) {
      return;
    }

    clearDraft(storageKey);
    setDraft(createEmptyDraft());
    setSubmitted(false);
    setSubmitState("idle");
    setProgressState("idle");
  }

  function handlePrevious() {
    if (reviewStep) {
      goToStep(contentSteps - 1);
      return;
    }

    goToStep(Math.max(0, currentSectionIndex - 1));
  }

  async function sendPartialProgress() {
    setProgressState("sending");

    const payload: DiscoverySubmission = {
      startedAt: draft.startedAt,
      updatedAt: draft.updatedAt ?? new Date().toISOString(),
      submittedAt: draft.updatedAt ?? new Date().toISOString(),
      answers: draft.answers,
    };

    try {
      const response = await fetch("/api/brand-discovery/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to email partial progress.");
      }
    } catch {
      toast.error("We saved your answers, but the progress email did not send this time.");
    } finally {
      setProgressState("idle");
    }
  }

  async function handleContinue() {
    if (!draft.started) {
      handleStart();
      return;
    }

    if (reviewStep) {
      return;
    }

    const validationMessage = getSectionValidationMessage(currentSection, draft.answers);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    await sendPartialProgress();

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
      <section id="brand-discovery" className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
        <div className="paper-panel rounded-[1.5rem] p-8">
          <p className="text-sm text-[var(--color-muted)]">Loading your saved progress...</p>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section id="brand-discovery" className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
        <div className="paper-panel rounded-[1.6rem] p-8 md:p-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:color-mix(in_oklab,var(--color-accent)_18%,white)] text-[var(--color-accent)]">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-6 font-display text-balance text-4xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-5xl">
            Thank you. Your Brand Discovery has been received.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            The full discovery has been emailed to Jim and Andrea, and each completed section
            was also sent along the way as progress.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-[var(--color-border)] pt-6">
            <button
              type="button"
              onClick={handleStartOver}
              className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </button>
            <span className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Emails go to jim@d2dmktg.com and andrea@d2dmktg.com
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (!draft.started) {
    return (
      <section id="brand-discovery" className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
        <div className="paper-panel rounded-[1.7rem] p-8 md:p-10">
          <p className="eyebrow-label">Brand Discovery</p>
          <h2 className="mt-4 font-display text-balance text-4xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-6xl">
            The first step is the full discovery.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            This is the main starting point for working with D2D. It uses your exact 40
            discovery questions, grouped into a cleaner guided flow that is easier to complete.
          </p>

          <div className="mt-8 grid gap-5 border-t border-[var(--color-border)] pt-6 md:grid-cols-3">
            {[
              "Your exact 40 questions, with no extras added to the discovery itself.",
              "Progress emails sent to Jim and Andrea as each section is completed.",
              "A simple reset if you want to clear everything and start over.",
            ].map((item) => (
              <div
                key={item}
                className="border-l border-[var(--color-border)] pl-5 text-sm leading-7 text-[var(--color-muted)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 uppercase tracking-[0.16em]">
                <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
                40 Discovery Questions
              </span>
              <span className="inline-flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 uppercase tracking-[0.16em]">
                Progress emailed as you go
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={handleStartOver}
                className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <RotateCcw className="h-4 w-4" />
                Start Over
              </button>
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Start Brand Discovery
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="brand-discovery" className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
      <div ref={questionTopRef} className="paper-panel rounded-[1.6rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="eyebrow-label">Brand Discovery</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
              <span>{stepLabel}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
              <span>{answeredCount} responses saved</span>
              <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
              <span>{progressState === "sending" ? "Sending progress..." : "Progress emailed by section"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <AutosaveIndicator hydrated={hydrated} isSaving={isSaving} savedAt={draft.updatedAt} />
            <button
              type="button"
              onClick={handleStartOver}
              className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </button>
          </div>
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
              <h3 className="font-display text-balance text-3xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-5xl">
                {currentStage.title}
              </h3>
              <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
                {currentStage.description}
              </p>
            </div>

            {!reviewStep ? (
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
              <div className="mt-8 space-y-8">
                <ReviewPanel
                  answers={draft.answers}
                  sections={brandDiscoverySections}
                  onEdit={goToStep}
                />
                <div className="border-l border-[var(--color-border)] pl-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    Final check
                  </p>
                  <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                    When you submit, the full discovery will be emailed to jim@d2dmktg.com and
                    andrea@d2dmktg.com. Each completed section has also been emailed as progress.
                  </p>
                  {submitState === "error" ? (
                    <p className="mt-4 text-sm text-rose-700 dark:text-rose-300">
                      Submission failed. Your progress is still saved.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={submitState === "submitting" || currentSectionIndex === 0}
                className="inline-flex items-center justify-center border border-[var(--color-border)] px-5 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {reviewStep ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitState === "submitting"}
                  className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--button-primary-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitState === "submitting" ? "Submitting..." : "Submit Brand Discovery"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--button-primary-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  Save & Continue
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
