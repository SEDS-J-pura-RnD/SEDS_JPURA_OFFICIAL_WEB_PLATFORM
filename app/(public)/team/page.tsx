import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Team | SEDS J'pura",
  description:
    "Meet the Executive Committee and Board of SEDS J'pura — the student leaders driving our space research mission.",
};

export const dynamic = "force-dynamic";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getTeamData() {
  const currentYear = new Date().getFullYear();

  const assignments = await prisma.userRole.findMany({
    where: {
      position: { not: null },
      role: {
        isActive: true,
        showOnTeam: true,
      },
      OR: [
        { termTo: null },
        { termTo: { gte: currentYear } },
      ],
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      role: {
        select: { id: true, name: true, teamTitle: true },
      },
    },
    orderBy: [
      { role: { name: "asc" } },
      // Within group, displayOrder (nulls handled in JS below)
      { assignedAt: "asc" },
    ],
  });

  // Group by role ID to keep them unique and carry full role details
  const grouped = new Map<string, { role: typeof assignments[0]["role"]; members: typeof assignments }>();
  for (const a of assignments) {
    const roleId = a.role.id;
    if (!grouped.has(roleId)) {
      grouped.set(roleId, { role: a.role, members: [] });
    }
    grouped.get(roleId)!.members.push(a);
  }

  // Sort within each group by displayOrder (null = last)
  for (const group of grouped.values()) {
    group.members.sort((a, b) => {
      const ao = a.displayOrder ?? Infinity;
      const bo = b.displayOrder ?? Infinity;
      return ao - bo;
    });
  }

  return grouped;
}

// ── Role colour palette ───────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; border: string; accent: string; dot: string }> = {
  default: {
    bg: "rgba(56,189,248,0.06)",
    border: "rgba(56,189,248,0.2)",
    accent: "#38bdf8",
    dot: "rgba(56,189,248,0.8)",
  },
  admin: {
    bg: "rgba(236,72,153,0.06)",
    border: "rgba(236,72,153,0.2)",
    accent: "#ec4899",
    dot: "rgba(236,72,153,0.8)",
  },
  executive: {
    bg: "rgba(99,102,241,0.06)",
    border: "rgba(99,102,241,0.2)",
    accent: "#818cf8",
    dot: "rgba(99,102,241,0.9)",
  },
  board: {
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.2)",
    accent: "#fbbf24",
    dot: "rgba(245,158,11,0.8)",
  },
};

function getRoleColors(roleName: string) {
  const lower = roleName.toLowerCase();
  if (lower.includes("admin")) return ROLE_COLORS.admin;
  if (lower.includes("executive") || lower.includes("committee")) return ROLE_COLORS.executive;
  if (lower.includes("board") || lower.includes("manager")) return ROLE_COLORS.board;
  return ROLE_COLORS.default;
}

// ── Avatar initials ───────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default async function TeamPage() {
  const grouped = await getTeamData();

  const hasMembers = grouped.size > 0;

  return (
    <div>
      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          padding: "5rem 0 4rem",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-tag">👥 THE PEOPLE</div>
          <h1 className="section-title" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            Meet the <span className="text-gradient">Team</span>
          </h1>
          <p className="section-desc" style={{ marginTop: "1rem" }}>
            The student leaders steering SEDS J&apos;pura&apos;s mission — from the Executive Committee
            to Division Managers — united by a passion for space exploration.
          </p>
        </div>
      </section>

      {/* ── Team Sections ── */}
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container">
          {!hasMembers ? (
            // ── Empty state ──
            <div
              className="card"
              style={{ textAlign: "center", padding: "5rem 2rem", maxWidth: 560, margin: "0 auto" }}
            >
              <div style={{ fontSize: "3.5rem", marginBottom: "1.25rem" }}>🚀</div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                }}
              >
                Team roster coming soon
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                Our Executive Committee and Board members will appear here once the admin sets up
                positions and terms in the system.
              </p>
              <Link href="/contact" className="btn btn-primary" style={{ marginTop: "2rem", display: "inline-flex" }}>
                Get In Touch
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
              {Array.from(grouped.entries()).map(([roleId, { role, members }]) => {
                const displayName = role.teamTitle || role.name;
                const colors = getRoleColors(role.name);
                // Find the term range from members
                const termFroms = members.map((m) => m.termFrom).filter(Boolean) as number[];
                const termTos   = members.map((m) => m.termTo).filter(Boolean) as number[];
                const termLabel =
                  termFroms.length > 0
                    ? `${Math.min(...termFroms)} – ${termTos.length > 0 ? Math.max(...termTos) : "present"}`
                    : null;

                return (
                  <div key={roleId}>
                    {/* Section header */}
                    <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.3rem 0.875rem",
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.7rem",
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: colors.accent,
                            marginBottom: "0.625rem",
                          }}
                        >
                          <div
                            style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: colors.dot,
                              boxShadow: `0 0 6px ${colors.dot}`,
                            }}
                          />
                          {displayName.toUpperCase()}
                        </div>
                        {termLabel && (
                          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-dim)" }}>
                            Term: {termLabel}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
                        {members.length} member{members.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Member cards grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: "1.25rem",
                      }}
                    >
                      {members.map((m) => (
                        <div
                          key={`${m.userId}-${m.roleId}`}
                          style={{
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "var(--radius-lg)",
                            padding: "1.5rem 1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            gap: "0.75rem",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          }}
                          className="team-card"
                        >
                          {/* Avatar */}
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: "50%",
                              border: `2px solid ${colors.border}`,
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: `linear-gradient(135deg, ${colors.bg}, rgba(0,0,0,0.3))`,
                              boxShadow: `0 0 16px ${colors.dot}33`,
                              flexShrink: 0,
                            }}
                          >
                            {m.user.image ? (
                              <img
                                src={m.user.image}
                                alt={m.user.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontFamily: "var(--font-display)",
                                  fontSize: "1.25rem",
                                  fontWeight: 800,
                                  color: colors.accent,
                                }}
                              >
                                {getInitials(m.user.name)}
                              </span>
                            )}
                          </div>

                          {/* Name */}
                          <div>
                            <div style={{ fontSize: "0.9375rem", fontWeight: 700, lineHeight: 1.3 }}>
                              {m.user.name}
                            </div>

                            {/* Position — coloured badge */}
                            {m.position && (
                              <div
                                style={{
                                  display: "inline-block",
                                  marginTop: "0.4rem",
                                  padding: "0.2rem 0.6rem",
                                  background: `${colors.dot}18`,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: "var(--radius-full)",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  color: colors.accent,
                                  letterSpacing: "0.04em",
                                }}
                              >
                                {m.position}
                              </div>
                            )}

                            {/* Term */}
                            {(m.termFrom || m.termTo) && (
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--color-text-dim)",
                                  marginTop: "0.35rem",
                                }}
                              >
                                📅 {m.termFrom ?? "?"} – {m.termTo ?? "present"}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ paddingBottom: "5rem" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">
            Want to <span className="text-gradient">Join Us</span>?
          </h2>
          <p className="section-desc" style={{ marginTop: "1rem" }}>
            SEDS J&apos;pura is always looking for passionate students ready to explore the cosmos.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            <Link href="/contact" className="btn btn-primary btn-lg">
              Get In Touch
            </Link>
            <Link href="/about" className="btn btn-secondary btn-lg">
              Learn About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
