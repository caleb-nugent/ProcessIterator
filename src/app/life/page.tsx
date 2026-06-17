"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { FolderWithCounts } from "@/types";
import { Play, Square, Clock } from "lucide-react";

interface LifeEntry {
  id: string;
  label: string;
  startedAt: string;
  stoppedAt: string | null;
}

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function LiveClock({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(Date.now() - new Date(startedAt).getTime());
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - new Date(startedAt).getTime()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return <span>{formatDuration(elapsed)}</span>;
}

export default function LifePage() {
  const [folders, setFolders] = useState<FolderWithCounts[]>([]);
  const [entries, setEntries] = useState<LifeEntry[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const active = entries.find((e) => !e.stoppedAt) ?? null;

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/life");
    setEntries(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/folders").then((r) => r.json()).then(setFolders);
    fetchEntries();
  }, [fetchEntries]);

  async function start() {
    if (!label.trim()) return;
    setLoading(true);
    await fetch("/api/life", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });
    setLabel("");
    await fetchEntries();
    setLoading(false);
  }

  async function stop() {
    if (!active) return;
    setLoading(true);
    await fetch(`/api/life/${active.id}`, { method: "PATCH" });
    await fetchEntries();
    setLoading(false);
  }

  const completed = entries.filter((e) => e.stoppedAt);

  const grouped: Record<string, LifeEntry[]> = {};
  for (const e of completed) {
    const d = formatDate(e.startedAt);
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--cream)" }}>
      <Sidebar
        folders={folders}
        onFolderCreated={(f) => setFolders((prev) => [...prev, f])}
        totalProcesses={0}
      />

      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--black)" }}>
            Caleb&apos;s Life
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--gray)" }}>
            Track how you spend each moment.
          </p>

          {/* Active timer */}
          {active && (
            <div
              className="rounded-xl p-5 mb-6 flex items-center justify-between"
              style={{ background: "var(--orange)", color: "var(--white)" }}
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">
                  Currently doing
                </div>
                <div className="text-lg font-bold">{active.label}</div>
                <div className="text-sm opacity-90 mt-1 font-mono">
                  <LiveClock startedAt={active.startedAt} />
                </div>
              </div>
              <button
                onClick={stop}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(0,0,0,0.2)", color: "var(--white)" }}
              >
                <Square size={14} fill="currentColor" />
                Stop
              </button>
            </div>
          )}

          {/* Start new entry */}
          {!active && (
            <div
              className="rounded-xl p-5 mb-8 border"
              style={{ background: "var(--white)", borderColor: "var(--border)" }}
            >
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--gray)" }}>
                What are you doing?
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && start()}
                  placeholder="e.g. Deep work, Call with client, Lunch…"
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none border"
                  style={{
                    background: "var(--cream)",
                    borderColor: "var(--border)",
                    color: "var(--black)",
                  }}
                />
                <button
                  onClick={start}
                  disabled={loading || !label.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "var(--orange)", color: "var(--white)" }}
                >
                  <Play size={14} fill="currentColor" />
                  Start
                </button>
              </div>
            </div>
          )}

          {/* Log */}
          {Object.keys(grouped).length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--gray)" }}>
                History
              </h2>
              {Object.entries(grouped).map(([date, dayEntries]) => (
                <div key={date} className="mb-6">
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--gray)" }}>
                    {date}
                  </div>
                  <div className="flex flex-col gap-2">
                    {dayEntries.map((e) => {
                      const dur = new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime();
                      return (
                        <div
                          key={e.id}
                          className="flex items-center justify-between rounded-lg px-4 py-3 border"
                          style={{ background: "var(--white)", borderColor: "var(--border)" }}
                        >
                          <div>
                            <div className="text-sm font-medium" style={{ color: "var(--black)" }}>
                              {e.label}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>
                              {formatTime(e.startedAt)} — {formatTime(e.stoppedAt!)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--gray)" }}>
                            <Clock size={11} />
                            {formatDuration(dur)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {completed.length === 0 && !active && (
            <p className="text-sm text-center py-12" style={{ color: "var(--gray)" }}>
              Start your first timer to begin tracking.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
