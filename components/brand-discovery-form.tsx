"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  LockKeyhole,
  PartyPopper,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AutosaveIndicator } from "@/components/autosave-indicator";
import { ProgressTracker } from "@/components/progress-tracker";
import { QuestionCard } from "@/components/question-card";
import { ReportPreview } from "@/components/report-preview";
import { ReviewPanel } from "@/components/review-panel";
import { brandDiscoverySections, createInitialDiscoveryAnswers } from "@/lib/brand-discovery-data";
import {
  buildBrandReport,
  estimateRemainingMinutes,
  isSectionComplete,
  summarizeSection,
} from "@/lib/brand-report";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type {
  DiscoveryDraft,
  DiscoveryFormValues,
  DiscoverySection,
  DiscoverySubmission,
} from "@/types/brand-discovery";

const storageKey = "d2d-brand-discovery-v3";

const stageSections: DiscoverySection[] = [
  ...brandDiscoverySections,
  {
    id: "review",
    title: "Review",
    description: "Review every section before generating the brand report.",
    estimatedMinutes: 2,
    questions: [],
  },
  {
    id: "submit",
    title: "Submit",
    description: "Generate the report and submit the discovery.",
    estimatedMinutes: 1,
    questions: [],
  },
];

const emptyDraft: DiscoveryDraft = {
  currentSectionIndex: 0,
  answers: createInitialDiscoveryAnswers(),
  summaries: {},
  completedSections: [],
};

function clampIndex(index: number) {
  return Math.min(Math.max(index, 0), stageSections.length - 1);
}

