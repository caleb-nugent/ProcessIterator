"use client";

import { useState } from "react";
import { GripVertical, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from "lucide-react";
import { StepWithRuns, StepRun } from "@/types";
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
      onUpdated(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete step "${step.title}"?`)) return;
    await fetch(`/api/steps/${step.id}`, { method: "DELETE" });
    onDeleted(step.id);
  }

  function handleRunAdded(run: StepRun) {
    onUpdated({ ...step, runs: [run, ...step.runs] });
  }

  function handleRunDeleted(runId: string) {
    onUpdated({ ...step, runs: step.runs.filter((r) => r.id !== runId) });
  }

  const latestRun = step.runs[0];

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ background: "white", borderColor: "var(--border)" }}
    >
      <div className="flex items-start gap-3 p-4">
        {canEdit && (
          <div
            {...dragHandleProps}
            className="mt-0.5 cursor-grab active:cursor-grabbing shrink-0"
            style={{ color: "var(--border)" }}
          >
            <GripVertical size={16} />
          </div>
        )}

        <div
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
          style={{ background: "var(--orange)", color: "white" }}
        >
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
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold"
                  style={{ background: "var(--black)", color: "white" }}
                >
                  <Check size={11} /> Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditTitle(step.title); setEditDesc(step.description ?? ""); }}
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs border"
                  style={{ borderColor: "var(--border)", color: "var(--gray)" }}
                >
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--black)" }}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>{step.description}</p>
              )}
              {latestRun?.durationMs != null && (
                <p className="text-xs mt-1" style={{ color: "var(--gray)" }}>
                  Last: <span className="font-medium" style={{ color: "var(--black)" }}>
                    {latestRun.durationMs < 60000
                      ? `${Math.round(latestRun.durationMs / 1000)}s`
                      : `${Math.round(latestRun.durationMs / 60000)}m`}
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
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded transition-colors hover:bg-[var(--cream)]"
                style={{ color: "var(--gray)" }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded transition-colors hover:bg-[var(--cream)]"
                style={{ color: "var(--gray)" }}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded transition-colors hover:bg-[var(--cream)]"
            style={{ color: "var(--gray)" }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: "var(--cream-dark)" }}>
          <div className="pt-3">
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
  );
}
