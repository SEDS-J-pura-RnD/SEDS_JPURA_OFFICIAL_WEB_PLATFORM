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
            Events & <span className="text-gradient">Programs</span>
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
                <Link key={event.id} href={`/events/${event.id}`} className="event-card card">
                  <div className="event-date">
                    <span className="event-day">{new Date(event.startDate).getDate()}</span>
                    <span className="event-month">{new Date(event.startDate).toLocaleDateString("en", { month: "short" }).toUpperCase()}</span>
                  </div>
                  <div className="event-info">
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-desc">{event.description.slice(0, 100)}...</p>
                    {event.location && <div className="event-location">📍 {event.location}</div>}
                    <div className="event-register btn btn-primary btn-sm" style={{ marginTop: "1rem", display: "inline-flex" }}>
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
                  <div key={event.id} className="card" style={{ opacity: 0.7 }}>
                    <div className="badge badge-cosmic" style={{ marginBottom: "0.75rem", display: "inline-flex" }}>Completed</div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.5rem" }}>{event.title}</h3>
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-dim)" }}>
                      {new Date(event.startDate).toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" })}
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
