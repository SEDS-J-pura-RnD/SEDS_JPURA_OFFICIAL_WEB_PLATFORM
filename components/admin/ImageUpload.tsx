"use client";

import { useState, useRef, useEffect } from "react";
import { uploadFile } from "@/lib/upload";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  disabled?: boolean;
  aspectRatio?: number; // Configurable crop aspect ratio (e.g. 16/9 or 1)
}

export default function ImageUpload({
  label,
  value,
  onChange,
  bucket = "seds-jp-web-storage",
  disabled = false,
  aspectRatio = 1,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop & Edit States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [srcImage, setSrcImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState("");
  const [activeAspectRatio, setActiveAspectRatio] = useState<number>(aspectRatio);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setActiveAspectRatio(aspectRatio);
  }, [aspectRatio]);

  // Crop box bounding box math (fits nicely within 320x220 viewport)
  const maxCropDim = 300;
  let cropWidth = maxCropDim;
  let cropHeight = maxCropDim;
  if (activeAspectRatio > 1) {
    cropHeight = maxCropDim / activeAspectRatio;
  } else if (activeAspectRatio < 1) {
    cropWidth = maxCropDim * activeAspectRatio;
  }

  // baseScale is the minimum scale required to cover the crop container completely
  const baseScale = imageSize.width && imageSize.height
    ? Math.max(cropWidth / imageSize.width, cropHeight / imageSize.height)
    : 1;

  // Calculates dragging boundaries to ensure the image does not leave transparent gaps in the crop area
  const getConstrainedOffset = (x: number, y: number, z: number) => {
    const totalScale = baseScale * z;
    const rw = imageSize.width * totalScale;
    const rh = imageSize.height * totalScale;
    const limitX = Math.max(0, (rw - cropWidth) / 2);
    const limitY = Math.max(0, (rh - cropHeight) / 2);
    return {
      x: Math.min(limitX, Math.max(-limitX, x)),
      y: Math.min(limitY, Math.max(-limitY, y)),
    };
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setOffset(getConstrainedOffset(offset.x, offset.y, newZoom));
  };

  // Drag listeners for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffset(getConstrainedOffset(newX, newY, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Pan Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    setOffset(getConstrainedOffset(newX, newY, zoom));
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const openCropModal = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File type is unsupported. Must be a valid image format.");
      return;
    }
    setError("");
    setRawFile(file);
    setOriginalFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSrcImage(event.target?.result as string);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openCropModal(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      openCropModal(file);
    }
  };

  /**
   * Upload the original image file directly without any cropping or compression.
   */
  const handleUploadOriginal = async () => {
    if (!rawFile) return;

    setCropModalOpen(false);
    setUploading(true);
    setError("");

    try {
      const publicUrl = await uploadFile(rawFile, bucket);
      onChange(publicUrl);
    } catch (err: any) {
      console.error("Direct upload error:", err);
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Apply crop and export as a high-definition WebP file.
   */
  const handleApplyCrop = async () => {
    if (!srcImage || !imageSize.width || !imageSize.height) return;

    setCropModalOpen(false);
    setUploading(true);
    setError("");

    try {
      const img = new Image();
      img.src = srcImage;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      // Output dimensions (1280px width for crystal clear, high-resolution rendering)
      const outputWidth = activeAspectRatio >= 1 ? 1280 : 800;
      const outputHeight = Math.round(outputWidth / activeAspectRatio);
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not retrieve canvas 2D context.");
      }

      // Map scale and offset coordinates from the view boundary back to the original source image
      const totalScale = baseScale * zoom;
      const renderedWidth = imageSize.width * totalScale;
      const renderedHeight = imageSize.height * totalScale;

      const imageLeft = (cropWidth - renderedWidth) / 2 + offset.x;
      const imageTop = (cropHeight - renderedHeight) / 2 + offset.y;

      const sourceX = -imageLeft / totalScale;
      const sourceY = -imageTop / totalScale;
      const sourceW = cropWidth / totalScale;
      const sourceH = cropHeight / totalScale;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setError("Failed to export cropped image to WebP.");
            setUploading(false);
            return;
          }

          try {
            if (blob.size > 10 * 1024 * 1024) {
              throw new Error("Cropped output exceeds 10MB size limit.");
            }

            const cleanName = originalFileName.replace(/\.[^/.]+$/, "") + ".webp";
            const webpFile = new File([blob], cleanName, { type: "image/webp" });

            const publicUrl = await uploadFile(webpFile, bucket);
            onChange(publicUrl);
          } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.message || "Failed to upload cropped image.");
          } finally {
            setUploading(false);
          }
        },
        "image/webp",
        0.88
      );
    } catch (err: any) {
      console.error("Crop processing error:", err);
      setError(err.message || "Failed to process image cropping.");
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: "1rem" }}>
      <style>{`
        @keyframes upload-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .crop-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 7, 18, 0.88);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .crop-card {
          width: 100%;
          max-width: 480px;
          background: #0b0f19;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          box-shadow: 0 0 32px rgba(99, 102, 241, 0.2);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        .crop-window {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: #05070c;
          border: 2px solid rgba(255, 255, 255, 0.15);
          cursor: grab;
          user-select: none;
        }
        .crop-window:active {
          cursor: grabbing;
        }
      `}</style>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className="btn"
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.725rem",
              background: mode === "upload" ? "var(--color-border-bright)" : "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: mode === "upload" ? "white" : "var(--color-text-muted)"
            }}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className="btn"
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.725rem",
              background: mode === "url" ? "var(--color-border-bright)" : "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: mode === "url" ? "white" : "var(--color-text-muted)"
            }}
          >
            Direct URL
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <input
          type="url"
          className="form-input"
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || uploading}
        />
      ) : (
        <div>
          {value ? (
            /* Uploaded Preview State */
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "50px",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "var(--color-space)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <img
                  src={value}
                  alt="Uploaded preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-stellar)", fontWeight: 600, wordBreak: "break-all" }}>
                  Uploaded to orbit
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {value}
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: "0.375rem", padding: "0.2rem 0.4rem", fontSize: "0.7rem" }}
                  disabled={disabled || uploading}
                >
                  Remove File
                </button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone Area */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem 1rem",
                border: isDragOver ? "2px dashed var(--color-stellar)" : "2px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: isDragOver ? "rgba(56, 189, 248, 0.05)" : "rgba(255, 255, 255, 0.01)",
                cursor: disabled || uploading ? "not-allowed" : "pointer",
                transition: "all var(--transition-fast)",
                textAlign: "center"
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
                disabled={disabled || uploading}
              />
              {uploading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "22px",
                    height: "22px",
                    border: "2.5px solid rgba(255,255,255,0.1)",
                    borderTop: "2.5px solid var(--color-stellar)",
                    borderRadius: "50%",
                    animation: "upload-spin 1s linear infinite"
                  }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Uploading to orbit...</span>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: "1.35rem", marginBottom: "0.375rem" }}>🛰️</span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
                    {isDragOver ? "Release to launch file!" : "Drag & drop image, or click to browse"}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "var(--color-text-dim)", marginTop: "0.2rem" }}>
                    PNG, JPG, WebP up to 10MB
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: "0.5rem",
          padding: "0.5rem 0.75rem",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-sm)",
          color: "#fca5a5",
          fontSize: "0.725rem"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Interactive Crop & Frame Modal */}
      {cropModalOpen && srcImage && (
        <div className="crop-backdrop">
          <div className="crop-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 800, color: "white", margin: 0 }}>
                📐 Frame & Crop Image
              </h3>
              {/* Aspect Ratio Presets */}
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAspectRatio(16 / 9);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className="btn"
                  style={{
                    padding: "0.15rem 0.45rem",
                    fontSize: "0.7rem",
                    background: activeAspectRatio === 16 / 9 ? "var(--color-stellar)" : "rgba(255,255,255,0.06)",
                    color: activeAspectRatio === 16 / 9 ? "#05070c" : "var(--color-text-muted)",
                    fontWeight: activeAspectRatio === 16 / 9 ? 700 : 500,
                    borderRadius: "4px"
                  }}
                >
                  16:9
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAspectRatio(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className="btn"
                  style={{
                    padding: "0.15rem 0.45rem",
                    fontSize: "0.7rem",
                    background: activeAspectRatio === 1 ? "var(--color-stellar)" : "rgba(255,255,255,0.06)",
                    color: activeAspectRatio === 1 ? "#05070c" : "var(--color-text-muted)",
                    fontWeight: activeAspectRatio === 1 ? 700 : 500,
                    borderRadius: "4px"
                  }}
                >
                  1:1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAspectRatio(4 / 3);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className="btn"
                  style={{
                    padding: "0.15rem 0.45rem",
                    fontSize: "0.7rem",
                    background: activeAspectRatio === 4 / 3 ? "var(--color-stellar)" : "rgba(255,255,255,0.06)",
                    color: activeAspectRatio === 4 / 3 ? "#05070c" : "var(--color-text-muted)",
                    fontWeight: activeAspectRatio === 4 / 3 ? 700 : 500,
                    borderRadius: "4px"
                  }}
                >
                  4:3
                </button>
              </div>
            </div>

            <p style={{ fontSize: "0.725rem", color: "var(--color-text-dim)", marginBottom: "0.75rem", marginTop: 0 }}>
              Drag to reposition, zoom to frame, or click <strong>Upload Original</strong> to skip cropping.
            </p>

            {/* Crop Box Viewport */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "#05070c", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.06)", minHeight: "220px" }}>
              <div
                className="crop-window"
                style={{
                  width: `${cropWidth}px`,
                  height: `${cropHeight}px`,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  ref={imgRef}
                  src={srcImage}
                  alt="Cropping viewport"
                  onLoad={handleImageLoad}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                    width: `${imageSize.width * baseScale * zoom}px`,
                    height: `${imageSize.height * baseScale * zoom}px`,
                    maxWidth: "none",
                    maxHeight: "none",
                    pointerEvents: "none",
                  }}
                />
                
                {/* Visual crop border overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                  border: "1px solid var(--color-stellar)",
                  pointerEvents: "none",
                }} />
              </div>
            </div>

            {/* Zoom Slider Controls */}
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                <span>Zoom Level</span>
                <span>{(zoom * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "var(--color-stellar)",
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", justifyContent: "space-between", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: "0.775rem" }}
              >
                Cancel
              </button>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleUploadOriginal}
                  className="btn"
                  title="Upload the image directly in its original resolution and aspect ratio"
                  style={{
                    fontSize: "0.775rem",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid var(--color-border)",
                    color: "white"
                  }}
                >
                  Upload Original ✨
                </button>

                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.775rem" }}
                >
                  Apply Crop ✂️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
