"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: changeError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (changeError) {
        setError(changeError.message || "Failed to update password. Verify your current password is correct.");
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (isPending) {
    return (
      <div className="container" style={{ paddingBlock: "5rem", textAlign: "center" }}>
        <span className="spinner" style={{ width: 32, height: 32, margin: "auto" }} />
        <p style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>Accessing profile console...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container" style={{ paddingBlock: "5rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Unauthorized. Please sign in.</p>
        <Link href="/auth/login" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
          🚀 Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock: "3rem", maxWidth: "800px" }}>
      {/* Back Link */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ← Back to Terminal
        </Link>
      </div>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">⚙️ Profile settings</h1>
          <p className="page-subtitle">Configure your personal explorer profile and secure credentials.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* Profile Details Card */}
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>👤</span> Identity Records
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", border: "2px solid var(--color-stellar)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-space)" }}>
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "1.75rem" }}>👨‍🚀</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>{session.user.name}</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>Email: {session.user.email}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
                Commissioned on: {new Date(session.user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🔒</span> Secure Key Override
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            Authorize password updates to secure your access keys. Passwords must be at least 8 characters.
          </p>

          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.875rem" }}>
                ❌ {error}
              </div>
            )}

            {success && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "#6ee7b7", fontSize: "0.875rem" }}>
                ✔️ Credentials updated successfully! All other sessions have been revoked.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: "160px" }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }} /> Hashing keys...
                  </>
                ) : (
                  "Update Credentials"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
