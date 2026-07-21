"use client";

import { useMemo, useState } from "react";
import type { EditorField, EditorGroup } from "@/lib/site-manager/sites/alford-custom-homes/editor-config";

type ContentBlock = { type: "paragraph" | "heading" | "blockquote" | "list"; text: string };
type TitledCopy = { title: string; description: string };
type JsonObject = Record<string, unknown>;

type Entry = {
  id: string;
  title: string;
  draft_data: JsonObject;
  draft_revision: number;
  workflow_status: string;
  published_at: string | null;
};

const fieldClass = "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[#18201d] outline-none transition focus:border-[#9a5f34] focus:ring-2 focus:ring-[#9a5f34]/15";

function valueAt(data: JsonObject, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as JsonObject)[key] : undefined, data);
}

function setValueAt(data: JsonObject, path: string, value: unknown): JsonObject {
  const keys = path.split(".");
  const copy = structuredClone(data);
  let target = copy;
  keys.slice(0, -1).forEach((key) => {
    const current = target[key];
    target[key] = current && typeof current === "object" && !Array.isArray(current) ? { ...(current as JsonObject) } : {};
    target = target[key] as JsonObject;
  });
  target[keys.at(-1)!] = value;
  return copy;
}

function Field({ field, data, update }: { field: EditorField; data: JsonObject; update: (path: string, value: unknown) => void }) {
  const value = valueAt(data, field.path);
  if (field.kind === "checkbox") {
    return <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 text-sm font-medium"><input type="checkbox" checked={Boolean(value)} onChange={(event) => update(field.path, event.target.checked)} className="size-4 accent-[#9a5f34]" />{field.label}</label>;
  }
  if (field.kind === "string_list") {
    const items = Array.isArray(value) ? value.map(String) : [];
    return <Repeatable label={field.label} help={field.help} addLabel="Add item" onAdd={() => update(field.path, [...items, ""])}>{items.map((item, index) => <div key={`${field.path}-${index}`} className="flex gap-2"><textarea value={item} onChange={(event) => update(field.path, items.map((current, itemIndex) => itemIndex === index ? event.target.value : current))} rows={2} className={fieldClass} /><RemoveButton onClick={() => update(field.path, items.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</Repeatable>;
  }
  if (field.kind === "titled_copy_list") {
    const items = Array.isArray(value) ? value as TitledCopy[] : [];
    return <Repeatable label={field.label} help={field.help} addLabel="Add item" onAdd={() => update(field.path, [...items, { title: "", description: "" }])}>{items.map((item, index) => <div key={`${field.path}-${index}`} className="rounded-xl border border-black/10 p-4"><div className="flex justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wider text-black/45">Item {index + 1}</p><RemoveButton onClick={() => update(field.path, items.filter((_, itemIndex) => itemIndex !== index))} /></div><input aria-label={`${field.label} ${index + 1} title`} value={item.title} onChange={(event) => update(field.path, items.map((current, itemIndex) => itemIndex === index ? { ...current, title: event.target.value } : current))} placeholder="Title" className={fieldClass} /><textarea aria-label={`${field.label} ${index + 1} description`} value={item.description} onChange={(event) => update(field.path, items.map((current, itemIndex) => itemIndex === index ? { ...current, description: event.target.value } : current))} placeholder="Description" rows={3} className={fieldClass} /></div>)}</Repeatable>;
  }
  if (field.kind === "content_blocks") {
    const items = Array.isArray(value) ? value as ContentBlock[] : [];
    return <Repeatable label={field.label} help={field.help} addLabel="Add section" onAdd={() => update(field.path, [...items, { type: "paragraph", text: "" }])}>{items.map((item, index) => <div key={`${field.path}-${index}`} className="rounded-xl border border-black/10 p-4"><div className="flex items-center justify-between gap-3"><select aria-label={`Section ${index + 1} type`} value={item.type} onChange={(event) => update(field.path, items.map((current, itemIndex) => itemIndex === index ? { ...current, type: event.target.value as ContentBlock["type"] } : current))} className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"><option value="heading">Heading</option><option value="paragraph">Paragraph</option><option value="blockquote">Quotation</option><option value="list">List</option></select><RemoveButton onClick={() => update(field.path, items.filter((_, itemIndex) => itemIndex !== index))} /></div><textarea aria-label={`Section ${index + 1} content`} value={item.text} onChange={(event) => update(field.path, items.map((current, itemIndex) => itemIndex === index ? { ...current, text: event.target.value } : current))} rows={item.type === "heading" ? 2 : 5} className={fieldClass} /></div>)}</Repeatable>;
  }
  const common = {
    value: typeof value === "string" || typeof value === "number" ? value : "",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      update(
        field.path,
        field.kind === "number" ? Number(event.target.value) : event.target.value,
      ),
    maxLength: field.maxLength,
    className: fieldClass,
  };

  const control = field.kind === "textarea"
    ? <textarea {...common} rows={4} />
    : <input
        {...common}
        type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
      />;

  return (
    <label className="text-sm font-medium">
      {field.label}
      {control}
      {field.help ? (
        <span className="mt-1 block text-xs font-normal text-black/50">{field.help}</span>
      ) : null}
    </label>
  );
}

function Repeatable({ label, help, addLabel, onAdd, children }: { label: string; help?: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) {
  return <fieldset className="grid gap-3"><div className="flex items-end justify-between gap-3"><div><legend className="text-sm font-medium">{label}</legend>{help ? <p className="mt-1 text-xs text-black/50">{help}</p> : null}</div><button type="button" onClick={onAdd} className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold">{addLabel}</button></div>{children}</fieldset>;
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mt-2 shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Remove</button>;
}

function previewPath(modelKey: string, data: JsonObject) {
  if (modelKey === "about-page") return "/about";
  if (modelKey === "contact-page") return "/contact";
  if (modelKey === "service") return "/services";
  if (modelKey === "process-step") return "/our-process";
  if (modelKey === "testimonial" || modelKey === "global-settings") return "/";
  if (modelKey === "service-area") return `/service-areas#${String(data.slug ?? "")}`;
  if (modelKey === "journal-post") return `/journal/${String(data.slug ?? "")}`;
  return "/";
}

export function StructuredEntryEditor({ entry, siteSlug, modelKey, groups, canPublish }: { entry: Entry; siteSlug: string; modelKey: string; groups: EditorGroup[]; canPublish: boolean }) {
  const [data, setData] = useState(entry.draft_data);
  const [savedData, setSavedData] = useState(entry.draft_data);
  const [revision, setRevision] = useState(entry.draft_revision);
  const [status, setStatus] = useState(entry.workflow_status);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const isDirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(savedData), [data, savedData]);
  const update = (path: string, value: unknown) => setData((current) => setValueAt(current, path, value));

  async function save(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    const title = typeof data.title === "string" && data.title.trim() ? data.title : entry.title;
    const response = await fetch(`/api/cms/entries/${entry.id}/draft`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteSlug, modelKey, expectedRevision: revision, title, data }) });
    const payload = await response.json().catch(() => ({})); setPending(false);
    if (!response.ok) { setMessage(response.status === 409 ? "Someone else saved a newer draft. Refresh before continuing." : typeof payload.error === "string" ? payload.error : "The draft could not be saved. Check the highlighted content and try again."); return; }
    const nextRevision = Number(payload.entry?.draft_revision ?? revision + 1); setRevision(nextRevision); setSavedData(data); setStatus(String(payload.entry?.workflow_status ?? "draft")); setMessage("Draft saved.");
  }

  async function workflow(action: "submit" | "publish") {
    setPending(true); setMessage("");
    const body = action === "publish" ? { siteSlug, modelKey, expectedRevision: revision, path: previewPath(modelKey, data) } : { siteSlug, expectedRevision: revision };
    const response = await fetch(`/api/cms/entries/${entry.id}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({})); setPending(false);
    if (!response.ok) { setMessage(typeof payload.error === "string" ? payload.error : `${action === "submit" ? "Submission" : "Publishing"} failed.`); return; }
    setStatus(action === "submit" ? "in_review" : "published"); setMessage(action === "submit" ? "Submitted for D2D review." : payload.message ?? "Published.");
  }

  async function openPreview() {
    const response = await fetch("/api/cms/preview-token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteSlug, path: previewPath(modelKey, data) }) });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.url) window.open(payload.url, "_blank", "noopener,noreferrer"); else setMessage(payload.error ?? "Preview could not be opened.");
  }

  return <form onSubmit={save} className="space-y-8"><header className="rounded-2xl border border-black/10 bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-black/45">Workflow status</p><p className="mt-1 font-semibold capitalize">{status.replaceAll("_", " ")}</p></div><div className="text-right text-xs text-black/50"><p>Draft revision {revision}</p><p>Last published {entry.published_at ? new Date(entry.published_at).toLocaleString() : "Never"}</p></div></div></header>{groups.map((group) => <section key={group.title} className="rounded-2xl border border-black/10 bg-white p-6"><h2 className="font-display text-2xl font-semibold">{group.title}</h2>{group.description ? <p className="mt-1 text-sm text-black/55">{group.description}</p> : null}<div className="mt-6 grid gap-5 md:grid-cols-2">{group.fields.map((field) => <div key={field.path} className={field.kind?.includes("list") || field.kind === "content_blocks" || field.kind === "textarea" ? "md:col-span-2" : ""}><Field field={field} data={data} update={update} /></div>)}</div></section>)}<div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xl backdrop-blur"><button type="submit" disabled={pending || !isDirty} className="rounded-lg bg-[#18201d] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-40">{pending ? "Working…" : "Save Draft"}</button><button type="button" onClick={() => workflow("submit")} disabled={pending || isDirty || status === "in_review"} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold disabled:opacity-40">Submit for Review</button>{canPublish ? <button type="button" onClick={() => workflow("publish")} disabled={pending || isDirty || status !== "in_review"} className="rounded-lg bg-[#9a5f34] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-40">Publish</button> : null}<button type="button" onClick={openPreview} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">Open Preview</button><p aria-live="polite" className="ml-auto text-sm text-black/60">{isDirty ? "Unsaved changes" : message || "All changes saved"}</p></div></form>;
}
