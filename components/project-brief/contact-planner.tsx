"use client";

import { ArrowUpRight, Check } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { getLeadAttributionForSubmission } from "./lead-attribution";
import { AltchaVerification } from "./altcha-verification";

const needs = [
  "Brand clarity",
  "Strategy & planning",
  "Creative",
  "Content marketing",
  "Social media",
  "Digital marketing",
  "Website development",
  "App development",
  "Revenue improvement",
  "Dashboards & reporting",
  "Business systems",
];

export function ContactPlanner({ platform = "performance" }: { platform?: "marketing" | "digital" | "performance" }) {
  const [verified, setVerified] = useState(false);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verificationKey, setVerificationKey] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const toggleNeed = (need: string) => {
    setSelectedNeeds((current) =>
      current.includes(need)
        ? current.filter((item) => item !== need)
        : [...current, need],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!verified || !data.get("altcha")) {
      setStatus("error");
      setMessage("Please complete the bot verification above the send button.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/marketing/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          source: data.get("source"),
          interests: selectedNeeds,
          timing: data.get("timing"),
          message: data.get("message"),
          privacyAccepted: data.get("privacyAccepted") === "on",
          altcha: data.get("altcha"),
          website: data.get("website"),
          startedAt: startedAt.current,
          attribution: getLeadAttributionForSubmission(),
        }),
      });
      const result = await response.json() as {
        message?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!response.ok) {
        setStatus("error");
        setMessage(result.error || "Your brief could not be sent. Please try again.");
        setFieldErrors(result.fieldErrors ?? {});
        setVerificationKey((current) => current + 1);
        return;
      }

      setStatus("success");
      setMessage(result.message || "Your project brief has been received.");
      form.reset();
      setSelectedNeeds([]);
      setVerificationKey((current) => current + 1);
      startedAt.current = Date.now();

    } catch {
      setStatus("error");
      setMessage("The connection was interrupted. Please try again or call 269-788-7067.");
      setVerificationKey((current) => current + 1);
    }
  };

  return (
    <form className="contact-planner" onSubmit={handleSubmit}>
      <div className="planner-intro">
        <p className="eyebrow dark">Project brief</p>
        <h2>Start with the right questions.</h2>
        <p>
          Share where the business is now and what needs to move. Your brief is
          delivered securely to Andrea, and you will receive a confirmation.
        </p>
      </div>

      <div className="planner-fields">
        <label>
          <span>Name *</span>
          <input name="name" autoComplete="name" required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "planner-name-error" : undefined} />
          {fieldErrors.name ? <small className="field-error" id="planner-name-error">{fieldErrors.name}</small> : null}
        </label>
        <label>
          <span>E-mail *</span>
          <input name="email" type="email" autoComplete="email" required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "planner-email-error" : undefined} />
          {fieldErrors.email ? <small className="field-error" id="planner-email-error">{fieldErrors.email}</small> : null}
        </label>
        <label>
          <span>Phone *</span>
          <input name="phone" type="tel" autoComplete="tel" required aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "planner-phone-error" : undefined} />
          {fieldErrors.phone ? <small className="field-error" id="planner-phone-error">{fieldErrors.phone}</small> : null}
        </label>
        <label>
          <span>How did you hear about us? *</span>
          <select name="source" required defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            <option>Facebook</option>
            <option>Instagram</option>
            <option>Google</option>
            <option>Word of Mouth</option>
            <option>Referral</option>
            <option>Other</option>
          </select>
          {fieldErrors.source ? <small className="field-error">{fieldErrors.source}</small> : null}
        </label>
      </div>

      <fieldset className="planner-needs">
        <legend>Where would support make the biggest difference?</legend>
        <div>
          {needs.map((need) => {
            const selected = selectedNeeds.includes(need);
            return (
              <button
                className={selected ? "is-selected" : ""}
                type="button"
                key={need}
                aria-pressed={selected}
                onClick={() => toggleNeed(need)}
              >
                <Check aria-hidden="true" />
                {need}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="planner-detail">
        <label>
          <span>What do you want to move forward?</span>
          <textarea name="message" rows={6} />
        </label>
        <label>
          <span>Ideal timing</span>
          <select name="timing" defaultValue="Ready to start">
            <option>Ready to start</option>
            <option>Within 30 days</option>
            <option>This quarter</option>
            <option>Still exploring</option>
          </select>
        </label>
      </div>

      <label className="form-honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="planner-privacy">
        <input name="privacyAccepted" type="checkbox" required />
        <span>
          I agree that DAY2DAY Marketing may use this information to respond to
          my inquiry as described in the <a href="https://d2dmktg.com/privacy-policy">privacy policy</a>.
        </span>
      </label>
      {fieldErrors.privacyAccepted ? <small className="field-error">{fieldErrors.privacyAccepted}</small> : null}

      <AltchaVerification key={verificationKey} onVerified={setVerified} />

      <button className="planner-submit" type="submit" disabled={status === "submitting" || !verified}>
        {status === "submitting" ? "Sending securely…" : "Send my project brief"} <ArrowUpRight aria-hidden="true" />
      </button>
      <p className={`planner-note form-status is-${status}`} role="status" aria-live="polite">
        {message || "Your information is encrypted in transit and used only to respond to your inquiry."}
      </p>
    </form>
  );
}
