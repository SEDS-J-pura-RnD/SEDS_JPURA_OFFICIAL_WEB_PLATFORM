import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Logs | Admin" };

async function getLogs() {
  try {
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true, email: true } } },
    });
  } catch {
    return [];
  }
}

export default async function AuditLogsPage() {
  const logs = await getLogs();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Audit Logs</h1>
          <p className="page-subtitle">Complete record of all system actions</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-dim)", padding: "3rem" }}>
                    No audit logs yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-cosmic" style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--color-stellar)" }}>{log.entity}</span>
                      {log.entityId && <span style={{ color: "var(--color-text-dim)", marginLeft: "0.375rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>#{log.entityId.slice(0, 8)}</span>}
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>
                      {log.user ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{log.user.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>{log.user.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-dim)" }}>System</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                      {log.ipAddress || "—"}
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("en-LK")}
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
