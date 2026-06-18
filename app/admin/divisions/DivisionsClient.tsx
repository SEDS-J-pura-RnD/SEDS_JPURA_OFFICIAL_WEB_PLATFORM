"use client";

import { useState, useTransition } from "react";
import { updateDivisionAction } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";

interface Division {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  color: string | null;
}

interface DivisionsClientProps {
  initialDivisions: Division[];
}

export default function DivisionsClient({ initialDivisions }: DivisionsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);

  // Form fields
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function openEditModal(div: Division) {
    setEditingDivision(div);
    setDescription(div.description);
    setIcon(div.icon || "");
    setColor(div.color || "#6366f1");
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!description.trim()) {
      setError("Please write a description for the research division.");
      return;
    }

    if (!editingDivision) return;

    startTransition(async () => {
      try {
        const res = await updateDivisionAction(editingDivision.id, {
          description,
          icon: icon || "",
          color: color || "#6366f1",
        });
        if (res.success) {
          setSuccess("Division settings updated successfully.");
          setTimeout(() => {
            setModalOpen(false);
            router.refresh();
          }, 1000);
        }
      } catch (err: any) {
        setError(err.message || "Failed to update division.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">⚗️ Research Divisions</h1>
          <p className="page-subtitle">Configure SEDS J&apos;pura core divisions: Rocketry, Satellites, Biomedical, Robotics and Astronomy.</p>
        </div>
      </div>

      {/* Grid of Divisions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
        {initialDivisions.map((div) => (
          <div key={div.id} className="card" style={{ borderLeftWidth: "4px", borderLeftColor: div.color || "var(--color-cosmic)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>{div.icon || "🌌"}</span>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700 }}>{div.name}</h2>
              </div>
              <button onClick={() => openEditModal(div)} className="btn btn-ghost btn-sm">
                Configure
              </button>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", minHeight: "80px" }}>{div.description}</p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
              <span>Slug: {div.slug}</span>
              <span>Color Hex: <span style={{ color: div.color || "var(--color-cosmic)", fontWeight: "bold" }}>{div.color || "N/A"}</span></span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {modalOpen && editingDivision && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => !isPending && setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "450px", position: "relative", zIndex: 1, boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              ⚗️ Configure Division Settings
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Division: <span style={{ color: "var(--color-stellar)", fontWeight: 600 }}>{editingDivision.name}</span>
            </p>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="div-desc">Division Description</label>
                <textarea
                  id="div-desc"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  style={{ minHeight: "100px" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="div-icon">Icon / Emoji</label>
                  <input
                    id="div-icon"
                    type="text"
                    className="form-input"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="div-color">Accent Color</label>
                  <input
                    id="div-color"
                    type="color"
                    className="form-input"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={isPending}
                    style={{ height: "38px", padding: "0.25rem", cursor: "pointer" }}
                    required
                  />
                </div>
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
