import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore SEDS J'pura's current and past space research projects across all five divisions.",
};

async function getProjects() {
  try {
    return await prisma.project.findMany({
      where: { isPublic: true },
      include: { division: true, members: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = {
  ACTIVE: "badge-aurora",
  COMPLETED: "badge-cosmic",
  ON_HOLD: "badge-nebula",
  PLANNING: "badge-stellar",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="section-tag">🔬 RESEARCH</div>
          <h1 className="section-title" style={{ textAlign: "center" }}>
            Our <span className="text-gradient">Projects</span>
          </h1>
          <p className="section-desc">
            From satellite subsystems to experimental rockets — explore the innovative
            projects our divisions are working on.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚀</div>
              <h3 className="empty-state-title">Projects Coming Soon</h3>
              <p>Our teams are working on exciting space projects. Check back soon!</p>
            </div>
          ) : (
            <div className="grid-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="project-card card"
                  style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
                >
                  {/* Cover Image */}
                  <div style={{
                    width: "100%",
                    height: "180px",
                    overflow: "hidden",
                    position: "relative",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(56,189,248,0.1))",
                    flexShrink: 0,
                  }}>
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "3rem",
                        opacity: 0.25,
                      }}>🔭</div>
                    )}
                    {/* Gradient overlay */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(5,13,26,0.85) 0%, transparent 55%)",
                    }} />
                    {/* Badges over image */}
                    <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", display: "flex", gap: "0.375rem" }}>
                      <span className={`badge ${statusColors[project.status] || "badge-cosmic"}`} style={{ fontSize: "0.65rem" }}>
                        {project.status}
                      </span>
                      <span className="badge badge-laser" style={{ fontSize: "0.65rem" }}>{project.division.name}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h2 className="project-title">{project.title}</h2>
                    <p className="project-desc" style={{ flex: 1 }}>{project.description.slice(0, 120)}...</p>
                    {project.technologies.length > 0 && (
                      <div className="project-tech">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <span key={tech} className="tech-tag">{tech}</span>
                        ))}
                      </div>
                    )}
                    <div className="project-footer">
                      <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                        {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                      </span>
                      <span className="project-link">View Details →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
