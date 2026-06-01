"use client";

import { useState, useRef } from "react";
import {
  GripVertical, ChevronDown, ChevronUp, Pencil, Trash2,
  Check, X, ImagePlus, Loader2, ZoomIn,
} from "lucide-react";
import { StepWithRuns, StepRun, StepImage } from "@/types";
import { StepTimer } from "./StepTimer";

interface Props {
  step: StepWithRuns;
  index: number;
  canEdit: boolean;
  onUpdated: (step: StepWithRuns) => void;
  onDeleted: (stepId: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function StepItem({ step, index, canEdit, onUpdated, onDeleted, dragHandleProps }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(step.title);
  const [editDesc, setEditDesc] = useState(step.description ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<StepImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function saveEdit() {
    if (!editTitle.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/steps/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated({ ...updated, images: step.images });
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete step "${step.title}"?`)) return;
    await fetch(`/api/steps/${step.id}`, { method: "DELETE" });
    onDeleted(step.id);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/steps/${step.id}/images`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const image = await res.json();
      onUpdated({ ...step, images: [...step.images, image] });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImageDelete(imageId: string) {
    await fetch(`/api/steps/${step.id}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    onUpdated({ ...step, images: step.images.filter((img) => img.id !== imageId) });
    if (lightbox?.id === imageId) setLightbox(null);
  }

  function handleRunAdded(run: StepRun) {
    onUpdated({ ...step, runs: [run, ...step.runs] });
  }

  function handleRunDeleted(runId: string) {
    onUpdated({ ...step, runs: step.runs.filter((r) => r.id !== runId) });
  }

  const latestRun = step.runs[0];

  return (
    <>
      <div className="rounded-lg border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="flex items-start gap-3 p-4">
          {canEdit && (
            <div {...dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing shrink-0" style={{ color: "var(--border)" }}>
              <GripVertical size={16} />
            </div>
          )}

          <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
            style={{ background: "var(--orange)", color: "white" }}>
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-2 py-1 rounded border text-sm font-medium outline-none"
                  style={{ borderColor: "var(--orange)", color: "var(--black)" }}
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 rounded border text-xs outline-none resize-none"
                  style={{ borderColor: "var(--border)", color: "var(--gray)" }}
                  placeholder="Description (optional)"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold"
                    style={{ background: "var(--black)", color: "white" }}>
                    <Check size={11} /> Save
                  </button>
                  <button onClick={() => { setEditing(false); setEditTitle(step.title); setEditDesc(step.description ?? ""); }}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs border"
                    style={{ borderColor: "var(--border)", color: "var(--gray)" }}>
                    <X size={11} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold leading-snug" style={{ color: "var(--black)" }}>{step.title}</p>
                {step.description && <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>{step.description}</p>}

                {/* Image thumbnails in collapsed view */}
                {step.images.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {step.images.slice(0, 4).map((img) => (
                      <button key={img.id} onClick={(e) => { e.stopPropagation(); setLightbox(img); if (!expanded) setExpanded(true); }}
                        className="w-10 h-10 rounded overflow-hidden border shrink-0 hover:opacity-80 transition-opacity"
                        style={{ borderColor: "var(--border)" }}>
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {step.images.length > 4 && (
                      <div className="w-10 h-10 rounded flex items-center justify-center text-xs font-semibold"
                        style={{ background: "var(--cream-dark)", color: "var(--gray)" }}>
                        +{step.images.length - 4}
                      </div>
                    )}
                  </div>
                )}

                {latestRun?.durationMs != null && (
                  <p className="text-xs mt-1" style={{ color: "var(--gray)" }}>
                    Last: <span className="font-medium" style={{ color: "var(--black)" }}>
                      {latestRun.durationMs < 60000 ? `${Math.round(latestRun.durationMs / 1000)}s` : `${Math.round(latestRun.durationMs / 60000)}m`}
                    </span>
                    {" · "}{step.runs.length} run{step.runs.length !== 1 ? "s" : ""}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canEdit && !editing && (
              <>
                <button onClick={() => setEditing(true)}
                  className="p-1.5 rounded transition-colors hover:bg-[var(--cream)]"
                  style={{ color: "var(--gray)" }}>
                  <Pencil size={13} />
                </button>
                <button onClick={handleDelete}
                  className="p-1.5 rounded transition-colors hover:bg-[var(--cream)]"
                  style={{ color: "var(--gray)" }}>
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded transition-colors hover:bg-[var(--cream)]"
              style={{ color: "var(--gray)" }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t space-y-4" style={{ borderColor: "var(--cream-dark)" }}>
            {/* Images section */}
            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>
                  Photos {step.images.length > 0 && `(${step.images.length})`}
                </p>
                {canEdit && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-60"
                      style={{ borderColor: "var(--border)", color: "var(--gray)" }}>
                      {uploading ? <Loader2 size={11} className="animate-spin" /> : <ImagePlus size={11} />}
                      {uploading ? "Uploading…" : "Add photo"}
                    </button>
                  </>
                )}
              </div>

              {step.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {step.images.map((img) => (
                    <div key={img.id} className="group relative rounded overflow-hidden aspect-square"
                      style={{ background: "var(--cream-dark)" }}>
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                        style={{ background: "rgba(0,0,0,0.4)" }}>
                        <button onClick={() => setLightbox(img)}
                          className="p-1.5 rounded" style={{ background: "white", color: "var(--black)" }}>
                          <ZoomIn size={12} />
                        </button>
                        {canEdit && (
                          <button onClick={() => handleImageDelete(img.id)}
                            className="p-1.5 rounded" style={{ background: "white", color: "#DC2626" }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 rounded border-2 border-dashed text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--gray)" }}>
                  No photos yet
                </div>
              )}
            </div>

            {/* Timer section */}
            <div className="border-t pt-4" style={{ borderColor: "var(--cream-dark)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--gray)" }}>Timing</p>
              <StepTimer
                stepId={step.id}
                runs={step.runs}
                onRunAdded={handleRunAdded}
                onRunDeleted={handleRunDeleted}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.name} className="rounded-lg max-h-[85vh] object-contain" />
            <div className="absolute top-2 right-2 flex gap-2">
              {canEdit && (
                <button
                  onClick={() => handleImageDelete(lightbox.id)}
                  className="p-2 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setLightbox(null)}
                className="p-2 rounded-lg"
                style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 text-center text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{lightbox.name}</p>
          </div>
        </div>
      )}
    </>
  );
}
