import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users | Admin" };

async function getUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        userRoles: { include: { role: { select: { name: true, isActive: true } } } },
      },
    });
  } catch {
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Users</h1>
          <p className="page-subtitle">{users.length} registered member{users.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/users/new" className="btn btn-primary">
          ➕ Add User
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: "3rem" }}>No users yet.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gradient-cosmic)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>
                          {user.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{user.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{user.email}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {user.userRoles.length === 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>No roles</span>
                        ) : (
                          user.userRoles.map((ur) => (
                            <span key={ur.roleId} className={`badge ${ur.role.isActive ? "badge-cosmic" : "badge-danger"}`} style={{ fontSize: "0.7rem" }}>
                              {ur.role.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(user.createdAt).toLocaleDateString("en-LK")}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link href={`/admin/users/${user.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
