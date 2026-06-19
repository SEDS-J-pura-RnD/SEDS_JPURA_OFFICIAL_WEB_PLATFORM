"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function VerificationForm() {
  const searchParams = useSearchParams();
  const hashParam = searchParams.get("hash");

  const [result, setResult] = useState<null | { valid: boolean; data?: Record<string, unknown>; message?: string }>(null);
  const [loading, setLoading] = useState(false);

  // Auto-verify if hash is present in search parameters
  useEffect(() => {
    const targetHash = hashParam || "";

    if (targetHash.trim()) {
      triggerVerification(targetHash);
    } else {
      setResult(null);
    }
  }, [hashParam]);

  async function triggerVerification(hash: string) {
    setLoading(true);
    setResult(null);
    try {
      const url = `/api/certificates/verify?hash=${encodeURIComponent(hash.trim())}`;
      const res = await fetch(url);
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
            <div className="section-tag">🏆 CERTIFICATE AUTHENTICATION</div>
            <h1 className="section-title">
              Verifiable <span className="text-gradient">Credentials</span>
            </h1>
            <p className="section-desc">
              Authenticating SEDS J&apos;pura certificates via secure, hash-linked cryptographic signatures.
            </p>
          </div>

          <div className="card" style={{ maxWidth: "500px", margin: "0 auto" }}>
            {loading && (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <span className="spinner" style={{ width: 24, height: 24, margin: "0 auto 1rem" }} />
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Verifying cryptographic signature...</p>
              </div>
            )}

            {!loading && !hashParam && (
              <div style={{ textAlign: "center", padding: "1.5rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Scan QR Code to Verify
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                  To verify the authenticity of a SEDS J&apos;pura certificate, please scan the validation QR code printed directly on the credential card.
                </p>
              </div>
            )}

            {!loading && hashParam && result && (
              <div style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${result.valid ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                background: result.valid
                  ? "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.02))"
                  : "linear-gradient(135deg, rgba(239,68,68,0.05), rgba(239,68,68,0.02))",
                boxShadow: result.valid ? "0 4px 20px rgba(16,185,129,0.05)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: result.valid && result.data ? "1.5rem" : 0 }}>
                  <span style={{ fontSize: "2rem" }}>{result.valid ? "🏆" : "❌"}</span>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: result.valid ? "#6ee7b7" : "#fca5a5", margin: 0 }}>
                      {result.valid ? "Verifiable Credential Active" : "Verification Failed"}
                    </h3>
                    {result.message && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                        {result.message}
                      </div>
                    )}
                  </div>
                </div>

                {result.valid && result.data && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px",
                    gap: "1.5rem",
                    alignItems: "center"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {Object.entries(result.data as Record<string, string>).map(([key, value]) => {
                        if (key === "hash" || key === "certId") return null;
                        return (
                          <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                            <span style={{ color: "var(--color-text-dim)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>
                              {String(value)}
                            </span>
                          </div>
                        );
                      })}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: "var(--color-text-dim)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                          Certificate ID
                        </span>
                        <span style={{ fontWeight: 700, fontSize: "0.9375rem", fontFamily: "var(--font-mono)", color: "var(--color-stellar)" }}>
                          {String(result.data.certId)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{
                        padding: "0.375rem",
                        background: "#ffffff",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        width: 130,
                        height: 130,
                      }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `${typeof window !== "undefined" ? window.location.origin : ""}/certificates/verify?hash=${result.data.hash}`
                          )}&color=030712&bgcolor=ffffff&qzone=0`}
                          alt="Verification QR Code"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                      <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)", textAlign: "center" }}>
                        Secure Verification QR
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CertificateVerifyPage() {
  return (
    <Suspense fallback={
      <section style={{ padding: "5rem 0", background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)" }}>
        <div className="container-sm" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "4rem 1rem" }}>
          Loading verification tools...
        </div>
      </section>
    }>
      <VerificationForm />
    </Suspense>
  );
}
