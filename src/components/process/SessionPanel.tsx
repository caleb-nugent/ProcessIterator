"use client";

import { useState } from "react";
import { Plus, Check, Trash2, ChevronDown, ChevronUp, Package, Pencil, Minus } from "lucide-react";
import { ProcessSession, StepWithRuns } from "@/types";
import { formatDuration } from "./StepTimer";

interface Props {
  processId: string;
  sessions: ProcessSession[];
  steps: StepWithRuns[];
  activeSessionId: string | null;
  onSessionCreated: (s: ProcessSession) => void;
  onSessionUpdated: (s: ProcessSession) => void;
  onSessionDeleted: (id: string) => void;
  onSetActive: (id: string | null) => void;
}

function getSessionTotalMs(session: ProcessSession, steps?: StepWithRuns[]): number {
  if (steps) {
    return steps.flatMap(s => s.runs)
      .filter(r => r.sessionId === session.id && r.durationMs != null)
      .reduce((a, r) => a + r.durationMs!, 0);
  }
  return session.stepRuns.reduce((acc, r) => acc + (r.durationMs ?? 0), 0);
}

function getPerPieceMs(totalMs: number, quantity: number): number | null {
  if (!totalMs || !quantity) return null;
  return Math.round(totalMs / quantity);
}

function SessionRow({
  session, steps, isActive, onSelect, onDelete, onUpdate,
}: {
  session: ProcessSession;
  steps: StepWithRuns[];
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (s: ProcessSession) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(session.notes ?? "");
  const [quantityInput, setQuantityInput] = useState(session.quantity);
  const [saving, setSaving] = useState(false);

  const totalMs = getSessionTotalMs(session, steps);
  const perPiece = getPerPieceMs(totalMs, session.quantity);

  async function saveEdit() {
    setSaving(true);
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: nameInput, quantity: quantityInput }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  async function updateQuantity(newQty: number) {
    if (newQty < 1) return;
    setQuantityInput(newQty);
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
    }
  }

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        border: `1px solid ${isActive ? "var(--orange)" : "transparent"}`,
        background: isActive ? "#FFF7F5" : "var(--cream)",
      }}
    >
      {/* Row header — click to select */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
        onClick={() => !editing && onSelect()}
      >
        {/* Selection indicator */}
        <div
          className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
          style={{
            borderColor: isActive ? "var(--orange)" : "var(--border)",
            background: isActive ? "var(--orange)" : "transparent",
          }}
        >
          {isActive && <Check size={9} color="white" strokeWidth={3} />}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
              className="w-full px-2 py-0.5 rounded border text-sm outline-none"
              style={{ borderColor: "var(--orange)", color: "var(--black)" }}
              placeholder="Session name (optional)"
            />
          ) : (
            <p className="text-sm font-medium truncate" style={{ color: "var(--black)" }}>
              {session.notes
                ? session.notes
                : new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>
            {totalMs > 0
              ? <>Total: <span className="font-medium">{formatDuration(totalMs)}</span>
                  {perPiece !== null && session.quantity > 1 && <> · <span className="font-medium">{formatDuration(perPiece)}/piece</span></>}
                </>
              : "No time logged yet"}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-2.5 py-1 rounded text-xs font-semibold disabled:opacity-60"
                style={{ background: "var(--black)", color: "white" }}
              >
                {saving ? "…" : "Save"}
              </button>
              <button
                onClick={() => { setEditing(false); setNameInput(session.notes ?? ""); }}
                className="px-2.5 py-1 rounded text-xs border"
                style={{ borderColor: "var(--border)", color: "var(--gray)" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded hover:bg-[var(--cream-dark)] transition-colors"
                style={{ color: "var(--gray)" }}
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => onDelete()}
                className="p-1.5 rounded hover:bg-[var(--cream-dark)] transition-colors"
                style={{ color: "var(--gray)" }}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quantity selector — shown when active */}
      {isActive && (
        <div
          className="flex items-center gap-3 px-3 py-2.5 border-t"
          style={{ borderColor: "rgba(232,67,26,0.15)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--gray)" }}>Pieces in this run:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(quantityInput - 1)}
              disabled={quantityInput <= 1}
              className="w-6 h-6 rounded flex items-center justify-center border disabled:opacity-40 transition-colors hover:bg-[var(--cream-dark)]"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
            >
              <Minus size={11} />
            </button>
            <input
              type="number"
              min="1"
              value={quantityInput}
              onChange={(e) => setQuantityInput(Number(e.target.value))}
              onBlur={() => updateQuantity(quantityInput)}
              className="w-14 text-center px-1 py-1 rounded border text-sm font-semibold outline-none"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
            />
            <button
              onClick={() => updateQuantity(quantityInput + 1)}
              className="w-6 h-6 rounded flex items-center justify-center border transition-colors hover:bg-[var(--cream-dark)]"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
            >
              <Plus size={11} />
            </button>
          </div>
          <span className="text-xs" style={{ color: "var(--gray)" }}>
            {quantityInput === 1 ? "piece" : "pieces"}
          </span>
        </div>
      )}
    </div>
  );
}

