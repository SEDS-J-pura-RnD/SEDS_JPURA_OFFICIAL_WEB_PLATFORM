import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import RegistrationForm from "./RegistrationForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    return {
      title: event?.title || "Event Details",
      description: event?.description || "Join us for SEDS J'pura events, workshops, and stargazing sessions.",
    };
  } catch {
    return { title: "Event Details" };
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let event;
  try {
    event = await prisma.event.findUnique({
      where: { id, isPublished: true },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching event details:", error);
    event = null;
  }

  if (!event) notFound();

  const now = new Date();
  const startDate = new Date(event.startDate);
  const isPast = startDate < now;
  const isFull = event.maxCapacity !== null && event._count.registrations >= event.maxCapacity;

  // Formatting dates
  const eventDateStr = startDate.toLocaleDateString("en-LK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const eventTimeStr = startDate.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  }) + (event.endDate ? ` - ${new Date(event.endDate).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}` : "");

  return (
    <div>
      {/* Dynamic Hero Banner */}
      <div style={{
        width: "100%",
        height: "360px",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 60%), var(--color-space)",
      }}>
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.5 }}
          />
        )}
        {/* Gradient Overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, var(--color-void) 0%, rgba(3,7,18,0.5) 70%, transparent 100%)",
        }} />

        {/* Hero Text */}
        <div style={{ position: "absolute", bottom: "2.5rem", left: 0, right: 0 }}>
          <div className="container">
            <Link
              href="/events"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--color-stellar)",
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "1rem",
                transition: "transform var(--transition-fast)",
              }}
              className="back-link"
            >
              ← Back to Events
            </Link>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {isPast ? (
                <span className="badge badge-cosmic">Completed</span>
              ) : isFull ? (
                <span className="badge badge-laser">Fully Booked</span>
              ) : (
                <span className="badge badge-stellar">Active Booking</span>
              )}
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 4.5vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "0.03em",
              lineHeight: 1.15,
              textShadow: "0 2px 10px rgba(0,0,0,0.6)",
            }}>
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <section style={{ padding: "3rem 0 5rem" }}>
        <div className="container">
          <div className="event-details-grid">
            
            {/* Left: About / Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div className="card">
                <h2 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  letterSpacing: "0.05em",
                  color: "var(--color-stellar)",
                  marginBottom: "1.25rem",
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "0.5rem",
                }}>
                  About the Event
                </h2>
                <div style={{
                  color: "var(--color-text-muted)",
                  lineHeight: 1.8,
                  fontSize: "0.975rem",
                  whiteSpace: "pre-wrap",
                }}>
                  {event.description}
                </div>
              </div>
            </div>

            {/* Right: Registration Form & Details Card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Event Metadata Card */}
              <div className="card" style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--color-border)" }}>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.875rem",
                  letterSpacing: "0.05em",
                  color: "var(--color-cosmic)",
                  marginBottom: "1.25rem",
                  textTransform: "uppercase",
                }}>
                  Event Info
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.25rem" }}>📅</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Date</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{eventDateStr}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.25rem" }}>🕐</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Time</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{eventTimeStr}</div>
                    </div>
                  </div>

                  {event.location && (
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "1.25rem" }}>📍</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Venue</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", whiteSpace: "pre-line" }}>{event.location}</div>
                      </div>
                    </div>
                  )}

                  {event.maxCapacity !== null && (
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "1.25rem" }}>👥</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Availability</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                          {isFull 
                            ? "No Slots Remaining"
                            : `${event.maxCapacity - event._count.registrations} out of ${event.maxCapacity} slots available`
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Form / Status Component */}
              {!isPast ? (
                <RegistrationForm 
                  eventId={event.id} 
                  eventName={event.title} 
                  isFull={isFull} 
                  eventDateStr={eventDateStr}
                  eventTimeStr={eventTimeStr}
                  eventLocation={event.location || "Online"}
                  eventImageUrl={event.imageUrl || ""}
                />
              ) : (
                <div className="card" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                    Event Completed
                  </h3>
                  <p style={{ color: "var(--color-text-dim)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    This event has already taken place. Registration is no longer available.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .event-details-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        .back-link:hover {
          transform: translateX(-4px);
        }
        @media (max-width: 768px) {
          .event-details-grid {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  );
}
