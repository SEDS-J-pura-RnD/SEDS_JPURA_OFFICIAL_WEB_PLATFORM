"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import jsQR from "jsqr";
import Link from "next/link";
import {
  verifyEventTicketAction,
  checkInAttendeeAction,
  undoCheckInAttendeeAction,
  type TicketVerificationResponse,
} from "@/lib/actions/events";
import { extractTicketIdFromPayload } from "@/lib/ticket-parser";

interface EventSummary {
  id: string;
  title: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  imageUrl: string | null;
  maxCapacity: number | null;
  totalRegistrations: number;
  checkedInCount: number;
}

interface TicketScannerClientProps {
  events: EventSummary[];
}

export default function TicketScannerClient({ events }: TicketScannerClientProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("camera");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [autoAdmit, setAutoAdmit] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Stats state
  const [eventStats, setEventStats] = useState<Record<string, { total: number; checkedIn: number }>>(() => {
    const map: Record<string, { total: number; checkedIn: number }> = {};
    for (const e of events) {
      map[e.id] = { total: e.totalRegistrations, checkedIn: e.checkedInCount };
    }
    return map;
  });

  // Recent scans feed
  const [recentScans, setRecentScans] = useState<
    Array<{
      id: string;
      regId: string;
      name: string;
      email: string;
      eventTitle: string;
      timestamp: Date;
      status: "admitted" | "already" | "mismatch" | "invalid";
    }>
  >([]);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPendingAction, startTransition] = useTransition();
  const [scanResult, setScanResult] = useState<TicketVerificationResponse | null>(null);
  const [lastScannedPayload, setLastScannedPayload] = useState<string>("");
  const [manualInput, setManualInput] = useState("");
  const [scannerPaused, setScannerPaused] = useState(false);

  // Camera references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastProcessedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const scanFrameRef = useRef<() => void>(() => {});

  // Web Audio Synth for sound effects
  const playSound = useCallback((type: "success" | "warning" | "error") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (type === "success") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = "sine";
        osc2.type = "triangle";
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08); // A5
        osc2.frequency.setValueAtTime(880.0, ctx.currentTime);
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 0.3);
      } else if (type === "warning") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio autoplay restrictions
    }
  }, [soundEnabled]);

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle ticket verification and admission logic
  const handleVerifyTicket = useCallback(
    async (payload: string) => {
      const trimmed = payload.trim();
      if (!trimmed) return;

      setIsVerifying(true);
      setScannerPaused(true);
      setLastScannedPayload(trimmed);

      try {
        const res = await verifyEventTicketAction(trimmed, selectedEventId);
        setScanResult(res);

        if (res.status === "VALID") {
          // If auto-admit is enabled, immediately admit attendee
          if (autoAdmit && res.registration) {
            playSound("success");
            const admitRes = await checkInAttendeeAction(res.registration.id);
            if (admitRes.success && admitRes.registration) {
              // Update local state
              setEventStats((prev) => {
                const cur = prev[admitRes.registration.eventId] || { total: 0, checkedIn: 0 };
                return {
                  ...prev,
                  [admitRes.registration.eventId]: { ...cur, checkedIn: cur.checkedIn + 1 },
                };
              });

              setRecentScans((prev) => [
                {
                  id: crypto.randomUUID(),
                  regId: admitRes.registration.id,
                  name: admitRes.registration.name,
                  email: admitRes.registration.email,
                  eventTitle: res.event?.title || "Event",
                  timestamp: new Date(),
                  status: "admitted",
                },
                ...prev.slice(0, 19),
              ]);
            }
          } else {
            playSound("success");
          }
        } else if (res.status === "ALREADY_CHECKED_IN") {
          playSound("warning");
          if (res.registration) {
            setRecentScans((prev) => [
              {
                id: crypto.randomUUID(),
                regId: res.registration!.id,
                name: res.registration!.name,
                email: res.registration!.email,
                eventTitle: res.event?.title || "Event",
                timestamp: new Date(),
                status: "already",
              },
              ...prev.slice(0, 19),
            ]);
          }
        } else if (res.status === "EVENT_MISMATCH") {
          playSound("error");
          if (res.registration) {
            setRecentScans((prev) => [
              {
                id: crypto.randomUUID(),
                regId: res.registration!.id,
                name: res.registration!.name,
                email: res.registration!.email,
                eventTitle: res.event?.title || "Event",
                timestamp: new Date(),
                status: "mismatch",
              },
              ...prev.slice(0, 19),
            ]);
          }
        } else {
          playSound("error");
          setRecentScans((prev) => [
            {
              id: crypto.randomUUID(),
              regId: trimmed,
              name: "Unknown / Invalid",
              email: "N/A",
              eventTitle: "Unknown Event",
              timestamp: new Date(),
              status: "invalid",
            },
            ...prev.slice(0, 19),
          ]);
        }
      } catch (e) {
        console.error("Verification error:", e);
        setScanResult({
          success: false,
          status: "ERROR",
          error: "An unexpected network or server error occurred.",
        });
        playSound("error");
      } finally {
        setIsVerifying(false);
      }
    },
    [autoAdmit, playSound, selectedEventId]
  );

  // Manual Check-In Action
  const handleManualCheckIn = (regId: string) => {
    startTransition(async () => {
      const res = await checkInAttendeeAction(regId);
      if (res.success && res.registration) {
        playSound("success");
        setEventStats((prev) => {
          const cur = prev[res.registration.eventId] || { total: 0, checkedIn: 0 };
          return {
            ...prev,
            [res.registration.eventId]: { ...cur, checkedIn: cur.checkedIn + 1 },
          };
        });

        // Update result state to admitted
        setScanResult((prev) => {
          if (!prev || !prev.registration) return prev;
          return {
            ...prev,
            status: "ALREADY_CHECKED_IN",
            registration: {
              ...prev.registration,
              checkedIn: true,
              checkedInAt: new Date(),
            },
            message: "Attendee was successfully checked in just now.",
          };
        });

        setRecentScans((prev) => [
          {
            id: crypto.randomUUID(),
            regId: res.registration.id,
            name: res.registration.name,
            email: res.registration.email,
            eventTitle: scanResult?.event?.title || "Event",
            timestamp: new Date(),
            status: "admitted",
          },
          ...prev.slice(0, 19),
        ]);
      }
    });
  };

  // Revert / Undo Check-in Action
  const handleUndoCheckIn = (regId: string) => {
    startTransition(async () => {
      const res = await undoCheckInAttendeeAction(regId);
      if (res.success && res.registration) {
        playSound("warning");
        setEventStats((prev) => {
          const cur = prev[res.registration.eventId] || { total: 0, checkedIn: 0 };
          return {
            ...prev,
            [res.registration.eventId]: { ...cur, checkedIn: Math.max(0, cur.checkedIn - 1) },
          };
        });

        setScanResult((prev) => {
          if (!prev || !prev.registration) return prev;
          return {
            ...prev,
            status: "VALID",
            registration: {
              ...prev.registration,
              checkedIn: false,
              checkedInAt: null,
            },
            message: "Check-in reverted. Attendee is now marked as not checked in.",
          };
        });
      }
    });
  };

  // Resume camera scanning for next ticket
  const resumeScanning = () => {
    setScanResult(null);
    setScannerPaused(false);
    lastProcessedRef.current = { code: "", time: 0 };
  };

  // Frame processing loop for camera
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(() => scanFrameRef.current());
      return;
    }

    if (scannerPaused) {
      animFrameRef.current = requestAnimationFrame(() => scanFrameRef.current());
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(() => scanFrameRef.current());
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      const payload = code.data.trim();
      const now = Date.now();

      // Debounce identical scans within 3 seconds
      if (lastProcessedRef.current.code !== payload || now - lastProcessedRef.current.time > 3000) {
        lastProcessedRef.current = { code: payload, time: now };
        handleVerifyTicket(payload);
      }
    }

    animFrameRef.current = requestAnimationFrame(() => scanFrameRef.current());
  }, [handleVerifyTicket, scannerPaused]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        animFrameRef.current = requestAnimationFrame(() => scanFrameRef.current());
      }
    } catch (err) {
      console.error("Camera access failed:", err);
    }
  }, [facingMode, stopCamera]);

  // Handle active tab change
  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  // Handle image file upload for QR scanning
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          handleVerifyTicket(code.data);
        } else {
          setScanResult({
            success: false,
            status: "INVALID",
            error: "No clear QR code could be detected in the uploaded image. Please try a clearer photo.",
          });
          playSound("error");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Selected event statistics
  const currentEvent = events.find((e) => e.id === selectedEventId);
  const currentStats =
    selectedEventId === "all"
      ? Object.values(eventStats).reduce(
          (acc, cur) => ({ total: acc.total + cur.total, checkedIn: acc.checkedIn + cur.checkedIn }),
          { total: 0, checkedIn: 0 }
        )
      : eventStats[selectedEventId] || { total: 0, checkedIn: 0 };

  const checkInPercent =
    currentStats.total > 0 ? Math.round((currentStats.checkedIn / currentStats.total) * 100) : 0;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Hidden canvas for image analysis */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link
              href="/admin/events"
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-dim)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              ← Back to Events
            </Link>
          </div>
          <h1 className="page-title">🎟️ Event Ticket Scanner & Verification</h1>
          <p className="page-subtitle">
            Scan attendee QR codes with your device camera or lookup tickets to grant door admission.
          </p>
        </div>

        {/* Global Sound & Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "0.8125rem" }}
            title={soundEnabled ? "Mute chimes" : "Enable chimes"}
          >
            {soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF"}
          </button>
        </div>
      </div>

      {/* Event Selection & Live Admissions Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(56,189,248,0.04) 100%)",
          borderColor: "rgba(99,102,241,0.25)",
          marginBottom: "1.5rem",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(250px, 1fr) 2fr",
            gap: "1.5rem",
            alignItems: "center",
          }}
        >
          <div>
            <label
              htmlFor="target-event"
              style={{
                display: "block",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-stellar)",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Active Event Filter:
            </label>
            <select
              id="target-event"
              className="form-input"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setScanResult(null);
              }}
              style={{ fontWeight: 600, background: "var(--color-space)" }}
            >
              <option value="all">🌐 All SEDS Events (Global Scan)</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({new Date(evt.startDate).toLocaleDateString("en-LK")})
                </option>
              ))}
            </select>
            {currentEvent && currentEvent.location && (
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.35rem" }}>
                📍 {currentEvent.location}
              </div>
            )}
          </div>

          {/* Real-time Attendance Progress */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "0.4rem",
              }}
            >
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                Attendance Progress:{" "}
                <span style={{ fontWeight: 700, color: "var(--color-stellar)" }}>
                  {currentStats.checkedIn}
                </span>{" "}
                of {currentStats.total} Admitted
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-aurora)" }}>
                {checkInPercent}%
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: "10px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "5px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  width: `${checkInPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #6366f1, #38bdf8, #10b981)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "var(--color-text-dim)",
                marginTop: "0.4rem",
              }}
            >
              <span>🎟️ Total Registrations: {currentStats.total}</span>
              <span>
                ⏳ Remaining to Arrive: {Math.max(0, currentStats.total - currentStats.checkedIn)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Scanner Box on Left, Results on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.5rem" }}>
        {/* Left Column: QR Scanner & Input Modes */}
        <div className="card" style={{ padding: "1.5rem" }}>
          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--color-border)",
              marginBottom: "1.25rem",
              gap: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab("camera");
                resumeScanning();
              }}
              className={`btn btn-sm ${activeTab === "camera" ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1 }}
            >
              📷 Live Camera
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("upload");
                setScannerPaused(true);
              }}
              className={`btn btn-sm ${activeTab === "upload" ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1 }}
            >
              📁 Upload Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("manual");
                setScannerPaused(true);
              }}
              className={`btn btn-sm ${activeTab === "manual" ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1 }}
            >
              ⌨️ Search / Manual
            </button>
          </div>

          {/* TAB 1: LIVE CAMERA VIEW */}
          {activeTab === "camera" && (
            <div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4/3",
                  background: "#000",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "2px solid rgba(99, 102, 241, 0.4)",
                  boxShadow: "0 0 25px rgba(99, 102, 241, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <video
                  ref={videoRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                {/* Cosmic Scanning Reticle Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: "15%",
                    border: "2px dashed rgba(56, 189, 248, 0.8)",
                    borderRadius: "12px",
                    pointerEvents: "none",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  {/* Corner brackets */}
                  <div
                    style={{
                      position: "absolute",
                      top: -2,
                      left: -2,
                      width: 20,
                      height: 20,
                      borderTop: "4px solid #38bdf8",
                      borderLeft: "4px solid #38bdf8",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderTop: "4px solid #38bdf8",
                      borderRight: "4px solid #38bdf8",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      left: -2,
                      width: 20,
                      height: 20,
                      borderBottom: "4px solid #38bdf8",
                      borderLeft: "4px solid #38bdf8",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderBottom: "4px solid #38bdf8",
                      borderRight: "4px solid #38bdf8",
                    }}
                  />

                  {/* Animated laser scan bar (only active when not paused) */}
                  {!scannerPaused && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: "linear-gradient(90deg, transparent, #38bdf8, #6366f1, transparent)",
                        boxShadow: "0 0 10px #38bdf8",
                        animation: "laserScan 2.5s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>

                {/* Paused state message */}
                {scannerPaused && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(3, 7, 18, 0.75)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ fontSize: "1.75rem" }}>⏸️</div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff" }}>
                      Scan Detected
                    </div>
                    <button
                      type="button"
                      onClick={resumeScanning}
                      className="btn btn-primary btn-sm"
                      style={{
                        padding: "0.5rem 1.25rem",
                        boxShadow: "0 0 15px rgba(99,102,241,0.5)",
                      }}
                    >
                      ▶️ Scan Next Attendee
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Controls Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: "0.75rem" }}
                >
                  🔄 Flip Camera ({facingMode === "environment" ? "Rear" : "Front"})
                </button>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoAdmit}
                    onChange={(e) => setAutoAdmit(e.target.checked)}
                  />
                  <span>⚡ Auto-Admit on Scan</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE / PHOTO VIEW */}
          {activeTab === "upload" && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "3rem 1.5rem",
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.02)",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🖼️</div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                  Upload Ticket QR Code
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  Click to browse photo or screenshot of attendee&apos;s ticket
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "1rem" }}
                >
                  Choose Image File
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL SEARCH / TICKET ID VIEW */}
          {activeTab === "manual" && (
            <div style={{ padding: "1.5rem 0" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualInput.trim()) {
                    handleVerifyTicket(manualInput);
                  }
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="manual-code">
                    Ticket ID, Registration Code, or Attendee Email
                  </label>
                  <input
                    id="manual-code"
                    type="text"
                    className="form-input"
                    placeholder="e.g. cm... or user@example.com"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    required
                  />
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-dim)",
                      marginTop: "0.35rem",
                    }}
                  >
                    You can paste ticket links, raw registration IDs, or attendee emails.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "1rem" }}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Looking up..." : "🔍 Verify Ticket"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Scan Result & Quick Admission */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Card: Verification Status */}
          <div className="card" style={{ padding: "1.5rem", position: "relative" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.875rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--color-text-muted)",
                marginBottom: "1rem",
              }}
            >
              📋 VERIFICATION RESULT
            </h2>

            {isVerifying && (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <span className="spinner" style={{ width: 32, height: 32, margin: "0 auto 1rem" }} />
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  Checking ticket record in database...
                </p>
              </div>
            )}

            {!isVerifying && !scanResult && (
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem 1.5rem",
                  color: "var(--color-text-dim)",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎫</div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                  Waiting for Next Ticket
                </div>
                <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
                  Point your camera at the QR code on the attendee&apos;s digital or printed ticket.
                </p>
              </div>
            )}

            {!isVerifying && scanResult && (
              <div>
                {/* 1. VALID TICKET - SUCCESS */}
                {scanResult.status === "VALID" && scanResult.registration && (
                  <div
                    style={{
                      padding: "1.25rem",
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "rgba(16, 185, 129, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#10b981",
                          fontSize: "1.125rem",
                        }}
                      >
                        ✓
                      </div>
                      <div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#34d399" }}>
                          VALID TICKET
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Eligible for immediate admission
                        </div>
                      </div>
                    </div>

                    {/* Attendee Details Card */}
                    <div
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        padding: "1rem",
                        borderRadius: "var(--radius-md)",
                        marginBlock: "0.75rem",
                      }}
                    >
                      <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff" }}>
                        {scanResult.registration.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-stellar)",
                          marginTop: "0.25rem",
                        }}
                      >
                        ✉️ {scanResult.registration.email}
                      </div>
                      {scanResult.registration.phone && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            marginTop: "0.25rem",
                          }}
                        >
                          📞 {scanResult.registration.phone}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-dim)",
                          marginTop: "0.5rem",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          paddingTop: "0.5rem",
                        }}
                      >
                        Event: <strong>{scanResult.event?.title}</strong>
                      </div>
                    </div>

                    {/* Action Button: Admit Attendee */}
                    {!scanResult.registration.checkedIn ? (
                      <button
                        type="button"
                        onClick={() => handleManualCheckIn(scanResult.registration!.id)}
                        disabled={isPendingAction}
                        className="btn btn-primary"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          border: "none",
                          boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
                        }}
                      >
                        {isPendingAction ? "Admitting..." : "🟢 ADMIT ATTENDEE"}
                      </button>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          color: "#10b981",
                          padding: "0.5rem",
                        }}
                      >
                        ✨ Attendee Successfully Admitted!
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ALREADY CHECKED IN - WARNING */}
                {scanResult.status === "ALREADY_CHECKED_IN" && scanResult.registration && (
                  <div
                    style={{
                      padding: "1.25rem",
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "rgba(245, 158, 11, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#f59e0b",
                          fontSize: "1.125rem",
                        }}
                      >
                        ⚠️
                      </div>
                      <div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fbbf24" }}>
                          ALREADY CHECKED IN
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          This ticket was already admitted previously!
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        padding: "1rem",
                        borderRadius: "var(--radius-md)",
                        marginBlock: "0.75rem",
                      }}
                    >
                      <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff" }}>
                        {scanResult.registration.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-text-muted)",
                          marginTop: "0.25rem",
                        }}
                      >
                        ✉️ {scanResult.registration.email}
                      </div>
                      {scanResult.checkedInAt && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#fbbf24",
                            marginTop: "0.5rem",
                            fontWeight: 600,
                          }}
                        >
                          Admitted At:{" "}
                          {new Date(scanResult.checkedInAt).toLocaleTimeString("en-LK", {
                            timeZone: "Asia/Colombo",
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                      <button
                        type="button"
                        onClick={() => handleUndoCheckIn(scanResult.registration!.id)}
                        disabled={isPendingAction}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: "0.75rem" }}
                      >
                        ↩️ Revert Check-in
                      </button>
                      <button
                        type="button"
                        onClick={resumeScanning}
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, fontSize: "0.75rem" }}
                      >
                        Scan Next
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. EVENT MISMATCH - ERROR */}
                {scanResult.status === "EVENT_MISMATCH" && (
                  <div
                    style={{
                      padding: "1.25rem",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div style={{ fontSize: "1.25rem" }}>🚫</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f87171" }}>
                        EVENT MISMATCH
                      </div>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {scanResult.message}
                    </p>
                    <button
                      type="button"
                      onClick={resumeScanning}
                      className="btn btn-ghost btn-sm"
                      style={{ width: "100%", marginTop: "1rem" }}
                    >
                      Scan Next
                    </button>
                  </div>
                )}

                {/* 4. INVALID TICKET - ERROR */}
                {scanResult.status === "INVALID" && (
                  <div
                    style={{
                      padding: "1.25rem",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div style={{ fontSize: "1.25rem" }}>❌</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f87171" }}>
                        INVALID TICKET
                      </div>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {scanResult.error || "Ticket code not recognized in system."}
                    </p>
                    <button
                      type="button"
                      onClick={resumeScanning}
                      className="btn btn-ghost btn-sm"
                      style={{ width: "100%", marginTop: "1rem" }}
                    >
                      Scan Next
                    </button>
                  </div>
                )}

                {/* Scanned Payload Reference */}
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--color-text-dim)",
                    marginTop: "0.75rem",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                >
                  Raw Scanned Code: <code>{extractTicketIdFromPayload(lastScannedPayload)}</code>
                </div>
              </div>
            )}
          </div>

          {/* Card: Live Admission Feed */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--color-text-muted)",
                }}
              >
                🕒 SESSION ACTIVITY LOG
              </h3>
              <span style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>
                {recentScans.length} Scans
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {recentScans.length === 0 ? (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-dim)",
                    textAlign: "center",
                    padding: "1rem",
                  }}
                >
                  No tickets scanned in this session yet.
                </div>
              ) : (
                recentScans.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.65rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <span>
                          {item.status === "admitted"
                            ? "🟢"
                            : item.status === "already"
                            ? "⚠️"
                            : "❌"}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>
                        {item.eventTitle} ·{" "}
                        {item.timestamp.toLocaleTimeString("en-LK", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </div>

                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700 }}>
                      <span
                        style={{
                          color:
                            item.status === "admitted"
                              ? "#34d399"
                              : item.status === "already"
                              ? "#fbbf24"
                              : "#f87171",
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
