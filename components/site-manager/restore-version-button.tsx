"use client";
import { useState } from "react";

export function RestoreVersionButton({ siteSlug, entryId, versionId, expectedRevision }: { siteSlug: string; entryId: string; versionId: string; expectedRevision: number }) {
  const [message, setMessage] = useState("");
  async function restore() { if (!window.confirm("Restore this version into the current draft? The live website will not change.")) return; const response = await fetch(`/api/cms/entries/${entryId}/restore`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteSlug, versionId, expectedRevision }) }); const result = await response.json(); setMessage(result.message ?? result.error); }
  return <div className="text-right"><button onClick={restore} className="text-xs font-semibold underline underline-offset-4">Restore to draft</button>{message ? <p aria-live="polite" className="mt-1 max-w-56 text-xs text-black/50">{message}</p> : null}</div>;
}
