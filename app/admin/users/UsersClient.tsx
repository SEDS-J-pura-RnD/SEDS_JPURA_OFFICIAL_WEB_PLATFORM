"use client";

import { useState, useTransition } from "react";
import { createUserAction, updateUserAction, deleteUserAction } from "@/lib/actions/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Role {
  id: string;
  name: string;
}

interface UserRole {
  roleId: string;
  role: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  userRoles: UserRole[];
}

interface UsersClientProps {
  initialUsers: User[];
  roles: Role[];
}

export default function UsersClient({ initialUsers, roles }: UsersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter users
  const filteredUsers = initialUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  function openCreateModal() {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setSelectedRoleIds([]);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setSelectedRoleIds(user.userRoles.map((ur) => ur.roleId));
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function handleRoleCheckboxChange(roleId: string, checked: boolean) {
    if (checked) {
      setSelectedRoleIds((prev) => [...prev, roleId]);
    } else {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formName.trim() || !formEmail.trim()) {
      setError("Please fill out name and email fields.");
      return;
    }

    if (!editingUser) {
      if (!formPassword) {
        setError("Please enter a password for the new member account.");
        return;
      }
      if (formPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
    }

    startTransition(async () => {
      try {
        if (editingUser) {
          // Edit mode
          const res = await updateUserAction(editingUser.id, {
            name: formName,
            email: formEmail,
            roleIds: selectedRoleIds,
          });
          if (res.success) {
            setSuccess("Member details updated successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        } else {
          // Create mode
          const res = await createUserAction({
            name: formName,
            email: formEmail,
            roleIds: selectedRoleIds,
            password: formPassword,
          });
          if (res.success) {
            setSuccess("Member account established successfully.");
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

  function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Are you absolutely sure you want to permanently delete member '${userName}'? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteUserAction(userId);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Failed to remove member record.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">👥 Members Registry</h1>
          <p className="page-subtitle">{initialUsers.length} total space explorer accounts</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          ➕ Establish Account
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search members by name or email signature..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "1rem" }}>EXPLORER</th>
                <th style={{ padding: "1rem" }}>EMAIL SIGNATURE</th>
                <th style={{ padding: "1rem" }}>CLEARANCE ROLES</th>
                <th style={{ padding: "1rem" }}>DATE REGISTERED</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: "4rem 1rem" }}>
                    No members match search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gradient-cosmic)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{user.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>ID: {user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                      {user.email}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {user.userRoles.length === 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>No Roles</span>
                        ) : (
                          user.userRoles.map((ur) => (
                            <span key={ur.roleId} className={`badge ${ur.role.isActive ? "badge-cosmic" : "badge-danger"}`} style={{ fontSize: "0.65rem" }}>
                              {ur.role.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button onClick={() => openEditModal(user)} className="btn btn-ghost btn-sm">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteUser(user.id, user.name)} className="btn btn-danger btn-sm" disabled={isPending}>
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
          {/* Backdrop */}
          <div onClick={() => !isPending && setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          {/* Content */}
          <div className="card" style={{ width: "100%", maxWidth: "500px", position: "relative", zIndex: 1, boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {editingUser ? "⚙️ Modify Operational Account" : "🚀 Establish Operational Account"}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="user-name">Explorer Name</label>
                <input
                  id="user-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Arthur Dent"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-email">Email Address</label>
                <input
                  id="user-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. explorer@seds.org"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label className="form-label" htmlFor="user-password">Initial Password</label>
                  <input
                    id="user-password"
                    type="password"
                    className="form-input"
                    placeholder="At least 8 characters"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>
              )}

              {/* Roles Checkboxes */}
              <div className="form-group">
                <label className="form-label">Authorize Security Clearance Roles</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "150px", overflowY: "auto", padding: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "rgba(0,0,0,0.2)" }}>
                  {roles.map((role) => (
                    <label key={role.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={(e) => handleRoleCheckboxChange(role.id, e.target.checked)}
                        disabled={isPending}
                      />
                      <span>{role.name}</span>
                    </label>
                  ))}
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

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Syncing core..." : editingUser ? "Save Changes" : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
