"use client";

import { useState, useTransition } from "react";
import { createCollaboratorAction, updateCollaboratorAction, deleteCollaboratorAction } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

interface Collaborator {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  createdAt: Date;
}

interface CollaboratorsClientProps {
  initialCollaborators: Collaborator[];
}

export default function CollaboratorsClient({ initialCollaborators }: CollaboratorsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredCollaborators = initialCollaborators.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreateModal() {
    setEditingCollaborator(null);
    setName("");
    setLogoUrl("");
    setWebsite("");
    setDescription("");
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(collaborator: Collaborator) {
    setEditingCollaborator(collaborator);
    setName(collaborator.name);
    setLogoUrl(collaborator.logoUrl || "");
    setWebsite(collaborator.website || "");
    setDescription(collaborator.description || "");
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please fill out the collaborator name.");
      return;
    }

    const data = {
      name,
      logoUrl: logoUrl || undefined,
      website: website || undefined,
      description: description || undefined,
    };

    startTransition(async () => {
      try {
        if (editingCollaborator) {
          const res = await updateCollaboratorAction(editingCollaborator.id, data);
          if (res.success) {
            setSuccess("Collaborator record updated successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        } else {
          const res = await createCollaboratorAction(data);
          if (res.success) {
            setSuccess("Collaborator record established successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        }
      } catch (err: any) {
        setError(err.message || "Operation failed.");
      }
    });
  }

  async function handleDeleteCollaborator(id: string, collaboratorName: string) {
    if (!confirm(`Are you absolutely sure you want to permanently delete collaborator '${collaboratorName}'?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteCollaboratorAction(id);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete collaborator.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">🏢 Collaborators Registry</h1>
          <p className="page-subtitle">Configure space technology research institutes and academic partners.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          🏢 Add Collaborator
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search partners by institute name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Collaborators Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "1rem" }}>INSTITUTE / ORG</th>
                <th style={{ padding: "1rem" }}>WEBSITE LINK</th>
                <th style={{ padding: "1rem" }}>DESCRIPTION</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollaborators.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: "4rem 1rem" }}>
                    No collaborating institutes match query.
                  </td>
                </tr>
              ) : (
                filteredCollaborators.map((collaborator) => (
                  <tr key={collaborator.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--color-space)" }}>
                          {collaborator.logoUrl ? (
                            <img src={collaborator.logoUrl} alt={collaborator.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: "1rem" }}>🏢</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{collaborator.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--color-cosmic)" }}>
                      {collaborator.website ? (
                        <a href={collaborator.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                          {collaborator.website.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      ) : (
                        <span style={{ color: "var(--color-text-dim)" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--color-text-muted)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {collaborator.description || <span style={{ color: "var(--color-text-dim)" }}>-</span>}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button onClick={() => openEditModal(collaborator)} className="btn btn-ghost btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteCollaborator(collaborator.id, collaborator.name)} className="btn btn-danger btn-sm" disabled={isPending}>
                          Delete
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

      {/* Creation / Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => !isPending && setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "450px", position: "relative", zIndex: 1, maxHeight: "95vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {editingCollaborator ? "⚙️ Edit Collaborator Configuration" : "🏢 Add Collaborating Institute"}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="collab-name">Institute Name</label>
                <input
                  id="collab-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. SLIIT Aerospace Dept"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="collab-web">Institute Website</label>
                <input
                  id="collab-web"
                  type="url"
                  className="form-input"
                  placeholder="https://sliit.lk"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <ImageUpload
                label="Institute Logo"
                value={logoUrl}
                onChange={setLogoUrl}
                disabled={isPending}
              />

              <div className="form-group">
                <label className="form-label" htmlFor="collab-desc">Description / Partnership Note</label>
                <textarea
                  id="collab-desc"
                  className="form-input"
                  placeholder="Describe collaboration details..."
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
                  {isPending ? "Syncing..." : "Save Collaborator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
