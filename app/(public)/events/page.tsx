import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Events",
  description: "Discover upcoming and past events organized by SEDS J'pura — workshops, competitions, and more.",
};

async function getEvents() {
  try {
    const now = new Date();
    const [upcoming, past] = await Promise.all([
      prisma.event.findMany({
        where: { isPublished: true, startDate: { gte: now } },
        orderBy: { startDate: "asc" },
      }),
      prisma.event.findMany({
        where: { isPublished: true, startDate: { lt: now } },
        orderBy: { startDate: "desc" },
        take: 6,
      }),
    ]);
    return { upcoming, past };
  } catch {
    return { upcoming: [], past: [] };
  }
}

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="section-tag">📅 EVENTS</div>
          <h1 className="section-title" style={{ textAlign: "center" }}>
            Events &amp; <span className="text-gradient">Programs</span>
          </h1>
          <p className="section-desc">
            Workshops, seminars, competitions, and stargazing sessions — join us for our upcoming events.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ marginBottom: "2rem" }}>
            <span className="text-gradient-stellar">Upcoming</span> Events
          </h2>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗓️</div>
              <h3 className="empty-state-title">No Upcoming Events</h3>
              <p>Stay tuned — events will be announced soon!</p>
            </div>
          ) : (
            <div className="grid-2">
              {upcoming.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="event-card card"
                  style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
                >
                  {/* Banner Image */}
                  <div style={{
                    width: "100%",
                    height: "200px",
                    position: "relative",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.1))",
                    flexShrink: 0,
                  }}>
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "3rem", opacity: 0.2,
                      }}>📅</div>
                    )}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(5,13,26,0.9) 0%, transparent 60%)",
                    }} />
                    {/* Date Chip */}
                    <div style={{
                      position: "absolute", top: "0.75rem", right: "0.75rem",
                      background: "rgba(16,185,129,0.85)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.4rem 0.7rem",
                      textAlign: "center",
                      minWidth: "48px",
                    }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1 }}>
                        {new Date(event.startDate).toLocaleDateString("en-US", { day: "numeric", timeZone: "Asia/Colombo" })}
                      </div>
                      <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.05em" }}>
                        {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", timeZone: "Asia/Colombo" }).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div className="event-info" style={{ flex: 1 }}>
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-desc">{event.description.slice(0, 100)}...</p>
                      {event.location && <div className="event-location">📍 {event.location}</div>}
                    </div>
                    <div className="event-register btn btn-primary btn-sm" style={{ marginTop: "1rem", display: "inline-flex", alignSelf: "flex-start" }}>
                      Register Now →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div style={{ marginTop: "4rem" }}>
              <h2 className="section-title" style={{ marginBottom: "2rem" }}>
                <span className="text-gradient">Past</span> Events
              </h2>
              <div className="grid-3">
                {past.map((event) => (
                  <div key={event.id} className="card" style={{ padding: 0, overflow: "hidden", opacity: 0.75 }}>
                    {event.imageUrl && (
                      <div style={{ width: "100%", height: "120px", overflow: "hidden" }}>
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(40%)" }}
                        />
                      </div>
                    )}
                    <div style={{ padding: "1rem" }}>
                      <div className="badge badge-cosmic" style={{ marginBottom: "0.75rem", display: "inline-flex" }}>Completed</div>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.5rem" }}>{event.title}</h3>
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-dim)" }}>
                        {new Date(event.startDate).toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Colombo" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
