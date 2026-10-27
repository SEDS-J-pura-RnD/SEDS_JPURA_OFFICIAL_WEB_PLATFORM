"use client";

import { useState, useTransition } from "react";
import { createEventAction, updateEventAction, deleteEventAction } from "@/lib/actions/admin";
import { checkInAttendeeAction, undoCheckInAttendeeAction } from "@/lib/actions/events";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

interface EventRegistration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  checkedIn?: boolean;
  checkedInAt?: Date | null;
  createdAt: Date;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string | null;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date | null;
  isPublished: boolean;
  maxCapacity: number | null;
  createdAt: Date;
  registrations: EventRegistration[];
}

function toColomboDateTimeString(date: Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  try {
    const options = {
      timeZone: "Asia/Colombo",
      year: "numeric" as const,
      month: "2-digit" as const,
      day: "2-digit" as const,
      hour: "2-digit" as const,
      minute: "2-digit" as const,
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(d);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    let normalizedHour = hour || "00";
    if (normalizedHour === "24") {
      normalizedHour = "00";
    }
    return `${year}-${month}-${day}T${normalizedHour}:${minute}`;
  } catch (e) {
    console.error("Error formatting Colombo date time string:", e);
    return d.toISOString().slice(0, 16);
  }
}

function parseDateInColomboTime(dateTimeStr: string): Date {
  return new Date(dateTimeStr + "+05:30");
}

interface EventsClientProps {
  initialEvents: EventItem[];
}

export default function EventsClient({ initialEvents }: EventsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const [regsModalOpen, setRegsModalOpen] = useState(false);
  const [selectedEventForRegs, setSelectedEventForRegs] = useState<EventItem | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [maxCapacityStr, setMaxCapacityStr] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredEvents = initialEvents.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(search.toLowerCase()))
  );

  function openCreateModal() {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setImageUrl("");
    setStartDateStr("");
    setEndDateStr("");
    setMaxCapacityStr("");
    setIsPublished(false);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(event: EventItem) {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setLocation(event.location || "");
    setImageUrl(event.imageUrl || "");
    setStartDateStr(toColomboDateTimeString(event.startDate));
    setEndDateStr(event.endDate ? toColomboDateTimeString(event.endDate) : "");
    setMaxCapacityStr(event.maxCapacity ? String(event.maxCapacity) : "");
    setIsPublished(event.isPublished);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openRegsModal(event: EventItem) {
    setSelectedEventForRegs(event);
    setRegsModalOpen(true);
  }

  async function handleExportRegistrations() {
    if (!selectedEventForRegs || selectedEventForRegs.registrations.length === 0) return;

    try {
      const XLSX = await import("xlsx");
      
      const data = selectedEventForRegs.registrations.map(reg => ({
        "Registration ID": reg.id,
        "Attendee Name": reg.name,
        "Attendee Email": reg.email,
        "Attendee Phone": reg.phone || "N/A",
        "Registration Date": new Date(reg.createdAt).toLocaleString("en-LK", { timeZone: "Asia/Colombo" }),
        "Admission Status": reg.checkedIn ? "Checked In" : "Not Admitted",
        "Admission Time": reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString("en-LK", { timeZone: "Asia/Colombo" }) : "N/A",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendees");
      
      const maxLens = [25, 25, 30, 15, 25, 18, 25];
      ws["!cols"] = maxLens.map(w => ({ wch: w }));

      const filename = `${selectedEventForRegs.title.replace(/[^a-z0-9]/gi, "_")}_Participation_List.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert("Failed to export registrations: " + errorMsg);
    }
  }

  async function handleToggleAttendeeCheckIn(regId: string, currentStatus: boolean) {
    if (!selectedEventForRegs) return;
    startTransition(async () => {
      try {
        if (currentStatus) {
          await undoCheckInAttendeeAction(regId);
        } else {
          await checkInAttendeeAction(regId);
        }
        // Update local state in modal
        setSelectedEventForRegs(prev => {
          if (!prev) return null;
          return {
            ...prev,
            registrations: prev.registrations.map(r => {
              if (r.id === regId) {
                return {
                  ...r,
                  checkedIn: !currentStatus,
                  checkedInAt: !currentStatus ? new Date() : null,
                };
              }
              return r;
            }),
          };
        });
        router.refresh();
      } catch (e) {
        console.error("Failed to toggle check-in:", e);
      }
    });
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !description.trim() || !startDateStr) {
      setError("Please fill in title, description, and start date.");
      return;
    }

    const data = {
      title,
      description,
      location: location || undefined,
      imageUrl: imageUrl || undefined,
      startDate: parseDateInColomboTime(startDateStr),
      endDate: endDateStr ? parseDateInColomboTime(endDateStr) : undefined,
      maxCapacity: maxCapacityStr ? parseInt(maxCapacityStr) : undefined,
      isPublished,
    };

    startTransition(async () => {
      try {
        if (editingEvent) {
          const res = await updateEventAction(editingEvent.id, data);
          if (res.success) {
            setSuccess("Event updated successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        } else {
          const res = await createEventAction(data);
          if (res.success) {
            setSuccess("Event created successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Operation failed.";
        setError(errorMsg);
      }
    });
  }

  async function handleDeleteEvent(id: string, titleStr: string) {
    if (!confirm(`Are you absolutely sure you want to permanently delete event '${titleStr}'?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteEventAction(id);
        if (res.success) {
          router.refresh();
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to remove event.";
        alert(errorMsg);
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">📅 Events Center</h1>
          <p className="page-subtitle">Schedule telescope observations, rocketry launches, and conferences.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/admin/events/verify"
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <span>🎟️</span>
            <span>Ticket Scanner & QR</span>
          </Link>
          <button onClick={openCreateModal} className="btn btn-primary">
            ➕ Create Event
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search events by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Events List */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", paddingBlock: "5rem" }} className="card">
            <span>📅</span>
            <h3 style={{ marginTop: "1rem", fontFamily: "var(--font-display)", fontWeight: 700 }}>No Events Scheduled</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBlock: "0.5rem" }}>Schedule your first observational workshop.</p>
            <button onClick={openCreateModal} className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Create Event
            </button>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {event.imageUrl && (
                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--color-space)", flexShrink: 0 }}>
                      <img src={event.imageUrl} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700 }}>
                      {event.title}
                    </h2>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
                      📍 {event.location || "Online"} · 📅 {new Date(event.startDate).toLocaleString("en-LK", { timeZone: "Asia/Colombo" })}
                      {event.maxCapacity && ` · Capacity: ${event.registrations.length}/${event.maxCapacity}`}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className={`badge ${event.isPublished ? "badge-aurora" : "badge-nebula"}`}>
                    {event.isPublished ? "Published" : "Draft"}
                  </span>
                  <button onClick={() => openRegsModal(event)} className="btn btn-secondary btn-sm">
                    👥 Registrations ({event.registrations.length})
                  </button>
                  <button onClick={() => openEditModal(event)} className="btn btn-ghost btn-sm">
                    Configure
                  </button>
                  <button onClick={() => handleDeleteEvent(event.id, event.title)} className="btn btn-danger btn-sm" disabled={isPending}>
                    🗑️
                  </button>
                </div>
              </div>


              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                {event.description.length > 200 ? `${event.description.slice(0, 200)}...` : event.description}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Creation / Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => !isPending && setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "600px", position: "relative", zIndex: 1, maxHeight: "95vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {editingEvent ? "⚙️ Edit Mission Parameters" : "📅 Design Event Operations"}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="evt-title">Event Title</label>
                <input
                  id="evt-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Telescope Night & Celestial Mapping"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="evt-desc">Description</label>
                <textarea
                  id="evt-desc"
                  className="form-input"
                  placeholder="Detailed event mission directives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-loc">Location</label>
                  <input
                    id="evt-loc"
                    type="text"
                    className="form-input"
                    placeholder="e.g. FOT Physics Lab or Zoom"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-cap">Max Capacity (blank for unlimited)</label>
                  <input
                    id="evt-cap"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={maxCapacityStr}
                    onChange={(e) => setMaxCapacityStr(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-start">Start Date & Time</label>
                  <input
                    id="evt-start"
                    type="datetime-local"
                    className="form-input"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-end">End Date & Time</label>
                  <input
                    id="evt-end"
                    type="datetime-local"
                    className="form-input"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <ImageUpload
                label="Event Banner Image"
                value={imageUrl}
                onChange={setImageUrl}
                disabled={isPending}
                aspectRatio={16 / 9}
              />

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  disabled={isPending}
                />
                <span>Broadcast event publicly immediately</span>
              </label>

              {error && (
                <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.8125rem" }}>
                  ❌ {error}
                </div>
              )}

              {success && (
                <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "#6ee7b7", fontSize: "0.8125rem" }}>
                  ✔️ {success}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Broadcasting..." : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrations List Modal */}
      {regsModalOpen && selectedEventForRegs && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => setRegsModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "620px", position: "relative", zIndex: 1, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                  👥 Event Attendees
                </h2>
                <div style={{ fontSize: "0.75rem", color: "var(--color-aurora)", fontWeight: 600, marginTop: "0.2rem" }}>
                  Admission: {selectedEventForRegs.registrations.filter(r => r.checkedIn).length} / {selectedEventForRegs.registrations.length} Admitted
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Link
                  href="/admin/events/verify"
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                >
                  📷 Scan Tickets
                </Link>
                {selectedEventForRegs.registrations.length > 0 && (
                  <button
                    onClick={handleExportRegistrations}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                  >
                    📥 Export to Excel
                  </button>
                )}
              </div>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              Event: <span style={{ color: "var(--color-stellar)", fontWeight: 600 }}>{selectedEventForRegs.title}</span>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "420px", overflowY: "auto" }}>
              {selectedEventForRegs.registrations.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-dim)", textAlign: "center", paddingBlock: "2rem" }}>
                  No participants registered yet.
                </p>
              ) : (
                selectedEventForRegs.registrations.map((reg) => (
                  <div
                    key={reg.id}
                    style={{
                      padding: "0.75rem 1rem",
                      background: reg.checkedIn ? "rgba(16, 185, 129, 0.04)" : "rgba(255,255,255,0.02)",
                      border: reg.checkedIn ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{reg.name}</span>
                        {reg.checkedIn ? (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#34d399",
                              textTransform: "uppercase",
                            }}
                          >
                            ✓ Admitted
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              background: "rgba(255, 255, 255, 0.05)",
                              color: "var(--color-text-dim)",
                            }}
                          >
                            Not Admitted
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.15rem" }}>
                        {reg.email} {reg.phone && `· 📞 ${reg.phone}`}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: "0.2rem" }}>
                        Registered: {new Date(reg.createdAt).toLocaleDateString("en-LK", { timeZone: "Asia/Colombo" })}
                        {reg.checkedIn && reg.checkedInAt && (
                          <span style={{ color: "#34d399", marginLeft: "0.5rem" }}>
                            · Checked In: {new Date(reg.checkedInAt).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => handleToggleAttendeeCheckIn(reg.id, !!reg.checkedIn)}
                        disabled={isPending}
                        className={`btn btn-sm ${reg.checkedIn ? "btn-secondary" : "btn-primary"}`}
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem", minWidth: "90px" }}
                      >
                        {reg.checkedIn ? "↩️ Undo" : "🎟️ Check In"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" onClick={() => setRegsModalOpen(false)} className="btn btn-ghost">
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