export function SessionPanel({
  processId, sessions, steps, activeSessionId,
  onSessionCreated, onSessionUpdated, onSessionDeleted, onSetActive,
}: Props) {
  const [showNew, setShowNew] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState(true);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch(`/api/processes/${processId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: parseInt(quantity) || 1, notes }),
    });
    if (res.ok) {
      const session = await res.json();
      onSessionCreated(session);
      onSetActive(session.id);
      setShowNew(false);
      setQuantity("1");
      setNotes("");
      setExpanded(false);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session and all its timing data?")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    onSessionDeleted(id);
    if (activeSessionId === id) onSetActive(null);
  }

  const byQuantity = sessions.reduce<Record<number, ProcessSession[]>>((acc, s) => {
    const q = s.quantity;
    if (!acc[q]) acc[q] = [];
    acc[q].push(s);
    return acc;
  }, {});

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "white", borderColor: activeSession ? "var(--orange)" : "var(--border)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ background: "var(--cream)" }}
      >
        <div className="flex items-center gap-2.5">
          <Package size={15} style={{ color: "var(--orange)" }} />
          <span className="font-semibold text-sm" style={{ color: "var(--black)" }}>
            {activeSession
              ? activeSession.notes || new Date(activeSession.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : "Select a Session"}
          </span>
          {activeSession && (
            <>
              <span className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: "var(--orange)", color: "white" }}>
                {activeSession.quantity} {activeSession.quantity === 1 ? "piece" : "pieces"}
              </span>
              {(() => {
                const totalMs = getSessionTotalMs(activeSession, steps);
                return totalMs > 0 ? (
                  <span className="text-xs hidden sm:inline" style={{ color: "var(--gray)" }}>
                    {formatDuration(totalMs)} logged
                  </span>
                ) : null;
              })()}
            </>
          )}
          {!activeSession && sessions.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ background: "var(--cream-dark)", color: "var(--gray)" }}>
              {sessions.length} available
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp size={14} style={{ color: "var(--gray)" }} />
          : <ChevronDown size={14} style={{ color: "var(--gray)" }} />}
      </button>

      {expanded && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {/* Session list */}
          <div className="divide-y px-4 py-3 space-y-2" style={{ borderColor: "var(--cream-dark)" }}>
            {Object.entries(byQuantity)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([qty, group]) => {
                const validTotals = group.map(s => getSessionTotalMs(s, steps)).filter(ms => ms > 0);
                const avgPerPiece = validTotals.length > 1 && Number(qty) > 1
                  ? Math.round(validTotals.reduce((a, ms) => a + Math.round(ms / Number(qty)), 0) / validTotals.length)
                  : null;

                return (
                  <div key={qty}>
                    {(group.length > 1 || avgPerPiece) && (
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>
                          {qty} {Number(qty) === 1 ? "piece" : "pieces"}
                        </p>
                        {avgPerPiece !== null && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ background: "var(--cream-dark)", color: "var(--black)" }}>
                            Avg: {formatDuration(avgPerPiece)}/piece
                          </span>
                        )}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {group.map((session) => (
                        <SessionRow
                          key={session.id}
                          session={session}
                          steps={steps}
                          isActive={session.id === activeSessionId}
                          onSelect={() => onSetActive(session.id === activeSessionId ? null : session.id)}
                          onDelete={() => handleDelete(session.id)}
                          onUpdate={onSessionUpdated}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

            {sessions.length === 0 && !showNew && (
              <div className="py-5 text-center">
                <p className="text-sm mb-1 font-medium" style={{ color: "var(--black)" }}>No sessions yet</p>
                <p className="text-xs" style={{ color: "var(--gray)" }}>Create a session to start logging time against steps.</p>
              </div>
            )}
          </div>

          {/* New session form */}
          <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            {showNew ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--black)" }}>
                    Session name <span className="font-normal" style={{ color: "var(--gray)" }}>(optional)</span>
                  </label>
                  <input
                    autoFocus
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded border text-sm outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--black)" }}
                    placeholder="e.g. First batch with new material"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--black)" }}>
                    How many pieces?
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded border text-sm outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--black)" }}
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowNew(false)}
                    className="px-4 py-2 rounded border text-sm"
                    style={{ borderColor: "var(--border)", color: "var(--gray)" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={creating}
                    className="flex-1 py-2 rounded text-sm font-semibold disabled:opacity-60"
                    style={{ background: "var(--orange)", color: "white" }}>
                    {creating ? "Creating…" : "Create session"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded border-2 border-dashed text-sm font-medium transition-colors hover:border-[var(--orange)] hover:text-[var(--orange)]"
                style={{ borderColor: "var(--border)", color: "var(--gray)" }}
              >
                <Plus size={14} />
                New session
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
