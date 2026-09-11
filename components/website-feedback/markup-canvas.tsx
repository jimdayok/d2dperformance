"use client";

import { ArrowUpRight, Circle, MessageSquareText, MousePointer2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { MarkupNote } from "@/lib/website-feedback-schema";

type Tool = "browse" | "select" | "draw" | "arrow" | "circle" | "note";
type Point = { x: number; y: number };

const categoryLabels: Record<MarkupNote["category"], string> = {
  modify_text: "Modify text",
  change_picture: "Change picture",
  general: "General note",
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function MarkupCanvas({
  annotations,
  onChange,
  frameRef,
  url,
  title,
  disabled,
}: {
  annotations: MarkupNote[];
  onChange: (annotations: MarkupNote[]) => void;
  frameRef: React.RefObject<HTMLIFrameElement | null>;
  url: string;
  title: string;
  disabled: boolean;
}) {
  const [tool, setTool] = useState<Tool>("browse");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const layerRef = useRef<HTMLDivElement>(null);
  const selected = annotations.find((annotation) => annotation.id === selectedId) ?? null;

  function pointFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = layerRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width),
      y: clamp((event.clientY - bounds.top) / bounds.height),
    };
  }

  function addAnnotation(annotation: MarkupNote) {
    onChange([...annotations, annotation]);
    setSelectedId(annotation.id);
    setTool("select");
  }

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || event.target !== event.currentTarget) return;
    if (tool === "note") {
      const point = pointFromEvent(event);
      addAnnotation({ id: crypto.randomUUID(), kind: "note", category: "general", x: point.x, y: point.y, width: 0, height: 0, points: [], text: "" });
      return;
    }
    if (!(["circle", "draw", "arrow"] as Tool[]).includes(tool)) {
      setSelectedId(null);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    setStart(point);
    if (tool === "draw" || tool === "arrow") setDraftPoints([point]);
    setDraft({ x: point.x, y: point.y, width: 0, height: 0 });
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!start || !(["circle", "draw", "arrow"] as Tool[]).includes(tool)) return;
    const point = pointFromEvent(event);
    if (tool === "draw") {
      setDraftPoints((current) => {
        const previous = current.at(-1);
        if (previous && Math.hypot(previous.x - point.x, previous.y - point.y) < 0.0025) return current;
        return [...current, point];
      });
    } else if (tool === "arrow") {
      setDraftPoints((current) => current.length ? [current[0], point] : [start, point]);
    }
    setDraft({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
  }

  function pointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!start || !(["circle", "draw", "arrow"] as Tool[]).includes(tool)) return;
    const point = pointFromEvent(event);
    const width = Math.abs(point.x - start.x);
    const height = Math.abs(point.y - start.y);
    let annotation: MarkupNote;
    if (tool === "circle") {
      annotation = width < 0.015 && height < 0.015
        ? { id: crypto.randomUUID(), kind: "circle", category: "general", x: clamp(point.x - 0.04), y: clamp(point.y - 0.04), width: 0.08, height: 0.08, points: [], text: "" }
        : { id: crypto.randomUUID(), kind: "circle", category: "general", x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), width, height, points: [], text: "" };
    } else {
      const points = tool === "arrow" ? [start, point] : [...draftPoints, point];
      const xs = points.map((item) => item.x);
      const ys = points.map((item) => item.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      annotation = {
        id: crypto.randomUUID(),
        kind: tool === "draw" ? "draw" : "arrow",
        category: "general",
        x: minX,
        y: minY,
        width: Math.max(Math.max(...xs) - minX, 0.006),
        height: Math.max(Math.max(...ys) - minY, 0.006),
        points,
        text: "",
      };
    }
    setStart(null);
    setDraft(null);
    setDraftPoints([]);
    addAnnotation(annotation);
  }

  function updateSelected(patch: Partial<MarkupNote>) {
    if (!selectedId) return;
    onChange(annotations.map((annotation) => annotation.id === selectedId ? { ...annotation, ...patch } : annotation));
  }

  function deleteSelected() {
    if (!selectedId) return;
    onChange(annotations.filter((annotation) => annotation.id !== selectedId));
    setSelectedId(null);
  }

  function undo() {
    if (!annotations.length) return;
    const removed = annotations.at(-1);
    onChange(annotations.slice(0, -1));
    if (removed?.id === selectedId) setSelectedId(null);
  }

  return (
    <>
      <div className="markup-toolbar" aria-label="Website markup tools">
        <div className="markup-toolset">
          <button type="button" className={tool === "browse" ? "is-selected" : ""} onClick={() => { setTool("browse"); setSelectedId(null); }} disabled={disabled}><MousePointer2 size={15} /> Browse site</button>
          <button type="button" className={tool === "draw" ? "is-selected" : ""} onClick={() => setTool("draw")} disabled={disabled}><Pencil size={15} /> Draw freehand</button>
          <button type="button" className={tool === "arrow" ? "is-selected" : ""} onClick={() => setTool("arrow")} disabled={disabled}><ArrowUpRight size={15} /> Draw arrow</button>
          <button type="button" className={tool === "circle" ? "is-selected" : ""} onClick={() => setTool("circle")} disabled={disabled}><Circle size={15} /> Circle an area</button>
          <button type="button" className={tool === "note" ? "is-selected" : ""} onClick={() => setTool("note")} disabled={disabled}><MessageSquareText size={15} /> Place a note</button>
          {annotations.length ? <button type="button" onClick={() => setTool("select")} className={tool === "select" ? "is-selected" : ""} disabled={disabled}>Edit marks</button> : null}
        </div>
        <div className="markup-help">
          <span>{tool === "browse" ? "Follow links and scroll normally." : tool === "draw" ? "Draw directly over anything that needs attention." : tool === "arrow" ? "Drag from the note toward the exact item." : tool === "circle" ? "Drag around anything you want changed." : tool === "note" ? "Click exactly where your note belongs." : "Select a numbered mark to edit its note."}</span>
          <button type="button" onClick={undo} disabled={disabled || !annotations.length} aria-label="Undo last markup"><RotateCcw size={14} /> Undo</button>
        </div>
      </div>
      <div className="markup-surface">
        <iframe ref={frameRef} key={url} src={url} title={`Desktop preview of ${title || url}`} sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" />
        <div
          ref={layerRef}
          className={`markup-layer ${tool === "browse" ? "is-browsing" : "is-marking"}`}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={() => { setStart(null); setDraft(null); setDraftPoints([]); }}
          aria-label="Website annotation layer"
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id="markup-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L7,3 z" /></marker></defs>
            {annotations.filter((annotation) => annotation.kind === "circle").map((annotation) => (
              <ellipse
                key={annotation.id}
                className={annotation.id === selectedId ? "is-selected" : ""}
                cx={(annotation.x + annotation.width / 2) * 100}
                cy={(annotation.y + annotation.height / 2) * 100}
                rx={Math.max(annotation.width / 2, 0.012) * 100}
                ry={Math.max(annotation.height / 2, 0.012) * 100}
              />
            ))}
            {annotations.filter((annotation) => annotation.kind === "draw" && annotation.points.length > 1).map((annotation) => (
              <polyline key={annotation.id} className={annotation.id === selectedId ? "is-selected" : ""} points={annotation.points.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")} />
            ))}
            {annotations.filter((annotation) => annotation.kind === "arrow" && annotation.points.length > 1).map((annotation) => (
              <line key={annotation.id} className={annotation.id === selectedId ? "is-selected" : ""} x1={annotation.points[0].x * 100} y1={annotation.points[0].y * 100} x2={annotation.points.at(-1)!.x * 100} y2={annotation.points.at(-1)!.y * 100} markerEnd="url(#markup-arrowhead)" />
            ))}
            {tool === "circle" && draft ? <ellipse className="is-draft" cx={(draft.x + draft.width / 2) * 100} cy={(draft.y + draft.height / 2) * 100} rx={Math.max(draft.width / 2, 0.005) * 100} ry={Math.max(draft.height / 2, 0.005) * 100} /> : null}
            {tool === "draw" && draftPoints.length > 1 ? <polyline className="is-draft" points={draftPoints.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")} /> : null}
            {tool === "arrow" && draftPoints.length > 1 ? <line className="is-draft" x1={draftPoints[0].x * 100} y1={draftPoints[0].y * 100} x2={draftPoints.at(-1)!.x * 100} y2={draftPoints.at(-1)!.y * 100} markerEnd="url(#markup-arrowhead)" /> : null}
          </svg>
          {annotations.map((annotation, index) => (
            <button
              type="button"
              key={annotation.id}
              className={`markup-pin markup-pin-${annotation.kind} ${annotation.id === selectedId ? "is-selected" : ""}`}
              style={{ left: `${clamp(annotation.x + annotation.width) * 100}%`, top: `${clamp(annotation.y) * 100}%` }}
              onClick={(event) => { event.stopPropagation(); setSelectedId(annotation.id); setTool("select"); }}
              aria-label={`Edit markup ${index + 1}: ${categoryLabels[annotation.category]}`}
            >
              <b>{index + 1}</b><span>{annotation.text ? `${categoryLabels[annotation.category]}: ${annotation.text}` : categoryLabels[annotation.category]}</span>
            </button>
          ))}
          {selected ? (
            <section
              className="markup-editor"
              style={{ left: `${Math.min(selected.x + selected.width + 0.02, 0.72) * 100}%`, top: `${Math.min(selected.y + 0.04, 0.68) * 100}%` }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div><strong>Note {annotations.findIndex((annotation) => annotation.id === selected.id) + 1}</strong><button type="button" onClick={deleteSelected} aria-label="Delete this markup"><Trash2 size={14} /></button></div>
              <label>Change type<select value={selected.category} onChange={(event) => updateSelected({ category: event.target.value as MarkupNote["category"] })}><option value="modify_text">Modify text</option><option value="change_picture">Change picture</option><option value="general">General note</option></select></label>
              <label>Tell the D2D Digital and Marketing teams what should change<textarea autoFocus rows={4} value={selected.text} onChange={(event) => updateSelected({ text: event.target.value })} placeholder={selected.category === "modify_text" ? "Type the replacement copy or explain the edit…" : selected.category === "change_picture" ? "Describe the picture you want here…" : "Add your note about this spot…"} /></label>
              <button type="button" className="markup-done" onClick={() => { setSelectedId(null); setTool("select"); }}>Done</button>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
