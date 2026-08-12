"use client";

import { ExternalLink, Eye, Monitor, RefreshCw, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type PreviewViewport = "desktop" | "mobile";

type LivePreviewPaneProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteSlug: string;
  path: string;
  refreshKey: number;
  siteName: string;
};

export function LivePreviewPane({
  open,
  onOpenChange,
  siteSlug,
  path,
  refreshKey,
  siteName,
}: LivePreviewPaneProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualRefresh, setManualRefresh] = useState(0);
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch("/api/cms/preview-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteSlug, path }),
        signal: controller.signal,
      })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || typeof payload.url !== "string") throw new Error(typeof payload.error === "string" ? payload.error : "Preview could not be loaded.");
        return payload.url as string;
      })
      .then((url) => { setPreviewUrl(url); setError(""); })
      .catch((previewError: unknown) => {
        if (previewError instanceof DOMException && previewError.name === "AbortError") return;
        setError(previewError instanceof Error ? previewError.message : "Preview could not be loaded.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [manualRefresh, open, path, refreshKey, siteSlug]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed right-5 bottom-5 z-30 inline-flex items-center gap-2 rounded-full bg-[#18201d] px-5 py-3 text-sm font-semibold !text-white shadow-2xl"
      >
        <Eye size={16} /> Show live preview
      </button>
    );
  }

  return (
    <aside className="portal-preview-pane overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_70px_rgba(24,32,29,0.14)] xl:sticky xl:top-24 xl:flex xl:h-[calc(100vh-7rem)] xl:flex-col">
      <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-black/10 px-4 py-3 xl:flex-nowrap xl:py-0">
        <div className="mr-auto min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">Saved draft preview</p>
          <p className="mt-1 truncate text-sm font-semibold">{siteName}</p>
        </div>
        <div role="group" aria-label="Preview viewport" className="flex items-center rounded-lg border border-black/10 bg-[#f4f0e9] p-1">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            aria-pressed={viewport === "desktop"}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${viewport === "desktop" ? "bg-white text-[#18201d] shadow-sm" : "text-black/50 hover:text-black"}`}
          >
            <Monitor size={14} aria-hidden="true" /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            aria-pressed={viewport === "mobile"}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${viewport === "mobile" ? "bg-white text-[#18201d] shadow-sm" : "text-black/50 hover:text-black"}`}
          >
            <Smartphone size={14} aria-hidden="true" /> Mobile
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => { setLoading(true); setError(""); setManualRefresh((value) => value + 1); }} aria-label="Refresh live preview" className="rounded-lg p-2 text-black/55 hover:bg-black/5 hover:text-black">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          {previewUrl ? (
            <a href={previewUrl} target="_blank" rel="noreferrer" aria-label="Open preview in a new tab" className="rounded-lg p-2 text-black/55 hover:bg-black/5 hover:text-black">
              <ExternalLink size={16} />
            </a>
          ) : null}
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close live preview" className="rounded-lg p-2 text-black/55 hover:bg-black/5 hover:text-black">
            <X size={17} />
          </button>
        </div>
      </header>
      <div className="relative h-[42rem] overflow-auto bg-[#ebe7df] xl:h-auto xl:min-h-0 xl:flex-1">
        {previewUrl && !error ? (
          <div className={`h-full bg-white transition-[max-width,box-shadow] duration-200 ${viewport === "mobile" ? "mx-auto w-full max-w-[390px] border-x-[6px] border-[#18201d] shadow-[0_20px_55px_rgba(24,32,29,0.28)]" : "w-full"}`}>
            <iframe
              key={previewUrl}
              src={previewUrl}
              title={`${siteName} saved draft ${viewport} preview`}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            />
          </div>
        ) : null}
        {loading ? <div className="absolute inset-0 grid place-items-center bg-[#f7f3ed]/90 text-sm font-medium text-black/60">Loading the saved draft…</div> : null}
        {error ? (
          <div role="alert" className="absolute inset-0 grid place-items-center p-8 text-center">
          <div><p className="font-semibold text-red-800">Preview unavailable</p><p className="mt-2 max-w-sm text-sm leading-6 text-black/60">{error}</p><button type="button" onClick={() => { setLoading(true); setError(""); setManualRefresh((value) => value + 1); }} className="mt-4 rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-semibold">Try again</button></div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
