"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Share2,
  Pencil,
  Check,
  X,
  Trash2,
  Folder,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { ProcessDetail, ProcessSession, StepWithRuns } from "@/types";
import { StepItem } from "@/components/process/StepItem";
import { ShareModal } from "@/components/modals/ShareModal";
import { SessionPanel } from "@/components/process/SessionPanel";

export default function ProcessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [addingStep, setAddingStep] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/processes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProcess(data);
        setTitleInput(data.title);
        setDescInput(data.description ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, status]);

  const userId = (session?.user as { id?: string })?.id;
  const isOwner = process?.userId === userId || !process;
  const canEdit =
    isOwner ||
    process?.shares.some((s) => s.user.id === userId && s.permission === "edit");

  async function saveTitle() {
    if (!titleInput.trim() || !process) return;
    const res = await fetch(`/api/processes/${process.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleInput.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProcess((p) => p ? { ...p, title: updated.title } : p);
    }
    setEditingTitle(false);
  }

  async function saveDesc() {
    if (!process) return;
    const res = await fetch(`/api/processes/${process.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: descInput.trim() || null }),
    });
    if (res.ok) {
      setProcess((p) => p ? { ...p, description: descInput.trim() || null } : p);
    }
    setEditingDesc(false);
  }

  async function addStep(e: React.FormEvent) {
    e.preventDefault();
    if (!newStepTitle.trim() || !process) return;
    setAddingStep(true);

    const res = await fetch(`/api/processes/${process.id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newStepTitle.trim() }),
    });

    if (res.ok) {
      const step = await res.json();
      setProcess((p) => p ? { ...p, steps: [...p.steps, step] } : p);
      setNewStepTitle("");
      setShowAddStep(false);
    }
    setAddingStep(false);
  }

  async function deleteProcess() {
    if (!process || !confirm(`Delete "${process.title}"? This cannot be undone.`)) return;
    await fetch(`/api/processes/${process.id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  function handleStepUpdated(updated: StepWithRuns) {
    setProcess((p) => p ? { ...p, steps: p.steps.map((s) => s.id === updated.id ? updated : s) } : p);
  }

  function handleStepDeleted(stepId: string) {
    setProcess((p) => p ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) } : p);
  }

  function handleSessionCreated(session: ProcessSession) {
    setProcess((p) => p ? { ...p, sessions: [session, ...p.sessions] } : p);
  }

  function handleSessionDeleted(sessionId: string) {
    setProcess((p) => p ? { ...p, sessions: p.sessions.filter((s) => s.id !== sessionId) } : p);
  }

  const totalRuns = process?.steps.reduce((acc, s) => acc + s.runs.length, 0) ?? 0;
  const totalAvgMs = process?.steps.reduce((acc, s) => {
    const runsWithDuration = s.runs.filter((r) => r.durationMs != null);
    if (!runsWithDuration.length) return acc;
    return acc + runsWithDuration.reduce((a, r) => a + r.durationMs!, 0) / runsWithDuration.length;
  }, 0) ?? 0;

  function formatDuration(ms: number) {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--orange)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="text-center">
          <p className="font-semibold mb-2" style={{ color: "var(--black)" }}>Process not found</p>
          <Link href="/dashboard" className="text-sm" style={{ color: "var(--orange)" }}>Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b" style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--gray)" }}
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-sm font-medium transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--gray)" }}
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            {isOwner && (
              <button
                onClick={deleteProcess}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-sm font-medium transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--gray)" }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Process header */}
        <div className="mb-8">
          {process.folder && (
            <div className="flex items-center gap-1.5 mb-3">
              <Folder size={13} style={{ color: process.folder.color }} />
              <span className="text-sm" style={{ color: "var(--gray)" }}>{process.folder.name}</span>
            </div>
          )}

          {editingTitle ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                className="flex-1 text-xl md:text-2xl font-bold px-2 py-1 rounded border outline-none"
                style={{ borderColor: "var(--orange)", color: "var(--black)" }}
              />
              <button onClick={saveTitle} className="p-1.5 rounded" style={{ background: "var(--black)", color: "white" }}>
                <Check size={14} />
              </button>
              <button onClick={() => setEditingTitle(false)} className="p-1.5 rounded" style={{ color: "var(--gray)" }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 group mb-2">
              <h1 className="text-xl md:text-2xl font-bold leading-tight" style={{ color: "var(--black)" }}>{process.title}</h1>
              {canEdit && (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="mt-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--gray)" }}
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          )}

          {editingDesc ? (
            <div className="flex gap-2">
              <textarea
                autoFocus
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                rows={2}
                className="flex-1 px-2 py-1.5 rounded border text-sm outline-none resize-none"
                style={{ borderColor: "var(--border)", color: "var(--gray)" }}
                placeholder="Add a description…"
              />
              <div className="flex flex-col gap-1">
                <button onClick={saveDesc} className="p-1.5 rounded" style={{ background: "var(--black)", color: "white" }}>
                  <Check size={12} />
                </button>
                <button onClick={() => setEditingDesc(false)} className="p-1.5 rounded" style={{ color: "var(--gray)" }}>
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 group">
              {process.description ? (
                <p className="text-sm" style={{ color: "var(--gray)" }}>{process.description}</p>
              ) : canEdit ? (
                <button
                  onClick={() => setEditingDesc(true)}
                  className="text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--gray)" }}
                >
                  + Add description
                </button>
              ) : null}
              {canEdit && process.description && (
                <button
                  onClick={() => setEditingDesc(true)}
                  className="mt-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--gray)" }}
                >
                  <Pencil size={11} />
                </button>
              )}
            </div>
          )}

          {/* Stats bar */}
          {(process.steps.length > 0 || totalRuns > 0) && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold" style={{ color: "var(--black)" }}>{process.steps.length}</span>
                <span className="text-sm" style={{ color: "var(--gray)" }}>steps</span>
              </div>
              <div className="w-px h-5" style={{ background: "var(--border)" }} />
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold" style={{ color: "var(--black)" }}>{totalRuns}</span>
                <span className="text-sm" style={{ color: "var(--gray)" }}>total runs</span>
              </div>
              {totalAvgMs > 0 && (
                <>
                  <div className="w-px h-5" style={{ background: "var(--border)" }} />
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} style={{ color: "var(--orange)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--black)" }}>
                      ~{formatDuration(totalAvgMs)}
                    </span>
                    <span className="text-sm" style={{ color: "var(--gray)" }}>avg total</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>
              Steps
            </h2>
            {canEdit && (
              <button
                onClick={() => setShowAddStep(true)}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: "var(--orange)" }}
              >
                <Plus size={14} />
                Add step
              </button>
            )}
          </div>

          {process.steps.map((step, i) => (
            <StepItem
              key={step.id}
              step={step}
              index={i}
              canEdit={canEdit ?? false}
              activeSessionId={activeSessionId}
              onUpdated={handleStepUpdated}
              onDeleted={handleStepDeleted}
            />
          ))}

          {process.steps.length === 0 && (
            <div
              className="text-center py-12 rounded-xl border-2 border-dashed"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="text-sm mb-3" style={{ color: "var(--gray)" }}>No steps yet. Add your first step to build this SOP.</p>
              {canEdit && (
                <button
                  onClick={() => setShowAddStep(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold mx-auto"
                  style={{ background: "var(--orange)", color: "white" }}
                >
                  <Plus size={14} />
                  Add first step
                </button>
              )}
            </div>
          )}

          {/* Inline add step form */}
          {showAddStep && canEdit && (
            <form
              onSubmit={addStep}
              className="flex gap-2 p-4 rounded-lg border"
              style={{ background: "white", borderColor: "var(--orange)" }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ background: "var(--orange)", color: "white" }}>
                {process.steps.length + 1}
              </div>
              <input
                autoFocus
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                className="flex-1 text-sm outline-none"
                style={{ color: "var(--black)" }}
                placeholder="Step title…"
              />
              <button
                type="submit"
                disabled={addingStep || !newStepTitle.trim()}
                className="px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                style={{ background: "var(--black)", color: "white" }}
              >
                {addingStep ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddStep(false); setNewStepTitle(""); }}
                className="p-1 rounded"
                style={{ color: "var(--gray)" }}
              >
                <X size={14} />
              </button>
            </form>
          )}
        </div>

        {/* Sessions */}
        <div className="mt-6">
          <SessionPanel
            processId={process.id}
            sessions={process.sessions}
            steps={process.steps}
            activeSessionId={activeSessionId}
            onSessionCreated={handleSessionCreated}
            onSessionDeleted={handleSessionDeleted}
            onSetActive={setActiveSessionId}
          />
        </div>
      </div>

      {showShare && (
        <ShareModal
          process={process}
          onClose={() => setShowShare(false)}
          onUpdated={setProcess}
        />
      )}
    </div>
  );
}
