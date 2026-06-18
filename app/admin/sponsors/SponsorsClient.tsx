"use client";

import { useState, useTransition } from "react";
import { createSponsorAction, updateSponsorAction, deleteSponsorAction } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  tier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "PARTNER";
  description: string | null;
  isActive: boolean;
}

interface SponsorsClientProps {
  initialSponsors: Sponsor[];
}

export default function SponsorsClient({ initialSponsors }: SponsorsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [tier, setTier] = useState<"PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "PARTNER">("PARTNER");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredSponsors = initialSponsors.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreateModal() {
    setEditingSponsor(null);
    setName("");
    setLogoUrl("");
    setWebsite("");
    setTier("PARTNER");
    setDescription("");
    setIsActive(true);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(sponsor: Sponsor) {
    setEditingSponsor(sponsor);
    setName(sponsor.name);
    setLogoUrl(sponsor.logoUrl || "");
    setWebsite(sponsor.website || "");
    setTier(sponsor.tier);
    setDescription(sponsor.description || "");
    setIsActive(sponsor.isActive);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please fill out the sponsor name.");
      return;
    }

    const data = {
      name,
      logoUrl: logoUrl || undefined,
      website: website || undefined,
      tier,
      description: description || undefined,
      isActive,
    };

    startTransition(async () => {
      try {
        if (editingSponsor) {
          const res = await updateSponsorAction(editingSponsor.id, data);
          if (res.success) {
            setSuccess("Sponsor record updated successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        } else {
          const res = await createSponsorAction(data);
          if (res.success) {
            setSuccess("Sponsor record established successfully.");
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

  async function handleDeleteSponsor(id: string, sponsorName: string) {
    if (!confirm(`Are you absolutely sure you want to permanently delete sponsor '${sponsorName}'?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteSponsorAction(id);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete sponsor.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">🤝 Sponsors Registry</h1>
          <p className="page-subtitle">Configure space technology corporate partners and sponsors.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          🤝 Add Sponsor
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search sponsors by corporate name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Sponsors Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "1rem" }}>PARTNER / ORG</th>
                <th style={{ padding: "1rem" }}>SPONSORSHIP TIER</th>
                <th style={{ padding: "1rem" }}>WEBSITE LINK</th>
                <th style={{ padding: "1rem" }}>STATUS</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSponsors.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: "4rem 1rem" }}>
                    No partners match query.
                  </td>
                </tr>
              ) : (
                filteredSponsors.map((sponsor) => (
                  <tr key={sponsor.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--color-space)" }}>
                          {sponsor.logoUrl ? (
                            <img src={sponsor.logoUrl} alt={sponsor.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: "1rem" }}>🤝</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{sponsor.name}</div>
                          {sponsor.description && <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{sponsor.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${sponsor.tier === "PLATINUM" ? "badge-plasma" : sponsor.tier === "GOLD" ? "badge-nebula" : "badge-stellar"}`} style={{ fontSize: "0.65rem" }}>
                        {sponsor.tier}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--color-cosmic)" }}>
                      {sponsor.website ? (
                        <a href={sponsor.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                          {sponsor.website.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      ) : (
                        <span style={{ color: "var(--color-text-dim)" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${sponsor.isActive ? "badge-aurora" : "badge-danger"}`} style={{ fontSize: "0.65rem" }}>
                        {sponsor.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button onClick={() => openEditModal(sponsor)} className="btn btn-ghost btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteSponsor(sponsor.id, sponsor.name)} className="btn btn-danger btn-sm" disabled={isPending}>
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
              {editingSponsor ? "⚙️ Edit Partner Configuration" : "🤝 Add Corporate Partner"}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="spon-name">Corporate Name</label>
                <input
                  id="spon-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Aerospace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="spon-web">Corporate Website</label>
                <input
                  id="spon-web"
                  type="url"
                  className="form-input"
                  placeholder="https://acme-aerospace.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="spon-tier">Sponsorship Tier</label>
                <select
                  id="spon-tier"
                  className="form-select"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  disabled={isPending}
                >
                  <option value="PLATINUM">Platinum</option>
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                  <option value="BRONZE">Bronze</option>
                  <option value="PARTNER">Partner</option>
                </select>
              </div>

              <ImageUpload
                label="Sponsor Logo"
                value={logoUrl}
                onChange={setLogoUrl}
                disabled={isPending}
              />

              <div className="form-group">
                <label className="form-label" htmlFor="spon-desc">Description / Contribution Note</label>
                <textarea
                  id="spon-desc"
                  className="form-input"
                  placeholder="Describe partnership terms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  style={{ minHeight: "80px", resize: "vertical" }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isPending}
                />
                <span>Sponsor is active for public display</span>
              </label>

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
                  {isPending ? "Syncing..." : "Save Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
