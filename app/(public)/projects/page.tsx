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
                <Link key={project.id} href={`/projects/${project.id}`} className="project-card card">
                  <div className="project-header">
                    <span className={`badge ${statusColors[project.status] || "badge-cosmic"}`}>
                      {project.status}
                    </span>
                    <span className="badge badge-laser">{project.division.name}</span>
                  </div>
                  <h2 className="project-title">{project.title}</h2>
                  <p className="project-desc">{project.description.slice(0, 120)}...</p>
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
