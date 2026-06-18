import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about SEDS J'pura — our vision, mission, history, and five research divisions in space exploration.",
};

const divisions = [
  {
    id: "it-satellite",
    icon: "🛰️",
    name: "IT & Satellite Division",
    color: "#6366f1",
    areas: [
      "Satellite communication systems",
      "Embedded systems & IoT",
      "Ground station software",
      "Satellite data processing",
      "Space networking protocols",
    ],
    description:
      "Developing cutting-edge satellite communication technologies and IoT systems for space applications. Our team designs, builds, and tests satellite subsystems and ground control infrastructure.",
  },
  {
    id: "rocketry",
    icon: "🚀",
    name: "Rocketry Division",
    color: "#f59e0b",
    areas: [
      "Rocket propulsion systems",
      "Aerodynamics & CFD",
      "Flight simulation & modeling",
      "Launch systems & safety",
      "Solid & liquid propellants",
    ],
    description:
      "Designing, building, and launching experimental rockets. From basic model rocketry to advanced experimental propulsion research, our rocketry team pushes boundaries.",
  },
  {
    id: "rover-robotics",
    icon: "🤖",
    name: "Rover & Robotics Division",
    color: "#10b981",
    areas: [
      "Autonomous rover design",
      "Navigation & path planning",
      "Embedded hardware integration",
      "Computer vision & AI",
      "Robotics control systems",
    ],
    description:
      "Building autonomous robots and planetary rovers that can operate in extreme environments. We participate in international rover competitions and push the limits of autonomous systems.",
  },
  {
    id: "biomedical",
    icon: "🧬",
    name: "Biomedical Division",
    color: "#ec4899",
    areas: [
      "Space medicine research",
      "Life support systems",
      "Biomedical sensors & devices",
      "Human physiology in space",
      "Microgravity biology",
    ],
    description:
      "Researching the intersection of medicine and space exploration. We study how the human body adapts to space environments and develop technologies to keep astronauts healthy.",
  },
  {
    id: "observation",
    icon: "🔭",
    name: "Observation Division",
    color: "#38bdf8",
    areas: [
      "Astronomical observation",
      "Telescope systems & optics",
      "Astrophysics research",
      "Space data analysis",
      "Public outreach programs",
    ],
    description:
      "Exploring the cosmos through observation and data analysis. We operate telescopes, analyze space data, and conduct astrophysics research while inspiring public interest in astronomy.",
  },
];

const timeline = [
  { year: "2020", event: "SEDS J'pura Founded", desc: "Established as the space research student chapter at USJP." },
  { year: "2021", event: "First Rocket Launch", desc: "Successfully launched our first experimental rocket at a national competition." },
  { year: "2022", event: "Satellite Project Initiated", desc: "Began development of a CubeSat communication system." },
  { year: "2023", event: "International Competition", desc: "Participated in the Asia-Pacific Rover Challenge representing Sri Lanka." },
  { year: "2024", event: "5 Divisions Formed", desc: "Expanded to five specialized research divisions with 100+ members." },
  { year: "2025", event: "Platform Launch", desc: "Launched our digital management platform to better serve members." },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg" aria-hidden="true" />
        <div className="container">
          <div className="about-hero-content">
            <div className="section-tag">🌌 WHO WE ARE</div>
            <h1 className="section-title" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", textAlign: "center" }}>
              About <span className="text-gradient">SEDS J&apos;pura</span>
            </h1>
            <p className="section-desc">
              The Students for the Exploration and Development of Space at the
              University of Sri Jayewardenepura — where curiosity meets the cosmos.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section">
        <div className="container">
          <div className="vm-grid">
            <div className="card card-glow">
              <div className="vm-icon">🌟</div>
              <h2 className="vm-title">Our Vision</h2>
              <p className="vm-text">
                To be the leading space research and technology student organization
                in Sri Lanka, inspiring a new generation of space scientists,
                engineers, and explorers who will contribute to humanity&apos;s
                future among the stars.
              </p>
            </div>
            <div className="card card-stellar">
              <div className="vm-icon">🎯</div>
              <h2 className="vm-title">Our Mission</h2>
              <p className="vm-text">
                To educate, inspire, and empower students through hands-on research
                in space exploration technologies — conducting real experiments,
                building functional prototypes, and participating in international
                competitions to make Sri Lanka a player in the global space community.
              </p>
            </div>
          </div>

          {/* Objectives */}
          <div style={{ marginTop: "3rem" }}>
            <h2 className="section-title text-center" style={{ marginBottom: "2rem" }}>
              Our <span className="text-gradient">Objectives</span>
            </h2>
            <div className="objectives-grid">
              {[
                { icon: "🔬", title: "Research", desc: "Conduct original scientific research in space-related fields." },
                { icon: "🛠️", title: "Build", desc: "Design and build functional hardware — rockets, rovers, satellites." },
                { icon: "🏆", title: "Compete", desc: "Represent Sri Lanka at international space engineering competitions." },
                { icon: "📚", title: "Educate", desc: "Organize workshops, seminars, and outreach programs." },
                { icon: "🤝", title: "Collaborate", desc: "Partner with industry, academia, and international SEDS chapters." },
                { icon: "🌏", title: "Inspire", desc: "Inspire the next generation of Sri Lankan space explorers." },
              ].map((obj) => (
                <div key={obj.title} className="objective-card">
                  <div className="objective-icon">{obj.icon}</div>
                  <h3 className="objective-title">{obj.title}</h3>
                  <p className="objective-desc">{obj.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divisions */}
      <section className="section" id="divisions">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">⚗️ RESEARCH DIVISIONS</div>
            <h2 className="section-title">
              Our <span className="text-gradient">Five Divisions</span>
            </h2>
            <p className="section-desc">
              Each division is a specialized team pursuing cutting-edge research
              in a distinct area of space science and engineering.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {divisions.map((div, i) => (
              <div key={div.id} id={div.id} className="division-row" style={{ flexDirection: i % 2 !== 0 ? "row-reverse" : "row" }}>
                <div className="division-row-visual" style={{ borderColor: `${div.color}33`, background: `linear-gradient(135deg, ${div.color}10, ${div.color}03)` }}>
                  <div className="division-row-icon" style={{ fontSize: "4rem", filter: `drop-shadow(0 0 20px ${div.color}60)` }}>
                    {div.icon}
                  </div>
                </div>
                <div className="division-row-content">
                  <h3 className="division-row-name" style={{ color: div.color }}>{div.name}</h3>
                  <p className="division-row-desc">{div.description}</p>
                  <ul className="division-areas">
                    {div.areas.map((area) => (
                      <li key={area} className="division-area">
                        <span style={{ color: div.color }}>▶</span> {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">📅 OUR HISTORY</div>
            <h2 className="section-title">
              Our <span className="text-gradient">Journey</span>
            </h2>
          </div>
          <div className="timeline">
            {timeline.map((item, i) => (
              <div key={item.year} className={`timeline-item ${i % 2 === 0 ? "left" : "right"}`}>
                <div className="timeline-content card">
                  <div className="timeline-year">{item.year}</div>
                  <h3 className="timeline-event">{item.event}</h3>
                  <p className="timeline-desc">{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="timeline-line" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingBottom: "5rem" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">Join the <span className="text-gradient">Mission</span></h2>
          <p className="section-desc">Ready to explore the cosmos with us?</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            <Link href="/contact" className="btn btn-primary btn-lg">Get In Touch</Link>
            <Link href="/projects" className="btn btn-secondary btn-lg">See Our Projects</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
