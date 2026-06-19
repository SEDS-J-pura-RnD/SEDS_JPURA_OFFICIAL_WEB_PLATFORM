"use client";

import { useState, useTransition } from "react";
import { issueCertificateAction, revokeCertificateAction } from "@/lib/actions/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

interface CertificatesClientProps {
  initialCertificates: Certificate[];
}

export default function CertificatesClient({
  initialCertificates,
}: CertificatesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [formCertId, setFormCertId] = useState("");
  const [selectedCertForQr, setSelectedCertForQr] = useState<Certificate | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [type, setType] = useState("Membership");
  const [description, setDescription] = useState("");
  const [expiryDateStr, setExpiryDateStr] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredCerts = initialCertificates.filter(
    (c) =>
      c.certId.toLowerCase().includes(search.toLowerCase()) ||
      c.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      (c.recipientEmail && c.recipientEmail.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formCertId.trim() || !recipientName.trim()) {
      setError("Please fill in the Certificate ID and Recipient Name.");
      return;
    }

    const data = {
      certId: formCertId,
      recipientName,
      recipientEmail: recipientEmail || undefined,
      type,
      description: description || undefined,
      expiryDate: expiryDateStr ? new Date(expiryDateStr) : undefined,
    };

    startTransition(async () => {
      try {
        const res = await issueCertificateAction(data);
        if (res.success) {
          setSuccess("Certificate generated & cryptographic signature logged successfully!");
          setTimeout(() => {
            setModalOpen(false);
            router.refresh();
          }, 1500);
        }
      } catch (err: any) {
        setError(err.message || "Operation failed.");
      }
    });
  }

  function handleRevokeToggle(id: string, currentStatus: "VALID" | "REVOKED" | "EXPIRED") {
    const nextStatus = currentStatus === "VALID" ? "REVOKED" : "VALID";
    const actionLabel = nextStatus === "REVOKED" ? "revoke" : "re-validate";
    
    if (!confirm(`Are you sure you want to ${actionLabel} this certificate?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await revokeCertificateAction(id, nextStatus);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Failed to update certificate status.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">🏆 Certificates Desk</h1>
          <p className="page-subtitle">Generate and verify cryptographic credentials for space achievements.</p>
        </div>
        <button onClick={() => { setFormCertId(`SEDS-${new Date().getFullYear()}-${String(initialCertificates.length + 1).padStart(3, "0")}`); setRecipientName(""); setRecipientEmail(""); setType("Membership"); setDescription(""); setExpiryDateStr(""); setError(""); setSuccess(""); setModalOpen(true); }} className="btn btn-primary">
          ➕ Issue Certificate
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search certificates by ID, recipient name or email signature..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Certificates Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "1rem" }}>CERTIFICATE ID</th>
                <th style={{ padding: "1rem" }}>RECIPIENT</th>
                <th style={{ padding: "1rem" }}>CREDENTIAL TYPE</th>
                <th style={{ padding: "1rem" }}>HASH SIGNATURE</th>
                <th style={{ padding: "1rem" }}>STATUS</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: "4rem 1rem" }}>
                    No verifiable certificates match query.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>
                      {cert.certId}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{cert.recipientName}</div>
                      {cert.recipientEmail && <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{cert.recipientEmail}</div>}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8125rem" }}>
                      <div style={{ fontWeight: 600 }}>{cert.type}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>Issued: {new Date(cert.issueDate).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--color-text-dim)", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cert.hash}>
                        {cert.hash}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${cert.status === "VALID" ? "badge-aurora" : "badge-danger"}`} style={{ fontSize: "0.65rem" }}>
                        {cert.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button onClick={() => setSelectedCertForQr(cert)} className="btn btn-ghost btn-sm">
                          QR Code
                        </button>
                        <Link href={`/certificates/verify?hash=${cert.hash}`} className="btn btn-ghost btn-sm" target="_blank">
                          Verify Link
                        </Link>
                        <button onClick={() => handleRevokeToggle(cert.id, cert.status)} className="btn btn-danger btn-sm" disabled={isPending}>
                          {cert.status === "VALID" ? "Revoke" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issuance Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => !isPending && setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "500px", position: "relative", zIndex: 1, maxHeight: "95vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              🏆 Issue Verifiable Certificate
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cert-id">Certificate ID</label>
                <input
                  id="cert-id"
                  type="text"
                  className="form-input"
                  placeholder="SEDS-2025-001"
                  value={formCertId}
                  onChange={(e) => setFormCertId(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rec-name">Recipient Full Name</label>
                <input
                  id="rec-name"
                  type="text"
                  className="form-input"
                  placeholder="Arthur Dent"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rec-email">Recipient Email (Optional)</label>
                <input
                  id="rec-email"
                  type="email"
                  className="form-input"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="cert-type">Credential Type</label>
                  <select
                    id="cert-type"
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={isPending}
                  >
                    <option value="Membership">Membership</option>
                    <option value="Event Participation">Event Participation</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Research Contribution">Research Contribution</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cert-expiry">Expiry Date</label>
                  <input
                    id="cert-expiry"
                    type="date"
                    className="form-input"
                    value={expiryDateStr}
                    onChange={(e) => setExpiryDateStr(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cert-desc">Description / Note</label>
                <textarea
                  id="cert-desc"
                  className="form-input"
                  placeholder="Specific contribution details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  style={{ minHeight: "80px", resize: "vertical" }}
                />
              </div>

              {error && (
                <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.8125rem" }}>
                  ❌ {error}
                </div>
              )}

              {success && (
                <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "#6ee7b7", fontSize: "0.8125rem" }}>
                  ✔️ {success}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Signing Hash..." : "Generate Certificate"}
                </button>
              </div>
            </form>
          </div>
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
              Secure Verification QR
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Hashed anti-bruteforce verification key for <strong>{selectedCertForQr.certId}</strong>
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
                <span style={{ color: "var(--color-text-dim)" }}>Recipient:</span>
                <span style={{ fontWeight: 600 }}>{selectedCertForQr.recipientName}</span>
              </div>
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
