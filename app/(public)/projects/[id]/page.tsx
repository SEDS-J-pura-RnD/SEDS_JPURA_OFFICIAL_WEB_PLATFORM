import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import type { Sponsor } from "@prisma/client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    return { title: project?.title || "Project", description: project?.description };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let project;
  let chapterSponsors: Sponsor[] = [];
  try {
    project = await prisma.project.findUnique({
      where: { id, isPublic: true },
      include: {
        division: true,
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        sponsors: { where: { isActive: true } },
        collaborators: true,
      },
    });

    if (project) {
      const directSponsorIds = project.sponsors.map((s) => s.id);
      chapterSponsors = await prisma.sponsor.findMany({
        where: {
          isActive: true,
          ...(directSponsorIds.length > 0 ? { id: { notIn: directSponsorIds } } : {}),
        },
        orderBy: [{ tier: "asc" }, { name: "asc" }],
      });
    }
  } catch (error) {
    console.error("Error fetching project details:", error);
    project = null;
  }

  if (!project) notFound();

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .sponsor-hover-card {
          transition: all 0.2s ease-in-out !important;
        }
        .sponsor-hover-card:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
          transform: translateY(-2px);
        }
        .chapter-partner-logo {
          opacity: 0.6;
          filter: grayscale(100%) brightness(0.8);
          transition: all 0.2s ease-in-out;
        }
        .chapter-partner-logo:hover {
          opacity: 1;
          filter: none;
          transform: scale(1.05);
        }
      ` }} />

      {/* Hero — Cover Image or Gradient */}
      <div style={{
        width: "100%",
        height: "340px",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 60%), var(--color-space)",
      }}>
        {project.imageUrl && (
          <img
            src={project.imageUrl}
            alt={project.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.6 }}
          />
        )}
        {/* Gradient overlay always present */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, var(--color-void) 0%, rgba(3,7,18,0.4) 60%, transparent 100%)",
        }} />

        {/* Hero Text Overlaid */}
        <div style={{ position: "absolute", bottom: "2rem", left: 0, right: 0 }}>
          <div className="container-sm">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <span className="badge badge-cosmic">{project.status}</span>
              <span className="badge badge-laser">{project.division.name}</span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "0.03em",
              lineHeight: 1.15,
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}>
              {project.title}
            </h1>
          </div>
        </div>
      </div>

      <section style={{ padding: "2.5rem 0 4rem" }}>
        <div className="container-sm">
          <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, fontSize: "1.0625rem", marginBottom: "2rem" }}>
            {project.description}
          </p>
          {project.technologies.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2.5rem" }}>
              {project.technologies.map((tech) => (
                <span key={tech} style={{
                  padding: "0.25rem 0.75rem",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-mono)",
                }}>{tech}</span>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: project.outcomes ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
            {project.outcomes && (
              <div className="card">
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "0.05em", color: "var(--color-stellar)", marginBottom: "1rem" }}>🏆 Outcomes</h2>
                <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, fontSize: "0.9375rem" }}>{project.outcomes}</p>
              </div>
            )}
            <div className="card">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "0.05em", color: "var(--color-stellar)", marginBottom: "1rem" }}>👥 Team Members</h2>
              {project.members.length === 0 ? (
                <p style={{ color: "var(--color-text-dim)", fontSize: "0.875rem" }}>No members assigned yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[...project.members]
                    .sort((a, b) => {
                      if (a.projectRole === "LEAD" && b.projectRole !== "LEAD") return -1;
                      if (a.projectRole !== "LEAD" && b.projectRole === "LEAD") return 1;
                      return 0;
                    })
                    .map((m) => (
                      <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "var(--gradient-cosmic)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.875rem", fontWeight: 700, flexShrink: 0,
                        }}>
                          {m.user.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{m.user.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>{m.projectRole}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Sponsors & Collaborators */}
          {(project.sponsors.length > 0 || project.collaborators.length > 0) && (
            <div style={{
              marginTop: "2.5rem",
              display: "grid",
              gridTemplateColumns: project.sponsors.length > 0 && project.collaborators.length > 0 ? "1fr 1fr" : "1fr",
              gap: "1.5rem"
            }}>
              {project.sponsors.length > 0 && (
                <div className="card">
                  <h2 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    letterSpacing: "0.05em",
                    color: "var(--color-stellar)",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span>🤝</span> Project Sponsors
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {project.sponsors.map((sponsor) => (
                      <a
                        key={sponsor.id}
                        href={sponsor.website || undefined}
                        target={sponsor.website ? "_blank" : undefined}
                        rel={sponsor.website ? "noopener noreferrer" : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          padding: "0.75rem 1rem",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          borderRadius: "var(--radius-md)",
                          textDecoration: "none",
                          color: "inherit",
                          cursor: sponsor.website ? "pointer" : "default",
                        }}
                        className={sponsor.website ? "sponsor-hover-card" : undefined}
                      >
                        <div style={{
                          width: 48,
                          height: 48,
                          background: "rgba(99, 102, 241, 0.05)",
                          borderRadius: "var(--radius-sm)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                          border: "1px solid rgba(99, 102, 241, 0.1)"
                        }}>
                          {sponsor.logoUrl ? (
                            <img src={sponsor.logoUrl} alt={sponsor.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: "1.5rem" }}>🏢</span>
                          )}
                        </div>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>{sponsor.name}</span>
                            <span className="badge" style={{
                              fontSize: "0.625rem",
                              padding: "0.1rem 0.4rem",
                              background: sponsor.tier === "PLATINUM" ? "rgba(226, 232, 240, 0.1)" : sponsor.tier === "GOLD" ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.1)",
                              color: sponsor.tier === "PLATINUM" ? "#e2e8f0" : sponsor.tier === "GOLD" ? "#f59e0b" : "#a5b4fc",
                              border: sponsor.tier === "PLATINUM" ? "1px solid rgba(226, 232, 240, 0.2)" : sponsor.tier === "GOLD" ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid rgba(99, 102, 241, 0.2)"
                            }}>
                              {sponsor.tier}
                            </span>
                          </div>
                          {sponsor.description && (
                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem", marginBottom: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {sponsor.description}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {project.collaborators.length > 0 && (
                <div className="card">
                  <h2 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    letterSpacing: "0.05em",
                    color: "var(--color-stellar)",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span>🏫</span> Collaborating Partners
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {project.collaborators.map((collab) => (
                      <a
                        key={collab.id}
                        href={collab.website || undefined}
                        target={collab.website ? "_blank" : undefined}
                        rel={collab.website ? "noopener noreferrer" : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          padding: "0.75rem 1rem",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          borderRadius: "var(--radius-md)",
                          textDecoration: "none",
                          color: "inherit",
                          cursor: collab.website ? "pointer" : "default",
                        }}
                        className={collab.website ? "sponsor-hover-card" : undefined}
                      >
                        <div style={{
                          width: 48,
                          height: 48,
                          background: "rgba(56, 189, 248, 0.05)",
                          borderRadius: "var(--radius-sm)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                          border: "1px solid rgba(56, 189, 248, 0.1)"
                        }}>
                          {collab.logoUrl ? (
                            <img src={collab.logoUrl} alt={collab.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: "1.5rem" }}>🏫</span>
                          )}
                        </div>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>{collab.name}</span>
                          </div>
                          {collab.description && (
                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem", marginBottom: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {collab.description}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chapter Partners / General Sponsors Section */}
          {chapterSponsors.length > 0 && (
            <div style={{ marginTop: "4rem", paddingTop: "2.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "var(--color-text-dim)",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
                textAlign: "center"
              }}>
                Official Chapter Partners
              </h3>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
                gap: "2.5rem",
              }}>
                {chapterSponsors.map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.website || undefined}
                    target={sponsor.website ? "_blank" : undefined}
                    rel={sponsor.website ? "noopener noreferrer" : undefined}
                    title={`${sponsor.name} (${sponsor.tier} Partner)`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      textDecoration: "none",
                      cursor: sponsor.website ? "pointer" : "default",
                    }}
                    className="chapter-partner-logo"
                  >
                    {sponsor.logoUrl ? (
                      <img src={sponsor.logoUrl} alt={sponsor.name} style={{ height: "26px", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{sponsor.name}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
