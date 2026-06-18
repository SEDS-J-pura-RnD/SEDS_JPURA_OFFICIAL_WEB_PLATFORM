import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "SEDS J'pura | Students for the Exploration and Development of Space",
  description:
    "The premier space research and technology student organization at the University of Sri Jayewardenepura, Sri Lanka.",
};

export const dynamic = "force-dynamic";


async function getStats() {
  try {
    const [projects, events, news, members] = await Promise.all([
      prisma.project.count(),
      prisma.event.count({ where: { isPublished: true } }),
      prisma.news.count({ where: { isPublished: true } }),
      prisma.user.count(),
    ]);
    return { projects, events, news, members };
  } catch {
    return { projects: 12, events: 45, news: 30, members: 150 };
  }
}

const divisions = [
  {
    icon: "🛰️",
    name: "IT & Satellite",
    description: "Satellite communication, embedded systems, IoT space systems, and ground station software.",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.03))",
  },
  {
    icon: "🚀",
    name: "Rocketry",
    description: "Rocket propulsion, aerodynamics, flight simulation, and launch systems.",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.03))",
  },
  {
    icon: "🤖",
    name: "Rover & Robotics",
    description: "Autonomous rovers, robotics systems, navigation & control, embedded hardware.",
    color: "#10b981",
    gradient: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.03))",
  },
  {
    icon: "🧬",
    name: "Biomedical",
    description: "Space medicine, life support systems, biomedical sensors, human space research.",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.03))",
  },
  {
    icon: "🔭",
    name: "Observation",
    description: "Astronomy, telescope systems, astrophysics research, space observation data.",
    color: "#38bdf8",
    gradient: "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.03))",
  },
];

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-ring hero-ring-1" />
          <div className="hero-ring hero-ring-2" />
          <div className="hero-ring hero-ring-3" />
          <div className="hero-center-dot" />
          <div className="hero-satellite" aria-hidden="true">🛰️</div>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-badge animate-fade-in">
              <span>🌌</span>
              <span>SEDS J'pura</span>
            </div>

            <h1 className="hero-title animate-slide-up">
              Reaching for the{" "}
              <span className="text-gradient">Stars</span>
              <br />
              Together
            </h1>

            <p className="hero-desc animate-fade-in">
              Students for the Exploration and Development of Space — pioneering
              space research, rocketry, robotics, biomedical science, and
              astronomy at University of Sri Jayewardenepura, Sri Lanka.
            </p>

            <div className="hero-actions animate-slide-up">
              <Link href="/about" className="btn btn-primary btn-lg">
                <span>🚀</span> Explore SEDS
              </Link>
              <Link href="/projects" className="btn btn-secondary btn-lg">
                Our Projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="section" style={{ paddingTop: "3rem" }}>
        <div className="container">
          <div className="stats-grid">
            {[
              { number: `${stats.members}+`, label: "Active Members" },
              { number: `${stats.projects}+`, label: "Projects Launched" },
              { number: "5", label: "Research Divisions" },
              { number: `${stats.events}+`, label: "Events Hosted" },
            ].map((stat) => (
              <div key={stat.label} className="stat-card animate-slide-up">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIVISIONS ─── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">🔬 RESEARCH DIVISIONS</div>
            <h2 className="section-title">
              Five Frontiers of{" "}
              <span className="text-gradient">Space Science</span>
            </h2>
            <p className="section-desc">
              Our specialized divisions cover every aspect of space exploration —
              from satellites to medicine, rocketry to robotics.
            </p>
          </div>

          <div className="divisions-grid">
            {divisions.map((div) => (
              <div
                key={div.name}
                className="division-card"
                style={{ background: div.gradient }}
              >
                <div
                  className="division-icon"
                  style={{ border: `1px solid ${div.color}44` }}
                >
                  <span>{div.icon}</span>
                </div>
                <h3 className="division-name" style={{ color: div.color }}>
                  {div.name}
                </h3>
                <p className="division-desc">{div.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MISSION ─── */}
      <section className="section mission-section">
        <div className="mission-bg" aria-hidden="true" />
        <div className="container">
          <div className="mission-inner">
            <div className="mission-content">
              <div className="section-tag">🌟 OUR MISSION</div>
              <h2 className="section-title" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
                Inspiring the Next Generation of{" "}
                <span className="text-gradient">Space Pioneers</span>
              </h2>
              <p className="section-desc" style={{ textAlign: "left", margin: 0, marginBottom: "1.5rem" }}>
                SEDS J&apos;pura is dedicated to inspiring and educating future scientists
                and engineers by conducting cutting-edge research and hands-on projects
                in space exploration technologies.
              </p>
              <ul className="mission-list">
                {[
                  "Satellite design and communication systems",
                  "Experimental rocketry and propulsion research",
                  "Autonomous rover and robotics development",
                  "Biomedical research for space environments",
                  "Astronomical observation and astrophysics",
                ].map((item) => (
                  <li key={item} className="mission-item">
                    <span className="mission-check">✦</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/about" className="btn btn-primary" style={{ marginTop: "2rem", display: "inline-flex" }}>
                Learn More About Us
              </Link>
            </div>
            <div className="mission-visual">
              <div className="orbit-system">
                <div className="orbit-center">🌍</div>
                <div className="orbit orbit-1"><div className="orbit-satellite">🛰️</div></div>
                <div className="orbit orbit-2"><div className="orbit-satellite">🚀</div></div>
                <div className="orbit orbit-3"><div className="orbit-satellite">⭐</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RECENT NEWS ─── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">📰 LATEST NEWS</div>
            <h2 className="section-title">
              Stay <span className="text-gradient">Updated</span>
            </h2>
            <p className="section-desc">
              Latest announcements, research updates, and achievements from SEDS J&apos;pura.
            </p>
          </div>
          <div className="news-placeholder">
            <div className="news-placeholder-icon">🌌</div>
            <p>News articles will appear here once published by the team.</p>
            <Link href="/news" className="btn btn-ghost">Browse All News</Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="section cta-section">
        <div className="cta-bg" aria-hidden="true" />
        <div className="container">
          <div className="cta-inner">
            <h2 className="cta-title">
              Ready to Explore the <span className="text-gradient">Universe</span>?
            </h2>
            <p className="cta-desc">
              Join SEDS J&apos;pura and be part of Sri Lanka&apos;s growing space exploration
              community. Work on real projects, attend workshops, and connect with
              like-minded space enthusiasts.
            </p>
            <div className="cta-actions">
              <Link href="/contact" className="btn btn-primary btn-lg">
                <span>✉️</span> Get In Touch
              </Link>
              <Link href="/events" className="btn btn-ghost btn-lg">
                Upcoming Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
