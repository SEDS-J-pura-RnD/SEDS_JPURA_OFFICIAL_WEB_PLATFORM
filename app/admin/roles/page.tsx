import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Roles | Admin" };

async function getRoles() {
  try {
    return await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        rolePermissions: { include: { permission: true } },
        userRoles: { select: { userId: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function AdminRolesPage() {
  const roles = await getRoles();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🎭 Roles</h1>
          <p className="page-subtitle">Manage dynamic roles and their permissions</p>
        </div>
        <Link href="/admin/roles/new" className="btn btn-primary">
          ➕ Create Role
        </Link>
      </div>

      <div className="grid-2">
        {roles.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-state-icon">🎭</div>
            <h3 className="empty-state-title">No Roles Yet</h3>
            <p>Create your first role to start managing member access.</p>
            <Link href="/admin/roles/new" className="btn btn-primary" style={{ marginTop: "1rem" }}>Create First Role</Link>
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{role.name}</h2>
                  {role.description && <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{role.description}</p>}
                </div>
                <span className={`badge ${role.isActive ? "badge-aurora" : "badge-danger"}`}>
                  {role.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                <span>👥 {role.userRoles.length} members</span>
                <span>🔑 {role.rolePermissions.length} permissions</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1rem" }}>
                {role.rolePermissions.slice(0, 6).map((rp) => (
                  <span key={rp.permissionId} className="badge badge-stellar" style={{ fontSize: "0.65rem" }}>
                    {rp.permission.name}
                  </span>
                ))}
                {role.rolePermissions.length > 6 && (
                  <span className="badge badge-cosmic" style={{ fontSize: "0.65rem" }}>+{role.rolePermissions.length - 6} more</span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                <Link href={`/admin/roles/${role.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Edit</Link>
                <Link href={`/admin/permissions?role=${role.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Permissions</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
