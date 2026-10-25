"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import QrScannerModal from "@/components/certificates/QrScannerModal";
import { getCertificateVerifyUrl } from "@/lib/certificate-url";

function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hashParam = searchParams.get("hash");

  const [result, setResult] = useState<null | { valid: boolean; data?: Record<string, unknown>; message?: string }>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const verifiedHashRef = useRef<string | null>(null);

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

  // Handle scanned hash from QR modal
  const handleHashDetected = (hash: string) => {
    router.push(`/certificates/verify?hash=${encodeURIComponent(hash)}`);
    triggerVerification(hash);
  };

  // Auto-verify if hash is present in search parameters
  useEffect(() => {
    const targetHash = hashParam || "";

    if (targetHash.trim()) {
      if (verifiedHashRef.current !== targetHash) {
        verifiedHashRef.current = targetHash;
        triggerVerification(targetHash);
      }
    } else {
      if (verifiedHashRef.current === null) {
        setResult(null);
      } else {
        verifiedHashRef.current = null;
      }
    }
  }, [hashParam]);

  return (
    <div>
      <section style={{ padding: "5rem 0", background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)" }}>
        <div className="container-sm">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="section-tag">🏆 CERTIFICATE AUTHENTICATION</div>
            <h1 className="section-title">
              Verifiable <span className="text-gradient">Credentials</span>
            </h1>
            <p className="section-desc">
              Authenticating SEDS J&apos;pura certificates via secure, hash-linked cryptographic signatures.
            </p>
          </div>

          <div className="card" style={{ maxWidth: "520px", margin: "0 auto", padding: "1.75rem" }}>
            {/* Quick Action Button to Open Scanner */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="btn btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1.25rem",
                  fontSize: "0.875rem",
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
                }}
              >
                <span>📷</span>
                <span>Scan Certificate QR Code</span>
              </button>
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <span className="spinner" style={{ width: 28, height: 28, margin: "0 auto 1rem" }} />
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                  Verifying cryptographic signature against immutable records...
                </p>
              </div>
            )}

            {!loading && !hashParam && (
              <div style={{ textAlign: "center", padding: "1.5rem 1rem", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "1rem" }}>
                <div style={{ fontSize: "2.25rem", marginBottom: "0.75rem" }}>🔍</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Awaiting Verification Signature
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", lineHeight: 1.6, maxWidth: "380px", margin: "0 auto" }}>
                  Click <strong>&quot;Scan Certificate QR Code&quot;</strong> above to scan using your device&apos;s camera, or upload a photo of the printed certificate QR pattern.
                </p>
              </div>
            )}

            {!loading && hashParam && result && (
              <div style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${result.valid ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                background: result.valid
                  ? "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))"
                  : "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))",
                boxShadow: result.valid ? "0 4px 24px rgba(16,185,129,0.08)" : "none",
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
                    gridTemplateColumns: "1fr 130px",
                    gap: "1.25rem",
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
                        width: 120,
                        height: 120,
                      }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            getCertificateVerifyUrl(result.data.hash as string)
                          )}&color=030712&bgcolor=ffffff&qzone=0`}
                          alt="Verification QR Code"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                      <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)", textAlign: "center" }}>
                        Official Signature QR
                      </span>
                    </div>
                  </div>
                )}

                {/* Scan another certificate */}
                <div style={{ marginTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: "0.775rem" }}
                  >
                    🔄 Scan Another Certificate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* QR Scanner Modal (Camera & Image Upload) */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onHashDetected={handleHashDetected}
      />
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
