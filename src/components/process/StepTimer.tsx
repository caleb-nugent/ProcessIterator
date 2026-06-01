"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, Clock, Check } from "lucide-react";
import { StepRun } from "@/types";

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) {
    const m = Math.floor(ms / 60000);
    const s = Math.round((ms % 60000) / 1000);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function parseDurationInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  let total = 0;
  const parts = trimmed.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins?|minutes?|s|sec|secs?|seconds?)?/g);
  if (!parts) {
    const n = parseFloat(trimmed);
    if (!isNaN(n)) return Math.round(n * 60000);
    return null;
  }

  for (const part of parts) {
    const m = part.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins?|minutes?|s|sec|secs?|seconds?)?/);
    if (!m) continue;
    const val = parseFloat(m[1]);
    const unit = (m[2] ?? "m").charAt(0);
    if (unit === "h") total += val * 3600000;
    else if (unit === "s") total += val * 1000;
    else total += val * 60000;
  }
  return total > 0 ? Math.round(total) : null;
}

interface Props {
  stepId: string;
  runs: StepRun[];
  onRunAdded: (run: StepRun) => void;
  onRunDeleted: (runId: string) => void;
}

export function StepTimer({ stepId, runs, onRunAdded, onRunDeleted }: Props) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [notes, setNotes] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - (startedAt ?? Date.now()));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, startedAt]);

  function startTimer() {
    const now = Date.now();
    setStartedAt(now);
    setElapsed(0);
    setRunning(true);
  }

  async function stopTimer() {
    setRunning(false);
    const duration = elapsed;
    setElapsed(0);
    await saveRun(duration);
  }

  async function saveManual(e: React.FormEvent) {
    e.preventDefault();
    const duration = parseDurationInput(manualInput);
    await saveRun(duration);
    setManualInput("");
    setNotes("");
    setShowManual(false);
  }

  async function saveRun(durationMs: number | null) {
    setSaving(true);
    const res = await fetch(`/api/steps/${stepId}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMs, notes: notes.trim() || null }),
    });
    if (res.ok) {
      const run = await res.json();
      onRunAdded(run);
      setNotes("");
    }
    setSaving(false);
  }

  async function deleteRun(runId: string) {
    await fetch(`/api/steps/${stepId}/runs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId }),
    });
    onRunDeleted(runId);
  }

  const avgMs =
    runs.length > 0 && runs.some((r) => r.durationMs != null)
      ? Math.round(
          runs.filter((r) => r.durationMs != null).reduce((a, r) => a + r.durationMs!, 0) /
            runs.filter((r) => r.durationMs != null).length
        )
      : null;

  return (
    <div className="space-y-3">
      {/* Timer controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {!running ? (
          <button
            onClick={startTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
            style={{ background: "var(--orange)", color: "white" }}
          >
            <Play size={11} />
            Start timer
          </button>
        ) : (
          <button
            onClick={stopTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold animate-pulse"
            style={{ background: "#DC2626", color: "white" }}
          >
            <Square size={11} />
            Stop — {formatDuration(elapsed)}
          </button>
        )}

        <button
          onClick={() => setShowManual(!showManual)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--gray)" }}
        >
          <Clock size={11} />
          Log manually
        </button>

        {avgMs !== null && (
          <span className="text-xs" style={{ color: "var(--gray)" }}>
            Avg: <span className="font-semibold" style={{ color: "var(--black)" }}>{formatDuration(avgMs)}</span>
          </span>
        )}
      </div>

      {/* Live timer note */}
      {running && (
        <div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 rounded border text-xs outline-none"
            style={{ borderColor: "var(--border)", color: "var(--black)" }}
            placeholder="Notes for this run (optional)"
          />
        </div>
      )}

      {/* Manual entry */}
      {showManual && !running && (
        <form onSubmit={saveManual} className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full px-3 py-1.5 rounded border text-xs outline-none"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
              placeholder='Duration: "45m", "1h 30m", "90s"'
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded border text-xs outline-none"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
              placeholder="Notes (optional)"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-60"
            style={{ background: "var(--black)", color: "white" }}
          >
            <Check size={12} />
          </button>
        </form>
      )}

      {/* Run history */}
      {runs.length > 0 && (
        <div className="space-y-1">
          {runs.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs"
              style={{ background: "var(--cream-dark)" }}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold" style={{ color: "var(--black)" }}>
                  {run.durationMs != null ? formatDuration(run.durationMs) : "—"}
                </span>
                {run.notes && <span style={{ color: "var(--gray)" }}>{run.notes}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--gray)" }}>
                  {new Date(run.completedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => deleteRun(run.id)}
                  className="opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: "var(--gray)" }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
