import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Sponsors & Partners",
  description: "Meet the organizations that support SEDS J'pura's mission of space exploration and research.",
};

async function getSponsors() {
  try {
    return await prisma.sponsor.findMany({
      where: { isActive: true },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    });
  } catch {
    return [];
  }
}

const tierColors: Record<string, string> = {
  PLATINUM: "#e2e8f0",
  GOLD: "#f59e0b",
  SILVER: "#94a3b8",
  BRONZE: "#b45309",
  PARTNER: "#6366f1",
};

const tierLabels: Record<string, string> = {
  PLATINUM: "🏆 Platinum Sponsors",
  GOLD: "🥇 Gold Sponsors",
  SILVER: "🥈 Silver Sponsors",
  BRONZE: "🥉 Bronze Sponsors",
  PARTNER: "🤝 Partners",
};

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  const grouped = sponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<string, typeof sponsors>);

  const tiers = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "PARTNER"];

  return (
    <div>
      <section style={{ padding: "4rem 0 2rem", textAlign: "center", background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)" }}>
        <div className="container">
          <div className="section-tag">🤝 PARTNERS</div>
          <h1 className="section-title">
            Our <span className="text-gradient">Sponsors</span>
          </h1>
          <p className="section-desc">
            We are grateful to our sponsors and partners who enable SEDS J&apos;pura to
            pursue cutting-edge space research and inspire the next generation.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {sponsors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌌</div>
              <h3 className="empty-state-title">Sponsor Information Coming Soon</h3>
              <p>Details about our sponsors will be listed here.</p>
            </div>
          ) : (
            tiers.map((tier) => grouped[tier] ? (
              <div key={tier} style={{ marginBottom: "3rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, letterSpacing: "0.08em", color: tierColors[tier], marginBottom: "1.5rem", borderBottom: `1px solid ${tierColors[tier]}30`, paddingBottom: "0.75rem" }}>
                  {tierLabels[tier]}
                </h2>
                <div className="grid-3">
                  {grouped[tier].map((sponsor) => (
                    <a key={sponsor.id} href={sponsor.website || "#"} target="_blank" rel="noopener noreferrer" className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", textDecoration: "none" }}>
                      <div style={{ width: 80, height: 80, borderRadius: "var(--radius-lg)", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", border: `1px solid ${tierColors[tier]}30` }}>
                        {sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "var(--radius-md)" }} /> : "🏢"}
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "0.03em", marginBottom: "0.375rem" }}>{sponsor.name}</div>
                        {sponsor.description && <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{sponsor.description}</p>}
                      </div>
                      <div className={`badge`} style={{ background: `${tierColors[tier]}15`, color: tierColors[tier], border: `1px solid ${tierColors[tier]}30`, marginTop: "auto" }}>{tier}</div>
                    </a>
                  ))}
                </div>
              </div>
            ) : null)
          )}

          {/* Become a sponsor CTA */}
          <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(56,189,248,0.05))", border: "1px solid rgba(99,102,241,0.2)", textAlign: "center", padding: "3rem 2rem", marginTop: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚀</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
              Become a <span className="text-gradient">Sponsor</span>
            </h2>
            <p style={{ color: "var(--color-text-muted)", maxWidth: "500px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
              Support Sri Lanka&apos;s next generation of space scientists and engineers.
              Partner with SEDS J&apos;pura and be part of something extraordinary.
            </p>
            <a href="/contact" className="btn btn-primary btn-lg">
              Get In Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
