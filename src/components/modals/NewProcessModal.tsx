"use client";

import { useState } from "react";
import { X, Sparkles, PenLine, Loader2 } from "lucide-react";
import { FolderWithCounts, ProcessWithCounts } from "@/types";

interface Props {
  folders: FolderWithCounts[];
  defaultFolderId?: string | null;
  onClose: () => void;
  onCreated: (process: ProcessWithCounts) => void;
}

type Mode = "choose" | "manual" | "ai";

export function NewProcessModal({ folders, defaultFolderId, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedSteps, setGeneratedSteps] = useState<{ title: string; description: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setAiError("");

    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: aiPrompt }),
    });

    const data = await res.json();

    if (!res.ok) {
      setAiError(data.error ?? "Generation failed");
    } else {
      setGeneratedSteps(data.steps);
      if (!title) setTitle(aiPrompt.length > 60 ? aiPrompt.slice(0, 60) + "…" : aiPrompt);
    }
    setGenerating(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");

    const steps = mode === "ai" && generatedSteps.length > 0 ? generatedSteps : undefined;

    const res = await fetch("/api/processes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        folderId: folderId || null,
        steps,
      }),
    });

    if (res.ok) {
      const process = await res.json();
      onCreated(process);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create process");
      setLoading(false);
    }
  }

  if (mode === "choose") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="w-full max-w-md rounded-lg shadow-xl p-6" style={{ background: "white" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-xl" style={{ color: "var(--black)" }}>New Process</h2>
            <button onClick={onClose} style={{ color: "var(--gray)" }}><X size={18} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode("manual")}
              className="flex flex-col items-start gap-3 p-5 rounded-lg border-2 text-left transition-all hover:border-[var(--black)]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "var(--cream)" }}>
                <PenLine size={20} style={{ color: "var(--black)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--black)" }}>Manual</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>Build your process step by step</p>
              </div>
            </button>

            <button
              onClick={() => setMode("ai")}
              className="flex flex-col items-start gap-3 p-5 rounded-lg border-2 text-left transition-all hover:border-[var(--orange)]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "var(--cream)" }}>
                <Sparkles size={20} style={{ color: "var(--orange)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--black)" }}>AI Outline</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>Describe it, AI drafts the steps</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-lg rounded-lg shadow-xl" style={{ background: "white" }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            {mode === "ai" ? <Sparkles size={16} style={{ color: "var(--orange)" }} /> : <PenLine size={16} />}
            <h2 className="font-bold text-lg" style={{ color: "var(--black)" }}>
              {mode === "ai" ? "AI-Generated Process" : "New Process"}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: "var(--gray)" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <p className="text-sm p-3 rounded" style={{ background: "#FEE2E2", color: "#DC2626" }}>{error}</p>}

          {mode === "ai" && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>
                Describe your process
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded border text-sm outline-none resize-none"
                style={{ borderColor: "var(--border)", color: "var(--black)" }}
                placeholder="e.g. Onboarding a new client from signed contract to kickoff call"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !aiPrompt.trim()}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold disabled:opacity-60 transition-colors"
                style={{ background: "var(--orange)", color: "white" }}
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generating ? "Generating…" : "Generate steps"}
              </button>
              {aiError && <p className="text-xs mt-2" style={{ color: "#DC2626" }}>{aiError}</p>}

              {generatedSteps.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>
                    Generated Steps ({generatedSteps.length})
                  </p>
                  {generatedSteps.map((s, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded" style={{ background: "var(--cream)" }}>
                      <span className="text-xs font-bold mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--orange)", color: "white" }}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--black)" }}>{s.title}</p>
                        {s.description && <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>{s.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>
              Process title <span style={{ color: "var(--orange)" }}>*</span>
            </label>
            <input
              autoFocus={mode === "manual"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded border text-sm outline-none"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
              placeholder="e.g. Client Onboarding SOP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>
              Description <span className="font-normal" style={{ color: "var(--gray)" }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded border text-sm outline-none resize-none"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
              placeholder="What is this process for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>Folder</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2.5 rounded border text-sm outline-none"
              style={{ borderColor: "var(--border)", color: "var(--black)", background: "white" }}
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="px-4 py-2.5 rounded border text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--gray)" }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2.5 rounded text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--black)", color: "white" }}
            >
              {loading ? "Creating…" : "Create process"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
