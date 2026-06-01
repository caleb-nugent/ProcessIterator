"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ background: "var(--orange)" }}>
              <span className="text-white font-bold text-sm">PI</span>
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--black)" }}>ProcessIterator</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--black)" }}>Create account</h1>
          <p style={{ color: "var(--gray)" }}>Start building better SOPs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm rounded" style={{ background: "#FEE2E2", color: "#DC2626" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded border text-sm outline-none"
              style={{ background: "white", borderColor: "var(--border)", color: "var(--black)" }}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded border text-sm outline-none"
              style={{ background: "white", borderColor: "var(--border)", color: "var(--black)" }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded border text-sm outline-none"
              style={{ background: "white", borderColor: "var(--border)", color: "var(--black)" }}
              placeholder="Min. 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ background: "var(--black)", color: "white" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center" style={{ color: "var(--gray)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--orange)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
