"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
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
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--black)" }}>
            Sign in
          </h1>
          <p style={{ color: "var(--gray)" }}>Build and iterate your SOPs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm rounded" style={{ background: "#FEE2E2", color: "#DC2626" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded border text-sm outline-none transition-colors"
              style={{
                background: "white",
                borderColor: "var(--border)",
                color: "var(--black)",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--black)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded border text-sm outline-none"
              style={{
                background: "white",
                borderColor: "var(--border)",
                color: "var(--black)",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ background: "var(--black)", color: "white" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center" style={{ color: "var(--gray)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "var(--orange)" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
