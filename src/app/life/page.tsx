"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { FolderWithCounts } from "@/types";
import { Play, Square, Clock, Pencil, Trash2, Plus, Check, X } from "lucide-react";

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

// Convert a datetime-local input value to ISO string
function localInputToISO(val: string) {
  return new Date(val).toISOString();
}

// Convert ISO to datetime-local input value
function isoToLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function LiveClock({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(Date.now() - new Date(startedAt).getTime());
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - new Date(startedAt).getTime()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return <span>{formatDuration(elapsed)}</span>;
}

interface EditState {
  label: string;
  startedAt: string;
  stoppedAt: string;
}

function EntryRow({
  entry,
  onSave,
  onDelete,
}: {
  entry: LifeEntry;
  onSave: (id: string, data: Partial<EditState>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditState>({
    label: entry.label,
    startedAt: isoToLocalInput(entry.startedAt),
    stoppedAt: entry.stoppedAt ? isoToLocalInput(entry.stoppedAt) : "",
  });

  const dur = entry.stoppedAt
    ? new Date(entry.stoppedAt).getTime() - new Date(entry.startedAt).getTime()
    : null;

  async function save() {
    setSaving(true);
    await onSave(entry.id, {
      label: form.label,
      startedAt: localInputToISO(form.startedAt),
      stoppedAt: form.stoppedAt ? localInputToISO(form.stoppedAt) : undefined,
    });
    setEditing(false);
    setSaving(false);
  }

  if (editing) {
    return (
      <div
        className="rounded-lg px-4 py-3 border"
        style={{ background: "var(--white)", borderColor: "var(--orange)" }}
      >
        <div className="space-y-2">
          <input
            autoFocus
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="w-full px-2 py-1.5 rounded border text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--black)" }}
            placeholder="Label"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: "var(--gray)" }}>Start</label>
              <input
                type="datetime-local"
                value={form.startedAt}
                onChange={(e) => setForm((f) => ({ ...f, startedAt: e.target.value }))}
                className="w-full px-2 py-1.5 rounded border text-xs outline-none"
                style={{ borderColor: "var(--border)", color: "var(--black)" }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: "var(--gray)" }}>End</label>
              <input
                type="datetime-local"
                value={form.stoppedAt}
                onChange={(e) => setForm((f) => ({ ...f, stoppedAt: e.target.value }))}
                className="w-full px-2 py-1.5 rounded border text-xs outline-none"
                style={{ borderColor: "var(--border)", color: "var(--black)" }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || !form.label.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
              style={{ background: "var(--black)", color: "white" }}
            >
              <Check size={11} /> Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border"
              style={{ borderColor: "var(--border)", color: "var(--gray)" }}
            >
              <X size={11} /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3 border group"
      style={{ background: "var(--white)", borderColor: "var(--border)" }}
    >
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--black)" }}>
          {entry.label}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>
          {formatTime(entry.startedAt)}
          {entry.stoppedAt ? ` — ${formatTime(entry.stoppedAt)}` : " — ongoing"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {dur !== null && (
          <div className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--gray)" }}>
            <Clock size={11} />
            {formatDuration(dur)}
          </div>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded hover:bg-[var(--cream-dark)] transition-colors"
            style={{ color: "var(--gray)" }}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded hover:bg-[var(--cream-dark)] transition-colors"
            style={{ color: "var(--gray)" }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualEntryForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const now = isoToLocalInput(new Date().toISOString());
  const [form, setForm] = useState({ label: "", startedAt: now, stoppedAt: now });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) return;
    setSaving(true);
    await fetch("/api/life", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label.trim(),
        startedAt: localInputToISO(form.startedAt),
        stoppedAt: form.stoppedAt ? localInputToISO(form.stoppedAt) : null,
      }),
    });
    setForm({ label: "", startedAt: isoToLocalInput(new Date().toISOString()), stoppedAt: isoToLocalInput(new Date().toISOString()) });
    setOpen(false);
    setSaving(false);
    onCreated();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs font-medium transition-colors hover:opacity-70"
        style={{ color: "var(--gray)" }}
      >
        <Plus size={13} />
        Add entry manually
      </button>
    );
  }

  return (
    <form
      onSubmit={save}
      className="rounded-lg px-4 py-4 border"
      style={{ background: "var(--white)", borderColor: "var(--orange)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--gray)" }}>
        Manual Entry
      </p>
      <div className="space-y-2">
        <input
          autoFocus
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          className="w-full px-2 py-1.5 rounded border text-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--black)" }}
          placeholder="What were you doing?"
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: "var(--gray)" }}>Start</label>
            <input
              type="datetime-local"
              value={form.startedAt}
              onChange={(e) => setForm((f) => ({ ...f, startedAt: e.target.value }))}
              className="w-full px-2 py-1.5 rounded border text-xs outline-none"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: "var(--gray)" }}>End</label>
            <input
              type="datetime-local"
              value={form.stoppedAt}
              onChange={(e) => setForm((f) => ({ ...f, stoppedAt: e.target.value }))}
              className="w-full px-2 py-1.5 rounded border text-xs outline-none"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving || !form.label.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--orange)", color: "white" }}
          >
            <Check size={11} /> Save entry
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border"
            style={{ borderColor: "var(--border)", color: "var(--gray)" }}
          >
            <X size={11} /> Cancel
          </button>
        </div>
      </div>
    </form>
  );
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

  async function saveEntry(id: string, data: Partial<EditState>) {
    await fetch(`/api/life/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchEntries();
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/life/${id}`, { method: "DELETE" });
    await fetchEntries();
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
              className="rounded-xl p-5 mb-6 border"
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

          {/* Manual entry */}
          <div className="mb-8">
            <ManualEntryForm onCreated={fetchEntries} />
          </div>

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
                    {dayEntries.map((e) => (
                      <EntryRow
                        key={e.id}
                        entry={e}
                        onSave={saveEntry}
                        onDelete={deleteEntry}
                      />
                    ))}
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