export function BrandDiscoveryForm() {
  const { hydrated, value: draft, setValue: setDraft } = useLocalStorage<DiscoveryDraft>(
    storageKey,
    emptyDraft,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [deliveryStatus, setDeliveryStatus] = useState<{
    configured: boolean;
    databaseSaved: boolean;
    emailSent: boolean;
  } | null>(null);
  const [copilotReady, setCopilotReady] = useState(false);
  const [copilotState, setCopilotState] = useState<"idle" | "loading" | "error">("idle");
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotResponse, setCopilotResponse] = useState<{
    assistantMessage: string;
    followUpQuestion: string;
    suggestedAnswer: string;
    confidence: "low" | "medium" | "high";
    remainingRequests: number;
  } | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  const currentSectionIndex = clampIndex(draft.currentSectionIndex ?? 0);
  const currentStage = stageSections[currentSectionIndex];
  const assistableQuestion = currentStage.questions.find(
    (question) =>
      question.type === "paragraph" ||
      question.type === "short-text" ||
      question.type === "website",
  );
  const currentSummary =
    draft.summaries[currentStage.id] ??
    (currentStage.questions.length
      ? summarizeSection(currentStage, draft.answers)
      : []);

  const report = useMemo(() => buildBrandReport(draft.answers), [draft.answers]);
  const remainingMinutes = useMemo(
    () => estimateRemainingMinutes(Math.min(currentSectionIndex, brandDiscoverySections.length - 1), draft.answers),
    [currentSectionIndex, draft.answers],
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    async function bootstrapCopilot() {
      try {
        const response = await fetch("/api/brand-copilot/session", {
          method: "GET",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Unable to initialize AI copilot.");
        }

        if (!cancelled) {
          setCopilotReady(true);
        }
      } catch {
        if (!cancelled) {
          setCopilotReady(false);
        }
      }
    }

    void bootstrapCopilot();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  function updateDraft(updater: (current: DiscoveryDraft) => DiscoveryDraft) {
    if (hydrated) {
      setIsSaving(true);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }

    setDraft((current) => updater(current));
  }

  function updateAnswer(questionId: string, nextValue: DiscoveryFormValues[string]) {
    updateDraft((current) => {
      const answers = {
        ...current.answers,
        [questionId]: nextValue,
      };
      const summaries = currentStage.questions.length
        ? {
            ...current.summaries,
            [currentStage.id]: summarizeSection(currentStage, answers),
          }
        : current.summaries;
      const completedSections = brandDiscoverySections
        .filter((section) => isSectionComplete(section, answers))
        .map((section) => section.id);

      return {
        ...current,
        answers,
        summaries,
        completedSections,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function updateSummary(sectionId: string, text: string) {
    updateDraft((current) => ({
      ...current,
      summaries: {
        ...current.summaries,
        [sectionId]: text
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function goToSection(index: number) {
    setCopilotPrompt("");
    setCopilotResponse(null);
    setCopilotState("idle");
    updateDraft((current) => ({
      ...current,
      currentSectionIndex: clampIndex(index),
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleContinue() {
    if (currentStage.id === "submit") {
      return;
    }

    if (currentStage.questions.length > 0 && isSectionComplete(currentStage, draft.answers)) {
      toast.success(`Saved ${currentStage.title}.`);
    }

    const nextIndex = clampIndex(currentSectionIndex + 1);
    goToSection(nextIndex);

    if (nextIndex === brandDiscoverySections.length) {
      toast("Review your discovery before submission.");
    }
  }

  function handlePrevious() {
    goToSection(currentSectionIndex - 1);
  }

  async function handleSubmit() {
    try {
      setSubmitState("submitting");

      const payload: DiscoverySubmission = {
        submittedAt: new Date().toISOString(),
        answers: draft.answers,
        summaries: draft.summaries,
      };

      const response = await fetch("/api/brand-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      const data = (await response.json()) as {
        delivery?: {
          configured: boolean;
          databaseSaved: boolean;
          emailSent: boolean;
        };
      };

      setSubmitState("submitted");
      setDeliveryStatus(data.delivery ?? null);
      updateDraft((current) => ({
        ...current,
        submittedAt: payload.submittedAt,
        updatedAt: payload.submittedAt,
      }));
      toast.success("Brand discovery submitted.");
    } catch {
      setSubmitState("error");
      toast.error("Submission failed. Your progress is still saved locally.");
    }
  }

  function resetDraft() {
    updateDraft(() => emptyDraft);
    toast("Discovery draft reset.");
  }

  async function handleCopilotAsk() {
    if (!assistableQuestion) {
      return;
    }

    const currentAnswer =
      typeof draft.answers[assistableQuestion.id] === "string"
        ? (draft.answers[assistableQuestion.id] as string)
        : "";

    const userMessage =
      copilotPrompt.trim() ||
      currentAnswer ||
      "Help me answer this question clearly and strategically.";

    try {
      setCopilotState("loading");

      const response = await fetch("/api/brand-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: currentStage.id,
          sectionTitle: currentStage.title,
          sectionDescription: currentStage.description,
          targetQuestionId: assistableQuestion.id,
          targetQuestionLabel: assistableQuestion.label,
          targetQuestionDescription: assistableQuestion.description,
          targetQuestionPlaceholder: assistableQuestion.placeholder,
          currentAnswer,
          sectionSummary: currentSummary,
          answers: draft.answers,
          userMessage,
        }),
      });

      const data = (await response.json()) as
        | {
            assistantMessage: string;
            followUpQuestion: string;
            suggestedAnswer: string;
            confidence: "low" | "medium" | "high";
            remainingRequests: number;
          }
        | { message?: string };
      const errorMessage =
        "message" in data && typeof data.message === "string"
          ? data.message
          : "The AI copilot is unavailable right now.";

      if (!response.ok || !("assistantMessage" in data)) {
        throw new Error(errorMessage);
      }

      setCopilotResponse(data);
      setCopilotState("idle");
    } catch (error) {
      setCopilotState("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "The AI copilot is unavailable right now.",
      );
    }
  }

  function applyCopilotDraft() {
    if (!assistableQuestion || !copilotResponse?.suggestedAnswer) {
      return;
    }

    updateAnswer(assistableQuestion.id, copilotResponse.suggestedAnswer);
    toast.success("AI draft applied to this answer.");
  }

  if (!hydrated) {
    return (
      <section id="brand-discovery" className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-8">
          <p className="text-sm text-[var(--color-muted)]">Loading saved discovery...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="brand-discovery" className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.33fr_0.67fr]">
        <ProgressTracker
          sections={stageSections}
          currentSectionIndex={currentSectionIndex}
          answers={draft.answers}
          onSelect={goToSection}
          estimatedRemainingMinutes={remainingMinutes}
        />

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-panel)] px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
                Privacy-first
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-panel)] px-3 py-2">
                <LockKeyhole className="h-4 w-4 text-[var(--color-accent)]" />
                Resume later
              </span>
            </div>
            <AutosaveIndicator
              hydrated={hydrated}
              isSaving={isSaving}
              savedAt={draft.updatedAt}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
              className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
                    {currentStage.id === "welcome" ? "Welcome" : currentStage.title}
                  </p>
                  <h3 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] md:text-5xl">
                    {currentStage.title}
                  </h3>
                  <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
                    {currentStage.description}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--color-panel)] px-4 py-4 text-sm text-[var(--color-muted)]">
                  <p>{currentStage.estimatedMinutes} minutes for this section</p>
                  <p className="mt-1">
                    {currentStage.id === "welcome"
                      ? "Estimated total time: 12-15 minutes"
                      : "You can pause and resume later."}
                  </p>
                </div>
              </div>

              {currentStage.id === "welcome" ? (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {[
                    "This version is intentionally concise so owners can complete it in one sitting.",
                    "Every field autosaves locally so you can pause without losing work.",
                    "A protected AI copilot can help sharpen difficult answers without exposing your OpenAI key in the browser.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 text-sm leading-7 text-[var(--color-muted)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}

              {currentStage.id !== "review" && currentStage.id !== "submit" ? (
                <>
                  <div className="mt-8 space-y-5">
                    {currentStage.questions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        value={draft.answers[question.id]}
                        onChange={(nextValue) => updateAnswer(question.id, nextValue)}
                      />
                    ))}
                  </div>

                  {assistableQuestion ? (
                    <div className="mt-8 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                            <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                            D2D AI Copilot
                          </p>
                          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                            Talk through this section with AI and get one sharper follow-up question plus a suggested draft answer for{" "}
                            <span className="font-medium text-[var(--color-ink)]">
                              {assistableQuestion.label}
                            </span>
                            .
                          </p>
                        </div>
                        <span className="rounded-full bg-[var(--color-panel)] px-3 py-2 text-xs font-medium text-[var(--color-muted)]">
                          {copilotReady ? "Protected session active" : "Copilot offline"}
                        </span>
                      </div>

                      <textarea
                        rows={4}
                        value={copilotPrompt}
                        onChange={(event) => setCopilotPrompt(event.target.value)}
                        placeholder="Example: We do high-end custom home building, but I’m struggling to explain why clients choose us over other premium builders."
                        className="mt-5 min-h-28 w-full rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                      />

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleCopilotAsk}
                          disabled={!copilotReady || copilotState === "loading"}
                          className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary-bg)] px-5 py-3 text-sm font-semibold text-[var(--button-primary-text)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {copilotState === "loading" ? "Thinking..." : "Ask AI Copilot"}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        {copilotResponse?.suggestedAnswer ? (
                          <button
                            type="button"
                            onClick={applyCopilotDraft}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
                          >
                            Use Suggested Draft
                          </button>
                        ) : null}
                      </div>

                      {copilotResponse ? (
                        <div className="mt-5 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                          <p className="text-sm font-semibold text-[var(--color-ink)]">
                            {copilotResponse.assistantMessage}
                          </p>
                          {copilotResponse.followUpQuestion ? (
                            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                              <span className="font-medium text-[var(--color-ink)]">
                                Follow-up:
                              </span>{" "}
                              {copilotResponse.followUpQuestion}
                            </p>
                          ) : null}
                          {copilotResponse.suggestedAnswer ? (
                            <div className="mt-4 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                                Suggested draft
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--color-muted)]">
                                {copilotResponse.suggestedAnswer}
                              </p>
                            </div>
                          ) : null}
                          <p className="mt-3 text-xs text-[var(--color-muted)]">
                            Confidence: {copilotResponse.confidence}. Remaining protected AI requests this session:{" "}
                            {copilotResponse.remainingRequests}.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-8 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
                    <div className="flex items-center gap-2 text-[var(--color-ink)]">
                      <PartyPopper className="h-4 w-4 text-[var(--color-accent)]" />
                      <p className="text-sm font-semibold">
                        Here&apos;s what we&apos;ve learned so far...
                      </p>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                      {currentSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <label className="mt-5 block">
                      <span className="text-sm font-medium text-[var(--color-ink)]">
                        Edit this summary
                      </span>
                      <textarea
                        rows={5}
                        value={currentSummary.join("\n")}
                        onChange={(event) =>
                          updateSummary(currentStage.id, event.target.value)
                        }
                        className="mt-3 min-h-32 w-full rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                      />
                    </label>
                  </div>
                </>
              ) : null}

              {currentStage.id === "review" ? (
                <ReviewPanel
                  answers={draft.answers}
                  summaries={draft.summaries}
                  onEdit={goToSection}
                />
              ) : null}

              {currentStage.id === "submit" ? (
                <div className="mt-8 space-y-6">
                  <ReportPreview
                    report={report}
                    payload={{
                      submittedAt: draft.submittedAt,
                      answers: draft.answers,
                      summaries: draft.summaries,
                    }}
                  />
                  <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitState === "submitting"}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
                      >
                        {submitState === "submitting" ? "Submitting..." : "Submit Discovery"}
                      </button>
                      <button
                        type="button"
                        onClick={resetDraft}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)]"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Reset draft
                      </button>
                    </div>

                    {submitState === "submitted" ? (
                      <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">
                        {deliveryStatus?.configured
                          ? "Submitted successfully. Notification email and database storage both ran."
                          : "Submitted successfully. This deployment still needs Resend and Supabase environment variables before owner email notifications and database storage will go live."}
                      </p>
                    ) : null}
                    {submitState === "error" ? (
                      <p className="mt-4 text-sm text-rose-700 dark:text-rose-300">
                        Submission failed, but your progress is still saved in browser storage.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentSectionIndex === 0}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {currentStage.id !== "submit" ? (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-ink-soft)]"
                  >
                    {currentStage.id === "welcome"
                      ? "Start Brand Discovery"
                      : currentStage.id === "review"
                        ? "Generate Report"
                        : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
