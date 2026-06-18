import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

async function getStats() {
  try {
    const [users, projects, events, news, certificates, inquiries, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.event.count(),
      prisma.news.count({ where: { isPublished: true } }),
      prisma.certificate.count(),
      prisma.contactInquiry.count({ where: { isRead: false } }),
      prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    ]);
    return { users, projects, events, news, certificates, inquiries, auditLogs };
  } catch {
    return { users: 0, projects: 0, events: 0, news: 0, certificates: 0, inquiries: 0, auditLogs: [] };
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const statCards = [
    { icon: "👥", label: "Total Users", value: stats.users, href: "/admin/users", color: "#6366f1" },
    { icon: "🔬", label: "Projects", value: stats.projects, href: "/admin/projects", color: "#38bdf8" },
    { icon: "📅", label: "Events", value: stats.events, href: "/admin/events", color: "#10b981" },
    { icon: "📰", label: "Published News", value: stats.news, href: "/admin/news", color: "#f59e0b" },
    { icon: "🏆", label: "Certificates", value: stats.certificates, href: "/admin/certificates", color: "#a855f7" },
    { icon: "✉️", label: "Unread Inquiries", value: stats.inquiries, href: "/admin/contact", color: "#ec4899" },
  ];

  const quickActions = [
    { href: "/admin/users", label: "Add User", icon: "👤" },
    { href: "/admin/projects", label: "New Project", icon: "🚀" },
    { href: "/admin/news", label: "Write News", icon: "✍️" },
    { href: "/admin/certificates", label: "Issue Certificate", icon: "🏆" },
    { href: "/admin/events", label: "Create Event", icon: "📅" },
    { href: "/admin/roles", label: "Manage Roles", icon: "🎭" },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🌌 Command Center</h1>
          <p className="page-subtitle">SEDS J&apos;pura Administration Portal</p>
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-dim)" }}>
          {new Date().toLocaleDateString("en-LK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="admin-stat-card" style={{ borderColor: `${card.color}22` }}>
            <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>{card.icon}</div>
            <div className="admin-stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="admin-stat-label">{card.label}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "2rem" }}>
        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>⚡ QUICK ACTIONS</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="btn btn-ghost" style={{ justifyContent: "flex-start", fontSize: "0.875rem" }}>
                <span>{action.icon}</span> {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-muted)" }}>📋 RECENT ACTIVITY</h2>
            <Link href="/admin/audit-logs" style={{ fontSize: "0.75rem", color: "var(--color-cosmic)" }}>View All →</Link>
          </div>
          {stats.auditLogs.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-dim)" }}>No activity yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {(stats.auditLogs as Array<{id: string; action: string; entity: string; createdAt: Date; user?: {name: string} | null}>).map((log) => (
                <div key={log.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", paddingBottom: "0.625rem", borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0 }}>⚡</div>
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{log.action.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                      {log.user?.name || "System"} · {log.entity} · {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
