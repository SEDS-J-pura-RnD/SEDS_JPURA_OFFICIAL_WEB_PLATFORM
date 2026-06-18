import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

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
  try {
    project = await prisma.project.findUnique({
      where: { id, isPublic: true },
      include: {
        division: true,
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });
  } catch {
    project = null;
  }

  if (!project) notFound();

  return (
    <div>
      <section style={{ padding: "4rem 0", background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)" }}>
        <div className="container-sm">
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-cosmic">{project.status}</span>
            <span className="badge badge-laser">{project.division.name}</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, marginBottom: "1.25rem", letterSpacing: "0.03em" }}>
            {project.title}
          </h1>
          <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7, fontSize: "1.0625rem", marginBottom: "2rem" }}>
            {project.description}
          </p>
          {project.technologies.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {project.technologies.map((tech) => (
                <span key={tech} style={{ padding: "0.25rem 0.75rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-sm)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>{tech}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container-sm">
          <div style={{ display: "grid", gridTemplateColumns: project.outcomes ? "1fr 1fr" : "1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
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
                  {project.members.map((m) => (
                    <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gradient-cosmic)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>
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
        </div>
      </section>
    </div>
  );
}
