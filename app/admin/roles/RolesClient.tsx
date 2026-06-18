"use client";

import { useState, useTransition } from "react";
import { createRoleAction, updateRoleAction, deleteRoleAction } from "@/lib/actions/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RolePermission {
  permissionId: string;
  permission: {
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  rolePermissions: RolePermission[];
  userRoles: Array<{ userId: string }>;
}

interface RolesClientProps {
  initialRoles: Role[];
}

export default function RolesClient({ initialRoles }: RolesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function openCreateModal() {
    setEditingRole(null);
    setFormName("");
    setFormDescription("");
    setFormIsActive(true);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(role: Role) {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description || "");
    setFormIsActive(role.isActive);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formName.trim()) {
      setError("Please specify a unique role name.");
      return;
    }

    startTransition(async () => {
      try {
        if (editingRole) {
          const res = await updateRoleAction(editingRole.id, {
            name: formName,
            description: formDescription,
            isActive: formIsActive,
          });
          if (res.success) {
            setSuccess("Role configuration updated successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        } else {
          const res = await createRoleAction({
            name: formName,
            description: formDescription,
          });
          if (res.success) {
            setSuccess("Role initialized successfully.");
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

  async function handleDeleteRole(roleId: string, roleName: string) {
    if (!confirm(`Are you absolutely sure you want to delete role '${roleName}'? This action is permanent.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteRoleAction(roleId);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Failed to remove role.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">🎭 Commissioned Roles</h1>
          <p className="page-subtitle">Manage authorization scopes and dynamic access rights.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/admin/permissions" className="btn btn-ghost">
            🔑 Access Matrix
          </Link>
          <button onClick={openCreateModal} className="btn btn-primary">
            ➕ Create Role
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
        {initialRoles.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", paddingBlock: "5rem" }} className="card">
            <span style={{ fontSize: "3rem" }}>🎭</span>
            <h3 style={{ marginTop: "1rem", fontFamily: "var(--font-display)", fontWeight: 700 }}>No Dynamic Roles Created</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBlock: "0.5rem" }}>Add dynamic roles to customize access boundaries.</p>
            <button onClick={openCreateModal} className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Create First Role
            </button>
          </div>
        ) : (
          initialRoles.map((role) => (
            <div key={role.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{role.name}</h2>
                  {role.description && <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{role.description}</p>}
                </div>
                <span className={`badge ${role.isActive ? "badge-aurora" : "badge-danger"}`}>
                  {role.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                <span>👥 {role.userRoles.length} member(s)</span>
                <span>🔑 {role.rolePermissions.length} permission(s)</span>
              </div>

              {/* Permissions list */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1.5rem", minHeight: "26px" }}>
                {role.rolePermissions.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>No active permissions assigned.</span>
                ) : (
                  role.rolePermissions.slice(0, 5).map((rp) => (
                    <span key={rp.permissionId} className="badge badge-stellar" style={{ fontSize: "0.65rem" }}>
                      {rp.permission.name}
                    </span>
                  ))
                )}
                {role.rolePermissions.length > 5 && (
                  <span className="badge badge-cosmic" style={{ fontSize: "0.65rem" }}>+{role.rolePermissions.length - 5} more</span>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                <button onClick={() => openEditModal(role)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                  Configure
                </button>
                <Link href={`/admin/permissions?role=${role.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: "0.75rem" }}>
                  Permissions
                </Link>
                {role.name !== "Admin" && (
                  <button onClick={() => handleDeleteRole(role.id, role.name)} className="btn btn-danger btn-sm" disabled={isPending}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Creation / Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          {/* Backdrop */}
          <div onClick={() => !isPending && setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          {/* Content */}
          <div className="card" style={{ width: "100%", maxWidth: "450px", position: "relative", zIndex: 1, boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {editingRole ? "🎭 Update Clearance Role" : "🎭 Create Clearance Role"}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="role-name">Role Name</label>
                <input
                  id="role-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Flight Director"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={isPending || editingRole?.name === "Admin"}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role-description">Description</label>
                <textarea
                  id="role-description"
                  className="form-input"
                  placeholder="e.g. Manages active launch schedules and hardware nodes."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  disabled={isPending}
                  style={{ minHeight: "80px", resize: "vertical" }}
                />
              </div>

              {editingRole && editingRole.name !== "Admin" && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    disabled={isPending}
                  />
                  <span>Role is active for assignment</span>
                </label>
              )}

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

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Syncing..." : editingRole ? "Save Changes" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
