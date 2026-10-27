import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserPermissions } from "@/lib/permissions";
import { getResolvedHomePageStats } from "@/lib/site-settings";

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
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin");

  const permissions = await getUserPermissions(session.user.id);
  const [stats, homeStats] = await Promise.all([
    getStats(),
    getResolvedHomePageStats(),
  ]);

  const hasPermission = (required: string | string[]) => {
    if (typeof required === "string") {
      return permissions.includes(required);
    }
    return required.some(p => permissions.includes(p));
  };

  const statCards = [
    { icon: "👥", label: "Total Users", value: stats.users, href: "/admin/users", color: "#6366f1", permission: "VIEW_USERS" },
    { icon: "🔬", label: "Projects", value: stats.projects, href: "/admin/projects", color: "#38bdf8", permission: ["CREATE_PROJECT", "EDIT_PROJECT", "DELETE_PROJECT", "ASSIGN_PROJECT_MEMBER", "VIEW_ALL_PROJECTS"] },
    { icon: "📅", label: "Events", value: stats.events, href: "/admin/events", color: "#10b981", permission: ["CREATE_EVENT", "EDIT_EVENT", "DELETE_EVENT", "MANAGE_EVENTS"] },
    { icon: "📰", label: "Published News", value: stats.news, href: "/admin/news", color: "#f59e0b", permission: ["CREATE_NEWS", "EDIT_NEWS", "DELETE_NEWS", "PUBLISH_NEWS"] },
    { icon: "🏆", label: "Certificates", value: stats.certificates, href: "/admin/certificates", color: "#a855f7", permission: ["ISSUE_CERTIFICATE", "REVOKE_CERTIFICATE"] },
    { icon: "✉️", label: "Unread Inquiries", value: stats.inquiries, href: "/admin/contact", color: "#ec4899", permission: "MANAGE_CONTACT" },
  ].filter(card => !card.permission || hasPermission(card.permission));

  const quickActions = [
    { href: "/admin/site-settings", label: "Home Page Stats", icon: "📊" },
    { href: "/admin/users", label: "Add User", icon: "👤", permission: "CREATE_USER" },
    { href: "/admin/projects", label: "New Project", icon: "🚀", permission: "CREATE_PROJECT" },
    { href: "/admin/news", label: "Write News", icon: "✍️", permission: "CREATE_NEWS" },
    { href: "/admin/certificates", label: "Issue Certificate", icon: "🏆", permission: "ISSUE_CERTIFICATE" },
    { href: "/admin/events", label: "Create Event", icon: "📅", permission: "CREATE_EVENT" },
    { href: "/admin/roles", label: "Manage Roles", icon: "🎭", permission: "MANAGE_ROLES" },
  ].filter(action => !action.permission || hasPermission(action.permission));

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

      {/* Home Page Public Metrics Quick Overview */}
      <div
        className="card"
        style={{
          marginTop: "1.75rem",
          background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(56,189,248,0.03))",
          borderColor: "rgba(99,102,241,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>📊</span>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "var(--color-text-muted)",
                }}
              >
                HOME PAGE PUBLIC METRICS
              </h2>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.2rem" }}>
              Live stats currently visible to visitors on the landing page (Active Members, Projects, Divisions, Events)
            </p>
          </div>
          <Link
            href="/admin/site-settings"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "0.75rem" }}
          >
            <span>⚙️</span> Manage Metrics →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {homeStats.displayStats.map((item) => (
            <div
              key={item.key}
              style={{
                padding: "0.875rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-text-dim)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{item.label}</span>
                <span
                  style={{
                    color: item.mode === "auto" ? "#10b981" : "#f59e0b",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    padding: "0.1rem 0.4rem",
                    borderRadius: "9999px",
                    background: item.mode === "auto" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    border: `1px solid ${item.mode === "auto" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                  }}
                >
                  {item.mode === "auto" ? "LIVE AUTO" : "CUSTOM"}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "var(--color-cosmic)",
                  marginTop: "0.35rem",
                }}
              >
                {item.number}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: hasPermission("VIEW_LOGS") ? "1fr 1fr" : "1fr", gap: "1.5rem", marginTop: "2rem" }}>
        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>⚡ QUICK ACTIONS</h2>
          {quickActions.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-dim)" }}>No active options available for your current clearance level.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="btn btn-ghost" style={{ justifyContent: "flex-start", fontSize: "0.875rem" }}>
                  <span>{action.icon}</span> {action.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Logs */}
        {hasPermission("VIEW_LOGS") && (
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
        )}
      </div>
    </div>
  );
}
