import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import Link from "next/link";
import DashboardCertificates from "./DashboardCertificates";

export default async function MemberDashboardPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // 1. Fetch user roles (position + term included via Prisma scalar fields)
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
    orderBy: { assignedAt: "asc" },
  });

  // 2. Fetch user project memberships
  const projectMembers = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: { division: true },
      },
    },
  });

  // 3. Fetch recipient certificates
  const certificates = await prisma.certificate.findMany({
    where: { recipientEmail: userEmail },
    orderBy: { issueDate: "desc" },
  });

  // 4. Check if Admin
  const isUserAdmin = await isAdmin(userId);

  return (
    <div className="container" style={{ paddingBlock: "3rem", position: "relative", zIndex: 1 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">📡 Cosmic Terminal</h1>
          <p className="page-subtitle">Welcome back, Explorer. Monitor your space research activities here.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }} className="dashboard-grid">

        {/* Sidebar Column: Profile & Roles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Profile Card */}
          <div className="card">
            {/* Avatar + name */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-border)", gap: "1rem" }}>
              <div style={{ position: "relative", width: 96, height: 96, borderRadius: "50%", border: "2px solid var(--color-stellar)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-space)" }}>
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "2.5rem" }}>👨‍🚀</span>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700 }}>{session.user.name}</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{session.user.email}</p>
              </div>
            </div>

            {/* ── Positions Section ─────────────────────────────────── */}
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--color-text-dim)", marginBottom: "0.75rem" }}>
                MY POSITIONS
              </h3>

              {userRoles.length === 0 ? (
                <span className="badge badge-cosmic">Standard Member</span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {userRoles.map((ur) => {
                    const isAdminRole = ur.role.name === "Admin";
                    const accentColor = isAdminRole ? "var(--color-plasma)" : "var(--color-stellar)";
                    const bgColor    = isAdminRole ? "rgba(236,72,153,0.08)" : "rgba(56,189,248,0.08)";
                    const borderColor= isAdminRole ? "rgba(236,72,153,0.25)" : "rgba(56,189,248,0.2)";

                    // What to show as the main title: position if set, else role name
                    const primaryLabel = ur.position || ur.role.name;
                    // Show role name as category label only when position is explicitly set
                    const categoryLabel = ur.position ? ur.role.name : null;

                    return (
                      <div
                        key={ur.roleId}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.625rem",
                          padding: "0.75rem",
                          background: bgColor,
                          border: `1px solid ${borderColor}`,
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        {/* Glowing indicator dot */}
                        <div style={{
                          width: 7, height: 7, borderRadius: "50%",
                          marginTop: "0.35rem", flexShrink: 0,
                          background: accentColor,
                          boxShadow: `0 0 8px ${accentColor}`,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Position — primary, most prominent */}
                          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text)", lineHeight: 1.25 }}>
                            {primaryLabel}
                          </div>

                          {/* Term — coloured accent line */}
                          {(ur.termFrom || ur.termTo) && (
                            <div style={{ fontSize: "0.75rem", color: accentColor, marginTop: "0.2rem", fontWeight: 600 }}>
                              📅 {ur.termFrom ?? "?"} – {ur.termTo ?? "present"}
                            </div>
                          )}

                          {/* Role category — small dim label, only shown when position differs */}
                          {categoryLabel && (
                            <div style={{ fontSize: "0.68rem", color: "var(--color-text-dim)", marginTop: "0.15rem", letterSpacing: "0.02em" }}>
                              {categoryLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link href="/dashboard/profile" className="btn btn-ghost w-full">
                ⚙️ Profile Settings
              </Link>
            </div>
          </div>

          {/* Admin Control Center Card */}
          {isUserAdmin && (
            <div className="card card-glow" style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-plasma)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-plasma)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🛰️</span> ADMIN COMMAND
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBlock: "0.75rem" }}>
                You have administrative clearance to override operations, manage roles, and authorize certifications.
              </p>
              <Link href="/admin" className="btn btn-primary w-full btn-sm">
                Access Command Center →
              </Link>
            </div>
          )}
        </div>

        {/* Content Column: Projects & Certificates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Projects Card */}
          <div className="card">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🚀</span> Assigned Space Operations
            </h2>

            {projectMembers.length === 0 ? (
              <div style={{ textAlign: "center", paddingBlock: "2rem", color: "var(--color-text-muted)" }}>
                <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔭</p>
                <p style={{ fontSize: "0.875rem" }}>No current research project assignments found.</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>Join an active SEDS research division to launch your mission.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                {projectMembers.map((pm) => (
                  <div key={pm.projectId} className="project-card-interactive">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{pm.project.title}</h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
                          Division: {pm.project.division.name}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <span className={`badge ${pm.projectRole === "LEAD" ? "badge-nebula" : "badge-cosmic"}`}>
                          {pm.projectRole}
                        </span>
                        <span className={`badge ${pm.project.status === "ACTIVE" ? "badge-aurora" : "badge-stellar"}`}>
                          {pm.project.status}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {pm.project.description.length > 180 ? `${pm.project.description.slice(0, 180)}...` : pm.project.description}
                    </p>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Link href={`/projects/${pm.projectId}`} className="btn btn-ghost btn-sm">
                        Inspect Mission Detail →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificates */}
          <DashboardCertificates certificates={certificates} />
        </div>
      </div>
    </div>
  );
}
