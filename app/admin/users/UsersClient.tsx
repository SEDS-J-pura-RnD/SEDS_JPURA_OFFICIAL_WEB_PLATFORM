"use client";

import { useState, useTransition } from "react";
import { createUserAction, updateUserAction, deleteUserAction, createBulkUsersAction } from "@/lib/actions/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  name: string;
}

interface UserRole {
  roleId: string;
  position: string | null;
  termFrom: number | null;
  termTo: number | null;
  displayOrder: number | null;
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

// ─── Role assignment type used in form state ──────────────────────────────────

interface RoleAssignment {
  roleId: string;
  position: string;
  termFrom: string; // year as string for select value
  termTo: string;
  displayOrder: string; // numeric string, e.g. "1"
}

// ─── Year helpers ─────────────────────────────────────────────────────────────

const YEAR_MIN = 2015;
const YEAR_MAX = new Date().getFullYear() + 5;
const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);

// ─── Badge label helper ───────────────────────────────────────────────────────

function roleBadgeLabel(ur: UserRole): { primary: string; secondary: string | null } {
  const primary = ur.role.name;
  const parts: string[] = [];
  if (ur.position) parts.push(ur.position);
  if (ur.termFrom || ur.termTo) {
    parts.push(`${ur.termFrom ?? "?"}–${ur.termTo ?? "?"}`);
  }
  return { primary, secondary: parts.length > 0 ? parts.join(" · ") : null };
}

