"use client";

import { useState, useTransition } from "react";
import { createEventAction, updateEventAction, deleteEventAction } from "@/lib/actions/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

interface EventRegistration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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
    setStartDateStr(new Date(event.startDate).toISOString().slice(0, 16));
    setEndDateStr(event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "");
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
        "Registration Date": new Date(reg.createdAt).toLocaleString(),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendees");
      
      const maxLens = [25, 25, 30, 15, 25];
      ws["!cols"] = maxLens.map(w => ({ wch: w }));

      const filename = `${selectedEventForRegs.title.replace(/[^a-z0-9]/gi, "_")}_Participation_List.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err: any) {
      alert("Failed to export registrations: " + err.message);
    }
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
      startDate: new Date(startDateStr),
      endDate: endDateStr ? new Date(endDateStr) : undefined,
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
      } catch (err: any) {
        setError(err.message || "Operation failed.");
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
      } catch (err: any) {
        alert(err.message || "Failed to remove event.");
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
        <button onClick={openCreateModal} className="btn btn-primary">
          ➕ Create Event
        </button>
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
                      📍 {event.location || "Online"} · 📅 {new Date(event.startDate).toLocaleString()}
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
          
          <div className="card" style={{ width: "100%", maxWidth: "550px", position: "relative", zIndex: 1, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                👥 Event Attendees
              </h2>
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
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Event: <span style={{ color: "var(--color-stellar)", fontWeight: 600 }}>{selectedEventForRegs.title}</span>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "400px", overflowY: "auto" }}>
              {selectedEventForRegs.registrations.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-dim)", textAlign: "center", paddingBlock: "2rem" }}>
                  No participants registered yet.
                </p>
              ) : (
                selectedEventForRegs.registrations.map((reg) => (
                  <div
                    key={reg.id}
                    style={{
                      padding: "0.75rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{reg.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>{reg.email}</div>
                      {reg.phone && <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>📞 {reg.phone}</div>}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>
                      Registered: {new Date(reg.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
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
