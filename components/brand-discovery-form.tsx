"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
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
  DiscoveryCompletionStatus,
  DiscoveryDraft,
  DiscoveryEmailAttachment,
  DiscoveryFormValues,
  DiscoveryProgressPayload,
  DiscoverySection,
  DiscoverySubmission,
} from "@/types/brand-discovery";

const storageKey = "d2d-brand-discovery-v6";

function createEmptyDraft(sessionId = crypto.randomUUID()): DiscoveryDraft {
  const now = new Date().toISOString();

  return {
    sessionId,
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

function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

async function fileToAttachment(file: File): Promise<DiscoveryEmailAttachment> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return {
    filename: file.name,
    content: btoa(binary),
    contentType: file.type || "application/octet-stream",
  };
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
  const [pendingUploads, setPendingUploads] = useState<Record<string, File[]>>({});
  const questionTopRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const sendingProgressCountRef = useRef(0);
  const syncTimeoutRef = useRef<number | null>(null);

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
    updateDraft((current) => {
      const now = new Date().toISOString();

      return {
        ...current,
        started: true,
        currentSectionIndex: 0,
        startedAt: current.started ? current.startedAt : now,
        updatedAt: now,
      };
    });
  }

  function handleStartOver() {
    const confirmed = typeof window === "undefined"
      ? true
      : window.confirm("Start over and clear all saved Brand Discovery answers?");

    if (!confirmed) {
      return;
    }

    clearDraft(storageKey);
    setDraft(createEmptyDraft(submitted ? undefined : draft.sessionId));
    setSubmitted(false);
    setSubmitState("idle");
    setProgressState("idle");
    setPendingUploads({});
  }

  function handlePrevious() {
    if (reviewStep) {
      goToStep(contentSteps - 1);
      return;
    }

    goToStep(Math.max(0, currentSectionIndex - 1));
  }

  async function syncDraftProgress(payload: DiscoveryProgressPayload) {
    sendingProgressCountRef.current += 1;
    setProgressState("sending");

    try {
      const response = await fetch("/api/brand-discovery/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to save draft progress.");
      }
    } catch {
      toast.error("We saved your answers locally, but background syncing did not finish this time.");
    } finally {
      sendingProgressCountRef.current = Math.max(0, sendingProgressCountRef.current - 1);
      if (sendingProgressCountRef.current === 0) {
        setProgressState("idle");
      }
    }
  }

  useEffect(() => {
    if (!hydrated || !draft.started || submitted) {
      return;
    }

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      const currentAnsweredCount = Object.values(draft.answers).filter((value) =>
        isQuestionAnswered(value),
      ).length;
      const completionStatus: DiscoveryCompletionStatus =
        currentAnsweredCount > 0 || draft.currentSectionIndex > 0 ? "in_progress" : "started";
      const payload: DiscoveryProgressPayload = {
        sessionId: draft.sessionId ?? crypto.randomUUID(),
        startedAt: draft.startedAt,
        updatedAt: draft.updatedAt ?? new Date().toISOString(),
        submittedAt: draft.submittedAt ?? null,
        currentStep: Math.min(draft.currentSectionIndex + 1, contentSteps),
        lastCompletedStep: Math.min(draft.currentSectionIndex, contentSteps),
        completionPercentage:
          draft.currentSectionIndex >= contentSteps
            ? 100
            : Math.round((draft.currentSectionIndex / contentSteps) * 100),
        completionStatus,
        answers: draft.answers,
      };

      void syncDraftProgress(payload);
    }, 1200);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [contentSteps, draft, hydrated, submitted]);

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

    if (currentSectionIndex === contentSteps - 1) {
      goToStep(contentSteps);
      return;
    }

    goToStep(currentSectionIndex + 1);
  }

  async function handleSubmit() {
    setSubmitState("submitting");

    const submittedAt = new Date().toISOString();

    try {
      const attachments = await Promise.all(
        Object.values(pendingUploads)
          .flat()
          .map((file) => fileToAttachment(file)),
      );
      const payload: DiscoverySubmission = {
        sessionId: draft.sessionId,
        startedAt: draft.startedAt,
        updatedAt: draft.updatedAt ?? submittedAt,
        submittedAt,
        currentStep: contentSteps,
        lastCompletedStep: contentSteps,
        completionPercentage: 100,
        completionStatus: "submitted",
        answers: draft.answers,
        attachments,
      };

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
      setPendingUploads({});
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
            Your brand discovery request has been received.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            We&apos;ll review your information and follow up with next steps.
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
              "A guided section-by-section flow that keeps the discovery clear and easy to complete.",
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
                Guided section flow
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
      {progressState === "sending" || submitState === "submitting" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-6">
          <div className="activity-bar flex min-w-[18rem] max-w-xl items-center gap-3 rounded-full border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_88%,white)] px-5 py-3 shadow-[0_22px_48px_rgba(20,16,12,0.16)] backdrop-blur-xl">
            <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-accent)]" />
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]">
                {submitState === "submitting" ? "Submitting Discovery" : "Saving Your Responses"}
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                {submitState === "submitting"
                  ? "Please keep this tab open while we finish the submission."
                  : "You can keep moving. We're saving your progress in the background."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={questionTopRef} className="paper-panel rounded-[1.6rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="eyebrow-label">Brand Discovery</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
              <span>{stepLabel}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
              <span>{answeredCount} responses saved</span>
              <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
              <span className="inline-flex items-center gap-2">
                {progressState === "sending" ? (
                  <>
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--color-accent)]" />
                    Saving responses...
                  </>
                ) : (
                  "Responses save automatically"
                )}
              </span>
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

        {progressState === "sending" || submitState === "submitting" ? (
          <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:color-mix(in_oklab,var(--color-accent)_12%,white)] text-[var(--color-accent)]">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)]">
                  {submitState === "submitting"
                    ? "Submitting your discovery"
                    : "Saving your responses"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  {submitState === "submitting"
                    ? "This can take a moment while we package your responses and any attached files."
                    : "Your answers are being saved in the background, so the form stays responsive."}
                </p>
              </div>
            </div>
            <div className="activity-bar mt-4 h-2 rounded-full bg-[color:color-mix(in_oklab,var(--color-accent)_12%,white)]">
              <div className="h-2 w-2/3 rounded-full bg-[var(--color-accent)] opacity-90" />
            </div>
          </div>
        ) : null}

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
                    onChange={(nextValue, options) => {
                      const normalizedValue =
                        question.id === "phone" && typeof nextValue === "string"
                          ? normalizePhoneNumber(nextValue)
                          : nextValue;

                      if (question.type === "upload") {
                        setPendingUploads((current) => ({
                          ...current,
                          [question.id]: options?.files ?? [],
                        }));
                      }

                      updateAnswer(question.id, normalizedValue);
                    }}
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
                    When you submit, your full discovery will be submitted for review. Any files
                    attached in this session will be included with the final submission.
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
                  {submitState === "submitting" ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Brand Discovery"
                  )}
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