// ─── Component ───────────────────────────────────────────────────────────────

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

  // Role assignments: map from roleId → assignment details
  const [roleAssignments, setRoleAssignments] = useState<Map<string, RoleAssignment>>(new Map());

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Bulk Import States
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<{
    name: string;
    email: string;
    password?: string;
    roleNames: string[];
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

  // ── Role assignment helpers ──────────────────────────────────────────────────

  function toggleRole(roleId: string, checked: boolean) {
    setRoleAssignments((prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(roleId, { roleId, position: "", termFrom: "", termTo: "", displayOrder: "" });
      } else {
        next.delete(roleId);
      }
      return next;
    });
  }

  function updateAssignment(roleId: string, field: keyof RoleAssignment, value: string) {
    setRoleAssignments((prev) => {
      const next = new Map(prev);
      const existing = next.get(roleId);
      if (existing) {
        next.set(roleId, { ...existing, [field]: value });
      }
      return next;
    });
  }

  function assignmentsToPayload() {
    return Array.from(roleAssignments.values()).map(({ roleId, position, termFrom, termTo, displayOrder }) => ({
      roleId,
      position: position.trim() || undefined,
      termFrom: termFrom ? parseInt(termFrom, 10) : undefined,
      termTo: termTo ? parseInt(termTo, 10) : undefined,
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : undefined,
    }));
  }

  // ── Template download ────────────────────────────────────────────────────────

  async function handleDownloadTemplate() {
    const XLSX = await import("xlsx");
    const headers = [["Name", "Email", "Password", "Roles"]];
    const sampleData = [
      ["Arthur Dent", "arthur.dent@galaxy.com", "galaxyPass123", "Member"],
      ["Tricia McMillan", "trillian@galaxy.com", "trillianPass456", "Project Lead, Member"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users Template");
    XLSX.writeFile(wb, "SEDS_Bulk_Users_Template.xlsx");
  }

  // ── Bulk upload parsing ──────────────────────────────────────────────────────

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

        const parsedUsers = rawRows.map((row: any) => {
          const rowKeys = Object.keys(row);
          const nameKey = rowKeys.find(k => k.toLowerCase() === "name") || "Name";
          const emailKey = rowKeys.find(k => k.toLowerCase() === "email") || "Email";
          const passwordKey = rowKeys.find(k => k.toLowerCase() === "password") || "Password";
          const rolesKey = rowKeys.find(k => k.toLowerCase() === "roles") || "Roles";

          const name = String(row[nameKey] || "").trim();
          const email = String(row[emailKey] || "").trim();
          const password = String(row[passwordKey] || "").trim();
          const rolesStr = String(row[rolesKey] || "").trim();

          const roleNames = rolesStr ? rolesStr.split(",").map(r => r.trim()).filter(Boolean) : ["Member"];

          const errors: string[] = [];
          if (!name) errors.push("Name is required.");
          if (!email) {
            errors.push("Email is required.");
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("Invalid email signature.");
          }
          if (password && password.length < 8) {
            errors.push("Password must be at least 8 characters.");
          }

          return {
            name,
            email,
            password: password || undefined,
            roleNames,
            isValid: errors.length === 0,
            errors,
          };
        });

        if (parsedUsers.length === 0) {
          alert("The uploaded Excel sheet contains no user records.");
          return;
        }

        setBulkUsers(parsedUsers);
        setBulkModalOpen(true);
        e.target.value = "";
      } catch (err: any) {
        alert("Failed to parse Excel file: " + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async function handleConfirmBulkImport() {
    const validUsers = bulkUsers.filter(u => u.isValid);
    if (validUsers.length === 0) {
      alert("No valid user records to import.");
      return;
    }

    setBulkImportProgress(true);
    try {
      const res = await createBulkUsersAction(
        validUsers.map(u => ({
          name: u.name,
          email: u.email,
          password: u.password,
          roleNames: u.roleNames,
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
        errors: [err.message || "An unexpected error occurred during bulk import."],
      });
    } finally {
      setBulkImportProgress(false);
    }
  }

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filteredUsers = initialUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── Modal open helpers ────────────────────────────────────────────────────────

  function openCreateModal() {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setRoleAssignments(new Map());
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    // Pre-populate existing assignments
    const map = new Map<string, RoleAssignment>();
    user.userRoles.forEach((ur) => {
      map.set(ur.roleId, {
        roleId: ur.roleId,
        position: ur.position ?? "",
        termFrom: ur.termFrom ? String(ur.termFrom) : "",
        termTo: ur.termTo ? String(ur.termTo) : "",
        displayOrder: ur.displayOrder != null ? String(ur.displayOrder) : "",
      });
    });
    setRoleAssignments(map);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  // ── Form submit ────────────────────────────────────────────────────────────────

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
          const res = await updateUserAction(editingUser.id, {
            name: formName,
            email: formEmail,
            roleAssignments: assignmentsToPayload(),
          });
          if (res.success) {
            setSuccess("Member details updated successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        } else {
          const res = await createUserAction({
            name: formName,
            email: formEmail,
            roleAssignments: assignmentsToPayload(),
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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">👥 Members Registry</h1>
          <p className="page-subtitle">{initialUsers.length} total space explorer accounts</p>
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
          <button onClick={openCreateModal} className="btn btn-primary">
            ➕ Establish Account
          </button>
        </div>
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
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                        {user.userRoles.length === 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>No Roles</span>
                        ) : (
                          user.userRoles.map((ur) => {
                            const { primary, secondary } = roleBadgeLabel(ur);
                            return (
                              <div
                                key={ur.roleId}
                                className={`badge ${ur.role.isActive ? "badge-cosmic" : "badge-danger"}`}
                                style={{ fontSize: "0.65rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "1px", padding: "0.25rem 0.5rem" }}
                              >
                                <span style={{ fontWeight: 700 }}>{primary}</span>
                                {secondary && (
                                  <span style={{ opacity: 0.75, fontWeight: 400, fontSize: "0.6rem" }}>{secondary}</span>
                                )}
                              </div>
                            );
                          })
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
          <div className="card" style={{ width: "100%", maxWidth: "560px", position: "relative", zIndex: 1, boxShadow: "var(--glow-cosmic)", maxHeight: "90vh", overflowY: "auto" }}>
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

              {/* Role Assignments */}
              <div className="form-group">
                <label className="form-label">Roles &amp; Positions</label>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginBottom: "0.75rem" }}>
                  Check a role to assign it, then optionally specify the exact position and term years.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {roles.map((role) => {
                    const isChecked = roleAssignments.has(role.id);
                    const assignment = roleAssignments.get(role.id);
                    return (
                      <div
                        key={role.id}
                        style={{
                          border: `1px solid ${isChecked ? "var(--color-primary, #6366f1)" : "var(--color-border)"}`,
                          borderRadius: "var(--radius-md)",
                          padding: "0.625rem 0.75rem",
                          background: isChecked ? "rgba(99,102,241,0.07)" : "rgba(0,0,0,0.15)",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        {/* Role checkbox row */}
                        <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", marginBottom: isChecked ? "0.75rem" : 0 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => toggleRole(role.id, e.target.checked)}
                            disabled={isPending}
                          />
                          <span style={{ fontWeight: isChecked ? 700 : 400, fontSize: "0.875rem" }}>{role.name}</span>
                        </label>

                        {/* Expanded detail fields */}
                        {isChecked && assignment && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "1.5rem" }}>
                            {/* Position */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", minWidth: "64px" }}>📌 Position</span>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. President, Secretary, PM…"
                                value={assignment.position}
                                onChange={(e) => updateAssignment(role.id, "position", e.target.value)}
                                disabled={isPending}
                                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.6rem", flex: 1 }}
                              />
                            </div>

                            {/* Term years */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", minWidth: "64px" }}>📅 Term</span>
                              <select
                                className="form-input"
                                value={assignment.termFrom}
                                onChange={(e) => updateAssignment(role.id, "termFrom", e.target.value)}
                                disabled={isPending}
                                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem", flex: 1 }}
                              >
                                <option value="">From year</option>
                                {YEARS.map((y) => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>→</span>
                              <select
                                className="form-input"
                                value={assignment.termTo}
                                onChange={(e) => updateAssignment(role.id, "termTo", e.target.value)}
                                disabled={isPending}
                                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem", flex: 1 }}
                              >
                                <option value="">To year</option>
                                {YEARS.map((y) => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </div>

                            {/* Display Order */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", minWidth: "64px" }}>🔢 Order</span>
                              <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 1 (lower = appears first on /team)"
                                value={assignment.displayOrder}
                                onChange={(e) => updateAssignment(role.id, "displayOrder", e.target.value)}
                                disabled={isPending}
                                min="1"
                                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.6rem", flex: 1 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                <button type="submit" className="btn btn-primary" disabled={isPending} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  {isPending ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14 }} /> Syncing core...
                    </>
                  ) : editingUser ? (
                    "Save Changes"
                  ) : (
                    "Create Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Preview Modal */}
      {bulkModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          {/* Backdrop */}
          <div onClick={() => !bulkImportProgress && setBulkModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />

          {/* Content */}
          <div className="card" style={{ width: "100%", maxWidth: "800px", position: "relative", zIndex: 1, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              👥 Bulk Import Preview
            </h2>

            {bulkImportResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ padding: "1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)" }}>
                  <h3 style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>✔️ Import Process Complete</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    Successfully created <strong>{bulkImportResult.createdCount}</strong> new space explorer accounts.
                    {bulkImportResult.skippedCount > 0 && ` Skipped ${bulkImportResult.skippedCount} accounts (either invalid or email signatures already registered).`}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginTop: "0.5rem" }}>
                    💡 Position &amp; term were not set via bulk import — edit each member individually to add those details.
                  </p>
                </div>

                {bulkImportResult.errors.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <h4 style={{ fontSize: "0.875rem", color: "#fca5a5", fontWeight: 600 }}>Operational Alerts:</h4>
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
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>TOTAL RECORDS</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{bulkUsers.length}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: "120px", padding: "0.75rem", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6ee7b7" }}>VALID &amp; READY</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6ee7b7" }}>{bulkUsers.filter(u => u.isValid).length}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: "120px", padding: "0.75rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#fca5a5" }}>INVALID &amp; SKIPPED</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fca5a5" }}>{bulkUsers.filter(u => !u.isValid).length}</div>
                  </div>
                </div>

                {/* Preview Table */}
                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border)" }}>
                          <th style={{ padding: "0.75rem" }}>EXPLORER</th>
                          <th style={{ padding: "0.75rem" }}>EMAIL</th>
                          <th style={{ padding: "0.75rem" }}>ROLES</th>
                          <th style={{ padding: "0.75rem" }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkUsers.map((user, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", background: user.isValid ? "transparent" : "rgba(239,68,68,0.02)" }}>
                            <td style={{ padding: "0.75rem", fontWeight: 600 }}>{user.name || <em style={{ color: "var(--color-text-dim)" }}>[Empty]</em>}</td>
                            <td style={{ padding: "0.75rem", color: "var(--color-text-muted)" }}>{user.email || <em style={{ color: "var(--color-text-dim)" }}>[Empty]</em>}</td>
                            <td style={{ padding: "0.75rem" }}>
                              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                {user.roleNames.map((r, i) => (
                                  <span key={i} className="badge badge-cosmic" style={{ fontSize: "0.6rem" }}>{r}</span>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: "0.75rem" }}>
                              {user.isValid ? (
                                <span className="badge badge-aurora" style={{ fontSize: "0.6rem" }}>Ready</span>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                  <span className="badge badge-danger" style={{ fontSize: "0.6rem", width: "fit-content" }}>Invalid</span>
                                  {user.errors.map((err, i) => (
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
                    disabled={bulkImportProgress || bulkUsers.filter(u => u.isValid).length === 0}
                  >
                    {bulkImportProgress ? "Establishing Accounts..." : `Confirm Import (${bulkUsers.filter(u => u.isValid).length} accounts)`}
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
