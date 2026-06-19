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
  { year: "1980", event: "Global SEDS Founded", desc: "Founded on October 30, 1980 at MIT, Princeton, and Yale to empower students in space exploration." },
  { year: "1982", event: "International Network", desc: "Established as an international student-run space organization during the first conference at GWU." },
  { year: "2018", event: "SEDS Sri Lanka Founded", desc: "Established in September 2018 as the national group of SEDS Earth to promote space advocacy in Sri Lanka." },
  { year: "2020", event: "SEDS J'pura Founded", desc: "Established as the official registered space tech student chapter at the University of Sri Jayewardenepura, Sri Lanka." },
  { year: "2025", event: "Going Digital", desc: "Launched our digital platform to drive collaboration on space tech projects across the university." },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg" aria-hidden="true" />
        <div className="container">
          <div className="about-hero-content">
            <div className="section-tag">WHO WE ARE</div>
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

      {/* Origin & Story */}
      <section className="section" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "4rem" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">GLOBAL ORIGIN TO LOCAL IMPACT</div>
            <h2 className="section-title">
              Our <span className="text-gradient">Story</span> &amp; Identity
            </h2>
          </div>
          <div className="story-content" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px", margin: "0 auto", fontSize: "1.0625rem", lineHeight: "1.8", color: "var(--color-text-muted)" }}>
            <p>
              <strong>Students for the Exploration and Development of Space (SEDS)</strong> is a non-profit international student organization that empowers young people to participate and make an impact in space exploration. SEDS helps students develop their technical and leadership skills by providing opportunities to manage and participate in international projects as well as to attend conferences, publish their work, and develop their professional network, in order to help students become more effective in their present and future careers in industry, academia, government, and education.
            </p>
            <p>
              SEDS was founded as a chapter-based organization in 1980 at MIT by Peter Diamandis, at Princeton University by Scott Scharfman, and at Yale University by Richard Sorkin. SEDS USA was founded as a national group in 1982 by Peter Diamandis, Bob Richards, and Todd Hawley. Today, it is the largest student-run space organization in the world, consisting of an international community of high school, undergraduate, and graduate students from a diverse range of educational backgrounds in chapters all over the globe.
            </p>
            <p>
              As the local collective of the SEDS EARTH organization, <strong>SEDS Sri Lanka</strong> is manned by students and professional volunteers, leading to branches being established in many universities within the country.
            </p>
            <p>
              <strong>SEDS J&apos;pura</strong> is the established and registered chapter of SEDS Sri Lanka within the University of Sri Jayewardenepura. With a highly motivated student base, SEDS J&apos;pura targets like-minded individuals to join the program, creating a beneficial impact for every party concerned.
            </p>
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <a href="https://en.wikipedia.org/wiki/Students_for_the_Exploration_and_Development_of_Space" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: "inline-flex" }}>
                Read SEDS Origin on Wikipedia
              </a>
            </div>
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
            <div className="section-tag">RESEARCH DIVISIONS</div>
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
            <div className="section-tag">OUR HISTORY</div>
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
