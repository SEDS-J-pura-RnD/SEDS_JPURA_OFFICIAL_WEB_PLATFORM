import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import Link from "next/link";
import Image from "next/image";

export default async function MemberDashboardPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // 1. Fetch user roles
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  // 2. Fetch user project memberships
  const projectMembers = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          division: true,
        },
      },
    },
  });

  // 3. Fetch recipient certificates
  const certificates = await prisma.certificate.findMany({
    where: {
      recipientEmail: userEmail,
    },
    orderBy: {
      issueDate: "desc",
    },
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

            {/* Roles Section */}
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-dim)", marginBottom: "0.75rem" }}>COMMISSIONED ROLES</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {userRoles.length === 0 ? (
                  <span className="badge badge-cosmic">Standard Member</span>
                ) : (
                  userRoles.map((ur) => (
                    <span key={ur.roleId} className={`badge ${ur.role.name === "Admin" ? "badge-plasma" : "badge-stellar"}`}>
                      {ur.role.name}
                    </span>
                  ))
                )}
              </div>
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
                  <div
                    key={pm.projectId}
                    style={{
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(15, 23, 42, 0.4)",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      transition: "border-color var(--transition-fast)"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-bright)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                  >
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

          {/* Certificates Card */}
          <div className="card">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🏆</span> Acquired Certifications
            </h2>

            {certificates.length === 0 ? (
              <div style={{ textAlign: "center", paddingBlock: "2rem", color: "var(--color-text-muted)" }}>
                <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📜</p>
                <p style={{ fontSize: "0.875rem" }}>No credentials associated with your email yet.</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>Completed mission achievements will issue a verifiable certificate here.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                      <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>CERTIFICATE ID</th>
                      <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>TYPE / MISSION</th>
                      <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>ISSUE DATE</th>
                      <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>STATUS</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr key={cert.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>{cert.certId}</td>
                        <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8125rem" }}>
                          <span style={{ fontWeight: 600 }}>{cert.type}</span>
                          {cert.description && <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>{cert.description}</div>}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8125rem" }}>
                          <span className={`badge ${cert.status === "VALID" ? "badge-aurora" : "badge-danger"}`}>
                            {cert.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                          <Link href={`/certificates/verify?id=${cert.certId}`} className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }}>
                            Verify
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
