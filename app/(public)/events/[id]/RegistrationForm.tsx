"use client";

import { useState, useEffect } from "react";
import { registerForEventAction } from "@/lib/actions/events";

interface RegistrationFormProps {
  eventId: string;
  eventName: string;
  isFull: boolean;
  eventDateStr: string;
  eventTimeStr: string;
  eventLocation: string;
  eventImageUrl: string;
}

export default function RegistrationForm({
  eventId,
  eventName,
  isFull,
  eventDateStr,
  eventTimeStr,
  eventLocation,
  eventImageUrl,
}: RegistrationFormProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [registrationId, setRegistrationId] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [eventImageDataUrl, setEventImageDataUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Convert event image to base64 Data URL to avoid CORS exceptions during Canvas rendering
  const fetchEventImage = async (imgUrl: string) => {
    if (!imgUrl) return;
    try {
      // Relative paths are local and don't need fetch CORS overrides
      if (imgUrl.startsWith("/")) {
        setEventImageDataUrl(imgUrl);
        return;
      }
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to load event image for canvas:", e);
    }
  };

  // Fetch QR Code from api.qrserver.com and convert to local data URL (CORS/taint-safe for Canvas)
  const fetchQrCode = async (regId: string) => {
    const size = "150x150";
    const color = "e2e8f0"; // text color
    const bgcolor = "050d1a"; // dark background matching ticket stub
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&color=${color}&bgcolor=${bgcolor}&data=${encodeURIComponent(regId)}`;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodeDataUrl(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to load QR code image:", e);
    }
  };

  const handleDownloadTicket = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const triggerDownload = () => {
      const link = document.createElement("a");
      link.download = `seds-ticket-${eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    const drawRemainingAndDownload = () => {
      // Stars particle field overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 360;
        const r = Math.random() * 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Cosmic glows
      const glow1 = ctx.createRadialGradient(150, 150, 10, 150, 150, 200);
      glow1.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      glow1.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, 800, 360);

      const glow2 = ctx.createRadialGradient(680, 240, 10, 680, 240, 180);
      glow2.addColorStop(0, "rgba(56, 189, 248, 0.12)");
      glow2.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, 800, 360);

      // Ticket outer border
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, 776, 336);

      // Perforation Line
      ctx.strokeStyle = "rgba(99, 102, 241, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(560, 12);
      ctx.lineTo(560, 348);
      ctx.stroke();
      ctx.setLineDash([]);

      // Header branding (Left)
      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("Students for the Exploration and Development of Space, USJ", 35, 48);

      // Event Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";

      // Text Wrap helper
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(" ");
        let line = "";
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + " ";
          let metrics = ctx.measureText(testLine);
          let testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + " ";
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currentY);
        return currentY;
      };

      const finalTitleY = wrapText(eventName, 35, 85, 490, 24);

      // Subtitle
      ctx.fillStyle = "rgba(226, 232, 240, 0.5)";
      ctx.font = "normal 11px sans-serif";
      ctx.fillText("BOARDING PASS • ADMIT ONE EXPLORER", 35, finalTitleY + 24);

      // Details Grid
      const gridY = finalTitleY + 48;

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("LAUNCH DATE", 35, gridY);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "normal 11px sans-serif";
      ctx.fillText(eventDateStr, 35, gridY + 18);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("LAUNCH WINDOW", 240, gridY);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "normal 11px sans-serif";
      ctx.fillText(eventTimeStr, 240, gridY + 18);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("LAUNCH PAD", 390, gridY);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "normal 11px sans-serif";
      ctx.fillText(eventLocation, 390, gridY + 18);

      ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(35, gridY + 32);
      ctx.lineTo(525, gridY + 32);
      ctx.stroke();

      // Passenger info
      const passY = gridY + 52;
      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("ATTENDEE", 35, passY);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(form.name, 35, passY + 18);

      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("COMMUNICATION CHANNEL", 240, passY);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "normal 11px sans-serif";
      ctx.fillText(form.email, 240, passY + 18);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("STATUS: CONFIRMED", 390, passY + 15);

      // Stub details
      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("BOARDING PASS", 585, 45);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      const truncatedTitle = eventName.length > 25 ? eventName.slice(0, 23) + "..." : eventName;
      ctx.fillText(truncatedTitle, 585, 75);

      ctx.fillStyle = "rgba(226, 232, 240, 0.5)";
      ctx.font = "normal 10px sans-serif";
      const truncatedName = form.name.length > 20 ? form.name.slice(0, 18) + "..." : form.name;
      ctx.fillText(truncatedName, 585, 95);

      ctx.fillStyle = "rgba(226, 232, 240, 0.4)";
      ctx.font = "9px monospace";
      ctx.fillText(`ID: ${registrationId.substring(0, 12).toUpperCase()}`, 585, 305);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("SLOT CONFIRMED", 585, 325);

      // Draw QR image
      if (qrCodeDataUrl) {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 600, 125, 100, 100);
          triggerDownload();
        };
        qrImg.src = qrCodeDataUrl;
      } else {
        triggerDownload();
      }
    };

    if (eventImageDataUrl) {
      const bgImg = new Image();
      bgImg.onload = () => {
        // Draw background gradient first so the empty/blank space is filled with dark theme
        const gradient = ctx.createLinearGradient(0, 0, 800, 360);
        gradient.addColorStop(0, "#0b1528");
        gradient.addColorStop(0.5, "#040b17");
        gradient.addColorStop(1, "#02050b");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 360);

        // Draw background image - left aligned, fit width (800px width, height proportional)
        const drawW = 800;
        const drawH = 800 * (bgImg.height / bgImg.width);
        ctx.drawImage(bgImg, 0, 0, drawW, drawH);

        // Draw transparent dark overlay to keep texts legible
        const overlayGrad = ctx.createLinearGradient(0, 0, 800, 360);
        overlayGrad.addColorStop(0, "rgba(9, 30, 58, 0.88)");
        overlayGrad.addColorStop(0.5, "rgba(5, 15, 26, 0.92)");
        overlayGrad.addColorStop(1, "rgba(2, 5, 11, 0.95)");
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, 800, 360);

        drawRemainingAndDownload();
      };
      bgImg.src = eventImageDataUrl;
    } else {
      // Draw default gradient background
      const gradient = ctx.createLinearGradient(0, 0, 800, 360);
      gradient.addColorStop(0, "#0b1528");
      gradient.addColorStop(0.5, "#040b17");
      gradient.addColorStop(1, "#02050b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 360);

      drawRemainingAndDownload();
    }
  };

  const handlePrintTicket = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const printableHtml = `
      <div class="t-main">
        <div class="t-header">
          <span class="t-org">🚀 Students for the Exploration and Development of Space, USJ</span>
          <span class="t-badge">CONFIRMED</span>
        </div>
        <h3 class="t-title">${eventName}</h3>
        
        <div class="t-grid">
          <div class="t-item"><span class="t-label">ATTENDEE</span><span class="t-val">${form.name}</span></div>
          <div class="t-item"><span class="t-label">EMAIL ADDRESS</span><span class="t-val">${form.email}</span></div>
          <div class="t-item"><span class="t-label">REGISTRATION NO</span><span class="t-val">${registrationId.substring(0, 10).toUpperCase()}</span></div>
          <div class="t-item"><span class="t-label">LAUNCH DATE</span><span class="t-val">${eventDateStr}</span></div>
          <div class="t-item"><span class="t-label">LAUNCH WINDOW</span><span class="t-val">${eventTimeStr}</span></div>
          <div class="t-item"><span class="t-label">LAUNCH PAD (VENUE)</span><span class="t-val">${eventLocation}</span></div>
        </div>
      </div>
      <div class="t-perf"></div>
      <div class="t-stub">
        <div>
          <div class="stub-title">${eventName.length > 25 ? eventName.slice(0, 23) + "..." : eventName}</div>
          <div>
            <span class="stub-label">PASSENGER</span>
            <div class="stub-val">${form.name}</div>
          </div>
        </div>
        <div>
          <div class="stub-qrcode-container">
            ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width: 80px; height: 80px; border-radius: 4px;" />` : `<div style="font-size: 8px;">QR NOT LOADED</div>`}
          </div>
          <div class="stub-footer">
            <div>
              <span class="stub-label">TICKET ID</span>
              <div class="stub-val" style="font-family: monospace;">${registrationId.substring(0, 12).toUpperCase()}</div>
            </div>
            <div>
              <span class="stub-label">ENTRY STATUS</span>
              <div class="stub-val" style="color: #10b981; font-weight: bold;">APPROVED</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const printStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Space+Grotesk:wght@400;600;700&display=swap');
      body {
        background: #030712;
        color: #e2e8f0;
        font-family: 'Space Grotesk', sans-serif;
        padding: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .t-card {
        width: 800px;
        background: ${
          eventImageUrl
            ? `linear-gradient(135deg, rgba(9, 30, 58, 0.88) 0%, rgba(5, 15, 26, 0.92) 100%), url(${eventImageUrl}) no-repeat left top/100% auto, linear-gradient(135deg, #091e3a 0%, #050d1a 50%, #02060c 100%)`
            : "linear-gradient(135deg, #091e3a 0%, #050d1a 50%, #02060c 100%)"
        };
        border: 2px solid rgba(56, 189, 248, 0.25);
        border-radius: 12px;
        padding: 24px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        position: relative;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      }
      .t-main {
        width: 70%;
        padding-right: 24px;
      }
      .t-perf {
        width: 1px;
        border-left: 2px dashed rgba(99, 102, 241, 0.25);
        margin: 0 12px;
      }
      .t-stub {
        width: 30%;
        padding-left: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .t-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .t-org {
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        font-weight: bold;
        color: #6366f1;
        letter-spacing: 1px;
      }
      .t-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      .t-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 18px;
        font-weight: bold;
        color: #ffffff;
        margin: 0 0 20px 0;
      }
      .t-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }
      .t-item {
        display: flex;
        flex-direction: column;
      }
      .t-label {
        font-family: 'Orbitron', sans-serif;
        font-size: 8px;
        color: #38bdf8;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .t-val {
        font-size: 11px;
        color: #e2e8f0;
        font-weight: 500;
      }
      .stub-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        font-weight: bold;
        color: #ffffff;
        margin-bottom: 8px;
      }
      .stub-label {
        font-family: 'Orbitron', sans-serif;
        font-size: 8px;
        color: #6366f1;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .stub-val {
        font-size: 10px;
        color: #e2e8f0;
        margin-bottom: 12px;
      }
      .stub-qrcode-container {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        height: 80px;
        margin-bottom: 16px;
      }
      .stub-footer {
        display: flex;
        justify-content: space-between;
      }
      @media print {
        body { background: #030712 !important; color: #e2e8f0 !important; padding: 0; }
        .t-card { border-color: rgba(56, 189, 248, 0.25) !important; box-shadow: none; }
        .t-title { color: #ffffff !important; }
        .t-val, .stub-val { color: #e2e8f0 !important; }
      }
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>SEDS Ticket - ${eventName}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="t-card">
            ${printableHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Run QR Code loading & image loading on success trigger
  useEffect(() => {
    if (status === "success" && registrationId) {
      fetchQrCode(registrationId);
      if (eventImageUrl) {
        fetchEventImage(eventImageUrl);
      }
    }
  }, [status, registrationId, eventImageUrl]);

  // Auto-download ticket once QR code and event image data URL loads
  useEffect(() => {
    // Only auto-download if we have the QR Code loaded, and if there is a background image, that it is loaded too
    if (status === "success" && qrCodeDataUrl && (!eventImageUrl || eventImageDataUrl)) {
      const timer = setTimeout(() => {
        try {
          handleDownloadTicket();
        } catch (e) {
          console.error("Auto ticket generation failed:", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, qrCodeDataUrl, eventImageDataUrl, eventImageUrl]);

  const ticketBgStyle = eventImageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(9, 30, 58, 0.88) 0%, rgba(5, 15, 26, 0.92) 100%), url(${eventImageUrl})`,
        backgroundSize: "100% auto",
        backgroundPosition: "left top",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#02060c",
      }
    : {
        background: "linear-gradient(135deg, #091e3a 0%, #050d1a 50%, #02060c 100%)",
      };

  if (isFull) {
    return (
      <div className="card" style={{ border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.02)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "#fca5a5", marginBottom: "0.5rem" }}>
          Registration Closed
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
          We have reached maximum capacity for this event. Stay tuned for future editions!
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await registerForEventAction(eventId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      });

      if (res.success) {
        setRegistrationId(res.registrationId || "reg_" + Math.random().toString(36).substr(2, 9));
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(res.error || "Failed to register. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("An unexpected error occurred. Please verify your connection.");
    }
  }

  return (
    <div style={{ position: "relative" }}>
      {status === "success" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}>
          
          {/* Futuristic Ticket Component */}
          <div className="ticket-card" id="seds-live-ticket" style={ticketBgStyle}>
            
            {/* Main Section (70%) */}
            <div className="ticket-main">
              <div className="ticket-header">
                <span className="ticket-organizer">🚀 Students for the Exploration and Development of Space, USJ</span>
                <span className="ticket-badge badge-confirmed">CONFIRMED</span>
              </div>
              <h3 className="ticket-title">{eventName}</h3>
              
              <div className="ticket-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">ATTENDEE</span>
                  <span className="meta-value">{form.name}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">EMAIL ADDRESS</span>
                  <span className="meta-value" style={{ wordBreak: "break-all" }}>{form.email}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">REGISTRATION NO</span>
                  <span className="meta-value">{registrationId.substring(0, 10).toUpperCase()}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">LAUNCH DATE</span>
                  <span className="meta-value">{eventDateStr}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">LAUNCH WINDOW</span>
                  <span className="meta-value">{eventTimeStr}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">LAUNCH PAD (VENUE)</span>
                  <span className="meta-value">{eventLocation}</span>
                </div>
              </div>
            </div>

            {/* Perforation dashed separator */}
            <div className="ticket-perforation"></div>

            {/* Ticket Stub (30%) */}
            <div className="ticket-stub">
              <div>
                <div className="stub-title">{eventName.length > 25 ? eventName.slice(0, 23) + "..." : eventName}</div>
                <div>
                  <span className="stub-label">PASSENGER</span>
                  <div className="stub-value">{form.name}</div>
                </div>
              </div>
              
              <div>
                <div className="stub-qrcode">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QR Code" style={{ width: 85, height: 85, borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.2)" }} />
                  ) : (
                    <div style={{ width: 85, height: 85, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "var(--color-text-dim)", borderRadius: "6px", border: "1px dashed rgba(56,189,248,0.1)" }}>
                      GEN QR...
                    </div>
                  )}
                </div>
                
                <div className="stub-footer">
                  <div>
                    <span className="stub-label">TICKET ID</span>
                    <div className="stub-value" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      {registrationId.substring(0, 12).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className="stub-label">ENTRY STATUS</span>
                    <div className="stub-value-green">APPROVED</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Action buttons list */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
            <button onClick={handleDownloadTicket} className="btn btn-primary" style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
              📥 Download PNG
            </button>
            <button onClick={handlePrintTicket} className="btn btn-primary" style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
              📄 Download PDF
            </button>
            <button onClick={handlePrintTicket} className="btn btn-secondary" style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
              🖨️ Print Pass
            </button>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            .ticket-card {
              position: relative;
              width: 100%;
              max-width: 800px;
              border: 1px solid rgba(56, 189, 248, 0.2);
              border-radius: 16px;
              padding: 24px;
              display: flex;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
              transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
              overflow: hidden;
              backdrop-filter: blur(8px);
            }
            .ticket-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 12px 40px rgba(56, 189, 248, 0.25);
              border-color: rgba(56, 189, 248, 0.4);
            }
            .ticket-card::before {
              content: "";
              position: absolute;
              inset: 0;
              background-image: 
                radial-gradient(1.5px 1.5px at 20px 30px, #fff, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 80px 140px, #fff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 140px 60px, #fff, rgba(0,0,0,0)),
                radial-gradient(2px 2px at 250px 180px, #fff, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 380px 40px, #fff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 450px 150px, #fff, rgba(0,0,0,0)),
                radial-gradient(2px 2px at 580px 80px, #fff, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 690px 160px, #fff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 750px 50px, #fff, rgba(0,0,0,0));
              background-repeat: repeat;
              background-size: 600px 200px;
              opacity: 0.25;
              pointer-events: none;
            }
            .ticket-main {
              width: 70%;
              padding-right: 24px;
              display: flex;
              flex-direction: column;
            }
            .ticket-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            .ticket-organizer {
              font-family: var(--font-display);
              font-size: 10px;
              font-weight: bold;
              color: var(--color-cosmic);
              letter-spacing: 1px;
            }
            .ticket-badge {
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 9px;
              font-weight: bold;
              letter-spacing: 0.5px;
            }
            .badge-confirmed {
              background: rgba(16, 185, 129, 0.1);
              color: var(--color-aurora);
              border: 1px solid rgba(16, 185, 129, 0.25);
              box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
            }
            .ticket-title {
              font-family: var(--font-display);
              font-size: 1.15rem;
              font-weight: 800;
              color: #ffffff;
              margin-bottom: 20px;
              line-height: 1.25;
            }
            .ticket-meta-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-family: var(--font-display);
              font-size: 8px;
              color: var(--color-stellar);
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .meta-value {
              font-size: 11px;
              color: var(--color-text);
              font-weight: 500;
            }
            .ticket-perforation {
              width: 1px;
              border-left: 2px dashed rgba(99, 102, 241, 0.2);
              margin: 0 12px;
            }
            .ticket-stub {
              width: 30%;
              padding-left: 24px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .stub-title {
              font-family: var(--font-display);
              font-size: 11px;
              font-weight: bold;
              color: #ffffff;
              margin-bottom: 12px;
              line-height: 1.3;
            }
            .stub-label {
              font-family: var(--font-display);
              font-size: 8px;
              color: var(--color-cosmic);
              letter-spacing: 0.5px;
              margin-bottom: 4px;
              display: block;
            }
            .stub-value {
              font-size: 10px;
              color: var(--color-text);
              font-weight: 600;
              margin-bottom: 12px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .stub-value-green {
              font-size: 10px;
              color: var(--color-aurora);
              font-weight: bold;
              text-shadow: 0 0 5px rgba(16, 185, 129, 0.2);
            }
            .stub-qrcode {
              margin-bottom: 16px;
              display: flex;
              justify-content: flex-start;
              align-items: center;
              height: 90px;
            }
            .stub-footer {
              display: flex;
              justify-content: space-between;
              gap: 8px;
            }
            
            @media (max-width: 768px) {
              .ticket-card {
                flex-direction: column;
                max-width: 450px;
              }
              .ticket-main {
                width: 100%;
                padding-right: 0;
              }
              .ticket-perforation {
                width: 100%;
                height: 1px;
                border-left: none;
                border-top: 2px dashed rgba(99, 102, 241, 0.2);
                margin: 16px 0;
              }
              .ticket-stub {
                width: 100%;
                padding-left: 0;
                gap: 16px;
              }
              .ticket-meta-grid {
                grid-template-columns: 1fr 1fr;
              }
            }
          ` }} />

        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, letterSpacing: "0.03em", marginBottom: "0.25rem" }}>
                Secure Your Slot
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                Complete the form below to register for this event.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Your Full Name *</label>
              <input
                id="reg-name"
                type="text"
                className="form-input"
                placeholder="e.g. Amal Perera"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={status === "loading"}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="e.g. amal@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={status === "loading"}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number (Optional)</label>
              <input
                id="reg-phone"
                type="tel"
                className="form-input"
                placeholder="e.g. 0771234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={status === "loading"}
              />
            </div>

            {status === "error" && (
              <div style={{
                padding: "0.75rem 1rem",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "var(--radius-md)",
                color: "#fca5a5",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === "loading"}
              style={{
                width: "100%",
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {status === "loading" ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Securing Seat...
                </>
              ) : (
                "🚀 Register Now"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
