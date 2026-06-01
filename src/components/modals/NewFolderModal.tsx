"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { FolderWithCounts } from "@/types";

const COLORS = ["#E8431A", "#F5C84A", "#1F4AFF", "#111111", "#10B981", "#8B5CF6"];

interface Props {
  onClose: () => void;
  onCreated: (folder: FolderWithCounts) => void;
}

export function NewFolderModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });

    if (res.ok) {
      const folder = await res.json();
      onCreated({ ...folder, children: [] });
    } else {
      setError("Failed to create folder");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-sm rounded-lg shadow-xl p-6" style={{ background: "white" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg" style={{ color: "var(--black)" }}>New Folder</h2>
          <button onClick={onClose} style={{ color: "var(--gray)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>
              Folder name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded border text-sm outline-none"
              style={{ borderColor: "var(--border)", color: "var(--black)" }}
              placeholder="e.g. Marketing, Onboarding"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--black)" }}>Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                    transform: color === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded border text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--gray)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 rounded text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--black)", color: "white" }}
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
