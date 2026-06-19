"use client";

import { useState } from "react";
import Link from "next/link";

interface Certificate {
  id: string;
  certId: string;
  recipientName: string;
  recipientEmail: string | null;
  type: string;
  description: string | null;
  issueDate: Date;
  expiryDate: Date | null;
  status: "VALID" | "REVOKED" | "EXPIRED";
  hash: string;
  issuedBy: string | null;
}

interface DashboardCertificatesProps {
  certificates: Certificate[];
}

export default function DashboardCertificates({ certificates }: DashboardCertificatesProps) {
  const [selectedCertForQr, setSelectedCertForQr] = useState<Certificate | null>(null);

  return (
    <div className="card">
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏆</span> Acquired Certifications
      </h2>

      {certificates.length === 0 ? (
        <div style={{ textAlign: "center", paddingBlock: "2rem", color: "var(--color-text-muted)" }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📜</p>
          <p style={{ fontSize: "0.875rem" }}>No credentials associated with your email yet.</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>Completed mission achievements will issue a verifiable certificate here.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>CERTIFICATE ID</th>
                <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>TYPE / MISSION</th>
                <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>ISSUE DATE</th>
                <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>STATUS</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>{cert.certId}</td>
                  <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8125rem" }}>
                    <span style={{ fontWeight: 600 }}>{cert.type}</span>
                    {cert.description && <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>{cert.description}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    {new Date(cert.issueDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8125rem" }}>
                    <span className={`badge ${cert.status === "VALID" ? "badge-aurora" : "badge-danger"}`}>
                      {cert.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.375rem" }}>
                      <button onClick={() => setSelectedCertForQr(cert)} className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }}>
                        QR Code
                      </button>
                      <Link href={`/certificates/verify?hash=${cert.hash}`} className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }}>
                        Verify
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Presentation Modal */}
      {selectedCertForQr && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => setSelectedCertForQr(null)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1, boxShadow: "var(--glow-cosmic)", textAlign: "center", padding: "2rem" }}>
            <button
              onClick={() => setSelectedCertForQr(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.25rem", cursor: "pointer" }}
            >
              ✕
            </button>

            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏆</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.25rem" }}>
              Verifiable Credential QR
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Secure verification key for certificate <strong>{selectedCertForQr.certId}</strong>
            </p>

            {/* QR Code Image Container */}
            <div style={{
              margin: "0 auto 1.5rem",
              padding: "0.75rem",
              background: "#ffffff",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              width: 220,
              height: 220,
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  `${typeof window !== "undefined" ? window.location.origin : ""}/certificates/verify?hash=${selectedCertForQr.hash}`
                )}&color=030712&bgcolor=ffffff&qzone=1`}
                alt="Verification QR Code"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            {/* Info Grid */}
            <div style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
              fontSize: "0.8125rem",
              textAlign: "left",
              marginBottom: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-dim)" }}>Type:</span>
                <span style={{ fontWeight: 600 }}>{selectedCertForQr.type}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-dim)" }}>Hash Sig:</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--color-stellar)" }}>
                  {selectedCertForQr.hash.substring(0, 8)}...{selectedCertForQr.hash.substring(56)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/certificates/verify?hash=${selectedCertForQr.hash}`;
                  navigator.clipboard.writeText(url);
                  alert("Verification URL copied to clipboard!");
                }}
                className="btn btn-ghost w-full"
                style={{ fontSize: "0.875rem" }}
              >
                🔗 Copy URL
              </button>
              <button
                onClick={async () => {
                  try {
                    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                      `${window.location.origin}/certificates/verify?hash=${selectedCertForQr.hash}`
                    )}&color=030712&bgcolor=ffffff&qzone=1`;
                    const res = await fetch(url);
                    const blob = await res.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.download = `QR_${selectedCertForQr.certId}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to download QR code.");
                  }
                }}
                className="btn btn-primary w-full"
                style={{ fontSize: "0.875rem" }}
              >
                💾 Download QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
