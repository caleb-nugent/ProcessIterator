"use client";

import { useState, useRef } from "react";
import {
  GripVertical, Pencil, Trash2, Check, X,
  ImagePlus, Loader2, ZoomIn, ChevronDown,
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
    const res = await fetch(`/api/steps/${step.id}/images`, { method: "POST", body: formData });
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

  return (
    <>
      <div
        className="rounded-xl border overflow-hidden transition-shadow"
        style={{
          background: "white",
          borderColor: expanded ? "var(--orange)" : "var(--border)",
          boxShadow: expanded ? "0 4px 24px rgba(232,67,26,0.08)" : "none",
        }}
      >
        {/* Collapsed header — clicking anywhere opens it */}
        <button
          className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
          style={{ background: expanded ? "var(--cream)" : "white" }}
          onClick={() => !editing && setExpanded(!expanded)}
        >
          {canEdit && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing shrink-0"
              style={{ color: "var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={16} />
            </div>
          )}

          <div
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--orange)", color: "white" }}
          >
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base leading-snug" style={{ color: "var(--black)" }}>
              {step.title}
            </p>
            {!expanded && step.description && (
              <p className="text-sm mt-0.5 truncate" style={{ color: "var(--gray)" }}>
                {step.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {canEdit && !editing && (
              <>
                <button
                  onClick={() => { setEditing(true); setExpanded(true); }}
                  className="p-1.5 rounded hover:bg-[var(--cream-dark)] transition-colors"
                  style={{ color: "var(--gray)" }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded hover:bg-[var(--cream-dark)] transition-colors"
                  style={{ color: "var(--gray)" }}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <ChevronDown
              size={16}
              className="transition-transform ml-1"
              style={{
                color: "var(--gray)",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t" style={{ borderColor: "var(--cream-dark)" }}>
            {/* Description — the main content */}
            <div className="px-6 py-5">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--gray)" }}>
                      Step title
                    </label>
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded border text-base font-semibold outline-none"
                      style={{ borderColor: "var(--orange)", color: "var(--black)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--gray)" }}>
                      Instructions
                    </label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2.5 rounded border text-sm outline-none resize-none leading-relaxed"
                      style={{ borderColor: "var(--border)", color: "var(--black)" }}
                      placeholder="Write the full instructions for this step…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold disabled:opacity-60"
                      style={{ background: "var(--black)", color: "white" }}
                    >
                      <Check size={13} /> Save
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditTitle(step.title); setEditDesc(step.description ?? ""); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded text-sm border"
                      style={{ borderColor: "var(--border)", color: "var(--gray)" }}
                    >
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : step.description ? (
                <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: "var(--black)" }}>
                  {step.description}
                </p>
              ) : canEdit ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm italic border-2 border-dashed w-full py-6 rounded-lg transition-colors hover:border-[var(--orange)] hover:text-[var(--orange)]"
                  style={{ borderColor: "var(--border)", color: "var(--gray)" }}
                >
                  + Add instructions for this step
                </button>
              ) : (
                <p className="text-sm italic" style={{ color: "var(--gray)" }}>No instructions added yet.</p>
              )}
            </div>

            {/* Photos */}
            <div className="px-6 pb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>
                  Photos {step.images.length > 0 && `(${step.images.length})`}
                </p>
                {canEdit && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors disabled:opacity-60"
                      style={{ borderColor: "var(--border)", color: "var(--gray)" }}
                    >
                      {uploading ? <Loader2 size={11} className="animate-spin" /> : <ImagePlus size={11} />}
                      {uploading ? "Uploading…" : "Add photo"}
                    </button>
                  </>
                )}
              </div>

              {step.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {step.images.map((img) => (
                    <div key={img.id} className="group relative rounded-lg overflow-hidden aspect-square"
                      style={{ background: "var(--cream-dark)" }}>
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5"
                        style={{ background: "rgba(0,0,0,0.45)" }}>
                        <button onClick={() => setLightbox(img)} className="p-2 rounded-lg" style={{ background: "white", color: "var(--black)" }}>
                          <ZoomIn size={13} />
                        </button>
                        {canEdit && (
                          <button onClick={() => handleImageDelete(img.id)} className="p-2 rounded-lg" style={{ background: "white", color: "#DC2626" }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-14 flex items-center justify-center rounded-lg border-2 border-dashed text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--gray)" }}>
                  No photos yet
                </div>
              )}
            </div>

            {/* Timing */}
            <div className="px-6 pb-6 border-t pt-5" style={{ borderColor: "var(--cream-dark)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--gray)" }}>Timing</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.name} className="rounded-xl max-h-[85vh] object-contain" />
            <div className="absolute top-3 right-3 flex gap-2">
              {canEdit && (
                <button onClick={() => handleImageDelete(lightbox.id)}
                  className="p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={() => setLightbox(null)}
                className="p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{lightbox.name}</p>
          </div>
        </div>
      )}
    </>
  );
}
