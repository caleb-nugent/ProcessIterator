"use client";

import { useState } from "react";
import { Plus, Check, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";
import { ProcessSession, StepWithRuns } from "@/types";
import { formatDuration } from "./StepTimer";

interface Props {
  processId: string;
  sessions: ProcessSession[];
  steps: StepWithRuns[];
  activeSessionId: string | null;
  onSessionCreated: (s: ProcessSession) => void;
  onSessionDeleted: (id: string) => void;
  onSetActive: (id: string | null) => void;
}

function getSessionTotalMs(session: ProcessSession, steps?: StepWithRuns[]): number {
  // Use live step run data if available (more up to date than session.stepRuns)
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

export function SessionPanel({
  processId, sessions, steps, activeSessionId,
  onSessionCreated, onSessionDeleted, onSetActive,
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

  // Group sessions by quantity for averaging
  const byQuantity = sessions.reduce<Record<number, ProcessSession[]>>((acc, s) => {
    const q = s.quantity;
    if (!acc[q]) acc[q] = [];
    acc[q].push(s);
    return acc;
  }, {});

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: activeSession ? "var(--orange)" : "var(--border)" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ background: activeSession ? "var(--cream)" : "var(--cream)" }}
      >
        <div className="flex items-center gap-2.5">
          <Package size={15} style={{ color: "var(--orange)" }} />
          <span className="font-semibold text-sm" style={{ color: "var(--black)" }}>
            {activeSession
              ? `Session — ${activeSession.quantity} ${activeSession.quantity === 1 ? "piece" : "pieces"}`
              : "Select a Session"}
          </span>
          {!activeSession && sessions.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: "var(--cream-dark)", color: "var(--gray)" }}>
              {sessions.length} available
            </span>
          )}
          {activeSession && (() => {
            const totalMs = getSessionTotalMs(activeSession, steps);
            const perPiece = getPerPieceMs(totalMs, activeSession.quantity);
            return totalMs > 0 ? (
              <span className="text-xs" style={{ color: "var(--gray)" }}>
                {formatDuration(totalMs)} total
                {perPiece && activeSession.quantity > 1 && ` · ${formatDuration(perPiece)}/piece`}
              </span>
            ) : null;
          })()}
        </div>
        <div className="flex items-center gap-2">
          {activeSession && (
            <span className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: "var(--orange)", color: "white" }}>
              Active
            </span>
          )}
          {expanded
            ? <ChevronUp size={14} style={{ color: "var(--gray)" }} />
            : <ChevronDown size={14} style={{ color: "var(--gray)" }} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {/* Session list grouped by quantity */}
          <div className="divide-y" style={{ borderColor: "var(--cream-dark)" }}>
            {Object.entries(byQuantity)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([qty, group]) => {
                const validTotals = group.map(s => getSessionTotalMs(s, steps)).filter(ms => ms > 0);
                const avgPerPiece = validTotals.length > 1
                  ? Math.round(validTotals.reduce((a, ms) => a + getPerPieceMs(ms, Number(qty))!, 0) / validTotals.length)
                  : null;

                return (
                  <div key={qty} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>
                        {qty} {Number(qty) === 1 ? "piece" : "pieces"}
                        {group.length > 1 && ` · ${group.length} sessions`}
                      </p>
                      {avgPerPiece !== null && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: "var(--cream-dark)", color: "var(--black)" }}>
                          Avg: {formatDuration(avgPerPiece)}/piece
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {group.map((session) => {
                        const totalMs = getSessionTotalMs(session, steps);
                        const perPiece = getPerPieceMs(totalMs, session.quantity);
                        const isActive = session.id === activeSessionId;

                        return (
                          <div
                            key={session.id}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                            style={{
                              background: isActive ? "#FFF7F5" : "var(--cream)",
                              border: `1px solid ${isActive ? "var(--orange)" : "transparent"}`,
                            }}
                            onClick={() => onSetActive(isActive ? null : session.id)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Selection indicator */}
                              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                                style={{
                                  borderColor: isActive ? "var(--orange)" : "var(--border)",
                                  background: isActive ? "var(--orange)" : "transparent",
                                }}>
                                {isActive && <Check size={9} color="white" strokeWidth={3} />}
                              </div>
                              <div>
                                <p className="text-xs font-medium" style={{ color: "var(--black)" }}>
                                  {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                                <p className="text-xs" style={{ color: "var(--gray)" }}>
                                  {totalMs > 0
                                    ? <>Total: <span className="font-medium">{formatDuration(totalMs)}</span>
                                        {perPiece !== null && session.quantity > 1 && <> · <span className="font-medium">{formatDuration(perPiece)}/piece</span></>}
                                      </>
                                    : "No time logged yet"}
                                </p>
                                {session.notes && <p className="text-xs italic mt-0.5" style={{ color: "var(--gray)" }}>{session.notes}</p>}
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                              className="p-1.5 rounded hover:bg-[var(--cream-dark)] shrink-0 ml-2"
                              style={{ color: "var(--gray)" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {sessions.length === 0 && !showNew && (
              <div className="px-5 py-5 text-center">
                <p className="text-sm mb-1 font-medium" style={{ color: "var(--black)" }}>No sessions yet</p>
                <p className="text-xs" style={{ color: "var(--gray)" }}>Create a session to start logging time against steps.</p>
              </div>
            )}
          </div>

          {/* New session form */}
          <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
            {showNew ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--black)" }}>
                    How many pieces are you making?
                  </label>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded border text-sm outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--black)" }}
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--black)" }}>
                    Notes <span className="font-normal" style={{ color: "var(--gray)" }}>(optional)</span>
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded border text-sm outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--black)" }}
                    placeholder="e.g. First batch with new material"
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
