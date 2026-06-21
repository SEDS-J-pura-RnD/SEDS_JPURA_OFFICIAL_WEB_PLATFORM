"use client";

import { useState, useTransition } from "react";
import { issueCertificateAction, revokeCertificateAction, issueBulkCertificatesAction } from "@/lib/actions/admin";
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

  // Bulk Import States
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkCerts, setBulkCerts] = useState<{
    certId?: string;
    recipientName: string;
    recipientEmail?: string;
    type: string;
    description?: string;
    expiryDate?: string;
    isValid: boolean;
    errors: string[];
  }[]>([]);
  const [bulkImportProgress, setBulkImportProgress] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<{
    success: boolean;
    createdCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  async function handleDownloadTemplate() {
    const XLSX = await import("xlsx");
    const headers = [["Certificate ID", "Recipient Name", "Recipient Email", "Credential Type", "Description", "Expiry Date"]];
    const sampleData = [
      ["SEDS-2026-001", "Arthur Dent", "arthur.dent@galaxy.com", "Membership", "Standard active annual member", ""],
      ["", "Tricia McMillan", "trillian@galaxy.com", "Achievement", "First female to launch to Orbit", "2030-12-31"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificates Template");
    XLSX.writeFile(wb, "SEDS_Bulk_Certificates_Template.xlsx");
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setBulkImportResult(null);

    const XLSX = await import("xlsx");
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });

        const parsedCerts = rawRows.map((row: any) => {
          const rowKeys = Object.keys(row);
          const certIdKey = rowKeys.find(k => k.toLowerCase().replace(/[\s_-]/g, "") === "certificateid") || "Certificate ID";
          const nameKey = rowKeys.find(k => k.toLowerCase().replace(/[\s_-]/g, "") === "recipientname") || "Recipient Name";
          const emailKey = rowKeys.find(k => k.toLowerCase().replace(/[\s_-]/g, "") === "recipientemail") || "Recipient Email";
          const typeKey = rowKeys.find(k => k.toLowerCase().replace(/[\s_-]/g, "") === "credentialtype") || "Credential Type";
          const descKey = rowKeys.find(k => k.toLowerCase() === "description") || "Description";
          const expiryKey = rowKeys.find(k => k.toLowerCase().replace(/[\s_-]/g, "") === "expirydate") || "Expiry Date";

          const certId = String(row[certIdKey] || "").trim();
          const recipientName = String(row[nameKey] || "").trim();
          const recipientEmail = String(row[emailKey] || "").trim();
          const typeRaw = String(row[typeKey] || "").trim();
          const description = String(row[descKey] || "").trim();
          const expiryRaw = String(row[expiryKey] || "").trim();

          const validTypes = ["Membership", "Event Participation", "Achievement", "Research Contribution"];
          let type = "Membership";
          const foundType = validTypes.find(t => t.toLowerCase() === typeRaw.toLowerCase());
          if (foundType) {
            type = foundType;
          } else if (typeRaw) {
            type = typeRaw;
          }

          const errors: string[] = [];
          if (!recipientName) errors.push("Recipient Name is required.");
          if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
            errors.push("Invalid recipient email signature.");
          }
          if (!validTypes.includes(type)) {
            errors.push(`Invalid Credential Type. Must be one of: ${validTypes.join(", ")}`);
          }

          let expiryDate: string | undefined = undefined;
          if (expiryRaw) {
            const parsedD = new Date(expiryRaw);
            if (isNaN(parsedD.getTime())) {
              errors.push("Invalid Expiry Date format.");
            } else {
              expiryDate = parsedD.toISOString();
            }
          }

          return {
            certId: certId || undefined,
            recipientName,
            recipientEmail: recipientEmail || undefined,
            type,
            description: description || undefined,
            expiryDate,
            isValid: errors.length === 0,
            errors,
          };
        });

        if (parsedCerts.length === 0) {
          alert("The uploaded Excel sheet contains no certificate records.");
          return;
        }

        setBulkCerts(parsedCerts);
        setBulkModalOpen(true);
        e.target.value = "";
      } catch (err: any) {
        alert("Failed to parse Excel file: " + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async function handleConfirmBulkImport() {
    const validCerts = bulkCerts.filter(c => c.isValid);
    if (validCerts.length === 0) {
      alert("No valid certificate records to issue.");
      return;
    }

    setBulkImportProgress(true);
    try {
      const res = await issueBulkCertificatesAction(
        validCerts.map(c => ({
          certId: c.certId,
          recipientName: c.recipientName,
          recipientEmail: c.recipientEmail,
          type: c.type,
          description: c.description,
          expiryDate: c.expiryDate,
        }))
      );

      setBulkImportResult({
        success: res.success,
        createdCount: res.createdCount,
        skippedCount: res.skippedCount,
        errors: res.errors,
      });

      if (res.success && res.createdCount > 0) {
        router.refresh();
      }
    } catch (err: any) {
      setBulkImportResult({
        success: false,
        createdCount: 0,
        skippedCount: 0,
        errors: [err.message || "An unexpected error occurred during bulk issuance."],
      });
    } finally {
      setBulkImportProgress(false);
    }
  }

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
        <div style={{ display: "inline-flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={handleDownloadTemplate} className="btn btn-secondary">
            📥 Download Template
          </button>
          <label className="btn btn-secondary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", margin: 0, gap: "0.25rem" }}>
            📤 Upload Excel
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleBulkUpload}
              style={{ display: "none" }}
            />
          </label>
          <button onClick={() => { setFormCertId(`SEDS-${new Date().getFullYear()}-${String(initialCertificates.length + 1).padStart(3, "0")}`); setRecipientName(""); setRecipientEmail(""); setType("Membership"); setDescription(""); setExpiryDateStr(""); setError(""); setSuccess(""); setModalOpen(true); }} className="btn btn-primary">
            ➕ Issue Certificate
          </button>
        </div>
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

      {/* Bulk Certificates Import Preview Modal */}
      {bulkModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          {/* Backdrop */}
          <div onClick={() => !bulkImportProgress && setBulkModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          {/* Content */}
          <div className="card" style={{ width: "100%", maxWidth: "850px", position: "relative", zIndex: 1, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              🏆 Bulk Certificates Issuance Preview
            </h2>

            {bulkImportResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ padding: "1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)" }}>
                  <h3 style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>✔️ Issuance Complete</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    Successfully issued <strong>{bulkImportResult.createdCount}</strong> new verifiable certificates.
                    {bulkImportResult.skippedCount > 0 && ` Skipped ${bulkImportResult.skippedCount} certificate(s) due to existing Certificate IDs or validation failures.`}
                  </p>
                </div>

                {bulkImportResult.errors.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <h4 style={{ fontSize: "0.875rem", color: "#fca5a5", fontWeight: 600 }}>System Warnings:</h4>
                    <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {bulkImportResult.errors.map((err, i) => (
                        <div key={i} style={{ fontSize: "0.75rem", color: "#fca5a5" }}>⚠️ {err}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      setBulkModalOpen(false);
                      setBulkImportResult(null);
                      router.refresh();
                    }}
                    className="btn btn-primary"
                  >
                    Finish and Refresh Registry
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Stats Summary */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "120px", padding: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>TOTAL DETECTED</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{bulkCerts.length}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: "120px", padding: "0.75rem", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6ee7b7" }}>VALID & READY</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6ee7b7" }}>{bulkCerts.filter(c => c.isValid).length}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: "120px", padding: "0.75rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#fca5a5" }}>INVALID (SKIPPED)</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fca5a5" }}>{bulkCerts.filter(c => !c.isValid).length}</div>
                  </div>
                </div>

                {/* Preview Table */}
                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border)" }}>
                          <th style={{ padding: "0.75rem" }}>CERTIFICATE ID</th>
                          <th style={{ padding: "0.75rem" }}>RECIPIENT NAME</th>
                          <th style={{ padding: "0.75rem" }}>EMAIL</th>
                          <th style={{ padding: "0.75rem" }}>CREDENTIAL TYPE</th>
                          <th style={{ padding: "0.75rem" }}>EXPIRY DATE</th>
                          <th style={{ padding: "0.75rem" }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkCerts.map((c, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", background: c.isValid ? "transparent" : "rgba(239,68,68,0.02)" }}>
                            <td style={{ padding: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>
                              {c.certId || <span style={{ color: "var(--color-stellar)", fontStyle: "italic", fontSize: "0.75rem" }}>Auto-assigned</span>}
                            </td>
                            <td style={{ padding: "0.75rem", fontWeight: 600 }}>{c.recipientName || <em style={{ color: "var(--color-text-dim)" }}>[Empty]</em>}</td>
                            <td style={{ padding: "0.75rem", color: "var(--color-text-muted)" }}>{c.recipientEmail || <span style={{ color: "var(--color-text-dim)", fontSize: "0.75rem" }}>None</span>}</td>
                            <td style={{ padding: "0.75rem" }}>{c.type}</td>
                            <td style={{ padding: "0.75rem", color: "var(--color-text-dim)" }}>
                              {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : <span style={{ color: "var(--color-text-dim)", fontSize: "0.75rem" }}>Never</span>}
                            </td>
                            <td style={{ padding: "0.75rem" }}>
                              {c.isValid ? (
                                <span className="badge badge-aurora" style={{ fontSize: "0.6rem" }}>Ready</span>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                  <span className="badge badge-danger" style={{ fontSize: "0.6rem", width: "fit-content" }}>Invalid</span>
                                  {c.errors.map((err, i) => (
                                    <span key={i} style={{ fontSize: "0.65rem", color: "#fca5a5" }}>• {err}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setBulkModalOpen(false)}
                    className="btn btn-ghost"
                    disabled={bulkImportProgress}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBulkImport}
                    className="btn btn-primary"
                    disabled={bulkImportProgress || bulkCerts.filter(c => c.isValid).length === 0}
                  >
                    {bulkImportProgress ? "Issuing Certificates..." : `Confirm Issuance (${bulkCerts.filter(c => c.isValid).length} certificates)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
