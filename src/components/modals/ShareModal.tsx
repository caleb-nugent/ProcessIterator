"use client";

import { useState } from "react";
import { X, UserPlus, Trash2 } from "lucide-react";
import { ProcessDetail } from "@/types";

interface Props {
  process: ProcessDetail;
  onClose: () => void;
  onUpdated: (p: ProcessDetail) => void;
}

export function ShareModal({ process, onClose, onUpdated }: Props) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/processes/${process.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), permission }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to share");
    } else {
      const updated = {
        ...process,
        shares: [
          ...process.shares.filter((s) => s.user.email !== email),
          { id: data.id, permission: data.permission, user: data.user },
        ],
      };
      onUpdated(updated);
      setEmail("");
    }
    setLoading(false);
  }

  async function handleRemove(shareId: string) {
    await fetch(`/api/processes/${process.id}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId }),
    });

    onUpdated({ ...process, shares: process.shares.filter((s) => s.id !== shareId) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-lg shadow-xl" style={{ background: "white" }}>
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-lg" style={{ color: "var(--black)" }}>Share Process</h2>
          <button onClick={onClose} style={{ color: "var(--gray)" }}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <form onSubmit={handleShare} className="space-y-3">
            {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded border text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--black)" }}
                placeholder="colleague@example.com"
              />
              <div className="flex gap-2">
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded border text-sm outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--black)", background: "white" }}
                >
                  <option value="view">Can view</option>
                  <option value="edit">Can edit</option>
                </select>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded text-sm font-semibold disabled:opacity-60"
                  style={{ background: "var(--black)", color: "white" }}
                >
                  <UserPlus size={14} />
                  Share
                </button>
              </div>
            </div>
          </form>

          {process.shares.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--gray)" }}>
                Shared with
              </p>
              <div className="space-y-2">
                {process.shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 rounded" style={{ background: "var(--cream)" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--black)" }}>{share.user.name ?? share.user.email}</p>
                      <p className="text-xs" style={{ color: "var(--gray)" }}>{share.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--cream-dark)", color: "var(--gray)" }}>
                        {share.permission}
                      </span>
                      <button onClick={() => handleRemove(share.id)} style={{ color: "var(--gray)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
