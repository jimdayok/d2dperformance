"use client";

import { useState } from "react";

type FormValues = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  company: "",
  email: "",
  phone: "",
  message: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!values.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmail(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.message.trim()) {
    errors.message = "Please share what you'd like to discuss.";
  }

  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState("");

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitState("error");
      setFeedback("Please fix the highlighted fields and try again.");
      return;
    }

    setSubmitState("sending");
    setFeedback("");

    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          page: window.location.href,
          source: document.referrer || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.error ||
            "We couldn't send your message right now. Please try again in a moment.",
        );
      }

      setValues(initialValues);
      setErrors({});
      setSubmitState("success");
      setFeedback(
        payload.message ||
          "Thanks for reaching out. Your message has been sent and we'll follow up soon.",
      );
    } catch (error) {
      setSubmitState("error");
      setFeedback(
        error instanceof Error
          ? error.message
          : "We couldn't send your message right now. Please try again in a moment.",
      );
    }
  }

  return (
    <form className="editorial-frame p-8" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5">
        <label className="grid gap-3">
          <span className="text-sm font-medium text-[var(--color-ink)]">Name</span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className="h-14 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
          {errors.name ? (
            <p id="contact-name-error" className="text-sm text-[var(--color-accent)]">
              {errors.name}
            </p>
          ) : null}
        </label>

        <label className="grid gap-3">
          <span className="text-sm font-medium text-[var(--color-ink)]">Company</span>
          <input
            type="text"
            value={values.company}
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="Company name"
            autoComplete="organization"
            className="h-14 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="grid gap-3">
          <span className="text-sm font-medium text-[var(--color-ink)]">Email</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className="h-14 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
          {errors.email ? (
            <p id="contact-email-error" className="text-sm text-[var(--color-accent)]">
              {errors.email}
            </p>
          ) : null}
        </label>

        <label className="grid gap-3">
          <span className="text-sm font-medium text-[var(--color-ink)]">Phone</span>
          <input
            type="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="(555) 555-5555"
            autoComplete="tel"
            className="h-14 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="grid gap-3">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            What are you trying to solve?
          </span>
          <textarea
            rows={8}
            value={values.message}
            onChange={(event) => updateField("message", event.target.value)}
            placeholder="Share the business challenge, growth objective, or leadership issue you want to discuss."
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            className="min-h-40 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
          {errors.message ? (
            <p id="contact-message-error" className="text-sm text-[var(--color-accent)]">
              {errors.message}
            </p>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={submitState === "sending"}
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-charcoal)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitState === "sending" ? "Sending..." : "Send Message"}
        </button>

        {feedback ? (
          <p
            className={`text-sm ${
              submitState === "success"
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-accent)]"
            }`}
            role={submitState === "error" ? "alert" : "status"}
          >
            {feedback}
          </p>
        ) : null}
      </div>
    </form>
  );
}
