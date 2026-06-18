"use client";

import { useState } from "react";
import type { Metadata } from "next";

export default function CertificateVerifyPage() {
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState<null | { valid: boolean; data?: Record<string, unknown>; message?: string }>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/certificates/verify?id=${encodeURIComponent(certId.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, message: "Verification failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <section style={{ padding: "5rem 0", background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)" }}>
        <div className="container-sm">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="section-tag">🏆 CERTIFICATE VERIFICATION</div>
            <h1 className="section-title">
              Verify a <span className="text-gradient">Certificate</span>
            </h1>
            <p className="section-desc">
              Enter the certificate ID or scan the QR code to verify the authenticity
              of a SEDS J&apos;pura certificate.
            </p>
          </div>

          <div className="card" style={{ maxWidth: "500px", margin: "0 auto" }}>
            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="certId">Certificate ID</label>
                <input
                  id="certId"
                  type="text"
                  className="form-input"
                  placeholder="e.g. SEDS-2025-001"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying...</> : "🔍 Verify Certificate"}
              </button>
            </form>

            {result && (
              <div style={{ marginTop: "1.5rem", padding: "1.25rem", borderRadius: "var(--radius-md)", border: `1px solid ${result.valid ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, background: result.valid ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: result.valid && result.data ? "1rem" : 0 }}>
                  <span style={{ fontSize: "1.5rem" }}>{result.valid ? "✅" : "❌"}</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: result.valid ? "#6ee7b7" : "#fca5a5" }}>
                      {result.valid ? "Certificate Valid" : "Certificate Invalid"}
                    </div>
                    {result.message && <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{result.message}</div>}
                  </div>
                </div>

                {result.valid && result.data && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {Object.entries(result.data as Record<string, string>).map(([key, value]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                        <span style={{ color: "var(--color-text-muted)", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span style={{ fontWeight: 600 }}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: "3rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            <p>💡 Certificate IDs are in the format <code style={{ background: "rgba(99,102,241,0.1)", padding: "0.1rem 0.375rem", borderRadius: "4px", fontFamily: "var(--font-mono)" }}>SEDS-YYYY-XXX</code></p>
          </div>
        </div>
      </section>
    </div>
  );
}
