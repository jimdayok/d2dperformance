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
            {block.collapsible ? (
              <details className="group">
                <summary className="cursor-pointer list-none text-xl font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                  {block.title}
                </summary>
                <div className="mt-4 space-y-4">
                  {block.body ? (
                    <p className="text-sm leading-7 text-[var(--color-muted)]">
                      {block.body}
                    </p>
                  ) : null}
                  {block.priority ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      Priority: {block.priority}
                    </p>
                  ) : null}
                  {block.bullets?.length ? (
                    <ul className="space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                      {block.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                  {block.table ? (
                    <div className="overflow-x-auto rounded-[1rem] border border-[var(--color-border)]">
                      <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm text-[var(--color-muted)]">
                        <thead className="bg-[var(--color-card)] text-[var(--color-ink)]">
                          <tr>
                            {block.table.columns.map((column) => (
                              <th key={column} className="px-4 py-3 font-semibold">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.table.rows.map((row) => (
                            <tr key={row.join("|")} className="border-t border-[var(--color-border)]">
                              {row.map((cell) => (
                                <td key={cell} className="px-4 py-3 align-top">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {block.quickWins?.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                        Quick Wins (30 Days)
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                        {block.quickWins.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {block.longTermOpportunities?.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                        Long-Term Opportunities (6-24 Months)
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                        {block.longTermOpportunities.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {block.sourceData?.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                        Source Data
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                        {block.sourceData.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {block.questionResponses?.length ? (
                    <div className="space-y-4">
                      {block.questionResponses.map((item) => (
                        <div
                          key={`${block.title}-${item.question}`}
                          className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                            Question
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                            {item.question}
                          </p>
                          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                            Customer Response
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--color-muted)]">
                            {item.response}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </details>
            ) : (
              <>
                <h4 className="text-xl font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                  {block.title}
                </h4>
                {block.body ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    {block.body}
                  </p>
                ) : null}
                {block.priority ? (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                    Priority: {block.priority}
                  </p>
                ) : null}
                {block.bullets?.length ? (
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                    {block.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {block.table ? (
                  <div className="mt-4 overflow-x-auto rounded-[1rem] border border-[var(--color-border)]">
                    <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm text-[var(--color-muted)]">
                      <thead className="bg-[var(--color-card)] text-[var(--color-ink)]">
                        <tr>
                          {block.table.columns.map((column) => (
                            <th key={column} className="px-4 py-3 font-semibold">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.table.rows.map((row) => (
                          <tr key={row.join("|")} className="border-t border-[var(--color-border)]">
                            {row.map((cell) => (
                              <td key={cell} className="px-4 py-3 align-top">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {block.quickWins?.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      Quick Wins (30 Days)
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                      {block.quickWins.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {block.longTermOpportunities?.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      Long-Term Opportunities (6-24 Months)
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                      {block.longTermOpportunities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {block.sourceData?.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      Source Data
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                      {block.sourceData.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
