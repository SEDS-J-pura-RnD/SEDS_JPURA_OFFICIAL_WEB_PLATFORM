"use client";

import { useState, useTransition } from "react";
import { toggleInquiryReadAction, deleteInquiryAction } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  ipAddress: string | null;
  createdAt: Date;
}

interface ContactClientProps {
  initialInquiries: ContactInquiry[];
}

export default function ContactClient({ initialInquiries }: ContactClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingInquiry, setViewingInquiry] = useState<ContactInquiry | null>(null);

  const filteredInquiries = initialInquiries.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.subject.toLowerCase().includes(search.toLowerCase())
  );

  function openViewModal(inquiry: ContactInquiry) {
    setViewingInquiry(inquiry);
    setModalOpen(true);
    
    // Automatically mark as read if it is currently unread
    if (!inquiry.isRead) {
      startTransition(async () => {
        try {
          const res = await toggleInquiryReadAction(inquiry.id, true);
          if (res.success) {
            router.refresh();
          }
        } catch (err) {
          console.error("Failed to update inquiry read status", err);
        }
      });
    }
  }

  async function handleToggleRead(inquiryId: string, currentRead: boolean) {
    startTransition(async () => {
      try {
        const res = await toggleInquiryReadAction(inquiryId, !currentRead);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Operation failed.");
      }
    });
  }

  async function handleDeleteInquiry(id: string) {
    if (!confirm("Are you sure you want to permanently delete this inquiry?")) return;

    startTransition(async () => {
      try {
        const res = await deleteInquiryAction(id);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete inquiry.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">✉️ Public Inquiries</h1>
          <p className="page-subtitle">Inspect public communication records, feedback, and collaboration queries.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search inquiries by sender name, email signature or subject keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Inquiries Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "1rem" }}>SENDER</th>
                <th style={{ padding: "1rem" }}>SUBJECT / THREAD</th>
                <th style={{ padding: "1rem" }}>DATE RECEIVED</th>
                <th style={{ padding: "1rem" }}>STATUS</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: "4rem 1rem" }}>
                    No communication records match search criteria.
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: inquiry.isRead ? "transparent" : "rgba(99,102,241,0.02)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{inquiry.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{inquiry.email}</div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: inquiry.isRead ? 500 : 700 }}>{inquiry.subject}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inquiry.message}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(inquiry.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${inquiry.isRead ? "badge-cosmic" : "badge-plasma"}`} style={{ fontSize: "0.65rem" }}>
                        {inquiry.isRead ? "Read" : "New"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button onClick={() => openViewModal(inquiry)} className="btn btn-ghost btn-sm">
                          Inspect
                        </button>
                        <button onClick={() => handleToggleRead(inquiry.id, inquiry.isRead)} className="btn btn-secondary btn-sm" style={{ padding: "0.25rem 0.5rem" }} disabled={isPending}>
                          {inquiry.isRead ? "Unread" : "Read"}
                        </button>
                        <button onClick={() => handleDeleteInquiry(inquiry.id)} className="btn btn-danger btn-sm" style={{ padding: "0.25rem 0.5rem" }} disabled={isPending}>
                          🗑️
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

      {/* Inquiry View Modal */}
      {modalOpen && viewingInquiry && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "500px", position: "relative", zIndex: 1, boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              ✉️ Public Communication Record
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Received: {new Date(viewingInquiry.createdAt).toLocaleString()}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", display: "block" }}>SENDER</span>
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{viewingInquiry.name}</span> · <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{viewingInquiry.email}</span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", display: "block" }}>SUBJECT</span>
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{viewingInquiry.subject}</span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", display: "block" }}>TRANSMISSION MESSAGE</span>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text)", whiteSpace: "pre-wrap", marginTop: "0.25rem", lineHeight: "1.5" }}>
                  {viewingInquiry.message}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setModalOpen(false)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
