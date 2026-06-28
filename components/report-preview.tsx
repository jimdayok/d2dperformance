"use client";

import { Copy, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { reportToMarkdown } from "@/lib/brand-report";
import type { ReportBlock } from "@/types/brand-discovery";

type ReportPreviewProps = {
  report: ReportBlock[];
  payload: unknown;
};

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportPreview({ report, payload }: ReportPreviewProps) {
  const markdown = reportToMarkdown(report);
  const json = JSON.stringify(payload, null, 2);

  async function copyReport() {
    await navigator.clipboard.writeText(markdown);
    toast.success("Report copied to your clipboard.");
  }

  return (
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            Brand Intelligence Report
          </p>
          <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
            Export-ready strategy draft
          </h3>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            This front-end version generates a structured draft from the answers
            collected so far. It is designed to become the handoff layer for
            future OpenAI report generation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyReport}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
          >
            <Copy className="h-4 w-4" />
            Copy Report
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile("brand-intelligence.json", json, "application/json")}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
          >
            <Download className="h-4 w-4" />
            Download JSON
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile("brand-intelligence.md", markdown, "text/markdown")}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
          >
            <Download className="h-4 w-4" />
            Download Markdown
          </button>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4" />
            Generate Full AI Report
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {report.map((block) => (
          <article
            key={block.title}
            className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-5"
          >
            <h4 className="text-xl font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
              {block.title}
            </h4>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              {block.body}
            </p>
            {block.bullets?.length ? (
              <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                {block.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
