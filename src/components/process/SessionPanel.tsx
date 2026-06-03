"use client";

import { useState } from "react";
import { Plus, Play, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";
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

function getSessionTotalMs(session: ProcessSession): number {
  return session.stepRuns.reduce((acc, r) => acc + (r.durationMs ?? 0), 0);
}

function getPerPieceMs(session: ProcessSession): number | null {
  const total = getSessionTotalMs(session);
  if (!total || !session.quantity) return null;
  return Math.round(total / session.quantity);
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

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ background: "var(--cream)" }}
      >
        <div className="flex items-center gap-2">
          <Package size={15} style={{ color: "var(--orange)" }} />
          <span className="font-semibold text-sm" style={{ color: "var(--black)" }}>Sessions</span>
          {sessions.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: "var(--orange)", color: "white" }}>
              {sessions.length}
            </span>
          )}
          {activeSessionId && (
            <span className="text-xs px-2 py-0.5 rounded font-medium animate-pulse"
              style={{ background: "#DCFCE7", color: "#16A34A" }}>
              Active
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: "var(--gray)" }} /> : <ChevronDown size={14} style={{ color: "var(--gray)" }} />}
      </button>

      {expanded && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {/* Active session banner */}
          {activeSessionId && (() => {
            const active = sessions.find(s => s.id === activeSessionId);
            if (!active) return null;
            const totalMs = getSessionTotalMs(active);
            // calculate cumulative from all step runs in this session
            const allSessionRuns = steps.flatMap(s => s.runs.filter(r => r.sessionId === activeSessionId));
            const cumulativeMs = allSessionRuns.reduce((a, r) => a + (r.durationMs ?? 0), 0);
            return (
              <div className="px-5 py-3 border-b flex items-center justify-between gap-3"
                style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#16A34A" }}>
                    Active session — {active.quantity} {active.quantity === 1 ? "piece" : "pieces"}
                  </p>
                  {cumulativeMs > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: "#15803D" }}>
                      Cumulative: <span className="font-bold">{formatDuration(cumulativeMs)}</span>
                      {active.quantity > 1 && (
                        <span> · Per piece: <span className="font-bold">{formatDuration(Math.round(cumulativeMs / active.quantity))}</span></span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onSetActive(null)}
                  className="text-xs px-3 py-1.5 rounded font-semibold"
                  style={{ background: "#16A34A", color: "white" }}
                >
                  End session
                </button>
              </div>
            );
          })()}

          {/* Sessions grouped by quantity */}
          <div className="divide-y" style={{ borderColor: "var(--cream-dark)" }}>
            {Object.entries(byQuantity)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([qty, group]) => {
                const validPerPiece = group.map(getPerPieceMs).filter((v): v is number => v !== null);
                const avgPerPiece = validPerPiece.length
                  ? Math.round(validPerPiece.reduce((a, b) => a + b, 0) / validPerPiece.length)
                  : null;

                return (
                  <div key={qty} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>
                        {qty} {Number(qty) === 1 ? "piece" : "pieces"}
                        {group.length > 1 && ` · ${group.length} sessions`}
                      </p>
                      {avgPerPiece !== null && group.length > 1 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: "var(--cream-dark)", color: "var(--black)" }}>
                          Avg: {formatDuration(avgPerPiece)}/piece
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {group.map((session) => {
                        const totalMs = getSessionTotalMs(session);
                        const perPiece = getPerPieceMs(session);
                        const isActive = session.id === activeSessionId;
                        const runCount = session.stepRuns.length;

                        return (
                          <div
                            key={session.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg"
                            style={{
                              background: isActive ? "#F0FDF4" : "var(--cream)",
                              border: isActive ? "1px solid #BBF7D0" : "1px solid transparent",
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div>
                                <p className="text-xs font-medium" style={{ color: "var(--black)" }}>
                                  {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                                <p className="text-xs" style={{ color: "var(--gray)" }}>
                                  {runCount} step{runCount !== 1 ? "s" : ""} timed
                                  {totalMs > 0 && <> · Total: <span className="font-medium">{formatDuration(totalMs)}</span></>}
                                  {perPiece !== null && session.quantity > 1 && <> · <span className="font-medium">{formatDuration(perPiece)}/piece</span></>}
                                </p>
                                {session.notes && <p className="text-xs italic mt-0.5" style={{ color: "var(--gray)" }}>{session.notes}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {!isActive ? (
                                <button
                                  onClick={() => onSetActive(session.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                                  style={{ background: "var(--black)", color: "white" }}
                                >
                                  <Play size={10} />
                                  Resume
                                </button>
                              ) : (
                                <span className="text-xs font-medium px-2 py-1 rounded"
                                  style={{ background: "#DCFCE7", color: "#16A34A" }}>
                                  Active
                                </span>
                              )}
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="p-1.5 rounded hover:bg-[var(--cream-dark)]"
                                style={{ color: "var(--gray)" }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {sessions.length === 0 && (
              <div className="px-5 py-6 text-center">
                <p className="text-sm" style={{ color: "var(--gray)" }}>
                  No sessions yet. Start one to begin tracking production runs.
                </p>
              </div>
            )}
          </div>

          {/* New session form */}
          <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
            {showNew ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--black)" }}>
                    How many pieces are you making?
                  </label>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded border text-sm outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--black)" }}
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--black)" }}>
                    Notes <span className="font-normal" style={{ color: "var(--gray)" }}>(optional)</span>
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded border text-sm outline-none"
                    style={{ borderColor: "var(--border)", color: "var(--black)" }}
                    placeholder="e.g. First batch with new material"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNew(false)}
                    className="px-3 py-2 rounded border text-sm"
                    style={{ borderColor: "var(--border)", color: "var(--gray)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2 rounded text-sm font-semibold disabled:opacity-60"
                    style={{ background: "var(--orange)", color: "white" }}
                  >
                    {creating ? "Starting…" : "Start session"}
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
