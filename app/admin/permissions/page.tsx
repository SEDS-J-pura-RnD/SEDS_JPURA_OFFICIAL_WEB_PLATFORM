"use client";

import { useState, useEffect, useTransition } from "react";
import { togglePermissionAction } from "@/lib/actions/admin";
import Link from "next/link";

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  rolePermissions: Array<{ permissionId: string }>;
}

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadMatrixData() {
    try {
      setLoading(true);
      const resRoles = await fetch("/api/admin/roles");
      const resPerms = await fetch("/api/admin/permissions");
      if (resRoles.ok && resPerms.ok) {
        setRoles(await resRoles.json());
        setPermissions(await resPerms.json());
      } else {
        setError("Failed to download operational credentials matrix.");
      }
    } catch {
      setError("Failed to link with database nodes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatrixData();
  }, []);

  function handlePermissionToggle(roleId: string, permissionId: string, currentAssigned: boolean) {
    setError("");
    setSuccessMsg("");
    
    startTransition(async () => {
      try {
        const res = await togglePermissionAction(roleId, permissionId, !currentAssigned);
        if (res.success) {
          setSuccessMsg("System authorization records synchronized successfully!");
          // Optimistically update state
          setRoles(prevRoles =>
            prevRoles.map(role => {
              if (role.id !== roleId) return role;
              const perms = currentAssigned
                ? role.rolePermissions.filter(rp => rp.permissionId !== permissionId)
                : [...role.rolePermissions, { permissionId }];
              return { ...role, rolePermissions: perms };
            })
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to update role permissions mapping.");
      }
    });
  }

  // Group permissions by category
  const categories: Record<string, Permission[]> = {};
  permissions.forEach(perm => {
    if (!categories[perm.category]) categories[perm.category] = [];
    categories[perm.category].push(perm);
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">🔑 Access Matrix</h1>
          <p className="page-subtitle">Configure operational clearance levels for dynamical roles.</p>
        </div>
        <Link href="/admin/roles" className="btn btn-ghost">
          🎭 Manage Roles
        </Link>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          ❌ {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "#6ee7b7", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          ✔️ {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", paddingBlock: "5rem" }}>
          <span className="spinner" style={{ width: 36, height: 36, margin: "auto" }} />
          <p style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>Scanning security key maps...</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {Object.entries(categories).map(([category, permList]) => (
            <div key={category} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "rgba(99,102,241,0.04)" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-stellar)" }}>
                  🛰️ {category.toUpperCase()}
                </h2>
              </div>
              <div className="table-wrapper">
                <table className="table" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <th style={{ width: "300px", padding: "1rem", textAlign: "left" }}>PERMISSION & PURPOSE</th>
                      {roles.map(role => (
                        <th key={role.id} style={{ padding: "1rem", textAlign: "center" }}>
                          {role.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permList.map(perm => (
                      <tr key={perm.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{perm.name}</div>
                          {perm.description && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
                              {perm.description}
                            </div>
                          )}
                        </td>
                        {roles.map(role => {
                          const isAssigned = role.rolePermissions.some(rp => rp.permissionId === perm.id);
                          return (
                            <td key={role.id} style={{ padding: "1rem", textAlign: "center" }}>
                              <label style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: isAssigned ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.02)", border: isAssigned ? "1px solid var(--color-cosmic)" : "1px solid var(--color-border)", cursor: "pointer", transition: "all var(--transition-fast)" }} className={isPending ? "loading-checkbox" : ""}>
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => handlePermissionToggle(role.id, perm.id, isAssigned)}
                                  style={{ display: "none" }}
                                  disabled={isPending}
                                />
                                {isAssigned ? (
                                  <span style={{ color: "var(--color-cosmic)", fontSize: "0.875rem", fontWeight: "bold" }}>✓</span>
                                ) : (
                                  <span style={{ color: "var(--color-text-dim)", fontSize: "0.75rem" }}>-</span>
                                )}
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
