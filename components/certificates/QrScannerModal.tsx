"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { extractHashFromQrPayload } from "@/lib/certificate-url";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHashDetected: (hash: string) => void;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  onHashDetected,
}: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Handle successful detection
  const handleQrFound = useCallback(
    (payload: string) => {
      const hash = extractHashFromQrPayload(payload);
      if (hash) {
        stopCamera();
        onHashDetected(hash);
        onClose();
      } else {
        setCameraError(
          "QR code detected, but it does not contain a valid SEDS certificate hash."
        );
      }
    },
    [onHashDetected, onClose, stopCamera]
  );

  // Continuous frame analysis
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      const hash = extractHashFromQrPayload(code.data);
      if (hash) {
        handleQrFound(code.data);
        return;
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleQrFound]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported by your browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access or upload an image instead.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device found on this system. You can upload a QR image below.");
      } else {
        setCameraError(err.message || "Unable to start camera preview.");
      }
    }
  }, [stopCamera, scanFrame]);

  // Handle uploaded QR code image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setUploadError("Could not process image on canvas.");
          setIsProcessing(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessing(false);

        if (code && code.data) {
          const hash = extractHashFromQrPayload(code.data);
          if (hash) {
            onHashDetected(hash);
            onClose();
          } else {
            setUploadError("QR code detected, but it does not contain a valid SEDS certificate signature.");
          }
        } else {
          setUploadError("No QR code found in this image. Please ensure the QR code is clearly visible and well-lit.");
        }
      };
      img.onerror = () => {
        setUploadError("Failed to read image file.");
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen && activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(3, 7, 18, 0.9)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <style>{`
        @keyframes laser-scan {
          0% { top: 10%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.8; }
        }
        .scanner-laser {
          position: absolute;
          left: 5%;
          right: 5%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent);
          box-shadow: 0 0 12px #38bdf8;
          animation: laser-scan 2.4s ease-in-out infinite;
        }
        .scan-target-box {
          position: absolute;
          width: 220px;
          height: 220px;
          border: 2px solid rgba(56, 189, 248, 0.6);
          border-radius: 12px;
          box-shadow: 0 0 0 9999px rgba(3, 7, 18, 0.55);
          pointer-events: none;
        }
        .scan-corner {
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: #38bdf8;
          border-style: solid;
        }
        .corner-tl { top: -2px; left: -2px; border-width: 3px 0 0 3px; border-top-left-radius: 10px; }
        .corner-tr { top: -2px; right: -2px; border-width: 3px 3px 0 0; border-top-right-radius: 10px; }
        .corner-bl { bottom: -2px; left: -2px; border-width: 0 0 3px 3px; border-bottom-left-radius: 10px; }
        .corner-br { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; border-bottom-right-radius: 10px; }
      `}</style>

      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#080c16",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 0 32px rgba(56, 189, 248, 0.15)",
          borderRadius: "16px",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.25rem" }}>📷</span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, margin: 0, color: "white" }}>
              Scan Certificate QR
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="btn btn-ghost btn-sm"
            style={{ padding: "0.25rem 0.5rem", fontSize: "1rem", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255, 255, 255, 0.03)", padding: "0.25rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            style={{
              flex: 1,
              padding: "0.4rem 0.75rem",
              fontSize: "0.775rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "camera" ? "var(--color-stellar)" : "transparent",
              color: activeTab === "camera" ? "#05070c" : "var(--color-text-muted)",
              transition: "all var(--transition-fast)",
            }}
          >
            Live Camera
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("upload");
            }}
            style={{
              flex: 1,
              padding: "0.4rem 0.75rem",
              fontSize: "0.775rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "upload" ? "var(--color-stellar)" : "transparent",
              color: activeTab === "upload" ? "#05070c" : "var(--color-text-muted)",
              transition: "all var(--transition-fast)",
            }}
          >
            Upload QR Image
          </button>
        </div>

        {/* Camera View */}
        {activeTab === "camera" && (
          <div>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "280px",
                background: "#020408",
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <video
                ref={videoRef}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                muted
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Viewfinder Target */}
              {!cameraError && (
                <div className="scan-target-box">
                  <div className="scan-corner corner-tl" />
                  <div className="scan-corner corner-tr" />
                  <div className="scan-corner corner-bl" />
                  <div className="scan-corner corner-br" />
                  <div className="scanner-laser" />
                </div>
              )}

              {/* Camera Error Display */}
              {cameraError && (
                <div style={{ padding: "1.5rem", textAlign: "center", maxWidth: "320px", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷🚫</div>
                  <p style={{ color: "#fca5a5", marginBottom: "1rem" }}>{cameraError}</p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="btn btn-secondary btn-sm"
                  >
                    Upload QR Image Instead
                  </button>
                </div>
              )}
            </div>

            <p style={{ fontSize: "0.725rem", color: "var(--color-text-dim)", textAlign: "center", marginTop: "0.75rem", marginBottom: 0 }}>
              Align the certificate QR code inside the frame. The cryptographic signature will verify automatically.
            </p>
          </div>
        )}

        {/* File Upload View */}
        {activeTab === "upload" && (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2.5rem 1.5rem",
                border: "2px dashed var(--color-border)",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.02)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all var(--transition-fast)",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🖼️</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "white" }}>
                Click to browse certificate image
              </span>
              <span style={{ fontSize: "0.725rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
                Supports PNG, JPG, WebP, or certificate screenshots
              </span>
            </div>

            {isProcessing && (
              <div style={{ marginTop: "0.75rem", textAlign: "center", color: "var(--color-stellar)", fontSize: "0.75rem" }}>
                ⚡ Analyzing image for cryptographic QR payload...
              </div>
            )}

            {uploadError && (
              <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#fca5a5", fontSize: "0.75rem" }}>
                ⚠️ {uploadError}
              </div>
            )}
          </div>
        )}

        {/* Footer info badge */}
        <div style={{ fontSize: "0.6875rem", color: "var(--color-text-dim)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
          🔒 Domain-Agnostic Extraction: extracts raw SHA-256 cryptographic signature directly from the QR pattern.
        </div>
      </div>
    </div>
  );
}
