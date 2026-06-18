"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await signIn.email({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password.");
      } else if (data) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
            <circle cx="16" cy="16" r="14" stroke="url(#authGrad)" strokeWidth="1.5"/>
            <ellipse cx="16" cy="16" rx="14" ry="6" stroke="url(#authGrad)" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="3" fill="url(#authGrad)"/>
            <circle cx="30" cy="16" r="2" fill="#6366f1" opacity="0.8"/>
            <defs>
              <linearGradient id="authGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#38bdf8"/>
              </linearGradient>
            </defs>
          </svg>
          <div>
            <div className="auth-logo-name">SEDS J&apos;pura</div>
            <div className="auth-logo-sub">Member Portal</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your SEDS member account</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.875rem" }}>
              ❌ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ padding: "0.75rem" }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing In...</> : "🚀 Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/" className="btn btn-ghost btn-sm">← Back to Home</Link>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          background: var(--gradient-hero);
        }

        .auth-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 70%, rgba(56,189,248,0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .auth-card {
          background: rgba(17, 24, 39, 0.9);
          border: 1px solid var(--color-border-bright);
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          backdrop-filter: blur(20px);
          box-shadow: var(--glow-cosmic), 0 24px 48px rgba(0,0,0,0.7);
          position: relative;
          z-index: 1;
          animation: slideUp var(--transition-slow) ease;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 2rem;
        }

        .auth-logo-name {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          background: var(--gradient-cosmic);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-logo-sub {
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: var(--color-text-dim);
        }

        .auth-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 0.375rem;
        }

        .auth-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
}
