import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicMemberProfileAction } from "@/lib/actions/profile";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const member = await getPublicMemberProfileAction(id);
    return {
      title: member?.name ? `${member.name} | SEDS J'pura` : "Explorer Profile",
      description: member?.memberProfile?.bio || undefined,
    };
  } catch {
    return { title: "Explorer Profile" };
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getPublicMemberProfileAction(id);

  if (!member) notFound();

  const bio = member.memberProfile?.bio;
  const interests = member.memberProfile?.interests || [];
  const awards = member.memberProfile?.awards;
  const linkedin = member.memberProfile?.linkedin;
  const github = member.memberProfile?.github;
  const website = member.memberProfile?.website;
  const projects = member.projectMembers || [];

  return (
    <div style={{ minHeight: "100vh", position: "relative", paddingBottom: "5rem" }}>
      {/* Background glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "1200px",
          height: "400px",
          background: "radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <section style={{ position: "relative", zIndex: 1, paddingTop: "3rem" }}>
        <div className="container-sm" style={{ maxWidth: "800px" }}>
          {/* Back button */}
          <div style={{ marginBottom: "2rem" }}>
            <Link href="/team" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              ← Return to Team
            </Link>
          </div>

          {/* Profile Header */}
          <div className="card" style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap", padding: "2.5rem 2rem", marginBottom: "2rem", background: "rgba(10, 22, 40, 0.4)", backdropFilter: "blur(10px)" }}>
            <div style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              border: "3px solid var(--color-cosmic)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-space)",
              boxShadow: "var(--glow-cosmic)",
              flexShrink: 0,
            }}>
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-cosmic)", fontFamily: "var(--font-display)" }}>
                  {getInitials(member.name)}
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: "240px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-stellar)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>
                Active Space Explorer
              </div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{member.name}</h1>
              
              {/* Positions / Roles */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                {member.userRoles.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)" }}>Officer (General Council)</span>
                ) : (
                  member.userRoles.map((ur, idx) => (
                    <span key={idx} className="badge badge-cosmic" style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}>
                      {ur.position || ur.role.teamTitle || ur.role.name}
                      {ur.termFrom ? ` (${ur.termFrom}${ur.termTo ? ` – ${ur.termTo}` : " – Present"})` : ""}
                    </span>
                  ))
                )}
              </div>

              {/* Social Links */}
              {(linkedin || github || website) && (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginTop: "1.25rem" }}>
                  {linkedin && (
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.75rem",
                        color: "var(--color-stellar)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        background: "rgba(56, 189, 248, 0.05)",
                        borderRadius: "var(--radius-md)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        textDecoration: "none",
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                      }}
                      className="sponsor-hover-card"
                    >
                      <span>🔗</span> LinkedIn
                    </a>
                  )}
                  {github && (
                    <a
                      href={github}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.75rem",
                        color: "var(--color-stellar)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        background: "rgba(56, 189, 248, 0.05)",
                        borderRadius: "var(--radius-md)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        textDecoration: "none",
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                      }}
                      className="sponsor-hover-card"
                    >
                      <span>💻</span> GitHub
                    </a>
                  )}
                  {website && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.75rem",
                        color: "var(--color-stellar)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        background: "rgba(56, 189, 248, 0.05)",
                        borderRadius: "var(--radius-md)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        textDecoration: "none",
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                      }}
                      className="sponsor-hover-card"
                    >
                      <span>🌐</span> Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio & Interests Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Biography */}
            <div className="card" style={{ padding: "2rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-stellar)", marginBottom: "1.25rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
                📖 Biography
              </h2>
              {bio ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {bio}
                </p>
              ) : (
                <p style={{ color: "var(--color-text-dim)", fontSize: "0.9rem", fontStyle: "italic" }}>
                  This explorer has not configured their biography records yet.
                </p>
              )}
            </div>

            {/* Interest areas */}
            {interests.length > 0 && (
              <div className="card" style={{ padding: "2rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-stellar)", marginBottom: "1.25rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
                  🔬 Research &amp; Interests
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                  {interests.map((interest, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "0.4rem 0.875rem",
                        background: "rgba(56, 189, 248, 0.06)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-stellar)",
                        fontSize: "0.8125rem",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Awards & Recognitions */}
            {awards && (
              <div className="card" style={{ padding: "2rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-stellar)", marginBottom: "1.25rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
                  🏆 Awards &amp; Recognitions
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {awards}
                </p>
              </div>
            )}
          </div>

          {/* Associated Projects */}
          <div className="card" style={{ padding: "2rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-stellar)", marginBottom: "1.25rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
              🚀 Project Involvements
            </h2>
            {projects.length === 0 ? (
              <p style={{ color: "var(--color-text-dim)", fontSize: "0.9rem", fontStyle: "italic" }}>
                No project records linked to this member.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {projects.map((pm, idx) => (
                  <Link
                    key={idx}
                    href={`/projects/${pm.project.id}`}
                    className="sponsor-hover-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.25rem",
                      padding: "0.75rem 1rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-space)",
                      border: "1px solid rgba(99, 102, 241, 0.15)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {pm.project.imageUrl ? (
                        <img
                          src={pm.project.imageUrl}
                          alt={pm.project.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: "1.25rem" }}>🛠️</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>
                        {pm.project.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.15rem" }}>
                        Role: <span style={{ color: pm.projectRole === "LEAD" ? "var(--color-nebula)" : "var(--color-text-muted)" }}>{pm.projectRole}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
